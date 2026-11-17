# Project Context

> Status: INITIALIZED  
> Last Verified: 2026-11-11  
> Engine Version: 1.0.0  

## Project identity
- **Name**: JusticeSphere AI / Advotech Copilot Frontend
- **Brand Names in Code**: Advotech Copilot, ContractMind, লিগ্যাল কোপাইলট
- **Purpose**: AI-native legal intelligence platform and verified lawyer review marketplace interface for Bangladesh Law. Provides conversational legal research with statutory grounding, autonomous contract risk auditing, redline diff generation, enterprise compliance playbook management, and advocate Human-in-the-Loop (HITL) dispatching.
- **Repository Path**: `c:\Users\tasin\Desktop\Outliers\frontend`
- **Primary Languages**: TypeScript 5, JavaScript (ES2017+), HTML5, CSS3
- **Frameworks & Core Libraries**: Next.js 16.4.3 (App Router), React 19.3.0, React-DOM 19.3.0
- **Styling & Design System**: Tailwind CSS v4 (`@tailwindcss/turbopack`), `clsx`, `tailwind-merge`, CSS custom properties for dual-theme mode (Light/Dark)
- **Animation & Graphics**: Framer Motion 14.0.0, GSAP 3.15.0, OGL 1.0.11 (minimal WebGL)
- **Icons**: Lucide React (`lucide-react` 1.52.0), HugeIcons (`@hugeicons/react` 1.1.10, `@hugeicons/core-free-icons` 4.3.5)
- **Runtime & Build Tools**: Node.js 20+, Next.js Turbopack, ESLint 9 (`eslint-config-next` 16.4.0)

## System overview
- **Entry Points & Routing**:
  - `src/app/layout.tsx`: Root HTML layout wrapping providers (`ThemeProvider`, `LanguageProvider`, `PersonaProvider`, `AuthProvider`), Google Font Inter, local/remote Tiro Bangla font.
  - `src/app/page.tsx`: Full-featured landing page with WebGL canvas effects, interactive stats, persona highlights, and integrated multi-flow Auth Modal (login, email registration, OTP verification, password reset, demo profiles).
  - `src/app/dashboard/page.tsx`: Role-based router dispatcher redirecting users to appropriate workspaces based on normalized role (`LAWYER` -> `/lawyer/pending`, `ADMIN` -> `/admin`, `ENTERPRISE` -> `/enterprise/admin`, `GENERAL` -> `/copilot`).
  - `src/app/login/page.tsx`: Auth redirect gateway (routes authenticated users to dashboard and guests to `/?auth=login`).
  - `src/app/copilot/page.tsx`: Conversational legal research copilot with chat sessions, statutory provisions drawer, client-side PII masking, and Markdown viewer.
  - `src/app/contractmind/page.tsx`: Autonomous contract risk auditor supporting PDF/DOCX/image uploads, clause risk scoring against Bangladesh statutes, redline suggestions, and advocate dispatching.
  - `src/app/archive/page.tsx`: Stored contract audit repository with risk filters, search, HITL status badges, and Markdown/PDF export.
  - `src/app/admin/page.tsx`: Super-admin control panel for approving advocates, managing enterprise tenants, inspecting SSLCommerz gateway payments & reconciliation, adjusting user/enterprise credits, and processing multi-channel payouts.
  - `src/app/enterprise/admin/page.tsx`: Corporate workspace for team credit pools, member invite/quota management, playbook rule enforcement, and audit logs.
  - `src/app/enterprise/member/page.tsx`: Enterprise member workspace for playbook-guided audits and shared contracts.
  - `src/app/lawyer/pending/page.tsx`: Advocate verification pending status portal.
  - `src/app/lawyer/archive/page.tsx`: Advocate completed reviews repository, earnings ledger, and multi-channel payout requests (bKash, Nagad, Rocket, Bank Transfer).
  - `src/app/pricing/page.tsx`: Credit package catalog, SSLCommerz Verified Payment Gateway checkout, pre-checkout phone prompt modal, callback status verification, and payment history.
  - `src/app/profile/page.tsx`: User profile management, advocate/enterprise credentials, credit ledger view, and avatar upload.
  - `src/app/settings/page.tsx`: Application preferences, security controls, password changes, and account deletion.

- **Major UI Components**:
  - `AppShell` (`src/components/layout/AppShell.tsx`): Main workspace wrapper with responsive left-side dock clearance and print media reset.
  - `AppDock` (`src/components/dock/AppDock.tsx`) & `VerticalDock` (`src/components/dock/VerticalDock.tsx`): Floating desktop vertical navigation bar with Framer Motion magnification effects and mobile drawer drawer. Dynamically adapts navigation items according to user role.
  - `MarkdownViewer` (`src/components/markdown/MarkdownViewer.tsx`): Custom legal markdown renderer supporting diff redlines (`+`/`-`), statutory citations, GitHub-style alerts, and advocate verification seals.
  - `PromptBar` (`src/components/prompt/PromptBar.tsx`): Multi-action command prompt bar supporting slash commands (`/audit`, `/memo`, `/redline`), speech dictation stubs, and morphing send states.
  - Visual Effects (`src/components/effects/`): `ThoughtLine` (AI reasoning step visualizer), `GradientWaves`, `DitherVeil`, `PixelSwap`, `CountUp`, `FadeContent`, `Aurora`, `DotField`, `SmoothScrollProvider`.

- **Client State Management**:
  - Built with React Context API and local browser persistence. No external state libraries (Redux/Zustand) installed.
  - `AuthContext`: Authentication lifecycle, JWT storage, role normalization, user profile synchronization, admin approval actions, and demo profile switching.
  - `LanguageContext`: English / Bengali localization (`en` / `bn`), persisted in `localStorage:app_lang`.
  - `PersonaContext`: 4 distinct legal personas (`sme`, `hr`, `freelancer`, `advisor`) with tailored prompt triggers.
  - `ThemeContext`: Dual-theme mode (`light` / `dark`), synchronizing `dark` class on root `<html>`.
  - `localStorage` Keys: `contractmind_token`, `contractmind_user`, `cm_role`, `app_auth_v2` (demo session), `app_lang`, `app_persona`, `app_theme`, `pending_lawyer_applications`, `contract_audit_{id}`.
  - `sessionStorage` Keys: `active_audit_contract` (bridges contract analysis into copilot chat sessions).

- **API & Network Integration**:
  - `src/lib/api.ts`: Fetch-based singleton HTTP client automatically attaching Bearer tokens, enforcing a 90-second timeout with `AbortController`, handling 401 unauthenticated redirects, supporting `FormData` uploads, and parsing FastAPI/Pydantic validation errors.
  - `src/lib/apiServices.ts`: Strongly typed service module covering all domain modules (contracts, chat sessions, lawyer tasks/earnings/multi-channel withdrawals, enterprise members/playbooks, SSLCommerz payments, settings, and admin gateway ledger & credit adjustments).
  - Next.js Rewrites (`next.config.ts`): Proxies `/api/:path*` to `BACKEND_INTERNAL_URL` || `NEXT_PUBLIC_API_URL` || `https://legal-copilot-backend-088i.onrender.com`.

- **Client-Side Sovereign Logic**:
  - `src/lib/piiMasker.ts`: In-browser regex and entity redaction mask for emails, Bangladeshi phone numbers (`+8801...`), and known corporate entities before cloud transmission.
  - `src/lib/dispatcher.ts`: Client-side implementation of advocate matching algorithm (domain match, rating, workload capacity, user affinity, SLA urgency score).
  - `src/lib/markdownContractGenerator.ts`: Generates structured legal memorandum and audit reports formatted for export and PDF printing.

## Key modules and responsibilities
| Module / Path | Responsibility | Important Symbols | Depends On |
|---|---|---|---|
| `src/context/AuthContext.tsx` | Authentication state, user profile, registration/login, OTP, role normalization, demo personas | `AuthProvider`, `useAuth`, `normalizeUserRole`, `meResponseToProfile` | `src/lib/api.ts`, `src/lib/auth.ts` |
| `src/context/LanguageContext.tsx` | Bilingual (Bangla/English) translation provider | `LanguageProvider`, `useLanguage`, `translations` | React |
| `src/context/PersonaContext.tsx` | Persona management for tailored contract advice | `PersonaProvider`, `usePersona`, `PERSONAS` | React |
| `src/context/ThemeContext.tsx` | Dark/Light theme toggle & root class toggle | `ThemeProvider`, `useTheme` | React |
| `src/lib/api.ts` | Central HTTP client with Bearer auth & timeout handling | `api`, `ApiError` | `src/lib/auth.ts` |
| `src/lib/apiServices.ts` | Typed backend API endpoints and data interfaces | `uploadContract`, `getContractHistory`, `createChatSession`, `sendChatQuery`, `getLawyerQueue`, `submitReview`, `getCompanyDashboard`, `getPaymentGatewayConfig`, `initiatePayment`, `verifyPaymentStatus`, `getAdminPayments`, `adjustAdminUserCredits`, `adjustAdminEnterpriseCredits` | `src/lib/api.ts` |
| `src/lib/auth.ts` | Local token and session storage operations | `saveTokenResponse`, `getToken`, `clearAuth`, `getRoleHint`, `setRoleHint` | Web Storage API |
| `src/lib/dispatcher.ts` | Advocate matching algorithm | `runDispatchAlgorithm`, `INITIAL_DEMO_LAWYERS` | Pure TS |
| `src/lib/piiMasker.ts` | Sovereign client-side PII redactor | `maskPii`, `PiiRedactionResult` | Pure TS |
| `src/lib/markdownContractGenerator.ts` | Markdown memo & audit report generator | `generateContractAuditMarkdown` | `src/data/*` |
| `src/components/layout/AppShell.tsx` | Responsive page container with dock clearance | `AppShell` | `src/components/dock/AppDock.tsx` |
| `src/components/dock/AppDock.tsx` | Role-based navigation dock controller | `AppDock` | `src/components/dock/VerticalDock.tsx`, `src/context/*` |
| `src/components/markdown/MarkdownViewer.tsx` | Legal markdown & redline comparison visualizer | `MarkdownViewer` | `lucide-react` |
| `src/components/prompt/PromptBar.tsx` | Interactive prompt bar with slash command support | `PromptBar`, `DEFAULT_COMMANDS` | `framer-motion`, `@hugeicons/react` |
| `src/data/contractAudits.ts` | Pre-computed audit results for demo contracts | `CONTRACT_AUDITS`, `ContractAudit` | Pure TS |
| `src/data/sampleContracts.ts` | Sample legal contracts in English & Bangla | `SAMPLE_CONTRACTS`, `SampleContract` | Pure TS |
| `src/data/statutoryProvisions.ts` | Bangladesh statutes & bdlaws links database | `STATUTORY_PROVISIONS`, `StatutoryProvision` | Pure TS |
| `src/data/enterpriseData.ts` | Corporate playbook rules & member fixtures | `CompanyPlaybook`, `PlaybookRule` | Pure TS |

## Environment variables and configuration
| Variable | Description | Default / Fallback |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL for FastAPI backend | `https://legal-copilot-backend-088i.onrender.com` |
| `BACKEND_INTERNAL_URL` | Private network backend endpoint used in Next.js rewrites | Falls back to `NEXT_PUBLIC_API_URL` |
| `NODE_ENV` | Node execution environment | `development` / `production` |
| `VERCEL_OIDC_TOKEN` | Vercel deployment credentials | Managed by Vercel CLI |

## Technical debt and architectural risks
1. **Bypassed TypeScript Build Checks**: `next.config.ts` explicitly sets `typescript: { ignoreBuildErrors: true }`. Type errors do not fail production builds, allowing hidden runtime bugs to slip into production.
2. **Zero Automated Tests**: No unit, integration, or end-to-end test framework (Jest, Vitest, Playwright) is configured. All test scripts are missing in `package.json`.
3. **Monolithic Page Components**: `src/app/page.tsx` (157 KB), `src/app/admin/page.tsx` (66 KB), `src/app/enterprise/admin/page.tsx` (66 KB), and `src/app/copilot/page.tsx` (51 KB) contain heavy embedded logic, inline modal states, and large render trees that should be decomposed into feature-sliced components.
4. **Hybrid Storage & Inconsistent Cache Coherence**: The frontend mixes real backend API calls with localStorage fallbacks (e.g. `contract_audit_{id}`, `pending_lawyer_applications`). If backend state changes out-of-band, localStorage caches can cause stale UI state.
5. **No Centralized Global Data Cache**: Lack of React Query / TanStack Query means every page handles its own loading, error, and refetch states imperatively using `useEffect`.
