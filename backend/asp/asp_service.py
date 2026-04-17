import clingo
from pathlib import Path

RULES_FILE = Path(__file__).parent / "rules.lp"

def solve_schedule(users: list[str], stations: list[str], days: list[int]) -> list[dict]:
    ctl = clingo.Control(["--models=1"])
    ctl.load(str(RULES_FILE))

    facts = ""
    for u in users:
        facts += f'user({u.id}, "{u.name}").\n'
    for s in stations:
        facts += f'station({s.id}, "{s.name}").\n'
    for d in days:
        facts += f"day({d}).\n"

    ctl.add("base", [], facts)
    ctl.ground([("base", [])])

   # user_map = {u.id: u.name for u in users}
   # station_map = {s.id: s.name for s in stations}

    results = []
    with ctl.solve(yield_=True) as handle:
        for model in handle:
            for atom in model.symbols(shown=True):
                if atom.name == "assigned":
                    uid = int(str(atom.arguments[0]))
                    sid = int(str(atom.arguments[1]))
                    results.append({
                        "user_id": uid,
                        #"user_name": user_map[uid],
                        "station_id": sid,
                        #"station_name": station_map[sid],
                        "day": int(str(atom.arguments[2])),
                    })
            break

    return results