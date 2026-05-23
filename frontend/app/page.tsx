import { getPerformance } from "@/lib/api";
import LeaderboardTable from "@/components/LeaderboardTable";

export default async function DashboardPage() {
  const performance = await getPerformance();

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs text-wc-gold uppercase tracking-widest mb-1">FIFA World Cup 2026</p>
        <h1 className="text-3xl font-bold text-wc-ink tracking-tight">AI Leaderboard</h1>
        <p className="mt-2 text-wc-muted">
          5 AI models and Kim competing on real match predictions with $20,000 bankrolls.
        </p>
      </div>

      {performance.length === 0 ? (
        <div className="rounded-xl border border-wc-border bg-white p-12 text-center shadow-card">
          <p className="text-wc-muted">No predictions yet.</p>
          <p className="mt-1 text-sm text-wc-muted/70">
            Go to{" "}
            <a href="/matches" className="text-wc-gold hover:underline">
              Matches
            </a>{" "}
            to sync fixtures and generate predictions.
          </p>
        </div>
      ) : (
        <LeaderboardTable data={performance} />
      )}
    </div>
  );
}
