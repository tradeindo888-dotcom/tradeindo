import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Durasi paket (dalam hari)
const PLAN_DURATIONS: Record<string, number> = {
  PRO: 30,
  PREMIUM: 30,
  ENTERPRISE: 365,
  FREE: 0, // FREE tidak punya expiresAt
};

// Batas produk per paket
const PLAN_LIMITS: Record<string, number> = {
  FREE: 10,
  PRO: 100,
  PREMIUM: 500,
  ENTERPRISE: 99999,
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const form = await req.formData();
  const requestId = String(form.get("requestId"));
  const action = String(form.get("action"));
  const returnTo = String(form.get("returnTo") ?? "/id/admin");

  const request = await prisma.subscriptionRequest.findUnique({ 
    where: { id: requestId },
    include: { company: true }
  });
  
  if (!request || request.status !== "PENDING") {
    return NextResponse.redirect(new URL(returnTo, req.url));
  }

  if (action === "reject") {
    await prisma.subscriptionRequest.update({ 
      where: { id: requestId }, 
      data: { status: "REJECTED" } 
    });
    return NextResponse.redirect(new URL(returnTo, req.url), { status: 303 });
  }

  // --- LOGIKA APPROVE ---
  const now = new Date();
  const requestedPlan = request.requestedPlan;
  const durationDays = PLAN_DURATIONS[requestedPlan] ?? 30;
  const newLimit = PLAN_LIMITS[requestedPlan] ?? 10;

  // Tentukan tanggal berakhir baru
  let newExpiresAt: Date | null = null;
  if (requestedPlan !== "FREE") {
    // Jika paket saat ini masih aktif, extend dari tanggal lama
    // Jika sudah expired (di grace period), mulai dari sekarang
    let baseDate = now;
    if (request.company.planExpiresAt && request.company.planExpiresAt > now) {
      baseDate = request.company.planExpiresAt;
    }
    newExpiresAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Update request status
      await tx.subscriptionRequest.update({ 
        where: { id: requestId }, 
        data: { status: "APPROVED" } 
      });

      // 2. Update company plan, planStartedAt, planExpiresAt
      await tx.company.update({ 
        where: { id: request.companyId }, 
        data: { 
          plan: requestedPlan as any,
          planStartedAt: now,
          planExpiresAt: newExpiresAt,
        } 
      });

      // 3. Kembalikan produk HIDDEN ke ACTIVE (jika ada slot kosong)
      const activeCount = await tx.product.count({
        where: { companyId: request.companyId, status: "ACTIVE" },
      });

      const slotsAvailable = newLimit - activeCount;
      if (slotsAvailable > 0) {
        const hiddenProducts = await tx.product.findMany({
          where: { companyId: request.companyId, status: "HIDDEN" },
          orderBy: { createdAt: "desc" },
          take: slotsAvailable,
        });

        if (hiddenProducts.length > 0) {
          await tx.product.updateMany({
            where: { id: { in: hiddenProducts.map((p) => p.id) } },
            data: { status: "ACTIVE" },
          });
        }
      }

      // 4. Batalkan request PENDING lain (jika supplier iseng membuat banyak)
      await tx.subscriptionRequest.updateMany({
        where: {
          companyId: request.companyId,
          status: "PENDING",
          id: { not: requestId },
        },
        data: { status: "REJECTED" },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          action: "subscription.approve",
          entity: "Company",
          entityId: request.companyId,
          metadata: {
            previousPlan: request.company.plan,
            newPlan: requestedPlan,
            durationDays,
            newExpiresAt: newExpiresAt?.toISOString() ?? null,
            restoredProducts: slotsAvailable,
          },
        },
      });
    });

    return NextResponse.redirect(new URL(returnTo, req.url), { status: 303 });
  } catch (error) {
    console.error("verify-subscription error:", error);
    return NextResponse.redirect(new URL(`${returnTo}?error=approve_failed`, req.url), { status: 303 });
  }
}