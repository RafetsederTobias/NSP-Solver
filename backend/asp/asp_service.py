import clingo
from pathlib import Path

RULES_FILE = Path(__file__).parent / "rules.lp"

def solve_schedule(users: list[str], stations: list[str], days: list[int], constraints: list = None) -> list[dict]:
    ctl = clingo.Control(["--models=1"])
    ctl.load(str(RULES_FILE))

    facts = ""
    for u in users:
        facts += f"user({u.id}).\n"
        for skill in u.skill_relations:
            facts += f"has_skill({u.id}, {skill.id}).\n"

    for s in stations:
        facts += f"station({s.id}).\n"
        for skill in s.skill_relations:
            facts += f"requires({s.id}, {skill.id}).\n"

    for d in days:
        facts += f"day({d}).\n"

    if constraints:
        for c in constraints:
            if c.maxDaysPerMonth is not None:
                facts += f"max_days({c.user_id}, {c.maxDaysPerMonth}).\n"
            if c.minDaysPerMonth is not None:
                facts += f"min_days({c.user_id}, {c.minDaysPerMonth}).\n"
            if c.exactDaysPerMonth is not None:
                facts += f"exact_days({c.user_id}, {c.exactDaysPerMonth}).\n"

    ctl.add("base", [], facts)
    ctl.ground([("base", [])])

    results = []
    with ctl.solve(yield_=True) as handle:
        for model in handle:
            for atom in model.symbols(shown=True):
                if atom.name == "assigned":
                    uid = int(str(atom.arguments[0]))
                    sid = int(str(atom.arguments[1]))
                    results.append({
                        "user_id": uid,
                        "station_id": sid,
                        "day": int(str(atom.arguments[2])),
                    })
            break

    return results