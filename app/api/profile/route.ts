import { NextResponse } from "next/server";
import * as argon2 from "argon2";
import { z } from "zod";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { RowDataPacket } from "mysql2";

const patchSchema = z
  .object({
    first_name: z.string().max(100).optional(),
    last_name: z.string().max(100).optional(),
    current_password: z.string().optional(),
    new_password: z.string().max(128).optional(),
  })
  .refine(
    (d) => {
      const np = d.new_password?.trim() ?? "";
      if (np.length === 0) return true;
      return Boolean(d.current_password && d.current_password.length > 0);
    },
    {
      message: "Current password is required to set a new password",
      path: ["current_password"],
    },
  )
  .refine(
    (d) => {
      const np = d.new_password?.trim() ?? "";
      if (np.length === 0) return true;
      return np.length >= 8;
    },
    {
      message: "New password must be at least 8 characters",
      path: ["new_password"],
    },
  );

export async function PATCH(req: Request) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const { first_name, last_name, current_password, new_password } =
    parsed.data;

  const hasNameUpdate =
    first_name !== undefined || last_name !== undefined;
  if (hasNameUpdate && !auth.permissionKeys.has("profile:edit_self")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newPass = new_password?.trim() ?? "";
  const wantsPasswordChange = newPass.length > 0;

  if (wantsPasswordChange) {
    const [rows] = await pool.query<
      (RowDataPacket & { password_hash: string })[]
    >(`SELECT password_hash FROM users WHERE user_id = ? LIMIT 1`, [
      auth.userId,
    ]);
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const currentOk = await argon2.verify(
      row.password_hash,
      current_password ?? "",
    );
    if (!currentOk) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 },
      );
    }
    const hash = await argon2.hash(newPass, { type: argon2.argon2id });
    await pool.execute(
      `UPDATE users SET password_hash = ? WHERE user_id = ?`,
      [hash, auth.userId],
    );
    await writeAuditLog({
      userId: auth.userId,
      eventType: "update",
      resourceType: "credentials",
      resourceId: String(auth.userId),
      summary: "User changed their password",
    });
  }

  if (hasNameUpdate) {
    await pool.execute(
      `UPDATE users SET first_name = ?, last_name = ? WHERE user_id = ?`,
      [first_name ?? "", last_name ?? "", auth.userId],
    );
    await writeAuditLog({
      userId: auth.userId,
      eventType: "update",
      resourceType: "profile",
      resourceId: String(auth.userId),
      summary: "User updated profile",
      details: { first_name, last_name },
    });
  }

  if (!wantsPasswordChange && !hasNameUpdate) {
    return NextResponse.json(
      { error: "No changes provided" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
