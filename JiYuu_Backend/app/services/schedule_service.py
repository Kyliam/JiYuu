from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schedule import Schedule
from app.repositories.doctor_repository import DoctorRepository
from app.repositories.schedule_repository import ScheduleRepository
from app.schemas.schedule import ScheduleCreate


class ScheduleService:

    def __init__(self):
        self.schedule_repository = ScheduleRepository()
        self.doctor_repository = DoctorRepository()

    async def get_by_id(
        self,
        db: AsyncSession,
        schedule_id: int
    ) -> Schedule | None:

        return await self.schedule_repository.get_by_id(
            db,
            schedule_id
        )

    async def get_by_doctor(
        self,
        db: AsyncSession,
        doctor_id: int
    ) -> list[Schedule]:

        return await self.schedule_repository.get_by_doctor(
            db,
            doctor_id
        )

    async def get_available_by_doctor(
        self,
        db: AsyncSession,
        doctor_id: int
    ) -> list[Schedule]:

        return await self.schedule_repository.get_available_by_doctor(
            db,
            doctor_id
        )

    async def get_by_doctor_and_date(
        self,
        db: AsyncSession,
        doctor_id: int,
        work_date: date
    ) -> list[Schedule]:

        return await self.schedule_repository.get_by_doctor_and_date(
            db,
            doctor_id,
            work_date
        )

    async def create(
        self,
        db: AsyncSession,
        data: ScheduleCreate
    ) -> Schedule:

        doctor = await self.doctor_repository.get_by_id(
            db,
            data.doctor_id
        )

        if doctor is None:
            raise ValueError(
                "Doctor not found"
            )

        if data.start_time >= data.end_time:
            raise ValueError(
                "Start time must be before end time"
            )

        schedule = Schedule(
            doctor_id=data.doctor_id,
            work_date=data.work_date,
            start_time=data.start_time,
            end_time=data.end_time,
            is_available=True,
        )

        return await self.schedule_repository.create(
            db,
            schedule
        )