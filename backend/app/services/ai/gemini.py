"""
Gemini predictor via vectorengine.ai (Google-compatible API).
"""
import json
import random

import httpx

from app.services.ai.base import BasePredictor, PredictionResult, build_user_message, random_probs

_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent"

SYSTEM_PROMPT = """You are a football match prediction analyst with a long-term profit mindset. Given match information and bookmaker odds, estimate true outcome probabilities and pick the single best relative value outcome.

The context JSON may contain:
- home_last5 / away_last5: recent form over last 5 matches
- home_last5_home / away_last5_away: home/away-specific form splits
- home_goals_avg_last5 / away_goals_avg_last5: average goals scored in last 5 matches
- home_goals_avg_last5_home / away_goals_avg_last5_away: average goals scored in home/away split
- home_standing / away_standing: league position, points, wins, draws, losses, goals for, goals against, goal difference
- home_rest_days / away_rest_days: days since each team's last match
- home_top_scorer / away_top_scorer: team's top scorer and goals
- h2h: head-to-head record between the teams
- home_lineup / away_lineup: starting XI if available
- home_injuries / away_injuries: injured/suspended players
- lineup_summary: natural-language summary of lineup strength and key absences for both teams

Your job:
1. Estimate true probabilities for home/draw/away using the match context.
2. Use the bookmaker odds from the input.
3. Convert bookmaker odds into raw implied probabilities:
   raw_home = 1 / home_odds
   raw_draw = 1 / draw_odds
   raw_away = 1 / away_odds
4. Normalize the implied probabilities to remove bookmaker margin:
   market_home = raw_home / (raw_home + raw_draw + raw_away)
   market_draw = raw_draw / (raw_home + raw_draw + raw_away)
   market_away = raw_away / (raw_home + raw_draw + raw_away)
5. Calculate value scores:
   home_value_score = home_prob / market_home
   draw_value_score = draw_prob / market_draw
   away_value_score = away_prob / market_away
6. Pick bet_on as the outcome with the highest value_score.
7. You MUST always pick one of "home", "draw", or "away". Never return "none" or "pass".
8. Do not simply pick the most likely outcome. Pick the best relative value compared with the normalized market probability.
9. Do not overreact to tiny value-score differences. The selected value should be supported by match context such as form, standings, lineups, injuries, rest days, or home/away splits.
10. If all options look weak, still choose the least bad option with the highest value_score.
11. confidence should reflect:
   - the selected outcome's true probability
   - how much value advantage it has over the market
   - how strongly the match context supports the pick
12. Low-probability outcomes like draws or underdogs should not receive extremely high confidence unless the value edge and context are very strong.

Respond ONLY with valid JSON in this exact format:
{
  "home_prob": 0.45,
  "draw_prob": 0.25,
  "away_prob": 0.30,
  "bet_on": "home",
  "confidence": 0.65,
  "home_value_score": 1.04,
  "draw_value_score": 0.96,
  "away_value_score": 0.91,
  "reasoning": "Brief explanation of why the selected outcome has the best relative value."
}

Rules:
- home_prob + draw_prob + away_prob must equal exactly 1.00 after rounding to 2 decimal places.
- home_prob, draw_prob, and away_prob must be decimals between 0 and 1.
- bet_on MUST be exactly one of: "home", "draw", or "away".
- confidence must be between 0.35 and 0.95.
- value scores should be rounded to 2 decimal places.
- reasoning must be 1-2 sentences explaining why the selected outcome has the best relative value, not just why it is likely.
- Do not include markdown, calculations outside the JSON, extra keys, or mention uncertainty about being an AI."""


class GeminiPredictor(BasePredictor):
    name = "gemini"

    async def predict(self, fixture, match_context, odds, current_bankroll) -> PredictionResult:
        from app.config import settings
        if settings.gemini_api_key:
            try:
                user_message = build_user_message(fixture, odds, match_context)
                body = {
                    "system_instruction": {"parts": [{"text": SYSTEM_PROMPT}]},
                    "contents": [{"role": "user", "parts": [{"text": user_message}]}],
                    "generationConfig": {"temperature": 0.3, "responseMimeType": "application/json"},
                }
                async with httpx.AsyncClient(timeout=60) as client:
                    r = await client.post(
                        _BASE_URL,
                        headers={"x-goog-api-key": settings.gemini_api_key, "Content-Type": "application/json"},
                        json=body,
                    )
                r.raise_for_status()
                text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
                data = json.loads(text)
                probs = {
                    "home": float(data["home_prob"]),
                    "draw": float(data["draw_prob"]),
                    "away": float(data["away_prob"]),
                }
                bet_on = data["bet_on"]
                confidence = float(data["confidence"])
                bet_odds = odds[bet_on]
                ev = round(probs[bet_on] * bet_odds - 1, 3)
                stake = self.calculate_stake(ev, confidence, current_bankroll, bet_odds)
                return PredictionResult(
                    model_name=self.name,
                    home_prob=probs["home"],
                    draw_prob=probs["draw"],
                    away_prob=probs["away"],
                    bet_on=bet_on,
                    confidence=confidence,
                    expected_value=ev,
                    stake=stake,
                    odds=bet_odds,
                    reasoning=data["reasoning"],
                    home_value_score=data.get("home_value_score"),
                    draw_value_score=data.get("draw_value_score"),
                    away_value_score=data.get("away_value_score"),
                )
            except Exception:
                pass

        return self._mock(fixture, odds, current_bankroll)

    def _mock(self, fixture, odds, bankroll) -> PredictionResult:
        probs = random_probs()
        bet_on = max(probs, key=lambda k: probs[k])
        bet_odds = odds[bet_on]
        ev = round(probs[bet_on] * bet_odds - 1, 3)
        confidence = round(random.uniform(0.60, 0.80), 2)
        stake = self.calculate_stake(ev, confidence, bankroll, bet_odds)
        return PredictionResult(
            model_name=self.name,
            home_prob=probs["home"],
            draw_prob=probs["draw"],
            away_prob=probs["away"],
            bet_on=bet_on,
            confidence=confidence,
            expected_value=ev,
            stake=stake,
            odds=bet_odds,
            reasoning=(
                f"[MOCK] Analysing {fixture['home_team']} vs {fixture['away_team']}. "
                f"Based on recent form and H2H data, "
                f"I assign {bet_on} the highest probability at {probs[bet_on]:.1%}. "
                f"At odds of {bet_odds:.2f} this gives EV={ev:+.3f}. Staking ${stake:.2f}."
            ),
        )
