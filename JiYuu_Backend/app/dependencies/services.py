from typing import Annotated

from fastapi import Depends

from app.services.doctor_service import DoctorService
from app.services.schedule_service import ScheduleService
from app.services.appointment_service import AppointmentService


def get_doctor_service() -> DoctorService:
    return DoctorService()


def get_schedule_service() -> ScheduleService:
    return ScheduleService()


def get_appointment_service() -> AppointmentService:
    return AppointmentService()


DoctorServiceDep = Annotated[
    DoctorService,
    Depends(get_doctor_service)
]

ScheduleServiceDep = Annotated[
    ScheduleService,
    Depends(get_schedule_service)
]

AppointmentServiceDep = Annotated[
    AppointmentService,
    Depends(get_appointment_service)
]