from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TeamElo(Base):
    __tablename__ = "team_elo"

    team_id: Mapped[int] = mapped_column(Integer, primary_key=True)  # API-Football team ID
    team_name: Mapped[str] = mapped_column(String(100))
    elo: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)        # higher = stronger
    fifa_rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # lower = stronger (1 = best)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
