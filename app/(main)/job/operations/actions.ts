"use server";

import { getCurrentUser } from "@/lib/auth";
import {
  sampleAdjustInventory,
  sampleCreateOrder,
  sampleListInventory,
  sampleListOrders,
  sampleListVendors,
  sampleUpdateVendorNote,
} from "@/lib/job-samples/operations";

export async function actionListOrders() {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleListOrders(u);
}

export async function actionCreateOrder(customer: string) {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleCreateOrder(u, customer);
}

export async function actionListInventory() {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleListInventory(u);
}

export async function actionAdjustInventory(sku: string, delta: number) {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleAdjustInventory(u, sku, delta);
}

export async function actionListVendors() {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleListVendors(u);
}

export async function actionUpdateVendor(vendorId: string, note: string) {
  const u = await getCurrentUser();
  if (!u) return { ok: false as const, error: "Unauthorized" };
  return sampleUpdateVendorNote(u, vendorId, note);
}
