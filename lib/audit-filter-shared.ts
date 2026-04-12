/** URL / form token for rows where `resource_type` IS NULL */
export const NULL_RESOURCE = "_null";

/** Rows with a resource type but no dot (e.g. `user`, `profile`) */
export const OTHER_DEPARTMENT = "_other";

/** Unique segment options across all departments (“All departments” resource list). */
export function unionResourceSegmentOptions(
  byDept: Record<string, { value: string; label: string }[]>,
): { value: string; label: string }[] {
  const byVal = new Map<string, string>();
  for (const opts of Object.values(byDept)) {
    for (const o of opts) {
      if (!byVal.has(o.value)) byVal.set(o.value, o.label);
    }
  }
  return [...byVal.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );
}
