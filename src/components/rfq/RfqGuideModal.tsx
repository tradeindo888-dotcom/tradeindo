"use client";
import { useEffect } from "react";

export function RfqGuideModal({
  isOpen,
  onClose,
  lang = "id",
}: {
  isOpen: boolean;
  onClose: () => void;
  lang?: string;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-2xl dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-neutral-200 pb-3 dark:border-neutral-800">
          <h3 className="font-display text-xl font-bold flex items-center gap-2">
            📖 {lang === "en" ? "RFQ Guide & Rules" : "Panduan & Aturan RFQ"}
          </h3>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-red-500 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-sm">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-700 text-white font-bold">1</div>
            <div>
              <h4 className="font-bold text-base text-forest-900 dark:text-white">
                {lang === "en" ? "1. Create RFQ" : "1. Pembuatan RFQ"}
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                {lang === "en" 
                  ? "Buyers or Suppliers can create an RFQ (Request for Quotation) by specifying the product, quantity, target price, and deadline."
                  : "Buyer atau Supplier membuat permintaan dengan menentukan kategori, jumlah (kuantitas), target harga, dan batas waktu (deadline) penawaran."}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-700 text-white font-bold">2</div>
            <div>
              <h4 className="font-bold text-base text-forest-900 dark:text-white">
                {lang === "en" ? "2. Submit Quotes (Closed Bid)" : "2. Pengajuan Penawaran (Closed Bid)"}
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                {lang === "en" 
                  ? "Suppliers submit their best price and delivery estimate. During the active phase, suppliers CANNOT see each other's quotes."
                  : "Supplier lain mengirimkan penawaran harga dan estimasi pengiriman. Selama RFQ aktif, penawar TIDAK BISA melihat penawaran pesaingnya (sistem tertutup)."}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-700 text-white font-bold">3</div>
            <div>
              <h4 className="font-bold text-base text-forest-900 dark:text-white">
                {lang === "en" ? "3. Evaluation & Winner Selection" : "3. Evaluasi & Pemilihan Pemenang"}
              </h4>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                {lang === "en" 
                  ? "The RFQ creator reviews all incoming quotes and accepts one as the winner. The RFQ status will change to CLOSED, and automated emails will be sent to the winner and losers."
                  : "Pembuat RFQ membandingkan semua penawaran yang masuk dan memilih satu pemenang. Status RFQ akan berubah menjadi DITUTUP (CLOSED), dan sistem mengirim email otomatis ke pemenang."}
              </p>
            </div>
          </div>

          {/* Privacy Info Box */}
          <div className="mt-4 rounded-lg bg-blue-50 p-4 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
              🔒 {lang === "en" ? "Privacy & Transparency Rules" : "Aturan Privasi & Transparansi"}
            </h4>
            <ul className="list-disc pl-5 space-y-2 text-blue-800 dark:text-blue-200">
              <li>
                {lang === "en"
                  ? "Only the RFQ Creator and Suppliers who submitted a quote can view the details and winner."
                  : "HANYA Pembuat RFQ dan Supplier yang mengirim penawaran yang dapat melihat rincian pemenang."}
              </li>
              <li>
                {lang === "en"
                  ? "3-Day Transparency Window: After the RFQ is closed, participants can see all quotes (to ensure fair play) for 3 days."
                  : "Masa Transparansi 3 Hari: Setelah RFQ ditutup, seluruh peserta dapat melihat semua penawaran untuk menjamin keadilan selama 3 hari."}
              </li>
              <li>
                {lang === "en"
                  ? "After 3 days, the RFQ becomes an archive. Participants can only see their own quotes."
                  : "Setelah 3 hari, RFQ menjadi arsip. Peserta hanya bisa melihat penawaran mereka sendiri."}
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800 text-center">
          <button
            onClick={onClose}
            className="rounded-md bg-forest-700 px-8 py-2.5 text-sm font-medium text-white hover:bg-forest-500 transition-colors"
          >
            {lang === "en" ? "Got it" : "Mengerti"}
          </button>
        </div>
      </div>
    </div>
  );
}