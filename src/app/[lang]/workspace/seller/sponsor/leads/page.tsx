"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Lead = {
  id: string;
  action: string;
  date: string;
  buyerName: string;
  buyerCompanyId: string | null;
  buyerCompany: string;
  buyerLocation: string;
  product: {
    id: string;
    titleId: string;
    titleEn: string;
    slug: string;
    images: { url: string }[];
  } | null;
};

export default function LeadsPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  
  // State untuk Zoom Gambar
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Efek menutup lightbox dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    fetch("/api/seller/sponsor/leads")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setLeads(d.leads))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleChat(buyerCompanyId: string, productId: string) {
    setStartingChat(buyerCompanyId);
    try {
      const res = await fetch("/api/seller/chat/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerCompanyId, productId }),
      });
      
      if (res.ok) {
        const data = await res.json();
        router.push(`/${lang}/messages/${data.id}`);
      } else {
        alert(lang === "en" ? "Failed to start chat." : "Gagal memulai chat.");
        setStartingChat(null);
      }
    } catch (err) {
      alert(lang === "en" ? "Something went wrong." : "Terjadi kesalahan.");
      setStartingChat(null);
    }
  }

  if (loading) return <div className="p-16 text-center">Memuat data calon pembeli...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">
            {lang === "en" ? "Buyer Leads" : "Calon Pembeli (Leads)"}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {lang === "en"
              ? "Companies that recently viewed or clicked your products."
              : "Perusahaan yang baru-baru ini melihat atau mengklik produk Anda."}
          </p>
        </div>
        <Link href={`/${lang}/workspace/seller`} className="text-sm text-forest-700 hover:underline dark:text-lime-400 font-medium">
          ← {lang === "en" ? "Back" : "Kembali"}
        </Link>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white overflow-x-auto shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-100 dark:bg-neutral-800">
            <tr>
              <th className="p-4 font-medium whitespace-nowrap">Waktu</th>
              <th className="p-4 font-medium">Produk</th>
              <th className="p-4 font-medium">Perusahaan</th>
              <th className="p-4 font-medium">Aktivitas</th>
              <th className="p-4 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const imgUrl = lead.product?.images?.[0]?.url;

              return (
                <tr key={lead.id} className="border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="p-4 text-neutral-500 whitespace-nowrap">
                    {new Date(lead.date).toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", {
                      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </td>
                  
                  {/* KOLOM PRODUK DENGAN GAMBAR & ZOOM */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className={`h-12 w-12 shrink-0 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 transition-transform duration-300 ${imgUrl ? 'cursor-pointer hover:scale-110' : ''}`}
                        onClick={() => imgUrl && setSelectedImage(imgUrl)}
                      >
                        {imgUrl ? (
                          <img src={imgUrl} alt={lead.product?.titleId || "Produk"} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400 text-center">No Img</div>
                        )}
                      </div>
                      <div>
                        <Link 
                          href={`/${lang}/products/${lead.product?.slug}`}
                          className="font-medium text-forest-700 dark:text-lime-400 hover:underline line-clamp-2 max-w-[200px]"
                        >
                          {lang === "en" ? lead.product?.titleEn : lead.product?.titleId}
                        </Link>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <div className="font-semibold text-neutral-800 dark:text-neutral-200">{lead.buyerCompany}</div>
                    <div className="text-xs text-neutral-500">{lead.buyerLocation || "-"}</div>
                    <div className="text-xs text-neutral-500 mt-1">PIC: {lead.buyerName}</div>
                  </td>
                  <td className="p-4">
                    {lead.action === "VIEW" ? (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">👁️ Melihat</span>
                    ) : (
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">👆 Mengklik</span>
                    )}
                  </td>
                  <td className="p-4">
                    {lead.buyerCompanyId ? (
                      <button 
                        onClick={() => handleChat(lead.buyerCompanyId as string, lead.product?.id || "")}
                        disabled={startingChat === lead.buyerCompanyId}
                        className="text-sm text-forest-700 hover:underline dark:text-lime-400 font-medium disabled:opacity-50 disabled:no-underline whitespace-nowrap"
                      >
                        {startingChat === lead.buyerCompanyId 
                          ? (lang === "en" ? "Opening..." : "Membuka...") 
                          : (lang === "en" ? "Contact via Chat" : "Hubungi via Chat")}
                      </button>
                    ) : (
                      <span className="text-sm text-neutral-400 italic">
                        {lang === "en" ? "No Company" : "Tanpa Perusahaan"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {leads.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-500">
                  Belum ada calon pembeli yang melihat produk Anda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* LIGHTBOX (POP-UP ZOOM GAMBAR) */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={selectedImage} 
              alt="Gambar Produk Besar" 
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