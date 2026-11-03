import Link from "next/link";
import { Button } from "@/components/ui/Button";

// BYPASS: Nilai harga ditulis langsung di sini
const PLAN_PRICES = { FREE: 0, PRO: 49_000, PREMIUM: 149_000 };
const formatRupiah = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;

export default async function ServicesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = rawLang === "en" ? "en" : "id";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 min-h-screen">
      {/* HEADER */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="font-display text-3xl sm:text-5xl font-bold text-forest-900 dark:text-white mb-4">
          {lang === "en" ? "Services & Subscriptions" : "Layanan & Langganan"}
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-400">
          {lang === "en"
            ? "Trade Indo is designed to help Suppliers get high-quality Leads. We provide three main ways to increase your sales."
            : "Platform Trade Indo dirancang untuk membantu Supplier mendapatkan Leads (calon pembeli) yang berkualitas. Kami menyediakan tiga cara utama untuk meningkatkan penjualan Anda."}
        </p>
      </div>

      {/* 1. PAKET SPONSORSHIP */}
      <div className="mb-20">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-forest-900 dark:text-white">
            1. {lang === "en" ? "Sponsorship Packages" : "Paket Sponsorship (Iklan Produk)"}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2 max-w-3xl">
            {lang === "en"
              ? "Sponsorship is the fastest way to highlight your specific products among thousands of others. You don't need to upgrade your subscription plan to use this feature."
              : "Sponsorship adalah cara tercepat untuk menonjolkan produk spesifik Anda di antara ribuan produk lainnya. Anda tidak perlu meng-upgrade paket langganan untuk menggunakan fitur ini."}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 hover:shadow-md transition-shadow">
            <div className="inline-block bg-lime-300 text-neutral-900 px-2 py-1 rounded text-xs font-bold mb-4">⭐ BERSPONSOR</div>
            <h3 className="text-xl font-bold mb-2">Standard Sponsorship</h3>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li><strong>Posisi:</strong> Urutan teratas halaman pencarian produk reguler.</li>
              <li><strong>Visual:</strong> Label "⭐ BERSPONSOR" warna hijau terang.</li>
              <li><strong>Manfaat:</strong> Meningkatkan Impressions harian secara instan.</li>
            </ul>
            <p className="mt-4 text-xs font-semibold text-forest-700 dark:text-lime-400 bg-forest-700/5 p-2 rounded">Cocok untuk: Produk andalan yang ingin selalu terlihat di halaman pertama.</p>
          </div>

          <div className="rounded-xl border-2 border-forest-700 bg-white p-6 shadow-lg dark:border-forest-500 dark:bg-neutral-900 relative">
            <div className="inline-block bg-forest-700 text-white px-2 py-1 rounded text-xs font-bold mb-4">✨ SPOTLIGHT</div>
            <h3 className="text-xl font-bold mb-2">Category Spotlight</h3>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li><strong>Posisi:</strong> Paling atas hanya di kategori spesifik produk tersebut.</li>
              <li><strong>Visual:</strong> Label "✨ SPOTLIGHT" warna hijau gelap (Forest).</li>
              <li><strong>Manfaat:</strong> Konversi (View to Chat) jauh lebih tinggi karena pembeli sudah spesifik.</li>
            </ul>
            <p className="mt-4 text-xs font-semibold text-forest-700 dark:text-lime-400 bg-forest-700/5 p-2 rounded">Cocok untuk: Produk niche atau spesialisasi yang target pasarnya jelas.</p>
          </div>

          <div className="rounded-xl border-2 border-amber-400 ring-2 ring-amber-300 bg-white p-6 shadow-lg dark:bg-neutral-900 relative">
            <div className="inline-block bg-amber-400 text-amber-950 px-2 py-1 rounded text-xs font-bold mb-4">👑 PREMIUM</div>
            <h3 className="text-xl font-bold mb-2">Homepage Feature</h3>
            <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
              <li><strong>Posisi:</strong> Halaman Depan bagian "Sorotan Utama" (desain mewah).</li>
              <li><strong>Visual:</strong> Label "👑 PREMIUM" warna emas/amber.</li>
              <li><strong>Manfaat:</strong> Eksposur maksimal dari seluruh pengunjung platform.</li>
            </ul>
            <p className="mt-4 text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">Cocok untuk: Brand besar, best-seller, atau peluncuran produk baru.</p>
          </div>
        </div>
        <p className="mt-6 text-sm text-center text-neutral-500 italic">
          💡 Semua paket Sponsorship dilengkapi Laporan metrik harian (Dilihat, Diklik, Chat) untuk mengukur ROI.
        </p>
      </div>

      {/* 2. UPGRADE PAKET LANGGANAN */}
      <div className="mb-20">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-forest-900 dark:text-white">
            2. {lang === "en" ? "Subscription Plans" : "Upgrade Paket Langganan"}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2 max-w-3xl">
            {lang === "en"
              ? "Subscription plans increase your overall account capacity. Perfect for Suppliers with large catalogs who want deeper market analysis."
              : "Paket langganan adalah peningkatan kapasitas akun secara keseluruhan. Cocok untuk Supplier yang katalog produknya sudah banyak dan ingin menganalisis pasar lebih dalam."}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* FREE */}
          <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="text-xl font-bold mb-1">FREE</h3>
            <p className="text-sm text-neutral-500 mb-4">UMKM / Pemula</p>
            <div className="text-3xl font-bold mb-6">
              {formatRupiah(PLAN_PRICES.FREE)}{" "}
              <span className="text-sm font-normal text-neutral-500">/bln</span>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">✅ Maksimal 10 Produk Aktif</li>
              <li className="flex items-center gap-2">✅ Profil Dasar</li>
              <li className="flex items-center gap-2">✅ Menerima RFQ & Chat</li>
            </ul>
          </div>

          {/* PRO */}
          <div className="rounded-xl border-2 border-forest-700 bg-white p-6 shadow-md dark:border-forest-500 dark:bg-neutral-900">
            <h3 className="text-xl font-bold mb-1 text-forest-700 dark:text-lime-400">PRO</h3>
            <p className="text-sm text-neutral-500 mb-4">Supplier Aktif</p>
            <div className="text-3xl font-bold mb-6">
              {formatRupiah(PLAN_PRICES.PRO)}{" "}
              <span className="text-sm font-normal text-neutral-500">/bln</span>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">✅ Maksimal 100 Produk Aktif</li>
              <li className="flex items-center gap-2">✅ Laporan Iklan (Sponsorship)</li>
              <li className="flex items-center gap-2">✅ <strong>Buyer Leads (Identitas Pengunjung)</strong></li>
            </ul>
          </div>

          {/* PREMIUM */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-900 text-white p-6 shadow-xl dark:bg-black">
            <h3 className="text-xl font-bold mb-1 text-amber-400">PREMIUM</h3>
            <p className="text-sm text-neutral-400 mb-4">Perusahaan / Eksportir</p>
            <div className="text-3xl font-bold mb-6">
              {formatRupiah(PLAN_PRICES.PREMIUM)}{" "}
              <span className="text-sm font-normal text-neutral-400">/bln</span>
            </div>
            <ul className="space-y-3 text-sm text-neutral-300">
              <li className="flex items-center gap-2">✅ Maksimal 500 Produk Aktif</li>
              <li className="flex items-center gap-2">✅ Akses Penuh Buyer Leads</li>
              <li className="flex items-center gap-2">✅ <strong className="text-amber-400">Advanced Analytics</strong></li>
              <li className="flex items-center gap-2">✅ Prioritas Dukungan (Priority Support)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. FITUR ANALITIK & PROMO */}
      <div className="grid md:grid-cols-2 gap-8 mb-20">
        <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-8 border border-indigo-100 dark:border-indigo-900/30">
          <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
            <span className="text-2xl">📈</span> Advanced Analytics
          </h3>
          <p className="text-sm text-indigo-800 dark:text-indigo-400 mb-4">
            Memberikan "Sinar X-Ray" terhadap perilaku pasar Anda (Khusus Paket PREMIUM).
          </p>
          <ul className="space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
            <li><strong>Corong Penjualan (Funnel):</strong> Lacak dari Tayangan → Dilihat → Chat Masuk.</li>
            <li><strong>⏰ Jam Sibuk Pembeli:</strong> Grafik waktu pembeli paling banyak melihat produk.</li>
            <li><strong>📍 Asal Pembeli:</strong> Provinsi asal perusahaan yang melihat produk.</li>
            <li><strong>🕵️ Kata Kunci Populer:</strong> Kata kunci yang memunculkan produk Anda.</li>
            <li><strong>🏆 Peringkat Kategori:</strong> Bandingkan performa Anda dengan kompetitor.</li>
            <li><strong>🔥 Top 5 Produk:</strong> Produk yang paling banyak di-chat.</li>
          </ul>
        </div>

        <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-8 border border-red-100 dark:border-red-900/30">
          <h3 className="text-xl font-bold text-red-900 dark:text-red-400 mb-4 flex items-center gap-2">
            <span className="text-2xl">🏷️</span> Fitur Promo Diskon
          </h3>
          <p className="text-sm text-red-800 dark:text-red-300 mb-4">
            Fitur opsional untuk menciptakan urgensi (FOMO) kepada pembeli. Tersedia untuk semua paket.
          </p>
          <ul className="space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
            <li><strong>Cara Kerja:</strong> Atur label diskon (misal: "Flash Sale") dan pilih durasinya (3, 7, 15, atau 30 Hari).</li>
            <li><strong>Visual:</strong> Badge merah menyala yang sangat mencolok di gambar produk.</li>
            <li><strong>Manfaat:</strong> Meningkatkan CTR (Click-Through Rate) secara drastis.</li>
            <li><strong>Otomatisasi:</strong> Label diskon hilang otomatis saat durasi habis.</li>
          </ul>
        </div>
      </div>

      {/* CTA SECTION */}
      <div className="text-center bg-forest-900 rounded-2xl p-10 text-white shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Siap Meningkatkan Penjualan Anda?</h2>
        <p className="mb-8 text-white/80">Pilih paket yang sesuai dengan kebutuhan bisnis Anda atau mulai promosikan produk andalan Anda sekarang.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href={`/${lang}/pricing`}>
            <Button className="bg-lime-400 text-neutral-900 hover:bg-lime-300 font-bold px-8 py-3 h-auto">Lihat Paket Harga</Button>
          </Link>
          <Link href={`/${lang}/workspace/seller`}>
            <Button variant="secondary" className="border-white text-white hover:bg-white/10 px-8 py-3 h-auto">Ke Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}