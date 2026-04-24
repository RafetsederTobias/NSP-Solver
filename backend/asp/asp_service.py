import clingo
from pathlib import Path

RULES_FILE = Path(__file__).parent / "rules.lp"

def solve_schedule(users: list[str], stations: list[str], days: list[int], constraints: list = None, existing_assignments=None) -> list[dict]:
    ctl = clingo.Control(["--models=1"])
    ctl.load(str(RULES_FILE))

    facts = ""
    for u in users:
        facts += f"user({u.id}).\n"
        for skill in u.skill_relations:
            facts += f"has_skill({u.id}, {skill.id}).\n"

    for s in stations:
        facts += f"station({s.id}).\n"
        facts += f"max_assignments({s.id}, {s.maxAssignments}).\n"
        for skill in s.skill_relations:
            facts += f"requires({s.id}, {skill.id}).\n"

    for d in days:
        facts += f"day({d}).\n"

    if existing_assignments:
        for a in existing_assignments:
            print(a.user_id, a.station_id, a.date.day)
            facts += f"assigned({a.user_id}, {a.station_id}, {a.date.day}).\n"

    if constraints:
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

    ctl.add("base", [], facts)
    ctl.ground([("base", [])])
    results = []
    with ctl.solve(yield_=True) as handle:
        for model in handle:
            for atom in model.symbols(shown=True):
                if atom.name == "assigned":
                    results.append({
                        "user_id": int(str(atom.arguments[0])),
                        "station_id": int(str(atom.arguments[1])),
                        "day": int(str(atom.arguments[2])),
                    })
            break

    return results