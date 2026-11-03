import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companyId = (session.user as any).companyId;
  if (!companyId) return NextResponse.json({ error: "No company" }, { status: 403 });

  try {
    const body = await req.json();
    
    // Menangkap data dengan nama yang sesuai dari Frontend
    const { documentsData } = body; 

    if (!Array.isArray(documentsData) || documentsData.length === 0) {
      return NextResponse.json({ error: "Format data salah atau dokumen kosong." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Simpan data verifikasi
      await tx.verificationRequest.create({
        data: { 
          companyId, 
          documentData: documentsData, // Disimpan ke kolom JSON di Prisma
          status: "PENDING" 
        }
      });
      
      // 2. Ubah status perusahaan
      await tx.company.update({
        where: { id: companyId },
        data: { verificationStatus: "PENDING" }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("VERIFICATION ERROR:", error);
    return NextResponse.json({ error: "Gagal mengajukan verifikasi" }, { status: 500 });
  }
}