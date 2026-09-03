from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.enums import AppointmentStatus


class AppointmentCreate(BaseModel):
    doctor_id: int
    schedule_id: int
    reason: str | None = None


class AppointmentUpdate(BaseModel):
    status: AppointmentStatus | None = None
    reason: str | None = None


class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    schedule_id: int
    status: AppointmentStatus
    reason: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )