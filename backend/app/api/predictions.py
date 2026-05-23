import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.fixture import Fixture
from app.models.prediction import Prediction
from app.schemas import PredictionOut, SirKimInput
from app.services.ai.orchestrator import get_bankroll, predict_all_in_background, run_predictions
from app.services.odds_api import fetch_odds

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("/", response_model=list[PredictionOut])
def list_predictions(db: Session = Depends(get_db)):
    return (
        db.query(Prediction)
        .join(Fixture)
        .order_by(Fixture.kickoff_at.desc())
        .all()
    )


@router.post("/request/{fixture_id}", response_model=list[PredictionOut])
async def request_predictions(fixture_id: int, db: Session = Depends(get_db)):
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")

    existing = db.query(Prediction).filter(Prediction.fixture_id == fixture_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Predictions already generated for this fixture")

    return await run_predictions(fixture, db)


@router.post("/sirkim/{fixture_id}", response_model=list[PredictionOut])
async def submit_sirkim_prediction(
    fixture_id: int,
    body: SirKimInput,
    db: Session = Depends(get_db),
):
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id).first()
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")

    existing = db.query(Prediction).filter(Prediction.fixture_id == fixture_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Predictions already exist for this fixture")

    bankroll = get_bankroll("sirkim", db)
    if body.stake > bankroll:
        raise HTTPException(
            status_code=400,
            detail=f"Stake ${body.stake:.2f} exceeds available bankroll ${bankroll:.2f}",
        )

    odds_data = await fetch_odds(
        fixture.external_id,
        home_team=fixture.home_team,
        away_team=fixture.away_team,
        league=fixture.league,
    )
    sirkim_odds = round(float(odds_data.get(body.bet_on, 2.5)), 2)

    raw = {k: 1 / float(odds_data.get(k, 2.5)) for k in ("home", "draw", "away")}
    total = sum(raw.values())
    home_prob = round(raw["home"] / total, 3)
    draw_prob = round(raw["draw"] / total, 3)
    away_prob = round(1 - home_prob - draw_prob, 3)
    confidence = round({"home": home_prob, "draw": draw_prob, "away": away_prob}[body.bet_on], 3)
    ev = round(confidence * sirkim_odds - 1, 3)

    sirkim_pred = Prediction(
        fixture_id=fixture.id,
        model_name="sirkim",
        home_prob=home_prob,
        draw_prob=draw_prob,
        away_prob=away_prob,
        bet_on=body.bet_on,
        confidence=confidence,
        expected_value=ev,
        stake=round(body.stake, 2),
        odds=sirkim_odds,
        reasoning="",
    )
    db.add(sirkim_pred)
    db.commit()
    db.refresh(sirkim_pred)

    fixture_dict = {
        "external_id": fixture.external_id,
        "home_team": fixture.home_team,
        "away_team": fixture.away_team,
        "league": fixture.league,
    }
    asyncio.create_task(
        predict_all_in_background(fixture.id, fixture_dict, fixture.external_id)
    )

    return [sirkim_pred]
