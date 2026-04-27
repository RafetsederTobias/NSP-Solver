import clingo
import threading
from pathlib import Path
from collections import defaultdict

RULES_FILE = Path(__file__).parent / "rules.lp"


def solve_schedule(users, stations, days, constraints=None, existing_assignments=None) -> list[dict]:
    constraints = constraints or []
    existing_assignments = existing_assignments or []
    constraint_map = {c.user_id: c for c in constraints}

    user_skills = {u.id: {sk.id for sk in u.skill_relations} for u in users}
    station_skills = {s.id: {sk.id for sk in s.skill_relations} for s in stations}
    station_max = {s.id: s.maxAssignments for s in stations}

    # Tracking state across days
    days_worked = defaultdict(int)         # user_id -> total days assigned so far
    user_day_assigned = defaultdict(set)   # user_id -> set of days assigned

    all_assignments = []

    # Pin existing assignments into state
    existing_keys = set()
    for a in existing_assignments:
        d = a.date.day
        uid, sid = a.user_id, a.station_id
        all_assignments.append({"user_id": uid, "station_id": sid, "day": d})
        days_worked[uid] += 1
        user_day_assigned[uid].add(d)
        existing_keys.add((uid, sid, d))

    # Solve day by day
    for d in days:
        day_assignments = _solve_single_day(
            d=d,
            users=users,
            stations=stations,
            user_skills=user_skills,
            station_skills=station_skills,
            station_max=station_max,
            days_worked=days_worked,
            user_day_assigned=user_day_assigned,
            constraint_map=constraint_map,
            existing_assignments=existing_assignments,
        )

        for a in day_assignments:
            uid = a["user_id"]
            days_worked[uid] += 1
            user_day_assigned[uid].add(d)
            all_assignments.append(a)

    # Post-pass: repair min/exact day violations greedily
    all_assignments = _repair_min_days(
        all_assignments=all_assignments,
        users=users,
        stations=stations,
        days=days,
        user_skills=user_skills,
        station_skills=station_skills,
        station_max=station_max,
        days_worked=days_worked,
        user_day_assigned=user_day_assigned,
        constraint_map=constraint_map,
        existing_keys=existing_keys,
    )

    return all_assignments


def _solve_single_day(
    d, users, stations, user_skills, station_skills, station_max,
    days_worked, user_day_assigned, constraint_map, existing_assignments
) -> list[dict]:

    # Build facts for this single day
    lines = []

    for u in users:
        uid = u.id
        c = constraint_map.get(uid)

        # Skip users already assigned today or blocked today
        if d in user_day_assigned[uid]:
            continue
        if c and c.blockedDays and d in c.blockedDays:
            continue

        # Skip users who have reached their max days
        max_d = None
        if c:
            if c.exactDaysPerMonth is not None:
                max_d = c.exactDaysPerMonth
            elif c.maxDaysPerMonth is not None:
                max_d = c.maxDaysPerMonth
        if max_d is not None and days_worked[uid] >= max_d:
            continue

        lines.append(f"user({uid}).")
        for skill_id in user_skills[uid]:
            lines.append(f"has_skill({uid}, {skill_id}).")

        # Mark users who must work today
        if c and c.fixedDays and d in c.fixedDays:
            lines.append(f"fixed_today({uid}).")

    for s in stations:
        sid = s.id
        lines.append(f"station({sid}).")
        lines.append(f"max_assignments({sid}, {station_max[sid]}).")
        for skill_id in station_skills[sid]:
            lines.append(f"requires({sid}, {skill_id}).")

    # Pin already-existing assignments for today
    for a in existing_assignments:
        if a.date.day == d:
            lines.append(f"pinned({a.user_id}, {a.station_id}).")

    facts = "\n".join(lines)

    result = _run_clingo_day(facts)

    # If ASP found nothing, fall back to greedy for this day
    if not result:
        result = _greedy_day(
            d=d,
            users=users,
            station_skills=station_skills,
            station_max=station_max,
            user_skills=user_skills,
            days_worked=days_worked,
            user_day_assigned=user_day_assigned,
            constraint_map=constraint_map,
        )

    return [{"user_id": a["user_id"], "station_id": a["station_id"], "day": d} for a in result]


def _run_clingo_day(facts: str) -> list[dict] | None:
    ctl = clingo.Control([
        "--models=1",
        "--configuration=handy",
        "--sign-def=neg",
    ])

    # Single-day rules inline (no monthly constraints here)
    program = facts + """
% Choice rule: assign up to Max users per station
{ assigned(U, S) : user(U) } Max :- station(S), max_assignments(S, Max).

% Pinned assignments are forced
assigned(U, S) :- pinned(U, S).

% A user can only work one station per day
:- user(U), assigned(U, S1), assigned(U, S2), S1 != S2.

% Skill constraint
:- assigned(U, S), requires(S, Sk), not has_skill(U, Sk).

% Fixed-today users must be assigned somewhere
:- fixed_today(U), not assigned(U, _).

% Optimization: maximize number of users assigned
#maximize { 1,U,S : assigned(U, S) }.
"""

    ctl.add("base", [], program)
    ctl.ground([("base", [])])

    results = []
    satisfiable = False

    with ctl.solve(yield_=True) as handle:
        timer = threading.Timer(5.0, handle.cancel)  # 5s per day is plenty
        try:
            timer.start()
            for model in handle:
                satisfiable = True
                results = []  # take the last (optimal) model
                for atom in model.symbols(shown=True):
                    if atom.name == "assigned":
                        results.append({
                            "user_id": int(str(atom.arguments[0])),
                            "station_id": int(str(atom.arguments[1])),
                        })
        finally:
            timer.cancel()

    return results if satisfiable else None


def _greedy_day(d, users, station_skills, station_max, user_skills,
                days_worked, user_day_assigned, constraint_map) -> list[dict]:
    """Fallback greedy for a single day if ASP finds nothing."""
    day_station_count = defaultdict(int)
    assigned_today = set()
    results = []

    for sid, max_slots in station_max.items():
        required = station_skills[sid]
        while day_station_count[sid] < max_slots:
            eligible = []
            for u in users:
                uid = u.id
                if uid in assigned_today:
                    continue
                if d in user_day_assigned[uid]:
                    continue
                c = constraint_map.get(uid)
                if c and c.blockedDays and d in c.blockedDays:
                    continue
                if not required.issubset(user_skills[uid]):
                    continue
                max_d = None
                if c:
                    if c.exactDaysPerMonth is not None:
                        max_d = c.exactDaysPerMonth
                    elif c.maxDaysPerMonth is not None:
                        max_d = c.maxDaysPerMonth
                if max_d is not None and days_worked[uid] >= max_d:
                    continue
                eligible.append(u)

            if not eligible:
                break

            eligible.sort(key=lambda u: days_worked[u.id])
            chosen = eligible[0]
            results.append({"user_id": chosen.id, "station_id": sid})
            assigned_today.add(chosen.id)
            day_station_count[sid] += 1

    return results


def _repair_min_days(
    all_assignments, users, stations, days, user_skills, station_skills,
    station_max, days_worked, user_day_assigned, constraint_map, existing_keys
) -> list[dict]:
    """
    Post-pass: for users below their min/exact day target,
    greedily insert them into days that still have open slots.
    """
    # Count open slots per (day, station)
    slot_usage = defaultdict(int)
    for a in all_assignments:
        slot_usage[(a["day"], a["station_id"])] += 1

    for u in users:
        uid = u.id
        c = constraint_map.get(uid)
        if not c:
            continue

        min_days = None
        if c.exactDaysPerMonth is not None:
            min_days = c.exactDaysPerMonth
        elif c.minDaysPerMonth is not None:
            min_days = c.minDaysPerMonth

        if min_days is None or days_worked[uid] >= min_days:
            continue

        for d in days:
            if days_worked[uid] >= min_days:
                break
            if d in user_day_assigned[uid]:
                continue
            if c.blockedDays and d in c.blockedDays:
                continue

            for s in stations:
                sid = s.id
                if not station_skills[sid].issubset(user_skills[uid]):
                    continue
                if slot_usage[(d, sid)] >= station_max[sid]:
                    continue

                all_assignments.append({"user_id": uid, "station_id": sid, "day": d})
                days_worked[uid] += 1
                user_day_assigned[uid].add(d)
                slot_usage[(d, sid)] += 1
                break

    return all_assignments