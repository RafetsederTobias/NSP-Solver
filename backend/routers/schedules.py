from datetime import date

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from asp.asp_service import solve_schedule
from models.StationAssignment import StationAssignment
from models.Station import Station
import db
from models.User import User
from db import get_db
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/schedule", tags=["schedule"])

class ScheduleRequest(BaseModel):
    user_ids: list[int] | None = None
    station_ids: list[int] | None = None

@router.get("", status_code=201)
async def schedule(db: AsyncSession = Depends(get_db)):
    users_result = await db.execute(select(User))
    stations_result = await db.execute(select(Station))

    users = users_result.scalars().all()
    stations = stations_result.scalars().all()

    assignments = solve_schedule(users, stations, days=list(range(1, 31)))

    db_assignments = [
        StationAssignment(
            date=date(2026, 4, a["day"]),
            station_id=a["station_id"],
            user_id=a["user_id"],
        )
        for a in assignments
    ]

    db.add_all(db_assignments)
    await db.commit()

    return {"created": len(db_assignments)}