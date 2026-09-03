from datetime import date

from fastapi import APIRouter

from app.dependencies.database import DBSession
from app.dependencies.services import ScheduleServiceDep
from app.schemas.schedule import ScheduleResponse


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