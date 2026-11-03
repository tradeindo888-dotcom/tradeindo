import { prisma } from "@/lib/prisma";

export async function expireSubscriptions(): Promise<{ processed: number; errors: number }> {
  const now = new Date();
  // MASA TENGGANG: 7 Hari
  const gracePeriodDays = 7;
  // Kita cari yang tanggal expired-nya sudah lewat 7 hari dari sekarang
  const cutoffDate = new Date(now.getTime() - gracePeriodDays * 24 * 60 * 60 * 1000);
  
  let processed = 0;
  let errors = 0;

  const expiredCompanies = await prisma.company.findMany({
    where: {
      plan: { not: "FREE" },
      planExpiresAt: { lt: cutoffDate },
    },
  });

  for (const company of expiredCompanies) {
    try {
      const pendingRenewal = await prisma.subscriptionRequest.findFirst({
        where: { companyId: company.id, status: "PENDING" },
      });

      if (pendingRenewal) continue;

      await prisma.$transaction(async (tx) => {
        // 1. Turunkan paket ke FREE
        await tx.company.update({
          where: { id: company.id },
          data: { plan: "FREE", planStartedAt: null, planExpiresAt: null },
        });

        // 2. Ambil produk ACTIVE
        const activeProducts = await tx.product.findMany({
          where: { companyId: company.id, status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
        });

        // 3. Sembunyikan yang melebihi batas FREE (10)
        const FREE_LIMIT = 10;
        if (activeProducts.length > FREE_LIMIT) {
          const productsToHide = activeProducts.slice(FREE_LIMIT).map((p) => p.id);
          await tx.product.updateMany({
            where: { id: { in: productsToHide } },
            data: { status: "HIDDEN" },
          });
        }

        // 4. Audit Log
        await tx.auditLog.create({
          data: {
            action: "subscription.expire",
            entity: "Company",
            entityId: company.id,
            metadata: { previousPlan: company.plan, reason: "Auto-downgrade after grace period" },
          },
        });
      });
      processed++;
    } catch (err) {
      console.error(`[expire-subscriptions] failed for ${company.id}`, err);
      errors++;
    }
  }

  return { processed, errors };
}