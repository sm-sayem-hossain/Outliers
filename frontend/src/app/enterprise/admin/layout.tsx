"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import AdminShell, { AdminNavItem } from "@/components/admin/AdminShell";
import { CompanyDataProvider, useCompanyData } from "./company-data";
import {
  TrendingUp, Users, BookOpen, FolderLock,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Enterprise admin layout — guard (ENTERPRISE_ADMIN / ADMIN / ENTERPRISE),
// shared company data provider, sidebar shell with org identity.
// ─────────────────────────────────────────────────────────────────────────────

function ShellContent({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const isBn = language === "bn";
  const { isLoading, isRefreshing, refetchAll, organization, pendingMembers, members, playbookRules } = useCompanyData();

  const nav: AdminNavItem[] = [
    { href: "/enterprise/admin", icon: TrendingUp, labelEn: "Overview", labelBn: "ওভারভিউ" },
    { href: "/enterprise/admin/members", icon: Users, labelEn: "Members", labelBn: "সদস্য", count: pendingMembers.length > 0 ? pendingMembers.length : members.length },
    { href: "/enterprise/admin/playbook", icon: BookOpen, labelEn: "Playbook", labelBn: "প্লেবুক", count: playbookRules.length },
    { href: "/enterprise/admin/vault", icon: FolderLock, labelEn: "Vault", labelBn: "ভল্ট" },
  ];

  return (
    <AdminShell
      nav={nav}
      eyebrow="ENTERPRISE ADMIN PORTAL"
      title={organization?.name || (isBn ? "প্রতিষ্ঠান" : "Organization")}
      subtitle={organization && organization.registrationNo !== "—" ? `RJSC: ${organization.registrationNo}` : undefined}
      onRefresh={refetchAll}
      isRefreshing={isRefreshing}
      footerEmail={organization?.referCode ? `INVITE: ${organization.referCode}` : undefined}
    >
      {isLoading ? null : children}
    </AdminShell>
  );
}

export default function EnterpriseAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";

  const roleUpper = user ? String(user.role).toUpperCase() : "";
  const isAdmin = roleUpper === "ENTERPRISE_ADMIN" || roleUpper === "ADMIN";
  const isAllowed = !!user && (isAdmin || roleUpper === "ENTERPRISE");

  // Guard — mirrors the previous page-level redirects.
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (roleUpper === "LAWYER") { router.replace("/lawyer/pending"); return; }
    if (user?.enterpriseProfile?.verificationStatus === "pending") { router.replace("/enterprise/pending"); return; }
    if (!isAllowed) router.replace("/dashboard");
  }, [user, authLoading, roleUpper, isAllowed, router]);

  if (authLoading || !user || !isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="w-7 h-7 rounded-full border-2 border-(--text-primary)/20 border-t-(--text-primary) animate-spin" />
      </div>
    );
  }

  return (
    <CompanyDataProvider>
      <ShellContent>{children}</ShellContent>
    </CompanyDataProvider>
  );
}
