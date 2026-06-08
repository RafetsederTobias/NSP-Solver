from http.client import HTTPException

from asp.asp_service import solve_reschedule
from models.Station import StationAssignment
from schema.schedule_schema import SchedulePayload, UserConstraint
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select, update, func, select
from models.Schedule import Schedule
from datetime import date, timedelta
from typing import List


def get_weekdays(year: int, month: int, days: list[int]) -> list[int]:
    return [
        d for d in days
        if date(year, month, d).weekday() < 5
    ]

async def get_or_create_schedule(
    db: AsyncSession,
    year: int,
    month: int,
    new_plan: bool,
    load: bool = True, # needed for alternative plans, they shouldnt be loaded immediately unlike when creating one with new plan
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
        if load:
            await db.execute(
                update(Schedule)
                .where(Schedule.year == year, Schedule.month == month, Schedule.is_loaded == True)
                .values(is_loaded=False)
            )
        new_schedule = Schedule(name=name, year=year, month=month, is_loaded=load)  # <-- respects load
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
    


def _get_week_monday(d: date) -> date:
    """Return the Monday of the week containing the given date."""
    return d - timedelta(days=d.weekday())


def _get_weekdays_of_week(monday: date) -> List[int]:
    """Return day-of-month ints for Mon-Fri of the week starting at monday."""
    return [(monday + timedelta(days=offset)).day for offset in range(5)]


def expand_blocked_days_to_full_weeks(
    constraints: List[UserConstraint],
    year: int,
    month: int,
) -> List[UserConstraint]:
    """
    For each UserConstraint whose blockedDays list contains 2 or more entries,
    expand blockedDays to include every weekday (Mon–Fri) of every week that
    any blocked day falls in.

    Days outside the given month are excluded from the result.

    Returns a new list of UserConstraint instances(originals are not mutated)

    """
    if month == 12:
        last_day = 31
    else:
        last_day = (date(year, month + 1, 1) - timedelta(days=1)).day

    expanded: List[UserConstraint] = []

    for constraint in constraints:
        blocked = constraint.blockedDays

        if not blocked or len(blocked) < 2:
            expanded.append(constraint)
            continue

        affected_mondays: set[date] = set()
        for day_num in blocked:
            d = date(year, month, day_num)
            affected_mondays.add(_get_week_monday(d))

        full_week_days: set[int] = set(blocked)
        for monday in affected_mondays:
            blocked_in_week = [
                day_num for day_num in blocked
                if _get_week_monday(date(year, month, day_num)) == monday
            ]
            earliest_blocked = min(blocked_in_week)
            for day_num in _get_weekdays_of_week(monday):
                if day_num >= earliest_blocked and 1 <= day_num <= last_day:
                    full_week_days.add(day_num)

        expanded.append(
            constraint.model_copy(update={"blockedDays": sorted(full_week_days)})
        )

    return expanded

async def create_alternative_schedule(
    db: AsyncSession,
    users,
    stations,
    weekdays,
    payload: SchedulePayload,
    db_assignments: list,
) -> int:
    alt_schedule_id = await get_or_create_schedule(
        db, payload.currentYear, payload.currentMonth, new_plan=True, load=False
    )

    alt_assignments = solve_reschedule(
        users,
        stations,
        all_days=weekdays,
        constraints=expand_blocked_days_to_full_weeks(
            payload.constraints, payload.currentYear, payload.currentMonth
        ),
        existing_assignments=db_assignments,
    )

    if not alt_assignments:
        raise HTTPException(
            status_code=409,
            detail="Es konnte kein gültiger Alternativplan gefunden werden."
        )

    alt_db_assignments = [
        StationAssignment(
            date=date(payload.currentYear, payload.currentMonth, a["day"]),
            station_id=a["station_id"],
            user_id=a["user_id"],
            schedule_id=alt_schedule_id,
        )
        for a in alt_assignments
    ]

    db.add_all(alt_db_assignments)
    await db.commit()

    return alt_schedule_id


async def prepare_existing_assignments(
    db: AsyncSession,
    payload: SchedulePayload,
    schedule_id: int,
    old_schedule_id: int | None = None,
) -> list:
    if payload.keepExistingAssignments and old_schedule_id:
        existing_result = await db.execute(
            select(StationAssignment).where(
                StationAssignment.schedule_id == old_schedule_id,
                StationAssignment.user_id != None,
            )
        )
        existing_assignments = existing_result.scalars().all()
        if payload.newPlan:
            db.add_all([
                StationAssignment(date=a.date, station_id=a.station_id, user_id=a.user_id, schedule_id=schedule_id)
                for a in existing_assignments
            ])
            await db.flush()
    else:
        await db.execute(delete(StationAssignment).where(StationAssignment.schedule_id == schedule_id))
        existing_assignments = []

    return existing_assignments