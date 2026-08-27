from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.enums import UserRole


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: str | None = None


class UserUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str | None
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )