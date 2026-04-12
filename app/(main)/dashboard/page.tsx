import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getJobRolesForUser } from "@/lib/job-roles";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ forbidden?: string }>;
}) {
  const user = await requireUser();
  const jobs = await getJobRolesForUser(user.userId);
  const sp = await searchParams;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="mt-1 text-zinc-400">
          Overview for your system role and job assignments.
        </p>
      </div>

      {sp.forbidden ? (
        <p className="rounded-md border border-amber-900/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
          You do not have permission to view that page.
        </p>
      ) : null}

      {user.systemRoleKey === "super_admin" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <DashboardCard
            title="Full system access"
            body="Super Admin can manage admins, all modules, role assignment, and audit logs."
          />
          <DashboardCard
            title="Quick links"
            body="Use the navigation bar for Users, Audit logs, job modules, and Profile."
          />
        </div>
      ) : null}

      {user.systemRoleKey === "admin" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <DashboardCard
            title="Administration"
            body="Monitor activity, manage users, assign job roles (Finance / HR / Operations / Compliance). You cannot create Super Admin accounts."
          />
          <div className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="font-medium text-zinc-200">Shortcuts</h2>
            <Link className="text-amber-400 hover:underline" href="/users">
              User management
            </Link>
            <Link className="text-amber-400 hover:underline" href="/logs">
              Audit logs
            </Link>
          </div>
        </div>
      ) : null}

      {user.systemRoleKey === "user" ? (
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-zinc-200">Your job roles</h2>
          {jobs.length === 0 ? (
            <p className="text-zinc-500">
              No job roles assigned yet. An administrator can assign Finance, HR,
              Operations, or Compliance access.
            </p>
          ) : (
            <ul className="list-inside list-disc text-zinc-300">
              {jobs.map((j) => (
                <li key={j.job_key}>
                  {j.job_name}{" "}
                  <span className="text-zinc-500">({j.job_key})</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-zinc-500">
            Open the Finance, HR, Operations, or Compliance sections from the nav
            when your role includes those modules.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function DashboardCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="font-medium text-zinc-200">{title}</h2>
      <p className="mt-2 text-sm text-zinc-400">{body}</p>
    </div>
  );
}
