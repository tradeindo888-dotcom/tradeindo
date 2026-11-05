import { prisma } from "@/lib/prisma";

export async function enforceProductLimits(): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;
  const now = new Date();

  // Cari company dengan paket FREE
  const freeCompanies = await prisma.company.findMany({
    where: { plan: "FREE" },
  });

  for (const company of freeCompanies) {
    try {
      // Ambil semua produk ACTIVE
      const activeProducts = await prisma.product.findMany({
        where: { companyId: company.id, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      });

      const FREE_LIMIT = 10;
      
      // Pisahkan yang masih ber-sponsor dan yang organic
      const sponsoredProducts = activeProducts.filter(p => p.sponsoredUntil && p.sponsoredUntil > now);
      const organicProducts = activeProducts.filter(p => !p.sponsoredUntil || p.sponsoredUntil <= now);

      const productsToHide: string[] = [];

      if (activeProducts.length > FREE_LIMIT) {
        // Slot untuk produk organic = 10 dikurangi jumlah produk sponsor yang masih aktif
        const slotsLeftForOrganic = Math.max(0, FREE_LIMIT - sponsoredProducts.length);
        
        if (organicProducts.length > slotsLeftForOrganic) {
          const hideList = organicProducts.slice(slotsLeftForOrganic).map(p => p.id);
          productsToHide.push(...hideList);
        }
      }

      if (productsToHide.length > 0) {
        await prisma.product.updateMany({
          where: { id: { in: productsToHide } },
          data: { status: "HIDDEN" },
        });

        await prisma.auditLog.create({
          data: {
            action: "product.enforce_limit",
            entity: "Company",
            entityId: company.id,
            metadata: { hiddenCount: productsToHide.length, reason: "Exceeded FREE plan limit" },
          },
        });
      }
      processed++;
    } catch (err) {
      console.error(`[enforce-product-limits] failed for ${company.id}`, err);
      errors++;
    }
  }

  return { processed, errors };
}