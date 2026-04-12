import { NextRequest, NextResponse } from "next/server";
import * as argon2 from "argon2";
import { z } from "zod";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import type { UserRow } from "@/lib/types";
import type { RowDataPacket } from "mysql2";

const bodySchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { username, password } = parsed.data;

  const [rows] = await pool.query<UserRow[] & RowDataPacket[]>(
    `SELECT u.*, sr.role_key
     FROM users u
     INNER JOIN system_roles sr ON sr.system_role_id = u.system_role_id
     WHERE u.username = ?
     LIMIT 1`,
    [username],
  );
  const user = rows[0];
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    undefined;
  const userAgent = req.headers.get("user-agent") ?? undefined;

  if (!user) {
    await writeAuditLog({
      userId: null,
      eventType: "login_failure",
      summary: `Failed login attempt for username "${username}"`,
      ip,
      userAgent,
    });
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  if (!user.is_active) {
    await writeAuditLog({
      userId: user.user_id,
      eventType: "login_failure",
      summary: `Inactive account login attempt: ${username}`,
      ip,
      userAgent,
    });
    return NextResponse.json(
      {
        error:
          "This account has been deactivated. Contact an administrator if you need access.",
        code: "account_deactivated",
      },
      { status: 403 },
    );
  }

  const ok = await argon2.verify(user.password_hash, password);
  if (!ok) {
    await writeAuditLog({
      userId: user.user_id,
      eventType: "login_failure",
      summary: `Wrong password for user ${username}`,
      ip,
      userAgent,
    });
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  await pool.execute(`UPDATE users SET last_login_at = NOW() WHERE user_id = ?`, [
    user.user_id,
  ]);

  const session = await getSession();
  session.userId = user.user_id;
  session.username = user.username;
  session.systemRoleKey = user.role_key;
  session.isLoggedIn = true;
  await session.save();

  await writeAuditLog({
    userId: user.user_id,
    eventType: "login_success",
    summary: `User ${username} logged in`,
    ip,
    userAgent,
  });

  return NextResponse.json({ ok: true });
}
