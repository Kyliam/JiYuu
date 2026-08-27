from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, ForeignKey, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Schedule(Base):
    __tablename__ = "schedules"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id", ondelete="CASCADE"),
        nullable=False
    )

    work_date: Mapped[date] = mapped_column(
        Date,
        nullable=False
    )

    start_time: Mapped[time] = mapped_column(
        Time,
        nullable=False
    )

    end_time: Mapped[time] = mapped_column(
        Time,
        nullable=False
    )

    is_available: Mapped[bool] = mapped_column(
        nullable=False,
        default=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    doctor = relationship(
        "Doctor",
        back_populates="schedules"
    )

    appointments = relationship(
        "Appointment",
        back_populates="schedule"
    )