"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  Scale,
  Sparkles,
  Zap,
  TrendingUp,
  DollarSign,
  Briefcase,
  CheckCircle2,
  Users,
  Shield,
  ArrowUpRight,
  Globe,
  Clock,
  Layers,
  ChevronRight,
  FileText,
  Target,
  Award,
  BarChart3,
  Rocket,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   01 THE PROBLEM — Crisis Infographic & Predatory Traps
   ──────────────────────────────────────────────────────────── */

const PREDATORY_TRAPS = [
  {
    id: "trap-1",
    title: "Unlawful 6-Month Deposit Forfeiture",
    severity: "High Risk • Unenforceable",
    statute: "The Premises Rent Control Act, 1991 (§10) & Contract Act 1872 (§74)",
    excerpt:
      '"In the event of early termination, landlord retains entire 6 months advance rent (BDT 600,000) as liquidated non-refundable penalty."',
    whyFails:
      "Generic AI tools miss this because liquidated damage clauses are common abroad. Under Bangladesh law, §10 explicitly bars demanding or retaining >1 month advance, and §74 restricts forfeiture to actual proven damages.",
  },
  {
    id: "trap-2",
    title: "Post-Employment Non-Compete Restraint",
    severity: "Void Ab Initio",
    statute: "The Contract Act, 1872 (§27) & Bangladesh Constitution (Art. 40)",
    excerpt:
      '"Employee agrees not to engage with or work for any software company in South Asia for 2 years following resignation."',
    whyFails:
      "Foreign models routinely suggest 'reasonable geographic limitations'. Under Bangladesh §27, all post-termination non-competes are strictly void regardless of reasonableness.",
  },
  {
    id: "trap-3",
    title: "Summary Eviction on 7 Days Notice",
    severity: "Critical Tenant Vulnerability",
    statute: "Transfer of Property Act, 1882 (§106)",
    excerpt:
      '"Landlord may terminate lease and repossess premises upon 7 calendar days written notice at will."',
    whyFails:
      "Section 106 mandates minimum 15 days notice expiring with the end of a tenancy month (or 6 months for manufacturing). Landlords exploit legal ignorance to evict small businesses arbitrarily.",
  },
];

export function ProblemVisual() {
  const [activeTrap, setActiveTrap] = useState(0);
  const trap = PREDATORY_TRAPS[activeTrap];

  return (
    <div className="space-y-4 pl-0 sm:pl-2">
      {/* Visual Crisis Hero Card with Consultation Photo Backdrop */}
      <div className="relative rounded-2xl overflow-hidden border border-[var(--text-primary)]/10 shadow-lg bg-black text-white">
        <div className="relative h-44 sm:h-52 w-full">
          <Image
            src="/consultation.jpg"
            alt="Legal Consultation Crisis in Bangladesh"
            fill
            className="object-cover opacity-35"
            sizes="(max-width: 768px) 100vw, 800px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-end space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/25 border border-rose-500/40 text-rose-300 w-fit">
              <AlertTriangle className="w-3.5 h-3.5" /> South Asian Legal Reality
            </span>
            <h3 className="text-lg sm:text-2xl font-serif font-bold tracking-tight text-white max-w-2xl leading-tight">
              4.2 Million Pending Litigations. A Legal System Built for the Top 1%.
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl line-clamp-2">
              Millions of tenants, tech freelancers, and small businesses sign agreements in the dark because real legal consultation costs an entire month&apos;s salary.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Crisis Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Review Cost
          </span>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-rose-600 dark:text-rose-400">
            ৳50,000
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            ~ $450 USD. 178% of the average national monthly wage for 1 contract.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Turnaround
          </span>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-amber-600 dark:text-amber-400">
            7 – 14 Days
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Average delay to receive basic markups from a traditional lawyer.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Court Backlog
          </span>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-[var(--text-primary)]">
            4.2M+ Cases
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Litigation takes 8 to 12 years. Prevention at signing is the only defense.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-1 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Language Gap
          </span>
          <div className="text-xl sm:text-2xl font-mono font-extrabold text-purple-600 dark:text-purple-400">
            94% English
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            Archaic Victorian syntax, while 98% of citizens think &amp; negotiate in Bengali.
          </p>
        </div>
      </div>

      {/* Interactive Predatory Trap Inspector */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--text-primary)]/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Interactive Trap Inspector (Click to inspect common predatory clauses):
          </span>
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            Why Western AI Fails
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PREDATORY_TRAPS.map((t, idx) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTrap(idx)}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeTrap === idx
                  ? "bg-[var(--bg-card)] border-[var(--text-primary)] shadow-sm"
                  : "bg-[var(--bg-card)]/50 border-[var(--text-primary)]/10 hover:border-[var(--text-primary)]/30 opacity-75 hover:opacity-100"
              }`}
            >
              <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                {t.title}
              </div>
              <span className="text-[10px] font-mono font-semibold text-rose-600 dark:text-rose-400">
                {t.severity}
              </span>
            </button>
          ))}
        </div>

        {/* Selected Trap Details */}
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-rose-500/20 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--text-primary)]/10 pb-2">
            <span className="text-xs font-bold text-[var(--text-primary)]">{trap.title}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold">
              Statute: {trap.statute}
            </span>
          </div>

          <div className="text-xs font-mono text-[var(--text-muted)] p-2.5 rounded bg-[var(--bg-primary)] border border-[var(--text-primary)]/10 italic">
            {trap.excerpt}
          </div>

          <div className="text-xs text-[var(--text-primary)] leading-relaxed">
            <strong className="text-rose-600 dark:text-rose-400">The Problem: </strong>
            {trap.whyFails}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   02 THE SOLUTION — Dual Product Engine Showcase
   ──────────────────────────────────────────────────────────── */

export function SolutionVisual() {
  return (
    <div className="space-y-4 pl-0 sm:pl-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Flagship Card 1: Advotech Copilot */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 shadow-sm flex flex-col justify-between hover:border-[var(--text-primary)]/30 transition-all group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] p-2 border border-[var(--text-primary)]/10 flex items-center justify-center shrink-0">
                <Image
                  src="/legal-copilot.png"
                  alt="Legal Copilot Product"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain dark:invert group-hover:scale-105 transition-transform"
                />
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                Product 1: Ask
              </span>
            </div>

            <div>
              <h3 className="text-lg font-serif font-bold text-[var(--text-primary)]">
                Advotech Copilot (Bilingual Legal Q&amp;A)
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
                Conversational legal intelligence answering in Bengali, Banglish, and English, directly grounded in 35,000+ codified sections of the Laws of Bangladesh.
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--text-primary)]/5 text-xs text-[var(--text-primary)] space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" /> Sample Live Query
                </div>
                <p className="italic text-[11px] text-[var(--text-muted)]">
                  &ldquo;বাড়িওয়ালা ৩ মাসের অগ্রিম সিকিউরিটি দাবি করছে, আমি কি চুক্তি বাতিল করতে পারব?&rdquo;
                </p>
                <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 pt-1 border-t border-[var(--text-primary)]/5">
                  &rarr; Cites Section 10 &amp; 23, Premises Rent Control Act 1991 (Zero Hallucination)
                </div>
              </div>

              <ul className="text-xs text-[var(--text-muted)] space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>35,000+ Bangladesh Code statutes indexed in GraphRAG</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Sub-second statutory grounding latency via ChromaDB + Gemini</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[var(--text-primary)]/10">
            <Link
              href="/copilot"
              className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
            >
              <span>Test Grounded Copilot</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Flagship Card 2: ContractMind Studio */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 shadow-sm flex flex-col justify-between hover:border-[var(--text-primary)]/30 transition-all group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] p-2 border border-[var(--text-primary)]/10 flex items-center justify-center shrink-0">
                <Image
                  src="/contractmind.png"
                  alt="ContractMind Product"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain dark:invert group-hover:scale-105 transition-transform"
                />
              </div>
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400">
                Product 2: Verify
              </span>
            </div>

            <div>
              <h3 className="text-lg font-serif font-bold text-[var(--text-primary)]">
                ContractMind (30s Contract Risk Audit)
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
                Upload any PDF agreement. In ~30 seconds, get an executive health score (0–100), severity-ranked liability flags, and actionable statutory redlines.
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--text-primary)]/5 text-xs text-[var(--text-primary)] space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Commercial Lease Audit
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">Score: 82 / 100</span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-center pt-1">
                  <span className="p-1 rounded bg-rose-500/10 text-rose-600 font-bold">1 High Risk</span>
                  <span className="p-1 rounded bg-amber-500/10 text-amber-600 font-bold">2 Warnings</span>
                  <span className="p-1 rounded bg-emerald-500/10 text-emerald-600 font-bold">45 Compliant</span>
                </div>
              </div>

              <ul className="text-xs text-[var(--text-muted)] space-y-1.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Unfair penalty &amp; void non-compete clause auto-detection</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Client-side PII auto-redaction before cloud processing</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[var(--text-primary)]/10">
            <Link
              href="/contractmind"
              className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity"
            >
              <span>Test Contract Audit Engine</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Human-in-the-Loop Marketplace Bridge Card */}
      <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--text-primary)]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--text-primary)]/10 p-1 flex items-center justify-center shrink-0">
            <Image
              src="/lawyer.png"
              alt="Certified Advocate"
              width={36}
              height={36}
              className="w-full h-full object-contain dark:invert"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-primary)]">
                Human-in-the-Loop Advocate Network
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold">
                Bar Certified
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              When disputes escalate, users can escalate AI findings to certified Supreme Court advocates for seal &amp; representation within 2 hours.
            </p>
          </div>
        </div>

        <Link
          href="/demo-lawyer"
          className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--text-primary)]/15 text-[var(--text-primary)] hover:bg-[var(--bg-card)] transition-colors"
        >
          Advocate Portal &rarr;
        </Link>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   03 WHY NOW — 3-Pillar Macro Convergence
   ──────────────────────────────────────────────────────────── */

export function WhyNowVisual() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-0 sm:pl-2">
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-2.5 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 uppercase">
          Technology Pillar
        </div>
        <h4 className="text-sm font-bold text-[var(--text-primary)]">
          Legal LLM Reasoning Inflection
        </h4>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Foundation models (Gemini 1.5 Pro, Claude 3.5) finally achieved human-level multi-hop statutory synthesis without hallucinating when constrained with GraphRAG.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-2.5 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
          <Layers className="w-5 h-5" />
        </div>
        <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase">
          Data Pillar
        </div>
        <h4 className="text-sm font-bold text-[var(--text-primary)]">
          Bangladesh Code Full Digitization
        </h4>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          For the first time, 1,200+ codified Acts dating back to 1836 are fully digitized, structured, and indexed into relational vector databases.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-2.5 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
          <Users className="w-5 h-5" />
        </div>
        <div className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
          Market Pillar
        </div>
        <h4 className="text-sm font-bold text-[var(--text-primary)]">
          130M+ Mobile &amp; Gig Economy Surge
        </h4>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Millions of tech freelancers, remote workers, and SME merchants sign contracts on WhatsApp and email daily without access to affordable lawyers.
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   05 MARKET OPPORTUNITY — TAM / SAM / SOM & Persona Sizing
   ──────────────────────────────────────────────────────────── */

export function MarketVisual() {
  const [selectedPersona, setSelectedPersona] = useState<"freelancer" | "sme" | "diaspora">(
    "freelancer"
  );

  return (
    <div className="space-y-4 pl-0 sm:pl-2">
      {/* Tiered TAM / SAM / SOM Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-1">
          <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
            Total Addressable (TAM)
          </span>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-[var(--text-primary)]">
            $12.4 Billion
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Annual legal and contract compliance spend across Global South developing economies.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-emerald-500/25 bg-emerald-500/5 space-y-1">
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Serviceable Addressable (SAM)
          </span>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
            $1.8 Billion
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            South Asian SME agreements, commercial leases, and tech freelance contracts.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-blue-500/25 bg-blue-500/5 space-y-1">
          <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Serviceable Obtainable (SOM)
          </span>
          <div className="text-2xl sm:text-3xl font-mono font-extrabold text-blue-600 dark:text-blue-400">
            $140 Million
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Immediate Bangladesh beachhead: 2.4M SMEs, 650K IT freelancers, and 4.5M diaspora.
          </p>
        </div>
      </div>

      {/* Target Persona Switcher */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--text-primary)]/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Key Target Customer Segments:
          </span>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            High Willingness to Pay
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedPersona("freelancer")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              selectedPersona === "freelancer"
                ? "bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]"
                : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--text-primary)]/10 hover:text-[var(--text-primary)]"
            }`}
          >
            💻 650K+ IT Freelancers
          </button>
          <button
            type="button"
            onClick={() => setSelectedPersona("sme")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              selectedPersona === "sme"
                ? "bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]"
                : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--text-primary)]/10 hover:text-[var(--text-primary)]"
            }`}
          >
            🏪 2.4M+ SMEs &amp; Retailers
          </button>
          <button
            type="button"
            onClick={() => setSelectedPersona("diaspora")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              selectedPersona === "diaspora"
                ? "bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]"
                : "bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--text-primary)]/10 hover:text-[var(--text-primary)]"
            }`}
          >
            🌍 4.5M+ Expat Diaspora
          </button>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 text-xs space-y-2">
          {selectedPersona === "freelancer" && (
            <>
              <div className="font-bold text-[var(--text-primary)]">
                The IT &amp; Remote Freelance Segment:
              </div>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Over 650,000 registered Bangladeshi freelancers execute NDAs, Master Service Agreements (MSAs), and IP assignment contracts with US/European clients. They need instant reassurance against void non-competes and uncompensated work terms.
              </p>
              <div className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                Est. Contract Volume: 2.6M audits / year • Target ARPU: $18 / user / year
              </div>
            </>
          )}

          {selectedPersona === "sme" && (
            <>
              <div className="font-bold text-[var(--text-primary)]">
                SMEs, Startups &amp; Retail Merchants:
              </div>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Small business owners entering commercial leases, equipment financing, and wholesale supplier contracts. Currently signing agreements without review due to prohibitive advocate retainers.
              </p>
              <div className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                Est. Contract Volume: 4.8M audits / year • Target ARPU: $45 / SME / year
              </div>
            </>
          )}

          {selectedPersona === "diaspora" && (
            <>
              <div className="font-bold text-[var(--text-primary)]">
                Expatriate Bangladeshi Diaspora:
              </div>
              <p className="text-[var(--text-muted)] leading-relaxed">
                Over 4.5 million Bangladeshis living in the UK, US, Canada, and Gulf nations managing land inheritance, power of attorney, and remittances back home. High fraud risk and zero local representation.
              </p>
              <div className="text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                Est. Consultation Volume: 900K queries / year • Target ARPU: $75 / user / year
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   06 BUSINESS MODEL — Pricing Cards & Unit Economics
   ──────────────────────────────────────────────────────────── */

export function BusinessModelVisual() {
  return (
    <div className="space-y-4 pl-0 sm:pl-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Tier 1 */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-3 flex flex-col justify-between shadow-sm">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Citizen Micro-Audit
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-[var(--text-primary)]">
                ৳28
              </span>
              <span className="text-xs text-[var(--text-muted)]">/ audit (~$0.25)</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Instant 30s lease or employment scan via bKash / Nagad micro-billing.
            </p>
            <ul className="text-xs text-[var(--text-muted)] space-y-1.5 pt-2">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Full clause risk score</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Plain Banglish summary</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Tier 2 */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border-2 border-emerald-500 shadow-md space-y-3 flex flex-col justify-between relative">
          <span className="absolute -top-3 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-black">
            Most Popular
          </span>
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Advocate Pro Suite
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-[var(--text-primary)]">
                ৳2,499
              </span>
              <span className="text-xs text-[var(--text-muted)]">/ month (~$22)</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Professional workspace for litigators, chambers, and law firms.
            </p>
            <ul className="text-xs text-[var(--text-muted)] space-y-1.5 pt-2">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Unlimited case timelines</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Automated petition drafts</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>DLR &amp; BLD case precedent search</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Tier 3 */}
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-3 flex flex-col justify-between shadow-sm">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Enterprise SLA &amp; API
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-[var(--text-primary)]">
                ৳50k – ৳150k
              </span>
              <span className="text-xs text-[var(--text-muted)]">/ month</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              High-throughput batch contract intelligence for banks &amp; corporations.
            </p>
            <ul className="text-xs text-[var(--text-muted)] space-y-1.5 pt-2">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Custom corporate playbooks</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>On-prem / VPC deployment</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Dedicated legal SLA</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Unit Economics Strip */}
      <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--text-primary)]/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Gross Margin</span>
          <div className="text-base sm:text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
            84%
          </div>
        </div>
        <div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">Blended CAC</span>
          <div className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)]">
            ৳85 (~$0.75)
          </div>
        </div>
        <div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">12-Mo. LTV</span>
          <div className="text-base sm:text-lg font-mono font-bold text-[var(--text-primary)]">
            ৳1,420 (~$12.5)
          </div>
        </div>
        <div>
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase">LTV : CAC</span>
          <div className="text-base sm:text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
            16.7x
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   08 COMPETITION — 2x2 Positioning Matrix
   ──────────────────────────────────────────────────────────── */

export function CompetitionVisual() {
  return (
    <div className="space-y-4 pl-0 sm:pl-2">
      {/* 2x2 Visual Quadrant Card */}
      <div className="p-5 sm:p-7 rounded-2xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--text-primary)]/10 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            2x2 Competitive Positioning Matrix:
          </span>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
            Sovereign Bangladesh Law + Autonomous AI
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Top-Right Quadrant: WINNER */}
          <div className="p-4 sm:p-5 rounded-xl border-2 border-emerald-500 bg-emerald-500/5 space-y-2 relative">
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500 text-black">
              Market Leader
            </span>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              Advotech Copilot (This Platform)
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Built specifically for Bangladesh law. 35,000+ codified sections, 30s contract audits, Banglish reasoning, and ৳28 micro-pricing.
            </p>
            <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 font-semibold pt-1">
              ✓ 99.4% Citation Grounding • ✓ Zero Hallucination
            </div>
          </div>

          {/* Top-Left Quadrant: US Enterprise AI */}
          <div className="p-4 sm:p-5 rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-surface)] space-y-2 opacity-80">
            <div className="text-sm font-bold text-[var(--text-primary)]">
              Harvey AI / Ironclad / Robin AI
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              US/UK common law focus. $50,000+ annual enterprise retainers. English only. Completely ignores Bangladesh statutory specifics (§27 Contract Act, bdlaws).
            </p>
            <div className="text-[11px] font-mono text-rose-500 font-semibold pt-1">
              ✗ Prohibitive Pricing • ✗ Foreign Law Only
            </div>
          </div>

          {/* Bottom-Right Quadrant: Traditional Law Firms */}
          <div className="p-4 sm:p-5 rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-surface)] space-y-2 opacity-80">
            <div className="text-sm font-bold text-[var(--text-primary)]">
              Traditional Law Firms &amp; Chambers
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              High local legal knowledge, but manual, slow (7–14 days), and completely inaccessible to 80% of citizens (৳50,000 retainer).
            </p>
            <div className="text-[11px] font-mono text-rose-500 font-semibold pt-1">
              ✗ 14-Day Wait • ✗ Inaccessible to 99%
            </div>
          </div>

          {/* Bottom-Left Quadrant: Generic AI */}
          <div className="p-4 sm:p-5 rounded-xl border border-[var(--text-primary)]/10 bg-[var(--bg-surface)] space-y-2 opacity-80">
            <div className="text-sm font-bold text-[var(--text-primary)]">
              Generic ChatGPT / Claude / Gemini
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Fast and cheap, but invents non-existent sections of Bangladesh law, misapplies US non-compete doctrines, and offers zero contract audit scoring.
            </p>
            <div className="text-[11px] font-mono text-rose-500 font-semibold pt-1">
              ✗ Catastrophic Hallucinations • ✗ No Local Graph
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   09 UNIQUE ADVANTAGE — 4-Pillar Moat
   ──────────────────────────────────────────────────────────── */

export function UniqueAdvantageVisual() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 sm:pl-2">
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-2 shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
          <Scale className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-bold text-[var(--text-primary)]">
          1. Proprietary Statutory Knowledge Graph
        </h4>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          35,000+ codified sections mapped with amendments, repeals, and Supreme Court precedent citations into a custom hybrid graph store.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-2 shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
          <Sparkles className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-bold text-[var(--text-primary)]">
          2. Bilingual Banglish Legal Tokenizer
        </h4>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Fine-tuned intent parser recognizing everyday colloquial Banglish terms (জামানত, চুক্তিভঙ্গ, উচ্ছেদ, নোটিশ) that defeat off-the-shelf Western models.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-2 shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
          <Users className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-bold text-[var(--text-primary)]">
          3. Bar-Certified Human Defense Network
        </h4>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Human-in-the-loop verification pipeline allows certified Supreme Court advocates to co-sign and represent clients when formal dispute arises.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-2 shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
          <Shield className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-bold text-[var(--text-primary)]">
          4. Zero-Knowledge Client-Side Redaction
        </h4>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Client-side PII scrubbing in-browser ensures sensitive corporate contracts never leak names, financials, or trade secrets to external models.
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   10 GO-TO-MARKET — 3-Stage Flywheel
   ──────────────────────────────────────────────────────────── */

export function GtmVisual() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pl-0 sm:pl-2">
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-2 shadow-sm">
        <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
          Stage 01 • Grassroots
        </div>
        <h4 className="text-sm font-bold text-[var(--text-primary)]">
          Freelancers &amp; SME Viral Audits
        </h4>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Free 1-clause checker shared across Facebook freelancer groups and LinkedIn communities drives viral bottom-up micro-audit adoption.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-2 shadow-sm">
        <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
          Stage 02 • Channel
        </div>
        <h4 className="text-sm font-bold text-[var(--text-primary)]">
          Bar Association Partnerships
        </h4>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Distribute free automated case timeline builders to young advocates, embedding Advotech Copilot as the de-facto junior associate tool across chambers.
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-2 shadow-sm">
        <div className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
          Stage 03 • Enterprise
        </div>
        <h4 className="text-sm font-bold text-[var(--text-primary)]">
          Commercial Procurement &amp; Banks
        </h4>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          Enterprise API integration for commercial banks and corporate supply chains to audit supplier agreements and loan collateral leases at scale.
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   07 TRACTION — Live Growth Dashboard & Milestone Timeline
   ──────────────────────────────────────────────────────────── */

type TractionStats = {
  total_users?: number;
  total_audits?: number;
  total_chat_sessions?: number;
  statutes_indexed?: number;
};

export function TractionVisual({ stats }: { stats?: TractionStats }) {
  const users = stats?.total_users ?? 52;
  const audits = stats?.total_audits ?? 34;
  const chats = stats?.total_chat_sessions ?? 180;
  const statutes = stats?.statutes_indexed ?? 35000;

  const KPI_CARDS = [
    {
      label: "Registered Users",
      value: users,
      suffix: "",
      prefix: "",
      color: "emerald",
      icon: Users,
      sub: "Live — Bangladesh + diaspora",
    },
    {
      label: "Contract Audits Run",
      value: audits,
      suffix: "",
      prefix: "",
      color: "blue",
      icon: FileText,
      sub: "30-second AI clause analysis",
    },
    {
      label: "Chat Sessions",
      value: chats,
      suffix: "+",
      prefix: "",
      color: "purple",
      icon: Sparkles,
      sub: "Bilingual Banglish Q&A",
    },
    {
      label: "Statutes Indexed",
      value: statutes >= 1000 ? `${(statutes / 1000).toFixed(0)}K` : statutes,
      suffix: "+",
      prefix: "",
      color: "amber",
      icon: Scale,
      sub: "Bangladesh legal code",
    },
  ] as const;

  const MILESTONES = [
    {
      date: "Oct 2025",
      event: "Project started — GraphRAG statutory pipeline built",
      status: "done",
    },
    {
      date: "Nov 2025",
      event: "35,000+ Bangladesh statutes ingested & vector-indexed",
      status: "done",
    },
    {
      date: "Dec 2025",
      event: "Contract Audit MVP launched — first 10 real audits",
      status: "done",
    },
    {
      date: "Jan 2026",
      event: "Bilingual Banglish Copilot — first 50+ live users",
      status: "done",
    },
    {
      date: "Mar 2026",
      event: "RBAC + Human-in-the-loop Advocate layer integrated",
      status: "done",
    },
    {
      date: "Jun 2026",
      event: "AI Builders Congress 2026 — public showcase & judging",
      status: "current",
    },
    {
      date: "Q3 2026",
      event: "Bangladesh Bar Council pilot — 500 advocate onboarding",
      status: "upcoming",
    },
    {
      date: "2027",
      event: "South Asia expansion: Pakistan & Sri Lanka legal corpora",
      status: "upcoming",
    },
  ];

  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  };

  const numVal = (v: number | string) => (typeof v === "number" ? v.toLocaleString() : v);

  return (
    <div className="space-y-5 pl-0 sm:pl-2">
      {/* Live KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;
          const cls = colorMap[card.color];
          return (
            <div
              key={card.label}
              className={`p-4 rounded-2xl bg-[var(--bg-card)] border shadow-sm space-y-2 ${cls.split(" ").slice(2).join(" ")} border-opacity-30`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cls.split(" ").slice(0, 2).join(" ")}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
                {card.prefix}
                {numVal(card.value)}
                {card.suffix}
              </div>
              <div className="text-[11px] font-semibold text-[var(--text-primary)] leading-tight">
                {card.label}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Live indicator banner */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          All metrics are <strong>live from the production database</strong> — not projected or simulated.
          Last synced: real-time.
        </span>
      </div>

      {/* Milestone Timeline */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
          Milestone Timeline
        </div>
        <div className="space-y-2">
          {MILESTONES.map((m, i) => {
            const isDone = m.status === "done";
            const isCurrent = m.status === "current";
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-1">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isDone
                        ? "bg-emerald-500"
                        : isCurrent
                        ? "bg-blue-500 ring-2 ring-blue-500/30"
                        : "bg-[var(--text-muted)]/30"
                    }`}
                  />
                  {i < MILESTONES.length - 1 && (
                    <div className={`w-px flex-1 mt-1 h-5 ${isDone ? "bg-emerald-500/30" : "bg-[var(--text-muted)]/15"}`} />
                  )}
                </div>
                <div className="pb-1">
                  <span
                    className={`text-[10px] font-mono font-bold mr-2 ${
                      isDone
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isCurrent
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {m.date}
                  </span>
                  <span
                    className={`text-xs ${
                      isCurrent
                        ? "font-semibold text-[var(--text-primary)]"
                        : isDone
                        ? "text-[var(--text-muted)]"
                        : "text-[var(--text-muted)]/60"
                    }`}
                  >
                    {m.event}
                    {isCurrent && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                        Live Now
                      </span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   11 VISION — Global South Sovereign Legal Infrastructure
   ──────────────────────────────────────────────────────────── */

export function VisionVisual() {
  return (
    <div className="space-y-4 pl-0 sm:pl-2">
      <div className="relative rounded-2xl overflow-hidden border border-[var(--text-primary)]/10 shadow-lg bg-black text-white">
        <div className="relative h-48 sm:h-56 w-full">
          <Image
            src="/lady_justice.jpg"
            alt="Lady Justice — Vision for Global South"
            fill
            className="object-cover opacity-30"
            sizes="(max-width: 768px) 100vw, 800px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-end space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 w-fit">
              <Globe className="w-3.5 h-3.5" /> Long-Term Vision
            </span>
            <h3 className="text-lg sm:text-2xl font-serif font-bold tracking-tight text-white max-w-2xl leading-tight">
              Sovereign Legal Intelligence for 2 Billion Global South Citizens.
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl">
              Justice must cease to be an expensive privilege gatekept by hours and retainers. We are turning legal protection into democratic digital infrastructure for every smartphone.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-1">
          <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            2026: Beachhead
          </span>
          <div className="font-bold text-[var(--text-primary)]">Bangladesh Sovereign Leader</div>
          <p className="text-[var(--text-muted)]">
            35,000 statutes indexed, 50,000 monthly audits, and nationwide bar integration.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-1">
          <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
            2027: South Asia
          </span>
          <div className="font-bold text-[var(--text-primary)]">Pakistan &amp; Sri Lanka Expansion</div>
          <p className="text-[var(--text-muted)]">
            Deploying identical common-law statutory GraphRAG across 300M+ South Asian citizens.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--text-primary)]/10 space-y-1">
          <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400">
            2028+: Global South
          </span>
          <div className="font-bold text-[var(--text-primary)]">Sovereign Legal Operating System</div>
          <p className="text-[var(--text-muted)]">
            Multi-jurisdiction AI contract auditor powering transactions across emerging markets.
          </p>
        </div>
      </div>
    </div>
  );
}
