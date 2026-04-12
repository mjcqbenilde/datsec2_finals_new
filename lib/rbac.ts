import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

/** Effective permission keys: "module_key:action_key" */
export async function getEffectivePermissionKeys(
  userId: number,
): Promise<Set<string>> {
  const [rows] = await pool.query<
    RowDataPacket[]
  >(
    `SELECT DISTINCT CONCAT(m.module_key, ':', a.action_key) AS pk
     FROM permissions p
     INNER JOIN modules m ON m.module_id = p.module_id
     INNER JOIN actions a ON a.action_id = p.action_id
     INNER JOIN system_role_permissions srp ON srp.permission_id = p.permission_id
     INNER JOIN users u ON u.system_role_id = srp.system_role_id
     WHERE u.user_id = ?
     UNION
     SELECT DISTINCT CONCAT(m.module_key, ':', a.action_key)
     FROM permissions p
     INNER JOIN modules m ON m.module_id = p.module_id
     INNER JOIN actions a ON a.action_id = p.action_id
     INNER JOIN job_role_permissions jrp ON jrp.permission_id = p.permission_id
     INNER JOIN user_job_roles ujr ON ujr.job_role_id = jrp.job_role_id
     WHERE ujr.user_id = ?`,
    [userId, userId],
  );
  return new Set(rows.map((r) => String(r.pk)));
}

export function hasPermissionKey(
  keys: Set<string>,
  moduleKey: string,
  actionKey: string,
): boolean {
  return keys.has(`${moduleKey}:${actionKey}`);
}

export async function userHasPermission(
  userId: number,
  moduleKey: string,
  actionKey: string,
): Promise<boolean> {
  const keys = await getEffectivePermissionKeys(userId);
  return hasPermissionKey(keys, moduleKey, actionKey);
}
