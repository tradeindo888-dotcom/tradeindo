"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { CATEGORY_NAMES, validateCategoryChoice } from "@/lib/category-keywords";

export default function EditProduct() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";
  const productId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/seller/products/${productId}`)
      .then((res) => res.json())
      .then((data) => setProduct(data));

    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data));
  }, [productId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("file", files[i]);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        uploadedUrls.push(data.url);
      } else {
        toast.error(lang === "en" ? "Upload failed." : "Gagal upload gambar.");
      }
    }
    setNewImages((prev) => [...prev, ...uploadedUrls]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") || "");
    const categoryId = String(fd.get("categoryId") || "");
    const category = categories.find(c => c.id === categoryId);
    
    // ===== LAPISAN 2: VALIDASI KATA KUNCI =====
    if (category) {
      const validation = validateCategoryChoice(title, category.slug);
      if (validation.isWarning) {
        const proceed = window.confirm(
          `⚠️ PERINGATAN KATEGORI ⚠️\n\n` +
          `${validation.message}\n\n` +
          `Apakah Anda yakin ingin tetap menyimpan dengan kategori "${CATEGORY_NAMES[category.slug]}"?`
        );
        if (!proceed) return;
      }
    }
    
    // ===== LAPISAN 1: KONFIRMASI SEBELUM SIMPAN =====
    const categoryChanged = category?.id !== product?.categoryId;
    
    const confirmMessage = 
      `Simpan perubahan produk?\n\n` +
      `📦 Nama Produk: ${title}\n` +
      `📂 Kategori: ${category ? CATEGORY_NAMES[category.slug] : "-"}` +
      (categoryChanged ? ` (DIUBAH dari kategori lama)` : "") + `\n` +
      `💰 Harga: Rp ${Number(fd.get("priceMin") || 0).toLocaleString("id-ID")}\n` +
      `📊 MOQ: ${fd.get("moq")} ${fd.get("moqUnit")}\n` +
      `🖼️ Gambar: ${newImages.length} baru, ${deletedImages.length} dihapus`;
    
    if (!window.confirm(confirmMessage)) return;
    
    setLoading(true);
    
    const body = {
      title: fd.get("title"),
      categoryId: fd.get("categoryId"),
      description: fd.get("description"),
      moq: Number(fd.get("moq")),
      moqUnit: fd.get("moqUnit"),
      priceMin: fd.get("priceMin") ? Number(fd.get("priceMin")) : null,
      newImages: newImages,
      deletedImages: deletedImages,
    };

    const submitPromise = (async () => {
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || (lang === "en" ? "Failed to update." : "Gagal menyimpan perubahan."));
      }
      router.push(`/${lang}/workspace/seller`);
      return "success";
    })();

    toast.promise(submitPromise, {
      loading: lang === "en" ? "Saving changes..." : "Menyimpan perubahan...",
      success: lang === "en" ? "Product updated!" : "Produk berhasil diperbarui!",
      error: (err) => err.message,
    });

    try { await submitPromise; } catch {} finally { setLoading(false); }
  }

  if (!product) return <div className="p-8 text-center">Memuat data...</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">{lang === "en" ? "Edit Product" : "Edit Produk"}</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">{lang === "en" ? "Product Name" : "Nama Produk"}</label>
          <input name="title" defaultValue={product.titleId} required className="mt-1 h-11 w-full rounded-md border px-3 text-sm" />
        </div>

        <div>
          <label className="text-sm font-medium">{lang === "en" ? "Category" : "Kategori Produk"}</label>
          <select name="categoryId" defaultValue={product.categoryId} required className="mt-1 h-11 w-full rounded-md border px-3 text-sm">
            <option value="">{lang === "en" ? "Select Category..." : "Pilih Kategori..."}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{lang === "en" ? c.nameEn : c.nameId}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">{lang === "en" ? "Description" : "Deskripsi"}</label>
          <textarea name="description" defaultValue={product.description || ""} rows={3} className="mt-1 w-full rounded-md border p-3 text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">MOQ</label>
            <input name="moq" type="number" defaultValue={product.moq} required className="mt-1 h-11 w-full rounded-md border px-3 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">{lang === "en" ? "Unit" : "Satuan"}</label>
            <input name="moqUnit" defaultValue={product.moqUnit} className="mt-1 h-11 w-full rounded-md border px-3 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">{lang === "en" ? "Indicative Price (Rp)" : "Harga Indikatif (Rp)"}</label>
          <input name="priceMin" type="number" defaultValue={product.priceMin || ""} className="mt-1 h-11 w-full rounded-md border px-3 text-sm" />
        </div>

        {product.images && product.images.length > 0 && (
          <div>
            <label className="text-sm font-medium block mb-2">{lang === "en" ? "Current Images" : "Gambar Saat Ini"}</label>
            <div className="flex flex-wrap gap-2">
              {product.images.map((img: any) => {
                if (deletedImages.includes(img.id)) return null;
                return (
                  <div key={img.id} className="relative h-20 w-20 rounded-md border overflow-hidden group">
                    <img src={img.url} alt="Lama" className="h-full w-full object-cover cursor-pointer" onClick={() => setSelectedImage(img.url)} />
                    <button type="button" onClick={() => setDeletedImages([...deletedImages, img.id])} className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">×</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-md border border-dashed p-4">
          <label className="text-sm font-medium block mb-2">{lang === "en" ? "Add New Images" : "Tambah Gambar Baru"}</label>
          <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="block w-full text-sm" />
          {uploading && <p className="mt-2 text-sm text-blue-600">{lang === "en" ? "Uploading..." : "Sedang mengunggah..."}</p>}
          {newImages.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {newImages.map((url, idx) => (
                <div key={idx} className="relative h-20 w-20 rounded-md border overflow-hidden">
                  <img src={url} alt="Baru" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setNewImages(newImages.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" disabled={loading || uploading} className="w-full">
          {loading ? (lang === "en" ? "Saving..." : "Menyimpan...") : (lang === "en" ? "Save Changes" : "Simpan Perubahan")}
        </Button>
      </form>

      {selectedImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedImage} alt="Gambar Produk Besar" className="max-w-full max-h-[90vh] object-contain rounded-md" />
            <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }} className="absolute -top-10 right-0 text-white bg-black/50 rounded-full h-8 w-8 flex items-center justify-center text-xl">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}