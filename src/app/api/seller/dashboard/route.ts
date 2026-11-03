import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // <-- TAMBAHKAN INI

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "SUPPLIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const companyId = (session.user as any).companyId;
  const now = new Date();

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  const products = await prisma.product.findMany({
    where: { companyId },
    include: { 
      images: true,
      sponsoredRequests: {
        where: { status: "APPROVED", expiresAt: { gt: now } },
        select: { tier: true, expiresAt: true },
        orderBy: { approvedAt: "desc" },
        take: 1,
      }
    },
    orderBy: { createdAt: "desc" },
  });

  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const expiringSponsorships = products.filter((p) => {
    const activeSponsor = p.sponsoredRequests[0];
    if (!activeSponsor || !activeSponsor.expiresAt) return false;
    return activeSponsor.expiresAt <= threeDaysFromNow;
  }).map(p => ({
    id: p.id,
    title: p.titleId,
    expiresAt: p.sponsoredRequests[0].expiresAt,
  }));

  return NextResponse.json({ 
    company, 
    products, 
    expiringSponsorships 
  });
}