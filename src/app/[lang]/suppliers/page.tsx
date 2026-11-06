import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { dict, Locale } from "@/lib/i18n";

// Memaksa Next.js untuk selalu mengambil data terbaru (tanpa cache)
export const dynamic = "force-dynamic";

export default async function SuppliersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = rawLang === "en" ? "en" : "id";
  const t = dict[lang as Locale];

  // PERBAIKAN: Ambil semua perusahaan yang BUKAN Buyer (termasuk Penyedia Jasa & Industri)
  const suppliers = await prisma.company.findMany({
    where: { 
      type: { 
        not: "BUYER" 
      } 
    },
    include: { 
      _count: { select: { products: true } } 
    },
    // Urutkan: Yang sudah VERIFIED tampil paling atas, lalu yang terbaru
    orderBy: [
      { verificationStatus: "desc" }, 
      { createdAt: "desc" }
    ],
  });

  return (
    <div className="mx-auto max-w-content px-4 py-8">
      <h1 className="font-display text-2xl font-bold">
        {lang === "en" ? "Supplier Directory" : "Direktori Supplier"}
      </h1>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        {lang === "en" 
          ? "Find trusted manufacturers, distributors, and exporters." 
          : "Temukan produsen, distributor, eksportir, penyedia jasa, dan industri terpercaya."}
      </p>
      
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((s) => (
          <article 
            key={s.id} 
            // MENAMBAHKAN EFEK HOVER TERANGKAT & LIME GREEN DI SINI
            className="group rounded-md border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:ring-4 hover:ring-lime-400 hover:border-forest-700 dark:hover:border-lime-400"
          >
            <div className="flex items-start gap-4">
              {/* Logo atau Inisial */}
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-forest-700 text-white font-bold overflow-hidden transition-transform duration-300 group-hover:scale-110">
                {s.logoUrl ? (
                  <img src={s.logoUrl} alt={s.name} className="h-full w-full object-cover" />
                ) : (
                  s.name.slice(0, 2).toUpperCase()
                )}
              </div>

              <div className="min-w-0">
                {/* Nama Perusahaan */}
                <Link 
                  href={`/${lang}/suppliers/${s.slug}`} 
                  className="font-semibold hover:underline line-clamp-1 group-hover:text-forest-700 dark:group-hover:text-lime-400 transition-colors"
                >
                  {s.name}
                </Link>
                
                {/* Badges */}
                <div className="mt-1 flex flex-wrap gap-1">
                  {s.verificationStatus === "VERIFIED" && (
                    <span className="rounded-sm bg-forest-700 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      {lang === "en" ? "✓ Verified" : "✓ Terverifikasi"}
                    </span>
                  )}
                  <span className="rounded-sm bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {s._count.products} {lang === "en" ? "Products" : "Produk"}
                  </span>
                  {/* Label Tipe Bisnis */}
                  <span className="rounded-sm bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 text-[10px] font-medium capitalize">
                    {s.type.replace(/_/g, " ").toLowerCase()}
                  </span>
                </div>

                {/* Lokasi */}
                <div className="mt-2 text-xs text-neutral-500">
                  {[s.city, s.province].filter(Boolean).join(", ") || (lang === "en" ? "Location not set" : "Lokasi belum diatur")}
                </div>
              </div>
            </div>
          </article>
        ))}

        {/* Tampilan jika kosong */}
        {suppliers.length === 0 && (
          <div className="col-span-full rounded-md border border-dashed p-8 text-center text-neutral-500">
            {lang === "en" ? "No suppliers registered yet." : "Belum ada supplier terdaftar."}
          </div>
        )}
      </div>
    </div>
  );
}