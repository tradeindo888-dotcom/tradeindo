"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export default function VerificationPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [company, setCompany] = useState<any>(null);
  
  // State untuk file yang akan diunggah
  // Format: { label: string, files: File[] }
  const [uploads, setUploads] = useState<{ label: string; files: File[]; isPdf: boolean }[]>([
    { label: "KTP Direktur / Penanggung Jawab", files: [], isPdf: false },
    { label: "NIB (Nomor Induk Berusaha)", files: [], isPdf: true },
    { label: "Akta Pendirian Perusahaan", files: [], isPdf: true },
  ]);

  // Class CSS untuk Input agar rapi di HP
  const inputClass = "w-full h-11 rounded-md border border-neutral-300 px-3 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/${lang}/login`);
      return;
    }
    if (status === "authenticated") {
      fetch("/api/seller/profile") // Mengambil data profil untuk cek status verifikasi
        .then(res => res.json())
        .then(data => {
          setCompany(data);
          setFetching(false);
        })
        .catch(() => {
          toast.error("Gagal memuat data profil.");
          setFetching(false);
        });
    }
  }, [status, router, lang]);

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // Batasan ukuran 5MB per file
    const validFiles = selectedFiles.filter(f => f.size <= 5 * 1024 * 1024);
    if (validFiles.length !== selectedFiles.length) {
      toast.error("Beberapa file melebihi 5MB dan tidak diunggah.");
    }

    setUploads(prev => {
      const newUploads = [...prev];
      newUploads[index].files = validFiles;
      return newUploads;
    });
    e.target.value = ""; // Reset input
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validasi: Pastikan semua dokumen wajib sudah diunggah
    const missingDocs = uploads.filter(u => u.files.length === 0);
    if (missingDocs.length > 0) {
      return toast.error(`Harap unggah dokumen: ${missingDocs.map(d => d.label).join(", ")}`);
    }

    setLoading(true);
    try {
      const documentData = [];

      // Unggah setiap file ke Cloudinary via API
      for (const item of uploads) {
        const uploadedFiles = [];
        for (const file of item.files) {
          const fd = new FormData();
          fd.append("file", file);
          
          const res = await fetch("/api/upload/public", { method: "POST", body: fd });
          if (!res.ok) throw new Error(`Gagal mengunggah ${item.label}`);
          
          const data = await res.json();
          uploadedFiles.push({ url: data.url, isPdf: item.isPdf });
        }

        documentData.push({
          label: item.label,
          files: uploadedFiles
        });
      }

      // Kirim data ke API verifikasi
      const res = await fetch("/api/workspace/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentsData: documentData })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengirim pengajuan verifikasi.");
      }

      toast.success("Pengajuan verifikasi berhasil dikirim! Mohon tunggu persetujuan Admin.");
      router.push(`/${lang}/workspace/seller`);

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <div className="p-16 text-center text-neutral-500">Memuat data...</div>;

  // Tampilan jika sudah terverifikasi
  if (company?.verificationStatus === "VERIFIED") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-forest-700 dark:text-lime-400 mb-2">Perusahaan Anda Sudah Terverifikasi!</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">Akun Anda kini memiliki lencana terverifikasi dan dipercaya oleh lebih banyak Buyer.</p>
        <Button onClick={() => router.push(`/${lang}/workspace/seller`)}>Kembali ke Dashboard</Button>
      </div>
    );
  }

  // Tampilan jika sedang PENDING
  if (company?.verificationStatus === "PENDING") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-2">Pengajuan Sedang Ditinjau</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mb-6">Dokumen Anda sedang diperiksa oleh Admin. Proses ini biasanya memakan waktu 1-3 hari kerja.</p>
        <Button onClick={() => router.push(`/${lang}/workspace/seller`)}>Kembali ke Dashboard</Button>
      </div>
    );
  }

  // Tampilan Form (Belum verifikasi / Ditolak)
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold mb-2">
          {lang === "en" ? "Apply for Verification" : "Ajukan Verifikasi"}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {lang === "en" 
            ? "Upload valid company documents to get a Verified badge and increase buyer trust." 
            : "Unggah dokumen perusahaan yang sah untuk mendapatkan lencana Terverifikasi dan meningkatkan kepercayaan Buyer."}
        </p>
      </div>

      {company?.verificationStatus === "REJECTED" && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300">
          <strong>Pengajuan sebelumnya ditolak.</strong> Silakan periksa kembali kelengkapan dan kejelasan dokumen Anda, lalu ajukan ulang.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-6">
        
        {uploads.map((item, index) => (
          <div key={index} className="space-y-2">
            <label className="text-sm font-bold block">{item.label} <span className="text-red-500">*</span></label>
            <div className="relative">
              <input 
                type="file" 
                accept={item.isPdf ? "application/pdf,image/*" : "image/*"} 
                multiple={item.label.includes("Akta")} // Akta biasanya lebih dari 1 file
                onChange={(e) => handleFileChange(index, e)} 
                className="hidden" 
                id={`file-${index}`}
              />
              <label 
                htmlFor={`file-${index}`}
                className="flex items-center justify-center w-full h-24 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 bg-white dark:bg-neutral-900 transition-colors"
              >
                <div className="flex flex-col items-center text-neutral-500 dark:text-neutral-400">
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <span className="text-xs font-medium">Klik untuk memilih file (Maks 5MB)</span>
                </div>
              </label>
            </div>
            
            {item.files.length > 0 && (
              <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-2">
                ✓ {item.files.length} file terpilih: {item.files.map(f => f.name).join(", ")}
              </div>
            )}
          </div>
        ))}

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300">
          <strong>Perhatian:</strong> Pastikan dokumen terlihat jelas, tidak terpotong, dan tidak blur. Pemalsuan dokumen akan mengakibatkan pemblokiran akun permanen.
        </div>

        <Button type="submit" disabled={loading} className="w-full h-12 text-base font-bold">
          {loading ? "Mengirim Dokumen..." : "Kirim Pengajuan Verifikasi"}
        </Button>
      </form>
    </div>
  );
}