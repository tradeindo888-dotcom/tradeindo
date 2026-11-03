import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "BUYER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const companyId = (session.user as any).companyId;

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  // Hanya ambil RFQ milik perusahaan ini
  const rfqs = await prisma.rfq.findMany({
    where: { buyerCompanyId: companyId },
    include: { _count: { select: { quotes: true } } },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ company, rfqs });
}