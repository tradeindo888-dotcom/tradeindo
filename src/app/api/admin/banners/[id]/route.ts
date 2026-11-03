import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// FUNGSI DELETE (Hapus Banner)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await prisma.banner.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus banner" }, { status: 500 });
  }
}

// FUNGSI PUT (Edit Banner)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { imageUrl, title, linkUrl, order } = body;

    const dataToUpdate: any = { title, linkUrl, order: Number(order) };
    
    // Jika Admin mengunggah gambar baru (mengganti gambar lama)
    if (imageUrl) {
      dataToUpdate.imageUrl = imageUrl;
    }

    const updatedBanner = await prisma.banner.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, banner: updatedBanner });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengupdate banner" }, { status: 500 });
  }
}