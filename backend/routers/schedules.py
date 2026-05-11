from datetime import date
from typing import List

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, extract, select
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
    fixedDays: List[int] | None = None;    
    blockedDays: List[int] | None = None;


class SchedulePayload(BaseModel):
    currentMonth: int
    currentYear: int
    daysInMonth: int
    keepExistingAssignments: bool
    constraints: List[UserConstraint]

def get_weekdays(year: int, month: int, days: list[int]) -> list[int]:
    return [
        d for d in days
        if date(year, month, d).weekday() < 5  # 0=Mon, 4=Fri, 5=Sat, 6=Sun
    ]

@router.post("", status_code=201)
async def schedule(payload: SchedulePayload,db: AsyncSession = Depends(get_db)):
    users_result = await db.execute(
        select(User).options(selectinload(User.skill_relations))
    )
    stations_result = await db.execute(
        select(Station).options(selectinload(Station.skill_relations))
    )

    users = users_result.scalars().all()
    stations = stations_result.scalars().all()

    existing_assignments = []
    if payload.keepExistingAssignments:
        existing_result = await db.execute(
            select(StationAssignment).where(
                extract("year", StationAssignment.date) == payload.currentYear,
                extract("month", StationAssignment.date) == payload.currentMonth,
            )
        )
        existing_assignments = existing_result.scalars().all()

    if not payload.keepExistingAssignments:
        await db.execute(
            delete(StationAssignment).where(
                extract("year", StationAssignment.date) == payload.currentYear,
                extract("month", StationAssignment.date) == payload.currentMonth,
            )
        )

    weekdays = get_weekdays(payload.currentYear, payload.currentMonth, list(range(1, payload.daysInMonth + 1)))

    assignments = solve_schedule(users, stations, days=weekdays,constraints=payload.constraints,existing_assignments=existing_assignments)

    if not assignments:
        raise HTTPException(
            status_code=409,
            detail="Es konnte kein gültiger Dienstplan gefunden werden. Überprüfe die Parameter."
        )


    existing_keys = {
        (a.user_id, a.station_id, a.date.day)
        for a in existing_assignments
    }

    db_assignments = [
        StationAssignment(
            date=date(payload.currentYear, payload.currentMonth, a["day"]),
            station_id=a["station_id"],
            user_id=a["user_id"],
        )
        for a in assignments
        if (a["user_id"], a["station_id"], a["day"]) not in existing_keys  # skips already existing assignments

    ]

    db.add_all(db_assignments)
    await db.commit()

    unassigned_stations = await StationAssignment.get_unassigned_stations(
        db, year=payload.currentYear, month=payload.currentMonth, scheduled_days=weekdays
    )

    response = {"created": len(db_assignments)}

    if unassigned_stations:
        response["unassigned"] = unassigned_stations

    return response