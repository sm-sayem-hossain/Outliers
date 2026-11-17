"use client";

import React, { useEffect } from "react";
import { X, Search, CheckCheck } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Shared admin UI kit — monochrome legal aesthetic.
// Ink/paper tokens from globals.css; semantic color ONLY via --status-risk-*.
// ─────────────────────────────────────────────────────────────────────────────

export const HAIRLINE = "border-(--text-primary)/10";

// ─── Card ────────────────────────────────────────────────────────────────────
export function AdminCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border ${HAIRLINE} bg-(--bg-card) shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ─── Mono eyebrow label ──────────────────────────────────────────────────────
export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-[10px] font-mono uppercase tracking-widest text-(--text-muted) ${className}`}>
      {children}
    </p>
  );
}

// ─── Section heading with hairline rule ──────────────────────────────────────
export function SectionHeading({ title, sub, count }: { title: string; sub?: string; count?: number }) {
  return (
    <div className="flex items-end justify-between gap-4 pb-3 border-b border-(--text-primary)/10">
      <div>
        <h2 className="text-sm font-serif font-bold text-(--text-primary)">{title}</h2>
        {sub && <p className="text-[11px] text-(--text-muted) mt-0.5">{sub}</p>}
      </div>
      {count !== undefined && (
        <span className="font-mono text-[11px] font-bold text-(--text-muted) tabular-nums shrink-0">
          {String(count).padStart(2, "0")}
        </span>
      )}
    </div>
  );
}

// ─── Stat tile ───────────────────────────────────────────────────────────────
export function StatTile({ label, value, sub, prefix = "", icon: Icon }: {
  label: string;
  value: number;
  sub?: string;
  prefix?: string;
  icon: React.ElementType;
}) {
  return (
    <div className={`p-5 rounded-2xl border ${HAIRLINE} bg-(--bg-card) hover:shadow-md transition-shadow duration-300`}>
      <div className="flex items-start justify-between mb-3">
        <Eyebrow>{label}</Eyebrow>
        <div className="p-1.5 rounded-lg bg-(--bg-surface) border border-(--text-primary)/8 text-(--text-muted)">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <p className="text-2xl font-mono font-bold text-(--text-primary) tabular-nums">
        {prefix}{value.toLocaleString()}
      </p>
      {sub && <p className="text-[10px] text-(--text-muted) mt-1 font-medium">{sub}</p>}
    </div>
  );
}

// ─── Status pill — monochrome with a single semantic dot ─────────────────────
type Tone = "neutral" | "good" | "warn" | "bad";
const toneDot: Record<Tone, string> = {
  neutral: "bg-(--text-muted)",
  good:    "bg-(--status-risk-low)",
  warn:    "bg-(--status-risk-med)",
  bad:     "bg-(--status-risk-high)",
};
const toneText: Record<Tone, string> = {
  neutral: "text-(--text-muted)",
  good:    "text-(--text-primary)",
  warn:    "text-(--text-primary)",
  bad:     "text-(--text-primary)",
};

export function StatusPill({ label, tone = "neutral", pulse = false }: { label: string; tone?: Tone; pulse?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${HAIRLINE} bg-(--bg-surface) ${toneText[tone]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${toneDot[tone]} ${pulse ? "animate-pulse" : ""}`} />
      {label}
    </span>
  );
}

export function statusTone(status: string): Tone {
  const s = (status || "").toUpperCase();
  if (["APPROVED", "PAID", "ACTIVE", "SUCCESS"].includes(s)) return "good";
  if (["PENDING", "PENDING_VERIFICATION", "EXPIRED"].includes(s)) return "warn";
  if (["FAILED", "REJECTED", "SUSPENDED", "CANCELLED"].includes(s)) return "bad";
  return "neutral";
}

// ─── Mono chip (metadata: refs, IDs, methods) ────────────────────────────────
export function MonoChip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-(--bg-surface) border border-(--text-primary)/10 text-(--text-muted) ${className}`}>
      {children}
    </span>
  );
}

// ─── Buttons ─────────────────────────────────────────────────────────────────
type ButtonVariant = "solid" | "outline" | "ghost" | "danger";
const buttonVariants: Record<ButtonVariant, string> = {
  solid:   "bg-(--text-primary) text-(--bg-primary) hover:opacity-90 shadow-sm",
  outline: "border border-(--text-primary)/15 bg-(--bg-card) text-(--text-primary) hover:bg-(--bg-surface)",
  ghost:   "text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/5",
  danger:  "border border-(--status-risk-high)/30 text-(--status-risk-high) hover:bg-(--status-risk-high)/10",
};

export function AdminButton({ onClick, variant = "outline", children, disabled, type = "button", className = "", title }: {
  onClick?: () => void;
  variant?: ButtonVariant;
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  title?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-(--text-primary) ${buttonVariants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Inputs ──────────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder, onSubmit }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onSubmit?: () => void;
}) {
  return (
    <div className="relative w-full sm:w-64">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-(--text-muted)" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && onSubmit) onSubmit(); }}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-(--text-primary)/10 bg-(--bg-card) text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--text-primary)/30 transition-colors"
      />
    </div>
  );
}

export function SelectInput({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 rounded-xl text-xs border border-(--text-primary)/10 bg-(--bg-card) text-(--text-primary) outline-none cursor-pointer focus:border-(--text-primary)/30 transition-colors"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
export function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="py-14 flex flex-col items-center justify-center gap-2 border border-dashed border-(--text-primary)/15 rounded-2xl text-(--text-muted)">
      <CheckCheck className="w-8 h-8 opacity-25" />
      <p className="text-sm font-medium opacity-70">{message}</p>
      {hint && <p className="text-[11px] opacity-50 max-w-sm text-center leading-relaxed">{hint}</p>}
    </div>
  );
}

// ─── Skeletons ───────────────────────────────────────────────────────────────
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-(--text-primary)/8 ${className}`} />;
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`p-5 rounded-2xl border ${HAIRLINE} bg-(--bg-card) flex items-center justify-between gap-4`}>
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="h-7 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className={`rounded-2xl border ${HAIRLINE} bg-(--bg-card) overflow-hidden`}>
      <div className="border-b border-(--text-primary)/10 bg-(--bg-surface) px-5 py-3.5 flex gap-8">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-2.5 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-5 py-4 border-b border-(--text-primary)/5 flex items-center gap-4 last:border-0">
          <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
          <Skeleton className="h-2.5 w-32" />
          <Skeleton className="h-2.5 w-24 ml-auto" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      ))}
    </div>
  );
}

// ─── Modal — ESC-closable, backdrop click, bottom-sheet on mobile ────────────
export function Modal({ open, onClose, title, icon: Icon, children, wide = false }: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={`w-full ${wide ? "max-w-lg" : "max-w-md"} bg-(--bg-card) rounded-t-3xl sm:rounded-2xl border border-(--text-primary)/10 shadow-2xl overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-(--text-primary)/8 bg-(--bg-surface)/60">
          <h3 className="text-sm font-bold text-(--text-primary) flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-(--text-muted)" />}
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-xl hover:bg-(--text-primary)/10 transition-colors cursor-pointer text-(--text-muted)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── Detail rows (label / value pairs) ───────────────────────────────────────
export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <span className="text-[11px] text-(--text-muted)">{label}</span>
      <span className="text-xs font-semibold text-(--text-primary) text-right break-words">{children}</span>
    </>
  );
}

export function DetailGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 }) {
  return (
    <div className={`grid gap-y-2 gap-x-4 ${cols === 2 ? "grid-cols-[1fr_auto]" : "grid-cols-1"}`}>{children}</div>
  );
}

// ─── Role badge — monochrome ─────────────────────────────────────────────────
export function RoleBadge({ role }: { role: string }) {
  const r = (role || "").toUpperCase();
  const label =
    r === "ENTERPRISE_ADMIN" ? "ENT. ADMIN" :
    r === "ENTERPRISE_MEMBER" ? "ENT. MEMBER" :
    r || "—";
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider border border-(--text-primary)/15 text-(--text-muted) uppercase">
      {label}
    </span>
  );
}

// ─── Avatar or initial ───────────────────────────────────────────────────────
export function InitialAvatar({ name, size = 36 }: { name?: string | null; size?: number }) {
  return (
    <div
      className="rounded-xl bg-(--bg-surface) border border-(--text-primary)/10 flex items-center justify-center font-serif font-bold text-(--text-primary) shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name?.charAt(0) || "—"}
    </div>
  );
}

// ─── Info banner (privacy notice, legacy queues) ─────────────────────────────
export function InfoBanner({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children?: React.ReactNode }) {
  return (
    <div className={`p-4 rounded-2xl border ${HAIRLINE} bg-(--bg-surface) flex items-start gap-3.5`}>
      <div className="w-8 h-8 rounded-xl bg-(--bg-card) border border-(--text-primary)/10 flex items-center justify-center shrink-0 mt-0.5 text-(--text-muted)">
        <Icon className="w-4 h-4" />
      </div>
      <div className="space-y-1 min-w-0">
        <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-(--text-primary)">{title}</h4>
        {children && <div className="text-xs text-(--text-muted) leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}

// ─── Error banner with retry ─────────────────────────────────────────────────
export function ErrorBanner({ message, onRetry, isRetrying, retryLabel = "Retry" }: {
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
  retryLabel?: string;
}) {
  return (
    <div className={`p-3 rounded-xl border border-(--status-risk-high)/30 bg-(--bg-card) flex items-center justify-between gap-3`}>
      <p className="text-xs text-(--text-muted)">{message}</p>
      <AdminButton variant="outline" onClick={onRetry} disabled={isRetrying}>
        {retryLabel}
      </AdminButton>
    </div>
  );
}
