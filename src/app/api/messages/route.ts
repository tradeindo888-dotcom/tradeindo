import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("id");

    if (!conversationId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    let companyId = (session.user as any).companyId;
    const role = (session.user as any).role;

    if (role === "ADMIN") {
      const adminCompany = await prisma.company.findFirst({ where: { slug: "tradeindo-admin" } });
      if (adminCompany) companyId = adminCompany.id;
    }

    if (!companyId) return NextResponse.json({ error: "No company" }, { status: 403 });

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { buyerCompanyId: companyId },
          { supplierCompanyId: companyId },
        ],
      },
    });

    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    // TANDAI PESAN SEBAGAI SUDAH DIBACA (HANYA PESAN ORANG LAIN)
    await prisma.message.updateMany({
      where: { 
        conversationId, 
        senderId: { not: (session.user as any).id },
        isRead: false 
      },
      data: { isRead: true },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json({ error: "Gagal mengambil pesan" }, { status: 500 });
  }
}

// Fungsi POST tetap sama
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const conversationId = body.conversationId;
    
    if (!conversationId) return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });

    let companyId = (session.user as any).companyId;
    const role = (session.user as any).role;

    if (role === "ADMIN") {
      const adminCompany = await prisma.company.findFirst({ where: { slug: "tradeindo-admin" } });
      if (adminCompany) companyId = adminCompany.id;
    }

    if (!companyId) return NextResponse.json({ error: "No company" }, { status: 403 });

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { buyerCompanyId: companyId },
          { supplierCompanyId: companyId },
        ],
      },
    });

    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: (session.user as any).id,
        senderName: (session.user as any).name || "User",
        content: body.content || "",
        fileUrl: body.fileUrl || null,
      },
    });

    return NextResponse.json(message);
  } catch (error: any) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json({ error: error.message || "Gagal mengirim pesan" }, { status: 500 });
  }
}