import { getPredictions, getAllFixtures, type Fixture } from "@/lib/api";
import HistoryClient from "./HistoryClient";

export default async function HistoryPage() {
  const [predictions, fixtures] = await Promise.all([getPredictions(), getAllFixtures()]);
  const fixtureMap = Object.fromEntries(fixtures.map((f: Fixture) => [f.id, f])) as Record<number, Fixture>;

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs text-wc-gold uppercase tracking-widest mb-1">FIFA World Cup 2026</p>
        <h1 className="text-3xl font-bold text-wc-ink tracking-tight">AI Bet History</h1>
        <p className="mt-2 text-wc-muted">
          Bets placed by each AI model. Last 3 days shown by default — expand a model to see its bets.
        </p>
      </div>
      <HistoryClient predictions={predictions} fixtureMap={fixtureMap} />
    </div>
  );
}
