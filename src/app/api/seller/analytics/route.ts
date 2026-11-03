import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Wajib ada agar Next.js tidak menyimpan cache data lama
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "SUPPLIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const companyId = (session.user as any).companyId;
  if (!companyId) return NextResponse.json({ error: "No company" }, { status: 400 });

  try {
    // 1. Ambil parameter 'days' dari URL (default 30)
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    
    // Validasi agar tidak ngawur (hanya izinkan 7, 15, 30, 60, 90)
    const validDays = [7, 15, 30, 60, 90].includes(days) ? days : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - validDays);

    const myProducts = await prisma.product.findMany({
      where: { companyId },
      select: { id: true, titleId: true, categoryId: true },
    });
    const productIds = myProducts.map((p) => p.id);

    // Ambil events
    const events = await prisma.productEvent.findMany({
      where: {
        OR: [
          { productId: { in: productIds } },
          { supplierCompanyId: companyId, eventType: "PROFILE_VIEW" }
        ],
        createdAt: { gte: startDate },
      },
      include: {
        user: { include: { company: { select: { province: true } } } },
      },
    });

    // 2. Data Tren Harian (Sesuaikan dengan jumlah hari)
    const dailyData: Record<string, { date: string; views: number; clicks: number }> = {};
    for (let i = validDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      dailyData[dateStr] = { date: dateStr, views: 0, clicks: 0 };
    }

    // 3. Variabel Funnel, Sumber, Peak Hours
    let impressions = 0, views = 0, chats = 0;
    let organicViews = 0, sponsoredViews = 0;
    let profileViews = 0;
    const hourlyData = Array(24).fill(0).map((_, i) => ({ hour: `${i}:00`, views: 0 }));
    
    // 4. Variabel Geografis, Top Produk, Keywords
    const provinceCounts: Record<string, number> = {};
    const productStats: Record<string, { title: string; views: number; chats: number }> = {};
    const keywordCounts: Record<string, number> = {};

    myProducts.forEach(p => { productStats[p.id] = { title: p.titleId, views: 0, chats: 0 }; });

    events.forEach((ev) => {
      const dateStr = ev.createdAt.toISOString().split("T")[0];
      const hour = ev.createdAt.getHours();

      if (ev.eventType === "PROFILE_VIEW") {
        profileViews++;
        // Logika provinsi dihapus dari sini agar Dilihat Profil tidak masuk ke Asal Pembeli Produk
        return; 
      }

      if (ev.eventType === "IMPRESSION") impressions++;
      if (ev.eventType === "VIEW") views++;
      if (ev.eventType === "CHAT") chats++;

      if (dailyData[dateStr]) {
        if (ev.eventType === "VIEW") dailyData[dateStr].views++;
        if (ev.eventType === "CLICK") dailyData[dateStr].clicks++;
      }

      if (ev.eventType === "VIEW") {
        hourlyData[hour].views++;
        if (ev.source === "sponsored") sponsoredViews++;
        else organicViews++;
      }

      if (ev.productId && productStats[ev.productId]) {
        if (ev.eventType === "VIEW") {
          productStats[ev.productId].views++;
          const words = productStats[ev.productId].title.toLowerCase().split(" ").filter(w => w.length > 3);
          words.forEach(w => { keywordCounts[w] = (keywordCounts[w] || 0) + 1; });
        }
        if (ev.eventType === "CHAT") productStats[ev.productId].chats++;
      }

      // PERUBAHAN DISINI: Hanya hitung provinsi JIKA event-nya adalah VIEW (Melihat Produk)
      if (ev.eventType === "VIEW" && ev.user?.company?.province) {
        const prov = ev.user.company.province;
        provinceCounts[prov] = (provinceCounts[prov] || 0) + 1;
      }
    });

    // 5. Benchmarking
    let benchmark = { rank: "Top 100%", categoryName: "", avgViews: 0 };
    if (myProducts.length > 0 && myProducts[0].categoryId) {
      const catId = myProducts[0].categoryId;
      const category = await prisma.category.findUnique({ where: { id: catId } });
      const catEventsCount = await prisma.productEvent.count({ where: { product: { categoryId: catId }, eventType: "VIEW" } });
      const suppliersCount = await prisma.company.count({ where: { products: { some: { categoryId: catId } } } });
      const avg = suppliersCount > 0 ? catEventsCount / suppliersCount : 0;
      let topPercent = 100;
      if (avg > 0 && views > avg) topPercent = Math.max(5, Math.round((avg / views) * 100));
      benchmark = { rank: `Top ${topPercent}%`, categoryName: category?.nameId || "", avgViews: Math.round(avg) };
    }

    // 6. Format Output
    const sortedKeywords = Object.entries(keywordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topProvinces = Object.entries(provinceCounts)
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      trendChartData: Object.values(dailyData),
      sourceChartData: [{ name: "Organik", value: organicViews }, { name: "Berbayar", value: sponsoredViews }],
      funnelData: { impressions, views, chats },
      hourlyData,
      topProducts: Object.values(productStats).sort((a, b) => b.chats - a.chats).slice(0, 5),
      topProvinces,
      profileVsProduct: { profile: profileViews, product: views },
      keywords: sortedKeywords,
      benchmark,
      totalViews: organicViews + sponsoredViews,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Gagal memuat analitik" }, { status: 500 });
  }
}