from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


class FixtureOut(BaseModel):
    id: int
    external_id: str
    home_team: str
    away_team: str
    home_team_id: Optional[int]
    away_team_id: Optional[int]
    home_team_crest: Optional[str] = None
    away_team_crest: Optional[str] = None
    league: str
    kickoff_at: datetime
    status: str
    result: Optional[str]
    home_goals: Optional[int]
    away_goals: Optional[int]

    model_config = {"from_attributes": True}


class PredictionOut(BaseModel):
    model_config = {"from_attributes": True, "protected_namespaces": ()}

    id: int
    fixture_id: int
    model_name: str
    home_prob: float
    draw_prob: float
    away_prob: float
    bet_on: str
    confidence: float
    expected_value: float
    stake: float
    odds: float
    reasoning: str
    prompt_snapshot: Optional[str] = None
    status: str
    profit_loss: Optional[float]
    settled_at: Optional[datetime]
    created_at: datetime
    home_value_score: Optional[float] = None
    draw_value_score: Optional[float] = None
    away_value_score: Optional[float] = None


class FixtureWithPredictions(FixtureOut):
    predictions: list[PredictionOut] = []


class SirKimInput(BaseModel):
    bet_on: Literal["home", "draw", "away"]
    stake: float


class ModelPerformance(BaseModel):
    model_config = {"protected_namespaces": ()}

    model_name: str
    bankroll: float
    total_bets: int
    won: int
    lost: int
    pending: int
    win_rate: float
    roi: float
    total_profit_loss: float
