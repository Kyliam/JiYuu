from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.doctor import Doctor


class DoctorRepository:

    async def get_by_id(
        self,
        db: AsyncSession,
        doctor_id: int
    ) -> Doctor | None:

        result = await db.execute(
            select(Doctor).where(
                Doctor.id == doctor_id
            )
        )

        return result.scalar_one_or_none()

    async def get_by_user_id(
        self,
        db: AsyncSession,
        user_id: int
    ) -> Doctor | None:

        result = await db.execute(
            select(Doctor).where(
                Doctor.user_id == user_id
            )
        )

        return result.scalar_one_or_none()

    async def get_all(
        self,
        db: AsyncSession
    ) -> list[Doctor]:

        result = await db.execute(
            select(Doctor)
        )

        return list(result.scalars().all())

    async def create(
        self,
        db: AsyncSession,
        doctor: Doctor
    ) -> Doctor:

        db.add(doctor)

        await db.flush()
        await db.refresh(doctor)

        return doctor