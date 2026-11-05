import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLES = ["BUYER", "SUPPLIER"] as const;
const ALLOWED_COMPANY_TYPES = [
  "BUYER",
  "SERVICE_PROVIDER",
  "MANUFACTURER",
  "DISTRIBUTOR",
  "EXPORTER",
  "INDUSTRY",
] as const;
type CompanyTypeValue = (typeof ALLOWED_COMPANY_TYPES)[number];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (
      !body?.email ||
      !body?.password ||
      !body?.name ||
      !body?.role ||
      !body?.companyName
    ) {
      return NextResponse.json(
        { error: "Data tidak lengkap." },
        { status: 400 }
      );
    }

    const email = String(body.email).trim().toLowerCase();
    const password = String(body.password);

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.includes(body.role)) {
      return NextResponse.json(
        { error: "Role tidak valid." },
        { status: 400 }
      );
    }

    const fallbackType: CompanyTypeValue =
      body.role === "BUYER" ? "BUYER" : "MANUFACTURER";

    const requestedType: CompanyTypeValue = ALLOWED_COMPANY_TYPES.includes(
      body.companyType
    )
      ? (body.companyType as CompanyTypeValue)
      : fallbackType;

    const companyType: CompanyTypeValue =
      body.role === "BUYER" ? "BUYER" : requestedType;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "Email sudah terdaftar." },
        { status: 409 }
      );
    }

    let slug = slugify(body.companyName);
    if (!slug) slug = `company-${Date.now().toString(36)}`;
    const dup = await prisma.company.findUnique({ where: { slug } });
    if (dup) slug = `${slug}-${Date.now().toString(36)}`;

    const yearEstablished =
      body.yearEstablished === "" || body.yearEstablished == null
        ? null
        : Number.isFinite(Number(body.yearEstablished))
          ? Number(body.yearEstablished)
          : null;

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: body.companyName,
          slug,
          type: companyType,
          plan: "FREE",
          logoUrl: body.logoUrl || null,
          description: body.description || null,
          yearEstablished,
          website: body.website || null,
          city: body.city || null,
          province: body.province || null,
          address: body.address || null,
          phone: body.phone || null,
          exportCapability: Boolean(body.exportCapability),
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          name: body.name,
          role: body.role,
          companyId: company.id,
          passwordHash: await bcrypt.hash(password, 10),
          emailVerifiedAt: new Date(),
          verifyToken: null,
          verifyTokenExpires: null,
        },
      });

      return { company, user };
    });

    return NextResponse.json({
      ok: true,
      message: "Pendaftaran berhasil. Silakan login.",
    });
  } catch (error: any) {
    console.error("Register error:", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Email atau slug sudah dipakai. Coba lagi." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem saat mendaftar." },
      { status: 500 }
    );
  }
}