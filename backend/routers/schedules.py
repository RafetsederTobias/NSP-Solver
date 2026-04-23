from datetime import date
from typing import List

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from asp.asp_service import solve_schedule
from models.StationAssignment import StationAssignment
from models.Station import Station
import db
from models.User import User
from db import get_db
from pydantic import BaseModel, Field
from sqlalchemy.orm import selectinload


router = APIRouter(prefix="/api/v1/schedule", tags=["schedule"])

class UserConstraint(BaseModel):
    user_id: int = Field(alias="userId")
    maxDaysPerMonth: int | None = None
    minDaysPerMonth: int | None = None
    exactDaysPerMonth: int | None = None


class SchedulePayload(BaseModel):
    currentMonth: int
    currentYear: int
    daysInMonth: int
    constraints: List[UserConstraint]

def get_weekdays(year: int, month: int, days: list[int]) -> list[int]:
    return [
        d for d in days
        if date(year, month, d).weekday() < 5  # 0=Mon, 4=Fri, 5=Sat, 6=Sun
    ]

@router.post("", status_code=201)
async def schedule(payload: SchedulePayload,db: AsyncSession = Depends(get_db)):
    print(payload.constraints)
    users_result = await db.execute(
        select(User).options(selectinload(User.skill_relations))
    )
    stations_result = await db.execute(
        select(Station).options(selectinload(Station.skill_relations))
    )

    users = users_result.scalars().all()
    stations = stations_result.scalars().all()

    weekdays = get_weekdays(payload.currentYear, payload.currentMonth, list(range(1, payload.daysInMonth + 1)))

    assignments = solve_schedule(users, stations, days=weekdays,constraints=payload.constraints)

    if not assignments:
        raise HTTPException(
            status_code=409,
            detail="No valid schedule found - check that enough users have the required skills."
        )

    db_assignments = [
        StationAssignment(
            date=date(payload.currentYear, payload.currentMonth, a["day"]),
            station_id=a["station_id"],
            user_id=a["user_id"],
        )
        for a in assignments
    ]

    db.add_all(db_assignments)
    await db.commit()

    return {"created": len(db_assignments)}