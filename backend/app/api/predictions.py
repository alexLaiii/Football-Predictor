from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.fixture import Fixture
from app.models.prediction import Prediction
from app.schemas import PredictionOut
from app.services.ai.orchestrator import run_predictions

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
