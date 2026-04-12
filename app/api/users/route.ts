import { NextResponse } from "next/server";
import * as argon2 from "argon2";
import { z } from "zod";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export async function GET() {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!auth.permissionKeys.has("system.users:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  return NextResponse.json({ users: rows });
}

const createSchema = z.object({
  username: z.string().min(1).max(64),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role_key: z.enum(["super_admin", "admin", "user"]),
  job_keys: z.array(z.enum(["finance", "hr", "operations", "compliance"])).optional(),
});

export async function POST(req: Request) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!auth.permissionKeys.has("system.users:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { username, email, password, role_key, job_keys } = parsed.data;

  if (auth.systemRoleKey !== "super_admin") {
    if (role_key === "super_admin") {
      return NextResponse.json(
        { error: "Only a Super Admin can create Super Admin accounts" },
        { status: 403 },
      );
    }
    if (role_key === "admin") {
      return NextResponse.json(
        { error: "Only a Super Admin can create Admin accounts" },
        { status: 403 },
      );
    }
  }

  const [roleRows] = await pool.query<RowDataPacket[]>(
    `SELECT system_role_id FROM system_roles WHERE role_key = ? LIMIT 1`,
    [role_key],
  );
  const sr = roleRows[0] as { system_role_id: number } | undefined;
  if (!sr) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const hash = await argon2.hash(password, { type: argon2.argon2id });

  let userId: number;
  try {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users (username, email, password_hash, system_role_id, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [username, email, hash, sr.system_role_id],
    );
    userId = Number(result.insertId);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 },
      );
    }
    throw e;
  }

  if (job_keys?.length) {
    for (const jk of job_keys) {
      await pool.execute(
        `INSERT INTO user_job_roles (user_id, job_role_id, assigned_by_user_id)
         SELECT ?, jr.job_role_id, ? FROM job_roles jr WHERE jr.job_key = ?`,
        [userId, auth.userId, jk],
      );
    }
  }

  await writeAuditLog({
    userId: auth.userId,
    eventType: "create",
    resourceType: "user",
    resourceId: String(userId),
    summary: `Created user ${username} with role ${role_key}`,
    details: { job_keys: job_keys ?? [] },
  });

  return NextResponse.json({ ok: true, user_id: userId });
}
