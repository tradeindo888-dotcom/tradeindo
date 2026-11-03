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
    const { productId } = body;

    if (!productId || typeof productId !== "string" || productId.trim().length === 0) {
      return NextResponse.json({ error: "productId tidak valid" }, { status: 400 });
    }

    const exists = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isCategoryVerified: true },
    });
    if (!exists) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    // Idempotent — kalau sudah verified, tidak perlu update
    if (exists.isCategoryVerified) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: productId },
        data: { isCategoryVerified: true },
        select: {
          id: true,
          titleId: true,
          titleEn: true,
          slug: true,
          categoryId: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: (session.user as any).id,
          action: "product.verify_category",
          entity: "Product",
          entityId: productId,
          metadata: {
            verifiedBy: "admin",
            categoryIdAtVerification: product.categoryId,
          },
        },
      });

      return product;
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error("verify-category error:", error);

    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ error: "Gagal memverifikasi kategori" }, { status: 500 });
  }
}