"""
End-to-end flow test — all 4 AI models on a chosen fixture.
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.services.football_api import fetch_upcoming_fixtures, fetch_match_context
from app.services.odds_api import fetch_odds
from app.services.ai.claude import ClaudePredictor
from app.services.ai.gpt4o import GPT4oPredictor
from app.services.ai.deepseek import DeepSeekPredictor
from app.services.ai.grok import GrokPredictor


async def main():
    print("=" * 60)
    print("Fetching upcoming fixtures...")
    fixtures = await fetch_upcoming_fixtures()

    # Skip the first fixture (Man Utd today), pick the next real one
    real = [f for f in fixtures if not f["external_id"].startswith("mock_")]
    fixture = real[1] if len(real) > 1 else real[0]

    print(f"Match   : {fixture['home_team']} vs {fixture['away_team']}")
    print(f"League  : {fixture['league']}")
    print(f"Kickoff : {fixture['kickoff_at']}")
    print(f"ID      : {fixture['external_id']}")

    print("\nFetching match context...")
    context = await fetch_match_context(fixture["external_id"])
    for k, v in context.items():
        print(f"  {k}: {v}")

    print("\nFetching odds...")
    odds = await fetch_odds(
        fixture["external_id"],
        home_team=fixture["home_team"],
        away_team=fixture["away_team"],
        league=fixture["league"],
    )
    print(f"  Home {odds['home']} / Draw {odds['draw']} / Away {odds['away']}")

    print("\n" + "=" * 60)
    print("Running all 4 AI models...")
    print("=" * 60)

    predictors = [ClaudePredictor(), GPT4oPredictor(), DeepSeekPredictor(), GrokPredictor()]
    results = await asyncio.gather(*[p.predict(fixture, context, odds, 10_000.0) for p in predictors])

    for r in results:
        mock = "[MOCK]" in r.reasoning
        print(f"\n{r.model_name.upper()} {'(mock)' if mock else ''}")
        print(f"  Bet: {r.bet_on} @ {r.odds} | Confidence: {r.confidence:.0%} | EV: {r.expected_value:+.3f} | Stake: ${r.stake:.2f}")
        print(f"  {r.reasoning}")

    print("\n" + "=" * 60)
    votes = {}
    for r in results:
        votes[r.bet_on] = votes.get(r.bet_on, 0) + 1
    consensus = max(votes, key=votes.get)
    print(f"CONSENSUS: {consensus} ({votes[consensus]}/{len(results)} models agree)")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
