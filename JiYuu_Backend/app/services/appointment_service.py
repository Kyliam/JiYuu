from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment
from app.repositories.appointment_repository import (
    AppointmentRepository,
)
from app.repositories.doctor_repository import DoctorRepository
from app.repositories.schedule_repository import ScheduleRepository
from app.repositories.user_repository import UserRepository
from app.schemas.appointment import AppointmentCreate
from app.schemas.enums import AppointmentStatus


class AppointmentService:

    def __init__(self):
        self.appointment_repository = AppointmentRepository()
        self.user_repository = UserRepository()
        self.doctor_repository = DoctorRepository()
        self.schedule_repository = ScheduleRepository()

    async def get_by_id(
        self,
        db: AsyncSession,
        appointment_id: int
    ) -> Appointment | None:

        return await self.appointment_repository.get_by_id(
            db,
            appointment_id
        )

    async def get_by_patient(
        self,
        db: AsyncSession,
        patient_id: int
    ) -> list[Appointment]:

        return await self.appointment_repository.get_by_patient(
            db,
            patient_id
        )

    async def get_by_doctor(
        self,
        db: AsyncSession,
        doctor_id: int
    ) -> list[Appointment]:

        return await self.appointment_repository.get_by_doctor(
            db,
            doctor_id
        )

    async def create(
        self,
        db: AsyncSession,
        data: AppointmentCreate,
        patient_id: int
    ) -> Appointment:

        # 1. Kiểm tra patient
        patient = await self.user_repository.get_by_id(
            db,
            data.patient_id
        )

        if patient is None:
            raise ValueError(
                "Patient not found"
            )

        if patient.role != "PATIENT":
            raise ValueError(
                "User is not a patient"
            )

        # 2. Kiểm tra doctor
        doctor = await self.doctor_repository.get_by_id(
            db,
            data.doctor_id
        )

        if doctor is None:
            raise ValueError(
                "Doctor not found"
            )

        # 3. Kiểm tra schedule
        schedule = await self.schedule_repository.get_by_id(
            db,
            data.schedule_id
        )

        if schedule is None:
            raise ValueError(
                "Schedule not found"
            )

        # 4. Schedule phải thuộc Doctor
        if schedule.doctor_id != data.doctor_id:
            raise ValueError(
                "Schedule does not belong to this doctor"
            )

        # 5. Schedule phải còn available
        if not schedule.is_available:
            raise ValueError(
                "Schedule is not available"
            )

        # 6. Kiểm tra appointment hiện tại
        existing_appointment = (
            await self.appointment_repository.get_by_schedule(
                db,
                data.schedule_id
            )
        )

        if existing_appointment:
            raise ValueError(
                "Schedule has already been booked"
            )

        # 7. Tạo appointment
        appointment = Appointment(
            patient_id=patient_id,
            doctor_id=data.doctor_id,
            schedule_id=data.schedule_id,
            status=AppointmentStatus.PENDING.value,
            reason=data.reason,
        )

        return await self.appointment_repository.create(
            db,
            appointment
        )