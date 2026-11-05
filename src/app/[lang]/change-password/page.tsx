"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export default function ChangePassword() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    
    if (fd.get("newPassword") !== fd.get("confirmPassword")) {
      toast.error(lang === "en" ? "Passwords do not match." : "Konfirmasi password baru tidak cocok.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fd.get("email"),
        oldPassword: fd.get("oldPassword"),
        newPassword: fd.get("newPassword"),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      toast.success(lang === "en" ? "Password updated! Please sign in." : "Password berhasil diganti! Silakan login kembali.");
      router.push(`/${lang}/login`);
    } else {
      toast.error(data.error || "Gagal mengganti password.");
    }
  }

  const inputClass = "mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900";

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-2xl font-bold">{lang === "en" ? "Change Password" : "Ganti Password"}</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        {lang === "en" ? "Enter your old password and set a new one." : "Masukkan password lama Anda dan tentukan password baru."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <input name="email" type="email" required className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-medium">{lang === "en" ? "Old Password" : "Password Lama"}</label>
          <input name="oldPassword" type="password" required className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-medium">{lang === "en" ? "New Password" : "Password Baru"}</label>
          <input name="newPassword" type="password" minLength={6} required className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-medium">{lang === "en" ? "Confirm New Password" : "Konfirmasi Password Baru"}</label>
          <input name="confirmPassword" type="password" minLength={6} required className={inputClass} />
        </div>
        
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Memproses..." : (lang === "en" ? "Save New Password" : "Simpan Password Baru")}
        </Button>
      </form>
      
      <p className="mt-4 text-sm text-center">
        <Link href={`/${lang}/login`} className="text-forest-700 hover:underline dark:text-lime-400">
          {lang === "en" ? "Back to Login" : "Kembali ke Login"}
        </Link>
      </p>
    </div>
  );
}