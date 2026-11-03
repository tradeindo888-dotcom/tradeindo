import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userCompanyId = (session.user as any).companyId;
  const role = (session.user as any).role;

  if (!userCompanyId && role !== "ADMIN") {
    return NextResponse.json({ error: "No company" }, { status: 403 });
  }

  const rfq = await prisma.rfq.findUnique({
    where: { id },
    include: {
      buyerCompany: {
        select: {
          id: true, name: true, slug: true, city: true, province: true,
          logoUrl: true, verificationStatus: true,
        },
      },
      images: { take: 20 },
      _count: { select: { quotes: true } },
    },
  });

  if (!rfq) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = rfq.buyerCompanyId === userCompanyId;
  const isAdmin = role === "ADMIN";

  // Cek apakah user pernah submit quote ke RFQ ini
  const myQuote = userCompanyId
    ? await prisma.quote.findFirst({
        where: { rfqId: id, supplierCompanyId: userCompanyId },
        select: { id: true },
      })
    : null;

  const isParticipant = !!myQuote;

  // Hitung apakah sudah lewat 3 hari sejak RFQ ditutup
  const now = new Date();
  const threeDaysAfterClose = rfq.closedAt
    ? new Date(new Date(rfq.closedAt).getTime() + 3 * 86400000)
    : null;
  const isArchived = threeDaysAfterClose ? threeDaysAfterClose < now : false;

  const quoteInclude = {
    supplierCompany: {
      select: {
        id: true, name: true, slug: true, city: true, province: true,
        logoUrl: true, verificationStatus: true,
      },
    },
    createdBy: { select: { id: true, name: true } },
  };

  // ============================================================
  // SKENARIO 1: OWNER & ADMIN — Selalu bisa lihat semua
  // ============================================================
  if (isOwner || isAdmin) {
    const quotes = await prisma.quote.findMany({
      where: { rfqId: id },
      include: quoteInclude,
      orderBy: [
        { status: "asc" }, // ACCEPTED dulu
        { createdAt: "asc" },
      ],
      take: 100,
    });

    return NextResponse.json({
      ...rfq,
      quotes,
      meta: { isArchived, isTransparent: false, canSeeAll: true },
    });
  }

  // ============================================================
  // SKENARIO 2: BUKAN PESERTA, RFQ AKTIF — Tidak lihat apapun
  // ============================================================
  if (!isParticipant && ["OPEN", "QUOTING", "NEGOTIATING"].includes(rfq.status)) {
    return NextResponse.json({
      ...rfq,
      quotes: undefined,
      _count: rfq._count,
      meta: { isArchived: false, isTransparent: false, canSeeAll: false },
    });
  }

  // ============================================================
  // SKENARIO 3: PESERTA, RFQ AKTIF — Hanya lihat quote sendiri
  // ============================================================
  if (isParticipant && ["OPEN", "QUOTING", "NEGOTIATING"].includes(rfq.status)) {
    const myQuotes = await prisma.quote.findMany({
      where: { rfqId: id, supplierCompanyId: userCompanyId! },
      include: quoteInclude,
    });

    return NextResponse.json({
      ...rfq,
      quotes: myQuotes,
      _count: rfq._count,
      meta: { isArchived: false, isTransparent: false, canSeeAll: false },
    });
  }

  // ============================================================
  // SKENARIO 4: RFQ CLOSED > 3 HARI — Arsip (peserta hanya lihat sendiri)
  // ============================================================
  if (isArchived) {
    if (isParticipant) {
      const myQuotes = await prisma.quote.findMany({
        where: { rfqId: id, supplierCompanyId: userCompanyId! },
        include: quoteInclude,
      });
      return NextResponse.json({
        ...rfq,
        quotes: myQuotes,
        _count: rfq._count,
        meta: { isArchived: true, isTransparent: false, canSeeAll: false },
      });
    }
    return NextResponse.json({
      ...rfq,
      quotes: undefined,
      _count: rfq._count,
      meta: { isArchived: true, isTransparent: false, canSeeAll: false },
    });
  }

  // ============================================================
  // SKENARIO 5: RFQ CLOSED < 3 HARI — TRANSPARAN untuk semua peserta
  // ============================================================
  if (isParticipant) {
    const allQuotes = await prisma.quote.findMany({
      where: { rfqId: id },
      include: quoteInclude,
      orderBy: [
        { status: "asc" },
        { createdAt: "asc" },
      ],
      take: 100,
    });

    return NextResponse.json({
      ...rfq,
      quotes: allQuotes,
      _count: rfq._count,
      meta: { isArchived: false, isTransparent: true, canSeeAll: false },
    });
  }

  // Non-peserta, closed < 3 hari: tetap tertutup
  return NextResponse.json({
    ...rfq,
    quotes: undefined,
    _count: rfq._count,
    meta: { isArchived: false, isTransparent: false, canSeeAll: false },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { status } = body;

  if (!["CLOSED", "CANCELLED"].includes(status)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const rfq = await prisma.rfq.findUnique({ where: { id } });
  if (!rfq) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userCompanyId = (session.user as any).companyId;
  const isOwner = rfq.buyerCompanyId === userCompanyId;
  const isAdmin = (session.user as any).role === "ADMIN";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!["OPEN", "QUOTING"].includes(rfq.status)) {
    return NextResponse.json({ error: "RFQ sudah ditutup" }, { status: 409 });
  }

  const updated = await prisma.rfq.update({
    where: { id },
    data: { status, closedAt: new Date() },
  });

  await audit((session.user as any).id, "rfq.close", "Rfq", id, {
    status,
    closedBy: isAdmin ? "admin" : "owner",
  });

  return NextResponse.json(updated);
}