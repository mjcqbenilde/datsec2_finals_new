"use server";

import { getCurrentUser } from "@/lib/auth";
import {
  sampleAcknowledgePolicy,
  sampleCompleteTraining,
  sampleListChecklists,
  sampleListPolicies,
  sampleListTraining,
  sampleUpdateChecklistProgress,
} from "@/lib/job-samples/compliance";

export async function actionListPolicies() {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleListPolicies(u);
}

export async function actionAckPolicy(policyId: string) {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleAcknowledgePolicy(u, policyId);
}

export async function actionListTraining() {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleListTraining(u);
}

export async function actionCompleteTraining(trainingId: string) {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleCompleteTraining(u, trainingId);
}

export async function actionListChecklists() {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleListChecklists(u);
}

export async function actionUpdateChecklist(checklistId: string, itemsDone: number) {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleUpdateChecklistProgress(u, checklistId, itemsDone);
}
