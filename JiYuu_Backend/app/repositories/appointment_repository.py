from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment


class AppointmentRepository:

    async def get_by_id(
        self,
        db: AsyncSession,
        appointment_id: int
    ) -> Appointment | None:

        result = await db.execute(
            select(Appointment).where(
                Appointment.id == appointment_id
            )
        )

        return result.scalar_one_or_none()

    async def get_by_patient(
        self,
        db: AsyncSession,
        patient_id: int
    ) -> list[Appointment]:

        result = await db.execute(
            select(Appointment)
            .where(
                Appointment.patient_id == patient_id
            )
            .order_by(
                Appointment.created_at.desc()
            )
        )

        return list(result.scalars().all())

    async def get_by_doctor(
        self,
        db: AsyncSession,
        doctor_id: int
    ) -> list[Appointment]:

        result = await db.execute(
            select(Appointment)
            .where(
                Appointment.doctor_id == doctor_id
            )
            .order_by(
                Appointment.created_at.desc()
            )
        )

        return list(result.scalars().all())

    async def get_by_schedule(
        self,
        db: AsyncSession,
        schedule_id: int
    ) -> Appointment | None:

        result = await db.execute(
            select(Appointment)
            .where(
                Appointment.schedule_id == schedule_id
            )
            .where(
                Appointment.status.in_(
                    ["PENDING", "CONFIRMED"]
                )
            )
        )

        return result.scalar_one_or_none()

    async def create(
        self,
        db: AsyncSession,
        appointment: Appointment
    ) -> Appointment:

        db.add(appointment)

        await db.flush()
        await db.refresh(appointment)

        return appointment