import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) {
      return NextResponse.json({ error: "Pesan tidak ditemukan" }, { status: 404 });
    }

    // Pastikan hanya pengirim yang bisa menghapus pesannya sendiri
    if (message.senderId !== (session.user as any).id) {
      return NextResponse.json({ error: "Anda hanya bisa menghapus pesan Anda sendiri" }, { status: 403 });
    }

    await prisma.message.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE message error:", error);
    return NextResponse.json({ error: "Gagal menghapus pesan" }, { status: 500 });
  }
}