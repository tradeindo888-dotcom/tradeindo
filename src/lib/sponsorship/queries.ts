import { prisma } from "@/lib/prisma";

export async function countActiveSponsorships(companyId: string): Promise<number> {
  return prisma.sponsoredRequest.count({
    where: {
      companyId,
      status: "APPROVED",
      expiresAt: { gt: new Date() },
    },
  });
}

export async function findActiveSponsorshipForProduct(productId: string) {
  return prisma.sponsoredRequest.findFirst({
    where: {
      productId,
      status: "APPROVED",
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: "desc" },
  });
}