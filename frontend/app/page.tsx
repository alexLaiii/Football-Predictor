"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLeaderboard, type LeaderboardEntry } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import LeaderboardTable from "@/components/LeaderboardTable";
import AuthModal from "@/components/AuthModal";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    getLeaderboard().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  function handleJoinBet() {
    if (user) {
      router.push("/matches");
    } else {
      setAuthOpen(true);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs text-wc-gold uppercase tracking-widest mb-1">FIFA World Cup 2026</p>
          <h1 className="text-3xl font-bold text-wc-ink tracking-tight">Leaderboard</h1>
          <p className="mt-2 text-wc-muted">
            Users and AI models competing on real match predictions with $20,000 starting bankrolls.
          </p>
        </div>
        <button
          onClick={handleJoinBet}
          className="shrink-0 rounded-lg bg-wc-gold px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors shadow-card"
        >
          {user ? "Place a Bet" : "Start Betting"}
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-wc-muted">Loading…</div>
      ) : data.length === 0 ? (
        <div className="rounded-xl border border-wc-border bg-white p-12 text-center shadow-card">
          <p className="text-wc-muted">No bets yet.</p>
          <p className="mt-1 text-sm text-wc-muted/70">
            Go to{" "}
            <a href="/matches" className="text-wc-gold hover:underline">
              Matches
            </a>{" "}
            to place the first bet.
          </p>
        </div>
      ) : (
        <LeaderboardTable data={data} />
      )}

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => router.push("/matches")}
      />
    </div>
  );
}
