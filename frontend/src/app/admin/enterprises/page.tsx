"use client";

import React from "react";
import { useAdminData } from "../admin-data";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/context/LanguageContext";
import { approveAdminEnterprise } from "@/lib/apiServices";
import {
  AdminCard, SectionHeading, MonoChip, AdminButton, EmptyState, SkeletonRows, InitialAvatar,
} from "@/components/admin/ui";
import { CheckCheck } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// /admin/enterprises — pending corporate tenant approvals.
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminEnterprisesPage() {
  const { language } = useLanguage();
  const isBn = language === "bn";
  const { toast } = useNotification();
  const { isLoading, enterprisesList, setEnterprisesList } = useAdminData();

  const handleApprove = async (id: number) => {
    try {
      await approveAdminEnterprise(id);
      setEnterprisesList((prev) => prev.filter((e) => e.enterprise_id !== id));
      toast.success(isBn ? "এন্টারপ্রাইজ অনুমোদিত হয়েছে।" : "Enterprise approved.");
    } catch {
      toast.error(isBn ? "অনুমোদন ব্যর্থ।" : "Failed to approve enterprise.");
    }
  };

  if (isLoading) return <SkeletonRows rows={3} />;

  return (
    <div className="space-y-4">
      <SectionHeading
        title={isBn ? "অপেক্ষমান এন্টারপ্রাইজ" : "Pending Enterprises"}
        sub={isBn ? "নতুন এন্টারপ্রাইজ অনুমোদন করুন" : "Review and approve new corporate tenants"}
        count={enterprisesList.length}
      />

      <div className="space-y-3">
        {enterprisesList.map((e) => (
          <AdminCard key={e.enterprise_id} className="p-5">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5">
                  <InitialAvatar name={e.name} size={36} />
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-(--text-primary) truncate">{e.name}</h3>
                    <p className="text-[10px] text-(--text-muted) font-mono">REF: {e.referral_code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <MonoChip>{e.member_limit} {isBn ? "সদস্য" : "MEMBERS"}</MonoChip>
                  <span className="text-[11px] text-(--text-muted)">
                    {isBn ? "প্রশাসক" : "Admin"}:{" "}
                    <span className="font-semibold text-(--text-primary)">{e.requested_admin?.full_name}</span>
                    <span className="ml-1 opacity-60">({e.requested_admin?.email})</span>
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                <AdminButton variant="solid" onClick={() => handleApprove(e.enterprise_id)}>
                  <CheckCheck className="w-3.5 h-3.5" /> {isBn ? "অনুমোদন" : "Approve"}
                </AdminButton>
              </div>
            </div>
          </AdminCard>
        ))}
        {enterprisesList.length === 0 && (
          <EmptyState message={isBn ? "কোনো অপেক্ষমান এন্টারপ্রাইজ নেই।" : "No pending enterprises."} />
        )}
      </div>
    </div>
  );
}
