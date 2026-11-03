"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AdHistoryPage() {
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";

  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/workspace/banners")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBanners(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fungsi Menentukan Badge Status
  const getStatusBadge = (banner: any) => {
    const now = new Date();
    const isExpired = banner.endDate && new Date(banner.endDate) < now;

    if (banner.status === "PENDING") {
      return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">🟡 Menunggu Persetujuan</span>;
    }
    if (banner.status === "REJECTED") {
      return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold border border-red-200">🔴 Ditolak</span>;
    }
    if (banner.status === "APPROVED") {
      if (isExpired) {
        return <span className="bg-neutral-100 text-neutral-600 px-3 py-1 rounded-full text-xs font-bold border border-neutral-200">⚪ Berakhir</span>;
      }
      return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold border border-green-200">🟢 Sedang Tayang</span>;
    }
    return null;
  };

  if (loading) return <div className="p-16 text-center">Memuat riwayat iklan...</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Riwayat Iklan Banner</h1>
          <p className="text-neutral-500 text-sm mt-1">Pantau status pengajuan iklan Anda di sini.</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${lang}/workspace/advertise`}>
            <Button className="bg-forest-700 text-white hover:bg-forest-500 h-10 px-4">+ Pasang Iklan Baru</Button>
          </Link>
          <Link href={`/${lang}/workspace`}>
            <Button variant="secondary" className="h-10 px-4">← Kembali</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {banners.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-lg bg-neutral-50">
            <span className="text-4xl mb-3 block">📢</span>
            <p className="text-neutral-500 font-medium">Belum ada riwayat pengajuan iklan.</p>
          </div>
        ) : (
          banners.map((b) => (
            <div key={b.id} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center shadow-sm hover:shadow-md transition-shadow">
              
              {/* Gambar Banner */}
              <div 
                className="w-full md:w-48 aspect-video shrink-0 rounded-lg overflow-hidden border bg-neutral-100 cursor-pointer relative group"
                onClick={() => setSelectedImage(b.imageUrl)}
              >
                <img src={b.imageUrl} alt="Banner" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">🔍 Zoom</span>
                </div>
              </div>

              {/* Info Iklan */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-lg">{b.title || "Iklan Banner"}</h3>
                  {getStatusBadge(b)}
                </div>
                
                <div className="text-sm text-neutral-600 dark:text-neutral-400 grid grid-cols-2 gap-2">
                  <p><strong>Durasi:</strong> {b.durationDays} Hari</p>
                  <p><strong>Total Bayar:</strong> Rp {b.price?.toLocaleString("id-ID")}</p>
                  <p><strong>Tgl Pengajuan:</strong> {new Date(b.createdAt).toLocaleDateString("id-ID")}</p>
                  {b.endDate && (
                    <p><strong>Berakhir Pada:</strong> {new Date(b.endDate).toLocaleDateString("id-ID")}</p>
                  )}
                </div>

                {/* Jika Ditolak, Tampilkan Alasan */}
                {b.status === "REJECTED" && b.rejectionReason && (
                  <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                    <strong>Alasan Penolakan:</strong> {b.rejectionReason}
                  </div>
                )}
              </div>

              {/* Tombol Aksi */}
              {b.linkUrl && (
                <div className="shrink-0">
                  <a href={b.linkUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    Lihat Link Tujuan →
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Lightbox Zoom */}
      {selectedImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-5xl max-h-[95vh]">
            <img src={selectedImage} alt="Zoom Banner" className="max-w-full max-h-[95vh] object-contain rounded-md" />
            <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }} className="absolute -top-12 right-0 text-white bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 flex items-center justify-center text-xl font-bold">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}