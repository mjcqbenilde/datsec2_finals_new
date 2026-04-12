"use server";

import { getCurrentUser } from "@/lib/auth";
import {
  sampleAddEmployee,
  sampleListAttendance,
  sampleListEmployees,
  sampleRecordAttendance,
} from "@/lib/job-samples/hr";

export async function actionListEmployees() {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleListEmployees(u);
}

export async function actionAddEmployee(name: string, role: string) {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleAddEmployee(u, name, role);
}

export async function actionListAttendance() {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleListAttendance(u);
}

export async function actionRecordAttendance(employee: string, status: string) {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleRecordAttendance(u, employee, status);
}
