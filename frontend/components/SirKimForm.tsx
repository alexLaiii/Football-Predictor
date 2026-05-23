"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitSirKimPrediction, getPerformance } from "@/lib/api";
import TeamLogo from "@/components/TeamLogo";

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

export default function SirKimForm({ fixtureId, homeTeam, awayTeam, homeTeamCrest, awayTeamCrest }: Props) {
  const router = useRouter();
  const [betOn, setBetOn] = useState<"home" | "draw" | "away">("home");
  const [stake, setStake] = useState("");
  const [bankroll, setBankroll] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPerformance().then((data) => {
      const sirkim = data.find((m) => m.model_name === "sirkim");
      if (sirkim) setBankroll(sirkim.bankroll);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const stakeNum = parseFloat(stake);
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
      await submitSirKimPrediction(fixtureId, {
        bet_on: betOn,
        stake: stakeNum,
      });
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("already exist")) {
        router.refresh();
      } else {
        setError(msg || "Error submitting prediction");
        setLoading(false);
      }
    }
  }

  return (
    <div className="rounded-xl border border-wc-border bg-wc-card p-6 max-w-lg mx-auto">
      <div className="mb-5">
        <p className="text-xs text-wc-gold uppercase tracking-widest mb-1">Manual Predictor</p>
        <h2 className="text-xl font-bold text-white">Sir Kim&apos;s Prediction</h2>
        <p className="mt-1 text-sm text-wc-muted">
          Submit your pick to trigger all AI predictors.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="text-xs text-wc-muted uppercase tracking-wider mb-2">Pick Winner</div>
          <div className="flex gap-2">
            {BET_OPTIONS.map(({ value }) => {
              const crest = value === "home" ? homeTeamCrest : value === "away" ? awayTeamCrest : null;
              const label = value === "home" ? homeTeam : value === "away" ? awayTeam : "Draw";
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBetOn(value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors flex flex-col items-center gap-1 ${
                    betOn === value
                      ? "border-wc-gold bg-wc-gold/10 text-wc-gold"
                      : "border-wc-border text-wc-muted hover:border-wc-blue hover:text-white"
                  }`}
                >
                  <TeamLogo src={crest} alt={label} className="w-6 h-6" />
                  <span className="truncate max-w-full text-xs">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-wc-muted uppercase tracking-wider mb-2">
            <span>Bet Amount</span>
            {bankroll !== null && (
              <span>Available <span className="text-white font-medium">${bankroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></span>
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
              className="w-full rounded-lg border border-wc-border bg-wc-navy text-sm text-white placeholder:text-wc-muted/50 pl-7 pr-3 py-2 focus:outline-none focus:border-wc-blue"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || !stake}
          className="w-full rounded-lg bg-wc-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#a50d25] disabled:opacity-50 transition-colors"
        >
          {loading ? "Placing bet…" : "Submit Prediction"}
        </button>
      </form>
    </div>
  );
}
