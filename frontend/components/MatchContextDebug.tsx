"use client";

import { useState } from "react";
import type { Prediction } from "@/lib/api";

export default function MatchContextDebug( { predictions }: { predictions: Prediction[] }) {
  const [open, setOpen] = useState(false);

  const snapshot = predictions.find((p) => p.prompt_snapshot)?.prompt_snapshot;
  if (!snapshot) return null;

  const isMock = snapshot.includes("(MOCK)");

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-wc-muted hover:text-wc-gold transition-colors"
      >
        {open ? "▲ Hide used data" : "▼ Show used data"}
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-wc-border bg-wc-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-wc-gold uppercase tracking-widest">
              Data used for prediction
            </span>
            {isMock ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/60 text-yellow-300 border border-yellow-700">
                MOCK DATA
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-900/60 text-green-300 border border-green-700">
                REAL DATA
              </span>
            )}
          </div>
          <pre className="text-xs text-wc-muted overflow-auto max-h-[500px] leading-relaxed whitespace-pre-wrap">
            {snapshot}
          </pre>
        </div>
      )}
    </div>
  );
}
