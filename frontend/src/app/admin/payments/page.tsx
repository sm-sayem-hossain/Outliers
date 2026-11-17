"use client";

import React, { useState } from "react";
import { useAdminData } from "../admin-data";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/context/LanguageContext";
import { getAdminPayments, reconcileAdminPayment, approveAdminPayment } from "@/lib/apiServices";
import {
  AdminCard, SectionHeading, StatusPill, MonoChip, AdminButton, SearchInput, SelectInput,
  EmptyState, SkeletonRows, InfoBanner, statusTone,
} from "@/components/admin/ui";
import { RefreshCw, CheckCheck, ShieldCheck } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// /admin/payments — SSLCommerz gateway ledger with reconcile + legacy queue.
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPaymentsPage() {
  const { language } = useLanguage();
  const isBn = language === "bn";
  const { toast } = useNotification();
  const {
    isLoading, gatewayPayments, setGatewayPayments,
    paymentsList, setPaymentsList,
  } = useAdminData();

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [reconcilingId, setReconcilingId] = useState<string | number | null>(null);

  const applyFilter = async (status: string, query: string) => {
    setGatewayPayments(await getAdminPayments({ status, search: query }));
  };

  const handleReconcile = async (id: string | number) => {
    setReconcilingId(id);
    try {
      const res = await reconcileAdminPayment(id);
      if (res.status === "APPROVED") {
        toast.success(
          isBn
            ? `SSLCommerz থেকে যাচাইকৃত: ${res.credits_granted} ক্রেডিট যুক্ত হয়েছে।`
            : `Reconciled via SSLCommerz (+${res.credits_granted} credits).`
        );
      } else {
        toast.error(res.message || (isBn ? "পেমেন্ট সম্পন্ন নয়।" : "Payment is not completed on SSLCommerz."));
      }
      setGatewayPayments(await getAdminPayments({ status: statusFilter, search }));
    } catch (e: any) {
      toast.error(e?.message || (isBn ? "রিকনসিল ব্যর্থ।" : "Reconcile request failed."));
    } finally {
      setReconcilingId(null);
    }
  };

  const handleApproveLegacy = async (id: string | number) => {
    try {
      await approveAdminPayment(id);
      setPaymentsList((prev) => prev.filter((p) => p.payment_id !== id));
      toast.success(isBn ? "পেমেন্ট অনুমোদিত ও ক্রেডিট যুক্ত হয়েছে।" : "Payment approved & credits added.");
    } catch {
      toast.error(isBn ? "অনুমোদন ব্যর্থ।" : "Failed to approve payment.");
    }
  };

  if (isLoading) return <SkeletonRows rows={4} />;

  return (
    <div className="space-y-5">
      <SectionHeading
        title={isBn ? "SSLCommerz পেমেন্ট ও গেটওয়ে লেজার" : "SSLCommerz Payments & Gateway Ledger"}
        sub={isBn ? "val_id, bank_tran_id, কার্ড ও রিকনসিলিয়েশন দেখুন" : "Inspect gateway telemetry and reconcile against SSLCommerz"}
        count={gatewayPayments.length}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          onSubmit={() => applyFilter(statusFilter, search)}
          placeholder={isBn ? "Ref, val_id, ইমেইল খুঁজুন..." : "Search ref, val_id, email..."}
        />
        <SelectInput
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); applyFilter(v, search); }}
          options={[
            { value: "ALL", label: "All Statuses" },
            { value: "APPROVED", label: "Approved" },
            { value: "PENDING", label: "Pending" },
            { value: "FAILED", label: "Failed" },
            { value: "CANCELLED", label: "Cancelled" },
            { value: "EXPIRED", label: "Expired" },
          ]}
        />
        <AdminButton variant="outline" onClick={() => applyFilter(statusFilter, search)}>
          <RefreshCw className="w-3.5 h-3.5" /> {isBn ? "ফিল্টার" : "Filter"}
        </AdminButton>
      </div>

      {/* Legacy manual verification queue */}
      {paymentsList.length > 0 && (
        <InfoBanner icon={ShieldCheck} title={isBn ? "লিগ্যাসি ম্যানুয়াল যাচাই কিউ" : `Legacy Pending Verification Queue (${paymentsList.length})`}>
          <div className="space-y-2 mt-2">
            {paymentsList.map((p) => (
              <div key={p.payment_id} className="flex flex-col sm:flex-row justify-between gap-3 p-3 rounded-xl bg-(--bg-card) border border-(--text-primary)/8">
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-(--text-primary)">
                    ৳{p.amount_bdt} · {p.total_credits} cr · <span className="font-mono">{p.reference_code}</span>
                  </p>
                  <p className="text-(--text-muted) font-mono">
                    TrxID: {p.trx_id} · {isBn ? "প্রেরক" : "From"}: {p.sender_number}
                  </p>
                </div>
                <AdminButton variant="solid" onClick={() => handleApproveLegacy(p.payment_id)}>
                  <CheckCheck className="w-3.5 h-3.5" /> {isBn ? "অনুমোদন" : "Approve"}
                </AdminButton>
              </div>
            ))}
          </div>
        </InfoBanner>
      )}

      {/* Gateway ledger */}
      <div className="space-y-3">
        {gatewayPayments.map((p) => {
          const st = (p.status || "").toUpperCase();
          const canReconcile = p.method === "SSLCOMMERZ" && (st === "PENDING" || st === "FAILED" || st === "EXPIRED");
          return (
            <AdminCard key={p.payment_id} className="p-5">
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-lg text-(--text-primary) tabular-nums">৳{p.amount_bdt.toLocaleString()}</span>
                    <MonoChip>+{p.total_credits.toLocaleString()} CR</MonoChip>
                    <StatusPill label={st} tone={statusTone(st)} />
                    <MonoChip>{p.method}</MonoChip>
                    {p.card_type && <MonoChip>{p.card_type}{p.card_issuer ? ` · ${p.card_issuer}` : ""}</MonoChip>}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-(--text-muted)">
                    <span>
                      Ref: <span className="font-mono font-bold text-(--text-primary)">{p.reference_code}</span>
                    </span>
                    <span>
                      {isBn ? "ক্রেতা" : "Payer"}:{" "}
                      <span className="font-semibold text-(--text-primary)">
                        {p.enterprise_name ? `${p.enterprise_name} (${p.user_name || "Admin"})` : p.user_name || p.user_email || `User #${p.user_id}`}
                      </span>
                    </span>
                    {p.user_email && <span className="font-mono text-[11px]">{p.user_email}</span>}
                    {p.package_name && (
                      <span>{isBn ? "প্যাকেজ" : "Pack"}: <strong className="text-(--text-primary)">{p.package_name}</strong></span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-(--text-primary)/8">
                    {[
                      { k: "val_id", v: p.val_id || "—" },
                      { k: "bank_tran_id", v: p.bank_tran_id || p.trx_id || "—" },
                      { k: isBn ? "স্টোর নিট (BDT)" : "Store Net (BDT)", v: p.store_amount_bdt != null ? `৳${p.store_amount_bdt.toLocaleString()}` : "—" },
                      { k: isBn ? "গেটওয়ে স্ট্যাটাস" : "Gateway Status", v: p.gateway_status || "—" },
                    ].map((cell) => (
                      <div key={cell.k} className="p-2 rounded-lg bg-(--bg-surface)">
                        <span className="block text-[9px] font-mono uppercase tracking-widest font-bold text-(--text-muted)">{cell.k}</span>
                        <span className="font-mono font-semibold text-xs text-(--text-primary) break-all">{cell.v}</span>
                      </div>
                    ))}
                  </div>

                  {p.admin_note && (
                    <p className="text-[11px] text-(--text-muted) italic">{isBn ? "নোট:" : "Note:"} {p.admin_note}</p>
                  )}
                </div>

                {canReconcile && (
                  <div className="flex items-start shrink-0">
                    <AdminButton variant="outline" onClick={() => handleReconcile(p.payment_id)} disabled={reconcilingId === p.payment_id}>
                      {reconcilingId === p.payment_id ? (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      {isBn ? "রিকনসিল" : "Reconcile"}
                    </AdminButton>
                  </div>
                )}
              </div>
            </AdminCard>
          );
        })}
        {gatewayPayments.length === 0 && (
          <EmptyState
            message={isBn ? "কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি।" : "No gateway payments match the current filter."}
          />
        )}
      </div>
    </div>
  );
}
