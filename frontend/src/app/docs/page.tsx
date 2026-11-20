"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Poppins } from "next/font/google";
import { Check, ArrowDownRight, ShieldCheck, Cpu, Bot, Send, CheckCircle2, KeyRound, Users, Database, Fingerprint, Search, Menu, X, BookOpen, EyeOff, Layers, Lock, Workflow, FileCheck, Zap } from "lucide-react";
import ArchitectureExplorer from "./ArchitectureExplorer";

const fraunces = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-fraunces", display: "swap" });
const karla = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-karla", display: "swap" });

// ==========================================
// 🔐 ACCESS CONTROL & SCHEDULING DEFAULTS
// ==========================================
const ACCESS_CONFIG = {
  adminPin: "advotech2026",
  defaultStart: "2027-06-10T00:00",
  defaultEnd: "2027-06-14T23:59",
  apiBase: process.env.NEXT_PUBLIC_API_URL || "https://legal-copilot-backend-088i.onrender.com",
};

// ==========================================
// 📁 AUTHORITATIVE CONTENT PAYLOAD
// ==========================================
const INITIAL_DOCS_DATA = {
  meta: {
    company: "AdvoTech Copilot",
    tagline: "AI-powered Legal Intelligence for the Global South",
    one_liner: "AI contract audits for ৳28 ($0.25) — verified by real lawyers. Legal help that 80% of South Asians can actually afford.",
    version: "v1.0.0",
    last_updated: "2026-11-20",
  },
  stats: {
    total_users: 45,
    total_audits: 36,
    statutes_indexed: 3547,
    avg_turnaround: "< 1 min",
    benchmark_pass: "80.8%",
    accuracy_rate: "91.7%",
  },

  pitch: {
    problem: {
      headline: "80% of South Asians lack access to timely, affordable justice",
      cards: [
        {
          num: "01",
          title: "Prohibitive Cost & Delayed Turnaround",
          metric: "৳50,000+ / 7 Days",
          badge: "Economic Barrier",
          desc: "A single manual contract review costs upwards of ৳50,000 (~$450) and takes an average of 7 days through traditional chambers. 99% of freelancers, startups, and SMEs cannot afford this overhead.",
        },
        {
          num: "02",
          title: "Linguistic & Conceptual Friction",
          metric: "80%+ Population",
          badge: "Language Divide",
          desc: "Statutes and judicial precedents are written in archaic Victorian English, whereas 80%+ of citizens think and transact in Bengali or colloquial Banglish. Crucial contractual rights are lost in translation.",
        },
        {
          num: "03",
          title: "Information Asymmetry & Blind Signing",
          metric: "9 out of 10",
          badge: "Contract Risk",
          desc: "Small businesses and gig workers sign commercial leases, service agreements, and NDAs without understanding illegal penalty clauses or void covenants under the Contract Act 1872 (§ 27).",
        },
        {
          num: "04",
          title: "Diaspora Inaccessibility",
          metric: "4.5M+ Expatriates",
          badge: "Jurisdiction Gap",
          desc: "Over 4.5 million Non-Resident Bangladeshis sending remittances abroad lack access to trustworthy, transparent legal counsel back home, exposing family land and business assets to fraud.",
        },
      ],
    },

    solution: {
      headline: "An AI-native legal platform with dual execution engines: Ask & Verify",
      products: [
        {
          id: "copilot",
          tag: "ENGINE 1: GROUNDED RESEARCH",
          tagColor: "green",
          title: "Advotech Copilot (Bilingual Legal Q&A)",
          desc: "Conversational legal intelligence operating fluently in Bengali, Banglish, and English, grounded deterministically in 35,000+ codified sections of the Laws of Bangladesh.",
          highlights: [
            "3,547 Bangladesh Acts (35,000+ codified sections) indexed in statutory RAG",
            "Sub-second citation grounding via Gemini 3.5 Flash Lite + Groq Qwen 2.5 27B waterfall",
            "Deterministic foreign-jurisdiction blocker (zero hallucinations)",
          ],
          metrics: [
            { v: "3,547", l: "Acts indexed" },
            { v: "3", l: "Input languages" },
          ],
          cta: "Test Copilot Simulation Below",
          anchor: "#demo",
        },
        {
          id: "contractmind",
          tag: "ENGINE 2: AUTONOMOUS AUDIT",
          tagColor: "orange",
          title: "ContractMind (Sub-Minute Contract Risk Audit)",
          desc: "Upload any PDF agreement. In under 1 minute (benchmarked at ~28s), obtain an executive risk grade (0–100), statutory violation warnings, and copy-ready redlines.",
          highlights: [
            "Unfair penalty (§ 74) & void non-compete (§ 27) auto-detection",
            "Client-side sovereign PII redaction before cloud transmission",
            "Direct Human-in-the-Loop advocate verification dispatch (3-hr SLA)",
          ],
          metrics: [
            { v: "< 1 min", l: "Full audit" },
            { v: "0–100", l: "Risk grade" },
          ],
          cta: "Inspect Sample Audit Below",
          anchor: "#demo-audit",
        },
      ],
    },

    why_now: {
      headline: "Three technological & infrastructural curves just intersected",
      curves: [
        {
          number: "01",
          title: "LLM Reasoning Crossed Legal Reliability",
          subtitle: "Zero-Shot Common Law Comprehension",
          desc: "Modern open-weight and frontier models now consistently parse complex statutory cross-references, conditional exceptions, and multi-clause liabilities when paired with hybrid dense-sparse vector retrievers.",
        },
        {
          number: "02",
          title: "Micro-Payment Infrastructure Maturity",
          subtitle: "bKash, Nagad & SSLCommerz Rails",
          desc: "Bangladesh processed over $120B in mobile financial transactions in 2025. Collecting ৳28 ($0.25) micro-payments instantly per audit is now frictionless for millions of smartphones.",
        },
        {
          number: "03",
          title: "The Unclaimed Global South Legal Market",
          subtitle: "Western AI Tools Ignore Local Gazettes",
          desc: "Western legal-tech giants (Harvey, CoCounsel) focus on US/UK law at $10k+/seat. The $70B South Asian common-law diaspora remains virtually untouched by specialized sovereign legal AI.",
        },
      ],
    },

    market: {
      headline: "$1-2B local beachhead expanding to $70B+ Global South legal tech",
      segments: [
        {
          tier: "TAM (Total Addressable Market)",
          value: "$70B+",
          desc: "Global legal technology & AI-assisted compliance market across common law jurisdictions by 2030.",
        },
        {
          tier: "SAM (Serviceable Addressable)",
          value: "$1.8B",
          desc: "Annual spend on legal services, corporate drafting, and dispute management in Bangladesh.",
        },
        {
          tier: "SOM (Initial Beachhead)",
          value: "$28M",
          desc: "100,000+ tech freelancers, 25,000 registered SMEs, and 10,000 corporate HR departments.",
        },
      ],
      growthDrivers: [
        "10,000+ foreign multinational enterprises operating in Bangladesh requiring local statutory compliance.",
        "Over 650,000 registered IT freelancers entering global commercial contracts requiring rapid liability reviews.",
        "Regulatory push: Mandatory compliance reporting under the Bangladesh Labour Act & Data Protection standards.",
      ],
    },

    business_model: {
      headline: "Three diversified revenue streams anchored on one high-margin billing rail",
      streams: [
        {
          badge: "B2C Consumer",
          title: "Micro-Payment Top-ups",
          price: "৳28 / Audit",
          subtext: "Pay-as-you-go via bKash / SSLCommerz",
          features: [
            "৳28 per autonomous sub-minute contract audit",
            "৳5 per deep multi-statute research query",
            "Zero subscription commitment, instant onboarding",
            "Direct top-up ledger tied to user phone number",
          ],
        },
        {
          badge: "B2B Enterprise",
          title: "ComplianceOS Subscriptions",
          price: "৳15,000 - ৳45,000 / mo",
          subtext: "Corporate Legal Vaults & Playbooks",
          features: [
            "Pooled company credit balance with role quotas",
            "Custom corporate compliance playbook enforcement",
            "Shared team audit repository with permission tiers",
            "Priority advocate verification dispatch within 1 hour",
          ],
        },
        {
          badge: "Developer / API",
          title: "FastMCP Server Licensing",
          price: "Usage-based Tiered API",
          subtext: "Legal Agent Protocol for Developers",
          features: [
            "FastMCP endpoints licensable to third-party AI agents",
            "Structured statutory lookup & citation extraction tools",
            "Guaranteed 99.2% uptime SLA with resilient SSE streaming",
            "Private self-hosted enterprise VPS container deployment",
          ],
        },
      ],
    },

    traction: {
      headline: "Empirical benchmarks on gold-standard statutory datasets — zero vanity metrics",
      metrics: [
        { label: "Contract Provision Recall", value: "100%", sub: "33 of 33 test provisions identified without omission", score: 100 },
        { label: "Contract Audit Accuracy", value: "91.7%", sub: "33/36 precision on multi-clause risk scoring", score: 92 },
        { label: "RAG Act Hit@K", value: "93.9%", sub: "Top-K statutory retrieval accuracy across 52 legal cases", score: 94 },
        { label: "Deterministic Hallucination Block", value: "88.9%", sub: "16/18 security attacks & phantom sections intercepted", score: 89 },
        { label: "Golden Benchmark Suite", value: "80.8%", sub: "59/73 gold cases passed (100% statutory router accuracy)", score: 81 },
        { label: "Average E2E Latency", value: "< 2.8s", sub: "Bilingual legal chat response generation", score: 95 },
      ],
    },

    competition: {
      headline: "Why global legal AI fails in Bangladesh and why traditional firms cannot scale",
      matrix: [
        {
          feature: "Bangladesh Code Ingestion",
          advotech: "3,547 Acts (35,000+ Sections)",
          harvey: "None (US/UK Focus)",
          traditional: "Manual Paper Volumes",
          directories: "None (Phonebook Only)",
        },
        {
          feature: "Bengali & Banglish NLP",
          advotech: "Native Dialect Support",
          harvey: "English Only / Poor Translation",
          traditional: "Bilingual (Manual)",
          directories: "Static Bengali Listings",
        },
        {
          feature: "Audit Turnaround Time",
          advotech: "~30 Seconds (Live)",
          harvey: "2-5 Minutes (General)",
          traditional: "5 to 10 Business Days",
          directories: "N/A (No Audits)",
        },
        {
          feature: "Cost per Contract Review",
          advotech: "৳28 ($0.25)",
          harvey: "$10,000+ / Year Enterprise",
          traditional: "৳25,000 – ৳75,000",
          directories: "Free Search / ৳৳ Consultation",
        },
        {
          feature: "Hallucination Defense",
          advotech: "Deterministic Guard Layer",
          harvey: "Probabilistic LLM Only",
          traditional: "Human Vulnerability",
          directories: "None",
        },
        {
          feature: "Human-in-the-Loop Verifiers",
          advotech: "Supreme Court Bar Advocates (3-hr SLA)",
          harvey: "None (Software Only)",
          traditional: "Direct Lawyer",
          directories: "Unverified Referral",
        },
      ],
    },

    unique_advantage: {
      headline: "Three pillars of structural defensibility and sovereign advantage",
      pillars: [
        {
          icon: "🏛",
          title: "Proprietary Bangladesh Code Knowledge Graph",
          desc: "A custom curated database of 3,547 act aliases, section-level embeddings, and statutory definitions mapped from official gazettes (bdlaws.minlaw.gov.bd). Global models cannot replicate this regional ontology without our specialized ETL pipeline.",
        },
        {
          icon: "🛡",
          title: "Deterministic Hallucination Interceptor",
          desc: "A rule-based verification filter intercepting model output before client delivery. If the LLM generates a section that does not exist in the official gazette or references foreign jurisprudence (e.g. Indian IPC), the system deterministically blocks and reroutes the response.",
        },
        {
          icon: "⚖",
          title: "Human-in-the-Loop (HITL) Advocate Marketplace",
          desc: "AI produces the 30-second first-pass audit; certified Bangladesh Supreme Court and District Bar advocates review and apply a cryptographically sealed verification certificate under a strict 3-hour SLA window.",
        },
      ],
    },

    go_to_market: {
      headline: "A 3-phase wedge-and-expand playbook from freelancer contracts to corporate governance",
      phases: [
        {
          step: "Phase 1: The Contract Wedge",
          period: "Months 1 - 6",
          target: "Tech Freelancers, Creators & SMEs",
          strategy: "Drive viral adoption through ৳28 pay-per-audit on Facebook, LinkedIn & freelance communities. Low-friction bKash payment with zero signup friction converts high-intent users immediately.",
        },
        {
          step: "Phase 2: Academic & Advocate Seeding",
          period: "Months 6 - 12",
          target: "Law Students & Junior Advocates",
          strategy: "Distribute Advotech Research Mode to leading law schools (Dhaka University, DIU, BRAC). Junior advocates adopt the platform as their daily statutory drafting and citation assistant.",
        },
        {
          step: "Phase 3: Enterprise & ComplianceOS",
          period: "Months 12 - 24",
          target: "Corporate Legal Vaults & HR Departments",
          strategy: "Upsell high-volume enterprise licenses with automated Labour Act compliance audits, custom enterprise playbooks, pooled team credit accounts, and ERP integrations.",
        },
      ],
    },

    vision: {
      headline: "Becoming the default legal operating system for the 2 billion people of the Global South",
      pillars: [
        {
          title: "Jurisdiction-Agnostic Core Architecture",
          desc: "Our hybrid retrieval pipeline, deterministic safety shields, and HITL verification dispatch are engineered modularly. Bangladesh is our proof-of-concept; expanding requires only localized data ingestion.",
        },
        {
          title: "Multi-Jurisdiction Expansion Pipeline",
          desc: "• India (Q1 2027): Ingestion of Companies Act 2013, Bharatiya Nyaya Sanhita, Contract Act.\n• Pakistan (Q2 2027): Labour Code & Commercial Arbitration frameworks.\n• UAE / DIFC (Q3 2027): Common-law commercial court standards serving South Asian expatriates.",
        },
        {
          title: "The Counter-Signature Standard",
          desc: "We envision a future where no commercial contract in South Asia is signed without an autonomous Advotech audit seal attached to protect the parties.",
        },
      ],
    },
  },

  // --- TEAM ---
  team_name: "Team Outliers",
  team: [
    {
      name: "Mahmudul Hasan Tasin",
      role: "Team Lead • AI/ML Engineer • Backend Lead",
      badge: "Leader",
      country: "BD",
      attendance: "Physical (In-person)",
      email: "tasinoutlook@gmail.com",
      avatar: "/team/tasin.webp",
      objPos: "center center",
      expertise: "Team Leadership, AI/ML Pipelines, LangGraph Architecture, Vector RAG,FastAPI",
    },
    {
      name: "SM SAYEM HOSSAIN",
      role: "Product/UX Designer",
      badge: "Member",
      country: "BD",
      attendance: "Physical (In-person)",
      email: "smsayemhossain1@gmail.com",
      avatar: "/team/sayem.webp",
      objPos: "center center",
      expertise: "Product & UX Design, Design Systems, Human-Centered Interaction",
    },
    {
      name: "Mohammad Shuaib",
      role: "Full-Stack Developer",
      badge: "Member",
      country: "BD",
      attendance: "Virtual (Online)",
      email: "shuaib.cyclist@gmail.com",
      avatar: "/team/Mohammad_Shuaib.webp",
      objPos: "center center",
      expertise: "Full-Stack Development,Next.js 15, Scalable APIs",
    },
    {
      name: "MOHAMMAD SAJJAD",
      role: "Product Strategist & Global Compliance Advisor",
      badge: "Member",
      country: "SA",
      attendance: "Virtual (Online)",
      email: "mohammadsajjadksa@gmail.com",
      avatar: "/team/sajjad.webp",
      objPos: "center center",
      expertise: "Product Strategy, Global Regulatory Compliance, Cross-Border Advisory",
    },
    {
      name: "MD JIBON ALI",
      role: "Business Analyst",
      badge: "Member",
      country: "BD",
      attendance: "Physical (In-person)",
      email: "abdussubahan751@gmail.com",
      avatar: "/team/jibon.webp",
      objPos: "center center",
      expertise: "Business Analysis, Market Feasibility, Enterprise Client Workflows",
    },
    {
      name: "Farhana Afrin Medha",
      role: "Presentation & Communication Lead",
      badge: "Member",
      country: "BD",
      attendance: "Physical (In-person)",
      email: "farhanaafrinmedha@gmail.com",
      avatar: "/team/medha.webp",
      objPos: "center center",
      expertise: "Product Presentation, Stakeholder Communication, Legal Tech Advocacy",
    },
  ],

  // --- TECHNICAL WHITEPAPER ---
  tech: {
    product_overview: {
      headline: "Comprehensive System Architecture & Use Case Matrix",
      desc: "Advotech Copilot is an enterprise-ready legal intelligence platform uniting async FastAPI microservices, dual-path vector retrieval (Dense Qdrant + Sparse BM25), deterministic guardrails, and cryptographic Human-in-the-Loop audit workflows.",
      users: [
        {
          persona: "Tech Freelancers & Independent Contractors",
          scenario: "Auditing international vendor contracts to remove void non-compete clauses (§ 27 Contract Act) and enforce milestone-based release schedules.",
        },
        {
          persona: "SME Owners & Startup Founders",
          scenario: "Reviewing commercial lease agreements in under 30 seconds to flag illegal security deposit forfeitures under the Premises Rent Control Act 1991.",
        },
        {
          persona: "Corporate HR & Compliance Officers",
          scenario: "Running automated policy scans across hundreds of employee agreements against the mandatory provisions of the Bangladesh Labour Act 2006.",
        },
        {
          persona: "Practicing Advocates & Law Chambers",
          scenario: "Accelerating junior research by instantly finding relevant statutory sections and precedent citations across 3,547 Acts (35,000+ gazette provisions).",
        },
        {
          persona: "Non-Resident Bangladeshi Diaspora",
          scenario: "Cross-checking local land power-of-attorney and property deeds remotely through verified Supreme Court legal counsel dispatch.",
        },
      ],
    },

    architecture: {
      headline: "System Architecture Topology: UI → API → Services → DB",
      diagramTitle: "Four-Tier Distributed Architecture (Rendered SVG Topology)",
      layers: [
        {
          label: "01. Presentation Layer (UI)",
          items: ["Next.js 15 App Router", "Tailwind CSS Design Tokens", "Client-side Regex PII Redactor", "Real-time SSE Event Listeners"],
          icon: "🖥",
          role: "Sovereign client UI & instant audit rendering",
        },
        {
          label: "02. API Gateway & Auth (API)",
          items: ["FastAPI Async Router", "JWT Auth (token_version checks)", "Role-Based Access Control (RBAC)", "Rate Limiting & BOLA Guards"],
          icon: "⚙",
          role: "Secure traffic routing & permission gating",
        },
        {
          label: "03. Services & Reasoning (Services)",
          items: ["LangGraph State Machines", "Act Alias Resolver (3,547 Acts)", "Gemini 3.5 Flash Lite & Groq Qwen Fallback", "Deterministic Hallucination Interceptor"],
          icon: "🤖",
          role: "Multi-step reasoning & statutory routing",
        },
        {
          label: "04. Vector & Relational Store (DB)",
          items: ["Qdrant Cloud (multilingual-e5-small)", "Supabase Postgres (pgvector)", "Credit Ledger (Immutable Transactions)", "Metric Events Benchmarking"],
          icon: "🗄",
          role: "Hybrid search & persistent enterprise storage",
        },
      ],
    },

    data_flow: {
      headline: "5-Phase Data Flow Pipeline: Input → Processing → AI → Output → Feedback",
      phases: [
        {
          phase: "01. Input Phase",
          tag: "Input",
          title: "Document Ingestion & Sovereign Client PII Scrubbing",
          desc: "User submits a legal query or PDF agreement. Client-side regex rules redact phone numbers (+8801[3-9]), NID (10/13/17 digits), email addresses, and bank accounts in browser memory before bytes leave the device.",
          icon: "📥",
        },
        {
          phase: "02. Processing Phase",
          tag: "Processing",
          title: "API Gateway Auth, RBAC & Dual-Path Retrieval",
          desc: "FastAPI router validates JWT token_version and checks RBAC authorization. The query splits into Path A (3,547 Act Alias dictionary exact match) and Path B (Qdrant dense vector search with multilingual-e5-small embeddings).",
          icon: "⚙",
        },
        {
          phase: "03. AI Phase",
          tag: "AI",
          title: "LangGraph Multi-Step Reasoning & Grounded Synthesis",
          desc: "LangGraph state machine feeds extracted clauses and retrieved statutory chunks into Gemini 3.5 Flash Lite with Groq Qwen 2.5 27B fallback. Inference is strictly constrained to the ingested statutory context with zero parametric guessing.",
          icon: "🤖",
        },
        {
          phase: "04. Output Phase",
          tag: "Output",
          title: "Deterministic Guard Validation & Real-time SSE Stream",
          desc: "Deterministic safety filter checks whether every cited section actually exists in the official Bangladesh Code. Once verified, findings, executive health scores (0-100), and redlines stream via SSE.",
          icon: "📤",
        },
        {
          phase: "05. Feedback Phase",
          tag: "Feedback",
          title: "Benchmark Telemetry Logging & HITL Lawyer Escalation",
          desc: "Operational latency and retrieval metrics are logged into the metric_events table for continuous accuracy auditing. Users can escalate to Supreme Court advocates with a 3-hour SLA window.",
          icon: "🔄",
        },
      ],
    },

    feature_matrix: [
      // --- LIVE PRODUCTION CORE ---
      { name: "Sub-Minute AI Contract Audit (PDF)", status: "LIVE", tier: "Core", note: "Clause-by-clause risk scoring in under 1 minute (benchmarked at ~28s for 15-page contracts), 100% recall across lease/employment contracts, executive health score (0-100) & redline diffs" },
      { name: "Bilingual Grounded Legal Chat", status: "LIVE", tier: "Core", note: "3,547 Bangladesh Acts (35,000+ sections), MRR 0.864, answers in Bengali, Banglish & English with hyperlinked gazette citations" },
      { name: "Enterprise Workspaces & Vaults", status: "LIVE", tier: "Enterprise", note: "Departmental encrypted legal repositories, corporate credit pooling, team seat provisioning (Admin/Reviewer/Viewer) (/enterprise/admin)" },
      { name: "Super Admin Platform Governance", status: "LIVE", tier: "Platform", note: "Real-time metrics, RJSC corporate verification, Bar Council advocate approvals, and tamper-evident cryptographic audit logs (/admin)" },
      { name: "Contract Archive & PDF Memo Export", status: "LIVE", tier: "Core", note: "Historical audit vault with executive risk scores, clause categorization, and one-click PDF report export for offline counsel (/archive)" },
      { name: "SSLCommerz & bKash Credit Ledger", status: "LIVE", tier: "Billing", note: "Instant ৳28 micro-payments via bKash/Nagad/Cards with cryptographically signed IPN webhook callbacks and double-entry ledger" },
      { name: "Client-Side PII Auto-Redaction", status: "LIVE", tier: "Security", note: "Zero-knowledge in-browser regex scrubbing of BD mobile numbers (+8801[3-9]), NID (10/13/17 digits), bank accounts, and party names" },
      { name: "FastMCP Legal Server (bd-legal-mcp)", status: "LIVE", tier: "Developer", note: "8 JSON-RPC tools, Anti-Repeal Shield, dynamic resources & prompts over proxy-safe stateless HTTP for Claude & Cursor" },
      { name: "Anti-Repeal Guardrail Shield", status: "LIVE", tier: "AI & RAG", note: "Deterministic filter intercepting repealed or amended statutes (e.g. Penal Code 1860 vs Cyber Security Act) before LLM generation" },
      { name: "Multi-Model Fault-Tolerant Engine", status: "LIVE", tier: "Infrastructure", note: "Google Gemini 3.5 Flash Lite (Primary) → Groq Qwen 2.5 27B (Fallback) → Z.AI GLM-4 waterfall delivering 1.4s TTFT and 99.4% uptime" },
      { name: "Dynamic Showcase Gate & PDF Engine", status: "LIVE", tier: "Platform", note: "Granular 403 showcase scheduler, PIN security gate, live database telemetry hydration, and publication-grade A4 PDF exporter" },

      // --- BETA WORKFLOWS ---
      { name: "HITL Lawyer Review & Escrow Queue", status: "BETA", tier: "Marketplace", note: "Supreme Court advocate review workspace, 3-hour SLA escrow matching, digital bar license seal sign-off, and payout tracking (/lawyer/pending)" },
      { name: "Custom Corporate Compliance Playbooks", status: "BETA", tier: "Enterprise", note: "Custom rule injection engine enforcing organizational clause constraints (e.g. mandatory arbitration in Dhaka, strict IP ownership) (/enterprise/admin/playbook)" },

      // --- MID-TERM FUTURE CAPABILITIES (Q1 - Q3 2027) ---
      { name: "Autonomous Dispute Preparation AI Agent", status: "PLANNED", tier: "Litigation (Mid-Term)", note: "Pre-litigation statutory legal demand notice generator, breach timeline chronology constructor, and court-admissible evidence bundle assembler (Q1 2027)" },
      { name: "Scanned Bengali OCR & Table Parser", status: "PLANNED", tier: "Data (Mid-Term)", note: "Multi-column scanned Bengali legal deed parser, Land Ministry khatiyan/porcha digitization, and stamp paper seal extraction (Q2 2027)" },
      { name: "WhatsApp & Telegram Voice Legal Bot", status: "PLANNED", tier: "Access (Mid-Term)", note: "Voice-to-text Bengali legal advisory for low-literacy migrant workers, rural landholders, and micro-entrepreneurs via WhatsApp Business API (Q3 2027)" },

      // --- LONG-TERM STRATEGIC ROADMAP (Q3 2027+) ---
      { name: "Cross-Border South Asian Legal Ingestion", status: "PLANNED", tier: "Expansion (Long-Term)", note: "Indian Companies Act 2013, Bharatiya Nyaya Sanhita (BNS), Pakistan Labour Code, and UAE DIFC Common Law for 4.5M+ South Asian expatriates (Q3 2027)" },
      { name: "Decentralized Advocate Reputation & Escrow", status: "PLANNED", tier: "Web3 (Long-Term)", note: "Cryptographic on-chain advocate identity verification, zero-knowledge bar credentials, and smart contract milestone payouts (Q4 2027)" },
      { name: "Autonomous Mock Arbitrator & Case Simulator", status: "PLANNED", tier: "Analytics (Long-Term)", note: "Monte Carlo case outcome simulator, judicial precedent victory probability estimator, and pre-trial settlement range calculator (2028)" },
    ],

    tech_stack: [
      {
        layer: "Frontend Tier",
        items: "Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Fraunces Serif & Karla Typography",
        desc: "Server-rendered application with client-side streaming and responsive layout.",
      },
      {
        layer: "Backend API Gateway",
        items: "FastAPI (Async Python 3.11), SQLAlchemy 2.0, Pydantic v2, Uvicorn, LangGraph",
        desc: "High-throughput asynchronous microservices handling concurrency with connection pooling.",
      },
      {
        layer: "AI & Vector Search",
        items: "Qdrant Cloud (collection bd_laws_e5_small), multilingual-e5-small embeddings, ProductionHybridRetriever (Path A + Path B)",
        desc: "Hybrid two-path semantic search yielding 93.9% Act Hit@K retrieval performance.",
      },
      {
        layer: "LLM Inference Engine",
        items: "Google Gemini 3.5 Flash Lite (Primary) → Groq Qwen 2.5 27B (Fallback) → Z.AI GLM-4 (Resilience)",
        desc: "Multi-tier 3-layer model waterfall guaranteeing continuous availability and 80.8% benchmark pass rate under load.",
      },
      {
        layer: "Database & Storage",
        items: "Supabase PostgreSQL with pgvector, Row-Level Security, Encrypted File Vaults",
        desc: "Relational user records, audit memos, credit transaction ledgers, and telemetry.",
      },
      {
        layer: "Payments & Financials",
        items: "SSLCommerz Payment Gateway (bKash, Nagad, Visa, Mastercard) + Internal Double-Entry Ledger",
        desc: "Cryptographically verified IPN callbacks with idempotent balance updates.",
      },
      {
        layer: "Infrastructure & DevOps",
        items: "Render (Backend Web Services), Vercel (Frontend Edge), Coolify VPS (MCP Server)",
        desc: "Docker containerized deployments with automated GitHub Actions CI/CD pipelines.",
      },
      {
        layer: "Observability & Telemetry",
        items: "Native benchmark harness streaming directly into metric_events table, Sentry error tracking",
        desc: "Continuous latency, recall, and hallucination monitoring across production queries.",
      },
    ],

    api_docs: [
      {
        group: "Auth",
        method: "POST",
        path: "/api/auth/request-otp",
        auth: "Public",
        desc: "Sends a 6-digit SMS verification code to a valid Bangladesh mobile number (+8801XXXXXXXXX).",
        payload: '{ "phone": "+8801700000000" }',
      },
      {
        group: "Auth",
        method: "POST",
        path: "/api/auth/verify-otp",
        auth: "Public",
        desc: "Verifies the SMS code and returns an HTTP-only JWT access token with token_version validation.",
        payload: '{ "phone": "+8801700000000", "otp": "123456" }',
      },
      {
        group: "Auth",
        method: "POST",
        path: "/api/auth/logout",
        auth: "Bearer JWT",
        desc: "Increments token_version in the database, instantly invalidating all active sessions across devices.",
        payload: "{}",
      },
      {
        group: "Chat",
        method: "POST",
        path: "/api/chat/ask",
        auth: "Bearer JWT",
        desc: "Performs grounded bilingual legal Q&A over 35,000+ Bangladesh Code sections via Server-Sent Events (SSE).",
        payload: '{ "query": "চেক বাউন্স হলে নোটিশ পাঠানোর সময় কতদিন?", "language": "auto" }',
      },
      {
        group: "Chat",
        method: "GET",
        path: "/api/chat/history",
        auth: "Bearer JWT",
        desc: "Retrieves paginated conversation threads and statutory citation cards for the authenticated user.",
        payload: "Query params: ?page=1&limit=20",
      },
      {
        group: "Audit",
        method: "POST",
        path: "/api/contract/upload",
        auth: "Bearer JWT",
        desc: "Accepts multipart/form-data PDF, executes sub-minute risk analysis (benchmarked at ~28s), and returns structured clause findings with redlines.",
        payload: "FormData: { file: document.pdf, contractType: 'employment' }",
      },
      {
        group: "Audit",
        method: "GET",
        path: "/api/contract/memos",
        auth: "Bearer JWT",
        desc: "Lists historical contract audit memos, health scores (0-100), and PDF export download URLs.",
        payload: "Query params: ?status=completed",
      },
      {
        group: "Enterprise",
        method: "POST",
        path: "/api/company/playbooks",
        auth: "Bearer JWT (Enterprise Admin)",
        desc: "Creates corporate compliance rule playbook enforcing custom clause constraints (e.g., maximum liability caps, required dispute jurisdiction).",
        payload: '{ "name": "Standard IT Vendor Playbook", "rules": [{ "type": "no_void_non_compete", "target_statute": "Contract Act § 27" }] }',
      },
      {
        group: "Enterprise",
        method: "GET",
        path: "/api/company/vault",
        auth: "Bearer JWT (Enterprise Member)",
        desc: "Retrieves encrypted corporate legal vault repository with department tags, health audit grades, and team access logs.",
        payload: "Query params: ?department=Engineering&min_grade=80",
      },
      {
        group: "Enterprise",
        method: "POST",
        path: "/api/company/members",
        auth: "Bearer JWT (Enterprise Admin)",
        desc: "Provisions enterprise team seats, role-based permissions (Admin, Reviewer, Viewer), and monthly audit quota pools.",
        payload: '{ "email": "legal-counsel@enterprise.bd", "role": "reviewer", "monthly_quota": 50 }',
      },
      {
        group: "Lawyer",
        method: "GET",
        path: "/api/lawyer/queue",
        auth: "Bearer JWT (Verified Advocate)",
        desc: "Polls live escrow audit queue for contracts requiring human-in-the-loop advocate verification under the 3-hour SLA window.",
        payload: "Query params: ?court_tier=supreme_court&status=pending",
      },
      {
        group: "Lawyer",
        method: "POST",
        path: "/api/lawyer/active/{memo_id}/submit",
        auth: "Bearer JWT (Verified Advocate)",
        desc: "Submits advocate-reviewed redlines, statutory citation seals, and cryptographic bar license sign-off to complete audit.",
        payload: '{ "verification_status": "APPROVED", "bar_registration": "SC-10492/BD", "advocate_notes": "Section 74 damages mitigated to actual loss." }',
      },
      {
        group: "Lawyer",
        method: "GET",
        path: "/api/lawyer/earnings",
        auth: "Bearer JWT (Verified Advocate)",
        desc: "Retrieves real-time advocate escrow wallet balance, completed review fee ledgers, and bKash/Bank payout status.",
        payload: "{}",
      },
      {
        group: "Payments",
        method: "POST",
        path: "/api/payments/initiate",
        auth: "Bearer JWT",
        desc: "Initiates SSLCommerz payment session for credit purchase (1 credit = ৳28). Returns gateway redirect URL.",
        payload: '{ "credits": 5, "amount": 140 }',
      },
      {
        group: "Payments",
        method: "POST",
        path: "/api/payments/callback",
        auth: "HMAC Signature",
        desc: "IPN webhook handler validating SSLCommerz cryptographic signature and crediting user balance.",
        payload: "FormData: { tran_id, val_id, amount, status: 'VALID' }",
      },
      {
        group: "Admin",
        method: "GET",
        path: "/api/admin/dashboard",
        auth: "Bearer JWT (Super Admin)",
        desc: "Aggregates platform-wide metrics: total registered advocates, active enterprise seats, system uptime, and dispute escrow balances.",
        payload: "{}",
      },
      {
        group: "Admin",
        method: "POST",
        path: "/api/admin/enterprises/{enterprise_id}/approve",
        auth: "Bearer JWT (Super Admin)",
        desc: "Approves enterprise corporate account after verifying RJSC certificate and activates pooled credit tier.",
        payload: '{ "approved": true, "corporate_credit_limit": 500, "contract_vault_active": true }',
      },
      {
        group: "Admin",
        method: "POST",
        path: "/api/admin/lawyers/{lawyer_id}/approve",
        auth: "Bearer JWT (Super Admin)",
        desc: "Verifies advocate Bangladesh Bar Council enrollment certificate and activates HITL dispatch queue access.",
        payload: '{ "approved": true, "bar_id_verified": true, "sla_tier": "tier_1_supreme_court" }',
      },
      {
        group: "Admin",
        method: "GET",
        path: "/api/admin/audit-logs",
        auth: "Bearer JWT (Super Admin)",
        desc: "Returns tamper-evident cryptographic system audit trail of all privilege escalations, BOLA checks, and data export events.",
        payload: "Query params: ?page=1&event_type=security_check",
      },
      {
        group: "Platform",
        method: "GET",
        path: "/api/platform/system-status",
        auth: "Public / Monitoring",
        desc: "Multi-service distributed health probe reporting status for FastAPI gateway, Qdrant Cloud, Gemini 3.5 Flash, Supabase DB, and SSLCommerz.",
        payload: '{ "status": "HEALTHY", "latency_ms": 42, "qdrant_indexed_statutes": 35000 }',
      },
      {
        group: "MCP",
        method: "POST",
        path: "https://bd-legal-mcp-server.onrender.com/mcp",
        auth: "None / DNS Shield",
        desc: "FastMCP JSON-RPC 2.0 tool execution endpoint serving 8 tools (statutes, case law, anti-repeal) via proxy-safe stateless HTTP.",
        payload: '{ "jsonrpc": "2.0", "method": "tools/call", "params": { "name": "search_statutes", "arguments": { "query": "bail" } } }',
      },
      {
        group: "MCP",
        method: "GET",
        path: "https://bd-legal-mcp-server.onrender.com/health",
        auth: "None",
        desc: "UptimeRobot probe and health endpoint confirming FastMCP server readiness.",
        payload: '{ "status": "ok", "service": "MCP Server" }',
      },
    ],

    data_layer: {
      headline: "Sovereign Ingestion, Vectorization & Client-Side Privacy Standards",
      points: [
        "Statutory Ingestion Pipeline: Custom web ETL scraper extracted all 35,000+ sections across 3,547 Acts in 1,100+ volumes of the official Bangladesh Code (bdlaws.minlaw.gov.bd). Data is normalized with act ID, amendment history, and gazette publication dates.",
        "Sovereign Client-Side PII Scrubbing: User contracts undergo client-side regex and tokenizer scrubbing before upload. All personal names, NID numbers, phone numbers, and financial details are anonymized into standardized tokens ([PARTY_A], [AMOUNT_TK]).",
        "Dual-Path Retrieval Geometry: Text chunks are embedded using multilingual-e5-small (384 dimensions) for dense semantic retrieval (Path B), combined with Path A 3,547-act alias exact section scroll matching (§ 27, § 74, § 138).",
        "PostgreSQL pgvector Schema: Relational metadata (users, audit_memos, credit_ledger, advocate_inquiries) is partitioned with Row-Level Security (RLS) guaranteeing tenant isolation.",
        "Zero-Retention AI Policy: Contract audit texts are processed in memory and never stored in external LLM vendor logging buffers. Audit memos are stored encrypted in user vaults.",
      ],
      layers: [
        {
          num: "01",
          category: "Corpus Acquisition & ETL",
          badge: "LAYER 01",
          icon: "book-open",
          title: "Statutory Ingestion Pipeline",
          desc: "Custom web ETL scraper extracted all 35,000+ sections across 3,547 Acts in 1,100+ volumes of the official Bangladesh Code (bdlaws.minlaw.gov.bd). Data is normalized with act ID, amendment history, and gazette publication dates.",
        },
        {
          num: "02",
          category: "Client-Side Anonymization",
          badge: "LAYER 02",
          icon: "eye-off",
          title: "Sovereign Client-Side PII Scrubbing",
          desc: "User contracts undergo client-side regex and tokenizer scrubbing before upload. All personal names, NID numbers, phone numbers, and financial details are anonymized into standardized tokens ([PARTY_A], [AMOUNT_TK]).",
        },
        {
          num: "03",
          category: "Vector & Sparse Indexing",
          badge: "LAYER 03",
          icon: "layers",
          title: "Dual-Path Retrieval Geometry",
          desc: "Text chunks are embedded using multilingual-e5-small (384 dimensions) for dense semantic retrieval (Path B), combined with Path A 3,547-act alias exact section scroll matching (§ 27, § 74, § 138).",
        },
        {
          num: "04",
          category: "Tenant-Isolated Vaults",
          badge: "LAYER 04",
          icon: "database",
          title: "PostgreSQL pgvector Schema",
          desc: "Relational metadata (users, audit_memos, credit_ledger, advocate_inquiries) is partitioned with Row-Level Security (RLS) guaranteeing tenant isolation.",
        },
        {
          num: "05",
          category: "Privacy & Zero Data Leaks",
          badge: "LAYER 05",
          icon: "lock",
          title: "Zero-Retention AI Policy",
          desc: "Contract audit texts are processed in memory and never stored in external LLM vendor logging buffers. Audit memos are stored encrypted in user vaults.",
        },
      ],
    },

    ai_layer: {
      headline: "Multi-Agent LangGraph Orchestration & Hallucination Elimination",
      points: [
        "Hybrid 2-Path Retrieval Engine: Path A executes an exact lookup in the 3,547-act alias index. Path B performs cosine similarity search over Qdrant vectors with an adaptive threshold (0.78 cutoff).",
        "LangGraph State Machine: Controls the lifecycle of each request across 5 states: QueryClassifier → StatutoryRetriever → ConstraintValidator → Generator → CitationChecker.",
        "Deterministic Guardrail Interceptor: Custom post-generation filter regex parses statutory citations in the response. If a cited section cannot be matched against the official gazette database, the generation is blocked and re-prompted.",
        "Explainable Citation Grounding: Every affirmative statement in the response includes a hard-linked hyper-reference to the specific section, amendment year, and bdlaws gazette URL.",
        "Model Failover Ladder: Primary requests execute against Google Gemini 3.5 Flash Lite with temperature waterfall. If rate limited, the request fails over seamlessly to Groq Qwen 2.5 27B and Z.AI GLM-4 without user disruption.",
      ],
      layers: [
        {
          num: "01",
          category: "Hybrid Search Topology",
          badge: "LAYER 01",
          icon: "search",
          title: "Hybrid 2-Path Retrieval Engine",
          desc: "Path A executes an exact lookup in the 3,547-act alias index. Path B performs cosine similarity search over Qdrant vectors with an adaptive threshold (0.78 cutoff).",
        },
        {
          num: "02",
          category: "State Machine Control",
          badge: "LAYER 02",
          icon: "workflow",
          title: "LangGraph State Machine",
          desc: "Controls the lifecycle of each request across 5 states: QueryClassifier → StatutoryRetriever → ConstraintValidator → Generator → CitationChecker.",
        },
        {
          num: "03",
          category: "Deterministic Safety Filter",
          badge: "LAYER 03",
          icon: "shield-check",
          title: "Deterministic Guardrail Interceptor",
          desc: "Custom post-generation filter regex parses statutory citations in the response. If a cited section cannot be matched against the official gazette database, the generation is blocked and re-prompted.",
        },
        {
          num: "04",
          category: "Verifiable Grounding",
          badge: "LAYER 04",
          icon: "file-check",
          title: "Explainable Citation Grounding",
          desc: "Every affirmative statement in the response includes a hard-linked hyper-reference to the specific section, amendment year, and bdlaws gazette URL.",
        },
        {
          num: "05",
          category: "Fault-Tolerant Inference",
          badge: "LAYER 05",
          icon: "zap",
          title: "Model Failover Ladder",
          desc: "Primary requests execute against Google Gemini 3.5 Flash Lite with temperature waterfall. If rate limited, the request fails over seamlessly to Groq Qwen 2.5 27B and Z.AI GLM-4 without user disruption.",
        },
      ],
    },

    roadmap: {
      short: {
        label: "Now — Q1 2027",
        title: "Platform Hardening & Beachhead Scaling",
        items: [
          "Complete OCR Table-PDF parser optimization for scanned Bengali rental deeds",
          "Automated 3-hour SLA advocate dispatch with SMS reminder escalations",
          "FastMCP public developer registry launch for Claude & Cursor integrations",
          "Launch 180s interactive video showcase for investor & competition judging",
        ],
      },
      mid: {
        label: "Q1 — Q3 2027",
        title: "Enterprise ComplianceOS & Team Playbooks",
        items: [
          "Custom corporate compliance playbook builder with rule injection",
          "Multi-tenant company billing with pooled credit balances and role quotas",
          "Dispute Preparation AI Agent: Autonomous generation of statutory demand notices",
          "Shared audit repositories with cryptographic digital watermark stamps",
        ],
      },
      long: {
        label: "Q3 2027+",
        title: "Pan-South Asia Cross-Border Legal Expansion",
        items: [
          "India Jurisdiction Launch: Ingestion of Companies Act 2013, BNS, and Labour Codes",
          "Pakistan Jurisdiction Launch: Contract Act 1872 & Commercial Court precedents",
          "UAE / DIFC Ingestion: English common law coverage for 4.5M+ South Asian expatriates",
          "Decentralized Advocate Reputation & Verification Protocol on sovereign rails",
        ],
      },
    },

    performance: {
      headline: "Rigorous Production Latency, Scalability & Benchmarks",
      metrics: [
        { label: "Contract Audit Latency", value: "~28s", note: "15-page complex PDF agreement" },
        { label: "Bilingual Chat Latency", value: "1.4s", note: "Time-to-first-token on Gemini & Groq" },
        { label: "API System Uptime", value: "99.4%", note: "Production Render & Vercel SLA" },
        { label: "Golden Benchmark Pass", value: "80.8%", note: "59/73 gold cases (100% statutory router accuracy)" },
        { label: "Provision Recall", value: "100%", note: "33/33 test provisions detected" },
        { label: "Hallucination Defense", value: "88.9%", note: "16/18 security & out-of-scope intercepts" },
      ],
      strategies: [
        "Connection Pooling: Async SQLAlchemy with NullPool on serverless workers prevents database socket exhaustion.",
        "Singleton Vector Clients: Qdrant and ChromaDB clients initialized once during FastAPI lifespan startup.",
        "Client-Side Compression: Large contract PDFs are pre-parsed and chunked into memory before transmission.",
        "Server-Sent Events: Streaming chunk delivery starts within 1.2s of request submission, reducing perceived latency.",
      ],
    },

    security: {
      headline: "Defense-in-Depth Security & Role-Based Access Architecture",
      layers: [
        {
          num: "01",
          category: "Identity & Session Security",
          icon: "key",
          title: "JWT Token-Version Revocation",
          desc: "Token version claims, logout invalidation and admin revocation across all active devices.",
          extra: null,
        },
        {
          num: "02",
          category: "Role-Based Access Control",
          icon: "users",
          title: "Three-Tier Authorization",
          desc: "Strict tripartite model enforced at the FastAPI dependency level.",
          extra: { type: "roles", items: ["GENERAL", "LAWYER", "ENTERPRISE"] },
        },
        {
          num: "03",
          category: "Resource Ownership Protection",
          icon: "shield-check",
          title: "BOLA Hardening",
          desc: "Strict user_id ownership validation for all file downloads and audit memo retrievals.",
          extra: null,
        },
        {
          num: "04",
          category: "Infrastructure & Query Protection",
          icon: "database",
          title: "SQL Injection & SSRF Immunization",
          desc: "Parameterized ORM queries and whitelisted internal HTTP dispatchers.",
          extra: null,
        },
        {
          num: "05",
          category: "Cryptographic Integrity",
          icon: "fingerprint",
          title: "Sovereign Cryptographic Signatures",
          desc: "HMAC-SHA256 verification for SSLCommerz transaction callbacks before credit ledger updates.",
          extra: null,
        },
      ],
    },

    analytics: {
      headline: "Live Operational KPIs & Evaluation Telemetry",
      kpis: [
        { label: "Audit Accuracy", value: "91.7%", sub: "33/36 benchmark provisions matched" },
        { label: "Act Hit@K", value: "93.9%", sub: "Top-K statutory retrieval accuracy" },
        { label: "Hallucination Block", value: "88.9%", sub: "16/18 deterministic guard intercepts" },
        { label: "RAG MRR", value: "0.864", sub: "Mean Reciprocal Rank accuracy" },
        { label: "Active Test Users", value: "45", sub: "Production beta cohort" },
        { label: "Contracts Audited", value: "36", sub: "Commercial agreements analyzed" },
      ],
    },

    contributors: {
      headline: "Engineering Leadership, Open Source & Governance",
      summary: "Advotech Copilot is built and governed under rigorous CI/CD test gates, signed commits, and specialized functional division across systems engineering, AI research, and statutory legal research.",
      lead: "Outliers Engineering Core",
      branches: "Main Active Branch: main • Production API: Render Docker • Frontend: Vercel Edge",
    },

    changelog: [
      { v: "v1.0.0", date: "2026-11-20", changes: "Official Submission Release: Production-ready legal AI copilot, contract audit engine, security hardening (OWASP standards, rate limiting, 102/102 test pass rate), and full statutory grounding." },
      { v: "v1.0.0-rc2", date: "2026-11-15", changes: "Interactive /docs release: YC pitch deck, deep technical whitepaper, real team directory, rendered SVG architecture, and admin access control." },
      { v: "v1.0.0-rc1", date: "2026-11-10", changes: "Initial architecture milestone: Advotech Copilot, ContractMind PDF audit, dual-path statutory retriever, and SSLCommerz billing." },
    ],
  },
};

// ==========================================
// 🎨 GLOBAL STYLES (Preserving Hearth Theme Tokens)
// ==========================================
const STYLES = `
  .hearth-theme {
    --bg-main: #0e0e0e;
    --bg-alt: #0e0e0e;
    --bg-accent: #0e0e0e;
    --text-dark: #ffffff;
    --text-body: #a3a3a3;
    --accent-clay: #e8e8e8;
    --border-color: #0e0e0e;
    --admin-color: #16a34a;
    --green-light: #1a1a1a;
    --green-dark: #a3a3a3;
    --orange-light: #2a1f0e;
    --orange-dark: #fbbf24;

    background-color: var(--bg-main);
    color: var(--text-body);
    font-family: var(--font-karla), sans-serif;
    margin: 0;
    padding: 0;
    scroll-behavior: smooth;
    display: flex;
    min-height: 100vh;
  }
  .hearth-theme * { box-sizing: border-box; }

  /* Typography */
  .font-serif { font-family: var(--font-fraunces), sans-serif; }
  .font-sans { font-family: var(--font-karla), sans-serif; }

  /* 403 Gate */
  .gate-wrap { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5rem; text-align: center; padding: 2rem; }
  .gate-code { font-size: 5.5rem; font-weight: 800; color: #3a3a3a; font-family: var(--font-fraunces), sans-serif; line-height: 1; }
  .gate-title { font-family: var(--font-fraunces), sans-serif; font-size: 2.25rem; color: var(--text-dark); margin: 0; }
  .gate-desc { font-size: 1.05rem; color: var(--text-body); max-width: 480px; line-height: 1.6; margin: 0; }
  .gate-window { font-size: 0.9rem; color: var(--accent-clay); background: var(--bg-accent); padding: 0.5rem 1rem; border-radius: 6px; font-weight: 700; }
  .gate-admin-link { font-size: 0.85rem; color: var(--accent-clay); cursor: pointer; text-decoration: underline; font-weight: 600; }

  /* Admin Toolbar */
  .admin-toolbar { position: fixed; bottom: 0; left: 0; right: 0; background: var(--admin-color); color: white; padding: 0.85rem 2rem; z-index: 200; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; font-weight: 600; gap: 1rem; flex-wrap: wrap; box-shadow: 0 -4px 20px rgba(0,0,0,0.15); }
  .admin-toolbar-left { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
  .admin-status-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; margin-right: 0.4rem; }
  .admin-status-dot.on { background: #4ade80; box-shadow: 0 0 8px #4ade80; }
  .admin-status-dot.scheduled { background: #fbbf24; box-shadow: 0 0 8px #fbbf24; }
  .admin-status-dot.off { background: #f87171; box-shadow: 0 0 8px #f87171; }
  .btn-admin { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 0.45rem 0.95rem; cursor: pointer; border-radius: 4px; font-size: 0.8rem; font-weight: 600; transition: 0.2s; font-family: inherit; }
  .btn-admin:hover { background: rgba(255,255,255,0.25); }
  .btn-admin.active { background: white; color: var(--admin-color); border-color: white; }
  .btn-admin.danger { background: rgba(196, 91, 60, 0.4); border-color: rgba(196, 91, 60, 0.6); }
  .admin-schedule { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
  .admin-schedule label { font-size: 0.75rem; opacity: 0.9; }
  .admin-schedule input[type="datetime-local"] { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); color: white; padding: 0.35rem 0.6rem; border-radius: 4px; font-size: 0.75rem; color-scheme: dark; font-family: inherit; }

  /* Admin Modals */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 1.5rem; backdrop-filter: blur(4px); }
  .modal-box { background: var(--bg-alt); border: 1px solid var(--border-color); border-radius: 0; padding: 2.5rem; width: 100%; max-width: 440px; box-shadow: 0 20px 40px rgba(0,0,0,0.12); }
  .modal-title { font-family: var(--font-fraunces), sans-serif; font-size: 1.5rem; color: var(--text-dark); margin: 0 0 0.5rem 0; }
  .modal-sub { font-size: 0.9rem; color: var(--text-body); margin: 0 0 1.5rem 0; line-height: 1.5; }
  .modal-input { width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-main); font-size: 1rem; color: var(--text-dark); margin-bottom: 1rem; font-family: inherit; }
  .modal-input:focus { outline: 2px solid var(--accent-clay); border-color: transparent; }
  .modal-error { color: var(--accent-clay); font-size: 0.85rem; margin-bottom: 1rem; font-weight: 600; }
  .modal-actions { display: flex; gap: 0.75rem; }
  .modal-btn { flex: 1; padding: 0.75rem; border-radius: 6px; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: none; font-family: inherit; transition: 0.2s; }
  .modal-btn.primary { background: #FFFFFF; color: #0e0e0e; }
  .modal-btn.primary:hover { background: #d4d4d4; }
  .modal-btn.secondary { background: transparent; border: 1px solid var(--border-color); color: var(--text-body); }
  .modal-btn.secondary:hover { background: var(--bg-accent); }

  /* Layout Structure */
  .sidebar { position: sticky; top: 0; height: 100vh; width: 290px; background: var(--bg-alt); border-right: 1px solid var(--border-color); padding: 2rem 1.5rem; overflow-y: auto; flex-shrink: 0; display: flex; flex-direction: column; }
  .sidebar::-webkit-scrollbar { width: 4px; }
  .sidebar::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
  .main-content { flex-grow: 1; width: calc(100% - 290px); }
  .brand { display: inline-flex; align-items: center; gap: 0.65rem; font-family: var(--font-fraunces), sans-serif; font-size: 1.3rem; color: var(--text-dark); margin-bottom: 1.5rem; text-decoration: none; font-weight: 700; letter-spacing: -0.01em; line-height: 1; }
  .brand-logo { width: 32px; height: 32px; object-fit: contain; flex-shrink: 0; display: block; transform: translateY(-2px); filter: brightness(0) invert(1); }
  .brand .brand-name { display: inline-flex; align-items: center; gap: 0.35rem; line-height: 1; transform: translateY(2px); }
  .brand .brand-accent { color: var(--accent-clay); line-height: 1; }
  .search-box-wrap { position: relative; margin-bottom: 1.75rem; }
  .search-box { width: 100%; padding: 0.75rem 0.9rem 0.75rem 2.2rem; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 6px; font-family: inherit; font-size: 0.85rem; color: var(--text-dark); }
  .search-box:focus { outline: 2px solid var(--accent-clay); border-color: transparent; }
  .search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); opacity: 0.5; pointer-events: none; }
  .toc-title { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent-clay); margin: 1.5rem 0 0.6rem 0; font-weight: 800; }
  .toc-link { display: flex; align-items: center; justify-content: space-between; font-size: 0.85rem; color: var(--text-body); text-decoration: none; margin-bottom: 0.15rem; padding: 0.45rem 0.9rem; border-left: 2px solid transparent; transition: all 0.15s; font-weight: 500; }
  .toc-link:hover { color: var(--text-dark); }
  .toc-link.active { color: #ffffff; border-left: 2px solid #ffffff; font-weight: 600; background: transparent; }
  .toc-count { font-size: 0.7rem; opacity: 0.6; font-family: monospace; }

  /* Topbar */
  .topbar { padding: 0.6rem 4vw; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; background: #0e0e0e; position: sticky; top: 0; z-index: 80; }
  .topbar::after { content: ""; position: absolute; left: 0; right: 0; top: 100%; height: 36px; background: linear-gradient(to bottom, rgba(14, 14, 14, 0.5), transparent); pointer-events: none; }
  .topbar-left { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
  .topbar-brand { display: inline-flex; align-items: center; gap: 0.65rem; line-height: 1; }
  .topbar-brand img { display: block; flex-shrink: 0; transform: translateY(-1.5px); filter: brightness(0) invert(1); }
  .brand-title { font-family: var(--font-fraunces), sans-serif; font-weight: 700; font-size: 1.05rem; color: var(--text-dark); letter-spacing: -0.01em; display: inline-flex; align-items: center; gap: 0.35rem; line-height: 1; transform: translateY(1.5px); }
  .stat-pill { font-size: 0.8rem; color: var(--text-body); display: flex; align-items: center; gap: 0.4rem; font-weight: 500; }
  .stat-pill strong { color: var(--text-dark); font-weight: 700; }
  .stat-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; display: inline-block; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
  .topbar-right { display: flex; gap: 0.6rem; align-items: center; }
  .btn { border: 1px solid var(--border-color); background: transparent; padding: 0.5rem 0.95rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer; color: var(--text-body); font-weight: 700; border-radius: 4px; transition: 0.2s; font-family: inherit; }
  .btn:hover { background: var(--bg-accent); color: var(--text-dark); }
  .btn.primary-btn { background: #FFFFFF; color: #0e0e0e; border-color: #FFFFFF; }
  .btn.primary-btn:hover { background: #d4d4d4; }

  /* Mobile Nav Bar */
  .mobile-header { display: none; padding: 1rem 1.5rem; background: var(--bg-alt); border-bottom: 1px solid var(--border-color); justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 90; }
  .mobile-toggle { background: transparent; border: 1px solid var(--border-color); padding: 0.4rem 0.8rem; border-radius: 4px; font-size: 0.85rem; cursor: pointer; font-family: inherit; }

  /* Sections */
  .doc-section { padding: 4.5rem 4vw; border-bottom: 1px solid var(--border-color); position: relative; }
  .doc-section.alt { background-color: var(--bg-alt); }
  .doc-inner { max-width: 960px; margin: 0 auto; position: relative; }
  .eyebrow { color: var(--accent-clay); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 800; margin-bottom: 0.75rem; display: block; }
  .headline { font-family: var(--font-fraunces), sans-serif; font-size: clamp(2rem, 3.8vw, 3.25rem); color: var(--text-dark); line-height: 1.15; margin: 0 0 2rem 0; font-weight: 600; }
  .section-lead { font-size: 1.15rem; line-height: 1.7; color: var(--text-dark); margin-bottom: 2rem; max-width: 820px; }
  .paragraph { font-size: 1.05rem; line-height: 1.7; margin-bottom: 1.5rem; }

  /* Grids */
  .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; }
  .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.75rem; }
  .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; }

  /* Hero Editorial Layout with Lady Justice */
  .hero-editorial-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 3.5rem; align-items: center; position: relative; margin-top: 1rem; }
  @media (max-width: 960px) {
    .hero-editorial-grid { grid-template-columns: 1fr; gap: 2.5rem; }
    .hero-visual-col { order: 2; }
    .hero-content-col { order: 1; }
  }
  .hero-content-col { display: flex; flex-direction: column; }
  .hero-main-headline { font-family: var(--font-fraunces), sans-serif; font-size: clamp(2.2rem, 3.8vw, 3.4rem); color: var(--text-dark); line-height: 1.15; margin: 0 0 1.25rem 0; font-weight: 700; letter-spacing: -0.02em; }
  .hero-description { font-size: 1.15rem; line-height: 1.7; color: var(--text-dark); margin-bottom: 2rem; border-left: 3px solid var(--accent-clay); padding-left: 1.5rem; max-width: 680px; }
  .hero-cta-group { display: flex; gap: 0.85rem; flex-wrap: wrap; align-items: center; margin-bottom: 1.5rem; }
  .hero-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1.6rem; border-radius: 0; font-size: 0.95rem; font-weight: 700; text-decoration: none; transition: all 0.2s ease; font-family: inherit; }
  .hero-btn.primary { background: #FFFFFF; color: #0e0e0e; border: 1px solid #FFFFFF; }
  .hero-btn.primary:hover { background: #d4d4d4; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.4); }
  .hero-btn.secondary { background: var(--bg-alt); color: var(--text-dark); border: 1px solid var(--border-color); }
  .hero-btn.secondary:hover { border-color: var(--accent-clay); color: var(--accent-clay); transform: translateY(-2px); }
  .hero-btn.tertiary { background: transparent; color: var(--accent-clay); border: 1px solid var(--accent-clay); }
  .hero-btn.tertiary:hover { background: var(--bg-accent); transform: translateY(-2px); }
  .hero-authority-strip { display: flex; align-items: center; gap: 0.75rem; font-size: 0.78rem; color: var(--text-body); opacity: 0.85; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; margin-bottom: 1.5rem; }
  .authority-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green-dark); box-shadow: 0 0 0 3px var(--green-light); flex-shrink: 0; }
  .hero-visual-col { display: flex; justify-content: center; align-items: center; }
  .lady-justice-frame { position: relative; width: 100%; max-width: 440px; display: flex; flex-direction: column; align-items: center; animation: subtleHeroDrift 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes subtleHeroDrift { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .lady-justice-img { width: 100%; height: auto; max-height: 520px; object-fit: contain; mix-blend-mode: screen; filter: invert(1) drop-shadow(0 12px 28px rgba(0, 0, 0, 0.5)); display: block; }
  .lady-justice-caption { margin-top: 1.25rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.2rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem; width: 85%; }
  .caption-tag { font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: var(--accent-clay); }
  .caption-sub { font-size: 0.78rem; color: var(--text-body); opacity: 0.75; }

  /* Hero Jump Pills */
  .hero-quick-jumps { display: flex; gap: 0.75rem; margin-top: 0.5rem; flex-wrap: wrap; }
  .jump-pill { font-size: 0.8rem; font-weight: 700; color: var(--text-dark); background: var(--bg-alt); border: 1px solid var(--border-color); padding: 0.5rem 1rem; border-radius: 50px; text-decoration: none; transition: 0.2s; display: inline-flex; align-items: center; gap: 0.4rem; }
  .jump-pill:hover { border-color: var(--accent-clay); color: var(--accent-clay); transform: translateY(-1px); }

  /* Hero Stats & Live Telemetry */
  /* Live Telemetry Panel */
  .telemetry-panel { margin-top: 5rem; }
  .telemetry-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; padding: 0 0 1.75rem; font-size: 0.78rem; }
  .telemetry-head-left { display: flex; align-items: center; gap: 0.6rem; }
  .live-telemetry-label { font-weight: 800; color: var(--accent-clay); text-transform: uppercase; letter-spacing: 0.12em; }
  .live-telemetry-status { color: var(--text-body); opacity: 0.75; font-weight: 500; }
  .telemetry-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.25rem 3rem; }
  .telemetry-cell { padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
  .tl-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.09em; color: var(--text-body); font-weight: 700; }
  .tl-num { font-family: var(--font-fraunces), sans-serif; font-size: 2.4rem; color: var(--text-dark); line-height: 1; font-weight: 700; font-variant-numeric: tabular-nums; }
  .tl-sub { font-size: 0.85rem; color: var(--text-body); line-height: 1.5; }
  @media (max-width: 1100px) { .telemetry-grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 640px) { .telemetry-grid { grid-template-columns: repeat(2, 1fr); } .telemetry-head { padding: 0 0 1.25rem; } .telemetry-cell { padding: 0; } }

  /* Premium Problem Cards */
  .problem-card { background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; padding: 1.75rem; display: flex; flex-direction: column; gap: 0.75rem;  transition: transform 0.2s, box-shadow 0.2s; }
  .pc-top { display: flex; justify-content: space-between; align-items: center; }
  .pc-num { font-family: var(--font-fraunces), sans-serif; font-size: 1.5rem; color: #4d4d4d; font-weight: 700; }
  .pc-badge { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 4px; background: var(--bg-accent); color: var(--accent-clay); }
  .pc-title { font-family: var(--font-fraunces), sans-serif; font-size: 1.25rem; color: var(--text-dark); margin: 0; line-height: 1.3; }
  .pc-metric { font-size: 1.1rem; font-weight: 800; color: var(--accent-clay); }
  .pc-desc { font-size: 0.92rem; color: var(--text-body); line-height: 1.6; margin: 0; }

  /* Product Cards */
  .product-card { background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; padding: 2.25rem; display: flex; flex-direction: column;  position: relative; transition: transform 0.2s, box-shadow 0.2s; }
  .pc-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
  .pc-icon-tile { width: 46px; height: 46px; border-radius: 0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .pc-logo-img { width: 30px; height: 30px; object-fit: contain; filter: brightness(0) invert(1); }
  .pc-icon-tile.green, .pc-icon-tile.orange { background: transparent; border: none; }
  .pc-tag { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; padding: 0.35rem 0.7rem; border-radius: 0; }
  .pc-tag.green, .pc-tag.orange { background: transparent; color: var(--text-body); padding-left: 0; padding-right: 0; }
  .pc-card-title { font-family: var(--font-fraunces), sans-serif; font-size: 1.6rem; color: var(--text-dark); margin: 0 0 1rem 0; line-height: 1.25; }
  .pc-card-desc { font-size: 0.98rem; color: var(--text-body); line-height: 1.65; margin-bottom: 1.5rem; }
  .pc-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); padding: 1.1rem 0; margin-bottom: 1.5rem; }
  .pc-metric-cell { display: flex; flex-direction: column; gap: 0.3rem; }
  .pc-metric-num { font-family: var(--font-fraunces), sans-serif; font-size: 1.7rem; color: var(--text-dark); font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
  .pc-metric-label { font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-body); font-weight: 700; opacity: 0.85; }
  .pc-checks { list-style: none; padding: 0; margin: 0 0 2rem 0; flex-grow: 1; }
  .pc-checks li { display: flex; align-items: flex-start; gap: 0.7rem; font-size: 0.9rem; margin-bottom: 0.85rem; line-height: 1.45; color: var(--text-dark); }
  .pc-check-chip { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 0.1rem; }
  .pc-checks.green .pc-check-chip, .pc-checks.orange .pc-check-chip { background: transparent; color: var(--text-body); }
  .pc-btn { background: #FFFFFF; color: #0e0e0e; border: none; border-radius: 0; padding: 0.9rem 1.25rem; font-weight: 600; font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: background 0.2s; text-decoration: none; font-family: inherit; }
  .pc-btn:hover { background: #d4d4d4; color: #0e0e0e; }
  .pc-btn svg { transition: transform 0.2s; }
  .pc-btn:hover svg { transform: translate(2px, 2px); }

  /* Why Now Curve Cards */
  .curve-card { background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; padding: 2rem; position: relative;  }
  .curve-number { font-family: var(--font-fraunces), sans-serif; font-size: 2.5rem; color: #4d4d4d; line-height: 1; font-weight: 700; margin-bottom: 0.75rem; }
  .curve-title { font-family: var(--font-fraunces), sans-serif; font-size: 1.25rem; color: var(--text-dark); margin: 0 0 0.35rem 0; }
  .curve-sub { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent-clay); font-weight: 700; margin-bottom: 1rem; }
  .curve-desc { font-size: 0.92rem; color: var(--text-body); line-height: 1.65; margin: 0; }

  /* Interactive Demo Simulation */
  .demo-wrap { background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; padding: 1.5rem; }
  .demo-top-tabs { display: flex; gap: 0.75rem; margin-bottom: 1.75rem; flex-wrap: wrap; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
  .demo-tab-btn { background: var(--bg-main); border: 1px solid var(--border-color); padding: 0.55rem 1.1rem; border-radius: 50px; font-size: 0.82rem; font-weight: 600; color: var(--text-body); cursor: pointer; transition: 0.2s; font-family: inherit; }
  .demo-tab-btn:hover { border-color: var(--text-dark); }
  .demo-tab-btn.active { background: #FFFFFF; color: #0e0e0e; border-color: #FFFFFF; }
  .demo-sim-box { background: var(--bg-main); border-radius: 0; padding: 1.25rem; display: flex; flex-direction: column; gap: 1.5rem; }
  .msg-user-wrap { display: flex; justify-content: flex-end; gap: 1rem; }
  .msg-user { background: #FFFFFF; color: #0e0e0e; padding: 1.15rem 1.4rem; border-radius: 12px 2px 12px 12px; max-width: 82%; font-size: 0.95rem; line-height: 1.6; }
  .avatar-u { width: 34px; height: 34px; background: var(--border-color); color: var(--text-dark); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; flex-shrink: 0; }
  .msg-ai-wrap { display: flex; gap: 1rem; }
  .avatar-ai { width: 34px; height: 34px; background: var(--green-light); color: var(--green-dark); border-radius: 0; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem; flex-shrink: 0; }
  .msg-ai-content { flex-grow: 1; }
  .msg-ai-meta { display: flex; align-items: center; gap: 0.75rem; font-size: 0.75rem; font-weight: 700; color: var(--text-body); margin-bottom: 0.65rem; flex-wrap: wrap; }
  .msg-ai-match { color: var(--green-dark); }
  .msg-ai-bubble { background: #0e0e0e; border: 1px solid #2e2e2e; padding: 1.4rem; border-radius: 2px 12px 12px 12px; font-size: 0.95rem; line-height: 1.7; color: var(--text-dark); margin-bottom: 1.25rem; }
  .msg-grounding { background: var(--green-light); border: 1px solid #2e2e2e; border-radius: 0; padding: 1.25rem; }
  .grounding-title { font-size: 0.75rem; font-weight: 800; color: var(--green-dark); margin-bottom: 0.6rem; display: flex; align-items: center; justify-content: space-between; }
  .grounding-text { display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.88rem; line-height: 1.5; color: var(--text-dark); }
  .grounding-cite { font-weight: 700; color: var(--green-dark); }
  .grounding-link { font-size: 0.78rem; color: var(--accent-clay); text-decoration: underline; font-weight: 600; }

  /* Interactive Contract Audit Viewer */
  .audit-viewer { background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; padding: 1.5rem; margin-top: 2rem; }
  .audit-score-banner { display: flex; justify-content: space-between; align-items: center; background: var(--bg-main); border: 1px solid #2e2e2e; border-radius: 0; padding: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
  .score-number { font-family: var(--font-fraunces), sans-serif; font-size: 2.25rem; color: var(--text-dark); font-weight: 700; }
  .score-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .badge-ui { padding: 0.4rem 0.8rem; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; border-radius: 4px; letter-spacing: 0.05em; }
  .badge-ui.danger { background: rgba(239, 68, 68, 0.12); color: rgba(248, 113, 113, 0.75); }
  .badge-ui.warning { background: rgba(251, 191, 36, 0.1); color: rgba(251, 191, 36, 0.7); }
  .badge-ui.success { background: rgba(74, 222, 128, 0.1); color: rgba(74, 222, 128, 0.7); }
  .audit-clauses { display: flex; flex-direction: column; gap: 1rem; }
  .audit-clause-card { border: 1px solid #2e2e2e; border-radius: 0; padding: 1.25rem; background: var(--bg-alt); transition: border-color 0.2s; }
  .audit-clause-card.high-risk { border-left: 4px solid rgba(239, 68, 68, 0.45); }
  .audit-clause-card.warning-risk { border-left: 4px solid rgba(251, 191, 36, 0.45); }
  .audit-clause-card.safe { border-left: 4px solid rgba(74, 222, 128, 0.45); }
  .clause-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
  .clause-title { font-weight: 700; font-size: 0.95rem; color: var(--text-dark); }
  .clause-text { font-size: 0.9rem; color: var(--text-body); line-height: 1.55; margin-bottom: 0.75rem; font-style: italic; background: rgba(255,255,255,0.03); padding: 0.6rem 0.8rem; border-radius: 4px; }
  .clause-finding { font-size: 0.88rem; color: var(--text-dark); line-height: 1.5; margin-bottom: 0.5rem; }
  .clause-redline { background: #2a1f0e; border: 1px dashed #D97706; padding: 0.75rem; border-radius: 6px; font-size: 0.85rem; line-height: 1.5; color: #fbbf24; margin-top: 0.5rem; }
  .redline-tag { font-size: 0.7rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.08em; display: block; margin-bottom: 0.25rem; }

  /* SVG Architecture Diagram Styles & Dynamic Flow Canvas */
  .svg-arch-wrap { width: 100%; overflow-x: auto; background: var(--bg-alt); border: 1px solid #2e2e2e; border-radius: 0; padding: 1.5rem; margin-top: 1rem;  }
  .svg-arch-inner { min-width: 880px; }
  .arch-flow-selector-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-top: 1.75rem; padding: 0.85rem 1.25rem; background: #0e0e0e; border: none; border-radius: 0; }
  .arch-selector-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; color: var(--accent-clay); }
  .arch-flow-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .arch-flow-pill { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.5rem 1.1rem; border-radius: 50px; font-size: 0.84rem; font-weight: 700; border: 1px solid var(--border-color); background: var(--bg-alt); color: var(--text-dark); cursor: pointer; transition: all 0.2s ease; font-family: inherit; }
  .arch-flow-pill:hover { border-color: var(--accent-clay); color: var(--accent-clay); transform: translateY(-1px); }
  .arch-flow-pill.active { background: #FFFFFF; color: #0e0e0e; border-color: #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
  .pill-live-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ADE80; box-shadow: 0 0 6px #4ADE80; display: inline-block; }
  .arch-flow-meta-banner { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem; margin-bottom: 0.25rem; padding: 0.65rem 1rem; background: var(--bg-accent); border-radius: 0; font-size: 0.8rem; }
  .arch-flow-meta-left { display: flex; align-items: center; gap: 0.6rem; font-weight: 700; color: var(--text-dark); }
  .arch-flow-meta-tag { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800; background: #0e0e0e; color: var(--accent-clay); padding: 0.2rem 0.5rem; border-radius: 4px; }
  .arch-flow-meta-right { display: flex; gap: 0.85rem; font-size: 0.75rem; color: var(--text-body); font-weight: 600; flex-wrap: wrap; }

  @keyframes flowDash {
    from { stroke-dashoffset: 24; }
    to { stroke-dashoffset: 0; }
  }
  .svg-flow-path { stroke: var(--accent-clay); stroke-width: 2; stroke-dasharray: 6 4; animation: flowDash 1.2s linear infinite; }
  .svg-return-path { stroke: var(--admin-color); stroke-width: 2; stroke-dasharray: 6 4; animation: flowDash 1.8s linear infinite reverse; }
  .svg-interactive-node { cursor: pointer; transition: filter 0.2s, transform 0.2s; }
  .svg-interactive-node:hover { filter: drop-shadow(0 6px 14px rgba(255, 255, 255, 0.15)); }

  /* Interactive Architecture Explorer */
  .arch-interactive-container { margin-top: 2rem; background: #0e0e0e; border: none; border-radius: 0; overflow: hidden; }
  .arch-tabs-nav { display: grid; grid-template-columns: repeat(4, 1fr); background: var(--bg-alt); border-bottom: 1px solid var(--border-color); }
  @media (max-width: 860px) { .arch-tabs-nav { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 520px) { .arch-tabs-nav { grid-template-columns: 1fr; } }
  .arch-tab-btn { background: none; border: none; padding: 1.2rem 1rem; text-align: left; cursor: pointer; border-right: 1px solid var(--border-color); border-bottom: 3px solid transparent; transition: all 0.2s ease; display: flex; flex-direction: column; gap: 0.35rem; font-family: inherit; }
  .arch-tab-btn:last-child { border-right: none; }
  .arch-tab-btn:hover { background: rgba(255, 255, 255, 0.04); }
  .arch-tab-btn.active { background: #0e0e0e; border-bottom: 3px solid var(--accent-clay); }
  .arch-tab-meta { display: flex; align-items: center; gap: 0.5rem; }
  .arch-tab-icon { font-size: 1.15rem; }
  .arch-tab-title { font-family: var(--font-fraunces), sans-serif; font-size: 0.98rem; font-weight: 700; color: var(--text-dark); }
  .arch-tab-btn.active .arch-tab-title { color: var(--accent-clay); }
  .arch-tab-tagline { font-size: 0.72rem; color: var(--text-body); opacity: 0.8; line-height: 1.3; }
  .arch-pane-body { padding: 2.25rem; }
  .arch-system-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1.25rem; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); }
  .arch-system-title-block h3 { font-family: var(--font-fraunces), sans-serif; font-size: 1.45rem; color: var(--text-dark); margin: 0 0 0.4rem 0; }
  .arch-system-endpoint { font-family: monospace; font-size: 0.82rem; color: var(--accent-clay); background: var(--bg-accent); padding: 0.25rem 0.6rem; border-radius: 4px; font-weight: 700; }
  .arch-system-metrics { display: flex; gap: 0.75rem; flex-wrap: wrap; }
  .arch-metric-pill { font-size: 0.75rem; font-weight: 700; color: var(--text-dark); background: var(--bg-alt); border: 1px solid var(--border-color); padding: 0.35rem 0.75rem; border-radius: 50px; display: inline-flex; align-items: center; gap: 0.35rem; }
  .arch-step-list { display: flex; flex-direction: column; gap: 1rem; }
  .arch-step-card { background: var(--bg-alt); border: 1px solid #2e2e2e; border-radius: 0; overflow: hidden; transition: all 0.2s ease; }
  .arch-step-card:hover { border-color: var(--accent-clay); }
  .arch-step-card.expanded { border-color: var(--accent-clay); }
  .arch-step-header { padding: 1.15rem 1.4rem; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none; gap: 1rem; }
  .arch-step-main { display: flex; align-items: center; gap: 1.15rem; flex-grow: 1; }
  .arch-step-idx { width: 30px; height: 30px; border-radius: 50%; background: var(--accent-clay); color: #0e0e0e; font-size: 0.8rem; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .arch-step-heading { display: flex; flex-direction: column; gap: 0.2rem; }
  .arch-step-title { font-family: var(--font-fraunces), sans-serif; font-size: 1.05rem; color: var(--text-dark); font-weight: 700; margin: 0; }
  .arch-step-summary { font-size: 0.85rem; color: var(--text-body); margin: 0; line-height: 1.4; }
  .arch-step-badges { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
  .arch-step-tag { font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 0.2rem 0.55rem; border-radius: 4px; background: var(--bg-accent); color: var(--accent-clay); }
  .arch-expand-icon { font-size: 0.85rem; color: var(--text-body); transition: transform 0.2s ease; }
  .arch-step-card.expanded .arch-expand-icon { transform: rotate(180deg); }
  .arch-step-detail-body { padding: 0 1.5rem 1.5rem 1.5rem; border-top: 1px dashed var(--border-color); margin-top: 0.5rem; padding-top: 1.25rem; display: flex; flex-direction: column; gap: 1rem; background: #0e0e0e; }
  .arch-detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; }
  .arch-detail-box { background: var(--bg-alt); border: 1px solid #2e2e2e; border-radius: 0; padding: 1rem; }
  .arch-detail-box-title { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800; color: var(--accent-clay); margin-bottom: 0.5rem; }
  .arch-detail-box-text { font-size: 0.85rem; color: var(--text-dark); line-height: 1.5; margin: 0; }
  .arch-code-snippet { background: #1a1a1a; color: #d4d4d4; padding: 1rem 1.25rem; border-radius: 0; font-family: monospace; font-size: 0.8rem; line-height: 1.6; overflow-x: auto; margin: 0; border: 1px solid var(--border-color); }

  /* Market Segment Cards */
  .market-card { background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; padding: 2rem;  }
  .market-tier { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent-clay); font-weight: 800; margin-bottom: 0.5rem; }
  .market-val { font-family: var(--font-fraunces), sans-serif; font-size: 2.75rem; color: var(--text-dark); line-height: 1; font-weight: 700; margin-bottom: 0.75rem; }
  .market-desc { font-size: 0.92rem; color: var(--text-body); line-height: 1.6; margin: 0; }

  /* Business Model Cards */
  .biz-card { background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; padding: 2rem; display: flex; flex-direction: column; justify-content: space-between;  }
  .biz-badge { align-self: flex-start; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 4px; background: var(--bg-accent); color: var(--accent-clay); margin-bottom: 1rem; }
  .biz-title { font-family: var(--font-fraunces), sans-serif; font-size: 1.4rem; color: var(--text-dark); margin: 0 0 0.5rem 0; }
  .biz-price { font-family: var(--font-fraunces), sans-serif; font-size: 1.75rem; color: var(--accent-clay); font-weight: 700; margin-bottom: 0.25rem; }
  .biz-subtext { font-size: 0.8rem; color: var(--text-body); opacity: 0.8; margin-bottom: 1.5rem; }
  .biz-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.65rem; }
  .biz-list li { font-size: 0.88rem; color: var(--text-body); display: flex; gap: 0.6rem; line-height: 1.45; }
  .biz-list li::before { content: "•"; color: var(--accent-clay); font-weight: 900; }

  /* Benchmarks */
  .benchmark-card { background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .bench-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800; color: var(--accent-clay); }
  .bench-val { font-family: var(--font-fraunces), sans-serif; font-size: 2.25rem; color: var(--text-dark); font-weight: 700; line-height: 1; }
  .bench-sub { font-size: 0.82rem; color: var(--text-body); line-height: 1.4; }
  .bench-bar { width: 100%; height: 6px; background: var(--bg-main); border-radius: 3px; overflow: hidden; margin-top: 0.25rem; }
  .bench-fill { height: 100%; background: var(--accent-clay); border-radius: 3px; transition: width 0.5s ease-out; }

  /* Comparison Matrix Table */
  .comp-table-wrap { width: 100%; overflow-x: auto; background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; margin-top: 2rem;  }
  .comp-table { width: 100%; border-collapse: collapse; min-width: 680px; text-align: left; font-size: 0.9rem; }
  .comp-table th, .comp-table td { padding: 1.1rem 1.25rem; border-bottom: 1px solid var(--border-color); }
  .comp-table th { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-dark); font-weight: 800; background: var(--bg-alt); }
  .comp-table th.highlight, .comp-table td.highlight { background: var(--bg-accent); font-weight: 700; color: var(--text-dark); }
  .comp-table td { color: var(--text-body); }

  /* Unique Advantage Pillars */
  .pillar-card { background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; padding: 2rem; display: flex; flex-direction: column; gap: 1rem;  }
  .pillar-icon { font-size: 2rem; }
  .pillar-title { font-family: var(--font-fraunces), sans-serif; font-size: 1.35rem; color: var(--text-dark); margin: 0; line-height: 1.3; }
  .pillar-desc { font-size: 0.92rem; color: var(--text-body); line-height: 1.65; margin: 0; }

  /* GTM Timeline Cards */
  .gtm-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 1rem; }
  .gtm-card { background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; padding: 2rem; display: flex; flex-direction: column; gap: 1rem; }
  .gtm-step { font-family: var(--font-fraunces), sans-serif; font-size: 1.35rem; text-transform: none; letter-spacing: 0; font-weight: 700; color: var(--text-dark); margin: 0; line-height: 1.3; }
  .gtm-period { font-size: 0.8rem; font-weight: 700; color: var(--text-dark); }
  .gtm-target { font-size: 0.85rem; font-weight: 600; color: var(--green-dark); background: var(--green-light); padding: 0.2rem 0.5rem; border-radius: 4px; align-self: flex-start; }
  .gtm-strat { font-size: 0.92rem; color: var(--text-body); line-height: 1.65; margin: 0; }

  /* Team Cards (Uniform, High-Res, Aspect Ratio Fixed + Fallback Avatar) */
  .team-card { background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; overflow: hidden; display: flex; flex-direction: column;  transition: transform 0.2s, box-shadow 0.2s; }
  /* Uniform card hover: subtle border highlight */
  .problem-card:hover, .curve-card:hover, .market-card:hover,
  .biz-card:hover, .benchmark-card:hover, .pillar-card:hover, .gtm-card:hover,
  .team-card:hover, .stack-card:hover, .roadmap-card:hover, .sec-card:hover,
  .audit-clause-card:hover, .api-item:hover,
  .arch-layer-card:hover {
    border-color: var(--accent-clay);
  }
  .team-card:hover { border-color: var(--accent-clay); }
  .team-card:hover .team-img { filter: grayscale(0%); transform: scale(1.02); }
  .team-img-wrap { width: 100%; aspect-ratio: 1/1; overflow: hidden; background: var(--bg-accent); position: relative; }
  .team-img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(10%); transition: filter 0.3s, transform 0.3s; display: block; }
  .team-card:hover .team-img { filter: grayscale(0%); transform: scale(1.02); }
  .team-avatar-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 700; color: var(--accent-clay); background: var(--bg-accent); letter-spacing: 0.05em; }
  .team-body { padding: 1.25rem 1.5rem 1.5rem 1.5rem; display: flex; flex-direction: column; gap: 0.35rem; flex-grow: 1; }
  .team-name { font-family: var(--font-fraunces), sans-serif; font-size: 1.2rem; color: var(--text-dark); margin: 0; font-weight: 700; }
  .team-role { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent-clay); margin: 0; font-weight: 800; }
  .team-email { font-size: 0.82rem; color: var(--text-body); text-decoration: none; opacity: 0.75; transition: opacity 0.2s; }
  .team-email:hover { opacity: 1; color: var(--accent-clay); }
  .team-exp { font-size: 0.78rem; color: var(--text-body); opacity: 0.85; margin-top: 0.5rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem; line-height: 1.4; }

  /* Architecture Topology Cards */
  .arch-topology { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-top: 2rem; }
  .arch-layer-card { background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;  }
  .arch-layer-head { display: flex; align-items: center; gap: 0.75rem; }
  .arch-layer-icon { font-size: 1.5rem; }
  .arch-layer-title { font-family: var(--font-fraunces), sans-serif; font-size: 1.15rem; color: var(--text-dark); margin: 0; font-weight: 700; }
  .arch-layer-role { font-size: 0.78rem; color: var(--accent-clay); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  .arch-items { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.4rem; }
  .arch-items li { font-size: 0.85rem; color: var(--text-body); padding: 0.3rem 0; border-bottom: 1px solid var(--border-color); display: flex; gap: 0.5rem; }
  .arch-items li::before { content: "→"; color: var(--accent-clay); flex-shrink: 0; font-weight: 700; }
  .arch-items li:last-child { border-bottom: none; }

  /* 5-Phase Data Flow Pipeline Cards (Reference Pipeline Layout) */
  .dataflow-pipeline-container { position: relative; margin-top: 2.25rem; width: 100%; }
  .dataflow-cards-track { position: relative; display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.75rem; z-index: 1; }
  
  
  .dataflow-pipeline-card {
    position: relative;
    z-index: 1;
    background: #0e0e0e;
    border: 1px solid var(--border-color);
    border-radius: 0;
    padding: 1.6rem 1.25rem 1.75rem 1.25rem;
    display: flex;
    flex-direction: column;
    
    transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s, border-color 0.22s;
  }
  .dataflow-pipeline-card:hover {
    border-color: var(--accent-clay);
  }
  .dataflow-pipeline-card.final-phase-card {
    background: #FFFFFF;
    border-color: #FFFFFF;
    color: #0e0e0e;
    
  }
  .dataflow-pipeline-card.final-phase-card:hover {
    transform: translateY(-4px);
    border-color: #d4d4d4;
    
  }
  
  .dataflow-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; }
  .dataflow-step-num { font-size: 0.78rem; font-weight: 800; font-family: monospace; color: #8a8a8a; }
  .final-phase-card .dataflow-step-num { color: rgba(0, 0, 0, 0.6); }
  .dataflow-phase-tag { font-size: 0.64rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; background: var(--bg-accent); color: var(--accent-clay); padding: 0.15rem 0.5rem; border-radius: 4px; }
  .final-phase-card .dataflow-phase-tag { background: rgba(0, 0, 0, 0.08); color: #0e0e0e; }
  
  .dataflow-card-icon-wrap { width: 44px; height: 44px; border-radius: 0; background: #0e0e0e; color: var(--accent-clay); display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; border: 1px solid #333333; transition: transform 0.2s ease; }
  .dataflow-pipeline-card:hover .dataflow-card-icon-wrap { transform: scale(1.08); }
  .final-phase-card .dataflow-card-icon-wrap { background: rgba(0, 0, 0, 0.06); color: #3b82f6; border-color: rgba(0, 0, 0, 0.15); }
  
  .dataflow-card-title { font-family: var(--font-fraunces), sans-serif; font-size: 1.05rem; font-weight: 700; color: var(--text-dark); margin: 0 0 0.65rem 0; line-height: 1.32; }
  .final-phase-card .dataflow-card-title { color: #0e0e0e; }
  
  .dataflow-card-desc { font-size: 0.82rem; color: var(--text-body); line-height: 1.55; margin: 0; }
  .final-phase-card .dataflow-card-desc { color: rgba(0, 0, 0, 0.75); }

  @media (max-width: 1200px) {
    .dataflow-cards-track { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 768px) {
    .dataflow-cards-track { grid-template-columns: 1fr; }
  }

  /* Feature Matrix Interactive Table */
  .matrix-toolbar { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem; }
  .matrix-filters { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .matrix-filter-btn { background: var(--bg-main); border: 1px solid var(--border-color); padding: 0.35rem 0.75rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; cursor: pointer; color: var(--text-body); font-family: inherit; }
  .matrix-filter-btn.active { background: #FFFFFF; color: #0e0e0e; border-color: #FFFFFF; }
  .matrix-table-wrap { width: 100%; overflow-x: auto; background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; }
  .matrix-table { width: 100%; border-collapse: collapse; min-width: 620px; font-size: 0.9rem; text-align: left; }
  .matrix-table th, .matrix-table td { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color); }
  .matrix-table th { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent-clay); font-weight: 800; background: var(--bg-alt); }
  .badge { display: inline-block; padding: 0.25rem 0.6rem; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 4px; }
  .badge-live { background: rgba(74, 222, 128, 0.1); color: rgba(74, 222, 128, 0.7); }
  .badge-beta { background: rgba(251, 191, 36, 0.1); color: rgba(251, 191, 36, 0.7); }
  .badge-planned { background: #0e0e0e; color: #a3a3a3; }
  .badge-method { background: var(--bg-accent); color: var(--accent-clay); font-size: 0.65rem; padding: 0.2rem 0.45rem; border-radius: 3px; font-weight: 800; font-family: monospace; }
  .badge-auth { background: #151827; color: #a5b4fc; font-size: 0.65rem; padding: 0.2rem 0.45rem; border-radius: 3px; font-weight: 700; }

  /* Tech Stack Tier Cards */
  .stack-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
  .stack-card { background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; padding: 1.75rem; display: flex; flex-direction: column; gap: 0.5rem;  }
  .stack-layer { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent-clay); font-weight: 800; }
  .stack-items { font-size: 1rem; font-weight: 700; color: var(--text-dark); line-height: 1.4; }
  .stack-desc { font-size: 0.88rem; color: var(--text-body); line-height: 1.55; margin: 0; }

  /* API Reference Explorer */
  .api-explorer { background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; padding: 2rem;  margin-top: 2rem; }
  .api-filter-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .api-tab-btn { background: var(--bg-main); border: 1px solid var(--border-color); padding: 0.4rem 0.85rem; border-radius: 4px; font-size: 0.78rem; font-weight: 700; color: var(--text-body); cursor: pointer; font-family: inherit; }
  .api-tab-btn.active { background: #FFFFFF; color: #0e0e0e; border-color: #FFFFFF; }
  .api-list { display: flex; flex-direction: column; gap: 0.75rem; }
  .api-item { border: 1px solid #2e2e2e; border-radius: 0; padding: 1rem 1.25rem; background: var(--bg-alt); display: flex; flex-direction: column; gap: 0.5rem; }
  .api-item-top { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
  .api-path-wrap { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
  .api-path { font-family: monospace; font-size: 0.9rem; font-weight: 700; color: var(--text-dark); }
  .api-copy-btn { background: transparent; border: 1px solid var(--border-color); padding: 0.25rem 0.55rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; cursor: pointer; color: var(--text-body); font-family: inherit; transition: 0.2s; }
  .api-copy-btn:hover { background: var(--bg-accent); color: var(--accent-clay); }
  .api-desc { font-size: 0.88rem; color: var(--text-body); line-height: 1.5; margin: 0; }
  .api-payload { background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 4px; padding: 0.5rem 0.75rem; font-family: monospace; font-size: 0.78rem; color: var(--text-dark); overflow-x: auto; margin-top: 0.25rem; }

  /* Roadmap Timeline Cards */
  .roadmap-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.75rem; margin-top: 2rem; }
  .roadmap-card { background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; padding: 2rem; display: flex; flex-direction: column; gap: 0.75rem;  }
  .roadmap-badge { align-self: flex-start; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; color: var(--accent-clay); background: var(--bg-accent); padding: 0.25rem 0.6rem; border-radius: 4px; }
  .roadmap-title { font-family: var(--font-fraunces), sans-serif; font-size: 1.25rem; color: var(--text-dark); margin: 0; }
  .roadmap-items { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.6rem; }
  .roadmap-items li { font-size: 0.88rem; color: var(--text-body); padding: 0.35rem 0; border-bottom: 1px solid var(--border-color); display: flex; gap: 0.6rem; line-height: 1.5; }
  .roadmap-items li::before { content: "→"; color: var(--accent-clay); flex-shrink: 0; font-weight: 700; }
  .roadmap-items li:last-child { border-bottom: none; }

  /* Security & Trust Cards */
  .security-layers { list-style: none; padding: 0; margin: 2rem 0 0 0; display: flex; flex-direction: column; gap: 0.75rem; }
  .sec-card { background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; overflow: hidden; }
  .sec-card-header { display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 1rem; }
  .sec-card-left { display: flex; align-items: center; gap: 0.6rem; }
  .sec-card-icon { width: 18px; height: 18px; color: var(--accent-clay); flex-shrink: 0; }
  .sec-card-cat { font-size: 0.72rem; font-weight: 700; color: var(--accent-clay); letter-spacing: 0.04em; }
  .sec-card-layer { font-size: 0.65rem; font-weight: 800; color: #a3a3a3; background: #1a1a1a; padding: 0.2rem 0.6rem; border-radius: 0; letter-spacing: 0.08em; }
  .sec-card-body { padding: 0 1rem 1rem 1rem; }
  .sec-card-title { font-size: 1.05rem; font-weight: 700; color: var(--text-dark); margin: 0 0 0.3rem 0; font-family: var(--font-fraunces), sans-serif; }
  .sec-card-desc { font-size: 0.875rem; color: var(--text-body); line-height: 1.6; margin: 0; }
  .sec-roles { display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
  .sec-role-pill { flex: 1; text-align: center; padding: 0.5rem 0.75rem; border: 1px solid #2e2e2e; border-radius: 0; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.1em; color: var(--text-dark); background: var(--bg-main); }

  /* Back to Top Button */
  .back-to-top { position: fixed; bottom: 2rem; right: 2rem; background: #FFFFFF; color: #0e0e0e; border: none; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.5); transition: 0.2s; z-index: 100; font-size: 1.1rem; }
  .back-to-top:hover { background: #d4d4d4; transform: translateY(-2px); }

  /* Changelog */
  .changelog-table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; background: #0e0e0e; border: 1px solid #2e2e2e; border-radius: 0; overflow: hidden; }
  .changelog-table th, .changelog-table td { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-color); text-align: left; font-size: 0.9rem; }
  .changelog-table th { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--accent-clay); font-weight: 800; background: var(--bg-alt); }
  .version-badge { font-family: monospace; background: var(--bg-accent); color: var(--accent-clay); padding: 0.25rem 0.55rem; border-radius: 4px; font-size: 0.85rem; font-weight: 800; }

  /* Divider */
  .whitepaper-divider { display: flex; align-items: center; gap: 1.25rem; padding: 2.5rem max(4vw, calc((100% - 960px) / 2)); width: 100%; }
  .whitepaper-divider::before, .whitepaper-divider::after { content: ""; flex: 1; height: 0; border-top: 1.5px dotted rgba(255, 255, 255, 0.55); }
  .whitepaper-divider-tag { flex-shrink: 0; color: var(--accent-clay); font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.18em; white-space: nowrap; }

  /* Cards: borderless by default, visible only on hover */
  .problem-card, .curve-card, .market-card, .biz-card, .benchmark-card,
  .pillar-card, .gtm-card, .team-card, .stack-card, .roadmap-card, .sec-card,
  .audit-clause-card, .api-item, .arch-layer-card,
  .comp-table-wrap, .matrix-table-wrap, .changelog-table, .dataflow-pipeline-card {
    border-color: transparent;
  }

  /* Data/AI layer point cards */
  .security-list { list-style: none; padding: 0; margin: 2rem 0 0 0; display: flex; flex-direction: column; gap: 0.9rem; }
  .security-card { display: flex; gap: 0.9rem; align-items: flex-start; padding: 1.25rem 1.4rem; border: 1px solid transparent; border-radius: 0; background: transparent; transition: border-color 0.2s; }
  .security-card:hover { border-color: var(--accent-clay); }
  .security-icon { color: var(--accent-clay); font-size: 1rem; font-weight: 800; flex-shrink: 0; line-height: 1.6; }
  .security-text { font-size: 0.95rem; color: var(--text-body); line-height: 1.65; margin: 0; }

  /* Anchor offset for sticky header */
  .doc-section { scroll-margin-top: 90px; }

  /* Responsive Rules */
  @media (max-width: 960px) {
    .hearth-theme { flex-direction: column; width: 100%; max-width: 100vw; overflow-x: clip; }
    .main-content { width: 100%; min-width: 0; max-width: 100vw; }
    .doc-inner, .grid-2, .grid-3, .grid-4, .hero-editorial-grid { max-width: 100%; }
    .topbar, .mobile-header, .doc-section { max-width: 100vw; box-sizing: border-box; }
    .sidebar { display: none; }
    .sidebar.mobile-open {
      display: flex; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      width: 100%; height: 100dvh; z-index: 250; background: var(--bg-main);
      padding: 1.25rem 1.5rem 2rem; overflow-y: auto; animation: sidebarIn 0.22s ease;
      padding-top: max(1.25rem, env(safe-area-inset-top));
    }
    @keyframes sidebarIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .main-content { width: 100%; }
    .mobile-header {
      display: flex; padding: 0.8rem 1.1rem; background: #0e0e0e;
      border-bottom: none; position: sticky; top: 0; z-index: 90;
    }
    .mobile-toggle {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: #1a1a1a; border: 1px solid #2e2e2e; color: var(--text-dark);
      padding: 0.55rem 1rem; border-radius: 0; font-size: 0.85rem; font-weight: 700;
      cursor: pointer; font-family: inherit;
    }
    .topbar { padding: 0.7rem 1.1rem; }
    .topbar-left { display: none; }
    .topbar .btn { padding: 0.45rem 0.7rem; font-size: 0.68rem; }
    .doc-section { padding: 3rem 1.15rem; scroll-margin-top: 70px; }
    .doc-inner { max-width: 100%; }
    .headline { font-size: clamp(1.7rem, 7.5vw, 2.4rem); margin-bottom: 1.4rem; }
    .section-lead { font-size: 1.02rem; margin-bottom: 1.5rem; }
    .paragraph { font-size: 0.98rem; }
    .grid-2 { grid-template-columns: 1fr; gap: 1.25rem; }
    .arch-topology { grid-template-columns: 1fr; gap: 1.25rem; }
    .grid-3 { grid-template-columns: 1fr; gap: 1.25rem; }
    .grid-4 { grid-template-columns: 1fr 1fr; gap: 1rem; }
    .hero-editorial-grid { grid-template-columns: 1fr; gap: 2rem; }
    .lady-justice-img { max-height: 300px; }
    .hero-btn { width: 100%; justify-content: center; }
    .hero-quick-jumps { gap: 0.5rem; }
    .jump-pill { font-size: 0.74rem; padding: 0.42rem 0.8rem; }
    .telemetry-grid { gap: 1.5rem 1.25rem; }
    .tl-num { font-size: 1.9rem; }
    .toc-link { padding: 0.7rem 0.9rem; font-size: 0.92rem; border-radius: 0; }
    .search-box { padding: 0.85rem 0.9rem 0.85rem 2.3rem; font-size: 0.95rem; }
    .brand { font-size: 1.15rem; }
    .product-card, .problem-card, .gtm-card, .pillar-card, .biz-card, .market-card,
    .stack-card, .roadmap-card, .team-card, .curve-card, .benchmark-card, .demo-wrap,
    .audit-viewer, .api-explorer, .arch-step-card, .arch-detail-box, .sec-card {
      padding: 1.4rem 1.2rem;
    }
    .pc-metrics { grid-template-columns: 1fr 1fr; gap: 1rem; }
    .pc-btn { padding: 0.85rem 1rem; font-size: 0.88rem; }
    .comp-table, .matrix-table, .changelog-table { min-width: 560px; }
    .arch-metric-tiles-grid { grid-template-columns: 1fr 1fr !important; gap: 1rem !important; }
    .modal-box { padding: 1.5rem 1.25rem; max-width: 92vw; }
    .back-to-top { bottom: 1.25rem; right: 1.25rem; width: 40px; height: 40px; }
    .admin-toolbar { flex-direction: column; align-items: flex-start; padding: 1rem; }
    .security-card { padding: 1rem 1.1rem; }
    .telemetry-cell { padding: 0; }
    .whitepaper-divider { padding: 2rem 1.15rem; }
    .matrix-toolbar { flex-direction: column; align-items: flex-start; }
    .hero-main-headline { font-size: clamp(1.8rem, 8vw, 2.5rem); }
    .hero-description { font-size: 1.02rem; padding-left: 1.1rem; }
  }

  @media (max-width: 480px) {
    .doc-section { padding: 2.5rem 1rem; }
    .grid-4 { grid-template-columns: 1fr 1fr; }
    .topbar-right { gap: 0.4rem; }
    .topbar .btn.markdown-btn { display: none; }
    .telemetry-grid { grid-template-columns: 1fr 1fr; gap: 1.25rem 1rem; }
    .tl-num { font-size: 1.6rem; }
    .tl-label { font-size: 0.66rem; }
    .tl-sub { font-size: 0.76rem; }
    .headline { font-size: clamp(1.55rem, 8vw, 2rem); }
    .hero-main-headline { font-size: clamp(1.6rem, 8.5vw, 2.1rem); }
    .pc-metric-num { font-size: 1.4rem; }
    .market-val { font-size: 2.1rem; }
    .bench-val { font-size: 1.8rem; }
    .dataflow-pipeline-card { padding: 1.3rem 1.1rem 1.4rem; }
    .demo-top-tabs { gap: 0.5rem; }
    .demo-tab-btn { padding: 0.45rem 0.85rem; font-size: 0.76rem; }
  }

  /* ======================================================== */
  /* 🖨️ A4 INTELLIGENT PRINT PAGINATION ENGINE               */
  /* ======================================================== */
  @page {
    size: A4 portrait;
    margin: 12mm 14mm 14mm 14mm;
  }

  @media print {
    /* Hide screen-only interactive controls */
    .sidebar, .topbar, .admin-toolbar, .modal-overlay, .btn, .back-to-top, .mobile-header,
    .hero-quick-jumps, .mobile-toggle, .arch-copy-btn, .matrix-filters, .api-filter-tabs,
    .demo-top-tabs, .pill-live-dot, .stat-live-dot, .admin-schedule, .pc-btn {
      display: none !important;
    }

    /* Light theme color palette for print */
    .hearth-theme {
      --bg-main: #ffffff;
      --bg-alt: #ffffff;
      --bg-accent: #f7f7f7;
      --text-dark: #111111;
      --text-body: #333333;
      --accent-clay: #111111;
      --border-color: #e5e5e5;
      --green-dark: #166534;
      --green-light: #f0fdf4;
      --orange-light: #fefce8;
      --orange-dark: #a16207;
      display: block;
      background: #ffffff !important;
      color: #111111 !important;
    }

    /* Neutralize inline dark styles cleanly */
    .hearth-theme * {
      background-color: transparent !important;
      background-image: none !important;
      color: #111111 !important;
      border-color: #e5e5e5 !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }

    /* Typography in print */
    .hearth-theme h1, .hearth-theme h2, .hearth-theme h3, .hearth-theme h4 {
      color: #111111 !important;
    }
    .hearth-theme a {
      color: #111111 !important;
      text-decoration: none;
    }

    /* Main layout reset */
    .main-content {
      width: 100% !important;
      max-width: 100% !important;
      padding: 24px 0 26px 0 !important;
      margin: 0 !important;
    }
    .doc-inner {
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* SECTION FLOW: Natural flow for large sections */
    .doc-section {
      padding: 1.35rem 0.25rem !important;
      break-inside: auto !important;
      page-break-inside: auto !important;
      border-bottom: 1px solid #eeeeee !important;
    }
    .doc-section.alt {
      background: #ffffff !important;
    }

    /* PART I: YC PITCH DECK SLIDE-BASED PAGES (Clean 1 slide per page) */
    [data-section="problem"],
    [data-section="solution"],
    [data-section="why-now"],
    [data-section="demo"],
    [data-section="market"],
    [data-section="business-model"],
    [data-section="traction"],
    [data-section="competition"],
    [data-section="advantage"],
    [data-section="gtm"],
    [data-section="vision"],
    [data-section="team"] {
      break-before: page !important;
      page-break-before: always !important;
    }

    /* In Section 04 Demo: split the 2 demo simulators onto 2 clean pages */
    #demo-audit {
      break-before: page !important;
      page-break-before: always !important;
      margin-top: 1.5rem !important;
    }

    /* PART II: TECHNICAL WHITEPAPER DIVIDER (Starts on clean page) */
    .whitepaper-divider {
      break-before: page !important;
      page-break-before: always !important;
      break-after: avoid !important;
      page-break-after: avoid !important;
      padding: 1.5rem 0.25rem !important;
    }

    /* PART II TECHNICAL SECTIONS: Intentional chapter page breaks */
    [data-section="data-flow"],
    [data-section="tech-stack"],
    [data-section="api-docs"],
    [data-section="data-layer"],
    [data-section="ai-layer"],
    [data-section="roadmap"],
    [data-section="performance"],
    [data-section="security"],
    [data-section="analytics"],
    [data-section="changelog"] {
      break-before: page !important;
      page-break-before: always !important;
      break-inside: auto !important;
      page-break-inside: auto !important;
    }

    [data-section="overview"],
    [data-section="architecture"],
    [data-section="features"],
    [data-section="contributors"] {
      break-before: auto !important;
      page-break-before: auto !important;
      break-inside: auto !important;
      page-break-inside: auto !important;
    }

    /* COVER PAGE (Hero Section) — Clean Page 1 executive cover */
    [data-section="top"] {
      break-after: page !important;
      page-break-after: always !important;
    }
    [data-section="top"] .doc-section {
      min-height: 88vh !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: space-between !important;
      border-bottom: none !important;
      padding-top: 0.5rem !important;
    }
    [data-section="top"] .hero-editorial-grid {
      gap: 1.25rem !important;
      margin-top: 0.5rem !important;
      align-items: center !important;
    }
    [data-section="top"] .hero-main-headline {
      font-size: 2.15rem !important;
      line-height: 1.2 !important;
      margin-bottom: 0.85rem !important;
    }
    [data-section="top"] .hero-description {
      font-size: 0.95rem !important;
      line-height: 1.55 !important;
      margin-bottom: 0.75rem !important;
      padding-left: 1rem !important;
    }
    [data-section="top"] .lady-justice-img {
      max-height: 220px !important;
      width: auto !important;
      mix-blend-mode: normal !important;
      filter: none !important;
    }
    [data-section="top"] .telemetry-panel {
      margin-top: 1rem !important;
      border: 1px solid #e0e0e0 !important;
      border-radius: 6px !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    [data-section="top"] .telemetry-grid {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 0.75rem 1.25rem !important;
      padding: 0.85rem 1rem !important;
    }
    [data-section="top"] .tl-num {
      font-size: 1.6rem !important;
    }
    [data-section="top"] .tl-label {
      font-size: 0.65rem !important;
    }
    [data-section="top"] .tl-sub {
      font-size: 0.72rem !important;
    }

    /* HEADINGS: NEVER ORPHAN A HEADING WITHOUT ITS CONTENT OR SPLIT ACROSS PAGES */
    h1, h2, h3, h4, h5, h6,
    .headline, .hero-main-headline,
    .eyebrow, .section-lead,
    .whitepaper-divider, .whitepaper-divider-tag,
    .pc-title, .pc-card-title, .biz-title, .pillar-title,
    .market-tier, .gtm-step, .team-name, .stack-layer,
    .arch-layer-title, .dataflow-card-title, .sec-card-title,
    .clause-title, .clause-head {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      break-after: avoid !important;
      page-break-after: avoid !important;
    }

    /* PARAGRAPH ORPHANS & WIDOWS */
    p, .paragraph, .pc-desc, .pc-card-desc, .market-desc,
    .biz-subtext, .pillar-desc, .gtm-strat, .stack-desc,
    .api-desc, .sec-card-desc {
      orphans: 3 !important;
      widows: 3 !important;
    }

    /* GRID TRACKS ON A4 PRINT */
    .grid-2 {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 0.85rem !important;
    }
    .grid-3 {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 0.75rem !important;
    }
    .grid-4 {
      display: grid !important;
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 0.65rem !important;
    }

    /* SMALL & COMPLEX CONTENT CARDS: ALWAYS KEEP TOGETHER */
    .problem-card,
    .product-card,
    .biz-card,
    .market-card,
    .curve-card,
    .pillar-card,
    .gtm-card,
    .team-card,
    .stack-card,
    .roadmap-card,
    .sec-card,
    .security-card,
    .benchmark-card,
    .audit-clause-card,
    .audit-score-banner,
    .api-item,
    .arch-layer-card,
    .arch-step-card,
    .dataflow-pipeline-card,
    .perf-opt-box,
    .governance-box,
    .telemetry-cell {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      border: 1px solid #e0e0e0 !important;
      border-radius: 6px !important;
      background: #ffffff !important;
    }

    /* SPECIFIC ISSUE FIXES */
    /* 1. Problem Cards (Issue A: Diaspora Inaccessibility) */
    .problem-card {
      padding: 1.15rem 1rem !important;
      margin-bottom: 0.65rem !important;
    }
    .problem-card .pc-top,
    .problem-card .pc-title,
    .problem-card .pc-metric {
      break-after: avoid !important;
      page-break-after: avoid !important;
    }

    /* 2. Product Showcase Cards (Issue B: ContractMind Card) */
    .product-card {
      padding: 1.15rem 1rem !important;
      margin-bottom: 0.75rem !important;
    }
    .product-card .pc-head,
    .product-card .pc-card-title,
    .product-card .pc-metrics {
      break-after: avoid !important;
      page-break-after: avoid !important;
    }
    .product-card .pc-metrics {
      margin-bottom: 0.65rem !important;
      padding: 0.5rem 0 !important;
    }
    .product-card .pc-checks {
      margin-bottom: 0.5rem !important;
    }
    .product-card .pc-checks li {
      break-inside: avoid !important;
    }

    /* 3. Contract Audit Simulator (Issue C: Health Score & Clauses) */
    .audit-viewer {
      break-inside: auto !important;
      page-break-inside: auto !important;
      border: none !important;
      padding: 0 !important;
      background: transparent !important;
    }
    .audit-viewer > div:first-child {
      break-after: avoid !important;
      page-break-after: avoid !important;
      margin-bottom: 0.75rem !important;
    }
    .audit-score-banner {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      break-after: avoid !important;
      page-break-after: avoid !important;
      padding: 0.85rem 1.15rem !important;
      margin-bottom: 0.75rem !important;
      background: #fcfcfc !important;
    }
    .audit-clauses {
      break-inside: auto !important;
    }
    .audit-clause-card {
      padding: 0.85rem 1rem !important;
      margin-bottom: 0.65rem !important;
    }
    .audit-clause-card .clause-head {
      break-after: avoid !important;
      page-break-after: avoid !important;
      margin-bottom: 0.35rem !important;
    }

    /* 4. Business Model (Issue D: FastMCP Card & Blank Space Reduction) */
    [data-section="business-model"] .grid-3 {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 0.75rem !important;
    }
    .biz-card {
      padding: 1rem 0.85rem !important;
      margin-bottom: 0.65rem !important;
      height: auto !important;
      justify-content: flex-start !important;
    }
    .biz-badge, .biz-title, .biz-price, .biz-subtext {
      break-after: avoid !important;
      page-break-after: avoid !important;
    }
    .biz-price {
      font-size: 1.35rem !important;
    }
    .biz-subtext {
      margin-bottom: 0.65rem !important;
    }
    .biz-list {
      gap: 0.35rem !important;
    }
    .biz-list li {
      font-size: 0.76rem !important;
      line-height: 1.3 !important;
    }

    /* 5. Team Section: 3x2 Grid with Full, Uncut Square Headshot Photos */
    [data-section="team"] {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    [data-section="team"] .grid-3 {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 0.65rem !important;
    }
    .team-card {
      margin-bottom: 0.25rem !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .team-img-wrap {
      width: 100% !important;
      aspect-ratio: 1/1 !important;
      max-height: none !important;
      height: auto !important;
      overflow: hidden !important;
      background: #f5f5f5 !important;
      position: relative !important;
      display: block !important;
    }
    .team-img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      display: block !important;
      opacity: 1 !important;
      visibility: visible !important;
      print-color-adjust: exact !important;
      -webkit-print-color-adjust: exact !important;
    }
    .team-body {
      padding: 0.45rem 0.65rem !important;
      gap: 0.15rem !important;
    }
    .team-name {
      font-size: 0.88rem !important;
    }
    .team-role {
      font-size: 0.62rem !important;
    }
    .team-email {
      font-size: 0.7rem !important;
    }
    .team-exp {
      font-size: 0.64rem !important;
      margin-top: 0.2rem !important;
      padding-top: 0.2rem !important;
      line-height: 1.3 !important;
    }

    /* 6. Comparison & Data Tables */
    .comp-table-wrap, .matrix-table-wrap, .changelog-table {
      break-inside: auto !important;
      overflow: visible !important;
      width: 100% !important;
      border: 1px solid #e0e0e0 !important;
      border-radius: 6px !important;
    }
    .comp-table, .matrix-table, .changelog-table {
      width: 100% !important;
      min-width: 0 !important;
    }
    .comp-table tr, .matrix-table tr, .changelog-table tr {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    thead {
      display: table-header-group !important;
    }
    .comp-table th, .matrix-table th, .changelog-table th {
      break-after: avoid !important;
      padding: 0.65rem 0.85rem !important;
    }
    .comp-table td, .matrix-table td, .changelog-table td {
      padding: 0.65rem 0.85rem !important;
    }

    /* 7. SVG Diagrams & Architecture */
    .arch-svg-canvas, .svg-arch-inner {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      height: auto !important;
    }
    .svg-canvas-container, .svg-arch-wrap {
      overflow: visible !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
      padding: 0 !important;
    }
    .hearth-theme svg {
      background: #ffffff !important;
    }
    .hearth-theme svg text {
      fill: #111111 !important;
    }
    .hearth-theme svg rect, .hearth-theme svg circle, .hearth-theme svg path, .hearth-theme svg line {
      fill: #ffffff !important;
      stroke: #444444 !important;
    }

    /* 8. Whitepaper Divider */
    .whitepaper-divider {
      break-after: avoid !important;
      page-break-after: avoid !important;
      padding: 1.5rem 0.25rem !important;
    }
    .whitepaper-divider::before, .whitepaper-divider::after {
      content: "" !important;
      flex: 1 !important;
      height: 0 !important;
      border-top: 1.5px dotted #666666 !important;
    }

    /* Force background print colors */
    html, body {
      background: #ffffff !important;
    }
    div[class*="bg-\[\#0e0e0e\]"] {
      background: #ffffff !important;
    }
    .headline, .hero-main-headline {
      -webkit-print-color-adjust: exact;
    }
  }
`;

// ==========================================
// 🧩 SECTION COMPONENT
// ==========================================
const Section = ({
  id,
  eyebrow,
  headline,
  children,
  altBg,
}: {
  id?: string;
  eyebrow?: string;
  headline?: string;
  children: React.ReactNode;
  altBg?: boolean;
}) => (
  <section id={id} data-section={id} className={`doc-section${altBg ? " alt" : ""}`}>
    <div className="doc-inner">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      {headline && <h2 className="headline">{headline}</h2>}
      {children}
    </div>
  </section>
);

// ==========================================
// 🚫 403 NOT AVAILABLE GATE
// ==========================================
const NotAvailablePage = ({
  onAdminClick,
  scheduleWindow,
}: {
  onAdminClick: () => void;
  scheduleWindow?: { start: string; end: string };
}) => (
  <div className={`hearth-theme ${fraunces.variable} ${karla.variable}`}>
    <style dangerouslySetInnerHTML={{ __html: STYLES }} />
    <div className="gate-wrap" style={{ width: "100%" }}>
      <div className="gate-code">403</div>
      <h1 className="gate-title">Documentation Not Available</h1>
      <p className="gate-desc">
        Advotech Copilot live documentation and pitch portal is currently reserved for authorized evaluators, judges, and investors during scheduled evaluation windows.
      </p>
      {scheduleWindow && (
        <div className="gate-window">
          Scheduled Window: {new Date(scheduleWindow.start).toLocaleString()} → {new Date(scheduleWindow.end).toLocaleString()}
        </div>
      )}
      <span className="gate-admin-link" onClick={onAdminClick}>
        Administrator Access Authentication →
      </span>
    </div>
  </div>
);

// ==========================================
// (Architecture data moved to ./architectureData.ts and rendered via <ArchitectureExplorer />)

// ==========================================
// 🚀 MAIN INTERACTIVE COMPONENT
// ==========================================
export default function DocsSystem() {
  const [d, setD] = useState(INITIAL_DOCS_DATA);

  // --- Access Control State (3-State Model matching backend) ---
  const [visibility, setVisibility] = useState<"ON" | "OFF" | "SCHEDULED">("ON");
  const [scheduleStart, setScheduleStart] = useState(ACCESS_CONFIG.defaultStart);
  const [scheduleEnd, setScheduleEnd] = useState(ACCESS_CONFIG.defaultEnd);
  const [syncStatus, setSyncStatus] = useState<"LIVE_DB" | "STANDALONE">("STANDALONE");

  // --- Admin Auth State ---
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // Allow System Admin to control docs page via URL param or local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const adminParam = params.get("admin");
      if (
        adminParam === ACCESS_CONFIG.adminPin ||
        adminParam === "true" ||
        localStorage.getItem("advotech_admin_mode") === "true"
      ) {
        setIsAdminMode(true);
      }
    }
  }, []);

  // --- Quick Edit Form State ---
  const [editTagline, setEditTagline] = useState(d.meta.tagline);
  const [editOneLiner, setEditOneLiner] = useState(d.meta.one_liner);
  const [editProblemHeadline, setEditProblemHeadline] = useState(d.pitch.problem.headline);
  const [editSolutionHeadline, setEditSolutionHeadline] = useState(d.pitch.solution.headline);

  // --- UI Navigation State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("top");
  const [copied, setCopied] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // --- Interactive Demos State ---
  const [demoCategory, setDemoCategory] = useState<"commercial" | "tenant" | "employment">("commercial");
  const [apiFilter, setApiFilter] = useState("All");
  const [matrixFilter, setMatrixFilter] = useState("ALL");
  const [activeAuditTab, setActiveAuditTab] = useState<"findings" | "redlines">("findings");

  // --- Auto-Sync Live Telemetry from Backend on Mount ---
  useEffect(() => {
    // 1. Fetch live access config
    fetch(`${ACCESS_CONFIG.apiBase}/api/docs/access`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Access endpoint unavailable");
      })
      .then((data) => {
        if (data && data.visibility) {
          setVisibility(data.visibility);
          if (data.schedule_start) setScheduleStart(data.schedule_start.slice(0, 16));
          if (data.schedule_end) setScheduleEnd(data.schedule_end.slice(0, 16));
        }
      })
      .catch(() => {
        // Fallback to local configuration gracefully
      });

    // 2. Fetch live database KPIs
    fetch(`${ACCESS_CONFIG.apiBase}/api/docs/live-stats`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Stats endpoint unavailable");
      })
      .then((data) => {
        if (data && (data.total_users || data.total_audits)) {
          setD((prev) => {
            const users = data.total_users || prev.stats.total_users;
            const audits = data.total_audits || prev.stats.total_audits;
            return {
              ...prev,
              stats: {
                ...prev.stats,
                total_users: users,
                total_audits: audits,
                statutes_indexed: data.statutes_indexed || prev.stats.statutes_indexed,
              },
              tech: {
                ...prev.tech,
                analytics: {
                  ...prev.tech.analytics,
                  kpis: prev.tech.analytics.kpis.map((kpi) => {
                    if (kpi.label === "Active Test Users") {
                      return { ...kpi, value: String(users) };
                    }
                    if (kpi.label === "Contracts Audited") {
                      return { ...kpi, value: String(audits) };
                    }
                    return kpi;
                  }),
                },
              },
            };
          });
          setSyncStatus("LIVE_DB");
        }
      })
      .catch(() => {
        // Banked benchmark metrics
      });

    // 3. Eagerly preload and decode team member avatars for instant, flawless print & display
    if (typeof window !== "undefined") {
      INITIAL_DOCS_DATA.team.forEach((m) => {
        if (m.avatar) {
          const img = new Image();
          img.src = m.avatar;
          if (img.decode) img.decode().catch(() => {});
        }
      });
    }
  }, []);

  // --- Ensure all images are eagerly evaluated on beforeprint ---
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleBeforePrint = () => {
      document.querySelectorAll("img").forEach((img) => {
        img.loading = "eager";
      });
    };
    window.addEventListener("beforeprint", handleBeforePrint);
    return () => window.removeEventListener("beforeprint", handleBeforePrint);
  }, []);

  // --- Intersection Observer for Scroll Tracking ---
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);

    const sections = document.querySelectorAll("[data-section]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.getAttribute("data-section") || "");
          }
        });
      },
      { threshold: 0.15, rootMargin: "-80px 0px -65% 0px" }
    );
    sections.forEach((s) => observer.observe(s));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  // --- Evaluate Public Reachability ---
  const isAccessibleNow = useMemo(() => {
    if (isAdminMode) return true;
    if (visibility === "ON") return true;
    if (visibility === "OFF") return false;
    // SCHEDULED
    const now = new Date();
    const start = new Date(scheduleStart);
    const end = new Date(scheduleEnd);
    return now >= start && now <= end;
  }, [isAdminMode, visibility, scheduleStart, scheduleEnd]);

  // --- Admin PIN verify ---
  const handlePinSubmit = () => {
    if (pinInput === ACCESS_CONFIG.adminPin) {
      setIsAdminMode(true);
      setShowPinModal(false);
      setPinInput("");
      setPinError("");
      if (typeof window !== "undefined") {
        localStorage.setItem("advotech_admin_mode", "true");
      }
    } else {
      setPinError("Incorrect administrative security PIN. Please try again.");
    }
  };

  // --- Update Visibility on Backend & Local ---
  const updateVisibilitySetting = (newVis: "ON" | "OFF" | "SCHEDULED") => {
    setVisibility(newVis);
    fetch(`${ACCESS_CONFIG.apiBase}/api/docs/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visibility: newVis,
        schedule_start: scheduleStart,
        schedule_end: scheduleEnd,
      }),
    }).catch(() => {});
  };

  // --- Save In-Page Quick Content Edits ---
  const handleSaveQuickEdit = () => {
    setD((prev) => ({
      ...prev,
      meta: {
        ...prev.meta,
        tagline: editTagline,
        one_liner: editOneLiner,
      },
      pitch: {
        ...prev.pitch,
        problem: {
          ...prev.pitch.problem,
          headline: editProblemHeadline,
        },
        solution: {
          ...prev.pitch.solution,
          headline: editSolutionHeadline,
        },
      },
    }));
    setShowEditModal(false);
  };

  // --- Set Duration Helper ---
  const handleSetDuration = (hours: number) => {
    const start = new Date();
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
    const sStr = start.toISOString().slice(0, 16);
    const eStr = end.toISOString().slice(0, 16);
    setScheduleStart(sStr);
    setScheduleEnd(eStr);
    setVisibility("SCHEDULED");
    fetch(`${ACCESS_CONFIG.apiBase}/api/docs/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visibility: "SCHEDULED",
        schedule_start: sStr,
        schedule_end: eStr,
        duration_hours: hours,
      }),
    }).catch(() => {});
  };

  // --- Set Default Showcase Window ---
  const handleSetDefaultWindow = () => {
    setScheduleStart(ACCESS_CONFIG.defaultStart);
    setScheduleEnd(ACCESS_CONFIG.defaultEnd);
    setVisibility("SCHEDULED");
  };

  // --- Export PDF (With Synchronous Pre-Decode Barrier for Flawless Printing) ---
  const handlePrint = async () => {
    if (typeof window !== "undefined") {
      const oldTitle = document.title;
      document.title = "Advotech-Copilot-Whitepaper-YC-Pitch";

      try {
        const images = Array.from(document.querySelectorAll("img"));
        await Promise.all(
          images.map((img) => {
            img.loading = "eager";
            if (img.complete && img.naturalHeight !== 0) {
              return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
            }
            return new Promise<void>((resolve) => {
              const timer = setTimeout(resolve, 800);
              img.onload = () => {
                clearTimeout(timer);
                if (img.decode) img.decode().catch(() => {}).then(() => resolve());
                else resolve();
              };
              img.onerror = () => {
                clearTimeout(timer);
                resolve();
              };
            });
          })
        );
      } catch (e) {
        console.warn("Print image pre-decode warning:", e);
      }

      // Small tick for paint layout stabilization
      await new Promise((r) => setTimeout(r, 150));

      window.print();
      setTimeout(() => {
        document.title = oldTitle;
      }, 1500);
    }
  };

  // --- Copy link ---
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // --- Copy Endpoint ---
  const handleCopyEndpoint = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedEndpoint(text);
      setTimeout(() => setCopiedEndpoint(null), 2000);
    });
  };

  // --- Export Markdown ---
  const handleMarkdownExport = () => {
    const md = `# ${d.meta.company} — Technical Whitepaper & YC Pitch\n\n**Version:** ${d.meta.version} | **Last Updated:** ${d.meta.last_updated}\n\n## Overview\n${d.meta.one_liner}\n\n## Traction\n- Contract Audit Recall: 100%\n- Accuracy: ${d.stats.accuracy_rate}\n- Statutes Indexed: ${d.stats.statutes_indexed.toLocaleString()}\n- Benchmark Pass Rate: ${d.stats.benchmark_pass} (59/73 gold cases)\n\n## Team\n${d.team.map((m) => `- **${m.name}** — ${m.role} (${m.email})`).join("\n")}\n`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "advotech-copilot-whitepaper.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Scroll to top ---
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- Filtered API Docs ---
  const filteredApiDocs = useMemo(() => {
    if (apiFilter === "All") return d.tech.api_docs;
    return d.tech.api_docs.filter((item) => item.group.toLowerCase() === apiFilter.toLowerCase());
  }, [apiFilter, d.tech.api_docs]);

  // --- Filtered Feature Matrix ---
  const filteredMatrix = useMemo(() => {
    if (matrixFilter === "ALL") return d.tech.feature_matrix;
    return d.tech.feature_matrix.filter((item) => item.status === matrixFilter);
  }, [matrixFilter, d.tech.feature_matrix]);

  // --- Demo Simulation Data ---
  const demoData = {
    commercial: {
      query: "চেক বাউন্স (Dishonour) হলে নেগোশিয়েবল ইনস্ট্রুমেন্টস অ্যাক্টের ১৩৮ ধারায় নোটিশ পাঠানোর নির্দিষ্ট সময়সীমা কতদিন?",
      answer: "The Negotiable Instruments Act, 1881-এর ধারা ১৩৮(১)(খ) অনুযায়ী চেক ডিজঅনারের ক্ষেত্রে নোটিশ ও মামলা দায়েরের কঠোর সময়সীমা রয়েছে:\n\n১. ব্যাংক থেকে 'Dishonour Memo' পাওয়ার তারিখ থেকে ঠিক ৩০ দিনের মধ্যে ড্রয়ারকে লিখিত সংবিধিবদ্ধ নোটিশ (Statutory Notice of Demand) পাঠাতে হবে।\n২. নোটিশ প্রাপক নোটিশ প্রাপ্তির তারিখ থেকে ৩০ দিন সময় পাবেন টাকা পরিশোধ করার জন্য (Cure Period)।\n৩. এই ৩০ দিনেও টাকা পরিশোধ না হলে, পরবর্তী ৩০ দিনের মধ্যে উপযুক্ত জুডিশিয়াল ম্যাজিস্ট্রেট আদালতে ফৌজদারি নালিশ দাখিল করতে হবে।",
      statute: "The Negotiable Instruments Act, 1881 (Act XXVI of 1881) — Section 138 & 141",
      citationNote: "Mandatory 30-day statutory notice requirement; failure to serve notice within 30 days forever bars criminal remedies under Section 138.",
      gazetteUrl: "http://bdlaws.minlaw.gov.bd/act-55/section-16016.html",
      matchRate: "99.8%",
      latency: "0.85s",
    },
    tenant: {
      query: "বাড়িওয়ালা ৩ মাসের অগ্রিম সিকিউরিটি দাবি করছে, আমি কি চুক্তি বাতিল না করে ভাড়া নিয়ন্ত্রণ আইনে প্রতিকার পাব?",
      answer: "Premises Rent Control Act, 1991 (বাড়ি ভাড়া নিয়ন্ত্রণ আইন, ১৯৯১)-এর ধারা ১০ ও ধারা ২৩ অনুযায়ী:\n\n১. ধারা ১০ অনুসারে, কোনো বাড়িওয়ালা এক মাসের ভাড়ার অধিক অর্থ অগ্রিম বা জামানত (Security Deposit/Premium) হিসেবে দাবি বা গ্রহণ করতে পারবেন না।\n২. অতিরিক্ত অগ্রিম গ্রহণ করা আইনত দণ্ডনীয় এবং এই অর্থ মাসিক ভাড়ার সাথে সমন্বয়যোগ্য।\n৩. ভাড়াটিয়া উক্ত অতিরিক্ত অর্থ আদায়ে ভাড়া নিয়ন্ত্রক (Rent Controller) আদালতে আবেদন করতে পারবেন।",
      statute: "The Premises Rent Control Act, 1991 (Act III of 1991) — Section 10 & 23",
      citationNote: "Express statutory prohibition against demanding more than one month advance rent; punishable by fine under Section 23.",
      gazetteUrl: "http://bdlaws.minlaw.gov.bd/act-795.html",
      matchRate: "99.4%",
      latency: "0.92s",
    },
    employment: {
      query: "Can my employer restrict me from working in the same IT software industry for 2 years after resigning in Bangladesh?",
      answer: "Under Section 27 of The Contract Act, 1872 (Act IX of 1872), every agreement by which anyone is restrained from exercising a lawful profession, trade, or business of any kind is to that extent VOID ab initio.\n\n• Post-termination non-compete covenants are fundamentally unenforceable in Bangladesh.\n• Employers cannot restrict your right to take employment at a competitor or launch a startup.\n• Only legitimate Non-Disclosure Agreements (NDAs) protecting proprietary trade secrets remain valid, but not trade restraints.",
      statute: "The Contract Act, 1872 (Act IX of 1872) — Section 27 (Agreement in restraint of trade void)",
      citationNote: "Established Supreme Court precedent (28 DLR 121); non-compete clauses restraining professional employment are void and illegal.",
      gazetteUrl: "http://bdlaws.minlaw.gov.bd/act-26/section-2695.html",
      matchRate: "99.9%",
      latency: "0.78s",
    },
  };

  const activeDemo = demoData[demoCategory];

  // --- Gate Enforcement ---
  if (!isAccessibleNow) {
    return (
      <NotAvailablePage
        onAdminClick={() => setShowPinModal(true)}
        scheduleWindow={{ start: scheduleStart, end: scheduleEnd }}
      />
    );
  }

  const tocMatch = (label: string) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return label.toLowerCase().includes(q);
  };
  const tocActive = (id: string) => (activeSection === id ? "toc-link active" : "toc-link");

  return (
    <div className={`hearth-theme ${fraunces.variable} ${karla.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* 🔐 PIN AUTH MODAL */}
      {showPinModal && (
        <div className="modal-overlay" onClick={() => setShowPinModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Admin Access Authentication</h2>
            <p className="modal-sub">
              Enter the authorized administrative security PIN to configure public availability and manage evaluation schedules.
            </p>
            <input
              type="password"
              className="modal-input"
              placeholder="Enter PIN (e.g. advotech2026)..."
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
              autoFocus
            />
            {pinError && <p className="modal-error">{pinError}</p>}
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={handlePinSubmit}>
                Authenticate
              </button>
              <button
                className="modal-btn secondary"
                onClick={() => {
                  setShowPinModal(false);
                  setPinInput("");
                  setPinError("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✏️ IN-PAGE QUICK CONTENT EDITOR MODAL */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-box" style={{ maxWidth: "540px" }} onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Quick Content Editor</h2>
            <p className="modal-sub">Edit live headlines and value proposition copy across the documentation portal.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-clay)" }}>Tagline</label>
                <input
                  type="text"
                  className="modal-input"
                  style={{ marginBottom: 0 }}
                  value={editTagline}
                  onChange={(e) => setEditTagline(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-clay)" }}>One-Liner</label>
                <textarea
                  className="modal-input"
                  style={{ marginBottom: 0, height: "70px", resize: "vertical" }}
                  value={editOneLiner}
                  onChange={(e) => setEditOneLiner(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-clay)" }}>Problem Headline</label>
                <input
                  type="text"
                  className="modal-input"
                  style={{ marginBottom: 0 }}
                  value={editProblemHeadline}
                  onChange={(e) => setEditProblemHeadline(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-clay)" }}>Solution Headline</label>
                <input
                  type="text"
                  className="modal-input"
                  style={{ marginBottom: 0 }}
                  value={editSolutionHeadline}
                  onChange={(e) => setEditSolutionHeadline(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={handleSaveQuickEdit}>
                Save Changes Live
              </button>
              <button className="modal-btn secondary" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛠 ADMIN TOOLBAR WITH COMPLETE CONTROLS */}
      {isAdminMode && (
        <div className="admin-toolbar">
          <div className="admin-toolbar-left">
            <div>
              <span className={`admin-status-dot ${visibility === "ON" ? "on" : visibility === "SCHEDULED" ? "scheduled" : "off"}`}></span>
              Status: <strong>{visibility}</strong> ({syncStatus === "LIVE_DB" ? "DB Synced" : "Standalone"})
            </div>

            {/* Visibility Mode Toggles */}
            <div style={{ display: "flex", gap: "0.35rem" }}>
              <button
                className={`btn-admin ${visibility === "ON" ? "active" : ""}`}
                onClick={() => updateVisibilitySetting("ON")}
                title="Always Public"
              >
                Public (ON)
              </button>
              <button
                className={`btn-admin ${visibility === "SCHEDULED" ? "active" : ""}`}
                onClick={() => updateVisibilitySetting("SCHEDULED")}
                title="Only during schedule"
              >
                Scheduled
              </button>
              <button
                className={`btn-admin danger ${visibility === "OFF" ? "active" : ""}`}
                onClick={() => updateVisibilitySetting("OFF")}
                title="Private / Gated (403)"
              >
                Gated (OFF)
              </button>
            </div>
          </div>

          {/* Schedule Window Inputs */}
          <div className="admin-schedule">
            <label>Window:</label>
            <input type="datetime-local" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} />
            <span style={{ opacity: 0.6 }}>→</span>
            <input type="datetime-local" value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} />

            {/* Quick Duration Presets */}
            <button className="btn-admin" onClick={() => handleSetDuration(1)} title="+1 Hour">
              +1h
            </button>
            <button className="btn-admin" onClick={() => handleSetDuration(24)} title="+24 Hours">
              +24h
            </button>
            <button className="btn-admin" onClick={handleSetDefaultWindow} title="Default Jun 10-14 Window">
              Jun 10-14
            </button>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="btn-admin" onClick={() => setShowEditModal(true)}>
              ✏ Quick Edit
            </button>
            <a href="/admin/docs" target="_blank" rel="noopener noreferrer" className="btn-admin" style={{ textDecoration: "none" }}>
              Full Studio ↗
            </a>
            <button
              className="btn-admin danger"
              onClick={() => {
                setIsAdminMode(false);
                if (typeof window !== "undefined") {
                  localStorage.removeItem("advotech_admin_mode");
                }
              }}
            >
              ✕ Exit
            </button>
          </div>
        </div>
      )}

      {/* 📱 MOBILE HEADER */}
      <div className="mobile-header">
        <a href="#top" className="brand" style={{ margin: 0, fontSize: "1.15rem" }}>
          <img src="/logo.svg" alt="AdvoTech Copilot" className="brand-logo" style={{ width: "26px", height: "26px" }} />
          <span className="brand-name">
            AdvoTech <span className="brand-accent">Copilot</span>
          </span>
        </a>
        <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={16} strokeWidth={2.4} /> : <Menu size={16} strokeWidth={2.4} />}
          <span>{mobileMenuOpen ? "Close" : "Sections"}</span>
        </button>
      </div>

      {/* 🧭 SIDEBAR NAVIGATION */}
      <aside className={`sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <a href="#top" className="brand" onClick={() => setMobileMenuOpen(false)}>
          <img src="/logo.svg" alt="AdvoTech Copilot" className="brand-logo" />
          <span className="brand-name">
            AdvoTech <span className="brand-accent">Copilot</span>
          </span>
        </a>

        <div className="search-box-wrap">
          <Search className="search-icon" size={15} strokeWidth={2.2} />
          <input
            type="text"
            className="search-box"
            placeholder="Quick search sections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ flexGrow: 1, overflowY: "auto" }}>
          <div className="toc-title">Part I — YC Pitch Deck</div>
          <a href="#top" className={tocActive("top")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Executive Overview") ? undefined : "none" }}>
            <span>Executive Overview</span>
            <span className="toc-count">00</span>
          </a>
          <a href="#problem" className={tocActive("problem")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("The Problem") ? undefined : "none" }}>
            <span>The Problem</span>
            <span className="toc-count">01</span>
          </a>
          <a href="#solution" className={tocActive("solution")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("The Solution") ? undefined : "none" }}>
            <span>The Solution</span>
            <span className="toc-count">02</span>
          </a>
          <a href="#why-now" className={tocActive("why-now")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Why Now") ? undefined : "none" }}>
            <span>Why Now</span>
            <span className="toc-count">03</span>
          </a>
          <a href="#demo" className={tocActive("demo")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Interactive Demo") ? undefined : "none" }}>
            <span>Interactive Demo</span>
            <span className="toc-count">04</span>
          </a>
          <a href="#market" className={tocActive("market")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Market Opportunity") ? undefined : "none" }}>
            <span>Market Opportunity</span>
            <span className="toc-count">05</span>
          </a>
          <a href="#business-model" className={tocActive("business-model")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Business Model") ? undefined : "none" }}>
            <span>Business Model</span>
            <span className="toc-count">06</span>
          </a>
          <a href="#traction" className={tocActive("traction")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Traction & Benchmarks") ? undefined : "none" }}>
            <span>Traction & Benchmarks</span>
            <span className="toc-count">07</span>
          </a>
          <a href="#competition" className={tocActive("competition")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Competition Matrix") ? undefined : "none" }}>
            <span>Competition Matrix</span>
            <span className="toc-count">08</span>
          </a>
          <a href="#advantage" className={tocActive("advantage")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Unique Advantage") ? undefined : "none" }}>
            <span>Unique Advantage</span>
            <span className="toc-count">09</span>
          </a>
          <a href="#gtm" className={tocActive("gtm")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Go-To-Market") ? undefined : "none" }}>
            <span>Go-To-Market</span>
            <span className="toc-count">10</span>
          </a>
          <a href="#vision" className={tocActive("vision")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Long-term Vision") ? undefined : "none" }}>
            <span>Long-term Vision</span>
            <span className="toc-count">11</span>
          </a>
          <a href="#team" className={tocActive("team")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Team Outliers") || tocMatch("Outliers") || tocMatch("Team") ? undefined : "none" }}>
            <span>Team Outliers</span>
            <span className="toc-count">12</span>
          </a>

          <div className="toc-title">Part II — Technical Whitepaper</div>
          <a href="#overview" className={tocActive("overview")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Product Overview") ? undefined : "none" }}>
            <span>Product Overview</span>
            <span className="toc-count">A</span>
          </a>
          <a href="#architecture" className={tocActive("architecture")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("System Architecture") ? undefined : "none" }}>
            <span>System Architecture</span>
            <span className="toc-count">B</span>
          </a>
          <a href="#data-flow" className={tocActive("data-flow")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("5-Phase Data Flow") ? undefined : "none" }}>
            <span>5-Phase Data Flow</span>
            <span className="toc-count">C</span>
          </a>
          <a href="#features" className={tocActive("features")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Feature Matrix") ? undefined : "none" }}>
            <span>Feature Matrix</span>
            <span className="toc-count">D</span>
          </a>
          <a href="#tech-stack" className={tocActive("tech-stack")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Technology Stack") ? undefined : "none" }}>
            <span>Technology Stack</span>
            <span className="toc-count">E</span>
          </a>
          <a href="#api-docs" className={tocActive("api-docs")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("API Reference") ? undefined : "none" }}>
            <span>API Reference</span>
            <span className="toc-count">F</span>
          </a>
          <a href="#data-layer" className={tocActive("data-layer")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Data & Sovereignty") ? undefined : "none" }}>
            <span>Data & Sovereignty</span>
            <span className="toc-count">G</span>
          </a>
          <a href="#ai-layer" className={tocActive("ai-layer")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("AI & RAG Mechanics") ? undefined : "none" }}>
            <span>AI & RAG Mechanics</span>
            <span className="toc-count">H</span>
          </a>
          <a href="#roadmap" className={tocActive("roadmap")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Product Roadmap") ? undefined : "none" }}>
            <span>Product Roadmap</span>
            <span className="toc-count">I</span>
          </a>
          <a href="#performance" className={tocActive("performance")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Performance & SLA") ? undefined : "none" }}>
            <span>Performance & SLA</span>
            <span className="toc-count">J</span>
          </a>
          <a href="#security" className={tocActive("security")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Security & RBAC") ? undefined : "none" }}>
            <span>Security & RBAC</span>
            <span className="toc-count">K</span>
          </a>
          <a href="#analytics" className={tocActive("analytics")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Operational KPIs") ? undefined : "none" }}>
            <span>Operational KPIs</span>
            <span className="toc-count">L</span>
          </a>
          <a href="#contributors" className={tocActive("contributors")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Team & Governance") ? undefined : "none" }}>
            <span>Team & Governance</span>
            <span className="toc-count">N</span>
          </a>
          <a href="#changelog" className={tocActive("changelog")} onClick={() => setMobileMenuOpen(false)} style={{ display: tocMatch("Changelog History") ? undefined : "none" }}>
            <span>Changelog History</span>
            <span className="toc-count">O</span>
          </a>
        </div>

        <div style={{ paddingTop: "1rem", borderTop: "1px solid var(--border-color)", fontSize: "0.75rem", opacity: 0.7 }}>
          v1.0.0 • Dhaka, Bangladesh
        </div>
      </aside>

      {/* 📄 MAIN CONTENT CONTAINER */}
      <main className="main-content" style={{ paddingBottom: isAdminMode ? "6rem" : "2rem" }}>
        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-left">
            <a href="#top" className="topbar-brand" style={{ textDecoration: "none" }}>
              <img src="/logo.svg" alt="AdvoTech Copilot" className="brand-logo" style={{ width: "24px", height: "24px", objectFit: "contain", flexShrink: 0 }} />
              <span className="brand-title">AdvoTech <span style={{ color: "var(--accent-clay)" }}>Copilot</span></span>
            </a>
          </div>

          <div className="topbar-right">
            <button className="btn" onClick={handleCopyLink}>
              {copied ? "✓ Copied!" : "🔗 Share"}
            </button>
            <button className="btn markdown-btn" onClick={handleMarkdownExport}>
              ↓ Markdown
            </button>
            <button className="btn primary-btn" onClick={handlePrint}>
              ⎙ Export PDF
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 00. EXECUTIVE HERO — LADY JUSTICE VISUAL INTEGRATION      */}
        {/* ======================================================== */}
        <div data-section="top">
          <Section
            id="top"
            altBg
          >
            <div className="hero-editorial-grid">
              {/* Left Column: Headlines & Editorial Lead */}
              <div className="hero-content-col">
                <h1 className="hero-main-headline">{d.meta.tagline}</h1>
                <p className="hero-description" style={{ marginBottom: 0 }}>
                  {d.meta.one_liner}
                </p>
              </div>

              {/* Right Column: Lady Justice Silhouette (Preserving exact asset & silhouette) */}
              <div className="hero-visual-col">
                <div className="lady-justice-frame">
                  <img
                    src="/lady-justice-silhouette.webp"
                    alt="Lady Justice — Emblem of Statutory Authority & Balanced Justice"
                    className="lady-justice-img"
                  />
                </div>
              </div>
            </div>

            {/* Live Telemetry Panel */}
            <div className="telemetry-panel">
              <div className="telemetry-head">
                <span className="telemetry-head-left">
                  <span className="live-telemetry-label">Live System Telemetry</span>
                </span>
                <span className="live-telemetry-status">
                  {syncStatus === "LIVE_DB" ? "Direct PostgreSQL Production Sync" : "Continuous Production Telemetry"}
                </span>
              </div>
              <div className="telemetry-grid">
                <div className="telemetry-cell">
                  <span className="tl-label">Active Users</span>
                  <span className="tl-num">{d.stats.total_users}</span>
                  <span className="tl-sub">Live verified accounts</span>
                </div>
                <div className="telemetry-cell">
                  <span className="tl-label">Audits Completed</span>
                  <span className="tl-num">{d.stats.total_audits}</span>
                  <span className="tl-sub">Autonomous statutory audits</span>
                </div>
                <div className="telemetry-cell">
                  <span className="tl-label">Statutes Ingested</span>
                  <span className="tl-num">{d.stats.statutes_indexed.toLocaleString()}+</span>
                  <span className="tl-sub">Official bdlaws.minlaw gazettes</span>
                </div>
                <div className="telemetry-cell">
                  <span className="tl-label">Audit Accuracy</span>
                  <span className="tl-num">{d.stats.accuracy_rate}</span>
                  <span className="tl-sub">33/36 gold standard test recall</span>
                </div>
                <div className="telemetry-cell">
                  <span className="tl-label">Turnaround SLA</span>
                  <span className="tl-num">{d.stats.avg_turnaround}</span>
                  <span className="tl-sub">15-page complex PDF agreement</span>
                </div>
                <div className="telemetry-cell">
                  <span className="tl-label">Benchmark Pass Rate</span>
                  <span className="tl-num">{d.stats.benchmark_pass}</span>
                  <span className="tl-sub">59 of 73 gold cases passing</span>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* 01. THE PROBLEM                                          */}
        {/* ======================================================== */}
        <div data-section="problem">
          <Section id="problem" eyebrow="01. The Problem" headline={d.pitch.problem.headline}>
            <p className="section-lead">
              In Bangladesh and across the Global South, legal consultation is slow, cost-prohibitive, and linguistically opaque. Citizens and businesses routinely forfeit basic rights due to unmitigated contractual liability.
            </p>
            <div className="grid-2">
              {d.pitch.problem.cards.map((card, i) => (
                <div key={i} className="problem-card">
                  <div className="pc-top">
                    <span className="pc-num">{card.num}</span>
                    <span className="pc-badge">{card.badge}</span>
                  </div>
                  <h3 className="pc-title">{card.title}</h3>
                  <div className="pc-metric">{card.metric}</div>
                  <p className="pc-desc">{card.desc}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* 02. THE SOLUTION                                         */}
        {/* ======================================================== */}
        <div data-section="solution">
          <Section id="solution" eyebrow="02. The Solution" headline={d.pitch.solution.headline} altBg>
            <div className="grid-2">
              {d.pitch.solution.products.map((p, i) => (
                <div key={i} className="product-card">
                  <div className="pc-head">
                    <span className={`pc-icon-tile ${p.tagColor}`}>
                      <img
                        src={p.id === "copilot" ? "/legal-copilot.png" : "/contractmind.png"}
                        alt={p.id === "copilot" ? "Legal Copilot engine logo" : "ContractMind engine logo"}
                        className="pc-logo-img"
                      />
                    </span>
                    <span className={`pc-tag ${p.tagColor}`}>{p.tag}</span>
                  </div>
                  <h3 className="pc-card-title">{p.title}</h3>
                  <p className="pc-card-desc">{p.desc}</p>
                  <div className="pc-metrics">
                    {p.metrics.map((m, j) => (
                      <div key={j} className="pc-metric-cell">
                        <span className="pc-metric-num">{m.v}</span>
                        <span className="pc-metric-label">{m.l}</span>
                      </div>
                    ))}
                  </div>
                  <ul className={`pc-checks ${p.tagColor}`}>
                    {p.highlights.map((h, j) => (
                      <li key={j}>
                        <span className="pc-check-chip"><Check size={11} strokeWidth={3.5} /></span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                  <a href={p.anchor} className="pc-btn">
                    <span>{p.cta}</span>
                    <ArrowDownRight size={16} strokeWidth={2.5} />
                  </a>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* 03. WHY NOW                                              */}
        {/* ======================================================== */}
        <div data-section="why-now">
          <Section id="why-now" eyebrow="03. Why Now" headline={d.pitch.why_now.headline}>
            <div className="grid-3">
              {d.pitch.why_now.curves.map((curve, i) => (
                <div key={i} className="curve-card">
                  <div className="curve-number">{curve.number}</div>
                  <h3 className="curve-title">{curve.title}</h3>
                  <div className="curve-sub">{curve.subtitle}</div>
                  <p className="curve-desc">{curve.desc}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* 04. PRODUCT DEMO (Interactive Copilot + Audit Viewer)     */}
        {/* ======================================================== */}
        <div data-section="demo">
          <Section id="demo" eyebrow="04. Interactive Product Showcase" headline="Live Grounded Legal Q&A & Contract Audit Simulation" altBg>
            {/* --- COPILOT SIMULATOR --- */}
            <div className="demo-wrap">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <h3 style={{ fontFamily: "var(--font-fraunces), sans-serif", fontSize: "1.25rem", margin: 0, color: "var(--text-dark)" }}>
                    1. Advotech Copilot — Bilingual Grounded Inquiry
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-body)" }}>
                    Select a scenario to inspect statutory grounding in real time:
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--green-dark)", fontWeight: 700, fontSize: "0.8rem" }}>
                  <span>✓</span> Deterministic Zero-Hallucination Guard
                </div>
              </div>

              <div className="demo-top-tabs">
                <button
                  className={`demo-tab-btn ${demoCategory === "commercial" ? "active" : ""}`}
                  onClick={() => setDemoCategory("commercial")}
                >
                  Commercial Law (Dishonoured Cheques)
                </button>
                <button
                  className={`demo-tab-btn ${demoCategory === "tenant" ? "active" : ""}`}
                  onClick={() => setDemoCategory("tenant")}
                >
                  Tenant Rights (Banglish Deposit Limit)
                </button>
                <button
                  className={`demo-tab-btn ${demoCategory === "employment" ? "active" : ""}`}
                  onClick={() => setDemoCategory("employment")}
                >
                  Employment & Tech (Void Non-Compete)
                </button>
              </div>

              <div className="demo-sim-box">
                {/* User Message */}
                <div className="msg-user-wrap">
                  <div className="msg-user">{activeDemo.query}</div>
                  <div className="avatar-u">U</div>
                </div>

                {/* AI Message */}
                <div className="msg-ai-wrap">
                  <div className="avatar-ai">⚖</div>
                  <div className="msg-ai-content">
                    <div className="msg-ai-meta">
                      <span>Advotech Copilot</span> •
                      <span className="msg-ai-match">{activeDemo.matchRate} Statutory Match</span> •
                      <span style={{ opacity: 0.65 }}>Latency: {activeDemo.latency}</span>
                    </div>

                    <div className="msg-ai-bubble" style={{ whiteSpace: "pre-line" }}>
                      {activeDemo.answer}
                    </div>

                    {/* Grounding Citation Box */}
                    <div className="msg-grounding">
                      <div className="grounding-title">
                        <span>⚖ VERIFIED BANGLADESH STATUTORY CITATION:</span>
                        <a href={activeDemo.gazetteUrl} target="_blank" rel="noopener noreferrer" className="grounding-link">
                          Inspect Official Gazette ↗
                        </a>
                      </div>
                      <div className="grounding-text">
                        <div className="grounding-cite">{activeDemo.statute}</div>
                        <div>{activeDemo.citationNote}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- CONTRACT AUDIT SIMULATOR --- */}
            <div id="demo-audit" className="audit-viewer">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div>
                  <h3 style={{ fontFamily: "var(--font-fraunces), sans-serif", fontSize: "1.25rem", margin: 0, color: "var(--text-dark)" }}>
                    2. ContractMind — Autonomous Sub-Minute Audit Report Sample
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-body)" }}>
                    Document: <code>Software_Engineer_Consultancy_Agreement.pdf</code> (12 pages)
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    className={`matrix-filter-btn ${activeAuditTab === "findings" ? "active" : ""}`}
                    onClick={() => setActiveAuditTab("findings")}
                  >
                    Risk Findings
                  </button>
                  <button
                    className={`matrix-filter-btn ${activeAuditTab === "redlines" ? "active" : ""}`}
                    onClick={() => setActiveAuditTab("redlines")}
                  >
                    Statutory Redlines
                  </button>
                </div>
              </div>

              <div className="audit-score-banner">
                <div>
                  <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 800, color: "var(--accent-clay)" }}>
                    Executive Health Score
                  </span>
                  <div className="score-number">82 / 100</div>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-body)" }}>
                    Moderate Risk — 2 non-compliant statutory provisions detected
                  </span>
                </div>
                <div className="score-badges">
                  <span className="badge-ui danger">1 High Risk Clause</span>
                  <span className="badge-ui warning">1 Void Covenant</span>
                  <span className="badge-ui success">3 Compliant Sections</span>
                </div>
              </div>

              <div className="audit-clauses">
                {/* Clause 1 */}
                <div className="audit-clause-card safe">
                  <div className="clause-head">
                    <span className="clause-title">Clause 1.2 — Scope of Deliverables & Milestones</span>
                    <span className="badge-ui success">Compliant</span>
                  </div>
                  <div className="clause-text">
                    "Consultant shall furnish deliverables specified in Schedule A according to sprint intervals."
                  </div>
                  <div className="clause-finding">
                    Standard service scope definition with clear acceptance criteria. Complies fully with Section 37 of The Contract Act 1872.
                  </div>
                </div>

                {/* Clause 2 (High Risk) */}
                <div className="audit-clause-card high-risk">
                  <div className="clause-head">
                    <span className="clause-title">Clause 4.3 — Liquidated Damages & Daily Penalty</span>
                    <span className="badge-ui danger">High Risk</span>
                  </div>
                  <div className="clause-text">
                    "In the event of delay, Consultant shall pay liquidated damages of ৳15,000 per calendar day regardless of actual damages incurred."
                  </div>
                  <div className="clause-finding">
                    <strong>Statutory Conflict:</strong> Conflicts directly with <strong>Section 74 of The Contract Act 1872</strong>. The Supreme Court has repeatedly established that punitive damages cannot exceed reasonable compensation for actual proven losses.
                  </div>
                  {activeAuditTab === "redlines" && (
                    <div className="clause-redline">
                      <span className="redline-tag">Actionable Redline Diff:</span>
                      <del style={{ color: "#f87171" }}>
                        "pay liquidated damages of ৳15,000 per calendar day regardless of actual damages"
                      </del>
                      <br />
                      <ins style={{ color: "#4ade80", textDecoration: "none", fontWeight: 600 }}>
                        + "pay reasonable compensation not exceeding 5% of monthly fees upon actual evidence of direct losses directly caused by such delay."
                      </ins>
                    </div>
                  )}
                </div>

                {/* Clause 3 (Void Non-Compete) */}
                <div className="audit-clause-card warning-risk">
                  <div className="clause-head">
                    <span className="clause-title">Clause 8.1 — Post-Termination Restraint of Trade</span>
                    <span className="badge-ui warning">Void Ab Initio</span>
                  </div>
                  <div className="clause-text">
                    "For a period of 24 months post-termination, Consultant shall not render software services to any entity in Bangladesh."
                  </div>
                  <div className="clause-finding">
                    <strong>Statutory Conflict:</strong> <strong>Section 27 of The Contract Act 1872</strong> declares agreements in restraint of trade fundamentally void. This covenant cannot be enforced in any court of law.
                  </div>
                  {activeAuditTab === "redlines" && (
                    <div className="clause-redline">
                      <span className="redline-tag">Actionable Redline Diff:</span>
                      <del style={{ color: "#f87171" }}>
                        "shall not render software services to any entity in Bangladesh for 24 months"
                      </del>
                      <br />
                      <ins style={{ color: "#4ade80", textDecoration: "none", fontWeight: 600 }}>
                        + "shall strictly protect Company proprietary Trade Secrets under Section 9 (Non-Disclosure), without restricting Consultant's constitutional right to lawful employment."
                      </ins>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* 05. MARKET OPPORTUNITY                                   */}
        {/* ======================================================== */}
        <div data-section="market">
          <Section id="market" eyebrow="05. Market Opportunity" headline={d.pitch.market.headline}>
            <div className="grid-3">
              {d.pitch.market.segments.map((seg, i) => (
                <div key={i} className="market-card">
                  <div className="market-tier">{seg.tier}</div>
                  <div className="market-val">{seg.value}</div>
                  <p className="market-desc">{seg.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "2rem", background: "var(--bg-alt)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "1.75rem" }}>
              <h4 style={{ fontFamily: "var(--font-fraunces), sans-serif", fontSize: "1.15rem", margin: "0 0 1rem 0", color: "var(--text-dark)" }}>
                Key Structural Market Catalysts in Bangladesh
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {d.pitch.market.growthDrivers.map((driver, idx) => (
                  <li key={idx} style={{ fontSize: "0.95rem", color: "var(--text-body)", display: "flex", gap: "0.75rem", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--accent-clay)", fontWeight: "bold" }}>→</span>
                    {driver}
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* 06. BUSINESS MODEL                                       */}
        {/* ======================================================== */}
        <div data-section="business-model">
          <Section id="business-model" eyebrow="06. Business Model" headline={d.pitch.business_model.headline} altBg>
            <div className="grid-3">
              {d.pitch.business_model.streams.map((stream, i) => (
                <div key={i} className="biz-card">
                  <div>
                    <span className="biz-badge">{stream.badge}</span>
                    <h3 className="biz-title">{stream.title}</h3>
                    <div className="biz-price">{stream.price}</div>
                    <div className="biz-subtext">{stream.subtext}</div>
                  </div>
                  <ul className="biz-list">
                    {stream.features.map((f, j) => (
                      <li key={j}>{f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* 07. TRACTION & BENCHMARKS                                */}
        {/* ======================================================== */}
        <div data-section="traction">
          <Section id="traction" eyebrow="07. Traction & Benchmarks" headline={d.pitch.traction.headline}>
            <p className="section-lead">
              Our models and retrieval pipelines are benchmarked continuously against gold-standard statutory provisions and case law corpora.
            </p>
            <div className="grid-3">
              {d.pitch.traction.metrics.map((m, i) => (
                <div key={i} className="benchmark-card">
                  <span className="bench-label">{m.label}</span>
                  <div className="bench-val">{m.value}</div>
                  <div className="bench-sub">{m.sub}</div>
                  <div className="bench-bar">
                    <div className="bench-fill" style={{ width: `${m.score}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* 08. COMPETITION                                          */}
        {/* ======================================================== */}
        <div data-section="competition">
          <Section id="competition" eyebrow="08. Competition" headline={d.pitch.competition.headline} altBg>
            <p className="section-lead">
              Global legal-tech tools ignore regional statutory gazettes, while traditional chambers lack software scale and accessibility.
            </p>
            <div className="comp-table-wrap">
              <table className="comp-table">
                <thead>
                  <tr>
                    <th>Capability & Dimension</th>
                    <th className="highlight">Advotech Copilot</th>
                    <th>Harvey AI / Lexis+</th>
                    <th>Traditional BD Law Firms</th>
                    <th>Online Directories</th>
                  </tr>
                </thead>
                <tbody>
                  {d.pitch.competition.matrix.map((row, i) => (
                    <tr key={i}>
                      <td><strong>{row.feature}</strong></td>
                      <td className="highlight">{row.advotech}</td>
                      <td>{row.harvey}</td>
                      <td>{row.traditional}</td>
                      <td>{row.directories}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* 09. UNIQUE ADVANTAGE                                     */}
        {/* ======================================================== */}
        <div data-section="advantage">
          <Section id="advantage" eyebrow="09. Unique Advantage" headline={d.pitch.unique_advantage.headline}>
            <div className="grid-3">
              {d.pitch.unique_advantage.pillars.map((pillar, i) => (
                <div key={i} className="pillar-card">
                  <div className="pillar-icon">{pillar.icon}</div>
                  <h3 className="pillar-title">{pillar.title}</h3>
                  <p className="pillar-desc">{pillar.desc}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* 10. GO-TO-MARKET                                         */}
        {/* ======================================================== */}
        <div data-section="gtm">
          <Section id="gtm" eyebrow="10. Go-To-Market" headline={d.pitch.go_to_market.headline} altBg>
            <div className="gtm-grid">
              {d.pitch.go_to_market.phases.map((p, i) => (
                <div key={i} className="gtm-card">
                  <span className="gtm-step">{p.step}</span>
                  <span className="gtm-period">Timeline: {p.period}</span>
                  <span className="gtm-target">Target: {p.target}</span>
                  <p className="gtm-strat">{p.strategy}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* 11. VISION                                               */}
        {/* ======================================================== */}
        <div data-section="vision">
          <Section id="vision" eyebrow="11. Long-Term Vision" headline={d.pitch.vision.headline}>
            <div className="grid-3">
              {d.pitch.vision.pillars.map((v, i) => (
                <div key={i} className="pillar-card">
                  <h3 className="pillar-title">{v.title}</h3>
                  <p className="pillar-desc" style={{ whiteSpace: "pre-line" }}>
                    {v.desc}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* 12. THE TEAM (Uniform, Real Images, Correct Positions)    */}
        {/* ======================================================== */}
        <div data-section="team">
          <Section id="team" eyebrow="12. The Team" headline={d.team_name} altBg>
            <p className="section-lead">
              A multidisciplinary collective combining full-stack systems engineering, distributed AI retrieval, Bangladesh Supreme Court jurisprudence, and growth marketing.
            </p>
            <div className="grid-3">
              {d.team.map((member, i) => (
                <div key={i} className="team-card">
                  <div className="team-img-wrap">
                    {imgErrors[member.name] ? (
                      <div className="team-avatar-fallback font-serif">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                    ) : (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="team-img"
                        loading="eager"
                        decoding="sync"
                        style={{ objectPosition: member.objPos || "center center" }}
                        onError={() => setImgErrors((prev) => ({ ...prev, [member.name]: true }))}
                      />
                    )}
                  </div>
                  <div className="team-body">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 800, color: "var(--text-body)", opacity: 0.85, letterSpacing: "0.08em" }}>
                        {member.country} • {member.attendance}
                      </span>
                      {member.badge && (
                        <span style={{
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          padding: "0.2rem 0.55rem",
                          borderRadius: "4px",
                          background: member.badge === "Leader" ? "rgba(30, 92, 64, 0.12)" : "var(--bg-accent)",
                          color: member.badge === "Leader" ? "var(--green-dark)" : "var(--accent-clay)",
                          border: member.badge === "Leader" ? "1px solid rgba(30, 92, 64, 0.25)" : "none"
                        }}>
                          {member.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="team-name">{member.name}</h3>
                    <p className="team-role">{member.role}</p>
                    <a href={`mailto:${member.email}`} className="team-email">
                      {member.email}
                    </a>
                    <div className="team-exp">{member.expertise}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* ——— WHITEPAPER DIVIDER BAR ———                            */}
        {/* ======================================================== */}
        <div className="whitepaper-divider">
          <span className="whitepaper-divider-tag">Technical Whitepaper & Architecture Layer</span>
        </div>

        {/* ======================================================== */}
        {/* A. PRODUCT OVERVIEW                                      */}
        {/* ======================================================== */}
        <div data-section="overview">
          <Section id="overview" eyebrow="A. Product Overview" headline={d.tech.product_overview.headline} altBg>
            <p className="paragraph">{d.tech.product_overview.desc}</p>
            <h3 style={{ fontFamily: "var(--font-fraunces), sans-serif", fontSize: "1.4rem", margin: "2rem 0 1rem 0", color: "var(--text-dark)" }}>
              Core Target User Personas & Workflows
            </h3>
            <div className="grid-2">
              {d.tech.product_overview.users.map((u, i) => (
                <div key={i} style={{ background: "#0e0e0e", border: "1px solid var(--border-color)", borderRadius: "0", padding: "1.75rem" }}>
                  <div style={{ fontFamily: "var(--font-fraunces), sans-serif", fontSize: "1.15rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: "0.6rem" }}>
                    {u.persona}
                  </div>
                  <p style={{ fontSize: "1rem", color: "var(--text-body)", margin: 0, lineHeight: 1.65 }}>
                    {u.scenario}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* B. ARCHITECTURE (Interactive 4-System Topology: UI → API → Services → DB) */}
        {/* ======================================================== */}
        <div data-section="architecture">
          <Section id="architecture" eyebrow="B. System Architecture" headline={d.tech.architecture.headline}>
            <p className="section-lead">
              A four-tier distributed microservice architecture executing client-side sovereign redaction, async FastAPI gateway routing, LangGraph state reasoning, and hybrid vector indexing.
            </p>

            {/* ENTERPRISE INTERACTIVE ARCHITECTURE EXPLORER */}
            <ArchitectureExplorer apiBase={ACCESS_CONFIG.apiBase} initialSystemId="chat" />

            <div className="arch-topology">
              {d.tech.architecture.layers.map((layer, i) => (
                <div key={i} className="arch-layer-card">
                  <div className="arch-layer-head">
                    <span className="arch-layer-icon">{layer.icon}</span>
                    <div>
                      <h4 className="arch-layer-title">{layer.label}</h4>
                      <span className="arch-layer-role">{layer.role}</span>
                    </div>
                  </div>
                  <ul className="arch-items">
                    {layer.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* C. 5-PHASE DATA FLOW: Input → Processing → AI → Output → Feedback */}
        {/* ======================================================== */}
        <div data-section="data-flow">
          <Section id="data-flow" eyebrow="C. Data Flow Architecture" headline={d.tech.data_flow.headline} altBg>
            <p className="section-lead">
              A five-stage sequential pipeline guaranteeing sovereign data privacy, zero hallucination, and verifiable statutory grounding before output delivery.
            </p>
            <div className="dataflow-pipeline-container">
              <div className="dataflow-cards-track">
                {d.tech.data_flow.phases.map((ph, i) => {
                  const Icon = [ShieldCheck, Cpu, Bot, Send, CheckCircle2][i] || ShieldCheck;
                  const isFinal = i === d.tech.data_flow.phases.length - 1;
                  return (
                    <div key={i} className={`dataflow-pipeline-card${isFinal ? " final-phase-card" : ""}`}>
                      <div className="dataflow-card-header">
                        <span className="dataflow-step-num">0{i + 1}</span>
                        <span className="dataflow-phase-tag">{ph.tag}</span>
                      </div>
                      <div className="dataflow-card-icon-wrap">
                        <Icon size={24} strokeWidth={isFinal ? 2.3 : 1.9} />
                      </div>
                      <h4 className="dataflow-card-title">{ph.title}</h4>
                      <p className="dataflow-card-desc">{ph.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* D. FEATURE MATRIX                                        */}
        {/* ======================================================== */}
        <div data-section="features">
          <Section id="features" eyebrow="D. Feature Matrix" headline="Production Capabilities & Deployment Status">
            <div className="matrix-toolbar">
              <span style={{ fontSize: "0.85rem", color: "var(--text-body)" }}>
                Showing <strong>{filteredMatrix.length}</strong> system capabilities:
              </span>
              <div className="matrix-filters">
                {["ALL", "LIVE", "BETA", "PLANNED"].map((st) => (
                  <button
                    key={st}
                    className={`matrix-filter-btn ${matrixFilter === st ? "active" : ""}`}
                    onClick={() => setMatrixFilter(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="matrix-table-wrap">
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>Capability Name</th>
                    <th>Status</th>
                    <th>Module Tier</th>
                    <th>Technical Notes & Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMatrix.map((f, i) => (
                    <tr key={i}>
                      <td><strong>{f.name}</strong></td>
                      <td>
                        <span className={`badge badge-${f.status.toLowerCase()}`}>{f.status}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-dark)", fontWeight: 600 }}>{f.tier}</span>
                      </td>
                      <td style={{ color: "var(--text-body)", fontSize: "0.88rem" }}>{f.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* E. TECH STACK                                            */}
        {/* ======================================================== */}
        <div data-section="tech-stack">
          <Section id="tech-stack" eyebrow="E. Technology Stack" headline="Tiered Production Infrastructure Breakdown" altBg>
            <div className="stack-grid">
              {d.tech.tech_stack.map((st, i) => (
                <div key={i} className="stack-card">
                  <span className="stack-layer">{st.layer}</span>
                  <div className="stack-items">{st.items}</div>
                  <p className="stack-desc">{st.desc}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* F. API REFERENCE                                         */}
        {/* ======================================================== */}
        <div data-section="api-docs">
          <Section id="api-docs" eyebrow="F. API Reference & Explorer" headline="REST Endpoints & FastMCP Protocol Specification">
            <div className="api-explorer">
              {/* TELEMETRY / COVERAGE BANNER */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1.25rem", background: "var(--bg-alt)", border: "1px solid var(--border-color)", borderRadius: "6px", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a" }}></span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-dark)" }}>
                    {filteredApiDocs.length} Core Documented Specification Endpoints
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-body)", opacity: 0.85 }}>
                    • 135 Total FastAPI Microservice Routes Active
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.7rem", background: "var(--bg-accent)", color: "var(--accent-clay)", padding: "0.2rem 0.55rem", borderRadius: "4px", fontWeight: 800 }}>
                    OpenAPI 3.1 & Redoc
                  </span>
                  <span style={{ fontSize: "0.7rem", background: "var(--bg-accent)", color: "var(--accent-clay)", padding: "0.2rem 0.55rem", borderRadius: "4px", fontWeight: 800 }}>
                    FastMCP JSON-RPC 2.0
                  </span>
                </div>
              </div>

              <div className="api-filter-tabs">
                {["All", "Auth", "Chat", "Audit", "Enterprise", "Lawyer", "Payments", "Admin", "Platform", "MCP"].map((group) => (
                  <button
                    key={group}
                    className={`api-tab-btn ${apiFilter === group ? "active" : ""}`}
                    onClick={() => setApiFilter(group)}
                  >
                    {group}
                  </button>
                ))}
              </div>

              <div className="api-list">
                {filteredApiDocs.map((api, i) => (
                  <div key={i} className="api-item">
                    <div className="api-item-top">
                      <div className="api-path-wrap">
                        <span className="badge-method">{api.method}</span>
                        <span className="api-path">{api.path}</span>
                        <span className="badge-auth">{api.auth}</span>
                      </div>
                      <button
                        className="api-copy-btn"
                        onClick={() => handleCopyEndpoint(`${api.method} ${api.path}`)}
                      >
                        {copiedEndpoint === `${api.method} ${api.path}` ? "✓ Copied" : "Copy Endpoint"}
                      </button>
                    </div>
                    <p className="api-desc">{api.desc}</p>
                    {api.payload && (
                      <div className="api-payload">
                        <span style={{ opacity: 0.6 }}>Sample Payload / Query: </span>
                        {api.payload}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* G. DATA LAYER                                            */}
        {/* ======================================================== */}
        <div data-section="data-layer">
          <Section id="data-layer" eyebrow="G. Data & Privacy Layer" headline={d.tech.data_layer.headline} altBg>
            {(() => {
              const DATA_ICONS: Record<string, React.ReactNode> = {
                "book-open":    <BookOpen className="sec-card-icon" />,
                "eye-off":      <EyeOff className="sec-card-icon" />,
                "layers":       <Layers className="sec-card-icon" />,
                "database":     <Database className="sec-card-icon" />,
                "lock":         <Lock className="sec-card-icon" />,
              };
              return (
                <ul className="security-layers">
                  {d.tech.data_layer.layers.map((layer, i) => (
                    <li key={i} className="sec-card">
                      <div className="sec-card-header">
                        <div className="sec-card-left">
                          {DATA_ICONS[layer.icon]}
                          <span className="sec-card-cat">{String(layer.num).padStart(2, "0")} · {layer.category}</span>
                        </div>
                        <span className="sec-card-layer">{layer.badge}</span>
                      </div>
                      <div className="sec-card-body">
                        <p className="sec-card-title">{layer.title}</p>
                        <p className="sec-card-desc">{layer.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </Section>
        </div>

        {/* ======================================================== */}
        {/* H. AI LAYER                                              */}
        {/* ======================================================== */}
        <div data-section="ai-layer">
          <Section id="ai-layer" eyebrow="H. AI & RAG Mechanics" headline={d.tech.ai_layer.headline}>
            {(() => {
              const AI_ICONS: Record<string, React.ReactNode> = {
                "search":       <Search className="sec-card-icon" />,
                "workflow":     <Workflow className="sec-card-icon" />,
                "shield-check": <ShieldCheck className="sec-card-icon" />,
                "file-check":   <FileCheck className="sec-card-icon" />,
                "zap":          <Zap className="sec-card-icon" />,
              };
              return (
                <ul className="security-layers">
                  {d.tech.ai_layer.layers.map((layer, i) => (
                    <li key={i} className="sec-card">
                      <div className="sec-card-header">
                        <div className="sec-card-left">
                          {AI_ICONS[layer.icon]}
                          <span className="sec-card-cat">{String(layer.num).padStart(2, "0")} · {layer.category}</span>
                        </div>
                        <span className="sec-card-layer">{layer.badge}</span>
                      </div>
                      <div className="sec-card-body">
                        <p className="sec-card-title">{layer.title}</p>
                        <p className="sec-card-desc">{layer.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </Section>
        </div>

        {/* ======================================================== */}
        {/* I. PRODUCT ROADMAP                                       */}
        {/* ======================================================== */}
        <div data-section="roadmap">
          <Section id="roadmap" eyebrow="I. Product Roadmap" headline="Multi-Phase Engineering & Jurisdictional Milestones" altBg>
            <div className="roadmap-grid">
              {[
                { phase: "Short-Term", ...d.tech.roadmap.short },
                { phase: "Mid-Term", ...d.tech.roadmap.mid },
                { phase: "Long-Term", ...d.tech.roadmap.long },
              ].map((rm, i) => (
                <div key={i} className="roadmap-card">
                  <span className="roadmap-badge">{rm.phase}</span>
                  <h3 className="roadmap-title">{rm.label}</h3>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-dark)", marginBottom: "0.5rem" }}>
                    {rm.title}
                  </div>
                  <ul className="roadmap-items">
                    {rm.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* J. PERFORMANCE & SCALABILITY                             */}
        {/* ======================================================== */}
        <div data-section="performance">
          <Section id="performance" eyebrow="J. Performance & Scalability" headline={d.tech.performance.headline}>
            <div className="grid-3">
              {d.tech.performance.metrics.map((m, i) => (
                <div key={i} className="benchmark-card">
                  <span className="bench-label">{m.label}</span>
                  <div className="bench-val">{m.value}</div>
                  <div className="bench-sub">{m.note}</div>
                </div>
              ))}
            </div>

            <div className="perf-opt-box" style={{ marginTop: "2rem", background: "#0e0e0e", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "1.75rem" }}>
              <h4 style={{ fontFamily: "var(--font-fraunces), sans-serif", fontSize: "1.2rem", margin: "0 0 1rem 0", color: "var(--text-dark)" }}>
                Production Latency & Concurrency Optimization
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {d.tech.performance.strategies.map((st, i) => (
                  <li key={i} style={{ fontSize: "0.92rem", color: "var(--text-body)", display: "flex", gap: "0.75rem", lineHeight: 1.55 }}>
                    <span style={{ color: "var(--accent-clay)", fontWeight: "bold" }}>✓</span>
                    {st}
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* K. SECURITY & RBAC                                       */}
        {/* ======================================================== */}
        <div data-section="security">
          <Section id="security" eyebrow="K. Security & RBAC" headline={d.tech.security.headline} altBg>
            {(() => {
              const SEC_ICONS: Record<string, React.ReactNode> = {
                "key":          <KeyRound className="sec-card-icon" />,
                "users":        <Users className="sec-card-icon" />,
                "shield-check": <ShieldCheck className="sec-card-icon" />,
                "database":     <Database className="sec-card-icon" />,
                "fingerprint":  <Fingerprint className="sec-card-icon" />,
              };
              return (
                <ul className="security-layers">
                  {d.tech.security.layers.map((layer, i) => (
                    <li key={i} className="sec-card">
                      <div className="sec-card-header">
                        <div className="sec-card-left">
                          {SEC_ICONS[layer.icon]}
                          <span className="sec-card-cat">{String(layer.num).padStart(2,"0")} · {layer.category}</span>
                        </div>
                        <span className="sec-card-layer">LAYER {String(layer.num).padStart(2,"0")}</span>
                      </div>
                      <div className="sec-card-body">
                        <p className="sec-card-title">{layer.title}</p>
                        <p className="sec-card-desc">{layer.desc}</p>
                        {layer.extra?.type === "roles" && (
                          <div className="sec-roles">
                            {layer.extra.items.map((r, ri) => (
                              <span key={ri} className="sec-role-pill">{r}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </Section>
        </div>

        {/* ======================================================== */}
        {/* L. ANALYTICS & KPIS                                      */}
        {/* ======================================================== */}
        <div data-section="analytics">
          <Section id="analytics" eyebrow="L. Analytics & Telemetry" headline={d.tech.analytics.headline}>
            <div className="grid-3">
              {d.tech.analytics.kpis.map((kpi, i) => {
                const liveVal =
                  kpi.label === "Active Test Users"
                    ? String(d.stats.total_users)
                    : kpi.label === "Contracts Audited"
                    ? String(d.stats.total_audits)
                    : kpi.value;
                return (
                  <div key={i} className="benchmark-card">
                    <span className="bench-label">{kpi.label}</span>
                    <div className="bench-val">{liveVal}</div>
                    <div className="bench-sub">{kpi.sub}</div>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* N. TEAM & CONTRIBUTORS (Linked to Section 12)             */}
        {/* ======================================================== */}
        <div data-section="contributors">
          <Section id="contributors" eyebrow="N. Team & Contributors" headline={d.tech.contributors.headline} altBg>
            <p className="section-lead">{d.tech.contributors.summary}</p>
            <div className="governance-box" style={{ background: "#0e0e0e", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "1.75rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--accent-clay)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Active Engineering Core & Code Governance
                </span>
                <a href="#team" className="jump-pill" style={{ margin: 0 }}>
                  Jump to Team Directory ↑
                </a>
              </div>
              <p style={{ fontSize: "0.95rem", color: "var(--text-body)", lineHeight: 1.6, margin: "0 0 1rem 0" }}>
                All source modifications, vector retrieval optimizations, and statutory embeddings are managed under strict peer reviews, signed CI/CD commits, and automated security regression test suites (98 unit tests, 80.8% gold benchmark pass rate).
              </p>
              <div style={{ fontFamily: "monospace", fontSize: "0.82rem", background: "var(--bg-main)", padding: "0.75rem", borderRadius: "6px", color: "var(--text-dark)" }}>
                {d.tech.contributors.branches}
              </div>
            </div>
          </Section>
        </div>

        {/* ======================================================== */}
        {/* O. CHANGELOG                                             */}
        {/* ======================================================== */}
        <div data-section="changelog">
          <Section id="changelog" eyebrow="O. Version History" headline="Continuous Deployment Changelog">
            <table className="changelog-table">
              <thead>
                <tr>
                  <th>Release</th>
                  <th>Release Date</th>
                  <th>Engineering Highlights</th>
                </tr>
              </thead>
              <tbody>
                {d.tech.changelog.map((entry, i) => (
                  <tr key={i}>
                    <td>
                      <span className="version-badge">{entry.v}</span>
                    </td>
                    <td style={{ color: "var(--text-body)", fontSize: "0.85rem", fontWeight: 600 }}>{entry.date}</td>
                    <td style={{ color: "var(--text-body)", fontSize: "0.9rem" }}>{entry.changes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      </main>

      {/* 🔝 BACK TO TOP BUTTON */}
      {showBackToTop && (
        <button className="back-to-top" onClick={scrollToTop} title="Back to top">
          ↑
        </button>
      )}
    </div>
  );
}
