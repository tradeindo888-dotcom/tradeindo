"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function ForgotPassword() {
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null); setMessage(null);
    
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: fd.get("email") }),
    });

    setLoading(false);
    if (res.ok) {
      setMessage(lang === "en" ? "Check your email for the reset link." : "Silakan cek email Anda untuk link reset.");
    } else {
      setError(lang === "en" ? "Failed to process request." : "Gagal memproses permintaan.");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-2xl font-bold">{lang === "en" ? "Forgot Password" : "Lupa Password"}</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        {lang === "en" ? "Enter your email to receive a reset link." : "Masukkan email Anda untuk menerima link reset."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input name="email" type="email" required className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
        </div>
        
        {message && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Memproses..." : (lang === "en" ? "Send Reset Link" : "Kirim Link Reset")}
        </Button>
      </form>
      
      <p className="mt-4 text-sm text-center">
        <Link href={`/${lang}/login`} className="text-forest-700 hover:underline dark:text-lime-400">Kembali ke Login</Link>
      </p>
    </div>
  );
}