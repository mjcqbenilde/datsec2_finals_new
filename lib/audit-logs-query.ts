import {
  NULL_RESOURCE,
  OTHER_DEPARTMENT,
  unionResourceSegmentOptions,
} from "@/lib/audit-filter-shared";
import { pool } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export type AuditLogRow = RowDataPacket & {
  log_id: string;
  user_id: number | null;
  username: string | null;
  event_type: string;
  resource_type: string | null;
  resource_id: string | null;
  summary: string;
  created_at: Date;
};

export { NULL_RESOURCE, OTHER_DEPARTMENT, unionResourceSegmentOptions };

export function parseResourceParam(v: string): string | null {
  return v === NULL_RESOURCE ? null : v;
}

export function encodeResourceValue(rt: string | null): string {
  return rt == null || rt === "" ? NULL_RESOURCE : rt;
}

/** Split `department.resource` for display and filtering; flat types go under Other + full label. */
export function splitResourceType(resourceType: string | null): {
  departmentKey: string | null;
  resourceKey: string | null;
  departmentLabel: string;
  resourceLabel: string;
} {
  if (resourceType == null || resourceType === "") {
    return {
      departmentKey: null,
      resourceKey: null,
      departmentLabel: "—",
      resourceLabel: "—",
    };
  }
  const dot = resourceType.indexOf(".");
  if (dot === -1) {
    return {
      departmentKey: OTHER_DEPARTMENT,
      resourceKey: resourceType,
      departmentLabel: "Other",
      resourceLabel: resourceType,
    };
  }
  const dept = resourceType.slice(0, dot);
  const rest = resourceType.slice(dot + 1);
  return {
    departmentKey: dept,
    resourceKey: rest,
    departmentLabel: dept,
    resourceLabel: rest,
  };
}

export async function fetchDistinctEventTypes(): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT al.event_type AS v
     FROM audit_logs al
     WHERE al.event_type IS NOT NULL AND al.event_type != ''
     ORDER BY al.event_type`,
  );
  return rows.map((r) => String(r.v));
}

export async function fetchDistinctDepartments(): Promise<
  { value: string; label: string }[]
> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT
        CASE
          WHEN al.resource_type IS NULL OR al.resource_type = '' THEN NULL
          WHEN INSTR(al.resource_type, '.') = 0 THEN ?
          ELSE SUBSTRING_INDEX(al.resource_type, '.', 1)
        END AS v
     FROM audit_logs al
     ORDER BY v IS NULL, v`,
    [OTHER_DEPARTMENT],
  );
  return distinctOptsWithNone(rows, {
    noneLabel: "(none)",
    labelForValue: (v) => (v === OTHER_DEPARTMENT ? "Other" : v),
  });
}

export async function fetchDistinctResourceSegments(): Promise<
  { value: string; label: string }[]
> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT
        CASE
          WHEN al.resource_type IS NULL OR al.resource_type = '' THEN NULL
          WHEN INSTR(al.resource_type, '.') = 0 THEN al.resource_type
          ELSE SUBSTRING(al.resource_type, INSTR(al.resource_type, '.') + 1)
        END AS v
     FROM audit_logs al
     ORDER BY v IS NULL, v`,
  );
  return distinctOptsWithNone(rows, { noneLabel: "(none)", labelForValue: (v) => v });
}

/** Segment options per department key (including `_null`, `_other`, and literal dept names). */
export async function fetchResourceSegmentsByDepartment(): Promise<
  Record<string, { value: string; label: string }[]>
> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT
        CASE
          WHEN al.resource_type IS NULL OR al.resource_type = '' THEN NULL
          WHEN INSTR(al.resource_type, '.') = 0 THEN ?
          ELSE SUBSTRING_INDEX(al.resource_type, '.', 1)
        END AS dept_k,
        CASE
          WHEN al.resource_type IS NULL OR al.resource_type = '' THEN NULL
          WHEN INSTR(al.resource_type, '.') = 0 THEN al.resource_type
          ELSE SUBSTRING(al.resource_type, INSTR(al.resource_type, '.') + 1)
        END AS seg
     FROM audit_logs al`,
    [OTHER_DEPARTMENT],
  );

  const buckets = new Map<string, Set<string>>();
  for (const r of rows) {
    const rawDept = r.dept_k as string | null;
    const dk =
      rawDept == null || rawDept === ""
        ? NULL_RESOURCE
        : String(rawDept);
    const rawSeg = r.seg as string | null;
    const sk =
      rawSeg == null || rawSeg === ""
        ? NULL_RESOURCE
        : String(rawSeg);
    if (!buckets.has(dk)) buckets.set(dk, new Set());
    buckets.get(dk)!.add(sk);
  }

  const out: Record<string, { value: string; label: string }[]> = {};
  for (const [dk, set] of buckets) {
    const vals = [...set].sort((a, b) => {
      if (a === NULL_RESOURCE) return -1;
      if (b === NULL_RESOURCE) return 1;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });
    out[dk] = vals.map((v) => ({
      value: v,
      label: v === NULL_RESOURCE ? "(none)" : v,
    }));
  }
  return out;
}

function distinctOptsWithNone(
  rows: RowDataPacket[],
  opts: { noneLabel: string; labelForValue: (v: string) => string },
): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  let hasNone = false;
  const seen = new Set<string>();
  for (const r of rows) {
    const v = r.v as string | null;
    if (v == null || v === "") {
      hasNone = true;
    } else if (!seen.has(v)) {
      seen.add(v);
      out.push({ value: v, label: opts.labelForValue(v) });
    }
  }
  if (hasNone) {
    out.unshift({ value: NULL_RESOURCE, label: opts.noneLabel });
  }
  return out;
}

export type LogFilters = {
  userSearch: string;
  eventTypes: string[];
  departmentValues: string[];
  resourceSegmentValues: string[];
};

export async function fetchAuditLogsFiltered(
  filters: LogFilters,
  limit = 500,
): Promise<AuditLogRow[]> {
  const { userSearch, eventTypes, departmentValues, resourceSegmentValues } =
    filters;
  const parts: string[] = ["1=1"];
  const values: unknown[] = [];

  const u = userSearch.trim();
  if (u.length > 0) {
    const term = `%${u}%`;
    parts.push(`(u.username LIKE ? OR CAST(al.user_id AS CHAR) LIKE ?)`);
    values.push(term, term);
  }

  if (eventTypes.length > 0) {
    parts.push(
      `al.event_type IN (${eventTypes.map(() => "?").join(", ")})`,
    );
    values.push(...eventTypes);
  }

  if (departmentValues.length > 0) {
    const hasNull = departmentValues.includes(NULL_RESOURCE);
    const keys = departmentValues.filter((x) => x !== NULL_RESOURCE);
    const sub: string[] = [];
    for (const k of keys) {
      if (k === OTHER_DEPARTMENT) {
        sub.push(
          `(al.resource_type IS NOT NULL AND al.resource_type != '' AND INSTR(al.resource_type, '.') = 0)`,
        );
      } else {
        sub.push(
          `(al.resource_type = ? OR al.resource_type LIKE ?)`,
        );
        values.push(k, `${k}.%`);
      }
    }
    if (hasNull) {
      sub.push(`(al.resource_type IS NULL OR al.resource_type = '')`);
    }
    if (sub.length > 0) {
      parts.push(`(${sub.join(" OR ")})`);
    }
  }

  if (resourceSegmentValues.length > 0) {
    const hasNull = resourceSegmentValues.includes(NULL_RESOURCE);
    const keys = resourceSegmentValues.filter((x) => x !== NULL_RESOURCE);
    const sub: string[] = [];
    for (const seg of keys) {
      sub.push(
        `(al.resource_type IS NOT NULL AND (
           (INSTR(al.resource_type, '.') = 0 AND al.resource_type = ?)
           OR (INSTR(al.resource_type, '.') > 0 AND SUBSTRING(al.resource_type, INSTR(al.resource_type, '.') + 1) = ?)
         ))`,
      );
      values.push(seg, seg);
    }
    if (hasNull) {
      sub.push(`(al.resource_type IS NULL OR al.resource_type = '')`);
    }
    if (sub.length > 0) {
      parts.push(`(${sub.join(" OR ")})`);
    }
  }

  const where = parts.join(" AND ");
  values.push(limit);

  const [rows] = await pool.query<AuditLogRow[]>(
    `SELECT al.log_id, al.user_id, u.username, al.event_type, al.resource_type,
            al.resource_id, al.summary, al.created_at
     FROM audit_logs al
     LEFT JOIN users u ON u.user_id = al.user_id
     WHERE ${where}
     ORDER BY al.created_at DESC
     LIMIT ?`,
    values,
  );
  return rows;
}
