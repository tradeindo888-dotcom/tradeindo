"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import Link from "next/link";

// Tipe data untuk File yang diunggah
type UploadedFile = {
  file: File;
  url: string; // Object URL untuk preview
  isPdf: boolean;
};

// Tipe data untuk Slot
type UploadSlot = {
  id: string;
  label: string;
  subLabel?: string;
  files: UploadedFile[];
};

export default function VerificationPage() {
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";
  const { data: session, status } = useSession();
  
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // State untuk Slot Upload
  const [slots, setSlots] = useState<UploadSlot[]>([]);
  
  // State untuk Lightbox
  const [activeFile, setActiveFile] = useState<{ url: string; isPdf: boolean } | null>(null);

  const isSupplier = (session?.user as any)?.role === "SUPPLIER";

  // Inisialisasi Slot berdasarkan Role
  useEffect(() => {
    if (status === "authenticated") {
      const initialSlots: UploadSlot[] = isSupplier 
        ? [
            { id: "nib", label: "NIB / SIUP / Akta Pendirian", files: [] },
            { id: "npwp", label: "NPWP Perusahaan", files: [] },
            { id: "ktp", label: "KTP Direktur / Penanggung Jawab", files: [] },
            { 
              id: "rekening", 
              label: "Rekening Koran (3 Bulan Terakhir)", 
              subLabel: "Nama pemilik rekening wajib sama dengan Nama PT/CV.",
              files: [] 
            },
          ]
        : [
            { id: "npwp", label: "NPWP / NIB Perusahaan", files: [] },
            { id: "ktp", label: "KTP Penanggung Jawab (PIC)", files: [] },
          ];
      setSlots(initialSlots);
      
      // Fetch Status Profile
      fetch("/api/workspace/profile")
        .then(res => res.json())
        .then(data => {
          setCompany(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, isSupplier]);

  // Handle Multiple File Selection
  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const newFiles: UploadedFile[] = selectedFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      isPdf: file.type === "application/pdf"
    }));

    setSlots(prev => prev.map(slot => 
      slot.id === id ? { ...slot, files: [...slot.files, ...newFiles] } : slot
    ));

    // Reset input value agar bisa memilih file yang sama lagi
    e.target.value = "";
  };

  // Hapus File Spesifik
  const removeFile = (slotId: string, fileIndex: number) => {
    setSlots(prev => prev.map(slot => {
      if (slot.id === slotId) {
        const updatedFiles = [...slot.files];
        updatedFiles.splice(fileIndex, 1);
        return { ...slot, files: updatedFiles };
      }
      return slot;
    }));
  };

  // Submit Verifikasi
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Cek apakah semua slot wajib sudah memiliki minimal 1 file
    const emptySlots = slots.filter(s => s.files.length === 0);
    if (emptySlots.length > 0) {
      return toast.error(`Harap unggah dokumen: ${emptySlots.map(s => s.label).join(", ")}`);
    }

    setUploading(true);
    try {
      // 1. Upload semua file dan bentuk strukturnya
      const documentsData = await Promise.all(
        slots.map(async (slot) => {
          const uploadedFiles = await Promise.all(
            slot.files.map(async (fileObj) => {
              const fd = new FormData();
              fd.append("file", fileObj.file);
              const res = await fetch("/api/upload", { method: "POST", body: fd });
              if (!res.ok) throw new Error(`Gagal upload file ${slot.label}`);
              const data = await res.json();
              return { url: data.url, isPdf: fileObj.isPdf };
            })
          );
          return { label: slot.label, files: uploadedFiles };
        })
      );

      // 2. Kirim data ke API Verifikasi
      const res = await fetch("/api/workspace/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentsData }), 
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal mengajukan verifikasi");
      }
      
      toast.success("Pengajuan berhasil dikirim! Menunggu review Admin.");
      
      // Reset form
      setSlots(prev => prev.map(s => ({ ...s, files: [] })));
      
      // Refresh status
      fetch("/api/workspace/profile").then(res => res.json()).then(data => setCompany(data));
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat mengajukan verifikasi.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <div className="p-16 text-center">Memuat data...</div>;

  const vStatus = company?.verificationStatus || "BASIC";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Verifikasi Perusahaan</h1>
        <Link href={`/${lang}/workspace`} className="text-sm text-forest-700 hover:underline">← Kembali</Link>
      </div>

      {/* STATUS BOX */}
      <div className="rounded-xl border bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900 shadow-sm mb-6">
        <h2 className="text-lg font-bold mb-2">Status Verifikasi:</h2>
        <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4 ${
          vStatus === "VERIFIED" ? "bg-green-100 text-green-800" :
          vStatus === "PENDING" ? "bg-amber-100 text-amber-800" :
          vStatus === "REJECTED" ? "bg-red-100 text-red-800" :
          "bg-neutral-100 text-neutral-800"
        }`}>
          {vStatus}
        </div>

        {vStatus === "VERIFIED" && (
          <div className="bg-green-50 p-4 rounded-lg text-green-800 border border-green-200">
            🎉 Selamat! Perusahaan Anda sudah terverifikasi.
          </div>
        )}
        {vStatus === "PENDING" && (
          <div className="bg-amber-50 p-4 rounded-lg text-amber-800 border border-amber-200">
            ⏳ Pengajuan Anda sedang ditinjau oleh Admin. Mohon tunggu maksimal 2x24 jam kerja.
          </div>
        )}
      </div>

      {/* FORM VERIFIKASI */}
      {vStatus !== "VERIFIED" && (
        <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 shadow-sm overflow-hidden">
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 border-b border-blue-100 dark:border-blue-900/50">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2 text-lg">
              📋 Persyaratan Dokumen {isSupplier ? "Supplier" : "Buyer"}
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Anda dapat mengunggah lebih dari 1 file (JPG, PNG, atau PDF) pada setiap kolom.
            </p>
          </div>

          <div className="p-6">
            {vStatus === "REJECTED" && (
              <div className="bg-red-50 p-4 rounded-lg text-red-800 border border-red-200 mb-6 text-sm">
                <p className="font-bold mb-1">❌ Pengajuan Sebelumnya Ditolak</p>
                <p>Alasan: <strong>{company?.verificationRequests?.[0]?.rejectionReason || "Dokumen tidak sesuai standar."}</strong></p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                {slots.map((slot) => (
                  <div key={slot.id} className="flex flex-col gap-4 p-5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{slot.label}</h4>
                        <p className={`text-xs mt-1 ${slot.subLabel ? 'text-red-500 font-medium' : 'text-neutral-500'}`}>
                          {slot.subLabel || "Wajib diunggah (Minimal 1 file)"}
                        </p>
                      </div>
                      
                      <div className="relative shrink-0">
                        <input 
                          type="file" 
                          multiple
                          accept=".pdf,image/*" 
                          onChange={(e) => handleFileChange(slot.id, e)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-forest-700 text-white hover:bg-forest-500 transition-colors">
                          <span className="text-xs font-medium">+ Pilih File</span>
                        </div>
                      </div>
                    </div>

                    {slot.files.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {slot.files.map((fileObj, idx) => (
                          <div key={idx} className="relative flex flex-col items-center gap-1 p-2 bg-white dark:bg-neutral-900 border rounded-md shadow-sm">
                            {fileObj.isPdf ? (
                              <div 
                                className="h-14 w-full bg-red-50 flex items-center justify-center rounded cursor-pointer hover:bg-red-100 transition-colors"
                                onClick={() => setActiveFile({ url: fileObj.url, isPdf: true })}
                              >
                                <span className="text-red-600 font-bold text-xs">PDF FILE</span>
                              </div>
                            ) : (
                              <img 
                                src={fileObj.url} 
                                alt="Preview" 
                                className="h-14 w-full object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setActiveFile({ url: fileObj.url, isPdf: false })}
                              />
                            )}
                            <span className="text-[10px] text-center w-full truncate text-neutral-600 dark:text-neutral-400">
                              {fileObj.file.name}
                            </span>
                            
                            <button 
                              type="button" 
                              onClick={() => removeFile(slot.id, idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs shadow-md hover:bg-red-600"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                <Button type="submit" disabled={uploading || slots.some(s => s.files.length === 0)} className="w-full h-12 text-base">
                  {uploading ? "Mengunggah dan Mengirim..." : "Kirim Pengajuan Verifikasi"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX (ZOOM GAMBAR / VIEW PDF) */}
      {activeFile && (
        <div 
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-5xl flex justify-end mb-2">
            <button 
              onClick={() => setActiveFile(null)}
              className="text-white hover:text-red-400 bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 flex items-center justify-center text-xl font-bold transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="relative w-full max-w-5xl h-[85vh] bg-neutral-900 rounded-lg overflow-hidden border border-neutral-700 flex items-center justify-center">
            {activeFile.isPdf ? (
              <iframe 
                src={activeFile.url} 
                className="w-full h-full"
                title="Dokumen PDF"
              />
            ) : (
              <img 
                src={activeFile.url} 
                alt="Zoom Dokumen" 
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}