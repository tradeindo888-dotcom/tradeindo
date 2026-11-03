import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Sanitasi nilai untuk CSV — cegah CSV Injection
function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Kalau dimulai dengan karakter yang bisa memicu formula di Excel, prefix dengan '
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str.replace(/"/g, '""')}`;
  }
  // Escape double quotes
  return `"${str.replace(/"/g, '""')}"`;
}

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

  const headers = [
    "ID",
    "Tanggal",
    "Perusahaan",
    "Produk",
    "Durasi (Hari)",
    "Total Bayar (Rp)",
    "Status",
    "Berakhir Pada",
  ];

  const rows = requests.map((r) => [
    sanitizeCsvCell(r.id),
    sanitizeCsvCell(new Date(r.createdAt).toISOString().split("T")[0]),
    sanitizeCsvCell(r.company.name),
    sanitizeCsvCell(r.product.titleId),
    sanitizeCsvCell(r.durationDays),
    sanitizeCsvCell(r.price),
    sanitizeCsvCell(r.status),
    sanitizeCsvCell(r.expiresAt ? new Date(r.expiresAt).toISOString().split("T")[0] : "-"),
  ]);

  const csvContent = [
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return new Response("\uFEFF" + csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-sponsor-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}