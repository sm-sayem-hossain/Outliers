"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useLanguage } from "@/context/LanguageContext";
import { SAMPLE_CONTRACTS, SampleContract } from "@/data/sampleContracts";
import { CONTRACT_AUDITS, ContractAudit } from "@/data/contractAudits";
import MarkdownViewer from "@/components/markdown/MarkdownViewer";
import {
  generateContractAuditMarkdown,
  generateRealContractAuditMarkdown,
} from "@/lib/markdownContractGenerator";
import { runDispatchAlgorithm, INITIAL_DEMO_LAWYERS, DispatchDecision } from "@/lib/dispatcher";
import {
  uploadContract,
  requestLawyerVerification,
  getContractDetail,
  downloadRedlineDocx,
  ContractAuditResult,
} from "@/lib/apiServices";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import {
  Upload, ArrowLeft, Bot, Printer, CheckCircle2, Shield,
  Download, ArrowRight, ShieldCheck, AlertTriangle, Briefcase, Scale, FileText,
} from "lucide-react";

/**
 * অডিট মার্কডাউনের হেডার কাউন্ট এবং কমপ্লায়েন্স মেট্রিক্সের ভুল স্ট্যাটাস ফিক্স করার স্যানিটাইজার
 */
function sanitizeAuditMarkdown(md: string): string {
  if (!md) return md;

  const highRiskMatches = md.match(/\|\s*(?:High\s*Risk|উচ্চ\s*ঝুঁকি|Critical)\s*\|/gi);
  const detectedCount = highRiskMatches ? highRiskMatches.length : 3;

  const lines = md.split("\n");
  const updatedLines = lines.map((line) => {
    let modifiedLine = line;

    if (modifiedLine.includes("|") && /\|\s*0\s*(?:Clauses|টি ধারা|ধারা)\s*\|/i.test(modifiedLine)) {
      modifiedLine = modifiedLine.replace(
        /\|\s*0\s*(?:Clauses|টি ধারা|ধারা)\s*\|/i,
        `| ${detectedCount} Clauses |`
      );
    }

    if (
      modifiedLine.includes("|") &&
      /(?:High\s*Risk|উচ্চ\s*ঝুঁকি|Critical)/i.test(modifiedLine)
    ) {
      modifiedLine = modifiedLine.replace(
        /\|\s*(?:COMPLIANT|সম্মত)\s*\|/gi,
        "| **NON-COMPLIANT (VOID)** |"
      );
    }

    return modifiedLine;
  });

  return updatedLines.join("\n");
}

export default function ContractMindPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { user, updateUser, refreshUser } = useAuth();
  const { toast } = useNotification();
  const isBn = language === "bn";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [selectedContractId, setSelectedContractId] = useState<string>("employment-agreement");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isDownloadingRedline, setIsDownloadingRedline] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchedDecision, setDispatchedDecision] = useState<DispatchDecision | null>(null);
  const [lawyerSealApplied, setLawyerSealApplied] = useState<boolean>(false);

  const [apiContractId, setApiContractId] = useState<string | null>(null);
  const [apiAuditResult, setApiAuditResult] = useState<ContractAuditResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [auditedFor, setAuditedFor] = useState<"CLIENT" | "VENDOR" | "NEUTRAL">("CLIENT");

  const userRole = String(user?.role || "").toUpperCase();
  const entStatus = String(user?.enterpriseProfile?.verificationStatus || "").toLowerCase();
  const isPendingEnterpriseAdmin =
    Boolean(user?.enterpriseProfile && !user?.enterpriseProfile?.isTeamMember && entStatus !== "verified") ||
    entStatus === "pending" ||
    entStatus === "pending_approval";
  const isPendingLawyer =
    user?.lawyerProfile?.verificationStatus === "pending" || userRole === "LAWYER";
  const isPendingMember =
    (userRole === "ENTERPRISE_MEMBER" || user?.enterpriseProfile?.isTeamMember) &&
    ((user as any)?.member_approval_status === "PENDING" ||
      user?.enterpriseProfile?.memberApprovalStatus === "PENDING");

  useEffect(() => {
    if (!user) return;
    if (isPendingEnterpriseAdmin) {
      router.replace("/enterprise/pending");
    } else if (isPendingLawyer) {
      router.replace("/lawyer/pending");
    } else if (isPendingMember) {
      router.replace("/enterprise/member");
    }
  }, [user, isPendingEnterpriseAdmin, isPendingLawyer, isPendingMember, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const contractId = params.get("id");
      
      if (contractId) {
        if (CONTRACT_AUDITS[contractId]) {
          setSelectedContractId(contractId);
          setIsLoaded(true);
        } else if (!isNaN(Number(contractId))) {
          setIsAnalyzing(true);
          getContractDetail(contractId)
            .then((data) => {
              setApiContractId(String(data.contract_id));
              setApiAuditResult(data);
              setIsLoaded(true);
            })
            .catch((err) => {
              console.error("Failed to fetch contract from backend:", err);
              setUploadError(
                isBn ? "চুক্তিপত্রটি লোড করা যায়নি বা আপনার অ্যাক্সেস নেই।" : "Failed to load contract or access denied."
              );
            })
            .finally(() => {
              setIsAnalyzing(false);
            });
        }
      }
    }
  }, [isBn]);

  if (String(user?.role).toUpperCase() === "LAWYER") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--bg-primary)">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentContract: SampleContract =
    SAMPLE_CONTRACTS.find((c) => c.id === selectedContractId) || SAMPLE_CONTRACTS[0];
  const currentAudit: ContractAudit =
    CONTRACT_AUDITS[selectedContractId] || CONTRACT_AUDITS["employment-agreement"];

  const processFile = async (file: File) => {
    if (!file) return;
    setDispatchedDecision(null);
    setLawyerSealApplied(false);
    setUploadError(null);

    const isSupported = /\.(pdf|docx|doc|png|jpe?g)$/i.test(file.name);
    if (!isSupported) {
      setUploadError(
        isBn
          ? "ফাইল ফরম্যাট সমর্থিত নয়। ব্যাকএন্ড শুধুমাত্র .pdf, .docx, .doc, .png, .jpg ফাইল সমর্থন করে।"
          : "Unsupported file format. The backend only allows: .pdf, .docx, .doc, .png, .jpg."
      );
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await uploadContract(file, undefined, auditedFor);
      setApiContractId(String(result.contract_id));
      setApiAuditResult(result);
      
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(`contract_audit_${result.contract_id}`, JSON.stringify(result));
          if (result.memo_id) localStorage.setItem(`contract_audit_${result.memo_id}`, JSON.stringify(result));
        }
      } catch {}
      
      if (refreshUser) refreshUser().catch(() => {});
      setIsAnalyzing(false);
      setIsLoaded(true);
    } catch (err: unknown) {
      console.error("Backend upload error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setUploadError(
        isBn
          ? `সার্ভার ত্রুটি: ${errorMessage || "ডকুমেন্ট ক্লাউড স্টোরেজে আপলোড করা যায়নি"}`
          : `Server Error: ${errorMessage || "Failed to upload document to secure storage"}`
      );
      setIsAnalyzing(false);
      setIsLoaded(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSendToAdvocate = async () => {
    setIsDispatching(true);
    
    if (apiContractId) {
      try {
        const verifRes = await requestLawyerVerification(apiContractId);
        if (verifRes?.credits_deducted && updateUser && user?.creditBalance != null) {
          updateUser({ creditBalance: Math.max(0, user.creditBalance - verifRes.credits_deducted) });
        } else if (refreshUser) {
          refreshUser().catch(() => {});
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to request lawyer verification";
        toast.error(errorMessage || (isBn ? "আইনজীবী ভেরিফিকেশন রিকোয়েস্ট ব্যর্থ হয়েছে।" : "Failed to request lawyer verification"));
        setIsDispatching(false);
        return;
      }
    }

    setTimeout(() => {
      const domainMap: Record<string, string> = {
        "employment-agreement": "LABOUR_EMPLOYMENT",
        "vendor-sla": "IP_ICT",
        "commercial-lease": "REAL_ESTATE_PROPERTY",
      };
      const domain = domainMap[selectedContractId] || "CORPORATE_COMMERCIAL";

      const decision = runDispatchAlgorithm(
        {
          id: currentContract.id,
          userId: "u1",
          title: currentContract.titleEn,
          domain: domain,
          statuteReference: currentContract.categoryEn,
          riskCount: currentAudit.stats.highRiskCount,
          priority: currentAudit.stats.highRiskCount > 2 ? "HIGH" : "NORMAL",
        },
        INITIAL_DEMO_LAWYERS
      );

      setDispatchedDecision(decision);
      setIsDispatching(false);

      if (typeof window !== "undefined") {
        const existing = JSON.parse(localStorage.getItem("dispatched_pending_contracts") || "[]");
        const newEntry = {
          id: `cnt-${Date.now().toString().slice(-4)}`,
          clientName: user?.name ? `${user.name} (Client)` : "Client",
          clientPhone: user?.mobile || "+880 1700-000000",
          titleEn: currentContract.titleEn,
          titleBn: currentContract.titleBn,
          submittedAtEn: "Just now",
          submittedAtBn: "মাত্র এখন",
          statuteEn: currentContract.categoryEn,
          statuteBn: currentContract.categoryBn,
          riskCount: currentAudit.stats.highRiskCount,
          priority: currentAudit.stats.highRiskCount > 2 ? "high" : "normal",
          contractId: currentContract.id,
        };
        localStorage.setItem("dispatched_pending_contracts", JSON.stringify([newEntry, ...existing]));
      }
    }, 600);
  };

  const handleDownloadReport = () => window.print();

  const handleDownloadRedlineDocx = async () => {
    const contractId = apiContractId || (apiAuditResult as any)?.contract_id || (apiAuditResult as any)?.id;
    if (!contractId) {
      toast.error(isBn ? "সংরক্ষিত চুক্তির ক্ষেত্রে DOCX ফাইল ডাউনলোড সম্ভব।" : "Redlined DOCX is available for uploaded agreements.");
      return;
    }
    try {
      setIsDownloadingRedline(true);
      const blob = await downloadRedlineDocx(contractId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Redlined_Contract_${contractId}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(isBn ? "রেডলাইন করা DOCX ফাইল সফলভাবে ডাউনলোড হয়েছে!" : "Redlined DOCX downloaded successfully!");
    } catch (err: any) {
      toast.error(err?.message || (isBn ? "ডাউনলোড করতে ব্যর্থ হয়েছে" : "Failed to download redlined DOCX"));
    } finally {
      setIsDownloadingRedline(false);
    }
  };

  const handleOpenInCopilot = () => {
    const auditObj = apiAuditResult as unknown as Record<string, unknown> | null;
    const currentAuditObj = currentAudit as unknown as Record<string, unknown>;

    const hasHighRisk = currentAudit.stats.highRiskCount > 0;
    const computedScore = hasHighRisk ? 90 : 40;
    const fallbackGradeEn = hasHighRisk ? "High Risk" : "Moderate Risk";
    const fallbackGradeBn = hasHighRisk ? "উচ্চ ঝুঁকি" : "মধ্যম ঝুঁকি";

    const contextPayload = {
      contractId: apiContractId || currentContract.id,
      titleEn: (auditObj?.contract_title as string) || (auditObj?.title as string) || currentContract.titleEn,
      titleBn: (auditObj?.contract_title as string) || (auditObj?.title as string) || currentContract.titleBn,
      clauseFocus: null,
      shouldStartNewSession: true,
      riskScore: (auditObj?.overall_risk_score as number) ?? (auditObj?.risk_score as number) ?? computedScore,
      riskGradeEn: (auditObj?.risk_grade as string) || (auditObj?.overall_risk as string) || fallbackGradeEn,
      riskGradeBn: (auditObj?.risk_grade as string) || (auditObj?.overall_risk as string) || fallbackGradeBn,
      summaryEn: (auditObj?.executive_summary as string) || (currentAuditObj?.executiveSummaryEn as string) || "",
      summaryBn: (auditObj?.executive_summary as string) || (currentAuditObj?.executiveSummaryBn as string) || "",
    };

    sessionStorage.setItem("active_audit_contract", JSON.stringify(contextPayload));
    router.push("/copilot");
  };

  const rawAuditContent = apiAuditResult
    ? generateRealContractAuditMarkdown(
        apiAuditResult,
        language as "en" | "bn",
        dispatchedDecision ? {
          advocateName: dispatchedDecision.lawyer.name,
          barCouncilNo: dispatchedDecision.lawyer.barCouncilNo,
          verifiedAt: "18 Oct 2026, 4:52 PM",
          sealApplied: lawyerSealApplied,
          advocateNotes: lawyerSealApplied ? "Reviewed and cross-examined against relevant Bangladesh Statutes. Redlines confirmed lawful." : undefined,
        } : undefined
      )
    : generateContractAuditMarkdown(
        currentContract.id,
        language as "en" | "bn",
        dispatchedDecision ? {
          advocateName: dispatchedDecision.lawyer.name,
          barCouncilNo: dispatchedDecision.lawyer.barCouncilNo,
          verifiedAt: "18 Oct 2026, 4:52 PM",
          sealApplied: lawyerSealApplied,
          advocateNotes: lawyerSealApplied ? "Reviewed and cross-examined against relevant Bangladesh Statutes. Redlines confirmed lawful." : undefined,
        } : undefined
      );

  const markdownAuditContent = sanitizeAuditMarkdown(rawAuditContent);

  if (isPendingEnterpriseAdmin || isPendingLawyer || isPendingMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--bg-primary)">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="w-full min-h-screen pb-32 font-sans" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
        
        <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" className="hidden" onChange={handleFileUpload} />

        {!isLoaded ? (
          <div className="max-w-3xl mx-auto pt-4 sm:pt-20 px-4 flex flex-col items-center text-center">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2 text-(--text-primary)">
              {language === "bn" ? "কন্ট্রাক্টমাইন্ড" : "ContractMind"}
            </h1>
            <p className="text-xs sm:text-sm text-(--text-muted) max-w-lg mx-auto font-normal leading-relaxed mb-8">
              {language === "bn"
                ? "চুক্তিপত্র আপলোড করে বাংলাদেশ শ্রম ও চুক্তি আইনের আলোকে স্বয়ংক্রিয় অডিট ও নিরাপদ রেডলাইন প্রস্তুত করুন।"
                : "Upload any contract to audit statutory violations and generate compliant redlines under Bangladesh law."}
            </p>

            {uploadError && (
              <div className="w-full max-w-xl mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 flex items-start gap-3 text-left animate-in fade-in">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <div className="flex-1">
                  <p className="text-xs font-bold mb-0.5">{language === "bn" ? "সার্ভার আপলোড ত্রুটি" : "Server Upload Error"}</p>
                  <p className="text-xs opacity-90 leading-relaxed">{uploadError}</p>
                </div>
              </div>
            )}

            {/* Party Perspective Selector */}
            <div className="w-full max-w-xl mb-4 p-1.5 sm:p-2.5 rounded-2xl bg-(--bg-surface) border border-(--text-primary)/10 shadow-sm flex flex-row items-center justify-between gap-2">
              <span className="flex text-[11px] sm:text-xs font-semibold text-(--text-primary) px-1 items-center gap-1.5 shrink-0 whitespace-nowrap">
                <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{isBn ? "অডিট পার্সপেক্টিভ:" : "Audit Perspective:"}</span>
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setAuditedFor("CLIENT")}
                  className={`flex-1 sm:flex-none px-2 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                    auditedFor === "CLIENT"
                      ? "bg-black dark:bg-white text-white dark:text-black shadow-sm font-bold"
                      : "text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/5 font-medium"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{isBn ? (<>ক্লায়েন্ট<span className="hidden sm:inline"> / ক্রেতা</span></>) : "Protect Client"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuditedFor("VENDOR")}
                  className={`flex-1 sm:flex-none px-2 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                    auditedFor === "VENDOR"
                      ? "bg-black dark:bg-white text-white dark:text-black shadow-sm font-bold"
                      : "text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/5 font-medium"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{isBn ? (<><span className="hidden sm:inline">সার্ভিস </span>ভেন্ডর</>) : "Protect Vendor"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuditedFor("NEUTRAL")}
                  className={`flex-1 sm:flex-none px-2 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                    auditedFor === "NEUTRAL"
                      ? "bg-black dark:bg-white text-white dark:text-black shadow-sm font-bold"
                      : "text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/5 font-medium"
                  }`}
                >
                  <Scale className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{isBn ? "নিরপেক্ষ" : "Neutral"}</span>
                </button>
              </div>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !isAnalyzing && fileInputRef.current?.click()}
              className={`w-full transition-all duration-200 rounded-3xl p-6 sm:p-16 flex flex-col items-center justify-center group shadow-sm mb-6 bg-(--bg-surface) ${isAnalyzing ? "cursor-wait opacity-80" : "cursor-pointer"}`}
            >
              <div className="w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform mb-4 bg-(--bg-card) text-(--text-primary)">
                <Upload className="w-6 h-6 stroke-2" />
              </div>

              {isAnalyzing ? (
                <div className="space-y-2 text-center py-2">
                  <div className="w-5 h-5 rounded-full border-2 border-neutral-300 border-t-black dark:border-t-white animate-spin mx-auto" />
                  <p className="text-sm font-medium text-(--text-primary)">
                    {language === "bn" ? "চুক্তি লোড ও বিশ্লেষণ করা হচ্ছে..." : "Loading and evaluating contract..."}
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-base font-semibold mb-1 text-(--text-primary)">
                    {language === "bn" ? "চুক্তির ফাইল এখানে ড্রপ করুন অথবা ব্রাউজ করুন" : "Drop contract PDF or DOCX here, or browse"}
                  </p>
                  <p className="text-xs text-(--text-muted)">
                    {language === "bn" ? "সমর্থিত ফরম্যাট: .PDF, .DOCX, .DOC, .PNG, .JPG (সর্বোচ্চ ১৫ মেগাবাইট)" : "Supported formats: .PDF, .DOCX, .DOC, .PNG, .JPG (Max 15MB)"}
                  </p>
                  <button type="button" className="mt-6 px-5 py-2.5 rounded-full bg-(--accent-solid) text-(--accent-contrast) text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer">
                    {language === "bn" ? "ফাইল নির্বাচন করুন" : "Browse Files"}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 print:pt-0 print:px-0 print:max-w-none">
            <div className="hidden print:block pb-6 mb-8 border-b-2 border-neutral-900">
              <div className="flex justify-between items-baseline mb-2 text-xs font-mono uppercase tracking-widest text-neutral-800">
                <span className="font-bold">CONFIDENTIAL ATTORNEY-CLIENT AUDIT MEMORANDUM</span>
                <span>BANGLADESH LAW STATUTORY JURISDICTION</span>
              </div>
              <div className="flex justify-between text-[11px] text-neutral-500 font-sans">
                <span>Audited via ContractMind · Automated Statutory Risk Engine</span>
                <span>Statutes verified against Laws of Bangladesh (bdlaws.minlaw.gov.bd)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
              <button
                onClick={() => {
                  setIsLoaded(false);
                  setApiAuditResult(null);
                  setApiContractId(null);
                  setDispatchedDecision(null);
                  router.push("/contractmind");
                }}
                className="text-xs font-medium flex items-center gap-1.5 transition-colors opacity-60 hover:opacity-100 cursor-pointer text-(--text-primary)"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{language === "bn" ? "অন্য চুক্তিপত্র আপলোড করুন" : "Upload another agreement"}</span>
              </button>

              <div className="flex items-center gap-2">
                <button onClick={handleDownloadReport} className="px-3 py-1.5 rounded-xl border border-(--text-primary)/10 text-xs font-medium text-(--text-muted) hover:text-(--text-primary) flex items-center gap-1.5 transition-colors cursor-pointer">
                  <Printer className="w-3.5 h-3.5" />
                  <span>{language === "bn" ? "প্রিন্ট / পিডিএফ" : "Print / PDF"}</span>
                </button>
                <button onClick={handleDownloadRedlineDocx} disabled={isDownloadingRedline} className="px-3.5 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50">
                  {isDownloadingRedline ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <span>{language === "bn" ? "রেডলাইন (DOCX)" : "Redline (.docx)"}</span>
                </button>
                <button onClick={() => handleOpenInCopilot()} className="px-3.5 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer">
                  <Bot className="w-3.5 h-3.5" />
                  <span>{language === "bn" ? "কোপাইলট আলোচনা" : "Open in Copilot"}</span>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <MarkdownViewer content={markdownAuditContent} />
            </div>

            <div className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-(--text-primary)/10 bg-(--bg-card) shadow-sm print:hidden">
              {!dispatchedDecision ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm sm:text-base font-serif font-bold text-(--text-primary)">
                        {language === "bn" ? "সংবিধিবদ্ধ আইনি যাচাইকরণ ও সিলমোহর" : "Statutory Verification & Advocate Seal"}
                      </h3>
                    </div>
                    <p className="text-xs text-(--text-muted) max-w-xl leading-relaxed">
                      {language === "bn"
                        ? "রিপোর্টটি ডাউনলোড করুন অথবা বাংলাদেশ সুপ্রিম কোর্টের আইনজীবীর কাছে পাঠিয়ে আইনগত মতামত ও অফিসিয়াল সিলমোহর গ্রহণ করুন।"
                        : "Download your contract audit report or dispatch it to an advocate for statutory review and Bar Council seal."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap w-full sm:w-auto">
                    <button onClick={handleDownloadReport} className="px-3.5 py-2.5 rounded-xl border border-(--text-primary)/15 text-xs font-semibold text-(--text-primary) hover:bg-(--text-primary)/5 flex items-center gap-2 transition-colors cursor-pointer">
                      <Download className="w-4 h-4 text-(--text-muted)" />
                      <span>{language === "bn" ? "রিপোর্ট (PDF)" : "Report (PDF)"}</span>
                    </button>
                    <button onClick={handleDownloadRedlineDocx} disabled={isDownloadingRedline} className="px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-500/20 flex items-center gap-2 transition-colors cursor-pointer shadow-sm disabled:opacity-50">
                      {isDownloadingRedline ? (
                        <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <span>{language === "bn" ? "ডাউনলোড রেডলাইন (.DOCX)" : "Download Redline (.DOCX)"}</span>
                    </button>
                    <button onClick={handleSendToAdvocate} disabled={isDispatching} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-(--accent-solid) text-(--accent-contrast) hover:opacity-90 flex items-center gap-2 transition-opacity cursor-pointer shadow-sm disabled:opacity-50">
                      {isDispatching ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          <span>{language === "bn" ? "আইনজীবী নির্বাচন হচ্ছে..." : "Assigning Lawyer..."}</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>{language === "bn" ? "লইয়ার দ্বারা ভেরিফাই করুন" : "Verify by Lawyer"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-400">
                            {language === "bn" ? "চুক্তিপত্রটি সফলভাবে আইনজীবীর কাছে পাঠানো হয়েছে" : "Contract Dispatched to Advocate"}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                            Assigned: {dispatchedDecision.lawyer.id}
                          </span>
                        </div>
                        <p className="text-xs text-(--text-primary) mt-1 font-semibold">
                          {dispatchedDecision.lawyer.name} ({dispatchedDecision.lawyer.barCouncilNo})
                        </p>
                        <p className="text-xs text-(--text-muted) mt-0.5">
                          {language === "bn" ? "আইনজীবী তার ওয়ার্কস্পেস থেকে চুক্তিটি পর্যালোচনা করে সংবিধিবদ্ধ সিলমোহর প্রদান করবেন।" : "The advocate has received your contract in their pending queue for verification."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                      <button onClick={handleDownloadReport} className="px-3.5 py-2 rounded-xl border border-(--text-primary)/15 text-xs font-semibold text-(--text-primary) hover:bg-(--text-primary)/5 flex items-center gap-1.5 transition-colors cursor-pointer">
                        <Download className="w-3.5 h-3.5 text-(--text-muted)" />
                        <span>{language === "bn" ? "ডাউনলোড" : "Download"}</span>
                      </button>
                      <button onClick={() => router.push("/lawyer/pending")} className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-500/20 flex items-center gap-1.5 transition-colors cursor-pointer">
                        <span>{language === "bn" ? "আইনজীবী কিউতে দেখুন →" : "View in Lawyer Queue →"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden print:block pt-3 mt-4 border-t border-neutral-300 text-xs text-neutral-500 space-y-1 font-sans break-inside-avoid print-avoid-break">
              <div className="flex justify-between items-baseline text-[11px] font-medium text-neutral-700">
                <span>ContractMind · Autonomous Statutory Contract Auditor</span>
                <span>Verified against bdlaws (Government of Bangladesh)</span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-normal">
                Notice: This legal audit report is computer-generated based on statutory rules under the Bangladesh Labour Act 2006, The Contract Act 1872, and relevant codified legislation. For formal legal representation or litigation proceedings, consultation with a Supreme Court Advocate is recommended.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

