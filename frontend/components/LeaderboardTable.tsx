import type { ModelPerformance } from "@/lib/api";

const MODEL_COLORS: Record<string, string> = {
  sirkim:   "bg-yellow-500",
  claude:   "bg-violet-500",
  gpt5:     "bg-green-500",
  gemini:   "bg-blue-500",
  grok:     "bg-orange-500",
  deepseek: "bg-cyan-500",
};

const MODEL_LABELS: Record<string, string> = {
  sirkim:   "Sir Kim",
  claude:   "Claude",
  gpt5:     "ChatGPT",
  gemini:   "Gemini",
  grok:     "Grok",
  deepseek: "DeepSeek",
};

export default function LeaderboardTable({ data }: { data: ModelPerformance[] }) {
  const sorted = [...data].sort((a, b) => b.bankroll - a.bankroll);

  return (
    <div className="overflow-x-auto rounded-xl border border-wc-border bg-white shadow-card">
      <table className="w-full text-sm">
        <thead className="bg-wc-subtle text-wc-muted text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3 text-left">Rank</th>
            <th className="px-4 py-3 text-left">Model</th>
            <th className="px-4 py-3 text-right">Bankroll</th>
            <th className="px-4 py-3 text-right">P&amp;L</th>
            <th className="px-4 py-3 text-right">ROI</th>
            <th className="px-4 py-3 text-right">Win Rate</th>
            <th className="px-4 py-3 text-right">Bets</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-wc-border">
          {sorted.map((m, i) => (
            <tr key={m.model_name} className="bg-white hover:bg-wc-subtle transition-colors">
              <td className="px-4 py-3 font-mono font-bold">
                <span className={i === 0 ? "text-wc-gold" : i === 1 ? "text-slate-500" : i === 2 ? "text-amber-600" : "text-wc-muted"}>
                  #{i + 1}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${MODEL_COLORS[m.model_name] ?? "bg-wc-muted"}`} />
                  <span className="font-medium text-wc-ink">
                    {MODEL_LABELS[m.model_name] ?? m.model_name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-mono text-wc-ink">
                ${m.bankroll.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
              <td className={`px-4 py-3 text-right font-mono ${m.total_profit_loss >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {m.total_profit_loss >= 0 ? "+" : ""}${m.total_profit_loss.toFixed(2)}
              </td>
              <td className={`px-4 py-3 text-right font-mono ${m.roi >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {m.roi >= 0 ? "+" : ""}{(m.roi * 100).toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-right text-wc-muted">
                {(m.win_rate * 100).toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-right text-wc-muted">
                <span className="text-emerald-600">{m.won}W</span>
                {" / "}
                <span className="text-red-600">{m.lost}L</span>
                {m.pending > 0 && <span className="text-wc-muted/50"> / {m.pending}P</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
