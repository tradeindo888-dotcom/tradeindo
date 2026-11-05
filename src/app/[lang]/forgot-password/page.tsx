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
      setMessage(lang === "en" ? "Check your email inbox (and spam folder) for the reset link." : "Silakan cek kotak masuk email Anda (dan folder spam) untuk link reset.");
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
          <label className="text-sm font-medium block mb-1">Email</label>
          {/* Input dibuat putih dan teks hitam secara eksplisit */}
          <input 
            name="email" 
            type="email" 
            required 
            className="h-11 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400" 
          />
        </div>
        
        {message && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">{message}</p>}
        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}
        
        <Button type="submit" disabled={loading} className="w-full h-11 text-base font-bold">
          {loading ? "Memproses..." : (lang === "en" ? "Send Reset Link" : "Kirim Link Reset")}
        </Button>
      </form>
      
      <p className="mt-6 text-sm text-center">
        <Link href={`/${lang}/login`} className="text-neutral-900 dark:text-white hover:text-forest-700 dark:hover:text-lime-400 font-semibold hover:underline">
          Kembali ke Login
        </Link>
      </p>
    </div>
  );
}