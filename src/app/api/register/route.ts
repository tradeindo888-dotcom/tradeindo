import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

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
          exportCapability: Boolean(body.exportCapability),
        },
      });

      // 2. Buat User (Langsung Terverifikasi)
      const user = await tx.user.create({
        data: { 
          email: body.email, 
          name: body.name, 
          role: body.role, 
          companyId: company.id, 
          passwordHash: await bcrypt.hash(body.password, 10),
          emailVerifiedAt: new Date(), // <-- LANGSUNG VERIFIKASI
          verifyToken: null,           // <-- Tidak perlu token
          verifyTokenExpires: null
        },
      });

      return { company, user };
    });

    // 3. Email verifikasi tidak lagi dikirim
    // (Jika ingin mengirim email "Selamat Datang", Anda bisa memanggil fungsi sendWelcomeEmail di sini)

    return NextResponse.json({ ok: true, message: "Pendaftaran berhasil. Silakan login." });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem saat mendaftar." }, { status: 500 });
  }
}