"use client";

import { useState, useTransition } from "react";
import {
  actionAddEmployee,
  actionListAttendance,
  actionListEmployees,
  actionRecordAttendance,
} from "@/app/(main)/job/hr/actions";
import type { AttendanceRow, EmployeeRow } from "@/lib/job-samples/data";

function can(
  permissions: string[],
  moduleKey: string,
  action: string,
): boolean {
  return permissions.includes(`${moduleKey}:${action}`);
}

export function HrJobPanels({ permissions }: { permissions: string[] }) {
  const [employees, setEmployees] = useState<EmployeeRow[] | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRow[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [empName, setEmpName] = useState("Taylor Kim");
  const [empRole, setEmpRole] = useState("Designer");
  const [attEmployee, setAttEmployee] = useState("Jordan Lee");
  const [attStatus, setAttStatus] = useState("Present");

  const c = (m: string, a: string) => can(permissions, m, a);

  return (
    <div className="space-y-10">
      {err ? (
        <p className="rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {err}
        </p>
      ) : null}
      {msg ? (
        <p className="rounded-md border border-emerald-900/40 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
          {msg}
        </p>
      ) : null}

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-lg font-medium text-zinc-200">Employees</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Keys: <code className="text-zinc-400">hr.employees:view</code>,{" "}
          <code className="text-zinc-400">hr.employees:create</code>
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          {c("hr.employees", "view") ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setErr(null);
                setMsg(null);
                startTransition(async () => {
                  const r = await actionListEmployees();
                  if (r.ok) {
                    setEmployees(r.data.rows);
                    setMsg("Loaded employees (audit logged).");
                  } else setErr(r.error);
                });
              }}
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              Load sample employees
            </button>
          ) : (
            <p className="text-sm text-zinc-500">No view access.</p>
          )}
          {c("hr.employees", "create") ? (
            <>
              <input
                className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                placeholder="Name"
              />
              <input
                className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                value={empRole}
                onChange={(e) => setEmpRole(e.target.value)}
                placeholder="Role"
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setErr(null);
                  setMsg(null);
                  startTransition(async () => {
                    const r = await actionAddEmployee(empName, empRole);
                    if (r.ok) {
                      setMsg(`Sample employee created: ${r.data.id} (audit).`);
                    } else setErr(r.error);
                  });
                }}
                className="rounded-md bg-amber-500/90 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
              >
                Add demo employee
              </button>
            </>
          ) : null}
        </div>
        {employees ? (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2">Office</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {employees.map((e) => (
                <tr key={e.id} className="border-t border-zinc-800">
                  <td className="py-2 font-mono text-xs">{e.id}</td>
                  <td className="py-2">{e.name}</td>
                  <td className="py-2">{e.role}</td>
                  <td className="py-2">{e.office}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-lg font-medium text-zinc-200">Attendance</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Keys: <code className="text-zinc-400">hr.attendance:view</code>,{" "}
          <code className="text-zinc-400">hr.attendance:create</code>
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          {c("hr.attendance", "view") ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setErr(null);
                setMsg(null);
                startTransition(async () => {
                  const r = await actionListAttendance();
                  if (r.ok) {
                    setAttendance(r.data.rows);
                    setMsg("Loaded attendance (audit logged).");
                  } else setErr(r.error);
                });
              }}
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              Load sample attendance
            </button>
          ) : (
            <p className="text-sm text-zinc-500">No view access.</p>
          )}
          {c("hr.attendance", "create") ? (
            <>
              <input
                className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                value={attEmployee}
                onChange={(e) => setAttEmployee(e.target.value)}
              />
              <input
                className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                value={attStatus}
                onChange={(e) => setAttStatus(e.target.value)}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setErr(null);
                  setMsg(null);
                  startTransition(async () => {
                    const r = await actionRecordAttendance(
                      attEmployee,
                      attStatus,
                    );
                    if (r.ok) {
                      setMsg(`Attendance entry ${r.data.entryId} (audit).`);
                    } else setErr(r.error);
                  });
                }}
                className="rounded-md bg-amber-500/90 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
              >
                Record demo attendance
              </button>
            </>
          ) : null}
        </div>
        {attendance ? (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Employee</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {attendance.map((a) => (
                <tr key={a.id} className="border-t border-zinc-800">
                  <td className="py-2 font-mono text-xs">{a.id}</td>
                  <td className="py-2">{a.employee}</td>
                  <td className="py-2">{a.date}</td>
                  <td className="py-2">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );
}
