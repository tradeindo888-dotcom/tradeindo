"use client";
import { signIn } from "next-auth/react";
import { useParams, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

function LoginForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = params.lang === "en" ? "en" : "id";
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isVerified = searchParams.get("verified") === "true";
  const isTokenExpired = searchParams.get("error") === "token_expired";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", { 
      email: fd.get("email"), 
      password: fd.get("password"), 
      redirect: false 
    });

    setLoading(false);

    if (res?.error) {
      if (res.error === "EmailNotVerified") {
        setError(lang === "en" ? "Please verify your email first." : "Silakan verifikasi email Anda terlebih dahulu.");
      } else if (res.error.includes("AccountSuspended")) {
        const reason = res.error.split(":")[1] || "Pelanggaran aturan platform.";
        setError(lang === "en" ? `Your account is suspended. Reason: ${reason}` : `Akun Anda ditangguhkan. Alasan: ${reason}`);
      } else if (res.error.includes("AccountBanned")) {
        const reason = res.error.split(":")[1] || "Akun diblokir permanen.";
        setError(lang === "en" ? `Your account is permanently banned. Reason: ${reason}` : `Akun Anda diblokir permanen. Alasan: ${reason}`);
      } else {
        setError(lang === "en" ? "Invalid email or password." : "Email atau password salah.");
      }
    } else {
      const nextUrl = searchParams.get("next");
      if (nextUrl) {
        window.location.href = nextUrl;
      } else {
        try {
          const sessionRes = await fetch("/api/auth/session");
          const sessionData = await sessionRes.json();
          
          if (sessionData?.user?.role === "ADMIN") {
            window.location.href = `/${lang}/admin`;
          } else if (sessionData?.user?.role === "SUPPLIER") {
            window.location.href = `/${lang}/workspace/seller`;
          } else {
            window.location.href = `/${lang}`;
          }
        } catch (err) {
          window.location.href = `/${lang}`;
        }
      }
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-2xl font-bold">{lang === "en" ? "Sign In" : "Masuk"}</h1>
      
      {isVerified && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-sm border border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400">
          {lang === "en" ? "Email verified successfully! You can now log in." : "Email berhasil diverifikasi! Silakan login."}
        </div>
      )}
      {isTokenExpired && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400">
          {lang === "en" ? "Verification link is invalid or expired." : "Link verifikasi tidak valid atau sudah kedaluwarsa."}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input name="email" type="email" required className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
        </div>
        
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Password</label>
            <Link href={`/${lang}/forgot-password`} className="text-xs text-forest-700 hover:underline dark:text-lime-400 font-medium">
              {lang === "en" ? "Forgot password?" : "Lupa password?"}
            </Link>
          </div>
          <input name="password" type="password" required className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
        </div>
        
        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded leading-relaxed">{error}</p>}
        
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (lang === "en" ? "Signing in..." : "Memproses...") : (lang === "en" ? "Sign In" : "Masuk")}
        </Button>
      </form>
      
      <p className="mt-6 text-sm text-center text-neutral-600 dark:text-neutral-400">
        {lang === "en" ? "Don't have an account?" : "Belum punya akun?"} {" "}
        <Link href={`/${lang}/register`} className="text-forest-700 hover:underline dark:text-lime-400 font-medium">
          {lang === "en" ? "Register" : "Daftar"}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center">Memuat halaman login...</div>}>
      <LoginForm />
    </Suspense>
  );
}