import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let companyId = (session.user as any).companyId;
  const role = (session.user as any).role;

  // Jika Admin, cari ID Company "Admin Trade Indo"
  if (role === "ADMIN") {
    const adminCompany = await prisma.company.findFirst({ where: { slug: "tradeindo-admin" } });
    if (adminCompany) {
      companyId = adminCompany.id;
    } else {
      return NextResponse.json([]); // Jika belum ada chat sama sekali
    }
  }

  if (!companyId) return NextResponse.json({ error: "No company" }, { status: 403 });

  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { buyerCompanyId: companyId },
          { supplierCompanyId: companyId },
        ],
      },
      include: {
        buyerCompany: { select: { name: true } },
        supplierCompany: { select: { name: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("GET /api/conversations error:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}