import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const banners = await prisma.banner.findMany({ 
      include: { company: { select: { name: true } } },
      orderBy: { createdAt: "desc" } 
    });
    return NextResponse.json(banners);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { imageUrl, title, linkUrl, order, type, durationDays } = body;
    if (!imageUrl) return NextResponse.json({ error: "Gambar wajib diunggah" }, { status: 400 });

    let endDate = null;
    // Hitung endDate jika durasi diisi
    if (durationDays && Number(durationDays) > 0) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + Number(durationDays));
    }

    const banner = await prisma.banner.create({
      data: {
        imageUrl,
        title: title || null,
        linkUrl: linkUrl || null,
        type: type || "CAROUSEL",
        durationDays: durationDays ? Number(durationDays) : null,
        endDate, // Simpan tanggal berakhir
        order: Number(order) || 0,
        status: "APPROVED",
        isActive: true,
      },
    });
    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error("Create banner error:", error);
    return NextResponse.json({ error: "Gagal membuat banner" }, { status: 500 });
  }
}