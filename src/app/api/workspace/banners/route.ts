import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// FUNGSI GET: Mengambil riwayat iklan milik Supplier
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companyId = (session.user as any).companyId;
  if (!companyId) return NextResponse.json({ error: "No company" }, { status: 403 });

  try {
    const banners = await prisma.banner.findMany({
      where: { companyId, type: "CAROUSEL" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(banners);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// FUNGSI POST: Mengajukan iklan baru
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companyId = (session.user as any).companyId;
  if (!companyId) return NextResponse.json({ error: "Hanya akun perusahaan yang bisa memasang iklan" }, { status: 403 });

  try {
    const body = await req.json();
    const { imageUrl, paymentProofUrl, durationDays, price, title, linkUrl } = body;

    if (!imageUrl || !paymentProofUrl) {
      return NextResponse.json({ error: "Gambar dan bukti transfer wajib diunggah" }, { status: 400 });
    }

    const banner = await prisma.banner.create({
      data: {
        companyId,
        imageUrl,
        paymentProofUrl,
        durationDays: Number(durationDays),
        price: Number(price),
        title: title || null,
        linkUrl: linkUrl || null,
        type: "CAROUSEL",
        status: "PENDING", 
        isActive: false,   
      },
    });

    return NextResponse.json({ success: true, banner });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengajukan iklan" }, { status: 500 });
  }
}