from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.prediction import Prediction
from app.schemas import ModelPerformance

router = APIRouter(prefix="/performance", tags=["performance"])

_MODELS = ["sirkim", "claude", "gpt5", "gemini", "grok", "deepseek"]
_INITIAL_BANKROLL = 20_000.0


@router.get("/", response_model=list[ModelPerformance])
def get_performance(db: Session = Depends(get_db)):
    results = []
    for model in _MODELS:
        rows = db.query(Prediction).filter(Prediction.model_name == model).all()
        settled = [r for r in rows if r.status in ("won", "lost")]
        won = sum(1 for r in settled if r.status == "won")
        lost = len(settled) - won
        total_pl = sum(r.profit_loss or 0.0 for r in settled)
        total_staked = sum(r.stake for r in settled)
        pending_staked = sum(r.stake for r in rows if r.status == "pending")
        results.append(ModelPerformance(
            model_name=model,
            bankroll=round(_INITIAL_BANKROLL + total_pl - pending_staked, 2),
            total_bets=len(rows),
            won=won,
            lost=lost,
            pending=sum(1 for r in rows if r.status == "pending"),
            win_rate=round(won / len(settled), 3) if settled else 0.0,
            roi=round(total_pl / total_staked, 3) if total_staked else 0.0,
            total_profit_loss=round(total_pl, 2),
        ))
    return results
