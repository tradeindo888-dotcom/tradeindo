import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const TrackSchema = z.object({
  productId: z.string().cuid().optional(),
  productIds: z.array(z.string().cuid()).optional(),
  supplierCompanyId: z.string().cuid().optional(),
  eventType: z.enum(["IMPRESSION", "VIEW", "CLICK", "CHAT", "PROFILE_VIEW"]),
  source: z.enum(["sponsored", "organic"]).optional(),
  sessionId: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = TrackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error }, { status: 400 });

  const session = await getServerSession(authOptions).catch(() => null);
  const userId = (session?.user as any)?.id ?? null;
  const userCompanyId = (session?.user as any)?.companyId ?? null;
  const { eventType, source, sessionId } = parsed.data;

  try {
    if (eventType === "PROFILE_VIEW" && parsed.data.supplierCompanyId) {
      if (userCompanyId === parsed.data.supplierCompanyId) {
        return NextResponse.json({ ok: true, skipped: "self-view" });
      }
      
      await prisma.productEvent.create({
        data: {
          supplierCompanyId: parsed.data.supplierCompanyId,
          eventType: "PROFILE_VIEW",
          source: "organic",
          userId,
          sessionId,
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (eventType === "IMPRESSION" && parsed.data.productIds) {
      const products = await prisma.product.findMany({
        where: { id: { in: parsed.data.productIds } },
        select: { id: true, companyId: true }
      });

      const validProductIds = products.filter(p => p.companyId !== userCompanyId).map(p => p.id);

      if (validProductIds.length > 0) {
        await prisma.productEvent.createMany({
          data: validProductIds.map(id => ({
            productId: id, eventType: "IMPRESSION", source: source || "organic", userId, sessionId,
          })),
        });
      }
    } 
    else if (parsed.data.productId) {
      const product = await prisma.product.findUnique({
        where: { id: parsed.data.productId },
        select: { companyId: true }
      });

      if (product && product.companyId === userCompanyId) {
        return NextResponse.json({ ok: true, skipped: "self-view" });
      }

      await prisma.productEvent.create({
        data: { productId: parsed.data.productId, eventType, source, userId, sessionId },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("TRACK ERROR:", error);
    // KEMBALIKAN PESAN ERROR ASLI KE BROWSER
    return NextResponse.json({ error: error.message || "Gagal menyimpan data" }, { status: 500 });
  }
}