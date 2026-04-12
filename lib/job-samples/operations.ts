import { writeAuditLog } from "@/lib/audit";
import type { AuthUser } from "@/lib/auth";
import { hasPermissionKey } from "@/lib/rbac";
import {
  SAMPLE_INVENTORY,
  SAMPLE_ORDERS,
  SAMPLE_VENDORS,
  type InventoryRow,
  type OrderRow,
  type VendorRow,
} from "@/lib/job-samples/data";

export type JobResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function deny(): JobResult<never> {
  return { ok: false, error: "You do not have permission for this action." };
}

export async function sampleListOrders(
  user: AuthUser,
): Promise<JobResult<{ rows: OrderRow[] }>> {
  if (!hasPermissionKey(user.permissionKeys, "operations.orders", "view")) {
    return deny();
  }
  await writeAuditLog({
    userId: user.userId,
    eventType: "view",
    resourceType: "operations.orders",
    summary: "Viewed orders (sample)",
  });
  return { ok: true, data: { rows: SAMPLE_ORDERS } };
}

export async function sampleCreateOrder(
  user: AuthUser,
  customer: string,
): Promise<JobResult<{ orderId: string }>> {
  if (!hasPermissionKey(user.permissionKeys, "operations.orders", "create")) {
    return deny();
  }
  const orderId = `ORD-${5000 + Math.floor(Math.random() * 900)}`;
  await writeAuditLog({
    userId: user.userId,
    eventType: "create",
    resourceType: "operations.orders",
    resourceId: orderId,
    summary: `Created sample order ${orderId}`,
    details: { customer },
  });
  return { ok: true, data: { orderId } };
}

export async function sampleListInventory(
  user: AuthUser,
): Promise<JobResult<{ rows: InventoryRow[] }>> {
  if (!hasPermissionKey(user.permissionKeys, "operations.inventory", "view")) {
    return deny();
  }
  await writeAuditLog({
    userId: user.userId,
    eventType: "view",
    resourceType: "operations.inventory",
    summary: "Viewed inventory (sample)",
  });
  return { ok: true, data: { rows: SAMPLE_INVENTORY } };
}

export async function sampleAdjustInventory(
  user: AuthUser,
  sku: string,
  delta: number,
): Promise<JobResult<{ sku: string }>> {
  if (!hasPermissionKey(user.permissionKeys, "operations.inventory", "update")) {
    return deny();
  }
  await writeAuditLog({
    userId: user.userId,
    eventType: "update",
    resourceType: "operations.inventory",
    resourceId: sku,
    summary: `Adjusted sample inventory for ${sku}`,
    details: { delta },
  });
  return { ok: true, data: { sku } };
}

export async function sampleListVendors(
  user: AuthUser,
): Promise<JobResult<{ rows: VendorRow[] }>> {
  if (!hasPermissionKey(user.permissionKeys, "operations.vendors", "view")) {
    return deny();
  }
  await writeAuditLog({
    userId: user.userId,
    eventType: "view",
    resourceType: "operations.vendors",
    summary: "Viewed vendors (sample)",
  });
  return { ok: true, data: { rows: SAMPLE_VENDORS } };
}

export async function sampleUpdateVendorNote(
  user: AuthUser,
  vendorId: string,
  note: string,
): Promise<JobResult<{ vendorId: string }>> {
  if (!hasPermissionKey(user.permissionKeys, "operations.vendors", "update")) {
    return deny();
  }
  await writeAuditLog({
    userId: user.userId,
    eventType: "update",
    resourceType: "operations.vendors",
    resourceId: vendorId,
    summary: `Updated sample vendor ${vendorId}`,
    details: { note },
  });
  return { ok: true, data: { vendorId } };
}
