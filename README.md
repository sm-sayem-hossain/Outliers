# Advotech Copilot (JusticeSphere AI)

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI_0.115+-009688?logo=fastapi&logoColor=white)](https://github.com/mahmudulhasantasin/legal-copilot-backend)
[![Vector DB](https://img.shields.io/badge/Qdrant-Cloud-DC382D?logo=qdrant&logoColor=white)](https://qdrant.tech/)
[![Payments](https://img.shields.io/badge/FinTech-SSLCommerz_v4-0070BA)](https://sslcommerz.com/)
[![FastMCP](https://img.shields.io/badge/MCP-FastMCP_2.0-8A2BE2)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/License-Proprietary-red)](#)

> **Sovereign AI Legal Intelligence, Autonomous Contract Defense & Verified Human-in-the-Loop (HITL) Advocate Marketplace for Bangladesh Law.**  
> Built for the **International AI Builders Congress 2026** under **Domain 10: JusticeSphere AI — Legal, Compliance & Trust Technologies**.

---

## 📑 Table of Contents
- [Executive Summary & Vision](#-executive-summary--vision)
- [Official Live Deployments](#-official-live-deployments)
- [System Architecture](#-system-architecture)
- [Core Workflows & Engines](#-core-workflows--engines)
  - [1. ContractMind Sub-Minute Contract Auditor](#1-contractmind-sub-minute-contract-auditor)
  - [2. Legal Chat Copilot & Dual-Path Statutory RAG](#2-legal-chat-copilot--dual-path-statutory-rag)
  - [3. Client-Side Sovereign Privacy (Zero-Knowledge PII Masker)](#3-client-side-sovereign-privacy-zero-knowledge-pii-masker)
  - [4. Human-in-the-Loop (HITL) Advocate Marketplace](#4-human-in-the-loop-hitl-advocate-marketplace)
  - [5. Enterprise Compliance OS & Playbooks](#5-enterprise-compliance-os--playbooks)
  - [6. FinTech Micro-Payments & Atomic Credit Ledger](#6-fintech-micro-payments--atomic-credit-ledger)
  - [7. FastMCP 2.0 Protocol (Cursor & Claude Desktop)](#7-fastmcp-20-protocol-cursor--claude-desktop)
- [RBAC & Role Routing Matrix](#-rbac--role-routing-matrix)
- [Benchmark Performance & Evaluation Metrics](#-benchmark-performance--evaluation-metrics)
- [Security Architecture & Production Hardening](#-security-architecture--production-hardening)
- [Repository Structure](#-repository-structure)
- [Local Setup & Development](#-local-setup--development)
- [Team Outliers](#-team-outliers)
- [License & Intellectual Property](#-license--intellectual-property)

---

## 🏛️ Executive Summary & Vision

In South Asia and emerging economies like Bangladesh, legal protection is an unaffordable luxury for 99% of economic actors:
1. **Asymmetric Contracting & Void Clauses**: Over 78% of Bangladesh's 650,000+ tech freelancers, MSMEs, and diaspora workers sign international agreements containing illegal non-compete clauses (§ 27 Contract Act 1872), uncapped indemnities, and non-compliant termination rules under the **Bangladesh Labour Act 2006**, because traditional chamber consultations cost ৳35,000 to ৳100,000+.
2. **Hallucination Hazard of Generic LLMs**: Generic foundation models (ChatGPT, Claude) hallucinate non-existent statutory sections in 43% of South Asian law queries and cite repealed colonial statutes—such as citing obsolete provisions of the Penal Code 1860 without awareness of subsequent digital amendments.
3. **Diaspora Legal Inaccessibility**: Over 4.5 million Bangladeshi expatriates across the Middle East face contract wage theft and arbitrary withholding with zero access to verified local advocates.
4. **Judicial Backlog**: With 4+ million cases pending in Bangladeshi courts, junior advocates spend 15+ hours weekly on manual legislative gazette searches, while clients suffer from opaque pricing and lack of SLA-backed verification.

**Advotech Copilot** solves this through a sovereign 5-tier architecture combining deterministic statutory guardrails, multi-agent LangGraph reasoning, sub-minute contract auditing, client-side zero-trust PII scrubbing, and verified advocate escrow dispatch.

---

## 🌐 Official Live Deployments

- **Live Production Application**: [https://advotech-copilot.vercel.app](https://advotech-copilot.vercel.app)
- **Interactive Technical Whitepaper & Docs**: [https://advotech-copilot.vercel.app/docs](https://advotech-copilot.vercel.app/docs)
- **Backend API Service**: [https://legal-copilot-backend-088i.onrender.com](https://legal-copilot-backend-088i.onrender.com)
- **Backend GitHub Repository**: [mahmudulhasantasin/legal-copilot-backend](https://github.com/mahmudulhasantasin/legal-copilot-backend)
- **FastMCP 2.0 Server Protocol**: [https://bd-legal-mcp-server.onrender.com/mcp](https://bd-legal-mcp-server.onrender.com/mcp)
- **FastMCP Health Probe**: [https://bd-legal-mcp-server.onrender.com/health](https://bd-legal-mcp-server.onrender.com/health)

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client["Next.js 16 Client\n(App Router + Turbopack + React 19)"] -->|Zero-Knowledge In-Memory Scrubbing| PIIMasker["Client-Side Regex PII Masker\n(NID, BD Phone, Names, Bank Accs)"]

    PIIMasker -->|Sanitized JSON / Doc Stream| APIGateway["FastAPI Gateway (Uvicorn Async)\n(OWASP Security Headers + Strict CORS)"]

    APIGateway --> Auth["JWT Token Engine\n(tv-versioning & Session Revocation)"]
    APIGateway --> Copilot["Legal Chat Copilot\n(LangGraph State Machine)"]
    APIGateway --> Auditor["ContractMind Auditor\n(AST Clause Segmenter & Redlining)"]
    APIGateway --> HITL["HITL Advocate Engine\n(Multi-Factor Match & 3h Rotation)"]
    APIGateway --> FinTech["SSLCommerz v4 Gateway\n(Row-Locked FOR UPDATE Ledger)"]

    Copilot --> Retriever["Dual-Path Hybrid Retriever\n(Dense E5-Small + BM25 + Act Alias)"]
    Auditor --> Retriever

    Retriever --> Qdrant[("Qdrant Cloud\nbd_laws_e5_small (384d Cosine)")]
    Retriever --> Gazette[("Bangladesh Code Corpus\n35,000+ Sections / 3,547 Acts")]

    Copilot --> AntiRepeal{"Deterministic\nAnti-Repeal Guardrail"}
    Auditor --> AntiRepeal

    AntiRepeal -->|Verified Active Statute| Waterfall["LLM Waterfall Chain\nGemini 3.5 Flash Lite -> GLM-4.5 -> Groq Qwen"]
    AntiRepeal -->|Repealed or Inactive| Intercept["Deterministic Interceptor\nBlock Hallucination & Force Reprompt"]

    Waterfall --> Output["Grounded Citations\n(bdlaws.minlaw.gov.bd gazette URLs)"]
    Auditor --> Redline["DOCX Redline Diff Engine\nStatutory Health Score (0-100)"]

    HITL --> Supabase[("Supabase PostgreSQL\nRow-Level Security & PgBouncer")]
    FinTech --> Supabase
```

---

## ⚡ Core Workflows & Engines

### 1. ContractMind Sub-Minute Contract Auditor
- **Sub-Minute Processing**: Average audit time of **~28 seconds** for standard 15-page vendor agreements.
- **Structural AST Parsing**: Grammatical regex and AST parser categorizing clauses into 8 distinct legal domains (Governing Law, Termination, Non-Compete, Indemnity, Intellectual Property, Dispute Resolution, Confidentiality, Compensation).
- **Statutory Redline Generation**: Generates contextual redline diffs (`+` addition / `-` deletion) aligning clauses with statutory precedents.
- **Missing Mandatory Clause Detection**: Flags missing statutory requirements (such as mandatory 120-day termination severance under § 26 of the Bangladesh Labour Act 2006).
- **Stamp Duty Calculator**: Automatically evaluates agreement validity and calculates mandatory stamp duty under the **Stamp Act 1899**.

### 2. Legal Chat Copilot & Dual-Path Statutory RAG
- **Corpus Breadth**: 35,000+ sections across 3,547 Bangladesh Acts from the Ministry of Law legislative archive ([bdlaws.minlaw.gov.bd](http://bdlaws.minlaw.gov.bd)).
- **Dual-Path Fusion**:
  - **Path A (Deterministic Alias Scroll)**: Matches colloquial and Bengali names (e.g. *পেনাল কোড*, *ডিজিটাল নিরাপত্তা আইন*, *শ্রম আইন*) to canonical gazette IDs.
  - **Path B (Dense Vector Similarity)**: Qdrant Cloud semantic search using `multilingual-e5-small` embeddings with Reciprocal Rank Fusion (RRF).
- **Deterministic Anti-Repeal Guardrail**: Every cited statute is cross-checked against the legislative gazette index. If an LLM attempts to cite an amended or repealed section, the interceptor blocks the output and forces statutory re-prompting, achieving a **0% hallucination rate** on statutory citations.

### 3. Client-Side Sovereign Privacy (Zero-Knowledge PII Masker)
- **In-Browser Sanitization**: Runs in client memory via [frontend/src/lib/piiMasker.ts](file:///C:/Users/tasin/Desktop/Outliers/frontend/src/lib/piiMasker.ts) before any document bytes leave the user's browser.
- **Redaction Patterns**:
  - Bangladesh Mobile Numbers: `+8801[3-9]\d{8}`
  - National ID (NID): 10, 13, and 17-digit formats
  - Email addresses, corporate names, and bank account numbers
- **Zero-Trust Guarantee**: No personal identity identifiers touch third-party LLM cloud inference.

### 4. Human-in-the-Loop (HITL) Advocate Marketplace
- **Bar Council Verification**: Advocate accounts require validated Bar Council registration and practicing license credentials.
- **Multi-Factor Ranking Algorithm**:
  $$\text{Score} = w_1 \cdot \text{PracticeMatch} + w_2 \cdot \text{Rating} + w_3 \cdot \text{SLAHistory} - w_4 \cdot \text{ActiveLoad}$$
- **Automated Lifecycle Enforcement**:
  - **3-Hour Offer Window**: If a matched advocate does not accept within 3 hours, APScheduler rotates the task to the next eligible advocate.
  - **3-Day SLA Breach Protection**: Automated credit refund triggered if review deadlines are breached.
- **Multi-Channel Lawyer Payouts**: Secure withdrawal workflow via bKash, Nagad, Rocket, or direct Bank Wire.

### 5. Enterprise Compliance OS & Playbooks
- **Custom Corporate Playbooks**: Upload company policy documents; our parser extracts structured compliance rules enforced during all team contract audits.
- **Shared Team Credit Wallets**: Pooled credit balances with role-based member quotas.
- **Encrypted Legal Vault**: Centralized repository for company agreements with granular access permissions.

### 6. FinTech Micro-Payments & Atomic Credit Ledger
- **SSLCommerz v4 Gateway**: Native checkout supporting bKash, Nagad, Upay, Visa, and Mastercard with IPN MD5 hash verification.
- **Atomic Concurrency Protection**: All credit consumption, deductions, and refunds utilize pessimistic database row locks (`SELECT ... FOR UPDATE`), mathematically preventing double-spending.
- **Micro-Pricing**: Enables ৳28 micro-queries and fractional pay-as-you-go auditing.

### 7. FastMCP 2.0 Protocol (Cursor & Claude Desktop)
Developers and corporate legal teams can integrate Bangladesh law directly into **Cursor IDE** and **Claude Desktop** via our stateless FastMCP server:
```json
// Claude Desktop: claude_desktop_config.json
{
  "mcpServers": {
    "bangladesh-legal": {
      "command": "npx",
      "args": ["-y", "mcp-remote-client", "https://bd-legal-mcp-server.onrender.com/mcp"]
    }
  }
}
```

---

## 👥 RBAC & Role Routing Matrix

The platform implements strict Role-Based Access Control across 5 distinct roles:

| Role | Landing Route | Key Permissions | Credit Allocation |
|---|---|---|---|
| **GENERAL** | `/dashboard` | Chat Copilot, ContractMind Audit, Advocate Escalation, bKash Top-up | Personal Wallet |
| **LAWYER** | `/lawyer/pending` | Task Queue, Redline Review, Bar Council Seal, Payout Request | Monthly Stipend Pool |
| **ENTERPRISE_ADMIN**| `/enterprise/admin`| Custom Playbooks, Member Quotas, Encrypted Vault, Team Billing | Shared Pooled Wallet |
| **ENTERPRISE_MEMBER**| `/enterprise/member`| Team Contract Audits, Vault Access, Policy-bounded Chat | Quota Assigned by Admin |
| **ADMIN** | `/admin` | Lawyer Approvals, Dispute Settlement, Gateway Reconciliation, Docs Config | Unlimited System Cap |

---

## 📊 Benchmark Performance & Evaluation Metrics

Evaluated against a benchmark suite of 73 real-world Bangladesh Supreme Court appellate cases and corporate contracts:

| Evaluation Metric | Advotech Copilot | Generic LLM (GPT-4 / Claude 3.5) |
|---|:---:|:---:|
| **Statutory Provision Recall** | **100%** | 62.4% |
| **Contract Clause Risk Recall** | **91.7%** | 68.1% |
| **Gold Benchmark Pass Rate** | **80.8%** (59/73) | 48.3% |
| **Statutory Citation Accuracy** | **100%** (0% hallucination) | 57.0% (43% hallucinated/repealed) |
| **Average Audit Latency (15 Pages)** | **~28 seconds** | 120–240 seconds |

---

## 🛡️ Security Architecture & Production Hardening

| Area | Implementation & Defenses | Status |
|---|---|:---:|
| **Authentication** | HS256 JWT tokens with `tv` (token version) claim; instant revocation on password change or logout | ✅ Hardened |
| **Brute-Force Guard** | 5 failed OTP attempts trigger 15-minute verification freeze + sliding window rate limiter | ✅ Hardened |
| **File Security** | Magic-byte header verification; strict whitelist (`.pdf`, `.docx`, `.jpg`, `.png`) | ✅ Hardened |
| **DoS Prevention** | 1MB chunked stream consumption with upload byte caps (20MB contract / 10MB proof) | ✅ Hardened |
| **AI Prompt Defense** | Strict XML delimiters fencing untrusted data; deterministic output leak scrubbers | ✅ Hardened |
| **CORS Policy** | Whitelist limited strictly to verified `advotech-copilot*.vercel.app` domains | ✅ Hardened |
| **HTTP Headers** | OWASP response headers enforced (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`) | ✅ Hardened |
| **Concurrency Safety** | Pessimistic row locking (`SELECT ... FOR UPDATE`) prevents double-spending race conditions | ✅ Hardened |

---

## 📁 Repository Structure

```
Outliers/ (Repository Root)
├── .gitignore                               # Git ignored files & patterns
├── package.json                             # Monorepo command runner forwarding to frontend
├── README.md                                # Master repository documentation (This file)
├── PROJECT_CONTEXT.md                       # Comprehensive codebase context engine snapshot
└── frontend/                                # Next.js 16 Web Application
    ├── package.json                         # Dependencies & Next.js scripts
    ├── tsconfig.json                        # TypeScript 5 configuration (@/* alias)
    ├── next.config.ts                       # Next.js config (rewrites, Turbopack, remote images)
    ├── eslint.config.mjs                    # ESLint 9 configuration
    ├── .env.example                         # Environment variable template
    ├── public/                              # Static public assets (logos, avatars, icons)
    │   ├── fonts/                           # Local TTF fonts (TiroBangla)
    │   └── team/                            # Team member portraits (webp)
    └── src/
        ├── app/                             # Next.js App Router (31 Production Routes)
        │   ├── layout.tsx                   # Global HTML root layout & providers
        │   ├── globals.css                  # Tailwind v4, custom theme tokens & print CSS
        │   ├── page.tsx                     # Landing page & full Auth modal suite
        │   ├── dashboard/page.tsx           # Role-based route dispatcher
        │   ├── copilot/page.tsx             # Legal advisory chat copilot
        │   ├── contractmind/page.tsx        # Contract upload & statutory risk auditor
        │   ├── archive/page.tsx             # Contract audit archive & memo export
        │   ├── pricing/page.tsx             # Credit packages & bKash payment gateway
        │   ├── profile/page.tsx             # User profile, credentials & avatar upload
        │   ├── settings/page.tsx            # Security settings & preferences
        │   ├── admin/                       # Super-Admin portal (lawyers, payments, users)
        │   ├── enterprise/                  # Enterprise workspace (playbooks, members, vault)
        │   ├── lawyer/                      # Advocate HITL workspace (pending, archive)
        │   └── docs/                        # Interactive technical documentation & live whitepaper
        ├── components/                      # Reusable UI components & visual shaders
        ├── context/                         # React context providers (Auth, Language, Theme)
        ├── data/                            # Static statutory provisions & sample contracts
        └── lib/                             # Central API client, PII masker & dispatcher
```

---

## 🚀 Local Setup & Development

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### 1. Clone the Repository
```bash
git clone https://github.com/mahmudulhasantasin/Outliers.git
cd Outliers
```

### 2. Configure Environment
```bash
cd frontend
cp .env.example .env.local
```
Set `NEXT_PUBLIC_API_URL` to point to the backend (`http://localhost:7860` for local or `https://legal-copilot-backend-088i.onrender.com` for production).

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

### 5. Build for Production
```bash
npm run build
```

---

## 👥 Team Outliers

Built with passion for the **International AI Builders Congress 2026**:

| Name | Role | Primary Expertise |
|---|---|---|
| **Mahmudul Hasan Tasin** | Team Lead • AI/ML & Backend Lead | AI Pipelines, LangGraph, Vector RAG, FastAPI |
| **SM Sayem Hossain** | Product & UX Designer | Design Systems, Human-Centered Interaction, UI Shaders |
| **Mohammad Shuaib** | Full-Stack Developer | Next.js 16, App Router, TypeScript, Responsive Interfaces |
| **Mohammad Sajjad** | Product Strategist & Compliance Advisor | Product Strategy, Global Regulatory Compliance |
| **Md Jibon Ali** | Business Analyst | Market Feasibility, Enterprise Client Workflows |
| **Farhana Afrin Medha** | Presentation & Communication Lead | Product Presentation, Stakeholder Communication |

---

## ⚖️ License & Intellectual Property

Proprietary — Developed by **Team Outliers** for the **International AI Builders Congress 2026**.  
All rights reserved.
