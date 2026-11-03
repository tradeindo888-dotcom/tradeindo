import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const requests = await prisma.sponsoredRequest.findMany({
    include: {
      company: { select: { name: true } },
      product: { select: { titleId: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Membuat format CSV
  const headers = ["ID", "Tanggal", "Perusahaan", "Produk", "Durasi (Hari)", "Total Bayar (Rp)", "Status", "Berakhir Pada"];
  const rows = requests.map((r) => [
    r.id,
    new Date(r.createdAt).toISOString().split("T")[0],
    `"${r.company.name}"`,
    `"${r.product.titleId}"`,
    r.durationDays,
    r.price,
    r.status,
    r.expiresAt ? new Date(r.expiresAt).toISOString().split("T")[0] : "-",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return new Response(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-sponsor-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}