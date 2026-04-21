import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

async function countOtherActiveSuperAdmins(excludeUserId: number): Promise<number> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS c FROM users u
     INNER JOIN system_roles sr ON sr.system_role_id = u.system_role_id
     WHERE sr.role_key = 'super_admin' AND u.is_active = 1 AND u.user_id != ?`,
    [excludeUserId],
  );
  return Number((rows[0] as { c: number }).c);
}

const patchSchema = z.object({
  is_active: z.boolean().optional(),
  job_keys: z.array(z.enum(["finance", "hr", "operations", "compliance"])).optional(),
  role_key: z.enum(["super_admin", "admin", "user"]).optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!auth.permissionKeys.has("system.users:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const [targetRows] = await pool.query<RowDataPacket[]>(
    `SELECT u.user_id, sr.role_key
     FROM users u
     INNER JOIN system_roles sr ON sr.system_role_id = u.system_role_id
     WHERE u.user_id = ? LIMIT 1`,
    [userId],
  );
  const target = targetRows[0] as
    | { user_id: number; role_key: string }
    | undefined;
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (target.role_key === "super_admin" && auth.systemRoleKey !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const body = parsed.data;

  if (body.role_key !== undefined && auth.systemRoleKey !== "super_admin") {
    return NextResponse.json(
      { error: "Only a Super Admin can change system roles" },
      { status: 403 },
    );
  }

  if (body.is_active === false && userId === auth.userId) {
    return NextResponse.json({ error: "You cannot deactivate yourself" }, { status: 400 });
  }

  if (body.role_key !== undefined) {
    if (body.role_key !== "super_admin" && target.role_key === "super_admin") {
      const others = await countOtherActiveSuperAdmins(userId);
      if (others === 0) {
        return NextResponse.json(
          { error: "Cannot change or remove the last Super Admin" },
          { status: 400 },
        );
      }
    }

    const [roleRows] = await pool.query<RowDataPacket[]>(
      `SELECT system_role_id FROM system_roles WHERE role_key = ? LIMIT 1`,
      [body.role_key],
    );
    const sr = roleRows[0] as { system_role_id: number } | undefined;
    if (!sr) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await pool.execute<ResultSetHeader>(
      `UPDATE users SET system_role_id = ? WHERE user_id = ?`,
      [sr.system_role_id, userId],
    );
    await writeAuditLog({
      userId: auth.userId,
      eventType: "update",
      resourceType: "user",
      resourceId: String(userId),
      summary: `Changed system role for user ${userId} to ${body.role_key}`,
      details: { from: target.role_key, to: body.role_key },
    });
  }

  if (body.is_active !== undefined) {
    await pool.execute(`UPDATE users SET is_active = ? WHERE user_id = ?`, [
      body.is_active ? 1 : 0,
      userId,
    ]);
    await writeAuditLog({
      userId: auth.userId,
      eventType: "update",
      resourceType: "user",
      resourceId: String(userId),
      summary: `Set user ${userId} is_active=${body.is_active}`,
    });
  }

  if (body.job_keys) {
    await pool.execute(`DELETE FROM user_job_roles WHERE user_id = ?`, [userId]);
    for (const jk of body.job_keys) {
      await pool.execute(
        `INSERT INTO user_job_roles (user_id, job_role_id, assigned_by_user_id)
         SELECT ?, jr.job_role_id, ? FROM job_roles jr WHERE jr.job_key = ?`,
        [userId, auth.userId, jk],
      );
    }
    await writeAuditLog({
      userId: auth.userId,
      eventType: "update",
      resourceType: "user_job_roles",
      resourceId: String(userId),
      summary: `Updated job roles for user ${userId}`,
      details: { job_keys: body.job_keys },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!auth.permissionKeys.has("system.users:manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (auth.systemRoleKey !== "super_admin") {
    return NextResponse.json(
      { error: "Only a Super Admin can delete users" },
      { status: 403 },
    );
  }

  const { id } = await ctx.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  if (userId === auth.userId) {
    return NextResponse.json({ error: "You cannot delete yourself" }, { status: 400 });
  }

  const [targetRows] = await pool.query<RowDataPacket[]>(
    `SELECT u.user_id, sr.role_key, u.is_active
     FROM users u
     INNER JOIN system_roles sr ON sr.system_role_id = u.system_role_id
     WHERE u.user_id = ? LIMIT 1`,
    [userId],
  );
  const target = targetRows[0] as
    | { user_id: number; role_key: string; is_active: number }
    | undefined;
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (target.role_key === "super_admin" && target.is_active) {
    const others = await countOtherActiveSuperAdmins(userId);
    if (others === 0) {
      return NextResponse.json(
        { error: "Cannot remove the last active Super Admin" },
        { status: 400 },
      );
    }
  }

  await pool.execute(`DELETE FROM user_job_roles WHERE user_id = ?`, [userId]);
  await pool.execute(`DELETE FROM users WHERE user_id = ?`, [userId]);

  await writeAuditLog({
    userId: auth.userId,
    eventType: "delete",
    resourceType: "user",
    resourceId: String(userId),
    summary: `Deleted user ${userId}`,
    details: { deleted_role_key: target.role_key, was_active: !!target.is_active },
  });

  return NextResponse.json({ ok: true });
}
