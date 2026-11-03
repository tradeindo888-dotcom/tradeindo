"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

type SuspiciousProduct = {
  id: string;
  title: string;
  slug: string;
  company: { name: string; slug: string };
  currentCategory: { id: string; slug: string; nameId: string; nameEn: string };
  suggestedCategory: { slug: string; nameId: string };
  matchedKeyword: string;
  createdAt: string;
};

export default function SuspiciousProductsPage() {
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";
  const [products, setProducts] = useState<SuspiciousProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/admin/suspicious-products")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setProducts(data.suspicious || []))
      .catch(() => toast.error("Gagal memuat data"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function handleFix(productId: string, newSlug: string) {
    setProcessing(productId);
    try {
      const res = await fetch("/api/admin/fix-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, newCategorySlug: newSlug }),
      });
      if (res.ok) {
        toast.success("Kategori berhasil diperbaiki!");
        fetchData();
      } else {
        toast.error("Gagal memperbaiki kategori.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setProcessing(null);
    }
  }

  async function handleVerify(productId: string) {
    setProcessing(productId);
    try {
      const res = await fetch("/api/admin/verify-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        toast.success("Kategori ditandai benar.");
        fetchData();
      } else {
        toast.error("Gagal menandai kategori.");
      }
    } catch {
      toast.error("Terjadi kesalahan.");
    } finally {
      setProcessing(null);
    }
  }

  if (loading) return <div className="p-16 text-center">Memindai produk...</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">
            🔍 Deteksi Produk Salah Kategori
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Sistem mendeteksi produk yang kategorinya kemungkinan salah berdasarkan kata kunci judul.
          </p>
        </div>
        <Link href={`/${lang}/admin`} className="text-sm text-forest-700 hover:underline dark:text-lime-400 font-medium">
          ← Kembali ke Admin Panel
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-lg bg-green-50 dark:bg-green-900/20">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-lg font-semibold text-green-700 dark:text-green-400">
            Semua produk sudah di kategori yang tepat!
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-4 text-amber-800 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-300">
            <div className="flex items-center gap-2 font-bold">
              <span className="text-xl">⚠️</span>
              Ditemukan {products.length} produk yang mungkin salah kategori
            </div>
            <p className="text-sm mt-1">
              Jika sistem salah mendeteksi, klik <strong>"Tandai Benar"</strong>. Jika memang salah, klik <strong>"Perbaiki Kategori"</strong>.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-100 dark:bg-neutral-800">
                <tr>
                  <th className="p-3 font-medium">Produk</th>
                  <th className="p-3 font-medium">Perusahaan</th>
                  <th className="p-3 font-medium">Kategori Saat Ini</th>
                  <th className="p-3 font-medium">Kategori Disarankan</th>
                  <th className="p-3 font-medium">Kata Kunci</th>
                  <th className="p-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                    <td className="p-3">
                      <Link href={`/${lang}/products/${p.slug}`} className="font-medium text-forest-700 hover:underline dark:text-lime-400">
                        {p.title}
                      </Link>
                    </td>
                    <td className="p-3 text-neutral-600 dark:text-neutral-400">
                      {p.company.name}
                    </td>
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                        {p.currentCategory.nameId}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-medium">
                        {p.suggestedCategory.nameId}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-1 rounded text-xs font-mono">
                        "{p.matchedKeyword}"
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => handleFix(p.id, p.suggestedCategory.slug)}
                        disabled={processing === p.id}
                        className="bg-forest-700 hover:bg-forest-500 text-white text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        {processing === p.id ? "Memproses..." : "✓ Perbaiki"}
                      </button>
                      <button
                        onClick={() => handleVerify(p.id)}
                        disabled={processing === p.id}
                        className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600 dark:text-neutral-200 text-xs font-medium px-3 py-1.5 rounded-md disabled:opacity-50 transition-colors whitespace-nowrap"
                      >
                        {processing === p.id ? "Memproses..." : "Tandai Benar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}