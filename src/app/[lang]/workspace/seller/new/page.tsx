"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { CATEGORY_NAMES, validateCategoryChoice } from "@/lib/category-keywords";

export default function AddProduct() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";
  
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<{id: string, nameId: string, nameEn: string, slug: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Gagal load kategori", err));
  }, []);

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
        toast.error(lang === "en" ? "Failed to upload image." : "Gagal upload salah satu gambar.");
      }
    }
    
    setImages((prev) => [...prev, ...uploadedUrls]);
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
    const confirmMessage = 
      `Simpan produk dengan detail berikut?\n\n` +
      `📦 Nama Produk: ${title}\n` +
      `📂 Kategori: ${category ? CATEGORY_NAMES[category.slug] : "-"}\n` +
      `💰 Harga: Rp ${Number(fd.get("priceMin") || 0).toLocaleString("id-ID")}\n` +
      `📊 MOQ: ${fd.get("moq")} ${fd.get("moqUnit")}\n` +
      `🖼️ Gambar: ${images.length} file`;
    
    if (!window.confirm(confirmMessage)) {
      return; // User membatalkan
    }
    
    setLoading(true);
    
    const body = {
      ...Object.fromEntries(fd.entries()),
      images: images
    };

    const submitPromise = (async () => {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || (lang === "en" ? "Failed to add product." : "Gagal menambah produk."));
      }
      router.push(`/${lang}/workspace/seller`);
      return "success";
    })();

    toast.promise(submitPromise, {
      loading: lang === "en" ? "Saving product..." : "Menyimpan produk...",
      success: lang === "en" ? "Product added successfully!" : "Produk berhasil ditambahkan!",
      error: (err) => err.message,
    });

    try { await submitPromise; } catch {} finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">{lang === "en" ? "Add New Product" : "Tambah Produk Baru"}</h1>
      
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">{lang === "en" ? "Product Name" : "Nama Produk"}</label>
          <input name="title" required className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
        </div>

        <div>
          <label className="text-sm font-medium">{lang === "en" ? "Category" : "Kategori Produk"}</label>
          <select name="categoryId" required className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900">
            <option value="">{lang === "en" ? "Select Category..." : "Pilih Kategori..."}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{lang === "en" ? c.nameEn : c.nameId}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">{lang === "en" ? "Description" : "Deskripsi"}</label>
          <textarea name="description" rows={3} className="mt-1 w-full rounded-md border border-neutral-300 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">MOQ</label>
            <input name="moq" type="number" min={1} required className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          </div>
          <div>
            <label className="text-sm font-medium">{lang === "en" ? "Unit" : "Satuan"}</label>
            <input name="moqUnit" defaultValue="pcs" className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">{lang === "en" ? "Indicative Price (Rp)" : "Harga Indikatif (Rp)"}</label>
          <input name="priceMin" type="number" className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
        </div>

        <div className="rounded-md border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
          <label className="text-sm font-medium block mb-2">{lang === "en" ? "Upload Images (Multiple)" : "Upload Gambar Produk (Bisa lebih dari 1)"}</label>
          <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="block w-full text-sm" />
          {uploading && <p className="mt-2 text-sm text-blue-600">{lang === "en" ? "Uploading..." : "Sedang mengunggah..."}</p>}
          
          {images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {images.map((url, idx) => (
                <div key={idx} className="relative h-20 w-20 rounded-md border overflow-hidden">
                  <img src={url} alt="Preview" className="h-full w-full object-cover cursor-pointer" onClick={() => setSelectedImage(url)} />
                  <button type="button" onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">×</button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <Button type="submit" disabled={loading || uploading} className="w-full">
          {loading ? (lang === "en" ? "Saving..." : "Menyimpan...") : (lang === "en" ? "Save Product" : "Simpan Produk")}
        </Button>
      </form>

      {selectedImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedImage} alt="Gambar" className="max-w-full max-h-[90vh] object-contain rounded-md" />
            <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }} className="absolute -top-10 right-0 text-white bg-black/50 rounded-full h-8 w-8">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}