import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canTransition } from "@/lib/sponsorship/status";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "SUPPLIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const companyId = (session.user as any).companyId;

  const request = await prisma.sponsoredRequest.findFirst({
    where: { id, companyId },
  });
  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!canTransition(request.status, "CANCELLED")) {
    return NextResponse.json({
      error: `Tidak dapat membatalkan request berstatus ${request.status}.`,
    }, { status: 409 });
  }

  await prisma.sponsoredRequest.update({
    where: { id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  return NextResponse.json({ success: true });
}