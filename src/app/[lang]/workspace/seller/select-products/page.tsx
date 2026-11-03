"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function SelectProductsPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";

  const [products, setProducts] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetch("/api/seller/dashboard")
      .then(res => res.json())
      .then(data => {
        // Hanya tampilkan produk yang bisa dikelola (ACTIVE atau HIDDEN)
        const manageableProducts = data.products.filter(
          (p: any) => p.status === "ACTIVE" || p.status === "HIDDEN"
        );
        setProducts(manageableProducts);
        
        const plan = data.company?.plan || "FREE";
        const maxLimit = plan === "FREE" ? 10 : plan === "PRO" ? 100 : 500;
        setLimit(maxLimit);

        // Centang produk yang saat ini ACTIVE
        const activeIds = manageableProducts
          .filter((p: any) => p.status === "ACTIVE")
          .map((p: any) => p.id);
        
        setSelectedIds(activeIds.slice(0, maxLimit));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleProduct = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      if (selectedIds.length >= limit) {
        toast.error(lang === "en" ? `You can only select up to ${limit} products. Remove one first.` : `Maksimal ${limit} produk. Hapus centang satu produk terlebih dahulu.`);
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/seller/products/selection", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedIds }),
      });
      if (res.ok) {
        toast.success(lang === "en" ? "Product selection saved!" : "Pilihan produk berhasil disimpan!");
        router.push(`/${lang}/workspace/seller`);
      } else {
        throw new Error();
      }
    } catch (err) {
      toast.error(lang === "en" ? "Failed to save selection." : "Gagal menyimpan pilihan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-16 text-center">Memuat produk...</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">{lang === "en" ? "Manage Active Products" : "Kelola Produk Aktif"}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {lang === "en" 
              ? `Choose which products appear in the catalog. You can swap anytime.`
              : `Pilih produk mana yang tampil di katalog publik. Anda bisa menggantinya kapan saja.`}
          </p>
        </div>
        <Link href={`/${lang}/workspace/seller`} className="text-sm text-forest-700 hover:underline dark:text-lime-400 font-medium">
          ← {lang === "en" ? "Back" : "Kembali"}
        </Link>
      </div>

      {/* INFO COUNTER */}
      <div className={`mb-6 rounded-lg p-4 flex justify-between items-center shadow-md ${selectedIds.length >= limit ? "bg-forest-700 text-white" : "bg-blue-600 text-white"}`}>
        <div className="font-medium">{lang === "en" ? "Active Products" : "Produk Aktif"}</div>
        <div className="text-2xl font-bold tabular-nums">
          {selectedIds.length} <span className="text-sm font-normal opacity-70">/ {limit}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {products.map((p) => {
          const isSelected = selectedIds.includes(p.id);
          return (
            <div 
              key={p.id} 
              onClick={() => toggleProduct(p.id)}
              className={`relative flex flex-col gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected 
                  ? "border-forest-700 bg-forest-700/5 ring-2 ring-lime-400" 
                  : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-100 border">
                  {p.images?.[0]?.url ? (
                    <img src={p.images[0].url} className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-[10px] text-center mt-3">No Img</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm line-clamp-2">{lang === "en" ? p.titleEn : p.titleId}</div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {isSelected ? "✅ ACTIVE" : "⏸️ HIDDEN"}
                  </div>
                </div>
              </div>
              
              <div className={`absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                isSelected ? "bg-forest-700 border-forest-700 text-white" : "border-neutral-300 bg-white"
              }`}>
                {isSelected && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <div className="col-span-full p-8 text-center text-neutral-500">
            {lang === "en" ? "No products available." : "Belum ada produk."}
          </div>
        )}
      </div>

      <div className="sticky bottom-4 bg-white dark:bg-neutral-900 p-4 border rounded-xl shadow-xl flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto px-8">
          {saving ? "Menyimpan..." : (lang === "en" ? "Save Selection" : "Simpan Pilihan")}
        </Button>
      </div>
    </div>
  );
}