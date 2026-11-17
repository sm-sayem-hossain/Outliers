"use client";

import React, { useState, useEffect } from "react";
import { useAdminData } from "./admin-data";
import { useLanguage } from "@/context/LanguageContext";
import { useNotification } from "@/context/NotificationContext";
import { StatTile, AdminCard, Eyebrow, Skeleton, SkeletonRows, ErrorBanner, StatusPill, AdminButton } from "@/components/admin/ui";
import { DonutChart, HairlineMeter } from "@/components/admin/charts";
import { Banknote, TrendingDown, TrendingUp, Users, Activity, DollarSign, Zap, Scale, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { getAdminSystemConfig, updateAdminSystemConfig, AdminSystemConfig } from "@/lib/apiServices";

// ─────────────────────────────────────────────────────────────────────────────
// /admin — platform overview: revenue tiles, demographics, financial meters.
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const { language } = useLanguage();
  const isBn = language === "bn";
  const { toast } = useNotification();
  const { isLoading, loadError, load, stats, financials, paymentsList, lawyersList, enterprisesList, withdrawalsList } = useAdminData();

  // ── Instant Judge Mode State ──
  const [sysConfig, setSysConfig] = useState<AdminSystemConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [isTogglingJudge, setIsTogglingJudge] = useState(false);
  const [isUpdatingLawyer, setIsUpdatingLawyer] = useState(false);

  useEffect(() => {
    let mounted = true;
    getAdminSystemConfig()
      .then((cfg) => {
        if (mounted) {
          setSysConfig(cfg);
          setIsConfigLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setIsConfigLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleJudgeMode = async () => {
    if (!sysConfig) return;
    const targetMode = !sysConfig.instant_judge_mode;
    setIsTogglingJudge(true);
    try {
      const res = await updateAdminSystemConfig({ instant_judge_mode: targetMode });
      setSysConfig((prev) => (prev ? { ...prev, instant_judge_mode: res.instant_judge_mode } : prev));
      toast.success(
        isBn
          ? `ইনস্ট্যান্ট জাজ মোড এখন ${res.instant_judge_mode ? "চালু (ON)" : "বন্ধ (OFF)"}`
          : `Instant Judge Mode is now ${res.instant_judge_mode ? "ENABLED (ON)" : "DISABLED (OFF)"}`
      );
    } catch (err: any) {
      toast.error(err?.message || (isBn ? "জাজ মোড পরিবর্তন ব্যর্থ।" : "Failed to toggle judge mode."));
    } finally {
      setIsTogglingJudge(false);
    }
  };

  const handleSelectJudgeLawyer = async (lawyerIdStr: string) => {
    const lawyerId = lawyerIdStr ? parseInt(lawyerIdStr, 10) : null;
    setIsUpdatingLawyer(true);
    try {
      const res = await updateAdminSystemConfig({ fixed_judge_lawyer_id: lawyerId });
      const matched = sysConfig?.approved_lawyers.find((l) => l.lawyer_id === lawyerId);
      setSysConfig((prev) =>
        prev
          ? {
              ...prev,
              fixed_judge_lawyer_id: res.fixed_judge_lawyer_id,
              fixed_judge_lawyer_name: matched ? matched.name : null,
              fixed_judge_lawyer_email: matched ? matched.email : null,
            }
          : prev
      );
      toast.success(
        isBn
          ? `ফিক্সড আইনজীবী নির্ধারিত হয়েছে: ${matched?.name || "ডিফল্ট"}`
          : `Designated Advocate updated: ${matched?.name || "Default"}`
      );
    } catch (err: any) {
      toast.error(err?.message || (isBn ? "আইনজীবী নির্ধারণ ব্যর্থ।" : "Failed to update designated lawyer."));
    } finally {
      setIsUpdatingLawyer(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <SkeletonRows rows={1} />
      </div>
    );
  }

  const totalUsers = stats?.users.total || 0;
  const generalUsers = stats?.users.general || 0;
  const lawyerUsers = stats?.users.lawyers || 0;
  const entUsers = (stats?.users.enterprise_admins || 0) + (stats?.users.enterprise_members || 0);
  const revBdt = financials?.aggregates.total_revenue_bdt || 0;
  const pendingPayouts = financials?.aggregates.pending_payouts_bdt || 0;
  const netPosition = financials?.aggregates.net_platform_position_bdt || 0;
  const paidPayouts = financials?.aggregates.paid_payouts_bdt || 0;

  const attention = [
    { label: isBn ? "অপেক্ষমান পেমেন্ট" : "Pending Payments", value: paymentsList.length, href: "/admin/payments" },
    { label: isBn ? "আইনজীবী যাচাই" : "Lawyer Reviews", value: lawyersList.length, href: "/admin/lawyers" },
    { label: isBn ? "এন্টারপ্রাইজ" : "Enterprises", value: enterprisesList.length, href: "/admin/enterprises" },
    { label: isBn ? "উইথড্রয়াল" : "Withdrawals", value: withdrawalsList.length, href: "/admin/payouts" },
  ];

  return (
    <div className="space-y-6">
      {loadError && <ErrorBanner message={isBn ? "প্ল্যাটফর্ম ডাটা লোড ব্যর্থ।" : "Platform data failed to load."} onRetry={() => load(true)} isRetrying={false} />}

      {/* ── INSTANT JUDGE MODE / EVALUATOR CONTROL CARD ── */}
      <AdminCard className="p-5 sm:p-6 border-amber-500/30 bg-gradient-to-br from-amber-500/[0.04] via-(--bg-card) to-(--bg-card)">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div>
                <Eyebrow>{isBn ? "হ্যাকাথন ও জাজ কন্ট্রোল" : "HACKATHON & JUDGE CONTROL"}</Eyebrow>
                <h2 className="text-base font-serif font-bold text-(--text-primary) flex items-center gap-2">
                  {isBn ? "ইনস্ট্যান্ট জাজ মোড (Instant Judge Mode)" : "Instant Judge Mode"}
                  {sysConfig?.instant_judge_mode ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      ACTIVE (ON)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-500/10 text-(--text-muted) border border-(--text-primary)/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      OFF (Algorithm Mode)
                    </span>
                  )}
                </h2>
              </div>
            </div>
            <p className="text-xs text-(--text-muted) leading-relaxed">
              {sysConfig?.instant_judge_mode
                ? isBn
                  ? "চালু আছে: লগইন পেইজে বিচারকদের জন্য 'Instant Access for Judge' বাটন দৃশ্যমান রয়েছে এবং সব ক্লায়েন্ট ভেরিফিকেশন সরাসরি নিচের নির্দিষ্ট আইনজীবীর কিউতে জমা হচ্ছে।"
                  : "ACTIVE: The 'Instant Access for Judge' button is visible on the login page, and all client contract reviews are directly routed to the designated advocate."
                : isBn
                  ? "বন্ধ আছে: লগইন পেইজে জাজ বাটন সম্পূর্ণ গোপন (Hidden) রয়েছে এবং সব ভেরিফিকেশন রিকোয়েস্ট মাল্টি-ফ্যাক্টর AI ম্যাচিং অ্যালগরিদম অনুসরণ করছে।"
                  : "INACTIVE: The judge access button is hidden from public view, and verification requests follow the standard multi-factor matching algorithm."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {/* Target Lawyer Dropdown */}
            <div className="flex flex-col gap-1 min-w-[220px]">
              <label className="text-[10px] font-mono uppercase tracking-wider text-(--text-muted)">
                {isBn ? "ফিক্সড আইনজীবী (Target Lawyer)" : "Designated Advocate"}
              </label>
              <select
                disabled={isConfigLoading || isUpdatingLawyer}
                value={sysConfig?.fixed_judge_lawyer_id || ""}
                onChange={(e) => handleSelectJudgeLawyer(e.target.value)}
                className="text-xs rounded-xl px-3 py-2 bg-(--bg-surface) border border-(--text-primary)/15 text-(--text-primary) focus:outline-none focus:border-amber-500 disabled:opacity-50 cursor-pointer"
              >
                <option value="">{isBn ? "ডিফল্ট (Adv. Tanvir Ahmed)" : "Default (Adv. Tanvir Ahmed)"}</option>
                {sysConfig?.approved_lawyers.map((l) => (
                  <option key={l.lawyer_id} value={l.lawyer_id}>
                    {l.name} ({l.bar_council_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle Button */}
            <div className="flex flex-col gap-1 self-end sm:self-auto">
              <label className="text-[10px] font-mono uppercase tracking-wider text-transparent select-none hidden sm:block">
                Toggle
              </label>
              <button
                type="button"
                disabled={isConfigLoading || isTogglingJudge}
                onClick={handleToggleJudgeMode}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-mono tracking-tight transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${
                  sysConfig?.instant_judge_mode
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20"
                    : "bg-(--text-primary)/10 text-(--text-primary) hover:bg-(--text-primary)/20"
                }`}
              >
                {isTogglingJudge ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className={`w-3.5 h-3.5 ${sysConfig?.instant_judge_mode ? "fill-current" : ""}`} />
                )}
                <span>
                  {sysConfig?.instant_judge_mode
                    ? isBn ? "মোড চালু (TURN OFF)" : "MODE ON (TURN OFF)"
                    : isBn ? "মোড চালু করুন (TURN ON)" : "MODE OFF (TURN ON)"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </AdminCard>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile label={isBn ? "মোট রেভিনিউ" : "Total Revenue"} value={revBdt} sub={isBn ? "SSLCommerz টপ-আপ" : "From SSLCommerz top-ups"} prefix="৳" icon={Banknote} />
        <StatTile label={isBn ? "অপেক্ষমান পে-আউট" : "Pending Payouts"} value={pendingPayouts} sub={isBn ? "আইনজীবীদের প্রাপ্য" : "Owed to lawyers"} prefix="৳" icon={TrendingDown} />
        <StatTile label={isBn ? "নেট পজিশন" : "Net Position"} value={netPosition} sub={isBn ? "রেভিনিউ − পে-আউট" : "Revenue minus payouts"} prefix="৳" icon={TrendingUp} />
        <StatTile label={isBn ? "মোট ইউজার" : "Total Users"} value={totalUsers} sub={isBn ? "নিবন্ধিত অ্যাকাউন্ট" : "Registered accounts"} icon={Users} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminCard className="p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <Eyebrow>{isBn ? "ইউজার ডেমোগ্রাফিক্স" : "USER DEMOGRAPHICS"}</Eyebrow>
              <h3 className="text-sm font-serif font-bold text-(--text-primary) mt-0.5 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-(--text-muted)" />
                {isBn ? "রোল অনুযায়ী বিতরণ" : "Distribution by role"}
              </h3>
            </div>
            <StatusPill label={`${totalUsers} ${isBn ? "মোট" : "total"}`} />
          </div>
          <DonutChart
            segments={[
              { value: generalUsers, label: isBn ? "সাধারণ ইউজার" : "General Users" },
              { value: lawyerUsers, label: isBn ? "আইনজীবী" : "Lawyers" },
              { value: entUsers, label: isBn ? "এন্টারপ্রাইজ" : "Enterprise" },
            ]}
          />
        </AdminCard>

        <AdminCard className="p-6 space-y-5">
          <div>
            <Eyebrow>{isBn ? "আর্থিক বিবরণ" : "FINANCIAL BREAKDOWN"}</Eyebrow>
            <h3 className="text-sm font-serif font-bold text-(--text-primary) mt-0.5 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-(--text-muted)" />
              {isBn ? "রেভিনিউ বনাম পেআউট (BDT)" : "Revenue vs payouts (BDT)"}
            </h3>
          </div>
          <div className="space-y-5 pt-1">
            <HairlineMeter label={isBn ? "মোট রেভিনিউ" : "Total Revenue"} value={revBdt} max={revBdt} amount={`৳${revBdt.toLocaleString()}`} />
            <HairlineMeter label={isBn ? "আইনজীবীদের পরিশোধিত" : "Paid to Lawyers"} value={paidPayouts} max={revBdt} amount={`৳${paidPayouts.toLocaleString()}`} />
            <HairlineMeter label={isBn ? "অপেক্ষমান পে-আউট" : "Pending Payouts"} value={pendingPayouts} max={revBdt} amount={`৳${pendingPayouts.toLocaleString()}`} />
            <HairlineMeter label={isBn ? "প্ল্যাটফর্ম নেট" : "Platform Net"} value={netPosition} max={revBdt} amount={`৳${netPosition.toLocaleString()}`} />
          </div>
        </AdminCard>
      </div>

      {/* Needs-attention row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {attention.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`p-4 rounded-2xl border bg-(--bg-card) hover:bg-(--bg-surface) transition-colors cursor-pointer block ${
              item.value > 0 ? "border-(--status-risk-med)/40" : "border-(--text-primary)/10"
            }`}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-(--text-muted) mb-1">{item.label}</p>
            <p className="text-3xl font-mono font-bold text-(--text-primary) tabular-nums">{item.value}</p>
            <div className="flex items-center gap-1.5 text-[10px] text-(--text-muted) mt-1 font-medium">
              <span className={`w-1.5 h-1.5 rounded-full ${item.value > 0 ? "bg-(--status-risk-med) animate-pulse" : "bg-(--status-risk-low)"}`} />
              {item.value > 0 ? (isBn ? "মনোযোগ প্রয়োজন" : "Needs attention") : (isBn ? "সব সম্পন্ন" : "All clear")}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
