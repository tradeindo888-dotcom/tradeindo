import { prisma } from "@/lib/prisma";

export async function deactivateExpiredBanners(): Promise<{ deactivated: number }> {
  const now = new Date();
  
  try {
    const result = await prisma.banner.updateMany({
      where: {
        endDate: { lt: now }, // Tanggal berakhir sudah lewat
        isActive: true        // Dan statusnya masih tayang
      },
      data: {
        isActive: false       // Matikan
      }
    });

    if (result.count > 0) {
      console.log(`[deactivateExpiredBanners] Mematikan ${result.count} banner yang sudah kedaluwarsa.`);
    }

    return { deactivated: result.count };
  } catch (error) {
    console.error("[deactivateExpiredBanners] Gagal:", error);
    return { deactivated: 0 };
  }
}