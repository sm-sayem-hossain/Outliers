"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (notification?: any) => void;
        };
      };
    };
  }
}
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth, normalizeUserRole } from "@/context/AuthContext"; // [UPDATED] ADDED normalizeUserRole
import { useTheme } from "@/context/ThemeContext";
import api from "@/lib/api"; // [UPDATED] NEW
import { saveTokenResponse } from "@/lib/auth"; // [UPDATED] NEW
import { submitFeedback, subscribeNewsletter, getPlatformSystemStatus } from "@/lib/apiServices";
import {
  Scale,
  ArrowUpRight,
  Sun,
  Moon,
  Eye,
  EyeOff,
  X,
  Globe2,
  Star,
  Quote,
  User,
  Building2,
  CheckCircle2,
  ChevronLeft,
  Phone,
  Gavel,
  Mail,
  Users,
  AlertTriangle,
  Check,
  Shield,
  ShieldCheck,
  Landmark,
  Lock,
  Loader2,
  Clock,
  Zap,
} from "lucide-react";

// [UPDATED] Judge 1-click demo profiles (round speed-dial) — icons/images mirror the landing page personas
const demoRoles = [
  { key: "general", img: "/general-user.png", name: "Tariqul Islam", role: { en: "Citizen / SME", bn: "নাগরিক / SME" }, desc: "500 Credits • Full Copilot" },
  { key: "lawyer", img: "/lawyer.png", name: "Advocate Shireen", role: { en: "Advocate", bn: "আইনজীবী" }, desc: "Supreme Court • Queue & Seal" },
  { key: "enterprise_admin", icon: Landmark, name: "Rahim Chowdhury", role: { en: "Enterprise", bn: "এন্টারপ্রাইজ" }, desc: "Apex Holdings • Playbooks" },
  { key: "admin", icon: ShieldCheck, name: "System Admin", role: { en: "SuperAdmin", bn: "অ্যাডমিন" }, desc: "Verifications & Audit Controls" },
] as const;
import GradientWaves from "@/components/effects/GradientWaves";
import DitherVeil from "@/components/effects/DitherVeil";
import FadeContent from "@/components/effects/FadeContent";
import CountUp from "@/components/effects/CountUp";
import PixelSwap from "@/components/effects/PixelSwap";

type RegistrationStep = "role" | "form" | "otp";
type SelectedRole = "general" | "lawyer" | "enterprise" | null;
type EnterpriseTab = "company" | "member";

export default function LandingAndAuthPage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  // [UPDATED] Moved isBn up to the top so all handlers can use it
  const isBn = language === "bn";

  const {
    isAuthenticated,
    isLoading,
    login,
    registerEmail,
    verifyOtp,
    resendOtp,
    onboardLawyer,
    onboardEnterprise,
    registerEnterpriseMember,
    user,
    refreshUser, // [UPDATED] NEW - Needed for password reset
    loginWithGoogle,
    loginAsDemoRole,
  } = useAuth();

  const [demoLoadingRole, setDemoLoadingRole] = useState<string | null>(null);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const handleQuickDemoLogin = async (role: "general" | "lawyer" | "enterprise_admin" | "admin") => {
    setAuthError("");
    setDemoLoadingRole(role);
    try {
      const u = await loginAsDemoRole(role);
      closeModal();
      const userRole = String(u.role).toUpperCase();
      if (userRole === "LAWYER") {
        router.push("/lawyer/pending");
      } else if (userRole === "ADMIN") {
        router.push("/admin");
      } else if (userRole === "ENTERPRISE_ADMIN") {
        router.push("/enterprise/admin");
      } else if (userRole === "ENTERPRISE_MEMBER") {
        router.push("/enterprise/member");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in with demo profile";
      setAuthError(msg);
    } finally {
      setDemoLoadingRole(null);
    }
  };

  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [pendingOtpEmail, setPendingOtpEmail] = useState("");

  const [mounted, setMounted] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [instantJudgeMode, setInstantJudgeMode] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleSignInBtnRef = useRef<HTMLDivElement>(null);
  const googleSignUpBtnRef = useRef<HTMLDivElement>(null);

  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [slideDirection, setSlideDirection] = useState<"down" | "up">("down");

  // [UPDATED] NEW: Forgot Password Flow State
  const [forgotStep, setForgotStep] = useState<"none" | "email" | "otp">("none");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPw, setForgotNewPw] = useState("");
  const [forgotConfirmPw, setForgotConfirmPw] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleTestimonialChange = (idx: number) => {
    if (idx === activeTestimonial) return;
    setSlideDirection(idx > activeTestimonial ? "down" : "up");
    setActiveTestimonial(idx);
  };

  // ── Registration multi-step state ──
  const [regStep, setRegStep] = useState<RegistrationStep>("role");
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(null);

  // ── Diagram Common Fields ──
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("male");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // ── Lawyer Specific Fields ──
  const [barCouncilNo, setBarCouncilNo] = useState("");
  const [fieldOfLaw, setFieldOfLaw] = useState("Corporate & Commercial Law");

  // ── Enterprise Specific Fields ──
  const [entTab, setEntTab] = useState<EnterpriseTab>("company");
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("Private Limited");
  const [registrationNo, setRegistrationNo] = useState("");
  const [tinNo, setTinNo] = useState("");
  const [adminName, setAdminName] = useState("");
  const [memberCount, setMemberCount] = useState(10);
  const [companyReferCode, setCompanyReferCode] = useState("");

  // ── Email OTP State ──
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");

  // ── Form Validation States for Registration (enables button only when valid) ──
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim());
  const isPasswordValid = regPassword.length >= 6 && regPassword === regConfirmPassword;

  const isGeneralFormValid = Boolean(
    firstName.trim() &&
    lastName.trim() &&
    dob &&
    isEmailValid &&
    isPasswordValid
  );

  const isLawyerFormValid = Boolean(
    firstName.trim() &&
    lastName.trim() &&
    dob &&
    barCouncilNo.trim() &&
    isEmailValid &&
    isPasswordValid
  );

  const isCompanyFormValid = Boolean(
    companyName.trim() &&
    registrationNo.trim() &&
    tinNo.trim() &&
    adminName.trim() &&
    memberCount > 0 &&
    isEmailValid &&
    isPasswordValid
  );

  const isMemberFormValid = Boolean(
    firstName.trim() &&
    lastName.trim() &&
    dob &&
    companyName.trim() &&
    companyReferCode.trim() &&
    isEmailValid &&
    isPasswordValid
  );

  // ── Login fields ──
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // ── Footer Newsletter State ──
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [isSubscribingNewsletter, setIsSubscribingNewsletter] = useState(false);
  const [newsletterErrorMsg, setNewsletterErrorMsg] = useState<string | null>(null);

  // Feedback Form State
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackContact, setFeedbackContact] = useState("");
  const [feedbackSuggestion, setFeedbackSuggestion] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccessMsg, setFeedbackSuccessMsg] = useState<string | null>(null);
  const [feedbackErrorMsg, setFeedbackErrorMsg] = useState<string | null>(null);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackName.trim() || !feedbackContact.trim() || !feedbackSuggestion.trim()) return;

    setIsSubmittingFeedback(true);
    setFeedbackErrorMsg(null);
    setFeedbackSuccessMsg(null);

    try {
      await submitFeedback({
        name: feedbackName.trim(),
        contact: feedbackContact.trim(),
        suggestion: feedbackSuggestion.trim(),
      });
      setFeedbackSuccessMsg(
        isBn
          ? "ধন্যবাদ! আপনার মূল্যবান পরামর্শ বা মতামত আমরা পেয়েছি।"
          : "Thank you! Your suggestion or feedback has been received."
      );
      setFeedbackName("");
      setFeedbackContact("");
      setFeedbackSuggestion("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit feedback";
      setFeedbackErrorMsg(msg);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setIsSubscribingNewsletter(true);
    setNewsletterErrorMsg(null);

    try {
      await subscribeNewsletter(newsletterEmail.trim());
      setNewsletterSubscribed(true);
      setNewsletterEmail("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Subscription failed";
      setNewsletterErrorMsg(msg);
    } finally {
      setIsSubscribingNewsletter(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    getPlatformSystemStatus()
      .then((st) => setInstantJudgeMode(Boolean(st?.instant_judge_mode)))
      .catch(() => {});
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("auth") === "login" || params.get("login") === "true") {
        setShowAuthModal(true);
        setIsSignUp(false);
      }
    }
  }, []);

  // Refresh Instant Judge Mode status whenever auth modal opens
  useEffect(() => {
    if (showAuthModal) {
      getPlatformSystemStatus()
        .then((st) => setInstantJudgeMode(Boolean(st?.instant_judge_mode)))
        .catch(() => {});
    }
  }, [showAuthModal]);

  // ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showAuthModal) closeModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAuthModal]);

  const closeModal = () => {
    setShowAuthModal(false);
    setRegStep("role");
    setSelectedRole(null);
    setPasswordError("");
    setOtpInput("");
    setOtpError("");
    // [UPDATED] Reset forgot flow
    setForgotStep("none");
    setForgotError("");
  };

  const handleGoogleResponse = useCallback(
    async (response: { credential?: string }) => {
      if (!response?.credential) {
        setAuthError(isBn ? "গুগল সাইন-ইন ব্যর্থ হয়েছে।" : "Google sign in failed.");
        return;
      }
      setAuthLoading(true);
      setGoogleLoading(true);
      setAuthError("");
      try {
        const loggedInUser = await loginWithGoogle(response.credential);
        closeModal();
        const role = String(loggedInUser?.role).toUpperCase();
        if (role === "ADMIN") router.push("/admin");
        else if (role === "LAWYER") router.push("/lawyer/pending");
        else if (role === "ENTERPRISE_ADMIN" || role === "ENTERPRISE") router.push("/enterprise/admin");
        else if (role === "ENTERPRISE_MEMBER") router.push("/enterprise/member");
        else router.push("/dashboard");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Google authentication failed";
        setAuthError(msg);
      } finally {
        setAuthLoading(false);
        setGoogleLoading(false);
      }
    },
    [isBn, loginWithGoogle, router]
  );

  const googleRenderedTabsRef = useRef<{ signin: boolean; signup: boolean }>({
    signin: false,
    signup: false,
  });
  const handleGoogleResponseRef = useRef(handleGoogleResponse);

  useEffect(() => {
    handleGoogleResponseRef.current = handleGoogleResponse;
  });

  useEffect(() => {
    if (!mounted || !showAuthModal || forgotStep !== "none") return;

    const currentTab = isSignUp ? "signup" : "signin";
    const targetRef = isSignUp ? googleSignUpBtnRef.current : googleSignInBtnRef.current;

    // If already rendered on this tab, never touch it again
    if (googleRenderedTabsRef.current[currentTab] && targetRef && targetRef.children.length > 0) {
      return;
    }

    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "643210480956-pijla0uupssfs0edcsep0f63gmlvu2pq.apps.googleusercontent.com";

    const renderBtn = (): boolean => {
      if (typeof window === "undefined" || !window.google?.accounts?.id) {
        return false;
      }

      const el = isSignUp ? googleSignUpBtnRef.current : googleSignInBtnRef.current;
      if (!el) {
        return false;
      }

      // If already has Google button iframe, do NOT touch or re-create
      if (el.children.length > 0) {
        googleRenderedTabsRef.current[currentTab] = true;
        return true;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (res: any) => handleGoogleResponseRef.current(res),
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(el, {
          type: "standard",
          theme: theme === "dark" ? "filled_black" : "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: 340,
        });
        googleRenderedTabsRef.current[currentTab] = true;
        return true;
      } catch (e) {
        console.error("Failed to render Google button:", e);
        return false;
      }
    };

    if (!renderBtn()) {
      const timer = setInterval(() => {
        if (renderBtn()) clearInterval(timer);
      }, 100);
      const timeout = setTimeout(() => clearInterval(timer), 4000);
      return () => {
        clearInterval(timer);
        clearTimeout(timeout);
      };
    }
  }, [mounted, showAuthModal, isSignUp, forgotStep]);

  const openLoginModal = (signUp = false) => {
    setIsSignUp(signUp);
    setRegStep("role");
    setSelectedRole(null);
    setPasswordError("");
    setOtpInput("");
    setOtpError("");
    setForgotStep("none");
    setForgotError("");
    setShowAuthModal(true);
  };

  // Login submit — real API
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const loggedInUser = await login({ email: loginEmail, password: loginPassword });
      closeModal();
      // Route by role (enforce uppercase)
      const role = String(loggedInUser?.role).toUpperCase();
      if (role === "ADMIN") router.push("/admin");
      else if (role === "LAWYER") router.push("/lawyer/pending");
      else if (role === "ENTERPRISE_ADMIN" || role === "ENTERPRISE") router.push("/enterprise/admin");
      else if (role === "ENTERPRISE_MEMBER") router.push("/enterprise/member");
      else router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Please check your credentials.";

      // [UPDATED] NEW: Route unverified users into the OTP flow
      if (msg.toLowerCase().includes("not verified") || msg.toLowerCase().includes("verify")) {
        setPendingOtpEmail(loginEmail);
        setRegEmail(loginEmail);
        setOtpInput("");
        setOtpError("");
        setIsSignUp(true);
        setSelectedRole("general");
        setRegStep("otp");
        setAuthError("");
        resendOtp(loginEmail).catch(() => { });
        return;
      }

      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // [UPDATED] NEW: Forgot Password Handlers
  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email: forgotEmail.trim() });
      setForgotStep("otp");
      setForgotOtp("");
      setForgotNewPw("");
      setForgotConfirmPw("");
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : "Could not send reset code.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");

    if (forgotNewPw.length < 6) {
      setForgotError(isBn ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" : "Password must be at least 6 characters.");
      return;
    }
    if (forgotNewPw !== forgotConfirmPw) {
      setForgotError(isBn ? "পাসওয়ার্ড দুটি মিলছে না।" : "Passwords do not match.");
      return;
    }

    setForgotLoading(true);
    try {
      const data = await api.post<Record<string, unknown>>("/api/auth/reset-password", {
        email: forgotEmail.trim(),
        otp_code: forgotOtp.trim(),
        new_password: forgotNewPw,
      });

      saveTokenResponse(data as any, normalizeUserRole(data.role as string));
      await refreshUser();
      closeModal();
      setForgotStep("none");
      router.push("/dashboard");
    } catch (err: unknown) {
      setForgotError(err instanceof Error ? err.message : "Password reset failed.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Registration form submit → call backend, move to OTP step
  const handleStartFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword.length < 6) {
      setPasswordError(
        language === "bn"
          ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"
          : "Password must be at least 6 characters."
      );
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setPasswordError(
        language === "bn"
          ? "পাসওয়ার্ড এবং নিশ্চিত পাসওয়ার্ড মিলছে না।"
          : "Passwords do not match."
      );
      return;
    }
    setPasswordError("");
    setAuthError("");
    setAuthLoading(true);
    try {
      if (selectedRole === "enterprise" && entTab === "member") {
        if (!companyReferCode.trim()) {
          setAuthError(language === "bn" ? "কোম্পানি রেফার কোড প্রদান করুন।" : "Company referral code is required.");
          setAuthLoading(false);
          return;
        }
        // Enterprise member registration with company referral code
        const res = await registerEnterpriseMember({
          email: regEmail,
          password: regPassword,
          confirm_password: regConfirmPassword,
          full_name: `${firstName} ${lastName}`.trim() || "Member",
          referral_code: companyReferCode.trim(),
          phone: undefined,
          date_of_birth: dob || undefined,
          gender,
        });
        setPendingOtpEmail(res.email);
      } else {
        const resolvedFullName =
          selectedRole === "enterprise" && entTab === "company"
            ? adminName.trim() || "Enterprise Admin"
            : `${firstName} ${lastName}`.trim() || "User";

        const res = await registerEmail({
          email: regEmail,
          password: regPassword,
          confirm_password: regConfirmPassword,
          full_name: resolvedFullName,
          phone: undefined,
          date_of_birth: dob || undefined,
          gender,
        });
        setPendingOtpEmail(res.email);
      }
      setOtpInput("");
      setOtpError("");
      setRegStep("otp");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : language === "bn"
            ? "নিবন্ধন ব্যর্থ হয়েছে। ইনপুটগুলো পুনরায় চেক করুন।"
            : "Registration failed. Please check your inputs.";

      if (
        msg.toLowerCase().includes("exists") ||
        msg.toLowerCase().includes("already") ||
        msg.toLowerCase().includes("registered")
      ) {
        // Email already registered — switch to sign-in view
        setAuthError(
          language === "bn"
            ? "এই ইমেইল ইতিমধ্যে নিবন্ধিত। অনুগ্রহ করে লগইন করুন।"
            : "This email is already registered. Please log in."
        );
        setLoginEmail(regEmail);
        setIsSignUp(false);
      } else if (msg.toLowerCase().includes("password") && msg.toLowerCase().includes("6")) {
        setPasswordError(
          language === "bn"
            ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"
            : "Password must be at least 6 characters."
        );
      } else {
        setAuthError(msg);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // OTP verify — real API, then onboard if lawyer/enterprise
  const handleVerifyOtpAndComplete = async () => {
    if (!otpInput.trim() || otpInput.trim().length < 4) {
      setOtpError(
        language === "bn"
          ? "সঠিক ৬-সংখ্যার ওটিপি কোডটি লিখুন।"
          : "Enter a valid 6-digit OTP code."
      );
      return;
    }
    setOtpError("");
    setAuthLoading(true);
    try {
      const verifiedProfile = await verifyOtp({ email: pendingOtpEmail || regEmail, otp: otpInput.trim() });

      // After OTP verification, handle lawyer / enterprise onboarding & routing
      if (selectedRole === "lawyer") {
        try {
          await onboardLawyer({
            bar_council_id: barCouncilNo.trim(),
            field_of_law: fieldOfLaw.trim(),
            specializations: [fieldOfLaw.trim()],
          });
          closeModal();
          router.push("/lawyer/pending");
          return;
        } catch (onboardErr) {
          console.error("Lawyer onboard failed:", onboardErr);
          const errText = onboardErr instanceof Error ? onboardErr.message : "Lawyer onboarding failed.";
          setOtpError(errText);
          setAuthLoading(false);
          return;
        }
      } else if (selectedRole === "enterprise" && entTab === "company") {
        try {
          await onboardEnterprise({
            company_name: companyName.trim(),
            company_type: companyType,
            registration_no: registrationNo.trim(),
            tin_no: tinNo.trim(),
            member_limit: memberCount,
            billing_email: regEmail.trim(),
          });
          closeModal();
          router.push("/enterprise/pending");
          return;
        } catch (onboardErr) {
          console.error("Enterprise onboard failed:", onboardErr);
          const errText = onboardErr instanceof Error ? onboardErr.message : "Enterprise registration failed.";
          setOtpError(errText);
          setAuthLoading(false);
          return;
        }
      } else if (selectedRole === "enterprise" && entTab === "member") {
        closeModal();
        router.push("/enterprise/member");
        return;
      }

      closeModal();
      // General user goes to copilot
      router.push("/copilot");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : language === "bn"
            ? "অবৈধ বা মেয়াদোত্তীর্ণ ওটিপি কোড।"
            : "Invalid or expired OTP code.";
      setOtpError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // Resend OTP
  const [resendStatus, setResendStatus] = useState("");
  const handleResendOtp = async () => {
    try {
      await resendOtp(pendingOtpEmail || regEmail);
      setResendStatus(language === "bn" ? "নতুন ওটিপি কোড সফলভাবে পাঠানো হয়েছে।" : "New OTP code sent successfully.");
    } catch {
      setResendStatus(language === "bn" ? "ওটিপি পুনরায় পাঠানো সম্ভব হয়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।" : "Failed to resend OTP. Please try again shortly.");
    }
  };

  const testimonials = [
    {
      name: isBn ? "ব্যারিস্টার তারিকুল ইসলাম" : "Barrister Tariqul Islam",
      role: isBn ? "সিনিয়র পার্টনার, ইসলাম অ্যান্ড অ্যাসোসিয়েটস" : "Senior Partner, Islam & Associates",
      avatar: "/avatar_1.jpg",
      quote: isBn
        ? '“আগে ৫০ পাতার বাণিজ্যিক চুক্তি রিভিউ করতে ঘণ্টার পর ঘণ্টা সময় লাগত। Advotech Copilot এর মাধ্যমে চুক্তির অসামঞ্জস্যপূর্ণ ধারা এবং দ্য কন্ট্রাক্ট অ্যাক্ট ১৮৭২ এর রেফারেন্স চোখের পলকে শনাক্ত করা সম্ভব হচ্ছে।”'
        : '“Advotech Copilot transformed our contract audit workflow. Spotting void non-compete clauses under Section 27 and labor non-compliance takes seconds instead of hours.”',
      rating: 5,
    },
    {
      name: isBn ? "অ্যাডভোকেট শিরীন আক্তার" : "Advocate Shireen Akhter",
      role: isBn ? "সুপ্রিম কোর্ট অব বাংলাদেশ" : "Supreme Court of Bangladesh",
      avatar: "/avatar_2.jpg",
      quote: isBn
        ? '“জিরো হ্যালুসিনেশন ফিচারটি সত্যিই অসাধারণ। সাধারণ কোনো এআই নয়—সরাসরি bdlaws এর ধারা ও সুপ্রিম কোর্টের নজির সংযুক্ত থাকায় আত্মবিশ্বাসের সাথে ড্রাফট প্রস্তুত করা যায়।”'
        : '“Zero hallucination is real here. Having every risk tied directly to verifiable Bangladesh statutory provisions gives us complete advisory confidence.”',
      rating: 5,
    },
    {
      name: isBn ? "মাহমুদুল হাসান" : "Mahmudul Hasan",
      role: isBn ? "ব্যবস্থাপনা পরিচালক, ঢাকা টেক ভেনচার্স" : "Managing Director, Dhaka Tech Ventures",
      avatar: "/avatar_3.jpg",
      quote: isBn
        ? '“এসএমই এবং স্টার্টআপ হিসেবে বড় ল ফার্ম নিয়োগের আগে প্রাথমিক চুক্তি অডিট ও ক্লায়েন্ট-সাইড প্রাইভেসি নিশ্চিত করায় এটি আমাদের জন্য অপরিহার্য এক সঙ্গী।”'
        : '“As an SME founder, the client-side PII masking and instant contract risk scoring saved us from several unfavorable indemnity traps.”',
      rating: 5,
    },
  ];

  /* ─── shared border colour for light/dark ─── */
  const borderClass = "border-[var(--text-primary)]/10";

  return (
    <div
      suppressHydrationWarning
      className="relative min-h-screen w-full flex flex-col font-sans transition-colors duration-200 bg-[var(--bg-primary)] text-[var(--text-primary)]"
      style={{ overflowX: 'clip' }}
    >
      {/* ═══════════════════════════════════════════════════ */}
      {/* TOP NAVIGATION BAR                                */}
      {/* ═══════════════════════════════════════════════════ */}
      <header
        className="sticky top-0 z-40 w-full backdrop-blur-xl transition-colors"
        style={{
          backgroundColor:
            theme === "dark"
              ? "rgba(29, 29, 27, 0.85)"
              : "rgba(231, 231, 221, 0.88)",
        }}
      >
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-10 h-20 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 lg:gap-3.5 group shrink-0 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center shrink-0">
              <Image
                src="/logo.svg"
                alt="Advotech Copilot"
                width={48}
                height={48}
                className="w-full h-full object-contain dark:invert transition-transform group-hover:scale-105"
                priority
              />
            </div>
            <span className="font-serif font-bold text-base sm:text-2xl lg:text-3xl tracking-tight text-[var(--text-primary)] whitespace-nowrap">
              Advotech Copilot<span className="text-indigo-600 dark:text-indigo-400">.</span>
            </span>
          </Link>

          {/* Center Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs sm:text-[13px] font-medium tracking-wide uppercase text-[var(--text-muted)]">
            <a href="#" className="text-[var(--text-primary)] font-semibold flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <span className="text-indigo-600 dark:text-indigo-400">•</span>
              <span>{isBn ? "হোম" : "Home"}</span>
            </a>
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">{isBn ? "ফিচারসমূহ" : "Features"}</a>
            <a href="#for-whom" className="hover:text-[var(--text-primary)] transition-colors">{isBn ? "কার জন্য" : "Who Is It For"}</a>
            <a href="#reviews" className="hover:text-[var(--text-primary)] transition-colors">{isBn ? "রিভিউ" : "Reviews"}</a>
            <a href="#suggestion" className="hover:text-[var(--text-primary)] transition-colors">{isBn ? "পরামর্শ ও মতামত" : "Suggestion"}</a>
          </nav>

          {/* Right Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3 shrink-0">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLanguage(isBn ? "en" : "bn")}
              className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all shadow-sm border ${borderClass} hover:border-[var(--text-primary)]/30 bg-[var(--bg-card)] text-[var(--text-primary)] flex items-center gap-1 cursor-pointer`}
            >
              <Globe2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>{isBn ? "EN" : "BN"}</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-1.5 sm:p-2 rounded-xl text-xs font-medium transition-all shadow-sm border ${borderClass} hover:border-[var(--text-primary)]/30 bg-[var(--bg-card)] text-[var(--text-primary)] cursor-pointer`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400" />
              ) : (
                <Moon className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[var(--text-muted)]" />
              )}
            </button>

            {/* Auth Action */}
            {mounted && isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  const role = String(user?.role).toUpperCase();
                  router.push(
                    role === "ADMIN"
                      ? "/admin"
                      : role === "LAWYER"
                        ? "/lawyer/pending"
                        : "/dashboard"
                  );
                }}
                className="whitespace-nowrap shrink-0 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold tracking-wide uppercase transition-all shadow-sm active:scale-[0.98] hover:opacity-90 flex items-center gap-1 sm:gap-1.5 cursor-pointer bg-[var(--accent-solid)] text-[var(--accent-contrast)]"
              >
                <span>{isBn ? "ওয়ার্কস্পেস" : "Workspace"}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openLoginModal(false)}
                className="whitespace-nowrap shrink-0 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold tracking-wide uppercase transition-all shadow-sm active:scale-[0.98] hover:opacity-90 flex items-center gap-1 sm:gap-1.5 cursor-pointer bg-[var(--accent-solid)] text-[var(--accent-contrast)]"
              >
                <span>{isBn ? "লগইন" : "Sign In"}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════ */}
      {/* MAIN CONTENT - REDESIGNED & ANIMATED                */}
      {/* ═══════════════════════════════════════════════════ */}
      <main className="relative z-10 flex-1 flex flex-col">

        {/* ── SECTION 1: EDITORIAL LUXURY HERO (MATCHING REFERENCE DESIGN WITH VIDEO) ── */}
        <section className="relative min-h-[90vh] lg:min-h-[94vh] w-full max-w-7xl mx-auto px-6 lg:px-12 pt-6 sm:pt-10 pb-16 flex flex-col justify-between overflow-hidden">

          {/* Subtle Ambient Studio Light Gradients */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-b from-amber-500/10 via-amber-700/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Central Hero Composition Grid */}
          <div className="relative w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4 lg:pt-8 flex-1">

            {/* ── Left Column: Editorial Headline & Actions (lg:col-span-6) ── */}
            <div className="lg:col-span-6 flex flex-col justify-center text-left z-20">

              {/* Massive Bold Architectural Typography */}
              <h1 className="text-4xl sm:text-6xl lg:text-[72px] font-sans font-black tracking-tight leading-[1.04] uppercase text-[var(--text-primary)] mb-6">
                {isBn ? (
                  <>
                    সমাধান করুন <br />
                    আইনি বিষয় <br />
                    <span className="text-[var(--text-muted)] font-light">শতভাগ নিশ্চিন্তে</span>
                  </>
                ) : (
                  <>
                    SOLVING LEGAL <br />
                    MATTERS WITH <br />
                    <span className="text-[var(--text-muted)] font-light">CONFIDENCE</span>
                  </>
                )}
              </h1>

              {/* Subtitle */}
              <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md leading-relaxed mb-6 lg:mb-8">
                {isBn
                  ? "আপনার অধিকার সুরক্ষা ও ভবিষ্যৎ চুক্তি নিরাপত্তায় নিবেদিত বাংলাদেশের প্রথম সংবিধিবদ্ধ এআই লিগ্যাল প্ল্যাটফর্ম।"
                  : "A Dedicated Legal & AI Platform Committed to Protecting Your Rights, Reviewing Contracts, and Securing Your Future."}
              </p>

              {/* Action Buttons (Desktop: in Left Column) */}
              <div className="hidden lg:flex items-center gap-4 mb-10">
                <a
                  href="#contact"
                  className="px-7 py-3.5 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-lg active:scale-95 hover:opacity-95 flex items-center gap-2 cursor-pointer bg-[#f2591f] text-white hover:bg-[#e04f18]"
                >
                  <span>{isBn ? "পরামর্শ নিন" : "Contact Us"}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>

                <a
                  href="#features"
                  className={`px-6 py-3.5 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all border ${borderClass} hover:border-[var(--text-primary)]/40 flex items-center gap-2 cursor-pointer bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs`}
                >
                  <span>{isBn ? "বিস্তারিত জানুন" : "Learn More"}</span>
                </a>
              </div>
            </div>

            {/* ── Right Column: Video & Floating Glass Cards (lg:col-span-6) ── */}
            <div className="lg:col-span-6 relative flex flex-col items-center justify-center min-h-[460px] sm:min-h-[560px] lg:min-h-[620px]">

              {/* ── Central Character Container: Firefly with Interactive DitherVeil Effect ── */}
              <div className="relative w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[540px] aspect-square flex items-center justify-center z-10">

                {/* Backlight halo glow */}
                <div className="absolute inset-8 rounded-full bg-gradient-to-t from-amber-500/20 via-orange-400/10 to-transparent blur-2xl pointer-events-none" />

                {/* Interactive DitherVeil Container */}
                <div className="relative w-full h-full rounded-2xl overflow-hidden cursor-crosshair">
                  <DitherVeil
                    src="/Firefly.png"
                    pattern="floyd"
                    pixelSize={2}
                    inkColor={theme === "dark" ? "#181816" : "#1D1D1B"}
                    paperColor={theme === "dark" ? "#E7E7DD" : "#E7E7DD"}
                    revealRadius={100}
                    softness={0.5}
                    linger={0.8}
                    fit="contain"
                    rimColor={theme === "dark" ? "#E0E0D5" : "#1D1D1B"}
                    palette="duotone"
                    levels={2}
                    contrast={1.2}
                    brightness={0}
                    rim={0}
                    reverse={false}
                    wander={false}
                    clickBurst={true}
                    fullRevealOnHover={true}
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Action Buttons (Mobile: Below Statue) */}
              <div className="flex lg:hidden items-center justify-center gap-3.5 sm:gap-4 mt-6 sm:mt-8 mb-4 w-full z-20">
                <a
                  href="#contact"
                  className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-lg active:scale-95 hover:opacity-95 flex items-center gap-2 cursor-pointer bg-[#f2591f] text-white hover:bg-[#e04f18]"
                >
                  <span>{isBn ? "পরামর্শ নিন" : "Contact Us"}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>

                <a
                  href="#features"
                  className={`px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all border ${borderClass} hover:border-[var(--text-primary)]/40 flex items-center gap-2 cursor-pointer bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs`}
                >
                  <span>{isBn ? "বিস্তারিত জানুন" : "Learn More"}</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2 & 3: CURTAIN SCROLL — Section 2 pinned, Section 3 rolls over (Only for Desktop) ── */}
        <div className="relative w-full" style={{ zIndex: 1 }}>
          {/* Section 2: STICKY on desktop (lg:) only; natural flow on mobile */}
          <div
            className="w-full relative lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden flex items-center justify-center bg-[var(--bg-primary)] py-12 lg:py-0"
            style={{ zIndex: 10 }}
          >
            <section id="features" className="py-8 px-6 lg:px-10 max-w-6xl mx-auto w-full scroll-mt-24">
              <FadeContent effect="mist" duration={1.2} threshold={0.15}>
                <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 block">
                    {isBn ? "প্রধান ফিচারসমূহ" : "Core Capabilities"}
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-medium tracking-tight text-[var(--text-primary)] mb-2">
                    {isBn ? "লিগ্যাল কোপাইলট ও কন্ট্রাক্টমাইন্ড" : "Legal Copilot & ContractMind"}
                  </h2>
                </div>
              </FadeContent>

              <FadeContent effect="focus" duration={1} threshold={0.15} stagger={0.15}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                  {/* Feature 1 Card: Legal Copilot */}
                  <div className={`rounded-3xl border ${borderClass} bg-[var(--bg-card)] p-8 sm:p-10 shadow-xl flex flex-col justify-between hover:border-[var(--text-primary)]/30 transition-all duration-300 group`}>
                    <div>
                      <div className="mb-6 flex items-center justify-start">
                        <Image
                          src="/legal-copilot.png"
                          alt="Legal Copilot"
                          width={56}
                          height={56}
                          className="w-12 h-12 sm:w-14 sm:h-14 object-contain dark:invert transition-transform group-hover:scale-105"
                        />
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-serif font-medium text-[var(--text-primary)] mb-3">
                        Legal Copilot
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mb-6">
                        {isBn
                          ? "বাংলাদেশের সংবিধিবদ্ধ আইন সংহিতা (bdlaws), সুপ্রিম কোর্টের নজির ও ধারাভিত্তিক রেফারেন্সসহ সার্বক্ষণিক এআই আইনি পরামর্শক।"
                          : "Intelligent legal advisory grounded in verified Bangladesh statutes and High Court Division precedents with zero hallucination guarantee."}
                      </p>

                      <div className="space-y-3.5 mb-8">
                        {[
                          isBn ? "সরাসরি bdlaws থেকে অনুচ্ছেদ ও ধারা ভেরিফিকেশন" : "Direct bdlaws statutory clause & section mapping",
                          isBn ? "বাংলা ও ইংরেজি উভয় ভাষায় সাবলীল আইনি ব্যাখ্যা" : "Bilingual fluent legal reasoning (Bengali & English)",
                          isBn ? "সুপ্রিম কোর্টের ল্যান্ডমার্ক রায় ও নজিরের সংযোগ" : "Citations to Supreme Court rulings and precedents",
                          isBn ? "কেস স্টাডি বিশ্লেষণ ও লিগ্যাল নোটিউট ড্রাফটিং" : "Case study synthesis and instant legal notice drafting",
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Check className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm text-[var(--text-primary)] font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-[var(--text-primary)]/10">
                      <button
                        type="button"
                        onClick={() => openLoginModal(false)}
                        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--text-primary)] hover:opacity-80 hover:gap-3 transition-all cursor-pointer"
                      >
                        <span>{isBn ? "লিগ্যাল কোপাইলট ওপেন করুন" : "Launch Legal Copilot"}</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Feature 2 Card: ContractMind */}
                  <div className={`rounded-3xl border ${borderClass} bg-[var(--bg-card)] p-8 sm:p-10 shadow-xl flex flex-col justify-between hover:border-[var(--text-primary)]/30 transition-all duration-300 group`}>
                    <div>
                      <div className="mb-6 flex items-center justify-start">
                        <Image
                          src="/contractmind.png"
                          alt="ContractMind"
                          width={48}
                          height={48}
                          className="w-11 h-11 sm:w-12 sm:h-12 object-contain dark:invert transition-transform group-hover:scale-105"
                        />
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-serif font-medium text-[var(--text-primary)] mb-3">
                        ContractMind
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed mb-6">
                        {isBn
                          ? "স্বয়ংক্রিয় চুক্তি অডিট, ক্ষতিকর ধারা শনাক্তকরণ, রিস্ক স্কোরিং এবং এক ক্লিকে বিকল্প ধারা সংশোধনের ড্রাফট প্রস্তুতকারী সিস্টেম।"
                          : "Autonomous contract risk auditing, unfair clause detection, statutory compliance scoring, and automated redline revisions."}
                      </p>

                      <div className="space-y-3.5 mb-8">
                        {[
                          isBn ? "কন্ট্রাক্ট অ্যাক্ট ১৮৭২ ও শ্রম আইন ২০০৬ এর অসামঞ্জস্যতা শনাক্তকরণ" : "Detection of conflicts with Contract Act 1872 & Labour Law 2006",
                          isBn ? "০-১০০ স্কেলে তাৎক্ষণিক সামগ্রিক রিস্ক স্কোর ও রেড-ফ্ল্যাগ অ্যালার্ট" : "Instant 0-100 overall risk score with color-coded red flags",
                          isBn ? "এক ক্লিকে বিকল্প ও ভারসাম্যপূর্ণ ক্লজ জেনারেশন (Redline Draft)" : "One-click balanced alternative clause recommendations",
                          isBn ? "ক্লায়েন্ট সাইড PII অটো-রেডাকশন (ব্যক্তিগত তথ্য সম্পূর্ণ নিরাপদ)" : "Client-side PII auto-redaction before cloud transmission",
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <Check className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm text-[var(--text-primary)] font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-[var(--text-primary)]/10">
                      <button
                        type="button"
                        onClick={() => openLoginModal(false)}
                        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--text-primary)] hover:opacity-80 hover:gap-3 transition-all cursor-pointer"
                      >
                        <span>{isBn ? "কন্ট্রাক্ট অডিট শুরু করুন" : "Start Contract Audit"}</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </FadeContent>
            </section>
          </div>

          {/* Section 3: CURTAIN on desktop (lg:), natural seamless flow on mobile */}
          <section
            id="for-whom"
            className="relative py-16 lg:py-24 px-6 lg:px-10 bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-t-none lg:rounded-t-[48px] shadow-none lg:shadow-[0_-30px_70px_rgba(0,0,0,0.22)] border-t-0 lg:border-t lg:border-[var(--text-primary)]/15 scroll-mt-24"
            style={{ zIndex: 20 }}
          >
            <div className="max-w-6xl mx-auto">
              <FadeContent effect="mist" duration={1.2} threshold={0.15}>
                <div className="text-center max-w-3xl mx-auto mb-16">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 block">
                    {isBn ? "ব্যবহারকারী ভূমিকা" : "Who Is It For"}
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-medium tracking-tight mb-3">
                    {isBn ? "সবার জন্য উপযুক্ত সমাধান" : "Tailored For Every Need"}
                  </h2>
                </div>
              </FadeContent>

              <FadeContent effect="focus" duration={1} threshold={0.15} stagger={0.15}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Persona 1: General Users / SME / Freelancer */}
                  <div className={`p-8 rounded-3xl bg-[var(--bg-card)] border ${borderClass} shadow-md flex flex-col justify-between hover:-translate-y-1 hover:border-[var(--text-primary)]/30 transition-all duration-300 group`}>
                    <div>
                      <div className="mb-6 flex items-center justify-start">
                        <Image
                          src="/general-user.png"
                          alt={isBn ? "সাধারণ ব্যবহারকারী" : "Individuals"}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-contain dark:invert transition-transform group-hover:scale-105"
                        />
                      </div>
                      <h3 className="text-xl font-serif font-semibold mb-2">
                        {isBn ? "সাধারণ ব্যবহারকারী" : "Individuals"}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">
                        {isBn
                          ? "জটিল আইনি মারপ্যাঁচ না বুঝেই যেকোনো চুক্তি সই করার ঝুঁকি এড়ান। নিজের অধিকার রক্ষা করুন চোখের পলকে।"
                          : "Demystify confusing contract jargon before signing. Protect your livelihood, salary terms, and IP rights effortlessly."}
                      </p>

                      <ul className="space-y-3 text-xs text-[var(--text-muted)] mb-6">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                          <span>{isBn ? "নিয়োগ চুক্তি ও অফার লেটার সহজ বাংলায় রিভিউ" : "Plain-English / Bengali employment contract audit"}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                          <span>{isBn ? "বাড়ি ভাড়া ও সার্ভিস এগ্রিমেন্টের ঝুঁকি শনাক্ত" : "Tenancy & freelancer service clause validation"}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                          <span>{isBn ? "তাৎক্ষণিক আইনি অধিকার ও প্রতিকার জানার সুবিধা" : "Instant clarity on your statutory statutory rights"}</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => openLoginModal(true)}
                      className={`w-full py-2.5 rounded-xl text-xs font-semibold border ${borderClass} text-[var(--text-primary)] hover:border-[var(--text-primary)]/40 hover:bg-[var(--text-primary)]/5 transition-all cursor-pointer`}
                    >
                      {isBn ? "ব্যক্তিগত অ্যাকাউন্ট শুরু করুন" : "Start as Individual"}
                    </button>
                  </div>

                  {/* Persona 2: Lawyers & Advocates */}
                  <div className={`p-8 rounded-3xl bg-[var(--bg-card)] border ${borderClass} shadow-md flex flex-col justify-between hover:-translate-y-1 hover:border-[var(--text-primary)]/30 transition-all duration-300 relative group`}>
                    <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--text-primary)] text-[var(--bg-primary)]">
                      {isBn ? "পেশাদার ওয়ার্কস্পেস" : "Advocate Portal"}
                    </div>

                    <div>
                      <div className="mb-6 flex items-center justify-start">
                        <Image
                          src="/lawyer.png"
                          alt={isBn ? "আইনজীবী ও অ্যাডভোকেট" : "Lawyers & Advocates"}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-contain dark:invert transition-transform group-hover:scale-105"
                        />
                      </div>
                      <h3 className="text-xl font-serif font-semibold mb-2">
                        {isBn ? "আইনজীবী ও অ্যাডভোকেট" : "Lawyers & Advocates"}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">
                        {isBn
                          ? "ঘণ্টার পর ঘণ্টা ম্যানুয়াল কেস রিসার্চ এবং ক্লজ ড্রাফটিং এর সময় বাঁচান। শতভাগ সংবিধিবদ্ধ নির্ভরযোগ্যতায় পরামর্শ দিন।"
                          : "Accelerate case research, citation discovery, and contract review with verified Supreme Court precedents and statute references."}
                      </p>

                      <ul className="space-y-3 text-xs text-[var(--text-muted)] mb-6">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                          <span>{isBn ? "বার কাউন্সিল তালিকাভুক্ত অ্যাডভোকেট স্পেস" : "Bar Council verified credential management"}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                          <span>{isBn ? "৫০ পাতার চুক্তি চোখের পলকে অডিট ও রেডলাইন" : "Audit 50+ page commercial contracts in seconds"}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                          <span>{isBn ? "সুপ্রিম কোর্ট ও bdlaws ক্রস-রেফারেন্সিং" : "Automated statutory cross-referencing"}</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => openLoginModal(true)}
                      className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                    >
                      {isBn ? "আইনজীবী হিসেবে যুক্ত হোন" : "Join as Advocate"}
                    </button>
                  </div>

                  {/* Persona 3: Enterprise & Companies */}
                  <div className={`p-8 rounded-3xl bg-[var(--bg-card)] border ${borderClass} shadow-md flex flex-col justify-between hover:-translate-y-1 hover:border-[var(--text-primary)]/30 transition-all duration-300 group`}>
                    <div>
                      <div className="mb-6 text-[var(--text-primary)] flex items-center justify-start">
                        <Landmark className="w-9 h-9 transition-transform group-hover:scale-105" strokeWidth={1.75} />
                      </div>
                      <h3 className="text-xl font-serif font-semibold mb-2">
                        {isBn ? "কোম্পানি ও এন্টারপ্রাইজ" : "Enterprise & Legal Teams"}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mb-6 leading-relaxed">
                        {isBn
                          ? "মাল্টি-মেম্বার টিম কোলাবরেশন, ভেন্ডর চুক্তি যাচাই এবং সার্বভৌম গোপনীয়তার সাথে কর্পোরেট কমপ্লায়েন্স নিয়ন্ত্রণ করুন।"
                          : "Centralize corporate contract risk, manage internal legal counsel access, and enforce institutional compliance standards."}
                      </p>

                      <ul className="space-y-3 text-xs text-[var(--text-muted)] mb-6">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                          <span>{isBn ? "অ্যাডমিন প্যানেল ও টিম মেম্বার রেফারেল কোড" : "Central admin dashboard with referral code onboarding"}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                          <span>{isBn ? "ভেন্ডর ও পার্টনারশিপ চুক্তির কমপ্লায়েন্স অডিট" : "Vendor, NDA, and partnership risk scoring"}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                          <span>{isBn ? "সার্বভৌম ডেটা প্রাইভেসি ও এনক্রিপশন" : "Sovereign client-side PII encryption"}</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => openLoginModal(true)}
                      className={`w-full py-2.5 rounded-xl text-xs font-semibold border ${borderClass} text-[var(--text-primary)] hover:border-[var(--text-primary)]/40 hover:bg-[var(--text-primary)]/5 transition-all cursor-pointer`}
                    >
                      {isBn ? "এন্টারপ্রাইজ রেজিস্ট্রেশন" : "Register Enterprise"}
                    </button>
                  </div>
                </div>
              </FadeContent>
            </div>
          </section>
        </div>

        {/* ── SECTION 4: STATS & TRUST BAR ── */}
        <section className="py-16 px-6 lg:px-10 max-w-6xl mx-auto w-full">
          <FadeContent effect="focus" duration={0.9} threshold={0.15}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                {
                  to: 99.4,
                  decimals: 1,
                  prefix: "",
                  suffix: "%",
                  label: isBn ? "সংবিধিবদ্ধ সাইটেশন নির্ভুলতা" : "Citation Accuracy",
                  sub: isBn ? "লাইভ MCP ও bdlaws যাচাই" : "Grounded in bdlaws & Live MCP",
                },
                {
                  to: 35000,
                  decimals: 0,
                  prefix: "",
                  suffix: "+",
                  label: isBn ? "বাংলাদেশ সংবিধিবদ্ধ আইন" : "Statutes Ingested",
                  sub: isBn ? "Qdrant ক্লাউডে ভেক্টরাইজড" : "Vectorized in Qdrant Cloud",
                },
                {
                  to: 30,
                  decimals: 0,
                  prefix: "< ",
                  suffix: "s",
                  label: isBn ? "গড় চুক্তি অডিট সময়" : "Avg. Audit Latency",
                  sub: isBn ? "ফুল AST ক্লজ রিস্ক পাইপলাইন" : "Full AST Clause Risk Pipeline",
                },
                {
                  to: 100,
                  decimals: 0,
                  prefix: "",
                  suffix: "%",
                  label: isBn ? "সার্বভৌম ডেটা গোপনীয়তা" : "Client-Side Privacy",
                  sub: isBn ? "ক্লায়েন্ট সাইড জিরো লিকেজ" : "Client-Side Zero Data Leakage",
                },
              ].map((s, idx) => (
                <div key={idx} className={`p-6 rounded-2xl bg-[var(--bg-card)] border ${borderClass} shadow-xs hover:border-[var(--text-primary)]/20 transition-all`}>
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2 text-[var(--text-primary)] tabular-nums">
                    <CountUp to={s.to} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} duration={1.2} />
                  </div>
                  <div className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-1">
                    {s.label}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {s.sub}
                  </div>
                </div>
              ))}
            </div>
          </FadeContent>
        </section>

        {/* ── SECTION 5 & 6: CURTAIN SCROLL — Section 5 pinned, Section 6 rolls over (Only for Desktop) ── */}
        <div className="relative w-full" style={{ zIndex: 2 }}>
          {/* Section 5: STICKY on desktop (lg:) only; natural flow on mobile */}
          <div
            className="w-full relative lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden flex items-center justify-center bg-[var(--bg-primary)] py-12 lg:py-0"
            style={{ zIndex: 10 }}
          >
            <section id="reviews" className="py-8 px-6 lg:px-10 max-w-6xl mx-auto w-full scroll-mt-24">
              <FadeContent effect="mist" duration={1.2} threshold={0.15}>
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2 block">
                      {isBn ? "প্র্যাকটিশনার ও ক্লায়েন্ট অভিজ্ঞতা" : "Testimonials & Reviews"}
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-serif font-medium tracking-tight text-[var(--text-primary)]">
                      {isBn ? "বিশ্বস্ততা যা বাস্তবে প্রমাণিত" : "Proven in Bangladesh's Legal & Corporate Ecosystem"}
                    </h2>
                  </div>
                </div>
              </FadeContent>

              <FadeContent effect="focus" duration={1} threshold={0.15}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left selectors: 3-col tabs on mobile so all 3 people fit, full cards on desktop */}
                  <div className="lg:col-span-5 grid grid-cols-3 lg:flex lg:flex-col gap-2 sm:gap-3 lg:gap-3.5 p-1">
                    {testimonials.map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleTestimonialChange(idx)}
                        className={`group flex flex-col lg:flex-row items-center lg:items-center text-center lg:text-left gap-2 lg:gap-4 p-2.5 sm:p-3 lg:p-4.5 rounded-2xl transition-all duration-300 cursor-pointer border border-transparent relative ${activeTestimonial === idx
                            ? "bg-[var(--bg-card)] shadow-md shadow-black/5 lg:translate-x-2"
                            : "bg-[var(--bg-card)]/40 hover:bg-[var(--bg-card)] opacity-60 hover:opacity-100"
                          }`}
                      >
                        {/* Active indicator: bottom bar on mobile, left bar on desktop */}
                        {activeTestimonial === idx && (
                          <>
                            <div className="hidden lg:block absolute left-0 top-3 bottom-3 w-1 bg-amber-500 rounded-r-full" />
                            <div className="lg:hidden absolute bottom-0 left-3 right-3 h-1 bg-amber-500 rounded-t-full" />
                          </>
                        )}

                        {/* Avatar */}
                        <div className={`w-11 h-11 sm:w-12 sm:h-12 lg:w-13 lg:h-13 rounded-xl overflow-hidden shrink-0 relative border ${borderClass} transition-all duration-300 ${activeTestimonial === idx
                            ? "scale-105 shadow-sm ring-2 ring-amber-500/30"
                            : "grayscale-[30%] group-hover:grayscale-0"
                          }`}>
                          <Image src={t.avatar} alt={t.name} fill className="object-cover" />
                        </div>

                        {/* Name & Role */}
                        <div className="w-full min-w-0">
                          <div className={`font-semibold text-[11px] sm:text-xs lg:text-sm truncate transition-colors ${activeTestimonial === idx ? "text-[var(--text-primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                            }`}>
                            {t.name}
                          </div>
                          <div className="text-[9px] sm:text-[10px] lg:text-xs text-[var(--text-muted)] truncate mt-0.5">
                            {t.role}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Right featured testimonial card with smooth vertical slide effect */}
                  <div
                    className="lg:col-span-7 rounded-3xl p-6 sm:p-10 border border-[#333] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[320px]"
                    style={{ backgroundColor: "#1c1917" }}
                  >
                    {/* Background decorative subtle gradient */}
                    <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

                    {/* Vertical ticker animated content container */}
                    <div
                      key={activeTestimonial}
                      className={`relative z-10 flex flex-col justify-between h-full ${slideDirection === "down"
                          ? "animate-[rollDownIn_0.42s_cubic-bezier(0.16,1,0.3,1)]"
                          : "animate-[rollUpIn_0.42s_cubic-bezier(0.16,1,0.3,1)]"
                        }`}
                    >
                      <div className="overflow-hidden">
                        <Quote className="w-9 h-9 text-amber-500/50 mb-4 transition-transform duration-300" />
                        <p className="text-sm sm:text-lg font-serif font-light leading-relaxed mb-6 text-neutral-100">
                          {testimonials[activeTestimonial].quote}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm text-white flex items-center gap-2">
                            {testimonials[activeTestimonial].name}
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                          </div>
                          <div className="text-xs text-neutral-400 mt-0.5">{testimonials[activeTestimonial].role}</div>
                        </div>
                        <div className="flex items-center gap-1 text-amber-400">
                          {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeContent>
            </section>
          </div>

          {/* Section 6: CURTAIN on desktop (lg:), natural seamless flow on mobile */}
          <section
            id="suggestion"
            className="relative pt-16 lg:pt-20 pb-20 lg:pb-36 px-6 lg:px-10 bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-t-none lg:rounded-t-[48px] shadow-none lg:shadow-[0_-30px_70px_rgba(0,0,0,0.22)] border-t-0 lg:border-t lg:border-[var(--text-primary)]/15 scroll-mt-24"
            style={{ zIndex: 20 }}
          >
            <div className="max-w-6xl mx-auto">
              <FadeContent effect="focus" duration={1.1} threshold={0.12}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                  {/* Left Form */}
                  <div className="lg:col-span-7">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2 block">
                      {isBn ? "আপনার পরামর্শ" : "Your Suggestions & Feedback"}
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-serif font-medium tracking-tight mb-4 text-[var(--text-primary)]">
                      {isBn ? "আমাদের পরামর্শ বা মতামত দিন" : "Share Your Suggestions or Feedback"}
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-8 leading-relaxed">
                      {isBn
                        ? "আমাদের প্ল্যাটফর্ম আরও উন্নত করতে আপনার মূল্যবান মতামত বা পরামর্শ নিচে লিখে পাঠিয়ে দিন।"
                        : "Help us improve our platform. Send us your valuable suggestions, feedback, or ideas below."}
                    </p>

                    <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                      {feedbackSuccessMsg && (
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-fadeIn">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{feedbackSuccessMsg}</span>
                        </div>
                      )}
                      {feedbackErrorMsg && (
                        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-2 animate-fadeIn">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{feedbackErrorMsg}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                            {isBn ? "নাম" : "Name"}
                          </label>
                          <input
                            type="text"
                            required
                            value={feedbackName}
                            onChange={(e) => setFeedbackName(e.target.value)}
                            disabled={isSubmittingFeedback}
                            placeholder={isBn ? "আপনার নাম লিখুন" : "Enter your name"}
                            className={`w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-[var(--text-primary)]/40 bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                            {isBn ? "ফোন / ইমেইল" : "Phone / Email"}
                          </label>
                          <input
                            type="text"
                            required
                            value={feedbackContact}
                            onChange={(e) => setFeedbackContact(e.target.value)}
                            disabled={isSubmittingFeedback}
                            placeholder={isBn ? "017XXXXXXXX বা email@domain.com" : "contact@domain.com or phone"}
                            className={`w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-[var(--text-primary)]/40 bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                          {isBn ? "পরামর্শ" : "Your Suggestion"}
                        </label>
                        <textarea
                          rows={4}
                          required
                          value={feedbackSuggestion}
                          onChange={(e) => setFeedbackSuggestion(e.target.value)}
                          disabled={isSubmittingFeedback}
                          placeholder={isBn ? "আপনার মূল্যবান পরামর্শ বা মতামত লিখুন..." : "Write your suggestion or feedback here..."}
                          className={`w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-[var(--text-primary)]/40 bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]`}
                        />
                      </div>

                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <button
                          type="submit"
                          disabled={isSubmittingFeedback}
                          className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-xs sm:text-sm font-semibold uppercase tracking-wider transition-all shadow-md active:scale-95 hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer bg-[var(--accent-solid)] text-[var(--accent-contrast)] disabled:opacity-60"
                        >
                          {isSubmittingFeedback ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>{isBn ? "পাঠানো হচ্ছে..." : "Sending..."}</span>
                            </>
                          ) : (
                            <>
                              <span>{isBn ? "পরামর্শ পাঠান" : "Send Suggestion"}</span>
                              <ArrowUpRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Right Visual Card: Interactive PixelSwap between Day / Classic Courtroom and Modern Chamber */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    <div
                      className={`relative w-full h-[320px] sm:h-[400px] rounded-3xl overflow-hidden border ${borderClass} shadow-2xl bg-[var(--bg-card)] group`}
                    >
                      <PixelSwap
                        firstContent={
                          <img
                            src="/carlos-javier-yuste-jimenez-EoPb1QSkpvQ-unsplash.jpg"
                            alt="Legal Counsel Chamber"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        }
                        secondContent={
                          <img
                            src="/sasun-bughdaryan-YFz39MOmxnQ-unsplash.jpg"
                            alt="Supreme Court Architecture"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        }
                        pattern="pointer"
                        pixelSize={42}
                        pixelRadius={0}
                        duration={400}
                        pixelDuration={350}
                        randomness={0.2}
                        bounce={0.25}
                        trigger="hover"
                        style={{ width: "100%", height: "100%", borderRadius: "1.5rem" }}
                        gap={0}
                        pixelScale={0}
                        pixelSpin={0}
                        intro={false}
                      />
                    </div>

                    <div className="p-4 rounded-2xl bg-[var(--bg-card)] flex items-center gap-3.5">
                      <div className="w-10 h-10 flex items-center justify-center shrink-0 text-[var(--text-primary)]">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[var(--text-primary)]">{isBn ? "জরুরি আইনি সহায়তা ডেস্ক" : "Urgent Legal Helpline"}</div>
                        <div className="text-[11px] text-[var(--text-muted)]">+880 1700-000000 • support@legalcopilot.bd</div>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeContent>
            </div>
          </section>
        </div>

        {/* ── SECTION 7: EDITORIAL TABBED HANGING-CARD FOOTER (Our Native Theme Palette) ── */}
        <footer className="relative bg-[var(--bg-surface)] text-[var(--text-primary)] overflow-visible pt-16 sm:pt-24">
          {/* Main Container */}
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            {/* Desktop 3-part layout / Mobile stacked layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

              {/* Left Column Group: 2 Sub-Columns */}
              <div className="order-2 lg:order-1 lg:col-span-4 grid grid-cols-2 gap-6 pt-6 lg:pt-14 pb-4">
                {/* Col 1: Platform & Capabilities */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-4 text-[var(--text-primary)] flex items-center gap-1.5">
                    <span>{isBn ? "প্রোডাক্ট ফিচার" : "Core Products"}</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-[var(--text-muted)]">
                    <li><a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Advotech Copilot Chat</a></li>
                    <li><a href="#features" className="hover:text-[var(--text-primary)] transition-colors">ContractMind Audit</a></li>
                    <li><a href="#features" className="hover:text-[var(--text-primary)] transition-colors">{isBn ? "রিস্ক স্কোরিং ইঞ্জিন" : "Risk Scoring Engine"}</a></li>
                    <li><a href="#features" className="hover:text-[var(--text-primary)] transition-colors">{isBn ? "রেডলাইন ক্লজ ড্রাফট" : "Redline Clause Drafting"}</a></li>
                    <li><a href="#for-whom" className="hover:text-[var(--text-primary)] transition-colors">{isBn ? "এন্টারপ্রাইজ পোর্টাল" : "Enterprise Portal"}</a></li>
                  </ul>
                </div>

                {/* Col 2: Statutory Acts */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-4 text-[var(--text-primary)]">
                    {isBn ? "আইনগত ক্ষেত্র" : "Statutory Acts"}
                  </div>
                  <ul className="space-y-2.5 text-xs text-[var(--text-muted)]">
                    <li>The Contract Act, 1872</li>
                    <li>Bangladesh Labour Act, 2006</li>
                    <li>Arbitration Act, 2001</li>
                    <li>Transfer of Property Act, 1882</li>
                    <li>Companies Act, 1994</li>
                  </ul>
                </div>
              </div>

              {/* Center Elevated Tabbed Hanging Card (Website's native card theme) */}
              <div className="order-1 lg:order-2 lg:col-span-4 flex justify-center -translate-y-8 sm:-translate-y-12 z-30">
                <div className="relative w-full max-w-md bg-[var(--bg-card)] text-[var(--text-primary)] rounded-b-[28px] sm:rounded-b-[36px] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] border-x border-b border-[var(--text-primary)]/15 text-center">

                  {/* Left 3D Fold Ribbon Flap */}
                  <div className="absolute top-0 -left-4 sm:-left-5 w-4 sm:w-5 h-4 sm:h-5 overflow-hidden pointer-events-none">
                    <svg viewBox="0 0 20 20" className="w-full h-full fill-[var(--text-primary)]/20">
                      <polygon points="20,0 0,20 20,20" />
                    </svg>
                  </div>

                  {/* Right 3D Fold Ribbon Flap */}
                  <div className="absolute top-0 -right-4 sm:-right-5 w-4 sm:w-5 h-4 sm:h-5 overflow-hidden pointer-events-none">
                    <svg viewBox="0 0 20 20" className="w-full h-full fill-[var(--text-primary)]/20">
                      <polygon points="0,0 0,20 20,20" />
                    </svg>
                  </div>

                  {/* Brand Crest & Tagline */}
                  <div className="flex items-center justify-center gap-2.5 mb-1.5">
                    <div className="w-7 h-7 flex items-center justify-center">
                      <Image
                        src="/logo.svg"
                        alt="Advotech Copilot"
                        width={28}
                        height={28}
                        className="w-7 h-7 object-contain dark:invert"
                      />
                    </div>
                    <span className="font-serif font-bold text-lg sm:text-xl tracking-tight text-[var(--text-primary)]">
                      ADVOTECH COPILOT
                    </span>
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--text-muted)] mb-4">
                    {isBn ? "সার্বভৌম আইনি প্রযুক্তি • প্রতিষ্ঠিত ২০২৬" : "STATUTORY LEGAL PIONEERS SINCE 2026"}
                  </div>

                  {/* Main Pitch */}
                  <h3 className="font-serif text-lg sm:text-xl font-medium text-[var(--text-primary)] mb-2 leading-snug">
                    {isBn ? "আইনি রূপান্তরের অংশীদার হোন" : "Be a Part of Our Journey"}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-5 max-w-xs mx-auto">
                    {isBn
                      ? "সুপ্রিম কোর্টের গুরুত্বপূর্ণ নজির ও সংবিধিবদ্ধ চুক্তির সাপ্তাহিক ব্রিফ সরাসরি আপনার ইনবক্সে পেতে যুক্ত থাকুন।"
                      : "Sign up for landmark High Court precedents, statutory amendments, and weekly contract insights."}
                  </p>

                  {/* Clean Newsletter Input Group */}
                  <form
                    onSubmit={handleNewsletterSubmit}
                    className="w-full max-w-xs mx-auto"
                  >
                    <div className="flex flex-col sm:flex-row items-stretch rounded-xl sm:rounded-2xl overflow-hidden shadow-xs border border-[var(--text-primary)]/15 bg-[var(--bg-surface)]">
                      <input
                        type="text"
                        required
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        disabled={isSubscribingNewsletter}
                        placeholder={isBn ? "আপনার ইমেইল ঠিকানা" : "Email Address"}
                        className="w-full px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] bg-transparent outline-none font-medium"
                      />
                      <button
                        type="submit"
                        disabled={isSubscribingNewsletter}
                        className="px-5 py-2.5 bg-[var(--accent-solid)] text-[var(--accent-contrast)] hover:opacity-90 active:scale-95 text-xs font-semibold tracking-wider transition-all cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-60"
                      >
                        {isSubscribingNewsletter ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <span>
                              {newsletterSubscribed
                                ? (isBn ? "যুক্ত হয়েছেন" : "Subscribed")
                                : (isBn ? "সাবস্ক্রাইব" : "Subscribe")}
                            </span>
                            {newsletterSubscribed && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                          </>
                        )}
                      </button>
                    </div>

                    {newsletterErrorMsg && (
                      <p className="mt-2 text-[11px] text-rose-500 font-medium text-center">
                        {newsletterErrorMsg}
                      </p>
                    )}

                    {newsletterSubscribed && (
                      <div className="mt-2.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 animate-fadeIn">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{isBn ? "সফলভাবে যুক্ত হয়েছেন! ধন্যবাদ।" : "Welcome! You are on our legal digest list."}</span>
                      </div>
                    )}
                  </form>
                </div>
              </div>

              {/* Right Column Group: Important Links & Connect With Us */}
              <div className="order-3 lg:col-span-4 grid grid-cols-2 gap-6 pt-6 lg:pt-14 pb-4">
                {/* Col 3: Important Links */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider mb-4 text-[var(--text-primary)]">
                    {isBn ? "প্রয়োজনীয় লিঙ্ক" : "Important Links"}
                  </div>
                  <ul className="space-y-2.5 text-xs text-[var(--text-muted)]">
                    <li><a href="#" className="hover:text-[var(--text-primary)] transition-colors">{isBn ? "হোম পেজ" : "Home"}</a></li>
                    <li><a href="#for-whom" className="hover:text-[var(--text-primary)] transition-colors">{isBn ? "ব্যবহারকারী ভূমিকা" : "Who Is It For"}</a></li>
                    <li><a href="#reviews" className="hover:text-[var(--text-primary)] transition-colors">{isBn ? "ক্লায়েন্ট রিভিউ" : "Client Reviews"}</a></li>
                    <li><a href="#suggestion" className="hover:text-[var(--text-primary)] transition-colors">{isBn ? "পরামর্শ ফর্ম" : "Suggestion Form"}</a></li>
                    <li>
                      <button
                        type="button"
                        onClick={() => openLoginModal(false)}
                        className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        {isBn ? "লগইন / সাইন আপ" : "Sign In / Register"}
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Col 4: Direct Support & Contact */}
                <div id="contact" className="scroll-mt-24">
                  <div className="text-xs font-bold uppercase tracking-wider mb-4 text-[var(--text-primary)]">
                    {isBn ? "সাপোর্ট ও যোগাযোগ" : "Support & Contact"}
                  </div>

                  <div className="space-y-2.5 text-xs text-[var(--text-muted)]">
                    {/* WhatsApp */}
                    <a
                      href="https://wa.me/8801700000000"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-emerald-500 transition-colors group"
                    >
                      <svg className="w-4 h-4 fill-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.288.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.825z" />
                      </svg>
                      <span>WhatsApp Support</span>
                    </a>

                    {/* Helpline / Phone */}
                    <a
                      href="tel:+8801700000000"
                      className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors group"
                    >
                      <Phone className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0 group-hover:scale-110 transition-transform" />
                      <span>+880 1700-000000</span>
                    </a>

                    {/* Email */}
                    <a
                      href="mailto:support@advotech.ai"
                      className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors group"
                    >
                      <Mail className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0 group-hover:scale-110 transition-transform" />
                      <span>support@advotech.ai</span>
                    </a>
                  </div>

                  {/* Active Response Pill Badge */}
                  <div className="mt-4 pt-3 border-t border-[var(--text-primary)]/10 flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-medium">
                      {isBn ? "২৪/৭ অনলাইন এআই অ্যাসিস্ট্যান্স সক্রিয়" : "24/7 AI Assistance Active"}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Bottom Bar (Border removed & text centered) */}
            <div className="mt-12 pt-6 pb-8 flex items-center justify-center text-xs text-[var(--text-muted)] text-center">
              <div>
                © 2026, All Rights Reserved Advotech Copilot & ContractMind
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* ═══════════════════════════════════════════════════ */}
      {/* POPUP LOGIN / SIGNUP MODAL                         */}
      {/* ═══════════════════════════════════════════════════ */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />

          {/* Modal (Border removed completely) */}
          <div
            className="relative w-full max-w-[1020px] min-h-[580px] md:min-h-[640px] rounded-[32px] p-3 md:p-4 shadow-2xl flex flex-col md:flex-row transition-all z-10 animate-in zoom-in-95 duration-200 bg-[var(--bg-card)] text-[var(--text-primary)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-5 right-5 z-30 p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left visual hero: transparent/flat on mobile, styled on desktop */}
            <div className="relative w-full md:w-[46%] rounded-[24px] p-3 md:p-10 flex flex-col justify-between overflow-hidden shrink-0 min-h-0 md:min-h-auto bg-transparent md:bg-[var(--bg-surface)]">
              {/* Animated wave background: hidden on mobile, shown on desktop (md:) */}
              <div className="hidden md:block absolute inset-0 pointer-events-auto z-0 overflow-hidden">
                <GradientWaves
                  horizonColor={theme === "dark" ? "#1e1b4b" : "#5227FF"}
                  waveColor={theme === "dark" ? "#818cf8" : "#FF9FFC"}
                  crestColor={theme === "dark" ? "#e0e7ff" : "#FFFFFF"}
                  speed={0.4} amplitude={2.5} waveScale={0.6} waveRatio={0.9}
                  swell={35} turbulence={20} tilt={1.11} zoom={1} height={5.5}
                  fogDepth={15} detail="medium" brightness={1}
                  opacity={theme === "dark" ? 0.85 : 0.9}
                  mouseInteraction parallaxStrength={0.5} grain grainIntensity={0.05}
                />
              </div>
              <div className="relative z-10 flex items-center gap-3.5">
                <div className="w-11 h-11 flex items-center justify-center">
                  <Image
                    src="/logo.svg"
                    alt="Advotech Copilot"
                    width={44}
                    height={44}
                    className="w-11 h-11 object-contain dark:invert"
                  />
                </div>
                <span className="font-bold text-xl sm:text-[22px] tracking-tight text-[var(--text-primary)]">Advotech Copilot</span>
              </div>

              {/* Subtitle, Heading, Description & Feature Cards: Hidden on mobile, shown on desktop (md:) */}
              <div className="hidden md:block relative z-10 pt-8 md:pt-0">
                <span className="text-xs font-semibold uppercase tracking-wider block mb-2 text-[var(--text-muted)]">
                  {isBn ? "আইনি নিশ্চয়তা ও প্রফেশনাল বুদ্ধিমত্তা" : "Sovereign Contract Intelligence"}
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-normal leading-[1.25] tracking-tight mb-2 text-[var(--text-primary)]">
                  {isBn ? "চুক্তির প্রতিটি ধারা বিশ্লেষণ করুন শতভাগ নিশ্চয়তায়" : "Analyze every clause with zero statutory hallucination."}
                </h2>
                <p className="text-xs leading-relaxed text-[var(--text-muted)] mb-6">
                  {isBn ? "বাংলাদেশের সংবিধিবদ্ধ আইন, শ্রম আইন ও চুক্তি আইনের নির্ভরযোগ্য যাচাইকরণ।" : "Verify legal risks against Bangladesh statutes. Zero hallucination guaranteed."}
                </p>

              </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex flex-col justify-start px-6 sm:px-8 md:px-10 py-8 overflow-y-auto max-h-[80vh] md:max-h-none">
              <div className="w-full max-w-[400px] mx-auto">

                {/* ══════════════════════════════════════════════════════ */}
                {/* [UPDATED] FORGOT PASSWORD FLOW (overrides login/signup views) */}
                {/* ══════════════════════════════════════════════════════ */}
                {forgotStep !== "none" && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setForgotStep("none"); setForgotError(""); }}
                      className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      {isBn ? "লগইনে ফিরে যান" : "Back to sign in"}
                    </button>

                    <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-1 text-[var(--text-primary)]">
                      {forgotStep === "email"
                        ? (isBn ? "পাসওয়ার্ড রিসেট করুন" : "Reset your password")
                        : (isBn ? "নতুন পাসওয়ার্ড সেট করুন" : "Set a new password")}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mb-5">
                      {forgotStep === "email"
                        ? (isBn ? "আপনার নিবন্ধিত ইমেইল দিন। আমরা একটি ৬-সংখ্যার কোড পাঠাবো।" : "Enter your registered email. We'll send you a 6-digit code.")
                        : (isBn ? `কোডটি পাঠানো হয়েছে: ${forgotEmail}` : `Code sent to: ${forgotEmail}`)}
                    </p>

                    {forgotStep === "email" && (
                      <form onSubmit={handleForgotSendOtp} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                            {isBn ? "ইমেইল" : "Email"}
                          </label>
                          <input
                            type="email"
                            required
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="your@email.com"
                            className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-[var(--text-primary)]/40 bg-transparent text-[var(--text-primary)]`}
                          />
                        </div>
                        {forgotError && <p className="text-xs text-rose-500">{forgotError}</p>}
                        <button
                          type="submit"
                          disabled={forgotLoading}
                          className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-[var(--accent-solid)] text-[var(--accent-contrast)] hover:opacity-90 disabled:opacity-60 cursor-pointer"
                        >
                          {forgotLoading ? (isBn ? "পাঠানো হচ্ছে..." : "Sending...") : (isBn ? "কোড পাঠান" : "Send reset code")}
                        </button>
                      </form>
                    )}

                    {forgotStep === "otp" && (
                      <form onSubmit={handleResetPassword} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                            {isBn ? "৬-সংখ্যার কোড" : "6-digit code"}
                          </label>
                          <input
                            type="text"
                            maxLength={6}
                            required
                            value={forgotOtp}
                            onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                            placeholder="••••••"
                            className={`w-full text-center text-xl font-mono tracking-[0.35em] py-3 rounded-xl border-2 outline-none ${borderClass} focus:border-blue-500 bg-transparent text-[var(--text-primary)]`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                            {isBn ? "নতুন পাসওয়ার্ড" : "New password"}
                          </label>
                          <input
                            type="password"
                            required
                            value={forgotNewPw}
                            onChange={(e) => setForgotNewPw(e.target.value)}
                            placeholder="••••••••"
                            className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${borderClass} focus:border-[var(--text-primary)]/40 bg-transparent text-[var(--text-primary)]`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">
                            {isBn ? "পাসওয়ার্ড নিশ্চিত করুন" : "Confirm new password"}
                          </label>
                          <input
                            type="password"
                            required
                            value={forgotConfirmPw}
                            onChange={(e) => setForgotConfirmPw(e.target.value)}
                            placeholder="••••••••"
                            className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${borderClass} focus:border-[var(--text-primary)]/40 bg-transparent text-[var(--text-primary)]`}
                          />
                        </div>
                        {forgotError && <p className="text-xs text-rose-500">{forgotError}</p>}
                        <button
                          type="submit"
                          disabled={forgotLoading || forgotOtp.length < 6}
                          className="w-full py-3 px-4 rounded-xl text-sm font-semibold bg-[var(--accent-solid)] text-[var(--accent-contrast)] hover:opacity-90 disabled:opacity-60 cursor-pointer"
                        >
                          {forgotLoading ? (isBn ? "রিসেট হচ্ছে..." : "Resetting...") : (isBn ? "পাসওয়ার্ড রিসেট করুন" : "Reset password")}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setForgotError("");
                            try { await api.post("/api/auth/forgot-password", { email: forgotEmail.trim() }); }
                            catch { /* ignore */ }
                          }}
                          className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline transition-colors cursor-pointer"
                        >
                          {isBn ? "কোড পাননি? পুনরায় পাঠান" : "Didn't get the code? Resend"}
                        </button>
                      </form>
                    )}
                  </>
                )}

                {/* ══════════════════════════════════════════════════════ */}
                {/* LOGIN / SIGNUP FLOW (hidden while in forgot flow)   */}
                {/* ══════════════════════════════════════════════════════ */}
                {forgotStep === "none" && (
                  <>
                    {/* ── Segmented Tab Switcher (Sign In vs Register) ── */}
                    <div className="flex rounded-xl bg-[var(--bg-surface)] p-1 mb-5 border border-[var(--text-primary)]/10">
                      <button
                        type="button"
                        onClick={() => { setIsSignUp(false); setAuthError(""); }}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${!isSignUp ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm font-bold" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                      >
                        {isBn ? "লগইন (Sign In)" : "Sign In"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsSignUp(true); setRegStep("role"); setAuthError(""); }}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${isSignUp ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm font-bold" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                      >
                        {isBn ? "নতুন নিবন্ধন" : "Register"}
                      </button>
                    </div>

                    {/* ── SIGN IN ── */}
                    {!isSignUp && (
                      <>
                        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-1 text-[var(--text-primary)]">
                          {isBn ? "স্বাগতম ফিরে আসার জন্য" : "Welcome back"}
                        </h2>
                        <p className="text-xs sm:text-[13px] leading-relaxed mb-4 text-[var(--text-muted)]">
                          {isBn ? "আপনার সংরক্ষিত চুক্তি, অডিট রিপোর্ট ও আইনি কনসাল্টেশনে প্রবেশ করুন।" : "Sign in to access your audit workspace, legal memos, and verified citations."}
                        </p>

                        {/* Google One-Click Continue */}
                        <div className="w-full flex flex-col items-center justify-center mb-3">
                          <div className="relative w-full max-w-[340px] h-[44px] rounded-full select-none">
                            {/* Layer 1: Native Pixel-Perfect Visual Button (100% stable, zero flicker) */}
                            <div className="w-full h-[44px] flex items-center justify-center gap-3 px-5 rounded-full border border-[var(--text-primary)]/15 hover:bg-[var(--text-primary)]/[0.05] active:scale-[0.99] transition-all font-medium text-xs sm:text-sm text-[var(--text-primary)] shadow-sm bg-[var(--bg-card)] pointer-events-none">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                              </svg>
                              <span>{isBn ? "Google দিয়ে চালিয়ে যান" : "Continue with Google"}</span>
                            </div>

                            {/* Layer 2: Google Official GSI Button (Transparent on top, receives native clicks) */}
                            <div
                              ref={googleSignInBtnRef}
                              className="absolute inset-0 w-full h-full z-10 opacity-[0.001] cursor-pointer rounded-full flex items-center justify-center overflow-hidden [&>div]:!w-full [&>div]:!h-full [&_iframe]:!w-full [&_iframe]:!h-full"
                            />
                          </div>
                        </div>

                        <div className="relative flex items-center mb-4">
                          <div className="flex-grow border-t border-[var(--text-primary)]/10"></div>
                          <span className="flex-shrink mx-3 text-xs text-[var(--text-muted)] font-medium">
                            {isBn ? "অথবা ইমেইল দিয়ে লগইন করুন" : "or continue with email"}
                          </span>
                          <div className="flex-grow border-t border-[var(--text-primary)]/10"></div>
                        </div>

                        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                          <div>
                            <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "ইমেইল অ্যাড্রেস" : "Email address"}</label>
                            <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder={isBn ? "আপনার ইমেইল" : "your@email.com"} className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-[var(--text-primary)]/40 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)]`} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "পাসওয়ার্ড" : "Password"}</label>
                            <div className="relative">
                              <input type={showPassword ? "text" : "password"} required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••••••" className={`w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-[var(--text-primary)]/40 bg-transparent text-[var(--text-primary)]`} />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          {authError && !isSignUp && (
                            <p className="text-xs text-red-500 mt-1 px-1">{authError}</p>
                          )}
                          <div className="pt-1 space-y-2">
                            <button type="submit" disabled={authLoading} className="w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-[0.99] hover:opacity-90 cursor-pointer bg-[var(--accent-solid)] text-[var(--accent-contrast)] disabled:opacity-60">
                              {authLoading ? (isBn ? "অপেক্ষা করুন..." : "Signing in...") : (isBn ? "লগইন করুন ও অ্যাপে প্রবেশ করুন" : "Sign in to workspace")}
                            </button>

                            {/* [UPDATED] NEW: Forgot password link */}
                            <button
                              type="button"
                              onClick={() => {
                                setForgotStep("email");
                                setForgotEmail(loginEmail);
                                setForgotError("");
                              }}
                              className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:underline transition-colors cursor-pointer"
                            >
                              {isBn ? "পাসওয়ার্ড ভুলে গেছেন?" : "Forgot password?"}
                            </button>
                          </div>
                        </form>
                        <div className="mt-5 text-center text-xs text-[var(--text-muted)]">
                          <span>{isBn ? "অ্যাকাউন্ট নেই? " : "Don't have an account? "}</span>
                          <button type="button" onClick={() => { setIsSignUp(true); setRegStep("role"); }} className="font-semibold underline underline-offset-4 hover:opacity-80 transition-opacity ml-1 cursor-pointer text-[var(--text-primary)]">
                            {isBn ? "নিবন্ধন করুন" : "Register"}
                          </button>
                        </div>

                        {/* ── Judge / Evaluator 1-Click Fast Access (Only visible when Admin enables Instant Judge Mode) ── */}
                        {instantJudgeMode && (
                          <div className="mt-5 pt-4 border-t border-[var(--text-primary)]/10">
                            {!demoMenuOpen ? (
                              <div className="flex flex-col items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setDemoMenuOpen(true)}
                                  aria-expanded={false}
                                  aria-label={isBn ? "বিচারকের জন্য তাৎক্ষণিক প্রবেশ" : "Instant Access for Judge"}
                                  className="relative w-12 h-12 rounded-full border border-[var(--text-primary)]/25 bg-[var(--bg-card)] shadow-sm flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--text-primary)]/[0.06] hover:border-[var(--text-primary)]/35 active:scale-95 transition-all cursor-pointer"
                                >
                                  <span className="absolute inset-0 rounded-full border border-[var(--text-primary)]/15 animate-ping" style={{ animationDuration: "2.5s" }} />
                                  <Zap className="relative w-5 h-5 fill-current" />
                                </button>
                                <span className="text-center leading-tight">
                                  <span className="block text-[12px] font-semibold text-[var(--text-primary)]">
                                    {isBn ? "বিচারকের জন্য তাৎক্ষণিক প্রবেশ" : "Instant Access for Judge"}
                                  </span>
                                </span>
                              </div>
                            ) : (
                              <div className="relative w-72 h-52 mx-auto my-1">
                                {/* Main round button at the center — same style as the closed state, click toggles */}
                                <button
                                  type="button"
                                  onClick={() => setDemoMenuOpen(false)}
                                  aria-expanded={true}
                                  aria-label={isBn ? "বিচারকের জন্য তাৎক্ষণিক প্রবেশ" : "Instant Access for Judge"}
                                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-[var(--text-primary)]/25 bg-[var(--bg-card)] shadow-sm flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--text-primary)]/[0.06] hover:border-[var(--text-primary)]/35 active:scale-95 transition-all cursor-pointer z-10"
                                >
                                  <Zap className="w-5 h-5 fill-current" />
                                </button>

                                {/* Role circles orbiting around the center */}
                                {demoRoles.map((role, i) => {
                                  const offsets = [
                                    { x: -86, y: -56 }, // top-left
                                    { x: 86, y: -56 },  // top-right
                                    { x: -86, y: 56 },  // bottom-left
                                    { x: 86, y: 56 },   // bottom-right
                                  ];
                                  const o = offsets[i];
                                  return (
                                    <div
                                      key={role.key}
                                      className="absolute left-1/2 top-1/2 flex flex-col items-center gap-1"
                                      style={{ transform: `translate(calc(-50% + ${o.x}px), calc(-50% + ${o.y}px))` }}
                                    >
                                      <button
                                        type="button"
                                        disabled={demoLoadingRole !== null}
                                        onClick={() => handleQuickDemoLogin(role.key)}
                                        aria-label={`${role.name} — ${isBn ? "ডেমো প্রবেশ" : "demo login"}`}
                                        className="w-10 h-10 rounded-full border border-[var(--text-primary)]/15 bg-[var(--bg-card)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--text-primary)]/[0.06] hover:border-[var(--text-primary)]/35 active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                                      >
                                        {demoLoadingRole === role.key ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : "img" in role ? (
                                          <Image src={role.img} alt={role.name} width={20} height={20} className="w-5 h-5 object-contain dark:invert" />
                                        ) : (
                                          <role.icon className="w-4 h-4" strokeWidth={1.75} />
                                        )}
                                      </button>
                                      <span className="flex flex-col items-center gap-0.5">
                                        <span className="text-[8px] font-medium text-[var(--text-primary)] whitespace-nowrap leading-none">
                                          {demoLoadingRole === role.key
                                            ? isBn ? "প্রবেশ..." : "Entering..."
                                            : role.name}
                                        </span>
                                        <span className="text-[7px] text-[var(--text-muted)] whitespace-nowrap leading-none">
                                          {isBn ? role.role.bn : role.role.en}
                                        </span>
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* ── SIGN UP ── */}
                    {isSignUp && (
                      <>
                        {/* STEP 1: Role Selection */}
                        {regStep === "role" && (
                          <>
                            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-1 text-[var(--text-primary)]">
                              {isBn ? "নতুন অ্যাকাউন্ট খুলুন" : "Create your account"}
                            </h2>
                            <p className="text-xs sm:text-[13px] leading-relaxed mb-4 text-[var(--text-muted)]">
                              {isBn ? "আপনার ব্যবহারকারী ধরন বেছে নিন।" : "Choose your account type to get started."}
                            </p>

                            {/* Google One-Click Register */}
                            <div className="w-full flex flex-col items-center justify-center mb-3">
                              <div className="relative w-full max-w-[340px] h-[44px] rounded-full select-none">
                                {/* Layer 1: Native Pixel-Perfect Visual Button (100% stable, zero flicker) */}
                                <div className="w-full h-[44px] flex items-center justify-center gap-3 px-5 rounded-full border border-[var(--text-primary)]/15 hover:bg-[var(--text-primary)]/[0.05] active:scale-[0.99] transition-all font-medium text-xs sm:text-sm text-[var(--text-primary)] shadow-sm bg-[var(--bg-card)] pointer-events-none">
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                  </svg>
                                  <span>{isBn ? "Google দিয়ে সাইন আপ করুন" : "Sign up with Google"}</span>
                                </div>

                                {/* Layer 2: Google Official GSI Button (Transparent on top, receives native clicks) */}
                                <div
                                  ref={googleSignUpBtnRef}
                                  className="absolute inset-0 w-full h-full z-10 opacity-[0.001] cursor-pointer rounded-full flex items-center justify-center overflow-hidden [&>div]:!w-full [&>div]:!h-full [&_iframe]:!w-full [&_iframe]:!h-full"
                                />
                              </div>
                              <p className="text-[11px] text-[var(--text-muted)] mt-1.5 text-center flex items-center justify-center gap-1">
                              </p>
                            </div>

                            {authError && isSignUp && regStep === "role" && (
                              <p className="text-xs text-red-500 mb-2 px-1 text-center">{authError}</p>
                            )}

                            <div className="flex flex-col gap-3">
                              {/* General */}
                              <button type="button" onClick={() => { setSelectedRole("general"); setRegStep("form"); }}
                                className="group w-full p-4 rounded-2xl text-left transition-all cursor-pointer bg-[var(--text-primary)]/[0.035] hover:bg-[var(--text-primary)]/[0.065]">
                                <div className="flex items-center gap-3.5">
                                  <Image
                                    src="/general-user.png"
                                    alt={isBn ? "সাধারণ ব্যবহারকারী" : "General User"}
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 object-contain dark:invert opacity-75 group-hover:opacity-100 group-hover:scale-110 shrink-0 transition-all"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm text-[var(--text-primary)]">{isBn ? "সাধারণ ব্যবহারকারী" : "General User"}</div>
                                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{isBn ? "SME, ফ্রিল্যান্সার, HR — চুক্তি ও আইনি প্রশ্নের জন্য" : "SME, Freelancer, HR — contracts & legal queries"}</div>
                                  </div>
                                  <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0 transition-colors" />
                                </div>
                              </button>
                              {/* Lawyer */}
                              <button type="button" onClick={() => { setSelectedRole("lawyer"); setRegStep("form"); }}
                                className="group w-full p-4 rounded-2xl text-left transition-all cursor-pointer bg-[var(--text-primary)]/[0.035] hover:bg-[var(--text-primary)]/[0.065]">
                                <div className="flex items-center gap-3.5">
                                  <Image
                                    src="/lawyer.png"
                                    alt={isBn ? "আইনজীবী / অ্যাডভোকেট" : "Lawyer / Advocate"}
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 object-contain dark:invert opacity-75 group-hover:opacity-100 group-hover:scale-110 shrink-0 transition-all"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm text-[var(--text-primary)]">
                                      {isBn ? "আইনজীবী / অ্যাডভোকেট" : "Lawyer / Advocate"}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{isBn ? "বার কাউন্সিল ভেরিফিকেশনসহ পেশাদার ওয়ার্কস্পেস" : "Professional workspace with Bar Council verification"}</div>
                                  </div>
                                  <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0 transition-colors" />
                                </div>
                              </button>
                              {/* Enterprise */}
                              <button type="button" onClick={() => { setSelectedRole("enterprise"); setRegStep("form"); }}
                                className="group w-full p-4 rounded-2xl text-left transition-all cursor-pointer bg-[var(--text-primary)]/[0.035] hover:bg-[var(--text-primary)]/[0.065]">
                                <div className="flex items-center gap-3.5">
                                  <Landmark className="w-5 h-5 text-[var(--text-primary)] opacity-75 group-hover:opacity-100 group-hover:scale-110 shrink-0 transition-all" />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm text-[var(--text-primary)]">
                                      {isBn ? "কোম্পানি / এন্টারপ্রাইজ" : "Company / Enterprise"}
                                    </div>
                                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{isBn ? "কর্পোরেট প্রতিষ্ঠান ও টিম রেফারাল ওয়ার্কস্পেস" : "Corporate entities & team referral workspace"}</div>
                                  </div>
                                  <ArrowUpRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] shrink-0 transition-colors" />
                                </div>
                              </button>
                            </div>
                            <div className="mt-5 text-center text-xs text-[var(--text-muted)]">
                              <span>{isBn ? "ইতিমধ্যে অ্যাকাউন্ট আছে? " : "Already have an account? "}</span>
                              <button type="button" onClick={() => setIsSignUp(false)} className="font-semibold underline underline-offset-4 hover:opacity-80 transition-opacity ml-1 cursor-pointer text-[var(--text-primary)]">
                                {isBn ? "লগইন করুন" : "Sign in"}
                              </button>
                            </div>
                          </>
                        )}

                        {/* STEP 2: Registration Form */}
                        {regStep === "form" && selectedRole && (
                          <>
                            <button type="button" onClick={() => setRegStep("role")}
                              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4 cursor-pointer">
                              <ChevronLeft className="w-3.5 h-3.5" />
                              {isBn ? "ফিরে যান" : "Back to role selection"}
                            </button>
                            <div className="flex items-center gap-2.5 mb-4">
                              {selectedRole === "general" ? (
                                <Image src="/general-user.png" alt="General User" width={20} height={20} className="w-5 h-5 object-contain dark:invert shrink-0" />
                              ) : selectedRole === "lawyer" ? (
                                <Image src="/lawyer.png" alt="Lawyer" width={20} height={20} className="w-5 h-5 object-contain dark:invert shrink-0" />
                              ) : (
                                <Landmark className="w-5 h-5 text-[var(--text-primary)] shrink-0" />
                              )}
                              <span className="text-sm font-semibold text-[var(--text-primary)]">
                                {selectedRole === "general" ? (isBn ? "সাধারণ ব্যবহারকারী নিবন্ধন" : "General User Registration") : selectedRole === "lawyer" ? (isBn ? "আইনজীবী নিবন্ধন আবেদন" : "Lawyer Registration") : (isBn ? "কোম্পানি ও টিম নিবন্ধন" : "Enterprise Registration")}
                              </span>
                            </div>

                            {authError && (
                              <div className="p-3 mb-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 font-medium">
                                {authError}
                              </div>
                            )}

                            {/* ── GENERAL FORM ── */}
                            {selectedRole === "general" && (
                              <form onSubmit={handleStartFormSubmit} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "ফার্স্ট নেম" : "First name"} <span className="text-red-500">*</span></label>
                                    <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Tariqul" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-blue-400/60 bg-transparent text-[var(--text-primary)]`} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "লাস্ট নেম" : "Last name"} <span className="text-red-500">*</span></label>
                                    <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Islam" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-blue-400/60 bg-transparent text-[var(--text-primary)]`} />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "জন্ম তারিখ" : "Date of birth"} <span className="text-red-500">*</span></label>
                                    <input type="date" required value={dob} onChange={(e) => setDob(e.target.value)} className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-blue-400/60 bg-transparent text-[var(--text-primary)]`} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "লিঙ্গ" : "Gender"} <span className="text-red-500">*</span></label>
                                    <select value={gender} onChange={(e) => setGender(e.target.value)} className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-blue-400/60 bg-[var(--bg-card)] text-[var(--text-primary)]`}>
                                      <option value="male">{isBn ? "পুরুষ (Male)" : "Male"}</option>
                                      <option value="female">{isBn ? "নারী (Female)" : "Female"}</option>
                                      <option value="other">{isBn ? "অন্যান্য (Other)" : "Other"}</option>
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "ইমেইল অ্যাড্রেস" : "Email"} <span className="text-red-500">*</span></label>
                                  <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="your@email.com" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-blue-400/60 bg-transparent text-[var(--text-primary)]`} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "পাসওয়ার্ড" : "Password"} <span className="text-red-500">*</span></label>
                                    <input type="password" required value={regPassword} onChange={(e) => { setRegPassword(e.target.value); setPasswordError(""); }} placeholder="••••••••" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-blue-400/60 bg-transparent text-[var(--text-primary)]`} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "কনফার্ম পাসওয়ার্ড" : "Confirm password"} <span className="text-red-500">*</span></label>
                                    <input type="password" required value={regConfirmPassword} onChange={(e) => { setRegConfirmPassword(e.target.value); setPasswordError(""); }} placeholder="••••••••" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-blue-400/60 bg-transparent text-[var(--text-primary)]`} />
                                  </div>
                                </div>
                                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                  {isBn
                                    ? "ওটিপি যাচাইয়ের পর একাউন্ট সক্রিয় হবে।"
                                    : "Account will be activated after OTP verification."}
                                </p>
                                {passwordError && <p className="text-[11px] text-rose-500">{passwordError}</p>}
                                {regPassword && regPassword.length < 6 && (
                                  <p className="text-[11px] text-amber-500">{isBn ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" : "Password must be at least 6 characters."}</p>
                                )}
                                {regConfirmPassword && regPassword !== regConfirmPassword && (
                                  <p className="text-[11px] text-rose-500">{isBn ? "পাসওয়ার্ড এবং নিশ্চিত পাসওয়ার্ড মিলছে না।" : "Passwords do not match."}</p>
                                )}
                                <div className="pt-1">
                                  <button
                                    type="submit"
                                    disabled={!isGeneralFormValid || authLoading}
                                    className="w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-[0.99] hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--accent-solid)] text-[var(--accent-contrast)] flex items-center justify-center gap-2"
                                  >
                                    {authLoading ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      isBn ? "নিবন্ধন সম্পন্ন করুন" : "Create Account"
                                    )}
                                  </button>
                                </div>
                              </form>
                            )}

                            {/* ── LAWYER FORM ── */}
                            {selectedRole === "lawyer" && (
                              <form onSubmit={handleStartFormSubmit} className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "ফার্স্ট নেম" : "First name"} <span className="text-red-500">*</span></label>
                                    <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Shireen" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-amber-400/60 bg-transparent text-[var(--text-primary)]`} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "লাস্ট নেম" : "Last name"} <span className="text-red-500">*</span></label>
                                    <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Akhter" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-amber-400/60 bg-transparent text-[var(--text-primary)]`} />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "জন্ম তারিখ" : "Date of birth"} <span className="text-red-500">*</span></label>
                                    <input type="date" required value={dob} onChange={(e) => setDob(e.target.value)} className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-amber-400/60 bg-transparent text-[var(--text-primary)]`} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "লিঙ্গ" : "Gender"} <span className="text-red-500">*</span></label>
                                    <select value={gender} onChange={(e) => setGender(e.target.value)} className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-amber-400/60 bg-[var(--bg-card)] text-[var(--text-primary)]`}>
                                      <option value="female">{isBn ? "নারী (Female)" : "Female"}</option>
                                      <option value="male">{isBn ? "পুরুষ (Male)" : "Male"}</option>
                                      <option value="other">{isBn ? "অন্যান্য (Other)" : "Other"}</option>
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "ইমেইল অ্যাড্রেস" : "Email"} <span className="text-red-500">*</span></label>
                                  <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="advocate@email.com" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-amber-400/60 bg-transparent text-[var(--text-primary)]`} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "পাসওয়ার্ড" : "Password"} <span className="text-red-500">*</span></label>
                                    <input type="password" required value={regPassword} onChange={(e) => { setRegPassword(e.target.value); setPasswordError(""); }} placeholder="••••••••" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-amber-400/60 bg-transparent text-[var(--text-primary)]`} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "কনফার্ম পাসওয়ার্ড" : "Confirm password"} <span className="text-red-500">*</span></label>
                                    <input type="password" required value={regConfirmPassword} onChange={(e) => { setRegConfirmPassword(e.target.value); setPasswordError(""); }} placeholder="••••••••" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-amber-400/60 bg-transparent text-[var(--text-primary)]`} />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                  <div>
                                    <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "বার কাউন্সিল সনদ নম্বর" : "Bar Council Enrollment No."} <span className="text-red-500">*</span></label>
                                    <input type="text" required value={barCouncilNo} onChange={(e) => setBarCouncilNo(e.target.value)} placeholder="BC-48291/2019" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-amber-400/60 bg-transparent text-[var(--text-primary)] font-mono`} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "আইন শাখা" : "Field of law"} <span className="text-red-500">*</span></label>
                                    <select value={fieldOfLaw} onChange={(e) => setFieldOfLaw(e.target.value)} className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-amber-400/60 bg-[var(--bg-card)] text-[var(--text-primary)]`}>
                                      <option value="Corporate & Commercial Law">{isBn ? "কর্পোরেট ও বাণিজ্যিক" : "Corporate & Commercial"}</option>
                                      <option value="Labour & Employment Law">{isBn ? "শ্রম ও চাকরি আইন" : "Labour & Employment"}</option>
                                      <option value="Property & Land Law">{isBn ? "সম্পত্তি ও ভূমি আইন" : "Property & Land"}</option>
                                      <option value="Civil & Contract Litigation">{isBn ? "দেওয়ানি ও চুক্তি" : "Civil & Contract"}</option>
                                      <option value="ICT & FinTech Law">{isBn ? "আইসিটি ও ফিনটেক" : "ICT & FinTech"}</option>
                                    </select>
                                  </div>
                                </div>
                                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                  {isBn
                                    ? "ওটিপি যাচাইয়ের পর বার কাউন্সিল সনদ অ্যাডমিন কর্তৃক অনুমোদিত হবে।"
                                    : "Credentials will be reviewed by admin after OTP verification."}
                                </p>
                                {passwordError && <p className="text-[11px] text-rose-500">{passwordError}</p>}
                                {regPassword && regPassword.length < 6 && (
                                  <p className="text-[11px] text-amber-500">{isBn ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" : "Password must be at least 6 characters."}</p>
                                )}
                                {regConfirmPassword && regPassword !== regConfirmPassword && (
                                  <p className="text-[11px] text-rose-500">{isBn ? "পাসওয়ার্ড এবং নিশ্চিত পাসওয়ার্ড মিলছে না।" : "Passwords do not match."}</p>
                                )}
                                <div className="pt-1">
                                  <button
                                    type="submit"
                                    disabled={!isLawyerFormValid || authLoading}
                                    className="w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-[0.99] hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--accent-solid)] text-[var(--accent-contrast)] flex items-center justify-center gap-2"
                                  >
                                    {authLoading ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      isBn ? "আইনজীবী আবেদন জমা দিন" : "Submit Lawyer Application"
                                    )}
                                  </button>
                                </div>
                              </form>
                            )}

                            {/* ── ENTERPRISE FORM ── */}
                            {selectedRole === "enterprise" && (
                              <div className="space-y-3">
                                <div className="flex gap-2 p-1 rounded-xl bg-[var(--bg-surface)] mb-2">
                                  <button type="button" onClick={() => setEntTab("company")}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${entTab === "company" ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
                                    {isBn ? "কোম্পানি রেজিস্ট্রেশন" : "Company / Enterprise"}
                                  </button>
                                  <button type="button" onClick={() => setEntTab("member")}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${entTab === "member" ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
                                    {isBn ? "টিম মেম্বার জয়েন" : "Join as Member"}
                                  </button>
                                </div>

                                {entTab === "company" ? (
                                  <form onSubmit={handleStartFormSubmit} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "কোম্পানির নাম" : "Company name"} <span className="text-red-500">*</span></label>
                                        <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Apex Holdings Ltd" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-transparent text-[var(--text-primary)]`} />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "কোম্পানির ধরন" : "Company type"} <span className="text-red-500">*</span></label>
                                        <select value={companyType} onChange={(e) => setCompanyType(e.target.value)} className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-[var(--bg-card)] text-[var(--text-primary)]`}>
                                          <option value="Private Limited">{isBn ? "প্রাইভেট লিমিটেড" : "Private Limited"}</option>
                                          <option value="Public Limited">{isBn ? "পাবলিক লিমিটেড" : "Public Limited"}</option>
                                          <option value="Partnership">{isBn ? "অংশীদারি কারবার" : "Partnership"}</option>
                                          <option value="Proprietorship">{isBn ? "একমালিকানা" : "Proprietorship"}</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "রেজিস্ট্রেশন নম্বর" : "Registration No."} <span className="text-red-500">*</span></label>
                                        <input type="text" required value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)} placeholder="C-148920/2021" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-transparent text-[var(--text-primary)] font-mono`} />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "টিআইএন (TIN) নম্বর" : "TIN No."} <span className="text-red-500">*</span></label>
                                        <input type="text" required value={tinNo} onChange={(e) => setTinNo(e.target.value)} placeholder="582910482912" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-transparent text-[var(--text-primary)] font-mono`} />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "অ্যাডমিনের নাম" : "Name of Admin"} <span className="text-red-500">*</span></label>
                                        <input type="text" required value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Rahim Chowdhury" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-transparent text-[var(--text-primary)]`} />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "টিম মেম্বার সংখ্যা" : "Team Members Limit"} <span className="text-red-500">*</span></label>
                                        <input type="number" min={1} required value={memberCount} onChange={(e) => setMemberCount(Number(e.target.value))} className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-transparent text-[var(--text-primary)] font-mono`} />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "অ্যাডমিন ইমেইল" : "Admin Email"} <span className="text-red-500">*</span></label>
                                      <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="admin@apexholdings.bd" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-transparent text-[var(--text-primary)]`} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "পাসওয়ার্ড" : "Password"} <span className="text-red-500">*</span></label>
                                        <input type="password" required value={regPassword} onChange={(e) => { setRegPassword(e.target.value); setPasswordError(""); }} placeholder="••••••••" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-transparent text-[var(--text-primary)]`} />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "কনফার্ম পাসওয়ার্ড" : "Confirm password"} <span className="text-red-500">*</span></label>
                                        <input type="password" required value={regConfirmPassword} onChange={(e) => { setRegConfirmPassword(e.target.value); setPasswordError(""); }} placeholder="••••••••" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-transparent text-[var(--text-primary)]`} />
                                      </div>
                                    </div>
                                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                      {isBn
                                        ? "অ্যাডমিন অনুমোদনের পর কোম্পানি ওয়ার্কস্পেস সক্রিয় হবে।"
                                        : "Corporate workspace will unlock after admin approval."}
                                    </p>
                                    {regPassword && regPassword.length < 6 && (
                                      <p className="text-[11px] text-amber-500">{isBn ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" : "Password must be at least 6 characters."}</p>
                                    )}
                                    {regConfirmPassword && regPassword !== regConfirmPassword && (
                                      <p className="text-[11px] text-rose-500">{isBn ? "পাসওয়ার্ড এবং নিশ্চিত পাসওয়ার্ড মিলছে না।" : "Passwords do not match."}</p>
                                    )}
                                    {passwordError && <p className="text-[11px] text-rose-500">{passwordError}</p>}
                                    <div className="pt-1">
                                      <button
                                        type="submit"
                                        disabled={!isCompanyFormValid || authLoading}
                                        className="w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-[0.99] hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--accent-solid)] text-[var(--accent-contrast)] flex items-center justify-center gap-2"
                                      >
                                        {authLoading ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          isBn ? "কোম্পানি রেজিস্ট্রেশন আবেদন" : "Register Enterprise"
                                        )}
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <form onSubmit={handleStartFormSubmit} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "ফার্স্ট নেম" : "First name"} <span className="text-red-500">*</span></label>
                                        <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Member" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-transparent text-[var(--text-primary)]`} />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "লাস্ট নেম" : "Last name"} <span className="text-red-500">*</span></label>
                                        <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Name" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-transparent text-[var(--text-primary)]`} />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "জন্ম তারিখ" : "Date of birth"} <span className="text-red-500">*</span></label>
                                        <input type="date" required value={dob} onChange={(e) => setDob(e.target.value)} className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-transparent text-[var(--text-primary)]`} />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "লিঙ্গ" : "Gender"} <span className="text-red-500">*</span></label>
                                        <select value={gender} onChange={(e) => setGender(e.target.value)} className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-[var(--bg-card)] text-[var(--text-primary)]`}>
                                          <option value="male">{isBn ? "পুরুষ (Male)" : "Male"}</option>
                                          <option value="female">{isBn ? "নারী (Female)" : "Female"}</option>
                                          <option value="other">{isBn ? "অন্যান্য (Other)" : "Other"}</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "কোম্পানির নাম" : "Company name"} <span className="text-red-500">*</span></label>
                                        <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Apex Holdings Ltd" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-transparent text-[var(--text-primary)]`} />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "কোম্পানি রেফারেল কোড" : "Company Referral Code"} <span className="text-red-500">*</span></label>
                                        <input type="text" required value={companyReferCode} onChange={(e) => setCompanyReferCode(e.target.value)} placeholder="APX-8821" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-transparent text-[var(--text-primary)] font-mono`} />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "মেম্বার ইমেইল" : "Email"} <span className="text-red-500">*</span></label>
                                      <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="member@company.com" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-transparent text-[var(--text-primary)]`} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "পাসওয়ার্ড" : "Password"} <span className="text-red-500">*</span></label>
                                        <input type="password" required value={regPassword} onChange={(e) => { setRegPassword(e.target.value); setPasswordError(""); }} placeholder="••••••••" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-transparent text-[var(--text-primary)]`} />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold mb-1 text-[var(--text-primary)]">{isBn ? "কনফার্ম পাসওয়ার্ড" : "Confirm password"} <span className="text-red-500">*</span></label>
                                        <input type="password" required value={regConfirmPassword} onChange={(e) => { setRegConfirmPassword(e.target.value); setPasswordError(""); }} placeholder="••••••••" className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-purple-400/60 bg-transparent text-[var(--text-primary)]`} />
                                      </div>
                                    </div>
                                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                      {isBn
                                        ? "ওটিপি যাচাইয়ের পর কোম্পানি অ্যাডমিন অনুমোদন করবেন।"
                                        : "Membership will be reviewed by company admin after OTP verification."}
                                    </p>
                                    {regPassword && regPassword.length < 6 && (
                                      <p className="text-[11px] text-amber-500">{isBn ? "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" : "Password must be at least 6 characters."}</p>
                                    )}
                                    {regConfirmPassword && regPassword !== regConfirmPassword && (
                                      <p className="text-[11px] text-rose-500">{isBn ? "পাসওয়ার্ড এবং নিশ্চিত পাসওয়ার্ড মিলছে না।" : "Passwords do not match."}</p>
                                    )}
                                    {passwordError && <p className="text-[11px] text-rose-500">{passwordError}</p>}
                                    <div className="pt-1">
                                      <button
                                        type="submit"
                                        disabled={!isMemberFormValid || authLoading}
                                        className="w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-[0.99] hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--accent-solid)] text-[var(--accent-contrast)] flex items-center justify-center gap-2"
                                      >
                                        {authLoading ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          isBn ? "কোম্পানি টিমে যুক্ত হন" : "Join Company Team"
                                        )}
                                      </button>
                                    </div>
                                  </form>
                                )}
                              </div>
                            )}

                            <div className="mt-4 text-center text-xs text-[var(--text-muted)]">
                              <span>{isBn ? "ইতিমধ্যে অ্যাকাউন্ট আছে? " : "Already have an account? "}</span>
                              <button type="button" onClick={() => setIsSignUp(false)} className="font-semibold underline underline-offset-4 hover:opacity-80 transition-opacity ml-1 cursor-pointer text-[var(--text-primary)]">
                                {isBn ? "লগইন করুন" : "Sign in"}
                              </button>
                            </div>
                          </>
                        )}

                        {/* STEP 3: OTP on Mail */}
                        {regStep === "otp" && (
                          <div className="py-2">
                            <button type="button" onClick={() => setRegStep("form")}
                              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4 cursor-pointer">
                              <ChevronLeft className="w-3.5 h-3.5" />
                              {isBn ? "ফর্মে ফিরে যান" : "Back to form"}
                            </button>
                            <div className="text-center mb-6">
                              <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mb-3 shadow-inner">
                                <Mail className="w-6 h-6 animate-pulse" />
                              </div>
                              <h3 className="text-xl font-bold font-serif text-[var(--text-primary)] mb-1">
                                {isBn ? "ইমেইল ওটিপি যাচাই করুন" : "Verify Email OTP"}
                              </h3>
                              <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto mb-3">
                                {isBn ? (
                                  <>আমরা <b>{regEmail || "আপনার ইমেইলে"}</b> একটি ৬-সংখ্যার ওটিপি কোড পাঠিয়েছি।</>
                                ) : (
                                  <>We sent a 6-digit verification OTP code to <b>{regEmail || "your email"}</b>.</>
                                )}
                              </p>
                              <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50 text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed max-w-xs mx-auto text-center">
                                {selectedRole === "lawyer" ? (
                                  <p>
                                    {isBn
                                      ? "ওটিপি যাচাই সম্পন্ন হওয়ার পর আপনার সনদপত্রটি সিস্টেম অ্যাডমিন পর্যালোচনায় জমা হবে।"
                                      : "Verifying your email OTP will submit your credentials for System Admin review."}
                                  </p>
                                ) : selectedRole === "enterprise" && entTab === "company" ? (
                                  <p>
                                    {isBn
                                      ? "ওটিপি যাচাই সম্পন্ন হওয়ার পর আপনার কোম্পানিটি সিস্টেম অ্যাডমিন পর্যালোচনায় জমা হবে।"
                                      : "Verifying your email OTP will register your enterprise awaiting System Admin review."}
                                  </p>
                                ) : selectedRole === "enterprise" && entTab === "member" ? (
                                  <p>
                                    {isBn
                                      ? "ওটিপি যাচাই সম্পন্ন হওয়ার পর আবেদনটি কোম্পানি অ্যাডমিনের কোটা অনুমোদনের অপেক্ষায় থাকবে।"
                                      : "Verifying your email OTP will submit your request to your Company Admin for quota approval."}
                                  </p>
                                ) : (
                                  <p>
                                    {isBn
                                      ? "ওটিপি যাচাই সম্পন্ন হওয়ার সাথে সাথে ১০০ ফ্রি ক্রেডিট নিয়ে সরাসরি ওয়ার্কস্পেসে প্রবেশ করতে পারবেন।"
                                      : "Verifying your email OTP will instantly activate your account with 100 free credits."}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-4 max-w-xs mx-auto">
                              <div>
                                <label className="block text-xs font-semibold mb-1 text-center text-[var(--text-primary)]">
                                  {isBn ? "৬-সংখ্যার ওটিপি কোড লিখুন" : "Enter 6-digit OTP Code"}
                                </label>
                                <input
                                  type="text"
                                  maxLength={6}
                                  value={otpInput}
                                  onChange={(e) => { setOtpInput(e.target.value.replace(/\D/g, "")); setOtpError(""); }}
                                  placeholder="••••••"
                                  className={`w-full text-center text-2xl font-mono tracking-[0.35em] py-3 rounded-xl border-2 outline-none transition-colors ${borderClass} focus:border-blue-500 bg-transparent text-[var(--text-primary)]`}
                                />
                                {otpError && (
                                  <p className="text-[11px] text-rose-500 text-center mt-1.5">{otpError}</p>
                                )}
                              </div>

                              <button
                                type="button"
                                disabled={authLoading || otpInput.trim().length !== 6}
                                onClick={handleVerifyOtpAndComplete}
                                className="w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-[0.99] hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--accent-solid)] text-[var(--accent-contrast)] mt-2 flex items-center justify-center gap-2"
                              >
                                {authLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 shrink-0 stroke-2" />
                                    <span>
                                      {selectedRole === "lawyer"
                                        ? (isBn ? "যাচাই সম্পন্ন ও আবেদন জমা দিন" : "Verify & Submit Lawyer Application")
                                        : selectedRole === "enterprise" && entTab === "company"
                                          ? (isBn ? "যাচাই সম্পন্ন ও কোম্পানি নিবন্ধন সম্পন্ন করুন" : "Verify & Complete Registration")
                                          : selectedRole === "enterprise" && entTab === "member"
                                            ? (isBn ? "যাচাই সম্পন্ন ও মেম্বারশিপ আবেদন জমা দিন" : "Verify & Submit Membership Request")
                                            : (isBn ? "যাচাই সম্পন্ন ও প্রবেশ করুন" : "Verify & Complete Registration")}
                                    </span>
                                  </>
                                )}
                              </button>

                              <div className="text-center text-xs text-[var(--text-muted)] pt-1 space-y-1">
                                <div>
                                  <span>{isBn ? "কোড পাননি? " : "Didn't receive code? "}</span>
                                  <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    className="font-semibold text-[var(--text-primary)] hover:underline ml-1 cursor-pointer"
                                  >
                                    {isBn ? "পুনরায় কোড পাঠান" : "Resend OTP"}
                                  </button>
                                </div>
                                {resendStatus && (
                                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{resendStatus}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}