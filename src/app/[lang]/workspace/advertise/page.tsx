"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

const PACKAGES = [
  { days: 7, price: 10000, label: "7 Hari" },
  { days: 15, price: 20000, label: "15 Hari" },
  { days: 30, price: 35000, label: "30 Hari", popular: true },
  { days: 60, price: 60000, label: "60 Hari" },
];

export default function AdvertisePage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";

  const [selectedPkg, setSelectedPkg] = useState(PACKAGES[2]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerLink, setBannerLink] = useState("");
  const [loading, setLoading] = useState(false);

  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // CLASS INPUT AGAR TIDAK ABU-ABU DI HP
  const inputClass = "w-full h-11 rounded-md border border-neutral-300 px-3 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 10MB.");
      e.target.value = "";
      return;
    }
    
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
    e.target.value = ""; 
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 10MB.");
      e.target.value = "";
      return;
    }
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bannerFile || !proofFile) return toast.error("Lengkapi gambar banner dan bukti transfer.");
    setLoading(true);
    
    try {
      // 1. Upload Banner
      const fd1 = new FormData(); 
      fd1.append("file", bannerFile);
      const res1 = await fetch("/api/upload/public", { method: "POST", body: fd1 });
      if (!res1.ok) throw new Error("Gagal upload banner");
      const data1 = await res1.json();

      // 2. Upload Bukti TF
      const fd2 = new FormData(); 
      fd2.append("file", proofFile);
      const res2 = await fetch("/api/upload/public", { method: "POST", body: fd2 });
      if (!res2.ok) throw new Error("Gagal upload bukti");
      const data2 = await res2.json();

      // 3. Simpan Pengajuan ke Database
      const res = await fetch("/api/workspace/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: data1.url,
          paymentProofUrl: data2.url,
          durationDays: selectedPkg.days,
          price: selectedPkg.price,
          title: bannerTitle,
          linkUrl: bannerLink,
        }),
      });

      if (!res.ok) throw new Error("Gagal mengirim pengajuan");
      toast.success("Pengajuan iklan berhasil! Menunggu persetujuan Admin.");
      router.push(`/${lang}/workspace`);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Pasang Iklan Banner Utama</h1>
        <p className="text-neutral-500 text-sm">
          Tampilkan produk/brand Anda di halaman depan. Admin akan membantu menyesuaikan ukuran gambar Anda agar pas di website.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="text-sm font-bold mb-3 block">1. Pilih Paket Durasi</label>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {PACKAGES.map((pkg) => {
                const isSelected = selectedPkg.days === pkg.days;
                return (
                  <div key={pkg.days} onClick={() => setSelectedPkg(pkg)} className="relative group cursor-pointer">
                    <div className={`relative rounded-lg border-2 p-4 text-center transition-all duration-300 ease-out group-hover:scale-[1.04] group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:z-20 group-hover:ring-2 group-hover:ring-lime-400 ${
                        isSelected 
                          ? "border-forest-700 bg-forest-700/5 shadow-lg ring-2 ring-lime-400 z-10" 
                          : "border-neutral-200 dark:border-neutral-700 z-0 group-hover:border-forest-700"
                      }`}>
                      {pkg.popular && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm z-20">TERPOPULER</span>
                      )}
                      <div className="font-bold text-lg mt-1">{pkg.label}</div>
                      <div className="text-sm text-forest-700 dark:text-lime-400 font-semibold">Rp {pkg.price.toLocaleString("id-ID")}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Instruksi Pembayaran</h3>
            <p className="text-sm text-blue-800 dark:text-blue-400 mb-1">Silakan transfer ke:</p>
            <p className="font-bold text-lg text-blue-900 dark:text-white">Bank BCA - 3491108558</p>
            <p className="text-sm text-blue-800 dark:text-blue-400">a.n. Kevin Indo Trade</p>
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-900 dark:text-white">Total Tagihan: Rp {selectedPkg.price.toLocaleString("id-ID")}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-bold block">2. Upload Dokumen</label>
          
          <div>
            <span className="text-xs font-medium text-neutral-500 block mb-1">
              Gambar Banner (Bebas Ukuran, Maks 10MB)
            </span>
            {bannerPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 group mb-2 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center min-h-[150px] p-2">
                <img 
                  src={bannerPreview} 
                  alt="Preview Banner" 
                  className="max-h-[200px] object-contain cursor-pointer hover:opacity-90 transition-opacity" 
                  onClick={() => setSelectedImage(bannerPreview)} 
                />
                <button type="button" onClick={() => { setBannerFile(null); setBannerPreview(null); }} className="absolute top-2 right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs z-10 hover:bg-red-700 transition-colors">✕</button>
              </div>
            ) : (
              <div className="relative">
                <input type="file" accept="image/*" onChange={handleBannerUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  <span className="text-2xl mb-1">🖼️</span>
                  <span className="text-xs font-medium text-neutral-500">Klik pilih gambar banner</span>
                </div>
              </div>
            )}
            <p className="text-[10px] text-neutral-400 mt-1">*Gunakan gambar kualitas terbaik. Admin akan mengatur ukuran akhirnya.</p>
          </div>

          <div>
            <span className="text-xs font-medium text-neutral-500 block mb-1">Bukti Transfer (Maks 10MB)</span>
            {proofPreview ? (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 group mb-2">
                <img src={proofPreview} alt="Preview Bukti" className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setSelectedImage(proofPreview)} />
                <button type="button" onClick={() => { setProofFile(null); setProofPreview(null); }} className="absolute top-2 right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs z-10 hover:bg-red-700 transition-colors">✕</button>
              </div>
            ) : (
              <div className="relative">
                <input type="file" accept="image/*" onChange={handleProofUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  <span className="text-2xl mb-1">🧾</span>
                  <span className="text-xs font-medium text-neutral-500">Klik pilih bukti transfer</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <span className="text-xs font-medium text-neutral-500 block mb-1">Judul Banner (Opsional)</span>
            <input type="text" value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} placeholder="Promo Spesial Akhir Tahun" className={inputClass} />
          </div>

          <div>
            <span className="text-xs font-medium text-neutral-500 block mb-1">Link Tujuan (Opsional)</span>
            <input type="url" value={bannerLink} onChange={e => setBannerLink(e.target.value)} placeholder="https://toko-anda.com" className={inputClass} />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 mt-4 text-base shadow-md hover:shadow-lg transition-all">
            {loading ? "Mengirim Pengajuan..." : `Kirim Pengajuan (Rp ${selectedPkg.price.toLocaleString("id-ID")})`}
          </Button>
        </div>
      </form>

      {/* LIGHTBOX ZOOM GAMBAR */}
      {selectedImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-5xl max-h-[95vh]">
            <img src={selectedImage} alt="Zoom Gambar" className="max-w-full max-h-[95vh] object-contain rounded-md shadow-2xl" />
            <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }} className="absolute -top-12 right-0 text-white bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 flex items-center justify-center text-xl font-bold transition-colors">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}