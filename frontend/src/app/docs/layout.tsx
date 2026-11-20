import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./../globals.css";

const fraunces = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-fraunces",
  display: "swap",
});

const karla = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-karla",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Advotech Copilot | Pitch Deck",
  description: "AI-powered Legal Intelligence for the Global South",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${fraunces.variable} ${karla.variable} bg-[#0e0e0e] text-[#a3a3a3] font-sans antialiased selection:bg-[#1f1f1f] selection:text-[#ffffff]`}
      style={{ minHeight: "100vh" }}
    >
      {children}
    </div>
  );
}