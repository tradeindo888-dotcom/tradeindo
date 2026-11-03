import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { ChatButton } from "@/components/ui/ChatButton";
import { dict, Locale } from "@/lib/i18n";
import { isCurrentlySponsored } from "@/lib/product-utils";
import { ProductViewTracker } from "@/components/product/ProductViewTracker";

export default async function ProductDetail({ 
  params 
}: { 
  params: Promise<{ slug: string, lang: string }> 
}) {
  const { slug, lang: rawLang } = await params;
  const lang = rawLang === "en" ? "en" : "id";
  const t = dict[lang as Locale];
  const now = new Date();

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: { 
        company: true, 
        category: true, 
        images: true,
        // TAMBAHKAN INI UNTUK MEMBACA TIER SPONSOR
        sponsoredRequests: {
          where: { status: "APPROVED", expiresAt: { gt: now } },
          select: { tier: true },
          orderBy: { approvedAt: "desc" },
          take: 1,
        }
      },
    }),
    prisma.category.findMany(),
  ]);

  if (!product) notFound();

  const sponsored = isCurrentlySponsored(product);
  const activeTier = product.sponsoredRequests?.[0]?.tier;
  const isHomepage = activeTier === "HOMEPAGE";
  const isCategory = activeTier === "CATEGORY";

  return (
    <div className="mx-auto grid max-w-content gap-6 px-4 py-8 lg:grid-cols-[260px_1fr]">
      
      {/* Tracker untuk mencatat View */}
      <ProductViewTracker
        productId={product.id}
        sponsoredUntil={product.sponsoredUntil?.toISOString() ?? null}
      />

      {/* SIDEBAR KATEGORI (KIRI) */}
      <aside className="space-y-4">
        <div className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-2 text-sm font-semibold">{t.featuredCategories}</div>
          <ul className="space-y-1 text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/${lang}/products?category=${c.slug}`} className="text-neutral-700 hover:text-forest-700 dark:text-neutral-300">
                  {lang === "en" ? c.nameEn : c.nameId}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* KONTEN DETAIL PRODUK (KANAN) */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        
        {/* Kolom Kiri: Gambar & Detail */}
        <div>
          <div className="aspect-[4/3] w-full overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800 mb-6">
            <img
              src={product.images?.[0]?.url || "https://images.unsplash.com/photo-1587049352847-4d4b1a1d9b51?auto=format&fit=crop&q=80&w=800"}
              alt={lang === "en" ? product.titleEn : product.titleId}
              className="h-full w-full object-cover"
            />
          </div>
          
          {/* LOGIKA BADGE DINAMIS */}
          {sponsored && (
            <span className={`inline-block mb-2 rounded-sm px-2 py-1 text-xs font-bold ${
              isHomepage ? "bg-amber-400 text-amber-950" :
              isCategory ? "bg-forest-700 text-white" : 
              "bg-lime-300 text-neutral-900"
            }`}>
              {isHomepage ? "👑 PREMIUM" :
               isCategory ? "✨ SPOTLIGHT" :
               "⭐ " + (lang === "en" ? "SPONSORED" : "BERSPONSOR")}
            </span>
          )}

          <h1 className="font-display text-3xl font-bold">{lang === "en" ? product.titleEn : product.titleId}</h1>
          <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {lang === "en" ? product.category.nameEn : product.category.nameId} · {product.company.city}
          </div>
          <p className="mt-6 text-neutral-700 dark:text-neutral-300">{product.description}</p>
          
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <div className="text-neutral-500">MOQ</div>
              <div className="font-semibold">{product.moq} {product.moqUnit}</div>
            </div>
            <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <div className="text-neutral-500">{lang === "en" ? "Indicative Price" : "Harga indikatif"}</div>
              <div className="font-semibold tabular-nums">
                {product.priceMin ? `Rp ${product.priceMin.toLocaleString("id-ID")}+` : (lang === "en" ? "Contact Supplier" : "Hubungi supplier")}
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Sidebar Supplier */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="text-sm text-neutral-500">Supplier</div>
            
            <div className="mt-2 flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-md bg-forest-700 text-white flex items-center justify-center overflow-hidden">
                {product.company.logoUrl ? (
                  <img src={product.company.logoUrl} alt={product.company.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold">{product.company.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <Link href={`/${lang}/suppliers/${product.company.slug}`} className="block font-semibold hover:underline">
                  {product.company.name}
                </Link>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">{product.company.city}, {product.company.province}</div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <ChatButton
                supplierCompanyId={product.companyId}
                productId={product.id}
                label={lang === "en" ? "Chat Supplier" : "Hubungi Supplier"}
              />
              <Link href={`/${lang}/rfqs/new`}>
                <Button variant="secondary" className="w-full">{lang === "en" ? "Request Quotation" : "Minta Penawaran"}</Button>
              </Link>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}