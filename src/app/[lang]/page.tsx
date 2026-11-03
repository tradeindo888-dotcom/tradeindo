"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { dict, Locale } from "@/lib/i18n";
import { isCurrentlySponsored } from "@/lib/product-utils";
import HeroCarousel from "@/components/home/HeroCarousel";

const getCategoryIcon = (slug: string) => {
  const iconClass = "w-4 h-4 text-forest-600 dark:text-lime-400 group-hover:text-white transition-colors";
  switch (slug) {
    case "pertanian": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>;
    case "makanan-olahan": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h14a2 2 0 012 2v7z" /></svg>;
    case "furnitur": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    case "tekstil": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>;
    case "kerajinan": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
    case "pakaian-mode": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
    case "kimia": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
    case "mesin": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    case "otomotif": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 17h18M5 17l1.5-6.5h11L19 17M7 10.5V7a2 2 0 012-2h6a2 2 0 012 2v3.5" /></svg>;
    case "peralatan-elektronik": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    case "material-bangunan": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
    case "peralatan-medis": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
    case "perlengkapan-rumah": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
    case "mineral-metal": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
    case "kemasan": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;
    default: return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
  }
};

export default function HomePage() {
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";
  const t = dict[lang as Locale];

  const [isClient, setIsClient] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [spotlightProducts, setSpotlightProducts] = useState<any[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    fetch("/api/categories").then(res => res.json()).then(data => setCategories(data.filter((c: any) => c.featured))).catch(console.error);
    fetch("/api/products?take=100").then(res => res.json()).then(data => setProducts(data)).catch(console.error);
    fetch("/api/products/spotlight").then(res => res.json()).then(data => {
        if (Array.isArray(data)) setSpotlightProducts(data);
      }).catch(console.error);
  }, [isClient]);

  if (!isClient) return null;

  const trackClick = (productId: string) => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, eventType: "CLICK" }),
    }).catch(() => {});
  };

  return (
    <div className="pb-12">
      
      {/* MEMAKSA KETIGA KOLOM MEMILIKI TINGGI YANG SAMA (400px) */}
      <div className="mx-auto max-w-content px-4 py-4 grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-6 items-stretch lg:h-[400px]">
        
        {/* 1. Sidebar Kategori */}
        <aside className="hidden lg:flex flex-col h-full rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden shadow-sm">
          <div className="bg-forest-700 text-white px-4 py-2.5 font-bold text-sm tracking-wide shrink-0">
            KATEGORI
          </div>
          <div className="flex flex-col py-2 flex-1 overflow-y-auto custom-scrollbar">
            {categories.slice(0, 9).map((c) => (
              <Link key={c.id} href={`/${lang}/products?category=${c.slug}`} className="group flex items-center gap-3 p-2.5 mx-2 my-0.5 rounded-lg border border-transparent transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-lime-400 hover:border-forest-700 hover:bg-forest-700 dark:hover:bg-forest-700 dark:hover:border-lime-400">
                <div className="p-1.5 rounded-md bg-neutral-100 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300 dark:bg-neutral-800">{getCategoryIcon(c.slug)}</div>
                <span className="text-sm font-medium text-neutral-700 group-hover:text-white dark:text-neutral-300 dark:group-hover:text-white transition-colors truncate">{lang === "en" ? c.nameEn : c.nameId}</span>
              </Link>
            ))}
          </div>
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 text-center bg-neutral-50 dark:bg-neutral-900/50 shrink-0">
            <Link href={`/${lang}/products`} className="text-xs font-medium text-forest-700 hover:underline dark:text-lime-400">Lihat Semua Kategori →</Link>
          </div>
        </aside>

        {/* 2. Banner Carousel */}
        <div className="w-full h-full">
          <HeroCarousel lang={lang} />
        </div>

        {/* 3. Iklan Kanan */}
        <aside className="hidden lg:flex flex-col h-full rounded-md overflow-hidden bg-blue-600 text-white shadow-sm relative">
           <div className="p-6 flex flex-col h-full relative z-10 justify-center">
              <h3 className="font-display text-2xl font-bold leading-tight mb-2">Promosikan Produk Anda</h3>
              <p className="text-sm text-blue-100 mb-6">Jangkau ribuan pembeli B2B di seluruh Indonesia dengan fitur Sponsorship.</p>
              <Link href={`/${lang}/services`} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2 px-4 rounded-md inline-block w-fit transition-colors shadow-md">
                 Pelajari Selengkapnya
              </Link>
           </div>
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2"></div>
           <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -translate-x-1/2 translate-y-1/2"></div>
        </aside>

      </div>

      {/* SPOTLIGHT SECTION - SUDAH TIDAK ADA MT-4 DAN PY-6 */}
      {spotlightProducts.length > 0 && (
        <section className="bg-gradient-to-r from-amber-500/5 via-amber-400/10 to-amber-500/5 py-6 border-b border-amber-400/30">
          <div className="mx-auto max-w-content px-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">✨</span>
              <h2 className="font-display text-xl font-bold text-forest-900 dark:text-white">{lang === "en" ? "Premium Spotlights" : "Sorotan Utama"}</h2>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {spotlightProducts.map((p) => {
                const isDiscountActive = p.discountLabel && p.discountUntil && new Date(p.discountUntil) > new Date();
                const displayDiscount = isDiscountActive ? (p.discountLabel.includes('%') ? p.discountLabel : `${p.discountLabel}%`) : null;
                return (
                  <Link key={p.id} href={`/${lang}/products/${p.slug}`} onClick={() => trackClick(p.id)} className="group relative overflow-hidden rounded-xl border-2 border-amber-400 ring-2 ring-amber-300 bg-white shadow-lg dark:bg-neutral-900 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:ring-4 hover:border-amber-500 hover:ring-amber-400/50">
                    <div className="absolute top-3 left-3 z-10 rounded-full bg-gradient-to-r from-amber-300 to-yellow-500 px-3 py-1 text-[11px] font-bold text-amber-950 shadow-md border border-amber-200 flex items-center gap-1">👑 {lang === "en" ? "PREMIUM" : "PREMIUM"}</div>
                    {displayDiscount && (
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-bl-lg rounded-tr-lg rounded-tl-sm rounded-br-sm bg-gradient-to-r from-red-600 to-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-red-500/40 transform -rotate-2 group-hover:rotate-0 transition-transform">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>{displayDiscount}
                      </div>
                    )}
                    <div className="aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                      <img src={p.images?.[0]?.url || "https://images.unsplash.com/photo-1587049352847-4d4b1a1d9b51?auto=format&fit=crop&q=80&w=600"} alt={lang === "en" ? p.titleEn : p.titleId} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="p-4 bg-gradient-to-t from-white to-transparent dark:from-neutral-900 dark:to-transparent">
                      <h3 className="font-bold text-base text-forest-900 dark:text-white line-clamp-1 group-hover:text-forest-700 dark:group-hover:text-amber-400 transition-colors">{lang === "en" ? p.titleEn : p.titleId}</h3>
                      <p className="text-sm text-neutral-500 mt-1">{p.company?.name}</p>
                      <div className="mt-3 font-semibold text-forest-700 dark:text-amber-400">{p.priceMin ? `Mulai Rp ${p.priceMin.toLocaleString("id-ID")}` : "Hubungi Supplier"}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* SECTION PRODUK UTAMA */}
      <div className="mx-auto max-w-content px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">{t.featuredProducts}</h2>
          <Link href={`/${lang}/products`} className="text-sm font-medium text-forest-700 hover:underline dark:text-lime-400">{lang === "en" ? "View All" : "Lihat Semua"}</Link>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => {
            const sponsored = isCurrentlySponsored(p);
            const activeRequest = p.sponsoredRequests?.[0];
            const activeTier = activeRequest?.tier;
            const promoLabel = activeRequest?.promoLabel;
            const isHomepage = activeTier === "HOMEPAGE";
            const isCategory = activeTier === "CATEGORY";
            const isDiscountActive = p.discountLabel && p.discountUntil && new Date(p.discountUntil) > new Date();
            const displayDiscount = isDiscountActive ? (p.discountLabel.includes('%') ? p.discountLabel : `${p.discountLabel}%`) : null;
            let cardStyle = "border border-neutral-200 dark:border-neutral-800 hover:ring-2 hover:ring-lime-400 hover:border-forest-700 dark:hover:border-lime-400";
            if (isHomepage || isCategory) {
              cardStyle = "border-2 border-lime-500 ring-2 ring-lime-400 shadow-lg hover:ring-4 hover:border-forest-700 dark:hover:border-lime-400";
            }
            
            return (
              <article key={p.id} data-product-id={p.id} className={`group overflow-hidden rounded-lg bg-white dark:bg-neutral-900 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl ${cardStyle}`}>
                <Link href={`/${lang}/products/${p.slug}`} className="block overflow-hidden relative" onClick={() => trackClick(p.id)}>
                  {displayDiscount && (
                    <div className="absolute top-2 right-2 z-20 flex items-center gap-1 rounded-bl-lg rounded-tr-lg rounded-tl-sm rounded-br-sm bg-gradient-to-r from-red-600 to-rose-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-lg shadow-red-500/40 transform -rotate-2 group-hover:rotate-0 transition-transform">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>{displayDiscount}
                    </div>
                  )}
                  {!displayDiscount && promoLabel && (
                    <div className="absolute top-2 right-2 z-20 rounded-sm bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">{promoLabel}</div>
                  )}
                  <div className="aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-800">
                    <img src={p.images?.[0]?.url || "https://images.unsplash.com/photo-1587049352847-4d4b1a1d9b51?auto=format&fit=crop&q=80&w=400"} alt={lang === "en" ? p.titleEn : p.titleId} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                </Link>
                <div className="p-3">
                  {sponsored && (
                    <span className={`inline-block mb-1 rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${isHomepage ? "bg-amber-400 text-amber-950" : isCategory ? "bg-forest-700 text-white" : "bg-lime-300 text-neutral-900"}`}>
                      {isHomepage ? "👑 PREMIUM" : isCategory ? "✨ SPOTLIGHT" : "⭐ " + (lang === "en" ? "SPONSORED" : "BERSPONSOR")}
                    </span>
                  )}
                  <Link href={`/${lang}/products/${p.slug}`} className="text-sm font-medium group-hover:text-forest-700 dark:group-hover:text-lime-400 line-clamp-2 transition-colors" onClick={() => trackClick(p.id)}>{lang === "en" ? p.titleEn : p.titleId}</Link>
                  <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{p.company?.name}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-neutral-500">MOQ {p.moq} {p.moqUnit}</span>
                    {p.priceMin && <span className="text-sm font-semibold tabular-nums text-forest-700 dark:text-lime-400">Rp {p.priceMin.toLocaleString("id-ID")}+</span>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}