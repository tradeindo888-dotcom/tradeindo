"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

// ID anonim yang bertahan lintas tab/sesi, dipakai server untuk dedupe
function getAnonSessionId(): string | undefined {
  try {
    let id = localStorage.getItem("anon_session_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("anon_session_id", id);
    }
    return id;
  } catch {
    return undefined; // storage diblokir (mode private, dll.)
  }
}

export function ProfileViewTracker({
  supplierCompanyId,
}: {
  supplierCompanyId: string;
}) {
  const { data: session, status } = useSession();
  
  // PERBAIKAN: Gunakan 'as any' agar TypeScript mengenali properti kustom
  const viewerId = (session?.user as any)?.id ?? "anon";
  const myCompanyId = (session?.user as any)?.companyId;

  useEffect(() => {
    // 1. Tunggu session selesai loading
    if (status === "loading") return;

    // 2. Pemilik yang melihat profilnya sendiri tidak dihitung
    if (myCompanyId && myCompanyId === supplierCompanyId) return;

    // 3. Dedupe per tab, per penonton (ganti akun = dihitung lagi)
    const key = `profile_viewed_${supplierCompanyId}_${viewerId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // storage tidak tersedia: lanjut, server tetap dedupe
    }

    // 4. Kirim ke API
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierCompanyId,
        eventType: "PROFILE_VIEW",
        source: "organic",
        sessionId: getAnonSessionId(),
      }),
      keepalive: true,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      })
      .catch((err) => {
        console.error("Tracker Error:", err);
        try {
          sessionStorage.removeItem(key); // boleh dicoba lagi
        } catch {}
      });
  }, [supplierCompanyId, viewerId, myCompanyId, status]);

  return null;
}