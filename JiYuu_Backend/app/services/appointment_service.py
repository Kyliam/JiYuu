from sqlalchemy.ext.asyncio import AsyncSession

from app.models.appointment import Appointment
from app.repositories.appointment_repository import AppointmentRepository
from app.repositories.doctor_repository import DoctorRepository
from app.repositories.schedule_repository import ScheduleRepository
from app.schemas.appointment import AppointmentCreate


class AppointmentService:

    def __init__(self):
        self.appointment_repository = AppointmentRepository()
        self.doctor_repository = DoctorRepository()
        self.schedule_repository = ScheduleRepository()

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

    # ==========================================
    # PATIENT OWNERSHIP
    # ==========================================

    async def get_my_appointments(
        self,
        db: AsyncSession,
        user_id: int
    ) -> list[Appointment]:

        return await self.appointment_repository.get_by_patient(
            db,
            user_id
        )

    # ==========================================
    # DOCTOR OWNERSHIP
    # ==========================================

    async def get_my_doctor_appointments(
        self,
        db: AsyncSession,
        user_id: int
    ) -> list[Appointment]:

        doctor = await self.doctor_repository.get_by_user_id(
            db,
            user_id
        )

        if doctor is None:
            raise ValueError(
                "Doctor profile not found"
            )

        return await self.appointment_repository.get_by_doctor(
            db,
            doctor.id
        )

    # ==========================================
    # CREATE APPOINTMENT
    # ==========================================

    async def create(
        self,
        db: AsyncSession,
        data: AppointmentCreate,
        patient_id: int
    ) -> Appointment:

        # 1. Kiểm tra doctor
        doctor = await self.doctor_repository.get_by_id(
            db,
            data.doctor_id
        )

        if doctor is None:
            raise ValueError(
                "Doctor not found"
            )

        # 2. Kiểm tra schedule
        schedule = await self.schedule_repository.get_by_id(
            db,
            data.schedule_id
        )

        if schedule is None:
            raise ValueError(
                "Schedule not found"
            )

        # 3. Schedule phải thuộc Doctor
        if schedule.doctor_id != doctor.id:
            raise ValueError(
                "Schedule does not belong to this doctor"
            )

        # 4. Schedule phải available
        if not schedule.is_available:
            raise ValueError(
                "Schedule is not available"
            )

        # 5. Kiểm tra schedule đã được booking chưa
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

        # 6. patient_id lấy từ JWT
        appointment = Appointment(
            patient_id=patient_id,
            doctor_id=doctor.id,
            schedule_id=schedule.id,
            status="PENDING",
            reason=data.reason,
        )

        return await self.appointment_repository.create(
            db,
            appointment
        )