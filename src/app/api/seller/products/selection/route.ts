import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "SUPPLIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const companyId = (session.user as any).companyId;
  const body = await req.json();
  const { productIds } = body;

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  const limit = company?.plan === "FREE" ? 10 : company?.plan === "PRO" ? 100 : 500;

  if (!Array.isArray(productIds) || productIds.length > limit) {
    return NextResponse.json({ error: `Maksimal ${limit} produk yang dapat dipilih.` }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Sembunyikan HANYA produk yang statusnya ACTIVE atau HIDDEN milik company ini
      // (DRAFT dan REJECTED tidak disentuh)
      await tx.product.updateMany({
        where: { 
          companyId,
          status: { in: ["ACTIVE", "HIDDEN"] } 
        },
        data: { status: "HIDDEN" },
      });

      // 2. Aktifkan produk yang dipilih
      if (productIds.length > 0) {
        await tx.product.updateMany({
          where: { 
            id: { in: productIds }, 
            companyId,
            status: { not: "DRAFT" } // Extra safety
          },
          data: { status: "ACTIVE" },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Selection error:", error);
    return NextResponse.json({ error: "Gagal menyimpan pilihan." }, { status: 500 });
  }
}