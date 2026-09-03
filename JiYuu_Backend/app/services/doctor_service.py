from sqlalchemy.ext.asyncio import AsyncSession

from app.models.doctor import Doctor
from app.repositories.doctor_repository import DoctorRepository
from app.schemas.doctor import DoctorCreate


class DoctorService:

    def __init__(self):
        self.repository = DoctorRepository()

    async def get_by_id(
        self,
        db: AsyncSession,
        doctor_id: int
    ) -> Doctor | None:

        return await self.repository.get_by_id(
            db,
            doctor_id
        )

    async def get_by_user_id(
        self,
        db: AsyncSession,
        user_id: int
    ) -> Doctor | None:

        return await self.repository.get_by_user_id(
            db,
            user_id
        )

    async def get_all(
        self,
        db: AsyncSession
    ) -> list[Doctor]:

        return await self.repository.get_all(db)

    async def create(
        self,
        db: AsyncSession,
        data: DoctorCreate
    ) -> Doctor:

        existing_doctor = await self.repository.get_by_user_id(
            db,
            data.user_id
        )

        if existing_doctor:
            raise ValueError(
                "User already has a doctor profile"
            )

        doctor = Doctor(
            user_id=data.user_id,
            specialty=data.specialty,
            experience_years=data.experience_years,
            room=data.room,
        )

        return await self.repository.create(
            db,
            doctor
        )