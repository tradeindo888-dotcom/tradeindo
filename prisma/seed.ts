import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("password123", 10);

  // ==============================
  // DATA KATEGORI (Sesuai Daftar Anda)
  // ==============================
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: "pertanian" }, update: {}, create: { nameId: "Pertanian & Perkebunan", nameEn: "Agriculture", slug: "pertanian", featured: true } }),
    prisma.category.upsert({ where: { slug: "makanan-olahan" }, update: {}, create: { nameId: "Makanan Olahan", nameEn: "Processed Food", slug: "makanan-olahan", featured: true } }),
    prisma.category.upsert({ where: { slug: "furnitur" }, update: {}, create: { nameId: "Furnitur", nameEn: "Furniture", slug: "furnitur", featured: true } }),
    prisma.category.upsert({ where: { slug: "tekstil" }, update: {}, create: { nameId: "Tekstil", nameEn: "Textile", slug: "tekstil", featured: true } }),
    prisma.category.upsert({ where: { slug: "kerajinan" }, update: {}, create: { nameId: "Kerajinan", nameEn: "Crafts", slug: "kerajinan", featured: true } }),
    prisma.category.upsert({ where: { slug: "pakaian-mode" }, update: {}, create: { nameId: "Pakaian & Mode", nameEn: "Apparel & Fashion", slug: "pakaian-mode", featured: true } }),
    prisma.category.upsert({ where: { slug: "kimia" }, update: {}, create: { nameId: "Kimia", nameEn: "Chemicals", slug: "kimia", featured: true } }),
    prisma.category.upsert({ where: { slug: "mesin" }, update: {}, create: { nameId: "Mesin", nameEn: "Machinery", slug: "mesin", featured: true } }),
    prisma.category.upsert({ where: { slug: "otomotif" }, update: {}, create: { nameId: "Otomotif", nameEn: "Automotive", slug: "otomotif", featured: true } }),
    prisma.category.upsert({ where: { slug: "peralatan-elektronik" }, update: {}, create: { nameId: "Peralatan Elektronik", nameEn: "Electronics & Electrical Supplies", slug: "peralatan-elektronik", featured: true } }),
    prisma.category.upsert({ where: { slug: "material-bangunan" }, update: {}, create: { nameId: "Material Bangunan", nameEn: "Construction Supplies", slug: "material-bangunan", featured: true } }),
    prisma.category.upsert({ where: { slug: "peralatan-medis" }, update: {}, create: { nameId: "Peralatan Medis", nameEn: "Hospital & Medical Supplies", slug: "peralatan-medis", featured: true } }),
    prisma.category.upsert({ where: { slug: "perlengkapan-rumah" }, update: {}, create: { nameId: "Perlengkapan Rumah", nameEn: "Home Supplies", slug: "perlengkapan-rumah", featured: true } }),
    prisma.category.upsert({ where: { slug: "mineral-metal" }, update: {}, create: { nameId: "Mineral & Metal", nameEn: "Mineral & Metal", slug: "mineral-metal", featured: true } }),
    prisma.category.upsert({ where: { slug: "kemasan" }, update: {}, create: { nameId: "Kemasan", nameEn: "Packaging & Paper", slug: "kemasan", featured: true } }),
  ]);

  // ==============================
  // DATA PERUSAHAAN & USER
  // ==============================
  const supplier1 = await prisma.company.upsert({
    where: { slug: "kopi-nusantara" },
    update: {},
    create: {
      name: "Kopi Nusantara", slug: "kopi-nusantara", type: "MANUFACTURER",
      description: "Produsen kopi arabika Gayo dan robusta Lampung.",
      province: "Aceh", city: "Banda Aceh", exportCapability: true,
      verificationStatus: "VERIFIED", verifiedAt: new Date(), plan: "PRO",
    },
  });

  const supplier2 = await prisma.company.upsert({
    where: { slug: "rotan-jepara" },
    update: {},
    create: {
      name: "Rotan Jepara", slug: "rotan-jepara", type: "MANUFACTURER",
      description: "Furnitur rotan untuk pasar ekspor.",
      province: "Jawa Tengah", city: "Jepara", exportCapability: true,
      verificationStatus: "VERIFIED", verifiedAt: new Date(),
    },
  });

  const buyer = await prisma.company.upsert({
    where: { slug: "hotel-senayan" },
    update: {},
    create: { name: "Hotel Senayan", slug: "hotel-senayan", type: "BUYER", province: "DKI Jakarta", city: "Jakarta" },
  });

  await prisma.user.upsert({
    where: { email: "supplier@tradeindo.id" }, update: {},
    create: { email: "supplier@tradeindo.id", passwordHash: hash, name: "Supplier Demo", role: "SUPPLIER", companyId: supplier1.id },
  });
  await prisma.user.upsert({
    where: { email: "buyer@tradeindo.id" }, update: {},
    create: { email: "buyer@tradeindo.id", passwordHash: hash, name: "Buyer Demo", role: "BUYER", companyId: buyer.id },
  });
  await prisma.user.upsert({
    where: { email: "admin@tradeindo.id" }, update: {},
    create: { email: "admin@tradeindo.id", passwordHash: hash, name: "Admin", role: "ADMIN" },
  });

  // ==============================
  // DATA PRODUK
  // ==============================
  await prisma.product.upsert({
    where: { slug: "kopi-arabika-gayo-premium" }, update: {},
    create: {
      companyId: supplier1.id, categoryId: categories[0].id, // Pertanian
      titleId: "Kopi Arabika Gayo Premium", titleEn: "Gayo Premium Arabica Coffee",
      slug: "kopi-arabika-gayo-premium",
      description: "Green bean arabika Gayo, proses wet-hulled, kadar air 12%.",
      moq: 100, moqUnit: "kg", priceMin: 85000, priceMax: 110000,
    },
  });

  await prisma.product.upsert({
    where: { slug: "kursi-rotan-ekspor" }, update: {},
    create: {
      companyId: supplier2.id, categoryId: categories[2].id, // Furnitur
      titleId: "Kursi Rotan Ekspor", titleEn: "Export Rattan Chair",
      slug: "kursi-rotan-ekspor",
      description: "Kursi rotan alami, finishing natural, cocok untuk hotel dan residensial.",
      moq: 20, moqUnit: "unit", priceMin: 450000, priceMax: 650000,
    },
  });

  // ==============================
  // DATA RFQ & QUOTATION
  // ==============================
  const buyerUser = await prisma.user.findUniqueOrThrow({ where: { email: "buyer@tradeindo.id" } });
  const supplierUser = await prisma.user.findUniqueOrThrow({ where: { email: "supplier@tradeindo.id" } });

  // Hapus RFQ lama agar tidak dobel setiap kali di-seed
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.quote.deleteMany({});
  await prisma.rfq.deleteMany({});

  const rfq = await prisma.rfq.create({
    data: {
      buyerCompanyId: buyer.id,
      createdById: buyerUser.id,
      categoryId: categories[0].id, // Pertanian
      title: "Kebutuhan Kopi Arabika 500 kg",
      description: "Untuk kebutuhan kafe dan restoran, kualitas konsisten.",
      quantity: 500, quantityUnit: "kg",
      deliveryCity: "Jakarta", deadlineAt: new Date(Date.now() + 14 * 86400000),
    },
  });

  await prisma.quote.create({
    data: {
      rfqId: rfq.id, supplierCompanyId: supplier1.id,
      createdById: supplierUser.id,
      unitPrice: 90000, totalPrice: 45000000, deliveryDays: 7,
      validUntil: new Date(Date.now() + 10 * 86400000),
      notes: "Harga FOB Banda Aceh, bisa negosiasi untuk volume lebih besar.",
    },
  });

  console.log("Seed selesai.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());