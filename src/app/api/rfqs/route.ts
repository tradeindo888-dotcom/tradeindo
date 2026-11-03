import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rfqSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

// ============================================================
// FUNGSI GET: Mengambil daftar RFQ
// ============================================================
export async function GET() {
  try {
    // Hitung waktu 3 hari yang lalu (batas arsip)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const rfqs = await prisma.rfq.findMany({
      where: {
        OR: [
          // 1. RFQ aktif — selalu tampil
          { status: { in: ["OPEN", "QUOTING"] } },
          
          // 2. RFQ closed ≤3 hari — tetap tampil (masa transparansi)
          {
            status: { in: ["CLOSED", "CANCELLED"] },
            closedAt: { gte: threeDaysAgo },
          },
          
          // 3. Fallback data lama (closed tapi closedAt null)
          {
            status: { in: ["CLOSED", "CANCELLED"] },
            closedAt: null,
            deadlineAt: { gte: threeDaysAgo },
          },
        ],
      },
      include: {
        buyerCompany: {
          select: {
            id: true, name: true, slug: true, city: true, province: true,
            logoUrl: true, verificationStatus: true,
          },
        },
        images: true,
        _count: { select: { quotes: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(rfqs);
  } catch (error) {
    console.error("GET /api/rfqs error:", error);
    return NextResponse.json({ error: "Gagal memuat daftar RFQ" }, { status: 500 });
  }
}

// ============================================================
// FUNGSI POST: Membuat RFQ baru
// ============================================================
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const companyId = (session.user as any).companyId;

    if (role !== "BUYER" && role !== "SUPPLIER") {
      return NextResponse.json(
        { error: "Hanya Buyer atau Supplier yang dapat membuat RFQ." },
        { status: 403 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "Akun belum terhubung dengan perusahaan." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Body request tidak valid" }, { status: 400 });
    }

    // Validasi menggunakan Zod
    const parsed = rfqSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Input tidak valid", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    
    // Cek apakah kategori ada berdasarkan ID atau Slug
    const category = await prisma.category.findFirst({
      where: { OR: [{ id: data.categoryId }, { slug: data.categoryId }] },
    });
    
    if (!category) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 400 });
    }

    // Pastikan images adalah array string sebelum disimpan
    const imagesData = Array.isArray(body.images) 
      ? body.images
          .filter((url: any) => typeof url === "string")
          .map((url: string) => ({ url }))
      : [];

    // Simpan ke database
    const rfq = await prisma.rfq.create({
      data: {
        buyerCompanyId: companyId,
        createdById: (session.user as any).id,
        categoryId: category.id,
        title: data.title,
        description: data.description,
        quantity: data.quantity,
        quantityUnit: data.quantityUnit,
        targetPrice: data.targetPrice ?? null,
        targetPriceMax: data.targetPriceMax ?? null,
        deliveryCity: data.deliveryCity ?? null,
        deadlineAt: new Date(data.deadlineAt),
        verifiedOnly: data.verifiedOnly,
        images: {
          create: imagesData,
        },
      },
    });

    // Catat Audit Log
    await audit((session.user as any).id, "rfq.create", "Rfq", rfq.id, {
      title: rfq.title,
      createdByRole: role,
    });

    return NextResponse.json(rfq, { status: 201 });
  } catch (error) {
    console.error("POST /api/rfqs error:", error);
    return NextResponse.json({ error: "Gagal membuat RFQ" }, { status: 500 });
  }
}