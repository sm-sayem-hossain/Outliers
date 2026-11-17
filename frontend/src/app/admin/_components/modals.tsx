"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/context/LanguageContext";
import { adjustAdminUserCredits, adjustAdminEnterpriseCredits, getAdminUserDetail, WithdrawalRequest } from "@/lib/apiServices";
import {
  Modal, AdminButton, StatusPill, RoleBadge, InitialAvatar, DetailGrid, DetailRow,
  Eyebrow, Skeleton, statusTone,
} from "@/components/admin/ui";
import { XCircle, Coins, Wallet, Users, Loader2, CheckCheck, Building2, Gavel } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Super-admin modals — unified on the shared Modal primitive + NotificationContext.
// ─────────────────────────────────────────────────────────────────────────────

export interface AdjustTarget {
  kind: "user" | "enterprise";
  id: number;
  label: string;
  currentBalance: number;
  enterpriseId?: number | null;
  enterpriseName?: string | null;
  enterpriseBalance?: number | null;
}

interface UserDetailData {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  credit_balance: number;
  member_credit_quota?: number;
  member_credit_used?: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  enterprise_id: number | null;
  enterprise_details?: {
    id: number;
    name: string;
    pool_balance: number;
    member_limit: number;
  } | null;
  profile_photo_url?: string | null;
  lawyer_profile: {
    bar_council_id: string;
    experience_years: number;
    specializations: string[];
    status: string;
    wallet_balance: number;
  } | null;
}

// ─── Reject Lawyer ───────────────────────────────────────────────────────────
export function RejectLawyerModal({ lawyerId, lawyerName, onClose, onRejected }: {
  lawyerId: string | number;
  lawyerName: string;
  onClose: () => void;
  onRejected: () => void;
}) {
  const { rejectLawyerByAdmin } = useAuth();
  const { toast } = useNotification();
  const { language } = useLanguage();
  const isBn = language === "bn";
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (reason.trim().length < 3) return;
    setSubmitting(true);
    try {
      await rejectLawyerByAdmin(lawyerId, reason.trim());
      toast.success(isBn ? "আইনজীবীর আবেদন প্রত্যাখ্যাত হয়েছে।" : "Lawyer application rejected.");
      onRejected();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || (isBn ? "প্রত্যাখ্যান ব্যর্থ।" : "Rejection failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isBn ? "আইনজীবী আবেদন প্রত্যাখ্যান" : "Reject Lawyer Application"} icon={XCircle}>
      <div className="space-y-4">
        <p className="text-xs text-(--text-muted)">
          {lawyerName} — {isBn ? "প্রত্যাখ্যানের কারণ উল্লেখ করুন।" : "Provide a reason for rejection."}
        </p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={isBn ? "যেমন: অবৈধ বার কাউন্সিল আইডি..." : "e.g. Invalid Bar Council ID, incomplete documentation..."}
          className="w-full p-3 rounded-xl text-xs border border-(--text-primary)/10 bg-(--bg-surface) text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--text-primary)/30 transition-colors resize-none"
        />
        <div className="flex justify-end gap-2">
          <AdminButton variant="ghost" onClick={onClose}>{isBn ? "বাতিল" : "Cancel"}</AdminButton>
          <AdminButton variant="danger" onClick={submit} disabled={submitting || reason.trim().length < 3}>
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
            {isBn ? "নিশ্চিত করুন" : "Confirm Rejection"}
          </AdminButton>
        </div>
      </div>
    </Modal>
  );
}

// ─── Adjust Credits (personal wallet vs company pool) ────────────────────────
export function AdjustCreditsModal({ target, onClose, onSaved }: {
  target: AdjustTarget;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useNotification();
  const { language } = useLanguage();
  const isBn = language === "bn";
  const hasPool = target.enterpriseId != null && target.enterpriseBalance != null;
  const [scope, setScope] = useState<"user" | "enterprise">(hasPool ? "user" : target.kind === "enterprise" ? "enterprise" : "user");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const parsed = parseInt(amount, 10);
  const baseBalance = scope === "enterprise" && hasPool ? (target.enterpriseBalance as number) : target.currentBalance;
  const preview = !Number.isNaN(parsed) ? baseBalance + parsed : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number.isNaN(parsed) || parsed === 0) {
      toast.error(isBn ? "সঠিক ক্রেডিট পরিমাণ দিন (০ বাদে)।" : "Enter a valid non-zero credit amount.");
      return;
    }
    if (reason.trim().length < 3) {
      toast.error(isBn ? "কমপক্ষে ৩ অক্ষরের কারণ উল্লেখ করুন।" : "Please provide a short reason (min 3 characters).");
      return;
    }
    setSaving(true);
    try {
      const useEnterprise = scope === "enterprise" && hasPool;
      const res = useEnterprise
        ? await adjustAdminEnterpriseCredits(target.enterpriseId as number, parsed, reason.trim())
        : await adjustAdminUserCredits(target.id, parsed, reason.trim());
      toast.success(
        isBn
          ? `ক্রেডিট আপডেট হয়েছে। নতুন ব্যালেন্স: ${res.new_balance.toLocaleString()}`
          : `Credits updated. New balance: ${res.new_balance.toLocaleString()}`
      );
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || (isBn ? "ক্রেডিট সমন্বয় ব্যর্থ।" : "Failed to adjust credits."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isBn ? "ক্রেডিট সমন্বয়" : "Adjust Credits"} icon={Coins}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-xs text-(--text-muted)">{target.label}</p>

        {hasPool && (
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-(--bg-surface) border border-(--text-primary)/8">
            {(["user", "enterprise"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScope(s)}
                className={`py-2 px-3 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  scope === s
                    ? "bg-(--bg-card) text-(--text-primary) shadow-xs border border-(--text-primary)/10"
                    : "text-(--text-muted)"
                }`}
              >
                {s === "user"
                  ? `${isBn ? "ব্যক্তিগত" : "Personal"} (${target.currentBalance})`
                  : `${isBn ? "কোম্পানি পুল" : "Company Pool"} (${target.enterpriseBalance})`}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {[100, 500, 1000, -100, -500].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-(--bg-surface) border border-(--text-primary)/8 hover:bg-(--text-primary)/10 text-(--text-primary) cursor-pointer transition-colors"
            >
              {preset > 0 ? `+${preset}` : preset}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono font-bold text-(--text-muted) uppercase tracking-wider">
            {isBn ? "ক্রেডিট ডেল্টা (+ যোগ / - বাদ)" : "Credit Delta (+ add / − deduct)"}
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500 or -100"
            className="w-full p-3 rounded-xl text-xs font-mono border border-(--text-primary)/10 bg-(--bg-surface) text-(--text-primary) outline-none focus:border-(--text-primary)/30 transition-colors"
          />
          {preview !== null && (
            <p className="text-[11px] text-(--text-muted)">
              {isBn ? "নতুন ব্যালেন্স:" : "New balance:"}{" "}
              <span className="font-mono font-bold text-(--text-primary) tabular-nums">{preview.toLocaleString()}</span>
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono font-bold text-(--text-muted) uppercase tracking-wider">
            {isBn ? "অডিট কারণ (আবশ্যক)" : "Audit Reason (required)"}
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isBn ? "যেমন: SSLCommerz সাপোর্ট সমন্বয়" : "e.g. SSLCommerz support adjustment / onboarding grant"}
            className="w-full p-3 rounded-xl text-xs border border-(--text-primary)/10 bg-(--bg-surface) text-(--text-primary) outline-none focus:border-(--text-primary)/30 transition-colors resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <AdminButton variant="ghost" onClick={onClose}>{isBn ? "বাতিল" : "Cancel"}</AdminButton>
          <AdminButton variant="solid" type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
            {isBn ? "সংরক্ষণ" : "Save Adjustment"}
          </AdminButton>
        </div>
      </form>
    </Modal>
  );
}

// ─── Mark Withdrawal Paid (2-step: approve + pay with TrxID) ─────────────────
export function WithdrawalPaidModal({ withdrawal, onClose, onPaid }: {
  withdrawal: WithdrawalRequest | null;
  onClose: () => void;
  onPaid: (id: string | number, trxId: string) => Promise<void>;
}) {
  const { language } = useLanguage();
  const isBn = language === "bn";
  const [trxId, setTrxId] = useState("");
  const [paying, setPaying] = useState(false);

  if (!withdrawal) return null;

  const submit = async () => {
    setPaying(true);
    try {
      await onPaid(withdrawal.id, trxId);
      onClose();
    } finally {
      setPaying(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`${isBn ? "পরিশোধিত চিহ্নিত করুন" : "Mark as Paid"} (${withdrawal.payout_method || "Payout"})`} icon={Wallet}>
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-(--bg-surface) border border-(--text-primary)/8 text-xs space-y-0.5">
          <p className="font-bold text-(--text-primary)">
            ৳{withdrawal.amount_bdt.toLocaleString()} → {withdrawal.account_holder_name}
          </p>
          <p className="font-mono text-(--text-muted)">
            {withdrawal.account_number || withdrawal.bkash_number}
            {withdrawal.bank_name ? ` (${withdrawal.bank_name})` : ""}
          </p>
        </div>
        <input
          type="text"
          value={trxId}
          onChange={(e) => setTrxId(e.target.value)}
          placeholder="e.g. BK99281937XY or BEFTN-887766"
          className="w-full p-3 rounded-xl text-xs font-mono border border-(--text-primary)/10 bg-(--bg-surface) text-(--text-primary) placeholder:text-(--text-muted) outline-none focus:border-(--text-primary)/30 transition-colors"
        />
        <div className="flex justify-end gap-2">
          <AdminButton variant="ghost" onClick={onClose}>{isBn ? "বাতিল" : "Cancel"}</AdminButton>
          <AdminButton variant="solid" onClick={submit} disabled={!trxId || paying}>
            {paying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
            {isBn ? "পরিশোধ নিশ্চিত" : "Confirm Payment"}
          </AdminButton>
        </div>
      </div>
    </Modal>
  );
}

// ─── User Profile detail ─────────────────────────────────────────────────────
export function UserDetailModal({ userId, onClose, onAdjustCredits }: {
  userId: number | null;
  onClose: () => void;
  onAdjustCredits: (detail: UserDetailData) => void;
}) {
  const { toast } = useNotification();
  const { language } = useLanguage();
  const isBn = language === "bn";
  const [detail, setDetail] = useState<UserDetailData | null>(null);
  const [fetching, setFetching] = useState(true);

  React.useEffect(() => {
    if (userId == null) return;
    setFetching(true);
    setDetail(null);
    getAdminUserDetail(userId)
      .then(setDetail)
      .catch(() => toast.error(isBn ? "ইউজার প্রোফাইল লোড ব্যর্থ।" : "Failed to load user profile."))
      .finally(() => setFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <Modal open={userId != null} onClose={onClose} title={isBn ? "ইউজার প্রোফাইল" : "User Profile"} icon={Users} wide>
      {fetching ? (
        <div className="space-y-3 py-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : detail ? (
        <div className="space-y-5">
          {/* Identity */}
          <div className="flex items-center gap-4">
            {detail.profile_photo_url ? (
              <Image src={detail.profile_photo_url} alt={detail.full_name || "User"} width={56} height={56} className="w-14 h-14 rounded-xl object-cover border border-(--text-primary)/10" unoptimized />
            ) : (
              <InitialAvatar name={detail.full_name} size={56} />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-serif font-bold text-(--text-primary) truncate">{detail.full_name}</h4>
              <p className="text-xs text-(--text-muted) truncate">{detail.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <RoleBadge role={detail.role} />
                <StatusPill label={detail.is_active ? "Active" : "Suspended"} tone={statusTone(detail.is_active ? "ACTIVE" : "SUSPENDED")} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <AdminButton
              variant="outline"
              onClick={() => {
                onAdjustCredits(detail);
                onClose();
              }}
            >
              <Coins className="w-3.5 h-3.5" />
              {isBn ? "ক্রেডিট সমন্বয়" : "Adjust Credits"}
            </AdminButton>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Credits", value: String(detail.credit_balance), mono: true },
              { label: "Joined", value: new Date(detail.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }) },
              { label: "Phone", value: detail.phone || "—" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl bg-(--bg-surface) border border-(--text-primary)/8 text-center">
                <p className="text-[9px] font-mono uppercase tracking-widest text-(--text-muted) mb-1">{s.label}</p>
                <p className={`text-sm font-bold text-(--text-primary) ${s.mono ? "font-mono tabular-nums" : ""}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Lawyer panel */}
          {detail.role === "LAWYER" && detail.lawyer_profile && (
            <div className="p-4 rounded-2xl bg-(--bg-surface) border border-(--text-primary)/8">
              <Eyebrow className="mb-3 flex items-center gap-1.5">
                <Gavel className="w-3 h-3" /> {isBn ? "আইনজীবী বিবরণ" : "Lawyer Details"}
              </Eyebrow>
              <DetailGrid>
                <DetailRow label="Bar Council ID"><span className="font-mono">{detail.lawyer_profile.bar_council_id}</span></DetailRow>
                <DetailRow label="Experience">{detail.lawyer_profile.experience_years} {isBn ? "বছর" : "years"}</DetailRow>
                <DetailRow label="Verification"><StatusPill label={detail.lawyer_profile.status} tone={statusTone(detail.lawyer_profile.status)} /></DetailRow>
                <DetailRow label="Wallet"><span className="font-mono tabular-nums">৳{detail.lawyer_profile.wallet_balance?.toLocaleString?.() ?? detail.lawyer_profile.wallet_balance}</span></DetailRow>
              </DetailGrid>
            </div>
          )}

          {/* Enterprise panel */}
          {detail.enterprise_id != null && (
            <div className="p-4 rounded-2xl bg-(--bg-surface) border border-(--text-primary)/8">
              <Eyebrow className="mb-3 flex items-center gap-1.5">
                <Building2 className="w-3 h-3" /> {isBn ? "এন্টারপ্রাইজ সংযোগ" : "Enterprise Association"}
              </Eyebrow>
              <DetailGrid>
                <DetailRow label={isBn ? "প্রতিষ্ঠান" : "Organization"}>
                  {detail.enterprise_details?.name || `#${detail.enterprise_id}`}
                </DetailRow>
                <DetailRow label={isBn ? "পুল ব্যালেন্স" : "Pool Balance"}>
                  <span className="font-mono tabular-nums">{detail.enterprise_details?.pool_balance ?? "—"} cr</span>
                </DetailRow>
                <DetailRow label={isBn ? "নির্ধারিত কোটা" : "Assigned Quota"}>
                  <span className="font-mono tabular-nums">{detail.member_credit_quota ?? 0} cr ({isBn ? "ব্যবহৃত" : "used"}: {detail.member_credit_used ?? 0})</span>
                </DetailRow>
                <DetailRow label={isBn ? "ব্যক্তিগত ওয়ালেট" : "Personal Wallet"}>
                  <span className="font-mono tabular-nums">{detail.credit_balance} cr</span>
                </DetailRow>
              </DetailGrid>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
