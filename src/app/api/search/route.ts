import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (!q.trim()) {
      return NextResponse.json({ products: [], suppliers: [], buyers: [] });
    }

    // 1. Cari Produk
    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { titleId: { contains: q, mode: "insensitive" } },
          { titleEn: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { company: true, images: { take: 1 } },
      take: 12, // Batasi 12 hasil
    });

    // 2. Cari Supplier (MANUFACTURER, DISTRIBUTOR, EXPORTER)
    const suppliers = await prisma.company.findMany({
      where: {
        type: { in: ["MANUFACTURER", "DISTRIBUTOR", "EXPORTER"] },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { _count: { select: { products: true } } },
      take: 6,
    });

    // 3. Cari Buyer
    const buyers = await prisma.company.findMany({
      where: {
        type: "BUYER",
        name: { contains: q, mode: "insensitive" },
      },
      take: 6,
    });

    return NextResponse.json({ products, suppliers, buyers });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Gagal melakukan pencarian" }, { status: 500 });
  }
}