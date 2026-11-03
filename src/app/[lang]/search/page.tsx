"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

// Pisahkan logika ke komponen terpisah untuk dibungkus Suspense
function SearchResults() {
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = params.lang === "en" ? "en" : "id";
  
  const query = searchParams.get("q") || "";
  
  const [data, setData] = useState<{ products: any[], suppliers: any[], buyers: any[] }>({ products: [], suppliers: [], buyers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [query]);

  if (loading) return <div className="p-16 text-center">Mencari "{query}"...</div>;

  const hasResults = data.products?.length > 0 || data.suppliers?.length > 0 || data.buyers?.length > 0;

  return (
    <div className="mx-auto max-w-content px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-2">
        {lang === "en" ? "Search Results" : "Hasil Pencarian"}
      </h1>
      <p className="text-neutral-600 dark:text-neutral-400 mb-8">
        Menampilkan hasil untuk: <strong className="text-forest-700 dark:text-lime-400">"{query}"</strong>
      </p>

      {!hasResults && (
        <div className="text-center py-16 border border-dashed rounded-lg">
          <span className="text-4xl mb-4 block">🔍</span>
          <p className="text-lg font-semibold">Tidak ada hasil ditemukan.</p>
          <p className="text-sm text-neutral-500">Coba gunakan kata kunci lain.</p>
        </div>
      )}

      {/* SECTION: PRODUK */}
      {data.products?.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold border-b pb-2 mb-4">📦 Produk ({data.products.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {data.products.map((p) => (
              <Link key={p.id} href={`/${lang}/products/${p.slug}`} className="group rounded-lg border bg-white p-3 hover:shadow-lg transition-all dark:border-neutral-800 dark:bg-neutral-900">
                <div className="aspect-square bg-neutral-100 rounded-md overflow-hidden mb-3">
                  <img src={p.images?.[0]?.url || "https://images.unsplash.com/photo-1587049352847-4d4b1a1d9b51?auto=format&fit=crop&q=80&w=400"} alt={p.titleId} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-medium line-clamp-2 text-sm">{lang === "en" ? p.titleEn : p.titleId}</h3>
                <p className="text-xs text-neutral-500 mt-1">{p.company?.name}</p>
                <p className="font-bold text-forest-700 mt-2 text-sm">{p.priceMin ? `Rp ${p.priceMin.toLocaleString("id-ID")}+` : "Hubungi Supplier"}</p>
              </Link>
            ))}
          </div>
          <div className="mt-4 text-right">
            <Link href={`/${lang}/products?q=${query}`} className="text-sm text-forest-700 font-medium hover:underline">Lihat Semua Produk →</Link>
          </div>
        </div>
      )}

      {/* SECTION: SUPPLIER */}
      {data.suppliers?.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold border-b pb-2 mb-4">🏭 Supplier ({data.suppliers.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.suppliers.map((s) => (
              <Link key={s.id} href={`/${lang}/suppliers/${s.slug}`} className="flex items-center gap-4 rounded-lg border bg-white p-4 hover:shadow-md transition-all dark:border-neutral-800 dark:bg-neutral-900">
                <div className="h-12 w-12 rounded bg-forest-700 text-white flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden">
                  {s.logoUrl ? <img src={s.logoUrl} alt={s.name} className="h-full w-full object-cover bg-white" /> : s.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-sm line-clamp-1">{s.name}</h3>
                  <p className="text-xs text-neutral-500">{s.city || "Lokasi tidak diset"}</p>
                  <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded mt-1 inline-block">{s._count?.products || 0} Produk</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* SECTION: BUYER */}
      {data.buyers?.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold border-b pb-2 mb-4">🛒 Buyer ({data.buyers.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.buyers.map((b) => (
              <div key={b.id} className="flex items-center gap-4 rounded-lg border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
                  {b.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-sm line-clamp-1">{b.name}</h3>
                  <p className="text-xs text-neutral-500">{b.city ? `${b.city}, ${b.province}` : "Lokasi tidak diset"}</p>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded mt-1 inline-block">Buyer</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

// Wrapper Suspense agar aman di Next.js 14
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center">Memuat halaman pencarian...</div>}>
      <SearchResults />
    </Suspense>
  );
}