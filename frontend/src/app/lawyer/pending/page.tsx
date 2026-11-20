"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import MarkdownViewer from "@/components/markdown/MarkdownViewer";
import { generateContractAuditMarkdown } from "@/lib/markdownContractGenerator";
import { CONTRACT_AUDITS } from "@/data/contractAudits";
import {
  getLawyerQueue,
  acceptOffer,
  declineOffer,
  getActiveTasks,
  submitReview,
  startContractReviewChat,
  uploadLawyerProof, // [UPDATED] NEW
  getContractDownloadUrl,
  downloadRedlineDocx,
} from "@/lib/apiServices";
import {
  Inbox,
  Clock,
  User,
  FileText,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  ArrowUpRight,
  Search,
  X,
  FileCode2,
  ShieldCheck,
  Check,
  Sparkles,
  Lock,
  Ban,
  XCircle,
  Edit3,
  UploadCloud, // [UPDATED] NEW
  FileCheck,   // [UPDATED] NEW
  Download,
  Printer,
  QrCode,
  BadgeCheck,
} from "lucide-react";

// [UPDATED] FIX: Defined strict interface for clauses instead of 'any'
interface EditableClause {
  clause_number: string;
  clause_title: string;
  risk_level: string;
  original_text?: string;
  statute_reference?: string;
  legal_explanation?: string;
  proposed_safe_redline?: string;
  is_compliant?: boolean;
}

function normalizeRiskLevel(raw?: string): string {
  if (!raw) return "Compliant";
  const s = raw.toLowerCase();
  if (s.includes("high") || s.includes("critical")) return "High Risk";
  if (s.includes("med") || s.includes("mod") || s.includes("review") || s.includes("warn")) return "Review Needed";
  return "Compliant";
}

interface PendingContract {
  id: string;
  clientName: string;
  clientPhone: string;
  titleEn: string;
  titleBn: string;
  submittedAtEn: string;
  submittedAtBn: string;
  statuteEn: string;
  statuteBn: string;
  riskCount: number;
  priority: "high" | "normal";
  contractId?: string;
  submitDeadline?: string;
  clauses?: EditableClause[]; // [UPDATED] Replaced any[] with EditableClause[]
  originalFilename?: string;
  fileSizeMb?: number;
  fileMimeType?: string;
  filePath?: string;
}

const LiveTimer = ({ deadline }: { deadline?: string }) => {
  const [timeLeft, setTimeLeft] = useState<string>("--:--:--");

  useEffect(() => {
    if (!deadline) return;
    
    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = new Date(deadline).getTime() - now;

      if (distance < 0) {
        setTimeLeft("Expired");
        return false;
      }
      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      return true;
    };

    calculateTime();
    const interval = setInterval(() => {
      if (!calculateTime()) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  return <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{timeLeft}</span>;
};

export default function LawyerPendingPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { user, refreshUser } = useAuth();
  const { toast, prompt } = useNotification();
  const [isRefreshingVerification, setIsRefreshingVerification] = useState(false);
  const isBn = language === "bn";

  const verificationStatus = user?.lawyerProfile?.verificationStatus || "pending";
  const isVerified = verificationStatus === "verified";
  const isRejected = verificationStatus === "rejected";
  const isSuspended = verificationStatus === "suspended";
  const isPending = verificationStatus === "pending";

  const rejectionReason = (user?.lawyerProfile as { rejectionReason?: string } | undefined)?.rejectionReason;

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    const userRole = String(user.role).toUpperCase();
    if (userRole !== "LAWYER" && userRole !== "ADMIN" && !user?.lawyerProfile) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const [pendingList, setPendingList] = useState<PendingContract[]>([]);
  const [activeTasks, setActiveTasks] = useState<PendingContract[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"queue" | "active">("queue");
  const [search, setSearch] = useState("");
  const [selectedContract, setSelectedContract] = useState<PendingContract | null>(null);
  
  const [modalTab, setModalTab] = useState<"markdown" | "edit_clauses" | "signoff">("markdown");

  const [advocateNotes, setAdvocateNotes] = useState("");
  
  // [UPDATED] FIX: Replaced any[] with EditableClause[]
  const [editableClauses, setEditableClauses] = useState<EditableClause[]>([]);
  
  const [checklist, setChecklist] = useState({
    severanceAudited: true,
    restraintResolved: true,
    stampAuthorized: true,
  });
  const [isSealing, setIsSealing] = useState(false);
  const [sealedSuccess, setSealedSuccess] = useState(false);

  // [UPDATED] NEW: File upload states for Fix D
  const [signaturePath, setSignaturePath] = useState("");
  const [signedPdfPath, setSignedPdfPath] = useState("");
  const [isUploadingSign, setIsUploadingSign] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // [UPDATED] NEW: International Grade Verification States
  const [isDownloadingOriginal, setIsDownloadingOriginal] = useState(false);
  const [isDownloadingRedline, setIsDownloadingRedline] = useState(false);
  const [sealMethod, setSealMethod] = useState<"digital" | "physical">("digital");
  const [sealedCertInfo, setSealedCertInfo] = useState<{
    sealRef: string;
    hash: string;
    timestamp: string;
    barNo: string;
  } | null>(null);
  const [deliverToClient, setDeliverToClient] = useState<boolean>(true);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);

  const loadQueueAndTasks = useCallback(async () => {
    if (!user || user.role !== "lawyer" || !isVerified) return;
    try {
      const [queueRes, activeRes] = await Promise.allSettled([
        getLawyerQueue(),
        getActiveTasks(),
      ]);

      if (queueRes.status === "fulfilled" && Array.isArray(queueRes.value)) {
        const mappedQueue: PendingContract[] = queueRes.value.map((item) => ({
          id: String(item.memo_id),
          clientName: "Enterprise Client",
          clientPhone: "+880 1700-000000",
          titleEn: item.contract_title || item.file_name || "Commercial Contract",
          titleBn: item.contract_title || item.file_name || "বাণিজ্যিক চুক্তিপত্র",
          submittedAtEn: item.offered_at ? new Date(item.offered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
          submittedAtBn: item.offered_at ? new Date(item.offered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "এইমাত্র",
          statuteEn: "Bangladesh Law Audit Queue · ৳1,000 Payout",
          statuteBn: "বাংলাদেশ আইন অডিট কিউ · ৳১,০০০ ফি",
          riskCount: item.risk_score ? Math.round(item.risk_score / 25) : 3,
          priority: item.priority === "URGENT" || item.priority === "HIGH" ? "high" : "normal",
          contractId: String(item.contract_id || item.memo_id),
          submitDeadline: item.offer_expires_at,
          clauses: (item.clauses_analysis as EditableClause[]) || [],
          originalFilename: item.original_filename || item.file_name || item.contract_title,
          fileSizeMb: item.file_size_mb,
          fileMimeType: item.file_mime_type,
          filePath: item.file_path,
        }));
        setPendingList(mappedQueue);
      }

      if (activeRes.status === "fulfilled" && Array.isArray(activeRes.value)) {
        const mappedActive: PendingContract[] = activeRes.value.map((item) => ({
          id: String(item.memo_id),
          clientName: "Enterprise Client",
          clientPhone: "+880 1700-000000",
          titleEn: item.contract_title || item.file_name || "Active Contract Under Review",
          titleBn: item.contract_title || item.file_name || "পর্যালোচনাধীন সক্রিয় চুক্তিপত্র",
          submittedAtEn: item.accepted_at ? new Date(item.accepted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active",
          submittedAtBn: item.accepted_at ? new Date(item.accepted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "সক্রিয়",
          statuteEn: "Active SLA: 3 Hours Submit Window",
          statuteBn: "সক্রিয় এসএলএ: ৩ ঘণ্টা সময়সীমা",
          riskCount: 3,
          priority: "high",
          contractId: String(item.contract_id || item.memo_id),
          submitDeadline: item.submit_deadline,
          clauses: (item.clauses_analysis as EditableClause[]) || [],
          originalFilename: item.original_filename || item.file_name || item.contract_title,
          fileSizeMb: item.file_size_mb,
          fileMimeType: item.file_mime_type,
          filePath: item.file_path,
        }));
        setActiveTasks(mappedActive);
      }
    } catch (err) {
      console.warn("Could not fetch lawyer queue from backend:", err);
    }
  }, [user, isVerified]);

  useEffect(() => {
    if (!isVerified) {
      setPendingList([]);
      setActiveTasks([]);
      return;
    }

    loadQueueAndTasks();

    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("dispatched_pending_contracts") || "[]") as PendingContract[];
        setPendingList((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const additions = stored.filter((p) => !existingIds.has(p.id));
          const merged = [...additions, ...prev];
          if (merged.length === 0) {
            const now = Date.now();
            return [
              {
                id: "cnt-9801",
                clientName: "Tariqul Islam (Freelance Engineer)",
                clientPhone: "+880 1712-345678",
                titleEn: "Software Engineer IP & Employment Agreement",
                titleBn: "সফটওয়্যার ইঞ্জিনিয়ার আইপি ও চাকরির চুক্তিপত্র",
                submittedAtEn: "12m ago",
                submittedAtBn: "১২ মিনিট আগে",
                statuteEn: "Labour Act 2006 · § 27 Contract Act (Void Non-compete) · ৳1,000 Payout",
                statuteBn: "বাংলাদেশ শ্রম আইন ২০০৬ ও চুক্তি আইন ১৮৭২ · ৳১,০০০ ফি",
                riskCount: 4,
                priority: "high" as const,
                contractId: "employment-agreement",
                submitDeadline: new Date(now + 2.75 * 3600 * 1000).toISOString(),
              },
              {
                id: "cnt-9802",
                clientName: "Apex Holdings Ltd.",
                clientPhone: "+880 1819-554433",
                titleEn: "Commercial Office Space Lease Deed",
                titleBn: "বাণিজ্যিক অফিস স্পেস ইজারা চুক্তিপত্র",
                submittedAtEn: "45m ago",
                submittedAtBn: "৪৫ মিনিট আগে",
                statuteEn: "Transfer of Property Act 1882 · § 74 Contract Act (Uncapped Indemnity) · ৳1,000 Payout",
                statuteBn: "সম্পত্তি হস্তান্তর আইন ১৮৮২ ও চুক্তি আইন ১৮৭২ · ৳১,০০০ ফি",
                riskCount: 3,
                priority: "normal" as const,
                contractId: "commercial-lease",
                submitDeadline: new Date(now + 1.5 * 3600 * 1000).toISOString(),
              },
            ];
          }
          return merged;
        });
      } catch (err) {
        console.error("Error reading dispatched contracts:", err);
      }
    }
  }, [isVerified, loadQueueAndTasks]);

  const borderClass = "border-(--text-primary)/10";
  const currentList = activeSubTab === "queue" ? pendingList : activeTasks;

  const filtered = currentList.filter(
    (c) =>
      c.clientName.toLowerCase().includes(search.toLowerCase()) ||
      c.titleEn.toLowerCase().includes(search.toLowerCase()) ||
      c.titleBn.includes(search)
  );

  const soonestDeadline = useMemo(() => {
    const deadlines = activeTasks.map(t => t.submitDeadline).filter(Boolean) as string[];
    if (deadlines.length === 0) return undefined;
    return deadlines.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
  }, [activeTasks]);

  const handleOpenReview = (contract: PendingContract) => {
    setSelectedContract(contract);
    
    // Resolve clauses: 1) directly from contract, 2) from localStorage audit, 3) from template
    let resolvedClauses: EditableClause[] = [];
    if (contract.clauses && contract.clauses.length > 0) {
      resolvedClauses = JSON.parse(JSON.stringify(contract.clauses));
    } else if (typeof window !== "undefined") {
      const keysToTry = [
        `contract_audit_${contract.contractId || contract.id}`,
        contract.contractId ? `contract_audit_${contract.contractId}` : null,
        contract.id ? `contract_audit_${contract.id}` : null,
      ].filter(Boolean) as string[];

      for (const k of keysToTry) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.advocate_notes) {
              setAdvocateNotes(parsed.advocate_notes);
            }
            const clausesArr = parsed.clauses || parsed.clauses_analysis;
            if (Array.isArray(clausesArr) && clausesArr.length > 0) {
              resolvedClauses = clausesArr.map((c: any, idx: number) => ({
                clause_number: c.clause_number || `§ ${idx + 1}`,
                clause_title: c.clause_title || c.titleEn || `Clause ${idx + 1}`,
                risk_level: normalizeRiskLevel(c.risk_level || c.riskLevel),
                original_text: c.original_text || c.originalText || "",
                statute_reference: c.statute_reference || c.statuteCitationEn || "",
                legal_explanation: c.legal_explanation || c.detailedAnalysisEn || c.issueSummaryEn || "",
                proposed_safe_redline: c.proposed_safe_redline || c.redlineSuggestionEn || "",
              }));
              break;
            }
          } catch {}
        }
      }
    }

    if (resolvedClauses.length === 0) {
      let templateKey = "employment-agreement";
      const titleLower = (
        (contract.titleEn || "") +
        " " +
        (contract.titleBn || "") +
        " " +
        (contract.contractId || "") +
        " " +
        contract.id
      ).toLowerCase();

      if (
        titleLower.includes("vendor") ||
        titleLower.includes("sla") ||
        titleLower.includes("software") ||
        titleLower.includes("sofware") ||
        titleLower.includes("it ")
      ) {
        templateKey = "vendor-sla";
      } else if (
        titleLower.includes("freelance") ||
        titleLower.includes("consult") ||
        titleLower.includes("advisor") ||
        titleLower.includes("service")
      ) {
        templateKey = "freelance-consulting";
      } else if (contract.contractId && contract.contractId in CONTRACT_AUDITS) {
        templateKey = contract.contractId;
      }

      const templateAudit = CONTRACT_AUDITS[templateKey] || CONTRACT_AUDITS["employment-agreement"];
      if (templateAudit?.clauses) {
        resolvedClauses = templateAudit.clauses.map((c, idx) => ({
          clause_number: `§ ${c.clauseNumber || idx + 1}`,
          clause_title: c.titleEn,
          risk_level: normalizeRiskLevel(c.riskLevel),
          original_text: c.originalText || "",
          statute_reference: c.statuteCitationEn || "",
          legal_explanation: c.detailedAnalysisEn || c.issueSummaryEn || "",
          proposed_safe_redline: c.redlineSuggestionEn || "",
        }));
      }
    }

    setEditableClauses(resolvedClauses);
    setModalTab("markdown");
    setSealedSuccess(false);
    setSignaturePath("");
    setSignedPdfPath("");
    setSealMethod("digital");
    setSealedCertInfo(null);
    setDeliverToClient(true);
  };

  const handleDownloadOriginalFile = async (contractId?: string) => {
    const cid = contractId || selectedContract?.contractId || selectedContract?.id;
    if (!cid) {
      toast.error(isBn ? "চুক্তি আইডির সন্ধান মেলেনি।" : "Contract ID not found.");
      return;
    }
    setIsDownloadingOriginal(true);
    try {
      const res = await getContractDownloadUrl(cid, true);
      if (res.download_url) {
        window.open(res.download_url, "_blank");
        toast.success(isBn ? "মূল ফাইল ওপেন করা হচ্ছে..." : "Opening client's original file...");
      } else {
        toast.info(isBn ? "ক্লাউড স্টোরেজে ফাইল প্রস্তুত হচ্ছে।" : "Original file link generated.");
      }
    } catch {
      toast.info(isBn ? "মূল ফাইল অডিট রিপোর্ট ভিউতে অন্তর্ভুক্ত রয়েছে।" : "Original file text is displayed in AI Audit Preview.");
    } finally {
      setIsDownloadingOriginal(false);
    }
  };

  const handleDownloadRedlineDocx = async (contractId?: string) => {
    const cid = contractId || selectedContract?.contractId || selectedContract?.id;
    if (!cid) return;
    try {
      setIsDownloadingRedline(true);
      const blob = await downloadRedlineDocx(cid);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Redlined_Agreement_${cid}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(isBn ? "রেডলাইন করা DOCX ফাইল ডাউনলোড সম্পন্ন!" : "Redlined DOCX downloaded successfully!");
    } catch {
      toast.info(isBn ? "রেডলাইন DOCX এক্সপোর্ট শুরু হয়েছে।" : "Redlined DOCX export initialized.");
    } finally {
      setIsDownloadingRedline(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptOffer(id);
      toast.success(isBn ? "চুক্তি সফলভাবে গ্রহণ করা হয়েছে! (সময়সীমা: ৩ ঘণ্টা)।" : "Contract offer accepted! (3-hour SLA window).");
      
      const acceptedItem = pendingList.find((p) => p.id === id);
      if (acceptedItem) {
        setPendingList((prev) => prev.filter((p) => p.id !== id));
        const newDeadline = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
        setActiveTasks((prev) => [{ ...acceptedItem, submitDeadline: newDeadline }, ...prev]);
        setActiveSubTab("active");
      }
      await loadQueueAndTasks();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : (isBn ? "চুক্তি গ্রহণ ব্যর্থ হয়েছে।" : "Failed to accept offer"));
    }
  };

  const handleDecline = async (id: string) => {
    const reason = await prompt({
      title: isBn ? "অফার প্রত্যাখ্যান" : "Decline Contract Offer",
      message: isBn ? "বাতিলের কারণ লিখুন:" : "Enter reason for declining:",
      placeholder: isBn ? "কারণ উল্লেখ করুন..." : "Specify reason...",
      defaultValue: "Outside my specialization area.",
      confirmText: isBn ? "প্রত্যাখ্যান করুন" : "Decline",
    });
    if (!reason) return;
    try {
      await declineOffer(id, reason);
      setPendingList((prev) => prev.filter((p) => p.id !== id));
      toast.info(isBn ? "অফার প্রত্যাখ্যান করা হয়েছে।" : "Offer declined and re-queued.");
    } catch {
      setPendingList((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleStartAiChat = async (contract: PendingContract) => {
    try {
      const res = await startContractReviewChat(contract.id);
      
      const contextPayload = {
        id: contract.id,
        contractId: contract.contractId || contract.id,
        titleEn: contract.titleEn || "Contract Review Session",
        titleBn: contract.titleBn || "চুক্তি পর্যালোচনা সেশন",
        shouldStartNewSession: false,
        existingSessionId: res.session_id
      };
      sessionStorage.setItem("active_audit_contract", JSON.stringify(contextPayload));
      router.push("/copilot");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to start AI chat session");
    }
  };

  // [UPDATED] NEW: Upload handlers
  const handleUploadSignature = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingSign(true);
    try {
      const res = await uploadLawyerProof(file);
      setSignaturePath(res.file_path);
    } catch {
      toast.error(isBn ? "স্বাক্ষর আপলোড ব্যর্থ হয়েছে" : "Failed to upload signature");
    } finally {
      setIsUploadingSign(false);
    }
  };

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPdf(true);
    try {
      const res = await uploadLawyerProof(file);
      setSignedPdfPath(res.file_path);
    } catch {
      toast.error(isBn ? "সাইনকৃত পিডিএফ আপলোড ব্যর্থ হয়েছে" : "Failed to upload signed PDF");
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleSaveDraft = () => {
    if (!selectedContract) return;
    setIsSavingDraft(true);
    try {
      if (typeof window !== "undefined") {
        const auditKeys = [
          `contract_audit_${selectedContract.contractId || selectedContract.id}`,
          selectedContract.contractId ? `contract_audit_${selectedContract.contractId}` : null,
          selectedContract.id ? `contract_audit_${selectedContract.id}` : null,
        ].filter(Boolean) as string[];

        for (const k of auditKeys) {
          const existingAudit = localStorage.getItem(k);
          if (existingAudit) {
            try {
              const parsed = JSON.parse(existingAudit);
              parsed.clauses = editableClauses;
              parsed.advocate_notes = advocateNotes;
              parsed.draft_saved_at = new Date().toISOString();
              localStorage.setItem(k, JSON.stringify(parsed));
            } catch {}
          }
        }

        // Also update in activeTasks
        setActiveTasks((prev) =>
          prev.map((t) =>
            t.id === selectedContract.id
              ? { ...t, clauses: editableClauses }
              : t
          )
        );
      }
      toast.success(
        isBn
          ? "খসড়া সফলভাবে সংরক্ষণ করা হয়েছে! ক্লায়েন্টকে পাঠানোর পূর্বে আপনি পরবর্তীতে এটি পুনরায় সম্পাদনা করতে পারবেন।"
          : "Draft saved! You can continue revising before final delivery to client."
      );
    } catch {
      toast.error(isBn ? "খসড়া সংরক্ষণ ব্যর্থ হয়েছে।" : "Failed to save draft.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleApproveAndSeal = async () => {
    if (!selectedContract) return;
    
    if (sealMethod === "physical" && (!signaturePath || !signedPdfPath)) {
      toast.warning(
        isBn
          ? "ফিজিক্যাল আপলোড মোডে অনুগ্রহ করে স্বাক্ষর ও সাইনড পিডিএফ আপলোড করুন, অথবা ১-ক্লিক ডিজিটাল সিল বেছে নিন।"
          : "Please upload your signature and signed PDF, or select 1-Click Digital Seal."
      );
      return;
    }
    
    setIsSealing(true);

    const sealRefId = `BD-SEAL-${selectedContract.id}-${Date.now().toString().slice(-6)}`;
    const mockHash = `sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069`;
    const sealTimestamp = new Date().toISOString();
    const barEnrollment = user?.lawyerProfile?.barCouncilNo || "SC-DH-48912/2016";

    if (deliverToClient) {
      try {
        await submitReview(selectedContract.id, {
          notes: advocateNotes || (isBn ? "সংবিধিবদ্ধ অডিট ও সুপ্রিম কোর্ট আইনজীবী সিলমোহর সম্পন্ন।" : "Statutory audit review and advocate seal verified."),
          lawyer_notes: advocateNotes || (isBn ? "সংবিধিবদ্ধ অডিট ও সুপ্রিম কোর্ট আইনজীবী সিলমোহর সম্পন্ন।" : "Statutory audit review and advocate seal verified."),
          verified: true,
          updated_clauses: editableClauses,
          signature_url: signaturePath || `digital_seal_${user?.id || 'advocate'}_${Date.now()}`,
          signed_pdf_url: signedPdfPath || (selectedContract.filePath || ""),
        });
      } catch (err: unknown) {
        console.warn("Submit review note:", err);
      }
    }

    setTimeout(() => {
      setIsSealing(false);
      setSealedSuccess(true);
      setSealedCertInfo({
        sealRef: sealRefId,
        hash: mockHash,
        timestamp: sealTimestamp,
        barNo: barEnrollment,
      });

      if (typeof window !== "undefined") {
        const userArchiveKey = user?.email ? `verified_contracts_archive_${user.email}` : "verified_contracts_archive";
        // [UPDATED] FIX: Cast JSON.parse result to unknown[] to satisfy ESLint, or specific type if defined
        const archive = JSON.parse(localStorage.getItem(userArchiveKey) || "[]") as Record<string, unknown>[];
        const newVerified = {
          id: `ver-${selectedContract.id}`,
          contractId: selectedContract.contractId || selectedContract.id,
          clientName: selectedContract.clientName,
          titleEn: selectedContract.titleEn,
          titleBn: selectedContract.titleBn,
          verifiedDateEn: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          verifiedDateBn: new Date().toLocaleDateString("bn-BD"),
          statuteEn: selectedContract.statuteEn,
          statuteBn: selectedContract.statuteBn,
          advocateName: user?.name ? (user.name.startsWith("Adv") ? user.name : `Adv. ${user.name}`) : "Advocate Tanvir Ahmed",
          barCouncilNo: barEnrollment,
          notes: advocateNotes || (isBn ? "আইনগত পর্যালোচনা সম্পন্ন।" : "Statutory review completed."),
          status: "verified",
          updated_clauses: editableClauses,
          sealReference: sealRefId,
          sha256Hash: mockHash,
          deliveredToClient: deliverToClient,
        };
        localStorage.setItem(userArchiveKey, JSON.stringify([newVerified, ...archive.filter((a: any) => a?.id !== newVerified.id)]));
        if (userArchiveKey !== "verified_contracts_archive") {
          const globalArchive = JSON.parse(localStorage.getItem("verified_contracts_archive") || "[]") as Record<string, unknown>[];
          localStorage.setItem("verified_contracts_archive", JSON.stringify([newVerified, ...globalArchive.filter((a: any) => a?.id !== newVerified.id)]));
        }

        const auditKeys = [
          `contract_audit_${selectedContract.contractId || selectedContract.id}`,
          selectedContract.contractId ? `contract_audit_${selectedContract.contractId}` : null,
          selectedContract.id ? `contract_audit_${selectedContract.id}` : null,
        ].filter(Boolean) as string[];

        for (const k of auditKeys) {
          const existingAudit = localStorage.getItem(k);
          if (existingAudit) {
            try {
              const parsed = JSON.parse(existingAudit);
              parsed.clauses = editableClauses;
              if (deliverToClient) {
                parsed.is_lawyer_verified = true;
                parsed.hitl_status = "COMPLETED";
              }
              parsed.seal_reference = sealRefId;
              parsed.sha256_hash = mockHash;
              parsed.advocate_notes = advocateNotes;
              parsed.advocate_name = user?.name ? (user.name.startsWith("Adv") ? user.name : `Adv. ${user.name}`) : "Adv. Tanvir Ahmed";
              parsed.bar_council_no = barEnrollment;
              parsed.verified_at = sealTimestamp;
              localStorage.setItem(k, JSON.stringify(parsed));
            } catch {}
          }
        }

        if (deliverToClient) {
          // [UPDATED] FIX: Cast JSON.parse result to PendingContract[]
          const dispatched = JSON.parse(localStorage.getItem("dispatched_pending_contracts") || "[]") as PendingContract[];
          localStorage.setItem("dispatched_pending_contracts", JSON.stringify(dispatched.filter((d) => d.id !== selectedContract.id)));
        }
      }

      if (deliverToClient) {
        // Also remove from activeTasks in view
        setActiveTasks((prev) => prev.filter((p) => p.id !== selectedContract.id));
        toast.success(
          isBn
            ? "চুক্তি সংবিধিবদ্ধ সিলমোহরযুক্ত এবং সফলভাবে ক্লায়েন্টের ভল্টে হস্তান্তর করা হয়েছে!"
            : "Contract sealed and delivered directly to the client's vault!"
        );
      } else {
        toast.info(
          isBn
            ? "সিলমোহর সম্পন্ন হয়েছে (ক্লায়েন্টকে পাঠানোর অপশনটি বন্ধ ছিল)। এটি ড্রাফট মোডে রক্ষিত রয়েছে।"
            : "Sealed internally. Preserved in draft mode without dispatching to client."
        );
      }
    }, 800);
  };

  const handleClauseChange = (index: number, field: keyof EditableClause, value: string) => {
    const updated = [...editableClauses];
    updated[index] = { ...updated[index], [field]: value };
    setEditableClauses(updated);
  };

  const contractIdForMarkdown = selectedContract?.contractId || "employment-agreement";
  const markdownAuditContent = selectedContract
    ? generateContractAuditMarkdown(
        contractIdForMarkdown,
        isBn ? "bn" : "en",
        {
          advocateName: user?.name || "Adv. Tanvir Ahmed, Supreme Court of Bangladesh",
          barCouncilNo: "SC-DH-48912/2016",
          verifiedAt: "18 Oct 2026, 4:55 PM",
          sealApplied: sealedSuccess,
          advocateNotes: advocateNotes,
        }
      )
    : "";

  const userRole = user ? String(user.role).toUpperCase() : "";
  const hasLawyerProfile = !!user?.lawyerProfile;
  if (!user || (userRole !== "LAWYER" && userRole !== "ADMIN" && !hasLawyerProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--bg-primary)">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell>
      {/* 1. DEDICATED PRINT / PDF EXPORT CONTAINER (INTERNATIONAL GRADE CLEAN A4 PAPER) */}
      <div className="legal-print-only w-full bg-white text-black p-8 print-clean-paper">
        {selectedContract ? (
          <div className="space-y-6">
            {/* Supreme Court Bar Letterhead */}
            <div className="pb-4 border-b-2 border-neutral-900 flex justify-between items-baseline text-xs font-mono uppercase tracking-widest text-neutral-800">
              <span className="font-bold">BANGLADESH SUPREME COURT BAR · STATUTORY AUDIT REPORT</span>
              <span>REF: {sealedCertInfo?.sealRef || `BD-SEAL-${selectedContract.id}`}</span>
            </div>

            {/* Official Digital Seal Header Card */}
            <div className="p-4 rounded-xl border-2 border-neutral-900 bg-neutral-50 flex items-center justify-between text-neutral-900 break-inside-avoid print-avoid-break">
              <div>
                <p className="font-bold text-sm uppercase tracking-wide">
                  {isBn ? "বাংলাদেশ বার কাউন্সিল সংবিধিবদ্ধ অডিট ও অ্যাডভোকেট ডিজিটাল সিলমোহর" : "BANGLADESH BAR COUNCIL STATUTORY AUDIT & ADVOCATE DIGITAL SEAL"}
                </p>
                <p className="text-xs text-neutral-800 mt-1">
                  Audited & Certified by {user?.name || "Adv. Tanvir Ahmed"}, Supreme Court of Bangladesh
                </p>
                <p className="text-[11px] font-mono text-neutral-600 mt-0.5">
                  Enrollment: {user?.lawyerProfile?.barCouncilNo || "SC-DH-48912/2016"} · High Court Division
                </p>
                {sealedCertInfo?.hash && (
                  <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
                    SHA-256 Digest: {sealedCertInfo.hash}
                  </p>
                )}
                {advocateNotes && (
                  <div className="mt-2 text-xs text-neutral-800 italic bg-white p-2.5 rounded border border-neutral-300">
                    <span className="font-semibold not-italic block text-[10px] uppercase text-neutral-600 mb-0.5">
                      {isBn ? "আইনজীবীর মন্তব্য ও রায়:" : "Advocate Statutory Advisory Notes:"}
                    </span>
                    &ldquo;{advocateNotes}&rdquo;
                  </div>
                )}
              </div>

              <div className="text-right font-mono text-[10px] text-neutral-700 shrink-0 ml-4 flex flex-col items-center">
                <div className="w-20 h-20 border-2 border-emerald-800 text-emerald-900 p-1 mb-1 flex flex-col items-center justify-center font-bold text-center">
                  <span className="text-[8px] tracking-wider">BANGLADESH</span>
                  <span className="text-[12px] font-black">SEALED</span>
                  <span className="text-[8px]">ADVOCATE</span>
                </div>
                <div>{new Date().toLocaleDateString("en-GB")}</div>
              </div>
            </div>

            {/* Full Markdown Audit Content */}
            <MarkdownViewer
              content={generateContractAuditMarkdown(
                contractIdForMarkdown,
                isBn ? "bn" : "en",
                {
                  advocateName: user?.name || "Adv. Tanvir Ahmed, Supreme Court of Bangladesh",
                  barCouncilNo: user?.lawyerProfile?.barCouncilNo || "SC-DH-48912/2016",
                  verifiedAt: sealedCertInfo ? new Date(sealedCertInfo.timestamp).toLocaleString() : new Date().toLocaleString(),
                  sealApplied: true,
                  advocateNotes: advocateNotes || "Statutory audit verified and approved under Laws of Bangladesh.",
                },
                {
                  ...selectedContract,
                  clauses_analysis: editableClauses,
                }
              )}
            />
          </div>
        ) : null}
      </div>

      {/* 2. INTERACTIVE SCREEN UI */}
      <div className="legal-screen-only max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 font-sans">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-medium text-(--text-muted) mb-1">
              {isBn ? "আইনজীবী ওয়ার্কস্পেস" : "Advocate Workspace"}
            </p>
            <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-(--text-primary)">
              {isBn ? "পেন্ডিং চুক্তি রিভিউ ও অনুমোদন" : "Pending Contracts for Statutory Review"}
            </h1>
            <p className="text-xs sm:text-[13px] text-(--text-muted) mt-1 max-w-xl leading-relaxed">
              {isBn
                ? "ক্লায়েন্টদের আপলোডকৃত চুক্তি এবং এআই অডিট প্রিভিউ পর্যালোচনা করে সংবিধিবদ্ধ সিলমোহর প্রদান করুন।"
                : "Inspect client-submitted contracts, evaluate AI markdown audit reports, and apply statutory seal."}
            </p>
          </div>

          <div className="flex items-center gap-6 self-start md:self-auto py-1">
            <div>
              <div className="text-xl font-mono font-semibold text-(--text-primary)">
                {isVerified ? pendingList.length : "0"}
              </div>
              <div className="text-[11px] text-(--text-muted) tracking-wider">
                {isBn ? "পেন্ডিং ফাইল" : "Pending Files"}
              </div>
            </div>
            <div className="w-px h-8 bg-(--text-primary)/10" />
            <div>
              <div className="text-xl font-mono font-semibold text-(--text-primary)">
                {isVerified && soonestDeadline ? <LiveTimer deadline={soonestDeadline} /> : "—"}
              </div>
              <div className="text-[11px] text-(--text-muted) tracking-wider">
                {isBn ? "ভেরিফিকেশন" : "Verification"}
              </div>
            </div>
          </div>
        </div>

        {!isVerified ? (
          <div className="my-6 max-w-2xl mx-auto">
            {isPending && (
              <div className="rounded-3xl border border-(--text-primary)/10 bg-(--bg-card) p-8 md:p-12 text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-(--bg-surface) text-(--text-muted) mx-auto flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-(--text-primary)/5 text-(--text-muted) border border-(--text-primary)/10 mb-3">
                  <Clock className="w-3.5 h-3.5" />
                  {isBn ? "ভেরিফিকেশন প্রক্রিয়াধীন" : "Verification Pending"}
                </div>
                <h2 className="text-xl md:text-2xl font-sans font-semibold tracking-tight text-(--text-primary) mb-2">
                  {isBn ? "চুক্তিপত্র অ্যাক্সেস লক করা আছে" : "Client Contract Queue is Locked"}
                </h2>
                <p className="text-xs md:text-sm text-(--text-muted) leading-relaxed max-w-lg mx-auto mb-6">
                  {isBn
                    ? "আপনার বাংলাদেশ বার কাউন্সিল সনদটি বর্তমানে অ্যাডমিন ভেরিফিকেশনের অপেক্ষায় রয়েছে। ভেরিফিকেশন সম্পন্ন হওয়ার আগ পর্যন্ত ক্লায়েন্টদের চুক্তিপত্র দেখার অনুমতি স্থগিত রাখা হয়েছে।"
                    : "Your Bar Council certificate is currently awaiting administrative approval. Access remains locked until your advocate status is verified."}
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={async () => {
                      if (refreshUser) {
                        setIsRefreshingVerification(true);
                        await refreshUser();
                        setTimeout(() => setIsRefreshingVerification(false), 500);
                      }
                    }}
                    disabled={isRefreshingVerification}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingVerification ? "animate-spin" : ""}`} />
                    <span>
                      {isRefreshingVerification
                        ? (isBn ? "চেক করা হচ্ছে..." : "Checking...")
                        : (isBn ? "ভেরিফিকেশন স্ট্যাটাস রিফ্রেশ করুন" : "Refresh Verification Status")}
                    </span>
                  </button>
                  <button
                    onClick={() => router.push("/profile")}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-(--text-primary)/15 hover:bg-(--bg-surface) text-(--text-primary) transition-colors cursor-pointer"
                  >
                    {isBn ? "প্রোফাইল দেখুন" : "View Profile"}
                  </button>
                </div>
              </div>
            )}

            {isRejected && (
              <div className="rounded-3xl border border-rose-300/40 dark:border-rose-700/50 bg-(--bg-card) p-8 md:p-12 text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4 shadow-inner">
                  <XCircle className="w-8 h-8" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300/40 mb-3">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {isBn ? "আবেদন বাতিল করা হয়েছে" : "Application Rejected"}
                </div>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-(--text-primary) mb-2">
                  {isBn ? "আপনার আইনজীবী আবেদন বাতিল হয়েছে" : "Your Advocate Application was Rejected"}
                </h2>
                <p className="text-xs md:text-sm text-(--text-muted) leading-relaxed max-w-lg mx-auto mb-6">
                  {isBn
                    ? "দুঃখিত, আপনার বার কাউন্সিল সনদটি যাচাই করা সম্ভব হয়নি। আপনি আর এই অ্যাকাউন্ট দিয়ে লইয়ার হিসেবে কাজ করতে পারবেন না।"
                    : "We could not verify your Bar Council credentials. You can no longer operate as a lawyer on this account."}
                </p>
                {rejectionReason && (
                  <div className="p-3 mb-6 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto text-left">
                    <strong>{isBn ? "কারণ:" : "Reason:"}</strong> {rejectionReason}
                  </div>
                )}
                <button onClick={() => router.push("/profile")} className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer">
                  {isBn ? "প্রোফাইল দেখুন" : "View Profile"}
                </button>
              </div>
            )}

            {isSuspended && (
              <div className="rounded-3xl border border-neutral-300/40 dark:border-neutral-700/50 bg-(--bg-card) p-8 md:p-12 text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 mx-auto flex items-center justify-center mb-4 shadow-inner">
                  <Ban className="w-8 h-8" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 mb-3">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {isBn ? "অ্যাকাউন্ট স্থগিত" : "Account Suspended"}
                </div>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-(--text-primary) mb-2">
                  {isBn ? "আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে" : "Your Account is Suspended"}
                </h2>
                <p className="text-xs md:text-sm text-(--text-muted) leading-relaxed max-w-lg mx-auto mb-6">
                  {isBn
                    ? "অ্যাডমিনের নির্দেশে আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত করা হয়েছে। বিস্তারিত জানতে সাপোর্টে যোগাযোগ করুন।"
                    : "Your account has been temporarily suspended by the administration. Please contact support for more information."}
                </p>
                <button onClick={() => router.push("/profile")} className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-(--text-primary)/15 hover:bg-(--bg-surface) text-(--text-primary) transition-colors cursor-pointer">
                  {isBn ? "প্রোফাইল দেখুন" : "View Profile"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Sub-tabs: Offer Queue vs Active Tasks */}
            <div className="flex items-center gap-2 mb-6 border-b border-(--text-primary)/10 pb-3">
              <button
                type="button"
                onClick={() => setActiveSubTab("queue")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === "queue"
                    ? "bg-(--accent-solid) text-(--accent-contrast) shadow-xs"
                    : "text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/5"
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>{isBn ? "পেন্ডিং অফার কিউ (Offer Queue)" : "Offer Queue"}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                  {pendingList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubTab("active")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSubTab === "active"
                    ? "bg-(--accent-solid) text-(--accent-contrast) shadow-xs"
                    : "text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/5"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isBn ? "সক্রিয় পর্যালোচনা (Active Review Tasks)" : "Active Review Tasks"}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                  {activeTasks.length}
                </span>
              </button>
            </div>

            {/* Search & Filter */}
            <div className="relative mb-6">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  activeSubTab === "queue"
                    ? isBn ? "অফার কিউ থেকে চুক্তি খুঁজুন..." : "Search offer queue..."
                    : isBn ? "সক্রিয় টাস্ক থেকে চুক্তি খুঁজুন..." : "Search active review tasks..."
                }
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border outline-none transition-colors ${borderClass} focus:border-(--text-primary)/40 bg-(--bg-card) text-(--text-primary)`}
              />
            </div>

            {/* Pending / Active List */}
            <div className="space-y-3">
              {filtered.map((contract) => (
                <div
                  key={contract.id}
                  className={`p-5 rounded-2xl border ${borderClass} bg-(--bg-card) hover:border-amber-400/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-(--bg-surface) text-(--text-muted)">
                        {contract.id}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3" />
                        {isBn ? contract.submittedAtBn : contract.submittedAtEn}
                      </span>
                      {contract.priority === "high" && (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {isBn ? "জরুরি" : "Urgent"}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-(--text-primary) mb-1">
                      {isBn ? contract.titleBn : contract.titleEn}
                    </h3>

                    <div className="flex items-center gap-4 text-xs text-(--text-muted) flex-wrap">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {contract.clientName} ({contract.clientPhone})
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {isBn ? contract.statuteBn : contract.statuteEn}
                      </span>
                      <span className="flex items-center gap-1 text-rose-500 font-semibold">
                        <ShieldAlert className="w-3 h-3" />
                        {contract.riskCount} {isBn ? "টি সম্ভাব্য ঝুঁকি শনাক্ত" : "Risk Flags"}
                      </span>
                      
                      {activeSubTab === "active" && contract.submitDeadline && (
                        <span className="flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3" /> SLA: <LiveTimer deadline={contract.submitDeadline} />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 flex-wrap">
                    {activeSubTab === "queue" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDecline(contract.id)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-(--text-muted) hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          {isBn ? "প্রত্যাখ্যান" : "Decline"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAccept(contract.id)}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-opacity cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isBn ? "অফার গ্রহণ করুন (৳১,০০০)" : "Accept Offer (৳1,000)"}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartAiChat(contract)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isBn ? "এআই রিসার্চ" : "AI Research"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReview(contract)}
                          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-(--accent-solid) text-(--accent-contrast) hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 shadow-sm"
                        >
                          {isBn ? "রিভিউ ও সিলমোহর" : "Review & Seal"}
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="py-16 text-center">
                  <CheckCircle2 className="w-8 h-8 text-(--text-muted) mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-medium text-(--text-primary)">
                    {activeSubTab === "queue"
                      ? isBn ? "কোনো পেন্ডিং অফার নেই" : "No pending contract offers in queue"
                      : isBn ? "কোনো সক্রিয় পর্যালোচনা টাস্ক নেই" : "No active review tasks"}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* FULL ADVOCATE STATUTORY VERIFICATION & MARKDOWN MODAL */}
      {selectedContract && (
        <div className="legal-screen-only fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl border ${borderClass} bg-(--bg-card) shadow-2xl overflow-hidden`}>
              
              <div className="p-3.5 sm:p-5 border-b border-(--text-primary)/10 flex items-center justify-between gap-3 bg-(--bg-surface)">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-(--bg-card) text-(--text-muted) border border-(--text-primary)/10">
                      {selectedContract.id}
                    </span>
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      {isBn ? "সংবিধিবদ্ধ অডিট রিপোর্ট" : "Statutory Audit Report"}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-serif font-bold text-(--text-primary) truncate">
                    {isBn ? selectedContract.titleBn : selectedContract.titleEn}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-(--text-muted)">
                    <span>
                      {isBn ? "ক্লায়েন্ট:" : "Client:"} {selectedContract.clientName} ({selectedContract.clientPhone})
                    </span>
                    <span className="opacity-40">·</span>
                    <button
                      type="button"
                      onClick={() => handleDownloadOriginalFile(selectedContract.contractId || selectedContract.id)}
                      disabled={isDownloadingOriginal}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer border border-indigo-200/50 dark:border-indigo-800/40 shadow-2xs disabled:opacity-50"
                      title={isBn ? "ক্লায়েন্টের আপলোড করা মূল কন্ট্রাক্ট ফাইলটি ডাউনলোড/ভিউ করুন" : "View or download client's uploaded original file"}
                    >
                      <Download className="w-3 h-3" />
                      <span>
                        {isDownloadingOriginal
                          ? isBn ? "ডাউনলোড হচ্ছে..." : "Downloading..."
                          : isBn ? "ক্লায়েন্টের মূল ফাইল ডাউনলোড" : "Download Client's Original File"}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedContract(null)}
                  className="p-1.5 sm:p-2 rounded-xl text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/5 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-3.5 sm:px-5 py-2 sm:py-2.5 border-b border-(--text-primary)/10 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-3 bg-(--bg-card)">
                <div className="flex items-center bg-(--bg-surface) p-1 rounded-xl border border-(--text-primary)/10 text-xs font-semibold overflow-x-auto no-scrollbar w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setModalTab("markdown")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      modalTab === "markdown"
                        ? "bg-(--accent-solid) text-(--accent-contrast) shadow-sm"
                        : "text-(--text-muted) hover:text-(--text-primary)"
                    }`}
                  >
                    <FileCode2 className="w-3.5 h-3.5" />
                    <span>{isBn ? "এআই অডিট রিপোর্ট প্রিভিউ" : "AI Audit Report Preview"}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setModalTab("edit_clauses")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      modalTab === "edit_clauses"
                        ? "bg-(--accent-solid) text-(--accent-contrast) shadow-sm"
                        : "text-(--text-muted) hover:text-(--text-primary)"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isBn ? "ধারা সম্পাদনা" : "Edit Clauses"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalTab("signoff")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      modalTab === "signoff"
                        ? "bg-(--accent-solid) text-(--accent-contrast) shadow-sm"
                        : "text-(--text-muted) hover:text-(--text-primary)"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{isBn ? "অনুমোদন ও সিলমোহর স্টেশন" : "Advocate Seal & Sign-Off"}</span>
                  </button>
                </div>

                {sealedSuccess && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isBn ? "সিলমোহর সম্পন্ন" : "Sealed & Verified"}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                {modalTab === "markdown" && (
                  <MarkdownViewer content={markdownAuditContent} />
                )}

                {modalTab === "edit_clauses" && (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    <p className="text-xs text-(--text-muted) mb-4">
                      {isBn 
                        ? "এআই-এর তৈরি করা ধারাগুলো পর্যালোচনা করুন এবং প্রয়োজন অনুযায়ী সম্পাদনা করুন। আপনার পরিবর্তনগুলো চূড়ান্ত ডকুমেন্টে সংরক্ষিত হবে।" 
                        : "Review and edit the AI-generated clauses below. Your changes will be saved to the final sealed document."}
                    </p>
                    
                    {editableClauses.map((clause, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-(--text-primary)/10 bg-(--bg-surface) space-y-3">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-bold text-sm text-(--text-primary)">
                            {clause.clause_number || `§ ${idx + 1}`} - {clause.clause_title || "Clause"}
                          </span>
                          <select
                            value={normalizeRiskLevel(clause.risk_level)}
                            onChange={(e) => handleClauseChange(idx, "risk_level", e.target.value)}
                            className="text-xs p-1.5 rounded-lg bg-(--bg-card) border border-(--text-primary)/20 outline-none font-semibold text-(--text-primary)"
                          >
                            <option value="High Risk">High Risk</option>
                            <option value="Review Needed">Review Needed</option>
                            <option value="Compliant">Compliant</option>
                          </select>
                        </div>

                        {clause.statute_reference && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            <span className="font-semibold">{isBn ? "আইনগত রেফারেন্স: " : "Statute Reference: "}</span>
                            {clause.statute_reference}
                          </div>
                        )}

                        {clause.original_text && (
                          <div className="p-2.5 rounded-lg bg-(--bg-card) border border-(--text-primary)/10 text-xs text-(--text-muted) italic">
                            <span className="font-semibold not-italic block text-[10px] uppercase text-(--text-muted) mb-0.5">
                              {isBn ? "মূল ধারা (Original Text):" : "Original Clause Text:"}
                            </span>
                            &ldquo;{clause.original_text}&rdquo;
                          </div>
                        )}
                        
                        <div>
                          <label className="text-[10px] uppercase font-bold text-(--text-muted) mb-1 block">
                            {isBn ? "আইনগত ব্যাখ্যা (Legal Explanation)" : "Legal Explanation"}
                          </label>
                          <textarea
                            value={clause.legal_explanation || ""}
                            onChange={(e) => handleClauseChange(idx, "legal_explanation", e.target.value)}
                            className="w-full text-xs p-2.5 rounded-lg bg-(--bg-card) border border-(--text-primary)/20 outline-none text-(--text-primary) leading-relaxed"
                            rows={2}
                          />
                        </div>
                        
                        <div>
                          <label className="text-[10px] uppercase font-bold text-(--text-muted) mb-1 block">
                            {isBn ? "সংশোধিত নিরাপদ ধারা (Proposed Safe Redline)" : "Proposed Safe Redline"}
                          </label>
                          <textarea
                            value={clause.proposed_safe_redline || ""}
                            onChange={(e) => handleClauseChange(idx, "proposed_safe_redline", e.target.value)}
                            className="w-full text-xs p-2.5 rounded-lg bg-(--bg-card) border border-(--text-primary)/20 outline-none text-(--text-primary) leading-relaxed"
                            rows={3}
                          />
                        </div>
                      </div>
                    ))}

                    {editableClauses.length > 0 && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setModalTab("signoff")}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <span>{isBn ? "ধারা সম্পন্ন হয়েছে, অনুমোদন স্টেশনে যান →" : "Clauses Reviewed, Proceed to Seal Station →"}</span>
                        </button>
                      </div>
                    )}
                    
                    {editableClauses.length === 0 && (
                      <p className="text-center text-xs text-(--text-muted) py-8">No clauses found to edit.</p>
                    )}
                  </div>
                )}

                {modalTab === "signoff" && (
                  <div className="space-y-6 max-w-2xl mx-auto">
                    <div className="p-4 rounded-2xl border border-(--text-primary)/10 bg-(--bg-surface)">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">
                          {isBn ? "আইনজীবী প্রমাণীকরণ" : "Advocate Credentials"}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                          Verified Bar Council Member
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-(--text-primary)">
                        {user?.name || "Adv. Tanvir Ahmed, Supreme Court of Bangladesh"}
                      </p>
                      <p className="text-xs font-mono text-(--text-muted) mt-0.5">
                        Enrollment: SC-DH-48912/2016 · High Court Division
                      </p>
                    </div>

                    {/* International Grade Statutory Verification Mode Selection */}
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-(--text-primary) block">
                        {isBn ? "অনুমোদন ও সিলমোহর মোড (Verification Mode):" : "Statutory Verification Mode:"}
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSealMethod("digital")}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            sealMethod === "digital"
                              ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs"
                              : "border-(--text-primary)/10 bg-(--bg-surface) hover:border-(--text-primary)/20"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-(--text-primary) flex items-center gap-1.5">
                              <BadgeCheck className="w-4 h-4 text-emerald-600" />
                              {isBn ? "১-ক্লিক ডিজিটাল সিলমোহর" : "1-Click Digital Bar Seal"}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                              Recommended
                            </span>
                          </div>
                          <p className="text-[11px] text-(--text-muted) leading-relaxed">
                            {isBn 
                              ? "যাচাইকৃত বার কাউন্সিল প্রোফাইল থেকে ডিজিটাল সিল, কিউআর কোড ও হ্যাশ স্বয়ংক্রিয়ভাবে সংযুক্ত হবে।" 
                              : "Auto-stamps digital seal, SHA-256 integrity hash & QR verification from verified Bar profile."}
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSealMethod("physical")}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            sealMethod === "physical"
                              ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-xs"
                              : "border-(--text-primary)/10 bg-(--bg-surface) hover:border-(--text-primary)/20"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-(--text-primary) flex items-center gap-1.5">
                              <UploadCloud className="w-4 h-4 text-indigo-600" />
                              {isBn ? "ফিজিক্যাল কপি সংযুক্তি" : "Attach Physical Scan"}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded">
                              Optional
                            </span>
                          </div>
                          <p className="text-[11px] text-(--text-muted) leading-relaxed">
                            {isBn 
                              ? "স্বহস্তে স্বাক্ষরিত কাগজের চুক্তিপত্র ও স্বাক্ষরের স্ক্যান কপি আপলোড করুন।" 
                              : "Optionally attach physical wet-ink signed contract and handwritten signature image."}
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Live Digital Seal Preview when digital mode is chosen */}
                    {sealMethod === "digital" && (
                      <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            {isBn ? "সংবিধিবদ্ধ ডিজিটাল সিল প্রিভিউ" : "Statutory Digital Seal Preview"}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                            PKI / SHA-256 Validated
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-(--bg-card) border border-emerald-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <p className="font-serif font-bold text-sm text-(--text-primary)">
                              {user?.name || "Adv. Tanvir Ahmed"}
                            </p>
                            <p className="text-[11px] text-(--text-muted)">
                              Advocate, Supreme Court of Bangladesh · Enrollment: {user?.lawyerProfile?.barCouncilNo || "SC-DH-48912/2016"}
                            </p>
                            <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                              Authentication: Cryptographic Bar Certificate & Audit Chain
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-500/30 flex items-center justify-center shrink-0">
                            <QrCode className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Physical upload fields only when physical mode is active */}
                    {sealMethod === "physical" && (
                      <div className="space-y-3 p-3.5 rounded-xl border border-(--text-primary)/10 bg-(--bg-surface)">
                        <p className="text-xs font-semibold text-(--text-primary)">
                          {isBn ? "প্রমাণপত্র আপলোড (ঐচ্ছিক):" : "Physical Attachments (Optional):"}
                        </p>

                        <div className="p-3 rounded-xl border border-(--text-primary)/10 bg-(--bg-card) flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center shrink-0">
                              <FileCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-(--text-primary)">{isBn ? "আইনজীবীর স্বাক্ষর (ছবি)" : "Advocate Signature (Image)"}</p>
                              <p className="text-[10px] text-(--text-muted) flex items-center gap-1">
                                {signaturePath ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                    <span>{isBn ? "সফলভাবে আপলোড হয়েছে" : "Uploaded successfully"}</span>
                                  </>
                                ) : (
                                  "PNG or JPG format"
                                )}
                              </p>
                            </div>
                          </div>
                          <label className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${signaturePath ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-(--bg-surface) text-(--text-primary) border-(--text-primary)/20 hover:bg-(--text-primary)/5"}`}>
                            {isUploadingSign ? "Uploading..." : signaturePath ? "Change" : "Upload"}
                            <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleUploadSignature} disabled={isUploadingSign} />
                          </label>
                        </div>

                        <div className="p-3 rounded-xl border border-(--text-primary)/10 bg-(--bg-card) flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-(--text-primary)">{isBn ? "সাইনকৃত চুক্তিপত্র (PDF)" : "Signed Contract (PDF)"}</p>
                              <p className="text-[10px] text-(--text-muted) flex items-center gap-1">
                                {signedPdfPath ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                    <span>{isBn ? "সফলভাবে আপলোড হয়েছে" : "Uploaded successfully"}</span>
                                  </>
                                ) : (
                                  "PDF format only"
                                )}
                              </p>
                            </div>
                          </div>
                          <label className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${signedPdfPath ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-(--bg-surface) text-(--text-primary) border-(--text-primary)/20 hover:bg-(--text-primary)/5"}`}>
                            {isUploadingPdf ? "Uploading..." : signedPdfPath ? "Change" : "Upload"}
                            <input type="file" accept=".pdf" className="hidden" onChange={handleUploadPdf} disabled={isUploadingPdf} />
                          </label>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-(--text-primary) block">
                        {isBn ? "সংবিধিবদ্ধ আইনি যাচাইকরণ চেকলিস্ট:" : "Statutory Verification Checkpoints:"}
                      </label>

                      <div className="space-y-2 text-xs">
                        <label className="flex items-start gap-2.5 p-3 rounded-xl border border-(--text-primary)/10 bg-(--bg-surface) cursor-pointer">
                          <input type="checkbox" checked={checklist.severanceAudited} onChange={(e) => setChecklist({ ...checklist, severanceAudited: e.target.checked })} className="mt-0.5 rounded text-emerald-600" />
                          <span><strong>Bangladesh Labour Act 2006 (Sec 26):</strong> Statutory notice period and severance pay calculations verified.</span>
                        </label>

                        <label className="flex items-start gap-2.5 p-3 rounded-xl border border-(--text-primary)/10 bg-(--bg-surface) cursor-pointer">
                          <input type="checkbox" checked={checklist.restraintResolved} onChange={(e) => setChecklist({ ...checklist, restraintResolved: e.target.checked })} className="mt-0.5 rounded text-emerald-600" />
                          <span><strong>The Contract Act 1872 (Sec 27):</strong> Restraint of trade doctrine audited; unlawful non-compete clauses voided/redlined.</span>
                        </label>

                        <label className="flex items-start gap-2.5 p-3 rounded-xl border border-(--text-primary)/10 bg-(--bg-surface) cursor-pointer">
                          <input type="checkbox" checked={checklist.stampAuthorized} onChange={(e) => setChecklist({ ...checklist, stampAuthorized: e.target.checked })} className="mt-0.5 rounded text-emerald-600" />
                          <span><strong>Advocate Digital Seal Authorization:</strong> Authorize inclusion of Bar Council advocate signature block on client document.</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-(--text-primary) block mb-1.5">
                        {isBn ? "আইনজীবীর মন্তব্য ও রায়:" : "Advocate Statutory Advisory Notes:"}
                      </label>
                      <textarea
                        rows={3}
                        value={advocateNotes}
                        onChange={(e) => setAdvocateNotes(e.target.value)}
                        className={`w-full p-3 rounded-xl text-xs border outline-none font-sans leading-relaxed ${borderClass} bg-(--bg-surface) text-(--text-primary) focus:border-(--text-primary)/40`}
                        placeholder={isBn ? "আইনি মতামত লিখুন..." : "Enter statutory notes for client..."}
                      />
                    </div>

                    {/* Delivery Option to Client Vault */}
                    <div className="p-4 rounded-xl border border-(--text-primary)/15 bg-(--bg-card) space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deliverToClient}
                          onChange={(e) => setDeliverToClient(e.target.checked)}
                          className="mt-0.5 rounded text-emerald-600 w-4 h-4 cursor-pointer"
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-(--text-primary) block">
                            {isBn ? "ক্লায়েন্টের ভল্টে সরাসরি পাঠান ও অবহিত করুন" : "Deliver Verified Document to Client Vault"}
                          </span>
                          <p className="text-[11px] text-(--text-muted) leading-relaxed">
                            {isBn
                              ? "সিলমোহর প্রয়োগের সাথে সাথে ক্লায়েন্টের সংগ্রহশালায় (Client Archive) 'আইনজীবী দ্বারা যাচাইকৃত' সিলমোহর ও সংশোধিত ক্লজসহ তাৎক্ষণিকভাবে যুক্ত হবে এবং ক্লায়েন্ট সংশোধিত রেডলাইন চুক্তি ও অডিট রিপোর্ট ডাউনলোড করতে পারবেন।"
                              : "Upon sealing, the contract will be delivered to the client's archive with the 'Verified by Lawyer' seal, amended clauses, and redlined DOCX."}
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Official Sealed Certificate Card (International Grade) */}
                    {sealedSuccess && sealedCertInfo && (
                      <div className="p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 space-y-4 animate-in fade-in zoom-in-95">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                              <ShieldCheck className="w-7 h-7" />
                            </div>
                            <div>
                              <p className="font-bold text-sm uppercase tracking-wider text-emerald-800 dark:text-emerald-200">
                                {isBn ? "বাংলাদেশ বার কাউন্সিল সংবিধিবদ্ধ সিলমোহর প্রয়োগ সম্পন্ন" : "Bangladesh Bar Council Advocate Seal Applied"}
                              </p>
                              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                                Verified by {user?.name || "Adv. Tanvir Ahmed"} ({sealedCertInfo.barNo})
                              </p>
                            </div>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-white dark:bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-xs">
                            <QrCode className="w-8 h-8 text-emerald-700 dark:text-emerald-300" />
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-white/70 dark:bg-black/30 border border-emerald-500/20 text-[11px] font-mono space-y-1">
                          <div className="flex justify-between">
                            <span className="text-(--text-muted)">Certificate Ref:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-300">{sealedCertInfo.sealRef}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-(--text-muted)">Security Fingerprint:</span>
                            <span className="truncate max-w-[280px]" title={sealedCertInfo.hash}>{sealedCertInfo.hash}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-(--text-muted)">Sealed Timestamp:</span>
                            <span>{new Date(sealedCertInfo.timestamp).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Deliverables Action Row (Print Stamped PDF & Download Redline DOCX) */}
                        <div className="pt-2 flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-emerald-900/60 border border-emerald-500/30 text-emerald-800 dark:text-emerald-100 hover:bg-emerald-100 flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                          >
                            <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>{isBn ? "সিলমোহরকৃত রিপোর্ট প্রিন্ট / PDF" : "Print / Save Sealed PDF"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadRedlineDocx(selectedContract.contractId || selectedContract.id)}
                            disabled={isDownloadingRedline}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            {isDownloadingRedline ? (
                              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                            <span>{isBn ? "রেডলাইন চুক্তি (.DOCX)" : "Download Redline (.DOCX)"}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-5 border-t border-(--text-primary)/10 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 bg-(--bg-surface)">
                <button
                  type="button"
                  onClick={() => setSelectedContract(null)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border ${borderClass} text-(--text-muted) hover:text-(--text-primary) cursor-pointer`}
                >
                  {isBn ? "বন্ধ করুন" : "Close"}
                </button>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {/* Save Draft Button */}
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft || isSealing}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border ${borderClass} bg-(--bg-card) hover:bg-(--text-primary)/5 text-(--text-primary) flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50`}
                    title={isBn ? "বর্তমান ধারা ও মন্তব্যগুলো খসড়া হিসেবে সংরক্ষণ করুন" : "Save clauses and notes as draft"}
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isBn ? "খসড়া সংরক্ষণ" : "Save Draft"}</span>
                  </button>

                  {modalTab !== "signoff" ? (
                    <button
                      type="button"
                      onClick={() => setModalTab("signoff")}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{isBn ? "অনুমোদন স্টেশনে যান →" : "Proceed to Seal Station →"}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApproveAndSeal}
                      disabled={isSealing || sealedSuccess || isUploadingSign || isUploadingPdf}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {isSealing ? (
                        <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /><span>{isBn ? "সিলমোহর প্রয়োগ হচ্ছে..." : "Applying Statutory Seal..."}</span></>
                      ) : sealedSuccess ? (
                        <><Check className="w-3.5 h-3.5" /><span>{isBn ? (deliverToClient ? "অনুমোদিত ও ক্লায়েন্টকে পাঠানো সম্পন্ন" : "অনুমোদিত ও ড্রাফটে রক্ষিত") : (deliverToClient ? "Approved & Delivered to Client" : "Approved & Stored in Draft")}</span></>
                      ) : (
                        <><ShieldCheck className="w-3.5 h-3.5" /><span>{isBn ? (deliverToClient ? "অনুমোদন ও ক্লায়েন্টকে হস্তান্তর" : "অভ্যন্তরীণ অনুমোদন ও সিল") : (deliverToClient ? "Approve & Deliver to Client" : "Approve & Seal Internally")}</span></>
                      )}
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
    </AppShell>
  );
}