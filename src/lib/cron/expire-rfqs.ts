import { prisma } from "@/lib/prisma";

export async function expireRfqs(): Promise<{ closed: number }> {
  const now = new Date();

  try {
    const result = await prisma.rfq.updateMany({
      where: {
        status: { in: ["OPEN", "QUOTING"] },
        deadlineAt: { lt: now },
      },
      data: {
        status: "CLOSED",
        closedAt: now,
      },
    });

    console.log(`[expireRfqs] ${result.count} RFQ auto-closed.`);
    return { closed: result.count };
  } catch (error) {
    console.error("[expireRfqs] Gagal:", error);
    return { closed: 0 };
  }
}