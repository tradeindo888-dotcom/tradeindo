"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";

  // 1. STATE FORM
  const [role, setRole] = useState<"BUYER" | "SUPPLIER">("BUYER");
  const [loading, setLoading] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    description: "",
    city: "",
    province: "",
    website: "",
    yearEstablished: "",
    address: "",
    phone: "",
    exportCapability: false,
  });

  // State Logo & Zoom
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CLASS INPUT AGAR TIDAK ABU-ABU DI HP
  const inputClass = "w-full h-11 rounded-md border border-neutral-300 px-3 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
        setIsGuideOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("File harus berupa gambar.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Ukuran gambar maksimal 5MB.");

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoFile(file);
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; 
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      let uploadedLogoUrl = null;
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        const uploadRes = await fetch("/api/upload/public", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("Gagal mengunggah logo.");
        const uploadData = await uploadRes.json();
        uploadedLogoUrl = uploadData.url;
      }

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          role,
          logoUrl: uploadedLogoUrl,
          yearEstablished: form.yearEstablished ? Number(form.yearEstablished) : null,
        }),
      });

      const contentType = res.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        throw new Error("Terjadi kesalahan pada server.");
      }

      if (!res.ok) throw new Error(data.error || "Gagal mendaftar.");

      toast.success("Pendaftaran berhasil! Silakan login.");
      router.push(`/${lang}/login`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      
      {/* TABS: PILIH ROLE */}
      <div className="flex w-full mb-4">
        <button
          type="button"
          onClick={() => setRole("BUYER")}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${
            role === "BUYER" 
              ? "border-forest-700 text-white bg-forest-700 dark:border-lime-400 dark:bg-forest-700" 
              : "border-neutral-200 text-neutral-500 hover:text-neutral-700 bg-white dark:bg-neutral-900 dark:border-neutral-800"
          }`}
        >
          {lang === "en" ? "I am a Buyer" : "Saya Buyer"}
        </button>
        <button
          type="button"
          onClick={() => setRole("SUPPLIER")}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${
            role === "SUPPLIER" 
              ? "border-forest-700 text-white bg-forest-700 dark:border-lime-400 dark:bg-forest-700" 
              : "border-neutral-200 text-neutral-500 hover:text-neutral-700 bg-white dark:bg-neutral-900 dark:border-neutral-800"
          }`}
        >
          {lang === "en" ? "I am a Supplier" : "Saya Supplier"}
        </button>
      </div>

      {/* KOTAK PANDUAN DINAMIS */}
      <div className="mb-8 p-4 rounded-xl border bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-blue-900 dark:text-blue-200">
          {role === "BUYER" ? (
            <p><strong>Sebagai Buyer:</strong> Anda dapat mencari produk, membuat RFQ (permintaan penawaran), dan menghubungi Supplier secara langsung.</p>
          ) : (
            <p><strong>Sebagai Supplier:</strong> Anda dapat menampilkan katalog produk, menerima RFQ dari Buyer, dan mengirimkan penawaran (Quotation).</p>
          )}
        </div>
        <button 
          type="button" 
          onClick={() => setIsGuideOpen(true)}
          className="shrink-0 text-xs font-bold text-blue-700 bg-white border border-blue-300 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors dark:bg-blue-800 dark:text-blue-100 dark:border-blue-600 dark:hover:bg-blue-700"
        >
          📖 Panduan Lengkap
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* DATA DIRI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">{lang === "en" ? "Full Name" : "Nama Lengkap"}</label>
            <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="John Doe" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="email@contoh.com" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Password</label>
          <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder="Minimal 6 karakter" />
        </div>

        {/* DATA PERUSAHAAN */}
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-bold mb-6">{lang === "en" ? "Company Information" : "Informasi Perusahaan"}</h2>
          
          {/* UPLOAD LOGO */}
          <div className="flex flex-col items-center justify-center mb-6">
            {logoPreview ? (
              <div className="relative group">
                <div className="h-32 w-48 rounded-lg overflow-hidden border-2 border-forest-700 cursor-pointer shadow-md bg-neutral-100 flex items-center justify-center p-2" onClick={() => setSelectedImage(logoPreview)}>
                  <img src={logoPreview} alt="Preview Logo" className="max-h-full max-w-full object-contain block transition-transform duration-300 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                    <span className="text-white text-xs font-bold">🔍 Zoom</span>
                  </div>
                </div>
                <button type="button" onClick={(e) => { e.preventDefault(); setLogoFile(null); setLogoPreview(null); }} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs shadow-md hover:bg-red-700 z-10">✕</button>
              </div>
            ) : (
              <div className="h-32 w-48 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors bg-white dark:bg-neutral-900" onClick={() => fileInputRef.current?.click()}>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleLogoChange} />
                <svg className="w-8 h-8 text-neutral-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-[10px] text-neutral-500 font-medium mt-1">Upload Logo</span>
              </div>
            )}
            <p className="text-xs text-neutral-500 mt-3">Upload Logo (Opsional)</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">{lang === "en" ? "Company Name" : "Nama Perusahaan"}</label>
              <input required type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className={inputClass} placeholder="PT. Contoh Makmur" />
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">{lang === "en" ? "Company Description" : "Deskripsi Perusahaan"}</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} h-auto py-3`} placeholder="Ceritakan tentang perusahaan Anda..." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium block mb-1">{lang === "en" ? "City" : "Kota"}</label><input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} /></div>
              <div><label className="text-sm font-medium block mb-1">{lang === "en" ? "Province" : "Provinsi"}</label><input type="text" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className={inputClass} /></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium block mb-1">Website</label><input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputClass} placeholder="https://..." /></div>
              <div><label className="text-sm font-medium block mb-1">{lang === "en" ? "Year Established" : "Tahun Berdiri"}</label><input type="number" value={form.yearEstablished} onChange={(e) => setForm({ ...form, yearEstablished: e.target.value })} className={inputClass} placeholder="2020" /></div>
            </div>

            <div><label className="text-sm font-medium block mb-1">{lang === "en" ? "Full Address" : "Alamat Lengkap"}</label><input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} /></div>
            <div><label className="text-sm font-medium block mb-1">{lang === "en" ? "Phone Number" : "Nomor Telepon"}</label><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} /></div>

            {/* CUSTOM CHECKBOX EXPORT (CEKLIS SUDAH DIPERBAIKI) */}
            <label className="flex items-start gap-3 p-4 border border-neutral-200 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 dark:border-neutral-700 cursor-pointer mt-2">
              <input
                type="checkbox"
                id="exportCapability"
                checked={form.exportCapability}
                onChange={(e) => setForm({ ...form, exportCapability: e.target.checked })}
                className="sr-only peer"
              />
              <div className="mt-0.5 h-5 w-5 shrink-0 rounded border border-neutral-300 bg-white dark:border-neutral-500 dark:bg-neutral-700 peer-checked:bg-forest-700 peer-checked:border-forest-700 dark:peer-checked:bg-lime-400 dark:peer-checked:border-lime-400 peer-checked:[&_svg]:opacity-100 flex items-center justify-center transition-colors">
                <svg className="w-3.5 h-3.5 text-white dark:text-neutral-900 opacity-0 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-200">
                  {lang === "en" ? "Company is capable of export" : "Perusahaan ini mampu melayani ekspor"}
                </span>
              </div>
            </label>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold mt-8">
          {loading ? "Mendaftar..." : "Daftar Sekarang"}
        </Button>

        <p className="text-center text-sm text-neutral-500 mt-4">
          {lang === "en" ? "Already have an account? " : "Sudah punya akun? "}
          <Link href={`/${lang}/login`} className="text-forest-700 font-medium hover:underline dark:text-lime-400">Masuk di sini</Link>
        </p>
      </form>

      {/* MODAL PANDUAN */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setIsGuideOpen(false)}>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-neutral-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 border-b border-neutral-200 pb-3 dark:border-neutral-800">
              <h3 className="font-display text-xl font-bold flex items-center gap-2">📖 Panduan Trade Indo</h3>
              <button onClick={() => setIsGuideOpen(false)} className="text-neutral-500 hover:text-red-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <div className="space-y-6 text-sm">
              <div className={`p-4 rounded-lg border ${role === 'BUYER' ? 'border-forest-700 bg-forest-50 dark:bg-forest-900/20' : 'border-neutral-200 dark:border-neutral-800'}`}>
                <h4 className="font-bold text-lg mb-2 text-forest-900 dark:text-lime-400">🛒 Peran: Buyer (Pembeli)</h4>
                <p className="text-neutral-600 dark:text-neutral-300 mb-3">Cocok untuk perusahaan yang ingin mencari barang/jasa untuk kebutuhan operasional atau dijual kembali.</p>
                <ul className="list-disc pl-5 space-y-1 text-neutral-700 dark:text-neutral-300">
                  <li><strong>Cari Produk & Supplier:</strong> Menjelajahi katalog dan mencari supplier terverifikasi.</li>
                  <li><strong>Buat RFQ (Request for Quotation):</strong> Mengajukan permintaan penawaran dengan detail kuantitas dan target harga.</li>
                  <li><strong>Terima Penawaran:</strong> Membandingkan penawaran (quotation) dari berbagai supplier secara *Closed Bid* (hanya pembuat dan penawar yang bisa lihat).</li>
                  <li><strong>Pilih Pemenang:</strong> Menyetujui satu penawaran terbaik, yang akan otomatis mengirim pesan ke supplier pemenang.</li>
                </ul>
              </div>

              <div className={`p-4 rounded-lg border ${role === 'SUPPLIER' ? 'border-forest-700 bg-forest-50 dark:bg-forest-900/20' : 'border-neutral-200 dark:border-neutral-800'}`}>
                <h4 className="font-bold text-lg mb-2 text-forest-900 dark:text-lime-400">🏭 Peran: Supplier (Pemasok)</h4>
                <p className="text-neutral-600 dark:text-neutral-300 mb-3">Cocok untuk produsen, distributor, atau eksportir yang ingin menawarkan produk ke pasar B2B.</p>
                <ul className="list-disc pl-5 space-y-1 text-neutral-700 dark:text-neutral-300">
                  <li><strong>Tampilkan Katalog Produk:</strong> Mengunggah produk beserta harga dan Minimum Order Quantity (MOQ).</li>
                  <li><strong>Ikuti RFQ:</strong> Menerima permintaan penawaran dari Buyer dan mengirimkan *Quotation* (penawaran harga).</li>
                  <li><strong>Promosi (Sponsorship):</strong> Meningkatkan visibilitas produk di halaman utama dengan fitur berbayar.</li>
                  <li><strong>Negosiasi:</strong> Berkomunikasi langsung dengan Buyer via Chat untuk kesepakatan akhir.</li>
                </ul>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                <strong>Catatan Penting:</strong> Pilih peran yang paling sesuai dengan aktivitas utama perusahaan Anda saat ini. Anda tetap dapat menggunakan fitur dari peran lain nantinya (misalnya Buyer yang juga membuat RFQ), namun data profil dan tagihan akan disesuaikan dengan peran yang dipilih saat mendaftar.
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-center">
              <button onClick={() => setIsGuideOpen(false)} className="rounded-md bg-forest-700 px-8 py-2.5 text-sm font-medium text-white hover:bg-forest-500 transition-colors">Mengerti & Lanjut Daftar</button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX ZOOM LOGO */}
      {selectedImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-2xl max-h-[80vh] bg-white p-2 rounded-lg shadow-2xl">
            <img src={selectedImage} alt="Zoom Logo" className="max-w-full max-h-[75vh] object-contain rounded-md" />
            <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }} className="absolute -top-4 -right-4 text-white bg-red-500 hover:bg-red-600 rounded-full h-10 w-10 flex items-center justify-center text-xl font-bold transition-colors shadow-lg">✕</button>
          </div>
        </div>
      )}

    </div>
  );
}