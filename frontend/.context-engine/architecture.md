# Frontend Architecture

> Status: INITIALIZED  
> Last Verified: 2026-11-08  

## System context
The JusticeSphere AI / Advotech Copilot Frontend is a single-page-centric React application built on Next.js 16 (App Router). It serves as the sovereign user interface for Bangladesh legal research, statutory compliance verification, and lawyer marketplace interaction.

The frontend interfaces with:
1. **End-Users Across 5 Roles**:
   - `general`: Citizens, freelancers, and SMEs analyzing contracts and asking legal questions.
   - `lawyer`: Licensed advocates reviewing and certifying contracts.
   - `enterprise_admin`: Corporate administrators managing pooled credits, member quotas, and organizational compliance playbooks.
   - `enterprise_member`: Corporate team members auditing agreements under company playbooks.
   - `admin`: Super-administrators managing advocates, enterprises, financial payouts, and user accounts.
2. **Backend API**:
   - ContractMind FastAPI Backend (`https://legal-copilot-backend-088i.onrender.com` or local rewrite proxy `/api/*`).
3. **External CDNs & Assets**:
   - Google Fonts (Inter, Tiro Bangla) and Supabase Cloud Storage (remote images and avatars).

---

## Architectural layers

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│  Pages: /, /copilot, /contractmind, /archive, /pricing, /profile, ...  │
│  Components: AppShell, AppDock, VerticalDock, PromptBar, MarkdownViewer│
│  Effects: ThoughtLine, GradientWaves, DitherVeil, PixelSwap, CountUp   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                         APPLICATION STATE LAYER                        │
│  Context Providers: ThemeProvider, LanguageProvider,                   │
│                     PersonaProvider, AuthProvider                      │
│  Persistence: localStorage, sessionStorage                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                       SERVICES & CLIENT LOGIC LAYER                    │
│  API Client: src/lib/api.ts (Fetch wrapper, Bearer JWT, 90s Abort)     │
│  Domain Services: src/lib/apiServices.ts (Contracts, Chat, HITL, etc) │
│  Sovereign Utilities: piiMasker.ts, dispatcher.ts, markdownGen.ts      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    NEXT.JS REWRITE PROXY / REMOTE API                  │
│  Next.js Rewrites: /api/:path* -> BACKEND_INTERNAL_URL / Render        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Major application flows

### 1. Authentication, Registration & Role Routing Flow
```
User visits / or /?auth=login
  │
  ├── 1. Guest Landing Page (`LandingAndAuthPage`)
  │      - Renders hero, WebGL animations, stats, personas, testimonials.
  │      - Opens `showAuthModal` if `?auth=login` or user clicks "Sign In".
  │
  ├── 2. User Authentication Actions
  │      ├── Email/Password Login -> POST /api/auth/login
  │      │     └── Saves token, normalizes role, stores `cm_role`, calls /api/auth/me
  │      ├── Email Registration -> POST /api/auth/register/email
  │      │     └── Returns { email }, switches modal to OTP verification step
  │      ├── OTP Verification -> POST /api/auth/verify-otp
  │      │     └── Validates 6-digit OTP, stores JWT, activates profile
  │      ├── Password Reset -> POST /api/auth/forgot-password & /api/auth/reset-password
  │      └── Demo Role Selection (Hackathon)
  │            └── Direct invocation of `loginAsDemoGeneral()`, `loginAsDemoLawyer()`,
  │                `loginAsDemoEnterpriseAdmin()`, `loginAsDemoAdmin()`
  │
  └── 3. Redirection Dispatcher (`/dashboard` or `page.tsx`)
         ├── role === 'LAWYER'            ──► /lawyer/pending
         ├── role === 'ADMIN'             ──► /admin
         ├── role === 'ENTERPRISE_ADMIN'  ──► /enterprise/admin
         ├── role === 'ENTERPRISE_MEMBER' ──► /enterprise/member
         └── role === 'GENERAL'           ──► /copilot
```

### 2. Autonomous Contract Risk Audit Flow (`/contractmind`)
```
User navigates to /contractmind
  │
  ├── 1. Role Guard: If user.role === 'LAWYER', auto-redirect to /lawyer/pending
  │
  ├── 2. Contract Selection / Ingestion
  │      ├── A. Select Built-in Sample (e.g. Employment, Vendor SLA, Commercial Lease)
  │      │     └── Loads pre-computed audit from `src/data/contractAudits.ts`
  │      └── B. Drag & Drop File Upload (.pdf, .docx, .doc, .png, .jpg)
  │            ├── Client file validation
  │            └── `uploadContract(file)` -> POST /api/contracts/upload (Multipart FormData)
  │                  └── Returns `ContractAuditResult` (risk score, clauses, summary)
  │
  ├── 3. Clause Risk Visualization & Redlining
  │      ├── Overall Risk Score Gauge (0 - 100) and Risk Grade badge (High/Medium/Low)
  │      ├── Individual Clause Cards with statutory conflicts (e.g. Labour Act 2006 § 26)
  │      └── `MarkdownViewer` renders statutory redline comparisons (+ / - diff format)
  │
  ├── 4. Human-in-the-Loop (HITL) Advocate Dispatch
  │      ├── User clicks "Request Advocate Verification"
  │      ├── Deducts credits via `requestLawyerVerification(contractId)`
  │      ├── Client algorithm fallback: `runDispatchAlgorithm()` calculates:
  │      │     score = 0.40*Domain + 0.20*Rating - 0.20*Workload + 0.15*Affinity + 0.10*Urgency
  │      └── Updates HITL state to `QUEUED_FOR_LAWYER` / `OFFERED`
  │
  └── 5. Export Memo
         ├── Generates formatted markdown via `generateContractAuditMarkdown()`
         └── Browser print trigger for high-res PDF generation using `@media print`
```

### 3. Legal Research Copilot Flow (`/copilot`)
```
User navigates to /copilot
  │
  ├── 1. Session Initialization
  │      ├── Inspects `sessionStorage:active_audit_contract` (bridges audit from ContractMind)
  │      ├── If contract present: `createChatSession(title, "USER_CONTRACT", contractId)`
  │      └── Otherwise: loads user sessions via `listChatSessions()` or starts fresh general chat
  │
  ├── 2. Prompt Input & Client-Side PII Redaction
  │      ├── User types query in `PromptBar` or triggers slash command (/audit, /memo, /redline)
  │      └── Sovereign Masking (`maskPii`): Redacts emails, phones (+8801...), and known entities
  │
  ├── 3. Query Submission -> POST /api/chat/query
  │      ├── Activates `ThoughtLine` component showing animated reasoning milestones
  │      └── Awaits `ChatQueryResponse` from backend LangGraph agent
  │
  ├── 4. Response Rendering
  │      ├── Answer rendered via `MarkdownViewer` (supports citations, headings, alerts)
  │      ├── Statutory Citations drawer populated with links to Bangladesh bdlaws official gazettes
  │      ├── Case Law Precedents section displayed (if present)
  │      └── Suggested next follow-up questions
  │
  └── 5. User Feedback / Copy / Export
         └── Instant copy button, session history drawer toggle
```

### 4. Human-in-the-Loop (HITL) Lawyer Workflow (`/lawyer/pending`)
```
Verified Lawyer opens /lawyer/pending
  │
  ├── 1. Incoming Review Queue (`getLawyerQueue`)
  │      ├── Shows incoming contract offers with 3-hour expiry countdown
  │      ├── "Accept Offer" -> POST /api/lawyer/queue/{id}/accept
  │      └── "Decline Offer" -> POST /api/lawyer/queue/{id}/decline (re-queues to another lawyer)
  │
  ├── 2. Active Review Tasks (`getActiveTasks`)
  │      ├── Displays contracts currently under review with SLA deadline timer
  │      ├── In-depth clause inspection and redline editor
  │      ├── Optional: Launch dedicated contract review chat session (`startContractReviewChat`)
  │      └── Optional: Upload signed review certificate (`uploadLawyerProof`)
  │
  ├── 3. Review Submission -> POST /api/lawyer/active-tasks/{id}/submit-review
  │      ├── Transmits clause-by-clause advocate remarks, seal confirmation, and final approval
  │      └── Moves contract to `COMPLETED` / `Verified ✓` status
  │
  └── 4. Earnings & Payouts (`getLawyerEarnings`, `listWithdrawals`)
         ├── Total earnings, completed reviews counter, pending payout balance
         └── "Request Withdrawal" modal -> POST /api/lawyer/withdrawals (bKash/Nagad number)
```

### 5. Enterprise Multi-Tenancy & Playbook Workflow (`/enterprise/admin`)
```
Enterprise Admin opens /enterprise/admin
  │
  ├── 1. Organization Dashboard (`getCompanyDashboard`)
  │      ├── Pooled credit balance display & company referral code (`referCode`)
  │      └── Active member count vs plan limit
  │
  ├── 2. Team Member Management
  │      ├── Pending Member Approvals (`listPendingMembers`, `approveMember`, `rejectMember`)
  │      ├── Active Members List (`listMembers`)
  │      └── Quota Allocation (`adjustMemberQuota`)
  │
  ├── 3. Compliance Playbook Engine
  │      ├── Upload corporate policy document -> POST /api/enterprise/playbooks (`uploadPlaybook`)
  │      ├── View parsed compliance rules (`listPlaybooks`)
  │      └── Activate/Deactivate rules enforced during member contract audits
  │
  └── 4. Shared Repository & Governance
         ├── Central company contract archive (`getSharedContracts`)
         └── Security audit logs (`getCompanyAuditLogs`)
```

### 6. Billing, Credit Packages & Manual bKash Workflow (`/pricing`)
```
User opens /pricing
  │
  ├── 1. Package Catalog (`listPackages`)
  │      └── Displays available credit bundles (Starter, Professional, Enterprise)
  │
  ├── 2. Payment Initiation -> POST /api/payments/initiate
  │      └── Receives merchant bKash wallet number and reference code
  │
  ├── 3. Transaction ID Submission -> POST /api/payments/submit-trx
  │      └── Submits user's bKash TrxID -> Status changes to `PENDING`
  │
  └── 4. Admin Verification & Credit Grant
         └── Admin approves payment in `/admin` -> User wallet balance credited automatically
```

---

## Role-based dock navigation matrix

| Route | GENERAL | LAWYER | ENTERPRISE_ADMIN | ENTERPRISE_MEMBER | ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| `/copilot` | Visible | Visible (AI Research) | Visible | Visible | Hidden |
| `/contractmind` | Visible | Hidden (Redirect) | Visible | Visible | Hidden |
| `/archive` | Visible | Hidden | Visible | Visible | Hidden |
| `/lawyer/pending` | Hidden | Visible (Primary) | Hidden | Hidden | Hidden |
| `/lawyer/archive` | Hidden | Visible | Hidden | Hidden | Hidden |
| `/enterprise/admin` | Hidden | Hidden | Visible (Primary) | Hidden | Hidden |
| `/enterprise/member` | Hidden | Hidden | Hidden | Visible (Primary) | Hidden |
| `/admin` | Hidden | Hidden | Hidden | Hidden | Visible (Primary) |
| `/pricing` | Visible | Hidden | Hidden | Hidden | Hidden |
| `/settings` | Visible | Visible | Visible | Visible | Visible |
| `/profile` | Visible | Visible | Visible | Visible | Visible |

---

## Print and PDF export architecture
- High-quality client-side export is enabled through dedicated print stylesheets in `src/app/globals.css`.
- During `window.print()`:
  - All navigation bars, docks (`AppDock`), hamburgers, buttons, and backdrop blurs are hidden using `.print:hidden`.
  - Margins and padding on `<main>` and `AppShell` are zeroed out (`print:p-0 print:m-0 print:w-full print:max-w-none`).
  - Colors are forced to high-contrast white background and dark typography (`print:bg-white print:text-black`).
  - Redline comparisons preserve clear green `+` insertions and red `-` strikethroughs with solid borders.
  - Page breaks inside cards are avoided using `print:break-inside-avoid`.
