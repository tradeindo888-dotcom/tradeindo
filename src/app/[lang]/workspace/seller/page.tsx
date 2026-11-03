"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { isCurrentlySponsored } from "@/lib/product-utils";
import { toast } from "sonner";

export default function SellerWorkspace() {
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";
  
  const [products, setProducts] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [expiringSponsorships, setExpiringSponsorships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // STATE UNTUK MODAL DISKON
  const [promoProduct, setPromoProduct] = useState<any>(null);
  const [promoLabel, setPromoLabel] = useState("");
  const [promoDays, setPromoDays] = useState(3);
  const [savingPromo, setSavingPromo] = useState(false);

  const fetchData = async () => {
    const res = await fetch("/api/seller/dashboard", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
      setCompany(data.company);
      setExpiringSponsorships(data.expiringSponsorships || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function handleDeleteProduct(id: string) {
    if (!confirm(lang === "en" ? "Delete this product?" : "Hapus produk ini?")) return;
    toast.promise(fetch(`/api/seller/products/${id}`, { method: "DELETE" }), {
      loading: "Menghapus...",
      success: () => { fetchData(); return "Produk dihapus!"; },
      error: "Gagal menghapus.",
    });
  }

  async function handleSavePromo(e: React.FormEvent) {
    e.preventDefault();
    if (!promoProduct) return;
    setSavingPromo(true);
    try {
      const res = await fetch(`/api/seller/products/${promoProduct.id}/discount`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discountLabel: promoLabel, durationDays: promoDays }),
      });
      if (res.ok) {
        toast.success(lang === "en" ? "Promo updated!" : "Promo berhasil diatur!");
        setPromoProduct(null);
        fetchData();
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error(lang === "en" ? "Failed to update promo." : "Gagal mengatur promo.");
    } finally {
      setSavingPromo(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Memuat data...</div>;

  const isPremium = company?.plan !== "FREE";
  const hasSponsoredProduct = products.some((p) => isCurrentlySponsored(p));

  // LOGIKA BATAS PAKET & JUMLAH PRODUK AKTIF
  const planLimit = company?.plan === "FREE" ? 10 : company?.plan === "PRO" ? 100 : 500;
  const activeProductsCount = products.filter((p) => p.status === "ACTIVE").length;
  const isLimitReached = activeProductsCount >= planLimit;

  // LOGIKA BANNER PERINGATAN PAKET LANGGANAN
  const renderPlanBanner = () => {
    if (!company?.planExpiresAt || company?.plan === "FREE") return null;
    const now = new Date();
    const expiresAt = new Date(company.planExpiresAt);
    const diffTime = now.getTime() - expiresAt.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const graceDays = company.plan === "PRO" ? 7 : company.plan === "PREMIUM" ? 14 : 30;

    if (diffDays >= 0) {
      if (diffDays >= graceDays) {
        return (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 flex items-start gap-3 shadow-sm dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300">
            <svg className="w-6 h-6 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{lang === "en" ? "Your plan has completely expired!" : "Paket Anda telah berakhir sepenuhnya!"}</h3>
              <p className="text-sm mt-1">{lang === "en" ? "Your grace period is over. The system will automatically downgrade your plan to FREE." : "Masa tenggang Anda telah habis. Sistem akan otomatis menurunkan paket Anda ke FREE."}</p>
              <Link href={`/${lang}/pricing`} className="inline-block mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors">{lang === "en" ? "Renew Now" : "Perpanjang Sekarang"}</Link>
            </div>
          </div>
        );
      } else {
        return (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 flex items-start gap-3 shadow-sm dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300">
            <svg className="w-6 h-6 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{lang === "en" ? "Your plan has expired!" : "Paket Anda telah berakhir!"}</h3>
              <p className="text-sm mt-1">{lang === "en" ? `You are currently in the ${graceDays}-day grace period.` : `Anda sedang dalam masa tenggang ${graceDays} hari.`}</p>
              <Link href={`/${lang}/pricing`} className="inline-block mt-3 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors">{lang === "en" ? "Renew Now" : "Perpanjang Sekarang"}</Link>
            </div>
          </div>
        );
      }
    } else {
      const daysLeft = Math.abs(diffDays);
      if (daysLeft <= 7) {
        return (
          <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800 flex items-start gap-3 shadow-sm dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-300">
            <svg className="w-6 h-6 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div className="flex-1">
              <h3 className="font-bold text-lg">{lang === "en" ? `Your plan expires in ${daysLeft} days` : `Paket Anda berakhir dalam ${daysLeft} hari`}</h3>
              <Link href={`/${lang}/pricing`} className="inline-block mt-3 bg-amber-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-600 transition-colors">{lang === "en" ? "Renew Plan" : "Perpanjang Paket"}</Link>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="mx-auto max-w-content px-4 py-8">
      
      {/* BANNER PEMBERITAHUAN BATAS PRODUK */}
      {isLimitReached && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">⚠️</span>
            <div>
              <h3 className="font-bold text-lg">
                {activeProductsCount > planLimit 
                  ? (lang === "en" ? "Too many active products!" : "Produk aktif melebihi batas!")
                  : (lang === "en" ? "Active product limit reached!" : "Batas produk aktif tercapai!")}
              </h3>
              <p className="text-sm mt-1">
                {lang === "en" 
                  ? `You have ${activeProductsCount} active products, but your plan allows ${planLimit}. You can swap products to manage your catalog.` 
                  : `Anda memiliki ${activeProductsCount} produk aktif, batas paket Anda adalah ${planLimit}. Anda dapat mengganti produk untuk mengelola katalog.`}
              </p>
            </div>
          </div>
          <Link href={`/${lang}/workspace/seller/select-products`} className="shrink-0 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors whitespace-nowrap">
            {activeProductsCount > planLimit 
              ? (lang === "en" ? "Select Products" : "Pilih Produk")
              : (lang === "en" ? "Manage Products" : "Kelola Produk")}
          </Link>
        </div>
      )}

      {renderPlanBanner()}

      {expiringSponsorships.length > 0 && (
        <div className="mb-6 rounded-lg bg-yellow-50 border border-yellow-300 p-4 text-yellow-900 flex flex-col gap-2 shadow-sm dark:bg-yellow-900/20 dark:border-yellow-700/50 dark:text-yellow-200">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span className="text-xl">⏳</span>
            {lang === "en" ? "Sponsorships Expiring Soon" : "Sponsor Akan Segera Berakhir"}
          </div>
          <ul className="list-disc pl-6 text-sm space-y-1">
            {expiringSponsorships.map((exp: any) => (
              <li key={exp.id}>
                <strong>{exp.title}</strong> {lang === "en" ? "expires on" : "berakhir pada"} {new Date(exp.expiresAt).toLocaleDateString(lang === "en" ? "en-GB" : "id-ID")}.
                <Link href={`/${lang}/workspace/seller/sponsor/${exp.id}`} className="ml-2 underline font-semibold text-yellow-700 dark:text-yellow-400 hover:text-yellow-900">
                  {lang === "en" ? "Extend Now" : "Perpanjang"}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* LOGO & INFO PERUSAHAAN */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white overflow-hidden dark:border-neutral-700">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="h-full w-full object-contain p-2" />
          ) : (
            <span className="text-2xl font-bold text-forest-700">{company?.name?.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{company?.name}</h1>
          <p className="text-sm text-neutral-500">{company?.city}, {company?.province}</p>
        </div>
      </div>

      {/* KARTU METRIK */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-sm text-neutral-500">{lang === "en" ? "Plan Status" : "Status Paket"}</div>
          <div className="text-xl font-bold">{company?.plan}</div>
        </div>
        <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-sm text-neutral-500">{lang === "en" ? "Verification" : "Status Verifikasi"}</div>
          <div className="text-xl font-bold">{company?.verificationStatus}</div>
        </div>
        <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-sm text-neutral-500">{lang === "en" ? "Total Products" : "Total Produk"}</div>
          <div className={`text-xl font-bold ${activeProductsCount >= planLimit ? "text-red-600 dark:text-red-400" : ""}`}>
            {activeProductsCount} / {planLimit}
          </div>
        </div>
      </div>

      {/* HEADER TABEL & TOMBOL AKSI */}
      <div className="mt-8 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold whitespace-nowrap">{lang === "en" ? "My Products" : "Produk Saya"}</h2>
        
        <div className="flex flex-wrap gap-2">
          
          {/* GRUP TOMBOL IKLAN (PASANG & RIWAYAT) */}
          <div className="flex rounded-md shadow-sm border border-purple-500 overflow-hidden">
            <Link href={`/${lang}/workspace/advertise`} className="bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1.5">
              <span>📢</span> {lang === "en" ? "Place Ad" : "Pasang Iklan"}
            </Link>
            <div className="w-px bg-purple-500"></div>
            <Link href={`/${lang}/workspace/advertise/history`} className="bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1.5">
              <span>📋</span> {lang === "en" ? "Ad History" : "Riwayat Iklan"}
            </Link>
          </div>

          {isPremium && (
            <Link href={`/${lang}/workspace/seller/sponsor/leads`} className="rounded-md border border-blue-500 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors">
              🎯 {lang === "en" ? "Buyer Leads" : "Calon Pembeli"}
            </Link>
          )}

          {isPremium || hasSponsoredProduct ? (
            <Link href={`/${lang}/workspace/seller/sponsor/history`} className="rounded-md border border-amber-500 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 transition-colors">
              📊 {lang === "en" ? "Sponsorship Report" : "Laporan Sponsor"}
            </Link>
          ) : (
            <Link href={`/${lang}/pricing`} className="rounded-md border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 flex items-center gap-2 cursor-pointer transition-colors">
              🔒 {lang === "en" ? "Upgrade for Reports" : "Upgrade untuk Laporan"}
            </Link>
          )}

          {company?.plan === "PREMIUM" || company?.plan === "ENTERPRISE" ? (
            <Link href={`/${lang}/workspace/seller/analytics`} className="rounded-md border border-indigo-500 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-colors">
              📈 {lang === "en" ? "Advanced Analytics" : "Analitik Lanjutan"}
            </Link>
          ) : (
            <Link href={`/${lang}/pricing`} className="rounded-md border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 flex items-center gap-2 cursor-pointer transition-colors">
              🔒 {lang === "en" ? "Upgrade for Analytics" : "Upgrade untuk Analitik"}
            </Link>
          )}
          
          <Link href={`/${lang}/workspace/seller/profile`} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800 transition-colors">
            {lang === "en" ? "Edit Profile" : "Edit Profil"}
          </Link>
          
          <Link href={`/${lang}/pricing`} className="rounded-md bg-forest-700 px-3 py-1.5 text-sm text-white hover:bg-forest-500 transition-colors">
            {lang === "en" ? "Upgrade Plan" : "Upgrade Paket"}
          </Link>
          
          <Link href={`/${lang}/workspace/seller/new`} className="rounded-md border border-forest-700 px-3 py-1.5 text-sm text-forest-700 hover:bg-forest-700/5 dark:border-forest-500 dark:text-forest-500 transition-colors">
            + {lang === "en" ? "Add Product" : "Tambah Produk"}
          </Link>
        </div>
      </div>

      {/* TABEL PRODUK */}
      <div className="mt-4 overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-100 dark:bg-neutral-800">
            <tr>
              <th className="p-3 font-medium">{lang === "en" ? "Product" : "Produk"}</th>
              <th className="p-3 font-medium">{lang === "en" ? "Status" : "Status"}</th>
              <th className="p-3 font-medium">Promo</th>
              <th className="p-3 font-medium whitespace-nowrap">{lang === "en" ? "Price" : "Harga"}</th>
              <th className="p-3 font-medium whitespace-nowrap">{lang === "en" ? "Action" : "Aksi"}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const activeTier = p.sponsoredRequests?.[0]?.tier;
              const isHomepage = activeTier === "HOMEPAGE";
              const isCategory = activeTier === "CATEGORY";
              const isDiscountActive = p.discountUntil && new Date(p.discountUntil) > new Date();
              
              const displayDiscount = p.discountLabel 
                ? (p.discountLabel.includes('%') ? p.discountLabel : `${p.discountLabel}%`) 
                : null;

              return (
                <tr key={p.id} className="border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                  <td className="p-3 flex items-center gap-3">
                    <div 
                      className={`h-12 w-12 shrink-0 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 transition-transform duration-300 ${
                        p.images?.[0]?.url ? 'cursor-pointer hover:scale-110' : ''
                      }`}
                      onClick={() => p.images?.[0]?.url && setSelectedImage(p.images[0].url)}
                    >
                      {p.images?.[0]?.url ? (
                        <img src={p.images[0].url} alt={p.titleId} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">No Img</div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{lang === "en" ? p.titleEn : p.titleId}</span>
                      {isCurrentlySponsored(p) && (
                        <span className={`w-fit rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${
                          isHomepage ? "bg-amber-400 text-amber-950" :
                          isCategory ? "bg-forest-700 text-white" : 
                          "bg-lime-300 text-neutral-900"
                        }`}>
                          {isHomepage ? "👑 PREMIUM" :
                           isCategory ? "✨ SPOTLIGHT" :
                           "⭐ " + (lang === "en" ? "SPONSORED" : "BERSPONSOR")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">{p.status}</td>
                  <td className="p-3">
                    {isDiscountActive && displayDiscount ? (
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap">{displayDiscount}</span>
                    ) : (
                      <span className="text-neutral-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-3 tabular-nums whitespace-nowrap">{p.priceMin ? `Rp ${p.priceMin.toLocaleString("id-ID")}` : "-"}</td>
                  
                  <td className="p-3">
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <Link href={`/${lang}/workspace/seller/edit/${p.id}`} className="text-forest-700 hover:underline dark:text-lime-400 font-medium">
                        {lang === "en" ? "Edit" : "Edit"}
                      </Link>
                      <Link href={`/${lang}/workspace/seller/sponsor/${p.id}`} className="text-amber-600 hover:underline font-medium">
                        {lang === "en" ? "Promote" : "Promosikan"}
                      </Link>
                      
                      <button 
                        onClick={() => { 
                          setPromoProduct(p); 
                          setPromoLabel(isDiscountActive ? p.discountLabel : ""); 
                          setPromoDays(3); 
                        }} 
                        className="text-blue-600 hover:underline font-medium"
                      >
                        🏷️ Promo
                      </button>

                      <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 hover:underline font-medium">
                        {lang === "en" ? "Delete" : "Hapus"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-500">
                  {lang === "en" ? "No products yet." : "Belum ada produk."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL SET DISKON */}
      {promoProduct && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl p-6 w-full max-w-md border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-bold text-xl mb-4">{lang === "en" ? "Set Discount Promo" : "Atur Promo Diskon"}</h3>
            <form onSubmit={handleSavePromo} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">{lang === "en" ? "Discount Label (Leave empty to remove)" : "Label Diskon (Kosongkan untuk hapus)"}</label>
                <input 
                  type="text" 
                  value={promoLabel}
                  onChange={(e) => setPromoLabel(e.target.value)}
                  placeholder={lang === "en" ? "e.g. 20" : "Contoh: 20"}
                  maxLength={20}
                  className="w-full h-10 rounded-md border px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700"
                />
                <p className="text-xs text-neutral-500 mt-1">* {lang === "en" ? "No need to type '%'" : "Tidak perlu mengetik simbol '%'"}</p>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{lang === "en" ? "Promo Duration (Days)" : "Durasi Promo (Hari)"}</label>
                <select 
                  value={promoDays}
                  onChange={(e) => setPromoDays(Number(e.target.value))}
                  className="w-full h-10 rounded-md border px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700"
                  disabled={!promoLabel}
                >
                  <option value={3}>3 Hari</option>
                  <option value={7}>7 Hari</option>
                  <option value={15}>15 Hari</option>
                  <option value={30}>30 Hari</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setPromoProduct(null)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-md">{lang === "en" ? "Cancel" : "Batal"}</button>
                <button type="submit" disabled={savingPromo} className="px-4 py-2 text-sm font-medium text-white bg-forest-700 hover:bg-forest-500 rounded-md disabled:opacity-50">
                  {savingPromo ? (lang === "en" ? "Saving..." : "Menyimpan...") : (lang === "en" ? "Save Promo" : "Simpan Promo")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* LIGHTBOX GAMBAR */}
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