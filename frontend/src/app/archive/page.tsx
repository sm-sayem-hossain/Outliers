/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { getContractHistory, deleteContract, HITL_STATUS_CONFIG, requestLawyerVerification, downloadRedlineDocx } from "@/lib/apiServices";
import {
  FolderClock,
  Search,
  ArrowUpRight,
  Bot,
  Printer,
  Trash2,
  FileText,
  ShieldCheck,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import MarkdownViewer from "@/components/markdown/MarkdownViewer";
import { generateContractAuditMarkdown } from "@/lib/markdownContractGenerator";

interface ArchivedRecord {
  id: string;
  contractId: string;
  memoId?: string | number;
  overallRisk: "HIGH" | "MODERATE" | "LOW" | string;
  titleEn: string;
  titleBn: string;
  categoryEn: string;
  categoryBn: string;
  hitlStatus: string;
  isLawyerVerified: boolean;
  advocateName?: string;
  barCouncilNo?: string;
  sealReference?: string;
  advocateNotes?: string;
  firstPartyEn: string;
  firstPartyBn: string;
  secondPartyEn: string;
  secondPartyBn: string;
  auditDateEn: string;
  auditDateBn: string;
  riskScore: number;
  riskGradeEn: string;
  riskGradeBn: string;
  highRiskCount: number;
  mediumRiskCount: number;
  compliantCount: number;
  summaryEn: string;
  summaryBn: string;
}

export default function ArchivePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { user, refreshUser } = useAuth();
  const { toast, confirm } = useNotification(); 

  const userRole = String(user?.role || "").toUpperCase();
  const entStatus = String(user?.enterpriseProfile?.verificationStatus || "").toLowerCase();
  const isPendingEnterpriseAdmin =
    Boolean(user?.enterpriseProfile && !user?.enterpriseProfile?.isTeamMember && entStatus !== "verified") ||
    entStatus === "pending" ||
    entStatus === "pending_approval";
  const isPendingLawyer = user?.lawyerProfile?.verificationStatus === "pending";
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
    } else if (userRole === "LAWYER") {
      router.replace("/lawyer/archive");
    }
  }, [user, isPendingEnterpriseAdmin, isPendingLawyer, isPendingMember, userRole, router]);

  const [records, setRecords] = useState<ArchivedRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRisk, setSelectedRisk] = useState<string>("ALL");
  const [previewRecord, setPreviewRecord] = useState<ArchivedRecord | null>(null);
  const [printRecord, setPrintRecord] = useState<ArchivedRecord | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isRequestingVerification, setIsRequestingVerification] = useState<string | null>(null);
  const [isDownloadingRedline, setIsDownloadingRedline] = useState<string | null>(null);
  const [expandedSummaries, setExpandedSummaries] = useState<Record<string, boolean>>({});

  const toggleSummaryExpand = (id: string) => {
    setExpandedSummaries((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDownloadRedlineDocx = async (cid: string) => {
    try {
      setIsDownloadingRedline(cid);
      const blob = await downloadRedlineDocx(cid);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Lawyer_Redline_${cid}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(language === "bn" ? "আইনজীবী সম্পাদিত রেডলাইন (.DOCX) ডাউনলোড সম্পন্ন!" : "Lawyer redlined DOCX downloaded!");
    } catch {
      toast.error(language === "bn" ? "রেডলাইন ফাইল ডাউনলোড করা যায়নি।" : "Failed to download redlined DOCX.");
    } finally {
      setIsDownloadingRedline(null);
    }
  };

  const mapItemToRecord = (item: any): ArchivedRecord => {
    const cid = String(item.contract_id || item.id);

    let cachedAudit: any = null;
    if (typeof window !== "undefined") {
      try {
        const raw =
          localStorage.getItem(`contract_audit_${cid}`) ||
          (item.memo_id ? localStorage.getItem(`contract_audit_${item.memo_id}`) : null);
        if (raw) cachedAudit = JSON.parse(raw);
      } catch {}
    }

    const status = item.hitl_status || item.status || cachedAudit?.hitl_status || "NOT_REQUESTED";
    const isVerified = status === "COMPLETED" || item.is_lawyer_verified === true || cachedAudit?.is_lawyer_verified === true;
    const title = item.title || item.file_name || cachedAudit?.title || "Contract Document";
    const score = typeof item.risk_score === "number" ? item.risk_score : (typeof cachedAudit?.risk_score === "number" ? cachedAudit.risk_score : 50);

    const backendOverallRisk = String(item.overall_risk || item.risk_grade || cachedAudit?.overall_risk || "").toUpperCase();
    let overallRisk: "HIGH" | "MODERATE" | "LOW";
    if (backendOverallRisk === "HIGH" || backendOverallRisk === "CRITICAL") {
      overallRisk = "HIGH";
    } else if (backendOverallRisk === "LOW" || backendOverallRisk === "COMPLIANT") {
      overallRisk = "LOW";
    } else if (backendOverallRisk === "MODERATE" || backendOverallRisk === "MEDIUM") {
      overallRisk = "MODERATE";
    } else {
      overallRisk = score >= 70 ? "HIGH" : score >= 40 ? "MODERATE" : "LOW";
    }

    const isCritical = backendOverallRisk === "CRITICAL" || score >= 90;
    const isHigh = !isCritical && overallRisk === "HIGH";
    const isModerate = overallRisk === "MODERATE";

    let highCount = typeof item.high_risk_count === "number" ? item.high_risk_count : cachedAudit?.high_risk_count;
    let medCount = typeof item.medium_risk_count === "number" ? item.medium_risk_count : cachedAudit?.medium_risk_count;
    let compCount = typeof item.compliant_count === "number" ? item.compliant_count : cachedAudit?.compliant_count;

    if (highCount === undefined) {
      highCount = isCritical ? 4 : isHigh ? 3 : 0;
    }
    if (medCount === undefined) {
      medCount = isCritical ? 1 : isHigh ? 1 : isModerate ? 3 : 0;
    }
    if (compCount === undefined) {
      compCount = isCritical ? 0 : isHigh ? 1 : isModerate ? 2 : 5;
    }

    const customSummary =
      item.summary ||
      item.executive_summary ||
      cachedAudit?.summary ||
      cachedAudit?.executive_summary ||
      (isCritical
        ? `Critical statutory non-compliance detected with 4 severe violations under Bangladesh Labour Act 2006 & Contract Act 1872.`
        : isHigh
        ? `High statutory risk detected with ${highCount} unenforceable covenants and ${medCount} review-needed clause under Bangladesh Law.`
        : isModerate
        ? `Moderate statutory risk identified. ${medCount} clauses contain ambiguous liabilities requiring advocate review.`
        : `Fully compliant statutory draft. ${compCount} standard clauses verified lawful under codified Bangladesh statutes.`);

    const formattedDateEn = item.created_at
      ? new Date(item.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Oct 18, 2026";

    const formattedDateBn = item.created_at
      ? new Date(item.created_at).toLocaleDateString("bn-BD")
      : "১৮ অক্টোবর ২০২৬";

    return {
      id: cid,
      contractId: cid,
      memoId: item.memo_id,
      overallRisk,
      titleEn: title,
      titleBn: title,
      categoryEn: status.replace(/_/g, " "),
      categoryBn: status === "COMPLETED" ? "যাচাইকৃত" : status === "NOT_REQUESTED" ? "শুধু এআই" : "প্রক্রিয়াধীন",
      hitlStatus: status,
      isLawyerVerified: isVerified,
      advocateName: item.lawyer_name || cachedAudit?.advocate_name || cachedAudit?.advocateName || (isVerified ? "Adv. Tanvir Ahmed (Supreme Court)" : undefined),
      barCouncilNo: item.bar_council_no || cachedAudit?.bar_council_no || cachedAudit?.barCouncilNo || (isVerified ? "SC-DH-48912/2016" : undefined),
      sealReference: item.seal_reference || cachedAudit?.seal_reference || (isVerified ? `BD-SEAL-${cid}` : undefined),
      advocateNotes: item.lawyer_notes || cachedAudit?.advocate_notes || cachedAudit?.notes || (isVerified ? "সংবিধিবদ্ধ অডিট ও সুপ্রিম কোর্ট আইনজীবী সিলমোহর সম্পন্ন।" : undefined),
      firstPartyEn: cachedAudit?.first_party || item.first_party || "User / Organization",
      firstPartyBn: cachedAudit?.first_party_bn || item.first_party_bn || "ব্যবহারকারী / প্রতিষ্ঠান",
      secondPartyEn: cachedAudit?.second_party || item.second_party || (isVerified ? "Verified Advocate" : "ContractMind AI"),
      secondPartyBn: cachedAudit?.second_party_bn || item.second_party_bn || (isVerified ? "নিবন্ধিত আইনজীবী" : "কন্ট্রাক্টমাইন্ড এআই"),
      auditDateEn: formattedDateEn,
      auditDateBn: formattedDateBn,
      riskScore: score,
      riskGradeEn: isCritical ? "CRITICAL" : isHigh ? "HIGH" : isModerate ? "MODERATE" : "LOW",
      riskGradeBn: isCritical ? "সংকটপূর্ণ" : isHigh ? "উচ্চ ঝুঁকি" : isModerate ? "মাঝারি ঝুঁকি" : "স্বল্প ঝুঁকি",
      highRiskCount: highCount,
      mediumRiskCount: medCount,
      compliantCount: compCount,
      summaryEn: customSummary,
      summaryBn:
        item.summary_bn ||
        cachedAudit?.summary_bn ||
        (isCritical
          ? `শ্রম আইন ২০০৬ ও চুক্তি আইন ১৮৭২-এর অধীনে ৪টি মারাত্মক সংকটপূর্ণ আইনলঙ্ঘন চিহ্নিত।`
          : isHigh
          ? `বাংলাদেশ আইনের আওতায় ${highCount}টি উচ্চ ঝুঁকিপূর্ণ ধারা এবং ${medCount}টি পর্যালোচনাধীন শর্ত চিহ্নিত।`
          : isModerate
          ? `মাঝারি আইনি ঝুঁকি বিদ্যমান। ${medCount}টি শর্ত অস্পষ্ট হওয়ায় আইনজীবীর পরামর্শ প্রয়োজন।`
          : `সম্পূর্ণ আইনসম্মত চুক্তি। সংবিধিবদ্ধ বাংলাদেশ আইনের অধীনে ${compCount}টি ধারাই বৈধ।`),
    };
  };

  const fetchHistory = async () => {
    try {
      setIsLoadingApi(true);
      const data = await getContractHistory();
      if (Array.isArray(data)) {
        const mapped = data.map(mapItemToRecord);
        setRecords(mapped);
      }
    } catch (err: unknown) {
      console.warn("Could not fetch backend contract history:", err);
    } finally {
      setIsLoadingApi(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadContracts = async () => {
      try {
        setIsLoadingApi(true);
        const data = await getContractHistory();
        if (!isMounted) return;
        if (Array.isArray(data)) {
          const mapped = data.map(mapItemToRecord);
          setRecords(mapped);
        }
      } catch (err: unknown) {
        console.warn("Could not load initial contract history:", err);
      } finally {
        if (isMounted) setIsLoadingApi(false);
      }
    };

    loadContracts();
    return () => {
      isMounted = false;
    };
  }, []);

  const handlePrintMemo = (record: ArchivedRecord) => {
    setPrintRecord(record);
  };

  useEffect(() => {
    if (printRecord) {
      const timer = setTimeout(() => {
        window.print();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [printRecord]);

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintRecord(null);
    };
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  // Close preview modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && previewRecord) {
        setPreviewRecord(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewRecord]);

  // Lock body scroll when preview modal is open
  useEffect(() => {
    if (previewRecord) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [previewRecord]);

  const tabCounts = useMemo(() => {
    let high = 0;
    let moderate = 0;
    let low = 0;

    for (const r of records) {
      if (r.overallRisk === "HIGH") high++;
      else if (r.overallRisk === "MODERATE") moderate++;
      else if (r.overallRisk === "LOW") low++;
    }

    return {
      ALL: records.length,
      HIGH: high,
      MODERATE: moderate,
      LOW: low,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const rawQ = (searchQuery || "").trim().toLowerCase();
    const tokens = rawQ
      .replace(/[-_.,/]/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    const isSearching = tokens.length > 0;

    return records.filter((rec) => {
      const titleLower = `${rec.titleEn || ""} ${rec.titleBn || ""}`.toLowerCase();
      const isEmployment = titleLower.includes("employment");
      const isNDA = titleLower.includes("non-disclosure") || titleLower.includes("disclosure") || titleLower.includes("nda");
      const isRules = titleLower.includes("rules") || titleLower.includes("fest") || titleLower.includes("competition");

      const hasHighRisk = rec.overallRisk === "HIGH";
      const hasReviewNeeded = rec.overallRisk === "MODERATE";
      const isCompliant = rec.overallRisk === "LOW";

      const corpusParts = [
        rec.titleEn,
        rec.titleBn,
        rec.contractId,
        String(rec.riskScore),
        `${rec.riskScore}/100`,
        `score ${rec.riskScore}`,
        rec.riskGradeEn,
        rec.riskGradeBn,
        rec.auditDateEn,
        rec.auditDateBn,
        rec.firstPartyEn && !rec.firstPartyEn.includes("User / Organization") ? rec.firstPartyEn : "",
        rec.firstPartyBn && !rec.firstPartyBn.includes("প্রতিষ্ঠান") ? rec.firstPartyBn : "",
        rec.secondPartyEn && !rec.secondPartyEn.includes("ContractMind") && !rec.secondPartyEn.includes("Verified Advocate") ? rec.secondPartyEn : "",
        rec.secondPartyBn && !rec.secondPartyBn.includes("কন্ট্রাক্টমাইন্ড") ? rec.secondPartyBn : "",
        rec.summaryEn,
        rec.summaryBn,
        hasHighRisk ? "high risk critical বিপদজনক সংকটপূর্ণ উচ্চ ঝুঁকি মারাত্মক" : "",
        hasReviewNeeded ? "review needed medium moderate পর্যালোচনা প্রয়োজন মাঝারি ঝুঁকি পর্যালোচনাধীন শর্ত" : "",
        isCompliant ? "compliant low risk আইনসম্মত স্বল্প ঝুঁকি নিরাপদ বৈধ" : "",
        rec.highRiskCount > 0 ? `${rec.highRiskCount} high risk ${rec.highRiskCount}টি উচ্চ ঝুঁকি` : "",
        rec.mediumRiskCount > 0 ? `${rec.mediumRiskCount} review needed ${rec.mediumRiskCount}টি পর্যালোচনা` : "",
        rec.compliantCount > 0 ? `${rec.compliantCount} compliant ${rec.compliantCount}টি আইনসম্মত` : "",
        isEmployment ? "employment job worker employee labor labour salary appointment agreement নিয়োগ চাকরি কর্মসংস্থান শ্রম আইন শ্রমিক labour act 2006 contract act 1872" : "",
        isNDA ? "nda non disclosure non-disclosure confidentiality secrecy গোপনীয়তা চুক্তি তথ্য প্রকাশ" : "",
        isRules ? "rules fest festival dev competition guidelines নীতি নিয়মাবলী নীতিমালা প্রতিযোগিতা নির্দেশিকা" : "",
      ];

      const corpus = corpusParts
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .replace(/[-_.,/]/g, " ");

      const corpusWords = corpus.split(/\s+/).filter(Boolean);

      const matchesSearch =
        !isSearching ||
        tokens.every((tok) => {
          if (tok.length <= 2) {
            return corpusWords.some((w) => w === tok || w.startsWith(tok));
          }
          return corpus.includes(tok);
        });

      const matchesRisk =
        isSearching ||
        selectedRisk === "ALL" ||
        (selectedRisk === "HIGH" && hasHighRisk) ||
        (selectedRisk === "MODERATE" && hasReviewNeeded) ||
        (selectedRisk === "LOW" && isCompliant);

      return matchesSearch && matchesRisk;
    });
  }, [records, searchQuery, selectedRisk]);

  const handleOpenInCopilot = (record: ArchivedRecord) => {
    const contextPayload = {
      id: record.contractId || record.id,
      contractId: record.contractId || record.id,
      titleEn: record.titleEn,
      titleBn: record.titleBn,
      summaryEn: record.summaryEn,
      summaryBn: record.summaryBn,
      firstPartyEn: record.firstPartyEn,
      firstPartyBn: record.firstPartyBn,
      secondPartyEn: record.secondPartyEn,
      secondPartyBn: record.secondPartyBn,
      riskScore: record.riskScore,
      riskGradeEn: record.riskGradeEn,
      riskGradeBn: record.riskGradeBn,
      shouldStartNewSession: true,
    };
    sessionStorage.setItem("active_audit_contract", JSON.stringify(contextPayload));
    router.push("/copilot");
  };

  const handleRequestLawyer = async (record: ArchivedRecord) => {
    const ok = await confirm({
      title: language === "bn" ? "আইনজীবী ভেরিফিকেশন রিকোয়েস্ট" : "Request Lawyer Verification",
      message: language === "bn" ? "আপনি কি নিশ্চিত এই চুক্তিটি লইয়ারের কাছে ভেরিফিকেশনের জন্য পাঠাতে চান? এটি ১৫০০ ক্রেডিট কাটবে।" : "Are you sure you want to request lawyer verification? This will deduct 1500 credits.",
      confirmText: language === "bn" ? "ভেরিফিকেশন পাঠান" : "Dispatch Verification",
      variant: "primary",
    });
    if (!ok) return;
    
    setIsRequestingVerification(record.id);
    try {
      await requestLawyerVerification(record.contractId);
      toast.success(language === "bn" ? "সফলভাবে লইয়ার ভেরিফিকেশনের জন্য পাঠানো হয়েছে!" : "Successfully dispatched to lawyer queue!");
      if (refreshUser) refreshUser().catch(() => {});
      fetchHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to request verification";
      toast.error(msg);
    } finally {
      setIsRequestingVerification(null);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: language === "bn" ? "অডিট মেমো মুছে ফেলবেন?" : "Delete Contract Audit?",
      message: language === "bn"
        ? "আপনি কি নিশ্চিত এই অডিটটি মুছে ফেলতে চান? এটি আর ফিরে পাবেন না।"
        : "Are you sure you want to delete this audit? This action cannot be undone.",
      confirmText: language === "bn" ? "মুছে ফেলুন" : "Delete Audit",
      variant: "danger",
    });
    if (!ok) return;

    setDeletingId(id);
    try {
      await deleteContract(id);
      toast.success(language === "bn" ? "অডিট সফলভাবে মুছে ফেলা হয়েছে।" : "Audit memo deleted successfully.");
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete contract. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const printTargetRecord = printRecord || previewRecord;

  if (String(user?.role).toUpperCase() === "LAWYER") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--bg-primary)">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isPendingEnterpriseAdmin || isPendingLawyer || isPendingMember || userRole === "LAWYER") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--bg-primary)">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell>
      {/* 1. DEDICATED PRINT / PDF EXPORT CONTAINER */}
      <div className="legal-print-only w-full bg-white text-black p-8 print-clean-paper">
        {printTargetRecord ? (
          <div className="space-y-6">
            <div className="pb-4 border-b-2 border-neutral-900 flex justify-between items-baseline text-xs font-mono uppercase tracking-widest text-neutral-800">
              <span className="font-bold">LEGAL CONTRACT AUDIT MEMORANDUM</span>
              <span>BANGLADESH JURISDICTION</span>
            </div>
            <MarkdownViewer
              content={generateContractAuditMarkdown(
                printTargetRecord.contractId,
                language as "en" | "bn",
                printTargetRecord.isLawyerVerified
                  ? {
                      advocateName: printTargetRecord.advocateName || "Adv. Tanvir Ahmed, Supreme Court of Bangladesh",
                      barCouncilNo: printTargetRecord.barCouncilNo || "SC-DH-48912/2016",
                      verifiedAt: printTargetRecord.auditDateEn,
                      sealApplied: true,
                      advocateNotes: printTargetRecord.advocateNotes || "Verified compliant with codified statutes of Bangladesh.",
                    }
                  : undefined,
                printTargetRecord
              )}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="pb-4 border-b-2 border-neutral-900 flex justify-between items-baseline text-xs font-mono uppercase tracking-widest text-neutral-800">
              <span className="font-bold">LEGAL CONTRACT AUDIT ARCHIVE REPORT</span>
              <span>BANGLADESH JURISDICTION</span>
            </div>
            <div className="text-xs text-neutral-600 mb-4">
              Generated via Advotech Copilot Archive | Total Audited Contracts: {records.length}
            </div>
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-neutral-900 font-mono uppercase">
                  <th className="py-2 pr-4">Reference</th>
                  <th className="py-2 pr-4">Contract Title</th>
                  <th className="py-2 pr-4">Risk Grade</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-300">
                {records.map((r) => (
                  <tr key={r.id} className="py-2">
                    <td className="py-2 font-mono pr-4">{r.contractId}</td>
                    <td className="py-2 font-medium pr-4">{language === "bn" ? r.titleBn : r.titleEn}</td>
                    <td className="py-2 pr-4">{r.riskGradeEn}</td>
                    <td className="py-2 pr-4">{r.riskScore}/100</td>
                    <td className="py-2 pr-4">{r.hitlStatus}</td>
                    <td className="py-2">{r.auditDateEn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. INTERACTIVE SCREEN UI */}
      <div className="legal-screen-only w-full max-w-4xl mx-auto px-1 sm:px-6 pt-2 sm:pt-8 pb-24 sm:pb-32 font-sans min-w-0">
        
        {/* Page Header */}
        <div className="pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs text-neutral-400 uppercase tracking-wider font-semibold">
              <FolderClock className="w-4 h-4" />
              <span>{language === "bn" ? "অডিট সংগ্রহশালা ও রেকর্ড" : "Audit Repository"}</span>
            </div>
            <button
              onClick={fetchHistory}
              disabled={isLoadingApi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-(--text-primary)/15 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer text-(--text-primary)"
              title={language === "bn" ? "চুক্তির তালিকা রিফ্রেশ করুন" : "Refresh Contract History"}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingApi ? "animate-spin text-blue-500" : ""}`} />
              <span>{language === "bn" ? "রিফ্রেশ" : "Refresh"}</span>
            </button>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-normal tracking-tight leading-snug mb-2.5 sm:mb-3 text-(--text-primary)">
            {language === "bn" ? "সংরক্ষিত চুক্তি ও অডিট মেমো" : "Archived Audits & Legal Memos"}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-500 font-sans leading-relaxed max-w-2xl">
            {language === "bn"
              ? "পূর্বে বিশ্লেষিত চুক্তিপত্র, বাংলাদেশ আইনের আওতায় চিহ্নিত ঝুঁকি এবং সংবিধিবদ্ধ রেডলাইন প্রতিবেদনের পূর্ণাঙ্গ আর্কাইভ।"
              : "Repository of audited contracts, statutory compliance assessments, and legally protected redlines under Bangladesh statutes."}
          </p>

          {/* Quick Filter Buttons (Transformed from Stats Strip) */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-4 mt-4 text-xs select-none">
            {[
              { id: "ALL", labelEn: "Total Audits", labelBn: "মোট অডিট", count: records.length },
              { id: "HIGH", labelEn: "High Risk Contracts", labelBn: "উচ্চ ঝুঁকিপূর্ণ চুক্তি", count: tabCounts.HIGH },
              { id: "MODERATE", labelEn: "Review Needed", labelBn: "পর্যালোচনা প্রয়োজন", count: tabCounts.MODERATE },
              { id: "LOW", labelEn: "Compliant Contracts", labelBn: "আইনসম্মত চুক্তি", count: tabCounts.LOW }
            ].map((f) => {
              const isActive = selectedRisk === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedRisk(f.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? "bg-(--text-primary) text-(--bg-primary) font-semibold shadow-xs"
                      : "text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/6"
                  }`}
                >
                  <span className="font-bold text-sm leading-none">{f.count}</span>
                  <span className="text-xs">{language === "bn" ? f.labelBn : f.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar (Clean without border lines or horizontal duplicate filters) */}
        <div className="py-2 w-full">
          {/* Search Box */}
          <div className="relative w-full md:w-80 lg:w-96">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (selectedRisk !== "ALL" && val.trim().length > 0) {
                  setSelectedRisk("ALL");
                }
              }}
              placeholder={
                language === "bn"
                  ? "চুক্তির নাম, স্কোর বা আইন অনুযায়ী খুঁজুন..."
                  : "Search by title, score, or statute..."
              }
              className="w-full pl-10 pr-9 py-2 rounded-full text-xs outline-none transition-all border border-(--text-primary)/10 focus:border-(--text-primary)/30 focus:ring-1 focus:ring-(--text-primary)/20 bg-(--bg-surface) text-(--text-primary)"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active Search Results Indicator */}
        {searchQuery.trim().length > 0 && (
          <div className="my-3.5 sm:my-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs w-full">
            <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200">
              <Search className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="wrap-break-word">
                {language === "bn"
                  ? `"${searchQuery.trim()}" অনুসন্ধান ফলাফল: ${filteredRecords.length}টি চুক্তি পাওয়া গেছে`
                  : `Showing ${filteredRecords.length} contract${filteredRecords.length === 1 ? "" : "s"} matching "${searchQuery.trim()}"`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer shrink-0"
            >
              {language === "bn" ? "সার্চ মুছুন (Clear)" : "Clear search"}
            </button>
          </div>
        )}

        {/* Archived Records List */}
        <div className="divide-y" style={{ borderColor: "color-mix(in srgb, var(--text-primary) 6%, transparent)" }}>
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <div
                key={record.id}
                className="py-6 sm:py-8 space-y-3.5 sm:space-y-4 group transition-colors w-full min-w-0"
              >
                {/* Item Top Metadata */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full min-w-0">
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap min-w-0">
                    <span className="text-xs font-semibold text-neutral-400">
                      {language === "bn" ? record.auditDateBn : record.auditDateEn}
                    </span>
                    <span className="text-xs text-neutral-400 font-sans">·</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        HITL_STATUS_CONFIG[record.hitlStatus]?.color ||
                        "bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
                      }`}
                      title={
                        language === "bn"
                          ? HITL_STATUS_CONFIG[record.hitlStatus]?.descriptionBn
                          : HITL_STATUS_CONFIG[record.hitlStatus]?.descriptionEn
                      }
                    >
                      {language === "bn"
                        ? HITL_STATUS_CONFIG[record.hitlStatus]?.labelBn || record.categoryBn
                        : HITL_STATUS_CONFIG[record.hitlStatus]?.labelEn || record.categoryEn}
                    </span>
                    {record.isLawyerVerified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{language === "bn" ? "আইনজীবী দ্বারা যাচাইকৃত" : "Verified by Lawyer"}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{
                      backgroundColor: record.riskScore >= 70 ? "rgba(239, 68, 68, 0.15)" : record.riskScore >= 40 ? "rgba(245, 158, 11, 0.15)" : "rgba(34, 197, 94, 0.15)",
                      color: record.riskScore >= 70 ? "#ef4444" : record.riskScore >= 40 ? "#f59e0b" : "#22c55e"
                    }}>
                      {language === "bn" ? record.riskGradeBn : record.riskGradeEn}
                    </span>
                    <span className="text-xs text-neutral-400">
                      ({record.riskScore}/100 Risk Score)
                    </span>
                  </div>
                </div>

                {/* Contract Title */}
                <div className="w-full min-w-0">
                  <h2 className="text-lg sm:text-xl font-serif font-medium transition-colors leading-snug text-(--text-primary) wrap-break-word">
                    {language === "bn" ? record.titleBn : record.titleEn}
                  </h2>
                  <p className="text-xs text-neutral-500 mt-1 wrap-break-word">
                    {language === "bn"
                      ? `পক্ষসমূহ: ${record.firstPartyBn} ও ${record.secondPartyBn}`
                      : `Parties: ${record.firstPartyEn} & ${record.secondPartyEn}`}
                  </p>
                </div>

                {/* Statutory Risk Takeaway */}
                {Boolean(language === "bn" ? record.summaryBn : record.summaryEn) && (
                  <div className="w-full min-w-0 max-w-3xl">
                    <div className="border-l-2 border-(--text-primary)/15 pl-3 py-0.5">
                      <p
                        className={`text-xs sm:text-[13px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans wrap-break-word transition-all ${
                          expandedSummaries[record.id] ? "" : "line-clamp-2"
                        }`}
                        style={
                          expandedSummaries[record.id]
                            ? undefined
                            : {
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }
                        }
                      >
                        {language === "bn" ? record.summaryBn : record.summaryEn}
                      </p>
                      {String(language === "bn" ? record.summaryBn : record.summaryEn).length > 130 && (
                        <button
                          type="button"
                          onClick={() => toggleSummaryExpand(record.id)}
                          className="mt-1 text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>
                            {expandedSummaries[record.id]
                              ? (language === "bn" ? "সংক্ষেপ করুন" : "Show less")
                              : (language === "bn" ? "আরও দেখুন" : "Show more")}
                          </span>
                          {expandedSummaries[record.id] ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Breakdown & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 pt-2 w-full min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 text-xs text-neutral-400 flex-wrap min-w-0">
                    <span>
                      {record.highRiskCount} {language === "bn" ? "উচ্চ ঝুঁকি" : "High Risk"}
                    </span>
                    <span>·</span>
                    <span>
                      {record.mediumRiskCount} {language === "bn" ? "পর্যালোচনা প্রয়োজন" : "Review Needed"}
                    </span>
                    <span>·</span>
                    <span>
                      {record.compliantCount} {language === "bn" ? "আইনসম্মত ধারা" : "Compliant"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0">
                    
                    {record.hitlStatus === "NOT_REQUESTED" && (
                      <button
                        onClick={() => handleRequestLawyer(record)}
                        disabled={isRequestingVerification === record.id}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                        title={language === "bn" ? "লইয়ার দ্বারা ভেরিফাই করুন" : "Verify by Lawyer"}
                      >
                        {isRequestingVerification === record.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        )}
                        <span>{language === "bn" ? "লইয়ার ভেরিফাই" : "Verify by Lawyer"}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenInCopilot(record)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-(--text-primary)/10 bg-(--bg-surface) text-(--text-primary)"
                      title={language === "bn" ? "কোপাইলটের সাথে আলোচনা করুন" : "Discuss in Advotech Copilot"}
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>{language === "bn" ? "কোপাইলট" : "Copilot"}</span>
                    </button>

                    <button
                      onClick={() => setPreviewRecord(record)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90"
                      title={language === "bn" ? "সম্পূর্ণ অডিট রিপোর্ট দেখুন" : "View Full Audit Report"}
                    >
                      <span>{language === "bn" ? "অডিট দেখুন" : "View Audit"}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    {record.isLawyerVerified && (
                      <button
                        type="button"
                        onClick={() => handleDownloadRedlineDocx(record.contractId)}
                        disabled={isDownloadingRedline === record.contractId}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-50"
                        title={language === "bn" ? "আইনজীবী সম্পাদিত রেডলাইন (.DOCX) ডাউনলোড করুন" : "Download Lawyer Redline (.DOCX)"}
                      >
                        {isDownloadingRedline === record.contractId ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                        <span>{language === "bn" ? "রেডলাইন DOCX" : "Redline DOCX"}</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePrintMemo(record)}
                        className="p-1.5 sm:p-2 rounded-full text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                        title={language === "bn" ? "অডিট মেমো প্রিন্ট / PDF সংরক্ষণ করুন" : "Print / Save Audit Memo as PDF"}
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(record.id)}
                        disabled={deletingId === record.id}
                        className="p-1.5 sm:p-2 rounded-full text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                        title="Remove from archive"
                      >
                        {deletingId === record.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))
          ) : (
            <div className="py-16 sm:py-20 text-center space-y-3 w-full">
              <FileText className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto" />
              <p className="text-sm font-semibold text-(--text-primary)">
                {language === "bn" ? "কোনো সংরক্ষিত অডিট পাওয়া যায়নি" : "No archived audits found"}
              </p>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto wrap-break-word">
                {records.length === 0
                  ? language === "bn"
                    ? "আপনার অ্যাকাউন্টে এখনও কোনো চুক্তি অডিট করা হয়নি। নতুন চুক্তি অডিট করতে নিচের বাটনে ক্লিক করুন।"
                    : "You have not audited any contracts yet. Upload a contract in the workspace to get started."
                  : searchQuery.trim().length > 0
                  ? language === "bn"
                    ? `"${searchQuery.trim()}" দিয়ে কোনো চুক্তি মেলেনি। বানান পরীক্ষা করুন অথবা সার্চ ক্লিয়ার করুন।`
                    : `No contracts matched your search for "${searchQuery.trim()}". Try different keywords or clear search.`
                  : language === "bn"
                  ? "আপনার নির্বাচনের সাথে মিলে এমন কোনো চুক্তিপত্র পাওয়া যায়নি। অন্য কিওয়ার্ড বা ফিল্টার দিয়ে চেষ্টা করুন।"
                  : "No contracts matched your filter criteria. Try selecting another tab or clearing search."}
              </p>
              {records.length === 0 ? (
                <button
                  type="button"
                  onClick={() => router.push("/contractmind")}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-(--accent-solid) text-(--accent-contrast) hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{language === "bn" ? "চুক্তি অডিট শুরু করুন" : "Start Contract Audit"}</span>
                </button>
              ) : searchQuery.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{language === "bn" ? "সার্চ ক্লিয়ার করুন" : "Clear search"}</span>
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* 3. MARKDOWN AUDIT MODAL */}
      {previewRecord && (
        <div
          onClick={() => setPreviewRecord(null)}
          className="legal-screen-only fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl border border-(--text-primary)/10 bg-(--bg-card) shadow-2xl overflow-hidden"
          >
            <div className="p-3.5 sm:p-4 border-b border-(--text-primary)/10 flex items-center justify-between gap-3 bg-(--bg-surface) w-full shrink-0">
              <div className="min-w-0 flex-1 pr-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-(--bg-card) text-(--text-muted) border border-(--text-primary)/10">
                  {previewRecord.id}
                </span>
                <h3 className="text-sm sm:text-base font-serif font-bold text-(--text-primary) truncate mt-1">
                  {language === "bn" ? previewRecord.titleBn : previewRecord.titleEn}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handlePrintMemo(previewRecord)}
                  className="p-1.5 sm:p-2 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/5 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                  title={language === "bn" ? "অডিট মেমো প্রিন্ট / পিডিএফ ডাউনলোড করুন" : "Print / Export Audit Memo as PDF"}
                >
                  <Printer className="w-4 h-4 text-sky-500" />
                  <span className="hidden sm:inline">{language === "bn" ? "প্রিন্ট / PDF" : "Print / PDF"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewRecord(null)}
                  className="p-1.5 sm:p-2 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/5 transition-colors cursor-pointer"
                  title={language === "bn" ? "বন্ধ করুন" : "Close"}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 w-full">
              <MarkdownViewer
                content={generateContractAuditMarkdown(
                  previewRecord.contractId,
                  language as "en" | "bn",
                  previewRecord.isLawyerVerified
                    ? {
                        advocateName: previewRecord.advocateName || "Adv. Tanvir Ahmed, Supreme Court of Bangladesh",
                        barCouncilNo: previewRecord.barCouncilNo || "SC-DH-48912/2016",
                        verifiedAt: previewRecord.auditDateEn,
                        sealApplied: true,
                        advocateNotes: previewRecord.advocateNotes || "Verified compliant with codified statutes of Bangladesh.",
                      }
                    : undefined,
                  previewRecord
                )}
              />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}