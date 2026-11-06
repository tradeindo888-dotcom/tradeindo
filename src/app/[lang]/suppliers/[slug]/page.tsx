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

  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      products: {
        where: { status: "ACTIVE" },
        include: { 
          images: true,
          sponsoredRequests: {
            where: { status: "APPROVED", expiresAt: { gt: now } },
            select: { tier: true },
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
      <ProfileViewTracker supplierCompanyId={company.id} />

      <div className="rounded-md border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white overflow-hidden dark:border-neutral-700">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="h-full w-full object-contain p-2" />
            ) : (
              <span className="text-2xl font-bold text-forest-700">{company.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold">{company.name}</h1>
              {company.verificationStatus === "VERIFIED" && (
                <span className="rounded-sm bg-forest-700 px-2 py-0.5 text-xs font-medium text-white">
                  ✓ {lang === "en" ? "Verified" : "Terverifikasi"}
                </span>
              )}
            </div>
            <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {company.type} · {[company.city, company.province].filter(Boolean).join(", ")}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl font-bold mb-4">{lang === "en" ? "Product Catalog" : "Katalog Produk"} ({company.products.length})</h2>
        {company.products.length === 0 ? (
          <p className="text-sm text-neutral-500">{lang === "en" ? "This supplier has no active products." : "Supplier ini belum memiliki produk aktif."}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {company.products.map((p) => {
              const sponsored = isCurrentlySponsored(p);
              const activeTier = p.sponsoredRequests?.[0]?.tier;
              const isHomepage = activeTier === "HOMEPAGE";
              const isCategory = activeTier === "CATEGORY";
              
              return (
                <article 
                  key={p.id} 
                  className={`group overflow-hidden rounded-lg bg-white dark:bg-neutral-900 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl ${
                    isHomepage || isCategory 
                      ? "border-2 border-lime-500 ring-2 ring-lime-400 shadow-lg hover:ring-4 hover:border-forest-700 dark:hover:border-lime-400" 
                      : "border border-neutral-200 dark:border-neutral-800 hover:ring-2 hover:ring-lime-400 hover:border-forest-700 dark:hover:border-lime-400"
                  }`}
                >
                  <Link href={`/${lang}/products/${p.slug}`} className="block overflow-hidden">
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
                        {isHomepage ? "👑 PREMIUM" : isCategory ? "✨ SPOTLIGHT" : "⭐ " + (lang === "en" ? "SPONSORED" : "BERSPONSOR")}
                      </span>
                    )}
                    <Link href={`/${lang}/products/${p.slug}`} className="font-medium group-hover:text-forest-700 dark:group-hover:text-lime-400 line-clamp-2 transition-colors">
                      {lang === "en" ? p.titleEn : p.titleId}
                    </Link>
                    
                    {/* LOGIKA NEGO DI PROFIL SUPPLIER */}
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