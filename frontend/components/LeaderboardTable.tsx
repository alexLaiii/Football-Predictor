import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import type { LeaderboardEntry } from "@/lib/api";

const AI_COLORS: Record<string, string> = {
  claude:   "bg-violet-500",
  gpt5:     "bg-green-500",
  gemini:   "bg-blue-500",
  grok:     "bg-orange-500",
  deepseek: "bg-cyan-500",
};

const AI_LOTTIES: Record<string, string> = {
  claude:   "/animations/Claude.lottie",
  gpt5:     "/animations/ChatGPT.lottie",
  gemini:   "/animations/Gemini.lottie",
  grok:     "/animations/Grok.lottie",
  deepseek: "/animations/Deepseek.lottie",
};

const AI_LOTTIE_SIZE: Record<string, string> = {
  claude:   "w-12 h-12",
  gpt5:     "w-12 h-12",
  gemini:   "w-12 h-12",
  grok:     "w-9 h-9",
  deepseek: "w-9 h-9",
};

export default function LeaderboardTable({ data }: { data: LeaderboardEntry[] }) {
  const sorted = [...data].sort((a, b) => b.bankroll - a.bankroll);

  return (
    <div className="overflow-x-auto rounded-xl border border-wc-border bg-white shadow-card">
      <table className="w-full text-sm">
        <thead className="bg-wc-subtle text-wc-muted text-xs uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3 text-left">Rank</th>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-right">Bankroll</th>
            <th className="px-4 py-3 text-right">P&amp;L</th>
            <th className="px-4 py-3 text-right">ROI</th>
            <th className="px-4 py-3 text-right">Win Rate</th>
            <th className="px-4 py-3 text-right">Bets</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-wc-border">
          {sorted.map((m, i) => {
            const dot = m.kind === "ai"
              ? (AI_COLORS[m.name] ?? "bg-wc-muted")
              : "bg-yellow-500";
            return (
              <tr key={`${m.kind}-${m.name}`} className="bg-white hover:bg-wc-subtle transition-colors">
                <td className="px-4 py-3 font-mono font-bold">
                  <span className={i === 0 ? "text-wc-gold" : i === 1 ? "text-slate-500" : i === 2 ? "text-amber-600" : "text-wc-muted"}>
                    #{i + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                      {m.kind === "ai" && AI_LOTTIES[m.name]
                        ? <DotLottieReact src={AI_LOTTIES[m.name]} loop autoplay className={AI_LOTTIE_SIZE[m.name] ?? "w-9 h-9"} />
                        : <span className={`h-2 w-2 rounded-full ${dot}`} />
                      }
                    </div>
                    <span className="font-medium text-wc-ink">{m.display_name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${
                    m.kind === "ai"
                      ? "bg-violet-50 text-violet-700 ring-violet-200"
                      : "bg-yellow-50 text-yellow-700 ring-yellow-200"
                  }`}>
                    {m.kind === "ai" ? "AI" : "User"}
                  </span>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
