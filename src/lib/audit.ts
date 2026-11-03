import { prisma } from "./prisma";

export async function audit(
  actorId: string | null, 
  action: string, 
  entity: string, 
  entityId?: string, 
  metadata?: unknown
) {
  try {
    await prisma.auditLog.create({
      data: { 
        actorId, 
        action, 
        entity, 
        entityId, 
        metadata: metadata as any 
      },
    });
  } catch (error) {
    console.error("Gagal menyimpan audit log:", error);
  }
}