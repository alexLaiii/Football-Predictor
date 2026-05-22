import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PassAnimation from "@/components/PassAnimation";

export const metadata: Metadata = {
  title: "AI World Cup Predictor 2026",
  description: "5 AI models compete predicting FIFA World Cup 2026 match outcomes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-wc-navy text-white antialiased font-sans">
        <Navbar />
        <main className="mx-auto max-w-6xl px-6 pt-24 pb-8">{children}</main>
        <PassAnimation />
      </body>
    </html>
  );
}
