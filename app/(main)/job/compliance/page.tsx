import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { hasModuleFamily } from "@/lib/job-roles";
import { ComplianceJobPanels } from "@/components/job/ComplianceJobPanels";

export default async function ComplianceJobPage() {
  const user = await requireUser();
  if (!hasModuleFamily(user.permissionKeys, "compliance")) {
    redirect("/dashboard?forbidden=1");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Compliance</h1>
        <p className="mt-1 text-zinc-400">
          Sample policies, training, and checklist workflows with permission checks.
        </p>
      </div>
      <ComplianceJobPanels permissions={Array.from(user.permissionKeys)} />
    </div>
  );
}
