import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // Mencegah cache agar langsung hilang saat jam habis

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "CAROUSEL";
    const now = new Date();

    const banners = await prisma.banner.findMany({
      where: { 
        isActive: true,
        status: "APPROVED",
        type: type,
        OR: [
          { endDate: null },          // Jika tidak ada tanggal berakhir (permanen)
          { endDate: { gt: now } }    // Hanya ambil jika endDate BELUM terlewati
        ]
      },
      orderBy: type === "SIDEBAR" ? { createdAt: "desc" } : { order: "asc" },
      take: type === "SIDEBAR" ? 1 : undefined,
    });
    
    return NextResponse.json(banners);
  } catch (error) {
    console.error("GET /api/banners error:", error);
    return NextResponse.json({ error: "Gagal mengambil data banner" }, { status: 500 });
  }
}