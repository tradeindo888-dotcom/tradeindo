import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

type CronHandler = () => Promise<Record<string, unknown>>;

export function withCronAuth(handler: CronHandler, name: string) {
  return async (req: Request) => {
    const cronSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === "production" && !cronSecret) {
      console.error(`[cron:${name}] CRON_SECRET tidak di-set!`);
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    if (process.env.NODE_ENV !== "development") {
      const auth = req.headers.get("authorization") ?? "";
      const expected = `Bearer ${cronSecret}`;
      const a = Buffer.from(auth, "utf8");
      const b = Buffer.from(expected, "utf8");
      const equal = a.length === b.length ? timingSafeEqual(a, b) : false;

      if (!equal) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    try {
      const startedAt = Date.now();
      const result = await handler();
      const durationMs = Date.now() - startedAt;
      console.log(`[cron:${name}] OK (${durationMs}ms):`, result);
      return NextResponse.json({ ok: true, ...result });
    } catch (error) {
      console.error(`[cron:${name}] FAILED:`, error);
      return NextResponse.json({ ok: false, error: "Cron failed" }, { status: 500 });
    }
  };
}