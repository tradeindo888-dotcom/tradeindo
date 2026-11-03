import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Data tidak valid atau password kurang dari 8 karakter." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() }, // Token belum kedaluwarsa
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Token tidak valid atau sudah kedaluwarsa." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,           // Hapus token agar tidak bisa dipakai lagi
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ success: true, message: "Password berhasil diubah." });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}