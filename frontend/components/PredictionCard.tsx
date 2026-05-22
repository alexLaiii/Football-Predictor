"use client";

import { useState } from "react";
import type { Prediction } from "@/lib/api";

const MODEL_COLORS: Record<string, string> = {
  sirkim:   "border-yellow-600 bg-yellow-950/40",
  claude:   "border-violet-600 bg-violet-950/40",
  gpt5:     "border-green-600 bg-green-950/40",
  gemini:   "border-blue-600 bg-blue-950/40",
  grok:     "border-orange-600 bg-orange-950/40",
  deepseek: "border-cyan-600 bg-cyan-950/40",
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
  pending: "bg-wc-card text-wc-muted border border-wc-border",
  won:     "bg-green-900/60 text-green-300 border border-green-700",
  lost:    "bg-red-900/60 text-red-300 border border-red-800",
  void:    "bg-wc-card text-wc-muted border border-wc-border",
};

function ProbBar({ label, value, active, valueScore }: { label: string; value: number; active: boolean; valueScore?: number | null }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-12 text-xs ${active ? "text-white font-semibold" : "text-wc-muted"}`}>
        {label}
      </span>
      <div className="flex-1 bg-wc-border rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${active ? "bg-wc-red" : "bg-wc-blue/50"}`}
          style={{ width: `${(value * 100).toFixed(0)}%` }}
        />
      </div>
      <span className={`w-10 text-right text-xs ${active ? "text-white" : "text-wc-muted"}`}>
        {(value * 100).toFixed(0)}%
      </span>
      {valueScore != null && (
        <span className={`w-10 text-right text-xs ${valueScore >= 1 ? "text-green-400" : "text-red-400"}`}>
          {valueScore.toFixed(2)}x
        </span>
      )}
    </div>
  );
}

export default function PredictionCard({ prediction }: { prediction: Prediction }) {
  const [expanded, setExpanded] = useState(false);
  const isSirKim = prediction.model_name === "sirkim";
  const colorClass = MODEL_COLORS[prediction.model_name] ?? "border-wc-border bg-wc-card";
  const label = MODEL_LABELS[prediction.model_name] ?? prediction.model_name;

  const homeProb = isSirKim ? (prediction.bet_on === "home" ? 1 : 0) : prediction.home_prob;
  const drawProb = isSirKim ? (prediction.bet_on === "draw" ? 1 : 0) : prediction.draw_prob;
  const awayProb = isSirKim ? (prediction.bet_on === "away" ? 1 : 0) : prediction.away_prob;

  return (
    <div className={`rounded-xl border p-4 ${colorClass}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-bold text-white">{label}</div>
          <div className="text-xs text-wc-muted mt-0.5">
            Betting <span className="text-white font-medium capitalize">{prediction.bet_on}</span>
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
            Confidence <span className="text-white">{(prediction.confidence * 100).toFixed(0)}%</span>
          </div>
        )}
        <div>
          EV <span className={prediction.expected_value >= 0 ? "text-green-400" : "text-red-400"}>
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
