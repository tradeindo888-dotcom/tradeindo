import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "SUPPLIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const companyId = (session.user as any).companyId;
  if (!companyId) return NextResponse.json({ error: "No company" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);

  // 1. Ambil semua ID Admin untuk dikecualikan dari perhitungan
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  const adminIds = admins.map((a) => a.id);

  const requests = await prisma.sponsoredRequest.findMany({
    where: { companyId },
    include: {
      product: { 
        select: { 
          id: true, titleId: true, titleEn: true, slug: true,
          images: { take: 1, select: { url: true } } 
        } 
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const requestsWithMetrics = await Promise.all(
    requests.map(async (req) => {
      const start = req.approvedAt && req.approvedAt > startOfToday 
        ? req.approvedAt 
        : startOfToday;
      const end = new Date();

      // 2. Filter: userId BUKAN Admin (dan user tidak null)
      const baseWhere = {
        productId: req.productId,
        createdAt: { gte: start, lte: end },
        OR: [
          { userId: null }, // Pengunjung anonim (boleh dihitung)
          { userId: { notIn: adminIds } } // User login (kecuali Admin)
        ]
      };

      const [impressions, views, chats, clicks] = await Promise.all([
        prisma.productEvent.count({ where: { ...baseWhere, eventType: "IMPRESSION" } }),
        prisma.productEvent.count({ where: { ...baseWhere, eventType: "VIEW" } }),
        prisma.productEvent.count({ where: { ...baseWhere, eventType: "CHAT" } }),
        prisma.productEvent.count({ where: { ...baseWhere, eventType: "CLICK" } }),
      ]);

      return {
        ...req,
        metrics: { impressions, views, chats, clicks },
      };
    })
  );

  return NextResponse.json({ requests: requestsWithMetrics });
}