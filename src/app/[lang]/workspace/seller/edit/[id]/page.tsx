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

  // CLASS INPUT AGAR TIDAK ABU-ABU DI HP
  const inputClass = "w-full h-11 rounded-md border border-neutral-300 px-3 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400";

  useEffect(() => {
    fetch(`/api/seller/products/${productId}`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch(() => toast.error("Gagal memuat produk."));

    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => toast.error("Gagal memuat kategori."));
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
      const res = await fetch("/api/upload/public", { method: "POST", body: formData });
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
    
    // Validasi Kata Kunci Kategori
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
    
    // Konfirmasi Sebelum Simpan
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

  if (!product) return <div className="p-8 text-center text-neutral-500">Memuat data...</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">{lang === "en" ? "Edit Product" : "Edit Produk"}</h1>

      <form onSubmit={onSubmit} className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-5">
        <div>
          <label className="text-sm font-medium block mb-1">{lang === "en" ? "Product Name" : "Nama Produk"}</label>
          <input name="title" defaultValue={product.titleId} required className={inputClass} />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">{lang === "en" ? "Category" : "Kategori Produk"}</label>
          <select name="categoryId" defaultValue={product.categoryId} required className={inputClass}>
            <option value="">{lang === "en" ? "Select Category..." : "Pilih Kategori..."}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{lang === "en" ? c.nameEn : c.nameId}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">{lang === "en" ? "Description" : "Deskripsi"}</label>
          <textarea name="description" defaultValue={product.description || ""} rows={3} className={`${inputClass} h-auto py-3`} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1">MOQ</label>
            <input name="moq" type="number" defaultValue={product.moq} required className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{lang === "en" ? "Unit" : "Satuan"}</label>
            <input name="moqUnit" defaultValue={product.moqUnit} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">{lang === "en" ? "Indicative Price (Rp)" : "Harga Indikatif (Rp)"}</label>
          <input name="priceMin" type="number" defaultValue={product.priceMin || ""} className={inputClass} />
        </div>

        {/* GAMBAR SAAT INI */}
        {product.images && product.images.length > 0 && (
          <div>
            <label className="text-sm font-medium block mb-2">{lang === "en" ? "Current Images" : "Gambar Saat Ini"}</label>
            <div className="flex flex-wrap gap-2">
              {product.images.map((img: any) => {
                if (deletedImages.includes(img.id)) return null;
                return (
                  <div key={img.id} className="relative h-20 w-20 rounded-md border border-neutral-200 dark:border-neutral-700 overflow-hidden group">
                    <img src={img.url} alt="Lama" className="h-full w-full object-cover cursor-pointer" onClick={() => setSelectedImage(img.url)} />
                    <button type="button" onClick={() => setDeletedImages([...deletedImages, img.id])} className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAMBAH GAMBAR BARU */}
        <div className="rounded-md border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
          <label className="text-sm font-medium block mb-2">{lang === "en" ? "Add New Images" : "Tambah Gambar Baru"}</label>
          <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-forest-700 file:text-white hover:file:bg-forest-500" />
          {uploading && <p className="mt-2 text-sm text-blue-600">{lang === "en" ? "Uploading..." : "Sedang mengunggah..."}</p>}
          {newImages.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {newImages.map((url, idx) => (
                <div key={idx} className="relative h-20 w-20 rounded-md border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <img src={url} alt="Baru" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setNewImages(newImages.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <Button type="submit" disabled={loading || uploading} className="flex-1 h-11">
            {loading ? (lang === "en" ? "Saving..." : "Menyimpan...") : (lang === "en" ? "Save Changes" : "Simpan Perubahan")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push(`/${lang}/workspace/seller`)} className="h-11">Batal</Button>
        </div>
      </form>

      {/* LIGHTBOX ZOOM GAMBAR */}
      {selectedImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedImage} alt="Gambar Produk Besar" className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl" />
            <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }} className="absolute -top-10 right-0 text-white bg-black/50 rounded-full h-8 w-8 flex items-center justify-center text-xl font-bold">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}