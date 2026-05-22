import asyncio, sys, json
sys.path.insert(0, ".")
from app.config import settings
from datetime import datetime, timezone
import httpx

BASE_URL = "http://api.football-data.org/v4"
HEADERS = {"X-Auth-Token": settings.footballdata_api_key}

async def get_team_matches(client, team_id, limit=10):
    r = await client.get(f"{BASE_URL}/teams/{team_id}/matches",
                         headers=HEADERS, params={"status": "FINISHED", "limit": limit})
    return r.json().get("matches", []) if r.status_code == 200 else []

def calc_form(matches, team_id, last_n=5, home_only=False, away_only=False):
    filtered = []
    for m in reversed(matches):  # most recent first
        if home_only and m["homeTeam"]["id"] != team_id:
            continue
        if away_only and m["awayTeam"]["id"] != team_id:
            continue
        s = m["score"]["fullTime"]
        if s["home"] is None:
            continue
        filtered.append(m)
        if len(filtered) == last_n:
            break

    wins = draws = losses = gf = ga = 0
    for m in filtered:
        s = m["score"]["fullTime"]
        is_home = m["homeTeam"]["id"] == team_id
        goals_for = s["home"] if is_home else s["away"]
        goals_against = s["away"] if is_home else s["home"]
        gf += goals_for
        ga += goals_against
        if goals_for > goals_against: wins += 1
        elif goals_for == goals_against: draws += 1
        else: losses += 1

    n = len(filtered)
    return {
        "games": n,
        "wins": wins,
        "draws": draws,
        "losses": losses,
        "points": wins * 3 + draws,
        "goals_for": gf,
        "goals_against": ga,
        "goal_diff": gf - ga,
        "goals_for_avg": round(gf / n, 2) if n else 0,
        "goals_against_avg": round(ga / n, 2) if n else 0,
    }

def calc_rest_days(matches, fixture_date):
    # API returns ascending order — last element is most recent
    finished = [m for m in matches if m["score"]["fullTime"]["home"] is not None]
    if not finished:
        return None
    last_match_date = datetime.fromisoformat(finished[-1]["utcDate"].replace("Z", "+00:00"))
    return (fixture_date - last_match_date).days

def calc_h2h(matches, home_id, away_id):
    home_wins = draws = away_wins = total_goals = 0
    for m in matches:
        s = m["score"]["fullTime"]
        if s["home"] is None:
            continue
        gh, ga = s["home"], s["away"]
        total_goals += gh + ga
        if (m["homeTeam"]["id"] == home_id and gh > ga) or (m["awayTeam"]["id"] == home_id and ga > gh):
            home_wins += 1
        elif (m["homeTeam"]["id"] == away_id and gh > ga) or (m["awayTeam"]["id"] == away_id and ga > gh):
            away_wins += 1
        else:
            draws += 1
    n = len(matches)
    return {
        "games": n,
        "home_wins": home_wins,
        "draws": draws,
        "away_wins": away_wins,
        "avg_goals": round(total_goals / n, 2) if n else 0,
    }

def get_standing(standings_data, team_id):
    total = next((s for s in standings_data.get("standings", []) if s["type"] == "TOTAL"), None)
    if not total:
        return None
    entry = next((e for e in total["table"] if e["team"]["id"] == team_id), None)
    if not entry:
        return None
    return {
        "position": entry["position"],
        "points": entry["points"],
        "played": entry["playedGames"],
        "won": entry["won"],
        "draw": entry["draw"],
        "lost": entry["lost"],
        "goals_for": entry["goalsFor"],
        "goals_against": entry["goalsAgainst"],
        "goal_diff": entry["goalDifference"],
    }

def get_top_scorer(scorers_data, team_id):
    scorers = scorers_data.get("scorers", [])
    team_scorers = [s for s in scorers if s["team"]["id"] == team_id]
    if not team_scorers:
        return None
    top = team_scorers[0]
    return {"name": top["player"]["name"], "goals": top["goals"]}

async def main():
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{BASE_URL}/competitions/PL/matches", headers=HEADERS,
                              params={"status": "TIMED,SCHEDULED,FINISHED"})
        match = next((m for m in r.json().get("matches", [])
                      if "Chelsea" in m["homeTeam"]["name"] and "Tottenham" in m["awayTeam"]["name"]), None)

        external_id = str(match["id"])
        home_id = match["homeTeam"]["id"]
        away_id = match["awayTeam"]["id"]
        competition_code = match["competition"]["code"]
        fixture_date = datetime.fromisoformat(match["utcDate"].replace("Z", "+00:00"))

        print(f"Match: {match['homeTeam']['name']} vs {match['awayTeam']['name']}")
        print(f"Date : {match['utcDate']}\n")

        h2h_r, home_10, away_10, standings_r, scorers_r = await asyncio.gather(
            client.get(f"{BASE_URL}/matches/{external_id}/head2head", headers=HEADERS, params={"limit": 10}),
            get_team_matches(client, home_id, limit=10),
            get_team_matches(client, away_id, limit=10),
            client.get(f"{BASE_URL}/competitions/{competition_code}/standings", headers=HEADERS),
            client.get(f"{BASE_URL}/competitions/{competition_code}/scorers", headers=HEADERS, params={"limit": 50}),
        )

    standings_data = standings_r.json() if standings_r.status_code == 200 else {}
    scorers_data = scorers_r.json() if scorers_r.status_code == 200 else {}
    h2h_matches = h2h_r.json().get("matches", []) if h2h_r.status_code == 200 else []

    result = {
        "home_team": {
            "last_5":      calc_form(home_10, home_id, last_n=5),
            "last_10":     calc_form(home_10, home_id, last_n=10),
            "home_last_5": calc_form(home_10, home_id, last_n=5, home_only=True),
            "rest_days":   calc_rest_days(home_10, fixture_date),
            "standing":    get_standing(standings_data, home_id),
            "top_scorer":  get_top_scorer(scorers_data, home_id),
        },
        "away_team": {
            "last_5":      calc_form(away_10, away_id, last_n=5),
            "last_10":     calc_form(away_10, away_id, last_n=10),
            "away_last_5": calc_form(away_10, away_id, last_n=5, away_only=True),
            "rest_days":   calc_rest_days(away_10, fixture_date),
            "standing":    get_standing(standings_data, away_id),
            "top_scorer":  get_top_scorer(scorers_data, away_id),
        },
        "h2h": calc_h2h(h2h_matches, home_id, away_id),
    }

    print(json.dumps(result, indent=2))

asyncio.run(main())
