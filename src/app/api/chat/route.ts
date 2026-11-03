import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// FUNGSI UNTUK MENGAMBIL PESAN (GET)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("id");

    if (!conversationId) {
      return NextResponse.json({ error: "ID tidak ada" }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        // Kita tidak punya relasi langsung ke company, jadi kita ambil manual
        // Tapi karena skema kita sederhana, kita pakai nama pengirim (senderName) dulu
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil pesan" }, { status: 500 });
  }
}

// FUNGSI UNTUK MENGIRIM PESAN (POST)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const message = await prisma.message.create({
      data: {
        conversationId: body.conversationId,
        senderId: (session.user as any).id,
        senderName: (session.user as any).name || "User",
        content: body.content || "",
        fileUrl: body.fileUrl || null,
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengirim pesan" }, { status: 500 });
  }
}