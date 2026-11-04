import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { imageUrl, title, linkUrl, order, durationDays } = body;

    const dataToUpdate: any = { 
      title, 
      linkUrl, 
      order: Number(order) 
    };
    
    if (imageUrl) {
      dataToUpdate.imageUrl = imageUrl;
    }

    // Hitung ulang endDate jika durasi diubah
    if (durationDays && Number(durationDays) > 0) {
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + Number(durationDays));
      dataToUpdate.durationDays = Number(durationDays);
      dataToUpdate.endDate = newEndDate;
    }

    const updatedBanner = await prisma.banner.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, banner: updatedBanner });
  } catch (error) {
    console.error("Update banner error:", error);
    return NextResponse.json({ error: "Gagal mengupdate banner" }, { status: 500 });
  }
}