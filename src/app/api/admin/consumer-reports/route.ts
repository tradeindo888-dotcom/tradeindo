import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { name, email, category, subject, message } = body;

    if (!name || !email || !category || !subject || !message) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    if (!["PENGGUNAAN", "PELANGGARAN"].includes(category)) {
      return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 });
    }

    // @ts-ignore
    const report = await prisma.consumerReport.create({
      data: { userId: (session?.user as any)?.id || null, name, email, category, subject, message },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("POST Report Error:", error);
    return NextResponse.json({ error: "Gagal mengirim laporan" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // @ts-ignore
  const reports = await prisma.consumerReport.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(reports);
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, adminReply } = body;

    if (!id || !["RESOLVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    // Update database saja (TANPA KIRIM EMAIL)
    // @ts-ignore
    await prisma.consumerReport.update({
      where: { id },
      data: { status, adminReply },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Report Error:", error);
    return NextResponse.json({ error: "Gagal update status laporan" }, { status: 500 });
  }
}