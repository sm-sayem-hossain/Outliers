"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import AdminShell, { AdminNavItem } from "@/components/admin/AdminShell";
import { AdminDataProvider, useAdminData } from "./admin-data";
import {
  LayoutDashboard, CreditCard, Gavel, Building, CircleDollarSign, Users, FileText,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Super-admin layout — ADMIN-only guard, shared data provider, sidebar shell.
// ─────────────────────────────────────────────────────────────────────────────

function ShellContent({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const isBn = language === "bn";
  const {
    isLoading, isRefreshing, loadError, load,
    paymentsList, lawyersList, enterprisesList, withdrawalsList,
    totalPendingActions,
  } = useAdminData();

  const nav: AdminNavItem[] = [
    { href: "/admin", icon: LayoutDashboard, labelEn: "Overview", labelBn: "ওভারভিউ" },
    { href: "/admin/payments", icon: CreditCard, labelEn: "Payments", labelBn: "পেমেন্টস", count: paymentsList.length },
    { href: "/admin/lawyers", icon: Gavel, labelEn: "Lawyers", labelBn: "আইনজীবী", count: lawyersList.length },
    { href: "/admin/enterprises", icon: Building, labelEn: "Enterprises", labelBn: "এন্টারপ্রাইজ", count: enterprisesList.length },
    { href: "/admin/payouts", icon: CircleDollarSign, labelEn: "Payouts", labelBn: "পে-আউট", count: withdrawalsList.length },
    { href: "/admin/users", icon: Users, labelEn: "All Users", labelBn: "সব ইউজার" },
    { href: "/admin/docs", icon: FileText, labelEn: "Live Docs", labelBn: "লাইভ ডক্স" },
  ];

  return (
    <AdminShell
      nav={nav}
      eyebrow="SYSTEM ADMINISTRATION"
      title={isBn ? "কন্ট্রোল প্যানেল" : "Control Panel"}
      onRefresh={() => load(true)}
      isRefreshing={isRefreshing}
      footerEmail="admin@contractmind"
    >
      {totalPendingActions > 0 && (
        <div className="mb-4 flex items-center gap-2 text-[11px] font-bold text-(--status-risk-med)">
          <span className="w-1.5 h-1.5 rounded-full bg-(--status-risk-med) animate-pulse" />
          {totalPendingActions} {isBn ? "টি অ্যাকশন অপেক্ষমান" : "pending actions"}
          {loadError && (
            <span className="ml-3 font-normal text-(--text-muted)">
              · {isBn ? "কিছু ডাটা লোড ব্যর্থ — রিফ্রেশ করুন" : "some data failed to load — refresh"}
            </span>
          )}
        </div>
      )}
      {children}
    </AdminShell>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect once auth has restored — provider only mounts for real admins.
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (String(user.role).toUpperCase() !== "ADMIN") router.replace("/dashboard");
  }, [user, authLoading, router]);

  // Splash while auth restores from storage — avoids bouncing unauthenticated.
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="w-7 h-7 rounded-full border-2 border-(--text-primary)/20 border-t-(--text-primary) animate-spin" />
      </div>
    );
  }

  if (String(user.role).toUpperCase() !== "ADMIN") return null; // redirect in flight

  return (
    <AdminDataProvider>
      <ShellContent>{children}</ShellContent>
    </AdminDataProvider>
  );
}
