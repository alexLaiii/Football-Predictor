from typing import Optional

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)  # football-data.org team ID
    name: Mapped[str] = mapped_column(String(100))
    crest: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
