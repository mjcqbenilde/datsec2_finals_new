import { writeAuditLog } from "@/lib/audit";
import type { AuthUser } from "@/lib/auth";
import { hasPermissionKey } from "@/lib/rbac";
import {
  SAMPLE_CHECKLISTS,
  SAMPLE_POLICIES,
  SAMPLE_TRAINING,
  type ChecklistRow,
  type PolicyRow,
  type TrainingRow,
} from "@/lib/job-samples/data";

export type JobResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function deny(): JobResult<never> {
  return { ok: false, error: "You do not have permission for this action." };
}

export async function sampleListPolicies(
  user: AuthUser,
): Promise<JobResult<{ rows: PolicyRow[] }>> {
  if (!hasPermissionKey(user.permissionKeys, "compliance.policies", "view")) {
    return deny();
  }
  await writeAuditLog({
    userId: user.userId,
    eventType: "view",
    resourceType: "compliance.policies",
    summary: "Viewed policies (sample)",
  });
  return { ok: true, data: { rows: SAMPLE_POLICIES } };
}

export async function sampleAcknowledgePolicy(
  user: AuthUser,
  policyId: string,
): Promise<JobResult<{ policyId: string }>> {
  if (!hasPermissionKey(user.permissionKeys, "compliance.policies", "update")) {
    return deny();
  }
  await writeAuditLog({
    userId: user.userId,
    eventType: "update",
    resourceType: "compliance.policies",
    resourceId: policyId,
    summary: `Acknowledged sample policy ${policyId}`,
  });
  return { ok: true, data: { policyId } };
}

export async function sampleListTraining(
  user: AuthUser,
): Promise<JobResult<{ rows: TrainingRow[] }>> {
  if (!hasPermissionKey(user.permissionKeys, "compliance.training", "view")) {
    return deny();
  }
  await writeAuditLog({
    userId: user.userId,
    eventType: "view",
    resourceType: "compliance.training",
    summary: "Viewed training records (sample)",
  });
  return { ok: true, data: { rows: SAMPLE_TRAINING } };
}

export async function sampleCompleteTraining(
  user: AuthUser,
  trainingId: string,
): Promise<JobResult<{ trainingId: string }>> {
  if (!hasPermissionKey(user.permissionKeys, "compliance.training", "update")) {
    return deny();
  }
  await writeAuditLog({
    userId: user.userId,
    eventType: "update",
    resourceType: "compliance.training",
    resourceId: trainingId,
    summary: `Marked sample training complete ${trainingId}`,
  });
  return { ok: true, data: { trainingId } };
}

export async function sampleListChecklists(
  user: AuthUser,
): Promise<JobResult<{ rows: ChecklistRow[] }>> {
  if (!hasPermissionKey(user.permissionKeys, "compliance.checklists", "view")) {
    return deny();
  }
  await writeAuditLog({
    userId: user.userId,
    eventType: "view",
    resourceType: "compliance.checklists",
    summary: "Viewed compliance checklists (sample)",
  });
  return { ok: true, data: { rows: SAMPLE_CHECKLISTS } };
}

export async function sampleUpdateChecklistProgress(
  user: AuthUser,
  checklistId: string,
  itemsDone: number,
): Promise<JobResult<{ checklistId: string }>> {
  if (!hasPermissionKey(user.permissionKeys, "compliance.checklists", "update")) {
    return deny();
  }
  await writeAuditLog({
    userId: user.userId,
    eventType: "update",
    resourceType: "compliance.checklists",
    resourceId: checklistId,
    summary: `Updated sample checklist progress ${checklistId}`,
    details: { itemsDone },
  });
  return { ok: true, data: { checklistId } };
}
