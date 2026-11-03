import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== "SUPPLIER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const companyId = (session.user as any).companyId;
    const body = await req.json();

    const product = await prisma.product.findFirst({ where: { id, companyId } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    let discountUntil = null;
    if (body.durationDays && body.durationDays > 0) {
      discountUntil = new Date();
      discountUntil.setDate(discountUntil.getDate() + body.durationDays);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        discountLabel: body.discountLabel || null,
        discountUntil: body.discountLabel ? discountUntil : null,
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error("DISCOUNT ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}