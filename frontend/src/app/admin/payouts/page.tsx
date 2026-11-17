"use client";

import React, { useState } from "react";
import { useAdminData } from "../admin-data";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/context/LanguageContext";
import { approveAdminWithdrawal, markAdminWithdrawalPaid, WithdrawalRequest } from "@/lib/apiServices";
import { WithdrawalPaidModal } from "../_components/modals";
import {
  AdminCard, SectionHeading, StatusPill, MonoChip, AdminButton, EmptyState, SkeletonRows, statusTone,
} from "@/components/admin/ui";
import { CheckCheck } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// /admin/payouts — lawyer payout requests (bKash / Nagad / Rocket / Bank).
// 2-step flow: approve, then mark paid with a transfer reference.
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPayoutsPage() {
  const { language } = useLanguage();
  const isBn = language === "bn";
  const { toast } = useNotification();
  const { isLoading, withdrawalsList, setWithdrawalsList } = useAdminData();

  const [paying, setPaying] = useState<WithdrawalRequest | null>(null);

  const openCount = withdrawalsList.filter((w) => w.status === "PENDING" || w.status === "APPROVED").length;

  const handleMarkPaid = async (id: string | number, trxId: string) => {
    try {
      const current = withdrawalsList.find((item) => item.id === id);
      if (!current || current.status === "PENDING") await approveAdminWithdrawal(id);
      await markAdminWithdrawalPaid(id, trxId);
      setWithdrawalsList((prev) => prev.map((w) => (w.id === id ? { ...w, status: "PAID" } : w)));
      toast.success(isBn ? "উইথড্রয়াল সফলভাবে পরিশোধিত হয়েছে।" : "Withdrawal approved and marked as paid.");
    } catch {
      toast.error(isBn ? "পে-আউট প্রসেস ব্যর্থ।" : "Failed to process withdrawal payout.");
    }
  };

  if (isLoading) return <SkeletonRows rows={3} />;

  return (
    <div className="space-y-4">
      <SectionHeading
        title={isBn ? "আইনজীবী পেআউট রিকোয়েস্ট" : "Lawyer Payout Requests"}
        sub={isBn ? "bKash, Nagad, Rocket ও ব্যাংক ট্রান্সফার প্রসেস করুন" : "Process multi-channel payouts (bKash, Nagad, Rocket, Bank)"}
        count={openCount}
      />

      <div className="space-y-3">
        {withdrawalsList.map((w) => {
          const isOpen = w.status === "PENDING" || w.status === "APPROVED";
          const account = w.account_number || w.bkash_number;
          return (
            <AdminCard key={w.id} className="p-5">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-xl text-(--text-primary) tabular-nums">৳{w.amount_bdt.toLocaleString()}</span>
                    <MonoChip>{w.payout_method || "BKASH"}</MonoChip>
                    <StatusPill
                      label={w.status === "PENDING" ? (isBn ? "অপেক্ষমান" : "Pending") : w.status === "APPROVED" ? (isBn ? "অনুমোদিত" : "Ready to Pay") : (isBn ? "পরিশোধিত" : "Paid")}
                      tone={statusTone(w.status)}
                      pulse={w.status === "PENDING"}
                    />
                  </div>
                  <div className="space-y-0.5 text-xs text-(--text-muted)">
                    <p>
                      {isBn ? "হোল্ডার" : "Holder"}: <span className="font-semibold text-(--text-primary)">{w.account_holder_name}</span>
                      {w.lawyer_name && <span> ({w.lawyer_name})</span>}
                    </p>
                    <p>
                      {w.payout_method === "BANK" ? `${isBn ? "ব্যাংক অ্যাকাউন্ট" : "Bank Account"}: ` : `${w.payout_method || "bKash"} No: `}
                      <span className="font-mono font-bold text-(--text-primary)">{account}</span>
                      {w.payout_method === "BANK" && w.bank_name && (
                        <span className="ml-2">· {w.bank_name}{w.branch_name ? ` (${w.branch_name})` : ""}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 items-start">
                  {isOpen && (
                    <AdminButton variant="solid" onClick={() => setPaying(w)}>
                      <CheckCheck className="w-3.5 h-3.5" /> {isBn ? "পরিশোধিত" : "Mark Paid"}
                    </AdminButton>
                  )}
                </div>
              </div>
            </AdminCard>
          );
        })}
        {withdrawalsList.length === 0 && (
          <EmptyState message={isBn ? "কোনো পেআউট রিকোয়েস্ট নেই।" : "No pending withdrawals."} />
        )}
      </div>

      <WithdrawalPaidModal
        withdrawal={paying}
        onClose={() => setPaying(null)}
        onPaid={handleMarkPaid}
      />
    </div>
  );
}
