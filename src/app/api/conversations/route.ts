import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json([]);

    const companyId = (session.user as any).companyId;
    const role = (session.user as any).role;

    // JIKA ADMIN ATAU TIDAK PUNYA COMPANY ID, KEMBALIKAN ARRAY KOSONG
    if (!companyId || role === "ADMIN") {
      return NextResponse.json([]);
    }

    // CARI SEMUA PERCAKAPAN DIMANA PERUSAHAAN INI TERLIBAT (BAIK SEBAGAI BUYER MAUPUN SUPPLIER)
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { buyerCompanyId: companyId },
          { supplierCompanyId: companyId },
        ],
      },
      include: {
        buyerCompany: { select: { id: true, name: true } },
        supplierCompany: { select: { id: true, name: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("GET /api/conversations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}