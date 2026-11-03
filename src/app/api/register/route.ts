import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    
    if (!body?.email || !body?.password || !body?.name || !body?.role || !body?.companyName) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    const allowedRoles = ["BUYER", "SUPPLIER"];
    if (!allowedRoles.includes(body.role)) {
      return NextResponse.json({ error: "Role tidak valid." }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });

    let slug = slugify(body.companyName);
    if (!slug) slug = `company-${Date.now().toString(36)}`;
    const dup = await prisma.company.findUnique({ where: { slug } });
    if (dup) slug = `${slug}-${Date.now().toString(36)}`;

    // Generate Token Verifikasi (berlaku 24 jam)
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat Perusahaan
      const company = await tx.company.create({
        data: { 
          name: body.companyName, 
          slug, 
          type: body.role === "BUYER" ? "BUYER" : "MANUFACTURER",
          plan: "FREE",
          logoUrl: body.logoUrl || null,
          description: body.description || null,
          yearEstablished: body.yearEstablished ? Number(body.yearEstablished) : null,
          website: body.website || null,
          city: body.city || null,
          province: body.province || null,
          address: body.address || null,
          phone: body.phone || null,
          exportCapability: Boolean(body.exportCapability), // <-- DITAMBAHKAN
        },
      });

      // 2. Buat User (Dengan Token Verifikasi)
      const user = await tx.user.create({
        data: { 
          email: body.email, 
          name: body.name, 
          role: body.role, 
          companyId: company.id, 
          passwordHash: await bcrypt.hash(body.password, 10),
          verifyToken,
          verifyTokenExpires
        },
      });

      return { company, user };
    });

    // 3. Kirim Email (Dilakukan di luar transaksi database)
    // Dibungkus try-catch agar jika email gagal, pendaftaran tetap sukses
    try {
      await sendVerificationEmail(result.user.email, result.user.name || "Pengguna", verifyToken);
    } catch (emailError) {
      console.error("Pendaftaran sukses, tapi gagal mengirim email verifikasi:", emailError);
      // Tidak melempar error 500, agar user tidak bingung dan tidak mendaftar dua kali
    }

    return NextResponse.json({ ok: true, message: "Cek email Anda untuk verifikasi." });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem saat mendaftar." }, { status: 500 });
  }
}