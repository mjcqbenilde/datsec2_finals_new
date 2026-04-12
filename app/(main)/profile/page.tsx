import { requireUser } from "@/lib/auth";
import { pool } from "@/lib/db";
import { ProfileForm } from "@/components/ProfileForm";
import type { RowDataPacket } from "mysql2";

export default async function ProfilePage() {
  const auth = await requireUser();

  const [rows] = await pool.query<
    (RowDataPacket & {
      first_name: string | null;
      last_name: string | null;
      email: string;
    })[]
  >(
    `SELECT first_name, last_name, email FROM users WHERE user_id = ? LIMIT 1`,
    [auth.userId],
  );
  const row = rows[0];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Profile</h1>
        <p className="mt-1 text-zinc-400">View and update your own details.</p>
      </div>
      <ProfileForm
        initialFirst={row?.first_name ?? ""}
        initialLast={row?.last_name ?? ""}
        email={row?.email ?? auth.email}
        canEdit={auth.permissionKeys.has("profile:edit_self")}
      />
    </div>
  );
}
