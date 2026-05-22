import { getPredictions, getAllFixtures, type Fixture } from "@/lib/api";
import HistoryClient from "./HistoryClient";

export default async function HistoryPage() {
  const [predictions, fixtures] = await Promise.all([getPredictions(), getAllFixtures()]);
  const fixtureMap = Object.fromEntries(fixtures.map((f: Fixture) => [f.id, f])) as Record<number, Fixture>;

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs text-wc-gold uppercase tracking-widest mb-1">FIFA World Cup 2026</p>
        <h1 className="text-3xl font-bold text-white">Bet History</h1>
        <p className="mt-1 text-wc-muted">Last 3 days shown by default. Expand a predictor to see their bets.</p>
      </div>
      <HistoryClient predictions={predictions} fixtureMap={fixtureMap} />
    </div>
  );
}
