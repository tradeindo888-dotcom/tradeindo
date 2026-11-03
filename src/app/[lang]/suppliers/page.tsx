import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { dict, Locale } from "@/lib/i18n";

export default async function SuppliersPage({ params }: { params: { lang: string } }) {
  const lang = params.lang === "en" ? "en" : "id";
  const t = dict[lang as Locale];

  const suppliers = await prisma.company.findMany({
    where: { type: { in: ["MANUFACTURER", "DISTRIBUTOR", "EXPORTER"] } },
    include: { _count: { select: { products: true } } },
    orderBy: { verificationStatus: "asc" },
  });

  return (
    <div>
      <div className="mx-auto max-w-content px-4 py-8">
        <h1 className="font-display text-2xl font-bold">{lang === "en" ? "Supplier Directory" : "Direktori Supplier"}</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          {lang === "en" ? "Find trusted manufacturers, distributors, and exporters." : "Temukan produsen, distributor, dan eksportir terpercaya."}
        </p>
        
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((s) => (
            <Link
              key={s.id}
              href={`/${lang}/suppliers/${s.slug}`}
              className={`
                group relative z-0 flex flex-col
                rounded-xl border-2 border-neutral-200 bg-white p-5 
                dark:border-neutral-800 dark:bg-neutral-900
                transition-all duration-300 ease-out
                hover:-translate-y-3 hover:scale-[1.02] hover:z-10
                hover:shadow-2xl
                hover:ring-4 hover:ring-lime-400
                hover:border-forest-700 dark:hover:border-lime-400
              `}
            >
              <div className="flex items-start gap-4">
                {/* Logo / Avatar Inisial */}
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-forest-700 text-white font-bold text-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
                  {s.logoUrl ? (
                    <img src={s.logoUrl} alt={s.name} className="h-full w-full object-cover" />
                  ) : (
                    s.name.slice(0, 2).toUpperCase()
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-neutral-900 dark:text-white group-hover:text-forest-700 dark:group-hover:text-lime-400 transition-colors line-clamp-1">
                    {s.name}
                  </div>
                  
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {s.verificationStatus === "VERIFIED" && (
                      <span className="rounded-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-1.5 py-0.5 text-[10px] font-bold">
                        ✓ {lang === "en" ? "Verified" : "Terverifikasi"}
                      </span>
                    )}
                    <span className="rounded-sm bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                      {s._count.products} {lang === "en" ? "Products" : "Produk"}
                    </span>
                    {s.exportCapability && (
                      <span className="rounded-sm bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 text-[10px] font-bold">
                        {lang === "en" ? "Export Ready" : "Melayani Ekspor"}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {[s.city, s.province].filter(Boolean).join(", ") || (lang === "en" ? "Location not set" : "Lokasi belum diatur")}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          {suppliers.length === 0 && (
            <div className="col-span-full rounded-md border border-dashed p-8 text-center text-neutral-500">
              {lang === "en" ? "No suppliers registered yet." : "Belum ada supplier terdaftar."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}