"use server";

import { getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { pool } from "@/lib/db";
import {
  sampleListAttendance,
  sampleRecordAttendance,
} from "@/lib/job-samples/hr";
import { hasPermissionKey } from "@/lib/rbac";
import type { RowDataPacket } from "mysql2";

export async function actionListEmployees() {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  if (!hasPermissionKey(u.permissionKeys, "hr.employees", "view")) {
    return { ok: false as const, error: "You do not have permission for this action." };
  }

  const [rows] = await pool.query<
    (RowDataPacket & {
      user_id: number;
      username: string;
      name: string;
      job_roles: string | null;
    })[]
  >(
    `SELECT u.user_id,
            u.username,
            TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))) AS name,
            GROUP_CONCAT(jr.job_name ORDER BY jr.job_name SEPARATOR ', ') AS job_roles
     FROM users u
     LEFT JOIN user_job_roles ujr ON ujr.user_id = u.user_id
     LEFT JOIN job_roles jr ON jr.job_role_id = ujr.job_role_id
     GROUP BY u.user_id, u.first_name, u.last_name, u.username
     ORDER BY u.user_id`,
  );

  const normalizedRows = rows.map((row) => ({
    user_id: row.user_id,
    name: row.name || row.username || "Unknown",
    job_roles: row.job_roles ?? "Unassigned",
  }));

  await writeAuditLog({
    userId: u.userId,
    eventType: "view",
    resourceType: "hr.employees",
    summary: "Viewed employee directory",
  });

  return { ok: true as const, data: { rows: normalizedRows } };
}

export async function actionListAttendance() {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleListAttendance(u);
}

export async function actionRecordAttendance(employee: string, status: string) {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleRecordAttendance(u, employee, status);
}
