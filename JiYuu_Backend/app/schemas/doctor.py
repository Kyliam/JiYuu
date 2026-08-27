from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DoctorCreate(BaseModel):
    user_id: int
    specialty: str
    experience_years: int = 0
    room: str | None = None


class DoctorUpdate(BaseModel):
    specialty: str | None = None
    experience_years: int | None = None
    room: str | None = None


class DoctorResponse(BaseModel):
    id: int
    user_id: int
    specialty: str
    experience_years: int
    room: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )