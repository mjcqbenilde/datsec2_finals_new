import { NextRequest, NextResponse } from "next/server";
import { NULL_RESOURCE } from "@/lib/audit-filter-shared";
import { fetchAuditLogsFiltered } from "@/lib/audit-logs-query";
import { getCurrentUser } from "@/lib/auth";

function parseList(param: string | null): string[] {
  if (!param) return [];
  return param
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export async function GET(req: NextRequest) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!auth.permissionKeys.has("system.audit:view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userSearch = searchParams.get("user")?.trim() ?? "";
  const eventFilter = parseList(searchParams.get("events"));
  const deptList = parseList(searchParams.get("dept"));
  const departmentFilter = deptList[0] ?? "";
  const resourceSegmentFilter =
    departmentFilter === NULL_RESOURCE
      ? []
      : parseList(searchParams.get("res"));

  const rows = await fetchAuditLogsFiltered({
    userSearch,
    eventTypes: eventFilter,
    departmentValues: departmentFilter ? [departmentFilter] : [],
    resourceSegmentValues: resourceSegmentFilter,
  });

  return NextResponse.json({ logs: rows });
}
