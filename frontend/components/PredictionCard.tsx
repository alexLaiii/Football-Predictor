"use client";

import { useState } from "react";
import type { Prediction } from "@/lib/api";

const MODEL_COLORS: Record<string, string> = {
  sirkim:   "border-amber-200 bg-amber-50",
  claude:   "border-violet-200 bg-violet-50",
  gpt5:     "border-emerald-200 bg-emerald-50",
  gemini:   "border-blue-200 bg-blue-50",
  grok:     "border-orange-200 bg-orange-50",
  deepseek: "border-cyan-200 bg-cyan-50",
};

const MODEL_LABELS: Record<string, string> = {
  sirkim:   "Sir Kim",
  claude:   "Claude",
  gpt5:     "ChatGPT",
  gemini:   "Gemini",
  grok:     "Grok",
  deepseek: "DeepSeek",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-white text-wc-muted border border-wc-border",
  won:     "bg-emerald-50 text-emerald-700 border border-emerald-200",
  lost:    "bg-red-50 text-red-700 border border-red-200",
  void:    "bg-white text-wc-muted border border-wc-border",
};

function ProbBar({ label, value, active, valueScore }: { label: string; value: number; active: boolean; valueScore?: number | null }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-12 text-xs ${active ? "text-wc-ink font-semibold" : "text-wc-muted"}`}>
        {label}
      </span>
      <div className="flex-1 bg-wc-border rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${active ? "bg-wc-red" : "bg-slate-300"}`}
          style={{ width: `${(value * 100).toFixed(0)}%` }}
        />
      </div>
      <span className={`w-10 text-right text-xs ${active ? "text-wc-ink" : "text-wc-muted"}`}>
        {(value * 100).toFixed(0)}%
      </span>
      {valueScore != null && (
        <span className={`w-10 text-right text-xs ${valueScore >= 1 ? "text-emerald-600" : "text-red-600"}`}>
          {valueScore.toFixed(2)}x
        </span>
      )}
    </div>
  );
}

export default function PredictionCard({ prediction }: { prediction: Prediction }) {
  const [expanded, setExpanded] = useState(false);
  const isSirKim = prediction.model_name === "sirkim";
  const colorClass = MODEL_COLORS[prediction.model_name] ?? "border-wc-border bg-white";
  const label = MODEL_LABELS[prediction.model_name] ?? prediction.model_name;

  const homeProb = isSirKim ? (prediction.bet_on === "home" ? 1 : 0) : prediction.home_prob;
  const drawProb = isSirKim ? (prediction.bet_on === "draw" ? 1 : 0) : prediction.draw_prob;
  const awayProb = isSirKim ? (prediction.bet_on === "away" ? 1 : 0) : prediction.away_prob;

  return (
    <div className={`rounded-xl border p-4 shadow-card ${colorClass}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-bold text-wc-ink">{label}</div>
          <div className="text-xs text-wc-muted mt-0.5">
            Betting <span className="text-wc-ink font-medium capitalize">{prediction.bet_on}</span>
            {" @ "}<span className="text-wc-gold font-medium">{prediction.odds.toFixed(2)}</span>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_BADGE[prediction.status]}`}>
          {prediction.status === "won"     && `+$${prediction.profit_loss?.toFixed(2)}`}
          {prediction.status === "lost"    && `-$${Math.abs(prediction.profit_loss ?? 0).toFixed(2)}`}
          {prediction.status === "pending" && "Pending"}
          {prediction.status === "void"    && "Void"}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        <ProbBar label="Home" value={homeProb} active={prediction.bet_on === "home"} valueScore={isSirKim ? null : prediction.home_value_score} />
        <ProbBar label="Draw" value={drawProb} active={prediction.bet_on === "draw"} valueScore={isSirKim ? null : prediction.draw_value_score} />
        <ProbBar label="Away" value={awayProb} active={prediction.bet_on === "away"} valueScore={isSirKim ? null : prediction.away_value_score} />
      </div>

      <div className="flex gap-4 text-xs text-wc-muted mb-3">
        {!isSirKim && (
          <div>
            Confidence <span className="text-wc-ink">{(prediction.confidence * 100).toFixed(0)}%</span>
          </div>
        )}
        <div>
          EV <span className={prediction.expected_value >= 0 ? "text-emerald-600" : "text-red-600"}>
            {prediction.expected_value >= 0 ? "+" : ""}{prediction.expected_value.toFixed(3)}
          </span>
        </div>
        <div>
          Stake <span className="text-wc-gold">${prediction.stake.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-wc-muted hover:text-wc-gold transition-colors"
      >
        {expanded ? "▲ Hide reasoning" : "▼ Show reasoning"}
      </button>

      {expanded && (
        <p className="mt-2 text-xs text-wc-muted leading-relaxed border-t border-wc-border pt-2">
          {prediction.reasoning}
        </p>
      )}

      {isSirKim && (
        <p className="mt-3 text-center text-wc-gold text-sm tracking-widest border-t border-wc-border pt-3">
          收收收收收收收
        </p>
      )}
    </div>
  );
}
