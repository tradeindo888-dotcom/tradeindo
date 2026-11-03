import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const spotlightRequests = await prisma.sponsoredRequest.findMany({
      where: {
        tier: "HOMEPAGE",
        status: "APPROVED",
        expiresAt: { gt: now },
      },
      include: {
        product: {
          include: {
            images: { take: 1, select: { url: true } },
            company: { select: { name: true } },
          }
        },
      },
      orderBy: { approvedAt: "desc" },
      take: 4, // <-- DIUBAH DARI 3 MENJADI 4
    });

    const products = spotlightRequests
      .map(req => {
        if (!req.product) return null;
        return {
          ...req.product,
          promoLabel: req.promoLabel 
        };
      })
      .filter(Boolean);

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products/spotlight failed", error);
    return NextResponse.json({ error: "Gagal memuat spotlight" }, { status: 500 });
  }
}