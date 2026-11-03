import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "SUPPLIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const company = await prisma.company.findUnique({
    where: { id: (session.user as any).companyId },
  });
  return NextResponse.json(company);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "SUPPLIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  
  const updated = await prisma.company.update({
    where: { id: (session.user as any).companyId },
    data: {
      name: body.name,
      description: body.description,
      city: body.city,
      province: body.province,
      website: body.website,
      address: body.address,
      phone: body.phone,
      yearEstablished: body.yearEstablished,
      exportCapability: body.exportCapability,
      logoUrl: body.logoUrl,
    },
  });

  return NextResponse.json(updated);
}