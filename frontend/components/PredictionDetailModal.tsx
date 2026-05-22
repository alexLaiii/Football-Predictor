"use client";

import { useEffect } from "react";
import type { Prediction, Fixture } from "@/lib/api";

type Props = {
  prediction: Prediction;
  fixture: Fixture | undefined;
  onClose: () => void;
};

export default function PredictionDetailModal({ prediction: p, fixture: f, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-wc-navy border border-wc-border rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-wc-border shrink-0">
          <div>
            <div className="text-white font-semibold">
              {f ? `${f.home_team} vs ${f.away_team}` : `Fixture #${p.fixture_id}`}
            </div>
            <div className="text-xs text-wc-muted mt-0.5 capitalize">
              {p.model_name} · Bet <span className="text-white">{p.bet_on}</span>
              {" @ "}<span className="text-wc-gold">{p.odds.toFixed(2)}</span>
              {" · Stake "}<span className="text-wc-gold">${p.stake.toFixed(2)}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-wc-muted hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">
          {/* Reasoning */}
          <div>
            <div className="text-xs text-wc-gold font-semibold uppercase tracking-widest mb-2">Reasoning</div>
            <p className="text-sm text-wc-muted leading-relaxed">{p.reasoning}</p>
          </div>

          {/* Prompt */}
          {p.prompt_snapshot ? (
            <div>
              <div className="text-xs text-wc-gold font-semibold uppercase tracking-widest mb-2">Prompt used</div>
              <pre className="text-xs text-wc-muted whitespace-pre-wrap leading-relaxed border border-wc-border rounded-lg p-3 bg-black/20">
                {p.prompt_snapshot}
              </pre>
            </div>
          ) : (
            <div>
              <div className="text-xs text-wc-gold font-semibold uppercase tracking-widest mb-2">Prompt used</div>
              <p className="text-xs text-wc-muted italic">Not available — run a new prediction to capture the prompt.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
