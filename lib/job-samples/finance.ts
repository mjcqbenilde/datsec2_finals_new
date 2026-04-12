import { writeAuditLog } from "@/lib/audit";
import type { AuthUser } from "@/lib/auth";
import { hasPermissionKey } from "@/lib/rbac";
import {
  SAMPLE_BUDGET_LINES,
  SAMPLE_FINANCE_REPORTS,
  SAMPLE_TRANSACTIONS,
  nextDemoTransactionId,
  type BudgetLine,
  type FinanceReport,
  type LedgerRow,
} from "@/lib/job-samples/data";

export type JobResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function deny(): JobResult<never> {
  return { ok: false, error: "You do not have permission for this action." };
}

export async function sampleListFinanceReports(
  user: AuthUser,
): Promise<JobResult<{ rows: FinanceReport[] }>> {
  if (!hasPermissionKey(user.permissionKeys, "finance.reports", "view")) {
    return deny();
  }
  await writeAuditLog({
    userId: user.userId,
    eventType: "view",
    resourceType: "finance.report",
    summary: "Viewed financial reports (sample)",
  });
  return { ok: true, data: { rows: SAMPLE_FINANCE_REPORTS } };
}

export async function sampleListBudget(
  user: AuthUser,
): Promise<JobResult<{ rows: BudgetLine[] }>> {
  if (!hasPermissionKey(user.permissionKeys, "finance.budget", "view")) {
    return deny();
  }
  await writeAuditLog({
    userId: user.userId,
    eventType: "view",
    resourceType: "finance.budget",
    summary: "Viewed budget records (sample)",
  });
  return { ok: true, data: { rows: SAMPLE_BUDGET_LINES } };
}

export async function sampleListTransactions(
  user: AuthUser,
): Promise<JobResult<{ rows: LedgerRow[] }>> {
  if (!hasPermissionKey(user.permissionKeys, "finance.transactions", "view")) {
    return deny();
  }
  await writeAuditLog({
    userId: user.userId,
    eventType: "view",
    resourceType: "finance.transactions",
    summary: "Viewed transactions (sample)",
  });
  return { ok: true, data: { rows: SAMPLE_TRANSACTIONS } };
}

export async function sampleCreateTransaction(
  user: AuthUser,
  description: string,
): Promise<JobResult<{ id: string }>> {
  if (!hasPermissionKey(user.permissionKeys, "finance.transactions", "create")) {
    return deny();
  }
  const id = nextDemoTransactionId();
  await writeAuditLog({
    userId: user.userId,
    eventType: "create",
    resourceType: "finance.transactions",
    resourceId: id,
    summary: `Created sample transaction ${id}`,
    details: { description },
  });
  return { ok: true, data: { id } };
}

export async function sampleUpdateReportTitle(
  user: AuthUser,
  reportId: string,
  newTitle: string,
): Promise<JobResult<{ reportId: string }>> {
  if (!hasPermissionKey(user.permissionKeys, "finance.reports", "update")) {
    return deny();
  }
  await writeAuditLog({
    userId: user.userId,
    eventType: "update",
    resourceType: "finance.report",
    resourceId: reportId,
    summary: `Updated sample report ${reportId}`,
    details: { newTitle },
  });
  return { ok: true, data: { reportId } };
}
