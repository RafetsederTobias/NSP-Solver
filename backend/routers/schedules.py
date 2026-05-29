from datetime import date
from typing import List

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, extract, select, update, func, select
from asp.asp_service import solve_reschedule, solve_schedule
from models.StationAssignment import StationAssignment
from models.Schedule import Schedule
from models.Station import Station
from models.User import User
from db import get_db
from pydantic import BaseModel, ConfigDict, Field
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
    newPlan: bool
    alternativePlan: bool
    constraints: List[UserConstraint]

class ScheduleResponse(BaseModel):
    id: int
    name: str
    year: int
    month: int
    is_loaded: bool

    model_config = ConfigDict(from_attributes=True)


def get_weekdays(year: int, month: int, days: list[int]) -> list[int]:
    return [
        d for d in days
        if date(year, month, d).weekday() < 5
    ]

async def get_or_create_schedule(
    db: AsyncSession,
    year: int,
    month: int,
    new_plan: bool
) -> int:
    count_result = await db.execute(
        select(func.count()).where(
            Schedule.year == year,
            Schedule.month == month,
        )
    )
    count = count_result.scalar()
    name = f"Plan {year}-{month:02d}" if count == 0 else f"Plan {year}-{month:02d} #{count + 1}"

    if new_plan:
        await db.execute(
            update(Schedule)
            .where(Schedule.year == year, Schedule.month == month, Schedule.is_loaded == True)
            .values(is_loaded=False)
        )
        new_schedule = Schedule(name=name, year=year, month=month, is_loaded=True)
        db.add(new_schedule)
        await db.flush()
        return new_schedule.id
    else:
        result = await db.execute(
            select(Schedule).where(
                Schedule.year == year,
                Schedule.month == month,
                Schedule.is_loaded == True
            )
        )
        existing_schedule = result.scalar_one_or_none()

        if existing_schedule is None:
            new_schedule = Schedule(name=name, year=year, month=month, is_loaded=True)
            db.add(new_schedule)
            await db.flush()
            return new_schedule.id

        return existing_schedule.id


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

    if payload.newPlan:
        # Create a new schedule
        schedule_id = await get_or_create_schedule(db, payload.currentYear, payload.currentMonth, new_plan=True)
        existing_assignments = []
    else:
        # Reuse the existing loaded schedule
        schedule_id = await get_or_create_schedule(db, payload.currentYear, payload.currentMonth, new_plan=False)

        if payload.keepExistingAssignments:
            # Load existing user assignments to pass to solver
            existing_result = await db.execute(
                select(StationAssignment).where(
                    StationAssignment.schedule_id == schedule_id,
                    StationAssignment.user_id != None,
                )
            )
            existing_assignments = existing_result.scalars().all()
        else:
            # Wipe everything in this schedule
            await db.execute(
                delete(StationAssignment).where(
                    StationAssignment.schedule_id == schedule_id
                )
            )
            existing_assignments = []

        # Always clear placeholders for the current schedule before re-solving
        await db.execute(
            delete(StationAssignment).where(
                StationAssignment.schedule_id == schedule_id,
                StationAssignment.user_id == None,
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
            schedule_id=schedule_id
        )
        for a in assignments
        if a["user_id"] is None or (a["user_id"], a["station_id"], a["day"]) not in existing_keys
    ]

    db.add_all(db_assignments)
    await db.commit()

    placeholder_result = await db.execute(
        select(StationAssignment)
        .where(
            StationAssignment.schedule_id == schedule_id,
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
            select(StationAssignment)
            .join(StationAssignment.schedule)
            .where(
                extract("year", StationAssignment.date) == payload.currentYear,
                extract("month", StationAssignment.date) == payload.currentMonth,
                StationAssignment.user_id == c.user_id,
                extract("day", StationAssignment.date).in_(c.blockedDays),
                Schedule.is_loaded == True,
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
        select(StationAssignment)
        .join(StationAssignment.schedule)
        .where(
            extract("year", StationAssignment.date) == payload.currentYear,
            extract("month", StationAssignment.date) == payload.currentMonth,
            StationAssignment.user_id != None,
            StationAssignment.date >= date.today(),
            Schedule.is_loaded == True,
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
        delete(StationAssignment)
        .where(
            StationAssignment.id.in_(
                select(StationAssignment.id)
                .join(StationAssignment.schedule)
                .where(
                    extract("year", StationAssignment.date) == payload.currentYear,
                    extract("month", StationAssignment.date) == payload.currentMonth,
                    StationAssignment.date >= today,
                    Schedule.is_loaded == True,
                )
            )
        )
    )

    result = await db.execute(
        select(Schedule).where(
            Schedule.year == payload.currentYear,
            Schedule.month == payload.currentMonth,
            Schedule.is_loaded == True
        )
    )
    loaded_schedule = result.scalar_one_or_none()

    if loaded_schedule is None:
        raise HTTPException(status_code=404, detail="No loaded schedule found for the given month/year")

    db_assignments = [
        StationAssignment(
            date=date(payload.currentYear, payload.currentMonth, a["day"]),
            station_id=a["station_id"],
            user_id=a["user_id"],
            schedule_id=loaded_schedule.id
        )
        for a in assignments
    ]
    db.add_all(db_assignments)
    await db.commit()

    user_map = {u.id: u.name for u in users}
    station_map = {s.id: s.name for s in stations}

    conflicting_set = {(a.user_id, a.station_id, a.date.day) for a in conflicting_assignments}
    existing_set = {(a.user_id, a.station_id, a.date.day) for a in remaining_assignments} | conflicting_set

    new_set = {(a["user_id"], a["station_id"], a["day"]) for a in assignments if a["user_id"]}

    def format_assignment(user_id, station_id, day):
        return {
            "day": day,
            "person": user_map.get(user_id, f"User {user_id}"),
            "station": station_map.get(station_id, f"Station {station_id}"),
        }


    response = {
        "dropped": [
            format_assignment(uid, sid, day)
            for uid, sid, day in (existing_set - new_set)
        ],
        "added": [
            format_assignment(uid, sid, day)
            for uid, sid, day in (new_set - existing_set)
        ],
    }


    unassigned = [a for a in assignments if a["user_id"] is None]
    if unassigned:
        station_map = {s.id: s.name for s in stations}
        response["unassigned"] = [
            {"station": station_map[a["station_id"]], "day": a["day"]}
            for a in unassigned
        ]

    print(response)
    return response


@router.get("/schedules", response_model=list[ScheduleResponse])
async def get_all_schedules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Schedule).order_by(Schedule.year.desc(), Schedule.month.asc()))
    return result.scalars().all()