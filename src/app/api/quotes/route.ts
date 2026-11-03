import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Harus login" }, { status: 401 });
  }

  const role = (session.user as any).role;
  const supplierCompanyId = (session.user as any).companyId;

  if (role === "ADMIN") {
    return NextResponse.json({ error: "Admin tidak bisa mengajukan penawaran." }, { status: 403 });
  }

  if (role !== "BUYER" && role !== "SUPPLIER") {
    return NextResponse.json({ error: "Hanya Buyer atau Supplier yang dapat mengirim penawaran." }, { status: 403 });
  }

  if (!supplierCompanyId) {
    return NextResponse.json({ error: "Akun belum terhubung dengan perusahaan." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.rfqId || !body?.unitPrice || !body?.deliveryDays) {
    return NextResponse.json({ error: "Input tidak valid" }, { status: 400 });
  }

  const unitPrice = Number(body.unitPrice);
  const deliveryDays = Number(body.deliveryDays);

  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    return NextResponse.json({ error: "Harga satuan tidak valid" }, { status: 400 });
  }
  if (!Number.isInteger(deliveryDays) || deliveryDays <= 0) {
    return NextResponse.json({ error: "Estimasi pengiriman tidak valid" }, { status: 400 });
  }

  const rfq = await prisma.rfq.findUnique({ where: { id: body.rfqId } });
  if (!rfq) {
    return NextResponse.json({ error: "RFQ tidak ditemukan" }, { status: 404 });
  }

  // Closed Bid: Tidak boleh quote RFQ sendiri
  if (rfq.buyerCompanyId === supplierCompanyId) {
    return NextResponse.json({ error: "Anda tidak dapat mengajukan penawaran untuk RFQ Anda sendiri." }, { status: 403 });
  }

  // Hanya bisa quote RFQ yang masih aktif
  if (!["OPEN", "QUOTING", "NEGOTIATING"].includes(rfq.status)) {
    return NextResponse.json({ error: `RFQ sudah ${rfq.status.toLowerCase()}, tidak bisa menerima penawaran baru.` }, { status: 409 });
  }

  // Cek duplikat
  const existing = await prisma.quote.findFirst({
    where: { rfqId: rfq.id, supplierCompanyId },
  });
  if (existing) {
    return NextResponse.json({ error: "Anda sudah pernah mengirim penawaran untuk RFQ ini." }, { status: 409 });
  }

  const quote = await prisma.quote.create({
    data: {
      rfqId: rfq.id,
      supplierCompanyId,
      createdById: (session.user as any).id,
      unitPrice,
      totalPrice: unitPrice * rfq.quantity,
      deliveryDays,
      validUntil: new Date(Date.now() + 7 * 86400000),
      notes: body.notes || null,
    },
  });

  if (rfq.status === "OPEN") {
    await prisma.rfq.update({
      where: { id: rfq.id },
      data: { status: "QUOTING" },
    });
  }

  await audit((session.user as any).id, "quote.create", "Quote", quote.id, {
    rfqId: rfq.id,
    unitPrice,
    role,
  });

  return NextResponse.json(quote);
}