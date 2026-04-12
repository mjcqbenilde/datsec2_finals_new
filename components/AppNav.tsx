"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { hasModuleFamily } from "@/lib/permission-helpers";

const jobAreas = [
  { prefix: "finance", label: "Finance", href: "/job/finance" },
  { prefix: "hr", label: "HR", href: "/job/hr" },
  { prefix: "operations", label: "Operations", href: "/job/operations" },
  { prefix: "compliance", label: "Compliance", href: "/job/compliance" },
] as const;

type AppNavProps = {
  username: string;
  systemRoleKey: string;
  permissionKeys: string[];
};

const navLinkClassMobile =
  "block rounded-md px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white";

const navLinkClassDesktop =
  "rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white";

export function AppNav({ username, systemRoleKey, permissionKeys }: AppNavProps) {
  const router = useRouter();
  const permFingerprint = permissionKeys.join("\0");
  const keys = useMemo(
    () => new Set(permissionKeys),
    [permFingerprint],
  );
  const canUsers = keys.has("system.users:manage");
  const canLogs = keys.has("system.audit:view");

  const [navOpen, setNavOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const mobileNavRef = useRef<HTMLDivElement>(null);
  const accountShellRef = useRef<HTMLDivElement>(null);
  const navMenuId = useId();
  const accountMenuId = useId();

  const closeMenus = useCallback(() => {
    setNavOpen(false);
    setAccountOpen(false);
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (mobileNavRef.current?.contains(t)) return;
      if (accountShellRef.current?.contains(t)) return;
      setNavOpen(false);
      setAccountOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenus();
    }
    if (navOpen || accountOpen) {
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [navOpen, accountOpen, closeMenus]);

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    function closeMobileNavIfDesktop() {
      if (mq.matches) setNavOpen(false);
    }
    mq.addEventListener("change", closeMobileNavIfDesktop);
    return () => mq.removeEventListener("change", closeMobileNavIfDesktop);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
    closeMenus();
  }

  const roleLabel = systemRoleKey.replace(/_/g, " ");

  const jobLinks = jobAreas.map((j) =>
    hasModuleFamily(keys, j.prefix) ? (
      <Link key={j.href} href={j.href} className={navLinkClassDesktop}>
        {j.label}
      </Link>
    ) : null,
  );

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* Mobile: hamburger + compact home link */}
          <div
            ref={mobileNavRef}
            className="relative flex min-w-0 items-center gap-2 md:hidden"
          >
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-600 text-zinc-200 hover:bg-zinc-800"
              aria-expanded={navOpen}
              aria-controls={navMenuId}
              aria-label={navOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => {
                setNavOpen((v) => !v);
                setAccountOpen(false);
              }}
            >
              <span className="sr-only">Menu</span>
              {navOpen ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <Link
              href="/dashboard"
              className="truncate text-sm font-semibold text-zinc-100 hover:text-white"
              onClick={closeMenus}
            >
              Dashboard
            </Link>

            {navOpen ? (
              <>
                <div
                  className="fixed inset-0 z-30 bg-black/50"
                  aria-hidden
                  onClick={() => setNavOpen(false)}
                />
                <nav
                  id={navMenuId}
                  className="absolute left-0 right-0 top-full z-50 mt-0 max-h-[min(70vh,calc(100vh-5rem))] overflow-y-auto rounded-b-lg border border-t-0 border-zinc-800 bg-zinc-900 shadow-xl"
                >
                  <div className="space-y-0.5 p-2">
                    <Link href="/dashboard" className={navLinkClassMobile} onClick={closeMenus}>
                      Dashboard
                    </Link>
                    {canUsers ? (
                      <Link href="/users" className={navLinkClassMobile} onClick={closeMenus}>
                        Users
                      </Link>
                    ) : null}
                    {canLogs ? (
                      <Link href="/logs" className={navLinkClassMobile} onClick={closeMenus}>
                        Audit logs
                      </Link>
                    ) : null}
                    {jobAreas.map((j) =>
                      hasModuleFamily(keys, j.prefix) ? (
                        <Link
                          key={j.href}
                          href={j.href}
                          className={navLinkClassMobile}
                          onClick={closeMenus}
                        >
                          {j.label}
                        </Link>
                      ) : null,
                    )}
                    <div className="my-2 border-t border-zinc-800 pt-2">
                      <button
                        type="button"
                        className="w-full rounded-md border border-zinc-600 px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                        onClick={() => void logout()}
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                </nav>
              </>
            ) : null}
          </div>

          {/* Desktop: inline navigation */}
          <nav
            className="hidden min-w-0 flex-1 flex-wrap items-center gap-1 text-sm md:flex"
            aria-label="Main"
          >
            <Link href="/dashboard" className={navLinkClassDesktop}>
              Dashboard
            </Link>
            {canUsers ? (
              <Link href="/users" className={navLinkClassDesktop}>
                Users
              </Link>
            ) : null}
            {canLogs ? (
              <Link href="/logs" className={navLinkClassDesktop}>
                Audit logs
              </Link>
            ) : null}
            {jobLinks}
          </nav>
        </div>

        <div ref={accountShellRef} className="relative flex shrink-0 items-center">
          <button
            type="button"
            className="flex max-w-[min(100vw-8rem,16rem)] items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-zinc-200 hover:bg-zinc-800/80 md:max-w-xs"
            aria-expanded={accountOpen}
            aria-controls={accountMenuId}
            aria-haspopup="menu"
            id={`${accountMenuId}-trigger`}
            onClick={() => {
              setAccountOpen((v) => !v);
              setNavOpen(false);
            }}
          >
            <span className="min-w-0 flex-1 truncate">
              <span className="text-zinc-500">Signed in as</span>{" "}
              <span className="font-medium text-zinc-100">{username}</span>
            </span>
            <span className="hidden shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-amber-200/90 sm:inline">
              {roleLabel}
            </span>
            <svg
              className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${accountOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {accountOpen ? (
            <div
              id={accountMenuId}
              role="menu"
              aria-labelledby={`${accountMenuId}-trigger`}
              className="absolute right-0 top-full z-50 mt-1 min-w-[12rem] rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl"
            >
              <Link
                href="/profile"
                role="menuitem"
                className="block px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800"
                onClick={() => setAccountOpen(false)}
              >
                Profile
              </Link>
              <div className="hidden border-t border-zinc-800 md:block">
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800"
                  onClick={() => void logout()}
                >
                  Log out
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
