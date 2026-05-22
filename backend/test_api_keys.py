"""
Quick test to verify GPT-4o and DeepSeek API keys are working.
Run from the backend directory: python test_api_keys.py
"""
import asyncio
import sys

FIXTURE = {
    "external_id": "test_001",
    "home_team": "Arsenal",
    "away_team": "Chelsea",
    "league": "Premier League",
}
MATCH_CONTEXT = {
    "home_form": "WWDLW",
    "away_form": "WDWLL",
    "h2h_summary": "Home team won 3 of last 5 meetings.",
    "injuries": "No significant injuries reported.",
    "home_goals_avg": 1.8,
    "away_goals_avg": 1.3,
}
ODDS = {"home": 2.10, "draw": 3.40, "away": 3.60}
BANKROLL = 10_000.0


async def test_predictor(predictor):
    name = predictor.name.upper()
    print(f"\n--- {name} ---")
    try:
        result = await predictor.predict(FIXTURE, MATCH_CONTEXT, ODDS, BANKROLL)
        if result.reasoning.startswith("[MOCK]"):
            print(f"FAIL — fell back to mock (check API key or model access)")
        else:
            print(f"OK")
        print(f"  Bet:       {result.bet_on} @ {result.odds:.2f}")
        print(f"  Probs:     home={result.home_prob:.0%}  draw={result.draw_prob:.0%}  away={result.away_prob:.0%}")
        print(f"  EV:        {result.expected_value:+.3f}  |  Confidence: {result.confidence:.0%}")
        print(f"  Stake:     ${result.stake:.2f}")
        print(f"  Reasoning: {result.reasoning}")
    except Exception as e:
        print(f"ERROR — {type(e).__name__}: {e}")


async def main():
    from app.services.ai.gpt4o import GPT4oPredictor
    from app.services.ai.deepseek import DeepSeekPredictor

    await test_predictor(GPT4oPredictor())
    await test_predictor(DeepSeekPredictor())


asyncio.run(main())
