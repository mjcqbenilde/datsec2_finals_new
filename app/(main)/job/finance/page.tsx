import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { hasModuleFamily } from "@/lib/job-roles";
import { FinanceJobPanels } from "@/components/job/FinanceJobPanels";

export default async function FinanceJobPage() {
  const user = await requireUser();
  if (!hasModuleFamily(user.permissionKeys, "finance")) {
    redirect("/dashboard?forbidden=1");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Finance</h1>
        <p className="mt-1 text-zinc-400">
          Sample actions check your effective permissions (system role + job role)
          and write audit events for views and changes.
        </p>
      </div>
      <FinanceJobPanels permissions={Array.from(user.permissionKeys)} />
    </div>
  );
}
