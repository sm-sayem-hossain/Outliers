"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, RefreshCw, Settings, User, X } from "lucide-react";
import { Eyebrow } from "./ui";

// ─────────────────────────────────────────────────────────────────────────────
// Dedicated admin shell — replaces the floating dock inside admin areas with a
// proper sidebar (desktop) / drawer (mobile), Linear-style. URL-routed nav.
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminNavItem {
  href: string;
  icon: React.ElementType;
  labelEn: string;
  labelBn: string;
  count?: number;
}

interface AdminShellProps {
  nav: AdminNavItem[];
  eyebrow: string;
  title: string;
  subtitle?: React.ReactNode;
  /** Rendered in the top-right of the page header (refresh, primary actions). */
  headerActions?: React.ReactNode;
  /** Wired to the data context's silent refresh. */
  onRefresh?: () => void;
  isRefreshing?: boolean;
  /** Sidebar footer identity block. */
  footerEmail?: string;
  children: React.ReactNode;
}

export default function AdminShell({
  nav,
  eyebrow,
  title,
  subtitle,
  headerActions,
  onRefresh,
  isRefreshing,
  footerEmail,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  const refreshButton = onRefresh ? (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isRefreshing}
      aria-label={isRefreshing ? "Refreshing" : "Refresh"}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold border border-(--text-primary)/15 bg-(--bg-card) hover:bg-(--bg-surface) transition-colors cursor-pointer shadow-xs disabled:opacity-60 ${
        drawerOpen ? "" : "hidden sm:inline-flex"
      }`}
    >
      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
      <span className="hidden lg:inline">Refresh</span>
    </button>
  ) : null;

  const sidebar = (
    <div className="flex flex-col h-full w-60 bg-(--bg-card) print:hidden">
      {/* Identity block */}
      <div className="px-5 pt-6 pb-5 border-b border-(--text-primary)/10">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-base font-serif font-bold text-(--text-primary) tracking-tight mt-1 truncate">
          {title}
        </h2>
        {subtitle && <div className="text-[10px] text-(--text-muted) mt-1">{subtitle}</div>}
      </div>

      {/* Section nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Admin sections">
        {nav.map((item) => {
          const active =
            item.href === pathname ||
            (item.href !== "/admin" && item.href !== "/enterprise/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-mono font-bold uppercase tracking-wider transition-colors duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-(--text-primary) ${
                active
                  ? "bg-(--text-primary) text-(--bg-primary) shadow-sm"
                  : "text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/5"
              }`}
            >
              <item.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 truncate">{item.labelEn}</span>
              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] leading-none tabular-nums ${
                    active
                      ? "bg-(--bg-primary)/20 text-(--bg-primary)"
                      : "bg-(--status-risk-med)/15 text-(--text-muted)"
                  }`}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer links */}
      <div className="px-3 pb-3 pt-3 border-t border-(--text-primary)/10 space-y-1">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/5 transition-colors cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">Settings</span>
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/5 transition-colors cursor-pointer"
        >
          <User className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 truncate">Profile</span>
        </Link>
        {footerEmail && (
          <p className="px-3 pt-2 text-[9px] font-mono text-(--text-muted) truncate opacity-70">{footerEmail}</p>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="relative flex min-h-screen w-full"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      {/* Desktop sidebar */}
      <aside className="hidden md:block fixed inset-y-0 left-0 z-40 border-r border-(--text-primary)/10">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 border-r border-(--text-primary)/10 shadow-2xl">
            {sidebar}
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 md:pl-60 print:pl-0">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-40 h-14 flex items-center gap-3 px-4 bg-(--bg-primary)/95 backdrop-blur border-b border-(--text-primary)/10 print:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="p-2 -ml-2 rounded-xl hover:bg-(--text-primary)/10 transition-colors cursor-pointer text-(--text-muted)"
          >
            {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1 min-w-0">
            <Eyebrow>{eyebrow}</Eyebrow>
            <p className="text-sm font-serif font-bold text-(--text-primary) truncate leading-tight">{title}</p>
          </div>
          {refreshButton}
        </div>

        {/* Page header (desktop) */}
        <header className="hidden md:flex items-end justify-between gap-4 px-8 pt-8 pb-5 max-w-[1400px] print:hidden">
          <div className="min-w-0">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="text-xl font-serif font-bold text-(--text-primary) tracking-tight mt-0.5">{title}</h1>
            {subtitle && <div className="text-[11px] text-(--text-muted) mt-1">{subtitle}</div>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            {refreshButton}
          </div>
        </header>

        {/* Page body */}
        <main className="px-4 pb-24 md:px-8 md:pb-10 pt-5 md:pt-0 max-w-[1400px] print:p-0 print:max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
}
