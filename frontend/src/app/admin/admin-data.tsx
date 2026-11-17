"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getAdminDashboardStats,
  getAdminFinancials,
  getAdminPendingLawyers,
  getAdminPendingWithdrawals,
  getAdminPendingPayments,
  getAdminPayments,
  getAdminUsers,
  getAdminPendingEnterprises,
  AdminDashboardStats,
  AdminFinancials,
  AdminPendingLawyer,
  WithdrawalRequest,
  AdminPendingPayment,
  AdminPaymentRecord,
  AdminUser,
  AdminPendingEnterprise,
} from "@/lib/apiServices";

// ─────────────────────────────────────────────────────────────────────────────
// Super-admin data context — loads all 8 platform endpoints once at layout
// level; every /admin/* route consumes it. Tracks load errors for retry.
// ─────────────────────────────────────────────────────────────────────────────

interface AdminDataContextValue {
  isLoading: boolean;
  isRefreshing: boolean;
  loadError: boolean;
  stats: AdminDashboardStats | null;
  financials: AdminFinancials | null;
  lawyersList: AdminPendingLawyer[];
  setLawyersList: React.Dispatch<React.SetStateAction<AdminPendingLawyer[]>>;
  withdrawalsList: WithdrawalRequest[];
  setWithdrawalsList: React.Dispatch<React.SetStateAction<WithdrawalRequest[]>>;
  paymentsList: AdminPendingPayment[];
  setPaymentsList: React.Dispatch<React.SetStateAction<AdminPendingPayment[]>>;
  gatewayPayments: AdminPaymentRecord[];
  setGatewayPayments: React.Dispatch<React.SetStateAction<AdminPaymentRecord[]>>;
  usersList: AdminUser[];
  setUsersList: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  enterprisesList: AdminPendingEnterprise[];
  setEnterprisesList: React.Dispatch<React.SetStateAction<AdminPendingEnterprise[]>>;
  load: (silent?: boolean) => Promise<void>;
  totalPendingActions: number;
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
}

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [financials, setFinancials] = useState<AdminFinancials | null>(null);
  const [lawyersList, setLawyersList] = useState<AdminPendingLawyer[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<WithdrawalRequest[]>([]);
  const [paymentsList, setPaymentsList] = useState<AdminPendingPayment[]>([]);
  const [gatewayPayments, setGatewayPayments] = useState<AdminPaymentRecord[]>([]);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [enterprisesList, setEnterprisesList] = useState<AdminPendingEnterprise[]>([]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const [statsRes, finRes, lawyersRes, withRes, payRes, gwPayRes, usersRes, entRes] = await Promise.allSettled([
        getAdminDashboardStats(),
        getAdminFinancials(),
        getAdminPendingLawyers(),
        getAdminPendingWithdrawals(),
        getAdminPendingPayments(),
        getAdminPayments(),
        getAdminUsers(),
        getAdminPendingEnterprises(),
      ]);
      const results = [statsRes, finRes, lawyersRes, withRes, payRes, gwPayRes, usersRes, entRes];
      const fulfilled = results.filter((r) => r.status === "fulfilled").length;
      setLoadError(fulfilled === 0);
      if (statsRes.status === "fulfilled" && statsRes.value) setStats(statsRes.value);
      if (finRes.status === "fulfilled" && finRes.value) setFinancials(finRes.value);
      if (lawyersRes.status === "fulfilled" && Array.isArray(lawyersRes.value)) setLawyersList(lawyersRes.value);
      if (withRes.status === "fulfilled" && Array.isArray(withRes.value)) setWithdrawalsList(withRes.value);
      if (payRes.status === "fulfilled" && Array.isArray(payRes.value)) setPaymentsList(payRes.value);
      if (gwPayRes.status === "fulfilled" && Array.isArray(gwPayRes.value)) setGatewayPayments(gwPayRes.value);
      if (usersRes.status === "fulfilled" && Array.isArray(usersRes.value)) setUsersList(usersRes.value);
      if (entRes.status === "fulfilled" && Array.isArray(entRes.value)) setEnterprisesList(entRes.value);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Hydration-safe guard: wait for auth restore before redirecting.
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (String(user.role).toUpperCase() !== "ADMIN") { router.replace("/dashboard"); return; }
    load();
  }, [user, authLoading, router, load]);

  const totalPendingActions = useMemo(
    () => paymentsList.length + lawyersList.length + enterprisesList.length + withdrawalsList.length,
    [paymentsList, lawyersList, enterprisesList, withdrawalsList]
  );

  const value: AdminDataContextValue = {
    isLoading, isRefreshing, loadError, stats, financials,
    lawyersList, setLawyersList,
    withdrawalsList, setWithdrawalsList,
    paymentsList, setPaymentsList,
    gatewayPayments, setGatewayPayments,
    usersList, setUsersList,
    enterprisesList, setEnterprisesList,
    load, totalPendingActions,
  };

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}
