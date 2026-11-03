import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { requestId, action } = body; // action: "approve" | "reject"

  const request = await prisma.subscriptionRequest.findUnique({
    where: { id: requestId }
  });

  if (!request || request.status !== "PENDING") {
    return NextResponse.json({ error: "Request tidak valid" }, { status: 400 });
  }

  if (action === "approve") {
    // 1. Update status request
    await prisma.subscriptionRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" }
    });
    // 2. Update plan perusahaan
    await prisma.company.update({
      where: { id: request.companyId },
      data: { plan: request.requestedPlan as any }
    });
  } else {
    await prisma.subscriptionRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" }
    });
  }

  return NextResponse.json({ success: true });
}