"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { dict, Locale } from "@/lib/i18n";
import { isCurrentlySponsored } from "@/lib/product-utils";

const getCategoryIcon = (slug: string) => {
  // ... (Fungsi ikon Anda tetap sama)
  return <svg className="w-4 h-4 text-forest-600 dark:text-lime-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
};

export default function ProductsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = params.lang === "en" ? "en" : "id";
  const t = dict[lang as Locale];

  const [isClient, setIsClient] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const query = searchParams.get("q") || "";
  const categorySlug = searchParams.get("category") || "";

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    fetch("/api/categories").then(res => res.json()).then(data => setCategories(data)).catch(console.error);

    let url = "/api/products";
    if (query) url += `?q=${encodeURIComponent(query)}`;
    if (categorySlug) url += `${query ? '&' : '?'}category=${encodeURIComponent(categorySlug)}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [isClient, query, categorySlug]);

  useEffect(() => {
    if (loading || products.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const productId = entry.target.getAttribute("data-product-id");
            if (productId) {
              fetch("/api/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, eventType: "IMPRESSION", source: "organic" }),
              }).catch(() => {});
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    const cards = document.querySelectorAll("[data-product-id]");
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [products, loading]);

  if (!isClient || loading) return <div className="py-20 text-center">Memuat produk...</div>;

  const trackClick = (productId: string) => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, eventType: "CLICK" }),
    }).catch(() => {});
  };

  return (
    <div className="mx-auto grid max-w-content gap-6 px-4 py-8 lg:grid-cols-[280px_1fr] items-start">
      
      {/* SIDEBAR KATEGORI */}
      <aside className="lg:sticky lg:top-28">
        <div className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 text-sm font-bold">{t.featuredCategories}</div>
          <div className="flex flex-col gap-2 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto pr-1 custom-scrollbar">
            {categories.map((c) => (
              <Link 
                key={c.id} 
                href={`/${lang}/products?category=${c.slug}`} 
                className="group flex items-center gap-3 p-2.5 rounded-lg border border-transparent transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:ring-2 hover:ring-lime-400 hover:border-forest-700 hover:bg-forest-700 dark:hover:bg-forest-700 dark:hover:border-lime-400"
              >
                <div className="p-1.5 rounded-md bg-neutral-100 group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300 dark:bg-neutral-800">
                  {getCategoryIcon(c.slug)}
                </div>
                <span className="text-sm font-medium text-neutral-700 group-hover:text-white dark:text-neutral-300 dark:group-hover:text-white transition-colors">
                  {lang === "en" ? c.nameEn : c.nameId}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* KONTEN PRODUK */}
      <section>
        <h1 className="font-display text-2xl font-bold">
          {query ? (lang === "en" ? `Results for "${query}"` : `Hasil untuk "${query}"`) : (lang === "en" ? "All Products" : "Semua Produk")}
        </h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {products.length} {lang === "en" ? "products found." : "produk ditemukan."}
        </p>

        {products.length === 0 ? (
          <div className="mt-8 rounded-md border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
            <p className="font-medium">{lang === "en" ? "No products found." : "Belum ada produk yang cocok."}</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((p) => {
              const sponsored = isCurrentlySponsored(p);
              const activeRequest = p.sponsoredRequests?.[0];
              const activeTier = activeRequest?.tier;
              const promoLabel = activeRequest?.promoLabel;
              
              const isHomepage = activeTier === "HOMEPAGE";
              const isCategory = activeTier === "CATEGORY";

              const isDiscountActive = p.discountLabel && p.discountUntil && new Date(p.discountUntil) > new Date();
              const displayDiscount = isDiscountActive 
                ? (p.discountLabel.includes('%') ? p.discountLabel : `${p.discountLabel}%`) 
                : null;

              let cardStyle = "border border-neutral-200 dark:border-neutral-800 hover:ring-2 hover:ring-lime-400 hover:border-forest-700 dark:hover:border-lime-400";
              if (isHomepage || isCategory) {
                cardStyle = "border-2 border-lime-500 ring-2 ring-lime-400 shadow-lg hover:ring-4 hover:border-forest-700 dark:hover:border-lime-400";
              }

              return (
                <article 
                  key={p.id} 
                  data-product-id={p.id}
                  className={`group overflow-hidden rounded-lg bg-white dark:bg-neutral-900 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl ${cardStyle}`}
                >
                  <Link href={`/${lang}/products/${p.slug}`} className="block overflow-hidden relative" onClick={() => trackClick(p.id)}>
                    
                    {displayDiscount && (
                      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 rounded-bl-lg rounded-tr-lg rounded-tl-sm rounded-br-sm bg-gradient-to-r from-red-600 to-rose-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-lg shadow-red-500/40 transform -rotate-2 group-hover:rotate-0 transition-transform">
                        {displayDiscount}
                      </div>
                    )}

                    {!displayDiscount && promoLabel && (
                      <div className="absolute top-2 right-2 z-20 rounded-sm bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                        {promoLabel}
                      </div>
                    )}

                    <div className="aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-800">
                      <img 
                        src={p.images?.[0]?.url || "https://images.unsplash.com/photo-1587049352847-4d4b1a1d9b51?auto=format&fit=crop&q=80&w=400"} 
                        alt={lang === "en" ? p.titleEn : p.titleId} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                    </div>
                  </Link>
                  <div className="p-4">
                    {sponsored && (
                      <span className={`inline-block mb-1 rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${
                        isHomepage ? "bg-amber-400 text-amber-950" :
                        isCategory ? "bg-forest-700 text-white" : 
                        "bg-lime-300 text-neutral-900"
                      }`}>
                        {isHomepage ? "👑 PREMIUM" :
                         isCategory ? "✨ SPOTLIGHT" :
                         "⭐ " + (lang === "en" ? "SPONSORED" : "BERSPONSOR")}
                      </span>
                    )}
                    <Link href={`/${lang}/products/${p.slug}`} className="font-medium group-hover:text-forest-700 dark:group-hover:text-lime-400 line-clamp-2 transition-colors" onClick={() => trackClick(p.id)}>
                      {lang === "en" ? p.titleEn : p.titleId}
                    </Link>
                    <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{p.company?.name}</div>
                    
                    {/* LOGIKA TAMPILAN NEGO DI SINI */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-neutral-500">
                        MOQ {p.moq ? `${p.moq} ${p.moqUnit}` : "Nego"}
                      </span>
                      {p.priceMin ? (
                        <span className="font-semibold tabular-nums text-forest-700 dark:text-lime-400">
                          Rp {p.priceMin.toLocaleString("id-ID")}+
                        </span>
                      ) : (
                        <span className="font-semibold text-forest-700 dark:text-lime-400">
                          {lang === "en" ? "Nego" : "Nego"}
                        </span>
                      )}
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}