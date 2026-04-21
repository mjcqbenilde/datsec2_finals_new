"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

const JOB_KEYS = ["finance", "hr", "operations", "compliance"] as const;
type JobKey = (typeof JOB_KEYS)[number];
type ConfirmAction = "save" | "delete" | null;

export type UserRowData = {
  user_id: number;
  username: string;
  email: string;
  is_active: number;
  role_key: string;
  job_keys: string | null;
};

function parseJobKeys(s: string | null): JobKey[] {
  if (!s) return [];
  const set = new Set(JOB_KEYS);
  return s
    .split(",")
    .map((x) => x.trim())
    .filter((x): x is JobKey => set.has(x as JobKey));
}

export function UsersTable({
  users,
  currentUserId,
  viewerIsSuperAdmin,
}: {
  users: UserRowData[];
  currentUserId: number;
  viewerIsSuperAdmin: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">ID</th>
            <th className="px-4 py-3 font-medium">Username</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">System role</th>
            <th className="px-4 py-3 font-medium">Job roles</th>
            <th className="px-4 py-3 font-medium">Active</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {users.map((u) => (
            <UserRow
              key={u.user_id}
              user={u}
              currentUserId={currentUserId}
              viewerIsSuperAdmin={viewerIsSuperAdmin}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserRow({
  user,
  currentUserId,
  viewerIsSuperAdmin,
}: {
  user: UserRowData;
  currentUserId: number;
  viewerIsSuperAdmin: boolean;
}) {
  const router = useRouter();
  const readOnlySuper = user.role_key === "super_admin" && !viewerIsSuperAdmin;

  const initialJobs = useMemo(() => parseJobKeys(user.job_keys), [user.job_keys]);
  const [jobKeys, setJobKeys] = useState<JobKey[]>(initialJobs);
  const [isActive, setIsActive] = useState(!!user.is_active);
  const [roleKey, setRoleKey] = useState(user.role_key);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  useEffect(() => {
    setJobKeys(parseJobKeys(user.job_keys));
    setIsActive(!!user.is_active);
    setRoleKey(user.role_key);
    setError(null);
  }, [user.user_id, user.job_keys, user.is_active, user.role_key]);

  const dirty =
    JSON.stringify([...jobKeys].sort()) !==
      JSON.stringify([...initialJobs].sort()) ||
    isActive !== !!user.is_active ||
    roleKey !== user.role_key;

  function toggleJob(k: JobKey) {
    setJobKeys((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );
  }

  async function save() {
    setError(null);
    setPending(true);
    try {
      const body: {
        job_keys: JobKey[];
        is_active: boolean;
        role_key?: string;
      } = {
        job_keys: jobKeys,
        is_active: isActive,
      };
      if (viewerIsSuperAdmin && roleKey !== user.role_key) {
        body.role_key = roleKey as "super_admin" | "admin" | "user";
      }
      const res = await fetch(`/api/users/${user.user_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function deleteUser() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/users/${user.user_id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Delete failed");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function confirm() {
    if (confirmAction === "save") {
      await save();
    } else if (confirmAction === "delete") {
      await deleteUser();
    }
    setConfirmAction(null);
  }

  if (readOnlySuper) {
    return (
      <tr className="text-zinc-300">
        <td className="px-4 py-3 font-mono text-xs text-zinc-500">
          {user.user_id}
        </td>
        <td className="px-4 py-3">{user.username}</td>
        <td className="px-4 py-3">{user.email}</td>
        <td className="px-4 py-3">
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs">
            {user.role_key}
          </span>
        </td>
        <td className="px-4 py-3 text-zinc-400">{user.job_keys ?? "—"}</td>
        <td className="px-4 py-3">
          {user.is_active ? (
            <span className="text-emerald-400">yes</span>
          ) : (
            <span className="text-red-400">no</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-zinc-500">
          Only a Super Admin can edit this account.
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className="text-zinc-300">
        <td className="px-4 py-3 font-mono text-xs text-zinc-500">
          {user.user_id}
        </td>
        <td className="px-4 py-3">{user.username}</td>
        <td className="px-4 py-3">{user.email}</td>
        <td className="px-4 py-3">
          {viewerIsSuperAdmin ? (
            <select
              value={roleKey}
              onChange={(e) => setRoleKey(e.target.value)}
              className="max-w-[10rem] rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs"
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
              <option value="super_admin">super_admin</option>
            </select>
          ) : (
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs">
              {user.role_key}
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {JOB_KEYS.map((k) => (
              <label
                key={k}
                className="flex cursor-pointer items-center gap-1.5 text-xs text-zinc-400"
              >
                <input
                  type="checkbox"
                  checked={jobKeys.includes(k)}
                  onChange={() => toggleJob(k)}
                  className="rounded border-zinc-600"
                />
                {k}
              </label>
            ))}
          </div>
        </td>
        <td className="px-4 py-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              disabled={user.user_id === currentUserId}
              onChange={(e) => setIsActive(e.target.checked)}
              title={
                user.user_id === currentUserId
                  ? "You cannot deactivate your own account here"
                  : undefined
              }
              className="rounded border-zinc-600"
            />
            {isActive ? (
              <span className="text-emerald-400">active</span>
            ) : (
              <span className="text-red-400">inactive</span>
            )}
          </label>
        </td>
        <td className="px-4 py-3 align-top">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              disabled={pending || !dirty}
              onClick={() => setConfirmAction("save")}
              className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-40"
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
            {viewerIsSuperAdmin ? (
              <button
                type="button"
                disabled={pending || user.user_id === currentUserId}
                onClick={() => setConfirmAction("delete")}
                title={
                  user.user_id === currentUserId
                    ? "You cannot delete your own account"
                    : undefined
                }
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-40"
              >
                Delete user
              </button>
            ) : null}
            {error ? (
              <span className="text-xs text-red-400">{error}</span>
            ) : null}
          </div>
        </td>
      </tr>
      <ConfirmModal
        open={confirmAction !== null}
        title={confirmAction === "delete" ? "Delete user?" : "Save user changes?"}
        description={
          confirmAction === "delete"
            ? (
                <>
                  Are you sure to delete user{" "}
                  <span className="font-semibold text-zinc-100">{user.username}</span>
                  ? This action cannot be undone.
                </>
              )
            : (
                <>
                  Are you sure to save changes for user{" "}
                  <span className="font-semibold text-zinc-100">{user.username}</span>
                  ?
                </>
              )
        }
        confirmLabel={confirmAction === "delete" ? "Delete user" : "Save changes"}
        pending={pending}
        destructive={confirmAction === "delete"}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void confirm()}
      />
    </>
  );
}

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  pending,
  destructive,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  pending: boolean;
  destructive: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
        <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
        <p className="mt-2 text-sm text-zinc-400">{description}</p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={
              destructive
                ? "rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
                : "rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
            }
          >
            {pending ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
