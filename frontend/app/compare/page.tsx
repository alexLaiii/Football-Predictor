"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCompare, type CompareData, type CompareEntry } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import AuthModal from "@/components/AuthModal";

const AI_LABEL: Record<string, string> = {
  claude:   "Claude",
  gpt5:     "ChatGPT",
  gemini:   "Gemini",
  grok:     "Grok",
  deepseek: "DeepSeek",
};

const STATUS_STYLE: Record<string, string> = {
  won:     "text-emerald-600",
  lost:    "text-red-600",
  pending: "text-wc-muted",
  void:    "text-wc-muted/50",
};

const PAGE_SIZE = 15;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function avgAiPl(entry: CompareEntry): { pl: number | null; allPending: boolean } {
  const settled = entry.ai_predictions.filter((p) => p.profit_loss !== null);
  if (settled.length === 0) return { pl: null, allPending: true };
  const sum = settled.reduce((acc, p) => acc + (p.profit_loss ?? 0), 0);
  return { pl: sum / settled.length, allPending: false };
}

function verdict(entry: CompareEntry): {
  label: string;
  className: string;
} {
  const userPl = entry.user_bet.profit_loss;
  const { pl: aiPl } = avgAiPl(entry);

  if (userPl === null || aiPl === null) {
    return { label: "Pending", className: "bg-slate-100 text-slate-600 ring-slate-200" };
  }
  if (Math.abs(userPl - aiPl) < 0.005) {
    return { label: "Tied", className: "bg-slate-100 text-slate-700 ring-slate-200" };
  }
  if (userPl > aiPl) {
    return { label: "You won", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" };
  }
  return { label: "AI won", className: "bg-amber-50 text-amber-700 ring-amber-200" };
}

function plClass(pl: number | null) {
  if (pl === null) return "text-wc-muted";
  return pl >= 0 ? "text-emerald-600" : "text-red-600";
}

function formatPl(pl: number | null) {
  if (pl === null) return "—";
  return `${pl >= 0 ? "+" : ""}$${pl.toFixed(2)}`;
}

function ExpandedDetails({ entry }: { entry: CompareEntry }) {
  const { user_bet, ai_predictions } = entry;
  return (
    <div className="overflow-x-auto border-t border-wc-border">
      <table className="w-full text-sm">
        <thead className="text-wc-muted text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-2 text-left">Bettor</th>
            <th className="px-4 py-2 text-left">Bet</th>
            <th className="px-4 py-2 text-right">Odds</th>
            <th className="px-4 py-2 text-right">Stake</th>
            <th className="px-4 py-2 text-right">P&amp;L</th>
            <th className="px-4 py-2 text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-wc-border">
          <tr className="bg-yellow-50/40">
            <td className="px-4 py-2 font-semibold text-wc-ink">You</td>
            <td className="px-4 py-2 capitalize text-wc-ink">{user_bet.bet_on}</td>
            <td className="px-4 py-2 text-right font-mono text-wc-muted">{user_bet.odds.toFixed(2)}</td>
            <td className="px-4 py-2 text-right font-mono text-wc-muted">${user_bet.stake.toFixed(2)}</td>
            <td className={`px-4 py-2 text-right font-mono ${plClass(user_bet.profit_loss)}`}>
              {formatPl(user_bet.profit_loss)}
            </td>
            <td className={`px-4 py-2 text-right capitalize ${STATUS_STYLE[user_bet.status] ?? "text-wc-muted"}`}>
              {user_bet.status}
            </td>
          </tr>
          {ai_predictions.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-3 text-center text-xs text-wc-muted">
                AI predictions still loading…
              </td>
            </tr>
          ) : ai_predictions.map((p) => (
            <tr key={p.id} className="bg-white">
              <td className="px-4 py-2 text-wc-ink">{AI_LABEL[p.model_name] ?? p.model_name}</td>
              <td className="px-4 py-2 capitalize text-wc-ink">{p.bet_on}</td>
              <td className="px-4 py-2 text-right font-mono text-wc-muted">{p.odds.toFixed(2)}</td>
              <td className="px-4 py-2 text-right font-mono text-wc-muted">${p.stake.toFixed(2)}</td>
              <td className={`px-4 py-2 text-right font-mono ${plClass(p.profit_loss)}`}>
                {formatPl(p.profit_loss)}
              </td>
              <td className={`px-4 py-2 text-right capitalize ${STATUS_STYLE[p.status] ?? "text-wc-muted"}`}>
                {p.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EntryCard({ entry }: { entry: CompareEntry }) {
  const [open, setOpen] = useState(false);
  const userPl = entry.user_bet.profit_loss;
  const { pl: aiPl } = avgAiPl(entry);
  const v = verdict(entry);

  return (
    <div className="rounded-xl border border-wc-border bg-white shadow-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-wc-subtle transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-wc-ink truncate">
              {entry.home_team} vs {entry.away_team}
            </span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${v.className}`}>
              {v.label}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-wc-muted truncate">
            {entry.league} · {formatDate(entry.kickoff_at)}
            {entry.result && <span className="ml-1 capitalize">→ {entry.result}</span>}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-xs shrink-0">
          <div className="text-right">
            <div className="text-wc-muted uppercase tracking-wider text-[10px]">You</div>
            <div className={`font-mono font-semibold ${plClass(userPl)}`}>{formatPl(userPl)}</div>
          </div>
          <div className="text-right">
            <div className="text-wc-muted uppercase tracking-wider text-[10px]">Avg AI</div>
            <div className={`font-mono font-semibold ${plClass(aiPl)}`}>{formatPl(aiPl)}</div>
          </div>
        </div>
        <span className="text-wc-muted text-xs shrink-0 ml-1">{open ? "▲" : "▼"}</span>
      </button>

      {/* Mobile: P&L row, since the desktop row is hidden < sm */}
      <div className="sm:hidden px-4 pb-3 flex items-center justify-between text-xs">
        <div>
          <span className="text-wc-muted uppercase tracking-wider text-[10px]">You </span>
          <span className={`font-mono font-semibold ${plClass(userPl)}`}>{formatPl(userPl)}</span>
        </div>
        <div>
          <span className="text-wc-muted uppercase tracking-wider text-[10px]">Avg AI </span>
          <span className={`font-mono font-semibold ${plClass(aiPl)}`}>{formatPl(aiPl)}</span>
        </div>
      </div>

      {open && <ExpandedDetails entry={entry} />}
    </div>
  );
}

function SummaryCard({ data, username }: { data: CompareData; username: string }) {
  const { summary } = data;
  return (
    <div className="rounded-xl border border-wc-border bg-white shadow-card p-5 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-wc-muted uppercase tracking-wider">Matches Bet</div>
          <div className="text-xl font-bold text-wc-ink">{summary.matches_bet}</div>
        </div>
        <div>
          <div className="text-xs text-wc-muted uppercase tracking-wider">{username} P&amp;L</div>
          <div className={`text-xl font-bold ${summary.user_pl >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {summary.user_pl >= 0 ? "+" : ""}${summary.user_pl.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-wc-muted uppercase tracking-wider">Avg AI P&amp;L</div>
          <div className={`text-xl font-bold ${summary.ai_pl >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {summary.ai_pl >= 0 ? "+" : ""}${summary.ai_pl.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-wc-muted uppercase tracking-wider">Win Rate</div>
          <div className="text-xl font-bold text-wc-ink">
            {(summary.user_win_rate * 100).toFixed(0)}%
            <span className="text-sm text-wc-muted font-normal"> vs AI {(summary.ai_win_rate * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  const { user, token, loading: authLoading } = useAuth();
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const router = useRouter();

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getCompare(token).then((d) => {
      setData(d);
      setLoading(false);
      setVisibleCount(PAGE_SIZE);
    });
  }, [token]);

  const visibleEntries = useMemo(
    () => (data ? data.entries.slice(0, visibleCount) : []),
    [data, visibleCount],
  );
  const totalEntries = data?.entries.length ?? 0;
  const hasMore = visibleCount < totalEntries;

  if (authLoading) {
    return <div className="text-sm text-wc-muted">Loading…</div>;
  }

  if (!user) {
    return (
      <div>
        <div className="mb-6">
          <p className="text-xs text-wc-gold uppercase tracking-widest mb-1">My Performance</p>
          <h1 className="text-3xl font-bold text-wc-ink tracking-tight">Compare Me to AI</h1>
        </div>
        <div className="rounded-xl border border-wc-border bg-white p-12 text-center shadow-card">
          <p className="text-wc-muted">Please log in or create an account.</p>
          <button
            onClick={() => setAuthOpen(true)}
            className="mt-4 rounded-lg bg-wc-ink px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Log in / Sign up
          </button>
        </div>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => router.refresh()} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs text-wc-gold uppercase tracking-widest mb-1">My Performance</p>
        <h1 className="text-3xl font-bold text-wc-ink tracking-tight">Compare Me to AI</h1>
        <p className="mt-2 text-wc-muted">
          Your bets, side by side with what the AI models picked on the same matches.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-wc-muted">Loading…</div>
      ) : !data || data.entries.length === 0 ? (
        <div className="rounded-xl border border-wc-border bg-white p-12 text-center shadow-card">
          <p className="text-wc-muted">Results will be shown after your first bet.</p>
        </div>
      ) : (
        <>
          <SummaryCard data={data} username={user.username} />
          <div className="space-y-3">
            {visibleEntries.map((e) => (
              <EntryCard key={e.fixture_id} entry={e} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setVisibleCount((c) => Math.min(c + PAGE_SIZE, totalEntries))}
                className="rounded-lg border border-wc-border bg-white px-5 py-2 text-sm font-medium text-wc-ink hover:bg-wc-subtle transition-colors shadow-card"
              >
                Load More ({Math.min(PAGE_SIZE, totalEntries - visibleCount)} more)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
