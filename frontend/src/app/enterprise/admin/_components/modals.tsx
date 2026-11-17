"use client";

import React, { useState } from "react";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/context/LanguageContext";
import { approveMember, rejectMember } from "@/lib/apiServices";
import { Modal, AdminButton } from "@/components/admin/ui";
import { UserPlus, CheckCircle2, ShieldAlert, Copy, Check } from "lucide-react";
import type { PendingMember, Organization } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Enterprise admin modals: invite, approve (role/quota/department), reject.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Invite Member (invite code share) ───────────────────────────────────────
export function InviteMemberModal({ open, onClose, organization }: {
  open: boolean;
  onClose: () => void;
  organization: Organization | null;
}) {
  const { language } = useLanguage();
  const isBn = language === "bn";
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!organization?.referCode) return;
    navigator.clipboard.writeText(organization.referCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal open={open} onClose={onClose} title={isBn ? "সদস্য আমন্ত্রণ জানান" : "Invite Enterprise Member"} icon={UserPlus}>
      <div className="space-y-4 text-xs">
        <p className="text-(--text-muted) leading-relaxed">
          {isBn
            ? "আপনার কোম্পানির সদস্যদের এই ইনভাইট কোডটি দিন। তারা রেজিস্ট্রেশন পেজে এই কোডটি ব্যবহার করে রেজিস্ট্রেশন করবেন। এরপর তারা পেন্ডিং লিস্টে আসবে, সেখান থেকে আপনি অনুমোদন করতে পারবেন।"
            : "Share this invite code with your team members. They will use it during registration. Once registered, they'll appear in the Pending Approvals section for your review."}
        </p>
        <div className="p-4 rounded-2xl bg-(--bg-surface) border border-(--text-primary)/10 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest font-bold text-(--text-muted)">
              {isBn ? "ইনভাইট কোড" : "Invite Code"}
            </p>
            <p className="font-mono font-bold text-lg text-(--text-primary)">{organization?.referCode || "—"}</p>
          </div>
          <button
            onClick={copy}
            aria-label="Copy invite code"
            className="p-3 rounded-xl bg-(--text-primary) text-(--bg-primary) hover:opacity-90 transition-opacity cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center justify-end pt-2">
          <AdminButton variant="solid" onClick={onClose}>{isBn ? "বন্ধ করুন" : "Close"}</AdminButton>
        </div>
      </div>
    </Modal>
  );
}

// ─── Approve Member ──────────────────────────────────────────────────────────
export function ApproveMemberModal({ target, organization, onClose, onApproved }: {
  target: PendingMember | null;
  organization: Organization | null;
  onClose: () => void;
  onApproved: () => Promise<void>;
}) {
  const { toast } = useNotification();
  const { language } = useLanguage();
  const isBn = language === "bn";
  const poolRemaining = organization?.creditPoolRemaining ?? 0;
  const [role, setRole] = useState<"ADMIN" | "MANAGER" | "MEMBER">("MEMBER");
  const [dept, setDept] = useState("");
  const [quota, setQuota] = useState(200);
  const [submitting, setSubmitting] = useState(false);

  // Reset defaults whenever a new target arrives.
  React.useEffect(() => {
    if (target) {
      setRole("MEMBER");
      setDept("");
      setQuota(Math.min(200, poolRemaining));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setSubmitting(true);
    try {
      await approveMember(String(target.user_id), {
        company_role: role,
        department: dept.trim() || null,
        initial_quota: quota,
      });
      toast.success(isBn ? "সদস্য সফলভাবে অনুমোদিত হয়েছে!" : "Member approved successfully!");
      await onApproved();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || (isBn ? "অনুমোদন ব্যর্থ।" : "Failed to approve."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={target != null} onClose={onClose} title={isBn ? "সদস্য অনুমোদন" : "Approve Member"} icon={CheckCircle2}>
      {target && (
        <form onSubmit={submit} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-(--bg-surface) border border-(--text-primary)/8">
            <p className="font-bold text-(--text-primary)">{target.full_name}</p>
            <p className="font-mono text-(--text-muted)">{target.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-(--text-primary)">{isBn ? "রোল" : "Role"}</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "ADMIN" | "MANAGER" | "MEMBER")}
                className="w-full px-3 py-2 rounded-xl border border-(--text-primary)/15 bg-(--bg-surface) text-(--text-primary) outline-none focus:border-(--text-primary)/30"
              >
                <option value="MEMBER">Member</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-(--text-primary)">
                {isBn ? "প্রাথমিক কোটা" : "Initial Quota"}
                <span className="ml-1 text-[10px] text-(--text-muted) font-normal">
                  ({isBn ? "পুল:" : "Pool:"} {poolRemaining})
                </span>
              </label>
              <input
                type="number"
                min={0}
                max={poolRemaining}
                value={quota}
                onChange={(e) => setQuota(Math.max(0, Math.min(Number(e.target.value), poolRemaining)))}
                className="w-full px-3 py-2 rounded-xl border border-(--text-primary)/15 bg-(--bg-surface) text-(--text-primary) font-mono outline-none focus:border-(--text-primary)/30"
              />
              {poolRemaining === 0 && (
                <p className="mt-1 text-[10px] text-(--text-muted)">
                  {isBn
                    ? "পুলে ক্রেডিট শূন্য — ০ কোটায় অনুমোদন দিয়ে পরে টপ-আপ করুন।"
                    : "Pool has 0 credits — approve with 0 quota and allocate after top-up."}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-(--text-primary)">
              {isBn ? "বিভাগ (ঐচ্ছিক)" : "Department (Optional)"}
            </label>
            <input
              type="text"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              placeholder="e.g. Legal, HR, Procurement"
              className="w-full px-3 py-2 rounded-xl border border-(--text-primary)/15 bg-(--bg-surface) text-(--text-primary) outline-none focus:border-(--text-primary)/30"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <AdminButton variant="ghost" onClick={onClose}>{isBn ? "বাতিল" : "Cancel"}</AdminButton>
            <AdminButton variant="solid" type="submit" disabled={submitting}>
              {submitting ? <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {isBn ? "অনুমোদন করুন" : "Approve"}
            </AdminButton>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ─── Reject Member ───────────────────────────────────────────────────────────
export function RejectMemberModal({ target, onClose, onRejected }: {
  target: PendingMember | null;
  onClose: () => void;
  onRejected: () => Promise<void>;
}) {
  const { toast } = useNotification();
  const { language } = useLanguage();
  const isBn = language === "bn";
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (target) setReason("");
  }, [target]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target || reason.trim().length < 3) return;
    setSubmitting(true);
    try {
      await rejectMember(String(target.user_id), reason.trim());
      toast.success(isBn ? "সদস্যের রিকোয়েস্ট প্রত্যাখ্যাত হয়েছে।" : "Membership request rejected.");
      await onRejected();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || (isBn ? "প্রত্যাখ্যান ব্যর্থ।" : "Failed to reject."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={target != null} onClose={onClose} title={isBn ? "সদস্য প্রত্যাখ্যান" : "Reject Member"} icon={ShieldAlert}>
      {target && (
        <form onSubmit={submit} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-(--bg-surface) border border-(--text-primary)/8">
            <p className="font-bold text-(--text-primary)">{target.full_name}</p>
            <p className="font-mono text-(--text-muted)">{target.email}</p>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-(--text-primary)">
              {isBn ? "প্রত্যাখ্যানের কারণ" : "Rejection Reason"} <span className="text-(--status-risk-high)">*</span>
            </label>
            <textarea
              required
              rows={3}
              minLength={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isBn ? "স্পষ্ট কারণ লিখুন..." : "Provide a clear reason..."}
              className="w-full px-3.5 py-2 rounded-xl border border-(--text-primary)/15 bg-(--bg-surface) text-(--text-primary) outline-none focus:border-(--text-primary)/30 resize-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <AdminButton variant="ghost" onClick={onClose}>{isBn ? "বাতিল" : "Cancel"}</AdminButton>
            <AdminButton variant="danger" type="submit" disabled={submitting || reason.trim().length < 3}>
              {submitting ? <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              {isBn ? "প্রত্যাখ্যান করুন" : "Reject"}
            </AdminButton>
          </div>
        </form>
      )}
    </Modal>
  );
}
