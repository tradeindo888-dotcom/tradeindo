"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";
  const plan = (params.plan as string).toUpperCase();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null); 
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const prices = { 
    FREE: "Rp 0", 
    PRO: "Rp 49.000", 
    PREMIUM: "Rp 149.000" 
  };
  const price = prices[plan as keyof typeof prices] || "Rp 0";

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (plan !== "FREE" && !file) return setError(lang === "en" ? "Please select transfer proof." : "Pilih bukti transfer terlebih dahulu.");
    
    setUploading(true);
    setError(null);
    let proofUrl = null;

    try {
      if (plan !== "FREE" && file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error("upload");
        const uploadData = await uploadRes.json();
        proofUrl = uploadData.url;
      }

      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, paymentProofUrl: proofUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "submit");
      }

      alert(lang === "en" ? "Request sent! Awaiting admin verification." : "Pengajuan berhasil dikirim! Menunggu verifikasi Admin.");
      router.push(`/${lang}/workspace/seller`);
    } catch (err: any) {
      setError(
        err.message === "upload" 
          ? (lang === "en" ? "Failed to upload proof." : "Gagal mengunggah bukti transfer.")
          : (lang === "en" ? "Failed to submit request." : "Gagal mengirim pengajuan.")
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">
        {lang === "en" ? `Confirm ${plan} Plan` : `Konfirmasi Paket ${plan}`}
      </h1>
      
      {plan !== "FREE" ? (
        <div className="bg-white p-6 rounded-md border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 mb-6">
          <h2 className="font-semibold mb-2">{lang === "en" ? "Payment Instructions" : "Instruksi Pembayaran"}</h2>
          <p className="text-sm mb-4">
            {lang === "en" ? "Please transfer " : "Silakan transfer sejumlah "} 
            <strong>{price}</strong> {lang === "en" ? "to:" : "ke rekening berikut:"}
          </p>
          <div className="bg-neutral-100 p-4 rounded-md dark:bg-neutral-800">
            <p><strong>Bank BCA</strong></p>
            {/* REKENING SUDAH DIGANTI */}
            <p>{lang === "en" ? "Account No" : "No. Rekening"}: <strong>3491108558</strong></p>
            <p>{lang === "en" ? "Account Name" : "Atas Nama"}: <strong>Kevin Indo Trade</strong></p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-md border border-amber-200 mb-6">
          <p className="text-sm">
            {lang === "en" 
              ? "You are requesting a downgrade to FREE. This will be reviewed by Admin."
              : "Anda mengajukan penurunan paket ke FREE. Pengajuan ini akan ditinjau oleh Admin."}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-md border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 space-y-4">
        {plan !== "FREE" && (
          <>
            <h2 className="font-semibold">{lang === "en" ? "Upload Transfer Proof" : "Upload Bukti Transfer"}</h2>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setError(null);
              }}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-forest-700 file:text-white hover:file:bg-forest-500"
            />
            
            {preview && (
              <div className="mt-4 relative group w-fit">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="max-h-60 w-auto rounded-md border border-neutral-200 object-contain cursor-pointer hover:opacity-90 transition-opacity" 
                  onClick={() => setSelectedImage(preview)}
                />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs shadow-md hover:bg-red-700 transition-colors"
                >✕</button>
              </div>
            )}
            {preview && <p className="text-xs text-neutral-500 mt-1">*{lang === "en" ? "Click image to enlarge" : "Klik gambar untuk memperbesar"}</p>}
          </>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <Button type="submit" disabled={uploading} className="w-full">
          {uploading 
            ? (lang === "en" ? "Processing..." : "Memproses...") 
            : (plan === "FREE" ? (lang === "en" ? "Request Downgrade" : "Ajukan Downgrade") : (lang === "en" ? "Submit Request" : "Kirim Pengajuan & Bukti"))}
        </Button>
      </form>

      {/* LIGHTBOX (POP-UP ZOOM GAMBAR) */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={selectedImage} 
              alt="Bukti Transfer Besar" 
              className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl"
            />
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 bg-black/50 hover:bg-black/70 rounded-full h-8 w-8 flex items-center justify-center text-xl font-bold transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}