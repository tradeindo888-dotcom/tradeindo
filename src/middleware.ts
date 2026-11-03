import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const role = req.nextauth.token?.role;
    const path = req.nextUrl.pathname;

    // 1. Proteksi halaman /admin (Hanya ADMIN yang boleh masuk)
    if (path.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // 2. Proteksi halaman /workspace/seller (Hanya SUPPLIER dan ADMIN)
    if (path.startsWith("/workspace/seller") && role !== "SUPPLIER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/workspace/buyer", req.url));
    }

    // 3. Proteksi halaman /workspace/buyer (Hanya BUYER dan ADMIN)
    if (path.startsWith("/workspace/buyer") && role !== "BUYER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/workspace/seller", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Wajib login untuk halaman di bawah
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/workspace/:path*", "/admin/:path*", "/rfqs/new"],
};