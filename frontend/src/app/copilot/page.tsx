"use client";

// Legal Copilot workspace view
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import PromptBar from "@/components/prompt/PromptBar";
import ThoughtLine from "@/components/effects/ThoughtLine";
import MarkdownViewer from "@/components/markdown/MarkdownViewer";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth, normalizeUserRole } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { STATUTORY_PROVISIONS, StatutoryProvision } from "@/data/statutoryProvisions";
import { ApiError } from "@/lib/api";
import {
  ChatSession,
  CitedSection,
  CitedCase,
  DetailedChatResponse,
  StatuteLookupResult,
  createChatSession,
  sendChatQuery,
  listChatSessions,
  getChatSessionHistory,
  renameChatSession,
  closeChatSession,
  lookupStatuteSection,
} from "@/lib/apiServices";
import { maskPii } from "@/lib/piiMasker";
import {
  ArrowDown,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Coins,
  Copy,
  ExternalLink,
  FileText,
  History,
  Loader2,
  MessageSquarePlus,
  MoreVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  RotateCcw,
  Scale,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  SquarePen,
  Trash2,
  X,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

interface NormalizedCitedSection {
  act: string;
  sectionNumber: string;
  title: string;
  summary: string;
  relevance: string;
  url?: string;
}

interface UiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: NormalizedCitedSection[];
  citedCases?: CitedCase[];
  actionSteps?: string[];
  followUps?: string[];
  needsClarification?: boolean;
  isThinking?: boolean;
  thinkingStage?: number;
  thinkingStartTime?: number;
  thoughtDuration?: number;
  thoughtSteps?: string[];
  isStopped?: boolean;
  isError?: boolean;
  errorStatus?: number;
  retryQuery?: string;
  piiRedactionsCount?: number;
  createdAt?: string;
}

interface ActiveContractContext {
  contractId: string | number;
  title: string;
  summary?: string;
  riskScore?: number;
  riskGrade?: string;
}

interface StatuteModalState {
  citation: NormalizedCitedSection;
  loading: boolean;
  data: StatuteLookupResult | null;
  fallbackProvision?: StatutoryProvision | null;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function normalizeCitations(raw?: CitedSection[] | null): NormalizedCitedSection[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: NormalizedCitedSection[] = [];

  for (const item of raw) {
    if (!item) continue;
    const act = String(item.act || item.act_title || "Bangladesh Statute").trim();
    const sec = String(item.section_number || item.section || "").trim();
    if (!sec) continue;
    const key = `${act.toLowerCase()}::${sec.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      act,
      sectionNumber: sec,
      title: String(item.title || "Statutory Provision").trim(),
      summary: String(item.provision_summary || "").trim(),
      relevance: String(item.relevance || item.relevance_summary || "").trim(),
      url: item.url ? String(item.url).trim() : undefined,
    });
  }
  return out;
}

function formatActShortName(act: string): string {
  const cleaned = act.replace(/^the\s+/i, "").trim();
  const lower = cleaned.toLowerCase();
  if (lower.includes("code of criminal procedure")) return "CrPC, 1898";
  if (lower.includes("code of civil procedure")) return "CPC, 1908";
  if (lower.includes("penal code")) return "Penal Code, 1860";
  if (lower.includes("contract act")) return "Contract Act, 1872";
  if (lower.includes("evidence act")) return "Evidence Act, 1872";
  if (lower.includes("specific relief act")) return "Specific Relief, 1877";
  if (lower.includes("bangladesh labour act")) return "Labour Act, 2006";
  if (lower.includes("transfer of property")) return "Transfer of Property";
  if (lower.includes("constitution")) return "Constitution of BD";
  if (lower.includes("nari o shishu") || lower.includes("women and children")) {
    return "Nari O Shishu Act";
  }
  if (lower.includes("arbitration")) return "Arbitration Act, 2001";
  if (lower.includes("companies act")) return "Companies Act, 1994";
  return cleaned;
}

function formatSectionPillLabel(sec: string, isBn: boolean): string {
  const s = sec.trim();
  if (!s) return "";
  if (isBn) {
    if (/^ধারা|^অনুচ্ছেদ/.test(s)) return s;
    if (/^art(?:icle)?\.?\s+/i.test(s)) {
      return `অনুচ্ছেদ ${s.replace(/^art(?:icle)?\.?\s+/i, "")}`;
    }
    if (/^sec(?:tion)?\.?\s+/i.test(s)) {
      return `ধারা ${s.replace(/^sec(?:tion)?\.?\s+/i, "")}`;
    }
    return `ধারা ${s}`;
  }
  if (/^sec(?:tion)?\.?\s+/i.test(s)) {
    return `Sec ${s.replace(/^sec(?:tion)?\.?\s+/i, "")}`;
  }
  if (/^art(?:icle)?\.?\s+/i.test(s)) {
    return `Art ${s.replace(/^art(?:icle)?\.?\s+/i, "")}`;
  }
  if (/^\d/.test(s)) return `Sec ${s}`;
  return s;
}

function matchStaticProvision(citation: NormalizedCitedSection): StatutoryProvision | null {
  const numMatch = citation.sectionNumber.match(/\d+[A-Za-z]?/);
  if (!numMatch) return null;
  const targetNum = numMatch[0].toLowerCase();
  const actLower = citation.act.toLowerCase();

  for (const prov of Object.values(STATUTORY_PROVISIONS)) {
    const provMatch = prov.sectionEn.match(/\b(\d+[A-Za-z]?)\b/);
    const provNum = provMatch ? provMatch[1].toLowerCase() : "";
    const provAct = prov.actTitleEn.toLowerCase();
    if (provNum && provNum === targetNum) {
      if (
        (actLower.includes("contract") && provAct.includes("contract")) ||
        (actLower.includes("labour") && provAct.includes("labour")) ||
        (actLower.includes("labor") && provAct.includes("labour"))
      ) {
        return prov;
      }
    }
  }
  return null;
}

function expandSlashCommand(rawQuery: string, isBn: boolean): string {
  const trimmed = rawQuery.trim();
  if (trimmed.startsWith("/audit")) {
    const rest = trimmed.slice(6).trim();
    if (!rest) {
      return isBn
        ? "বাংলাদেশের চুক্তি আইন, ১৮৭২ এবং প্রযোজ্য আইন অনুযায়ী একটি বাণিজ্যিক চুক্তি অডিট করার মূল ধারা ও ঝুঁকিসমূহ ব্যাখ্যা করুন।"
        : "Explain the key clauses and risk checkpoints for auditing a commercial contract under Bangladesh Contract Act, 1872.";
    }
    return isBn
      ? `নিম্নলিখিত চুক্তি বা ধারা বাংলাদেশের প্রযোজ্য আইন অনুযায়ী বিস্তারিত আইনি অডিট ও ঝুঁকি বিশ্লেষণ করুন:\n\n${rest}`
      : `Conduct a structured legal risk audit of the following clause or contract under applicable Bangladesh laws:\n\n${rest}`;
  }
  if (trimmed.startsWith("/memo")) {
    const rest = trimmed.slice(5).trim();
    if (!rest) {
      return isBn
        ? "বাংলাদেশ সুপ্রিম কোর্ট বা জেলা জজ আদালতে দাখিলযোগ্য একটি সংক্ষিপ্ত আইনি মেমো ফরম্যাটে প্রধান উপাদানসমূহ ব্যাখ্যা করুন।"
        : "Provide a formal Bangladesh legal memorandum template highlighting key statutory and procedural components.";
    }
    return isBn
      ? `নিম্নলিখিত বিষয়ে বাংলাদেশের আইন ও নজির উল্লেখপূর্বক একটি সুসংগঠিত আইনি মেমো (Legal Memo) প্রস্তুত করুন:\n\n${rest}`
      : `Draft a structured formal legal memorandum under Bangladesh law on the following issue:\n\n${rest}`;
  }
  if (trimmed.startsWith("/redline")) {
    const rest = trimmed.slice(8).trim();
    if (!rest) {
      return isBn
        ? "কোনো একতরফা বা ঝুঁকিপূর্ণ চুক্তির ধারা কীভাবে ভারসাম্যপূর্ণ রেডলাইন (Redline) খসড়ায় রূপান্তর করা উচিত, তা উদাহরণসহ ব্যাখ্যা করুন।"
        : "Show how to redline high-risk indemnity and non-compete clauses to comply with Bangladesh law.";
    }
    return isBn
      ? `নিম্নলিখিত ধারাটির আইনি দুর্বলতা চিহ্নিত করে নিরাপদ ও ভারসাম্যপূর্ণ বিকল্প রেডলাইন (Redline Draft) লিখে দিন:\n\n${rest}`
      : `Identify legal vulnerabilities in the following clause and provide a balanced, enforceable redline draft under Bangladesh law:\n\n${rest}`;
  }
  return trimmed;
}

function getPipelineSteps(isBn: boolean, mode: string): string[] {
  if (mode === "USER_CONTRACT") {
    return isBn
      ? [
          "প্রশ্ন ও চুক্তির প্রেক্ষাপট বিশ্লেষণ করা হচ্ছে...",
          "আপলোডকৃত চুক্তির ধারা ও ঝুঁকি যাচাই করা হচ্ছে...",
          "প্রযোজ্য বাংলাদেশ আইন ও বিধি মিলিয়ে দেখা হচ্ছে...",
          "সুনির্দিষ্ট আইনি পরামর্শ ও করণীয় সাজানো হচ্ছে...",
        ]
      : [
          "Analyzing question and contract scope...",
          "Inspecting scoped contract clauses and risk points...",
          "Cross-checking against Bangladesh statutory law...",
          "Structuring actionable legal guidance...",
        ];
  }
  if (mode === "LAWYER_RESEARCH") {
    return isBn
      ? [
          "আইনি ইস্যু ও কার্যবিধি চিহ্নিত করা হচ্ছে...",
          "বাংলাদেশের প্রযোজ্য আইন ও ধারা অনুসন্ধান (Live RAG)...",
          "হাইকোর্ট ও আপিল বিভাগের নজির যাচাই করা হচ্ছে...",
          "তথ্যসূত্রসহ পেশাদার আইনি বিশ্লেষণ তৈরি হচ্ছে...",
        ]
      : [
          "Parsing legal issue and procedural posture...",
          "Searching Bangladesh statutory corpus (Live RAG)...",
          "Verifying Appellate & High Court Division precedents...",
          "Synthesizing citation-verified legal brief...",
        ];
  }
  return isBn
    ? [
        "আপনার প্রশ্ন ও আইনি প্রাসঙ্গিকতা বোঝা হচ্ছে...",
        "বাংলাদেশের প্রযোজ্য আইন ও ধারা অনুসন্ধান (Live RAG)...",
        "সংশ্লিষ্ট বিধি ও ব্যতিক্রমসমূহ যাচাই করা হচ্ছে...",
        "সহজ ও নির্ভুল আইনি উত্তর প্রস্তুত করা হচ্ছে...",
      ]
    : [
        "Analyzing your legal question and context...",
        "Searching Bangladesh statutory provisions (Live RAG)...",
        "Verifying procedural rules and exceptions...",
        "Preparing structured, verified legal response...",
      ];
}

function groupSessionsByDate(sessions: ChatSession[], isBn: boolean) {
  const sorted = [...sessions].sort((a, b) => {
    const tA = new Date(a.updated_at || a.created_at || 0).getTime();
    const tB = new Date(b.updated_at || b.created_at || 0).getTime();
    return tB - tA;
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfLast7Days = startOfToday - 6 * 86400000;

  const groups: { label: string; items: ChatSession[] }[] = [
    { label: isBn ? "আজ" : "Today", items: [] },
    { label: isBn ? "গতকাল" : "Yesterday", items: [] },
    { label: isBn ? "গত ৭ দিন" : "Previous 7 Days", items: [] },
    { label: isBn ? "পুরাতন" : "Older", items: [] },
  ];

  for (const s of sorted) {
    const rawDate = s.updated_at || s.created_at;
    if (!rawDate) {
      groups[3].items.push(s);
      continue;
    }
    const ts = new Date(rawDate).getTime();
    if (Number.isNaN(ts) || ts <= 0) {
      groups[3].items.push(s);
    } else if (ts >= startOfToday) {
      groups[0].items.push(s);
    } else if (ts >= startOfYesterday) {
      groups[1].items.push(s);
    } else if (ts >= startOfLast7Days) {
      groups[2].items.push(s);
    } else {
      groups[3].items.push(s);
    }
  }

  return groups.filter((g) => g.items.length > 0);
}

// ────────────────────────────────────────────────────────────────────────────
// Subcomponents
// ────────────────────────────────────────────────────────────────────────────

function ActionStepsDisclosure({
  steps,
  isBn,
}: {
  steps: string[];
  isBn: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!steps.length) return null;

  return (
    <div className="mt-3 pt-3 border-t border-(--text-primary)/8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left py-1 text-xs font-semibold text-(--text-primary)/80 hover:text-(--text-primary) transition-colors cursor-pointer"
      >
        <span className="inline-flex items-center gap-1.5">
          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            {isBn
              ? `পরবর্তী করণীয় পদক্ষেপ (${steps.length})`
              : `Recommended Action Steps (${steps.length})`}
          </span>
        </span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-(--text-muted)" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-(--text-muted)" />
        )}
      </button>

      {open && (
        <ul className="mt-2 space-y-1.5 pl-1">
          {steps.map((step, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-[14px] leading-[1.65] text-(--text-primary)/85"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 shrink-0" />
              <span className="flex-1 wrap-break-word">{step}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CaseLawPills({
  cases,
  isBn,
}: {
  cases: CitedCase[];
  isBn: boolean;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  if (!cases.length) return null;

  return (
    <div className="mt-3 pt-3 border-t border-(--text-primary)/8">
      <div className="flex items-center gap-1.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
        <BookOpen className="w-3.5 h-3.5" />
        <span>
          {isBn ? "প্রাসঙ্গিক উচ্চ আদালতের নজির" : "Precedents & Case Law"}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {cases.map((c, idx) => {
          const active = expandedIdx === idx;
          return (
            <button
              key={`${c.case_name}-${idx}`}
              type="button"
              onClick={() => setExpandedIdx(active ? null : idx)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer max-w-full ${
                active
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-200"
                  : "bg-(--bg-surface) border-(--text-primary)/12 text-(--text-primary)/85 hover:border-amber-500/40"
              }`}
            >
              <span className="truncate max-w-[220px] sm:max-w-[300px]">{c.case_name}</span>
              <ChevronDown
                className={`w-3 h-3 shrink-0 transition-transform ${
                  active ? "rotate-180" : ""
                }`}
              />
            </button>
          );
        })}
      </div>

      {expandedIdx !== null && cases[expandedIdx] && (
        <div className="mt-2 p-3 rounded-xl bg-(--bg-surface) border border-amber-500/25 text-[13.5px] leading-[1.6] space-y-1">
          <div className="font-semibold text-(--text-primary)">
            {cases[expandedIdx].case_name}
          </div>
          {cases[expandedIdx].ruling && (
            <p className="text-(--text-primary)/85">{cases[expandedIdx].ruling}</p>
          )}
          {cases[expandedIdx].relevance && (
            <p className="text-xs text-(--text-muted)">
              {cases[expandedIdx].relevance}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Copilot Page
// ────────────────────────────────────────────────────────────────────────────

export default function CopilotPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isBn = language === "bn";
  const { user, isAuthenticated, isLoading: authLoading, refreshUser, updateUser } = useAuth();
  const { toast } = useNotification();

  // Role & Credit Calculations
  const normalizedRole = normalizeUserRole(user?.role);
  const isLawyer = normalizedRole === "lawyer";
  const isEnterpriseAdmin =
    normalizedRole === "enterprise_admin" || normalizedRole === "enterprise";
  const isEnterpriseMember = normalizedRole === "enterprise_member";

  const liveCredits = useMemo(() => {
    if (!user) return 0;
    if (isEnterpriseMember && user.member_credit_quota != null) {
      return Math.max(0, user.member_credit_quota - (user.member_credit_used ?? 0));
    }
    if (isEnterpriseAdmin || isEnterpriseMember) {
      return user.enterprise_credit_balance ?? user.creditBalance ?? 0;
    }
    return user.creditBalance ?? 0;
  }, [user, isEnterpriseAdmin, isEnterpriseMember]);

  const canTopUpCredits =
    normalizedRole === "general" ||
    (normalizedRole === "lawyer" &&
      String(user?.lawyerProfile?.verificationStatus || "").toLowerCase() === "verified") ||
    (isEnterpriseAdmin &&
      String(user?.enterpriseProfile?.verificationStatus || "").toLowerCase() === "verified");

  const defaultMode: "GENERAL" | "LAWYER_RESEARCH" = isLawyer
    ? "LAWYER_RESEARCH"
    : "GENERAL";

  // Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | number | null>(null);
  const [activeMode, setActiveMode] = useState<string>(defaultMode);
  const [turnCount, setTurnCount] = useState<number>(0);
  const [turnLimit, setTurnLimit] = useState<number>(isLawyer ? 20 : 5);
  const [messages, setMessages] = useState<UiChatMessage[]>([]);
  const [activeContractContext, setActiveContractContext] =
    useState<ActiveContractContext | null>(null);

  const [isBusy, setIsBusy] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [piiMaskEnabled, setPiiMaskEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // History Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [menuOpenSessionId, setMenuOpenSessionId] = useState<string | number | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<string | number | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renamingBusy, setRenamingBusy] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | number | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  // Mobile viewport detection (compact prompt bar placeholder)
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobileViewport(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Long-press (mobile) handler for chat history items -> opens the 3-dot menu
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);

  const cancelLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const startLongPress = useCallback(
    (e: React.PointerEvent, sessionId: string | number) => {
      if (e.pointerType !== "touch") return;
      cancelLongPress();
      longPressFiredRef.current = false;
      longPressTimerRef.current = setTimeout(() => {
        longPressFiredRef.current = true;
        setConfirmDeleteId(null);
        setMenuOpenSessionId(sessionId);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.(10);
        }
      }, 500);
    },
    [cancelLongPress]
  );

  /** Suppress the click that follows a long-press so it doesn't also open the chat. */
  const wasLongPress = useCallback(() => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return true;
    }
    return false;
  }, []);

  // Statute Popup Modal State + Client Memory Cache
  const [statuteModal, setStatuteModal] = useState<StatuteModalState | null>(null);
  const [copiedStatute, setCopiedStatute] = useState(false);
  const statuteCacheRef = useRef<Map<string, StatuteLookupResult>>(new Map());
  const statuteLookupAbortRef = useRef<AbortController | null>(null);

  // Scroll & Abort Refs
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const latestAssistantRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const initializedRef = useRef<boolean>(false);

  // Keep active mode aligned with role when idle with no open session
  useEffect(() => {
    if (!activeSessionId && !activeContractContext) {
      setActiveMode(defaultMode);
      setTurnLimit(isLawyer ? 20 : 5);
    }
  }, [activeSessionId, activeContractContext, defaultMode, isLawyer]);

  // Animated thinking stages while AI is generating
  useEffect(() => {
    if (!isBusy) return;
    const timer = setInterval(() => {
      setMessages((prev) =>
        prev.map((m) => {
          if (!m.isThinking || !m.thinkingStartTime) return m;
          const elapsedSec = (Date.now() - m.thinkingStartTime) / 1000;
          const maxStages = 4;
          const nextStage = Math.min(maxStages - 1, Math.floor(elapsedSec / 1.8));
          if (nextStage === m.thinkingStage) return m;
          return { ...m, thinkingStage: nextStage };
        })
      );
    }, 450);
    return () => clearInterval(timer);
  }, [isBusy]);

  // Load sessions helper
  const fetchSessions = useCallback(async () => {
    try {
      const list = await listChatSessions();
      setSessions(list);
      return list;
    } catch {
      return [];
    }
  }, []);

  // Load a specific session's messages
  const handleSelectSession = useCallback(
    async (session: ChatSession | { session_id: string | number; mode?: string }) => {
      const sid = session.session_id;
      setIsLoadingHistory(true);
      setIsDrawerOpen(false);
      setConfirmDeleteId(null);
      setRenamingSessionId(null);
      try {
        const res = await getChatSessionHistory(sid);
        setActiveSessionId(res.session_id);
        setActiveMode(res.mode || session.mode || defaultMode);
        setTurnCount(res.message_count ?? Math.ceil(res.messages.length / 2));
        setTurnLimit(res.message_limit ?? (isLawyer ? 20 : 5));
        setMessages(
          res.messages.map((m, idx) => ({
            id: `hist-${sid}-${idx}-${m.created_at || idx}`,
            role: m.role,
            content: m.content,
            citations: normalizeCitations(m.citations),
            citedCases: m.cited_cases || undefined,
            actionSteps: m.suggested_next_steps || undefined,
            followUps: m.suggested_follow_ups || undefined,
            needsClarification: m.needs_clarification,
            createdAt: m.created_at,
          }))
        );
        setTimeout(() => {
          const el = scrollContainerRef.current;
          if (el) el.scrollTop = el.scrollHeight;
        }, 60);
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : isBn
            ? "চ্যাট হিস্ট্রি লোড করা যায়নি।"
            : "Failed to load chat history."
        );
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [defaultMode, isBn, isLawyer, toast]
  );

  // Initial load: fetch sessions & consume any handoff from ContractMind / Archive / Lawyer Pending
  useEffect(() => {
    if (authLoading || !isAuthenticated || !user || initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      await fetchSessions();
      if (typeof window === "undefined") return;

      const rawContext = sessionStorage.getItem("active_audit_contract");
      if (rawContext) {
        sessionStorage.removeItem("active_audit_contract");
        try {
          const parsed = JSON.parse(rawContext);
          if (parsed.existingSessionId) {
            setActiveContractContext({
              contractId: parsed.contractId || parsed.id,
              title: isBn
                ? parsed.titleBn || parsed.titleEn || "চুক্তি পর্যালোচনা"
                : parsed.titleEn || parsed.titleBn || "Contract Review",
            });
            await handleSelectSession({
              session_id: parsed.existingSessionId,
              mode: "USER_CONTRACT",
            });
            return;
          }
          if (parsed.contractId || parsed.id) {
            setActiveContractContext({
              contractId: parsed.contractId || parsed.id,
              title: isBn
                ? parsed.titleBn || parsed.titleEn || "Contract Context"
                : parsed.titleEn || parsed.titleBn || "Contract Context",
              summary: isBn ? parsed.summaryBn : parsed.summaryEn,
              riskScore: parsed.riskScore,
              riskGrade: isBn ? parsed.riskGradeBn : parsed.riskGradeEn,
            });
            setActiveMode("USER_CONTRACT");
            setActiveSessionId(null);
            setMessages([]);
          }
        } catch {
          // Ignore malformed handoff payload
        }
      }
    };

    init();
  }, [authLoading, isAuthenticated, user, fetchSessions, handleSelectSession, isBn]);

  // Escape key closes Statute Modal or History Drawer
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (statuteModal) {
          statuteLookupAbortRef.current?.abort();
          setStatuteModal(null);
        } else if (isDrawerOpen) {
          setIsDrawerOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [statuteModal, isDrawerOpen]);

  // Smart Scroll handler
  const handleContainerScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distFromBottom <= 140;
    isNearBottomRef.current = nearBottom;
    setShowJumpToBottom(!nearBottom && messages.length > 0);
  }, [messages.length]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    isNearBottomRef.current = true;
    setShowJumpToBottom(false);
  }, []);

  // Start fresh chat
  const handleNewChat = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsBusy(false);
    setActiveSessionId(null);
    setMessages([]);
    setTurnCount(0);
    setActiveMode(activeContractContext ? "USER_CONTRACT" : defaultMode);
    setTurnLimit(isLawyer ? 20 : 5);
    setShowJumpToBottom(false);
    setIsDrawerOpen(false);
  }, [activeContractContext, defaultMode, isLawyer]);

  // Stop active generation
  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Open Live RAG Statute Modal/Drawer (0 credits + memory cache)
  const handleOpenStatuteModal = useCallback(
    async (citation: NormalizedCitedSection) => {
      statuteLookupAbortRef.current?.abort();
      const cacheKey = `${citation.act.toLowerCase()}::${citation.sectionNumber.toLowerCase()}`;
      const fallbackProv = matchStaticProvision(citation);
      const cached = statuteCacheRef.current.get(cacheKey);

      setCopiedStatute(false);
      if (cached) {
        setStatuteModal({
          citation,
          loading: false,
          data: cached,
          fallbackProvision: fallbackProv,
        });
        return;
      }

      setStatuteModal({
        citation,
        loading: true,
        data: null,
        fallbackProvision: fallbackProv,
      });

      const controller = new AbortController();
      statuteLookupAbortRef.current = controller;
      try {
        const res = await lookupStatuteSection(
          citation.sectionNumber,
          citation.act,
          controller.signal
        );
        if (res.found && res.verbatim_text) {
          statuteCacheRef.current.set(cacheKey, res);
        }
        setStatuteModal((prev) =>
          prev &&
          prev.citation.sectionNumber === citation.sectionNumber &&
          prev.citation.act === citation.act
            ? { ...prev, loading: false, data: res }
            : prev
        );
      } catch (err) {
        if (err instanceof ApiError && err.status === 499) return;
        setStatuteModal((prev) =>
          prev
            ? {
                ...prev,
                loading: false,
                data: {
                  found: false,
                  act: citation.act,
                  section: citation.sectionNumber,
                  title: citation.title,
                  verbatim_text: "",
                  bdlaws_url:
                    citation.url || "http://bdlaws.minlaw.gov.bd/laws-of-bangladesh.html",
                  status: "Summary Only",
                },
              }
            : null
        );
      }
    },
    []
  );

  // Core send message handler (supports normal send + in-place retry)
  const handleSendPrompt = useCallback(
    async (rawText: string, options?: { replaceMessageId?: string }) => {
      const trimmed = rawText.trim();
      if (!trimmed || isBusy || !isAuthenticated) return;

      const expandedPrompt = expandSlashCommand(trimmed, isBn);
      const masked = piiMaskEnabled
        ? maskPii(expandedPrompt, true)
        : { redactedText: expandedPrompt, stats: { totalRedactions: 0 } };
      const finalQueryText = masked.redactedText;

      const nowMs = Date.now();
      const targetMode: "GENERAL" | "LAWYER_RESEARCH" | "USER_CONTRACT" =
        activeContractContext
          ? "USER_CONTRACT"
          : activeMode === "LAWYER_RESEARCH" || isLawyer
          ? "LAWYER_RESEARCH"
          : "GENERAL";

      const assistantMsgId =
        options?.replaceMessageId || `ast-${nowMs}-${Math.random().toString(36).slice(2, 7)}`;

      const thinkingPlaceholder: UiChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        isThinking: true,
        thinkingStage: 0,
        thinkingStartTime: nowMs,
        thoughtSteps: getPipelineSteps(isBn, targetMode),
        retryQuery: trimmed,
      };

      if (options?.replaceMessageId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === options.replaceMessageId ? thinkingPlaceholder : m))
        );
      } else {
        const userMsg: UiChatMessage = {
          id: `usr-${nowMs}-${Math.random().toString(36).slice(2, 7)}`,
          role: "user",
          content: finalQueryText,
          piiRedactionsCount: masked.stats.totalRedactions,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg, thinkingPlaceholder]);
      }

      isNearBottomRef.current = true;
      setShowJumpToBottom(false);
      setTimeout(() => scrollToBottom("smooth"), 40);

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsBusy(true);

      try {
        let sid = activeSessionId;
        if (!sid) {
          const titleCandidate = trimmed.slice(0, 60) || (isBn ? "আইনি প্রশ্ন" : "Legal Consultation");
          const created = await createChatSession(
            titleCandidate,
            targetMode,
            activeContractContext?.contractId ?? null
          );
          sid = created.session_id;
          setActiveSessionId(sid);
          setActiveMode(created.mode || targetMode);
          setTurnLimit(created.message_limit ?? (isLawyer ? 20 : 5));
          fetchSessions();
        }

        const res = await sendChatQuery({
          session_id: sid,
          query: finalQueryText,
          contract_id: activeContractContext?.contractId ?? null,
          signal: controller.signal,
        });

        const elapsed = Number(((Date.now() - nowMs) / 1000).toFixed(1));

        let answerText = "";
        let rawCitations: CitedSection[] | undefined = res.cited_sections;
        let rawCases: CitedCase[] | undefined;
        let actionSteps: string[] | undefined;
        let followUps: string[] | undefined;
        let needsClarification = false;

        if (typeof res.response === "string") {
          answerText = res.response;
        } else if (res.response && typeof res.response === "object") {
          const r = res.response as DetailedChatResponse;
          answerText = r.detailed_answer || "";
          rawCitations = r.cited_sections || res.cited_sections;
          rawCases = r.cited_cases;
          actionSteps = r.suggested_next_steps;
          followUps = r.suggested_follow_ups;
          needsClarification = Boolean(r.needs_clarification);
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: answerText || (isBn ? "উত্তর পাওয়া যায়নি।" : "No response received."),
                  citations: normalizeCitations(rawCitations),
                  citedCases: Array.isArray(rawCases) ? rawCases : undefined,
                  actionSteps: Array.isArray(actionSteps) ? actionSteps : undefined,
                  followUps: Array.isArray(followUps) ? followUps : undefined,
                  needsClarification,
                  isThinking: false,
                  thoughtDuration: elapsed,
                  isStopped: false,
                  isError: false,
                  createdAt: new Date().toISOString(),
                }
              : m
          )
        );

        setTurnCount((c) => c + 1);

        // Live sync credit balance immediately
        if (typeof res.credits_remaining === "number" && user) {
          if (isEnterpriseAdmin || isEnterpriseMember) {
            updateUser({ enterprise_credit_balance: res.credits_remaining });
          } else {
            updateUser({ creditBalance: res.credits_remaining });
          }
          refreshUser().catch(() => {});
        }

        fetchSessions();

        // Scroll cleanly to the START of the newly arrived assistant message
        // (unless the user intentionally scrolled away up the history)
        setTimeout(() => {
          if (isNearBottomRef.current && latestAssistantRef.current) {
            latestAssistantRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 80);
      } catch (err: unknown) {
        const elapsed = Number(((Date.now() - nowMs) / 1000).toFixed(1));
        const isStoppedByUser =
          (err instanceof ApiError && err.status === 499) ||
          (err instanceof Error && err.name === "AbortError");

        if (isStoppedByUser) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: isBn
                      ? "উত্তর তৈরি করা আপনার অনুরোধে থামানো হয়েছে।"
                      : "Response generation was stopped.",
                    isThinking: false,
                    thoughtDuration: elapsed,
                    isStopped: true,
                    isError: false,
                    retryQuery: trimmed,
                  }
                : m
            )
          );
        } else {
          const status = err instanceof ApiError ? err.status : 500;
          const detail =
            err instanceof Error
              ? err.message
              : isBn
              ? "সার্ভারের সাথে সংযোগ করতে সমস্যা হয়েছে।"
              : "Failed to communicate with the legal AI engine.";

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: detail,
                    isThinking: false,
                    thoughtDuration: elapsed,
                    isStopped: false,
                    isError: true,
                    errorStatus: status,
                    retryQuery: trimmed,
                  }
                : m
            )
          );
        }
      } finally {
        abortControllerRef.current = null;
        setIsBusy(false);
      }
    },
    [
      isBusy,
      isAuthenticated,
      isBn,
      piiMaskEnabled,
      activeContractContext,
      activeMode,
      isLawyer,
      activeSessionId,
      scrollToBottom,
      fetchSessions,
      user,
      isEnterpriseAdmin,
      isEnterpriseMember,
      updateUser,
      refreshUser,
    ]
  );

  // Copy full assistant markdown
  const handleCopyMessage = useCallback(
    async (id: string, text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 1800);
      } catch {
        toast.error(isBn ? "কপি করা যায়নি।" : "Could not copy to clipboard.");
      }
    },
    [isBn, toast]
  );

  // Copy verbatim statute text
  const handleCopyStatute = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedStatute(true);
        setTimeout(() => setCopiedStatute(false), 1800);
      } catch {
        toast.error(isBn ? "কপি করা যায়নি।" : "Could not copy statute text.");
      }
    },
    [isBn, toast]
  );

  // Rename session in History drawer
  const handleSaveRename = useCallback(
    async (sessionId: string | number) => {
      const nextTitle = renameDraft.trim();
      if (!nextTitle || renamingBusy) return;
      setRenamingBusy(true);
      try {
        await renameChatSession(sessionId, nextTitle);
        setSessions((prev) =>
          prev.map((s) =>
            String(s.session_id) === String(sessionId) ? { ...s, title: nextTitle } : s
          )
        );
        setRenamingSessionId(null);
        toast.success(isBn ? "সেশনের নাম পরিবর্তন হয়েছে।" : "Session renamed.");
      } catch {
        toast.error(isBn ? "নাম পরিবর্তন করা যায়নি।" : "Failed to rename session.");
      } finally {
        setRenamingBusy(false);
      }
    },
    [renameDraft, renamingBusy, isBn, toast]
  );

  // Close / delete session in History drawer
  const handleDeleteSession = useCallback(
    async (sessionId: string | number) => {
      if (deletingId) return;
      setDeletingId(sessionId);
      try {
        await closeChatSession(sessionId);
        setSessions((prev) =>
          prev.filter((s) => String(s.session_id) !== String(sessionId))
        );
        if (String(activeSessionId) === String(sessionId)) {
          handleNewChat();
        }
        setConfirmDeleteId(null);
        toast.success(isBn ? "সেশন মুছে ফেলা হয়েছে।" : "Conversation deleted.");
      } catch {
        toast.error(isBn ? "মুছে ফেলা সম্ভব হয়নি।" : "Failed to delete conversation.");
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, activeSessionId, handleNewChat, isBn, toast]
  );

  // Filtered & grouped sessions for drawer
  const groupedSessions = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    const filtered = q
      ? sessions.filter(
          (s) =>
            (s.title || "").toLowerCase().includes(q) ||
            (s.mode || "").toLowerCase().includes(q)
        )
      : sessions;
    return groupSessionsByDate(filtered, isBn);
  }, [sessions, historySearch, isBn]);

  // Empty-screen starter prompts tailored to role & contract mode
  const starterPrompts = useMemo<{ label: string; prompt: string }[]>(() => {
    if (activeContractContext) {
      return isBn
        ? [
            { label: "ঝুঁকি পরীক্ষা", prompt: "এই চুক্তির সবচেয়ে ঝুঁকিপূর্ণ ধারাগুলো কী কী?" },
            { label: "বৈধতা", prompt: "টার্মিনেশন ও ক্ষতিপূরণ ধারা বাংলাদেশের আইন অনুযায়ী কতটা বৈধ?" },
            { label: "সংশোধন", prompt: "আমার স্বার্থ রক্ষায় কোন ধারাগুলো সংশোধন (Redline) করা উচিত?" },
          ]
        : [
            { label: "Risk Audit", prompt: "What are the highest-risk clauses in this contract?" },
            { label: "Enforceability", prompt: "Are the termination & indemnity terms enforceable under Bangladesh law?" },
            { label: "Redlines", prompt: "Which clauses should I redline to protect my rights?" },
          ];
    }
    if (isLawyer) {
      return isBn
        ? [
            { label: "ফৌজদারি আইন", prompt: "দণ্ডবিধি ৩০২ বনাম ৩০৪: শাস্তি ও জামিন প্রক্রিয়া" },
            { label: "দেওয়ানি প্রতিকার", prompt: "সুনির্দিষ্ট প্রতিকার আইন: ধারা ৪২ ও ৫৪ বিশ্লেষণ" },
            { label: "জামিন কৌশল", prompt: "ফৌজদারি কার্যবিধি ৪৯৮: আগাম জামিনের আইনি ভিত্তি" },
          ]
        : [
            { label: "Criminal Practice", prompt: "Section 302 vs 304 Penal Code with bail posture" },
            { label: "Civil Remedies", prompt: "Declaratory & injunction suits (SR Act 42 & 54)" },
            { label: "Bail Strategy", prompt: "Anticipatory bail principles under CrPC 498" },
          ];
    }
    return isBn
      ? [
          { label: "চাকরির আইন", prompt: "চাকরির চুক্তিতে নন-কম্পিট ধারা কি বৈধ?" },
          { label: "শ্রম আইন", prompt: "বিনা নোটিশে বরখাস্তের আইনি প্রতিকার কী?" },
          { label: "ভাড়া চুক্তি", prompt: "ভাড়া চুক্তির প্রধান আইনি সতর্কতা" },
        ]
      : [
          { label: "Employment", prompt: "Are non-compete clauses valid in Bangladesh?" },
          { label: "Labour Rights", prompt: "Remedies for termination without notice under Labour Act" },
          { label: "Tenancy", prompt: "Key legal checks before signing a rental agreement" },
        ];
  }, [activeContractContext, isLawyer, isBn]);

  const turnLimitReached = turnLimit !== -1 && turnCount >= turnLimit;

  // Loading / Auth Guard
  if (authLoading) {
    return (
      <AppShell>
        <div className="h-[calc(100dvh-5rem)] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-(--text-muted)" />
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <AppShell>
        <div className="h-[calc(100dvh-6rem)] max-w-lg mx-auto flex flex-col items-center justify-center text-center px-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <Scale className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-(--text-primary) mb-2">
            {isBn ? "এডভোটেক কোপাইলট ব্যবহার করতে সাইন ইন করুন" : "Sign in to access Advotech Copilot"}
          </h1>
          <p className="text-sm text-(--text-muted) mb-5">
            {isBn
              ? "যাচাইকৃত বাংলাদেশি আইন, ধারা ভিত্তিক Live RAG এবং আইনি পরামর্শের জন্য আপনার একাউন্টে লগইন করুন।"
              : "Access verified Bangladesh statutory citations, Live RAG analysis, and saved legal consultations."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="px-5 py-2.5 rounded-xl bg-(--accent-solid) text-(--accent-contrast) text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            {isBn ? "সাইন ইন পেজে যান" : "Go to Sign In"}
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell mainClassName="pb-20! md:pb-3!" hideDock={isDrawerOpen}>
      {/* ─── Desktop: Left Vertical Actions (Aligned directly with vertical dock: left-4, width 60px) ─── */}
      {!isDrawerOpen && (
        <div className="hidden md:flex fixed left-4 top-5 z-40 flex-col items-center gap-2.5 w-[60px] select-none">
          {/* Previous Chat / History Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            title={isBn ? "পূর্ববর্তী চ্যাট / হিস্ট্রি" : "Previous Chats / History"}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-transparent border-0 text-(--text-primary)/80 hover:text-(--text-primary) hover:bg-(--text-primary)/8 transition-all cursor-pointer group"
          >
            <PanelLeftOpen className="w-5 h-5 transition-transform group-hover:scale-105" />
          </button>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleNewChat}
            title={isBn ? "নতুন চ্যাট" : "New Chat"}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-transparent border-0 text-(--text-primary)/80 hover:text-(--text-primary) hover:bg-(--text-primary)/8 transition-all cursor-pointer group"
          >
            <SquarePen className="w-5 h-5 transition-transform group-hover:scale-105" />
          </button>
        </div>
      )}

      <div className="h-[calc(100dvh-8.75rem)] md:h-[calc(100vh-2.75rem)] max-w-5xl mx-auto flex flex-col min-h-0 font-sans">
        {/* ─── Mobile Only: Sticky Floating Actions (History & New Chat) ─── */}
        <div className="md:hidden fixed top-4 left-4 z-40 flex items-center gap-1 p-1 rounded-full bg-(--bg-card) border border-(--text-primary)/10 shadow-lg">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            title={isBn ? "পূর্ববর্তী চ্যাট / হিস্ট্রি" : "Previous Chats / History"}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-transparent border-0 text-(--text-primary)/80 hover:text-(--text-primary) hover:bg-(--text-primary)/8 transition-all cursor-pointer active:scale-95"
          >
            <PanelLeftOpen className="w-4.5 h-4.5" />
          </button>
          <button
            type="button"
            onClick={handleNewChat}
            title={isBn ? "নতুন চ্যাট" : "New Chat"}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-transparent border-0 text-(--text-primary)/80 hover:text-(--text-primary) hover:bg-(--text-primary)/8 transition-all cursor-pointer active:scale-95"
          >
            <SquarePen className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* ─── Top Bar: Turn quota ─── */}
        <header className="shrink-0 flex items-center justify-end gap-2 pb-1.5 sm:pb-2">

          {/* Right Side: Session Turn Quota Badge */}
          <div className="flex items-center gap-2 ml-auto">
            {activeSessionId && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-(--bg-card) border border-(--text-primary)/10 text-(--text-muted)">
                {turnLimit === -1 || turnLimit >= 10000
                  ? `${turnCount} ${isBn ? "বার্তা" : "turns"}`
                  : `${turnCount}/${turnLimit} ${isBn ? "টার্ন" : "turns"}`}
              </span>
            )}
          </div>
        </header>

        {/* Optional Scoped Contract Banner */}
        {activeContractContext && (
          <div className="shrink-0 mt-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-semibold text-(--text-primary) truncate">
                {activeContractContext.title}
              </span>
              {activeContractContext.riskGrade && (
                <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-(--bg-card) text-[11px] text-(--text-muted) shrink-0">
                  {activeContractContext.riskGrade}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveContractContext(null);
                setActiveMode(defaultMode);
              }}
              className="p-1 rounded-md hover:bg-(--text-primary)/10 text-(--text-muted) cursor-pointer shrink-0"
              title={isBn ? "চুক্তি কনটেক্সট সরান" : "Clear contract scope"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ─── Middle Scrollable Chat Viewport with Soft Edge Fades ─── */}
        <div className="relative flex-1 min-h-0 flex flex-col">
          {/* Top Gradient Mask (smooth visual transition under top bar) */}
          <div className="pointer-events-none absolute top-0 inset-x-0 h-5 bg-linear-to-b from-(--bg-primary) to-transparent z-10" />

          <div
            ref={scrollContainerRef}
            onScroll={handleContainerScroll}
            className="flex-1 overflow-y-auto px-1 sm:px-2 pt-5 pb-10 space-y-5 scroll-smooth"
          >
            {isLoadingHistory ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-sm text-(--text-muted)">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>{isBn ? "আলোচনা লোড হচ্ছে..." : "Loading conversation..."}</span>
              </div>
            ) : messages.length === 0 ? (
              /* Clean Empty Onboarding State with Starter Chips */
              <div className="min-h-full flex flex-col items-center justify-center py-4 px-2 text-center">
                <div className="mb-3 sm:mb-4">
                  <Image
                    src="/logo.svg"
                    alt="Advotech Logo"
                    width={48}
                    height={48}
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain dark:invert"
                    priority
                  />
                </div>
                {(activeContractContext || isLawyer) && (
                  <p className="mb-2 inline-flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-widest text-(--text-muted) not-italic">
                    <span className="h-px w-6 bg-(--text-primary)/20" aria-hidden />
                    {isBn
                      ? activeContractContext
                        ? "চুক্তি পর্যালোচনা মোড"
                        : "আইনজীবীদের জন্য প্রস্তুত"
                      : activeContractContext
                        ? "Contract review mode"
                        : "Built for practising lawyers"}
                    <span className="h-px w-6 bg-(--text-primary)/20" aria-hidden />
                  </p>
                )}
                <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight mb-1.5 text-(--text-primary)">
                  {isBn
                    ? isLawyer
                      ? "আইনি গবেষণা"
                      : "আইনি কোপাইলট"
                    : isLawyer
                      ? "Legal Research"
                      : "Legal Copilot"}
                </h1>
                <p className="text-xs sm:text-sm text-(--text-muted) max-w-md mx-auto font-normal leading-relaxed mb-4">
                  {isBn ? (
                    activeContractContext ? (
                      "এই চুক্তির ধারা-ভিত্তিক ঝুঁকি, বৈধতা ও সংশোধন পরামর্শ নিন।"
                    ) : isLawyer ? (
                      "নজির অনুসন্ধান, যুক্তি খসড়া ও শুনানি প্রস্তুতি — বাংলাদেশের আইন ও ধারার সঠিক উদ্ধৃতিসহ।"
                    ) : (
                      "বাংলাদেশি আইন ও আদালতের নজির থেকে নির্ভরযোগ্য আইনি উত্তর পান।"
                    )
                  ) : activeContractContext ? (
                    "Clause-level risk, enforceability, and redline guidance for this contract under Bangladesh law."
                  ) : isLawyer ? (
                    "Precedent research, argument drafting, and hearing prep — with statute-precise citations from Bangladesh law."
                  ) : (
                    "Ask any legal question grounded in Bangladesh laws and precedents."
                  )}
                </p>

                <div className="w-full max-w-2xl flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-left">
                  {starterPrompts.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendPrompt(item.prompt)}
                      className="group p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-(--bg-card) border border-(--text-primary)/10 hover:border-(--text-primary)/30 hover:shadow-xs transition-all text-left cursor-pointer flex items-center sm:flex-col sm:items-start justify-between gap-2.5 sm:gap-2"
                    >
                      <span className="text-xs sm:text-sm font-normal text-(--text-primary)/90 group-hover:text-(--text-primary) leading-snug">
                        {item.prompt}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400 shrink-0 sm:mt-1">
                        <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-widest font-normal text-(--text-muted) sm:mr-auto">
                          {item.label}
                        </span>
                        <span>{isBn ? "জিজ্ঞাসা করুন" : "Ask now"}</span>
                        <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isLastAssistant =
                  msg.role === "assistant" &&
                  idx === messages.map((m) => m.role).lastIndexOf("assistant");

                if (msg.role === "user") {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[88%] sm:max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-2.5 sm:px-5 sm:py-3 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs">
                        <p className="text-[15px] leading-[1.65] whitespace-pre-wrap wrap-break-word">
                          {msg.content}
                        </p>
                        {msg.piiRedactionsCount ? (
                          <div className="mt-1.5 flex items-center gap-1 text-[10.5px] opacity-75">
                            <ShieldCheck className="w-3 h-3" />
                            <span>
                              {isBn
                                ? `${msg.piiRedactionsCount}টি ব্যক্তিগত তথ্য সুরক্ষিত করা হয়েছে`
                                : `${msg.piiRedactionsCount} PII item(s) masked locally`}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                }

                // Assistant Turn
                const currentSteps = msg.thoughtSteps || getPipelineSteps(isBn, activeMode);
                const visibleSteps = msg.isThinking
                  ? currentSteps.slice(0, (msg.thinkingStage ?? 0) + 1)
                  : msg.thoughtSteps || [];

                return (
                  <div
                    key={msg.id}
                    ref={isLastAssistant ? latestAssistantRef : undefined}
                    className="flex flex-col items-start scroll-mt-5"
                  >
                    <div
                      className={`w-full sm:max-w-[88%] rounded-2xl border px-4 py-3.5 sm:px-6 sm:py-4.5 shadow-2xs transition-colors ${
                        msg.isError
                          ? "bg-rose-500/6 border-rose-500/25"
                          : msg.isStopped
                          ? "bg-amber-500/5 border-amber-500/25"
                          : "bg-(--bg-card)/90 border-(--text-primary)/8"
                      }`}
                    >
                      {/* Top Header: Animated Step-by-step ThoughtLine + Copy Button */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0 flex-1">
                          <ThoughtLine
                            working={Boolean(msg.isThinking)}
                            elapsed={
                              msg.isThinking ? undefined : msg.thoughtDuration
                            }
                            showTimer={Boolean(msg.isThinking) || msg.thoughtDuration != null}
                            collapsible
                            collapseOnSettle
                            color="var(--text-primary)"
                            fontSize={13}
                            steps={visibleSteps}
                            label={isBn ? "বিশ্লেষণ চলছে" : "Thinking"}
                            doneLabel={
                              msg.thoughtDuration != null
                                ? isBn
                                  ? "সময়"
                                  : "Thought for"
                                : isBn
                                ? "যাচাইকৃত উত্তর"
                                : "Verified Legal Brief"
                            }
                          />
                        </div>

                        {!msg.isThinking && msg.content && !msg.isError && !msg.isStopped && (
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.content)}
                            className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/6 transition-colors shrink-0 cursor-pointer"
                            title={isBn ? "উত্তর কপি করুন" : "Copy response"}
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Thinking / Stopped / Error / Verified Answer Body */}
                      {msg.isThinking ? (
                        <div className="py-1 space-y-2 animate-pulse">
                          <div className="h-3 w-4/5 rounded bg-(--text-primary)/8" />
                          <div className="h-3 w-3/5 rounded bg-(--text-primary)/6" />
                        </div>
                      ) : msg.isStopped || msg.isError ? (
                        <div className="space-y-3">
                          <p
                            className={`text-[14.5px] leading-relaxed ${
                              msg.isError
                                ? "text-rose-700 dark:text-rose-300"
                                : "text-(--text-primary)/85"
                            }`}
                          >
                            {msg.content}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            {msg.retryQuery && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSendPrompt(msg.retryQuery!, {
                                    replaceMessageId: msg.id,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>{isBn ? "আবার চেষ্টা করুন" : "Retry"}</span>
                              </button>
                            )}
                            {(msg.errorStatus === 402 ||
                              msg.errorStatus === 403 ||
                              /credit|ক্রেডিট|quota/i.test(msg.content)) &&
                              canTopUpCredits && (
                                <Link
                                  href="/pricing"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                                >
                                  <Coins className="w-3.5 h-3.5" />
                                  <span>{isBn ? "ক্রেডিট কিনুন" : "Top Up Credits"}</span>
                                </Link>
                              )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <MarkdownViewer content={msg.content} variant="chat" />

                          {/* Compact Live RAG Statutory Section Pills (Click to open Full Law Modal) */}
                          {msg.citations && msg.citations.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-(--text-primary)/8">
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                                  <Scale className="w-3.5 h-3.5" />
                                  <span>
                                    {isBn
                                      ? "যাচাইকৃত ধারা (ক্লিক করে পূর্ণ আইন দেখুন)"
                                      : "Statutory Citations (Live RAG)"}
                                  </span>
                                </span>
                                <span className="text-[10.5px] text-(--text-muted) hidden sm:inline">
                                  {isBn ? "ফ্রি প্রিভিউ" : "Click pill to read full law"}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                {msg.citations.map((cit, cIdx) => (
                                  <button
                                    key={`${cit.act}-${cit.sectionNumber}-${cIdx}`}
                                    type="button"
                                    onClick={() => handleOpenStatuteModal(cit)}
                                    className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-(--bg-surface) border border-indigo-500/25 hover:border-indigo-500/60 hover:bg-indigo-500/8 transition-all text-left cursor-pointer max-w-full shadow-2xs"
                                  >
                                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                                      {formatSectionPillLabel(cit.sectionNumber, isBn)}
                                    </span>
                                    <span className="text-[11px] text-(--text-muted) truncate max-w-[140px] sm:max-w-[190px]">
                                      · {formatActShortName(cit.act)}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Compact Precedent / Case Law Pills */}
                          {msg.citedCases && msg.citedCases.length > 0 && (
                            <CaseLawPills cases={msg.citedCases} isBn={isBn} />
                          )}

                          {/* Clean Collapsible Action Steps */}
                          {msg.actionSteps && msg.actionSteps.length > 0 && (
                            <ActionStepsDisclosure steps={msg.actionSteps} isBn={isBn} />
                          )}
                        </>
                      )}
                    </div>

                    {/* Suggested Follow-ups cleanly OUTSIDE the main card */}
                    {!msg.isThinking &&
                      isLastAssistant &&
                      msg.followUps &&
                      msg.followUps.length > 0 &&
                      !turnLimitReached && (
                        <div className="mt-2.5 w-full sm:max-w-[88%] flex flex-wrap gap-1.5">
                          {msg.followUps.map((fq, fIdx) => (
                            <button
                              key={fIdx}
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleSendPrompt(fq)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-(--bg-card) border border-(--text-primary)/12 hover:border-indigo-500/45 text-xs font-medium text-(--text-primary)/85 hover:text-(--text-primary) transition-all cursor-pointer disabled:opacity-50 text-left"
                            >
                              <MessageSquarePlus className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="wrap-break-word">{fq}</span>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                );
              })
            )}
          </div>

          {/* Floating "Jump to Bottom" Pill */}
          {showJumpToBottom && (
            <button
              type="button"
              onClick={() => scrollToBottom("smooth")}
              className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-900/95 text-white dark:bg-neutral-100/95 dark:text-neutral-900 shadow-lg text-xs font-semibold hover:scale-[1.02] transition-transform cursor-pointer backdrop-blur-xs"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>{isBn ? "নিচে যান" : "Jump to bottom"}</span>
            </button>
          )}

          {/* Bottom Gradient Mask above PromptBar */}
          <div className="pointer-events-none absolute bottom-0 inset-x-0 h-7 bg-linear-to-t from-(--bg-primary) via-(--bg-primary)/75 to-transparent z-10" />
        </div>

        {/* ─── Bottom PromptBar / Stop / Turn Limit Footer ─── */}
        <footer className="shrink-0 pt-1 w-full max-w-2xl mx-auto">
          {turnLimitReached ? (
            <div className="p-3.5 rounded-2xl bg-(--bg-card) border border-(--text-primary)/12 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div className="text-xs sm:text-sm text-(--text-primary)/85">
                {isBn
                  ? `এই সেশনের ${turnLimit} টার্ন সীমা পূর্ণ হয়েছে। নতুন প্রশ্ন করতে নতুন চ্যাট শুরু করুন।`
                  : `You have reached the ${turnLimit}-turn limit for this consultation. Start a new chat to continue.`}
              </div>
              <button
                type="button"
                onClick={handleNewChat}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold hover:opacity-90 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isBn ? "নতুন চ্যাট শুরু করুন" : "Start New Chat"}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 flex flex-col items-center">
              <PromptBar
                busy={isBusy}
                width={660}
                onSend={(text) => handleSendPrompt(text)}
                onStop={handleStopGeneration}
                placeholder={
                  isMobileViewport
                    ? isBn
                      ? "আইনি প্রশ্ন লিখুন..."
                      : "Ask about Bangladesh law..."
                    : isBn
                    ? "আইনি প্রশ্ন বা ধারা লিখুন... (/audit, /memo, /redline)"
                    : "Ask a question about Bangladesh law... (type / for commands)"
                }
                className="mx-auto"
              />
            </div>
          )}
        </footer>
      </div>

      {/* ─── Live RAG Statute Popup Modal / Mobile Bottom Sheet ─── */}
      {statuteModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs p-0 sm:p-4"
          onClick={() => {
            statuteLookupAbortRef.current?.abort();
            setStatuteModal(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full sm:max-w-2xl max-h-[88dvh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl bg-(--bg-card) border border-(--text-primary)/15 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="shrink-0 px-5 pt-4 pb-3.5 border-b border-(--text-primary)/10 flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                    <ShieldCheck className="w-3 h-3" />
                    <span>
                      {statuteModal.data?.found
                        ? isBn
                          ? "যাচাইকৃত মূল আইন"
                          : "Verified Gazette Text"
                        : isBn
                        ? "যাচাইকৃত তথ্যসূত্র"
                        : "Statutory Reference"}
                    </span>
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    {formatSectionPillLabel(statuteModal.citation.sectionNumber, isBn)}
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-semibold text-(--text-primary) leading-snug wrap-break-word">
                  {statuteModal.data?.title &&
                  statuteModal.data.title !== "Statutory Provision"
                    ? statuteModal.data.title
                    : statuteModal.citation.title &&
                      statuteModal.citation.title !== "Statutory Provision"
                    ? statuteModal.citation.title
                    : statuteModal.fallbackProvision
                    ? isBn
                      ? statuteModal.fallbackProvision.sectionBn
                      : statuteModal.fallbackProvision.sectionEn
                    : statuteModal.citation.sectionNumber}
                </h2>
                <p className="text-xs text-(--text-muted)">
                  {statuteModal.data?.act || statuteModal.citation.act}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  statuteLookupAbortRef.current?.abort();
                  setStatuteModal(null);
                }}
                className="p-2 rounded-full hover:bg-(--text-primary)/8 text-(--text-muted) hover:text-(--text-primary) cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Why Cited / AI Context */}
              {(statuteModal.citation.summary || statuteModal.citation.relevance) && (
                <div className="p-3.5 rounded-2xl bg-indigo-500/6 border border-indigo-500/20 space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    {isBn ? "আপনার প্রশ্নে প্রাসঙ্গিকতা" : "Relevance to Your Question"}
                  </div>
                  {statuteModal.citation.summary && (
                    <p className="text-[14px] leading-relaxed text-(--text-primary)/90">
                      {statuteModal.citation.summary}
                    </p>
                  )}
                  {statuteModal.citation.relevance && (
                    <p className="text-xs leading-relaxed text-(--text-muted)">
                      {statuteModal.citation.relevance}
                    </p>
                  )}
                </div>
              )}

              {/* Full Verbatim Statutory Text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-(--text-muted)">
                    {isBn ? "পূর্ণ মূল আইন (Verbatim Provision)" : "Full Verbatim Provision"}
                  </span>
                  {(statuteModal.data?.verbatim_text ||
                    statuteModal.fallbackProvision?.fullTextEn) && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyStatute(
                          statuteModal.data?.verbatim_text ||
                            (isBn
                              ? statuteModal.fallbackProvision?.fullTextBn
                              : statuteModal.fallbackProvision?.fullTextEn) ||
                            ""
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-(--bg-surface) border border-(--text-primary)/12 text-[11px] font-medium text-(--text-primary) hover:border-(--text-primary)/30 cursor-pointer"
                    >
                      {copiedStatute ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>{isBn ? "কপি হয়েছে" : "Copied"}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>{isBn ? "টেক্সট কপি" : "Copy text"}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {statuteModal.loading ? (
                  <div className="p-4 rounded-2xl bg-(--bg-surface) border border-(--text-primary)/10 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>
                        {isBn
                          ? "বাংলাদেশ আইন আর্কাইভ থেকে পূর্ণ ধারা আনা হচ্ছে..."
                          : "Fetching verbatim gazette text from Live RAG archive..."}
                      </span>
                    </div>
                    <div className="h-3 w-full rounded bg-(--text-primary)/8 animate-pulse" />
                    <div className="h-3 w-5/6 rounded bg-(--text-primary)/8 animate-pulse" />
                    <div className="h-3 w-4/6 rounded bg-(--text-primary)/6 animate-pulse" />
                  </div>
                ) : statuteModal.data?.verbatim_text ? (
                  <div className="p-4 rounded-2xl bg-(--bg-surface) border border-(--text-primary)/10 text-sm leading-[1.8] text-(--text-primary)/95 whitespace-pre-wrap font-sans">
                    {statuteModal.data.verbatim_text}
                  </div>
                ) : statuteModal.fallbackProvision?.fullTextEn ? (
                  <div className="p-4 rounded-2xl bg-(--bg-surface) border border-(--text-primary)/10 text-sm leading-[1.8] text-(--text-primary)/95 whitespace-pre-wrap font-sans">
                    {isBn
                      ? statuteModal.fallbackProvision.fullTextBn
                      : statuteModal.fallbackProvision.fullTextEn}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-(--bg-surface) border border-(--text-primary)/10 text-xs leading-relaxed text-(--text-muted)">
                    {isBn
                      ? "এই ধারার পূর্ণ মূল টেক্সট ডাটাবেজে পাওয়া যায়নি। নিচের অফিসিয়াল bdlaws লিংক থেকে অথবা কোপাইলটকে সহজ ব্যাখ্যার জন্য জিজ্ঞাসা করতে পারেন।"
                      : "Full gazette text is not indexed for this specific citation. You can open the official bdlaws portal below or ask Copilot for a deeper explanation."}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="shrink-0 px-5 py-3.5 border-t border-(--text-primary)/10 bg-(--bg-surface)/60 flex flex-wrap items-center justify-between gap-2.5">
              <a
                href={
                  statuteModal.data?.bdlaws_url ||
                  statuteModal.citation.url ||
                  "http://bdlaws.minlaw.gov.bd/laws-of-bangladesh.html"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-(--text-primary)/80 hover:text-(--text-primary) transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{isBn ? "অফিসিয়াল bdlaws দেখুন" : "Official bdlaws"}</span>
              </a>

              <button
                type="button"
                disabled={isBusy || turnLimitReached}
                onClick={() => {
                  const act = statuteModal.data?.act || statuteModal.citation.act;
                  const sec = statuteModal.data?.section || statuteModal.citation.sectionNumber;
                  statuteLookupAbortRef.current?.abort();
                  setStatuteModal(null);
                  const secDisplay = /^(sec|art|ধারা|অনুচ্ছেদ)/i.test(sec) ? sec : `Section ${sec}`;
                  const followPrompt = isBn
                    ? `${act}-এর ${formatSectionPillLabel(sec, true)} সহজ বাংলায় বাস্তব উদাহরণসহ বুঝিয়ে বলুন।`
                    : `Explain ${secDisplay} of ${act} in plain language with practical examples.`;
                  handleSendPrompt(followPrompt);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isBn ? "সহজ ব্যাখ্যা চান" : "Ask Copilot to explain"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── History Slide-Over Drawer (Gemini Layout: Brand Logo, Search & Close on Top, New Chat Full Width, then History) ─── */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-start items-stretch animate-in fade-in duration-200"
          onClick={() => {
            setIsDrawerOpen(false);
            setIsSearchExpanded(false);
            setMenuOpenSessionId(null);
            setConfirmDeleteId(null);
          }}
        >
          <aside
            className="w-[min(88vw,320px)] h-full bg-(--bg-card) border-r border-(--text-primary)/10 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-left duration-250 ease-out font-sans"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpenSessionId(null);
            }}
          >
            {/* Top Bar: Brand Logo & Title on Left, Search & Close on Right */}
            <div className="shrink-0 px-4 pt-5 pb-3">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 text-(--text-primary) hover:opacity-85 transition-opacity"
                >
                  <Image
                    src="/logo.svg"
                    alt="Advotech"
                    width={26}
                    height={26}
                    className="w-6 h-6 object-contain dark:invert"
                  />
                  <span className="font-semibold text-[17px] tracking-tight">Advotech</span>
                </Link>

                <div className="flex items-center gap-1">
                  {/* Search Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setIsSearchExpanded((prev) => !prev)}
                    title={isBn ? "খুঁজুন" : "Search"}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                      isSearchExpanded || historySearch
                        ? "bg-(--text-primary)/10 text-(--text-primary)"
                        : "text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/8"
                    }`}
                  >
                    <Search className="w-4 h-4" />
                  </button>

                  {/* Close / Collapse Sidebar Icon */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setIsSearchExpanded(false);
                    }}
                    title={isBn ? "সাইডবার বন্ধ করুন" : "Close sidebar"}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/8 transition-colors cursor-pointer"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Collapsible Search Input */}
              {(isSearchExpanded || historySearch) && (
                <div className="relative mt-3 animate-in fade-in duration-150">
                  <Search className="w-3.5 h-3.5 text-(--text-muted) absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder={isBn ? "আলোচনা খুঁজুন..." : "Search consultations..."}
                    autoFocus
                    className="w-full pl-8 pr-8 py-2 rounded-full bg-(--bg-surface) border-0 text-xs text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-1 focus:ring-(--text-primary)/20"
                  />
                  {historySearch && (
                    <button
                      type="button"
                      onClick={() => setHistorySearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Gemini-style Full-width Pill "New chat" Button */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    handleNewChat();
                    setIsDrawerOpen(false);
                  }}
                  className="w-full h-11 px-4 rounded-full bg-(--bg-surface) hover:bg-(--text-primary)/8 text-(--text-primary) text-[13.5px] font-medium flex items-center gap-3 transition-colors cursor-pointer select-none"
                >
                  <SquarePen className="w-4 h-4 text-(--text-primary)/80" />
                  <span>{isBn ? "নতুন চ্যাট" : "New chat"}</span>
                </button>
              </div>
            </div>

            {/* Grouped Sessions List (Pushed down with natural breathing room) */}
            <div className="flex-1 overflow-y-auto px-3 pt-2 pb-4 space-y-4">
              {groupedSessions.length === 0 ? (
                <div className="py-12 text-center text-xs text-(--text-muted)">
                  {historySearch
                    ? isBn
                      ? "কোনো মিল পাওয়া যায়নি।"
                      : "No matching consultations found."
                    : isBn
                    ? "এখনো কোনো চ্যাট হিস্ট্রি নেই।"
                    : "No saved consultations yet."}
                </div>
              ) : (
                groupedSessions.map((group) => (
                  <div key={group.label} className="space-y-1">
                    <div className="px-2.5 py-1 text-[11px] font-semibold text-(--text-muted)">
                      {group.label}
                    </div>
                    {group.items.map((sess) => {
                      const isActive = String(sess.session_id) === String(activeSessionId);
                      const isRenaming = String(renamingSessionId) === String(sess.session_id);
                      const isConfirmingDel =
                        String(confirmDeleteId) === String(sess.session_id);
                      const isMenuOpen = String(menuOpenSessionId) === String(sess.session_id);

                      return (
                        <div
                          key={String(sess.session_id)}
                          onPointerDown={(e) => startLongPress(e, sess.session_id)}
                          onPointerUp={cancelLongPress}
                          onPointerLeave={cancelLongPress}
                          onPointerCancel={cancelLongPress}
                          onContextMenu={(e) => {
                            if (longPressTimerRef.current || longPressFiredRef.current) {
                              e.preventDefault();
                            }
                          }}
                          className={`group relative rounded-xl px-3 py-2.5 transition-colors select-none [-webkit-touch-callout:none] ${
                            isActive
                              ? "bg-black/5 dark:bg-white/10"
                              : "hover:bg-(--text-primary)/5"
                          }`}
                        >
                          {isRenaming ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={renameDraft}
                                onChange={(e) => setRenameDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveRename(sess.session_id);
                                  if (e.key === "Escape") setRenamingSessionId(null);
                                }}
                                autoFocus
                                className="flex-1 min-w-0 px-2.5 py-1 rounded-lg bg-(--bg-card) border border-(--text-primary)/20 text-xs text-(--text-primary) focus:outline-none"
                              />
                              <button
                                type="button"
                                disabled={renamingBusy}
                                onClick={() => handleSaveRename(sess.session_id)}
                                className="p-1.5 rounded-lg bg-(--text-primary) text-(--bg-primary) cursor-pointer shrink-0"
                              >
                                {renamingBusy ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => setRenamingSessionId(null)}
                                className="p-1.5 rounded-lg hover:bg-(--text-primary)/10 text-(--text-muted) cursor-pointer shrink-0"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (wasLongPress()) return;
                                  handleSelectSession(sess);
                                }}
                                className="flex-1 min-w-0 text-left cursor-pointer"
                              >
                                <div className="text-xs font-medium text-(--text-primary) truncate leading-snug">
                                  {sess.title || (isBn ? "আইনি পরামর্শ" : "Legal Consultation")}
                                </div>
                                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-(--text-muted)">
                                  <span>
                                    {sess.mode === "LAWYER_RESEARCH"
                                      ? "Research"
                                      : sess.mode === "USER_CONTRACT"
                                      ? "Contract"
                                      : "General"}
                                  </span>
                                  <span>·</span>
                                  <span>
                                    {sess.message_count ?? 0}/
                                    {sess.message_limit === -1 || (sess.message_limit ?? 0) >= 10000
                                      ? "∞"
                                      : sess.message_limit ?? 5}
                                  </span>
                                </div>
                              </button>

                              {/* Hover 3-dot trigger & Dropdown Menu */}
                              <div className="relative shrink-0 flex items-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteId(null);
                                    setMenuOpenSessionId(isMenuOpen ? null : sess.session_id);
                                  }}
                                  title={isBn ? "অপশন" : "Options"}
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-(--text-muted) hover:text-(--text-primary) hover:bg-(--text-primary)/8 transition-all cursor-pointer ${
                                    isMenuOpen
                                      ? "opacity-100 bg-(--text-primary)/10 text-(--text-primary)"
                                      : "opacity-0 group-hover:opacity-100"
                                  }`}
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {/* Dropdown Popover */}
                                {isMenuOpen && (
                                  <div
                                    className="absolute right-0 top-8 z-30 w-36 rounded-xl bg-(--bg-card) border border-(--text-primary)/10 shadow-xl py-1.5 animate-in fade-in zoom-in-95 duration-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {isConfirmingDel ? (
                                      <div className="px-2.5 py-1.5 space-y-1.5">
                                        <p className="text-[11px] text-(--text-muted)">
                                          {isBn ? "মুছে ফেলতে চান?" : "Delete chat?"}
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            disabled={String(deletingId) === String(sess.session_id)}
                                            onClick={() => {
                                              handleDeleteSession(sess.session_id);
                                              setMenuOpenSessionId(null);
                                            }}
                                            className="flex-1 py-1 rounded-md bg-rose-600 text-white text-[11px] font-medium hover:bg-rose-700 cursor-pointer text-center"
                                          >
                                            {String(deletingId) === String(sess.session_id)
                                              ? "..."
                                              : isBn
                                              ? "হ্যাঁ"
                                              : "Yes"}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConfirmDeleteId(null)}
                                            className="flex-1 py-1 rounded-md hover:bg-(--text-primary)/10 text-[11px] text-(--text-muted) cursor-pointer text-center"
                                          >
                                            {isBn ? "না" : "No"}
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setMenuOpenSessionId(null);
                                            setRenamingSessionId(sess.session_id);
                                            setRenameDraft(sess.title || "");
                                          }}
                                          className="w-full px-3 py-1.5 text-left text-xs text-(--text-primary) hover:bg-(--text-primary)/6 flex items-center gap-2 cursor-pointer transition-colors"
                                        >
                                          <Pencil className="w-3.5 h-3.5 text-(--text-muted)" />
                                          <span>{isBn ? "নাম পরিবর্তন" : "Rename"}</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteId(sess.session_id)}
                                          className="w-full px-3 py-1.5 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer transition-colors"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>{isBn ? "মুছে ফেলুন" : "Delete"}</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Bottom Profile Footer (Gemini-style: Avatar, Name, Role badge, Go Icon) */}
            <div className="shrink-0 p-3 border-t border-(--text-primary)/8 bg-(--bg-card)">
              {user ? (
                <Link
                  href="/profile"
                  className="flex items-center justify-between gap-2.5 p-2 rounded-2xl hover:bg-(--text-primary)/6 transition-colors group cursor-pointer"
                  title={isBn ? "প্রোফাইলে যান" : "Go to Profile"}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* User Avatar */}
                    <div className="w-9 h-9 rounded-full bg-(--text-primary)/10 text-(--text-primary) font-semibold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                      {user.profile_photo_url || user.avatarUrl ? (
                        <Image
                          src={user.profile_photo_url || user.avatarUrl || ""}
                          alt={user.name || "User"}
                          width={36}
                          height={36}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <span>
                          {(user.name || "User")
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Name & Role */}
                    <div className="min-w-0 flex flex-col">
                      <span className="text-xs font-semibold text-(--text-primary) truncate leading-snug">
                        {user.name || (isBn ? "ব্যবহারকারী" : "User")}
                      </span>
                      <span className="text-[11px] text-(--text-muted) capitalize leading-snug">
                        {isLawyer
                          ? isBn
                            ? "আইনজীবী (Lawyer)"
                            : "Lawyer"
                          : isEnterpriseAdmin || isEnterpriseMember
                          ? "Enterprise"
                          : isBn
                          ? "সাধারণ (General)"
                          : "General"}
                      </span>
                    </div>
                  </div>

                  {/* Go / Arrow Icon */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-(--text-muted) group-hover:text-(--text-primary) group-hover:bg-(--text-primary)/8 transition-all shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-between gap-2 p-2 rounded-2xl hover:bg-(--text-primary)/6 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-(--text-primary)/10 flex items-center justify-center text-(--text-primary)">
                      <SquarePen className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-(--text-primary)">
                      {isBn ? "সাইন ইন করুন" : "Sign In"}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-(--text-muted) group-hover:text-(--text-primary)" />
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}
