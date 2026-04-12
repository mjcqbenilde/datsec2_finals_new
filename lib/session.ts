import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  userId?: number;
  username?: string;
  systemRoleKey?: string;
  isLoggedIn?: boolean;
};

function sessionPassword(): string {
  const p = process.env.SESSION_PASSWORD;
  if (p && p.length >= 32) return p;
  if (process.env.NODE_ENV !== "production") {
    return "local-dev-only-insecure-session-key-32chars!";
  }
  throw new Error(
    "SESSION_PASSWORD must be set (≥32 chars). Set it in .env for production.",
  );
}

function buildOptions(): SessionOptions {
  return {
    password: sessionPassword(),
    cookieName: "rbac_session",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}

export async function getSession() {
  const store = await cookies();
  return getIronSession<SessionData>(store, buildOptions());
}
