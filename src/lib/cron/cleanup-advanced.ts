import { prisma } from "@/lib/prisma";

export async function cleanupOldAuditLogs() {
  // Hapus log yang umurnya lebih dari 180 hari (6 bulan)
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const deleted = await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: sixMonthsAgo } },
  });
  return { deletedAuditLogs: deleted.count };
}

export async function cleanupAbandonedDrafts() {
  // Hapus produk DRAFT yang dibuat lebih dari 60 hari lalu (2 bulan)
  const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const deleted = await prisma.product.deleteMany({
    where: {
      status: "DRAFT",
      createdAt: { lt: twoMonthsAgo },
    },
  });
  return { deletedDrafts: deleted.count };
}

export async function cleanupDeletedMessages() {
  // Hard delete pesan yang sudah di-soft-delete lebih dari 30 hari
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const deleted = await prisma.message.deleteMany({
    where: {
      deletedAt: { not: null, lt: thirtyDaysAgo },
    },
  });
  return { deletedMessages: deleted.count };
}

export async function cleanupOldResolvedReports() {
  // Hapus laporan konsumen yang sudah selesai/ditolak lebih dari 1 tahun
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const deleted = await prisma.consumerReport.deleteMany({
    where: {
      status: { in: ["RESOLVED", "REJECTED"] },
      createdAt: { lt: oneYearAgo },
    },
  });
  return { deletedReports: deleted.count };
}

export async function cleanupOldRequests() {
  // Hapus riwayat pengajuan langganan & verifikasi yang sudah diproses > 1 tahun
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  
  const subDeleted = await prisma.subscriptionRequest.deleteMany({
    where: {
      status: { in: ["APPROVED", "REJECTED"] },
      createdAt: { lt: oneYearAgo },
    },
  });

  const verDeleted = await prisma.verificationRequest.deleteMany({
    where: {
      status: { in: ["VERIFIED", "REJECTED"] },
      createdAt: { lt: oneYearAgo },
    },
  });

  return { deletedSubRequests: subDeleted.count, deletedVerRequests: verDeleted.count };
}

export async function cleanupOldRfqs() {
  // Hapus RFQ (dan Quote di dalamnya) yang sudah ditutup > 6 bulan
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const deleted = await prisma.rfq.deleteMany({
    where: {
      status: { in: ["CLOSED", "CANCELLED"] },
      closedAt: { lt: sixMonthsAgo },
    },
  });
  return { deletedRfqs: deleted.count };
}