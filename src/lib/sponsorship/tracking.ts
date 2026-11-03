import { prisma } from "@/lib/prisma";
import type { ProductEventType } from "@prisma/client";

interface TrackOptions {
  productId: string;
  eventType: ProductEventType;
  source?: "sponsored" | "organic";
  userId?: string | null;
  sessionId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function trackEvent(opts: TrackOptions): Promise<void> {
  try {
    await prisma.productEvent.create({
      data: {
        productId: opts.productId,
        eventType: opts.eventType,
        source: opts.source,
        userId: opts.userId ?? null,
        sessionId: opts.sessionId ?? null,
        metadata: opts.metadata as any,
      },
    });
  } catch (err) {
    console.error("[trackEvent] failed", err);
  }
}