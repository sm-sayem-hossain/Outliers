"use client";

import React from "react";
import { useAdminData } from "../admin-data";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/context/LanguageContext";
import type { AdminPendingLawyer } from "@/lib/apiServices";
import { RejectLawyerModal } from "../_components/modals";
import {
  AdminCard, SectionHeading, MonoChip, AdminButton, EmptyState,
  SkeletonRows, InitialAvatar,
} from "@/components/admin/ui";
import { UserCheck, XCircle } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// /admin/lawyers — Bar Council verification queue.
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminLawyersPage() {
  const { language } = useLanguage();
  const isBn = language === "bn";
  const { toast } = useNotification();
  const { approveLawyerByAdmin } = useAuth();
  const { isLoading, lawyersList, setLawyersList } = useAdminData();

  const [rejecting, setRejecting] = React.useState<AdminPendingLawyer | null>(null);

  const handleApprove = async (lawyer: AdminPendingLawyer) => {
    try {
      await approveLawyerByAdmin(lawyer.lawyer_id);
      setLawyersList((prev) => prev.filter((l) => l.lawyer_id !== lawyer.lawyer_id));
      toast.success(isBn ? `আইনজীবী ${lawyer.full_name} অনুমোদিত হয়েছেন।` : `Advocate ${lawyer.full_name} approved.`);
    } catch {
      toast.error(isBn ? "অনুমোদন ব্যর্থ।" : "Approval failed.");
    }
  };

  if (isLoading) return <SkeletonRows rows={3} />;

  return (
    <div className="space-y-4">
      <SectionHeading
        title={isBn ? "বার কাউন্সিল যাচাই কিউ" : "Bar Council Verification Queue"}
        sub={isBn ? "আইনজীবী প্রোফাইল পর্যালোচনা করুন" : "Review pending advocate applications"}
        count={lawyersList.length}
      />

      <div className="space-y-3">
        {lawyersList.map((lawyer) => (
          <AdminCard key={lawyer.lawyer_id} className="p-5">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <InitialAvatar name={lawyer.full_name} size={40} />
                <div className="space-y-1.5 min-w-0">
                  <h3 className="font-bold text-sm text-(--text-primary)">{lawyer.full_name}</h3>
                  <p className="text-xs text-(--text-muted)">{lawyer.email}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <MonoChip>BAR ID: {lawyer.bar_council_id}</MonoChip>
                    <MonoChip>{lawyer.experience_years}Y EXP.</MonoChip>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 items-start">
                <AdminButton variant="solid" onClick={() => handleApprove(lawyer)}>
                  <UserCheck className="w-3.5 h-3.5" /> {isBn ? "অনুমোদন" : "Approve"}
                </AdminButton>
                <AdminButton variant="danger" onClick={() => setRejecting(lawyer)}>
                  <XCircle className="w-3.5 h-3.5" /> {isBn ? "প্রত্যাখ্যান" : "Reject"}
                </AdminButton>
              </div>
            </div>
          </AdminCard>
        ))}
        {lawyersList.length === 0 && (
          <EmptyState message={isBn ? "কোনো অপেক্ষমান আইনজীবী নেই।" : "No pending lawyer verifications."} />
        )}
      </div>

      {rejecting && (
        <RejectLawyerModal
          lawyerId={rejecting.lawyer_id}
          lawyerName={rejecting.full_name}
          onClose={() => setRejecting(null)}
          onRejected={() => setLawyersList((prev) => prev.filter((l) => l.lawyer_id !== rejecting.lawyer_id))}
        />
      )}
    </div>
  );
}
