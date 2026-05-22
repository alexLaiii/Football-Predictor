import random
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class PredictionResult:
    model_name: str
    home_prob: float
    draw_prob: float
    away_prob: float
    bet_on: str        # "home" | "draw" | "away"
    confidence: float  # 0.0 – 1.0
    expected_value: float
    stake: float
    odds: float
    reasoning: str
    home_value_score: float | None = None
    draw_value_score: float | None = None
    away_value_score: float | None = None


class BasePredictor(ABC):
    name: str
    initial_bankroll: float = 20_000.0

    @abstractmethod
    async def predict(
        self,
        fixture: dict,
        match_context: dict,
        odds: dict,
        current_bankroll: float,
    ) -> PredictionResult: ...

    def calculate_stake(self, ev: float, confidence: float, bankroll: float, odds: float) -> float:
        """Quarter-Kelly stake, floored at 0.1% and capped at 2.5% of bankroll."""
        if ev <= 0:
            return round(bankroll * 0.001, 2)
        kelly_fraction = ev / (odds - 1)
        stake = bankroll * kelly_fraction * 0.25
        stake = max(stake, bankroll * 0.001)
        stake = min(stake, bankroll * 0.025)
        return round(min(stake, bankroll), 2)


def random_probs() -> dict[str, float]:
    """Random home/draw/away probabilities that sum to 1."""
    a, b = sorted([random.random(), random.random()])
    return {"home": round(a, 3), "draw": round(b - a, 3), "away": round(1 - b, 3)}
