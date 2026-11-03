import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "SUPPLIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const companyId = (session.user as any).companyId;

  try {
    // 1. Ambil produk milik supplier beserta gambarnya
    const myProducts = await prisma.product.findMany({
      where: { companyId },
      select: { 
        id: true, 
        titleId: true, 
        titleEn: true, 
        slug: true, 
        images: { take: 1, select: { url: true } } 
      },
    });
    const productIds = myProducts.map((p) => p.id);
    const productMap = new Map(myProducts.map((p) => [p.id, p]));

    // 2. Ambil events, TANPA memfilter userId (boleh null / anonim)
    const events = await prisma.productEvent.findMany({
      where: {
        productId: { in: productIds },
        eventType: { in: ["VIEW", "CLICK"] },
      },
      select: {
        userId: true,
        eventType: true,
        createdAt: true,
        productId: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // 3. Kumpulkan userId yang tidak null (bukan anonim)
    const userIds = [...new Set(events.map((e) => e.userId).filter(Boolean) as string[])];
    
    // 4. Ambil data user (HANYA JANGAN AMBIL YANG ADMIN)
    const users = await prisma.user.findMany({
      where: { 
        id: { in: userIds },
        role: { not: "ADMIN" } 
      },
      select: {
        id: true,
        name: true,
        company: {
          select: {
            id: true,
            name: true,
            city: true,
            province: true,
          },
        },
      },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    const leads = events
      .filter((event) => {
        // Jika anonim (userId null), tetap tampilkan
        if (!event.userId) return true;

        const user = userMap.get(event.userId);
        
        // Sembunyikan jika user tidak ada (berarti Admin yang sudah difilter)
        if (!user) return false;

        // Sembunyikan jika yang melihat adalah perusahaan itu sendiri
        return !user.company || user.company.id !== companyId;
      })
      .map((event) => {
        // PERBAIKAN: Cek apakah productId ada (tidak null) sebelum memanggil productMap.get()
        const product = event.productId ? productMap.get(event.productId) : null;

        // JIKA ANONIM (Tanpa Login)
        if (!event.userId) {
          return {
            id: `guest-${event.createdAt.getTime()}-${event.productId}`,
            action: event.eventType,
            date: event.createdAt,
            buyerName: "Anonim",
            buyerCompanyId: null,
            buyerCompany: "Individu (Tanpa Login)",
            buyerLocation: "-",
            product: product || null,
          };
        }

        // JIKA LOGIN (User/Perusahaan)
        const user = userMap.get(event.userId)!;
        return {
          id: `${event.userId}-${event.createdAt.getTime()}`,
          action: event.eventType,
          date: event.createdAt,
          buyerName: user.name || "Anonim",
          buyerCompanyId: user.company?.id || null,
          buyerCompany: user.company?.name || "Individu (Tanpa Perusahaan)",
          buyerLocation: user.company ? [user.company.city, user.company.province].filter(Boolean).join(", ") : "-",
          product: product || null,
        };
      });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Gagal load leads:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}