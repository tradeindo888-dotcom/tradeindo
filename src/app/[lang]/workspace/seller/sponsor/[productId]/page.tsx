"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import type { SponsorPlan } from "@/lib/sponsorship/plans";

type Tier = "STANDARD" | "CATEGORY" | "HOMEPAGE";

export default function SponsorProductPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";
  const productId = params.productId as string;

  const [plans, setPlans] = useState<SponsorPlan[]>([]);
  const [selectedTier, setSelectedTier] = useState<Tier>("STANDARD");
  const [selectedDays, setSelectedDays] = useState(30);
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null); 
  
  const [maxActive, setMaxActive] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [canSubmit, setCanSubmit] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [promoLabel, setPromoLabel] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CLASS INPUT AGAR TIDAK ABU-ABU DI HP
  const inputClass = "w-full h-11 rounded-md border border-neutral-300 px-3 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400";

  useEffect(() => {
    fetch("/api/seller/sponsor/plans")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        setPlans(d.plans);
        setMaxActive(d.maxActive);
        setActiveCount(d.activeCount);
        setCanSubmit(d.canSubmit);
        setLoadingPlans(false);
      })
      .catch(() => {
        toast.error(lang === "en" ? "Failed to load plans." : "Gagal memuat paket.");
        setLoadingPlans(false);
      });
  }, [lang]);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedImage(null); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const currentTierPlans = plans.filter(p => p.tier === selectedTier);
  const selectedPlan = currentTierPlans.find(p => p.durationDays === selectedDays) ?? currentTierPlans[0];
  const activeHighlight = hoveredPlan !== null ? hoveredPlan : selectedDays;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error(lang === "en" ? "Please upload payment proof." : "Silakan upload bukti transfer.");
      return;
    }
    
    setLoading(true);
    
    const submitPromise = (async () => {
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload/public", { method: "POST", body: fd });
      if (!uploadRes.ok) throw new Error("upload");
      const { url } = await uploadRes.json();

      const res = await fetch("/api/seller/sponsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          tier: selectedTier,
          durationDays: selectedDays,
          paymentProofUrl: url,
          promoLabel: promoLabel.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detailMsg = data.details ? JSON.stringify(data.details) : "";
        throw new Error((data.error || "submit") + (detailMsg ? ` (${detailMsg})` : ""));
      }
      
      router.push(`/${lang}/workspace/seller/sponsor/history?success=1`);
      return "success";
    })();

    toast.promise(submitPromise, {
      loading: lang === "en" ? "Submitting request..." : "Mengirim pengajuan...",
      success: () => lang === "en" ? "Sponsorship request sent!" : "Pengajuan sponsorship berhasil dikirim!",
      error: (err) => {
        if (err.message === "upload") return lang === "en" ? "Failed to upload proof." : "Gagal mengunggah bukti.";
        return err.message || (lang === "en" ? "Failed to submit." : "Gagal mengirim pengajuan.");
      },
    });

    try { await submitPromise; } catch (err) {} finally { setLoading(false); }
  }

  if (loadingPlans) return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-neutral-500">Memuat paket...</div>;

  if (!canSubmit) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold mb-4">Promote Product</h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-300">
          <p className="font-semibold">Anda telah mencapai batas sponsorship aktif.</p>
          <p className="text-sm mt-2">Aktif: {activeCount} / {maxActive}.</p>
          <Link href={`/${lang}/workspace/seller`} className="mt-4 inline-block text-sm font-medium text-amber-800 dark:text-amber-400 underline">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-1">
        {lang === "en" ? "Promote Your Product" : "Promosikan Produk Anda"}
      </h1>
      <p className="text-sm text-neutral-500 mb-6">
        Pilih jenis iklan yang ingin Anda gunakan.
      </p>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => { setSelectedTier("STANDARD"); setSelectedDays(30); }} className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all whitespace-nowrap ${selectedTier === "STANDARD" ? "border-forest-700 bg-forest-700 text-white" : "border-neutral-200 text-neutral-600 hover:border-forest-700 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-forest-500"}`}>
          Standard
        </button>
        <button onClick={() => { setSelectedTier("CATEGORY"); setSelectedDays(30); }} className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all whitespace-nowrap ${selectedTier === "CATEGORY" ? "border-forest-700 bg-forest-700 text-white" : "border-neutral-200 text-neutral-600 hover:border-forest-700 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-forest-500"}`}>
          Category Spotlight
        </button>
        <button onClick={() => { setSelectedTier("HOMEPAGE"); setSelectedDays(30); }} className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all whitespace-nowrap ${selectedTier === "HOMEPAGE" ? "border-forest-700 bg-forest-700 text-white" : "border-neutral-200 text-neutral-600 hover:border-forest-700 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-forest-500"}`}>
          Homepage Feature
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {currentTierPlans.map(plan => {
          const isHighlighted = activeHighlight === plan.durationDays;
          return (
            <button
              key={plan.durationDays}
              type="button"
              onMouseEnter={() => setHoveredPlan(plan.durationDays)}
              onMouseLeave={() => setHoveredPlan(null)}
              onClick={() => setSelectedDays(plan.durationDays)}
              className={`relative rounded-lg border-2 p-4 text-center transition-all duration-300 ease-out z-0 ${
                isHighlighted ? "border-forest-700 bg-forest-700/5 ring-2 ring-lime-400 shadow-lg z-10" : "border-neutral-200 dark:border-neutral-700"
              } ${hoveredPlan === plan.durationDays ? "scale-[1.04] -translate-y-1 shadow-xl" : ""}`}
            >
              {plan.badge === "popular" && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-forest-700 px-2 py-0.5 text-[10px] font-bold text-white">
                  {lang === "en" ? "POPULAR" : "POPULER"}
                </div>
              )}
              <div className="font-bold text-lg text-neutral-900 dark:text-white">{lang === "en" ? plan.labelEn : plan.label}</div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Rp {plan.price.toLocaleString("id-ID")}</div>
              {plan.savingsPercent && <div className="text-xs text-green-600 font-medium mt-1">Hemat {plan.savingsPercent}%</div>}
            </button>
          );
        })}
      </div>

      {/* INPUT LABEL PROMOSI */}
      <div className="rounded-lg border border-neutral-200 bg-white p-5 mb-6 dark:border-neutral-800 dark:bg-neutral-900">
        <label className="text-sm font-medium block mb-1 text-neutral-900 dark:text-white">
          {lang === "en" ? "Promo Label (Optional)" : "Label Promosi (Opsional)"}
        </label>
        <p className="text-xs text-neutral-500 mb-2">
          {lang === "en" ? "Example: 'Diskon 20%' or 'Best Seller'. Max 25 characters." : "Contoh: 'Diskon 20%' atau 'Best Seller'. Maksimal 25 karakter."}
        </p>
        <input 
          type="text" 
          value={promoLabel}
          onChange={(e) => setPromoLabel(e.target.value)}
          maxLength={25}
          placeholder={lang === "en" ? "e.g. 20% OFF" : "Misal: Diskon 20%"} 
          className={inputClass} 
        />
      </div>

      {selectedPlan && (
        <div className="rounded-lg border border-neutral-200 bg-white p-5 mb-6 dark:border-neutral-800 dark:bg-neutral-900">
          <p className="text-sm mb-2 text-neutral-900 dark:text-white">Transfer sejumlah:</p>
          <div className="text-3xl font-bold text-forest-700 dark:text-lime-400 mb-3">Rp {selectedPlan.price.toLocaleString("id-ID")}</div>
          
          <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded text-sm space-y-1 text-neutral-800 dark:text-neutral-200">
            <p><strong>Bank BCA</strong> · <strong>3491108558</strong></p>
            <p>Atas nama: <strong>Kevin Indo Trade</strong></p>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 p-5 bg-white dark:bg-neutral-900">
        <label className="text-sm font-medium block mb-2 text-neutral-900 dark:text-white">Upload Bukti Transfer</label>
        <input type="file" accept="image/jpeg,image/png,image/webp" ref={fileInputRef} onChange={e => { setFile(e.target.files?.[0] ?? null); }} className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-forest-700 file:text-white hover:file:bg-forest-500" />
        
        {preview && (
          <div className="mt-3 relative group w-fit">
            <img src={preview} alt="Preview" className="max-h-48 rounded border border-neutral-200 dark:border-neutral-700 object-contain cursor-pointer hover:opacity-90" onClick={() => setSelectedImage(preview)} />
            <button type="button" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md">✕</button>
          </div>
        )}
        
        <Button type="submit" disabled={loading || !file} className="w-full mt-4 h-12 text-base font-bold">
          {loading ? "Mengirim…" : "Ajukan Sponsorship"}
        </Button>
      </form>

      {/* LIGHTBOX ZOOM GAMBAR */}
      {selectedImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedImage} alt="Bukti" className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl" />
            <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }} className="absolute -top-10 right-0 text-white bg-black/50 hover:bg-black/70 rounded-full h-8 w-8 flex items-center justify-center text-xl font-bold transition-colors">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}