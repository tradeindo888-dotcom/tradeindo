import { prisma } from "@/lib/prisma";

export async function enforceProductLimits(): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  // 1. Cari semua company dengan paket FREE
  const freeCompanies = await prisma.company.findMany({
    where: { plan: "FREE" },
  });

  for (const company of freeCompanies) {
    try {
      // 2. Hitung produk ACTIVE mereka
      const activeProducts = await prisma.product.findMany({
        where: { companyId: company.id, status: "ACTIVE" },
        orderBy: { createdAt: "desc" }, // Prioritas: Yang terbaru tetap ACTIVE
      });

      const limit = 10;

      // 3. Jika melebihi batas, sembunyikan sisanya
      if (activeProducts.length > limit) {
        const productsToHide = activeProducts.slice(limit).map((p) => p.id);

        await prisma.product.updateMany({
          where: { id: { in: productsToHide } },
          data: { status: "HIDDEN" },
        });

        // Catat di Audit Log
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