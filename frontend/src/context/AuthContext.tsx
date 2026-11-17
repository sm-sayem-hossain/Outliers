"use client";



import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

import { useRouter } from "next/navigation";

import api, { ApiError } from "@/lib/api";

import {

  saveTokenResponse,

  getToken,

  getStoredUser,

  clearAuth,

  TokenResponse,

  StoredUser,

} from "@/lib/auth";

import { loginDemo } from "@/lib/apiServices";




// ─── Role & Verification Types ─────────────────────────────────────────────

export type UserRole =

  | "general"

  | "lawyer"

  | "enterprise"

  | "enterprise_admin"

  | "enterprise_member"

  | "admin";



export type LawyerVerificationStatus = "pending" | "verified" | "rejected" | "suspended";

export type EnterpriseVerificationStatus = "pending" | "verified" | "rejected";



export interface PendingLawyerRecord {

  id: string | number;

  user_id?: string | number;

  name: string;

  email: string;

  phone?: string;

  barCouncilId: string;

  experienceYears: number;

  fieldOfLaw: string;

  specializations: string[];

  barAssociation?: string;

  chamberName?: string;

  status: LawyerVerificationStatus;

  appliedAt: string;

}



export interface LawyerProfile {

  barCouncilNo: string;

  fieldOfLaw: string;

  barAssociation?: string;

  chamberName?: string;

  verificationStatus: LawyerVerificationStatus;

}



export interface EnterpriseProfile {

  companyName: string;

  companyType: string;

  registrationNo: string;

  tinNo: string;

  adminName: string;

  memberCount: number;

  referCode?: string;

  verificationStatus: EnterpriseVerificationStatus;
  isTeamMember?: boolean;
  memberApprovalStatus?: string | null;

}



export interface UserProfile {

  id: string;

  name: string;

  firstName?: string;

  lastName?: string;

  dateOfBirth?: string;

  gender?: string;

  email: string;

  mobile?: string;

  role: UserRole;

  avatarUrl?: string;

  profile_photo_url?: string;

  isEmailVerified: boolean;

  isPhoneVerified: boolean;
  has_usable_password?: boolean;


  creditBalance: number;

  enterprise_credit_balance?: number | null; // [UPDATED] NEW: Company Pool Balance

  

  // [UPDATED] NEW: Member Quota Fields

  member_credit_quota?: number | null;

  member_credit_used?: number | null;



  lawyerProfile?: LawyerProfile;

  enterpriseProfile?: EnterpriseProfile;
  member_approval_status?: string | null;
}



// ─── Auth Request / Response types (matching backend) ────────────────────

interface LoginRequest {

  email: string;

  password: string;

}



interface RegisterEmailRequest {

  email: string;

  password: string;

  confirm_password: string;

  full_name: string;

  phone?: string;

  date_of_birth?: string;

  gender?: string;

}



interface OtpRequest {

  email: string;

  otp: string;

}



interface OnboardLawyerRequest {

  bar_council_id?: string;

  bar_council_no?: string;

  experience_years?: number;

  specializations?: string[];

  field_of_law?: string;

  bar_association?: string;

  chamber_name?: string;

}



interface OnboardEnterpriseRequest {

  company_name: string;

  company_type?: string;

  registration_no?: string;

  tin_no?: string;

  member_limit?: number;

  admin_name?: string;

  billing_email?: string;

  billing_phone?: string;

  email?: string;

  phone?: string;

}



interface RegisterEnterpriseMemberRequest {

  email: string;

  password: string;

  confirm_password: string;

  full_name: string;

  referral_code?: string;

  refer_code?: string;

  phone?: string;

  date_of_birth?: string;

  gender?: string;

}



// ─── Role Normalization ──────────────────────────────────────────────────

export function normalizeUserRole(rawRole?: string | null): UserRole {

  if (!rawRole) return "general";

  const r = String(rawRole).toUpperCase().trim();

  if (r === "ADMIN" || (r.includes("ADMIN") && !r.includes("ENTERPRISE"))) return "admin";

  if (r.includes("LAWYER")) return "lawyer";

  if (r.includes("ENTERPRISE_ADMIN") || r === "ENTERPRISE-ADMIN") return "enterprise_admin";

  if (r.includes("ENTERPRISE_MEMBER") || r === "ENTERPRISE-MEMBER") return "enterprise_member";

  if (r.includes("ENTERPRISE")) return "enterprise_admin";

  return "general";

}



// ─── Local Storage Helpers ───────────────────────────────────────────────

export function getPendingLawyerApplications(): PendingLawyerRecord[] {

  if (typeof window === "undefined") return [];

  try {

    const raw = localStorage.getItem("pending_lawyer_applications");

    return raw ? JSON.parse(raw) : [];

  } catch {

    return [];

  }

}



export function updateLawyerApplicationStatus(

  idOrEmail: string | number,

  status: LawyerVerificationStatus

) {

  if (typeof window === "undefined") return;

  try {

    const list = getPendingLawyerApplications();

    const updated = list.map((a) => {

      const match =

        String(a.id) === String(idOrEmail) ||

        (a.email && String(idOrEmail).toLowerCase() === a.email.toLowerCase());

      if (match) {

        return { ...a, status };

      }

      return a;

    });

    localStorage.setItem("pending_lawyer_applications", JSON.stringify(updated));

  } catch {

    // ignore

  }

}



// ─── Context Type ─────────────────────────────────────────────────────────

interface AuthContextType {

  isAuthenticated: boolean;

  isLoading: boolean;

  user: UserProfile | null;



  login: (req: LoginRequest) => Promise<UserProfile>;

  loginWithGoogle: (credential: string) => Promise<UserProfile>;

  registerEmail: (req: RegisterEmailRequest) => Promise<{ email: string }>;

  verifyOtp: (req: OtpRequest) => Promise<UserProfile>;

  resendOtp: (email: string) => Promise<void>;

  onboardLawyer: (req: OnboardLawyerRequest) => Promise<void>;

  onboardEnterprise: (req: OnboardEnterpriseRequest) => Promise<void>;

  registerEnterpriseMember: (req: RegisterEnterpriseMemberRequest) => Promise<{ email: string }>;

  logout: () => void;

  refreshUser: () => Promise<void>;

  updateUser: (partial: Partial<UserProfile>) => void;



  // Admin actions

  approveLawyerByAdmin: (lawyerIdOrEmail: string | number) => Promise<void>;

  rejectLawyerByAdmin: (lawyerIdOrEmail: string | number, reason?: string) => Promise<void>;

  suspendLawyerByAdmin: (lawyerIdOrEmail: string | number, reason?: string) => Promise<void>;

  getPendingLawyersList: () => PendingLawyerRecord[];



  loginAsDemoRole: (role: "general" | "lawyer" | "enterprise_admin" | "admin") => Promise<UserProfile>;

  loginAsDemoGeneral: () => Promise<void> | void;

  loginAsDemoLawyer: () => void;

  loginAsDemoAdmin: () => void;

  loginAsDemoEnterprise: () => void;

  loginAsDemoEnterpriseAdmin: () => void;

  loginAsDemoEnterpriseMember: () => void;

  simulateLawyerVerification: () => void;

  simulateEnterpriseVerification: () => void;

  simulatePhoneVerification: () => void;

}



const AuthContext = createContext<AuthContextType | undefined>(undefined);



// ─── Helper: map backend StoredUser → UserProfile ────────────────────────

function storedUserToProfile(u: StoredUser, extra?: Partial<UserProfile>): UserProfile {
  const normRole = normalizeUserRole(u.role);

  let savedEnterpriseProfile: EnterpriseProfile | undefined;
  let savedLawyerProfile: LawyerProfile | undefined;
  if (typeof window !== "undefined") {
    try {
      const ep = localStorage.getItem("cm_enterprise_profile");
      if (ep) savedEnterpriseProfile = JSON.parse(ep);
      const lp = localStorage.getItem("cm_lawyer_profile");
      if (lp) savedLawyerProfile = JSON.parse(lp);
    } catch {
      // ignore
    }
  }

  return {
    id: u.id,
    name: u.full_name,
    email: u.email,
    role: normRole,
    isEmailVerified: u.is_verified,
    has_usable_password: (u as any).has_usable_password ?? true,
    isPhoneVerified: u.is_phone_verified,
    creditBalance: u.credit_balance,
    enterprise_credit_balance: null,
    member_credit_quota: null,
    member_credit_used: null,
    lawyerProfile: savedLawyerProfile || (normRole === "lawyer" ? {
      barCouncilNo: "",
      fieldOfLaw: "",
      verificationStatus: "pending",
    } : undefined),
    enterpriseProfile: savedEnterpriseProfile,
    ...extra,
  };
}



// ─── Helper: map backend /auth/me response → UserProfile ─────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any

function meResponseToProfile(data: any): UserProfile {

  const email = data.email || "";

  const normRole = data.role ? normalizeUserRole(data.role) : "general";



  const lawyerData = data.lawyer_profile || data.lawyer;

  const lawyerProfile: LawyerProfile | undefined = lawyerData ? {

    barCouncilNo:

      lawyerData?.bar_council_no ||

      lawyerData?.bar_council_id ||

      "",

    fieldOfLaw:

      lawyerData?.field_of_law ||

      (Array.isArray(lawyerData?.specializations) ? lawyerData.specializations.join(", ") : undefined) ||

      "",

    barAssociation: lawyerData?.bar_association || "",

    chamberName: lawyerData?.chamber_name || "",

    verificationStatus:

      (lawyerData?.verification_status || "pending") as LawyerVerificationStatus,

  } : undefined;



  if (typeof window !== "undefined") {
    if (data.enterprise_profile) {
      try {
        localStorage.setItem("cm_enterprise_profile", JSON.stringify({
          companyName: data.enterprise_profile.company_name,
          companyType: data.enterprise_profile.company_type,
          registrationNo: data.enterprise_profile.registration_no,
          tinNo: data.enterprise_profile.tin_no,
          adminName: data.enterprise_profile.admin_name,
          memberCount: data.enterprise_profile.member_count ?? 0,
          referCode: data.enterprise_profile.refer_code,
          verificationStatus: data.enterprise_profile.verification_status,
          isTeamMember: data.enterprise_profile.is_team_member,
          memberApprovalStatus: data.enterprise_profile.member_approval_status || data.member_approval_status || null,
        }));
      } catch { /* noop */ }
    } else {
      localStorage.removeItem("cm_enterprise_profile");
    }

    if (lawyerProfile) {
      try {
        localStorage.setItem("cm_lawyer_profile", JSON.stringify(lawyerProfile));
      } catch { /* noop */ }
    } else {
      localStorage.removeItem("cm_lawyer_profile");
    }
  }

  return {
    id: String(data.id ?? data.user_id ?? ""),

    name: data.full_name ?? data.name ?? "",

    firstName: data.first_name,

    lastName: data.last_name,

    dateOfBirth: data.date_of_birth,

    gender: data.gender,

    email: email,

    mobile: data.phone,

    role: normRole,

    avatarUrl: data.profile_photo_url || data.avatar_url,

    profile_photo_url: data.profile_photo_url || data.avatar_url,

    isEmailVerified: data.is_verified ?? false,
    has_usable_password: (data.has_usable_password as boolean) ?? true,


    isPhoneVerified: data.is_phone_verified ?? false,

    creditBalance: data.credit_balance ?? 0,

    enterprise_credit_balance: data.enterprise_credit_balance ?? null,

    

    // [UPDATED] NEW: Mapping member quota fields

    member_credit_quota: data.member_credit_quota ?? null,

    member_credit_used: data.member_credit_used ?? null,



    lawyerProfile,

    enterpriseProfile: data.enterprise_profile

      ? {

          companyName: data.enterprise_profile.company_name,

          companyType: data.enterprise_profile.company_type,

          registrationNo: data.enterprise_profile.registration_no,

          tinNo: data.enterprise_profile.tin_no,

          adminName: data.enterprise_profile.admin_name,

          memberCount: data.enterprise_profile.member_count ?? 0,

          referCode: data.enterprise_profile.refer_code,

          verificationStatus: data.enterprise_profile.verification_status,
          isTeamMember: data.enterprise_profile.is_team_member,
          memberApprovalStatus: data.enterprise_profile.member_approval_status || (data as any).member_approval_status || null,
        }
      : undefined,
    member_approval_status: (data as any).member_approval_status || data.enterprise_profile?.member_approval_status || null,

  };

}



// ─── Demo profiles (for hackathon judges) ────────────────────────────────

const DEMO_GENERAL: UserProfile = {

  id: "demo-general",

  name: "Tariqul Islam",

  firstName: "Tariqul",

  lastName: "Islam",

  dateOfBirth: "1994-06-15",

  gender: "male",

  email: "tariqul@dhakatech.com",

  mobile: "+8801712345678",

  role: "general",

  avatarUrl: "",

  isEmailVerified: true,

  isPhoneVerified: false,

  creditBalance: 500,

  enterprise_credit_balance: null,

  member_credit_quota: null,

  member_credit_used: null,

};



const DEMO_LAWYER: UserProfile = {

  id: "demo-lawyer",

  name: "Advocate Shireen Akhter",

  firstName: "Shireen",

  lastName: "Akhter",

  dateOfBirth: "1988-11-20",

  gender: "female",

  email: "shireen@supremecourt.bd",

  mobile: "+8801911223344",

  role: "lawyer",

  avatarUrl: "",

  isEmailVerified: true,

  isPhoneVerified: true,

  creditBalance: 0,

  enterprise_credit_balance: null,

  member_credit_quota: null,

  member_credit_used: null,

  lawyerProfile: {

    barCouncilNo: "BC-48291/2019",

    fieldOfLaw: "Corporate & Labour Law",

    barAssociation: "Supreme Court Bar Association",

    chamberName: "Akhter & Associates, Dhaka",

    verificationStatus: "pending",

  },

};



const DEMO_ENTERPRISE_ADMIN: UserProfile = {

  id: "demo-ent-admin",

  name: "Rahim Chowdhury",

  firstName: "Rahim",

  lastName: "Chowdhury",

  dateOfBirth: "1982-04-10",

  gender: "male",

  email: "rahim@apexholdings.bd",

  mobile: "+8801819554433",

  role: "enterprise_admin",

  avatarUrl: "",

  isEmailVerified: true,

  isPhoneVerified: true,

  creditBalance: 0,

  enterprise_credit_balance: 5000,

  member_credit_quota: null,

  member_credit_used: null,

  enterpriseProfile: {

    companyName: "Apex Holdings Ltd.",

    companyType: "Private Limited",

    registrationNo: "C-148920/2021",

    tinNo: "582910482912",

    adminName: "Rahim Chowdhury",

    memberCount: 15,

    referCode: "APX-8821",

    verificationStatus: "verified",

    isTeamMember: false,

  },

};



const DEMO_ENTERPRISE_MEMBER: UserProfile = {

  id: "demo-ent-member",

  name: "Nusrat Jahan",

  firstName: "Nusrat",

  lastName: "Jahan",

  dateOfBirth: "1992-08-14",

  gender: "female",

  email: "nusrat.hr@apexholdings.bd",

  mobile: "+8801719876543",

  role: "enterprise_member",

  avatarUrl: "",

  isEmailVerified: true,

  isPhoneVerified: true,

  creditBalance: 0,

  enterprise_credit_balance: 5000,

  

  // [UPDATED] NEW: Demo Quota Data

  member_credit_quota: 250,

  member_credit_used: 120,



  enterpriseProfile: {

    companyName: "Apex Holdings Ltd.",

    companyType: "Private Limited",

    registrationNo: "C-148920/2021",

    tinNo: "582910482912",

    adminName: "Rahim Chowdhury",

    memberCount: 15,

    referCode: "APX-8821",

    verificationStatus: "verified",

    isTeamMember: true,

  },

};



const DEMO_ADMIN: UserProfile = {

  id: "demo-system-admin",

  name: "System Administrator",

  firstName: "Super",

  lastName: "Admin",

  dateOfBirth: "1980-01-01",

  gender: "male",

  email: "admin@contractmind.gov.bd",

  mobile: "+8801700112233",

  role: "admin",

  avatarUrl: "",

  isEmailVerified: true,

  isPhoneVerified: true,

  creditBalance: 99999,

  enterprise_credit_balance: null,

  member_credit_quota: null,

  member_credit_used: null,

};



// ─── Provider ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [user, setUser] = useState<UserProfile | null>(null);



  const refreshUser = useCallback(async () => {

    const token = getToken();

    if (!token) {

      setIsLoading(false);

      return;

    }

    try {

      // eslint-disable-next-line @typescript-eslint/no-explicit-any

      const data = await api.get<any>("/api/auth/me");

      const profile = meResponseToProfile(data);

      setUser(profile);

      setIsAuthenticated(true);

    } catch (err) {

      if (err instanceof ApiError && err.status === 401) {

        clearAuth();

        setIsAuthenticated(false);

        setUser(null);

      } else {

        const stored = getStoredUser();

        if (stored) {

          setUser(storedUserToProfile(stored));

          setIsAuthenticated(true);

        }

      }

    } finally {

      setIsLoading(false);

    }

  }, []);



  useEffect(() => {

    const demoSession = localStorage.getItem("app_auth_v2");

    if (demoSession) {

      try {

        const parsed = JSON.parse(demoSession);

        setUser(parsed);

        setIsAuthenticated(true);

        setIsLoading(false);

        return;

      } catch {

        localStorage.removeItem("app_auth_v2");

      }

    }

    refreshUser();

  }, [refreshUser]);



  const persistDemo = (u: UserProfile) => {

    if (typeof window !== "undefined") {

      localStorage.clear();

      localStorage.setItem("cm_role", String(u.role).toUpperCase());

      localStorage.setItem("app_auth_v2", JSON.stringify(u));

    }

    setIsAuthenticated(true);

    setUser(u);

  };



  const login = async (req: LoginRequest): Promise<UserProfile> => {

    if (typeof window !== "undefined") {

      localStorage.clear();

    }

    const data = await api.post<TokenResponse>("/api/auth/login", {

      email: req.email,

      password: req.password,

    });

    

    const resolvedRole = normalizeUserRole(data.role);



    if (typeof window !== "undefined") {

      localStorage.setItem("cm_role", String(resolvedRole).toUpperCase());

    }



    saveTokenResponse(data, resolvedRole);

    const profile = storedUserToProfile({

      id: data.user_id,

      email: data.email,

      full_name: data.full_name,

      role: resolvedRole,

      credit_balance: data.credit_balance,

      is_verified: data.is_verified,

      is_phone_verified: data.is_phone_verified,

    });

    setUser(profile);

    setIsAuthenticated(true);



    try {
      const me = await api.get<Record<string, unknown>>("/api/auth/me");
      const full = meResponseToProfile(me);
      if (typeof window !== "undefined") {
        localStorage.setItem("cm_role", String(full.role).toUpperCase());
      }
      setUser(full);
      return full;
    } catch {
      return profile;
    }

  };



  const loginWithGoogle = async (credential: string): Promise<UserProfile> => {

    if (typeof window !== "undefined") {

      localStorage.clear();

    }

    const data = await api.post<TokenResponse>("/api/auth/login/google", {

      token: credential,

    });

    const resolvedRole = normalizeUserRole(data.role);



    if (typeof window !== "undefined") {

      localStorage.setItem("cm_role", String(resolvedRole).toUpperCase());

    }



    saveTokenResponse(data, resolvedRole);

    const profile = storedUserToProfile({

      id: data.user_id,

      email: data.email,

      full_name: data.full_name,

      role: resolvedRole,

      credit_balance: data.credit_balance,

      is_verified: data.is_verified,

      is_phone_verified: data.is_phone_verified,

    });

    setUser(profile);

    setIsAuthenticated(true);



    try {
      const me = await api.get<Record<string, unknown>>("/api/auth/me");
      const full = meResponseToProfile(me);
      if (typeof window !== "undefined") {
        localStorage.setItem("cm_role", String(full.role).toUpperCase());
      }
      setUser(full);
      return full;
    } catch {
      return profile;
    }

  };



  const registerEmail = async (req: RegisterEmailRequest): Promise<{ email: string }> => {

    const data = await api.post<{ message: string; email: string }>(

      "/api/auth/register/email",

      req as unknown as Record<string, unknown>

    );

    return { email: data.email };

  };



  const verifyOtp = async (req: OtpRequest): Promise<UserProfile> => {

    const data = await api.post<TokenResponse>("/api/auth/verify-otp", {

      email: req.email,

      otp_code: req.otp,

    });

    const resolvedRole = normalizeUserRole(data.role);

    

    if (typeof window !== "undefined") {

      localStorage.setItem("cm_role", String(resolvedRole).toUpperCase());

    }

    

    saveTokenResponse(data, resolvedRole);

    const profile = storedUserToProfile({

      id: data.user_id,

      email: data.email,

      full_name: data.full_name,

      role: resolvedRole,

      credit_balance: data.credit_balance,

      is_verified: data.is_verified,

      is_phone_verified: data.is_phone_verified,

    });

    setUser(profile);

    setIsAuthenticated(true);

    return profile;

  };



  const resendOtp = async (email: string): Promise<void> => {

    await api.post("/api/auth/resend-otp", { email });

  };



  const onboardLawyer = async (req: OnboardLawyerRequest): Promise<void> => {

    const barId = req.bar_council_id || req.bar_council_no || "";

    const exp = req.experience_years ?? 3;

    const spec = req.specializations || (req.field_of_law ? [req.field_of_law] : ["Contract Law"]);



    await api.post("/api/auth/onboard/lawyer", {

      bar_council_id: barId,

      experience_years: exp,

      specializations: spec,

    });



    const pendingLawyerProfile: LawyerProfile = {
      barCouncilNo: barId,
      fieldOfLaw: spec.join(", "),
      verificationStatus: "pending",
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("cm_role", "LAWYER");
      localStorage.setItem("cm_lawyer_profile", JSON.stringify(pendingLawyerProfile));
    }
    setUser((prev) => (prev ? { ...prev, lawyerProfile: pendingLawyerProfile } : null));

    await refreshUser();
  };

  const onboardEnterprise = async (req: OnboardEnterpriseRequest): Promise<void> => {
    const res = await api.post<{ status: string; message: string; referral_code?: string; enterprise_id?: number }>("/api/auth/onboard/enterprise", {
      company_name: req.company_name,
      company_type: req.company_type || "Private Limited",
      registration_no: req.registration_no || "C-148920/2021",
      tin_no: req.tin_no || "582910482912",
      member_limit: req.member_limit || 10,
      billing_email: req.billing_email || req.email,
      billing_phone: req.billing_phone || req.phone,
    });

    const pendingProfile: EnterpriseProfile = {
      companyName: req.company_name,
      companyType: req.company_type || "Private Limited",
      registrationNo: req.registration_no || "C-148920/2021",
      tinNo: req.tin_no || "582910482912",
      adminName: req.admin_name || user?.name || "Admin",
      memberCount: req.member_limit || 10,
      referCode: res.referral_code || "PENDING",
      verificationStatus: "pending",
      isTeamMember: false,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("cm_role", "ENTERPRISE_ADMIN");
      localStorage.setItem("cm_enterprise_profile", JSON.stringify(pendingProfile));
    }

    setUser((prev) => (prev ? { ...prev, enterpriseProfile: pendingProfile } : null));
    await refreshUser();
  };



  const registerEnterpriseMember = async (

    req: RegisterEnterpriseMemberRequest

  ): Promise<{ email: string }> => {

    const data = await api.post<{ message: string; email: string }>(

      "/api/auth/register/enterprise-member",

      {

        email: req.email,

        password: req.password,

        confirm_password: req.confirm_password,

        full_name: req.full_name,

        referral_code: req.referral_code || req.refer_code || "APX-8821",

        phone: req.phone || undefined,

        date_of_birth: req.date_of_birth || undefined,

        gender: req.gender || undefined,

      }

    );

    return { email: data.email };

  };



  const logout = () => {

    clearAuth();

    if (typeof window !== "undefined") {

      localStorage.clear();

    }

    setIsAuthenticated(false);

    setUser(null);

    router.replace("/login");

  };



  const updateUser = (partial: Partial<UserProfile>) => {

    if (!user) return;

    const updated = { ...user, ...partial };

    setUser(updated);

    if (localStorage.getItem("app_auth_v2")) {

      localStorage.setItem("app_auth_v2", JSON.stringify(updated));

    }

  };



  // ── Demo shortcuts ──

  const loginAsDemoRole = async (role: "general" | "lawyer" | "enterprise_admin" | "admin"): Promise<UserProfile> => {
    let mockProfile: UserProfile = DEMO_GENERAL;
    if (role === "lawyer") mockProfile = DEMO_LAWYER;
    else if (role === "enterprise_admin") mockProfile = DEMO_ENTERPRISE_ADMIN;
    else if (role === "admin") mockProfile = DEMO_ADMIN;

    try {
      const data = await loginDemo(role);
      const resolvedRole = normalizeUserRole(data.role);
      saveTokenResponse(data, resolvedRole);

      const userProfile: UserProfile = {
        id: String(data.user_id),
        name: data.full_name,
        firstName: data.full_name.split(" ")[0] || "User",
        lastName: data.full_name.split(" ").slice(1).join(" ") || "",
        email: data.email,
        mobile: mockProfile.mobile,
        role: resolvedRole,
        isEmailVerified: data.is_verified,
        isPhoneVerified: data.is_phone_verified,
        creditBalance: data.credit_balance,
        enterprise_credit_balance: mockProfile.enterprise_credit_balance,
        lawyerProfile: mockProfile.lawyerProfile,
        enterpriseProfile: mockProfile.enterpriseProfile,
        member_credit_quota: mockProfile.member_credit_quota,
        member_credit_used: mockProfile.member_credit_used,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("cm_role", String(resolvedRole).toUpperCase());
        localStorage.setItem("app_auth_v2", JSON.stringify(userProfile));
      }

      setUser(userProfile);
      setIsAuthenticated(true);
      return userProfile;
    } catch (err) {
      console.warn("[Auth] Backend demo-login failed, falling back to local demo profile:", err);
      persistDemo(mockProfile);
      return mockProfile;
    }
  };

  const loginAsDemoGeneral = async () => { await loginAsDemoRole("general"); };
  const loginAsDemoLawyer = async () => { await loginAsDemoRole("lawyer"); };
  const loginAsDemoAdmin = async () => { await loginAsDemoRole("admin"); };
  const loginAsDemoEnterpriseAdmin = async () => { await loginAsDemoRole("enterprise_admin"); };
  const loginAsDemoEnterprise = loginAsDemoEnterpriseAdmin;
  const loginAsDemoEnterpriseMember = () => persistDemo(DEMO_ENTERPRISE_MEMBER);



  // ── Admin Panel Actions ──

  const approveLawyerByAdmin = async (lawyerIdOrEmail: string | number) => {

    try {

      await api.post(`/api/admin/lawyers/${lawyerIdOrEmail}/approve`);

    } catch (err) {

      console.warn("Backend admin approve API note:", err);

      throw err;

    }

    updateLawyerApplicationStatus(lawyerIdOrEmail, "verified");

    await refreshUser();

  };



  const rejectLawyerByAdmin = async (

    lawyerIdOrEmail: string | number,

    reason: string = "Bar Council verification unconfirmed."

  ) => {

    try {

      await api.post(`/api/admin/lawyers/${lawyerIdOrEmail}/reject`, { reason });

    } catch (err) {

      console.warn("Backend admin reject API note:", err);

      throw err;

    }

    updateLawyerApplicationStatus(lawyerIdOrEmail, "rejected");

    await refreshUser();

  };



  const suspendLawyerByAdmin = async (

    lawyerIdOrEmail: string | number,

    reason: string = "Account suspended by administrator."

  ) => {

    try {

      await api.post(`/api/admin/lawyers/${lawyerIdOrEmail}/suspend`, { reason });

    } catch (err) {

      console.warn("Backend admin suspend API note:", err);

      throw err;

    }

    updateLawyerApplicationStatus(lawyerIdOrEmail, "suspended");

    await refreshUser();

  };



  const getPendingLawyersList = () => {

    return getPendingLawyerApplications();

  };



  const simulateLawyerVerification = () => {

    if (!user || user.role !== "lawyer") return;

    const currentLp = user.lawyerProfile || {

      barCouncilNo: "",

      fieldOfLaw: "",

      verificationStatus: "pending",

    };

    const updatedLp: LawyerProfile = {

      ...currentLp,

      verificationStatus: "verified",

    };

    updateUser({ lawyerProfile: updatedLp });

  };



  const simulateEnterpriseVerification = () => {

    if (!user || !user.enterpriseProfile) return;

    updateUser({ enterpriseProfile: { ...user.enterpriseProfile, verificationStatus: "verified" } });

  };



  const simulatePhoneVerification = () => {

    if (!user) return;

    updateUser({ isPhoneVerified: true });

  };



  return (

    <AuthContext.Provider

      value={{

        isAuthenticated,

        isLoading,

        user,

        login,

        loginWithGoogle,

        registerEmail,

        verifyOtp,

        resendOtp,

        onboardLawyer,

        onboardEnterprise,

        registerEnterpriseMember,

        logout,

        refreshUser,

        updateUser,

        approveLawyerByAdmin,

        rejectLawyerByAdmin,

        suspendLawyerByAdmin,

        getPendingLawyersList,

        loginAsDemoRole,

        loginAsDemoGeneral,

        loginAsDemoLawyer,

        loginAsDemoAdmin,

        loginAsDemoEnterprise,

        loginAsDemoEnterpriseAdmin,

        loginAsDemoEnterpriseMember,

        simulateLawyerVerification,

        simulateEnterpriseVerification,

        simulatePhoneVerification,

      }}

    >

      {children}

    </AuthContext.Provider>

  );

}



export function useAuth() {

  const context = useContext(AuthContext);

  if (!context) throw new Error("useAuth must be used within an AuthProvider");

  return context;

}