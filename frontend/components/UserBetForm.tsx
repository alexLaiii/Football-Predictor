"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getOdds,
  getMyBankroll,
  getMyBetForFixture,
  placeUserBet,
  type Odds,
  type UserBet,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import TeamLogo from "@/components/TeamLogo";
import AuthModal from "@/components/AuthModal";

type Props = {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamCrest: string | null;
  awayTeamCrest: string | null;
};

const BET_OPTIONS: { value: "home" | "draw" | "away" }[] = [
  { value: "home" },
  { value: "draw" },
  { value: "away" },
];

const STATUS_STYLE: Record<string, string> = {
  won:     "text-emerald-600",
  lost:    "text-red-600",
  pending: "text-wc-muted",
  void:    "text-wc-muted/50",
};

export default function UserBetForm({ fixtureId, homeTeam, awayTeam, homeTeamCrest, awayTeamCrest }: Props) {
  const router = useRouter();
  const { user, token } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [betOn, setBetOn] = useState<"home" | "draw" | "away">("home");
  const [stake, setStake] = useState("");
  const [bankroll, setBankroll] = useState<number | null>(null);
  const [existingBet, setExistingBet] = useState<UserBet | null>(null);
  const [odds, setOdds] = useState<Odds | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getOdds(fixtureId).then(setOdds);
  }, [fixtureId]);

  useEffect(() => {
    if (!token) {
      setLoadingExisting(false);
      return;
    }
    Promise.all([getMyBankroll(token), getMyBetForFixture(token, fixtureId)]).then(
      ([b, bet]) => {
        setBankroll(b);
        setExistingBet(bet);
        setLoadingExisting(false);
      },
    );
  }, [token, fixtureId]);

  const selectedOdds = odds ? odds[betOn] : null;
  const stakeNum = parseFloat(stake);
  const potentialPayout =
    selectedOdds && stakeNum > 0 ? stakeNum * selectedOdds : null;

  if (!user) {
    return (
      <>
        <div className="rounded-xl border border-wc-border bg-white p-6 max-w-lg mx-auto shadow-card text-center">
          <p className="text-sm text-wc-muted mb-4">Log in or create an account to place a bet.</p>
          <button
            onClick={() => setAuthOpen(true)}
            className="rounded-lg bg-wc-ink px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Log in / Sign up
          </button>
        </div>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => router.refresh()} />
      </>
    );
  }

  if (loadingExisting) {
    return (
      <div className="rounded-xl border border-wc-border bg-white p-6 max-w-lg mx-auto shadow-card text-sm text-wc-muted">
        Loading…
      </div>
    );
  }

  if (existingBet) {
    return (
      <div className="rounded-xl border border-wc-border bg-white p-6 max-w-lg mx-auto shadow-card">
        <p className="text-xs text-wc-gold uppercase tracking-widest mb-1">Your Bet</p>
        <h2 className="text-xl font-bold text-wc-ink mb-3">{user.username}</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-wc-muted uppercase tracking-wider">Pick</div>
            <div className="text-wc-ink font-semibold capitalize">{existingBet.bet_on}</div>
          </div>
          <div>
            <div className="text-xs text-wc-muted uppercase tracking-wider">Odds</div>
            <div className="text-wc-ink font-mono">{existingBet.odds.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-wc-muted uppercase tracking-wider">Stake</div>
            <div className="text-wc-ink font-mono">${existingBet.stake.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-wc-muted uppercase tracking-wider">Status</div>
            <div className={`capitalize font-semibold ${STATUS_STYLE[existingBet.status] ?? "text-wc-muted"}`}>
              {existingBet.status}
            </div>
          </div>
          {existingBet.profit_loss !== null && (
            <div className="col-span-2">
              <div className="text-xs text-wc-muted uppercase tracking-wider">P&amp;L</div>
              <div className={`font-mono font-semibold ${existingBet.profit_loss >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {existingBet.profit_loss >= 0 ? "+" : ""}${existingBet.profit_loss.toFixed(2)}
              </div>
            </div>
          )}
        </div>
        <p className="mt-4 text-xs text-wc-muted">You can only bet once per match.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!stakeNum || stakeNum <= 0) {
      setError("Enter a valid bet amount.");
      return;
    }
    if (bankroll !== null && stakeNum > bankroll) {
      setError(`Stake exceeds available bankroll ($${bankroll.toFixed(2)}).`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const placed = await placeUserBet(token, fixtureId, betOn, stakeNum);
      // Flip the form to the "Your Bet" view immediately, so we never get stuck on "Placing bet…".
      setExistingBet(placed);
      const fresh = await getMyBankroll(token);
      setBankroll(fresh);
      setLoading(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      setError(msg || "Error placing bet");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-wc-border bg-white p-6 max-w-lg mx-auto shadow-card">
      <div className="mb-5">
        <p className="text-xs text-wc-gold uppercase tracking-widest mb-1">Your Pick</p>
        <h2 className="text-xl font-bold text-wc-ink">{user.username}&apos;s Bet</h2>
        <p className="mt-1 text-sm text-wc-muted">
          Place your bet to trigger AI predictions on this match.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="text-xs text-wc-muted uppercase tracking-wider mb-2">Pick Winner</div>
          <div className="flex gap-2">
            {BET_OPTIONS.map(({ value }) => {
              const crest = value === "home" ? homeTeamCrest : value === "away" ? awayTeamCrest : null;
              const label = value === "home" ? homeTeam : value === "away" ? awayTeam : "Draw";
              const odd = odds ? odds[value] : null;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBetOn(value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                    betOn === value
                      ? "border-wc-gold bg-emerald-50 text-wc-gold"
                      : "border-wc-border text-wc-muted hover:border-slate-300 hover:text-wc-ink"
                  }`}
                >
                  <TeamLogo src={crest} alt={label} className="w-6 h-6" />
                  <span className="truncate max-w-full text-xs">{label}</span>
                  <span className="text-xs font-bold tabular-nums">
                    {odd !== null ? odd.toFixed(2) : "—"}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[10px] text-wc-muted uppercase tracking-wider">
            Odds via Bet365 (PulseScore)
          </p>
        </div>

        <div>
          <div className="flex justify-between text-xs text-wc-muted uppercase tracking-wider mb-2">
            <span>Bet Amount</span>
            {bankroll !== null && (
              <span>Available <span className="text-wc-ink font-medium">${bankroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-wc-muted text-sm">$</span>
            <input
              type="number"
              min="1"
              step="any"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-wc-border bg-white text-sm text-wc-ink placeholder:text-wc-muted/50 pl-7 pr-3 py-2 focus:outline-none focus:border-wc-gold focus:ring-1 focus:ring-wc-gold/30"
            />
          </div>
          {potentialPayout !== null && selectedOdds !== null && (
            <div className="mt-2 flex justify-between text-xs text-wc-muted">
              <span>
                Odds <span className="text-wc-ink font-medium tabular-nums">{selectedOdds.toFixed(2)}</span>
              </span>
              <span>
                Payout if win <span className="text-wc-gold font-semibold tabular-nums">${potentialPayout.toFixed(2)}</span>
              </span>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !stake}
          className="w-full rounded-lg bg-wc-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Placing bet…" : "Place Bet"}
        </button>
      </form>
    </div>
  );
}
