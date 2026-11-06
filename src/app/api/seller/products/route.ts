import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "SUPPLIER") {
    return NextResponse.json({ error: "Hanya Supplier yang dapat menambah produk" }, { status: 403 });
  }

  const companyId = (session.user as any).companyId;

  // Cek batas produk
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });
  const productCount = await prisma.product.count({
    where: { companyId }
  });
  const limits = { FREE: 10, PRO: 100, PREMIUM: 500, ENTERPRISE: 99999 };
  const limit = limits[company?.plan as keyof typeof limits || "FREE"];

  if (productCount >= limit) {
    return NextResponse.json({ 
      error: `Batas listing paket ${company?.plan} Anda (${limit} produk) telah tercapai. Silakan upgrade paket.` 
    }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.title) {
    return NextResponse.json({ error: "Judul wajib diisi" }, { status: 400 });
  }

  const categoryId = body.categoryId || (await prisma.category.findFirst())?.id;

  const slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36);

  // LOGIKA NEGO: Jika kosong, jadikan null
  const moq = body.moq ? Number(body.moq) : null;
  const priceMin = body.priceMin ? Number(body.priceMin) : null;

  const product = await prisma.product.create({
    data: {
      companyId: companyId,
      categoryId: categoryId,
      titleId: body.title,
      titleEn: body.title,
      slug,
      description: body.description || null,
      moq: moq, // Simpan hasil (null atau angka)
      moqUnit: body.moqUnit || "pcs",
      priceMin: priceMin,
      
      images: {
        create: (body.images || []).map((url: string) => ({ url }))
      }
    },
  });

  return NextResponse.json(product);
}