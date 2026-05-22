"""
PulseScore odds integration (Bet365).
Docs: https://pulsescore.net/docs
Set PULSESCORE_API_KEY in .env to enable real data.
"""
import time
from datetime import datetime, timedelta, timezone

import httpx

from app.config import settings

_BASE_URL = "https://api.pulsescore.net/api/v2/bet365"
_HEADERS = lambda: {"X-Secret": settings.pulsescore_api_key}
_CACHE_TTL = 60  # seconds

# Map our league names (from API-Football) to PulseScore leagueName values
_LEAGUE_MAP = {
    "Premier League": "England Premier League",
    "La Liga": "Spain La Liga",
    "Bundesliga": "Germany Bundesliga",
    "Ligue 1": "France Ligue 1",
    "Serie A": "Italy Serie A",
    "World Cup": "World Cup 2026",
}

# {ps_league_name: (fetched_at_timestamp, [events])}
_league_cache: dict[str, tuple[float, list]] = {}

_MOCK_ODDS: dict[str, dict] = {
    "mock_001": {"home": 2.10, "draw": 3.40, "away": 3.60, "kickoff_at": None},
    "mock_002": {"home": 2.30, "draw": 3.20, "away": 3.10, "kickoff_at": None},
    "mock_003": {"home": 1.85, "draw": 3.60, "away": 4.20, "kickoff_at": None},
    "mock_004": {"home": 1.95, "draw": 3.50, "away": 3.80, "kickoff_at": None},
    "mock_005": {"home": 2.50, "draw": 3.10, "away": 2.90, "kickoff_at": None},
}
_DEFAULT_ODDS = {"home": 2.50, "draw": 3.20, "away": 2.80, "kickoff_at": None}


async def fetch_odds(external_id: str, home_team: str = "", away_team: str = "", league: str = "") -> dict:
    """Returns {"home": float, "draw": float, "away": float, "kickoff_at": str|None} from Bet365."""
    if not settings.pulsescore_api_key or external_id.startswith("mock_"):
        return _MOCK_ODDS.get(external_id, _DEFAULT_ODDS)

    league_name = _LEAGUE_MAP.get(league)
    if not league_name or not home_team or not away_team:
        return _DEFAULT_ODDS

    events = await _fetch_league_events(league_name)
    for event in events:
        if _names_match(event.get("home", ""), home_team) and \
           _names_match(event.get("away", ""), away_team):
            return _parse_odds(event, event.get("home", ""), event.get("away", ""))

    return _DEFAULT_ODDS


async def _fetch_league_events(league_name: str) -> list:
    """Fetch events for a league, using a 60-second cache to avoid rate limits."""
    cached = _league_cache.get(league_name)
    if cached and time.monotonic() - cached[0] < _CACHE_TTL:
        return cached[1]

    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{_BASE_URL}/events",
            headers=_HEADERS(),
            params={"league": league_name},
        )
        if r.status_code != 200:
            return []
        events = r.json()
        if not isinstance(events, list):
            return []
        _league_cache[league_name] = (time.monotonic(), events)
        return events


_STRIP = {"fc", "afc", "cf", "sc"}

def _names_match(a: str, b: str) -> bool:
    def tokens(name):
        return {w for w in name.lower().split() if w not in _STRIP and len(w) >= 3}

    a_tok = tokens(a)
    b_tok = tokens(b)

    if a_tok & b_tok:
        return True

    # Prefix match handles Man/Manchester, Nottm/Nottingham, Utd/United etc.
    return any(wa.startswith(wb) or wb.startswith(wa) for wa in a_tok for wb in b_tok)


def _parse_kickoff(bc: str) -> str | None:
    """Parse PulseScore bc field (YYYYMMDDHHMMSS) to ISO 8601 string in EDT (UTC-4)."""
    try:
        edt = timezone(timedelta(hours=-4))
        dt = datetime.strptime(bc, "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc).astimezone(edt)
        return dt.isoformat()
    except (ValueError, TypeError):
        return None


def _parse_odds(event: dict, home_name: str, away_name: str) -> dict:
    """Extract home/draw/away decimal odds and kickoff date from the Full Time Result market."""
    kickoff_at = _parse_kickoff(event.get("bc", ""))

    all_markets = []
    for tab in event.get("tabs", []):
        all_markets.extend(tab.get("mg", []))

    for market in all_markets:
        if market.get("name") != "Full Time Result":
            continue
        result = {}
        for ma in market.get("ma", []):
            for p in ma.get("pa", []):
                na = p.get("NA", "")
                decimal = p.get("decimal", "")
                if not decimal:
                    continue
                price = float(decimal)
                if _names_match(na, home_name):
                    result["home"] = round(price, 2)
                elif _names_match(na, away_name):
                    result["away"] = round(price, 2)
                elif na.lower() in ("draw", "tie"):
                    result["draw"] = round(price, 2)
        if "home" in result and "away" in result:
            result.setdefault("draw", _DEFAULT_ODDS["draw"])
            result["kickoff_at"] = kickoff_at
            return result

    return {**_DEFAULT_ODDS, "kickoff_at": kickoff_at}
