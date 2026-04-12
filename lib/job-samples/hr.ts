import { writeAuditLog } from "@/lib/audit";
import type { AuthUser } from "@/lib/auth";
import { hasPermissionKey } from "@/lib/rbac";
import {
  SAMPLE_ATTENDANCE,
  SAMPLE_EMPLOYEES,
  type AttendanceRow,
  type EmployeeRow,
} from "@/lib/job-samples/data";

export type JobResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function deny(): JobResult<never> {
  return { ok: false, error: "You do not have permission for this action." };
}

export async function sampleListEmployees(
  user: AuthUser,
): Promise<JobResult<{ rows: EmployeeRow[] }>> {
  if (!hasPermissionKey(user.permissionKeys, "hr.employees", "view")) {
    return deny();
  }
  await writeAuditLog({
    userId: user.userId,
    eventType: "view",
    resourceType: "hr.employees",
    summary: "Viewed employee directory (sample)",
  });
  return { ok: true, data: { rows: SAMPLE_EMPLOYEES } };
}

export async function sampleAddEmployee(
  user: AuthUser,
  name: string,
  role: string,
): Promise<JobResult<{ id: string }>> {
  if (!hasPermissionKey(user.permissionKeys, "hr.employees", "create")) {
    return deny();
  }
  const id = `E-${300 + Math.floor(Math.random() * 900)}`;
  await writeAuditLog({
    userId: user.userId,
    eventType: "create",
    resourceType: "hr.employees",
    resourceId: id,
    summary: `Added sample employee ${id}`,
    details: { name, role },
  });
  return { ok: true, data: { id } };
}

export async function sampleListAttendance(
  user: AuthUser,
): Promise<JobResult<{ rows: AttendanceRow[] }>> {
  if (!hasPermissionKey(user.permissionKeys, "hr.attendance", "view")) {
    return deny();
  }
  await writeAuditLog({
    userId: user.userId,
    eventType: "view",
    resourceType: "hr.attendance",
    summary: "Viewed attendance records (sample)",
  });
  return { ok: true, data: { rows: SAMPLE_ATTENDANCE } };
}

export async function sampleRecordAttendance(
  user: AuthUser,
  employee: string,
  status: string,
): Promise<JobResult<{ entryId: string }>> {
  if (!hasPermissionKey(user.permissionKeys, "hr.attendance", "create")) {
    return deny();
  }
  const entryId = `A-${Date.now()}`;
  await writeAuditLog({
    userId: user.userId,
    eventType: "create",
    resourceType: "hr.attendance",
    resourceId: entryId,
    summary: `Recorded sample attendance ${entryId}`,
    details: { employee, status },
  });
  return { ok: true, data: { entryId } };
}
