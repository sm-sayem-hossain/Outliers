"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Save,
  RefreshCw,
  X,
  Clock,
  History,
  Rocket,
  FileEdit,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import {
  AdminCard,
  SectionHeading,
  AdminButton,
  Eyebrow,
  HAIRLINE,
} from "@/components/admin/ui";

/* ──────────────── types mirroring backend payloads ──────────────── */

interface DocsConfigState {
  visibility: "ON" | "OFF" | "SCHEDULED";
  schedule_start: string;
  schedule_end: string;
  updated_at?: string | null;
  updated_by?: string | null;
}

interface TeamMember {
  id: number;
  full_name: string;
  role: string;
  email?: string;
  image_url?: string;
  bio?: string;
  linkedin_url?: string;
  github_url?: string;
  display_order: number;
  is_active?: boolean;
}

interface PitchSection {
  headline?: string | null;
  points?: string[];
}

interface FeatureRow {
  name: string;
  status: string;
  note?: string;
}

interface WorkContent {
  pitch_deck: {
    company?: string;
    team_name?: string;
    tagline?: string;
    one_liner?: string;
    section_order?: string[];
    problem?: PitchSection;
    solution?: PitchSection;
    why_now?: PitchSection;
    product_demo?: PitchSection;
    market?: PitchSection;
    business_model?: PitchSection;
    traction?: PitchSection;
    competition?: PitchSection;
    unique_advantage?: PitchSection;
    go_to_market?: PitchSection;
    vision?: PitchSection;
    the_ask?: string;
  };
  tech_docs: {
    feature_matrix?: FeatureRow[];
    [key: string]: unknown;
  };
  roadmap?: { short_term?: string[]; mid_term?: string[]; long_term?: string[] };
  changelog?: { date?: string; version?: string; changes?: string[] }[];
}

interface VersionRow {
  index: number;
  at?: string;
  by?: string;
}

const DEFAULT_CONFIG: DocsConfigState = {
  visibility: "SCHEDULED",
  schedule_start: "2027-06-10T00:00",
  schedule_end: "2027-06-14T23:59",
};

const PITCH_KEYS: { key: keyof WorkContent["pitch_deck"]; label: string }[] = [
  { key: "problem", label: "Problem" },
  { key: "solution", label: "Solution" },
  { key: "why_now", label: "Why Now" },
  { key: "product_demo", label: "Product Demo" },
  { key: "market", label: "Market Opportunity" },
  { key: "business_model", label: "Business Model" },
  { key: "traction", label: "Traction" },
  { key: "competition", label: "Competition" },
  { key: "unique_advantage", label: "Unique Advantage" },
  { key: "go_to_market", label: "Go-To-Market" },
  { key: "vision", label: "Vision" },
];

const inputCls =
  "w-full px-3 py-1.5 rounded-xl bg-(--bg-surface) border border-(--text-primary)/10 text-(--text-primary) focus:outline-none focus:ring-1 focus:ring-(--text-primary)";

export default function AdminDocsPage() {
  const [config, setConfig] = useState<DocsConfigState>(DEFAULT_CONFIG);
  const [durationHours, setDurationHours] = useState<string>("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Content studio state
  const [work, setWork] = useState<WorkContent | null>(null);
  const [draftInfo, setDraftInfo] = useState<{ saved_at?: string; saved_by?: string } | null>(null);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [studioBusy, setStudioBusy] = useState<"idle" | "draft" | "publish">("idle");

  // Modal State for team members
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberFormData, setMemberFormData] = useState<Partial<TeamMember>>({});
  const [savingMember, setSavingMember] = useState(false);

  const API_BASE = useMemo(() => {
    if (typeof window !== "undefined") {
      return process.env.NEXT_PUBLIC_API_URL || "https://legal-copilot-backend-088i.onrender.com";
    }
    return "https://legal-copilot-backend-088i.onrender.com";
  }, []);

  const getAuthToken = (): string | null => {
    try {
      // 1. Real token from standard login (TOKEN_KEY in auth.ts)
      const realToken = localStorage.getItem("contractmind_token");
      if (realToken) return realToken;

      // 2. Demo session token
      const stored = localStorage.getItem("app_auth_v2");
      if (stored) {
        const parsed = JSON.parse(stored);
        const t = parsed.token || parsed.access_token || null;
        if (t) return t;
      }

      // 3. Standalone docs token
      const docsToken = localStorage.getItem("docs_admin_token");
      if (docsToken) return docsToken;

      return null;
    } catch {
      return null;
    }
  };

  const authedHeaders = (json = true): Record<string, string> => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (json) headers["Content-Type"] = "application/json";
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const loadStudio = async (preferCurrentWork = false) => {
    try {
      const [contentRes, draftRes, versionsRes] = await Promise.all([
        fetch(`${API_BASE}/api/docs/content`, { headers: authedHeaders(false) }),
        fetch(`${API_BASE}/api/docs/draft`, { headers: authedHeaders(false) }),
        fetch(`${API_BASE}/api/docs/versions`, { headers: authedHeaders(false) }),
      ]);

      let liveData: WorkContent = {
        pitch_deck: {},
        tech_docs: {},
        roadmap: {},
        changelog: [],
      };
      if (contentRes.ok) {
        const data = await contentRes.json();
        const pDeck = data.pitch_deck ?? {};
        if (!pDeck.company || pDeck.company.includes("ContractMind")) {
          pDeck.company = "Advotech Copilot";
        }
        liveData = {
          pitch_deck: pDeck,
          tech_docs: data.tech_docs ?? {},
          roadmap: data.roadmap ?? {},
          changelog: data.changelog ?? [],
        };
      }

      let draftContent: WorkContent | null = null;
      if (draftRes.ok) {
        const d = await draftRes.json();
        const draft = d?.draft;
        if (draft && draft.saved_at) {
          const dPitch = draft.pitch_deck
            ? { ...liveData.pitch_deck, ...draft.pitch_deck }
            : liveData.pitch_deck;
          if (!dPitch.company || dPitch.company.includes("ContractMind")) {
            dPitch.company = "Advotech Copilot";
          }
          setDraftInfo(draft);
          draftContent = {
            pitch_deck: dPitch,
            tech_docs: draft.tech_docs
              ? { ...liveData.tech_docs, ...draft.tech_docs }
              : liveData.tech_docs,
            roadmap: draft.roadmap
              ? { ...liveData.roadmap, ...draft.roadmap }
              : liveData.roadmap,
            changelog: draft.changelog ?? liveData.changelog,
          };
        } else {
          setDraftInfo(null);
        }
      }

      if (versionsRes.ok) {
        const v = await versionsRes.json();
        if (Array.isArray(v)) setVersions(v);
      }

      if (!preferCurrentWork) {
        setWork(draftContent ?? liveData);
      }
    } catch (err) {
      console.error("Failed to load content studio data:", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const configRes = await fetch(`${API_BASE}/api/docs/config`, { headers: authedHeaders(false) });
      if (configRes.ok) {
        const data = await configRes.json();
        setConfig({
          visibility: data.visibility || "SCHEDULED",
          schedule_start: data.schedule_start ? data.schedule_start.slice(0, 16) : DEFAULT_CONFIG.schedule_start,
          schedule_end: data.schedule_end ? data.schedule_end.slice(0, 16) : DEFAULT_CONFIG.schedule_end,
          updated_at: data.updated_at,
          updated_by: data.updated_by,
        });
      }

      const teamRes = await fetch(`${API_BASE}/api/docs/admin/team`, { headers: authedHeaders(false) });
      if (teamRes.ok) {
        const teamData = await teamRes.json();
        if (Array.isArray(teamData)) {
          setTeamMembers(teamData);
        }
      } else {
        const publicTeamRes = await fetch(`${API_BASE}/api/docs/team`);
        if (publicTeamRes.ok) {
          const publicData = await publicTeamRes.json();
          if (Array.isArray(publicData)) setTeamMembers(publicData);
        }
      }

      await loadStudio();
    } catch (err) {
      console.error("Failed to load docs admin data:", err);
      showToast("Failed to load latest configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE]);

  /* ─────────── config save (visibility / schedule / duration) ─────────── */

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const body: Record<string, unknown> = {
        visibility: config.visibility,
        schedule_start: config.schedule_start ? new Date(config.schedule_start).toISOString() : null,
        schedule_end: config.schedule_end ? new Date(config.schedule_end).toISOString() : null,
      };
      const dur = parseFloat(durationHours);
      if (!isNaN(dur) && dur > 0) body.duration_hours = dur; // end = start + duration

      const res = await fetch(`${API_BASE}/api/docs/config`, {
        method: "PUT",
        headers: authedHeaders(),
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        showToast("Visibility, schedule & duration saved successfully!");
        setDurationHours("");
        if (data.updated_at) setConfig((prev) => ({ ...prev, updated_at: data.updated_at }));
        if (data.schedule_end) setConfig((prev) => ({ ...prev, schedule_end: data.schedule_end.slice(0, 16) }));
      } else {
        const err = await res.json();
        showToast(err.detail || "Failed to update configuration", "error");
      }
    } catch {
      showToast("Network error saving configuration", "error");
    } finally {
      setSavingConfig(false);
    }
  };

  /* ─────────── content studio: draft / publish / versions ─────────── */

  const buildDraftPayload = () => {
    if (!work) return null;
    return {
      pitch_deck: work.pitch_deck,
      tech_docs: work.tech_docs,
      roadmap: work.roadmap ?? {},
      changelog: work.changelog ?? [],
    };
  };

  const handleSaveDraft = async () => {
    const payload = buildDraftPayload();
    if (!payload) return;
    if (!getAuthToken()) {
      showToast("Admin session missing. Please sign in as Admin first.", "error");
      return;
    }
    setStudioBusy("draft");
    try {
      const res = await fetch(`${API_BASE}/api/docs/draft`, {
        method: "PUT",
        headers: authedHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast("Draft saved! (Note: Draft is private. Click 'Publish Live' to push to /docs)");
        setDraftInfo({ saved_at: d.saved_at || new Date().toISOString() });
        await loadStudio(true);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Failed to save draft", "error");
      }
    } catch {
      showToast("Network error saving draft", "error");
    } finally {
      setStudioBusy("idle");
    }
  };

  const handlePublish = async () => {
    const payload = buildDraftPayload();
    if (!payload) return;
    if (!getAuthToken()) {
      showToast("Admin session missing. Please sign in as Admin first.", "error");
      return;
    }
    setStudioBusy("publish");
    try {
      // keep the draft in sync with what is published, then publish
      const draftRes = await fetch(`${API_BASE}/api/docs/draft`, {
        method: "PUT",
        headers: authedHeaders(),
        body: JSON.stringify(payload),
      });
      if (!draftRes.ok) {
        const draftErr = await draftRes.json().catch(() => ({}));
        throw new Error(draftErr.detail || "Draft save failed before publish");
      }

      const res = await fetch(`${API_BASE}/api/docs/publish`, {
        method: "POST",
        headers: authedHeaders(),
      });
      if (res.ok) {
        const d = await res.json();
        showToast(`Published to /docs! ${d.versions ?? "?"} versions recorded.`);
        await loadStudio(false);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Failed to publish", "error");
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Network error publishing", "error");
    } finally {
      setStudioBusy("idle");
    }
  };

  const handleDiscardDraft = async () => {
    if (!confirm("Discard the saved draft? Live content stays untouched.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/docs/draft`, {
        method: "DELETE",
        headers: authedHeaders(false),
      });
      if (res.ok) {
        showToast("Draft discarded — reset to live content.");
        await loadStudio(false);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Failed to discard draft", "error");
      }
    } catch {
      showToast("Network error discarding draft", "error");
    }
  };

  const handleRestoreVersion = async (index: number) => {
    if (!confirm(`Restore version ${index}? Current live content will be replaced (a new version records this rollback).`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/docs/versions/${index}/restore`, {
        method: "POST",
        headers: authedHeaders(),
      });
      if (res.ok) {
        showToast(`Restored version ${index}.`);
        await loadStudio();
      } else {
        showToast("Failed to restore version", "error");
      }
    } catch {
      showToast("Network error restoring version", "error");
    }
  };

  /* ─────────── content studio field updaters ─────────── */

  const setPitchField = (field: string, value: unknown) =>
    setWork((prev) =>
      prev ? { ...prev, pitch_deck: { ...prev.pitch_deck, [field]: value } } : prev
    );

  const setSection = (key: string, field: "headline" | "points", value: string) =>
    setWork((prev) => {
      if (!prev) return prev;
      const current = (prev.pitch_deck as Record<string, unknown>)[key] as PitchSection | undefined;
      const updated =
        field === "points"
          ? { ...current, points: value.split("\n").map((s) => s.trim()).filter(Boolean) }
          : { ...current, headline: value };
      return {
        ...prev,
        pitch_deck: { ...prev.pitch_deck, [key]: updated },
      };
    });

  const setRoadmapField = (field: "short_term" | "mid_term" | "long_term", value: string) =>
    setWork((prev) =>
      prev
        ? {
            ...prev,
            roadmap: {
              ...prev.roadmap,
              [field]: value.split("\n").map((s) => s.trim()).filter(Boolean),
            },
          }
        : prev
    );

  const currentPitchOrder = useMemo(() => {
    const stored = work?.pitch_deck?.section_order;
    const defaultKeys = PITCH_KEYS.map((k) => k.key as string);
    if (!stored || !Array.isArray(stored) || stored.length === 0) return defaultKeys;
    const valid = stored.filter((k) => defaultKeys.includes(k));
    const missing = defaultKeys.filter((k) => !valid.includes(k));
    return [...valid, ...missing];
  }, [work?.pitch_deck?.section_order]);

  const moveSection = (key: string, direction: "up" | "down") => {
    const order = [...currentPitchOrder];
    const index = order.indexOf(key);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= order.length) return;
    const temp = order[index];
    order[index] = order[targetIndex];
    order[targetIndex] = temp;
    setPitchField("section_order", order);
  };

  /* ─────────── team CRUD (unchanged behaviour) ─────────── */

  const openAddMemberModal = () => {
    setEditingMember(null);
    setMemberFormData({
      full_name: "",
      role: "",
      email: "",
      image_url: "",
      bio: "",
      linkedin_url: "",
      github_url: "",
      display_order: teamMembers.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditMemberModal = (member: TeamMember) => {
    setEditingMember(member);
    setMemberFormData({
      full_name: member.full_name,
      role: member.role,
      email: member.email || "",
      image_url: member.image_url || "",
      bio: member.bio || "",
      linkedin_url: member.linkedin_url || "",
      github_url: member.github_url || "",
      display_order: member.display_order,
    });
    setIsModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberFormData.full_name || !memberFormData.role) {
      showToast("Name and Role are required", "error");
      return;
    }

    setSavingMember(true);
    try {
      if (editingMember) {
        const res = await fetch(`${API_BASE}/api/docs/team/${editingMember.id}`, {
          method: "PUT",
          headers: authedHeaders(),
          body: JSON.stringify(memberFormData),
        });
        if (res.ok) {
          showToast(`Updated ${memberFormData.full_name}`);
          setIsModalOpen(false);
          fetchData();
        } else {
          showToast("Failed to update member", "error");
        }
      } else {
        const res = await fetch(`${API_BASE}/api/docs/team`, {
          method: "POST",
          headers: authedHeaders(),
          body: JSON.stringify(memberFormData),
        });
        if (res.ok) {
          showToast(`Added ${memberFormData.full_name}`);
          setIsModalOpen(false);
          fetchData();
        } else {
          showToast("Failed to add member", "error");
        }
      }
    } catch {
      showToast("Network error saving team member", "error");
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = async (member: TeamMember) => {
    if (!confirm(`Are you sure you want to remove ${member.full_name}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/docs/team/${member.id}`, {
        method: "DELETE",
        headers: authedHeaders(false),
      });
      if (res.ok) {
        showToast(`Removed ${member.full_name}`);
        setTeamMembers((prev) => prev.filter((m) => m.id !== member.id));
      } else {
        showToast("Failed to delete member", "error");
      }
    } catch {
      showToast("Error deleting member", "error");
    }
  };

  /* ─────────── render ─────────── */

  const features = work?.tech_docs?.feature_matrix ?? [];
  const changelog = work?.changelog ?? [];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Toast */}
      {feedbackMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold ${
            feedbackMsg.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Eyebrow>LIVE DOCUMENTATION CONTROLLER</Eyebrow>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-(--text-primary)">
            Docs, Pitch Deck &amp; Team Manager
          </h1>
          <p className="text-xs text-(--text-muted) mt-1">
            Access control, scheduling, content editing with draft/publish + versioning, and team
            roster for /docs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/docs"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-(--text-primary) text-(--bg-primary) hover:opacity-90 shadow-sm"
          >
            <span>Preview /docs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <AdminButton onClick={fetchData} variant="outline" disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </AdminButton>
        </div>
      </div>

      {/* ── Access control + duration ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <AdminCard className="p-6 space-y-6">
            <SectionHeading
              title="Access Control & Publishing Schedule"
              sub="Control public availability for hackathon evaluators, investors, and general audience."
            />

            {/* Visibility */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-(--text-primary) uppercase tracking-wider">
                Visibility Mode
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    value: "ON",
                    label: "Public (ON)",
                    desc: "Accessible to anyone at /docs",
                    tone: "border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
                    activeTone: "ring-2 ring-emerald-500 bg-emerald-500/10 font-bold",
                  },
                  {
                    value: "SCHEDULED",
                    label: "Scheduled",
                    desc: "Accessible only in window",
                    tone: "border-blue-500/40 bg-blue-500/5 text-blue-700 dark:text-blue-400",
                    activeTone: "ring-2 ring-blue-500 bg-blue-500/10 font-bold",
                  },
                  {
                    value: "OFF",
                    label: "Private (OFF)",
                    desc: "Returns 403 Unavailable",
                    tone: "border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400",
                    activeTone: "ring-2 ring-rose-500 bg-rose-500/10 font-bold",
                  },
                ].map((mode) => {
                  const isSelected = config.visibility === mode.value;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() => setConfig((prev) => ({ ...prev, visibility: mode.value as DocsConfigState["visibility"] }))}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${mode.tone} ${
                        isSelected ? mode.activeTone : "opacity-75 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{mode.label}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <p className="text-[10px] mt-1 opacity-80 leading-tight">{mode.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule + duration */}
            <div className={`space-y-4 pt-4 border-t ${HAIRLINE} ${config.visibility !== "SCHEDULED" ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-(--text-primary) uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  Scheduled Availability Window
                </span>
                <span className="text-[11px] font-mono text-(--text-muted)">
                  Default: June 10 &ndash; June 14
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-(--text-muted)">Start Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={config.schedule_start}
                    onChange={(e) => setConfig((prev) => ({ ...prev, schedule_start: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-(--text-muted)">End Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={config.schedule_end}
                    onChange={(e) => setConfig((prev) => ({ ...prev, schedule_end: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-(--text-muted)">
                    or Duration (hours)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="e.g. 96"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <p className="text-[11px] text-(--text-muted) leading-relaxed">
                When set to <strong>Scheduled</strong>, visitors outside this window see a restricted
                notice. Duration (if set) overrides the end time: end = start + duration. Admins can
                always preview anytime.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[10px] text-(--text-muted)">
                {config.updated_at ? `Last saved: ${new Date(config.updated_at).toLocaleTimeString()}` : ""}
              </span>
              <AdminButton variant="solid" onClick={handleSaveConfig} disabled={savingConfig} className="gap-2">
                <Save className="w-3.5 h-3.5" />
                <span>{savingConfig ? "Saving..." : "Save Visibility Settings"}</span>
              </AdminButton>
            </div>
          </AdminCard>
        </div>

        {/* Status card */}
        <div className="lg:col-span-5 space-y-6">
          <AdminCard className="p-6 space-y-4">
            <SectionHeading title="Live Endpoint Status" sub="Telemetry for the public /docs route" />
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-(--bg-surface) border border-(--text-primary)/10 flex items-center justify-between">
                <span className="text-(--text-muted)">Current Mode:</span>
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600">
                  {config.visibility}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-(--bg-surface) border border-(--text-primary)/10 flex items-center justify-between">
                <span className="text-(--text-muted)">Public URL:</span>
                <Link
                  href="/docs"
                  target="_blank"
                  className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>/docs</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div className="p-3 rounded-xl bg-(--bg-surface) border border-(--text-primary)/10 flex items-center justify-between">
                <span className="text-(--text-muted)">Team Roster Count:</span>
                <span className="font-mono font-bold text-(--text-primary)">{teamMembers.length} Members</span>
              </div>
              <div className="p-3 rounded-xl bg-(--bg-surface) border border-(--text-primary)/10 flex items-center justify-between">
                <span className="text-(--text-muted)">Saved Versions:</span>
                <span className="font-mono font-bold text-(--text-primary)">{versions.length}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Judging &amp; Evaluation Tip</span>
              </div>
              <p className="leading-relaxed">
                During competition judging, leave mode set to <strong>ON</strong> or ensure the
                schedule covers the evaluation date. Content edits go live only when you press
                Publish.
              </p>
            </div>
          </AdminCard>
        </div>
      </div>

      {/* ── Content Studio: draft / publish / versioning ── */}
      <AdminCard className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-(--text-primary)/10">
          <div>
            <h2 className="text-sm font-serif font-bold text-(--text-primary) flex items-center gap-2">
              <FileEdit className="w-4 h-4" />
              Content Studio — Draft &amp; Publish
            </h2>
            <p className="text-[11px] text-(--text-muted) mt-0.5">
              Edit the pitch deck, feature matrix, roadmap and changelog. Save as draft first;
              publish to make it live on /docs.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {draftInfo?.saved_at ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                Draft saved {new Date(draftInfo.saved_at).toLocaleString()}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-(--bg-surface) text-(--text-muted) border border-(--text-primary)/10">
                No draft
              </span>
            )}
          </div>
        </div>

        {/* Informative banner explaining draft vs live */}
        {draftInfo?.saved_at && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Unpublished Draft Active:</strong> You have an active draft saved on{" "}
                {new Date(draftInfo.saved_at).toLocaleTimeString()}. These changes are <strong>saved privately</strong> and are <em>not live on /docs yet</em>. Click <strong>Publish Live</strong> to make them visible on the public /docs page.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <AdminButton
                variant="solid"
                onClick={handlePublish}
                disabled={studioBusy !== "idle"}
                className="gap-1.5 text-xs py-1.5 px-3"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>{studioBusy === "publish" ? "Publishing…" : "Publish Live Now"}</span>
              </AdminButton>
              <AdminButton
                variant="outline"
                onClick={handleDiscardDraft}
                className="text-xs py-1.5 px-3"
              >
                <X className="w-3.5 h-3.5" />
                <span>Discard</span>
              </AdminButton>
            </div>
          </div>
        )}

        {!work ? (
          <div className="py-8 text-center text-xs text-(--text-muted)">
            {loading ? "Loading content…" : "Content unavailable — check admin token / backend."}
          </div>
        ) : (
          <>
            {/* Pitch basics */}
            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">
                Pitch Deck Basics
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    ["company", "Company"],
                    ["team_name", "Team name"],
                    ["tagline", "Tagline"],
                    ["one_liner", "One-liner"],
                    ["the_ask", "The Ask"],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field} className="space-y-1">
                    <label className="text-[11px] font-semibold text-(--text-primary)">{label}</label>
                    <input
                      className={inputCls}
                      value={String((work.pitch_deck as Record<string, unknown>)[field] ?? "")}
                      onChange={(e) => setPitchField(field, e.target.value || null)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Pitch sections & section reordering */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">
                  Pitch Sections &amp; Display Order
                </p>
                <button
                  type="button"
                  onClick={() => setPitchField("section_order", PITCH_KEYS.map((k) => k.key as string))}
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Reset order to default
                </button>
              </div>

              {/* Drag/Drop & Click Reorder Bar */}
              <div className="p-3.5 rounded-xl bg-(--bg-surface) border border-(--text-primary)/10 space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-(--text-muted)">
                  <GripVertical className="w-3.5 h-3.5 text-blue-500" />
                  <span>Drag chips or use arrow buttons to reorder sections on /docs:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentPitchOrder.map((key, i) => {
                    const item = PITCH_KEYS.find((k) => k.key === key);
                    if (!item) return null;
                    return (
                      <div
                        key={key}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", key);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const movedKey = e.dataTransfer.getData("text/plain");
                          if (!movedKey || movedKey === key) return;
                          const order = [...currentPitchOrder];
                          const from = order.indexOf(movedKey);
                          const to = order.indexOf(key);
                          if (from !== -1 && to !== -1) {
                            order.splice(to, 0, order.splice(from, 1)[0]);
                            setPitchField("section_order", order);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-(--bg-card) border border-(--text-primary)/15 cursor-grab active:cursor-grabbing hover:border-blue-500/50 transition-all select-none"
                      >
                        <span className="font-mono text-[10px] opacity-60">{String(i + 1).padStart(2, "0")}</span>
                        <span>{item.label}</span>
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={() => moveSection(key, "up")}
                            className="p-0.5 hover:text-blue-500 disabled:opacity-20 cursor-pointer"
                            title="Move section up"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={i === currentPitchOrder.length - 1}
                            onClick={() => moveSection(key, "down")}
                            className="p-0.5 hover:text-blue-500 disabled:opacity-20 cursor-pointer"
                            title="Move section down"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section Editors rendered in custom order */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {currentPitchOrder.map((key, i) => {
                  const item = PITCH_KEYS.find((k) => k.key === key);
                  if (!item) return null;
                  const sec = (work.pitch_deck as Record<string, unknown>)[key] as
                    | PitchSection
                    | undefined;
                  return (
                    <div
                      key={key}
                      className="p-4 rounded-xl bg-(--bg-surface) border border-(--text-primary)/10 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-(--text-primary)/10 text-(--text-primary)">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-xs font-bold text-(--text-primary)">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={() => moveSection(key, "up")}
                            className="p-1 rounded hover:bg-(--text-primary)/10 text-(--text-muted) hover:text-(--text-primary) disabled:opacity-20 cursor-pointer"
                            title="Move section up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={i === currentPitchOrder.length - 1}
                            onClick={() => moveSection(key, "down")}
                            className="p-1 rounded hover:bg-(--text-primary)/10 text-(--text-muted) hover:text-(--text-primary) disabled:opacity-20 cursor-pointer"
                            title="Move section down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <input
                        className={inputCls}
                        placeholder="Headline"
                        value={sec?.headline ?? ""}
                        onChange={(e) => setSection(key, "headline", e.target.value)}
                      />
                      <textarea
                        rows={4}
                        className={`${inputCls} font-mono text-[11px]`}
                        placeholder={"One point per line"}
                        value={(sec?.points ?? []).join("\n")}
                        onChange={(e) => setSection(key, "points", e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feature matrix */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">
                  Feature Matrix
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setWork((prev) =>
                      prev
                        ? {
                            ...prev,
                            tech_docs: {
                              ...prev.tech_docs,
                              feature_matrix: [
                                ...(prev.tech_docs.feature_matrix ?? []),
                                { name: "", status: "PLANNED", note: "" },
                              ],
                            },
                          }
                        : prev
                    )
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add feature
                </button>
              </div>
              <div className="space-y-2">
                {features.map((f, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      className={`${inputCls} col-span-4`}
                      placeholder="Feature name"
                      value={f.name}
                      onChange={(e) =>
                        setWork((prev) => {
                          if (!prev) return prev;
                          const rows = [...(prev.tech_docs.feature_matrix ?? [])];
                          rows[i] = { ...rows[i], name: e.target.value };
                          return { ...prev, tech_docs: { ...prev.tech_docs, feature_matrix: rows } };
                        })
                      }
                    />
                    <select
                      className={`${inputCls} col-span-2`}
                      value={f.status}
                      onChange={(e) =>
                        setWork((prev) => {
                          if (!prev) return prev;
                          const rows = [...(prev.tech_docs.feature_matrix ?? [])];
                          rows[i] = { ...rows[i], status: e.target.value };
                          return { ...prev, tech_docs: { ...prev.tech_docs, feature_matrix: rows } };
                        })
                      }
                    >
                      <option value="LIVE">LIVE</option>
                      <option value="BETA">BETA</option>
                      <option value="PLANNED">PLANNED</option>
                    </select>
                    <input
                      className={`${inputCls} col-span-5`}
                      placeholder="Note"
                      value={f.note ?? ""}
                      onChange={(e) =>
                        setWork((prev) => {
                          if (!prev) return prev;
                          const rows = [...(prev.tech_docs.feature_matrix ?? [])];
                          rows[i] = { ...rows[i], note: e.target.value };
                          return { ...prev, tech_docs: { ...prev.tech_docs, feature_matrix: rows } };
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setWork((prev) => {
                          if (!prev) return prev;
                          const rows = [...(prev.tech_docs.feature_matrix ?? [])];
                          rows.splice(i, 1);
                          return { ...prev, tech_docs: { ...prev.tech_docs, feature_matrix: rows } };
                        })
                      }
                      className="col-span-1 p-1.5 rounded-lg hover:bg-rose-500/10 text-(--text-muted) hover:text-rose-600 justify-self-center"
                      title="Remove feature"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Roadmap */}
            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">
                Roadmap (one item per line)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(
                  [
                    ["short_term", "Short term"],
                    ["mid_term", "Mid term"],
                    ["long_term", "Long term"],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field} className="space-y-1">
                    <label className="text-[11px] font-semibold text-(--text-primary)">{label}</label>
                    <textarea
                      rows={4}
                      className={`${inputCls} font-mono text-[11px]`}
                      value={(work.roadmap?.[field] ?? []).join("\n")}
                      onChange={(e) => setRoadmapField(field, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Changelog */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted)">
                  Changelog
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setWork((prev) =>
                      prev
                        ? {
                            ...prev,
                            changelog: [...(prev.changelog ?? []), { date: "", version: "", changes: [] }],
                          }
                        : prev
                    )
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add entry
                </button>
              </div>
              <div className="space-y-2">
                {changelog.map((entry, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-(--bg-surface) border border-(--text-primary)/10 grid grid-cols-12 gap-2 items-start"
                  >
                    <input
                      className={`${inputCls} col-span-3`}
                      placeholder="Version"
                      value={entry.version ?? ""}
                      onChange={(e) =>
                        setWork((prev) => {
                          if (!prev) return prev;
                          const rows = [...(prev.changelog ?? [])];
                          rows[i] = { ...rows[i], version: e.target.value };
                          return { ...prev, changelog: rows };
                        })
                      }
                    />
                    <input
                      className={`${inputCls} col-span-3`}
                      placeholder="Date"
                      value={entry.date ?? ""}
                      onChange={(e) =>
                        setWork((prev) => {
                          if (!prev) return prev;
                          const rows = [...(prev.changelog ?? [])];
                          rows[i] = { ...rows[i], date: e.target.value };
                          return { ...prev, changelog: rows };
                        })
                      }
                    />
                    <textarea
                      rows={2}
                      className={`${inputCls} col-span-5 font-mono text-[11px]`}
                      placeholder="Changes, one per line"
                      value={(entry.changes ?? []).join("\n")}
                      onChange={(e) =>
                        setWork((prev) => {
                          if (!prev) return prev;
                          const rows = [...(prev.changelog ?? [])];
                          rows[i] = {
                            ...rows[i],
                            changes: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                          };
                          return { ...prev, changelog: rows };
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setWork((prev) => {
                          if (!prev) return prev;
                          const rows = [...(prev.changelog ?? [])];
                          rows.splice(i, 1);
                          return { ...prev, changelog: rows };
                        })
                      }
                      className="col-span-1 p-1.5 rounded-lg hover:bg-rose-500/10 text-(--text-muted) hover:text-rose-600 justify-self-center"
                      title="Remove entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-(--text-primary)/10 flex flex-wrap items-center gap-2">
              <AdminButton
                variant="outline"
                onClick={handleSaveDraft}
                disabled={studioBusy !== "idle"}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{studioBusy === "draft" ? "Saving draft…" : "Save Draft"}</span>
              </AdminButton>
              <AdminButton
                variant="solid"
                onClick={handlePublish}
                disabled={studioBusy !== "idle"}
                className="gap-1.5"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>{studioBusy === "publish" ? "Publishing…" : "Publish Live"}</span>
              </AdminButton>
              <AdminButton variant="outline" onClick={handleDiscardDraft}>
                <X className="w-3.5 h-3.5" />
                <span>Discard Draft</span>
              </AdminButton>
            </div>
          </>
        )}
      </AdminCard>

      {/* ── Versions ── */}
      <AdminCard className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-(--text-primary)/10">
          <div>
            <h2 className="text-sm font-serif font-bold text-(--text-primary) flex items-center gap-2">
              <History className="w-4 h-4" />
              Version History
            </h2>
            <p className="text-[11px] text-(--text-muted) mt-0.5">
              Last 10 publishes. Restore rolls content back (the rollback itself is recorded).
            </p>
          </div>
        </div>
        {versions.length === 0 ? (
          <p className="text-xs text-(--text-muted) py-4 text-center">
            No versions yet — publish something to create the first snapshot.
          </p>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v.index}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-(--bg-surface) border border-(--text-primary)/10"
              >
                <div className="text-xs">
                  <span className="font-mono font-bold text-(--text-primary)">v{v.index}</span>
                  <span className="text-(--text-muted) ml-2">
                    {v.at ? new Date(v.at).toLocaleString() : "—"}
                    {v.by ? ` · ${v.by}` : ""}
                  </span>
                </div>
                <AdminButton variant="outline" onClick={() => handleRestoreVersion(v.index)}>
                  Restore
                </AdminButton>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {/* ── Team showcase ── */}
      <AdminCard className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-(--text-primary)/10">
          <div>
            <h2 className="text-sm font-serif font-bold text-(--text-primary)">Team Members Showcase</h2>
            <p className="text-[11px] text-(--text-muted) mt-0.5">
              Add or update team profiles displayed in the YC Pitch Deck &amp; Team section.
            </p>
          </div>
          <AdminButton variant="solid" onClick={openAddMemberModal} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Team Member</span>
          </AdminButton>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="p-4 rounded-xl bg-(--bg-surface) border border-(--text-primary)/10 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-3">
                <div className="w-16 h-16 mx-auto rounded-xl overflow-hidden border border-(--text-primary)/15 bg-(--bg-card) flex items-center justify-center">
                  {member.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={member.image_url} alt={member.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-sm text-(--text-muted)">
                      {member.full_name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="text-center space-y-0.5">
                  <div className="font-bold text-xs text-(--text-primary) truncate">{member.full_name}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                    {member.role}
                  </div>
                  {member.email && (
                    <div className="text-[10px] text-(--text-muted) truncate">{member.email}</div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-(--text-primary)/10 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => openEditMemberModal(member)}
                  className="p-1.5 rounded-lg hover:bg-(--text-primary)/10 text-(--text-muted) hover:text-(--text-primary) transition-colors"
                  title="Edit member"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteMember(member)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-(--text-muted) hover:text-rose-600 transition-colors"
                  title="Delete member"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {teamMembers.length === 0 && !loading && (
            <div className="col-span-full py-10 text-center text-xs text-(--text-muted)">
              No team members added yet — add real members so judges see the actual team on /docs.
            </div>
          )}
        </div>
      </AdminCard>

      {/* Team modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-(--bg-card) border border-(--text-primary)/15 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-(--text-primary)/10">
              <h3 className="font-bold text-sm text-(--text-primary)">
                {editingMember ? "Edit Team Member" : "Add Team Member"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-(--text-muted) hover:text-(--text-primary)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-(--text-primary)">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahmudul Hasan Tasin"
                  value={memberFormData.full_name || ""}
                  onChange={(e) => setMemberFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-(--text-primary)">Role in Application *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Founder & Lead Engineer"
                  value={memberFormData.role || ""}
                  onChange={(e) => setMemberFormData((prev) => ({ ...prev, role: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-(--text-primary)">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@domain.com"
                    value={memberFormData.email || ""}
                    onChange={(e) => setMemberFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className={inputCls}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-(--text-primary)">Display Order</label>
                  <input
                    type="number"
                    value={memberFormData.display_order ?? 0}
                    onChange={(e) =>
                      setMemberFormData((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))
                    }
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-(--text-primary)">Profile Picture URL (auto-resized)</label>
                <input
                  type="url"
                  placeholder="https://... image link"
                  value={memberFormData.image_url || ""}
                  onChange={(e) => setMemberFormData((prev) => ({ ...prev, image_url: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-(--text-primary)">Bio / Summary</label>
                <textarea
                  rows={2}
                  placeholder="Brief background and expertise..."
                  value={memberFormData.bio || ""}
                  onChange={(e) => setMemberFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-(--text-primary)">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={memberFormData.linkedin_url || ""}
                    onChange={(e) => setMemberFormData((prev) => ({ ...prev, linkedin_url: e.target.value }))}
                    className={inputCls}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-(--text-primary)">GitHub Profile URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={memberFormData.github_url || ""}
                    onChange={(e) => setMemberFormData((prev) => ({ ...prev, github_url: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-(--text-primary)/10">
                <AdminButton variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </AdminButton>
                <AdminButton type="submit" variant="solid" disabled={savingMember}>
                  {savingMember ? "Saving..." : "Save Member"}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
