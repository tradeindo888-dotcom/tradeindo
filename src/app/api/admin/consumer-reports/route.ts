import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ============================================================
// 1. POST — User mengirim laporan konsumen
// ============================================================
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { name, email, category, subject, message } = body;

    if (!name || !email || !category || !subject || !message) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    if (!["PENGGUNAAN", "PELANGGARAN"].includes(category)) {
      return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
    }

    // @ts-ignore
    const report = await prisma.consumerReport.create({
      data: {
        userId: (session?.user as any)?.id || null,
        name,
        email,
        category,
        subject,
        message,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("POST Report Error:", error);
    return NextResponse.json({ error: "Gagal mengirim laporan" }, { status: 500 });
  }
}

// ============================================================
// 2. GET — Admin mengambil daftar laporan
// ============================================================
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // @ts-ignore
  const reports = await prisma.consumerReport.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports);
}

// ============================================================
// 3. PATCH — Admin update status + kirim chat balasan
// ============================================================
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, adminReply } = body;

    if (!id || !["RESOLVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    // @ts-ignore
    const updatedReport = await prisma.consumerReport.update({
      where: { id },
      data: { status, adminReply },
    });

    const reportUserId = updatedReport.userId;
    
    if (adminReply && String(adminReply).trim().length > 0 && reportUserId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: reportUserId },
          select: { companyId: true },
        });

        if (user && user.companyId) {
          let adminCompany = await prisma.company.findFirst({ where: { slug: "tradeindo-admin" } });
          if (!adminCompany) {
            adminCompany = await prisma.company.create({
              data: { name: "Admin Trade Indo", slug: "tradeindo-admin", type: "BUYER" },
            });
          }

          let conversation = await prisma.conversation.findFirst({
            where: {
              OR: [
                { buyerCompanyId: user.companyId, supplierCompanyId: adminCompany.id },
                { buyerCompanyId: adminCompany.id, supplierCompanyId: user.companyId },
              ],
            },
          });

          if (!conversation) {
            conversation = await prisma.conversation.create({
              data: {
                buyerCompanyId: user.companyId,
                supplierCompanyId: adminCompany.id,
              },
            });
          }

          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              senderId: (session.user as any).id,
              senderName: "Admin Trade Indo",
              content: `[Balasan Laporan Konsumen - ${status === "RESOLVED" ? "Selesai" : "Ditolak"}]\n\nSubjek: ${updatedReport.subject}\nBalasan: ${adminReply}`,
            },
          });
        }
      } catch (chatError) {
        console.error("Gagal membuat pesan chat admin:", chatError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Report Error:", error);
    return NextResponse.json({ error: "Gagal update status laporan" }, { status: 500 });
  }
}

// ============================================================
// 4. DELETE — Admin menghapus laporan konsumen
// ============================================================
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID laporan tidak ada" }, { status: 400 });
    }

    // @ts-ignore
    await prisma.consumerReport.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Report Error:", error);
    return NextResponse.json({ error: "Gagal menghapus laporan" }, { status: 500 });
  }
}