import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { sendWinnerEmail, sendLoserEmail } from "@/lib/email";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const quoteId = params.id;

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userCompanyId = (session.user as any).companyId;
  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (!["ACCEPT", "REJECT"].includes(action)) {
    return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
  }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { rfq: true },
  });

  if (!quote) return NextResponse.json({ error: "Quote tidak ditemukan" }, { status: 404 });

  const isOwner = quote.rfq.buyerCompanyId === userCompanyId;

  // KUNCI KEAMANAN: HANYA OWNER (Pemilik RFQ) YANG BOLEH PROSES
  if (!isOwner) {
    return NextResponse.json({ error: "Hanya pemilik RFQ yang dapat memproses penawaran ini." }, { status: 403 });
  }

  if (!["OPEN", "QUOTING"].includes(quote.rfq.status)) return NextResponse.json({ error: "RFQ sudah ditutup." }, { status: 409 });
  if (["ACCEPTED", "REJECTED"].includes(quote.status)) return NextResponse.json({ error: "Quote sudah diproses." }, { status: 409 });

  try {
    if (action === "ACCEPT") {
      const now = new Date();

      const [winnerUser, loserQuotes] = await Promise.all([
        prisma.user.findFirst({ where: { companyId: quote.supplierCompanyId }, select: { email: true, name: true } }),
        prisma.quote.findMany({ where: { rfqId: quote.rfqId, id: { not: quoteId }, status: { notIn: ["ACCEPTED", "REJECTED"] } }, include: { createdBy: { select: { email: true, name: true } } } }),
      ]);

      await prisma.$transaction(async (tx) => {
        await tx.quote.update({ where: { id: quoteId }, data: { status: "ACCEPTED" } });
        await tx.quote.updateMany({ where: { rfqId: quote.rfqId, id: { not: quoteId }, status: { notIn: ["ACCEPTED", "REJECTED"] } }, data: { status: "REJECTED" } });
        await tx.rfq.update({ where: { id: quote.rfqId }, data: { status: "CLOSED", closedAt: now } });
        await tx.auditLog.create({
          data: { actorId: (session.user as any).id, action: "quote.accept", entity: "Quote", entityId: quoteId, metadata: { rfqId: quote.rfqId, supplierCompanyId: quote.supplierCompanyId, acceptedBy: "owner" } },
        });
      });

      if (winnerUser?.email) {
        await sendWinnerEmail(winnerUser.email, winnerUser.name || "Supplier", quote.rfq.title, quote.unitPrice, quote.totalPrice, quote.rfqId).catch(err => console.error("Winner email failed:", err));
      }
      for (const loser of loserQuotes) {
        if (loser.createdBy?.email) {
          await sendLoserEmail(loser.createdBy.email, loser.createdBy.name || "Supplier", quote.rfq.title, quote.rfqId).catch(err => console.error("Loser email failed:", err));
        }
      }

      return NextResponse.json({ success: true, message: "Penawaran diterima. RFQ ditutup. Email notifikasi terkirim." });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.quote.update({ where: { id: quoteId }, data: { status: "REJECTED" } });
        await tx.auditLog.create({ data: { actorId: (session.user as any).id, action: "quote.reject", entity: "Quote", entityId: quoteId, metadata: { rfqId: quote.rfqId, supplierCompanyId: quote.supplierCompanyId } } });
      });
      return NextResponse.json({ success: true, message: "Penawaran ditolak." });
    }
  } catch (error) {
    console.error("Update quote error:", error);
    return NextResponse.json({ error: "Gagal memproses penawaran." }, { status: 500 });
  }
}