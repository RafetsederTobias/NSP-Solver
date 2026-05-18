from datetime import date
from typing import List

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, extract, select, and_
from asp.asp_service import solve_reschedule, solve_schedule
from models.StationAssignment import StationAssignment
from models.Station import Station
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
    fixedDays: List[int] | None = None
    blockedDays: List[int] | None = None


class SchedulePayload(BaseModel):
    currentMonth: int
    currentYear: int
    daysInMonth: int
    keepExistingAssignments: bool
    constraints: List[UserConstraint]


def get_weekdays(year: int, month: int, days: list[int]) -> list[int]:
    return [
        d for d in days
        if date(year, month, d).weekday() < 5
    ]


@router.post("", status_code=201)
async def schedule(payload: SchedulePayload, db: AsyncSession = Depends(get_db)):
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
                StationAssignment.user_id != None,
            )
        )
        existing_assignments = existing_result.scalars().all()

    await db.execute(
        delete(StationAssignment).where(
            and_(
                extract("year", StationAssignment.date) == payload.currentYear,
                extract("month", StationAssignment.date) == payload.currentMonth,
                StationAssignment.user_id == None,
            )
        )
    )

    if not payload.keepExistingAssignments:
        await db.execute(
            delete(StationAssignment).where(
                and_(
                    extract("year", StationAssignment.date) == payload.currentYear,
                    extract("month", StationAssignment.date) == payload.currentMonth,
                    StationAssignment.user_id != None,
                )
            )
        )

    weekdays = get_weekdays(
        payload.currentYear,
        payload.currentMonth,
        list(range(1, payload.daysInMonth + 1))
    )

    assignments = solve_schedule(
        users, stations,
        days=weekdays,
        constraints=payload.constraints,
        existing_assignments=existing_assignments,
    )

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
        if a["user_id"] is None or (a["user_id"], a["station_id"], a["day"]) not in existing_keys
    ]

    db.add_all(db_assignments)
    await db.commit()

    placeholder_result = await db.execute(
        select(StationAssignment)
        .where(
            extract("year", StationAssignment.date) == payload.currentYear,
            extract("month", StationAssignment.date) == payload.currentMonth,
            StationAssignment.user_id == None,
        )
        .options(selectinload(StationAssignment.station))
    )
    placeholders = placeholder_result.scalars().all()

    response = {"created": len([a for a in db_assignments if a.user_id is not None])}

    if placeholders:
        response["unassigned"] = [
            {"station": a.station.name, "day": a.date.day}
            for a in placeholders
        ]

    return response

@router.post("/reschedule", status_code=201)
async def reschedule(payload: SchedulePayload, db: AsyncSession = Depends(get_db)):
    users_result = await db.execute(select(User).options(selectinload(User.skill_relations)))
    stations_result = await db.execute(select(Station).options(selectinload(Station.skill_relations)))
    users = users_result.scalars().all()
    stations = stations_result.scalars().all()

    conflicting_assignments = []
    for c in payload.constraints:
        if not c.blockedDays:
            continue
        result = await db.execute(
            select(StationAssignment).where(
                extract("year", StationAssignment.date) == payload.currentYear,
                extract("month", StationAssignment.date) == payload.currentMonth,
                StationAssignment.user_id == c.user_id,
                extract("day", StationAssignment.date).in_(c.blockedDays),
            )
        )
        conflicting_assignments.extend(result.scalars().all())

    if not conflicting_assignments:
        return {"message": "No conflicts found, nothing to reschedule."}

    await db.execute(
        delete(StationAssignment).where(
            StationAssignment.id.in_([a.id for a in conflicting_assignments])
        )
    )

    remaining_result = await db.execute(
        select(StationAssignment).where(
            extract("year", StationAssignment.date) == payload.currentYear,
            extract("month", StationAssignment.date) == payload.currentMonth,
            StationAssignment.user_id != None,
            StationAssignment.date >= date.today(),
        )
    )
    remaining_assignments = remaining_result.scalars().all()

    weekdays = get_weekdays(
        payload.currentYear,
        payload.currentMonth,
        list(range(1, payload.daysInMonth + 1))
    )

    today = date.today()
    future_weekdays = [d for d in weekdays
    if date(payload.currentYear, payload.currentMonth, d) >= today
    ]

    assignments = solve_reschedule(
        users, stations,
        all_days=future_weekdays,
        constraints=payload.constraints,
        existing_assignments=remaining_assignments,
    )

    if assignments is None:
        raise HTTPException(
            status_code=409,
            detail="Es konnte kein gültiger Dienstplan gefunden werden. Überprüfe die Parameter."
        )

    # Replacing full month schedule with new solution
    # Delete only future assignments
    await db.execute(
        delete(StationAssignment).where(
            extract("year", StationAssignment.date) == payload.currentYear,
            extract("month", StationAssignment.date) == payload.currentMonth,
            StationAssignment.date >= today,
        )
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

    existing_keys = {(a.user_id, a.station_id, a.date.day) for a in remaining_assignments}
    new_keys = {(a["user_id"], a["station_id"], a["day"]) for a in assignments if a["user_id"]}

    response = {
        "dropped": len(existing_keys - new_keys),
        "added": len(new_keys - existing_keys),
        "unchanged": len(existing_keys & new_keys),
    }

    unassigned = [a for a in assignments if a["user_id"] is None]
    if unassigned:
        station_map = {s.id: s.name for s in stations}
        response["unassigned"] = [
            {"station": station_map[a["station_id"]], "day": a["day"]}
            for a in unassigned
        ]

    return response