"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function EditProduct() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(null);

  const inputClass = "w-full h-11 rounded-md border border-neutral-300 px-3 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400";

  useEffect(() => {
    Promise.all([
      fetch(`/api/seller/products/${productId}`).then(res => res.json()),
      fetch("/api/categories").then(res => res.json())
    ]).then(([productData, categoriesData]) => {
      setProduct(productData);
      setCategories(categoriesData);
      setLoading(false);
    }).catch(() => {
      toast.error("Gagal memuat data");
      setLoading(false);
    });
  }, [productId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);

    const body = {
      title: fd.get("title"),
      categoryId: fd.get("categoryId"),
      description: fd.get("description"),
      moq: fd.get("moq"), // Mengirim string kosong jika tidak diisi
      moqUnit: fd.get("moqUnit"),
      priceMin: fd.get("priceMin"), // Mengirim string kosong jika tidak diisi
    };

    try {
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success("Produk berhasil diperbarui!");
      router.push(`/${lang}/workspace/seller`);
    } catch {
      toast.error("Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-16 text-center">Memuat data produk...</div>;
  if (!product) return <div className="p-16 text-center text-red-500">Produk tidak ditemukan.</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">Edit Produk</h1>
      
      <form onSubmit={onSubmit} className="space-y-5 bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div>
          <label className="text-sm font-medium block mb-1">Nama Produk</label>
          <input name="title" required defaultValue={product.titleId} className={inputClass} />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Kategori</label>
          <select name="categoryId" required defaultValue={product.categoryId} className={inputClass}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nameId}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Deskripsi</label>
          <textarea name="description" rows={3} defaultValue={product.description || ""} className={`${inputClass} h-auto py-3`} />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1">MOQ <span className="text-xs text-neutral-500">(Opsional)</span></label>
            {/* defaultValue fallback ke string kosong agar tidak error */}
            <input name="moq" type="number" min={1} defaultValue={product.moq || ""} className={inputClass} placeholder="Kosongkan = Nego" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Satuan</label>
            <input name="moqUnit" defaultValue={product.moqUnit || "pcs"} className={inputClass} />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium block mb-1">Harga Indikatif (Rp) <span className="text-xs text-neutral-500">(Opsional)</span></label>
          {/* defaultValue fallback ke string kosong agar tidak error */}
          <input name="priceMin" type="number" defaultValue={product.priceMin || ""} className={inputClass} placeholder="Kosongkan = Nego" />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving} className="flex-1 h-11">{saving ? "Menyimpan..." : "Simpan Perubahan"}</Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} className="h-11">Batal</Button>
        </div>
      </form>
    </div>
  );
}