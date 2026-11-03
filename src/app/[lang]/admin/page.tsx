import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AdminTabs from "./AdminTabs";

// BYPASS: Nilai harga ditulis langsung di sini
const PLAN_PRICES = { FREE: 0, PRO: 49_000, PREMIUM: 149_000, ENTERPRISE: 0 };

export default async function AdminDashboard({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = rawLang === "en" ? "en" : "id";

  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") redirect(`/${lang}/login`);

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { products: true } }, verificationRequests: { where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const pendingSubscriptions = await prisma.subscriptionRequest.findMany({
    where: { status: "PENDING" }, include: { company: { select: { name: true } } }, orderBy: { createdAt: "desc" },
  });

  const pendingSponsors = await prisma.sponsoredRequest.findMany({
    where: { status: "PENDING" }, include: { product: { select: { titleId: true, images: { take: 1, select: { url: true } } } }, company: { select: { name: true } } }, orderBy: { createdAt: "desc" },
  });

  // Mengambil user (Buyer & Supplier), mengecualikan Admin
  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" }, id: { not: (session.user as any).id } }, 
    include: { company: { select: { name: true } } }, 
    orderBy: { createdAt: "desc" },
  });

  const pendingBanners = await prisma.banner.findMany({
    where: { status: "PENDING", type: "CAROUSEL" }, include: { company: { select: { name: true } } }, orderBy: { createdAt: "desc" },
  });

  // @ts-ignore
  const consumerReports = await prisma.consumerReport.findMany({ orderBy: { createdAt: "desc" } });

  // ============================================================
  // LOGIKA PENDAPATAN & USER
  // ============================================================
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

  // Hitung Iklan
  const revenueRequests = await prisma.sponsoredRequest.findMany({
    where: { status: { in: ["APPROVED", "EXPIRED"] }, createdAt: { gte: startOfYear, lte: endOfYear } },
    select: { price: true, createdAt: true, approvedAt: true },
  });
  const monthlyAdRevenue = Array(12).fill(0);
  let currentMonthAdRevenue = 0;
  revenueRequests.forEach(req => {
    const date = req.approvedAt || req.createdAt;
    const m = new Date(date).getMonth();
    monthlyAdRevenue[m] += req.price;
    if (m === currentMonth) currentMonthAdRevenue += req.price;
  });

  // Hitung Langganan
  const approvedSubscriptions = await prisma.subscriptionRequest.findMany({
    where: { status: "APPROVED", createdAt: { gte: startOfYear, lte: endOfYear } },
    select: { requestedPlan: true, createdAt: true },
  });
  const monthlySubRevenue = Array(12).fill(0);
  let currentMonthSubRevenue = 0;
  approvedSubscriptions.forEach(req => {
    const price = PLAN_PRICES[req.requestedPlan as keyof typeof PLAN_PRICES] || 0;
    const m = new Date(req.createdAt).getMonth();
    monthlySubRevenue[m] += price;
    if (m === currentMonth) currentMonthSubRevenue += price;
  });

  const currentMonthTotalRevenue = currentMonthAdRevenue + currentMonthSubRevenue;
  const monthlyTotalRevenue = monthlyAdRevenue.map((val, idx) => val + monthlySubRevenue[idx]);

  // Hitung Pertumbuhan User per Bulan (Tahun Ini)
  const monthlyUsers = Array(12).fill(0);
  users.forEach(u => {
    const createdYear = new Date(u.createdAt).getFullYear();
    if (createdYear === currentYear) {
      const m = new Date(u.createdAt).getMonth();
      monthlyUsers[m] += 1;
    }
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const adRevenueChartData = monthlyAdRevenue.map((total, index) => ({ name: monthNames[index], total }));
  const subscriptionChartData = monthlySubRevenue.map((total, index) => ({ name: monthNames[index], total }));
  const totalRevenueChartData = monthlyTotalRevenue.map((total, index) => ({ name: monthNames[index], total }));
  const userChartData = monthlyUsers.map((total, index) => ({ name: monthNames[index], total }));

  const activeSponsorsCount = await prisma.sponsoredRequest.count({ where: { status: "APPROVED" } });
  const totalUsers = users.length;

  return (
    <div className="mx-auto max-w-content px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
        <Link href={`/${lang}/admin/suspicious`} className="rounded-md border border-amber-500 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors flex items-center gap-2 w-fit">
          🔍 Deteksi Salah Kategori
        </Link>
      </div>

      {/* TOP CARDS (4 KOLOM) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-forest-700 to-forest-900 p-5 text-white shadow-md">
          <div className="text-sm text-white/70 uppercase tracking-wider font-semibold mb-1">Pendapatan Iklan</div>
          <div className="text-2xl font-bold tabular-nums">Rp {currentMonthAdRevenue.toLocaleString("id-ID")}</div>
        </div>
        
        <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-blue-700 to-blue-900 p-5 text-white shadow-md">
          <div className="text-sm text-white/70 uppercase tracking-wider font-semibold mb-1">Pendapatan Langganan</div>
          <div className="text-2xl font-bold tabular-nums">Rp {currentMonthSubRevenue.toLocaleString("id-ID")}</div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-gradient-to-br from-indigo-600 to-purple-800 p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-white/10 text-8xl">👥</div>
          <div className="text-sm text-indigo-100 uppercase tracking-wider font-semibold mb-1 relative z-10">Total User Terdaftar</div>
          <div className="text-2xl font-bold tabular-nums relative z-10">{totalUsers} <span className="text-base font-normal opacity-80">Akun</span></div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="text-sm text-neutral-500 uppercase tracking-wider font-semibold mb-1">Sponsor Aktif</div>
          <div className="text-2xl font-bold tabular-nums text-forest-700 dark:text-lime-400">{activeSponsorsCount} <span className="text-base text-neutral-400 font-normal">Produk</span></div>
        </div>
      </div>

      <AdminTabs
        subscriptions={pendingSubscriptions}
        companies={companies}
        sponsors={pendingSponsors}
        users={users}
        pendingBanners={pendingBanners} 
        consumerReports={consumerReports} 
        adRevenueChartData={adRevenueChartData}
        currentMonthAdRevenue={currentMonthAdRevenue}
        subscriptionChartData={subscriptionChartData}
        currentMonthSubRevenue={currentMonthSubRevenue}
        totalRevenueChartData={totalRevenueChartData}
        currentMonthTotalRevenue={currentMonthTotalRevenue}
        userChartData={userChartData}
        totalUsers={totalUsers}
        lang={lang}
      />
    </div>
  );
}