"use client";

import React, { useState } from "react";
import { useCompanyData } from "../company-data";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/context/LanguageContext";
import { suspendMember, reactivateMember, adjustMemberQuota } from "@/lib/apiServices";
import { InviteMemberModal, ApproveMemberModal, RejectMemberModal } from "../_components/modals";
import type { PendingMember } from "../_components/types";
import {
  AdminCard, SectionHeading, AdminButton, SearchInput, InfoBanner, SkeletonTable,
} from "@/components/admin/ui";
import { UserPlus, Check, X } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// /enterprise/admin/members — pending join requests, member directory,
// inline quota editing, suspend/reactivate (reason via prompt).
// ─────────────────────────────────────────────────────────────────────────────

export default function EnterpriseMembersPage() {
  const { language } = useLanguage();
  const isBn = language === "bn";
  const { toast, prompt: showPrompt } = useNotification();
  const { isLoading, refetchAll, organization, members, pendingMembers } = useCompanyData();

  const [memberSearch, setMemberSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<PendingMember | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingMember | null>(null);
  const [editingQuotaId, setEditingQuotaId] = useState<string | null>(null);
  const [tempQuota, setTempQuota] = useState(200);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.department.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const asPending = (m: { id: string; name: string; email: string; joinedAt: string }): PendingMember => ({
    user_id: m.id,
    full_name: m.name,
    email: m.email,
    requested_at: m.joinedAt,
    is_verified: true,
  });

  const handleToggleStatus = async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    if (member.role === "admin") {
      toast.warning(isBn ? "অ্যাডমিন স্ট্যাটাস পরিবর্তন করা যাবে না।" : "Admin status cannot be modified.");
      return;
    }
    try {
      if (member.status === "active") {
        const reason = await showPrompt({
          title: isBn ? "সদস্য সাময়িক স্থগিতকরণ" : "Suspend Team Member",
          message: isBn ? "সাময়িক স্থগিত করার কারণ লিখুন (কমপক্ষে ৩ অক্ষর):" : "Enter reason for suspension (min 3 characters):",
          placeholder: isBn ? "স্থগিতের কারণ..." : "Reason for suspension...",
          confirmText: isBn ? "স্থগিত করুন" : "Suspend",
          minLength: 3,
        });
        if (!reason) return;
        await suspendMember(memberId, reason);
        toast.success(isBn ? "সদস্য সাময়িক স্থগিত করা হয়েছে।" : "Member suspended successfully.");
      } else if (member.status === "suspended") {
        await reactivateMember(memberId);
        toast.success(isBn ? "সদস্য পুনরায় সক্রিয় করা হয়েছে।" : "Member reactivated successfully.");
      } else {
        return;
      }
      await refetchAll();
    } catch (e: any) {
      toast.error(e?.message || (isBn ? "স্ট্যাটাস পরিবর্তন ব্যর্থ।" : "Failed to update status."));
    }
  };

  const handleSaveQuota = async (memberId: string) => {
    const current = members.find((m) => m.id === memberId);
    const delta = tempQuota - (current?.monthlyCreditCap ?? 0);
    if (delta === 0) { setEditingQuotaId(null); return; }
    try {
      await adjustMemberQuota(memberId, delta, "Quota adjustment via Admin panel");
      await refetchAll();
      setEditingQuotaId(null);
    } catch (e: any) {
      toast.error(e?.message || (isBn ? "কোটা পরিবর্তন ব্যর্থ।" : "Failed to adjust quota."));
    }
  };

  if (isLoading) return <SkeletonTable rows={6} cols={6} />;

  return (
    <div className="space-y-5">
      <SectionHeading
        title={isBn ? "সদস্য ও পারমিশন" : "Members & Permissions"}
        sub={isBn ? "সদস্য অনুমোদন, কোটা ও স্ট্যাটাস পরিচালনা করুন" : "Approve members, manage quotas and status"}
        count={members.length}
      />

      {/* Pending join requests */}
      {pendingMembers.length > 0 && (
        <InfoBanner icon={UserPlus} title={isBn ? `অপেক্ষমান সদস্য অনুরোধ (${pendingMembers.length})` : `Pending Membership Requests (${pendingMembers.length})`}>
          <div className="grid grid-cols-1 gap-2.5 mt-2">
            {pendingMembers.map((pm) => (
              <div key={String(pm.user_id)} className="p-3.5 rounded-xl bg-(--bg-card) border border-(--text-primary)/10 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-(--text-primary) truncate">{pm.full_name}</p>
                  <p className="text-[11px] font-mono text-(--text-muted) truncate">{pm.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <AdminButton variant="solid" onClick={() => setApproveTarget(pm)}>
                    <Check className="w-3.5 h-3.5" /> {isBn ? "অনুমোদন" : "Approve"}
                  </AdminButton>
                  <AdminButton variant="danger" onClick={() => setRejectTarget(pm)}>
                    <X className="w-3.5 h-3.5" /> {isBn ? "প্রত্যাখ্যান" : "Reject"}
                  </AdminButton>
                </div>
              </div>
            ))}
          </div>
        </InfoBanner>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <SearchInput
          value={memberSearch}
          onChange={setMemberSearch}
          placeholder={isBn ? "সদস্য খুঁজুন..." : "Search members..."}
        />
        <AdminButton variant="solid" onClick={() => setInviteOpen(true)}>
          <UserPlus className="w-3.5 h-3.5" /> {isBn ? "সদস্য আমন্ত্রণ" : "Invite Member"}
        </AdminButton>
      </div>

      {/* Member table */}
      <AdminCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-(--text-primary)/10 bg-(--bg-surface) text-(--text-muted)">
                {[
                  isBn ? "সদস্য" : "Member",
                  isBn ? "বিভাগ" : "Department",
                  isBn ? "রোল" : "Role",
                  isBn ? "স্ট্যাটাস" : "Status",
                  isBn ? "কোটা" : "Quota",
                  "",
                ].map((h, i) => (
                  <th key={i} className={`p-4 font-mono text-[10px] uppercase tracking-widest font-bold ${i === 5 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-(--text-primary)/5">
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-(--text-muted)">
                    {isBn ? "কোনো সদস্য পাওয়া যায়নি।" : "No members found."}
                  </td>
                </tr>
              )}
              {filteredMembers.map((mem) => (
                <tr key={mem.id} className="hover:bg-(--text-primary)/5 transition-colors">
                  <td className="p-4">
                    <p className="font-semibold text-(--text-primary)">{mem.name}</p>
                    <p className="text-[11px] text-(--text-muted) font-mono">{mem.email}</p>
                  </td>
                  <td className="p-4 text-(--text-muted)">{mem.department}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border border-(--text-primary)/15 text-(--text-muted)">
                      {mem.role === "admin" ? "Admin" : "Member"}
                    </span>
                  </td>
                  <td className="p-4">
                    {mem.status === "active" && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-(--text-primary)">
                        <span className="w-1.5 h-1.5 rounded-full bg-(--status-risk-low) animate-pulse" /> Active
                      </span>
                    )}
                    {mem.status === "suspended" && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-(--text-primary)">
                        <span className="w-1.5 h-1.5 rounded-full bg-(--status-risk-high)" /> Suspended
                      </span>
                    )}
                    {mem.status === "pending" && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-(--text-primary)">
                        <span className="w-1.5 h-1.5 rounded-full bg-(--status-risk-med)" /> Pending
                      </span>
                    )}
                    {mem.status === "inactive" && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-(--text-muted)">
                        <span className="w-1.5 h-1.5 rounded-full bg-(--text-muted)" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {mem.status === "pending" ? (
                      <span className="text-[11px] text-(--text-muted) italic">{isBn ? "অনুমোদনে ধার্য" : "Set on approval"}</span>
                    ) : editingQuotaId === mem.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={tempQuota}
                          onChange={(e) => setTempQuota(Number(e.target.value))}
                          className="w-16 px-2 py-1 rounded-lg border border-(--text-primary)/20 bg-(--bg-surface) text-xs font-mono outline-none focus:border-(--text-primary)/40"
                        />
                        <button
                          onClick={() => handleSaveQuota(mem.id)}
                          aria-label="Save quota"
                          className="p-1 rounded-md bg-(--text-primary) text-(--bg-primary) cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingQuotaId(null)}
                          aria-label="Cancel quota edit"
                          className="p-1 rounded-md text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-(--text-primary) tabular-nums">
                          {mem.role === "admin" ? (isBn ? "পুল কন্ট্রোলার" : "Pool Admin") : mem.monthlyCreditCap}
                        </span>
                        {mem.role !== "admin" && mem.status === "active" && (
                          <button
                            onClick={() => { setEditingQuotaId(mem.id); setTempQuota(mem.monthlyCreditCap); }}
                            className="text-[10px] font-bold text-(--text-primary) underline underline-offset-2 hover:opacity-70 cursor-pointer"
                          >
                            {isBn ? "এডিট" : "Edit"}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-mono text-(--text-muted) tabular-nums">
                    {mem.creditsUsedThisMonth} / {mem.monthlyCreditCap}
                  </td>
                  <td className="p-4 text-right">
                    {mem.status === "pending" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <AdminButton variant="solid" onClick={() => setApproveTarget(asPending(mem))}>
                          <Check className="w-3 h-3" /> {isBn ? "অনুমোদন" : "Approve"}
                        </AdminButton>
                        <AdminButton variant="danger" onClick={() => setRejectTarget(asPending(mem))}>
                          <X className="w-3 h-3" /> {isBn ? "প্রত্যাখ্যান" : "Reject"}
                        </AdminButton>
                      </div>
                    ) : (
                      mem.role !== "admin" && (mem.status === "active" || mem.status === "suspended") && (
                        <AdminButton
                          variant="ghost"
                          onClick={() => handleToggleStatus(mem.id)}
                        >
                          {mem.status === "active" ? (isBn ? "স্থগিত" : "Suspend") : (isBn ? "পুনরায় চালু" : "Activate")}
                        </AdminButton>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {/* Modals */}
      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} organization={organization} />
      <ApproveMemberModal target={approveTarget} organization={organization} onClose={() => setApproveTarget(null)} onApproved={refetchAll} />
      <RejectMemberModal target={rejectTarget} onClose={() => setRejectTarget(null)} onRejected={refetchAll} />
    </div>
  );
}
