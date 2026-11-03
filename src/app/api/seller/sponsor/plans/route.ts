import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SPONSOR_PLANS, MAX_ACTIVE_SPONSORSHIPS } from "@/lib/sponsorship/plans";
import { countActiveSponsorships } from "@/lib/sponsorship/queries";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "SUPPLIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const companyId = (session.user as any).companyId;
  if (!companyId) {
    return NextResponse.json({ error: "No company" }, { status: 400 });
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { plan: true },
  });

  const activeCount = await countActiveSponsorships(companyId);
  const plan = (company?.plan ?? "FREE") as keyof typeof MAX_ACTIVE_SPONSORSHIPS;
  const maxActive = MAX_ACTIVE_SPONSORSHIPS[plan];

  return NextResponse.json({
    plans: SPONSOR_PLANS,
    activeCount,
    maxActive,
    canSubmit: activeCount < maxActive,
  });
}