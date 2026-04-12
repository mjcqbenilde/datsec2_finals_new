"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const jobOptions = [
  "finance",
  "hr",
  "operations",
  "compliance",
] as const;

export function CreateUserForm({
  /** Super Admin only: show Admin and Super Admin role options on create. */
  canCreateSuperAdmin,
}: {
  canCreateSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role_key, setRoleKey] = useState<"admin" | "user" | "super_admin">(
    "user",
  );
  const [jobKeys, setJobKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function toggleJob(key: (typeof jobOptions)[number]) {
    setJobKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          role_key,
          job_keys: jobKeys.length ? jobKeys : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to create user");
        return;
      }
      setUsername("");
      setEmail("");
      setPassword("");
      setRoleKey("user");
      setJobKeys([]);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
    >
      <h2 className="text-lg font-medium text-zinc-200">Create user</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs text-zinc-500">Username</label>
          <input
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500">System role</label>
          <select
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
            value={role_key}
            onChange={(e) =>
              setRoleKey(e.target.value as typeof role_key)
            }
          >
            <option value="user">User</option>
            {canCreateSuperAdmin ? (
              <>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </>
            ) : null}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <span className="text-xs text-zinc-500">Job roles (optional)</span>
        <div className="mt-2 flex flex-wrap gap-3">
          {jobOptions.map((k) => (
            <label
              key={k}
              className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300"
            >
              <input
                type="checkbox"
                checked={jobKeys.includes(k)}
                onChange={() => toggleJob(k)}
              />
              {k}
            </label>
          ))}
        </div>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}
