"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCompanyData } from "./company-data";
import { useLanguage } from "@/context/LanguageContext";
import { InviteMemberModal } from "./_components/modals";
import {
  AdminCard, Eyebrow, StatusPill, MonoChip, AdminButton, ErrorBanner, InfoBanner, Skeleton,
} from "@/components/admin/ui";
import { HairlineMeter } from "@/components/admin/charts";
import {
  Users, Coins, ShieldCheck, FileText, Lock, UserPlus, ArrowUpRight, Copy, Check, ShieldAlert,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// /enterprise/admin — seats, credit pool, playbook compliance, audit trail.
// ─────────────────────────────────────────────────────────────────────────────

export default function EnterpriseOverviewPage() {
  const { language } = useLanguage();
  const isBn = language === "bn";
  const {
    isLoading, loadError, refetchAll, organization, usedThisMonth,
    playbookRules, auditLogs,
  } = useCompanyData();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyReferCode = () => {
    if (!organization?.referCode) return;
    navigator.clipboard.writeText(organization.referCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const seatPct = organization && organization.totalSeats > 0
    ? Math.min(100, (organization.usedSeats / organization.totalSeats) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {loadError && (
        <ErrorBanner
          message={loadError}
          onRetry={refetchAll}
          retryLabel={isBn ? "রি-ট্রাই" : "Retry"}
        />
      )}

      {/* Privacy notice */}
      <InfoBanner icon={Lock} title={isBn ? "জিরো-নলেজ মেম্বার প্রাইভেসি সক্রিয়" : "Zero-Knowledge Member Privacy Enforced"}>
        {isBn
          ? "এন্টারপ্রাইজ অ্যাডমিন সদস্যদের ব্যক্তিগত চ্যাট বা চুক্তিপত্র দেখতে পারেন না। সদস্য নিজে শেয়ার করলে কেবল কোম্পানি ভল্টে দৃশ্যমান হবে।"
          : "Enterprise Admins cannot inspect individual members' private chats or unshared contracts. Contracts become visible only when shared to the Company Vault."}
      </InfoBanner>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Seats */}
        <AdminCard className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Eyebrow>{isBn ? "সিট ব্যবহার" : "SEAT UTILIZATION"}</Eyebrow>
            <Users className="w-4 h-4 text-(--text-muted)" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-(--text-primary) tabular-nums">{organization?.usedSeats || 0}</span>
            <span className="text-xs text-(--text-muted)">/ {organization?.totalSeats || 0} {isBn ? "সিট" : "seats"}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-(--text-primary)/10 overflow-hidden">
            <div className="h-full rounded-full bg-(--text-primary) opacity-85 transition-all duration-700" style={{ width: `${seatPct}%` }} />
          </div>
          <p className="text-[11px] text-(--text-muted)">
            {Math.max(0, (organization?.totalSeats || 0) - (organization?.usedSeats || 0))}{" "}
            {isBn ? "টি খালি সিট অবশিষ্ট।" : "available seats remaining."}
          </p>
        </AdminCard>

        {/* Credit pool */}
        <AdminCard className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Eyebrow>{isBn ? "কোম্পানি ক্রেডিট পুল" : "COMPANY CREDIT POOL"}</Eyebrow>
            <Coins className="w-4 h-4 text-(--text-muted)" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-bold text-(--text-primary) tabular-nums">
              {(organization?.creditPoolRemaining || 0).toLocaleString()}
            </span>
            <span className="text-xs text-(--text-muted)">{isBn ? "অবশিষ্ট ক্রেডিট" : "credits remaining"}</span>
          </div>
          <HairlineMeter
            label={isBn ? "এ মাসে ব্যবহৃত" : "Used this month"}
            value={usedThisMonth}
            max={organization?.creditPoolTotal || 1}
            amount={usedThisMonth.toLocaleString()}
          />
          <Link href="/pricing" className="inline-flex items-center gap-1 text-xs font-semibold text-(--text-primary) hover:underline cursor-pointer">
            <span>{isBn ? "পুল রিচার্জ" : "Top Up Pool"}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </AdminCard>

        {/* Playbook compliance */}
        <AdminCard className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <Eyebrow>{isBn ? "প্লেবুক কমপ্লায়েন্স" : "PLAYBOOK COMPLIANCE"}</Eyebrow>
            <ShieldCheck className="w-4 h-4 text-(--text-muted)" />
          </div>
          <StatusPill
            label={playbookRules.length > 0 ? (isBn ? "সক্রিয় ও বাধ্যতামূলক" : "Active & Enforced") : (isBn ? "ঐচ্ছিক" : "Advisory Only")}
            tone={playbookRules.length > 0 ? "good" : "neutral"}
          />
          <p className="text-xs text-(--text-muted)">
            {playbookRules.filter((r) => r.isActive).length}{" "}
            {isBn ? "টি রুল অডিটে সক্রিয়।" : "active rules enforced."}
          </p>
        </AdminCard>
      </div>

      {/* Invite code strip */}
      <AdminCard className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <Eyebrow>{isBn ? "কোম্পানি ইনভাইট কোড" : "COMPANY INVITE CODE"}</Eyebrow>
            <p className="font-mono font-bold text-sm text-(--text-primary) mt-0.5">{organization?.referCode || "—"}</p>
          </div>
          <button
            type="button"
            onClick={copyReferCode}
            aria-label="Copy invite code"
            className="p-2 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/10 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-(--status-risk-low)" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <AdminButton variant="solid" onClick={() => setInviteOpen(true)}>
          <UserPlus className="w-3.5 h-3.5" /> {isBn ? "সদস্য ইনভাইট করুন" : "Invite Member"}
        </AdminButton>
      </AdminCard>

      {/* Audit trail */}
      <AdminCard className="p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <Eyebrow>{isBn ? "কমপ্লায়েন্স অডিট ট্রেইল" : "COMPLIANCE AUDIT TRAIL"}</Eyebrow>
            <h3 className="text-sm font-serif font-bold text-(--text-primary) mt-0.5 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-(--text-muted)" />
              {isBn ? "সদস্য কার্যক্রম ও ক্রেডিট ব্যবহার" : "Member activity & credit consumption"}
            </h3>
          </div>
          <MonoChip>{auditLogs.length} ENTRIES</MonoChip>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-(--text-primary)/10 text-(--text-muted)">
                {[
                  isBn ? "সময়" : "Timestamp",
                  isBn ? "সদস্য" : "Member",
                  isBn ? "বিভাগ" : "Department",
                  isBn ? "মডিউল" : "Module",
                  isBn ? "ক্যাটাগরি" : "Category",
                  isBn ? "ক্রেডিট" : "Credits",
                ].map((h, i) => (
                  <th key={i} className={`pb-3 font-mono text-[10px] uppercase tracking-widest font-bold ${i === 5 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-(--text-primary)/5">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-(--text-muted)">
                    {isBn ? "কোনো লগ পাওয়া যায়নি।" : "No audit logs found."}
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-(--text-primary)/5 transition-colors">
                    <td className="py-3 font-mono text-[11px] text-(--text-muted)">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 font-semibold text-(--text-primary)">{log.member_name}</td>
                    <td className="py-3 text-(--text-muted)">{log.department}</td>
                    <td className="py-3"><MonoChip>{log.module}</MonoChip></td>
                    <td className="py-3 text-(--text-muted)">{log.category}</td>
                    <td className="py-3 text-right font-mono font-bold text-(--text-primary) tabular-nums">
                      −{log.credits_consumed}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </AdminCard>

      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} organization={organization} />
    </div>
  );
}
