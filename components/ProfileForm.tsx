"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProfileForm({
  initialFirst,
  initialLast,
  email,
  canEdit,
}: {
  initialFirst: string;
  initialLast: string;
  email: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [first_name, setFirst] = useState(initialFirst);
  const [last_name, setLast] = useState(initialLast);
  const [current_password, setCurrentPassword] = useState("");
  const [new_password, setNewPassword] = useState("");
  const [confirm_password, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const np = new_password.trim();
    const wantsPassword =
      np.length > 0 ||
      current_password.length > 0 ||
      confirm_password.length > 0;

    if (wantsPassword) {
      if (!current_password) {
        setError("Enter your current password to set a new one.");
        return;
      }
      if (np.length < 8) {
        setError("New password must be at least 8 characters.");
        return;
      }
      if (np !== confirm_password) {
        setError("New password and confirmation do not match.");
        return;
      }
    }

    const hasNameChange = canEdit;
    if (!hasNameChange && !wantsPassword) {
      setError("Nothing to save.");
      return;
    }

    setPending(true);
    try {
      const body: Record<string, string> = {};
      if (canEdit) {
        body.first_name = first_name;
        body.last_name = last_name;
      }
      if (wantsPassword) {
        body.current_password = current_password;
        body.new_password = np;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Update failed");
        return;
      }
      setMessage("Saved.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={onSubmit}
        className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
      >
        <h2 className="text-sm font-medium text-zinc-300">Profile</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-zinc-500">Email</label>
            <p className="text-zinc-300">{email}</p>
          </div>
          <div>
            <label className="text-xs text-zinc-500" htmlFor="first">
              First name
            </label>
            <input
              id="first"
              className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm disabled:opacity-50"
              value={first_name}
              onChange={(e) => setFirst(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500" htmlFor="last">
              Last name
            </label>
            <input
              id="last"
              className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm disabled:opacity-50"
              value={last_name}
              onChange={(e) => setLast(e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="mt-8 border-t border-zinc-800 pt-6">
          <h3 className="text-sm font-medium text-zinc-300">Password</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Leave blank to keep your current password. To change it, fill all
            three fields.
          </p>
          <div className="mt-4 space-y-3">
            <div>
              <label
                className="text-xs text-zinc-500"
                htmlFor="current_password"
              >
                Current password
              </label>
              <input
                id="current_password"
                type="password"
                autoComplete="current-password"
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                value={current_password}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500" htmlFor="new_password">
                New password
              </label>
              <input
                id="new_password"
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                value={new_password}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
              />
            </div>
            <div>
              <label
                className="text-xs text-zinc-500"
                htmlFor="confirm_password"
              >
                Confirm new password
              </label>
              <input
                id="confirm_password"
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                value={confirm_password}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="mt-6 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>

        {!canEdit ? (
          <p className="mt-4 text-xs text-zinc-500">
            Name fields are read-only. You can still update your password above.
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-3 text-sm text-emerald-400/90">{message}</p>
        ) : null}
      </form>
    </div>
  );
}
