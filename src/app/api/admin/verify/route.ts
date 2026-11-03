import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { companyId, action, reason } = body;

    if (!companyId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Request tidak valid" }, { status: 400 });
    }

    const status = action === "approve" ? "VERIFIED" : "REJECTED";

    await prisma.$transaction(async (tx) => {
      // 1. Update Company
      await tx.company.update({
        where: { id: companyId },
        data: { 
          verificationStatus: status as any, 
          verifiedAt: action === "approve" ? new Date() : null 
        },
      });

      // 2. Update Verification Request terakhir
      const lastRequest = await tx.verificationRequest.findFirst({
        where: { companyId, status: "PENDING" },
        orderBy: { createdAt: "desc" }
      });

      if (lastRequest) {
        await tx.verificationRequest.update({
          where: { id: lastRequest.id },
          data: { 
            status: status as any,
            rejectionReason: action === "reject" ? reason : null
          }
        });
      }

      // 3. Audit Log
      await tx.auditLog.create({
        data: {
          actorId: (session.user as any).id,
          action: `company.verify.${action}`,
          entity: "Company",
          entityId: companyId,
          metadata: { status, reason: reason || null }
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "Gagal memproses verifikasi" }, { status: 500 });
  }
}