import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/id/login?error=invalid_token", req.url));
  }

  try {
    const user = await prisma.user.findFirst({
      where: { 
        verifyToken: token,
        verifyTokenExpires: { gt: new Date() } // Pastikan belum kedaluwarsa
      }
    });

    if (!user) {
      return NextResponse.redirect(new URL("/id/login?error=token_expired", req.url));
    }

    // Tandai email sebagai terverifikasi dan hapus token
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        emailVerifiedAt: new Date(),
        verifyToken: null,
        verifyTokenExpires: null
      }
    });

    // Redirect ke halaman login dengan pesan sukses
    return NextResponse.redirect(new URL("/id/login?verified=true", req.url));
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.redirect(new URL("/id/login?error=system_error", req.url));
  }
}