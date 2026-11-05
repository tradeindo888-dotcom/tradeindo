import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { message, targetRole } = body;

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Pesan tidak boleh kosong." }, { status: 400 });
    }

    // 1. Dapatkan atau buat Company "Admin Trade Indo"
    let adminCompany = await prisma.company.findFirst({ where: { slug: "tradeindo-admin" } });
    if (!adminCompany) {
      adminCompany = await prisma.company.create({
        data: { name: "Admin Trade Indo", slug: "tradeindo-admin", type: "BUYER" },
      });
    }

    // 2. Tentukan target perusahaan (Company)
    let whereClause: any = {};
    if (targetRole === "BUYER") {
      whereClause = { type: "BUYER" };
    } else if (targetRole === "SUPPLIER") {
      // Di sistem kita, supplier bisa berupa MANUFACTURER, DISTRIBUTOR, atau EXPORTER
      whereClause = { type: { in: ["MANUFACTURER", "DISTRIBUTOR", "EXPORTER"] } };
    }
    
    const targetCompanies = await prisma.company.findMany({
      where: { 
        ...whereClause,
        id: { not: adminCompany.id } // Jangan kirim ke diri sendiri
      },
      select: { id: true, type: true }
    });

    if (targetCompanies.length === 0) {
      return NextResponse.json({ error: "Tidak ada target penerima yang sesuai." }, { status: 400 });
    }

    // 3. Kirim pesan ke masing-masing perusahaan
    let successCount = 0;

    for (const target of targetCompanies) {
      // Cek apakah percakapan dengan Admin sudah ada
      let conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            { buyerCompanyId: adminCompany.id, supplierCompanyId: target.id },
            { buyerCompanyId: target.id, supplierCompanyId: adminCompany.id },
          ],
        },
      });

      // Jika belum ada, buat ruang obrolan baru
      if (!conversation) {
        const isTargetBuyer = target.type === "BUYER";
        conversation = await prisma.conversation.create({
          data: {
            buyerCompanyId: isTargetBuyer ? target.id : adminCompany.id,
            supplierCompanyId: isTargetBuyer ? adminCompany.id : target.id,
          },
        });
      }

      // Kirim pesan
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: (session.user as any).id,
          senderName: "Admin Trade Indo",
          content: message,
        },
      });

      successCount++;
    }

    return NextResponse.json({ success: true, count: successCount });
  } catch (error) {
    console.error("Broadcast error:", error);
    return NextResponse.json({ error: "Gagal mengirim broadcast" }, { status: 500 });
  }
}