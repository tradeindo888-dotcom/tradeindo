"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function NewRfqPage() {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  // State untuk Gambar
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    quantity: "",
    quantityUnit: "pcs",
    targetPrice: "",
    targetPriceMax: "",
    deliveryCity: "",
    deadlineAt: "",
    verifiedOnly: false,
  });

  // CLASS INPUT AGAR TIDAK ABU-ABU DI HP
  const inputClass = "w-full h-11 rounded-md border border-neutral-300 px-3 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push(`/${lang}/login`);
      return;
    }

    const role = (session.user as any).role;

    if (role === "ADMIN") {
      toast.error("Admin tidak bisa membuat RFQ.");
      router.push(`/${lang}/admin`);
      return;
    }

    if (role !== "BUYER" && role !== "SUPPLIER") {
      toast.error("Hanya Buyer atau Supplier yang dapat membuat RFQ.");
      router.push(`/${lang}/workspace`);
    }
  }, [session, status, router, lang]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(console.error);
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 3) {
      toast.error(lang === "en" ? "Maximum 3 images allowed." : "Maksimal 3 gambar diizinkan.");
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append("file", files[i]);

      try {
        const res = await fetch("/api/upload/public", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          uploadedUrls.push(data.url);
        } else {
          toast.error("Gagal mengunggah gambar.");
        }
      } catch (err) {
        toast.error("Error uploading file.");
      }
    }

    setImages((prev) => [...prev, ...uploadedUrls]);
    setUploading(false);
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const body = {
        title: form.title,
        description: form.description,
        categoryId: form.categoryId,
        quantity: Number(form.quantity),
        quantityUnit: form.quantityUnit,
        targetPrice: form.targetPrice ? Number(form.targetPrice) : null,
        targetPriceMax: form.targetPriceMax ? Number(form.targetPriceMax) : null,
        deliveryCity: form.deliveryCity || null,
        deadlineAt: form.deadlineAt,
        verifiedOnly: form.verifiedOnly,
        images: images,
      };

      const res = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal membuat RFQ");
      }

      toast.success(lang === "en" ? "RFQ created successfully!" : "RFQ berhasil dibuat!");

      const role = (session?.user as any)?.role;
      if (role === "SUPPLIER") {
        router.push(`/${lang}/workspace/seller`);
      } else {
        router.push(`/${lang}/workspace/buyer`);
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  if (
    status === "loading" ||
    !session?.user ||
    ((session.user as any).role !== "BUYER" && (session.user as any).role !== "SUPPLIER")
  ) {
    return <div className="p-16 text-center text-neutral-500">Memuat...</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-6 text-neutral-900 dark:text-white">
        {lang === "en" ? "Create New RFQ" : "Buat RFQ Baru"}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-5">
        
        <div>
          <label className="text-sm font-medium block mb-1 text-neutral-700 dark:text-neutral-300">Judul RFQ</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Contoh: Butuh Kopi Arabika 500kg" />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1 text-neutral-700 dark:text-neutral-300">Deskripsi</label>
          <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} h-auto py-3`} placeholder="Jelaskan kebutuhan Anda secara detail..." />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1 text-neutral-700 dark:text-neutral-300">Kategori</label>
          <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputClass}>
            <option value="">Pilih Kategori...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{lang === "en" ? c.nameEn : c.nameId}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1 text-neutral-700 dark:text-neutral-300">Jumlah</label>
            <input required type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1 text-neutral-700 dark:text-neutral-300">Satuan</label>
            <input value={form.quantityUnit} onChange={(e) => setForm({ ...form, quantityUnit: e.target.value })} className={inputClass} placeholder="pcs / kg / ton" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1 text-neutral-700 dark:text-neutral-300">Harga Target Min (Rp)</label>
            <input type="number" min={0} value={form.targetPrice} onChange={(e) => setForm({ ...form, targetPrice: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1 text-neutral-700 dark:text-neutral-300">Harga Target Max (Rp)</label>
            <input type="number" min={0} value={form.targetPriceMax} onChange={(e) => setForm({ ...form, targetPriceMax: e.target.value })} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium block mb-1 text-neutral-700 dark:text-neutral-300">Kota Pengiriman</label>
            <input value={form.deliveryCity} onChange={(e) => setForm({ ...form, deliveryCity: e.target.value })} className={inputClass} placeholder="Jakarta, Surabaya..." />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1 text-neutral-700 dark:text-neutral-300">Batas Waktu</label>
            <input required type="date" value={form.deadlineAt} onChange={(e) => setForm({ ...form, deadlineAt: e.target.value })} className={inputClass} />
          </div>
        </div>

        {/* UPLOAD GAMBAR */}
        <div className="rounded-md border border-dashed border-neutral-300 p-4 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <label className="text-sm font-medium block mb-2 text-neutral-700 dark:text-neutral-300">Gambar Referensi (Maks 3)</label>
          <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-forest-700 file:text-white hover:file:bg-forest-500" />
          {uploading && <p className="mt-2 text-sm text-blue-600">Mengunggah gambar...</p>}
          
          {images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {images.map((url, idx) => (
                <div key={idx} className="relative h-20 w-20 rounded-md border overflow-hidden group">
                  <img src={url} alt="Preview" className="h-full w-full object-cover cursor-pointer hover:opacity-80" onClick={() => setSelectedImage(url)} />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CHECKBOX VERIFIED ONLY (DIPERBAIKI) */}
        <div className="flex items-center gap-3 p-4 border border-neutral-200 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 dark:border-neutral-700">
          <input 
            type="checkbox" 
            checked={form.verifiedOnly} 
            onChange={(e) => setForm({ ...form, verifiedOnly: e.target.checked })} 
            className="h-5 w-5 accent-forest-700 rounded border border-neutral-300 bg-white focus:ring-forest-700 dark:border-neutral-600 dark:bg-neutral-800 dark:focus:ring-lime-400" 
            id="verifiedOnly"
          />
          <label htmlFor="verifiedOnly" className="text-sm font-medium cursor-pointer text-neutral-900 dark:text-neutral-200">
            Hanya tampilkan ke supplier terverifikasi
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading || uploading} className="flex-1 h-11">{loading ? "Membuat RFQ..." : "Buat RFQ"}</Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={loading} className="h-11">Batal</Button>
        </div>
      </form>

      {/* LIGHTBOX GAMBAR */}
      {selectedImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={selectedImage} alt="Zoom" className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl" />
            <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }} className="absolute -top-10 right-0 text-white bg-black/50 rounded-full h-8 w-8 flex items-center justify-center text-xl font-bold">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}