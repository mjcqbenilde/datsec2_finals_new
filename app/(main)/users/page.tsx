import { pool } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { CreateUserForm } from "@/components/CreateUserForm";
import { UsersTable } from "@/components/UsersTable";
import type { RowDataPacket } from "mysql2";

export default async function UsersPage() {
  const auth = await requirePermission("system.users", "manage");

  const [rows] = await pool.query<
    (RowDataPacket & {
      user_id: number;
      username: string;
      email: string;
      is_active: number;
      role_key: string;
      role_name: string;
      job_keys: string | null;
    })[]
  >(
    `SELECT u.user_id, u.username, u.email, u.is_active,
            sr.role_key, sr.role_name,
            GROUP_CONCAT(jr.job_key ORDER BY jr.job_key SEPARATOR ',') AS job_keys
     FROM users u
     INNER JOIN system_roles sr ON sr.system_role_id = u.system_role_id
     LEFT JOIN user_job_roles ujr ON ujr.user_id = u.user_id
     LEFT JOIN job_roles jr ON jr.job_role_id = ujr.job_role_id
     GROUP BY u.user_id, u.username, u.email, u.is_active, sr.role_key, sr.role_name
     ORDER BY u.user_id`,
  );

  const users = rows.map((u) => ({
    user_id: u.user_id,
    username: u.username,
    email: u.email,
    is_active: u.is_active,
    role_key: u.role_key,
    job_keys: u.job_keys,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Users</h1>
        <p className="mt-1 text-zinc-400">
          Create and manage accounts. Admins can assign job roles (Finance, HR,
          etc.) and activate or deactivate users. Only Super Admins can create
          Admin or Super Admin accounts, or change a user&apos;s system role
          (including promoting someone to Admin).
        </p>
      </div>

      <CreateUserForm canCreateSuperAdmin={auth.systemRoleKey === "super_admin"} />

      <UsersTable
        users={users}
        currentUserId={auth.userId}
        viewerIsSuperAdmin={auth.systemRoleKey === "super_admin"}
      />
    </div>
  );
}
