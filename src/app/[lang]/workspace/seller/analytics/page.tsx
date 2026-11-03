"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";

const COLORS = ["#14532D", "#A3E635"];

// FUNGSI UNTUK MENAMPILKAN PERSENTASE DI TENGAH PIE CHART
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent === 0) return null;

  return (
    <text 
      x={x} 
      y={y} 
      fill="#ef4444"
      textAnchor="middle" 
      dominantBaseline="central" 
      fontSize={14} 
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function AnalyticsPage() {
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/seller/analytics?days=${dateRange}`)
      .then((res) => res.json())
      .then((d) => { 
        setData(d); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, [dateRange]);

  if (loading) return <div className="p-16 text-center">Memuat analitik lanjutan...</div>;
  
  if (!data || data.error) {
    return (
      <div className="p-16 text-center text-red-500">
        <p className="font-bold mb-2">Gagal memuat data analitik.</p>
        <p className="text-sm">{data?.error || "Terjadi kesalahan sistem."}</p>
        <Link href={`/${lang}/workspace/seller`} className="text-forest-700 underline mt-4 inline-block">Kembali</Link>
      </div>
    );
  }

  const f = data.funnelData;
  const rawViewRate = f.impressions > 0 ? (f.views / f.impressions) * 100 : 0;
  const rawChatRate = f.views > 0 ? (f.chats / f.views) * 100 : 0;

  const viewRate = Math.min(100, rawViewRate).toFixed(1);
  const chatRate = Math.min(100, rawChatRate).toFixed(1);
  const viewBarWidth = Math.max(10, Math.min(100, rawViewRate));
  const chatBarWidth = Math.max(10, Math.min(100, rawChatRate));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">📈 {lang === "en" ? "Advanced Analytics" : "Analitik Lanjutan"}</h1>
          <p className="text-sm text-neutral-500 mt-1">{lang === "en" ? `${dateRange}-day deep insights for your business.` : `Wawasan mendalam ${dateRange} hari terakhir untuk bisnis Anda.`}</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/api/seller/analytics/export" className="rounded-md bg-forest-700 px-4 py-2 text-sm font-medium text-white hover:bg-forest-500 transition-colors flex items-center gap-2 shadow-sm">
            📥 Export CSV
          </a>
          <Link href={`/${lang}/workspace/seller`} className="text-sm text-forest-700 hover:underline dark:text-lime-400 font-medium whitespace-nowrap">
            ← Kembali
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2 rounded-xl border bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <h2 className="font-bold text-lg">Tren Pengunjung & Klik</h2>
            <div className="flex flex-wrap gap-1">
              {[7, 15, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDateRange(d)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    dateRange === d 
                      ? "bg-forest-700 text-white shadow-sm" 
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                  }`}
                >
                  {d} H
                </button>
              ))}
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(val) => val.slice(5)} minTickGap={20} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" name="Dilihat" stroke="#14532D" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="clicks" name="Diklik" stroke="#A3E635" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="font-bold text-lg mb-4">Sumber Kunjungan</h2>
          <div className="h-[250px] w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data.sourceChartData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomizedLabel}
                >
                  {data.sourceChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="font-bold text-lg mb-4">Corong Penjualan</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Tayangan</span>
                <span>{f.impressions.toLocaleString("id-ID")}</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-8 flex items-center justify-center text-blue-800 text-xs font-bold" style={{ width: '100%' }}>100%</div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Dilihat</span>
                <span>{f.views.toLocaleString("id-ID")} ({viewRate}%)</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-8 flex items-center justify-center text-blue-900 text-xs font-bold" style={{ width: `${viewBarWidth}%` }}>{viewRate}%</div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">Chat Masuk</span>
                <span>{f.chats.toLocaleString("id-ID")} ({chatRate}%)</span>
              </div>
              <div className="w-full bg-blue-400 rounded-full h-8 flex items-center justify-center text-white text-xs font-bold" style={{ width: `${chatBarWidth}%` }}>{chatRate}%</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="font-bold text-lg mb-4">⏰ Jam Sibuk Pembeli</h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="views" fill="#14532D" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="font-bold text-lg mb-4">🔥 Top 5 Produk Yang Ditanya</h2>
          <div className="space-y-4">
            {data.topProducts.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-forest-700 text-white flex items-center justify-center text-xs font-bold">{idx + 1}</div>
                  <span className="font-medium text-sm line-clamp-1">{p.title}</span>
                </div>
                <div className="text-sm font-semibold text-forest-700 dark:text-lime-400">{p.chats} Chat</div>
              </div>
            ))}
            {data.topProducts.length === 0 && <p className="text-sm text-neutral-500">Belum ada data.</p>}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          {/* PERUBAHAN TEKS JUDUL DI SINI */}
          <h2 className="font-bold text-lg mb-4">📍 Asal Customer (Melihat Produk)</h2>
          <div className="space-y-4">
            {data.topProvinces.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="font-medium text-sm">{p.province}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-neutral-100 rounded-full overflow-hidden dark:bg-neutral-800">
                    <div className="h-full bg-lime-400" style={{ width: `${(p.count / data.topProvinces[0].count) * 100}%` }}></div>
                  </div>
                  <span className="text-xs font-semibold w-8 text-right">{p.count}</span>
                </div>
              </div>
            ))}
            {data.topProvinces.length === 0 && <p className="text-sm text-neutral-500">Belum ada data lokasi.</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-amber-100 p-5 shadow-sm dark:from-amber-900/20 dark:to-amber-900/10 border-amber-200 dark:border-amber-800">
          <h2 className="font-bold text-lg mb-2 text-amber-900 dark:text-amber-400">🏆 Peringkat Kategori</h2>
          <div className="text-4xl font-black text-amber-600 mb-1">{data.benchmark.rank}</div>
          <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">di kategori <strong>{data.benchmark.categoryName}</strong></p>
          <p className="text-xs text-amber-700 dark:text-amber-300">Rata-rata view kompetitor: {data.benchmark.avgViews} kali/bulan.</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="font-bold text-lg mb-4">🏢 Profil vs Produk</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Dilihat Produk</span>
              <span className="font-bold text-forest-700 dark:text-lime-400">{data.profileVsProduct.product}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Dilihat Profil</span>
              <span className="font-bold text-blue-600">{data.profileVsProduct.profile}</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-2 mt-2 flex">
              <div className="bg-forest-700 h-full rounded-l-full" style={{ width: `${(data.profileVsProduct.product / Math.max(1, data.profileVsProduct.product + data.profileVsProduct.profile)) * 100}%` }}></div>
              <div className="bg-blue-500 h-full rounded-r-full" style={{ width: `${(data.profileVsProduct.profile / Math.max(1, data.profileVsProduct.product + data.profileVsProduct.profile)) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="font-bold text-lg mb-4">🔍 Kata Kunci Populer</h2>
          <div className="flex flex-wrap gap-2">
            {data.keywords.map((k: any, idx: number) => (
              <span key={idx} className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full text-xs font-medium border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">
                {k.word} <span className="text-forest-700 dark:text-lime-400 font-bold ml-1">({k.count})</span>
              </span>
            ))}
            {data.keywords.length === 0 && <p className="text-sm text-neutral-500">Belum ada data.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}