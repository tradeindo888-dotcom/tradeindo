import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const banner = await prisma.banner.findUnique({ where: { id: params.id } });
    if (!banner) return NextResponse.json({ error: "Banner tidak ditemukan" }, { status: 404 });

    const now = new Date();
    const endDate = new Date(now.getTime() + (banner.durationDays || 30) * 24 * 60 * 60 * 1000);

    await prisma.banner.update({
      where: { id: params.id },
      data: { status: "APPROVED", isActive: true, startDate: now, endDate: endDate }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menyetujui" }, { status: 500 });
  }
}