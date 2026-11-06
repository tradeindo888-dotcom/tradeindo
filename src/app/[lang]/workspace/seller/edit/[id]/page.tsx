"use client";
import { useState, useEffect, useRef } from "react";
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
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(null);

  // STATE UNTUK GAMBAR
  const [existingImages, setExistingImages] = useState<{ id: string, url: string }[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClass = "w-full h-11 rounded-md border border-neutral-300 px-3 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400";

  useEffect(() => {
    Promise.all([
      fetch(`/api/seller/products/${productId}`).then(res => res.json()),
      fetch("/api/categories").then(res => res.json())
    ]).then(([productData, categoriesData]) => {
      setProduct(productData);
      setCategories(categoriesData);
      setExistingImages(productData.images || []);
      setLoading(false);
    }).catch(() => {
      toast.error("Gagal memuat data");
      setLoading(false);
    });
  }, [productId]);

  // Fungsi Upload Gambar Baru
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
        toast.error(lang === "en" ? "Failed to upload image." : "Gagal upload salah satu gambar.");
      }
    }
    
    setNewImages((prev) => [...prev, ...uploadedUrls]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Fungsi Menghapus Gambar Lama
  function handleDeleteExistingImage(id: string) {
    setExistingImages(existingImages.filter(img => img.id !== id));
    setDeletedImageIds([...deletedImageIds, id]);
  }

  // Fungsi Menghapus Gambar Baru (Sebelum disimpan)
  function handleDeleteNewImage(index: number) {
    setNewImages(newImages.filter((_, i) => i !== index));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);

    const body = {
      title: fd.get("title"),
      categoryId: fd.get("categoryId"),
      description: fd.get("description"),
      moq: fd.get("moq"),
      moqUnit: fd.get("moqUnit"),
      priceMin: fd.get("priceMin"),
      deletedImages: deletedImageIds,
      newImages: newImages
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
            <input name="moq" type="number" min={1} defaultValue={product.moq || ""} className={inputClass} placeholder="Kosongkan = Nego" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Satuan</label>
            <input name="moqUnit" defaultValue={product.moqUnit || "pcs"} className={inputClass} />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium block mb-1">Harga Indikatif (Rp) <span className="text-xs text-neutral-500">(Opsional)</span></label>
          <input name="priceMin" type="number" defaultValue={product.priceMin || ""} className={inputClass} placeholder="Kosongkan = Nego" />
        </div>

        {/* SECTION UPLOAD GAMBAR */}
        <div className="rounded-md border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
          <label className="text-sm font-medium block mb-2">Gambar Produk (Bisa lebih dari 1)</label>
          
          <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-forest-700 file:text-white hover:file:bg-forest-500" />
          {uploading && <p className="mt-2 text-sm text-blue-600">Sedang mengunggah...</p>}
          
          {/* Tampilan Gabungan Gambar Lama & Baru */}
          <div className="mt-4 flex flex-wrap gap-3">
            {/* Gambar Lama */}
            {existingImages.map((img) => (
              <div key={img.id} className="relative h-24 w-24 rounded-md border border-neutral-200 dark:border-neutral-700 overflow-hidden group">
                <img 
                  src={img.url} 
                  alt="Gambar Lama" 
                  className="h-full w-full object-cover cursor-zoom-in" 
                  onClick={() => setSelectedImage(img.url)} 
                />
                <button 
                  type="button" 
                  onClick={() => handleDeleteExistingImage(img.id)} 
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}

            {/* Gambar Baru */}
            {newImages.map((url, idx) => (
              <div key={`new-${idx}`} className="relative h-24 w-24 rounded-md border border-blue-300 dark:border-blue-700 overflow-hidden group">
                <img 
                  src={url} 
                  alt="Gambar Baru" 
                  className="h-full w-full object-cover cursor-zoom-in" 
                  onClick={() => setSelectedImage(url)} 
                />
                <button 
                  type="button" 
                  onClick={() => handleDeleteNewImage(idx)} 
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-blue-600/80 text-white text-[9px] text-center py-0.5">Baru</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving || uploading} className="flex-1 h-11">{saving ? "Menyimpan..." : "Simpan Perubahan"}</Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} className="h-11">Batal</Button>
        </div>
      </form>

      {/* MODAL ZOOM GAMBAR (LIGHTBOX) */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm cursor-zoom-out" 
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedImage} alt="Zoom" className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl" />
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }} 
              className="absolute -top-10 right-0 text-white bg-black/50 hover:bg-black/70 rounded-full h-8 w-8 flex items-center justify-center text-xl font-bold transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}