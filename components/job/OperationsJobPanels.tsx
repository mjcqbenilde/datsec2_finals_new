"use client";

import { useState, useTransition } from "react";
import {
  actionAdjustInventory,
  actionCreateOrder,
  actionListInventory,
  actionListOrders,
  actionListVendors,
  actionUpdateVendor,
} from "@/app/(main)/job/operations/actions";
import type { InventoryRow, OrderRow, VendorRow } from "@/lib/job-samples/data";

function can(
  permissions: string[],
  moduleKey: string,
  action: string,
): boolean {
  return permissions.includes(`${moduleKey}:${action}`);
}

export function OperationsJobPanels({
  permissions,
}: {
  permissions: string[];
}) {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [inventory, setInventory] = useState<InventoryRow[] | null>(null);
  const [vendors, setVendors] = useState<VendorRow[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [customer, setCustomer] = useState("Demo buyer Inc.");
  const [sku, setSku] = useState("SKU-ALPHA");
  const [delta, setDelta] = useState(5);
  const [vendorNote, setVendorNote] = useState("Renewal scheduled");

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
        <h2 className="text-lg font-medium text-zinc-200">Orders</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Keys: <code className="text-zinc-400">operations.orders:view</code>,{" "}
          <code className="text-zinc-400">operations.orders:create</code>
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          {c("operations.orders", "view") ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setErr(null);
                setMsg(null);
                startTransition(async () => {
                  const r = await actionListOrders();
                  if (r.ok) {
                    setOrders(r.data.rows);
                    setMsg("Loaded orders (audit logged).");
                  } else setErr(r.error);
                });
              }}
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              Load sample orders
            </button>
          ) : (
            <p className="text-sm text-zinc-500">No view access.</p>
          )}
          {c("operations.orders", "create") ? (
            <>
              <input
                className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setErr(null);
                  setMsg(null);
                  startTransition(async () => {
                    const r = await actionCreateOrder(customer);
                    if (r.ok) {
                      setMsg(`Created sample order ${r.data.orderId} (audit).`);
                    } else setErr(r.error);
                  });
                }}
                className="rounded-md bg-amber-500/90 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
              >
                Create demo order
              </button>
            </>
          ) : null}
        </div>
        {orders ? (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-zinc-800">
                  <td className="py-2 font-mono text-xs">{o.id}</td>
                  <td className="py-2">{o.customer}</td>
                  <td className="py-2">{o.total}</td>
                  <td className="py-2">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-lg font-medium text-zinc-200">Inventory</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Keys: <code className="text-zinc-400">operations.inventory:view</code>,{" "}
          <code className="text-zinc-400">operations.inventory:update</code>
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          {c("operations.inventory", "view") ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setErr(null);
                setMsg(null);
                startTransition(async () => {
                  const r = await actionListInventory();
                  if (r.ok) {
                    setInventory(r.data.rows);
                    setMsg("Loaded inventory (audit logged).");
                  } else setErr(r.error);
                });
              }}
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              Load sample inventory
            </button>
          ) : null}
          {c("operations.inventory", "update") ? (
            <>
              <input
                className="w-28 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
              <input
                type="number"
                className="w-20 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                value={delta}
                onChange={(e) => setDelta(Number(e.target.value))}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setErr(null);
                  setMsg(null);
                  startTransition(async () => {
                    const r = await actionAdjustInventory(sku, delta);
                    if (r.ok) {
                      setMsg(`Inventory adjustment for ${r.data.sku} (audit).`);
                    } else setErr(r.error);
                  });
                }}
                className="rounded-md bg-amber-500/90 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
              >
                Simulate adjustment
              </button>
            </>
          ) : null}
        </div>
        {inventory ? (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">SKU</th>
                <th className="py-2 pr-4">Qty</th>
                <th className="py-2">Location</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {inventory.map((i) => (
                <tr key={i.id} className="border-t border-zinc-800">
                  <td className="py-2 font-mono text-xs">{i.id}</td>
                  <td className="py-2">{i.sku}</td>
                  <td className="py-2">{i.qty}</td>
                  <td className="py-2">{i.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="text-lg font-medium text-zinc-200">Vendors</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Keys: <code className="text-zinc-400">operations.vendors:view</code>,{" "}
          <code className="text-zinc-400">operations.vendors:update</code>
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-2">
          {c("operations.vendors", "view") ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setErr(null);
                setMsg(null);
                startTransition(async () => {
                  const r = await actionListVendors();
                  if (r.ok) {
                    setVendors(r.data.rows);
                    setMsg("Loaded vendors (audit logged).");
                  } else setErr(r.error);
                });
              }}
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              Load sample vendors
            </button>
          ) : (
            <p className="text-sm text-zinc-500">No view access.</p>
          )}
          {c("operations.vendors", "update") ? (
            <>
              <input
                className="flex-1 min-w-[200px] rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm"
                value={vendorNote}
                onChange={(e) => setVendorNote(e.target.value)}
              />
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setErr(null);
                  setMsg(null);
                  startTransition(async () => {
                    const r = await actionUpdateVendor("V-01", vendorNote);
                    if (r.ok) {
                      setMsg(`Vendor ${r.data.vendorId} update (audit).`);
                    } else setErr(r.error);
                  });
                }}
                className="rounded-md bg-amber-500/90 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
              >
                Simulate update V-01
              </button>
            </>
          ) : null}
        </div>
        {vendors ? (
          <table className="mt-4 w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2">Contract end</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {vendors.map((v) => (
                <tr key={v.id} className="border-t border-zinc-800">
                  <td className="py-2 font-mono text-xs">{v.id}</td>
                  <td className="py-2">{v.name}</td>
                  <td className="py-2">{v.contract}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );
}
