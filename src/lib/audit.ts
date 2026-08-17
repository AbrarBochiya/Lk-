import { prisma } from "@/lib/db";
import type { AuditAction } from "@/generated/prisma/client";

export async function writeAudit(input: {
  userId?: string; action: AuditAction; module: string; recordId?: string;
  oldValue?: unknown; newValue?: unknown; reason?: string; ipAddress?: string;
}) {
  await prisma.auditLog.create({ data: {
    userId: input.userId,
    action: input.action,
    module: input.module,
    recordId: input.recordId,
    oldValue: input.oldValue as never,
    newValue: input.newValue as never,
    reason: input.reason,
    ipAddress: input.ipAddress,
  }});
}
