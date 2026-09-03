from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

from app.routers import doctor
from app.routers import schedule
from app.routers import appointment
from app.routers import auth
from app.routers import user


app = FastAPI(
    title="Jiyuu API",
    description="Medical Appointment Booking API",
    version="1.0.0",
)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "Jiyuu API"
    }


@app.get("/health/db")
async def database_health(
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        text("SELECT 1")
    )

    return {
        "status": "ok",
        "database": result.scalar()
    }


app.include_router(
    doctor.router,
    prefix="/api/v1"
)

app.include_router(
    schedule.router,
    prefix="/api/v1"
)

app.include_router(
    appointment.router,
    prefix="/api/v1"
)

app.include_router(
    auth.router,
    prefix="/api/v1"
)

app.include_router(
    user.router,
    prefix="/api/v1"
)