import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } } // <-- Next.js 14: Tanpa Promise
) {
  const id = params.id; // <-- Next.js 14: Tanpa await
  const session = await getServerSession(authOptions);
  
  // 1. Pastikan yang request adalah ADMIN
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status, reason } = body;

    if (!["ACTIVE", "SUSPENDED", "BANNED"].includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    // 2. Cegah Admin memblokir dirinya sendiri
    if (id === (session.user as any).id) {
      return NextResponse.json({ error: "Anda tidak dapat mengubah status akun Anda sendiri." }, { status: 400 });
    }

    // 3. Update ke Database
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { 
        status: status as any,
        suspendReason: status === "ACTIVE" ? null : reason
      }
    });

    // 4. Catat Audit Log
    await prisma.auditLog.create({
      data: {
        actorId: (session.user as any).id,
        action: `user.status.${status.toLowerCase()}`,
        entity: "User",
        entityId: id,
        metadata: { reason: reason || null }
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Update status error:", error);
    return NextResponse.json({ error: "Gagal mengubah status pengguna" }, { status: 500 });
  }
}