"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export default function ConsumerServicePage() {
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    category: "PENGGUNAAN",
    subject: "",
    message: "",
  });

  useEffect(() => {
    if (session?.user) {
      setForm((prev) => ({
        ...prev,
        name: session.user?.name || "",
        email: session.user?.email || "",
      }));
    }
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/consumer-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      toast.success(lang === "en" ? "Report sent successfully!" : "Laporan berhasil dikirim! Tim Admin akan segera meninjau.");
      setForm({ ...form, subject: "", message: "" });
    } catch {
      toast.error(lang === "en" ? "Failed to send report." : "Gagal mengirim laporan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">
          {lang === "en" ? "Consumer Service" : "Layanan Konsumen"}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          {lang === "en" 
            ? "Submit platform usage issues or report violations by other parties. Your report goes directly to the Admin Panel." 
            : "Sampaikan kendala penggunaan platform atau laporkan pelanggaran yang dilakukan oleh pihak lain. Laporan Anda akan masuk langsung ke Panel Admin."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Nama Anda</label>
            <input 
              required 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              className="w-full h-11 rounded-md border border-neutral-300 px-3 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400" 
              placeholder="Nama lengkap" 
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Email Anda</label>
            <input 
              required 
              type="email" 
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
              className="w-full h-11 rounded-md border border-neutral-300 px-3 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400" 
              placeholder="email@contoh.com" 
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Kategori Laporan</label>
          <select 
            value={form.category} 
            onChange={(e) => setForm({ ...form, category: e.target.value })} 
            className="w-full h-11 rounded-md border border-neutral-300 px-3 text-sm bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:focus:ring-lime-400"
          >
            <option value="PENGGUNAAN">Kendala Penggunaan Platform (Bug / Error)</option>
            <option value="PELANGGARAN">Pelanggaran oleh Pihak Lain (Penipuan / Produk Ilegal)</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Subjek / Judul Singkat</label>
          <input 
            required 
            value={form.subject} 
            onChange={(e) => setForm({ ...form, subject: e.target.value })} 
            className="w-full h-11 rounded-md border border-neutral-300 px-3 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400" 
            placeholder="Contoh: Supplier tidak mengirim barang" 
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Detail Laporan</label>
          <textarea 
            required 
            rows={5} 
            value={form.message} 
            onChange={(e) => setForm({ ...form, message: e.target.value })} 
            className="w-full rounded-md border border-neutral-300 p-3 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400" 
            placeholder="Jelaskan kronologi atau detail kendala Anda sedetail mungkin..." 
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full h-12 text-base">
          {loading ? "Mengirim Laporan..." : "Kirim Laporan ke Admin"}
        </Button>
      </form>
    </div>
  );
}