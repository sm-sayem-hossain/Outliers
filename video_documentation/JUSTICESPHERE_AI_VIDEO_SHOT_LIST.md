# JusticeSphere AI — Production Video Screen Recording & Shot List

This document provides the definitive, scene-by-scene technical recording plan for capturing actual frontend interactions of the JusticeSphere AI platform. Every URL, component, interaction, and visual feedback described below directly corresponds to existing, functional source code in the `frontend` repository.

---

## Technical Recording Standards & Setup

- **Display Resolution:** 3840 x 2160 (4K UHD) or 1920 x 1080 (1080p Full HD) at 60 FPS
- **Browser Configuration:** Google Chrome or Brave; full screen (F11); bookmarks and navigation bars hidden; 100% zoom scaling
- **Theme Settings:** Dark Mode (`#1D1D1B`) as primary showcase theme with warm parchment accents; toggle Light Mode (`#E7E7DD`) briefly during contract redline viewing
- **Mouse Cursor:** System default high-visibility cursor with smooth movement smoothing enabled in recording software (OBS Studio / ScreenFlow / Camtasia)
- **Demo Accounts Pre-Loaded:**
  - General User: `demo.general@contractmind.ai` (Preloaded with credits & contract history)
  - Advocate: `advocate.tanvir@supremecourt.bd` (Preloaded with active queue and earnings)
  - Enterprise Admin: `legal.director@grameenphone.com` (Preloaded with playbooks & team seats)

---

## Complete Shot List by Video Scene

### Scene 1 – Powerful Opening (0:00 – 0:15)

#### Shot 1.1: Landing Page Hero & 3D Lady Justice Asset
- **Scene Number:** Scene 1 (0:00 – 0:08)
- **Frontend URL / Route:** `/` (`src/app/page.tsx`)
- **Visual Elements Visible:** Dynamic WebGL canvas background, 3D Lady Justice statue asset (`public/hero-statue.webm`), headline typography (*"Autonomous Legal Intelligence & Contract Compliance for Bangladesh"*), primary action buttons (*"Try ContractMind"*, *"Explore Copilot"*).
- **User Action:** Slow, continuous downward scroll over the hero section; mouse glides gracefully across the primary action buttons.
- **Expected Visible Result:** Smooth inertial scroll powered by `SmoothScrollProvider`; dynamic particle lighting shimmer around the statue graphic; hover effects on glassmorphic buttons.
- **Backend / AI Operation:** Static asset serving; client-side WebGL shader execution via OGL/Canvas.
- **Recording Duration:** 8 Seconds
- **Camera Movement / Zoom:** Slow digital push-in (scale 100% to 108%) focusing on the central branding headline.
- **Transition:** Smooth cut to Shot 1.2.

#### Shot 1.2: Live Impact Metrics & Animated Counters
- **Scene Number:** Scene 1 (0:08 – 0:15)
- **Frontend URL / Route:** `/` (Section `#stats` / Live Metrics)
- **Visual Elements Visible:** Three metric display cards: `99.4%` (Citation Grounding Accuracy), `5x` (Audit Speedup), `100%` (Client-Side Privacy).
- **User Action:** Viewport scrolls into view triggering the animation.
- **Expected Visible Result:** Numbers dynamically count up from zero using the `CountUp.tsx` component; glowing border outlines highlight as the counters settle.
- **Backend / AI Operation:** Client-side React component animation.
- **Recording Duration:** 7 Seconds
- **Camera Movement / Zoom:** Slow horizontal pan from left metric card to right metric card.
- **Transition:** Quick whip-pan with lens flare into Scene 2.

---

### Scene 2 – The Problem: Contract Vulnerability (0:15 – 0:40)

#### Shot 2.1: Multi-Persona Legal Pain Points
- **Scene Number:** Scene 2 (0:15 – 0:28)
- **Frontend URL / Route:** `/` (Interactive Persona Simulator Section)
- **Visual Elements Visible:** Tabbed selector for personas: `SMEs & Founders`, `HR & Corporate`, `Freelancers`, `Legal Advisors`. Dynamic scenario card displaying common contractual pitfalls.
- **User Action:** User clicks on the `Freelancers` tab, then switches to the `SMEs & Founders` tab.
- **Expected Visible Result:** The card content smoothly animates via Framer Motion, instantly displaying tailored risk scenarios (e.g., *"Unenforceable 2-year non-compete clauses under Contract Act § 27"*, *"Predatory 5% monthly penalty fees"*).
- **Backend / AI Operation:** React `PersonaContext` state change updating localized UI scenario strings.
- **Recording Duration:** 13 Seconds
- **Camera Movement / Zoom:** Static shot centered on the interactive card, followed by a subtle zoom into the highlighted predatory clause text.
- **Transition:** Cut to Shot 2.2.

#### Shot 2.2: Predatory Contract Sample Preview
- **Scene Number:** Scene 2 (0:28 – 0:40)
- **Frontend URL / Route:** `/contractmind` (Sample Contract Selection Drawer)
- **Visual Elements Visible:** ContractMind upload screen showing pre-loaded sample agreements: *"Freelance Software Development & IP Assignment Agreement"* and *"Vendor Services SLA"*.
- **User Action:** Hover over the sample contract card; click to view the un-audited agreement text.
- **Expected Visible Result:** Card highlights with an amber warning outline; raw clause text displays highlighting aggressive terms (e.g., unlimited indemnification, forfeiture of IP without payment).
- **Backend / AI Operation:** In-memory sample contract loading from `src/data/sampleContracts.ts`.
- **Recording Duration:** 12 Seconds
- **Camera Movement / Zoom:** Slow zoom into the unconscionable penalty clause text.
- **Transition:** Fast zoom-out and dissolve into Scene 3.

---

### Scene 3 – Introducing JusticeSphere AI (0:40 – 1:00)

#### Shot 3.1: Modern Floating Dock Navigation & Role Switching
- **Scene Number:** Scene 3 (0:40 – 0:50)
- **Frontend URL / Route:** `/dashboard` -> `/copilot`
- **Visual Elements Visible:** Floating Framer Motion glassmorphic dock (`AppDock.tsx` / `VerticalDock.tsx`) featuring iconic navigation tabs (Copilot, ContractMind, Archive, Enterprise, Lawyer Queue, Pricing, Settings).
- **User Action:** Mouse hovers across the dock icons, demonstrating smooth magnification physics; user clicks on the Legal Copilot icon.
- **Expected Visible Result:** Icons smoothly scale up on proximity; clicking triggers an animated page transition with dock clearance into the Copilot interface.
- **Backend / AI Operation:** Next.js App Router client-side route prefetching and transition.
- **Recording Duration:** 10 Seconds
- **Camera Movement / Zoom:** Tight focus on the dock magnification effect, pulling out to reveal the full application shell.
- **Transition:** Smooth cut to Shot 3.2.

#### Shot 3.2: Bilingual Localization Toggle & Credit Wallet
- **Scene Number:** Scene 3 (0:50 – 1:00)
- **Frontend URL / Route:** `/copilot` (Header Bar)
- **Visual Elements Visible:** Bilingual English / Bengali language switch toggle (`EN` | `বাংলা`), Theme Switcher (Dark/Light), and User Credit Badge displaying available credits.
- **User Action:** Click the language switch toggle from `EN` to `বাংলা`, then back to `EN`; hover over the Credit Badge.
- **Expected Visible Result:** Navigation labels, tooltips, and interface prompts instantly transition into fluent Bengali script (`Tiro Bangla` typography), then return cleanly to English without page reload.
- **Backend / AI Operation:** React `LanguageContext` state synchronization; credit balance retrieved via `GET /api/auth/me`.
- **Recording Duration:** 10 Seconds
- **Camera Movement / Zoom:** Macro close-up on the header controls.
- **Transition:** Push directly into the prompt bar for Scene 4.

---

### Scene 4 – AI Legal Copilot & Sovereign Privacy (1:00 – 1:25)

#### Shot 4.1: Client-Side Sovereign PII Masking in PromptBar
- **Scene Number:** Scene 4 (1:00 – 1:12)
- **Frontend URL / Route:** `/copilot` (`src/components/prompt/PromptBar.tsx`)
- **Visual Elements Visible:** Prompt input bar with slash commands button, attachment icon, and live sovereign privacy badge.
- **User Action:** User types or pastes a query containing sensitive identifiers: *"আমার বস শামীম আহমেদ (01711998877, shamim@techcorp.com) কোনো নোটিশ ছাড়াই চাকরি থেকে বরখাস্ত করেছে। আমি কি ধারা ২৬ অনুযায়ী ক্ষতিপূরণ পাব?"*
- **Expected Visible Result:** A green shield badge glows green. Before transmission, an animated preview tooltip shows the scrubbed payload: phone number becomes `[REDACTED_PHONE]` and email becomes `[REDACTED_EMAIL]`.
- **Backend / AI Operation:** Client-side regex execution in `src/lib/piiMasker.ts` inside the browser before `POST /api/chat/query` dispatch.
- **Recording Duration:** 12 Seconds
- **Camera Movement / Zoom:** Zoom-in on the prompt input text, then tight focus on the green privacy indicator.
- **Transition:** Cut to Shot 4.2.

#### Shot 4.2: ThoughtLine Reasoning & Verified Statutory Grounding
- **Scene Number:** Scene 4 (1:12 – 1:25)
- **Frontend URL / Route:** `/copilot` (Chat Conversation Stream)
- **Visual Elements Visible:** Stepped agent reasoning component (`ThoughtLine.tsx`); structured response container displaying formatted Markdown answer, cited statutory sections with clickable badge pills, and suggested next steps.
- **User Action:** User watches response stream in; hovers over the statutory badge pill: *The Bangladesh Labour Act, 2006 (Section 26)*.
- **Expected Visible Result:** ThoughtLine steps sequentially illuminate: *"Decomposing Query"* -> *"Qdrant Hybrid Retrieval (3,525 Act Aliases)"* -> *"Statutory Verification"* -> *"Synthesizing Structured Legal Advice"*. The response appears with bulleted legal analysis, citing 120 days notice or pay in lieu. Hovering the statutory pill displays an external link to official gazette at `bdlaws.minlaw.gov.bd`.
- **Backend / AI Operation:** LangGraph QA state machine (`qa_graph.py`) execution; Qdrant vector retrieval; structured JSON response verification.
- **Recording Duration:** 13 Seconds
- **Camera Movement / Zoom:** Slow downward pan following the response generation, pausing on the statutory citation drawer.
- **Transition:** Slide transition to Scene 5.

---

### Scene 5 – ContractMind: Intelligent Contract Audit Engine (1:25 – 2:05)

#### Shot 5.1: Drag-and-Drop Document Ingestion
- **Scene Number:** Scene 5 (1:25 – 1:33)
- **Frontend URL / Route:** `/contractmind` (Document Upload Dropzone)
- **Visual Elements Visible:** Glassmorphic drag-and-drop zone with animated dashed borders; supported format badges (.pdf, .docx, scans); audit perspective selector (`Audited For: Client / Employer`, `Vendor / Contractor`, `Neutral`).
- **User Action:** User drags `Vendor_Services_Agreement_2026.pdf` from the desktop and drops it into the dropzone.
- **Expected Visible Result:** Upload zone reacts with a soft blue pulse; document icon animates into a parsing progress bar displaying: *"PyMuPDF Ingestion -> AST Clause Segmentation (14 Clauses Detected)"*.
- **Backend / AI Operation:** `POST /api/contracts/upload` executing `app/services/ingestion.py` and `clause_segmenter.py`.
- **Recording Duration:** 8 Seconds
- **Camera Movement / Zoom:** Wide view of dropzone zooming into the upload progress indicator.
- **Transition:** Quick cut to Shot 5.2.

#### Shot 5.2: Overall Risk Gauge & Missing Mandatory Provisions
- **Scene Number:** Scene 5 (1:33 – 1:43)
- **Frontend URL / Route:** `/contractmind` (Audit Overview Header)
- **Visual Elements Visible:** Circular animated SVG risk score gauge (`78 / 100 - HIGH RISK`), Contract Domain Badge (*"Commercial Services SLA"*), Stamp Duty Advisory Alert (*"The Stamp Act, 1899 Schedule I Art. 5: BDT 300 non-judicial stamp required"*), and Missing Provisions Warning (*"Missing: Dispute Resolution clause under Arbitration Act 2001"*).
- **User Action:** Cursor moves across the risk gauge and hovers over the Stamp Duty advisory alert.
- **Expected Visible Result:** Smooth numerical animation using `CountUp.tsx` from 0 to 78; badge displays in high-contrast red (`#EF4444`); advisory tooltip expands explaining legal admissibility risks in court without proper stamp duty.
- **Backend / AI Operation:** `contract_graph.py` domain classifier and `detect_missing_mandatory_provisions`.
- **Recording Duration:** 10 Seconds
- **Camera Movement / Zoom:** Focused framing on the risk gauge, panning right across the domain and stamp duty cards.
- **Transition:** Cut to Shot 5.3.

#### Shot 5.3: Interactive Redline Diff & Verbatim Quote Verification
- **Scene Number:** Scene 5 (1:43 – 1:55)
- **Frontend URL / Route:** `/contractmind` (Clause Audit Matrix & Redline Diff)
- **Visual Elements Visible:** Clause Card 8: *"Liquidated Damages & Penalty"*. Split-view redline diff box showing predatory original text in red strikethrough (`- 5% per week compounded penalty`) and proposed amendment in green (`+ Reasonable compensation not exceeding 10% under Section 74, Contract Act 1872`). Verification badge: *"Quote Grounded: Verbatim Source Match"*.
- **User Action:** User clicks to expand Clause 8; toggles between "Diff View" and "Clean View".
- **Expected Visible Result:** Card accordion expands smoothly; diff viewer highlights added and removed text clearly; green shield badge confirms that the quoted text was validated character-for-character against the uploaded contract via `_ground_flagged_quotes`.
- **Backend / AI Operation:** Anti-hallucination quote verification algorithm in `contract_graph.py`.
- **Recording Duration:** 12 Seconds
- **Camera Movement / Zoom:** Close-up on the redline diff card, zooming into the green statutory replacement text.
- **Transition:** Cut to Shot 5.4.

#### Shot 5.4: 1-Click Human-in-the-Loop Advocate Dispatch
- **Scene Number:** Scene 5 (1:55 – 2:05)
- **Frontend URL / Route:** `/contractmind` (Action Footer & Dispatch Modal)
- **Visual Elements Visible:** Action bar featuring buttons: *"Export Legal Memo (PDF)"*, *"Print Audit"*, and *"Request Certified Advocate Review"*.
- **User Action:** User clicks *"Request Certified Advocate Review"*; confirmation modal displays the 5-factor matched advocate profile (*Advocate Tanvir Hasan, Supreme Court Bar Association, Rating 4.9/5.0, 3-Hour SLA Window*); user clicks *"Confirm Dispatch"*.
- **Expected Visible Result:** Modal opens with smooth scale-in transition; credit reservation confirms; status badge changes to *"Dispatched to Advocate Queue (Offer Active)"*.
- **Backend / AI Operation:** `POST /api/contracts/{id}/request-lawyer` triggering `dispatcher.ts` / `algorithm.py` multi-factor scoring.
- **Recording Duration:** 10 Seconds
- **Camera Movement / Zoom:** Framing on the dispatch modal, zooming into the advocate badge and confirm button click.
- **Transition:** Fast zoom out into the 3D isometric architecture visualizer in Scene 6.

---

### Scene 6 – AI Architecture & Multi-Agent Retrieval (2:05 – 2:30)

#### Shot 6.1: Enterprise Playbook Management Interface
- **Scene Number:** Scene 6 (2:05 – 2:16)
- **Frontend URL / Route:** `/enterprise/admin` (Playbooks & Compliance Tab)
- **Visual Elements Visible:** Enterprise Administration Portal displaying active compliance playbooks: *"Corporate Procurement Policy 2026"*, *"Standard Vendor Risk Rules"*. Rules listing shows: *"Mandatory Net-60 Payment"*, *"Liability Capped at 100% of Contract Value"*, *"Governing Law: Dhaka Court Seat"*.
- **User Action:** User scrolls through active playbook rules; clicks *"View Dual-Pass Audit Log"*.
- **Expected Visible Result:** Card shows how enterprise playbook rules are injected into ContractMind audits alongside national statutes.
- **Backend / AI Operation:** `GET /api/company/playbooks` and `GET /api/company/audit-logs`.
- **Recording Duration:** 11 Seconds
- **Camera Movement / Zoom:** Slow horizontal pan across active corporate compliance rules.
- **Transition:** Cut to Shot 6.2.

#### Shot 6.2: System Architecture Diagram & LangGraph Pipeline
- **Scene Number:** Scene 6 (2:16 – 2:30)
- **Frontend URL / Route:** Motion Graphic Overlay / Video Asset (`architecture.md` visualization)
- **Visual Elements Visible:** High-definition glowing architecture animation depicting:
  1. Next.js Client (In-Browser PII Redactor)
  2. FastAPI Asynchronous API Gateway
  3. LangGraph Multi-Agent Engine (`qa_graph` & `contract_graph`)
  4. Qdrant Cloud Hybrid Vector Store (3,525 Act Aliases + multilingual-e5)
  5. Remote Model Context Protocol (MCP) Judicial Precedent Server
  6. Dual-Pass Synthesis (Public Law + Corporate Playbook)
- **User Action:** Motion graphic playback with glowing data packets flowing between nodes.
- **Expected Visible Result:** Dynamic highlighting of data paths showing zero-hallucination verification loops.
- **Backend / AI Operation:** Visual representation of actual backend codebase architecture.
- **Recording Duration:** 14 Seconds
- **Camera Movement / Zoom:** Continuous dynamic isometric pan following the data flow from client ingestion to Qdrant retrieval.
- **Transition:** Dissolve into Scene 7.

---

### Scene 7 – Impact & Advocate Workplace (2:30 – 2:50)

#### Shot 7.1: Advocate Workplace & 3-Hour SLA Queue
- **Scene Number:** Scene 7 (2:30 – 2:40)
- **Frontend URL / Route:** `/lawyer/pending` (Advocate Dashboard)
- **Visual Elements Visible:** Certified Advocate Workplace for Advocate Tanvir Hasan. Incoming task card showing the dispatched contract audit offer with an active 3-hour countdown timer (`02:47:18 remaining`).
- **User Action:** Advocate clicks *"Accept Review Offer"*; task moves to *"Active Review"*; advocate clicks *"Add Certified Legal Seal & Remarks"*.
- **Expected Visible Result:** Real-time countdown timer ticking down; one-click acceptance immediately locks the task and opens the clause inspection editor; digital seal badge illuminates.
- **Backend / AI Operation:** `POST /api/lawyer/queue/{id}/accept` updating HITL status in PostgreSQL.
- **Recording Duration:** 10 Seconds
- **Camera Movement / Zoom:** Close-up on the 3-hour SLA timer, panning to the accept button.
- **Transition:** Cut to Shot 7.2.

#### Shot 7.2: Fintech Earnings Withdrawal & Exported Legal Memorandum
- **Scene Number:** Scene 7 (2:40 – 2:50)
- **Frontend URL / Route:** `/lawyer/archive` & `/archive` (Split Screen Showcase)
- **Visual Elements Visible:** Left: Advocate Earnings wallet showing completed reviews tally and bKash payout request modal. Right: The final downloadable, print-formatted PDF Legal Audit Memorandum with official seal and redline counter-proposals.
- **User Action:** User initiates a quick download of the memorandum; on the left, clicks *"Request Withdrawal (bKash)"*.
- **Expected Visible Result:** Clean, high-contrast black-and-white legal memorandum opens seamlessly (`@media print` CSS rendering); withdrawal request displays confirmed status.
- **Backend / AI Operation:** `GET /api/lawyer/earnings` and client-side markdown memo generation via `markdownContractGenerator.ts`.
- **Recording Duration:** 10 Seconds
- **Camera Movement / Zoom:** Split-screen layout slowly zooming into the official certified audit seal on the memo.
- **Transition:** Cinematic dissolve into Scene 8.

---

### Scene 8 – Inspiring Closing (2:50 – 3:00)

#### Shot 8.1: Official Brand Lockup & Competition Track Accreditations
- **Scene Number:** Scene 8 (2:50 – 3:00)
- **Frontend URL / Route:** Fullscreen Closing Graphic / Branding Lockup (`/`)
- **Visual Elements Visible:** JusticeSphere AI official emblem glowing in amber and white against the `#1D1D1B` dark canvas; tagline: *"Justice Accessible. Contracts Protected. Trust Restored."*; official badge: *Domain 10: Legal, Compliance & Trust Technologies | International AI Builders Congress 2026*.
- **User Action:** None; clean animated visual typography lockup.
- **Expected Visible Result:** Soft glowing aura breathing behind the emblem; clean vector icons of the scales of justice and sovereign code brackets.
- **Backend / AI Operation:** None (High-definition branding card).
- **Recording Duration:** 10 Seconds
- **Camera Movement / Zoom:** Gentle digital pull-back from 105% to 100%, fading to black at 3:00.
- **Transition:** Fade to Black at exactly 03:00.

---

## Production Recording Checklist

- [ ] All test data preloaded via `demo.general`, `advocate.tanvir`, and `legal.director` accounts
- [ ] Browser cache cleared so CSS and WebGL shaders render with maximum framerate
- [ ] Network tab simulated or pre-warmed so API calls respond within 1–2 seconds
- [ ] Mouse pointer acceleration disabled for steady, professional cursor movements
- [ ] Audio levels calibrated: Voiceover at -6 dB, background score at -22 dB during narration, swelling to -14 dB during transitions
