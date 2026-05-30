"use client";

import { useEffect, useState } from "react";
import { getLineupDetails, type LineupDetails, type LineupPlayer, type TeamLineup } from "@/lib/api";

type Row = { row: number; players: (LineupPlayer & { col: number })[] };

function buildRowsFromGrid(players: LineupPlayer[]): Row[] | null {
  const rows: Record<number, (LineupPlayer & { col: number })[]> = {};
  for (const p of players) {
    if (!p.grid) return null;
    const [rStr, cStr] = p.grid.split(":");
    const r = parseInt(rStr, 10);
    const c = parseInt(cStr, 10);
    if (isNaN(r) || isNaN(c)) return null;
    (rows[r] ??= []).push({ ...p, col: c });
  }
  return Object.keys(rows)
    .map(Number)
    .sort((a, b) => a - b)
    .map((row) => ({
      row,
      players: rows[row].sort((a, b) => a.col - b.col),
    }));
}

function buildRowsFromPos(players: LineupPlayer[]): Row[] | null {
  const buckets: Record<string, LineupPlayer[]> = { G: [], D: [], M: [], F: [] };
  for (const p of players) {
    const k = (p.pos || "").toUpperCase();
    if (k in buckets) buckets[k].push(p);
  }
  const order: Array<["G" | "D" | "M" | "F", number]> = [["G", 1], ["D", 2], ["M", 3], ["F", 4]];
  const rows: Row[] = [];
  for (const [k, row] of order) {
    if (buckets[k].length) {
      rows.push({
        row,
        players: buckets[k].map((p, i) => ({ ...p, col: i + 1 })),
      });
    }
  }
  return rows.length ? rows : null;
}

function PitchSVG() {
  return (
    <svg viewBox="0 0 200 300" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <rect x="2" y="2" width="196" height="296" fill="none" stroke="#0f172a" strokeWidth="1.2" />
      <line x1="2" y1="150" x2="198" y2="150" stroke="#0f172a" strokeWidth="1" />
      <circle cx="100" cy="150" r="20" fill="none" stroke="#0f172a" strokeWidth="1" />
      <circle cx="100" cy="150" r="1.5" fill="#0f172a" />
      {/* top box */}
      <rect x="50" y="2" width="100" height="36" fill="none" stroke="#0f172a" strokeWidth="1" />
      <rect x="75" y="2" width="50" height="14" fill="none" stroke="#0f172a" strokeWidth="1" />
      {/* bottom box */}
      <rect x="50" y="262" width="100" height="36" fill="none" stroke="#0f172a" strokeWidth="1" />
      <rect x="75" y="284" width="50" height="14" fill="none" stroke="#0f172a" strokeWidth="1" />
    </svg>
  );
}

function PlayerDot({ player }: { player: LineupPlayer }) {
  return (
    <div className="flex flex-col items-center" style={{ width: "20%" }}>
      <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center text-[11px] font-bold text-slate-900">
        {player.number ?? ""}
      </div>
      <div className="mt-1 max-w-[80px] text-[10px] leading-tight text-center text-slate-800 truncate">
        {player.name}
      </div>
    </div>
  );
}

function Pitch({ lineup }: { lineup: TeamLineup }) {
  const rows = buildRowsFromGrid(lineup.players) ?? buildRowsFromPos(lineup.players);

  return (
    <div className="rounded-xl border border-wc-border overflow-hidden bg-white">
      <div className="px-3 py-2 border-b border-wc-border flex items-center justify-between">
        <span className="text-sm font-semibold text-wc-ink truncate">{lineup.team}</span>
        <span className="text-xs text-wc-muted">{lineup.formation || "—"}</span>
      </div>
      <div className="relative aspect-[2/3] bg-white">
        <PitchSVG />
        {rows && rows.length > 0 ? (
          <div className="absolute inset-0 flex flex-col-reverse justify-between py-3 px-2 gap-1">
            {rows.map((r) => (
              <div key={r.row} className="flex justify-around items-center">
                {r.players.map((p, i) => (
                  <PlayerDot key={`${p.name}-${i}`} player={p} />
                ))}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// 4-3-3 placeholder used purely for the visual layout when real lineup data
// is not yet available. These player objects must never reach the AI prompt
// (the backend already filters them out — see _lineup_str / analyze_lineups).
const PLACEHOLDER_ROWS: Row[] = [
  { row: 1, players: [{ name: "", number: null, pos: "G", grid: null, col: 1 }] },
  { row: 2, players: Array.from({ length: 4 }, (_, i) => ({ name: "", number: null, pos: "D", grid: null, col: i + 1 })) },
  { row: 3, players: Array.from({ length: 3 }, (_, i) => ({ name: "", number: null, pos: "M", grid: null, col: i + 1 })) },
  { row: 4, players: Array.from({ length: 3 }, (_, i) => ({ name: "", number: null, pos: "F", grid: null, col: i + 1 })) },
];

function PlaceholderPitch({ teamName }: { teamName: string }) {
  return (
    <div className="rounded-xl border border-dashed border-wc-border overflow-hidden bg-white">
      <div className="px-3 py-2 border-b border-wc-border flex items-center justify-between">
        <span className="text-sm font-semibold text-wc-ink truncate">{teamName}</span>
        <span className="text-xs text-wc-muted">4-3-3 · placeholder</span>
      </div>
      <div className="relative aspect-[2/3] bg-white">
        <PitchSVG />
        <div className="absolute inset-0 flex flex-col-reverse justify-between py-3 px-2 gap-1 opacity-50">
          {PLACEHOLDER_ROWS.map((r) => (
            <div key={r.row} className="flex justify-around items-center">
              {r.players.map((_, i) => (
                <div key={i} className="flex flex-col items-center" style={{ width: "20%" }}>
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-dashed border-slate-400" />
                  <div className="mt-1 text-[10px] text-slate-400">—</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function hasValidPlayers(team: TeamLineup | null): team is TeamLineup {
  return !!team && Array.isArray(team.players) && team.players.some((p) => p.name);
}

const LINEUP_POLL_MINUTES = [40, 35, 30, 25, 20, 15, 10, 5, 1];

export default function LineupsSection({
  fixtureId,
  homeTeam,
  awayTeam,
  kickoffAt,
}: {
  fixtureId: number;
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
}) {
  const [data, setData] = useState<LineupDetails | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    async function load() {
      if (cancelled) return;
      const d = await getLineupDetails(fixtureId);
      if (cancelled) return;
      setData(d);
      setLoaded(true);
      // Once both sides are real, stop polling.
      if (hasValidPlayers(d?.home ?? null) && hasValidPlayers(d?.away ?? null)) {
        timeouts.forEach(clearTimeout);
      }
    }

    load();

    const kickoffMs = new Date(kickoffAt).getTime();
    if (!isNaN(kickoffMs)) {
      const now = Date.now();
      for (const min of LINEUP_POLL_MINUTES) {
        const delay = kickoffMs - min * 60000 - now;
        if (delay > 0) timeouts.push(setTimeout(load, delay));
      }
    }

    return () => {
      cancelled = true;
      timeouts.forEach(clearTimeout);
    };
  }, [fixtureId, kickoffAt]);

  const home = hasValidPlayers(data?.home ?? null) ? data!.home : null;
  const away = hasValidPlayers(data?.away ?? null) ? data!.away : null;
  const anyMissing = !home || !away;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-wc-ink mb-3">Starting Lineups</h2>
      {!loaded ? (
        <div className="text-sm text-wc-muted">Loading lineups…</div>
      ) : (
        <>
          {anyMissing && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Starting XI is not available yet. Showing placeholder formation only.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {home ? <Pitch lineup={home} /> : <PlaceholderPitch teamName={homeTeam} />}
            {away ? <Pitch lineup={away} /> : <PlaceholderPitch teamName={awayTeam} />}
          </div>
        </>
      )}
    </section>
  );
}
