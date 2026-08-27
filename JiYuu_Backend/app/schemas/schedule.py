from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict


class ScheduleCreate(BaseModel):
    doctor_id: int
    work_date: date
    start_time: time
    end_time: time


class ScheduleUpdate(BaseModel):
    work_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None
    is_available: bool | None = None


class ScheduleResponse(BaseModel):
    id: int
    doctor_id: int
    work_date: date
    start_time: time
    end_time: time
    is_available: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )