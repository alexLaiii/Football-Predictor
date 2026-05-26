from datetime import datetime, timezone

from app.database import SessionLocal
from app.models.fixture import Fixture
from app.models.prediction import Prediction
from app.models.user_bet import UserBet
from app.services.football_api import fetch_result, fetch_upcoming_fixtures


async def job_sync_fixtures():
    """Weekly: pull upcoming fixtures and store new ones."""
    db = SessionLocal()
    try:
        raw = await fetch_upcoming_fixtures()
        for f in raw:
            exists = db.query(Fixture).filter(Fixture.external_id == f["external_id"]).first()
            if not exists:
                db.add(Fixture(
                    external_id=f["external_id"],
                    home_team=f["home_team"],
                    away_team=f["away_team"],
                    league=f["league"],
                    kickoff_at=datetime.fromisoformat(f["kickoff_at"]),
                ))
        db.commit()
    finally:
        db.close()


async def job_settle_matches():
    """Hourly: settle bets for matches that have finished."""
    db = SessionLocal()
    try:
        pending = (
            db.query(Fixture)
            .filter(
                Fixture.status == "scheduled",
                Fixture.kickoff_at < datetime.now(timezone.utc),
            )
            .all()
        )
        for fixture in pending:
            result = await fetch_result(fixture.external_id)
            if result is None:
                continue

            fixture.status = "finished"
            fixture.result = result["outcome"]
            fixture.home_goals = result.get("home_goals")
            fixture.away_goals = result.get("away_goals")

            now = datetime.now(timezone.utc)
            for pred in db.query(Prediction).filter(
                Prediction.fixture_id == fixture.id,
                Prediction.status == "pending",
            ).all():
                if pred.bet_on == result["outcome"]:
                    pred.status = "won"
                    pred.profit_loss = round(pred.stake * (pred.odds - 1), 2)
                else:
                    pred.status = "lost"
                    pred.profit_loss = -pred.stake
                pred.settled_at = now

            for bet in db.query(UserBet).filter(
                UserBet.fixture_id == fixture.id,
                UserBet.status == "pending",
            ).all():
                if bet.bet_on == result["outcome"]:
                    bet.status = "won"
                    bet.profit_loss = round(bet.stake * (bet.odds - 1), 2)
                else:
                    bet.status = "lost"
                    bet.profit_loss = -bet.stake
                bet.settled_at = now

            db.commit()
    finally:
        db.close()
