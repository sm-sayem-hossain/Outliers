# Advotech Copilot (JusticeSphere AI) — Complete Project Context & Architecture Specification

> **Repository**: [mahmudulhasantasin/Outliers](https://github.com/mahmudulhasantasin/Outliers)  
> **Brand & System Names**: Advotech Copilot, JusticeSphere AI, ContractMind, আউটলায়ার্স (Outliers)  
> **Active Branch**: `sayem` (Base: `main`)  
> **Documentation Version**: 2.0.0 (Comprehensive 100% Context)  
> **Last Verified**: 2026-11-11  

---

## 1. Executive Summary & Vision

**Advotech Copilot** (branded in codebase as *JusticeSphere AI* and *ContractMind*) is an AI-native legal intelligence platform, autonomous contract auditor, and verified Human-in-the-Loop (HITL) advocate marketplace designed specifically for **Bangladesh Law**.

### Core Problem Solved:
In Bangladesh, legal consultation and contract auditing are traditionally slow, expensive, and opaque. Freelancers, SMEs, and corporate HR teams frequently sign lopsided agreements with illegal penalty clauses, non-compliant termination rules under the **Bangladesh Labour Act 2006**, or unenforceable non-compete covenants under the **Contract Act 1872 (§ 27)**.
Meanwhile, verified advocates face administrative bottlenecks in client acquisition, document dispatching, and secure payment disbursements.

### Core Solution:
1. **Zero-Hallucination Legal Research**: Chat copilot grounded in statutory provisions from the official Ministry of Law gazettes ([bdlaws.minlaw.gov.bd](http://bdlaws.minlaw.gov.bd)).
2. **Autonomous Contract Auditing (ContractMind)**: Clause extraction, conflict scoring (0–100 risk grade), and statutory redline diff generation (`+` / `-`).
3. **Client-Side Sovereign Privacy**: In-browser PII redactor removes sensitive identifiers (emails, BD mobile numbers, corporate entity names) before documents touch cloud inference.
4. **Human-in-the-Loop (HITL) Dispatch Engine**: Multi-factor matching algorithm assigning contracts to certified Bangladesh Supreme Court and District Bar advocates with strict 3-hour SLA offer windows.
5. **Enterprise Multi-Tenancy & Playbooks**: Corporate dashboards for pooled credit wallets, team quota allocations, custom compliance playbook enforcement, and shared legal vaults.
6. **Local Fintech Monetization**: Native bKash manual merchant payment gateway with TrxID submission, automated credit ledger, and lawyer earnings withdrawal workflow.

---

## 2. Event & Competition Context: International AI Builders Congress 2026

This project is built and structured directly aligned with the **International AI Builders Congress 2026** official participants guidelines.

- **Program Timeline**: Launch July 1, 2026 | Global Showcase & Congress: December 26, 2026 (Daffodil International University, Ashulia Campus, Dhaka).
- **Target Category**:
  - **Competition 1: Idea to Unicorn** (Team Project — building venture-scale defensible AI companies).
  - **Competition 2: Zero to Launch** (AI-native rapid product execution with sovereign auditability).
- **Domain**: **Domain 10: JusticeSphere AI — Legal, Compliance & Trust Technologies**
- **Congress Challenge Areas Addressed**:
  1. **ContractMind**: Contract intelligence, multi-agent clause review, RAG, and obligation extraction.
  2. **Legal Copilot**: Agentic RAG legal advisory with official bdlaws statutory citations and hallucination-free legal memoranda.
  3. **ComplianceOS / GovernanceIQ**: Corporate governance playbooks, team quotas, and audit logs.
  4. **Human+AI HITL Network**: Certified advocate review queue with cryptographically sealable digital certificates.

---

## 3. Technology Stack & Runtime Architecture

### Monorepo & Directory Structure
```
advotech-tsn/ (Repository Root)
├── .git/                                    # Git VCS configuration
├── .gitignore                               # Git ignored files & patterns
├── package.json                             # Root npm proxy scripts forwarding to frontend
├── README.md                                # Root repository guide
├── PROJECT_CONTEXT.md                       # Comprehensive 100% Context (This file)
├── AI Builders Congress 2026 - Participants Guide.pdf  # Official 30-page Congress specification
└── frontend/                                # Next.js 16 Web Application
    ├── package.json                         # Frontend dependencies & Next scripts
    ├── package-lock.json                    # Lockfile (npm v10+)
    ├── tsconfig.json                        # TypeScript 5 configuration (@/* alias)
    ├── next.config.ts                       # Next.js config (rewrites, Turbopack, remote images)
    ├── eslint.config.mjs                    # ESLint 9 configuration (eslint-config-next)
    ├── AGENTS.md                            # Agent-specific development rules & protocols
    ├── .context-engine/                     # Context engine cache & dependency graphs
    │   ├── PROJECT_CONTEXT.md               # Context snapshot
    │   ├── architecture.md                  # Layer diagrams & flow specs
    │   ├── project_map.md                   # Path index & retrieval maps
    │   ├── file_index.json                  # Indexed file hash map
    │   ├── metadata.json                    # Repository metadata
    │   ├── dependency_graph.json            # Internal imports dependency graph
    │   └── tools/context_engine.py          # Python maintenance utility
    ├── public/                              # Static public assets
    │   ├── fonts/                           # Local TTF fonts (TiroBangla-Regular, TiroBangla-Italic)
    │   ├── hero-statue.webm                 # 3D Lady Justice statue video/canvas asset
    │   ├── lady_justice.jpg                 # Background graphics
    │   ├── consultation.jpg                 # Consultation section hero image
    │   ├── avatar_1.jpg, 2, 3               # Demo user & advocate avatars
    │   ├── Firefly.png                      # Hero branding graphic
    │   ├── logo.svg, globe.svg, file.svg    # System icons
    │   └── carlos-...-unsplash.jpg          # Editorial photography
    └── src/
        ├── app/                             # Next.js App Router (Routes & Layouts)
        │   ├── layout.tsx                   # Global HTML root layout & providers
        │   ├── globals.css                  # Tailwind v4, custom theme tokens & print CSS
        │   ├── page.tsx                     # Landing page & full Auth modal suite
        │   ├── favicon.ico                  # Browser favicon
        │   ├── dashboard/page.tsx           # Role-based route dispatcher
        │   ├── login/page.tsx               # Auth redirect gateway
        │   ├── copilot/page.tsx             # Legal advisory chat copilot
        │   ├── contractmind/page.tsx        # Contract upload & statutory risk auditor
        │   ├── archive/page.tsx             # Contract audit archive & memo export
        │   ├── pricing/page.tsx             # Credit packages & bKash payment gateway
        │   ├── profile/page.tsx             # User profile, credentials & avatar upload
        │   ├── settings/page.tsx            # Security settings & preferences
        │   ├── admin/page.tsx               # Super-Admin portal (lawyers, enterprises, payments)
        │   ├── enterprise/
        │   │   ├── admin/page.tsx           # Enterprise admin workspace (playbooks, members)
        │   │   ├── member/page.tsx          # Enterprise team member workspace
        │   │   └── pending/page.tsx         # Enterprise onboarding pending status
        │   └── lawyer/
        │       ├── pending/page.tsx         # Advocate task queue, offer accept & review submit
        │       └── archive/page.tsx         # Advocate verified review history
        ├── components/
        │   ├── layout/
        │   │   └── AppShell.tsx             # Responsive workspace layout with dock clearance
        │   ├── dock/
        │   │   ├── AppDock.tsx              # Role-aware navigation dock controller
        │   │   └── VerticalDock.tsx         # Framer Motion magnification floating dock
        │   ├── prompt/
        │   │   └── PromptBar.tsx            # Interactive prompt bar with slash commands
        │   ├── markdown/
        │   │   └── MarkdownViewer.tsx       # Statutory redline & legal markdown renderer
        │   └── effects/
        │       ├── Aurora.tsx               # WebGL / Canvas dynamic gradient aurora
        │       ├── ThoughtLine.tsx          # Animated AI reasoning milestones
        │       ├── GradientWaves.tsx        # Canvas dynamic fluid waves
        │       ├── DitherVeil.tsx           # Canvas retro dithering effect
        │       ├── PixelSwap.tsx            # Interactive hover pixel distortion
        │       ├── CountUp.tsx              # Animated numerical counter
        │       ├── DotField.tsx             # Interactive particle dot field
        │       ├── FadeContent.tsx          # Scroll-triggered viewport animations
        │       └── SmoothScrollProvider.tsx # Lenis/custom smooth scroll controller
        ├── context/
        │   ├── AuthContext.tsx              # Authentication state, JWT, roles, demo logins
        │   ├── LanguageContext.tsx          # Bilingual English/Bengali localization provider
        │   ├── PersonaContext.tsx           # User persona selection (SME, HR, Freelancer, Legal)
        │   ├── ThemeContext.tsx             # Light/Dark mode state & DOM class synchronization
        │   └── NotificationContext.tsx      # Global toasts and confirmation modals
        ├── data/
        │   ├── sampleContracts.ts           # Pre-loaded sample agreements (Employment, SLA, Freelance)
        │   ├── contractAudits.ts            # Pre-computed statutory risk audits
        │   ├── statutoryProvisions.ts       # Bangladesh statutory provisions & bdlaws gazette URLs
        │   └── enterpriseData.ts            # Enterprise compliance playbooks & member fixtures
        └── lib/
            ├── api.ts                       # Fetch HTTP client with Bearer auth & 90s AbortController
            ├── apiServices.ts               # Typed service layer (30+ backend endpoints)
            ├── auth.ts                      # Local storage token & role persistence utilities
            ├── dispatcher.ts                # Client-side 5-factor advocate matching algorithm
            ├── piiMasker.ts                 # In-browser regex & entity PII redactor
            ├── markdownContractGenerator.ts # Legal memorandum & audit markdown formatter
            └── utils.ts                     # Tailwind clsx + twMerge utility (`cn`)
```

### Core Dependencies & Versions
| Package | Version | Purpose |
|---|---|---|
| `next` | `^16.4.3` | React 19 App Router framework with Turbopack |
| `react` / `react-dom` | `19.3.0` | React core library |
| `typescript` | `^5` | Strict static typing (`strict: true`) |
| `tailwindcss` | `^4` | Tailwind CSS v4 engine (`@tailwindcss/turbopack`) |
| `framer-motion` | `^14.0.0` | Physics-based UI animations, layout transitions |
| `gsap` | `^3.15.0` | High-performance timeline animations |
| `ogl` | `^1.0.11` | Minimal WebGL library for 3D hero canvas rendering |
| `lucide-react` | `^1.52.0` | Primary modern vector icon set |
| `@hugeicons/react` | `^1.1.10` | Secondary specialized UI icons |
| `clsx` & `tailwind-merge` | `2.1.1` / `3.7.0` | Dynamic class name merging |

---

## 4. User Personas & Role-Based Access Control (RBAC)

The system supports **5 distinct system roles** and **4 user personas**:

### System Roles
1. **`GENERAL`**: Citizens, Freelancers, SMEs, Founders. Can use Copilot, run ContractMind audits, buy credits via bKash, and request verified advocate reviews.
2. **`LAWYER`**: Bangladesh Bar Council licensed advocates. Has access to the incoming review queue (3-hour SLA window), active task inspection, certified digital review submission, and earnings withdrawal.
3. **`ENTERPRISE_ADMIN`**: Corporate legal/compliance heads. Manages team member seats, pooled credit balances, company referral codes, custom compliance playbook rules, and company-wide shared vaults.
4. **`ENTERPRISE_MEMBER`**: Employees/procurement officers within an enterprise tenant. Audits agreements guided automatically by company playbook rules.
5. **`ADMIN`**: Super-administrator. Approves pending advocate applications, verifies bKash payments, approves corporate tenants, and processes advocate payout withdrawals.

### Role-Based Route Visibility Matrix
| Route | GENERAL | LAWYER | ENTERPRISE_ADMIN | ENTERPRISE_MEMBER | ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| `/` (Landing Page) | Visible | Visible | Visible | Visible | Visible |
| `/dashboard` | Auto-redirect | Auto-redirect | Auto-redirect | Auto-redirect | Auto-redirect |
| `/copilot` | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible | ❌ Hidden |
| `/contractmind` | ✅ Visible | ❌ Auto-redirect | ✅ Visible | ✅ Visible | ❌ Hidden |
| `/archive` | ✅ Visible | ❌ Hidden | ✅ Visible | ✅ Visible | ❌ Hidden |
| `/lawyer/pending` | ❌ Hidden | ✅ Visible (Primary) | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| `/lawyer/archive` | ❌ Hidden | ✅ Visible | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| `/enterprise/admin` | ❌ Hidden | ❌ Hidden | ✅ Visible (Primary) | ❌ Hidden | ❌ Hidden |
| `/enterprise/member` | ❌ Hidden | ❌ Hidden | ❌ Hidden | ✅ Visible (Primary) | ❌ Hidden |
| `/admin` | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ✅ Visible (Primary) |
| `/pricing` | ✅ Visible | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden |
| `/profile` | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible |
| `/settings` | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible | ✅ Visible |

### Fast-Access Demo Profiles (Hackathon / Evaluation Mode)
Accessible directly via the Auth Modal on the landing page:
- **General User**: `demo.general@contractmind.ai` (Preloaded with credits, active contracts)
- **Advocate**: `advocate.tanvir@supremecourt.bd` (Preloaded with incoming offers and earnings)
- **Enterprise Admin**: `legal.director@grameenphone.com` (Preloaded with playbooks & members)
- **Super-Admin**: `superadmin@contractmind.ai` (Full administrative rights)

---

## 5. Core Feature Specifications & User Journeys

### 5.1 Landing Page & Multi-Flow Authentication (`/` & `src/app/page.tsx`)
- **Visuals**: WebGL dynamic background, 3D Lady Justice statue asset, smooth Lenis scrolling, animated live impact stats (99.4% citation accuracy, 5x speedup, sovereign privacy).
- **Interactive Personas**: Tabbed persona simulator allowing users to see tailored advice for SMEs, HR teams, Freelancers, and Legal Advisors.
- **Consultation & Lead Capture**: Section `#consultation` for direct booking.
- **Multi-Flow Auth Modal**:
  - Email/Password Login (`POST /api/auth/login`)
  - Full Registration (`POST /api/auth/register/email`) with role selection
  - 6-Digit OTP Verification (`POST /api/auth/verify-otp`)
  - Password Reset Request & Confirmation (`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`)
  - Google Sign-In Script (`https://accounts.google.com/gsi/client`) integration
  - 1-Click Demo Profile Switcher

### 5.2 Legal Research Copilot (`/copilot`)
- **Conversational RAG**: Supports interactive multi-turn legal discussions.
- **Client-Side PII Masking**: Automatically intercepts prompt input and redacts sensitive data prior to transmission.
- **ThoughtLine Visualizer**: Displays intermediate LangGraph agent reasoning steps (*Query Decomposition*, *Statutory Retrieval*, *Precedent Matching*, *Synthesis*).
- **Statutory Drawer**: Extracts citations directly from responses and links to official [bdlaws.minlaw.gov.bd](http://bdlaws.minlaw.gov.bd) gazette entries.
- **Bridge from ContractMind**: If opened from an audit, reads `sessionStorage:active_audit_contract` to automatically load context into a dedicated contract discussion.

### 5.3 ContractMind: Autonomous Risk Auditor (`/contractmind`)
- **Input Channels**:
  - Built-in Sample Contracts (Employment Agreement, Vendor SLA, Freelance IP Agreement).
  - Drag & Drop Document Ingestion (.pdf, .docx, .png, .jpg) via `uploadContract()`.
- **Statutory Conflict Audit**: Evaluates agreements against Bangladesh statutes:
  - Detects unfair liquidated damages (§ 74 Contract Act 1872).
  - Flags unlawful non-compete covenants (§ 27 Contract Act 1872).
  - Flags improper worker termination clauses (§ 26 Bangladesh Labour Act 2006).
  - Evaluates maximum working hours and overtime compensation (§ 100, 102, 108 Labour Act).
- **Visual Risk Score Gauge**: 0 to 100 risk score with High / Medium / Low badges.
- **Redline Diff Viewer**: Interactive Markdown comparisons highlighting added protective clauses in green (`+`) and predatory clauses in red (`-`).
- **Advocate Dispatching**: Triggers the 5-factor matching algorithm and reserves credits to dispatch the audit to a licensed advocate.
- **Export & Print**: Generates audit memos and prints cleanly via CSS `@media print` rules.

### 5.4 Human-in-the-Loop (HITL) Advocate Workplace (`/lawyer/pending` & `/lawyer/archive`)
- **Incoming Queue (`getLawyerQueue`)**:
  - Displays incoming contract audit offers with a 3-hour expiry countdown.
  - Advocates can **Accept** (`POST /api/lawyer/queue/{id}/accept`) or **Decline** (`POST /api/lawyer/queue/{id}/decline`). Declined tasks are automatically re-routed.
- **Active Review Tasks (`getActiveTasks`)**:
  - Dedicated clause inspection tool with SLA countdown timer.
  - Option to launch a dedicated contract-review chat session.
  - Ability to upload signed certificates/proofs (`uploadLawyerProof`).
- **Certified Review Submission (`submitReview`)**:
  - Clause-by-clause advocate commentary, verified seal mark, and final legal approval.
- **Earnings & Financials (`getLawyerEarnings`, `listWithdrawals`)**:
  - Total earned, pending balance, and completed reviews tally.
  - Direct withdrawal request modal for bKash or Nagad payouts.

### 5.5 Enterprise Compliance Portal (`/enterprise/admin` & `/enterprise/member`)
- **Pooled Credit Wallet**: Shows company credit balance shared across all department members.
- **Member Management**:
  - Invite new members with unique referral code (`referCode`).
  - Approve or reject pending member join requests.
  - Set individual monthly audit quotas (`adjustMemberQuota`).
- **Playbook Compliance Engine**:
  - Upload corporate procurement or HR guidelines (`uploadPlaybook`).
  - Active rules are injected into ContractMind audits for all company members.
- **Shared Repository & Governance**:
  - Shared contract archive across all team audits.
  - Full security audit logs (`getCompanyAuditLogs`) tracking who audited what.

### 5.6 Billing & Manual bKash Gateway (`/pricing`)
- **Package Tiers**:
  - *Starter*: Individual freelancers & small creators (5 credits).
  - *Professional*: Growing SMEs & founders (25 credits + 1 advocate review).
  - *Enterprise*: Unlimited pooled credits, custom playbooks, dedicated advocate SLA.
- **Manual bKash Checkout Flow**:
  1. User selects package -> `POST /api/payments/initiate`.
  2. System presents official merchant bKash number and payment reference.
  3. User completes "Send Money / Payment" in bKash app and inputs the 10-character Transaction ID (TrxID).
  4. User clicks "Submit TrxID" -> `POST /api/payments/{id}/submit-trx`.
  5. Payment enters `PENDING` state until approved by admin.

### 5.7 Super-Admin Control Panel (`/admin`)
- **Lawyer Onboarding Verification**: Inspect advocate credentials (Bar Council registration number, enrolled year, bar association) and one-click Approve or Reject.
- **Enterprise Verification**: Review corporate verification documents and approve enterprise accounts.
- **Payment Verification**: Review pending bKash transactions against bank statement logs and approve credit deposits.
- **Withdrawal Disbursements**: Review advocate payout requests, confirm bKash/Nagad transfers, and mark withdrawals as `PAID`.
- **User Directory**: Search, inspect, suspend, or reactivate user accounts.

---

## 6. Sovereign AI, Data Privacy & Client-Side Algorithms

### 6.1 Client-Side Sovereign PII Masker (`src/lib/piiMasker.ts`)
Executes entirely in the user's browser before any text is sent to the backend:
- **Email Regex**: Intercepts standard emails and replaces them with `[REDACTED_EMAIL]`.
- **Bangladeshi Mobile Phone Regex**: Detects local formats (`+8801[3-9]XXXXXXXX` or `01[3-9]XXXXXXXX`) and replaces them with `[REDACTED_PHONE]`. (Guarded against false positives on statutory years like 1872 or 2006).
- **National ID / Tax Identifiers**: Masked to prevent identity leakage.
- **Known Corporate Entities**: Redacts known party names in demo documents (e.g., "Nexus Technologies Ltd.", "শামীম আহমেদ").

### 6.2 Advocate Dispatch Algorithm (`src/lib/dispatcher.ts`)
A multi-factor client-side simulation matching the backend Python engine (`algorithm.py`):

$$\text{Final Score} = 0.40 \cdot S_{\text{domain}} + 0.20 \cdot S_{\text{rating}} - 0.20 \cdot S_{\text{workload}} + 0.15 \cdot S_{\text{affinity}} + 0.10 \cdot S_{\text{urgency}}$$

- **Domain Relevance ($S_{\text{domain}}$)**: $1.0$ for exact primary domain match, $0.5$ for secondary, $0.1$ for general.
- **Rating Score ($S_{\text{rating}}$)**: Normalized advocate rating: $\frac{\text{Rating}}{5.0}$.
- **Workload Penalty ($S_{\text{workload}}$)**: Current load ratio: $\frac{\text{Active Tasks}}{\text{Max Capacity}}$.
- **User Affinity ($S_{\text{affinity}}$)**: $1.0$ if the user previously rated this advocate $\ge 4.5$ stars.
- **Urgency Score ($S_{\text{urgency}}$)**: $1.0$ for URGENT (24-hour SLA), $0.7$ for HIGH, $0.3$ for NORMAL.

---

## 7. Bangladesh Statutory Grounding & Knowledge Base

The platform is explicitly grounded in the following official statutes of Bangladesh:

1. **The Contract Act, 1872 (Act IX of 1872)**
   - **Section 23**: Unlawful considerations and objects voiding contracts against public policy.
   - **Section 27**: Agreements in restraint of trade void (governs non-compete clauses; establishes that post-employment restrictions are largely unenforceable under Bangladesh law).
   - **Section 73**: Compensation for loss or damage caused by breach (strictly disallows indirect or remote damages).
   - **Section 74**: Compensation for breach of contract where penalty stipulated (liquidated damages must be reasonable; courts will not enforce punitive extortion clauses).
2. **The Bangladesh Labour Act, 2006 (Act XLII of 2006)**
   - **Section 26**: Termination of employment by employer (mandates 120 days notice or pay in lieu for permanent workers, 30 days for temporary).
   - **Section 27**: Termination of employment by worker (notice periods for employee resignations).
   - **Section 100 & 102**: Normal working hours (maximum 8 hours/day, 48 hours/week) and overtime limits (maximum 60 hours/week, 56 hours average).
   - **Section 108**: Extra allowance for overtime work (mandates double the ordinary basic wage rate).
   - **Section 120**: Wages to be paid within 7 working days from the end of wage period.
3. **The Arbitration Act, 2001 (Act I of 2001)**
   - Enforceability of institutional arbitration clauses and domestic tribunal venues.
4. **The Cyber Security Act, 2023 / Digital Security Act**
   - Data protection, digital unauthorized access, and confidentiality covenants.
5. **The Copyright Act, 2000 (Act XXVIII of 2000)**
   - Intellectual property ownership in work-for-hire and freelance consultancy contracts.

---

## 8. Frontend Architecture & Design System

### Styling Tokens & Typography
- **Design Tokens** (in `src/app/globals.css`):
  - Light Mode Primary Background: `#E7E7DD` (Warm parchment aesthetic suited for legal reading)
  - Light Mode Text: `#1D1D1B`
  - Dark Mode Primary Background: `#1D1D1B`
  - Dark Mode Text: `#FFFFFF`
  - Risk Status Colors:
    - High Risk: `#EF4444` (Light) / `#F87171` (Dark)
    - Medium Risk: `#F59E0B` (Light) / `#FBBF24` (Dark)
    - Low Risk / Compliant: `#10B981` (Light) / `#34D399` (Dark)
- **Typography**:
  - English: `Inter` (Google Fonts)
  - Bengali: `Tiro Bangla` (Local TTF in `public/fonts/` + Google Fonts fallback)
  - Monospace: Standard code font for redline comparisons

### Visual Effect Suite (`src/components/effects/`)
- `ThoughtLine`: Stepped visual timeline showing AI agent reasoning status.
- `GradientWaves` & `Aurora`: Dynamic canvas shaders providing ambient backdrop motion.
- `DitherVeil` & `PixelSwap`: High-tech interactive hover textures.
- `CountUp`: Smooth numerical transitions for stats and risk scores.
- `SmoothScrollProvider`: High-framerate smooth inertial scrolling.

### Print & Export Architecture
The platform has custom `@media print` rules in `globals.css`:
- Hides docks (`AppDock`), buttons, navigation bars, and overlays (`print:hidden`).
- Forces high-contrast black text on pure white paper (`print:bg-white print:text-black`).
- Eliminates application shell margins (`print:p-0 print:m-0`).
- Prevents page breaks inside clause cards using `print:break-inside-avoid`.
- Preserves colored green and red diff banners for clear physical printouts.

---

## 9. State Management & Storage Contracts

The frontend operates using native **React Context providers** and browser storage (no bulky Redux/Zustand dependencies):

### Context Providers:
- `AuthProvider`: Manages user credentials, JWT decoding, role normalization (`normalizeUserRole`), and demo profile switches.
- `LanguageContext`: Provides `en` and `bn` translations via `t(key)`.
- `PersonaContext`: Maintains active persona (`sme`, `hr`, `freelancer`, `advisor`).
- `ThemeProvider`: Switches `light` / `dark` mode and toggles the `dark` class on the root `<html>`.
- `NotificationProvider`: Dispatches toast notifications and confirm dialogs.

### Storage Key Dictionary:
| Key | Storage | Purpose |
|---|---|---|
| `contractmind_token` | `localStorage` | JWT authentication token for API calls |
| `contractmind_user` | `localStorage` | Serialized user profile JSON object |
| `cm_role` | `localStorage` | Normalized user role string (`GENERAL`, `LAWYER`, etc.) |
| `app_auth_v2` | `localStorage` | Hackathon demo session state cache |
| `app_lang` | `localStorage` | Selected language (`en` or `bn`) |
| `app_persona` | `localStorage` | Active persona identifier |
| `app_theme` | `localStorage` | Active theme (`light` or `dark`) |
| `contract_audit_{id}` | `localStorage` | Cached local audit result fallback |
| `pending_lawyer_applications` | `localStorage` | Offline mock store for lawyer applications |
| `active_audit_contract` | `sessionStorage` | Bridges selected contract from ContractMind into Copilot |

---

## 10. Complete Backend API Service Reference

The API client (`src/lib/api.ts`) communicates with the FastAPI backend either through the Next.js rewrite proxy (`/api/*`) or directly to `NEXT_PUBLIC_API_URL` (`https://legal-copilot-backend-088i.onrender.com`).

### Authentication & User Endpoints
- `POST /api/auth/login`: Email and password authentication.
- `POST /api/auth/register/email`: New user email registration.
- `POST /api/auth/verify-otp`: 6-digit OTP verification.
- `POST /api/auth/forgot-password`: Password reset request.
- `POST /api/auth/reset-password`: Set new password with reset token.
- `GET /api/auth/me`: Fetch current authenticated user profile.
- `DELETE /api/auth/me`: Delete user account.
- `POST /api/auth/onboard/lawyer`: Submit advocate license application.

### Contract Intelligence Endpoints
- `POST /api/contracts/upload`: Multipart FormData file upload (.pdf, .docx, images).
- `GET /api/contracts/history`: Paginated list of uploaded contracts.
- `GET /api/contracts/{id}`: Detailed contract audit result and risk report.
- `DELETE /api/contracts/{id}`: Delete contract audit.
- `GET /api/contracts/{id}/download`: Fetch original document file.
- `POST /api/contracts/{id}/request-lawyer`: Dispatch contract to advocate queue.

### Legal Copilot Chat Endpoints
- `GET /api/chat/sessions`: List user chat sessions.
- `POST /api/chat/sessions`: Create new chat session (general or contract-bound).
- `GET /api/chat/sessions/{id}`: Load full message history of a session.
- `POST /api/chat/sessions/{id}/close`: Mark chat session closed.
- `POST /api/chat/query`: Submit query to LangGraph agent with PII-masked content.

### Advocate Marketplace Endpoints
- `GET /api/lawyer/queue`: Retrieve incoming review offers (with 3-hour expiry).
- `POST /api/lawyer/queue/{id}/accept`: Accept incoming review task.
- `POST /api/lawyer/queue/{id}/decline`: Decline offer and return to dispatcher.
- `GET /api/lawyer/active`: Retrieve ongoing assigned review tasks.
- `POST /api/lawyer/active/{id}/submit`: Submit certified review remarks & seal.
- `POST /api/lawyer/active/{id}/chat-session`: Start dedicated client-lawyer chat.
- `POST /api/lawyer/active/{id}/upload-proof`: Upload signed advocate review certificate.
- `GET /api/lawyer/earnings`: View earnings breakdown and completed stats.
- `GET /api/lawyer/withdrawals`: List past withdrawal requests.
- `POST /api/lawyer/withdrawals/request`: Request payout to bKash/Nagad wallet.

### Enterprise Multi-Tenancy Endpoints
- `GET /api/company/dashboard`: Company wallet credits, member limits, referral code.
- `GET /api/company/members`: List active company members.
- `GET /api/company/members/pending`: List pending join requests.
- `POST /api/company/members/{id}/approve`: Approve member registration.
- `POST /api/company/members/{id}/reject`: Reject member registration.
- `POST /api/company/members/{id}/quota`: Adjust member monthly audit quota.
- `POST /api/company/members/{id}/suspend`: Suspend member seat.
- `POST /api/company/members/{id}/reactivate`: Reactivate suspended seat.
- `DELETE /api/company/members/{id}/remove`: Remove member from organization.
- `GET /api/company/playbooks`: List active and draft compliance playbooks.
- `POST /api/company/playbooks`: Upload and create new compliance playbook.
- `POST /api/company/playbooks/{id}/activate`: Activate playbook for organization audits.
- `DELETE /api/company/playbooks/{id}`: Delete playbook.
- `GET /api/company/shared-contracts`: Access organization-wide audit repository.
- `GET /api/company/audit-logs`: Enterprise security audit trail.

### Billing & Payments Endpoints
- `GET /api/payments/packages`: Fetch credit purchase bundles.
- `POST /api/payments/initiate`: Initiate credit purchase transaction.
- `POST /api/payments/{id}/submit-trx`: Submit bKash Transaction ID.
- `POST /api/payments/{id}/cancel`: Cancel pending payment.
- `GET /api/payments/history/me`: User payment history ledger.
- `GET /api/payments/summary/me`: User credit balance summary.

### Super-Admin Endpoints
- `GET /api/admin/dashboard`: Platform high-level KPIs and metrics.
- `GET /api/admin/lawyers/pending`: List pending advocate verifications.
- `POST /api/admin/lawyers/{id}/approve`: Approve advocate account.
- `POST /api/admin/lawyers/{id}/reject`: Reject advocate application.
- `POST /api/admin/lawyers/{id}/suspend`: Suspend advocate license.
- `GET /api/admin/enterprises/pending`: List pending corporate tenants.
- `POST /api/admin/enterprises/{id}/approve`: Approve enterprise account.
- `GET /api/admin/payments/pending`: List pending bKash TrxID submissions.
- `POST /api/admin/payments/{id}/approve`: Confirm bKash payment & disburse credits.
- `GET /api/admin/withdrawals/pending`: List pending advocate payout requests.
- `POST /api/admin/withdrawals/{id}/approve`: Approve payout request.
- `POST /api/admin/withdrawals/{id}/paid`: Mark payout as disbursed.
- `POST /api/admin/withdrawals/{id}/reject`: Reject payout request.
- `GET /api/admin/users`: Search and list all registered platform users.
- `GET /api/admin/financials`: Platform revenue and commission financial metrics.

---

## 11. Environment Variables & Setup Guide

### Environment Variables
| Variable | Description | Default / Production Value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of ContractMind FastAPI Backend | `https://legal-copilot-backend-088i.onrender.com` |
| `BACKEND_INTERNAL_URL` | Private network backend endpoint used in Next.js rewrites | Falls back to `NEXT_PUBLIC_API_URL` |
| `NODE_ENV` | Node execution environment | `development` / `production` |

### Getting Started Locally

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Run Development Server**:
   From repository root:
   ```bash
   npm run dev
   ```
   Or inside `frontend/`:
   ```bash
   npm run dev
   ```
   Server will launch on `http://localhost:3000`.

3. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 12. Known Technical Debt & Immediate Roadmap

1. **Re-enable TypeScript Type Checks**: Currently `ignoreBuildErrors: true` is enabled in `next.config.ts`. Re-enabling strict build checks will ensure compile-time safety.
2. **Decompose Monolithic Pages**: Refactor large page files (`page.tsx` 166 KB, `admin/page.tsx`, `enterprise/admin/page.tsx`) into modular feature slices.
3. **Automated Testing Suite**: Introduce Vitest and React Testing Library for core unit tests (especially `dispatcher.ts`, `piiMasker.ts`, and context reducers) and Playwright for end-to-end user flows.
4. **Data Fetching Layer**: Migrate from bare `useEffect` calls to `@tanstack/react-query` to gain request deduplication, background revalidation, and unified caching.

