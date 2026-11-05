import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PLAN_DURATIONS: Record<string, number> = { PRO: 30, PREMIUM: 30, ENTERPRISE: 365, FREE: 0 };
const PLAN_LIMITS: Record<string, number> = { FREE: 10, PRO: 100, PREMIUM: 500, ENTERPRISE: 99999 };

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { requestId, action } = body;

    if (!requestId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const request = await prisma.subscriptionRequest.findUnique({ 
      where: { id: requestId },
      include: { company: true }
    });
    
    if (!request || request.status !== "PENDING") {
      return NextResponse.json({ error: "Request tidak ditemukan atau sudah diproses." }, { status: 404 });
    }

    if (action === "reject") {
      await prisma.subscriptionRequest.update({ 
        where: { id: requestId }, 
        data: { status: "REJECTED" } 
      });
      return NextResponse.json({ success: true });
    }

    // --- LOGIKA APPROVE ---
    const now = new Date();
    const requestedPlan = request.requestedPlan;
    const durationDays = PLAN_DURATIONS[requestedPlan] ?? 30;
    const newLimit = PLAN_LIMITS[requestedPlan] ?? 10;

    let newExpiresAt: Date | null = null;
    if (requestedPlan !== "FREE") {
      let baseDate = now;
      if (request.company?.planExpiresAt && request.company.planExpiresAt > now) {
        baseDate = request.company.planExpiresAt;
      }
      newExpiresAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    }

    await prisma.$transaction(async (tx) => {
      await tx.subscriptionRequest.update({ 
        where: { id: requestId }, 
        data: { status: "APPROVED" } 
      });

      await tx.company.update({ 
        where: { id: request.companyId }, 
        data: { plan: requestedPlan as any, planStartedAt: now, planExpiresAt: newExpiresAt } 
      });

      // HITUNG SISA SLOT UNTUK MEMUNCULKAN PRODUK YANG HIDDEN
      const activeCount = await tx.product.count({ where: { companyId: request.companyId, status: "ACTIVE" } });
      const slotsAvailable = newLimit - activeCount;
      
      if (slotsAvailable > 0) {
        // Ambil produk HIDDEN, prioritas yang paling lama atau terbaru (bebas, di sini kita ambil terbaru)
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

      // Tolak pengajuan PENDING lain milik user ini jika ada (agar tidak dobel)
      await tx.subscriptionRequest.updateMany({
        where: { companyId: request.companyId, status: "PENDING", id: { not: requestId } },
        data: { status: "REJECTED" },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          action: "subscription.approve",
          entity: "Company",
          entityId: request.companyId,
          metadata: {
            previousPlan: request.company?.plan || "UNKNOWN",
            newPlan: requestedPlan,
            durationDays,
            newExpiresAt: newExpiresAt?.toISOString() ?? null,
            restoredProducts: slotsAvailable,
          },
        },
      });
    });

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("verify-subscription FATAL ERROR:", error);
    return NextResponse.json({ error: "Terjadi kesalahan sistem" }, { status: 500 });
  }
}