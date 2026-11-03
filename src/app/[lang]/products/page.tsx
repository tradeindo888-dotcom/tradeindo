import { Suspense } from "react";
import ProductsContent from "./ProductsContent";
import type { Metadata } from "next";

// Menambahkan Metadata untuk SEO
export const metadata: Metadata = {
  title: "Katalog Produk | Trade Indo",
  description: "Temukan berbagai produk berkualitas dari supplier terpercaya di Trade Indo.",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Memuat katalog produk...</div>}>
      <ProductsContent />
    </Suspense>
  );
}