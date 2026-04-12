import { pool } from "@/lib/db";

export type AuditInput = {
  userId: number | null;
  eventType: string;
  resourceType?: string | null;
  resourceId?: string | null;
  summary: string;
  details?: unknown;
  ip?: string | null;
  userAgent?: string | null;
};

export async function writeAuditLog(input: AuditInput): Promise<void> {
  await pool.execute(
    `INSERT INTO audit_logs (user_id, event_type, resource_type, resource_id, summary, details, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.userId,
      input.eventType,
      input.resourceType ?? null,
      input.resourceId ?? null,
      input.summary,
      input.details != null
        ? JSON.stringify(input.details)
        : null,
      input.ip ?? null,
      input.userAgent ?? null,
    ],
  );
}
