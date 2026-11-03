import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "SUPPLIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supplierCompanyId = (session.user as any).companyId;
  const body = await req.json();
  const { buyerCompanyId, productId } = body;

  if (!buyerCompanyId) {
    return NextResponse.json({ error: "Buyer company ID required" }, { status: 400 });
  }

  // Cari apakah sudah ada obrolan antara Supplier ini dan Buyer ini untuk produk tersebut
  let conversation = await prisma.conversation.findFirst({
    where: {
      buyerCompanyId,
      supplierCompanyId,
      productId: productId || null,
    },
  });

  // Jika belum ada, buat ruang obrolan baru
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        buyerCompanyId,
        supplierCompanyId,
        productId: productId || null,
      },
    });
  }

  return NextResponse.json({ id: conversation.id });
}