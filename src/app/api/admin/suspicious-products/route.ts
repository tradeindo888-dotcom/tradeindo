import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { suggestCategoryFromTitle, CATEGORY_NAMES } from "@/lib/category-keywords";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const products = await prisma.product.findMany({
      where: { 
        status: "ACTIVE",
        isCategoryVerified: false // <-- HANYA YANG BELUM DIVERIFIKASI
      },
      include: {
        category: { select: { id: true, slug: true, nameId: true, nameEn: true } },
        company: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const suspicious = products
      .map((p) => {
        const title = p.titleId || p.titleEn;
        const { suggestedSlug, matchedKeyword, allMatches } = suggestCategoryFromTitle(title);

        if (allMatches.length > 0 && !allMatches.includes(p.category.slug)) {
          return {
            id: p.id,
            title,
            slug: p.slug,
            company: p.company,
            currentCategory: p.category,
            suggestedCategory: {
              slug: suggestedSlug!,
              nameId: CATEGORY_NAMES[suggestedSlug!] || suggestedSlug,
            },
            matchedKeyword,
            createdAt: p.createdAt,
          };
        }
        return null;
      })
      .filter(Boolean);

    return NextResponse.json({ suspicious, total: suspicious.length });
  } catch (error) {
    console.error("GET /api/admin/suspicious-products error:", error);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}