import { auditLogs } from "../../../db/src/schema";
import { db } from "../../../db/src";

export async function writeAuditLog(input: {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: JSON.stringify(input.metadata ?? {}),
  });
}

export async function listAuditLogs() {
  return db.select().from(auditLogs).orderBy(auditLogs.createdAt);
}