import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED = ["ACTIVE", "SUSPENDED", "BANNED"] as const;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { status, reason } = body;

    if (!ALLOWED.includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    if (id === (session.user as any).id) {
      return NextResponse.json(
        { error: "Anda tidak dapat mengubah status akun Anda sendiri." },
        { status: 400 }
      );
    }

    if (status !== "ACTIVE" && (!reason || reason.trim().length < 5)) {
      return NextResponse.json(
        { error: "Alasan wajib diisi (minimal 5 karakter)." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          status: status as any,
          suspendReason: status === "ACTIVE" ? null : reason,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          suspendReason: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: (session.user as any).id,
          action: `user.status.${status.toLowerCase()}`,
          entity: "User",
          entityId: id,
          metadata: { reason: reason || null },
        },
      });

      return updatedUser;
    });

    return NextResponse.json({ success: true, user: result });
  } catch (error: any) {
    console.error("Update status error:", error);
    return NextResponse.json({ error: "Gagal mengubah status pengguna" }, { status: 500 });
  }
}