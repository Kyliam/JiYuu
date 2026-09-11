from fastapi import APIRouter, HTTPException, status

from app.dependencies.authorization import PatientUser
from app.dependencies.database import DBSession
from app.dependencies.services import AppointmentServiceDep
from app.dependencies.authorization import DoctorUser

from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
)


router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"]
)

@router.get(
    "/me",
    response_model=list[AppointmentResponse]
)
async def get_my_appointments(
    current_user: PatientUser,
    db: DBSession,
    service: AppointmentServiceDep,
):
    return await service.get_by_patient(
        db,
        current_user.id
    )

@router.get(
    "/doctor/me",
    response_model=list[AppointmentResponse]
)
async def get_my_doctor_appointments(
    current_user: DoctorUser,
    db: DBSession,
    service: AppointmentServiceDep,
):
    try:
        return await service.get_by_current_doctor(
            db,
            current_user.id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    
@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_appointment(
    data: AppointmentCreate,
    current_user: PatientUser,
    db: DBSession,
    service: AppointmentServiceDep,
):
    try:
        appointment = await service.create(
            db,
            data,
            current_user.id
        )

        await db.commit()

        return appointment

    except ValueError as e:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )