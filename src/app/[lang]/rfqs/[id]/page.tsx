"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function RfqDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";
  const rfqId = params.id as string;
  const { data: session, status: sessionStatus } = useSession();

  const [rfq, setRfq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ unitPrice: "", deliveryDays: "", notes: "" });
  const [processingQuoteId, setProcessingQuoteId] = useState<string | null>(null);

  const fetchRfq = () => {
    fetch(`/api/rfqs/${rfqId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat data RFQ.");
        return res.json();
      })
      .then((data) => {
        setRfq(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRfq();
  }, [rfqId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedImage(null); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", { day: "2-digit", month: "long", year: "numeric" });
    } catch { return "-"; }
  }

  async function handleCloseRfq() {
    if (!confirm(lang === "en" ? "Close this RFQ?" : "Tutup RFQ ini?")) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/rfqs/${rfqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });
      if (!res.ok) throw new Error("Gagal menutup RFQ");
      toast.success("RFQ berhasil ditutup.");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setClosing(false); }
  }

  async function handleSubmitQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!rfq) return;
    setSubmittingQuote(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rfqId: rfq.id, unitPrice: Number(quoteForm.unitPrice), deliveryDays: Number(quoteForm.deliveryDays), notes: quoteForm.notes || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal");
      toast.success("Penawaran berhasil dikirim!");
      setShowQuoteForm(false);
      fetchRfq();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setSubmittingQuote(false); }
  }

  async function handleProcessQuote(quoteId: string, action: "ACCEPT" | "REJECT") {
    if (!confirm(action === "ACCEPT" ? "Terima sebagai pemenang?" : "Tolak penawaran ini?")) return;
    setProcessingQuoteId(quoteId);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses");
      toast.success(data.message || "Berhasil!");
      fetchRfq();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setProcessingQuoteId(null); }
  }

  if (loading) return <div className="p-16 text-center">Memuat...</div>;
  if (error || !rfq) return <div className="p-16 text-center text-red-500">{error || "RFQ tidak ditemukan"}</div>;

  const myCompanyId = (session?.user as any)?.companyId;
  const role = (session?.user as any)?.role;
  const isOwner = rfq.buyerCompany?.id === myCompanyId;
  const isAdmin = role === "ADMIN";
  const isRfqActive = ["OPEN", "QUOTING"].includes(rfq.status);
  
  // PERUBAHAN UTAMA: HANYA OWNER yang bisa memproses (Admin diblokir)
  const canProcessQuotes = isOwner && isRfqActive;
  
  const hasAlreadyQuoted = rfq.quotes?.some((q: any) => q.supplierCompany?.id === myCompanyId);
  const canSubmitQuote = session?.user && !isOwner && !isAdmin && isRfqActive && myCompanyId && !hasAlreadyQuoted;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href={`/${lang}/rfqs`} className="text-sm text-forest-700 hover:underline">← Kembali</Link>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-neutral-200">{rfq.status}</span>
          {canProcessQuotes && <Button onClick={handleCloseRfq} disabled={closing} variant="secondary" size="sm">🔒 Tutup RFQ</Button>}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 mb-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-3">{rfq.title}</h1>
        <p className="text-neutral-700 mb-6">{rfq.description}</p>
        
        {rfq.images?.length > 0 && (
          <div className="flex gap-3 mb-6">
            {rfq.images.map((img: any) => (
              <img key={img.id} src={img.url} className="h-24 w-24 object-cover rounded-md border cursor-pointer hover:opacity-80" onClick={() => setSelectedImage(img.url)} />
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-neutral-50 p-3 rounded-lg"><div className="text-xs text-neutral-500">Jumlah</div><div className="font-bold">{rfq.quantity} {rfq.quantityUnit}</div></div>
          <div className="bg-neutral-50 p-3 rounded-lg"><div className="text-xs text-neutral-500">Lokasi</div><div className="font-bold">{rfq.deliveryCity || "-"}</div></div>
          <div className="bg-neutral-50 p-3 rounded-lg"><div className="text-xs text-neutral-500">Target</div><div className="font-bold text-forest-700">{rfq.targetPrice ? `Rp ${rfq.targetPrice.toLocaleString("id-ID")}+` : "Nego"}</div></div>
          <div className="bg-neutral-50 p-3 rounded-lg"><div className="text-xs text-neutral-500">Deadline</div><div className="font-bold">{formatDate(rfq.deadlineAt)}</div></div>
        </div>
      </div>

      {canSubmitQuote && !showQuoteForm && (
        <Button onClick={() => setShowQuoteForm(true)} className="w-full h-12 text-base font-bold mb-6">💼 Ajukan Penawaran</Button>
      )}
      {showQuoteForm && (
        <form onSubmit={handleSubmitQuote} className="mb-6 p-6 border-2 border-forest-700 rounded-xl space-y-4">
          <h3 className="font-bold text-lg">Ajukan Penawaran</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Harga Satuan (Rp)" required value={quoteForm.unitPrice} onChange={e => setQuoteForm({...quoteForm, unitPrice: e.target.value})} className="border p-2 rounded-md" />
            <input type="number" placeholder="Estimasi (Hari)" required value={quoteForm.deliveryDays} onChange={e => setQuoteForm({...quoteForm, deliveryDays: e.target.value})} className="border p-2 rounded-md" />
          </div>
          <textarea placeholder="Catatan" value={quoteForm.notes} onChange={e => setQuoteForm({...quoteForm, notes: e.target.value})} className="border p-2 rounded-md w-full" />
          <div className="flex gap-2">
            <Button type="submit" disabled={submittingQuote}>Kirim</Button>
            <Button type="button" variant="ghost" onClick={() => setShowQuoteForm(false)}>Batal</Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="font-bold text-lg">Quotation Masuk</h2>
          <span className="px-3 py-1 rounded-full bg-forest-700 text-white text-xs font-bold">{rfq._count?.quotes ?? 0}</span>
        </div>
        <div className="p-5 space-y-3">
          {!rfq.quotes || rfq.quotes.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">📭 Belum ada penawaran.</div>
          ) : (
            rfq.quotes.map((quote: any) => {
              const isWinner = quote.status === "ACCEPTED";
              const isRejected = quote.status === "REJECTED";
              const isPending = !isWinner && !isRejected;

              return (
                <div key={quote.id} className={`border-2 p-4 rounded-lg ${isWinner ? "border-green-500 bg-green-50" : "border-neutral-200"}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold flex items-center gap-2">
                        {quote.supplierCompany?.name}
                        {isWinner && <span className="px-2 py-0.5 bg-green-600 text-white text-[10px] rounded">🏆 PEMENANG</span>}
                        {isRejected && <span className="px-2 py-0.5 bg-neutral-400 text-white text-[10px] rounded">DITOLAK</span>}
                      </div>
                      <div className="text-xs text-neutral-500">{quote.supplierCompany?.city}</div>
                    </div>
                    <div className="font-bold text-forest-700">Rp {quote.unitPrice.toLocaleString("id-ID")}</div>
                  </div>
                  <div className="text-xs text-neutral-600 mb-3">
                    Total: Rp {quote.totalPrice.toLocaleString("id-ID")} • Kirim: {quote.deliveryDays} hari
                  </div>

                  {/* KUNCI KEAMANAN: Tombol HANYA muncul jika canProcessQuotes (Owner) */}
                  {canProcessQuotes && isPending && (
                    <div className="flex gap-2 pt-3 border-t">
                      <button onClick={() => handleProcessQuote(quote.id, "ACCEPT")} disabled={processingQuoteId === quote.id} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded">✓ Terima sebagai Pemenang</button>
                      <button onClick={() => handleProcessQuote(quote.id, "REJECT")} disabled={processingQuoteId === quote.id} className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-xs font-bold px-3 py-2 rounded">✕ Tolak</button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} className="max-w-full max-h-[90vh] object-contain rounded-md" />
        </div>
      )}
    </div>
  );
}