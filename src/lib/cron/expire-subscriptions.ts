import { prisma } from "@/lib/prisma";

export async function expireSubscriptions(): Promise<{ processed: number; errors: number }> {
  const now = new Date();
  
  // Masa Tenggang (Grace Period): 7 Hari
  const GRACE_PERIOD_DAYS = 7;
  const cutoffDate = new Date(now.getTime() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  
  let processed = 0;
  let errors = 0;

  // Cari perusahaan yang tanggal expired-nya sudah lewat 7 hari
  const expiredCompanies = await prisma.company.findMany({
    where: {
      plan: { not: "FREE" },
      planExpiresAt: { lt: cutoffDate },
    },
  });

  for (const company of expiredCompanies) {
    try {
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

        // 3. Pisahkan produk yang sedang ber-sponsor dan yang organic
        const sponsoredProducts = activeProducts.filter(p => p.sponsoredUntil && p.sponsoredUntil > now);
        const organicProducts = activeProducts.filter(p => !p.sponsoredUntil || p.sponsoredUntil <= now);

        const FREE_LIMIT = 10;
        const productsToHide: string[] = [];

        // Skenario A: Jika produk sponsor + organic melebihi batas FREE
        if (activeProducts.length > FREE_LIMIT) {
          // Produk sponsor selalu aman (tidak di-hide)
          // Kita hitung berapa slot FREE yang tersisa untuk produk organic
          const slotsLeftForOrganic = Math.max(0, FREE_LIMIT - sponsoredProducts.length);
          
          // Ambil produk organic yang melebihi slot untuk di-hide
          if (organicProducts.length > slotsLeftForOrganic) {
            const hideList = organicProducts.slice(slotsLeftForOrganic).map(p => p.id);
            productsToHide.push(...hideList);
          }
        }

        // 4. Sembunyikan produk organic yang melebihi limit
        if (productsToHide.length > 0) {
          await tx.product.updateMany({
            where: { id: { in: productsToHide } },
            data: { status: "HIDDEN" },
          });
        }

        // 5. Audit Log
        await tx.auditLog.create({
          data: {
            action: "subscription.expire",
            entity: "Company",
            entityId: company.id,
            metadata: { 
              previousPlan: company.plan, 
              reason: "Auto-downgrade after 7-day grace period",
              hiddenCount: productsToHide.length,
              retainedSponsored: sponsoredProducts.length
            },
          },
        });
      });
      
      console.log(`[expire-subscriptions] Berhasil menurunkan paket ${company.id} ke FREE.`);
      processed++;
    } catch (err) {
      console.error(`[expire-subscriptions] failed for ${company.id}`, err);
      errors++;
    }
  }

  return { processed, errors };
}