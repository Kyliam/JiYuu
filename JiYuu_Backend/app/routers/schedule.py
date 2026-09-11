from datetime import date

from fastapi import APIRouter, HTTPException, status

from app.dependencies.database import DBSession
from app.dependencies.role import DoctorUser
from app.dependencies.services import ScheduleServiceDep
from app.schemas.schedule import ScheduleCreate, ScheduleResponse


router = APIRouter(
    prefix="/schedules",
    tags=["Schedules"]
)


@router.get(
    "/doctor/{doctor_id}",
    response_model=list[ScheduleResponse]
)
async def get_doctor_schedules(
    doctor_id: int,
    db: DBSession,
    service: ScheduleServiceDep
):
    return await service.get_by_doctor(
        db,
        doctor_id
    )


@router.get(
    "/doctor/{doctor_id}/available",
    response_model=list[ScheduleResponse]
)
async def get_available_schedules(
    doctor_id: int,
    db: DBSession,
    service: ScheduleServiceDep
):
    return await service.get_available_by_doctor(
        db,
        doctor_id
    )


@router.get(
    "/doctor/{doctor_id}/date/{work_date}",
    response_model=list[ScheduleResponse]
)
async def get_schedules_by_date(
    doctor_id: int,
    work_date: date,
    db: DBSession,
    service: ScheduleServiceDep
):
    return await service.get_by_doctor_and_date(
        db,
        doctor_id,
        work_date
    )
@router.post(
    "",
    response_model=ScheduleResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_schedule(
    data: ScheduleCreate,
    current_user: DoctorUser,
    db: DBSession,
    service: ScheduleServiceDep,
):
    try:
        doctor_id = await service.get_doctor_id_by_user_id(
            db,
            current_user.id
        )

        if doctor_id != data.doctor_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only manage your own schedules"
            )

        schedule = await service.create(
            db,
            data
        )

        await db.commit()

        return schedule

    except ValueError as e:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )