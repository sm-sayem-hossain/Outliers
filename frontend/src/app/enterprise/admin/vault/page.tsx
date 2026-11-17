"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCompanyData } from "../company-data";
import { useLanguage } from "@/context/LanguageContext";
import {
  AdminCard, SectionHeading, MonoChip, StatusPill, EmptyState, SkeletonRows,
} from "@/components/admin/ui";
import { ArrowUpRight } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// /enterprise/admin/vault — shared corporate contract repository.
// ─────────────────────────────────────────────────────────────────────────────

export default function EnterpriseVaultPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";
  const { isLoading, sharedContracts } = useCompanyData();

  if (isLoading) return <SkeletonRows rows={3} />;

  return (
    <div className="space-y-5">
      <SectionHeading
        title={isBn ? "অনুমোদিত ও শেয়ার্ড কর্পোরেট কন্ট্রাক্ট ভল্ট" : "Company Shared Contract Vault"}
        sub={isBn
          ? "এই চুক্তিগুলো টিম মেম্বাররা স্বেচ্ছায় কোম্পানির সেন্ট্রাল ভল্টে জমা দিয়েছেন।"
          : "Repository of contracts voluntarily deposited by team members."}
        count={sharedContracts.length}
      />

      <div className="space-y-3">
        {sharedContracts.length === 0 && (
          <EmptyState
            message={isBn ? "কোনো শেয়ার্ড চুক্তি নেই।" : "No shared contracts yet."}
            hint={isBn
              ? "সদস্যরা ContractMind অডিট থেকে চুক্তি ভল্টে শেয়ার করলে এখানে দেখা যাবে।"
              : "Contracts shared from a member's ContractMind audit will appear here."}
          />
        )}

        {sharedContracts.map((cnt) => (
          <AdminCard key={cnt.id} className="p-5 hover:border-(--text-primary)/20 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <MonoChip>#{cnt.id}</MonoChip>
                  <span className="text-[11px] font-semibold text-(--text-muted)">{cnt.category}</span>
                  {cnt.advocate_verified && (
                    <StatusPill
                      label={isBn ? "অ্যাডভোকেট সিলমোহরিত" : "Advocate Sealed"}
                      tone="good"
                    />
                  )}
                  <StatusPill
                    label={cnt.status === "approved" ? (isBn ? "অনুমোদিত" : "Approved") : (isBn ? "পর্যালোচনাধীন" : "Pending Review")}
                    tone={cnt.status === "approved" ? "good" : "warn"}
                  />
                </div>

                <h4 className="text-sm sm:text-base font-serif font-bold text-(--text-primary)">{cnt.title}</h4>

                <p className="text-xs text-(--text-muted)">
                  {isBn ? "জমা দিয়েছেন" : "Submitted by"}{" "}
                  <strong className="text-(--text-primary)">{cnt.submitted_by}</strong>
                  {" · "}{new Date(cnt.submitted_at).toLocaleDateString()}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-(--text-muted) font-bold">
                    {isBn ? "রিস্ক স্কোর" : "RISK SCORE"}
                  </p>
                  <p className="font-mono font-bold text-sm text-(--text-primary) tabular-nums">
                    {cnt.risk_score}/100
                  </p>
                </div>
                <AdminButtonWrapper onClick={() => router.push(`/contractmind?id=${cnt.contract_id}`)} label={isBn ? "অডিট রিপোর্ট" : "View Audit Memo"} />
              </div>
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}

function AdminButtonWrapper({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-(--text-primary)/10 hover:bg-(--text-primary)/15 text-(--text-primary) flex items-center gap-1.5 transition-colors cursor-pointer"
    >
      <span>{label}</span>
      <ArrowUpRight className="w-3.5 h-3.5" />
    </button>
  );
}
