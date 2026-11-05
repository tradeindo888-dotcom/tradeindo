import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });

    // Selalu kembalikan response sukses untuk mencegah hacker menebak email terdaftar
    if (!user) {
      return NextResponse.json({ success: true, message: "Jika email terdaftar, link reset telah dikirim." });
    }

    // Buat token acak (berlaku 1 jam)
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 jam

    // Simpan token ke database
    await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    // Kirim Email via Brevo
    await sendPasswordResetEmail(email, user.name || "", token);

    return NextResponse.json({ success: true, message: "Jika email terdaftar, link reset telah dikirim." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}