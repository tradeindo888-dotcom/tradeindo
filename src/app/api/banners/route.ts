import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
          { endDate: null }, // Banner admin (tidak expired)
          { endDate: { gt: now } } // Banner customer (belum expired)
        ]
      },
      orderBy: type === "SIDEBAR" ? { createdAt: "desc" } : { order: "asc" },
      take: type === "SIDEBAR" ? 1 : undefined, // Sidebar hanya 1 iklan
    });
    
    return NextResponse.json(banners);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data banner" }, { status: 500 });
  }
}