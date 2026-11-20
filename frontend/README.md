# Advotech Copilot — Web Frontend

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

> **The Next.js 16 web application for Advotech Copilot (JusticeSphere AI & ContractMind).**  
> For complete architecture, security, and full-stack documentation, please see the [Root Repository README](../README.md).

---

## 🚀 Quick Start

### 1. Configure Environment
```bash
cp .env.example .env.local
```
Update `NEXT_PUBLIC_API_URL` to point to the backend:
- Local Backend: `http://localhost:7860`
- Production Backend: `https://legal-copilot-backend-088i.onrender.com`

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🧭 Key Routes Overview

- `/` — Landing page with hero 3D visuals, feature highlights, and authentication modal
- `/copilot` — Zero-hallucination statutory research copilot with Bangladesh Code citations
- `/contractmind` — Contract PDF upload, client-side PII scrubbing, and statutory risk audit
- `/archive` — Historical contract audits, compliance scores, and redlined DOCX exports
- `/pricing` — Platform credit packages and bKash payment gateway
- `/admin` — System administrator control center (KYC verification, payout reconciliation)
- `/enterprise/admin` — Enterprise workspace (compliance playbooks, member quotas, encrypted vault)
- `/lawyer/pending` — Certified advocate HITL queue and digital review sign-off portal
- `/docs` — Live interactive whitepaper and system architecture explorer
