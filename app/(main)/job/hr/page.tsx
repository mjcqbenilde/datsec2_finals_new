import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { hasModuleFamily } from "@/lib/job-roles";
import { HrJobPanels } from "@/components/job/HrJobPanels";

export default async function HrJobPage() {
  const user = await requireUser();
  if (!hasModuleFamily(user.permissionKeys, "hr")) {
    redirect("/dashboard?forbidden=1");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">HR</h1>
        <p className="mt-1 text-zinc-400">
          Sample employee directory and attendance flows with RBAC and audit logging.
        </p>
      </div>
      <HrJobPanels permissions={Array.from(user.permissionKeys)} />
    </div>
  );
}
