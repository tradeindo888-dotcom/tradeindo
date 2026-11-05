"use client";
import { useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

function ResetPasswordForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";
  
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null);
    
    const fd = new FormData(e.currentTarget);
    const newPassword = fd.get("password");
    const confirmPassword = fd.get("confirmPassword");

    if (newPassword !== confirmPassword) {
      setError(lang === "en" ? "Passwords do not match." : "Konfirmasi password tidak cocok.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });

    setLoading(false);
    if (res.ok) {
      alert(lang === "en" ? "Password updated! Please sign in." : "Password berhasil diubah! Silakan login dengan password baru.");
      router.push(`/${lang}/login`);
    } else {
      const j = await res.json();
      setError(j.error || "Gagal mereset password.");
    }
  }

  if (!token) {
    return <div className="p-8 text-center text-red-500">Token tidak ditemukan di URL. Silakan minta link baru.</div>;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-2xl font-bold">{lang === "en" ? "Reset Password" : "Reset Password"}</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        {lang === "en" ? "Enter your new password." : "Masukkan password baru Anda."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">{lang === "en" ? "New Password" : "Password Baru"}</label>
          <input name="password" type="password" minLength={8} required className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
        </div>
        <div>
          <label className="text-sm font-medium">{lang === "en" ? "Confirm New Password" : "Konfirmasi Password Baru"}</label>
          <input name="confirmPassword" type="password" minLength={8} required className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
        </div>
        
        {error && <p className="text-sm text-red-600">{error}</p>}
        
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Memproses..." : (lang === "en" ? "Reset Password" : "Simpan Password Baru")}
        </Button>
      </form>
    </div>
  );
}

// Wrapper Suspense wajib untuk useSearchParams
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center">Memuat halaman...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}