import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

// Pakai DIRECT_URL (port 5432). Kalau masih timeout, ganti ke process.env.DATABASE_URL
const baseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

if (!baseUrl) {
  console.error("❌ DIRECT_URL / DATABASE_URL tidak ditemukan di .env");
  process.exit(1);
}

// Tambah parameter hanya kalau belum ada, supaya tidak dobel
function withParams(url: string, params: Record<string, string>) {
  const hasQuery = url.includes("?");
  const existing = new URLSearchParams(hasQuery ? url.split("?")[1] : "");
  const extra = Object.entries(params)
    .filter(([key]) => !existing.has(key))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  if (!extra) return url;
  return url + (hasQuery ? "&" : "?") + extra;
}

const url = withParams(baseUrl, {
  connection_limit: "1",
  pool_timeout: "60",
  connect_timeout: "60",
});

const prisma = new PrismaClient({ datasourceUrl: url });

const categories = [
  { nameId: "Pertanian & Perkebunan", nameEn: "Agriculture", slug: "pertanian", featured: true },
  { nameId: "Makanan Olahan", nameEn: "Processed Food", slug: "makanan-olahan", featured: true },
  { nameId: "Furnitur", nameEn: "Furniture", slug: "furnitur", featured: true },
  { nameId: "Tekstil", nameEn: "Textile", slug: "tekstil", featured: true },
  { nameId: "Kerajinan", nameEn: "Crafts", slug: "kerajinan", featured: true },
  { nameId: "Pakaian & Mode", nameEn: "Apparel & Fashion", slug: "pakaian-mode", featured: true },
  { nameId: "Kimia", nameEn: "Chemicals", slug: "kimia", featured: true },
  { nameId: "Mesin", nameEn: "Machinery", slug: "mesin", featured: true },
  { nameId: "Otomotif", nameEn: "Automotive", slug: "otomotif", featured: true },
  { nameId: "Peralatan Elektronik", nameEn: "Electronics & Electrical Supplies", slug: "peralatan-elektronik", featured: true },
  { nameId: "Material Bangunan", nameEn: "Construction Supplies", slug: "material-bangunan", featured: true },
  { nameId: "Peralatan Medis", nameEn: "Hospital & Medical Supplies", slug: "peralatan-medis", featured: true },
  { nameId: "Perlengkapan Rumah", nameEn: "Home Supplies", slug: "perlengkapan-rumah", featured: true },
  { nameId: "Mineral & Metal", nameEn: "Mineral & Metal", slug: "mineral-metal", featured: true },
  { nameId: "Kemasan", nameEn: "Packaging & Paper", slug: "kemasan", featured: true },
];

async function main() {
  console.log("⏳ Menghubungkan ke database...");
  await prisma.$connect();
  console.log("🔌 Terhubung. Memasukkan kategori...");

  let done = 0;
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
    done++;
    console.log(`  [${done}/${categories.length}] ${c.slug}`);
  }

  console.log(`✅ ${categories.length} kategori berhasil dimasukkan ke Supabase!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed gagal:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });