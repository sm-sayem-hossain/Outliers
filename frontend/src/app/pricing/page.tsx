/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

// Credit packages and SSLCommerz online checkout view
import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useNotification } from "@/context/NotificationContext";
import { getToken } from "@/lib/auth";
import {
  CreditPackage,
  Payment,
  PaymentGatewayConfig,
  PaymentSummary,
  cancelPayment,
  getPaymentGatewayConfig,
  getPaymentSummary,
  initiatePayment,
  listMyPayments,
  listPackages,
  verifyPaymentStatus,
} from "@/lib/apiServices";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  Copy,
  CreditCard,
  Loader2,
  Lock,
  Phone,
  RefreshCw,
  Sparkles,
  X,
  XCircle,
} from "lucide-react";

const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;

function normalizeBdPhone(raw?: string | null): string {
  if (!raw) return "";
  let cleaned = raw.trim().replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+880")) {
    cleaned = "0" + cleaned.slice(4);
  } else if (cleaned.startsWith("00880")) {
    cleaned = "0" + cleaned.slice(5);
  } else if (cleaned.startsWith("880")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (/^1[3-9]\d{8}$/.test(cleaned)) {
    cleaned = "0" + cleaned;
  }
  return cleaned;
}

function isValidBdPhone(raw?: string | null): boolean {
  return BD_PHONE_REGEX.test(normalizeBdPhone(raw));
}

function formatDate(iso?: string | null, isBn = false): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(isBn ? "bn-BD" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function StatusBadge({ status, isBn }: { status: string; isBn: boolean }) {
  const s = (status || "PENDING").toUpperCase();
  if (s === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="w-3 h-3" />
        {isBn ? "সফল" : "Approved"}
      </span>
    );
  }
  if (s === "PENDING" || s === "PENDING_VERIFICATION") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
        <Clock className="w-3 h-3" />
        {s === "PENDING_VERIFICATION"
          ? isBn
            ? "যাচাই চলছে"
            : "Verifying"
          : isBn
          ? "অপেক্ষমাণ"
          : "Pending"}
      </span>
    );
  }
  if (s === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-500/15 text-stone-600 dark:text-stone-300">
        <Ban className="w-3 h-3" />
        {isBn ? "বাতিল" : "Cancelled"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300">
      <XCircle className="w-3 h-3" />
      {s === "FAILED"
        ? isBn
          ? "ব্যর্থ"
          : "Failed"
        : s === "EXPIRED"
        ? isBn
          ? "মেয়াদ শেষ"
          : "Expired"
        : isBn
        ? "বাতিল/প্রত্যাখ্যাত"
        : s}
    </span>
  );
}

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading, refreshUser, updateUser } = useAuth();
  const { language } = useLanguage();
  const { toast } = useNotification();
  const isBn = language === "bn";
  const userId = user?.id ?? null;

  const userRole = String(user?.role || "").toUpperCase();
  const entStatus = String(user?.enterpriseProfile?.verificationStatus || "").toLowerCase();
  const isPendingEnterpriseAdmin =
    Boolean(
      user?.enterpriseProfile &&
        !user?.enterpriseProfile?.isTeamMember &&
        entStatus !== "verified"
    ) ||
    entStatus === "pending" ||
    entStatus === "pending_approval";
  const lawyerStatus = String(user?.lawyerProfile?.verificationStatus || "").toLowerCase();
  const isPendingLawyer =
    userRole === "LAWYER" && lawyerStatus !== "verified";
  const isPendingMember =
    (userRole === "ENTERPRISE_MEMBER" || user?.enterpriseProfile?.isTeamMember) &&
    ((user as any)?.member_approval_status === "PENDING" ||
      user?.enterpriseProfile?.memberApprovalStatus === "PENDING");
  const isEnterpriseMember = userRole === "ENTERPRISE_MEMBER";
  const isEnterpriseAdmin = userRole === "ENTERPRISE_ADMIN";

  useEffect(() => {
    if (authLoading || !user) return;
    if (isPendingEnterpriseAdmin) {
      router.replace("/enterprise/pending");
    } else if (isPendingLawyer) {
      router.replace("/lawyer/pending");
    } else if (isPendingMember) {
      router.replace("/enterprise/member");
    }
  }, [authLoading, user, isPendingEnterpriseAdmin, isPendingLawyer, isPendingMember, router]);

  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [gatewayConfig, setGatewayConfig] = useState<PaymentGatewayConfig | null>(null);
  const [redirectFallbackUrl, setRedirectFallbackUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initiatingPkgId, setInitiatingPkgId] = useState<string | number | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | number | null>(null);
  const [cancellingId, setCancellingId] = useState<string | number | null>(null);
  const [historyFilter, setHistoryFilter] = useState<string>("ALL");
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [expandedMobilePkgId, setExpandedMobilePkgId] = useState<string | number | null>(null);

  const toggleMobilePkg = (id: string | number) => {
    setExpandedMobilePkgId((prev) => (prev === id ? null : id));
  };

  const hasLoadedRef = useRef(false);
  const handledCallbackRef = useRef<string | null>(null);
  const bannerRef = useRef<HTMLDivElement | null>(null);

  const [banner, setBanner] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showBanner = useCallback(
    (
      next: { type: "success" | "error" | "info"; title: string; message: string },
      notify = true
    ) => {
      setBanner(next);
      if (notify) {
        if (next.type === "error") toast.error(next.message);
        else if (next.type === "success") toast.success(next.message);
        else toast.info(next.message);
      }
      if (typeof window !== "undefined") {
        requestAnimationFrame(() => {
          bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
      }
    },
    [toast]
  );

  // Pre-checkout phone prompt modal
  const [phoneModalPkg, setPhoneModalPkg] = useState<CreditPackage | null>(null);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent && !hasLoadedRef.current) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      try {
        const hasToken = Boolean(getToken());
        if (userId && !hasToken) {
          const cfg = await getPaymentGatewayConfig();
          setGatewayConfig(cfg);
          setPackages([]);
          setPayments([]);
          setSummary(null);
          setPackagesError(
            isBn
              ? "ডেমো সেশনে লাইভ SSLCommerz পেমেন্ট করা যায় না। প্যাকেজ দেখতে ও কিনতে অনুগ্রহ করে আসল অ্যাকাউন্টে সাইন ইন করুন।"
              : "Demo accounts cannot initiate live SSLCommerz payments. Please sign in with a registered account."
          );
          hasLoadedRef.current = true;
          return;
        }

        let pkgsFetchErr: string | null = null;
        const [cfg, pkgs, myPays, paySum] = await Promise.all([
          getPaymentGatewayConfig(),
          userId
            ? listPackages().catch((err: any) => {
                pkgsFetchErr =
                  err?.message ||
                  (isBn ? "ক্রেডিট প্যাকেজ লোড করা যায়নি।" : "Could not load credit packages.");
                return [];
              })
            : Promise.resolve([]),
          userId ? listMyPayments(undefined, 50, 0).catch(() => []) : Promise.resolve([]),
          userId ? getPaymentSummary().catch(() => null) : Promise.resolve(null),
        ]);
        setGatewayConfig(cfg);
        setPackages(pkgs);
        setPackagesError(pkgsFetchErr);
        setPayments(myPays);
        setSummary(paySum);
        hasLoadedRef.current = true;
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [userId, isBn]
  );

  useEffect(() => {
    if (authLoading) return;
    loadData(hasLoadedRef.current);
  }, [authLoading, loadData]);

  // Handle SSLCommerz return callback query parameters once per callback payload
  const paymentResult = searchParams.get("payment") || "";
  const callbackRefParam = searchParams.get("ref") || "";
  const callbackCreditsParam = searchParams.get("credits") || "";
  const callbackReasonParam = searchParams.get("reason") || "";

  useEffect(() => {
    if (!paymentResult || authLoading) return;

    const callbackKey = `${paymentResult}|${callbackRefParam}|${callbackCreditsParam}|${callbackReasonParam}`;
    if (handledCallbackRef.current === callbackKey) return;
    handledCallbackRef.current = callbackKey;

    if (paymentResult === "success") {
      setBanner({
        type: "success",
        title: isBn ? "পেমেন্ট সফল হয়েছে!" : "Payment Successful!",
        message: isBn
          ? `SSLCommerz গেটওয়ে থেকে পেমেন্ট যাচাই সম্পন্ন হয়েছে (${callbackRefParam || "যাচাইকৃত"})। আপনার অ্যাকাউন্টে ${callbackCreditsParam || ""} ক্রেডিট যুক্ত হয়েছে।`
          : `Payment verified via SSLCommerz (${callbackRefParam || "Confirmed"}). ${
              callbackCreditsParam
                ? `${callbackCreditsParam} credits have been added to your wallet.`
                : "Credits added."
            }`,
      });
      refreshUser?.();
      loadData(true);
    } else if (paymentResult === "failed") {
      setBanner({
        type: "error",
        title: isBn ? "পেমেন্ট সম্পন্ন হয়নি" : "Payment Could Not Be Completed",
        message: isBn
          ? `রেফারেন্স ${callbackRefParam || "—"} পেমেন্ট ব্যর্থ হয়েছে (${callbackReasonParam || "gateway_failed"})। টাকা কেটে থাকলে নিচের তালিকা থেকে 'Verify Status' বাটনে ক্লিক করুন।`
          : `Payment ${callbackRefParam ? `(${callbackRefParam})` : ""} was not completed (${
              callbackReasonParam || "gateway_failed"
            }). If funds were debited, click "Verify Status" on the order below.`,
      });
      loadData(true);
    } else if (paymentResult === "cancelled") {
      setBanner({
        type: "info",
        title: isBn ? "পেমেন্ট বাতিল করা হয়েছে" : "Checkout Cancelled",
        message: isBn
          ? `আপনি SSLCommerz পেমেন্ট প্রক্রিয়া বাতিল করেছেন (${callbackRefParam || "—"})। কোনো চার্জ কাটা হয়নি।`
          : `You cancelled the SSLCommerz checkout session (${callbackRefParam || "—"}). No charge was applied.`,
      });
      loadData(true);
    }
  }, [
    authLoading,
    paymentResult,
    callbackRefParam,
    callbackCreditsParam,
    callbackReasonParam,
    isBn,
    refreshUser,
    loadData,
  ]);

  const copyText = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const executeCheckout = async (pkg: CreditPackage, phoneOverride?: string) => {
    setPhoneError(null);
    setBanner(null);
    setRedirectFallbackUrl(null);

    if (!getToken()) {
      const msg = isBn
        ? "সক্রিয় সেশন টোকেন পাওয়া যায়নি (ডেমো মোড বা সেশন মেয়াদোত্তীর্ণ)। অনুগ্রহ করে পুনরায় লগইন করুন।"
        : "No active session token found (demo session or expired login). Please sign in again.";
      if (phoneModalPkg) {
        setPhoneError(msg);
      } else {
        showBanner({
          type: "error",
          title: isBn ? "লগইন প্রয়োজন" : "Session Required",
          message: msg,
        });
      }
      return;
    }

    setInitiatingPkgId(pkg.id);
    let redirected = false;

    try {
      const normalized = phoneOverride ? normalizeBdPhone(phoneOverride) : undefined;
      const res = await initiatePayment(pkg.id, normalized, pkg);

      if (normalized && normalized !== user?.mobile) {
        updateUser?.({ mobile: normalized });
      }
      setPhoneModalPkg(null);

      const gatewayUrl = typeof res?.gateway_url === "string" ? res.gateway_url.trim() : "";
      if (gatewayUrl && /^https?:\/\//i.test(gatewayUrl)) {
        redirected = true;
        setRedirectFallbackUrl(gatewayUrl);
        window.location.assign(gatewayUrl);
        setTimeout(() => setInitiatingPkgId(null), 2500);
        return;
      }

      showBanner({
        type: "error",
        title: isBn ? "চেকআউট ত্রুটি" : "Checkout Redirect Error",
        message: isBn
          ? "SSLCommerz পেমেন্ট গেটওয়ে URL পাওয়া যায়নি।"
          : "Did not receive a valid checkout URL from SSLCommerz.",
      });
    } catch (err: any) {
      const detail = err?.message || (isBn ? "চেকআউট শুরু করা যায়নি।" : "Could not start checkout.");
      const status = err?.status;
      const isPhoneRejection = status === 400 && /phone|mobile|নম্বর/i.test(detail);
      if (phoneModalPkg || isPhoneRejection) {
        if (!phoneModalPkg) {
          setPhoneInput(user?.mobile || "");
          setPhoneModalPkg(pkg);
        }
        setPhoneError(detail);
        toast.error(detail);
      } else {
        showBanner({
          type: "error",
          title: isBn ? "চেকআউট শুরু করা যায়নি" : "Checkout Unavailable",
          message: detail,
        });
      }
    } finally {
      if (!redirected) {
        setInitiatingPkgId(null);
      }
    }
  };

  const handleSelectPackage = (pkg: CreditPackage) => {
    if (!user) {
      router.push("/login?redirect=/pricing");
      return;
    }
    if (!getToken()) {
      showBanner({
        type: "error",
        title: isBn ? "লাইভ অ্যাকাউন্ট প্রয়োজন" : "Registered Account Required",
        message: isBn
          ? "ডেমো মোডে বা মেয়াদোত্তীর্ণ সেশনে SSLCommerz পেমেন্ট শুরু করা যায় না। অনুগ্রহ করে আবার লগইন করুন।"
          : "SSLCommerz checkout requires an active registered session. Please sign in again.",
      });
      return;
    }
    if (isPendingEnterpriseAdmin || isPendingLawyer || isPendingMember) {
      return;
    }
    if (isEnterpriseMember) {
      showBanner({
        type: "info",
        title: isBn ? "এন্টারপ্রাইজ সদস্য অ্যাকাউন্ট" : "Enterprise Member Account",
        message: isBn
          ? "আপনি কোম্পানির শেয়ার্ড ক্রেডিট পুল ব্যবহার করছেন। টপ-আপ করার জন্য অনুগ্রহ করে আপনার এন্টারপ্রাইজ অ্যাডমিনের সাথে যোগাযোগ করুন।"
          : "Enterprise members share their company's credit pool. Please ask your Enterprise Admin to purchase top-up packages.",
      });
      return;
    }

    const savedPhone = normalizeBdPhone(user.mobile);
    if (!isValidBdPhone(savedPhone)) {
      setPhoneInput(user.mobile || "");
      setPhoneError(null);
      setPhoneModalPkg(pkg);
      return;
    }

    executeCheckout(pkg, savedPhone);
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneModalPkg) return;
    const cleaned = normalizeBdPhone(phoneInput);
    if (!isValidBdPhone(cleaned)) {
      setPhoneError(
        isBn
          ? "সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।"
          : "Please enter a valid 11-digit Bangladeshi mobile number (e.g. 017XXXXXXXX)."
      );
      return;
    }
    executeCheckout(phoneModalPkg, cleaned);
  };

  const handleVerifyOrder = async (paymentId: string | number) => {
    setVerifyingId(paymentId);
    try {
      const res = await verifyPaymentStatus(paymentId);
      if (res.status === "APPROVED") {
        setBanner({
          type: "success",
          title: isBn ? "পেমেন্ট যাচাই সফল" : "Payment Reconciled",
          message:
            res.message ||
            (isBn
              ? `সফলভাবে ${res.credits_granted} ক্রেডিট অ্যাকাউন্টে যোগ হয়েছে।`
              : `${res.credits_granted} credits verified and added.`),
        });
        await refreshUser?.();
      } else {
        setBanner({
          type: "info",
          title: isBn ? "গেটওয়ে স্ট্যাটাস আপডেট" : "Gateway Status Checked",
          message: res.message,
        });
      }
      await loadData(true);
    } catch (err: any) {
      setBanner({
        type: "error",
        title: isBn ? "যাচাই ব্যর্থ" : "Verification Error",
        message: err?.message || "Could not verify transaction with SSLCommerz.",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleCancelOrder = async (paymentId: string | number) => {
    setCancellingId(paymentId);
    try {
      await cancelPayment(paymentId);
      await loadData(true);
    } catch (err: any) {
      setBanner({
        type: "error",
        title: isBn ? "বাতিল করা যায়নি" : "Cancel Failed",
        message: err?.message || "Failed to cancel payment.",
      });
    } finally {
      setCancellingId(null);
    }
  };

  const filteredPayments =
    historyFilter === "ALL"
      ? payments
      : payments.filter((p) => (p.status || "").toUpperCase() === historyFilter);
  const visiblePayments = showAllHistory ? filteredPayments : filteredPayments.slice(0, 3);
  const hasMorePayments = filteredPayments.length > 3;

  if (!authLoading && user && (isPendingEnterpriseAdmin || isPendingLawyer || isPendingMember)) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center p-6 font-sans">
          <div className="minimal-card p-8 flex flex-col items-center gap-3 text-center max-w-sm">
            <Loader2 className="w-7 h-7 animate-spin text-[var(--text-muted)]" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {isBn
                ? "অ্যাকাউন্ট ভেরিফিকেশন পেজে নেওয়া হচ্ছে..."
                : "Redirecting to verification status..."}
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10 font-sans">
        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
              {isBn
                ? "ক্রেডিট প্যাকেজ ও বিলিং"
                : "Credit Packages & Online Checkout"}
            </h1>
            <p className="text-sm sm:text-base text-[var(--text-muted)] leading-relaxed font-normal">
              {isBn
                ? "কার্ড, বিকাশ, নগদ, রকেট বা ইন্টারনেট ব্যাংকিং ব্যবহার করে তাৎক্ষণিকভাবে আপনার ওয়ালেটে ক্রেডিট যুক্ত করুন।"
                : "Top up your legal AI credits securely via Cards, bKash, Nagad, Rocket, or NetBanking with instant server-side validation."}
            </p>
          </div>

          {/* Current Wallet Card */}
          {user && (
            <div className="minimal-card px-5 py-4 flex items-center gap-4 shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-[var(--accent-solid)] text-[var(--accent-contrast)] flex items-center justify-center">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                  {isEnterpriseAdmin || isEnterpriseMember
                    ? isBn
                      ? "কোম্পানি ক্রেডিট পুল"
                      : "Company Credit Pool"
                    : isBn
                    ? "আপনার বর্তমান ব্যালেন্স"
                    : "Current Wallet Balance"}
                </p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {(
                    (isEnterpriseAdmin || isEnterpriseMember
                      ? user.enterprise_credit_balance ?? user.creditBalance
                      : user.creditBalance) ?? 0
                  ).toLocaleString()}{" "}
                  <span className="text-xs font-medium text-[var(--text-muted)]">
                    {isBn ? "ক্রেডিট" : "credits"}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Gateway Missing Credentials Notice */}
        {!loading && gatewayConfig && !gatewayConfig.sslcommerz_configured && (
          <div className="minimal-card p-5 border-l-4 border-amber-500 flex items-start gap-3.5 bg-amber-500/10">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-bold text-[var(--text-primary)]">
                {isBn
                  ? "SSLCommerz স্যান্ডবক্স ক্রেডেনশিয়াল এখনো যুক্ত করা হয়নি"
                  : "SSLCommerz Sandbox Credentials Not Configured Yet"}
              </p>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                {isBn
                  ? "চেকআউট সচল করতে ব্যাকএন্ডের `.env` ফাইলে `SSLCOMMERZ_STORE_ID` ও `SSLCOMMERZ_STORE_PASSWD` যোগ করুন।"
                  : "Set `SSLCOMMERZ_STORE_ID` and `SSLCOMMERZ_STORE_PASSWD` in backend `.env` to activate live sandbox gateway redirects."}
              </p>
            </div>
          </div>
        )}

        {/* Enterprise Member Informational Banner */}
        {isEnterpriseMember && (
          <div className="minimal-card p-5 flex items-start gap-3.5 bg-indigo-500/10">
            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-bold text-[var(--text-primary)]">
                {isBn
                  ? "শেয়ার্ড এন্টারপ্রাইজ ক্রেডিট অ্যাকাউন্ট"
                  : "Shared Organization Credit Pool"}
              </p>
              <p className="text-[var(--text-muted)] text-xs">
                {isBn
                  ? "এন্টারপ্রাইজ সদস্যরা কোম্পানির পুল থেকে ক্রেডিট ব্যবহার করেন। নতুন প্যাকেজ কেনার জন্য আপনার এন্টারপ্রাইজ অ্যাডমিনের সাথে যোগাযোগ করুন।"
                  : "As an Enterprise team member, your usage draws from your organization's shared credit pool. Contact your Enterprise Admin for top-ups."}
              </p>
            </div>
          </div>
        )}

        {/* Callback / Action Feedback Banner */}
        <div
          ref={bannerRef}
          className={banner || redirectFallbackUrl ? "space-y-4 scroll-mt-8" : "!mt-0"}
        >
          {banner && (
            <div
              className={`minimal-card p-5 flex items-start justify-between gap-4 ${
                banner.type === "success"
                  ? "bg-emerald-500/10"
                  : banner.type === "error"
                  ? "bg-rose-500/10"
                  : "bg-amber-500/10"
              }`}
            >
              <div className="flex items-start gap-3">
                {banner.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : banner.type === "error" ? (
                  <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">{banner.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                    {banner.message}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setBanner(null);
                  if (searchParams.get("payment")) {
                    router.replace("/pricing", { scroll: false });
                  }
                }}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)]"
                aria-label="Dismiss message"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {redirectFallbackUrl && (
            <div className="minimal-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-500/10">
              <div className="space-y-1">
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  {isBn
                    ? "SSLCommerz চেকআউট পেজ প্রস্তুত"
                    : "SSLCommerz Checkout Session Ready"}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {isBn
                    ? "স্বয়ংক্রিয়ভাবে পেমেন্ট পেজ না খুললে নিচের বাটনে ক্লিক করুন।"
                    : "If your browser did not redirect automatically, click below to open SSLCommerz."}
                </p>
              </div>
              <a
                href={redirectFallbackUrl}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shrink-0"
              >
                {isBn ? "SSLCommerz-এ যান" : "Open SSLCommerz Checkout"}
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Credit Packages Grid */}
        {(authLoading || loading) && packages.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="minimal-card p-7 h-72 animate-pulse opacity-60" />
            ))}
          </div>
        ) : !user ? (
          <div className="minimal-card p-8 text-center space-y-4">
            <CreditCard className="w-10 h-10 mx-auto text-[var(--text-muted)]" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {isBn
                ? "ক্রেডিট প্যাকেজ দেখতে লগইন করুন"
                : "Sign in to view credit packages"}
            </h2>
            <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
              {isBn
                ? "আপনার অ্যাকাউন্টের ধরন অনুযায়ী ক্রেডিট প্যাকেজ দেখতে এবং SSLCommerz-এ পেমেন্ট করতে লগইন করুন।"
                : "Sign in to unlock tailored personal or enterprise credit packages and instant SSLCommerz checkout."}
            </p>
            <button
              onClick={() => router.push("/login?redirect=/pricing")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-solid)] text-[var(--accent-contrast)] text-sm font-semibold hover:opacity-90 transition cursor-pointer"
            >
              {isBn ? "লগইন করুন" : "Sign In"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
            {packages.map((pkg) => {
              const isPop = Boolean(pkg.is_popular || pkg.badge_text);
              const isLoadingThis = initiatingPkgId === pkg.id;
              const perCredit =
                pkg.total_credits > 0 ? (pkg.price_bdt / pkg.total_credits).toFixed(2) : "—";
              const isExpanded = expandedMobilePkgId === pkg.id;

              return (
                <div
                  key={pkg.id}
                  className={`minimal-card p-4 md:p-7 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                    isPop ? "ring-2 ring-emerald-500/50" : ""
                  }`}
                >
                  {/* Mobile Compact Header (Mobile only) */}
                  <div
                    onClick={() => toggleMobilePkg(pkg.id)}
                    className="flex items-center justify-between gap-3 cursor-pointer md:hidden select-none"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-[var(--text-primary)]">
                          {pkg.name}
                        </h3>
                        {pkg.badge_text && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0">
                            <Sparkles className="w-2.5 h-2.5" />
                            {pkg.badge_text}
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-lg font-extrabold text-[var(--text-primary)]">
                          ৳{pkg.price_bdt.toLocaleString()}
                        </span>
                        <span className="text-[11px] font-medium text-[var(--text-muted)]">BDT</span>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 ml-1">
                          +{pkg.total_credits.toLocaleString()} {isBn ? "ক্রেডিট" : "Credits"}
                        </span>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-[var(--text-primary)]/5 flex items-center justify-center text-[var(--text-muted)] shrink-0">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180 text-[var(--text-primary)]" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Desktop Header (Desktop only) */}
                  <div className="hidden md:block space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">
                          {pkg.name}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                          {pkg.description}
                        </p>
                      </div>
                      {pkg.badge_text && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0">
                          <Sparkles className="w-3 h-3" />
                          {pkg.badge_text}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 border-t border-black/5 dark:border-white/5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-[var(--text-primary)]">
                          ৳{pkg.price_bdt.toLocaleString()}
                        </span>
                        <span className="text-xs font-medium text-[var(--text-muted)]">BDT</span>
                      </div>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-1">
                        +{pkg.total_credits.toLocaleString()}{" "}
                        {isBn ? "মোট ক্রেডিট" : "Total Credits"} (৳{perCredit}/credit)
                      </p>
                    </div>
                  </div>

                  {/* Expandable Details on Mobile / Always visible on Desktop */}
                  <div
                    className={`${
                      isExpanded
                        ? "block pt-4 mt-3 border-t border-black/5 dark:border-white/5 md:mt-0 md:pt-0 md:border-0"
                        : "hidden"
                    } md:flex md:flex-col md:justify-between flex-1`}
                  >
                    {/* On mobile expanded: show description and per-credit rate */}
                    <div className="md:hidden mb-2">
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-2">
                        {pkg.description}
                      </p>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        ৳{perCredit} / {isBn ? "প্রতি ক্রেডিট" : "credit"}
                      </p>
                    </div>

                    <ul className="space-y-2 pt-2 md:pt-4 text-xs text-[var(--text-muted)]">
                      {pkg.base_credits != null && (
                        <li className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>
                            {pkg.base_credits.toLocaleString()}{" "}
                            {isBn ? "বেস ক্রেডিট" : "base credits"}
                            {pkg.bonus_credits && pkg.bonus_credits > 0
                              ? ` + ${pkg.bonus_credits.toLocaleString()} ${
                                  isBn ? "বোনাস" : "bonus"
                                }`
                              : ""}
                          </span>
                        </li>
                      )}
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>
                          {isBn
                            ? "পেমেন্টের পর স্বয়ংক্রিয়ভাবে ক্রেডিট যুক্ত হবে"
                            : "Instant automatic credit fulfillment"}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>
                          {isBn
                            ? "ক্রেডিটের কোনো মেয়াদ শেষ হয় না"
                            : "Credits never expire"}
                        </span>
                      </li>
                    </ul>

                    <button
                      onClick={() => handleSelectPackage(pkg)}
                      disabled={isLoadingThis || isEnterpriseMember}
                      className={`mt-5 md:mt-6 w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        isPop
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-[var(--accent-solid)] text-[var(--accent-contrast)] hover:opacity-90"
                      }`}
                    >
                      {isLoadingThis ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isBn ? "গেটওয়ে খোলা হচ্ছে..." : "Opening SSLCommerz..."}
                        </>
                      ) : isEnterpriseMember ? (
                        isBn ? (
                          "অ্যাডমিন অনুমোদিত টপ-আপ"
                        ) : (
                          "Enterprise Admin Only"
                        )
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          {isBn ? "SSLCommerz দিয়ে পে করুন" : "Pay with SSLCommerz"}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

            {packages.length === 0 && (
              <div className="col-span-full minimal-card p-8 text-center space-y-3 text-sm text-[var(--text-muted)]">
                <p>
                  {packagesError ||
                    (isBn
                      ? "এই মুহূর্তে কোনো সক্রিয় ক্রেডিট প্যাকেজ পাওয়া যায়নি।"
                      : "No active credit packages available for your account tier right now.")}
                </p>
                {packagesError && (
                  <button
                    type="button"
                    onClick={() => loadData(false)}
                    disabled={isRefreshing}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-solid)] text-[var(--accent-contrast)] text-xs font-semibold hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    {isBn ? "আবার চেষ্টা করুন" : "Retry"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Billing Summary & Order History */}
        {user && (
          <div className="space-y-5 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  {isBn ? "পেমেন্ট ও ট্রানজেকশন ইতিহাস" : "Payment & Gateway History"}
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {isBn
                    ? "আপনার SSLCommerz লেনদেন এবং ভেরিফিকেশন আইডি দেখুন"
                    : "Track gateway verification IDs, payment methods, and instant credit top-ups"}
                </p>
              </div>
              <button
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl minimal-surface text-xs font-semibold text-[var(--text-primary)] hover:opacity-80 transition self-start cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                {isBn ? "রিফ্রেশ" : "Refresh"}
              </button>
            </div>

            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="minimal-card p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {isBn ? "মোট সফল টপ-আপ" : "Total Top-Ups"}
                  </p>
                  <p className="text-xl font-bold text-[var(--text-primary)] mt-1">
                    ৳{(summary.total_topup_bdt || 0).toLocaleString()}
                  </p>
                </div>
                <div className="minimal-card p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {isBn ? "সফল পেমেন্ট" : "Approved"}
                  </p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {summary.approved}
                  </p>
                </div>
                <div className="minimal-card p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {isBn ? "অপেক্ষমাণ" : "Pending"}
                  </p>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {summary.pending_submission + summary.awaiting_admin}
                  </p>
                </div>
                <div className="minimal-card p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {isBn ? "ব্যর্থ / বাতিল" : "Failed / Cancelled"}
                  </p>
                  <p className="text-xl font-bold text-[var(--text-muted)] mt-1">
                    {(summary.failed || 0) + (summary.cancelled || 0) + (summary.rejected || 0)}
                  </p>
                </div>
              </div>
            )}

            {/* Status Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {["ALL", "APPROVED", "PENDING", "FAILED", "CANCELLED"].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setHistoryFilter(st);
                    setShowAllHistory(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    historyFilter === st
                      ? "bg-[var(--accent-solid)] text-[var(--accent-contrast)]"
                      : "minimal-surface text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Payments List */}
            <div className="minimal-card overflow-hidden">
              {filteredPayments.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                  {isBn
                    ? "কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি।"
                    : "No payment records match the selected filter."}
                </div>
              ) : (
                <>
                  <div className="divide-y divide-black/5 dark:divide-white/5">
                    {visiblePayments.map((p) => {
                    const statusUpper = (p.status || "").toUpperCase();
                    const isPending = statusUpper === "PENDING";
                    return (
                      <div
                        key={p.id}
                        className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                              {p.reference_code}
                            </span>
                            <StatusBadge status={statusUpper} isBn={isBn} />
                            {p.card_type && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[10px] font-semibold">
                                {p.card_type}
                                {p.card_issuer ? ` · ${p.card_issuer}` : ""}
                              </span>
                            )}
                          </div>

                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {p.package_name || "Credit Package"} — ৳{p.amount_bdt.toLocaleString()}{" "}
                            <span className="text-emerald-600 dark:text-emerald-400">
                              (+{p.total_credits.toLocaleString()} credits)
                            </span>
                          </p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--text-muted)]">
                            <span>{formatDate(p.created_at, isBn)}</span>
                            {p.val_id && (
                              <button
                                onClick={() => copyText(p.val_id!, `val-${p.id}`)}
                                className="inline-flex items-center gap-1 font-mono hover:text-[var(--text-primary)] cursor-pointer"
                              >
                                val_id: {p.val_id}
                                <Copy className="w-3 h-3" />
                                {copiedKey === `val-${p.id}` && (
                                  <span className="text-emerald-500">Copied</span>
                                )}
                              </button>
                            )}
                            {p.bank_tran_id && (
                              <span className="font-mono">bank_tran: {p.bank_tran_id}</span>
                            )}
                            {!p.val_id && p.trx_id && (
                              <span className="font-mono">TrxID: {p.trx_id}</span>
                            )}
                          </div>
                        </div>

                        {isPending && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleVerifyOrder(p.id)}
                              disabled={verifyingId === p.id}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                            >
                              {verifyingId === p.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                              )}
                              {isBn ? "স্ট্যাটাস যাচাই" : "Verify Status"}
                            </button>
                            <button
                              onClick={() => handleCancelOrder(p.id)}
                              disabled={cancellingId === p.id}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl minimal-surface text-xs font-semibold text-rose-600 dark:text-rose-400 hover:opacity-80 transition cursor-pointer disabled:opacity-50"
                            >
                              {cancellingId === p.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <X className="w-3.5 h-3.5" />
                              )}
                              {isBn ? "বাতিল" : "Cancel"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                  {hasMorePayments && (
                    <div className="border-t border-black/5 dark:border-white/5 px-4 py-3 flex items-center justify-between gap-3 bg-[var(--bg-surface)]/40">
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {isBn
                          ? `${visiblePayments.length}টি দেখানো হচ্ছে (মোট ${filteredPayments.length}টি)`
                          : `Showing ${visiblePayments.length} of ${filteredPayments.length} transactions`}
                      </span>
                      <button
                        onClick={() => setShowAllHistory((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl minimal-surface text-xs font-semibold text-[var(--text-primary)] hover:opacity-80 transition cursor-pointer"
                      >
                        {showAllHistory ? (
                          <>
                            {isBn ? "কম দেখান" : "Show Less"}
                            <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            {isBn
                              ? `আরও দেখুন (+${filteredPayments.length - 3})`
                              : `See More (+${filteredPayments.length - 3})`}
                            <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pre-Checkout Mobile Number Prompt Modal */}
      {phoneModalPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-sans">
          <div className="minimal-card w-full max-w-md p-6 space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setPhoneModalPkg(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-muted)]"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1.5 pr-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {isBn
                  ? "চেকআউটের আগে মোবাইল নম্বর দিন"
                  : "Enter Mobile Number for Checkout"}
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {isBn
                  ? "আপনার প্রোফাইলে মোবাইল নম্বর যুক্ত নেই। SSLCommerz পেমেন্ট রিসিট ও নিরাপত্তার জন্য একটি সচল নম্বর প্রয়োজন।"
                  : "Your profile does not have a phone number yet. SSLCommerz requires a valid Bangladeshi mobile number for transaction receipts."}
              </p>
            </div>

            <div className="minimal-surface p-3.5 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-[var(--text-primary)]">{phoneModalPkg.name}</p>
                <p className="text-[var(--text-muted)]">
                  +{phoneModalPkg.total_credits.toLocaleString()} credits
                </p>
              </div>
              <p className="text-base font-extrabold text-[var(--text-primary)]">
                ৳{phoneModalPkg.price_bdt.toLocaleString()}
              </p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  {isBn ? "বাংলাদেশি মোবাইল নম্বর" : "Bangladeshi Mobile Number"}
                </label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    setPhoneError(null);
                  }}
                  placeholder="017XXXXXXXX"
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {phoneError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 font-medium">
                    {phoneError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setPhoneModalPkg(null)}
                  className="px-4 py-2.5 rounded-xl minimal-surface text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  {isBn ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={initiatingPkgId === phoneModalPkg.id}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {initiatingPkgId === phoneModalPkg.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  {isBn ? "সেভ ও পেমেন্ট করুন" : "Save & Proceed to Pay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
