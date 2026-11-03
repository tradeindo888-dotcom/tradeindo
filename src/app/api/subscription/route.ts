import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "SUPPLIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { plan, paymentProofUrl } = body;
  const companyId = (session.user as any).companyId;

  if (!["FREE", "PRO", "PREMIUM"].includes(plan)) {
    return NextResponse.json({ error: "Plan tidak valid" }, { status: 400 });
  }

  const existingRequest = await prisma.subscriptionRequest.findFirst({
    where: { companyId, status: "PENDING" }
  });

  if (existingRequest) {
    return NextResponse.json({ error: "Anda sudah memiliki pengajuan yang menunggu verifikasi admin." }, { status: 400 });
  }

  await prisma.subscriptionRequest.create({
    data: {
      companyId,
      requestedPlan: plan,
      paymentProofUrl: paymentProofUrl || null,
      status: "PENDING"
    }
  });

  return NextResponse.json({ success: true, message: "Pengajuan berhasil dibuat" });
}