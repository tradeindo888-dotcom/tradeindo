import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  name: z.string().min(2, "Nama minimal 2 karakter"),
  role: z.enum(["BUYER", "SUPPLIER"]),
  companyName: z.string().min(2, "Nama perusahaan minimal 2 karakter"),
  companyType: z.enum(["MANUFACTURER", "DISTRIBUTOR", "EXPORTER", "BUYER"]),
});

export const rfqSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  quantity: z.coerce.number().int().positive("Jumlah harus angka positif"),
  quantityUnit: z.string().default("pcs"),
  // Ubah menjadi z.number() karena dari form kita kirim number atau null
  targetPrice: z.number().int().positive().optional().nullable(),
  targetPriceMax: z.number().int().positive().optional().nullable(),
  deliveryCity: z.string().optional().nullable(),
  deadlineAt: z.string().min(1, "Deadline wajib diisi"),
  verifiedOnly: z.boolean().default(false),
});

export const quoteSchema = z.object({
  rfqId: z.string().min(1, "ID RFQ tidak valid"),
  unitPrice: z.coerce.number().int().positive("Harga satuan harus angka positif"),
  deliveryDays: z.coerce.number().int().positive("Estimasi pengiriman harus angka positif"),
  validUntil: z.string().min(1, "Batas validitas penawaran wajib diisi"),
  notes: z.string().optional(),
});