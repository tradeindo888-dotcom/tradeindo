import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const companyId = (session?.user as any)?.companyId;
    const userId = (session?.user as any)?.id;

    if (!companyId || !userId) return NextResponse.json({ count: 0 });

    // 1. Cari semua percakapan milik perusahaan ini
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { buyerCompanyId: companyId },
          { supplierCompanyId: companyId },
        ],
      },
      select: { id: true }
    });
    const convoIds = conversations.map(c => c.id);

    // 2. Hitung pesan yang belum dibaca (BUKAN dari diri sendiri)
    const count = await prisma.message.count({
      where: {
        conversationId: { in: convoIds },
        senderId: { not: userId },
        isRead: false
      }
    });

    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json({ count: 0 });
  }
}