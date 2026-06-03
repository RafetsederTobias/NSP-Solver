from schema.schedule_schema import UserConstraint
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, select
from models.Schedule import Schedule
from datetime import date, timedelta
from typing import List


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

        full_week_days: set[int] = set()
        for monday in affected_mondays:
            for day_num in _get_weekdays_of_week(monday):
                if 1 <= day_num <= last_day:
                    full_week_days.add(day_num)

        expanded.append(
            constraint.model_copy(update={"blockedDays": sorted(full_week_days)})
        )

    return expanded