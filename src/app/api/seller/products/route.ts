import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "SUPPLIER") {
    return NextResponse.json({ error: "Hanya Supplier yang dapat menambah produk" }, { status: 403 });
  }

  // --- TAMBAHKAN KODE INI ---
  const company = await prisma.company.findUnique({
    where: { id: (session.user as any).companyId }
  });
  const productCount = await prisma.product.count({
    where: { companyId: (session.user as any).companyId }
  });
  const limits = { FREE: 10, PRO: 100, PREMIUM: 500, ENTERPRISE: 99999 };
  const limit = limits[company?.plan as keyof typeof limits || "FREE"];

  if (productCount >= limit) {
    return NextResponse.json({ 
      error: `Batas listing paket ${company?.plan} Anda (${limit} produk) telah tercapai. Silakan upgrade paket.` 
    }, { status: 403 });
  }
  // ---------------------------

  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.moq) {
    return NextResponse.json({ error: "Judul dan MOQ wajib diisi" }, { status: 400 });
  }

  // Ambil categoryId dari form, kalau kosong baru ambil yang pertama
  const categoryId = body.categoryId || (await prisma.category.findFirst())?.id;

  const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36);

  const product = await prisma.product.create({
    data: {
      companyId: (session.user as any).companyId,
      categoryId: categoryId,
      titleId: body.title,
      titleEn: body.title,
      slug,
      description: body.description || null,
      moq: Number(body.moq),
      moqUnit: body.moqUnit || "pcs",
      priceMin: body.priceMin ? Number(body.priceMin) : null,
      
      // Simpan gambar ke tabel ProductImage
      images: {
        create: (body.images || []).map((url: string) => ({ url }))
      }
    },
  });

  return NextResponse.json(product);
}