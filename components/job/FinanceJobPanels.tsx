"use client";

import { useState, useTransition } from "react";
import {
  actionCreateTransaction,
  actionListBudget,
  actionListReports,
  actionListTransactions,
  actionUpdateReport,
} from "@/app/(main)/job/finance/actions";
import type { BudgetLine, FinanceReport, LedgerRow } from "@/lib/job-samples/data";

function can(
  permissions: string[],
  moduleKey: string,
  action: string,
): boolean {
  return permissions.includes(`${moduleKey}:${action}`);
}

export function FinanceJobPanels({
  permissions,
}: {
  permissions: string[];
}) {
  const [reports, setReports] = useState<FinanceReport[] | null>(null);
  const [budget, setBudget] = useState<BudgetLine[] | null>(null);
  const [tx, setTx] = useState<LedgerRow[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [txDesc, setTxDesc] = useState("Sample wire transfer");
  const [reportTitle, setReportTitle] = useState(
    "Q1 Revenue summary (revised)",
  );

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
        <h2 className="text-lg font-medium text-zinc-200">Financial reports</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Keys: <code className="text-zinc-400">finance.reports:view</code>,{" "}
          <code className="text-zinc-400">finance.reports:update</code>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {c("finance.reports", "view") ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setErr(null);
                setMsg(null);
                startTransition(async () => {
                  const r = await actionListReports();
                  if (r.ok) {
                    setReports(r.data.rows);
                    setMsg("Loaded reports (audit logged).");
                  } else setErr(r.error);
                });
              }}
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              Load sample reports
            </button>
          ) : (
            <p className="text-sm text-zinc-500">No view access.</p>
          )}
          {c("finance.reports", "update") ? (
            <div className="flex flex-wrap items-end gap-2">
              <input
                className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setErr(null);
                  setMsg(null);
                  startTransition(async () => {
                    const r = await actionUpdateReport("FR-001", reportTitle);
                    if (r.ok) setMsg("Report update recorded (audit).");
                    else setErr(r.error);
                  });
                }}
                className="rounded-md bg-amber-500/90 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
              >
                Simulate update FR-001
              </button>
            </div>
          ) : null}
        </div>
        {reports ? (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Period</th>
                <th className="py-2">Amount</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {reports.map((r) => (
                <tr key={r.id} className="border-t border-zinc-800">
                  <td className="py-2 font-mono text-xs">{r.id}</td>
                  <td className="py-2">{r.title}</td>
                  <td className="py-2">{r.period}</td>
                  <td className="py-2">{r.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-lg font-medium text-zinc-200">Budget</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Key: <code className="text-zinc-400">finance.budget:view</code>
        </p>
        {c("finance.budget", "view") ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setErr(null);
              setMsg(null);
              startTransition(async () => {
                const r = await actionListBudget();
                if (r.ok) {
                  setBudget(r.data.rows);
                  setMsg("Loaded budget lines (audit logged).");
                } else setErr(r.error);
              });
            }}
            className="mt-4 rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
          >
            Load sample budget
          </button>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">No view access.</p>
        )}
        {budget ? (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Allocated</th>
                <th className="py-2">Spent</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {budget.map((b) => (
                <tr key={b.id} className="border-t border-zinc-800">
                  <td className="py-2 font-mono text-xs">{b.id}</td>
                  <td className="py-2">{b.department}</td>
                  <td className="py-2">{b.allocated}</td>
                  <td className="py-2">{b.spent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-lg font-medium text-zinc-200">Transactions</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Keys: <code className="text-zinc-400">finance.transactions:view</code>,{" "}
          <code className="text-zinc-400">finance.transactions:create</code>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {c("finance.transactions", "view") ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setErr(null);
                setMsg(null);
                startTransition(async () => {
                  const r = await actionListTransactions();
                  if (r.ok) {
                    setTx(r.data.rows);
                    setMsg("Loaded transactions (audit logged).");
                  } else setErr(r.error);
                });
              }}
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              Load sample ledger
            </button>
          ) : null}
          {c("finance.transactions", "create") ? (
            <div className="flex flex-wrap items-end gap-2">
              <input
                className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setErr(null);
                  setMsg(null);
                  startTransition(async () => {
                    const r = await actionCreateTransaction(txDesc);
                    if (r.ok) {
                      setMsg(
                        `Created sample transaction ${r.data.id} (audit logged).`,
                      );
                    } else setErr(r.error);
                  });
                }}
                className="rounded-md bg-amber-500/90 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
              >
                Create demo transaction
              </button>
            </div>
          ) : null}
        </div>
        {tx ? (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Description</th>
                <th className="py-2">Amount</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {tx.map((t) => (
                <tr key={t.id} className="border-t border-zinc-800">
                  <td className="py-2 font-mono text-xs">{t.id}</td>
                  <td className="py-2">{t.date}</td>
                  <td className="py-2">{t.description}</td>
                  <td className="py-2">{t.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );
}
