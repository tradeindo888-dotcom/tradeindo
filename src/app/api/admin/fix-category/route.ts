import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { productId, newCategorySlug } = body;

    if (!productId || !newCategorySlug) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    if (typeof productId !== "string" || typeof newCategorySlug !== "string") {
      return NextResponse.json({ error: "Invalid params" }, { status: 400 });
    }

    const category = await prisma.category.findFirst({
      where: { slug: newCategorySlug },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Transaction: update + reset flag + audit log
    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          categoryId: category.id,
          isCategoryVerified: false, // ✅ RESET flag — produk akan muncul lagi di suspicious list jika masih salah
        },
        include: { category: true },
      });

      await tx.auditLog.create({
        data: {
          actorId: (session.user as any).id,
          action: "product.fix_category",
          entity: "Product",
          entityId: productId,
          metadata: {
            newCategory: newCategorySlug,
            fixedBy: "admin",
          },
        },
      });

      return updated;
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("fix-category error:", error);
    return NextResponse.json({ error: "Gagal memperbaiki kategori" }, { status: 500 });
  }
}