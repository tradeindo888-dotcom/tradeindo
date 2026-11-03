import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { trackEvent } from "@/lib/sponsorship/tracking";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Harus login" }, { status: 401 });

  const body = await req.json();
  const { supplierCompanyId, productId } = body;
  const buyerCompanyId = (session.user as any).companyId;

  // Pastikan user punya perusahaan
  if (!buyerCompanyId) {
    return NextResponse.json({ error: "Hanya akun perusahaan yang dapat memulai chat" }, { status: 403 });
  }

  // Cegah chat ke diri sendiri
  if (buyerCompanyId === supplierCompanyId) {
    return NextResponse.json({ error: "Tidak dapat memulai chat dengan perusahaan sendiri" }, { status: 400 });
  }

  // Cari apakah sudah ada obrolan untuk produk ini
  let conversation = await prisma.conversation.findFirst({
    where: {
      buyerCompanyId: buyerCompanyId,
      supplierCompanyId: supplierCompanyId,
      productId: productId,
    },
  });

  // Jika belum ada, buat ruang obrolan baru
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        buyerCompanyId: buyerCompanyId,
        supplierCompanyId: supplierCompanyId,
        productId: productId, // Menyimpan ID produk
      },
    });
  }

  // Catat metrik CHAT
  if (productId) {
    await trackEvent({
      productId: productId,
      eventType: "CHAT",
      userId: (session.user as any).id,
      source: "sponsored",
    });
  }

  return NextResponse.json({ id: conversation.id });
}