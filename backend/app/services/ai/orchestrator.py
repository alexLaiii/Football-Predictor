import asyncio
import json

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.models.fixture import Fixture
from app.models.prediction import Prediction
from app.services.ai.claude import ClaudePredictor, SYSTEM_PROMPT
from app.services.ai.gemini import GeminiPredictor
from app.services.ai.gpt5 import GPT5Predictor
from app.services.ai.grok import GrokPredictor
from app.services.ai.deepseek import DeepSeekPredictor
from app.services.football_api import fetch_match_context
from app.services.odds_api import fetch_odds

PREDICTORS = [
    ClaudePredictor(),
    GPT5Predictor(),
    GeminiPredictor(),
    GrokPredictor(),
    DeepSeekPredictor(),
]
INITIAL_BANKROLL = 20_000.0


def get_bankroll(model_name: str, db: Session) -> float:
    settled_pl = db.query(func.coalesce(func.sum(Prediction.profit_loss), 0)).filter(
        Prediction.model_name == model_name,
        Prediction.status.in_(["won", "lost"]),
    ).scalar()
    pending_stakes = db.query(func.coalesce(func.sum(Prediction.stake), 0)).filter(
        Prediction.model_name == model_name,
        Prediction.status == "pending",
    ).scalar()
    return INITIAL_BANKROLL + float(settled_pl) - float(pending_stakes)


async def run_predictions(fixture: Fixture, db: Session) -> list[Prediction]:
    fixture_dict = {
        "external_id": fixture.external_id,
        "home_team": fixture.home_team,
        "away_team": fixture.away_team,
        "league": fixture.league,
    }

    match_context, odds = await asyncio.gather(
        fetch_match_context(fixture.external_id),
        fetch_odds(fixture.external_id, home_team=fixture_dict["home_team"],
                   away_team=fixture_dict["away_team"], league=fixture_dict["league"]),
    )

    user_message = (
        f"Match: {fixture.home_team} vs {fixture.away_team}\n"
        f"League: {fixture.league}\n"
        f"Odds: Home={odds['home']:.2f}, Draw={odds['draw']:.2f}, Away={odds['away']:.2f}\n"
        f"Context: {json.dumps(match_context, indent=2)}"
    )

    is_mock = not settings.apifootball_api_key or fixture.external_id.startswith("mock_")
    label = "MOCK" if is_mock else "REAL"
    data_lines = [f"USED DATA ({label}):"]
    data_lines.append(f"match: {fixture.home_team} vs {fixture.away_team}")
    data_lines.append(f"league: {fixture.league}")
    data_lines.append(f"odds_home: {odds['home']:.2f}")
    data_lines.append(f"odds_draw: {odds['draw']:.2f}")
    data_lines.append(f"odds_away: {odds['away']:.2f}")
    for key, val in match_context.items():
        if isinstance(val, dict):
            for subkey, subval in val.items():
                if subkey == "games":
                    continue
                data_lines.append(f"{key}_{subkey}: {subval}")
        else:
            data_lines.append(f"{key}: {val}")
    prompt_snapshot = "\n".join(data_lines)

    # Snapshot bankrolls before firing concurrent AI calls
    bankrolls = {p.name: get_bankroll(p.name, db) for p in PREDICTORS}

    results = await asyncio.gather(
        *[p.predict(fixture_dict, match_context, odds, bankrolls[p.name]) for p in PREDICTORS]
    )

    predictions = [
        Prediction(
            fixture_id=fixture.id,
            model_name=r.model_name,
            home_prob=r.home_prob,
            draw_prob=r.draw_prob,
            away_prob=r.away_prob,
            bet_on=r.bet_on,
            confidence=r.confidence,
            expected_value=r.expected_value,
            stake=r.stake,
            odds=r.odds,
            reasoning=r.reasoning,
            prompt_snapshot=prompt_snapshot,
            home_value_score=r.home_value_score,
            draw_value_score=r.draw_value_score,
            away_value_score=r.away_value_score,
        )
        for r in results
    ]

    db.add_all(predictions)
    db.commit()
    for p in predictions:
        db.refresh(p)
    return predictions
