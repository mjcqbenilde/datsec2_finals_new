import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { hasModuleFamily } from "@/lib/job-roles";
import { OperationsJobPanels } from "@/components/job/OperationsJobPanels";

export default async function OperationsJobPage() {
  const user = await requireUser();
  if (!hasModuleFamily(user.permissionKeys, "operations")) {
    redirect("/dashboard?forbidden=1");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Operations</h1>
        <p className="mt-1 text-zinc-400">
          Sample orders, inventory, and vendor actions (demo data; audit trail is real).
        </p>
      </div>
      <OperationsJobPanels permissions={Array.from(user.permissionKeys)} />
    </div>
  );
}
