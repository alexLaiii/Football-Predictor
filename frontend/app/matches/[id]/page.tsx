import { getFixture } from "@/lib/api";
import PredictionCard from "@/components/PredictionCard";
import PredictionsPoller from "@/components/PredictionsPoller";
import UserBetForm from "@/components/UserBetForm";
import TeamLogo from "@/components/TeamLogo";
import MatchContextDebug from "@/components/MatchContextDebug";
import LineupsSection from "@/components/LineupPitch";
import Link from "next/link";
import LocalTime from "@/components/LocalTime";

const TOTAL_AI_PREDICTIONS = 5;

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fixture = await getFixture(parseInt(id));

  if (!fixture) {
    return (
      <div className="text-center py-20 text-wc-muted">
        Fixture not found.{" "}
        <Link href="/matches" className="text-wc-gold hover:underline">
          Back to matches
        </Link>
      </div>
    );
  }

  const aiPredictions = fixture.predictions.filter((p) => p.model_name !== "sirkim");

  return (
    <div>
      <Link href="/matches" className="text-sm text-wc-muted hover:text-wc-ink transition-colors">
        ← Matches
      </Link>

      <div className="mt-4 mb-8">
        <div className="text-xs text-wc-gold uppercase tracking-widest">{fixture.league}</div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <TeamLogo src={fixture.home_team_crest} alt={fixture.home_team} className="w-10 h-10" />
          <h1 className="text-3xl font-bold text-wc-ink tracking-tight">{fixture.home_team}</h1>
          <span className="text-xl text-wc-muted">vs</span>
          <h1 className="text-3xl font-bold text-wc-ink tracking-tight">{fixture.away_team}</h1>
          <TeamLogo src={fixture.away_team_crest} alt={fixture.away_team} className="w-10 h-10" />
        </div>
        <div className="mt-2 flex items-center gap-4 text-sm text-wc-muted">
          <LocalTime iso={fixture.kickoff_at} options={{ weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }} />
          {fixture.status === "finished" && fixture.result && (
            <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full capitalize border border-emerald-200">
              Result: {fixture.result} ({fixture.home_goals}–{fixture.away_goals})
            </span>
          )}
        </div>
      </div>

      <UserBetForm
        fixtureId={fixture.id}
        homeTeam={fixture.home_team}
        awayTeam={fixture.away_team}
        homeTeamCrest={fixture.home_team_crest}
        awayTeamCrest={fixture.away_team_crest}
      />

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-wc-ink mb-3">AI Predictions</h2>
        {aiPredictions.length < TOTAL_AI_PREDICTIONS && (
          <>
            <PredictionsPoller />
            <p className="text-sm text-wc-muted animate-pulse mb-4">
              {aiPredictions.length === 0
                ? "AI models predicting… (place a bet to trigger)"
                : `AI models predicting… (${aiPredictions.length}/${TOTAL_AI_PREDICTIONS} done)`}
            </p>
          </>
        )}
        {aiPredictions.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aiPredictions.map((p) => (
              <PredictionCard key={p.id} prediction={p} />
            ))}
          </div>
        )}
      </div>

      {aiPredictions.length > 0 && (
        <MatchContextDebug predictions={aiPredictions} />
      )}

      <LineupsSection
        fixtureId={fixture.id}
        homeTeam={fixture.home_team}
        awayTeam={fixture.away_team}
        kickoffAt={fixture.kickoff_at}
      />
    </div>
  );
}
