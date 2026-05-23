import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PassAnimation from "@/components/PassAnimation";

export const metadata: Metadata = {
  title: "AI World Cup Predictor 2026",
  description: "5 AI models compete predicting FIFA World Cup 2026 match outcomes",
};

const setSidebarVar = `(function(){try{var c=localStorage.getItem('sidebar-collapsed')==='1';document.documentElement.style.setProperty('--sidebar-w',c?'4rem':'15rem');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: setSidebarVar }} />
      </head>
      <body className="min-h-screen bg-white text-wc-ink antialiased font-sans">
        <Navbar />
        <main className="md:pl-[var(--sidebar-w,15rem)] pt-14 md:pt-0 transition-[padding] duration-300 ease-out">
          <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
          <PassAnimation />
        </main>
      </body>
    </html>
  );
}
