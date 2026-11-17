import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation & Pitch Deck | Advotech Copilot",
  description:
    "Live YC-style pitch deck, deep technical whitepaper, and real-time system dashboard for Advotech Copilot — AI-native legal intelligence and contract compliance auditor for Bangladesh Law.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[#1D1D1B] selection:text-white dark:selection:bg-white dark:selection:text-[#1D1D1B]">
      {children}
    </div>
  );
}
