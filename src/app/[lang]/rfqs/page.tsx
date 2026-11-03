"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RfqGuideModal } from "@/components/rfq/RfqGuideModal"; // Pastikan path ini sesuai

type Rfq = {
  id: string;
  title: string;
  status: string;
  deadlineAt: string;
  closedAt: string | null;
  deliveryCity: string | null;
  quantity: number;
  quantityUnit: string;
  buyerCompany: { name: string; slug: string };
  _count: { quotes: number };
};

export default function RfqListPage() {
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";

  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk Modal Panduan
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    fetch("/api/rfqs")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal mengambil data dari server");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setRfqs(data);
        } else {
          setRfqs([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setError(lang === "en" ? "Failed to load RFQs." : "Gagal memuat data RFQ. Silakan refresh halaman.");
      })
      .finally(() => setLoading(false)); // <-- PASTIKAN INI ADA
  }, [lang]);

  function formatDate(d: string | null | undefined): string {
    if (!d) return "-";
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  }

  const statusColors: Record<string, string> = {
    OPEN: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    QUOTING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    NEGOTIATING: "bg-purple-100 text-purple-800",
    CLOSED: "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300",
    CANCELLED: "bg-red-100 text-red-800",
    DRAFT: "bg-amber-100 text-amber-800",
  };

  const statusLabels: Record<string, { id: string; en: string }> = {
    OPEN: { id: "TERBUKA", en: "OPEN" },
    QUOTING: { id: "MENERIMA PENAWARAN", en: "QUOTING" },
    NEGOTIATING: { id: "NEGOSIASI", en: "NEGOTIATING" },
    CLOSED: { id: "DITUTUP", en: "CLOSED" },
    CANCELLED: { id: "DIBATALKAN", en: "CANCELLED" },
    DRAFT: { id: "DRAFT", en: "DRAFT" },
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-neutral-500">
        Memuat RFQ...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-red-500">
        <p className="text-xl font-bold mb-2">Oops!</p>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 bg-forest-700 text-white px-4 py-2 rounded-md">
          Refresh Halaman
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">
            {lang === "en" ? "Open RFQs" : "RFQ Terbuka"}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {lang === "en"
              ? "Quotation requests from buyers and suppliers. Submit your best offer."
              : "Permintaan penawaran dari buyer maupun supplier. Kirim penawaran terbaik Anda."}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* TOMBOL PANDUAN BARU */}
          <button
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors dark:border-blue-900 dark:bg-blue-900/30 dark:text-blue-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {lang === "en" ? "Guide" : "Panduan"}
          </button>

          <Link
            href={`/${lang}/rfqs/new`}
            className="bg-forest-700 hover:bg-forest-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {lang === "en" ? "+ Create RFQ" : "Buat RFQ"}
          </Link>
        </div>
      </div>

      {rfqs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-12 text-center dark:border-neutral-700">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-neutral-500">
            {lang === "en" ? "No RFQs available." : "Belum ada RFQ."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rfqs.map((rfq) => {
            const isClosed = ["CLOSED", "CANCELLED"].includes(rfq.status);
            const isExpiredDeadline = new Date(rfq.deadlineAt) < new Date();

            return (
              <Link
                key={rfq.id}
                href={`/${lang}/rfqs/${rfq.id}`}
                className={`
                  block rounded-xl border-2 p-5
                  relative z-0
                  transition-all duration-300 ease-out
                  hover:-translate-y-2 hover:scale-[1.02] hover:z-10 hover:shadow-2xl hover:ring-4 hover:ring-lime-400 hover:border-forest-700 dark:hover:border-lime-400
                  ${isClosed
                    ? "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50"
                    : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"}
                `}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-bold text-lg ${isClosed ? "text-neutral-600 dark:text-neutral-400" : "text-neutral-900 dark:text-white"}`}>
                      {rfq.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColors[rfq.status] || statusColors.OPEN}`}>
                      {statusLabels[rfq.status]?.[lang as "id" | "en"] || rfq.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                      {rfq._count?.quotes ?? 0} {lang === "en" ? "quotations" : "penawaran"}
                    </span>
                    {isClosed && rfq.closedAt && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                        {lang === "en" ? "Archived soon" : "Segera diarsipkan"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-1">
                    🏢 <strong>{rfq.buyerCompany?.name || "-"}</strong>
                  </span>
                  <span>•</span>
                  <span>{rfq.quantity?.toLocaleString("id-ID")} {rfq.quantityUnit}</span>
                  <span>•</span>
                  <span>{rfq.deliveryCity || "-"}</span>
                  <span>•</span>
                  <span className={isExpiredDeadline && !isClosed ? "text-red-500 font-medium" : ""}>
                    deadline {formatDate(rfq.deadlineAt)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* MODAL PANDUAN */}
      <RfqGuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
        lang={lang} 
      />
    </div>
  );
}