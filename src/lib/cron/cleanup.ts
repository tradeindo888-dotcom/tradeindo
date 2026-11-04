import { prisma } from "@/lib/prisma";

export async function cleanupUnverifiedUsers() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 hari
  const deleted = await prisma.user.deleteMany({
    where: {
      emailVerifiedAt: null,
      createdAt: { lt: cutoff },
    },
  });
  return { deletedUnverifiedUsers: deleted.count };
}

export async function cleanupOldAnalytics() {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 hari
  const deleted = await prisma.productEvent.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return { deletedAnalytics: deleted.count };
}