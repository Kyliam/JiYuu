from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db


app = FastAPI(
    title="Jiyuu API",
    description="Medical Appointment Booking API",
    version="1.0.0",
)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "Jiyuu API",
    }


@app.get("/health/db")
async def database_health(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": result.scalar(),
    }