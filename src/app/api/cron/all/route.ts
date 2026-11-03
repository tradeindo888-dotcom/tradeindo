import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { expireSponsorships } from "@/lib/cron/expire-sponsorships";
import { cancelPendingSponsorships } from "@/lib/cron/cancel-pending-sponsorships";
import { expireSubscriptions } from "@/lib/cron/expire-subscriptions";
import { enforceProductLimits } from "@/lib/cron/enforce-product-limits";
import { cleanupUnverifiedUsers, cleanupOldAnalytics } from "@/lib/cron/cleanup";
import { expireRfqs } from "@/lib/cron/expire-rfqs";

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

    const results = await Promise.all([
      expireSponsorships(),
      cancelPendingSponsorships(),
      expireSubscriptions(),
      enforceProductLimits(),
      cleanupUnverifiedUsers(),
      cleanupOldAnalytics(),
      expireRfqs(), // <-- BARU
    ]);

    const durationMs = Date.now() - startedAt;
    console.log(`[cron:all] Berhasil (${durationMs}ms):`, results);

    return NextResponse.json({ ok: true, durationMs, results });
  } catch (error) {
    console.error("[cron:all] Gagal:", error);
    return NextResponse.json({ ok: false, error: "Cron failed" }, { status: 500 });
  }
}