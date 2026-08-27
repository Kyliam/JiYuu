from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schedule import Schedule


class ScheduleRepository:

    async def get_by_id(
        self,
        db: AsyncSession,
        schedule_id: int
    ) -> Schedule | None:

        result = await db.execute(
            select(Schedule).where(
                Schedule.id == schedule_id
            )
        )

        return result.scalar_one_or_none()

    async def get_by_doctor(
        self,
        db: AsyncSession,
        doctor_id: int
    ) -> list[Schedule]:

        result = await db.execute(
            select(Schedule)
            .where(Schedule.doctor_id == doctor_id)
            .order_by(
                Schedule.work_date,
                Schedule.start_time
            )
        )

        return list(result.scalars().all())

    async def get_available_by_doctor(
        self,
        db: AsyncSession,
        doctor_id: int
    ) -> list[Schedule]:

        result = await db.execute(
            select(Schedule)
            .where(
                Schedule.doctor_id == doctor_id,
                Schedule.is_available.is_(True)
            )
            .order_by(
                Schedule.work_date,
                Schedule.start_time
            )
        )

        return list(result.scalars().all())

    async def get_by_doctor_and_date(
        self,
        db: AsyncSession,
        doctor_id: int,
        work_date: date
    ) -> list[Schedule]:

        result = await db.execute(
            select(Schedule)
            .where(
                Schedule.doctor_id == doctor_id,
                Schedule.work_date == work_date
            )
            .order_by(Schedule.start_time)
        )

        return list(result.scalars().all())

    async def create(
        self,
        db: AsyncSession,
        schedule: Schedule
    ) -> Schedule:

        db.add(schedule)

        await db.flush()
        await db.refresh(schedule)

        return schedule