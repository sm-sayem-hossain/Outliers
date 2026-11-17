/* eslint-disable @typescript-eslint/no-explicit-any */

// ─────────────────────────────────────────────────────────────────────────────
// Enterprise admin domain types + backend → frontend mappers.
// ─────────────────────────────────────────────────────────────────────────────

export type MemberStatus = "active" | "suspended" | "pending" | "inactive";

export interface EnterpriseMember {
  id: string;
  name: string;
  email: string;
  department: string;
  role: "admin" | "member";
  status: MemberStatus;
  monthlyCreditCap: number;
  creditsUsedThisMonth: number;
  joinedAt: string;
}

export interface PlaybookRule {
  id: string;
  clauseTypeEn: string;
  clauseTypeBn: string;
  statute: string;
  statutoryReference: string;
  companyRequirementEn: string;
  companyRequirementBn: string;
  standardClauseTemplate: string;
  strictness: "mandatory" | "advisory";
  isActive: boolean;
}

export interface PendingMember {
  user_id: number | string;
  email: string;
  full_name: string;
  phone?: string | null;
  requested_at: string;
  is_verified: boolean;
}

export interface AuditLogItem {
  id: number | string;
  timestamp: string;
  member_name: string;
  department: string;
  module: string;
  category: string;
  credits_consumed: number;
}

export interface SharedContractItem {
  id: number | string;
  contract_id: number | string;
  title: string;
  category: string;
  submitted_by: string;
  submitted_at: string;
  risk_score: number;
  status: string;
  advocate_verified: boolean;
}

export interface Organization {
  id: number;
  name: string;
  referCode: string;
  usedSeats: number;
  totalSeats: number;
  creditPoolRemaining: number;
  creditPoolTotal: number;
  registrationNo: string;
  tinNo: string;
}

export function mapBackendStatus(m: any): MemberStatus {
  const approval = String(m.approval_status || "").toUpperCase();
  const isActive = m.is_active !== false;
  if (approval === "PENDING") return "pending";
  if (approval === "REJECTED") return "inactive";
  if (approval === "SUSPENDED") return "suspended";
  if (approval === "APPROVED") return isActive ? "active" : "inactive";
  return "active";
}

export function mapBackendMember(m: any): EnterpriseMember {
  const companyRole = String(m.company_role || "").toUpperCase();
  return {
    id: String(m.user_id ?? m.id ?? ""),
    name: m.full_name || m.name || "Member",
    email: m.email || "",
    department: m.department || "—",
    role: companyRole === "ADMIN" ? "admin" : "member",
    status: mapBackendStatus(m),
    monthlyCreditCap: Number(m.quota_total ?? 0),
    creditsUsedThisMonth: Number(m.quota_used ?? 0),
    joinedAt: m.joined_at ? new Date(m.joined_at).toLocaleDateString() : "—",
  };
}

export function mapBackendRuleToFrontend(r: any): PlaybookRule {
  const sev = String(r.severity || "").toLowerCase();
  const rawStrictness = r.strictness ? String(r.strictness).toLowerCase() : "";
  const isMandatory = rawStrictness === "mandatory" || sev === "critical" || sev === "high";

  return {
    id: String(r.rule_id || `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    clauseTypeEn: r.category || "General",
    clauseTypeBn: r.category || "General",
    statute: r.statute || r.violated_law || "Bangladesh Law",
    statutoryReference: r.statutoryReference || r.violated_law || "",
    companyRequirementEn: r.rule_description || "",
    companyRequirementBn: r.rule_description || "",
    standardClauseTemplate: r.suggested_redline || "",
    strictness: isMandatory ? "mandatory" : "advisory",
    isActive: r.is_active !== false,
  };
}
