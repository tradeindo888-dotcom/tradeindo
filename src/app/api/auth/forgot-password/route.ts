import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

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

    await prisma.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    // SIMULASI PENGIRIMAN EMAIL
    const resetLink = `http://localhost:3000/id/reset-password?token=${token}`;
    console.log("\n=========================================");
    console.log("📧 SIMULASI EMAIL RESET PASSWORD");
    console.log(`Kepada: ${email}`);
    console.log(`Link Reset: ${resetLink}`);
    console.log("=========================================\n");

    return NextResponse.json({ success: true, message: "Jika email terdaftar, link reset telah dikirim." });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}