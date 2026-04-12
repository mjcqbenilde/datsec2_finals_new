import { AuditLogFilters } from "@/components/AuditLogFilters";
import {
  fetchAuditLogsFiltered,
  fetchDistinctDepartments,
  fetchDistinctEventTypes,
  fetchResourceSegmentsByDepartment,
  NULL_RESOURCE,
  splitResourceType,
  unionResourceSegmentOptions,
} from "@/lib/audit-logs-query";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

function parseList(param: string | string[] | undefined): string[] {
  if (!param) return [];
  const s = Array.isArray(param) ? param.join(",") : param;
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

/** Single department filter (first value if legacy comma list). */
function parseDepartmentSingle(
  param: string | string[] | undefined,
): string {
  const list = parseList(param);
  return list[0] ?? "";
}

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    user?: string;
    events?: string;
    dept?: string;
    res?: string;
  }>;
}) {
  await requirePermission("system.audit", "view");

  const sp = await searchParams;
  const userSearch = sp.user?.trim() ?? "";
  const eventFilter = parseList(sp.events);
  const departmentFilter = parseDepartmentSingle(sp.dept);
  const resourceSegmentFilter =
    departmentFilter === NULL_RESOURCE ? [] : parseList(sp.res);

  const [dbEventTypes, dbDeptOpts, segmentsByDept, rows] = await Promise.all([
    fetchDistinctEventTypes(),
    fetchDistinctDepartments(),
    fetchResourceSegmentsByDepartment(),
    fetchAuditLogsFiltered({
      userSearch,
      eventTypes: eventFilter,
      departmentValues: departmentFilter ? [departmentFilter] : [],
      resourceSegmentValues: resourceSegmentFilter,
    }),
  ]);

  const eventOptions = [
    ...new Set([...dbEventTypes, ...eventFilter]),
  ].sort();

  const deptKeysFromUrl = new Set(
    departmentFilter ? [departmentFilter] : [],
  );
  const resKeysFromUrl = new Set(resourceSegmentFilter);
  const departmentOptions = mergeFilterOptions(
    dbDeptOpts,
    deptKeysFromUrl,
    NULL_RESOURCE,
  );

  const baseResourceOpts = departmentFilter
    ? (segmentsByDept[departmentFilter] ?? [])
    : unionResourceSegmentOptions(segmentsByDept);
  const resourceSegmentOptions = mergeFilterOptions(
    baseResourceOpts,
    resKeysFromUrl,
    NULL_RESOURCE,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Audit logs</h1>
        <p className="mt-1 text-zinc-400">
          Use the filters above the table on large screens, or{" "}
          <strong className="font-medium text-zinc-300">Filter logs</strong> on
          small screens, to set user search, event types, department, and
          resource. Results are limited to the 500 most recent matching rows.
        </p>
      </div>

      <AuditLogFilters
        key={`${userSearch}|${eventFilter.join(",")}|${departmentFilter}|${resourceSegmentFilter.join(",")}`}
        eventOptions={eventOptions}
        departmentOptions={departmentOptions}
        resourceSegmentsByDepartment={segmentsByDept}
        initialUser={userSearch}
        initialEvents={eventFilter}
        initialDepartment={departmentFilter}
        initialResourceSegments={resourceSegmentFilter}
      />

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Time</th>
              <th className="px-3 py-2 font-medium">User</th>
              <th className="px-3 py-2 font-medium">Event</th>
              <th className="px-3 py-2 font-medium">Department</th>
              <th className="px-3 py-2 font-medium">Resource</th>
              <th className="px-3 py-2 font-medium">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-zinc-500"
                >
                  No log entries match the current filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const split = splitResourceType(r.resource_type);
                return (
                  <tr key={r.log_id} className="text-zinc-300">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-zinc-500">
                      {new Date(r.created_at).toISOString()}
                    </td>
                    <td className="px-3 py-2">
                      {r.username ?? (r.user_id ? `#${r.user_id}` : "—")}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">
                        {r.event_type}
                      </span>
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-2 font-mono text-xs text-zinc-400">
                      {split.departmentLabel}
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-2 font-mono text-xs text-zinc-500">
                      {split.resourceLabel}
                      {r.resource_id ? ` #${r.resource_id}` : ""}
                    </td>
                    <td className="max-w-xl px-3 py-2 text-zinc-400">
                      {r.summary}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function mergeFilterOptions(
  db: { value: string; label: string }[],
  urlKeys: Set<string>,
  nullToken: string,
): { value: string; label: string }[] {
  const byVal = new Map(db.map((o) => [o.value, o]));
  for (const k of urlKeys) {
    if (!byVal.has(k)) {
      byVal.set(k, {
        value: k,
        label: k === nullToken ? "(none)" : k,
      });
    }
  }
  return [...byVal.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
}
