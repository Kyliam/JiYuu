from fastapi import APIRouter

from app.dependencies.auth import CurrentUser
from app.dependencies.authorization import (
    PatientUser,
    DoctorUser,
    ReceptionistUser,
)
from app.schemas.user import UserResponse


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get(
    "/me",
    response_model=UserResponse
)
async def get_current_user_info(
    current_user: CurrentUser,
):
    return current_user


@router.get("/patient-only")
async def patient_only(
    current_user: PatientUser,
):
    return {
        "message": "You are a patient",
        "user_id": current_user.id,
        "role": current_user.role,
    }


@router.get("/doctor-only")
async def doctor_only(
    current_user: DoctorUser,
):
    return {
        "message": "You are a doctor",
        "user_id": current_user.id,
        "role": current_user.role,
    }


@router.get("/receptionist-only")
async def receptionist_only(
    current_user: ReceptionistUser,
):
    return {
        "message": "You are a receptionist",
        "user_id": current_user.id,
        "role": current_user.role,
    }