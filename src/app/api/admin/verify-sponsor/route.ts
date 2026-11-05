import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canTransition } from "@/lib/sponsorship/status";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { requestId, action, rejectedReason } = body;

    if (!requestId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const request = await prisma.sponsoredRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json({ error: "Request tidak ditemukan" }, { status: 404 });
    }

    const adminId = (session.user as any).id;
    const now = new Date();

    if (action === "approve") {
      if (!canTransition(request.status, "APPROVED")) {
        return NextResponse.json({ error: "Status tidak valid" }, { status: 409 });
      }

      const product = await prisma.product.findUnique({
        where: { id: request.productId },
        select: { sponsoredUntil: true },
      });

      const base = product?.sponsoredUntil && product.sponsoredUntil > now
        ? product.sponsoredUntil
        : now;
      const expiresAt = new Date(base.getTime() + request.durationDays * 86400000);

      const [updated] = await prisma.$transaction([
        prisma.sponsoredRequest.updateMany({
          where: { id: requestId, status: "PENDING" },
          data: { status: "APPROVED", approvedAt: now, approvedById: adminId, expiresAt },
        }),
        prisma.product.update({
          where: { id: request.productId },
          data: { 
            sponsoredAt: now, 
            sponsoredUntil: expiresAt,
            status: "ACTIVE" // <-- PERBAIKAN: Paksa produk tayang karena sudah dibayar
          },
        }),
        prisma.auditLog.create({
          data: {
            actorId: adminId,
            action: "sponsorship.approve",
            entity: "SponsoredRequest",
            entityId: requestId,
            metadata: { productId: request.productId, tier: request.tier, durationDays: request.durationDays, price: request.price, expiresAt: expiresAt.toISOString() },
          },
        }),
      ]);

      if (updated.count === 0) {
        return NextResponse.json({ error: "Request sudah diproses" }, { status: 409 });
      }

      return NextResponse.json({ success: true });
    } else {
      // Logika REJECT
      if (!canTransition(request.status, "REJECTED")) {
        return NextResponse.json({ error: "Status tidak valid" }, { status: 409 });
      }

      await prisma.$transaction([
        prisma.sponsoredRequest.updateMany({
          where: { id: requestId, status: "PENDING" },
          data: { status: "REJECTED", rejectedAt: now, rejectedById: adminId, rejectedReason: rejectedReason || null },
        }),
        prisma.auditLog.create({
          data: {
            actorId: adminId,
            action: "sponsorship.reject",
            entity: "SponsoredRequest",
            entityId: requestId,
            metadata: { productId: request.productId, reason: rejectedReason || null },
          },
        }),
      ]);

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("verify-sponsor error:", error);
    return NextResponse.json({ error: "Gagal memproses" }, { status: 500 });
  }
}