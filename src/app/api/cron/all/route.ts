import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

// IMPORT CRON BISNIS
import { expireSponsorships } from "@/lib/cron/expire-sponsorships";
import { cancelPendingSponsorships } from "@/lib/cron/cancel-pending-sponsorships";
import { expireSubscriptions } from "@/lib/cron/expire-subscriptions";
import { enforceProductLimits } from "@/lib/cron/enforce-product-limits";
import { expireRfqs } from "@/lib/cron/expire-rfqs";
import { deactivateExpiredBanners } from "@/lib/cron/deactivate-expired-banners";

// IMPORT CRON CLEANUP DASAR
import { cleanupUnverifiedUsers, cleanupOldAnalytics } from "@/lib/cron/cleanup";

// IMPORT CRON CLEANUP LANJUTAN
import { 
  cleanupOldAuditLogs, 
  cleanupAbandonedDrafts, 
  cleanupDeletedMessages,
  cleanupOldResolvedReports,
  cleanupOldRequests,
  cleanupOldRfqs
} from "@/lib/cron/cleanup-advanced";

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
      // --- CRON BISNIS ---
      expireSponsorships(),
      cancelPendingSponsorships(),
      expireSubscriptions(),
      enforceProductLimits(),
      expireRfqs(),
      deactivateExpiredBanners(),

      // --- CRON CLEANUP DASAR ---
      cleanupUnverifiedUsers(),
      cleanupOldAnalytics(),

      // --- CRON CLEANUP LANJUTAN ---
      cleanupOldAuditLogs(),
      cleanupAbandonedDrafts(),
      cleanupDeletedMessages(),
      cleanupOldResolvedReports(),
      cleanupOldRequests(),
      cleanupOldRfqs(),
    ]);

    const durationMs = Date.now() - startedAt;
    
    // Format hasil log (Urutan nama harus sama dengan urutan fungsi di atas)
    const taskNames = [
      "expireSponsorships", 
      "cancelPending", 
      "expireSubscriptions", 
      "enforceProductLimits", 
      "expireRfqs", 
      "deactivateBanners",
      "cleanupUnverifiedUsers", 
      "cleanupOldAnalytics",
      "cleanupOldAuditLogs",
      "cleanupAbandonedDrafts",
      "cleanupDeletedMessages",
      "cleanupOldResolvedReports",
      "cleanupOldRequests",
      "cleanupOldRfqs"
    ];

    const summary = results.map((r, i) => {
      if (r.status === "fulfilled") {
        return { task: taskNames[i], status: "OK", data: r.value };
      } else {
        return { task: taskNames[i], status: "FAILED", error: String(r.reason) };
      }
    });

    // Cetak log ke konsol Render
    console.log(`[cron:all] Selesai (${durationMs}ms):`, summary);

    return NextResponse.json({ ok: true, durationMs, results: summary });
  } catch (error) {
    console.error("[cron:all] Fatal Error:", error);
    return NextResponse.json({ ok: false, error: "Cron failed" }, { status: 500 });
  }
}