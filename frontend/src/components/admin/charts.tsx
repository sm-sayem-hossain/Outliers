"use client";

import React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Hand-rolled monochrome charts — no chart library, theme-aware via currentColor.
// ─────────────────────────────────────────────────────────────────────────────

export function DonutChart({ segments }: { segments: { value: number; label: string }[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = 52;
  const cx = 64;
  const cy = 64;
  const circ = 2 * Math.PI * r;
  // Ink shades: full ink → mid → faint (theme-aware via currentColor + opacity).
  const opacities = [1, 0.45, 0.2];
  let cumulative = 0;
  return (
    <div className="flex items-center gap-6">
      <svg width="128" height="128" viewBox="0 0 128 128" className="shrink-0 text-(--text-primary)">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="14" className="text-(--bg-surface)" />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circ;
          const offset = -cumulative * circ;
          cumulative += pct;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeOpacity={opacities[i % opacities.length]}
              strokeWidth="14"
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={offset}
              style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "all 0.8s ease" }}
            />
          );
        })}
        <text x={cx} y={cy - 5} textAnchor="middle" fill="currentColor" fontSize="18" fontWeight="bold" fontFamily="monospace">{total}</text>
        <text x={cx} y={cy + 11} textAnchor="middle" fill="currentColor" opacity="0.45" fontSize="8" fontFamily="monospace" letterSpacing="2">TOTAL</text>
      </svg>
      <div className="space-y-2.5 flex-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0 bg-(--text-primary)"
              style={{ opacity: opacities[i % opacities.length] }}
            />
            <span className="text-[11px] text-(--text-muted) flex-1">{seg.label}</span>
            <span className="text-[11px] font-mono font-bold text-(--text-primary) tabular-nums">{seg.value}</span>
            <span className="text-[10px] text-(--text-muted) tabular-nums w-8 text-right">
              {((seg.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Hairline meter — solid ink fill on a faint track, mono amount.
export function HairlineMeter({ label, value, max, amount }: { label: string; value: number; max: number; amount: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-semibold text-(--text-muted)">{label}</span>
        <span className="text-[11px] font-mono font-bold text-(--text-primary) tabular-nums">{amount}</span>
      </div>
      <div className="h-1.5 rounded-full bg-(--text-primary)/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-(--text-primary) transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, opacity: 0.85 }}
        />
      </div>
      <div className="flex justify-end">
        <span className="text-[9px] font-mono text-(--text-muted) tabular-nums">{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}
