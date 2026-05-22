from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class JStreak(Base):
    __tablename__ = "j_streaks"

    id = Column(Integer, primary_key=True)
    user = Column(String(50), unique=True, nullable=False)
    last_reset_at = Column(DateTime(timezone=True), nullable=True)
    longest_streak = Column(Integer, default=0, nullable=False)


class JReset(Base):
    __tablename__ = "j_resets"

    id = Column(Integer, primary_key=True)
    user = Column(String(50), nullable=False)
    reset_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
