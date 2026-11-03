import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ==========================================
// 1. FUNGSI GET (Untuk Menampilkan Tautan Produk)
// ==========================================
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companyId = (session.user as any).companyId;
  if (!companyId) return NextResponse.json({ error: "No company" }, { status: 403 });

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      OR: [
        { buyerCompanyId: companyId },
        { supplierCompanyId: companyId },
      ],
    },
    include: {
      product: {
        include: {
          images: { take: 1, select: { url: true } },
          company: { select: { name: true } }
        }
      }
    }
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(conversation);
}

// ==========================================
// 2. FUNGSI DELETE (Untuk Menghapus Obrolan)
// ==========================================
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Sesi login tidak ditemukan." }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Akun ini tidak memiliki perusahaan." }, { status: 403 });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: id,
        OR: [
          { buyerCompanyId: companyId },
          { supplierCompanyId: companyId },
        ],
      },
    });

    if (!conversation) {
      return NextResponse.json({ 
        error: "Obrolan tidak ditemukan atau Anda bukan bagian dari obrolan ini." 
      }, { status: 404 });
    }

    // Hapus pesan dulu, baru hapus obrolan (Anti-Gagal Foreign Key)
    await prisma.$transaction(async (tx) => {
      await tx.message.deleteMany({
        where: { conversationId: id },
      });
      
      await tx.conversation.delete({
        where: { id: id },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE CONVERSATION ERROR:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan sistem" }, { status: 500 });
  }
}