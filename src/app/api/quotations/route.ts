import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Harus login" }, { status: 401 });
  if ((session.user as any).role !== "SUPPLIER") return NextResponse.json({ error: "Hanya Supplier yang dapat mengirim quotation" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body?.rfqId || !body?.unitPrice || !body?.deliveryDays) {
    return NextResponse.json({ error: "Input tidak valid" }, { status: 400 });
  }

  const rfq = await prisma.rfq.findUnique({ where: { id: body.rfqId } });
  if (!rfq) return NextResponse.json({ error: "RFQ tidak ditemukan" }, { status: 404 });

  const quote = await prisma.quote.create({
    data: {
      rfqId: rfq.id,
      supplierCompanyId: (session.user as any).companyId,
      createdById: (session.user as any).id,
      unitPrice: Number(body.unitPrice),
      totalPrice: Number(body.unitPrice) * rfq.quantity,
      deliveryDays: Number(body.deliveryDays),
      validUntil: new Date(Date.now() + 7 * 86400000), // 7 hari dari sekarang
      notes: body.notes || null,
    },
  });

  // Ubah status RFQ menjadi QUOTING
  await prisma.rfq.update({ where: { id: rfq.id }, data: { status: "QUOTING" } });

  return NextResponse.json(quote);
}