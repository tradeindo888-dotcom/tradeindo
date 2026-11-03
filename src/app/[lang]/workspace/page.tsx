"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

export default function WorkspaceRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace(`/${lang}/login?next=/${lang}/workspace`);
      return;
    }

    const role = (session?.user as any)?.role?.toUpperCase();
    
    console.log("Mengarahkan Workspace. Role terdeteksi:", role);

    if (role === "ADMIN" || role === "VERIFIER") {
      router.replace(`/${lang}/admin`);
    } else if (role === "SUPPLIER") {
      router.replace(`/${lang}/workspace/seller`);
    } else if (role === "BUYER") {
      router.replace(`/${lang}/workspace/buyer`);
    } else {
      // JIKA ROLE TIDAK DIKETAHUI, JANGAN LEMPAR KE BERANDA.
      // Biarkan layar loading, kita akan render pesan error di bawah.
      console.error("Role tidak ditemukan di dalam session!");
    }
  }, [session, status, router, lang]);

  // TAMPILAN JIKA ROLE TIDAK DITEMUKAN
  if (status === "authenticated" && !(session?.user as any)?.role) {
    return (
      <div className="p-8 text-center text-red-500 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Error: Sesi Login Anda Tidak Valid</h1>
        <p className="mb-4">Sistem tidak dapat membaca Role Anda. Hal ini biasanya terjadi karena Cookie Login Anda sudah usang.</p>
        <p className="font-bold mb-4">Solusi: Silakan klik tombol "Keluar" di pojok kanan atas, lalu Login kembali.</p>
        <div className="text-left bg-neutral-100 p-4 rounded text-sm overflow-auto dark:bg-neutral-900 dark:text-neutral-300">
          <p className="font-bold mb-2">Data Session Anda saat ini:</p>
          <pre>{JSON.stringify(session, null, 2)}</pre>
        </div>
      </div>
    );
  }

  // Tampilan loading
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-700 mx-auto"></div>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400">Mengarahkan...</p>
      </div>
    </div>
  );
}