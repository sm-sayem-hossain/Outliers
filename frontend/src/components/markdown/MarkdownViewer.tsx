"use client";

import React, { useState } from "react";
import {
  Check,
  AlertTriangle,
  Info,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  Copy,
  ExternalLink,
  Shield,
  ShieldCheck,
  Scale,
  CheckCircle2,
  BadgeCheck,
  Clock,
  FileText,
  ScrollText,
  Briefcase,
  MessageSquare,
} from "lucide-react";

interface MarkdownViewerProps {
  content: string;
  className?: string;
  variant?: "document" | "chat";
}

function LegalBadge({
  type,
  label,
}: {
  type: "VOID" | "RESTRICTED" | "COMMERCIAL" | "REVIEW" | "COMPLIANT" | "VERIFIED" | "SEALED" | "PENDING";
  label: string;
}) {
  switch (type) {
    case "VOID":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold tracking-wide uppercase bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-2xs whitespace-nowrap align-middle print:bg-rose-50 print:text-rose-950 print:border-rose-400">
          <ShieldAlert className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{label}</span>
        </span>
      );
    case "RESTRICTED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold tracking-wide uppercase bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs whitespace-nowrap align-middle print:bg-amber-50 print:text-amber-950 print:border-amber-400">
          <Scale className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>{label}</span>
        </span>
      );
    case "COMMERCIAL":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold tracking-wide uppercase bg-orange-50 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800 shadow-2xs whitespace-nowrap align-middle print:bg-orange-50 print:text-orange-950 print:border-orange-400">
          <AlertTriangle className="w-2.5 h-2.5 text-orange-600 dark:text-orange-400 shrink-0" />
          <span>{label}</span>
        </span>
      );
    case "REVIEW":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold tracking-wide uppercase bg-amber-50/70 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-2xs whitespace-nowrap align-middle print:bg-neutral-50 print:text-neutral-900 print:border-neutral-300">
          <AlertCircle className="w-2.5 h-2.5 text-amber-500 shrink-0" />
          <span>{label}</span>
        </span>
      );
    case "COMPLIANT":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold tracking-wide uppercase bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs whitespace-nowrap align-middle print:bg-emerald-50 print:text-emerald-950 print:border-emerald-400">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{label}</span>
        </span>
      );
    case "VERIFIED":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-medium bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-2xs whitespace-nowrap align-middle print:bg-sky-50 print:text-sky-900 print:border-sky-300">
          <BadgeCheck className="w-2.5 h-2.5 text-sky-600 dark:text-sky-400 shrink-0" />
          <span>{label}</span>
        </span>
      );
    case "SEALED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold tracking-wide bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-2xs whitespace-nowrap align-middle print:bg-emerald-50 print:text-emerald-950 print:border-emerald-500">
          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{label}</span>
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700 shadow-2xs whitespace-nowrap align-middle print:bg-neutral-100 print:text-neutral-800 print:border-neutral-300">
          <Clock className="w-2.5 h-2.5 text-neutral-500 dark:text-neutral-400 shrink-0" />
          <span>{label}</span>
        </span>
      );
  }
}

function DiffRedlineBlock({
  lines,
  isChat,
}: {
  lines: string[];
  isChat: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const textToCopy = lines.map((l) => l.replace(/^[+-]\s?/, "")).join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`my-3 sm:my-4 rounded-xl sm:rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 shadow-sm overflow-hidden text-xs print:border print:border-neutral-300 print:bg-white print:shadow-none print:my-3 print:rounded-lg print:break-inside-avoid ${
        isChat ? "max-w-full" : ""
      }`}
    >
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/60 text-[11px] text-neutral-600 dark:text-neutral-400 print:bg-neutral-100 print:border-b print:border-neutral-300 print:text-neutral-800">
        <div className="flex items-center gap-1.5 font-semibold tracking-wider text-[10px] uppercase">
          <span className="w-2 h-2 rounded-full bg-amber-500 print:hidden" />
          <span>Statutory Redline Comparison</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer text-[10px] print:hidden"
          title="Copy clean draft text"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy Draft"}</span>
        </button>
      </div>

      <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60 print:divide-neutral-200 font-mono text-[11px] sm:text-xs">
        {lines.map((line, idx) => {
          if (line.startsWith("+")) {
            return (
              <div
                key={idx}
                className="flex items-start gap-2 px-3.5 py-2.5 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 border-l-4 border-emerald-500 print:bg-emerald-50 print:text-emerald-950 print:border-l-4 print:border-emerald-600"
              >
                <span className="select-none font-bold text-emerald-600 dark:text-emerald-400 print:text-emerald-700 shrink-0">
                  +
                </span>
                <span className="flex-1 font-sans sm:font-mono font-medium leading-relaxed whitespace-pre-wrap">
                  {line.slice(1).trim()}
                </span>
              </div>
            );
          }
          if (line.startsWith("-")) {
            return (
              <div
                key={idx}
                className="flex items-start gap-2 px-3.5 py-2.5 bg-rose-50/90 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-l-4 border-rose-500 line-through decoration-rose-500/70 opacity-90 print:bg-rose-50 print:text-rose-950 print:border-l-4 print:border-rose-600 print:line-through"
              >
                <span className="select-none font-bold text-rose-600 dark:text-rose-400 print:text-rose-700 shrink-0">
                  -
                </span>
                <span className="flex-1 font-sans sm:font-mono leading-relaxed whitespace-pre-wrap">
                  {line.slice(1).trim()}
                </span>
              </div>
            );
          }
          return (
            <div
              key={idx}
              className="px-3.5 py-1.5 text-neutral-600 dark:text-neutral-400 print:text-neutral-800 leading-relaxed whitespace-pre-wrap"
            >
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CodeBlockItem({
  lang,
  lines,
  isChat,
}: {
  lang: string;
  lines: string[];
  isChat: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const codeText = lines.join("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`my-3 rounded-xl border border-(--text-primary)/15 bg-neutral-900 text-neutral-100 font-mono text-xs overflow-hidden shadow-inner print:bg-white print:text-neutral-900 print:border-neutral-300 print:shadow-none print:break-inside-avoid ${
        isChat ? "max-w-full" : ""
      }`}
    >
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-neutral-800 bg-neutral-950/70 text-[11px] text-neutral-400 print:bg-neutral-100 print:border-neutral-300 print:text-neutral-700">
        <span className="uppercase font-semibold tracking-wider text-[10px]">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-[10px] print:hidden"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto leading-relaxed print:bg-white print:text-neutral-900 print:overflow-visible print:whitespace-pre-wrap">
        <code>
          {lines.map((line, idx) => {
            let lineClass = "text-neutral-300 print:text-neutral-800";
            if (line.startsWith("+"))
              lineClass = "text-emerald-400 font-semibold bg-emerald-950/40 print:bg-emerald-50 print:text-emerald-950 block -mx-3.5 px-3.5";
            else if (line.startsWith("-"))
              lineClass = "text-rose-400 line-through opacity-80 bg-rose-950/40 print:bg-rose-50 print:text-rose-950 block -mx-3.5 px-3.5";
            return (
              <span key={idx} className={lineClass}>
                {line}
                {"\n"}
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}

export default function MarkdownViewer({
  content,
  className = "",
  variant = "document",
}: MarkdownViewerProps) {
  if (!content) return null;

  const isChat = variant === "chat";

  // Helper for inline markdown: status badges, **bold**, `code`, *italic*, [link](url)
  const formatInlineText = (text: string): React.ReactNode[] => {
    // Regex for [STATUS:type:label], legacy emoji status badges, bdlaws verification tags, [text](url), `code`, **bold**, *italic*
    const regex = /(\[STATUS:[A-Z_]+:[^\]]+\]|[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}]\s*\*\*[^*]+\*\*|(?:\u2705\s*)?(?:\*\(bdlaws verified\)\*|\(bdlaws verified\))|\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/gu;
    const parts = text.split(regex);

    return parts.map((part, idx) => {
      if (!part) return null;

      // Status Badge: [STATUS:TYPE:LABEL]
      if (part.startsWith("[STATUS:") && part.endsWith("]")) {
        const match = part.match(/^\[STATUS:([A-Z_]+):([^\]]+)\]$/);
        if (match) {
          const bType = match[1].toUpperCase();
          const bLabel = match[2].trim();
          let cat: "VOID" | "RESTRICTED" | "COMMERCIAL" | "REVIEW" | "COMPLIANT" | "VERIFIED" | "SEALED" | "PENDING" = "REVIEW";
          if (["VOID", "BREACH", "HIGH", "UNLAWFUL", "NON_COMPLIANT"].includes(bType)) {
            cat = "VOID";
          } else if (["RESTRICTED", "SCALED_DOWN", "PENALTY"].includes(bType)) {
            cat = "RESTRICTED";
          } else if (["COMMERCIAL", "COMMERCIAL_RISK"].includes(bType)) {
            cat = "COMMERCIAL";
          } else if (["COMPLIANT", "SUCCESS", "VALID"].includes(bType)) {
            cat = "COMPLIANT";
          } else if (["VERIFIED", "BDLAWS"].includes(bType)) {
            cat = "VERIFIED";
          } else if (["SEALED", "ADVOCATE_SEAL"].includes(bType)) {
            cat = "SEALED";
          } else if (["PENDING", "AWAITING_SEAL"].includes(bType)) {
            cat = "PENDING";
          }
          return <LegalBadge key={idx} type={cat} label={bLabel} />;
        }
      }

      // Legacy Emoji Status Fallback (handles cached audit reports gracefully)
      if (
        part.includes("VOID") ||
        part.includes("RESTRICTED") ||
        part.includes("COMMERCIAL") ||
        part.includes("COMPLIANT") ||
        part.includes("AMBIGUOUS") ||
        part.includes("Advocate Verified") ||
        part.includes("AI Audit Completed") ||
        part.includes("bdlaws verified")
      ) {
        const cleanLabel = part
          .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\s*]+/u, "")
          .replace(/\*\*/g, "")
          .replace(/^\*?\((.*?)\)\*?$/, "$1")
          .trim();
        const upper = cleanLabel.toUpperCase();
        if (upper.includes("VOID") || upper.includes("UNLAWFUL") || upper.includes("REGULATORY BREACH") || upper === "HIGH RISK") {
          return <LegalBadge key={idx} type="VOID" label={cleanLabel} />;
        }
        if (upper.includes("RESTRICTED") || upper.includes("SCALED-DOWN") || upper.includes("PENALTY")) {
          return <LegalBadge key={idx} type="RESTRICTED" label={cleanLabel} />;
        }
        if (upper.includes("COMMERCIAL")) {
          return <LegalBadge key={idx} type="COMMERCIAL" label={cleanLabel} />;
        }
        if (upper.includes("REVIEW") || upper.includes("AMBIGUOUS")) {
          return <LegalBadge key={idx} type="REVIEW" label={cleanLabel} />;
        }
        if (upper.includes("COMPLIANT")) {
          return <LegalBadge key={idx} type="COMPLIANT" label={cleanLabel} />;
        }
        if (upper.includes("ADVOCATE VERIFIED") || upper.includes("SEALED")) {
          return <LegalBadge key={idx} type="SEALED" label={cleanLabel} />;
        }
        if (upper.includes("AWAITING") || upper.includes("AI AUDIT COMPLETED")) {
          return <LegalBadge key={idx} type="PENDING" label={cleanLabel} />;
        }
        if (upper.includes("BDLAWS VERIFIED")) {
          return <LegalBadge key={idx} type="VERIFIED" label="bdlaws verified" />;
        }
      }

      // Link: [text](url)
      if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (match) {
          return (
            <a
              key={idx}
              href={match[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-0.5"
            >
              <span>{match[1]}</span>
              <ExternalLink className="w-2.5 h-2.5 inline" />
            </a>
          );
        }
      }

      // Code: `code`
      if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-[11px] sm:text-xs bg-(--text-primary)/8 border border-(--text-primary)/10 text-pink-600 dark:text-pink-400"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Bold: **bold**
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={idx} className="font-semibold text-(--text-primary)">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Italic: *italic*
      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        return (
          <em key={idx} className="italic text-(--text-primary)/90">
            {part.slice(1, -1)}
          </em>
        );
      }

      return part;
    });
  };

  // Render raw markdown parser
  const renderMarkdownContent = (raw: string) => {
    const lines = raw.split("\n");
    const elements: React.ReactNode[] = [];

    let inTable = false;
    let tableRows: string[][] = [];
    let inCodeBlock = false;
    let codeBlockLang = "";
    let codeLines: string[] = [];

    const flushTable = (key: string) => {
      if (tableRows.length > 0) {
        const headerRow = tableRows[0];
        // filter out separator row (e.g. |---|---|)
        const bodyRows = tableRows.slice(1).filter(
          (row) => !row.every((cell) => /^[:\s-]+$/.test(cell))
        );

        elements.push(
          <div
            key={`table-${key}`}
            className="my-3 overflow-x-auto rounded-xl border border-(--text-primary)/10 print:border print:border-neutral-300 print:rounded-lg print:break-inside-avoid"
          >
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-(--text-primary)/15 bg-(--bg-surface) print:bg-neutral-100 print:border-b-2 print:border-neutral-300">
                  {headerRow.map((cell, idx) => (
                    <th key={idx} className="p-2.5 font-semibold text-(--text-primary) print:text-neutral-900 print:py-2">
                      {formatInlineText(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-(--text-primary)/8 print:divide-neutral-200">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-(--text-primary)/2 transition-colors print:hover:bg-transparent">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2.5 text-(--text-primary)/85 align-middle print:text-neutral-900 print:py-2">
                        {formatInlineText(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    const flushCodeBlock = (key: string) => {
      if (inCodeBlock) {
        if (codeBlockLang && codeBlockLang.toLowerCase() === "diff") {
          elements.push(
            <DiffRedlineBlock
              key={`diff-${key}`}
              lines={[...codeLines]}
              isChat={isChat}
            />
          );
        } else {
          elements.push(
            <CodeBlockItem
              key={`code-${key}`}
              lang={codeBlockLang}
              lines={[...codeLines]}
              isChat={isChat}
            />
          );
        }
        codeLines = [];
        inCodeBlock = false;
        codeBlockLang = "";
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block start/end
      if (line.trim().startsWith("```")) {
        if (!inCodeBlock) {
          flushTable(`before-code-${i}`);
          inCodeBlock = true;
          codeBlockLang = line.trim().slice(3).trim();
          codeLines = [];
        } else {
          flushCodeBlock(`end-code-${i}`);
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // Table line (starts and ends with |)
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        inTable = true;
        const cells = line
          .trim()
          .slice(1, -1)
          .split("|");
        tableRows.push(cells);
        continue;
      } else if (inTable) {
        flushTable(`flush-tbl-${i}`);
      }

      // Empty line
      if (line.trim() === "") {
        elements.push(<div key={`space-${i}`} className={isChat ? "h-1" : "h-2"} />);
        continue;
      }

      // Horizontal Rule
      if (line.trim() === "---" || line.trim() === "***") {
        elements.push(
          <hr
            key={`hr-${i}`}
            className="my-3 border-t border-(--text-primary)/10"
          />
        );
        continue;
      }

      // GitHub Alert Callouts: > [!WARNING], > [!NOTE], > [!TIP], > [!CAUTION], > [!IMPORTANT]
      if (line.trim().startsWith("> [!")) {
        const alertType = line.trim().replace(/^>\s*\[!/, "").replace(/\]\s*$/, "").toUpperCase();
        // Collect following lines with >
        const alertLines: string[] = [];
        let j = i + 1;
        while (j < lines.length && lines[j].trim().startsWith(">")) {
          alertLines.push(lines[j].replace(/^>\s?/, ""));
          j++;
        }
        i = j - 1;

        let icon = <Info className="w-4 h-4 shrink-0" />;
        let alertBorder = "border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200";
        let titleColor = "text-blue-700 dark:text-blue-300";
        let title = "Note";

        if (alertType === "WARNING") {
          icon = <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />;
          alertBorder = "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100";
          titleColor = "text-amber-700 dark:text-amber-400";
          title = "Statutory Warning";
        } else if (alertType === "CAUTION") {
          icon = <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />;
          alertBorder = "border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-100";
          titleColor = "text-rose-700 dark:text-rose-400";
          title = "Statutory Risk";
        } else if (alertType === "TIP") {
          icon = <Sparkles className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />;
          alertBorder = "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100";
          titleColor = "text-emerald-700 dark:text-emerald-400";
          title = "Compliant Guidance";
        } else if (alertType === "IMPORTANT") {
          icon = <AlertCircle className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />;
          alertBorder = "border-purple-500/30 bg-purple-500/10 text-purple-950 dark:text-purple-100";
          titleColor = "text-purple-700 dark:text-purple-400";
          title = "Important Notice";
        }

        elements.push(
          <div
            key={`alert-${i}`}
            className={`my-3 p-3 rounded-xl border-l-4 ${alertBorder} flex flex-col gap-1`}
          >
            <div className={`flex items-center gap-2 font-semibold text-xs uppercase tracking-wider ${titleColor}`}>
              {icon}
              <span>{title}</span>
            </div>
            <div className="text-xs leading-relaxed opacity-90 pl-6">
              {alertLines.map((al, idx) => (
                <p key={idx} className={idx > 0 ? "mt-1" : ""}>
                  {formatInlineText(al)}
                </p>
              ))}
            </div>
          </div>
        );
        continue;
      }

      // Blockquote or Negotiation Strategy: > text
      if (line.trim().startsWith(">")) {
        const bqText = line.trim().replace(/^>\s?/, "");

        // Check for Tactical Negotiation / Counter-Proposal guidance
        if (
          bqText.startsWith("**Tactical Negotiation") ||
          bqText.startsWith("**Tactical Counter-Proposal") ||
          bqText.includes("Tactical Negotiation")
        ) {
          const negoLines: string[] = [bqText];
          let j = i + 1;
          while (j < lines.length && lines[j].trim().startsWith(">") && !lines[j].trim().startsWith("> [!")) {
            negoLines.push(lines[j].trim().replace(/^>\s?/, ""));
            j++;
          }
          i = j - 1;

          elements.push(
            <div
              key={`nego-${i}`}
              className="my-3 p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-100 flex flex-col gap-1.5 print:bg-neutral-50 print:border print:border-neutral-300 print:text-neutral-900 print:rounded-lg print:break-inside-avoid"
            >
              <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-300 print:text-neutral-900">
                <MessageSquare className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400 print:text-neutral-700" />
                <span>Tactical Negotiation Guidance & Counter-Proposal</span>
              </div>
              <div className="text-xs leading-relaxed opacity-95 pl-5.5 font-normal">
                {negoLines.map((nl, nIdx) => (
                  <p key={nIdx} className={nIdx > 0 ? "mt-1.5" : ""}>
                    {formatInlineText(nl.replace(/^\*\*.*?\*\*:?\s*/, ""))}
                  </p>
                ))}
              </div>
            </div>
          );
          continue;
        }

        elements.push(
          <blockquote
            key={`bq-${i}`}
            className={`my-2 pl-3.5 border-l-2 border-(--text-primary)/30 ${
              isChat ? "text-[14.5px] leading-[1.7]" : "text-xs"
            } italic text-(--text-primary)/80`}
          >
            {formatInlineText(bqText)}
          </blockquote>
        );
        continue;
      }

      // Headers: #, ##, ###, ####
      if (line.startsWith("# ")) {
        elements.push(
          <h1
            key={`h1-${i}`}
            className={`${
              isChat ? "text-lg sm:text-xl mt-3.5 mb-1.5" : "text-2xl mt-6 mb-3"
            } font-serif font-bold text-(--text-primary) pb-1 border-b border-(--text-primary)/10`}
          >
            {formatInlineText(line.slice(2))}
          </h1>
        );
        continue;
      }
      if (line.startsWith("## ")) {
        const rawH2 = line.slice(3).trim();
        let h2Icon = null;
        if (/summary/i.test(rawH2)) {
          h2Icon = <Shield className="w-4.5 h-4.5 text-indigo-500 shrink-0 inline mr-2 print:text-neutral-800" />;
        } else if (/matrix|compliance/i.test(rawH2)) {
          h2Icon = <Scale className="w-4.5 h-4.5 text-indigo-500 shrink-0 inline mr-2 print:text-neutral-800" />;
        } else if (/redline|audit|clause/i.test(rawH2)) {
          h2Icon = <FileText className="w-4.5 h-4.5 text-indigo-500 shrink-0 inline mr-2 print:text-neutral-800" />;
        } else if (/missing|protective|gap/i.test(rawH2)) {
          h2Icon = <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0 inline mr-2 print:text-neutral-800" />;
        } else if (/stamp|formalit/i.test(rawH2)) {
          h2Icon = <ScrollText className="w-4.5 h-4.5 text-amber-500 shrink-0 inline mr-2 print:text-neutral-800" />;
        } else if (/advocate|verification|seal/i.test(rawH2)) {
          h2Icon = <ShieldCheck className="w-4.5 h-4.5 text-emerald-500 shrink-0 inline mr-2 print:text-neutral-800" />;
        } else if (/parties|overview/i.test(rawH2)) {
          h2Icon = <Briefcase className="w-4.5 h-4.5 text-neutral-500 shrink-0 inline mr-2 print:text-neutral-800" />;
        }

        elements.push(
          <h2
            key={`h2-${i}`}
            className={`${
              isChat ? "text-base sm:text-[17px] mt-3 mb-1" : "text-lg mt-7 mb-2.5"
            } font-serif font-bold text-(--text-primary) pb-1 border-b border-(--text-primary)/10 flex items-center`}
          >
            {h2Icon}
            <span>{formatInlineText(rawH2)}</span>
          </h2>
        );
        continue;
      }
      if (line.startsWith("### ")) {
        elements.push(
          <h3
            key={`h3-${i}`}
            className={`${
              isChat ? "text-[15px] sm:text-base mt-2.5 mb-1" : "text-sm mt-5 mb-2"
            } font-sans font-bold text-(--text-primary)`}
          >
            {formatInlineText(line.slice(4))}
          </h3>
        );
        continue;
      }
      if (line.startsWith("#### ")) {
        elements.push(
          <h4
            key={`h4-${i}`}
            className={`${
              isChat ? "text-[14.5px] sm:text-[15px] mt-2 mb-0.5" : "text-xs mt-1.5 mb-0.5"
            } font-semibold text-(--text-primary)`}
          >
            {formatInlineText(line.slice(5))}
          </h4>
        );
        continue;
      }

      // Checklists: - [x] or - [ ]
      if (/^-\s*\[([ xX])\]\s*(.*)$/.test(line.trim())) {
        const match = line.trim().match(/^-\s*\[([ xX])\]\s*(.*)$/);
        if (match) {
          const isChecked = match[1].toLowerCase() === "x";
          const checkText = match[2];
          elements.push(
            <div
              key={`check-${i}`}
              className={`flex items-start gap-2.5 my-1.5 ${
                isChat ? "text-[15px] leading-[1.75]" : "text-xs leading-relaxed"
              } text-(--text-primary)/90`}
            >
              <span
                className={`w-4 h-4 rounded ${isChat ? "mt-1.5" : "mt-0.5"} flex items-center justify-center shrink-0 border ${
                  isChecked
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "border-(--text-primary)/30 bg-(--bg-surface)"
                }`}
              >
                {isChecked && <Check className="w-3 h-3 stroke-3" />}
              </span>
              <span className="flex-1">{formatInlineText(checkText)}</span>
            </div>
          );
          continue;
        }
      }

      // Numbered List item: 1. or 1)
      if (/^(\d+)[\.\)]\s+(.*)$/.test(line.trim())) {
        const match = line.trim().match(/^(\d+)[\.\)]\s+(.*)$/);
        if (match) {
          elements.push(
            <div
              key={`ol-${i}`}
              className={`flex items-start gap-2 my-1.5 ${
                isChat
                  ? "text-[15px] leading-[1.75]"
                  : "leading-relaxed text-xs sm:text-[13px]"
              } text-(--text-primary)/90 ml-1`}
            >
              <span
                className={`font-mono font-bold text-(--text-primary)/70 shrink-0 min-w-5 ${
                  isChat ? "text-[13px] mt-[2px]" : "text-[11px]"
                }`}
              >
                {match[1]}.
              </span>
              <div className="flex-1">
                {formatInlineText(match[2])}
              </div>
            </div>
          );
          continue;
        }
      }

      // Bullet List item: - or *
      if (/^[\-\*]\s+(.*)$/.test(line.trim())) {
        const match = line.trim().match(/^[\-\*]\s+(.*)$/);
        if (match) {
          elements.push(
            <div
              key={`li-${i}`}
              className={`flex items-start gap-2.5 my-1.5 ${
                isChat
                  ? "text-[15px] leading-[1.75]"
                  : "leading-relaxed text-xs sm:text-[13px]"
              } text-(--text-primary)/90 ml-1`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full bg-(--text-primary)/50 shrink-0 ${
                  isChat ? "mt-2.5" : "mt-1.5"
                }`}
              />
              <div className="flex-1">
                {formatInlineText(match[1])}
              </div>
            </div>
          );
          continue;
        }
      }

      // Standard Paragraph
      elements.push(
        <p
          key={`p-${i}`}
          className={`${
            isChat ? "text-[15px] leading-[1.75] my-1.5" : "text-xs leading-relaxed my-1"
          } text-(--text-primary)/90`}
        >
          {formatInlineText(line)}
        </p>
      );
    }

    if (inTable) flushTable("end-table");
    if (inCodeBlock) flushCodeBlock("end-code");

    return elements;
  };

  if (isChat) {
    return (
      <div className={`font-sans leading-[1.75] text-[15px] space-y-1.5 ${className}`}>
        {renderMarkdownContent(content)}
      </div>
    );
  }

  return (
    <div
      className={`p-6 md:p-10 rounded-3xl border border-(--text-primary)/10 bg-(--bg-card) shadow-sm font-sans leading-relaxed print:p-0 print:border-none print:shadow-none print:bg-white print:rounded-none ${className}`}
    >
      <div className="max-w-4xl mx-auto space-y-1 print:max-w-none">
        {renderMarkdownContent(content)}
      </div>
    </div>
  );
}