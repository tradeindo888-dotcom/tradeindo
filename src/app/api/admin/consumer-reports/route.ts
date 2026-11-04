import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // 1. Update status laporan di database
    // @ts-ignore
    const updatedReport = await prisma.consumerReport.update({
      where: { id },
      data: { status, adminReply },
    });

    // 2. Kirim sebagai Pesan Chat (jika pelapor punya akun perusahaan)
    if (adminReply && String(adminReply).trim().length > 0 && updatedReport.userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: updatedReport.userId },
          select: { companyId: true },
        });

        if (user && user.companyId) {
          // Cari atau buat akun perusahaan untuk Admin
          let adminCompany = await prisma.company.findFirst({ where: { slug: "tradeindo-admin" } });
          if (!adminCompany) {
            adminCompany = await prisma.company.create({
              data: { name: "Admin Trade Indo", slug: "tradeindo-admin", type: "BUYER" },
            });
          }

          // Cari atau buat room chat antara Admin dan User
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

          // Kirim pesannya
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
        // Tetap lanjutkan return success meskipun chat gagal
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Report Error:", error);
    return NextResponse.json({ error: "Gagal update status laporan" }, { status: 500 });
  }
}