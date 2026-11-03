import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const take = Math.min(Number(searchParams.get("take") ?? 24), 100);
    const skip = Math.max(Number(searchParams.get("skip") ?? 0), 0);

    const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
    if (category) where.category = { slug: category };
    if (q) {
      where.OR = [
        { titleId: { contains: q, mode: "insensitive" } },
        { titleEn: { contains: q, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        company: {
          select: {
            id: true, name: true, slug: true, city: true, province: true,
            logoUrl: true, verificationStatus: true,
          },
        },
        images: { take: 1, select: { url: true } },
        // TAMBAHKAN promoLabel DISINI
        sponsoredRequests: {
          where: { status: "APPROVED", expiresAt: { gt: new Date() } },
          select: { tier: true, promoLabel: true }, 
          orderBy: { approvedAt: "desc" },
          take: 1,
        }
      },
      orderBy: [
        { sponsoredUntil: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      take,
      skip,
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products failed", error);
    return NextResponse.json({ error: "Gagal memuat produk" }, { status: 500 });
  }
}