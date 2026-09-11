from fastapi import APIRouter, HTTPException

from app.dependencies.database import DBSession
from app.dependencies.services import DoctorServiceDep
from app.schemas.doctor import DoctorCreate, DoctorResponse
from app.dependencies.authorization import ReceptionistUser

router = APIRouter(
    prefix="/doctors",
    tags=["Doctors"]
)


@router.get(
    "",
    response_model=list[DoctorResponse]
)
async def get_doctors(
    db: DBSession,
    service: DoctorServiceDep
):
    return await service.get_all(db)


@router.get(
    "/{doctor_id}",
    response_model=DoctorResponse
)
async def get_doctor(
    doctor_id: int,
    db: DBSession,
    service: DoctorServiceDep
):
    doctor = await service.get_by_id(db, doctor_id)

    if doctor is None:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    return doctor

@router.post(
    "",
    response_model=DoctorResponse,
    status_code=201
)
async def create_doctor(
    data: DoctorCreate,
    current_user: ReceptionistUser,
    db: DBSession,
    service: DoctorServiceDep,
):
    try:
        doctor = await service.create(
            db,
            data
        )

        await db.commit()

        return doctor

    except ValueError as e:
        await db.rollback()

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )