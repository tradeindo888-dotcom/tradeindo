import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_COMPANY_TYPES = [
  "BUYER",
  "SERVICE_PROVIDER",
  "MANUFACTURER",
  "DISTRIBUTOR",
  "EXPORTER",
  "INDUSTRY",
] as const;

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

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  // Validasi tipe bisnis (jika dikirim)
  if (
    body.type !== undefined &&
    !ALLOWED_COMPANY_TYPES.includes(body.type)
  ) {
    return NextResponse.json(
      { error: "Tipe bisnis tidak valid." },
      { status: 400 }
    );
  }

  // Validasi yearEstablished agar tidak jadi NaN
  const yearEstablished =
    body.yearEstablished === "" || body.yearEstablished == null
      ? null
      : Number.isFinite(Number(body.yearEstablished))
        ? Number(body.yearEstablished)
        : null;

  try {
    const updated = await prisma.company.update({
      where: { id: (session.user as any).companyId },
      data: {
        name: body.name,
        type: body.type,
        description: body.description,
        city: body.city,
        province: body.province,
        website: body.website,
        address: body.address,
        phone: body.phone,
        yearEstablished,
        exportCapability: body.exportCapability,
        logoUrl: body.logoUrl,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Update profile error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Slug perusahaan sudah dipakai." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Gagal menyimpan perubahan." },
      { status: 500 }
    );
  }
}