import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str.replace(/"/g, '""')}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "SUPPLIER") {
    return new Response("Unauthorized", { status: 401 });
  }

  const companyId = (session.user as any).companyId;
  if (!companyId) return new Response("No company", { status: 400 });

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const myProducts = await prisma.product.findMany({
      where: { companyId },
      select: { id: true },
    });
    const productIds = myProducts.map((p) => p.id);

    const events = await prisma.productEvent.findMany({
      where: {
        OR: [
          { productId: { in: productIds } },
          { supplierCompanyId: companyId, eventType: "PROFILE_VIEW" },
        ],
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = ["Tanggal", "Tipe Event", "Sumber", "Product ID"];
    const rows = events.map((e) => [
      sanitizeCsvCell(e.createdAt.toISOString()),
      sanitizeCsvCell(e.eventType),
      sanitizeCsvCell(e.source || "-"),
      sanitizeCsvCell(e.productId || "-"),
    ]);

    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    return new Response("\uFEFF" + csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="analytics-30-days-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export CSV error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}