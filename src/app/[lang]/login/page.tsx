"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = params.lang === "en" ? "en" : "id";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Cek callbackUrl (jika diarahkan dari halaman lain karena belum login)
  const callbackUrl = searchParams.get("callbackUrl") || `/${lang}/workspace`;
  // Cek pesan verifikasi (jika diarahkan dari link email)
  const verified = searchParams.get("verified");
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (verified === "true") {
      toast.success(
        lang === "en"
          ? "Email verified successfully! Please log in."
          : "Email berhasil diverifikasi! Silakan masuk."
      );
    } else if (errorParam === "invalid_token") {
      toast.error(lang === "en" ? "Invalid verification link." : "Link verifikasi tidak valid.");
    } else if (errorParam === "token_expired") {
      toast.error(lang === "en" ? "Verification link has expired." : "Link verifikasi sudah kedaluwarsa.");
    }
  }, [verified, errorParam, lang]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error.includes("EmailNotVerified")) {
          toast.error(lang === "en" ? "Please verify your email first." : "Silakan verifikasi email Anda terlebih dahulu.");
        } else if (res.error.includes("AccountSuspended")) {
          const reason = res.error.split(":")[1] || (lang === "en" ? "Violation of rules." : "Pelanggaran aturan.");
          toast.error(lang === "en" ? `Account suspended: ${reason}` : `Akun ditangguhkan: ${reason}`);
        } else if (res.error.includes("AccountBanned")) {
          const reason = res.error.split(":")[1] || (lang === "en" ? "Permanently banned." : "Diblokir permanen.");
          toast.error(lang === "en" ? `Account banned: ${reason}` : `Akun diblokir: ${reason}`);
        } else {
          toast.error(lang === "en" ? "Invalid email or password." : "Email atau password salah.");
        }
      } else {
        toast.success(lang === "en" ? "Logged in successfully!" : "Berhasil masuk!");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      toast.error(lang === "en" ? "An error occurred." : "Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold mb-2">
          {lang === "en" ? "Sign In" : "Masuk"}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {lang === "en" ? "Enter your credentials to access your account." : "Masukkan kredensial Anda untuk mengakses akun."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <label className="text-sm font-medium block mb-1">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 rounded-md border border-neutral-300 px-3 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400"
            placeholder="email@contoh.com"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium block">Password</label>
            <Link href={`/${lang}/forgot-password`} className="text-xs text-forest-700 hover:underline dark:text-lime-400 font-medium">
             {lang === "en" ? "Forgot password?" : "Lupa password?"}
            </Link>
        </div>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 rounded-md border border-neutral-300 px-3 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400"
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full h-11 text-base font-bold">
          {loading ? (lang === "en" ? "Signing in..." : "Memproses...") : (lang === "en" ? "Sign In" : "Masuk")}
        </Button>

        <div className="text-center text-sm text-neutral-600 dark:text-neutral-400 pt-2">
          {lang === "en" ? "Don't have an account? " : "Belum punya akun? "}
          <Link href={`/${lang}/register`} className="text-forest-700 font-bold hover:underline dark:text-lime-400">
            {lang === "en" ? "Register here" : "Daftar di sini"}
          </Link>
        </div>
      </form>
    </div>
  );
}