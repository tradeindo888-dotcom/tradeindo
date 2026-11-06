"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { isCurrentlySponsored } from "@/lib/product-utils";
import { toast } from "sonner";

export default function SellerWorkspace() {
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";
  
  const [products, setProducts] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchData = async () => {
    const res = await fetch("/api/seller/dashboard", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
      setCompany(data.company);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  async function handleDeleteProduct(id: string) {
    if (!confirm(lang === "en" ? "Delete this product?" : "Hapus produk ini?")) return;
    toast.promise(fetch(`/api/seller/products/${id}`, { method: "DELETE" }), {
      loading: "Menghapus...",
      success: () => { fetchData(); return "Produk dihapus!"; },
      error: "Gagal menghapus.",
    });
  }

  if (loading) return <div className="p-8 text-center text-neutral-500">Memuat data...</div>;

  const isPremium = company?.plan !== "FREE";
  const hasSponsoredProduct = products.some((p) => isCurrentlySponsored(p));

  return (
    <div className="mx-auto max-w-content px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Seller Workspace</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Selamat datang, <strong>{company?.name || "Supplier"}</strong>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href={`/${lang}/workspace/seller/new`} className="rounded-md bg-forest-700 px-4 py-2 text-sm text-white hover:bg-forest-500 transition-colors shadow-sm">
            + {lang === "en" ? "Add Product" : "Tambah Produk"}
          </Link>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-100 dark:bg-neutral-800">
            <tr>
              <th className="p-3 font-medium">Produk</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium whitespace-nowrap">Harga</th>
              <th className="p-3 font-medium whitespace-nowrap">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <td className="p-3 flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt={p.titleId} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">No Img</div>
                    )}
                  </div>
                  <span className="font-medium text-neutral-900 dark:text-white">{p.titleId}</span>
                </td>
                <td className="p-3 text-neutral-700 dark:text-neutral-300">{p.status}</td>
                
                {/* LOGIKA NEGO DI TABEL DASHBOARD */}
                <td className="p-3 tabular-nums whitespace-nowrap text-neutral-900 dark:text-white">
                  {p.priceMin ? `Rp ${p.priceMin.toLocaleString("id-ID")}` : "Nego"}
                </td>
                
                <td className="p-3">
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <Link href={`/${lang}/workspace/seller/edit/${p.id}`} className="text-forest-700 hover:underline dark:text-lime-400 font-medium">
                      Edit
                    </Link>
                    <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 hover:underline font-medium">
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-500">Belum ada produk.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}