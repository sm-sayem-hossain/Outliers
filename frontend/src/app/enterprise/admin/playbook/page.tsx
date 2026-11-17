"use client";

import React, { useState } from "react";
import { useCompanyData } from "../company-data";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/context/LanguageContext";
import { uploadPlaybook, activatePlaybook, deletePlaybook } from "@/lib/apiServices";
import {
  AdminCard, Eyebrow, StatusPill, MonoChip, AdminButton, SearchInput, EmptyState,
  SectionHeading,
} from "@/components/admin/ui";
import { Upload, Loader2, Download, Layers, BookOpen, CheckCircle2, Trash2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// /enterprise/admin/playbook — active policy hero, version history, rule cards.
// ─────────────────────────────────────────────────────────────────────────────

export default function EnterprisePlaybookPage() {
  const { language } = useLanguage();
  const isBn = language === "bn";
  const { toast, confirm: showConfirm } = useNotification();
  const {
    isLoading, refetchAll, organization, playbooks, activePlaybook, playbookRules,
  } = useCompanyData();

  const [playbookSearch, setPlaybookSearch] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const resp = (await uploadPlaybook(file, file.name.replace(/\.[^.]+$/, ""))) as any;
      const extracted = resp?.rules;
      toast.success(
        isBn
          ? `প্লেবুক সফলভাবে আপলোড হয়েছে! ${extracted?.length ?? 0} টি রুল পাওয়া গেছে।`
          : `Playbook uploaded! ${extracted?.length ?? 0} rules extracted.`
      );
      await refetchAll();
    } catch (err: any) {
      toast.error(err?.message || (isBn ? "আপলোড ব্যর্থ।" : "Failed to upload playbook"));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleActivate = async (pbId: string | number) => {
    try {
      await activatePlaybook(String(pbId));
      toast.success(isBn ? "প্লেবুক সক্রিয় করা হয়েছে।" : "Playbook activated successfully.");
      await refetchAll();
    } catch (err: any) {
      toast.error(err?.message || (isBn ? "সক্রিয়করণ ব্যর্থ।" : "Failed to activate playbook"));
    }
  };

  const handleDelete = async (pbId: string | number) => {
    const ok = await showConfirm({
      title: isBn ? "প্লেবুক মুছে ফেলুন" : "Delete Playbook",
      message: isBn
        ? "আপনি কি নিশ্চিতভাবে এই প্লেবুকটি মুছে ফেলতে চান? এটি ফিরিয়ে আনা যাবে না।"
        : "Are you sure you want to delete this playbook? This cannot be undone.",
      confirmText: isBn ? "মুছে ফেলুন" : "Delete",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await deletePlaybook(String(pbId));
      toast.success(isBn ? "প্লেবুক মুছে ফেলা হয়েছে।" : "Playbook deleted successfully.");
      await refetchAll();
    } catch (err: any) {
      toast.error(err?.message || (isBn ? "মুছে ফেলা ব্যর্থ।" : "Failed to delete playbook"));
    }
  };

  const downloadMarkdown = () => {
    if (!activePlaybook && playbookRules.length === 0) return;
    const title = activePlaybook?.title || "Company Playbook";
    let md = `# ${organization?.name || "Corporate"} Compliance Playbook\n\n`;
    md += `> **Policy Title:** ${title}\n`;
    md += `> **Status:** ACTIVE & ENFORCED IN AI AUDITS\n`;
    md += `> **Total Rules:** ${playbookRules.length} Rules Enforced\n`;
    md += `> **Jurisdiction:** Laws of Bangladesh & Corporate Procurement Standards\n`;
    md += `> **Generated On:** ${new Date().toLocaleDateString()}\n\n---\n\n`;
    md += `## Statutory & Internal Commercial Rules\n\n`;
    playbookRules.forEach((r, idx) => {
      md += `### ${idx + 1}. [${r.clauseTypeEn.toUpperCase()}] ${r.companyRequirementEn}\n\n`;
      md += `- **Rule ID:** \`${r.id}\`\n`;
      md += `- **Strictness:** **${r.strictness.toUpperCase()}**\n`;
      if (r.statutoryReference) md += `- **Legal Ground / Statute:** ${r.statutoryReference}\n`;
      if (r.standardClauseTemplate) {
        md += `\n**Mandatory Sovereign Redline Clause:**\n`;
        md += `> "${r.standardClauseTemplate}"\n\n`;
      }
      md += `\n`;
    });
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}_Policy.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    if (!activePlaybook && playbookRules.length === 0) return;
    const title = activePlaybook?.title || "Company Playbook";
    const data = {
      title,
      enterprise: organization?.name,
      status: activePlaybook?.is_active ? "ACTIVE" : "INACTIVE",
      total_rules: playbookRules.length,
      exported_at: new Date().toISOString(),
      rules: playbookRules.map((r, i) => ({
        rule_id: r.id,
        number: i + 1,
        category: r.clauseTypeEn,
        statute_reference: r.statutoryReference,
        rule_description: r.companyRequirementEn,
        strictness: r.strictness,
        suggested_redline: r.standardClauseTemplate,
        is_active: r.isActive,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}_rules.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="space-y-4"><div className="h-40 rounded-2xl animate-pulse bg-(--text-primary)/8" /></div>;

  const filteredRules = playbookRules.filter((r) => {
    if (!playbookSearch.trim()) return true;
    const q = playbookSearch.toLowerCase();
    return (
      r.clauseTypeEn.toLowerCase().includes(q) ||
      r.clauseTypeBn.toLowerCase().includes(q) ||
      r.companyRequirementEn.toLowerCase().includes(q) ||
      r.statute.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        title={isBn ? "কোম্পানি প্লেবুক" : "Company Playbook"}
        sub={isBn ? "কর্পোরেট কমপ্লায়েন্স নীতি আপলোড ও পরিচালনা করুন" : "Upload and govern your corporate compliance policy"}
      />

      {/* Active playbook hero */}
      <AdminCard className="p-6 sm:p-8 space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <StatusPill
                label={playbookRules.length > 0
                  ? (isBn ? "সক্রিয় ও প্রয়োগরত" : "Active & Enforced in All Audits")
                  : (isBn ? "কোনো প্লেবুক সক্রিয় নেই" : "No Active Playbook")}
                tone={playbookRules.length > 0 ? "good" : "neutral"}
                pulse={playbookRules.length > 0}
              />
              {activePlaybook?.created_at && (
                <MonoChip>
                  {isBn ? "আপলোড" : "UPLOADED"}: {new Date(activePlaybook.created_at).toLocaleDateString()}
                </MonoChip>
              )}
              {playbooks.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-xs font-semibold text-(--text-primary) hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isBn ? `সকল ভার্সন (${playbooks.length})` : `All Versions (${playbooks.length})`}</span>
                </button>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-serif font-bold text-(--text-primary) tracking-tight">
              {activePlaybook?.title || (isBn ? "কর্পোরেট কমপ্লায়েন্স প্লেবুক" : "Corporate Compliance Playbook")}
            </h3>

            <p className="text-xs text-(--text-muted) max-w-2xl leading-relaxed">
              {isBn
                ? `টিমের যেকোনো সদস্য চুক্তিপত্র অডিট করার সময় বাংলাদেশ আইনের পাশাপাশি এই প্লেবুকের ${playbookRules.length}টি সংবিধিবদ্ধ নীতি স্বয়ংক্রিয়ভাবে বলবৎ হবে।`
                : `Whenever team members upload agreements, Advotech Copilot automatically balances Bangladesh Law against these ${playbookRules.length} corporate procurement rules.`}
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {playbookRules.length > 0 && (
              <>
                <AdminButton variant="outline" onClick={downloadMarkdown} title={isBn ? "পলিসি ডকুমেন্ট হিসেবে" : "Download as formatted policy doc"}>
                  <Download className="w-3.5 h-3.5" /> {isBn ? "পলিসি (.md)" : "Policy (.md)"}
                </AdminButton>
                <AdminButton variant="outline" onClick={downloadJson} title={isBn ? "র রুলস JSON ডাটা" : "Download raw rules JSON"}>
                  <Download className="w-3.5 h-3.5" /> {isBn ? "রুলস JSON" : "Rules JSON"}
                </AdminButton>
              </>
            )}
            <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all duration-200 bg-(--text-primary) text-(--bg-primary) hover:opacity-90 shadow-sm active:scale-[0.98]">
              {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>
                {isUploading
                  ? (isBn ? "আপলোড হচ্ছে..." : "Uploading...")
                  : (isBn ? "প্লেবুক আপলোড" : "Upload / Update Playbook")}
              </span>
              <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleUpload} disabled={isUploading} />
            </label>
          </div>
        </div>

        {/* Version history */}
        {showHistory && playbooks.length > 0 && (
          <div className="pt-4 border-t border-(--text-primary)/10 space-y-3">
            <div className="flex items-center justify-between">
              <Eyebrow className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {isBn ? "আপলোডকৃত প্লেবুক হিস্টোরি" : "UPLOADED PLAYBOOK VERSIONS"}
              </Eyebrow>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="text-xs text-(--text-muted) hover:text-(--text-primary) cursor-pointer"
              >
                {isBn ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
            <div className="divide-y divide-(--text-primary)/5 rounded-2xl border border-(--text-primary)/10 bg-(--bg-surface) overflow-hidden">
              {playbooks.map((pb) => (
                <div key={pb.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-(--text-primary) truncate">{pb.title}</span>
                      {pb.is_active && <StatusPill label="ACTIVE" tone="good" />}
                    </div>
                    <p className="text-[11px] text-(--text-muted)">
                      {pb.rule_count} {isBn ? "টি রুল" : "rules"} · {new Date(pb.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!pb.is_active && (
                      <AdminButton variant="outline" onClick={() => handleActivate(pb.id)}>
                        {isBn ? "সক্রিয় করুন" : "Set Active"}
                      </AdminButton>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(pb.id)}
                      aria-label={isBn ? "মুছে ফেলুন" : "Delete"}
                      className="p-1.5 rounded-lg text-(--status-risk-high) hover:bg-(--status-risk-high)/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </AdminCard>

      {/* Rules search */}
      {playbookRules.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-(--text-primary) flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-(--text-muted)" />
              <span>{isBn ? "সংরক্ষিত কমপ্লায়েন্স রুলস" : "Enforced Compliance Rules"}</span>
            </h4>
            <MonoChip>{playbookRules.length}</MonoChip>
          </div>
          <SearchInput
            value={playbookSearch}
            onChange={setPlaybookSearch}
            placeholder={isBn ? "রুল বা ক্যাটাগরি সার্চ করুন..." : "Filter rules by category or keyword..."}
          />
        </div>
      )}

      {/* Rules */}
      <div className="grid grid-cols-1 gap-4">
        {playbookRules.length === 0 && (
          <EmptyState
            message={isBn ? "কোনো প্লেবুক রুল সংরক্ষিত নেই" : "No Playbook Rules Found"}
            hint={isBn
              ? "আপনার কোম্পানির স্ট্যান্ডার্ড গাইডলাইন ডকুমেন্ট (.pdf বা .docx) আপলোড করুন — AI স্বয়ংক্রিয়ভাবে রুলগুলো সাজিয়ে নেবে।"
              : "Upload your corporate policy doc (.pdf, .docx) to auto-extract and enforce procurement guidelines across all team member audits."}
          />
        )}

        {filteredRules.map((rule, idx) => (
          <AdminCard key={rule.id} className={`p-5 hover:border-(--text-primary)/20 transition-colors ${!rule.isActive ? "opacity-60" : ""}`}>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <MonoChip>#{idx + 1}</MonoChip>
                <MonoChip>{rule.id}</MonoChip>
                <h4 className="text-sm font-bold text-(--text-primary)">{isBn ? rule.clauseTypeBn : rule.clauseTypeEn}</h4>
                {rule.statute && (
                  <span className="text-[11px] font-semibold text-(--text-muted) font-mono">
                    {rule.statute} {rule.statutoryReference && rule.statutoryReference !== rule.statute ? `(${rule.statutoryReference})` : ""}
                  </span>
                )}
                <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  rule.strictness === "mandatory"
                    ? "border-(--status-risk-high)/30 text-(--status-risk-high)"
                    : "border-(--text-primary)/15 text-(--text-muted)"
                }`}>
                  {rule.strictness}
                </span>
              </div>

              <p className="text-xs text-(--text-primary)/90 leading-relaxed">
                {isBn ? rule.companyRequirementBn : rule.companyRequirementEn}
              </p>

              {rule.standardClauseTemplate && (
                <div className="p-3.5 rounded-xl bg-(--bg-surface) border border-(--text-primary)/10">
                  <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-(--text-muted) mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isBn ? "বাধ্যতামূলক স্ট্যান্ডার্ড রেডলাইন টেমপ্লেট:" : "MANDATED STANDARD REDLINE TEMPLATE:"}
                  </p>
                  <p className="text-xs font-mono text-(--text-muted) leading-relaxed italic">
                    "{rule.standardClauseTemplate}"
                  </p>
                </div>
              )}
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
