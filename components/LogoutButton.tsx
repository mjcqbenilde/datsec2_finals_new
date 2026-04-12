"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void logout()}
      className="rounded-md border border-zinc-600 px-3 py-1.5 text-zinc-200 hover:bg-zinc-800"
    >
      Log out
    </button>
  );
}
