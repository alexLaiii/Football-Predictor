"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getFixtures, syncFixtures, type Fixture } from "@/lib/api";
import TeamLogo from "@/components/TeamLogo";
import RouteLoading from "@/components/RouteLoading";

const LEAGUE_ORDER = [
  "World Cup",
  "UEFA Champions League",
  "UEFA Europa League",
  "Premier League",
  "La Liga",
  "Bundesliga",
  "Ligue 1",
  "Serie A",
];

const LEAGUE_LOGO: Record<string, string> = {
  "World Cup":              "/2026_FIFA_World_Cup_emblem.svg.webp",
  "UEFA Champions League":  "/CL.png",
  "UEFA Europa League":     "/EL.png",
  "Premier League":         "/PL.png",
  "La Liga":                "/LL.png",
  "Bundesliga":             "/BL.png",
  "Ligue 1":                "/L1.png",
  "Serie A":                "/SA.png",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByLeague(fixtures: Fixture[]): Record<string, Fixture[]> {
  const groups: Record<string, Fixture[]> = {};
  for (const f of fixtures) {
    (groups[f.league] ??= []).push(f);
  }
  return groups;
}

export default function MatchesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getFixtures()
      .then((all) => {
        const cutoff = Date.now() - 90 * 60 * 1000;
        setFixtures(all.filter((f) => !f.external_id.startsWith("mock_") && new Date(f.kickoff_at).getTime() > cutoff));
      })
      .finally(() => setLoading(false));
  }, []);

  function toggleLeague(league: string) {
    setCollapsed((prev) => ({ ...prev, [league]: !prev[league] }));
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const added = await syncFixtures();
      setFixtures((prev) => {
        const cutoff = Date.now() - 90 * 60 * 1000;
        const ids = new Set(prev.map((f) => f.id));
        return [
          ...prev,
          ...added.filter((f) => !ids.has(f.id) && !f.external_id.startsWith("mock_") && new Date(f.kickoff_at).getTime() > cutoff),
        ].sort((a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime());
      });
    } catch {
      alert("Failed to sync fixtures. Is the backend running?");
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return <RouteLoading />;
  }

  const groups = groupByLeague(fixtures);
  const orderedLeagues = [
    ...LEAGUE_ORDER.filter((l) => groups[l]?.length),
    ...Object.keys(groups).filter((l) => !LEAGUE_ORDER.includes(l)),
  ];

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-wc-gold uppercase tracking-widest mb-1">Top 5 Euro League & FIFA World Cup 2026</p>
          <h1 className="text-3xl font-bold text-wc-ink tracking-tight">Matches</h1>
          <p className="mt-2 text-wc-muted">Click a match to submit Sir Kim&apos;s prediction and AI will predict the same match. (Ideally, make predictions at least <span className="font-semibold text-wc-ink">30 minutes</span> before kick-off, when the Starting XI is released.)</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="rounded-lg bg-wc-ink px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {syncing ? "Syncing…" : "Sync Fixtures"}
        </button>
      </div>

      {fixtures.length === 0 ? (
        <div className="rounded-xl border border-wc-border bg-white p-12 text-center shadow-card">
          <p className="text-wc-muted">No fixtures in database.</p>
          <p className="mt-1 text-sm text-wc-muted/70">Click &ldquo;Sync Fixtures&rdquo; to pull upcoming matches.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orderedLeagues.map((league) => {
            const isOpen = !collapsed[league];
            return (
              <div key={league} className="rounded-xl border border-wc-border overflow-hidden bg-white shadow-card">
                <button
                  onClick={() => toggleLeague(league)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-wc-subtle transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {LEAGUE_LOGO[league] ? (
                      <Image src={LEAGUE_LOGO[league]} alt={league} width={24} height={24} className="object-contain" />
                    ) : (
                      <span className="text-lg">🏆</span>
                    )}
                    <span className="text-sm font-semibold text-wc-gold uppercase tracking-widest">{league}</span>
                    <span className="text-xs text-wc-muted">({groups[league].length})</span>
                  </div>
                  <span className="text-wc-muted text-xs">{isOpen ? "▲" : "▼"}</span>
                </button>

                {isOpen && (
                  <div className="divide-y divide-wc-border border-t border-wc-border">
                    {groups[league].map((f) => (
                      <div
                        key={f.id}
                        className="bg-white px-4 py-3 flex items-center justify-between gap-4 hover:bg-wc-subtle transition-colors"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <TeamLogo src={f.home_team_crest} alt={f.home_team} className="w-6 h-6" />
                          <div>
                            <div className="font-semibold text-wc-ink">
                              {f.home_team} vs {f.away_team}
                            </div>
                            <div className="text-xs text-wc-muted mt-0.5">
                              {formatDate(f.kickoff_at)}
                            </div>
                          </div>
                          <TeamLogo src={f.away_team_crest} alt={f.away_team} className="w-6 h-6" />
                        </div>
                        <Link
                          href={`/matches/${f.id}`}
                          className="rounded-lg border border-wc-border px-3 py-1.5 text-xs text-wc-muted hover:text-wc-ink hover:border-slate-300 transition-colors shrink-0"
                        >
                          View / Predict
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
