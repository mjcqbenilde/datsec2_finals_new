import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getEffectivePermissionKeys } from "@/lib/rbac";
import type { UserRow } from "@/lib/types";
import type { RowDataPacket } from "mysql2";

export type AuthUser = {
  userId: number;
  username: string;
  email: string;
  systemRoleKey: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  permissionKeys: Set<string>;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) return null;

  const [rows] = await pool.query<UserRow[] & RowDataPacket[]>(
    `SELECT u.*, sr.role_key
     FROM users u
     INNER JOIN system_roles sr ON sr.system_role_id = u.system_role_id
     WHERE u.user_id = ? AND u.is_active = 1
     LIMIT 1`,
    [session.userId],
  );
  const row = rows[0];
  if (!row) return null;

  const permissionKeys = await getEffectivePermissionKeys(row.user_id);

  return {
    userId: row.user_id,
    username: row.username,
    email: row.email,
    systemRoleKey: row.role_key,
    firstName: row.first_name,
    lastName: row.last_name,
    isActive: row.is_active === 1,
    permissionKeys,
  };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(
  moduleKey: string,
  actionKey: string,
): Promise<AuthUser> {
  const user = await requireUser();
  if (!user.permissionKeys.has(`${moduleKey}:${actionKey}`)) {
    redirect("/dashboard?forbidden=1");
  }
  return user;
}
