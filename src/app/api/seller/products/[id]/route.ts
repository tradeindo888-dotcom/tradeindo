import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// TAMBAHKAN FUNGSI INI UNTUK MENGAMBIL DATA
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { images: true } // Wajib disertakan agar gambar lama muncul
  });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

// FUNGSI PUT (Yang sudah ada sebelumnya)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "SUPPLIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.title) return NextResponse.json({ error: "Judul wajib diisi" }, { status: 400 });

  const existing = await prisma.product.findUnique({ where: { id: params.id } });
  if (!existing || existing.companyId !== (session.user as any).companyId) {
    return NextResponse.json({ error: "Produk tidak ditemukan atau bukan milik Anda" }, { status: 404 });
  }

    // HAPUS GAMBAR LAMA YANG DIPILIH
    if (body.deletedImages && body.deletedImages.length > 0) {
      await prisma.productImage.deleteMany({
        where: {
          id: { in: body.deletedImages },
          productId: params.id, // Pastikan gambar ini milik produk yang sedang diedit
        },
      });
    }

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: {
      categoryId: body.categoryId,
      titleId: body.title,
      titleEn: body.title,
      description: body.description || null,
      moq: Number(body.moq),
      moqUnit: body.moqUnit,
      priceMin: body.priceMin ? Number(body.priceMin) : null,
      images: body.newImages && body.newImages.length > 0 ? {
        create: body.newImages.map((url: string) => ({ url }))
      } : undefined
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "SUPPLIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.product.findUnique({ where: { id: params.id } });
  if (!existing || existing.companyId !== (session.user as any).companyId) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  // Hapus produk (gambar dan chat terkait otomatis terhapus karena onDelete: Cascade)
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}