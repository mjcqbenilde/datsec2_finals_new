"use client";

import { NULL_RESOURCE, unionResourceSegmentOptions } from "@/lib/audit-filter-shared";
import { useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

type FilterOpt = { value: string; label: string };

export function AuditLogFilters({
  eventOptions,
  departmentOptions,
  resourceSegmentsByDepartment,
  initialUser,
  initialEvents,
  initialDepartment,
  initialResourceSegments,
}: {
  eventOptions: string[];
  departmentOptions: FilterOpt[];
  resourceSegmentsByDepartment: Record<string, FilterOpt[]>;
  initialUser: string;
  initialEvents: string[];
  initialDepartment: string;
  initialResourceSegments: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const [desktopMenu, setDesktopMenu] = useState<null | "events" | "resource">(
    null,
  );
  const [portalReady, setPortalReady] = useState(false);
  const [desktopPopoverPos, setDesktopPopoverPos] = useState({
    top: 0,
    left: 0,
    width: 320,
  });
  const desktopEventsBtnRef = useRef<HTMLButtonElement>(null);
  const desktopResourceBtnRef = useRef<HTMLButtonElement>(null);
  const desktopPopoverRef = useRef<HTMLDivElement>(null);

  const [userSearch, setUserSearch] = useState(initialUser);
  const [events, setEvents] = useState<Record<string, boolean>>(() =>
    toSet(initialEvents, eventOptions),
  );
  const [department, setDepartment] = useState(initialDepartment);
  const [resourceSegments, setResourceSegments] = useState<
    Record<string, boolean>
  >(() =>
    toSetForDepartment(
      initialResourceSegments,
      initialDepartment,
      resourceSegmentsByDepartment,
    ),
  );

  const showResourceFilter = department !== NULL_RESOURCE;

  const availableResourceOpts = useMemo(() => {
    if (!department) {
      return unionResourceSegmentOptions(resourceSegmentsByDepartment);
    }
    return resourceSegmentsByDepartment[department] ?? [];
  }, [department, resourceSegmentsByDepartment]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const updateDesktopPopoverPosition = useCallback(() => {
    if (!desktopMenu) return;
    const btn =
      desktopMenu === "events"
        ? desktopEventsBtnRef.current
        : desktopResourceBtnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const panelWidth = Math.max(320, r.width);
    let left = r.left;
    if (left + panelWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - panelWidth - 8);
    }
    setDesktopPopoverPos({
      top: r.bottom + 6,
      left,
      width: panelWidth,
    });
  }, [desktopMenu]);

  useLayoutEffect(() => {
    if (!desktopMenu || !portalReady) return;
    updateDesktopPopoverPosition();
  }, [desktopMenu, portalReady, updateDesktopPopoverPosition]);

  useEffect(() => {
    if (!desktopMenu) return;
    window.addEventListener("scroll", updateDesktopPopoverPosition, true);
    window.addEventListener("resize", updateDesktopPopoverPosition);
    return () => {
      window.removeEventListener("scroll", updateDesktopPopoverPosition, true);
      window.removeEventListener("resize", updateDesktopPopoverPosition);
    };
  }, [desktopMenu, updateDesktopPopoverPosition]);

  useEffect(() => {
    if (!desktopMenu) return;
    function onDocDown(e: MouseEvent) {
      const t = e.target as Node;
      if (desktopEventsBtnRef.current?.contains(t)) return;
      if (desktopResourceBtnRef.current?.contains(t)) return;
      if (desktopPopoverRef.current?.contains(t)) return;
      setDesktopMenu(null);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [desktopMenu]);

  useEffect(() => {
    if (!desktopMenu) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDesktopMenu(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [desktopMenu]);

  useEffect(() => {
    if (!open) return;
    setUserSearch(initialUser);
    setEvents(toSet(initialEvents, eventOptions));
    setDepartment(initialDepartment);
    setResourceSegments(
      toSetForDepartment(
        initialResourceSegments,
        initialDepartment,
        resourceSegmentsByDepartment,
      ),
    );
  }, [
    open,
    initialUser,
    initialEvents,
    initialDepartment,
    initialResourceSegments,
    eventOptions,
    resourceSegmentsByDepartment,
  ]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("input,button")?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(max-width: 767px)");
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onDepartmentChange = useCallback((value: string) => {
    setDepartment(value);
    setResourceSegments({});
    setDesktopMenu(null);
  }, []);

  const applyUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    const u = userSearch.trim();
    if (u) params.set("user", u);
    else params.delete("user");

    const ev = Object.entries(events)
      .filter(([, on]) => on)
      .map(([k]) => k);
    if (ev.length > 0) params.set("events", ev.join(","));
    else params.delete("events");

    if (department) params.set("dept", department);
    else params.delete("dept");

    if (department === NULL_RESOURCE) {
      params.delete("res");
    } else {
      const rseg = Object.entries(resourceSegments)
        .filter(([, on]) => on)
        .map(([k]) => k);
      if (rseg.length > 0) params.set("res", rseg.join(","));
      else params.delete("res");
    }

    const q = params.toString();
    startTransition(() => {
      setDesktopMenu(null);
      router.push(q ? `/logs?${q}` : "/logs");
      setOpen(false);
    });
  }, [department, events, resourceSegments, router, searchParams, userSearch]);

  const clearAll = useCallback(() => {
    setUserSearch("");
    setEvents({});
    setDepartment("");
    setResourceSegments({});
    setDesktopMenu(null);
    startTransition(() => {
      router.push("/logs");
      setOpen(false);
    });
  }, [router]);

  const eventList = useMemo(
    () => eventOptions.map((e) => ({ key: e, label: e })),
    [eventOptions],
  );

  const appliedEventCount = initialEvents.length;
  const appliedResCount = initialResourceSegments.length;
  const hasUser = initialUser.trim().length > 0;
  const hasDept = initialDepartment.length > 0;
  const hasAnyFilter =
    hasUser || appliedEventCount > 0 || hasDept || appliedResCount > 0;

  const editingEventCount = Object.values(events).filter(Boolean).length;
  const editingResCount = Object.values(resourceSegments).filter(Boolean).length;

  const departmentLabelApplied = useMemo(() => {
    if (!initialDepartment) return null;
    const o = departmentOptions.find((x) => x.value === initialDepartment);
    return o?.label ?? initialDepartment;
  }, [initialDepartment, departmentOptions]);

  const editingDepartmentSummaryLabel = useMemo(() => {
    if (!department) return "all departments";
    const o = departmentOptions.find((x) => x.value === department);
    return o?.label ?? department;
  }, [department, departmentOptions]);

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (hasUser) parts.push(`User “${initialUser.trim()}”`);
    if (appliedEventCount > 0) {
      parts.push(
        `${appliedEventCount} event type${appliedEventCount === 1 ? "" : "s"}`,
      );
    }
    if (departmentLabelApplied) {
      parts.push(`Department ${departmentLabelApplied}`);
    }
    if (appliedResCount > 0) {
      parts.push(
        `${appliedResCount} resource${appliedResCount === 1 ? "" : "s"}`,
      );
    }
    return parts;
  }, [
    hasUser,
    initialUser,
    appliedEventCount,
    departmentLabelApplied,
    appliedResCount,
  ]);

  const filterFieldsModal = (idPrefix: string) => (
    <div className="space-y-6">
      <div>
        <label
          className="text-xs font-medium text-zinc-500"
          htmlFor={`${idPrefix}-user`}
        >
          User
        </label>
        <p className="mb-2 text-xs text-zinc-600">
          Username or user ID (partial match).
        </p>
        <input
          id={`${idPrefix}-user`}
          type="search"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              applyUrl();
            }
          }}
          placeholder="e.g. admin or 1"
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
        />
      </div>

      <details className="group rounded-lg border border-zinc-800 bg-zinc-950/50 open:border-zinc-700">
        <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-zinc-300 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-2">
            Event type
            <span className="text-xs font-normal text-zinc-500">
              {eventList.length} option{eventList.length === 1 ? "" : "s"}
              {editingEventCount > 0
                ? ` · ${editingEventCount} selected`
                : ""}
            </span>
          </span>
        </summary>
        <div className="border-t border-zinc-800 px-3 pb-3 pt-2">
          <p className="mb-2 text-xs text-zinc-600">
            Checked types are required; leave all off to skip this filter.
          </p>
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {eventList.length === 0 ? (
              <span className="text-sm text-zinc-500">
                No events in log yet.
              </span>
            ) : (
              eventList.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800/80"
                >
                  <input
                    type="checkbox"
                    checked={events[key] ?? false}
                    onChange={(e) =>
                      setEvents((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                    className="rounded border-zinc-600"
                  />
                  <span className="font-mono text-xs">{label}</span>
                </label>
              ))
            )}
          </div>
        </div>
      </details>

      <div>
        <label
          className="text-xs font-medium text-zinc-500"
          htmlFor={`${idPrefix}-dept`}
        >
          Department
        </label>
        <p className="mb-2 text-xs text-zinc-600">
          First segment of dotted resource types (e.g.{" "}
          <span className="font-mono">finance</span> from{" "}
          <span className="font-mono">finance.report</span>). Choose “All
          departments” to filter resources across every module. “(none)” limits
          to rows with no resource type; resource filters are hidden for that
          case.
        </p>
        <select
          id={`${idPrefix}-dept`}
          value={department}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        >
          <option value="">All departments</option>
          {departmentOptions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {showResourceFilter ? (
        <details className="group rounded-lg border border-zinc-800 bg-zinc-950/50 open:border-zinc-700">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-zinc-300 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              Resource
              <span className="text-xs font-normal text-zinc-500">
                {availableResourceOpts.length} option
                {availableResourceOpts.length === 1 ? "" : "s"}
                {` · ${editingDepartmentSummaryLabel}`}
                {editingResCount > 0
                  ? ` · ${editingResCount} selected`
                  : ""}
              </span>
            </span>
          </summary>
          <div className="border-t border-zinc-800 px-3 pb-3 pt-2">
            <p className="mb-2 text-xs text-zinc-600">
              {department
                ? "Only resource values that appear under the selected department in the log data."
                : "Resources from every department; same name in two modules shares one checkbox."}{" "}
              “(none)” matches rows with no resource type.
            </p>
            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {availableResourceOpts.length === 0 ? (
                <span className="text-sm text-zinc-500">
                  No resource values for this department.
                </span>
              ) : (
                availableResourceOpts.map((r) => (
                  <label
                    key={r.value}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800/80"
                  >
                    <input
                      type="checkbox"
                      checked={resourceSegments[r.value] ?? false}
                      onChange={(e) =>
                        setResourceSegments((prev) => ({
                          ...prev,
                          [r.value]: e.target.checked,
                        }))
                      }
                      className="rounded border-zinc-600"
                    />
                    <span className="font-mono text-xs">{r.label}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </details>
      ) : null}
    </div>
  );

  const filterActionRow = (showCancel: boolean) => (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => applyUrl()}
        className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
      >
        {pending ? "Applying…" : "Apply filters"}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => clearAll()}
        className="rounded-md border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
      >
        Clear all
      </button>
      {showCancel ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="ml-auto rounded-md px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        >
          Cancel
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 md:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-500">Filters</p>
            {hasAnyFilter ? (
              <p
                className="mt-1 truncate text-sm text-zinc-300"
                title={summary.join(" · ")}
              >
                {summary.join(" · ")}
              </p>
            ) : (
              <p className="mt-1 text-sm text-zinc-500">No filters applied</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-md border border-zinc-600 bg-zinc-800/80 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700"
          >
            {hasAnyFilter ? "Edit filters" : "Filter logs"}
          </button>
        </div>
      </div>

      <section
        className="hidden overflow-visible rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-3 md:block"
        aria-labelledby="audit-filters-heading-desktop"
      >
        <h2 id="audit-filters-heading-desktop" className="sr-only">
          Filter audit logs
        </h2>
        <div className="flex min-w-0 flex-nowrap items-end gap-3 overflow-visible">
          <div className="flex min-w-0 flex-1 flex-nowrap items-end gap-3 overflow-visible pb-0.5">
            <div className="w-40 min-w-[10rem] shrink-0">
              <label
                className="mb-1 block text-xs font-medium text-zinc-500"
                htmlFor="audit-desk-user"
                title="Username or user ID (partial match)"
              >
                User
              </label>
              <input
                id="audit-desk-user"
                type="search"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyUrl();
                  }
                }}
                placeholder="Search…"
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-600"
              />
            </div>

            <div className="shrink-0">
              <p className="mb-1 text-xs font-medium text-zinc-500">Events</p>
              <button
                type="button"
                ref={desktopEventsBtnRef}
                aria-expanded={desktopMenu === "events"}
                aria-haspopup="dialog"
                onClick={() =>
                  setDesktopMenu((m) => (m === "events" ? null : "events"))
                }
                className="flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800/80"
              >
                Select…
                <span className="text-xs font-normal text-zinc-500">
                  {editingEventCount > 0 ? `${editingEventCount} · ` : ""}
                  {eventList.length}
                </span>
              </button>
            </div>

            <div className="w-36 min-w-[9rem] shrink-0">
              <label
                className="mb-1 block text-xs font-medium text-zinc-500"
                htmlFor="audit-desk-dept"
                title='Module prefix (e.g. "finance" from finance.report). (none) hides resource filters.'
              >
                Department
              </label>
              <select
                id="audit-desk-dept"
                value={department}
                onChange={(e) => onDepartmentChange(e.target.value)}
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 text-sm text-zinc-100"
              >
                <option value="">All</option>
                {departmentOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {showResourceFilter ? (
              <div className="shrink-0">
                <p className="mb-1 text-xs font-medium text-zinc-500">
                  Resource
                </p>
                <button
                  type="button"
                  ref={desktopResourceBtnRef}
                  aria-expanded={desktopMenu === "resource"}
                  aria-haspopup="dialog"
                  onClick={() =>
                    setDesktopMenu((m) =>
                      m === "resource" ? null : "resource",
                    )
                  }
                  className="flex h-10 max-w-[11rem] cursor-pointer items-center gap-1.5 truncate rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800/80"
                >
                  Select…
                  <span className="shrink-0 text-xs font-normal text-zinc-500">
                    {editingResCount > 0 ? `${editingResCount} · ` : ""}
                    {availableResourceOpts.length}
                  </span>
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 gap-2 border-l border-zinc-700 pl-3">
            {filterActionRow(false)}
          </div>
        </div>
      </section>

      {portalReady && desktopMenu && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={desktopPopoverRef}
              role="dialog"
              aria-label={
                desktopMenu === "events" ? "Event types" : "Resource types"
              }
              className="fixed z-[200] max-h-[min(70vh,24rem)] overflow-y-auto rounded-md border border-zinc-700 bg-zinc-900 p-3 shadow-2xl shadow-black/40"
              style={{
                top: desktopPopoverPos.top,
                left: desktopPopoverPos.left,
                width: desktopPopoverPos.width,
                maxWidth: "min(100vw - 16px, 24rem)",
              }}
            >
              {desktopMenu === "events" ? (
                <>
                  <p className="mb-2 text-xs text-zinc-500">
                    Checked types are required; leave all off to skip.
                  </p>
                  <div className="space-y-1.5">
                    {eventList.length === 0 ? (
                      <span className="text-sm text-zinc-500">
                        No events yet.
                      </span>
                    ) : (
                      eventList.map(({ key, label }) => (
                        <label
                          key={key}
                          className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm text-zinc-300 hover:bg-zinc-800/80"
                        >
                          <input
                            type="checkbox"
                            checked={events[key] ?? false}
                            onChange={(e) =>
                              setEvents((prev) => ({
                                ...prev,
                                [key]: e.target.checked,
                              }))
                            }
                            className="rounded border-zinc-600"
                          />
                          <span className="font-mono text-xs">{label}</span>
                        </label>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-2 text-xs text-zinc-500">
                    {department
                      ? "Values for this department in the log data."
                      : "Across all departments."}{" "}
                    “(none)” = no resource type.
                  </p>
                  <div className="space-y-1.5">
                    {availableResourceOpts.length === 0 ? (
                      <span className="text-sm text-zinc-500">None.</span>
                    ) : (
                      availableResourceOpts.map((r) => (
                        <label
                          key={r.value}
                          className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm text-zinc-300 hover:bg-zinc-800/80"
                        >
                          <input
                            type="checkbox"
                            checked={resourceSegments[r.value] ?? false}
                            onChange={(e) =>
                              setResourceSegments((prev) => ({
                                ...prev,
                                [r.value]: e.target.checked,
                              }))
                            }
                            className="rounded border-zinc-600"
                          />
                          <span className="font-mono text-xs">{r.label}</span>
                        </label>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>,
            document.body,
          )
        : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:hidden"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-filters-title-mobile"
            className="relative z-10 flex max-h-[min(85vh,720px)] w-full max-w-lg flex-col rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/50"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
              <h2
                id="audit-filters-title-mobile"
                className="text-base font-semibold text-zinc-100"
              >
                Filter audit logs
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {filterFieldsModal("audit-mob")}
            </div>

            <div className="shrink-0 border-t border-zinc-800 px-4 py-3">
              {filterActionRow(true)}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function toSet(selected: string[], allKeys: string[]): Record<string, boolean> {
  const o: Record<string, boolean> = {};
  const set = new Set(selected);
  for (const k of allKeys) {
    if (set.has(k)) o[k] = true;
  }
  return o;
}

function toSetForDepartment(
  selected: string[],
  dept: string,
  byDept: Record<string, FilterOpt[]>,
): Record<string, boolean> {
  if (dept === NULL_RESOURCE) {
    return {};
  }
  const opts = dept
    ? (byDept[dept] ?? [])
    : unionResourceSegmentOptions(byDept);
  return toSet(selected, opts.map((o) => o.value));
}
