"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Pyramid, LandPlot, History, HandFist, BarChart3, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import AuthModal from "@/components/AuthModal";
const NAV_LINKS = [
  { href: "/",          label: "Leaderboard",     icon: Pyramid },
  { href: "/matches",   label: "Matches",         icon: LandPlot },
  { href: "/history",   label: "AI History",      icon: History },
  { href: "/compare",   label: "Compare Me to AI", icon: BarChart3 },
  { href: "/j-tracker", label: "J Tracker",       icon: HandFist },
];

export default function Navbar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "1") setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      document.documentElement.style.setProperty("--sidebar-w", next ? "4rem" : "15rem");
      return next;
    });
  }

  const width = collapsed ? "w-16" : "w-60";

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-wc-border flex items-center justify-between px-4 h-14">
        <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
          <Image src="/logo.png" alt="logo" width={46} height={46} className="object-contain" />
          <span className="text-sm font-semibold text-wc-ink">Can AI win bets</span>
        </Link>
        <button
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle navigation"
          className="inline-flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-lg text-wc-muted hover:text-wc-ink"
        >
          <span className={`block h-0.5 w-5 bg-current transition-transform duration-300 ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 bg-current transition-opacity duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-current transition-transform duration-300 ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </header>

      {/* Mobile dropdown menu */}
      <div
        className={`md:hidden fixed top-14 left-0 right-0 z-30 bg-white border-b border-wc-border overflow-hidden transition-[max-height] duration-300 ${
          mobileOpen ? "max-h-72" : "max-h-0"
        }`}
      >
        <nav className="flex flex-col p-2">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? "bg-wc-subtle text-wc-ink font-semibold" : "text-wc-muted hover:bg-wc-subtle hover:text-wc-ink"
                }`}
              >
                <l.icon className="w-5 h-5 shrink-0" aria-hidden />
                <span>{l.label}</span>
              </Link>
            );
          })}
          <div className="border-t border-wc-border mt-2 pt-2">
            {user ? (
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-wc-muted hover:bg-wc-subtle hover:text-wc-ink"
              >
                <LogOut className="w-5 h-5 shrink-0" aria-hidden />
                <span className="truncate">Log out ({user.username})</span>
              </button>
            ) : (
              <button
                onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-wc-muted hover:bg-wc-subtle hover:text-wc-ink"
              >
                <LogIn className="w-5 h-5 shrink-0" aria-hidden />
                <span>Log in / Sign up</span>
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* Desktop left sidebar */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 z-40 h-screen ${width} bg-white border-r border-wc-border flex-col transition-[width] duration-300 ease-out`}
      >
        {/* Header: logo + brand */}
        <Link
          href="/"
          className={`flex items-center h-16 border-b border-wc-border ${
            collapsed ? "justify-center px-0" : "gap-3 px-4"
          }`}
        >
          <Image src="/logo.png" alt="logo" width={52} height={52} className="object-contain shrink-0" />
          {!collapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-sm font-bold text-wc-ink truncate">Can AI win bets</span>
              <span className="text-[10px] text-wc-gold uppercase tracking-widest">World Cup 2026</span>
            </div>
          )}
        </Link>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="flex flex-col gap-1 px-2">
            {NAV_LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    title={collapsed ? l.label : undefined}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-wc-subtle text-wc-ink font-semibold"
                        : "text-wc-muted hover:bg-wc-subtle hover:text-wc-ink"
                    } ${collapsed ? "justify-center" : ""}`}
                  >
                    <l.icon className="w-5 h-5 shrink-0" aria-hidden />
                    {!collapsed && <span className="truncate">{l.label}</span>}
                    {active && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-wc-gold" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Auth footer */}
        <div className="border-t border-wc-border px-2 py-3">
          {user ? (
            <button
              onClick={logout}
              title={collapsed ? `Log out (${user.username})` : undefined}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-wc-muted hover:bg-wc-subtle hover:text-wc-ink transition-colors ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <LogOut className="w-5 h-5 shrink-0" aria-hidden />
              {!collapsed && <span className="truncate">{user.username}</span>}
            </button>
          ) : (
            <button
              onClick={() => setAuthOpen(true)}
              title={collapsed ? "Log in / Sign up" : undefined}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-wc-muted hover:bg-wc-subtle hover:text-wc-ink transition-colors ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <LogIn className="w-5 h-5 shrink-0" aria-hidden />
              {!collapsed && <span className="truncate">Log in / Sign up</span>}
            </button>
          )}
        </div>

        {/* Edge fold-toggle: small circular button on the right border */}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute top-7 -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-wc-border bg-white text-wc-muted shadow-card hover:text-wc-ink hover:border-slate-400 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-3 w-3 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </aside>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
