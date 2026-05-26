"""One-time data migrations run at startup."""

from sqlalchemy import text

from app.database import SessionLocal, engine
from app.models.prediction import Prediction
from app.models.user import User
from app.models.user_bet import UserBet
from app.services.auth import hash_password, new_token


SIR_KIM_USERNAME = "Sir Kim"
SIR_KIM_PASSWORD = "abc"


def ensure_user_columns():
    """Idempotently add new columns / tables introduced by the user-account feature."""
    with engine.connect() as conn:
        # New tables are created by Base.metadata.create_all already; only column adds need ALTER.
        conn.commit()


def migrate_sirkim_to_user():
    """If 'Sir Kim' user does not exist, create it and move every sirkim Prediction row
    into user_bets, then delete the original sirkim Predictions."""
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == SIR_KIM_USERNAME).first()
        if existing:
            return  # migration already done

        user = User(
            username=SIR_KIM_USERNAME,
            password_hash=hash_password(SIR_KIM_PASSWORD),
            token=new_token(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        sirkim_rows = db.query(Prediction).filter(Prediction.model_name == "sirkim").all()
        for pred in sirkim_rows:
            db.add(UserBet(
                user_id=user.id,
                fixture_id=pred.fixture_id,
                bet_on=pred.bet_on,
                stake=pred.stake,
                odds=pred.odds,
                status=pred.status,
                profit_loss=pred.profit_loss,
                settled_at=pred.settled_at,
                created_at=pred.created_at,
            ))
        db.commit()

        # Delete original sirkim Predictions so AI tables contain only AI rows.
        db.query(Prediction).filter(Prediction.model_name == "sirkim").delete()
        db.commit()
    finally:
        db.close()
