import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  const userId = session.userId ?? null;
  const username = session.username ?? "unknown";

  if (session.isLoggedIn) {
    await writeAuditLog({
      userId,
      eventType: "logout",
      summary: `User ${username} logged out`,
      ip:
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    });
  }

  session.destroy();
  await session.save();

  return NextResponse.json({ ok: true });
}
