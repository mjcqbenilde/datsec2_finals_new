"use server";

import { getCurrentUser } from "@/lib/auth";
import {
  sampleCreateTransaction,
  sampleListBudget,
  sampleListFinanceReports,
  sampleListTransactions,
  sampleUpdateReportTitle,
} from "@/lib/job-samples/finance";

export async function actionListReports() {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleListFinanceReports(u);
}

export async function actionListBudget() {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleListBudget(u);
}

export async function actionListTransactions() {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleListTransactions(u);
}

export async function actionCreateTransaction(description: string) {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleCreateTransaction(u, description);
}

export async function actionUpdateReport(reportId: string, newTitle: string) {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleUpdateReportTitle(u, reportId, newTitle);
}
