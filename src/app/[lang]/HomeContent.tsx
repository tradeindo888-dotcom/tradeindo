"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { dict, Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

// FUNGSI UNTUK MENAMPILKAN IKON KATEGORI
const getCategoryIcon = (slug: string) => {
  const iconClass = "w-5 h-5 text-forest-600 dark:text-lime-400 group-hover:text-white transition-colors";
  
  switch (slug) {
    case "pertanian": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>;
    case "makanan-olahan": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h14a2 2 0 012 2v7zM16 3v4M8 3v4m0 4h.01M12 11h.01M16 11h.01" /></svg>;
    case "furnitur": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    case "tekstil": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
    case "kerajinan": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
    case "pakaian-mode": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
    case "kimia": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
    case "mesin": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    case "peralatan-elektronik": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    case "material-bangunan": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
    case "peralatan-medis": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
    case "perlengkapan-rumah": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    case "mineral-metal": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
    case "kemasan": return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
    default: return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
  }
};

export default function HomeContent() {
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";
  const t = dict[lang as Locale];

  const [isClient, setIsClient] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => setCategories(data.filter((c: any) => c.featured)))
      .catch(console.error);

    fetch("/api/products")
      .then(res => res.json())
      .then(data => setProducts(data.slice(0, 6)))
      .catch(console.error);
  }, [isClient]);

  if (!isClient) return null;

  return (
    <div>
      {/* HERO SECTION */}
      <section className="bg-forest-900 text-white">
        <div className="mx-auto max-w-content px-4 py-16">
          <h1 className="max-w-2xl font-display text-3xl font-bold leading-tight sm:text-5xl">{t.heroTitle}</h1>
          <p className="mt-4 max-w-xl text-white/80">{t.heroSubtitle}</p>
          <form action={`/${lang}/products`} className="mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">
            <input name="q" placeholder={t.searchPlaceholder} className="h-12 flex-1 rounded-md px-4 text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400" />
            <Button type="submit" variant="accent" size="lg">{t.searchBtn}</Button>
          </form>
        </div>
      </section>

      {/* MAIN CONTENT: KATEGORI KIRI, PRODUK KANAN */}
      <div className="mx-auto max-w-content px-4 py-12 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
        
        {/* SIDEBAR KATEGORI (KIRI) */}
        <aside>
          <h2 className="mb-4 font-display text-xl font-bold">{t.featuredCategories}</h2>
          <div className="flex flex-col gap-2">
            {categories.map((c) => (
              <Link 
                key={c.id} 
                href={`/${lang}/products?category=${c.slug}`} 
                className="group flex items-center gap-3 p-3 rounded-lg border border-neutral-200 bg-white hover:bg-forest-700 hover:border-forest-700 transition-all duration-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-forest-700"
              >
                <div className="p-2 rounded-md bg-neutral-100 group-hover:bg-white/10 transition-colors dark:bg-neutral-800">
                  {getCategoryIcon(c.slug)}
                </div>
                <span className="text-sm font-medium text-neutral-800 group-hover:text-white dark:text-neutral-200 transition-colors">
                  {lang === "en" ? c.nameEn : c.nameId}
                </span>
              </Link>
            ))}
          </div>
        </aside>

        {/* PRODUK PILIHAN (KANAN) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">{t.featuredProducts}</h2>
            <Link href={`/${lang}/products`} className="text-sm font-medium text-forest-700 hover:underline dark:text-lime-400">
              {lang === "en" ? "View All" : "Lihat Semua"}
            </Link>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((p) => (
              <article key={p.id} className="group overflow-hidden rounded-md border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 transition-shadow hover:shadow-md">
                <Link href={`/${lang}/products/${p.slug}`} className="block">
                  <div className="aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-800">
                    <img src={p.images?.[0]?.url || "https://images.unsplash.com/photo-1587049352847-4d4b1a1d9b51?auto=format&fit=crop&q=80&w=400"} alt={p.titleId} className="h-full w-full object-cover" />
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/${lang}/products/${p.slug}`} className="font-medium group-hover:text-forest-700 dark:group-hover:text-lime-400 line-clamp-2">
                    {lang === "en" ? p.titleEn : p.titleId}
                  </Link>
                  <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{p.company?.name}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-neutral-500">MOQ {p.moq} {p.moqUnit}</span>
                    {p.priceMin && <span className="font-semibold tabular-nums text-forest-700 dark:text-lime-400">Rp {p.priceMin.toLocaleString("id-ID")}+</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}