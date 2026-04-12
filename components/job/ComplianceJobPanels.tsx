"use client";

import { useState, useTransition } from "react";
import {
  actionAckPolicy,
  actionCompleteTraining,
  actionListChecklists,
  actionListPolicies,
  actionListTraining,
  actionUpdateChecklist,
} from "@/app/(main)/job/compliance/actions";
import type { ChecklistRow, PolicyRow, TrainingRow } from "@/lib/job-samples/data";

function can(
  permissions: string[],
  moduleKey: string,
  action: string,
): boolean {
  return permissions.includes(`${moduleKey}:${action}`);
}

export function ComplianceJobPanels({
  permissions,
}: {
  permissions: string[];
}) {
  const [policies, setPolicies] = useState<PolicyRow[] | null>(null);
  const [training, setTraining] = useState<TrainingRow[] | null>(null);
  const [checklists, setChecklists] = useState<ChecklistRow[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [clDone, setClDone] = useState(5);

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
        <h2 className="text-lg font-medium text-zinc-200">Policies</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Keys: <code className="text-zinc-400">compliance.policies:view</code>,{" "}
          <code className="text-zinc-400">compliance.policies:update</code>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {c("compliance.policies", "view") ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setErr(null);
                setMsg(null);
                startTransition(async () => {
                  const r = await actionListPolicies();
                  if (r.ok) {
                    setPolicies(r.data.rows);
                    setMsg("Loaded policies (audit logged).");
                  } else setErr(r.error);
                });
              }}
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              Load sample policies
            </button>
          ) : (
            <p className="text-sm text-zinc-500">No view access.</p>
          )}
          {c("compliance.policies", "update") ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setErr(null);
                setMsg(null);
                startTransition(async () => {
                  const r = await actionAckPolicy("P-1");
                  if (r.ok) {
                    setMsg(`Acknowledged policy ${r.data.policyId} (audit).`);
                  } else setErr(r.error);
                });
              }}
              className="rounded-md bg-amber-500/90 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
            >
              Acknowledge P-1 (demo)
            </button>
          ) : null}
        </div>
        {policies ? (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Version</th>
                <th className="py-2">Ack required</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {policies.map((p) => (
                <tr key={p.id} className="border-t border-zinc-800">
                  <td className="py-2 font-mono text-xs">{p.id}</td>
                  <td className="py-2">{p.title}</td>
                  <td className="py-2">{p.version}</td>
                  <td className="py-2">{p.ackRequired ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-lg font-medium text-zinc-200">Training</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Keys: <code className="text-zinc-400">compliance.training:view</code>,{" "}
          <code className="text-zinc-400">compliance.training:update</code>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {c("compliance.training", "view") ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setErr(null);
                setMsg(null);
                startTransition(async () => {
                  const r = await actionListTraining();
                  if (r.ok) {
                    setTraining(r.data.rows);
                    setMsg("Loaded training (audit logged).");
                  } else setErr(r.error);
                });
              }}
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              Load sample training
            </button>
          ) : (
            <p className="text-sm text-zinc-500">No view access.</p>
          )}
          {c("compliance.training", "update") ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setErr(null);
                setMsg(null);
                startTransition(async () => {
                  const r = await actionCompleteTraining("T-1");
                  if (r.ok) {
                    setMsg(`Training ${r.data.trainingId} marked complete (audit).`);
                  } else setErr(r.error);
                });
              }}
              className="rounded-md bg-amber-500/90 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
            >
              Complete T-1 (demo)
            </button>
          ) : null}
        </div>
        {training ? (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Course</th>
                <th className="py-2 pr-4">Due</th>
                <th className="py-2">Done</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {training.map((t) => (
                <tr key={t.id} className="border-t border-zinc-800">
                  <td className="py-2 font-mono text-xs">{t.id}</td>
                  <td className="py-2">{t.course}</td>
                  <td className="py-2">{t.due}</td>
                  <td className="py-2">{t.completed ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-lg font-medium text-zinc-200">Checklists</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Keys: <code className="text-zinc-400">compliance.checklists:view</code>,{" "}
          <code className="text-zinc-400">compliance.checklists:update</code>
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          {c("compliance.checklists", "view") ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setErr(null);
                setMsg(null);
                startTransition(async () => {
                  const r = await actionListChecklists();
                  if (r.ok) {
                    setChecklists(r.data.rows);
                    setMsg("Loaded checklists (audit logged).");
                  } else setErr(r.error);
                });
              }}
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              Load sample checklists
            </button>
          ) : (
            <p className="text-sm text-zinc-500">No view access.</p>
          )}
          {c("compliance.checklists", "update") ? (
            <>
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                Items done
                <input
                  type="number"
                  min={0}
                  max={20}
                  className="w-16 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                  value={clDone}
                  onChange={(e) => setClDone(Number(e.target.value))}
                />
              </label>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setErr(null);
                  setMsg(null);
                  startTransition(async () => {
                    const r = await actionUpdateChecklist("C-1", clDone);
                    if (r.ok) {
                      setMsg(`Checklist ${r.data.checklistId} progress (audit).`);
                    } else setErr(r.error);
                  });
                }}
                className="rounded-md bg-amber-500/90 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
              >
                Update C-1 progress
              </button>
            </>
          ) : null}
        </div>
        {checklists ? (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2">Progress</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {checklists.map((c) => (
                <tr key={c.id} className="border-t border-zinc-800">
                  <td className="py-2 font-mono text-xs">{c.id}</td>
                  <td className="py-2">{c.name}</td>
                  <td className="py-2">
                    {c.itemsDone}/{c.itemsTotal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );
}
