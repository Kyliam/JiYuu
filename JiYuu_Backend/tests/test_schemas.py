from datetime import date, time

import pytest
from pydantic import ValidationError

from app.schemas.user import UserCreate
from app.schemas.schedule import ScheduleCreate


def test_user_create_valid():
    user = UserCreate(
        full_name="Nguyen Van A",
        email="a@gmail.com",
        password="123456"
    )

    assert user.full_name == "Nguyen Van A"
    assert user.email == "a@gmail.com"


def test_user_create_invalid_email():
    with pytest.raises(ValidationError):
        UserCreate(
            full_name="Nguyen Van A",
            email="abc",
            password="123456"
        )


def test_schedule_create():
    schedule = ScheduleCreate(
        doctor_id=1,
        work_date=date(2026, 8, 27),
        start_time=time(8, 0),
        end_time=time(9, 0)
    )

    assert schedule.doctor_id == 1
    assert schedule.start_time == time(8, 0)