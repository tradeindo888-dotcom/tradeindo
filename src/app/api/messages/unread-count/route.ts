import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ count: 0 });

  let companyId = (session.user as any).companyId;
  const role = (session.user as any).role;

  if (role === "ADMIN") {
    const adminCompany = await prisma.company.findFirst({ where: { slug: "tradeindo-admin" } });
    if (!adminCompany) return NextResponse.json({ count: 0 });
    companyId = adminCompany.id;
  }

  if (!companyId) return NextResponse.json({ count: 0 });

  try {
    const count = await prisma.message.count({
      where: {
        isRead: false,
        senderId: { not: (session.user as any).id },
        conversation: {
          OR: [
            { buyerCompanyId: companyId },
            { supplierCompanyId: companyId },
          ],
        },
      },
    });
    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json({ count: 0 });
  }
}