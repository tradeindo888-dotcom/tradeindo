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

  // 1. STATE FORM LENGKAP
  const [role, setRole] = useState<"BUYER" | "SUPPLIER">("SUPPLIER");
  const [loading, setLoading] = useState(false);
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

  // Efek menutup zoom dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // FUNGSI UPLOAD LOGO
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, dll)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoFile(file);
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = ""; 
  };

  // FUNGSI SUBMIT (ANTI-CRASH)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let uploadedLogoUrl = null;

      // 1. Upload logo ke API PUBLIK
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        
        const uploadRes = await fetch("/api/upload/public", {
          method: "POST",
          body: formData,
        });
        
        if (!uploadRes.ok) throw new Error("Gagal mengunggah logo.");
        const uploadData = await uploadRes.json();
        uploadedLogoUrl = uploadData.url;
      }

      // 2. Kirim data pendaftaran
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

      // 3. Cek format respons API (Mencegah error "Unexpected token E")
      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const textError = await res.text();
        console.error("Server response error:", textError);
        throw new Error("Terjadi kesalahan pada server. Silakan cek terminal.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Gagal mendaftar. Silakan coba lagi.");
      }

      toast.success(
        lang === "en" 
          ? "Registration successful! Please check your email to verify." 
          : "Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi."
      );

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
      <div className="flex w-full mb-8">
        <button
          type="button"
          onClick={() => setRole("BUYER")}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-all ${
            role === "BUYER" 
              ? "border-forest-700 text-forest-700 dark:border-lime-400 dark:text-lime-400 bg-forest-700/5" 
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

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ================= DATA USER ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">{lang === "en" ? "Full Name" : "Nama Lengkap"}</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-11 rounded-md border px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 outline-none"
              placeholder="Musim Mas"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full h-11 rounded-md border px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 outline-none"
              placeholder="email@contoh.com"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Password</label>
          <input
            required
            type="password"
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full h-11 rounded-md border px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 outline-none"
            placeholder="Minimal 6 karakter"
          />
        </div>

        {/* ================= DATA PERUSAHAAN ================= */}
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-bold mb-6">{lang === "en" ? "Company Information" : "Informasi Perusahaan"}</h2>
          
          {/* UPLOAD LOGO & ZOOM */}
          <div className="flex flex-col items-center justify-center mb-6">
            {logoPreview ? (
              <div className="relative group">
                <div 
                  className="h-32 w-48 rounded-lg overflow-hidden border-2 border-forest-700 cursor-pointer shadow-md bg-neutral-100 flex items-center justify-center p-2"
                  onClick={() => setSelectedImage(logoPreview)}
                  title="Klik untuk zoom"
                >
                  <img 
                    src={logoPreview} 
                    alt="Preview Logo" 
                    className="max-h-full max-w-full object-contain block transition-transform duration-300 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                    <span className="text-white text-xs font-bold">🔍 Zoom</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    setLogoFile(null); 
                    setLogoPreview(null); 
                  }}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs shadow-md hover:bg-red-700 z-10"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div 
                className="h-32 w-48 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors bg-white dark:bg-neutral-900"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                />
                <svg className="w-8 h-8 text-neutral-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[10px] text-neutral-500 font-medium mt-1">Upload Logo</span>
              </div>
            )}
            <p className="text-xs text-neutral-500 mt-3">{lang === "en" ? "Upload Logo (Optional)" : "Upload Logo (Opsional)"}</p>
          </div>

          <div className="space-y-4">
            {/* Nama Perusahaan */}
            <div>
              <label className="text-sm font-medium block mb-1">{lang === "en" ? "Company Name" : "Nama Perusahaan"}</label>
              <input
                required
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full h-11 rounded-md border px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 outline-none"
                placeholder="PT. Musim Mas"
              />
            </div>

            {/* Deskripsi Perusahaan */}
            <div>
              <label className="text-sm font-medium block mb-1">{lang === "en" ? "Company Description" : "Deskripsi Perusahaan"}</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-md border p-3 text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 outline-none"
                placeholder={lang === "en" ? "Tell us about your company..." : "Ceritakan tentang perusahaan Anda..."}
              />
            </div>

            {/* Kota & Provinsi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">{lang === "en" ? "City" : "Kota"}</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full h-11 rounded-md border px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{lang === "en" ? "Province" : "Provinsi"}</label>
                <input
                  type="text"
                  value={form.province}
                  onChange={(e) => setForm({ ...form, province: e.target.value })}
                  className="w-full h-11 rounded-md border px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 outline-none"
                />
              </div>
            </div>

            {/* Website & Tahun Berdiri */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1">Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full h-11 rounded-md border px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 outline-none"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{lang === "en" ? "Year Established" : "Tahun Berdiri"}</label>
                <input
                  type="number"
                  value={form.yearEstablished}
                  onChange={(e) => setForm({ ...form, yearEstablished: e.target.value })}
                  className="w-full h-11 rounded-md border px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 outline-none"
                  placeholder="2020"
                />
              </div>
            </div>

            {/* Alamat & Telepon */}
            <div>
              <label className="text-sm font-medium block mb-1">{lang === "en" ? "Full Address" : "Alamat Lengkap"}</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full h-11 rounded-md border px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 outline-none"
                placeholder="Jl. Contoh No. 123"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">{lang === "en" ? "Phone Number" : "Nomor Telepon"}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full h-11 rounded-md border px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700 focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 outline-none"
                placeholder="021-1234567 atau 08123456789"
              />
            </div>

            {/* Kesiapan Ekspor */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="exportCapability"
                checked={form.exportCapability}
                onChange={(e) => setForm({ ...form, exportCapability: e.target.checked })}
                className="h-4 w-4 accent-forest-700 rounded border-neutral-300"
              />
              <label htmlFor="exportCapability" className="text-sm font-medium cursor-pointer">
                {lang === "en" ? "Company is capable of export" : "Perusahaan ini mampu melayani ekspor"}
              </label>
            </div>
          </div>
        </div>

        {/* TOMBOL SUBMIT */}
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full h-12 text-base font-bold mt-8"
        >
          {loading 
            ? (lang === "en" ? "Registering..." : "Mendaftar...") 
            : (lang === "en" ? "Register Now" : "Daftar Sekarang")}
        </Button>

        <p className="text-center text-sm text-neutral-500 mt-4">
          {lang === "en" ? "Already have an account? " : "Sudah punya akun? "}
          <Link href={`/${lang}/login`} className="text-forest-700 font-medium hover:underline dark:text-lime-400">
            {lang === "en" ? "Log in here" : "Masuk di sini"}
          </Link>
        </p>
      </form>

      {/* LIGHTBOX ZOOM GAMBAR LOGO */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl max-h-[80vh] bg-white p-2 rounded-lg shadow-2xl">
            <img 
              src={selectedImage} 
              alt="Zoom Logo" 
              className="max-w-full max-h-[75vh] object-contain rounded-md" 
            />
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
              className="absolute -top-4 -right-4 text-white bg-red-500 hover:bg-red-600 rounded-full h-10 w-10 flex items-center justify-center text-xl font-bold transition-colors shadow-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}