import { prisma } from "@/lib/prisma";

export async function expireSponsorships(): Promise<{ processed: number; errors: number }> {
  const now = new Date();
  let processed = 0;
  let errors = 0;

  const toExpire = await prisma.sponsoredRequest.findMany({
    where: { status: "APPROVED", expiresAt: { lt: now } },
    select: { id: true, productId: true },
  });

  for (const req of toExpire) {
    try {
      await prisma.$transaction(async (tx) => {
        const updated = await tx.sponsoredRequest.updateMany({
          where: { id: req.id, status: "APPROVED" },
          data: { status: "EXPIRED", expiredAt: now },
        });
        if (updated.count === 0) return;

        const stillActive = await tx.sponsoredRequest.findFirst({
          where: {
            productId: req.productId,
            status: "APPROVED",
            expiresAt: { gt: now },
            id: { not: req.id },
          },
        });
        
        if (!stillActive) {
          await tx.product.update({
            where: { id: req.productId },
            data: { sponsoredUntil: null, sponsoredAt: null },
          });
        }

        await tx.auditLog.create({
          data: {
            action: "sponsorship.expire",
            entity: "SponsoredRequest",
            entityId: req.id,
            metadata: { productId: req.productId },
          },
        });
      });
      processed++;
    } catch (err) {
      console.error(`[expire-sponsorships] failed for ${req.id}`, err);
      errors++;
    }
  }

  return { processed, errors };
}