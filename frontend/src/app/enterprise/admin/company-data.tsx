"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  getCompanyDashboard,
  listMembers,
  listPendingMembers,
  getCompanyAuditLogs,
  getSharedContracts,
  listPlaybooks,
  Playbook,
} from "@/lib/apiServices";
import {
  mapBackendMember,
  mapBackendRuleToFrontend,
  EnterpriseMember,
  Organization,
  PlaybookRule,
} from "./_components/types";

// ─────────────────────────────────────────────────────────────────────────────
// Enterprise admin data context — company dashboard, members, pending queue,
// audit logs, vault contracts and playbooks, loaded once at layout level.
// ─────────────────────────────────────────────────────────────────────────────

interface CompanyDataContextValue {
  isLoading: boolean;
  isRefreshing: boolean;
  loadError: string | null;
  organization: Organization | null;
  usedThisMonth: number;
  members: EnterpriseMember[];
  pendingMembers: { user_id: number | string; email: string; full_name: string; phone?: string | null; requested_at: string; is_verified: boolean }[];
  auditLogs: any[];
  sharedContracts: any[];
  playbooks: Playbook[];
  activePlaybook: Playbook | null;
  playbookRules: PlaybookRule[];
  refetchAll: () => Promise<void>;
}

const CompanyDataContext = createContext<CompanyDataContextValue | null>(null);

export function useCompanyData() {
  const ctx = useContext(CompanyDataContext);
  if (!ctx) throw new Error("useCompanyData must be used within CompanyDataProvider");
  return ctx;
}

export function CompanyDataProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [usedThisMonth, setUsedThisMonth] = useState(0);
  const [members, setMembers] = useState<EnterpriseMember[]>([]);
  const [pendingMembers, setPendingMembers] = useState<CompanyDataContextValue["pendingMembers"]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [sharedContracts, setSharedContracts] = useState<any[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [activePlaybook, setActivePlaybook] = useState<Playbook | null>(null);
  const [playbookRules, setPlaybookRules] = useState<CompanyDataContextValue["playbookRules"]>([]);

  const refetchAll = useCallback(async () => {
    setIsRefreshing(true);
    setLoadError(null);
    try {
      const [dashRes, memsRes, pendingRes, logsRes, sharedRes, playbooksRes] = await Promise.allSettled([
        getCompanyDashboard(),
        listMembers(),
        listPendingMembers(),
        getCompanyAuditLogs(),
        getSharedContracts(),
        listPlaybooks(),
      ]);

      let anyFulfilled = false;

      // 1. Dashboard → organization + credit pool
      if (dashRes.status === "fulfilled" && dashRes.value) {
        anyFulfilled = true;
        const d = dashRes.value as any;
        const ent = d.enterprise || {};
        const memb = d.members || {};
        const cred = d.credits || {};
        const poolBalance = Number(cred.pool_balance ?? ent.credit_balance ?? 0);
        const monthlyUsed = Number(cred.used_this_month ?? 0);
        setUsedThisMonth(monthlyUsed);
        setOrganization({
          id: ent.id,
          name: ent.name,
          referCode: ent.referral_code,
          usedSeats: memb.active ?? 0,
          totalSeats: ent.member_limit ?? 0,
          creditPoolRemaining: poolBalance,
          creditPoolTotal: poolBalance + monthlyUsed,
          registrationNo: ent.registration_no || "—",
          tinNo: ent.tin_no || "—",
        });
      }

      // 2. Members
      if (memsRes.status === "fulfilled" && Array.isArray(memsRes.value)) {
        anyFulfilled = true;
        setMembers((memsRes.value as any[]).map((m) => {
          const isCurrentUserAdmin = m.email === user?.email || String(m.user_id || m.id) === String(user?.id);
          const base = mapBackendMember(m);
          if (isCurrentUserAdmin || String(m.company_role || "").toUpperCase() === "ADMIN") {
            base.role = "admin";
            base.status = "active";
            if (!base.department || base.department === "—") {
              base.department = isBn ? "এক্সিকিউটিভ অ্যাডমিন" : "Executive / Admin";
            }
          }
          return base;
        }));
      }

      // 3. Pending members (excludes the enterprise admin themself)
      if (pendingRes.status === "fulfilled" && Array.isArray(pendingRes.value)) {
        anyFulfilled = true;
        setPendingMembers(
          (pendingRes.value as any[])
            .filter((m) =>
              m.email !== user?.email &&
              String(m.user_id || m.id) !== String(user?.id) &&
              String(m.company_role || "").toUpperCase() !== "ADMIN"
            )
            .map((m) => ({
              user_id: m.user_id || m.id,
              email: m.email,
              full_name: m.full_name,
              phone: m.phone,
              requested_at: m.requested_at || m.joined_at || new Date().toISOString(),
              is_verified: m.is_verified ?? false,
            }))
        );
      }

      // 4. Audit logs
      if (logsRes.status === "fulfilled" && Array.isArray(logsRes.value)) {
        anyFulfilled = true;
        setAuditLogs(logsRes.value);
      }

      // 5. Shared contracts (vault)
      if (sharedRes.status === "fulfilled" && Array.isArray(sharedRes.value)) {
        anyFulfilled = true;
        setSharedContracts(sharedRes.value);
      }

      // 6. Playbooks → active policy + rules
      if (playbooksRes.status === "fulfilled" && Array.isArray(playbooksRes.value)) {
        anyFulfilled = true;
        const pbs = playbooksRes.value;
        setPlaybooks(pbs);
        const activePb = pbs.find((p: any) => p.is_active) || (pbs.length > 0 ? pbs[0] : null);
        setActivePlaybook(activePb);
        if (activePb && Array.isArray(activePb.rules) && activePb.rules.length > 0) {
          setPlaybookRules(activePb.rules.map(mapBackendRuleToFrontend));
        } else if (pbs.length === 0) {
          setPlaybookRules([]);
        }
      }

      if (!anyFulfilled) setLoadError(isBn ? "সার্ভারে সংযোগ ব্যর্থ।" : "Backend connection failed.");
    } catch (err) {
      console.error("[Enterprise Admin] refetch error:", err);
      setLoadError(isBn ? "সার্ভারে সংযোগ ব্যর্থ।" : "Backend connection failed.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, isBn]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    refetchAll();
  }, [user, authLoading, router, refetchAll]);

  return (
    <CompanyDataContext.Provider
      value={{
        isLoading, isRefreshing, loadError, organization, usedThisMonth,
        members, pendingMembers, auditLogs, sharedContracts, playbooks,
        activePlaybook, playbookRules, refetchAll,
      }}
    >
      {children}
    </CompanyDataContext.Provider>
  );
}

