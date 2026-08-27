from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )

    specialty: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    experience_years: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    room: Mapped[str | None] = mapped_column(
        String(50)
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    user = relationship(
        "User",
        back_populates="doctor"
    )

    schedules = relationship(
        "Schedule",
        back_populates="doctor"
    )

    appointments = relationship(
        "Appointment",
        back_populates="doctor"
    )