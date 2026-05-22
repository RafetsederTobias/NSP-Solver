import threading

import clingo
from pathlib import Path

RULES_FILE = Path(__file__).parent / "rules.lp"
RESCHEDULE_RULES_FILE = Path(__file__).parent / "reschedule.lp"


def solve_schedule(
    users,
    stations,
    days,
    constraints=None,
    existing_assignments=None,
) -> list[dict]:
    facts = _build_base_facts(
        users=users,
        stations=stations,
        days=days,
        constraints=constraints,
    )

    if existing_assignments:
        for a in existing_assignments:
            facts += f"assigned({a.user_id}, {a.station_id}, {a.date.day}).\n"

    result = _run_clingo(facts)
    assignments = result if result is not None else []

    return _fill_unassigned_slots(assignments, stations, days)


def solve_reschedule(
    users,
    stations,
    all_days,
    constraints,
    existing_assignments,
) -> list[dict]:
    facts = _build_base_facts(
        users=users,
        stations=stations,
        days=all_days,
        constraints=constraints,
    )

    for a in existing_assignments:
        facts += f"was_assigned({a.user_id}, {a.station_id}, {a.date.day}).\n"

    result = _run_clingo(facts, rules_file=RESCHEDULE_RULES_FILE)
    assignments = result if result is not None else []

    return _fill_unassigned_slots(assignments, stations, all_days)


def _build_base_facts(users, stations, days, constraints=None) -> str:
    facts = ""

    facts += _build_user_facts(users)
    facts += _build_station_facts(stations)
    facts += _build_day_facts(days)
    facts += _build_constraint_facts(constraints)

    return facts


def _build_user_facts(users) -> str:
    facts = ""

    for u in users:
        facts += f"user({u.id}).\n"

        for skill in u.skill_relations:
            facts += f"has_skill({u.id}, {skill.id}).\n"

    return facts


def _build_station_facts(stations) -> str:
    facts = ""

    for s in stations:
        facts += f"station({s.id}).\n"
        facts += f"max_assignments({s.id}, {s.maxAssignments}).\n"

        for skill in s.skill_relations:
            facts += f"requires({s.id}, {skill.id}).\n"

    return facts


def _build_day_facts(days) -> str:
    return "".join(f"day({d}).\n" for d in days)


def _build_constraint_facts(constraints) -> str:
    if not constraints:
        return ""

    facts = ""

    for c in constraints:
        if c.maxDaysPerMonth is not None:
            facts += f"max_days({c.user_id}, {c.maxDaysPerMonth}).\n"

        if c.minDaysPerMonth is not None:
            facts += f"min_days({c.user_id}, {c.minDaysPerMonth}).\n"

        if c.exactDaysPerMonth is not None:
            facts += f"exact_days({c.user_id}, {c.exactDaysPerMonth}).\n"

        if c.fixedDays:
            for d in c.fixedDays:
                facts += f"fixed_day({c.user_id}, {d}).\n"

        if c.blockedDays:
            for d in c.blockedDays:
                facts += f"blocked_day({c.user_id}, {d}).\n"

    return facts


def _fill_unassigned_slots(assignments, stations, days) -> list[dict]:
    assigned_pairs = {
        (a["station_id"], a["day"])
        for a in assignments
    }

    for s in stations:
        for d in days:
            if (s.id, d) not in assigned_pairs:
                assignments.append({
                    "user_id": None,
                    "station_id": s.id,
                    "day": d,
                })

    return assignments


def _run_clingo(
    facts: str,
    timeout_seconds: int = 15,
    rules_file: Path = RULES_FILE,
) -> list[dict] | None:

    def solve(extra_rules: str = "", timeout: int = timeout_seconds) -> list[dict]:
        ctl = clingo.Control(["--models=0", "--heuristic=Domain"])
        ctl.load(str(rules_file))
        ctl.add("base", [], facts)
        if extra_rules:
            ctl.add("base", [], extra_rules)
        ctl.ground([("base", [])])

        best_model = []

        def on_model(model):
            nonlocal best_model
            current = []
            for atom in model.symbols(shown=True):
                if atom.name == "assigned":
                    current.append({
                        "user_id": int(str(atom.arguments[0])),
                        "station_id": int(str(atom.arguments[1])),
                        "day": int(str(atom.arguments[2])),
                    })
            best_model = current
            print(f"New best model found, cost: {model.cost}, proven optimal: {model.optimality_proven}")

        handle = ctl.solve(on_model=on_model, async_=True)

        done = threading.Event()
        threading.Thread(target=lambda: (handle.wait(), done.set()), daemon=True).start()

        if not done.wait(timeout=timeout):
            print(f"Timeout after {timeout}s, cancelling...")
            handle.cancel()
            handle.wait()
        else:
            print("Clingo finished before timeout")

        return best_model

    FORCE_STAFFING = """
    :- station(S), day(D), not assigned(_, S, D).
    """

    print("Phase 1: trying with forced staffing...")
    result = solve(FORCE_STAFFING, timeout=15)

    if result:
        print("Phase 1 found a solution, returning...")
        return result

    print("Phase 2: falling back to soft optimization...")
    return solve(timeout=60)