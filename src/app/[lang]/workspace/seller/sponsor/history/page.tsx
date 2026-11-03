"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SponsorshipStatusBadge } from "@/components/sponsorship/SponsorshipStatusBadge";

type SponsorshipRow = {
  id: string;
  status: "PENDING" | "APPROVED" | "EXPIRED" | "REJECTED" | "CANCELLED";
  tier: string;
  durationDays: number;
  price: number;
  createdAt: string;
  expiresAt: string | null;
  expiredAt: string | null;
  rejectedReason: string | null;
  product: { 
    id: string; titleId: string; titleEn: string; slug: string; 
    images: { url: string }[]; 
  };
  metrics: { impressions: number; views: number; chats: number; clicks: number };
};

export default function SponsorshipHistoryPage() {
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";
  const [requests, setRequests] = useState<SponsorshipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // State untuk Modal Panduan
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.key === "Escape") {
        setSelectedImage(null);
        setIsHelpOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    fetch("/api/seller/sponsor/history")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setRequests(d.requests))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-16 text-center">Memuat laporan...</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">{lang === "en" ? "Sponsorship Report" : "Laporan Sponsorship"}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {lang === "en" 
              ? "Track today's performance of your sponsored products. Metrics reset daily at 00:00." 
              : "Pantau performa produk yang dipromosikan hari ini. Metrik akan direset setiap pukul 00:00."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsHelpOpen(true)}
            className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors dark:border-blue-900 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
          >
            ℹ️ {lang === "en" ? "Help" : "Panduan"}
          </button>
          <Link href={`/${lang}/workspace/seller`} className="text-sm text-forest-700 hover:underline dark:text-lime-400 font-medium whitespace-nowrap">
            ← {lang === "en" ? "Back" : "Kembali"}
          </Link>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg bg-neutral-50 dark:bg-neutral-900">
          <p className="text-neutral-500">{lang === "en" ? "No sponsorships yet." : "Belum ada data sponsorship."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const imgUrl = r.product?.images?.[0]?.url;
            const activeTier = r.tier;
            const isHomepage = activeTier === "HOMEPAGE";
            const isCategory = activeTier === "CATEGORY";
            
            const impressions = r.metrics?.impressions || 0;
            const views = r.metrics?.views || 0;
            const chats = r.metrics?.chats || 0;
            const clicks = r.metrics?.clicks || 0;

            const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : "0.0";
            const conversionRate = clicks > 0 ? ((chats / clicks) * 100).toFixed(1) : "0.0";
            const costPerLead = chats > 0 ? Math.round(r.price / chats).toLocaleString("id-ID") : "-";

            return (
              <div 
                key={r.id} 
                className="group rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:ring-2 hover:ring-lime-400 hover:border-forest-700 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/20 dark:hover:border-lime-400"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div 
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 transition-transform duration-300 ${imgUrl ? 'cursor-pointer hover:scale-110' : ''}`}
                      onClick={() => imgUrl && setSelectedImage(imgUrl)}
                    >
                      {imgUrl ? (
                        <img src={imgUrl} alt={r.product.titleId} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400 text-center">No Img</div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Link href={`/${lang}/products/${r.product.slug}`} className="font-semibold text-lg text-neutral-900 dark:text-white group-hover:text-forest-700 dark:group-hover:text-lime-400 transition-colors">
                          {lang === "en" ? r.product.titleEn : r.product.titleId}
                        </Link>
                        <SponsorshipStatusBadge status={r.status} lang={lang} />
                        
                        <span className={`text-[10px] px-2 py-0.5 rounded-sm font-bold ${
                          isHomepage ? "bg-amber-400 text-amber-950" :
                          isCategory ? "bg-forest-700 text-white" : 
                          "bg-lime-300 text-neutral-900"
                        }`}>
                          {isHomepage ? "👑 PREMIUM" : isCategory ? "✨ SPOTLIGHT" : "⭐ STANDARD"}
                        </span>
                      </div>
                      
                      <div className="text-sm text-neutral-500 flex gap-2 items-center flex-wrap">
                        <span>{r.durationDays} {lang === "en" ? "days" : "hari"}</span>
                        <span>•</span>
                        <span>Rp {r.price.toLocaleString("id-ID")}</span>
                        {r.expiresAt && (
                          <>
                            <span>•</span>
                            <span>{lang === "en" ? "Ends" : "Berakhir"}: {new Date(r.expiresAt).toLocaleDateString(lang === "en" ? "en-GB" : "id-ID")}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* METRIK HARIAN */}
                {(r.status === "APPROVED" || r.status === "EXPIRED") && (
                  <div>
                    <div className="text-xs font-semibold text-forest-700 dark:text-lime-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span>📅 {lang === "en" ? "Today's Performance" : "Performa Iklan Hari Ini"}</span>
                    </div>
                    
                    {/* 4 KOTAK UTAMA */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="rounded-lg bg-orange-50/80 p-3 text-center border border-orange-100 dark:bg-orange-900/20 dark:border-orange-900/50">
                        <div className="text-2xl mb-1">📢</div>
                        <div className="text-xl font-bold text-orange-700 dark:text-orange-400">{impressions.toLocaleString("id-ID")}</div>
                        <div className="text-xs font-semibold text-orange-600 dark:text-orange-500">{lang === "en" ? "Impressions" : "Tayangan"}</div>
                      </div>

                      <div className="rounded-lg bg-blue-50/80 p-3 text-center border border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/50">
                        <div className="text-2xl mb-1">👁️</div>
                        <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{views.toLocaleString("id-ID")}</div>
                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-500">{lang === "en" ? "Views" : "Dilihat"}</div>
                      </div>
                      
                      <div className="rounded-lg bg-green-50/80 p-3 text-center border border-green-100 dark:bg-green-900/20 dark:border-green-900/50">
                        <div className="text-2xl mb-1">💬</div>
                        <div className="text-xl font-bold text-green-700 dark:text-green-400">{chats.toLocaleString("id-ID")}</div>
                        <div className="text-xs font-semibold text-green-600 dark:text-green-500">{lang === "en" ? "Chats" : "Chat Masuk"}</div>
                      </div>

                      <div className="rounded-lg bg-purple-50/80 p-3 text-center border border-purple-100 dark:bg-purple-900/20 dark:border-purple-900/50">
                        <div className="text-2xl mb-1">👆</div>
                        <div className="text-xl font-bold text-purple-700 dark:text-purple-400">{clicks.toLocaleString("id-ID")}</div>
                        <div className="text-xs font-semibold text-purple-600 dark:text-purple-500">{lang === "en" ? "Clicks" : "Diklik"}</div>
                      </div>
                    </div>

                    {/* KOTAK INSIGHT */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800">
                      <div className="text-center sm:text-left">
                        <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-0.5 flex items-center justify-center sm:justify-start gap-1">
                          <span>📈</span> CTR (Click Rate)
                        </div>
                        <div className="font-bold text-lg text-forest-700 dark:text-lime-400">{ctr}%</div>
                      </div>
                      
                      <div className="text-center sm:text-left border-t sm:border-t-0 sm:border-l border-neutral-200 dark:border-neutral-700 pt-2 sm:pt-0 sm:pl-3">
                        <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-0.5 flex items-center justify-center sm:justify-start gap-1">
                          <span>🎯</span> {lang === "en" ? "Conversion" : "Konversi"}
                        </div>
                        <div className="font-bold text-lg text-forest-700 dark:text-lime-400">{conversionRate}%</div>
                      </div>

                      <div className="text-center sm:text-left border-t sm:border-t-0 sm:border-l border-neutral-200 dark:border-neutral-700 pt-2 sm:pt-0 sm:pl-3">
                        <div className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-0.5 flex items-center justify-center sm:justify-start gap-1">
                          <span>💰</span> {lang === "en" ? "Cost / Chat" : "Biaya / Chat"}
                        </div>
                        <div className="font-bold text-lg text-forest-700 dark:text-lime-400">
                          {costPerLead !== "-" ? `Rp ${costPerLead}` : "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL PANDUAN (PETUNJUK) */}
      {isHelpOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsHelpOpen(false)}
        >
          <div 
            className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()} // Mencegah modal tertutup saat konten diklik
          >
            <div className="flex items-center justify-between mb-4 border-b border-neutral-200 dark:border-neutral-800 pb-3">
              <h3 className="font-display text-xl font-bold">
                {lang === "en" ? "Report Guide" : "Panduan Laporan"}
              </h3>
              <button 
                onClick={() => setIsHelpOpen(false)}
                className="text-neutral-500 hover:text-red-500 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 dark:bg-orange-900/20 dark:border-orange-900/50">
                <div className="flex items-center gap-2 font-bold text-orange-700 dark:text-orange-400 mb-1">
                  <span className="text-xl">📢</span> {lang === "en" ? "Impressions" : "Tayangan"}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {lang === "en" ? "The number of times your product appears on the buyer's screen (Homepage or Search results)." : "Jumlah berapa kali produk Anda muncul di layar pembeli (Beranda atau Pencarian)."}
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/50">
                <div className="flex items-center gap-2 font-bold text-blue-700 dark:text-blue-400 mb-1">
                  <span className="text-xl">👁️</span> {lang === "en" ? "Views" : "Dilihat"}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {lang === "en" ? "The number of times a buyer entered the product detail page." : "Jumlah berapa kali pembeli masuk ke halaman detail produk Anda."}
                </p>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 dark:bg-purple-900/20 dark:border-purple-900/50">
                <div className="flex items-center gap-2 font-bold text-purple-700 dark:text-purple-400 mb-1">
                  <span className="text-xl">👆</span> {lang === "en" ? "Clicks" : "Diklik"}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {lang === "en" ? "The number of times a buyer clicked your product from the list." : "Jumlah berapa kali pembeli mengklik produk Anda dari daftar."}
                </p>
              </div>

              <div className="bg-green-50 p-3 rounded-lg border border-green-100 dark:bg-green-900/20 dark:border-green-900/50">
                <div className="flex items-center gap-2 font-bold text-green-700 dark:text-green-400 mb-1">
                  <span className="text-xl">💬</span> {lang === "en" ? "Chats" : "Chat Masuk"}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {lang === "en" ? "The number of buyers who contacted you via chat." : "Jumlah pembeli yang menghubungi Anda via chat."}
                </p>
              </div>

              <div className="bg-neutral-100 p-3 rounded-lg border border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700">
                <div className="flex items-center gap-2 font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  <span className="text-xl">📈</span> CTR (Click-Through Rate)
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {lang === "en" ? "The ratio of clicks to impressions. Example: 100 impressions with 5 clicks = 5.0% CTR. Shows how attractive your product image is." : "Rasio klik dibandingkan tayangan. Contoh: 100 tayangan dengan 5 klik = 5.0% CTR. Menunjukkan seberapa menarik gambar produk Anda."}
                </p>
              </div>

              <div className="bg-neutral-100 p-3 rounded-lg border border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700">
                <div className="flex items-center gap-2 font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  <span className="text-xl">🎯</span> {lang === "en" ? "Conversion" : "Konversi"}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {lang === "en" ? "The ratio of chats to clicks. Example: 10 clicks resulting in 2 chats = 20% Conversion. Shows if your product page and price are convincing." : "Rasio chat dibandingkan klik. Contoh: 10 klik menghasilkan 2 chat = 20% Konversi. Menunjukkan apakah halaman dan harga produk Anda meyakinkan."}
                </p>
              </div>

              <div className="bg-neutral-100 p-3 rounded-lg border border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700">
                <div className="flex items-center gap-2 font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  <span className="text-xl">💰</span> {lang === "en" ? "Cost per Chat" : "Biaya / Chat"}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {lang === "en" ? "The ad cost to get 1 chat. Calculated by dividing the package price by total chats. Lower is better." : "Biaya iklan untuk mendapatkan 1 chat. Dihitung dengan membagi harga paket dengan total chat. Semakin kecil angkanya, semakin untung."}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-center">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="rounded-md bg-forest-700 px-6 py-2 text-sm font-medium text-white hover:bg-forest-500 transition-colors"
              >
                {lang === "en" ? "Got it" : "Mengerti"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedImage} alt="Gambar Produk Besar" className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl" />
            <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }} className="absolute -top-10 right-0 text-white hover:text-gray-300 bg-black/50 hover:bg-black/70 rounded-full h-8 w-8 flex items-center justify-center text-xl font-bold transition-colors">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}