"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Loader2, ShieldCheck } from "lucide-react";

export default function DemoUserPage() {
  const router = useRouter();
  const { loginAsDemoRole } = useAuth();
  const { language } = useLanguage();
  const isBn = language === "bn";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const enterDemo = async () => {
      try {
        await loginAsDemoRole("general");
        if (mounted) {
          router.replace("/contractmind");
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to enter demo mode");
        }
      }
    };
    enterDemo();
    return () => {
      mounted = false;
    };
  }, [loginAsDemoRole, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="flex flex-col items-center text-center max-w-sm p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--text-primary)]/10 shadow-lg">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-serif font-bold text-[var(--text-primary)] mb-1">
          {isBn ? "ডেমো ইউজার অ্যাক্সেস" : "1-Click Demo User Access"}
        </h1>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          {isBn ? "সাধারণ নাগরিক/এসএমই হিসেবে অ্যাপে প্রবেশ করানো হচ্ছে..." : "Entering ContractMind as Tariqul Islam (SME)..."}
        </p>
        {error ? (
          <div className="text-xs text-red-500 mb-3">{error}</div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>{isBn ? "লগইন হচ্ছে..." : "Authenticating session..."}</span>
          </div>
        )}
      </div>
    </div>
  );
}
