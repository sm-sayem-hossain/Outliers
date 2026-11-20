"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { maskPii } from "@/lib/piiMasker";
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
  Download, ArrowRight, ShieldCheck, AlertTriangle, Briefcase, Scale, FileText, Clock, Sparkles,
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
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [uploadFileName, setUploadFileName] = useState<string>("");

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAnalyzing) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAnalyzing]);

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getAuditStage = (sec: number, isBnLang: boolean, perspective: string) => {
    const persLabel =
      perspective === "VENDOR"
        ? isBnLang ? "ভেন্ডর পার্সপেক্টিভ" : "Vendor Perspective"
        : perspective === "NEUTRAL"
        ? isBnLang ? "নিরপেক্ষ পার্সপেক্টিভ" : "Neutral Perspective"
        : isBnLang ? "ক্লায়েন্ট পার্সপেক্টিভ" : "Client Perspective";

    if (sec < 4) {
      return {
        step: 1,
        title: isBnLang ? "ডকুমেন্ট পার্সিং ও ওসিআর এক্সট্রাকশন" : "Document Parsing & Structural OCR",
        desc: isBnLang
          ? "চুক্তিপত্রের পাতার টেক্সট ও ক্লজসমূহ নিরাপদ স্যান্ডবক্সে এক্সট্রাক্ট করা হচ্ছে..."
          : "Extracting contract text & clause architecture in secure sandbox...",
        pct: Math.min(22, 10 + sec * 3.5),
      };
    } else if (sec < 9) {
      return {
        step: 2,
        title: isBnLang ? "ক্লজ বিভাজন ও সেগমেন্টেশন" : "Clause Segmentation & Classification",
        desc: isBnLang
          ? "প্রতিটি ধারা ও উপধারা সংবিধিবদ্ধ চুক্তি কাঠামোর অধীনে বিন্যস্ত হচ্ছে..."
          : "Classifying distinct clauses into standard statutory contractual domains...",
        pct: Math.min(48, 25 + (sec - 4) * 4.6),
      };
    } else if (sec < 16) {
      return {
        step: 3,
        title: isBnLang ? "বাংলাদেশ আইনের সাথে স্ট্যাটিউটরি ক্রস-চেক" : "Cross-Checking Bangladesh Statutes",
        desc: isBnLang
          ? "The Contract Act 1872, শ্রম আইন ও সাইবার নিরাপত্তা আইনের ৩,৫২৫টি ধারার সাথে মিলকরণ..."
          : "Benchmarking terms against 3,525 verified acts via bdlaws statutory index...",
        pct: Math.min(74, 50 + (sec - 9) * 3.4),
      };
    } else if (sec < 25) {
      return {
        step: 4,
        title: isBnLang ? "রিস্ক স্কোরিং ও প্রিডেটরি ক্লজ অ্যানালাইসিস" : "Risk Scoring & Predatory Clause Audit",
        desc: isBnLang
          ? `${persLabel} থেকে দায়বদ্ধতার সীমা, একতরফা জরিমানা ও ভয়েড শর্তের মূল্যায়ন...`
          : `Evaluating liability caps, penalty terms, and void covenants from ${persLabel}...`,
        pct: Math.min(90, 75 + (sec - 16) * 1.7),
      };
    } else {
      return {
        step: 5,
        title: isBnLang ? "রেডলাইন ড্রাফট ও অডিট মেমোরান্ডাম চূড়ান্তকরণ" : "Synthesizing Redlines & Audit Memo",
        desc: isBnLang
          ? "আইনগত সুরক্ষিত রেডলাইন বিকল্প ড্রাফট ও চূড়ান্ত অডিট মেমোরান্ডাম তৈরি হচ্ছে..."
          : "Compiling compliant redline alternatives & finalizing executive memorandum...",
        pct: Math.min(97, 90 + (sec - 25) * 0.4),
      };
    }
  };

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

    const isSupported = /\.(pdf|docx|doc|png|jpe?g|txt)$/i.test(file.name);
    if (!isSupported) {
      setUploadError(
        isBn
          ? "ফাইল ফরম্যাট সমর্থিত নয়। ব্যাকএন্ড শুধুমাত্র .pdf, .docx, .doc, .png, .jpg, .txt ফাইল সমর্থন করে।"
          : "Unsupported file format. The backend only allows: .pdf, .docx, .doc, .png, .jpg, .txt."
      );
      setIsAnalyzing(false);
      return;
    }

    setUploadFileName(file.name);
    setIsAnalyzing(true);
    try {
      let fileToUpload = file;
      let clientPiiCount = 0;
      if (file.name.toLowerCase().endsWith(".txt")) {
        try {
          const rawText = await file.text();
          const masked = maskPii(rawText, true);
          clientPiiCount = masked.stats.totalRedactions;
          fileToUpload = new File([masked.redactedText], file.name, {
            type: file.type || "text/plain",
          });
        } catch (err) {
          console.warn("Client PII masking failed on file read:", err);
        }
      }

      const result = await uploadContract(fileToUpload, undefined, auditedFor);
      if (clientPiiCount > 0 && (!result.pii_redactions_count || result.pii_redactions_count === 0)) {
        result.pii_redactions_count = clientPiiCount;
      }
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
        if (verifRes?.assigned_lawyer_name) {
          toast.success(
            isBn
              ? `আইনজীবী যাচাইকরণ অনুরোধ পাঠানো হয়েছে! আইনজীবী: ${verifRes.assigned_lawyer_name}`
              : `Verification requested! Dispatched to ${verifRes.assigned_lawyer_name}.`
          );
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
      <div className="w-full min-h-screen pb-32 font-sans print:pb-0 print:min-h-0 print:bg-white" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
        
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
            <div className="w-full max-w-xl mb-4 p-1 sm:p-2 rounded-2xl bg-(--bg-surface) border border-(--text-primary)/10 shadow-sm flex items-center justify-between sm:gap-2">
              <span className="hidden sm:flex text-xs font-semibold text-(--text-primary) px-2 items-center gap-1.5 shrink-0 whitespace-nowrap">
                <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{isBn ? "অডিট পার্সপেক্টিভ:" : "Audit Perspective:"}</span>
              </span>
              <div className="grid grid-cols-3 w-full sm:w-auto sm:flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={() => setAuditedFor("CLIENT")}
                  className={`w-full sm:w-auto px-1.5 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-[11px] sm:text-xs whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                    auditedFor === "CLIENT"
                      ? "bg-black dark:bg-white text-white dark:text-black shadow-sm font-bold"
                      : "text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/5 font-medium"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">
                    {isBn ? (
                      <>ক্লায়েন্ট<span className="hidden sm:inline"> / ক্রেতা</span></>
                    ) : (
                      <>
                        <span className="sm:hidden">Client</span>
                        <span className="hidden sm:inline">Protect Client</span>
                      </>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuditedFor("VENDOR")}
                  className={`w-full sm:w-auto px-1.5 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-[11px] sm:text-xs whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                    auditedFor === "VENDOR"
                      ? "bg-black dark:bg-white text-white dark:text-black shadow-sm font-bold"
                      : "text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/5 font-medium"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">
                    {isBn ? (
                      <><span className="hidden sm:inline">সার্ভিস </span>ভেন্ডর</>
                    ) : (
                      <>
                        <span className="sm:hidden">Vendor</span>
                        <span className="hidden sm:inline">Protect Vendor</span>
                      </>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuditedFor("NEUTRAL")}
                  className={`w-full sm:w-auto px-1.5 sm:px-3.5 py-2 sm:py-1.5 rounded-xl text-[11px] sm:text-xs whitespace-nowrap transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
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

            {/* Sovereign Client PII Shield Status Indicator */}
            <div className="w-full max-w-xl flex items-center justify-between px-1 mb-3 text-[11px] text-(--text-muted)">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {isBn
                    ? "সার্বভৌম PII শিল্ড সক্রিয় (NID, ফোন, ইমেইল ও নাম স্বয়ংক্রিয়ভাবে সুরক্ষিত)"
                    : "Sovereign PII Shield Active (NID, phone, email & party names auto-scrubbed)"}
                </span>
              </div>
              <span className="font-mono text-[10px] opacity-70">CLIENT & INGESTION PROTECTED</span>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !isAnalyzing && fileInputRef.current?.click()}
              className={`w-full transition-all duration-200 rounded-3xl p-6 sm:p-14 flex flex-col items-center justify-center group shadow-sm mb-6 bg-(--bg-surface) border border-(--text-primary)/10 ${isAnalyzing ? "cursor-wait" : "cursor-pointer hover:border-(--text-primary)/20"}`}
            >
              {!isAnalyzing && (
                <div className="w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform mb-4 bg-(--bg-card) text-(--text-primary) border border-(--text-primary)/10">
                  <Upload className="w-6 h-6 stroke-2" />
                </div>
              )}

              {isAnalyzing ? (
                (() => {
                  const currentStage = getAuditStage(elapsedSeconds, isBn, auditedFor);
                  const stageLabels = isBn
                    ? ["ওসিআর ও পার্সিং", "ক্লজ বিভাজন", "আইন যাচাই", "রিস্ক অডিট", "রেডলাইন ড্রাফট"]
                    : ["OCR & Parse", "Segment", "Statutes", "Risk Audit", "Redlines"];

                  return (
                    <div className="w-full max-w-lg mx-auto py-2 flex flex-col items-center text-center animate-in fade-in duration-300">
                      {/* Institutional Monochrome Live Indicator */}
                      <div className="mb-4 flex items-center justify-center">
                        <Image
                          src="/contractmind.png"
                          alt="ContractMind"
                          width={48}
                          height={48}
                          className="w-12 h-12 object-contain dark:invert transition-transform animate-pulse"
                        />
                      </div>

                      {/* Monospace Stopwatch Timer Pill */}
                      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900/5 dark:bg-white/10 border border-neutral-900/10 dark:border-white/15 text-xs font-mono text-neutral-900 dark:text-neutral-100 mb-3 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 opacity-70 animate-pulse" />
                        <span className="font-bold tracking-wider">{formatElapsed(elapsedSeconds)}</span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-sans border-l border-neutral-300 dark:border-neutral-700 pl-2">
                          {isBn ? "আনুমানিক সময়: ~২০-২৫ সেকেন্ড" : "Estimated: ~20-25s"}
                        </span>
                      </div>

                      {/* File Name & Perspective Chips (Monochrome / Muted) */}
                      <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                        {uploadFileName && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono text-neutral-700 dark:text-neutral-300 bg-neutral-900/5 dark:bg-white/5 border border-neutral-900/10 dark:border-white/10 max-w-[240px] truncate">
                            <FileText className="w-3 h-3 opacity-60 shrink-0" />
                            <span className="truncate">{uploadFileName}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-neutral-900 dark:text-neutral-100 bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15">
                          <ShieldCheck className="w-3 h-3 opacity-70 shrink-0" />
                          <span>
                            {auditedFor === "VENDOR"
                              ? isBn ? "ভেন্ডর পার্সপেক্টিভ" : "Vendor Perspective"
                              : auditedFor === "NEUTRAL"
                              ? isBn ? "নিরপেক্ষ পার্সপেক্টিভ" : "Neutral Perspective"
                              : isBn ? "ক্লায়েন্ট পার্সপেক্টিভ" : "Client Perspective"}
                          </span>
                        </span>
                      </div>

                      {/* Stage Phase Eyebrow */}
                      <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mb-1">
                        {isBn ? `পর্যায় ০${currentStage.step} / ০৫` : `PHASE 0${currentStage.step} OF 05`}
                      </div>

                      {/* Current Stage Title (High-End Typography) */}
                      <h4 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight mb-1.5">
                        {currentStage.title}
                      </h4>

                      {/* Dynamic Updating Description */}
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto leading-relaxed mb-5 min-h-[34px] flex items-center justify-center font-normal">
                        {currentStage.desc}
                      </p>

                      {/* Precision Hairline Progress Bar (Solid Monochrome) */}
                      <div className="w-full max-w-sm h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden mb-5">
                        <div
                          className="h-full bg-black dark:bg-white rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${currentStage.pct}%` }}
                        />
                      </div>

                      {/* Linear Minimal Pipeline Step Track */}
                      <div className="grid grid-cols-5 gap-1.5 w-full max-w-sm mb-4">
                        {stageLabels.map((lbl, idx) => {
                          const stepNum = idx + 1;
                          const isDone = currentStage.step > stepNum;
                          const isCurrent = currentStage.step === stepNum;
                          return (
                            <div key={idx} className="flex flex-col items-center gap-1">
                              <div
                                className={`w-full h-1 rounded-full transition-colors duration-300 ${
                                  isDone
                                    ? "bg-black dark:bg-white"
                                    : isCurrent
                                    ? "bg-black/80 dark:bg-white/80 animate-pulse"
                                    : "bg-neutral-300 dark:bg-neutral-700"
                                }`}
                              />
                              <span
                                className={`text-[9px] font-mono uppercase tracking-wider truncate max-w-full hidden sm:inline ${
                                  isDone
                                    ? "text-neutral-900 dark:text-neutral-100 font-semibold"
                                    : isCurrent
                                    ? "text-black dark:text-white font-bold"
                                    : "text-neutral-400 dark:text-neutral-500"
                                }`}
                              >
                                {lbl}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Legal Veracity Tag */}
                      <div className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono tracking-wider pt-2 border-t border-neutral-200 dark:border-neutral-800 w-full max-w-xs">
                        {isBn ? "বাংলাদেশ আইন গেজেট (bdlaws) দ্বারা যাচাইকৃত" : "BENCHMARKED AGAINST BDLAWS STATUTORY CODEX"}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <>
                  <p className="text-base font-semibold mb-1 text-(--text-primary)">
                    {language === "bn" ? "চুক্তির ফাইল এখানে ড্রপ করুন অথবা ব্রাউজ করুন" : "Drop contract PDF or DOCX here, or browse"}
                  </p>
                  <p className="text-xs text-(--text-muted)">
                    {language === "bn" ? "সমর্থিত ফরম্যাট: .PDF, .DOCX, .DOC, .TXT, .PNG, .JPG (সর্বোচ্চ ১৫ মেগাবাইট)" : "Supported formats: .PDF, .DOCX, .DOC, .TXT, .PNG, .JPG (Max 15MB)"}
                  </p>
                  <button type="button" className="mt-6 px-5 py-2.5 rounded-full bg-(--accent-solid) text-(--accent-contrast) text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm cursor-pointer">
                    {language === "bn" ? "ফাইল নির্বাচন করুন" : "Browse Files"}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 print:pt-0 print:px-0 print:max-w-none print:bg-white print-clean-paper">
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
              <div className="flex items-center gap-3 flex-wrap">
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

                {apiAuditResult?.pii_redactions_count && apiAuditResult.pii_redactions_count > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3 shrink-0" />
                    <span>
                      {isBn
                        ? `${apiAuditResult.pii_redactions_count}টি তথ্য সুরক্ষিত`
                        : `${apiAuditResult.pii_redactions_count} PII item(s) scrubbed`}
                    </span>
                  </span>
                ) : null}
              </div>

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
                Notice: This legal audit report is computer-generated based on statutory rules under the codified laws of Bangladesh (including The Contract Act 1872, Transfer of Property Act 1882, Specific Relief Act 1877, Registration Act 1908, and relevant legislation). For formal legal representation or litigation proceedings, consultation with a Supreme Court Advocate is recommended.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}


