import { prisma } from "@/lib/prisma";

export async function cancelPendingSponsorships(): Promise<{ cancelled: number; errors: number }> {
  const now = new Date();
  // Batas waktu: 3 hari yang lalu (72 jam)
  const cutoffDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  let cancelled = 0;
  let errors = 0;

  try {
    // 1. Cari semua pengajuan PENDING yang umurnya lebih dari 3 hari
    const pendingRequests = await prisma.sponsoredRequest.findMany({
      where: {
        status: "PENDING",
        createdAt: { lt: cutoffDate },
      },
      select: { id: true, productId: true, companyId: true },
    });

    if (pendingRequests.length === 0) return { cancelled: 0, errors: 0 };

    // 2. Batalkan semuanya dalam satu transaksi
    const idsToCancel = pendingRequests.map((req) => req.id);

    await prisma.$transaction(async (tx) => {
      // Update status menjadi CANCELLED
      await tx.sponsoredRequest.updateMany({
        where: { id: { in: idsToCancel } },
        data: { 
          status: "CANCELLED", 
          cancelledAt: now,
          rejectedReason: "Auto-cancelled: No payment received within 3 days"
        },
      });

      // Catat di Audit Log untuk setiap pembatalan
      for (const req of pendingRequests) {
        await tx.auditLog.create({
          data: {
            action: "sponsorship.auto_cancel",
            entity: "SponsoredRequest",
            entityId: req.id,
            metadata: { reason: "Expired pending status (>3 days)" },
          },
        });
      }
    });

    cancelled = pendingRequests.length;
    return { cancelled, errors };
  } catch (error) {
    console.error("[cancel-pending-sponsorships] failed", error);
    return { cancelled, errors: 1 };
  }
}