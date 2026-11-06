import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isCurrentlySponsored } from "@/lib/product-utils";
import { ProfileViewTracker } from "@/components/supplier/ProfileViewTracker";

export default async function SupplierProfile({ 
  params 
}: { 
  params: Promise<{ slug: string, lang: string }> 
}) {
  const { slug, lang: rawLang } = await params;
  const lang = rawLang === "en" ? "en" : "id";
  const now = new Date();

  // Mengambil data perusahaan beserta produk-produknya
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      products: {
        where: { status: "ACTIVE" },
        include: { 
          images: true,
          sponsoredRequests: {
            where: { status: "APPROVED", expiresAt: { gt: now } },
            select: { tier: true, promoLabel: true },
            orderBy: { approvedAt: "desc" },
            take: 1,
          }
        },
        orderBy: [
          { sponsoredUntil: { sort: "desc", nulls: "last" } },
          { createdAt: "desc" }
        ]
      }
    }
  });

  if (!company) notFound();

  return (
    <div className="mx-auto max-w-content px-4 py-8">
      {/* Tracker untuk mencatat kunjungan profil */}
      <ProfileViewTracker supplierCompanyId={company.id} />

      {/* =========================================
          HEADER PROFIL PERUSAHAAN
      ========================================= */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          
          {/* Logo Perusahaan */}
          <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white overflow-hidden dark:border-neutral-700">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="h-full w-full object-contain p-2" />
            ) : (
              <span className="text-3xl font-bold text-forest-700">{company.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>

          {/* Info Utama */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">
                {company.name}
              </h1>
              {company.verificationStatus === "VERIFIED" && (
                <span className="rounded-full bg-forest-700 px-3 py-1 text-xs font-bold text-white shadow-sm">
                  ✓ {lang === "en" ? "Verified" : "Terverifikasi"}
                </span>
              )}
            </div>
            
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <span className="capitalize bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded font-medium">
                {company.type.replace(/_/g, " ").toLowerCase()}
              </span>
              <span>•</span>
              <span>{[company.city, company.province].filter(Boolean).join(", ")}</span>
            </div>

            {company.exportCapability && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-1 text-sm text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-400 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {lang === "en" ? "Capable of Export" : "Mampu Melayani Ekspor"}
              </div>
            )}
          </div>
        </div>

        {/* Tentang Perusahaan */}
        <div className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <h2 className="text-lg font-bold mb-3 text-neutral-900 dark:text-white">
            {lang === "en" ? "About Company" : "Tentang Perusahaan"}
          </h2>
          <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
            {company.description || (lang === "en" ? "No description provided." : "Belum ada deskripsi profil perusahaan.")}
          </p>
        </div>

        {/* Info Detail (Grid) */}
        <div className="mt-6 border-t border-neutral-200 pt-6 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="text-neutral-500 mb-1">{lang === "en" ? "Year Established" : "Tahun Berdiri"}</div>
            <div className="font-semibold text-neutral-900 dark:text-white">{company.yearEstablished || "-"}</div>
          </div>
          
          <div>
            <div className="text-neutral-500 mb-1">Website</div>
            <div className="font-semibold text-neutral-900 dark:text-white">
              {company.website ? (
                <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-forest-700 hover:underline dark:text-lime-400 truncate block">
                  {company.website.replace(/^https?:\/\//, '')}
                </a>
              ) : "-"}
            </div>
          </div>

          <div>
            <div className="text-neutral-500 mb-1">{lang === "en" ? "Phone" : "Telepon"}</div>
            <div className="font-semibold text-neutral-900 dark:text-white">{company.phone || "-"}</div>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <div className="text-neutral-500 mb-1">{lang === "en" ? "Address" : "Alamat Lengkap"}</div>
            <div className="font-semibold text-neutral-900 dark:text-white">{company.address || "-"}</div>
          </div>
        </div>
      </div>

      {/* =========================================
          KATALOG PRODUK
      ========================================= */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-neutral-900 dark:text-white">
            {lang === "en" ? "Product Catalog" : "Katalog Produk"} 
            <span className="ml-2 text-sm font-normal text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
              {company.products.length} Produk
            </span>
          </h2>
        </div>

        {company.products.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-xl bg-neutral-50 dark:bg-neutral-900/50 dark:border-neutral-800">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-neutral-500 font-medium">
              {lang === "en" ? "This supplier has no active products." : "Supplier ini belum memiliki produk aktif."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {company.products.map((p) => {
              const sponsored = isCurrentlySponsored(p);
              const activeTier = p.sponsoredRequests?.[0]?.tier;
              const promoLabel = p.sponsoredRequests?.[0]?.promoLabel;
              const isHomepage = activeTier === "HOMEPAGE";
              const isCategory = activeTier === "CATEGORY";
              
              const isDiscountActive = p.discountLabel && p.discountUntil && new Date(p.discountUntil) > new Date();
              const displayDiscount = isDiscountActive ? (p.discountLabel.includes('%') ? p.discountLabel : `${p.discountLabel}%`) : null;

              let cardStyle = "border border-neutral-200 dark:border-neutral-800 hover:ring-2 hover:ring-lime-400 hover:border-forest-700 dark:hover:border-lime-400";
              if (isHomepage || isCategory) {
                cardStyle = "border-2 border-lime-500 ring-2 ring-lime-400 shadow-lg hover:ring-4 hover:border-forest-700 dark:hover:border-lime-400";
              }

              return (
                <article 
                  key={p.id} 
                  className={`group overflow-hidden rounded-xl bg-white dark:bg-neutral-900 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl ${cardStyle}`}
                >
                  <Link href={`/${lang}/products/${p.slug}`} className="block overflow-hidden relative">
                    {/* Badge Diskon */}
                    {displayDiscount && (
                      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 rounded-bl-lg rounded-tr-lg rounded-tl-sm rounded-br-sm bg-gradient-to-r from-red-600 to-rose-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-lg shadow-red-500/40 transform -rotate-2 group-hover:rotate-0 transition-transform">
                        {displayDiscount}
                      </div>
                    )}
                    {/* Badge Promo Label */}
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
                    {/* Badge Sponsor */}
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
                    
                    <Link href={`/${lang}/products/${p.slug}`} className="font-semibold text-neutral-900 dark:text-white group-hover:text-forest-700 dark:group-hover:text-lime-400 line-clamp-2 transition-colors">
                      {lang === "en" ? p.titleEn : p.titleId}
                    </Link>
                    
                    {/* Harga & MOQ (Logika Nego) */}
                    <div className="mt-3 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800 pt-3">
                      <span className="text-xs text-neutral-500">
                        MOQ {p.moq ? `${p.moq} ${p.moqUnit}` : "Nego"}
                      </span>
                      {p.priceMin ? (
                        <span className="text-sm font-bold text-forest-700 dark:text-lime-400">
                          Rp {p.priceMin.toLocaleString("id-ID")}+
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-forest-700 dark:text-lime-400">
                          Nego
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}