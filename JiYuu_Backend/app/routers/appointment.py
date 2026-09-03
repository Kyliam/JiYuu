from fastapi import APIRouter, HTTPException

from app.dependencies.database import DBSession
from app.dependencies.services import AppointmentServiceDep
from app.dependencies.auth import CurrentUser

from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse
)


router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"]
)


@router.get(
    "/{appointment_id}",
    response_model=AppointmentResponse
)
async def get_appointment(
    appointment_id: int,
    db: DBSession,
    service: AppointmentServiceDep
):
    appointment = await service.get_by_id(
        db,
        appointment_id
    )

    if appointment is None:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )

    return appointment


@router.get(
    "/patient/{patient_id}",
    response_model=list[AppointmentResponse]
)
async def get_patient_appointments(
    patient_id: int,
    db: DBSession,
    service: AppointmentServiceDep
):
    return await service.get_by_patient(
        db,
        patient_id
    )


@router.get(
    "/doctor/{doctor_id}",
    response_model=list[AppointmentResponse]
)
async def get_doctor_appointments(
    doctor_id: int,
    db: DBSession,
    service: AppointmentServiceDep
):
    return await service.get_by_doctor(
        db,
        doctor_id
    )


@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=201
)
async def create_appointment(
    data: AppointmentCreate,
    current_user: CurrentUser,
    db: DBSession,
    service: AppointmentServiceDep
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
            status_code=400,
            detail=str(e)
        )