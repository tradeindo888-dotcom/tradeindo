import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canTransition } from "@/lib/sponsorship/status";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const form = await req.formData();
  const requestId = form.get("requestId");
  const action = form.get("action");
  const returnTo = String(form.get("returnTo") ?? "/id/admin");
  const rejectedReason = String(form.get("rejectedReason") ?? "");

  if (typeof requestId !== "string" || !requestId) {
    return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
  }
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (!returnTo.startsWith("/")) {
    return NextResponse.json({ error: "Invalid returnTo" }, { status: 400 });
  }

  const request = await prisma.sponsoredRequest.findUnique({
    where: { id: requestId },
  });
  
  if (!request) {
    return NextResponse.redirect(new URL(returnTo, req.url), { status: 303 });
  }

  const adminId = (session.user as any).id;
  const now = new Date();

  if (action === "approve") {
    if (!canTransition(request.status, "APPROVED")) {
      return NextResponse.redirect(new URL(returnTo, req.url), { status: 303 });
    }

    // Cek apakah produk saat ini sedang disponsori (untuk perpanjangan/extend)
    const product = await prisma.product.findUnique({
      where: { id: request.productId },
      select: { sponsoredUntil: true },
    });
    
    // Jika masih aktif, tambah durasi dari tanggal expired lama. Jika tidak, mulai dari sekarang.
    const base = product?.sponsoredUntil && product.sponsoredUntil > now
      ? product.sponsoredUntil
      : now;
    const expiresAt = new Date(base.getTime() + request.durationDays * 86400000);

    // Jalankan transaksi: Update Request, Update Product, dan Catat Audit Log
    const [updated] = await prisma.$transaction([
      prisma.sponsoredRequest.updateMany({
        where: { id: requestId, status: "PENDING" },
        data: {
          status: "APPROVED",
          approvedAt: now,
          approvedById: adminId,
          expiresAt,
        },
      }),
      prisma.product.update({
        where: { id: request.productId },
        data: { 
          sponsoredAt: now, 
          sponsoredUntil: expiresAt 
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: "sponsorship.approve",
          entity: "SponsoredRequest",
          entityId: requestId,
          metadata: {
            productId: request.productId,
            tier: request.tier,
            durationDays: request.durationDays,
            price: request.price,
            expiresAt: expiresAt.toISOString(),
          },
        },
      }),
    ]);

    // Jika updated.count === 0, berarti admin lain sudah memproses request ini duluan
    if (updated.count === 0) {
      return NextResponse.redirect(new URL(returnTo, req.url), { status: 303 });
    }
  } else {
    if (!canTransition(request.status, "REJECTED")) {
      return NextResponse.redirect(new URL(returnTo, req.url), { status: 303 });
    }
    
    await prisma.$transaction([
      prisma.sponsoredRequest.updateMany({
        where: { id: requestId, status: "PENDING" },
        data: {
          status: "REJECTED",
          rejectedAt: now,
          rejectedById: adminId,
          rejectedReason: rejectedReason || null,
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: "sponsorship.reject",
          entity: "SponsoredRequest",
          entityId: requestId,
          metadata: { 
            productId: request.productId, 
            reason: rejectedReason || null 
          },
        },
      }),
    ]);
  }

  // Redirect kembali ke halaman admin setelah selesai
  return NextResponse.redirect(new URL(returnTo, req.url), { status: 303 });
}