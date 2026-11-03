import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companyId = (session.user as any).companyId;
  if (!companyId) return NextResponse.json({ error: "No company" }, { status: 400 });

  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { 
        id: true,
        name: true,
        verificationStatus: true,
      }
    });
    return NextResponse.json(company);
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}