import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  if (!isOwner) {
    return NextResponse.json({ error: "Hanya pemilik RFQ yang dapat memproses penawaran ini." }, { status: 403 });
  }

  if (!["OPEN", "QUOTING"].includes(quote.rfq.status)) return NextResponse.json({ error: "RFQ sudah ditutup." }, { status: 409 });
  if (["ACCEPTED", "REJECTED"].includes(quote.status)) return NextResponse.json({ error: "Quote sudah diproses." }, { status: 409 });

  try {
    if (action === "ACCEPT") {
      const now = new Date();

      const [winnerCompany, loserQuotes, buyerCompany] = await Promise.all([
        prisma.company.findUnique({ where: { id: quote.supplierCompanyId }, select: { name: true } }),
        prisma.quote.findMany({ where: { rfqId: quote.rfqId, id: { not: quoteId }, status: { notIn: ["ACCEPTED", "REJECTED"] } }, include: { supplierCompany: { select: { id: true } } } }),
        prisma.company.findUnique({ where: { id: quote.rfq.buyerCompanyId }, select: { name: true } }),
      ]);

      await prisma.$transaction(async (tx) => {
        // Update status quote dan RFQ
        await tx.quote.update({ where: { id: quoteId }, data: { status: "ACCEPTED" } });
        await tx.quote.updateMany({ where: { rfqId: quote.rfqId, id: { not: quoteId }, status: { notIn: ["ACCEPTED", "REJECTED"] } }, data: { status: "REJECTED" } });
        await tx.rfq.update({ where: { id: quote.rfqId }, data: { status: "CLOSED", closedAt: now } });
        
        // Audit log
        await tx.auditLog.create({
          data: { actorId: (session.user as any).id, action: "quote.accept", entity: "Quote", entityId: quoteId, metadata: { rfqId: quote.rfqId, supplierCompanyId: quote.supplierCompanyId, acceptedBy: "owner" } },
        });

        // --- KIRIM PESAN KE PEMENANG ---
        // 1. Cari atau buat conversation antara buyer dan supplier pemenang
        let conversation = await tx.conversation.findFirst({
          where: {
            OR: [
              { buyerCompanyId: quote.rfq.buyerCompanyId, supplierCompanyId: quote.supplierCompanyId },
              { buyerCompanyId: quote.supplierCompanyId, supplierCompanyId: quote.rfq.buyerCompanyId }
            ]
          }
        });

        if (!conversation) {
          conversation = await tx.conversation.create({
            data: {
              buyerCompanyId: quote.rfq.buyerCompanyId,
              supplierCompanyId: quote.supplierCompanyId,
            }
          });
        }

        // 2. Kirim pesan kemenangan
        const winnerMessage = `🏆 SELAMAT! Penawaran Anda untuk RFQ "${quote.rfq.title}" telah DITERIMA sebagai pemenang.\n\nHarga Disetujui: Rp ${quote.unitPrice.toLocaleString("id-ID")}\nTotal: Rp ${quote.totalPrice.toLocaleString("id-ID")}\n\nSilakan hubungi saya untuk konfirmasi PO dan pengiriman.`;
        
        await tx.message.create({
          data: {
            conversationId: conversation.id,
            senderId: (session.user as any).id,
            senderName: `${buyerCompany?.name || "Buyer"} (Pemenang RFQ)`,
            content: winnerMessage,
          }
        });

        // --- KIRIM PESAN KE PESERTA YANG KALAH (OPSIONAL) ---
        for (const loser of loserQuotes) {
          let loserConv = await tx.conversation.findFirst({
            where: {
              OR: [
                { buyerCompanyId: quote.rfq.buyerCompanyId, supplierCompanyId: loser.supplierCompanyId },
                { buyerCompanyId: loser.supplierCompanyId, supplierCompanyId: quote.rfq.buyerCompanyId }
              ]
            }
          });

          if (!loserConv) {
            loserConv = await tx.conversation.create({
              data: { buyerCompanyId: quote.rfq.buyerCompanyId, supplierCompanyId: loser.supplierCompanyId }
            });
          }

          await tx.message.create({
            data: {
              conversationId: loserConv.id,
              senderId: (session.user as any).id,
              senderName: `${buyerCompany?.name || "Buyer"} (Info RFQ)`,
              content: `Terima kasih telah mengirim penawaran untuk RFQ "${quote.rfq.title}". Mohon maaf, buyer telah memilih supplier lain untuk RFQ ini.`,
            }
          });
        }
      });

      return NextResponse.json({ success: true, message: "Penawaran diterima. RFQ ditutup. Pesan notifikasi telah dikirim ke chat." });

    } else {
      // Aksi REJECT tetap sama
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