import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { expireSponsorships } from "@/lib/cron/expire-sponsorships";
import { cancelPendingSponsorships } from "@/lib/cron/cancel-pending-sponsorships";
import { expireSubscriptions } from "@/lib/cron/expire-subscriptions";
import { enforceProductLimits } from "@/lib/cron/enforce-product-limits";
import { expireRfqs } from "@/lib/cron/expire-rfqs";
import { deactivateExpiredBanners } from "@/lib/cron/deactivate-expired-banners"; // <-- Import ini

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "production" && !cronSecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (process.env.NODE_ENV !== "development") {
    const auth = req.headers.get("authorization") ?? "";
    const expected = `Bearer ${cronSecret}`;
    const a = Buffer.from(auth, "utf8");
    const b = Buffer.from(expected, "utf8");
    const equal = a.length === b.length ? timingSafeEqual(a, b) : false;
    if (!equal) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const startedAt = Date.now();

    // Jalankan semua cron secara paralel
    const results = await Promise.allSettled([
      expireSponsorships(),
      cancelPendingSponsorships(),
      expireSubscriptions(),
      enforceProductLimits(),
      expireRfqs(),
      deactivateExpiredBanners(), // <-- Tambahkan di sini
    ]);

    const durationMs = Date.now() - startedAt;
    
    // Format hasil
    const summary = results.map((r, i) => {
      const names = ["expireSponsorships", "cancelPending", "expireSubscriptions", "enforceProductLimits", "expireRfqs", "deactivateBanners"];
      if (r.status === "fulfilled") {
        return { task: names[i], status: "OK", data: r.value };
      } else {
        return { task: names[i], status: "FAILED", error: String(r.reason) };
      }
    });

    console.log(`[cron:all] Selesai (${durationMs}ms):`, summary);

    return NextResponse.json({ ok: true, durationMs, results: summary });
  } catch (error) {
    console.error("[cron:all] Fatal Error:", error);
    return NextResponse.json({ ok: false, error: "Cron failed" }, { status: 500 });
  }
}