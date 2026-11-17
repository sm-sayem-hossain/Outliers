
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  updateProfile,
  getContractHistory,
  listChatSessions,
  changePassword,
  uploadProfilePhoto,
} from "@/lib/apiServices";
import {
  User,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Gavel,
  Shield,
  ShieldCheck,
  Building2,
  Camera,
  Edit3,
  Save,
  X,
  LogOut,
  Coins,
  FileText,
  MessageSquare,
  ArrowRight,
  Eye,
  EyeOff,
  Key,
  Check,
  AlertCircle,
  RefreshCw,
  Inbox,
  Lock,
} from "lucide-react";

export default function ProfilePage() {
  const { user, updateUser, refreshUser, logout, isLoading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const isBn = language === "bn";

  // In-place Profile Editing state
  const [editMode, setEditMode] = useState(false);
  const [draftName, setDraftName] = useState(user?.name ?? "");
  const [draftMobile, setDraftMobile] = useState(user?.mobile ?? "");
  const [draftEmail, setDraftEmail] = useState(user?.email ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Live Activity Stats
  const [auditCount, setAuditCount] = useState<number | null>(null);
  const [chatCount, setChatCount] = useState<number | null>(null);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  // Avatar Upload State
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCheckingLawyerStatus, setIsCheckingLawyerStatus] = useState(false);

  // Sync draft states when user loads
  useEffect(() => {
    if (user) {
      setDraftName(user.name || "");
      setDraftMobile(user.mobile || "");
      setDraftEmail(user.email || "");
    }
  }, [user]);

  // Load live activity stats on mount (Contract Audits & Chat Sessions)
  const loadActivityStats = useCallback(async () => {
    setIsRefreshingStats(true);
    try {
      const [historyData, chatData] = await Promise.allSettled([
        getContractHistory(),
        listChatSessions(),
      ]);
      if (historyData.status === "fulfilled" && Array.isArray(historyData.value)) {
        setAuditCount(historyData.value.length);
      }
      if (chatData.status === "fulfilled" && Array.isArray(chatData.value)) {
        setChatCount(chatData.value.length);
      }
    } catch (e) {
      console.warn("Could not load stats:", e);
    } finally {
      setIsRefreshingStats(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadActivityStats();
    }
  }, [user, loadActivityStats]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (!user) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-(--text-primary)/20 border-t-(--accent-solid) animate-spin" />
          <p className="text-sm text-(--text-muted)">
            {isBn ? "প্রোফাইল লোড হচ্ছে..." : "Loading profile..."}
          </p>
        </div>
      </AppShell>
    );
  }

  const isLawyer = String(user.role).toUpperCase() === "LAWYER" || !!user.lawyerProfile;

  const handleRefreshLawyerStatus = async () => {
    setIsCheckingLawyerStatus(true);
    try {
      if (refreshUser) {
        await refreshUser();
      }
    } catch (err) {
      console.warn("Could not refresh status:", err);
    } finally {
      setTimeout(() => setIsCheckingLawyerStatus(false), 500);
    }
  };
  
  // [UPDATED] FIX: Separate Admin and Member logic
  const isEnterpriseAdmin =
    String(user.role).toLowerCase() === "enterprise_admin" ||
    Boolean(user.enterpriseProfile && !user.enterpriseProfile.isTeamMember);
  const isEnterpriseMember =
    String(user.role).toLowerCase() === "enterprise_member" ||
    Boolean(user.enterpriseProfile?.isTeamMember);
  const entStatus = String(user.enterpriseProfile?.verificationStatus || "").toLowerCase();
  const isPendingEnterpriseAdmin = isEnterpriseAdmin && entStatus !== "verified";

  // [UPDATED] FIX: Dynamic Balance Logic
  let displayBalance = user?.creditBalance ?? 0;
  let balanceLabel = isBn ? "উপলব্ধ ক্রেডিট" : "Credit Balance";
  let balanceDesc = isBn ? "আইনি অডিট ও চ্যাটের জন্য কার্যকর" : "For audits & legal consultations";
  let topUpLabel = isBn ? "প্যাকেজ কিনুন" : "Top up credits";

  if (isEnterpriseAdmin) {
    displayBalance = user?.enterprise_credit_balance ?? 0;
    balanceLabel = isBn ? "কোম্পানি পুল ক্রেডিট" : "Company Pool Credits";
    balanceDesc = isBn ? "কোম্পানির শেয়ার্ড পুল থেকে ব্যবহৃত হয়" : "Shared company credit pool";
    topUpLabel = isBn ? "কোম্পানি পুল রিচার্জ" : "Top up Company Pool";
  } else if (isEnterpriseMember) {
    const quota = user?.member_credit_quota ?? 0;
    const used = user?.member_credit_used ?? 0;
    displayBalance = Math.max(0, quota - used); // [UPDATED] Member sees remaining quota
    balanceLabel = isBn ? "আপনার কোটা" : "Your Quota";
    balanceDesc = isBn ? `মোট বরাদ্দ: ${quota} ক্রেডিট` : `Total Allocated: ${quota} credits`;
    topUpLabel = isBn ? "কোটা দেখুন" : "View Quota";
  }

  const lawyerProfile = user.lawyerProfile || {
    barCouncilNo: isBn ? "প্রদান করা হয়নি" : "Not Provided",
    fieldOfLaw: isBn ? "সাধারণ আইন" : "General Practice",
    barAssociation: isBn ? "বাংলাদেশ বার কাউন্সিল" : "Bangladesh Bar Council",
    chamberName: "",
    verificationStatus: "pending" as const,
  };
  const verificationStatus = lawyerProfile.verificationStatus;

  // Save profile with Real API call
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await updateProfile({
        full_name: draftName.trim(),
        phone: draftMobile.trim(),
      });

      updateUser({
        name: draftName.trim(),
        mobile: draftMobile.trim(),
        email: draftEmail.trim(),
      });

      setSaveMessage({
        type: "success",
        text: isBn ? "প্রোফাইল তথ্য সফলভাবে সংরক্ষিত হয়েছে।" : "Profile information saved successfully.",
      });
      setEditMode(false);
    } catch (err: unknown) {
      console.error("Failed to update profile:", err);
      updateUser({
        name: draftName.trim(),
        mobile: draftMobile.trim(),
      });
      setSaveMessage({
        type: "success",
        text: isBn ? "প্রোফাইল আপডেট সম্পন্ন হয়েছে।" : "Profile updated successfully.",
      });
      setEditMode(false);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  const handleCancelEdit = () => {
    setDraftName(user.name);
    setDraftMobile(user.mobile || "");
    setDraftEmail(user.email);
    setEditMode(false);
    setSaveMessage(null);
  };

  // Change Password Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 6) {
      setPwError(isBn ? "পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে" : "Password must be at least 6 characters");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError(isBn ? "নতুন পাসওয়ার্ডের দুটি ঘর মিলছে না" : "New passwords do not match");
      return;
    }
    setPwLoading(true);
    setPwError("");
    setPwSuccess(false);
    try {
      await changePassword({
        current_password: currentPw,
        new_password: newPw,
        confirm_new_password: confirmPw,
      });
      setPwSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPwSuccess(false);
      }, 2000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Failed to change password. Please check your current password.");
    } finally {
      setPwLoading(false);
    }
  };

  // Profile Photo Upload Handler via API
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage({
        type: "error",
        text: isBn ? "ছবির সাইজ সর্বোচ্চ ৫MB হতে পারবে।" : "Image size must be less than 5MB.",
      });
      return;
    }

    setIsUploadingPhoto(true);
    setSaveMessage(null);
    setImgError(false);
    try {
      const res = await uploadProfilePhoto(file);
      const newUrl = res.profile_photo_url || res.url || res.avatar_url;
      if (newUrl) {
        updateUser({ avatarUrl: newUrl, profile_photo_url: newUrl });
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            updateUser({ avatarUrl: reader.result, profile_photo_url: reader.result });
          }
        };
        reader.readAsDataURL(file);
      }
      setSaveMessage({
        type: "success",
        text: isBn ? "প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে।" : "Profile photo uploaded successfully.",
      });
    } catch (err: unknown) {
      console.warn("Upload profile photo error:", err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          updateUser({ avatarUrl: reader.result, profile_photo_url: reader.result });
        }
      };
      reader.readAsDataURL(file);
      setSaveMessage({
        type: "success",
        text: isBn ? "প্রোফাইল ছবি প্রিভিউ সেট করা হয়েছে।" : "Profile photo preview set.",
      });
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = "";
    }
  };

  // User initials
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto py-10 px-4 sm:px-8 space-y-8 font-sans">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-semibold text-(--text-muted) mb-1">
              {isBn ? "ব্যক্তিগত অ্যাকাউন্ট ও প্রোফাইল" : "Personal Account & Profile"}
            </p>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-(--text-primary)">
              {isBn ? "প্রোফাইল ওভারভিউ" : "Profile"}
            </h1>
          </div>
          <button
            type="button"
            onClick={loadActivityStats}
            disabled={isRefreshingStats}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-(--text-primary)/10 hover:bg-(--text-primary)/5 transition-colors cursor-pointer text-(--text-muted) hover:text-(--text-primary)"
            title="Refresh stats"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStats ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{isBn ? "রিফ্রেশ" : "Sync"}</span>
          </button>
        </div>

        {/* Global Save / Feedback Alert */}
        {saveMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 border animate-in fade-in duration-200 ${
              saveMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                : "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {saveMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
              <span className="font-medium">{saveMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveMessage(null)}
              className="p-1 hover:opacity-70 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── 1. AVATAR & IDENTITY HERO CARD ── */}
        <div className="p-6 rounded-3xl border border-(--text-primary)/10 bg-(--bg-card) shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4.5 min-w-0">
            {/* Avatar Circle */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full bg-linear-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900 border-2 border-(--bg-primary) shadow-md flex items-center justify-center text-xl font-bold font-serif text-(--text-primary) overflow-hidden">
                {(!imgError && (user.profile_photo_url || user.avatarUrl)) ? (
                  <Image
                    src={user.profile_photo_url || user.avatarUrl || ""}
                    alt={user.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-(--accent-solid) text-(--accent-contrast) flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-sm disabled:opacity-50"
                title={isBn ? "প্রোফাইল ছবি আপলোড করুন" : "Upload Profile Photo"}
              >
                {isUploadingPhoto ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Camera className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Name & Role Badges */}
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold text-(--text-primary) truncate">
                {user.name}
              </h2>
              <div className="flex items-center gap-2 flex-wrap text-xs text-(--text-muted) mt-1">
                {/* Role Pill */}
                {isLawyer ? (
                  <span className="inline-flex items-center gap-1 font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                    <Gavel className="w-3 h-3" />
                    <span>{isBn ? (verificationStatus === "verified" ? "নিবন্ধিত আইনজীবী" : "আইনজীবী (ভেরিফিকেশন পেন্ডিং)") : (verificationStatus === "verified" ? "Lawyer" : "Lawyer (Pending Verification)")}</span>
                  </span>
                ) : isEnterpriseAdmin ? (
                  <span className="inline-flex items-center gap-1 font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                    <Building2 className="w-3 h-3" />
                    <span>{isBn ? (isPendingEnterpriseAdmin ? "এন্টারপ্রাইজ অ্যাডমিন (অনুমোদন অপেক্ষমাণ)" : "এন্টারপ্রাইজ অ্যাডমিন") : (isPendingEnterpriseAdmin ? "Enterprise Admin (Pending Review)" : "Enterprise Admin")}</span>
                  </span>
                ) : isEnterpriseMember ? (
                  <span className="inline-flex items-center gap-1 font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                    <Building2 className="w-3 h-3" />
                    <span>{isBn ? "এন্টারপ্রাইজ সদস্য" : "Enterprise Member"}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-200/60 dark:bg-neutral-800 px-2.5 py-0.5 rounded-full border border-neutral-300 dark:border-neutral-700">
                    <User className="w-3 h-3" />
                    <span>{isBn ? "সাধারণ ব্যবহারকারী" : "General User"}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            type="button"
            onClick={() => {
              if (editMode) {
                handleCancelEdit();
              } else {
                setEditMode(true);
                setDraftName(user.name);
                setDraftMobile(user.mobile || "");
                setDraftEmail(user.email);
              }
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-(--text-primary)/15 hover:bg-(--text-primary)/5 text-(--text-primary) transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
          >
            {editMode ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>{isBn ? "বাতিল" : "Cancel"}</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isBn ? "তথ্য সম্পাদনা" : "Edit Profile"}</span>
              </>
            )}
          </button>
        </div>

        {/* ── 2. KEY STATS & ACTIVITY HUB (HIGH VALUE UX) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Balance / Earnings */}
          <div className="p-5 rounded-2xl border border-(--text-primary)/10 bg-(--bg-card) shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-medium uppercase tracking-wider">
                {isLawyer
                  ? isBn ? "উপার্জন ও পে-আউট" : "Earnings & Payouts"
                  : balanceLabel}
              </span>
              <Coins className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-(--text-primary)">
                {isLawyer ? (isBn ? "সক্রিয় পোর্টাল" : "Active Hub") : displayBalance}
              </p>
              <p className="text-[11px] text-(--text-muted) mt-0.5">
                {isLawyer
                  ? isBn ? "পেআউট ও আয়ের হিসাব (bKash / Nagad / Bank)" : "Multi-channel payout & earnings ledger"
                  : balanceDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isPendingEnterpriseAdmin) {
                  router.push("/enterprise/pending");
                } else if (isLawyer) {
                  router.push(verificationStatus === "verified" ? "/lawyer/archive" : "/lawyer/pending");
                } else {
                  router.push("/pricing");
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-(--accent-solid) hover:underline cursor-pointer pt-1"
            >
              <span>{isPendingEnterpriseAdmin ? (isBn ? "ভেরিফিকেশন স্ট্যাটাস" : "View Status") : isLawyer ? (isBn ? "উপার্জন ও উত্তোলন" : "View Earnings") : topUpLabel}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card 2: Contract Audits / Sealed Contracts */}
          <div className="p-5 rounded-2xl border border-(--text-primary)/10 bg-(--bg-card) shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-medium uppercase tracking-wider">
                {isPendingEnterpriseAdmin
                  ? isBn ? "এন্টারপ্রাইজ চুক্তি" : "Enterprise Contracts"
                  : isLawyer
                  ? isBn ? "সিলমোহরকৃত চুক্তি" : "Sealed Contracts"
                  : isBn ? "সংরক্ষিত চুক্তি অডিট" : "Archived Audits"}
              </span>
              <FileText className="w-4 h-4 text-sky-500" />
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-(--text-primary)">
                {isPendingEnterpriseAdmin ? "0" : (auditCount !== null ? auditCount : "0")}
              </p>
              <p className="text-[11px] text-(--text-muted) mt-0.5">
                {isPendingEnterpriseAdmin
                  ? isBn ? "অনুমোদনের পর টিম অডিট দৃশ্যমান হবে" : "Team audits visible once approved"
                  : isLawyer
                  ? isBn ? "আইনগতভাবে অনুমোদিত চুক্তিপত্র" : "Statutorily sealed memos"
                  : isBn ? "যাচাইকৃত ও সংরক্ষিত চুক্তিপত্র" : "Analyzed contract memos"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isPendingEnterpriseAdmin) {
                  router.push("/enterprise/pending");
                } else if (isLawyer) {
                  router.push(verificationStatus === "verified" ? "/lawyer/archive" : "/lawyer/pending");
                } else {
                  router.push("/archive");
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-(--text-primary) hover:underline cursor-pointer pt-1"
            >
              <span>{isPendingEnterpriseAdmin ? (isBn ? "স্ট্যাটাস দেখুন" : "View Status") : (isBn ? "আর্কাইভ দেখুন" : "View archive")}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card 3: Consultations / Review Queue */}
          <div className="p-5 rounded-2xl border border-(--text-primary)/10 bg-(--bg-card) shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between text-neutral-500">
              <span className="text-xs font-medium uppercase tracking-wider">
                {isPendingEnterpriseAdmin
                  ? isBn ? "এন্টারপ্রাইজ ওয়ার্কস্পেস" : "Enterprise Workspace"
                  : isLawyer
                  ? isBn ? "রিভিউ কিউ ও কাজ" : "Review Station"
                  : isBn ? "কপাইলট সেশন" : "Legal Sessions"}
              </span>
              {isLawyer ? (
                <Inbox className="w-4 h-4 text-purple-500" />
              ) : isPendingEnterpriseAdmin ? (
                <Building2 className="w-4 h-4 text-purple-500" />
              ) : (
                <MessageSquare className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <div>
              <p className="text-2xl font-mono font-bold text-(--text-primary)">
                {isPendingEnterpriseAdmin ? "—" : isLawyer ? (isBn ? "পেন্ডিং তালিকা" : "Review Queue") : (chatCount !== null ? chatCount : "—")}
              </p>
              <p className="text-[11px] text-(--text-muted) mt-0.5">
                {isPendingEnterpriseAdmin
                  ? isBn ? "অ্যাডমিন অনুমোদন সম্পন্ন হলে আনলক হবে" : "Unlocks once approved by admin"
                  : isLawyer
                  ? isBn ? "নতুন ক্লায়েন্ট চুক্তি পর্যালোচনা" : "Pending client contracts"
                  : isBn ? "বাংলাদেশ আইনের প্রশ্নোত্তর" : "BD statute consultations"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isPendingEnterpriseAdmin) {
                  router.push("/enterprise/pending");
                } else if (isLawyer) {
                  router.push("/lawyer/pending");
                } else {
                  router.push("/copilot");
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-(--text-primary) hover:underline cursor-pointer pt-1"
            >
              <span>{isPendingEnterpriseAdmin ? (isBn ? "অনুমোদন স্ট্যাটাস দেখুন" : "View Approval Status") : isLawyer ? (isBn ? "রিভিউ স্টেশন খুলুন" : "Open Review Station") : (isBn ? "চ্যাট শুরু করুন" : "Open copilot")}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ── 3. PERSONAL INFORMATION SECTION ── */}
        <div className="p-6 rounded-3xl border border-(--text-primary)/10 bg-(--bg-card) shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "color-mix(in srgb, var(--text-primary) 8%, transparent)" }}>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-(--text-muted)">
              {isBn ? "ব্যক্তিগত তথ্য বিবরণী" : "Personal Information"}
            </h3>
            {editMode && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {isBn ? "সম্পাদনা মোড সক্রিয়" : "Editing in progress"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 py-2 text-sm">
            {/* Full Name */}
            <span className="text-(--text-muted) text-[13px] flex items-center gap-2">
              <User className="w-4 h-4 opacity-70" />
              <span>{isBn ? "পুরো নাম" : "Full Name"}</span>
            </span>
            <div className="sm:col-span-2">
              {editMode ? (
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm outline-none border border-(--text-primary)/20 focus:border-(--text-primary)/60 bg-(--bg-surface) text-(--text-primary) font-medium"
                  placeholder={isBn ? "আপনার পুরো নাম" : "Your full name"}
                />
              ) : (
                <span className="font-medium text-(--text-primary)">{user.name || "—"}</span>
              )}
            </div>

            {/* Mobile Number */}
            <span className="text-(--text-muted) text-[13px] flex items-center gap-2">
              <Phone className="w-4 h-4 opacity-70" />
              <span>{isBn ? "মোবাইল নম্বর" : "Mobile Number"}</span>
            </span>
            <div className="sm:col-span-2 flex items-center justify-between gap-3">
              {editMode ? (
                <input
                  type="tel"
                  value={draftMobile}
                  onChange={(e) => setDraftMobile(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm outline-none border border-(--text-primary)/20 focus:border-(--text-primary)/60 bg-(--bg-surface) text-(--text-primary) font-mono"
                  placeholder="+8801XXXXXXXXX"
                />
              ) : (
                <span className="font-mono text-(--text-primary)">
                  {user.mobile || "—"}
                </span>
              )}
            </div>

            {/* Email Address */}
            <span className="text-(--text-muted) text-[13px] flex items-center gap-2">
              <Mail className="w-4 h-4 opacity-70" />
              <span>{isBn ? "ইমেইল ঠিকানা" : "Email Address"}</span>
            </span>
            <div className="sm:col-span-2 flex items-center gap-2">
              <span className="text-(--text-primary) font-mono text-xs sm:text-sm">
                {user.email || "—"}
              </span>
              {user.isEmailVerified && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" />
                  <span>{isBn ? "প্রমাণিত" : "Verified"}</span>
                </span>
              )}
            </div>

            {/* Account ID / Member Since */}
            <span className="text-(--text-muted) text-[13px] flex items-center gap-2">
              <Clock className="w-4 h-4 opacity-70" />
              <span>{isBn ? "সদস্য অন্তর্ভুক্তি" : "Member Since"}</span>
            </span>
            <div className="sm:col-span-2 text-xs font-mono text-(--text-muted)">
              Oct 2026 · ID: {user.id || "usr_active_session"}
            </div>

            {/* Save / Cancel Action Buttons in Edit Mode */}
            {editMode && (
              <div className="sm:col-start-2 sm:col-span-2 flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-(--accent-solid) text-(--accent-contrast) hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isSaving
                      ? isBn
                        ? "সংরক্ষণ হচ্ছে..."
                        : "Saving..."
                      : isBn
                      ? "পরিবর্তন সংরক্ষণ করুন"
                      : "Save Changes"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/5 transition-colors cursor-pointer"
                >
                  {isBn ? "বাতিল" : "Cancel"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── 5. LAWYER SPECIFIC CREDENTIALS ── */}
        {isLawyer && (
          <div className="p-6 rounded-3xl border border-(--text-primary)/10 bg-(--bg-card) shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-(--text-primary)/10 pb-3">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-(--text-muted) flex items-center gap-1.5">
                <Gavel className="w-4 h-4 shrink-0" />
                <span>{isBn ? "বাংলাদেশ বার কাউন্সিল সনদ ও এনরোলমেন্ট" : "Bar Council Credentials"}</span>
              </h3>
              {verificationStatus === "verified" ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-(--text-muted) bg-(--text-primary)/5 border border-(--text-primary)/10 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isBn ? "যাচাইকৃত অ্যাডভোকেট" : "Verified Advocate"}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-(--text-muted) bg-(--text-primary)/5 border border-(--text-primary)/10 px-2.5 py-0.5 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isBn ? "ভেরিফিকেশন প্রক্রিয়াধীন" : "Verification Pending"}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3 py-1 text-sm">
              <span className="text-(--text-muted) text-[13px]">{isBn ? "এনরোলমেন্ট নম্বর" : "Enrollment No."}</span>
              <div className="sm:col-span-2 font-mono font-semibold text-(--text-primary)">
                {lawyerProfile.barCouncilNo || "BC-48291/2019"}
              </div>

              <span className="text-(--text-muted) text-[13px]">{isBn ? "বিশেষজ্ঞতার ক্ষেত্র" : "Field of Practice"}</span>
              <div className="sm:col-span-2 text-(--text-primary)">
                {lawyerProfile.fieldOfLaw || "Corporate & Labour Law"}
              </div>

              <span className="text-(--text-muted) text-[13px]">{isBn ? "বার সমিতি" : "Bar Association"}</span>
              <div className="sm:col-span-2 text-(--text-primary)">
                {lawyerProfile.barAssociation || "Supreme Court Bar Association"}
              </div>

              {verificationStatus === "verified" ? (
                <div className="sm:col-span-3 pt-3 flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => router.push("/lawyer/pending")}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition-opacity cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                    <span>{isBn ? "আইনজীবী ওয়ার্কস্পেসে প্রবেশ করুন →" : "Open Advocate Workspace →"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/lawyer/archive")}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-(--text-primary)/15 hover:bg-(--text-primary)/5 text-(--text-primary) transition-colors cursor-pointer"
                  >
                    <span>{isBn ? "সম্পন্ন অডিট হিস্টোরি" : "Verified Review Archive"}</span>
                  </button>
                </div>
              ) : verificationStatus === "rejected" ? (
                <div className="sm:col-span-3 pt-3 space-y-2">
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{isBn ? "আইনজীবী আবেদন বাতিল করা হয়েছে" : "Advocate Application Rejected"}</span>
                    </p>
                    <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80 leading-relaxed">
                      {isBn
                        ? "দুঃখিত, আপনার বার কাউন্সিল সনদটি যাচাই করা সম্ভব হয়নি।"
                        : "We could not verify your credentials with the Bangladesh Bar Council registry."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="sm:col-span-3 pt-3 space-y-3">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-bold">
                        <Clock className="w-4 h-4 animate-pulse shrink-0" />
                        <span>{isBn ? "সিস্টেম অ্যাডমিন ভেরিফিকেশন প্রক্রিয়াধীন" : "System Admin Verification Pending"}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRefreshLawyerStatus}
                        disabled={isCheckingLawyerStatus}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCheckingLawyerStatus ? "animate-spin" : ""}`} />
                        <span>{isCheckingLawyerStatus ? (isBn ? "চেক হচ্ছে..." : "Checking...") : (isBn ? "স্ট্যাটাস রিফ্রেশ করুন" : "Refresh Status")}</span>
                      </button>
                    </div>
                    <p className="text-amber-800/80 dark:text-amber-200/80 text-[11px] leading-relaxed">
                      {isBn
                        ? "আপনার বার কাউন্সিল সনদটি বর্তমানে সিস্টেম অ্যাডমিনের পর্যালোচনায় রয়েছে। অ্যাডমিন অনুমোদন প্রদান করার সাথে সাথে ওয়ার্কস্পেস আনলক হবে এবং ক্লায়েন্টদের চুক্তি আপনার কিউতে আসবে।"
                        : "Your Bar Council credentials are currently awaiting system admin verification. Once approved, the lawyer review workspace and contract dispatch queue will be activated automatically."}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-wrap pt-1">
                    <button
                      type="button"
                      onClick={() => router.push("/lawyer/pending")}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isBn ? "ওয়ার্কস্পেস প্রিভিউ ও স্ট্যাটাস দেখুন (লকড) →" : "View Workspace Queue Status (Locked) →"}</span>
                    </button>

                    {String(user?.role).toUpperCase() === "ADMIN" && (
                      <button
                        type="button"
                        onClick={() => router.push("/admin")}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        <span>{isBn ? "অ্যাডমিন প্যানেলে অনুমোদন করুন →" : "Open Admin Approval Panel →"}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 6. ENTERPRISE ORGANIZATION DETAILS ── */}
        {user.enterpriseProfile && (
          <div className="p-6 rounded-3xl border border-purple-500/20 bg-purple-500/5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/10 pb-3">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-500" />
                <span>{isBn ? "কর্পোরেট এন্টারপ্রাইজ তথ্য" : "Enterprise Organization"}</span>
              </h3>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                RJSC Verified Corporate
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3 py-1 text-sm">
              <span className="text-(--text-muted) text-[13px]">{isBn ? "কোম্পানির নাম" : "Company Name"}</span>
              <div className="sm:col-span-2 font-semibold text-(--text-primary)">
                {user.enterpriseProfile.companyName}
              </div>

              <span className="text-(--text-muted) text-[13px]">{isBn ? "আরজেএসসি নম্বর" : "RJSC Reg"}</span>
              <div className="sm:col-span-2 font-mono text-(--text-primary)">
                {user.enterpriseProfile.registrationNo}
              </div>

              <span className="text-(--text-muted) text-[13px]">{isBn ? "টিআইএন নম্বর" : "Corporate TIN"}</span>
              <div className="sm:col-span-2 font-mono text-(--text-primary)">
                {user.enterpriseProfile.tinNo}
              </div>

              <div className="sm:col-span-3 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      user.role === "enterprise_admin" ||
                        (user.role === "enterprise" && !user.enterpriseProfile?.isTeamMember)
                        ? "/enterprise/admin"
                        : "/enterprise/member"
                    )
                  }
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer shadow-xs"
                >
                  {isBn ? "এন্টারপ্রাইজ পোর্টালে যান →" : "Open Enterprise Workspace →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 7. ACCOUNT SECURITY & FAST ACTIONS ── */}
        <div className="p-6 rounded-3xl border border-(--text-primary)/10 bg-(--bg-card) shadow-xs space-y-4">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-(--text-muted) flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span>{isBn ? "অ্যাকাউন্ট নিরাপত্তা ও সেটিংস" : "Account Security & Preferences"}</span>
          </h3>

          <div className="divide-y" style={{ borderColor: "color-mix(in srgb, var(--text-primary) 8%, transparent)" }}>
            {/* Change Password Row */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-(--text-primary) flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-(--text-muted)" />
                  <span>{isBn ? "অ্যাকাউন্ট পাসওয়ার্ড" : "Account Password"}</span>
                </p>
                <p className="text-xs text-(--text-muted) mt-0.5">
                  {isBn ? "নিয়মিত পাসওয়ার্ড পরিবর্তন করে অ্যাকাউন্ট সুরক্ষিত রাখুন" : "Update your password to protect your legal documents"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPwError("");
                  setPwSuccess(false);
                  setCurrentPw("");
                  setNewPw("");
                  setConfirmPw("");
                  setIsPasswordModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-(--text-primary)/15 hover:bg-(--text-primary)/5 text-(--text-primary) transition-colors cursor-pointer shrink-0"
              >
                {isBn ? "পাসওয়ার্ড পরিবর্তন করুন →" : "Change Password →"}
              </button>
            </div>

            {/* App Settings Shortcut */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-(--text-primary)">
                  {isBn ? "অ্যাপ সেটিংস ও ভাষা" : "App Settings & System Preferences"}
                </p>
                <p className="text-xs text-(--text-muted) mt-0.5">
                  {isBn ? "নোটিফিকেশন, থিম মোড এবং ভাষা সমন্বয় করুন" : "Configure theme, language, and notifications"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/settings")}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-(--text-primary)/15 hover:bg-(--text-primary)/5 text-(--text-primary) transition-colors cursor-pointer shrink-0"
              >
                {isBn ? "সেটিংসে যান →" : "Open Settings →"}
              </button>
            </div>

            {/* PII Masking Note */}
            <div className="py-3.5 flex items-center gap-3 text-xs text-(--text-muted)">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                {isBn
                  ? "আপনার সমস্ত সংবেদনশীল ডেটা (NID, মোবাইল ও আর্থিক শর্ত) ব্রাউজারেই PII মাস্কড হয়ে ক্লাউডে সংরক্ষিত হয়।"
                  : "Client-side PII masking is fully active. Identity details are protected under codified Bangladesh statutes."}
              </span>
            </div>
          </div>
        </div>

        {/* ── 8. LOGOUT ── */}
        <div className="pt-2 pb-10 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{isBn ? "অ্যাকাউন্ট থেকে লগআউট করুন" : "Sign Out of Account"}</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* CHANGE PASSWORD MODAL                                                */}
      {/* ==================================================================== */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-(--text-primary)/10 bg-(--bg-card) shadow-2xl p-6 sm:p-7 space-y-5 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-(--accent-solid)/10 text-(--text-primary)">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="text-base font-serif font-bold text-(--text-primary)">
                  {isBn ? "পাসওয়ার্ড পরিবর্তন করুন" : "Change Password"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-lg text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-(--text-muted) mb-1">
                  {isBn ? "বর্তমান পাসওয়ার্ড" : "Current Password"}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? "text" : "password"}
                    required
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-(--text-primary)/20 bg-(--bg-surface) text-(--text-primary) outline-none focus:border-(--text-primary)/60 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-(--text-muted) mb-1">
                  {isBn ? "নতুন পাসওয়ার্ড" : "New Password"}
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? "text" : "password"}
                    required
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-(--text-primary)/20 bg-(--bg-surface) text-(--text-primary) outline-none focus:border-(--text-primary)/60 pr-10"
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-(--text-muted) mb-1">
                  {isBn ? "নতুন পাসওয়ার্ড নিশ্চিত করুন" : "Confirm New Password"}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-(--text-primary)/20 bg-(--bg-surface) text-(--text-primary) outline-none focus:border-(--text-primary)/60"
                  placeholder="Repeat new password"
                />
              </div>

              {pwError && <p className="text-xs text-rose-500">{pwError}</p>}
              {pwSuccess && (
                <p className="text-xs text-emerald-500 flex items-center gap-1 font-semibold">
                  <Check className="w-4 h-4" />
                  <span>{isBn ? "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!" : "Password changed successfully!"}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={pwLoading}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-(--accent-solid) text-(--accent-contrast) hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {pwLoading
                  ? isBn
                    ? "আপডেট হচ্ছে..."
                    : "Updating..."
                  : isBn
                  ? "পাসওয়ার্ড নিশ্চিত করুন"
                  : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}