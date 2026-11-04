import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role;
    const path = req.nextUrl.pathname;

    // Deteksi bahasa (locale) dari URL
    const locale = path.startsWith("/en") ? "en" : "id";
    
    // Hapus prefix locale untuk mengecek hak akses
    const cleanPath = path.replace(/^\/(id|en)/, "");

    // 1. Proteksi halaman /admin (Hanya ADMIN)
    if (cleanPath.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL(`/${locale}`, req.url));
    }

    // 2. Proteksi halaman /workspace/seller (Hanya SUPPLIER & ADMIN)
    if (cleanPath.startsWith("/workspace/seller") && role !== "SUPPLIER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL(`/${locale}/workspace/buyer`, req.url));
    }

    // 3. Proteksi halaman /workspace/buyer (Hanya BUYER & ADMIN)
    if (cleanPath.startsWith("/workspace/buyer") && role !== "BUYER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL(`/${locale}/workspace/seller`, req.url));
    }

    // 4. Jika belum login dan mencoba akses rute privat
    if (!token) {
      const callbackUrl = encodeURIComponent(path);
      return NextResponse.redirect(new URL(`/${locale}/login?callbackUrl=${callbackUrl}`, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Biarkan middleware function di atas yang mengurus redirect
      authorized: () => true,
    },
  }
);

export const config = {
  // HANYA jalankan middleware di rute ini (halaman publik aman)
  matcher: [
    "/workspace/:path*",
    "/admin/:path*",
    "/rfqs/new",
    "/id/workspace/:path*",
    "/id/admin/:path*",
    "/id/rfqs/new",
    "/en/workspace/:path*",
    "/en/admin/:path*",
    "/en/rfqs/new",
  ],
};