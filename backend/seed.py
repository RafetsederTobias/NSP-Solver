import asyncio
from db import SessionLocal
from models.Station import Station
from models.Skill import Skill
from sqlalchemy import select, func

STATIONS = [
    {"name": "Leitung / V.",  "skills_needed": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Koord. TK",     "skills_needed": ["EKG", "Röntgen"]},
    {"name": "Koord. Amb.",   "skills_needed": ["Blutabnahme"]},
    {"name": "OP 1",          "skills_needed": ["Blutabnahme", "EKG"]},
    {"name": "OP 2",          "skills_needed": ["Blutabnahme", "EKG"]},
    {"name": "OP Vorb.",      "skills_needed": ["Röntgen"]},
    {"name": "KAT 1",         "skills_needed": ["Blutabnahme"]},
    {"name": "KAT 2",         "skills_needed": ["Blutabnahme"]},
    {"name": "KAT Vorb.",     "skills_needed": ["EKG", "Röntgen"]},
    {"name": "Laser",         "skills_needed": ["Röntgen"]},
    {"name": "IVOM",          "skills_needed": ["Blutabnahme", "Röntgen"]},
    {"name": "Stützpunkt",    "skills_needed": ["EKG"]},
    {"name": "EGR 3",         "skills_needed": ["Blutabnahme", "EKG"]},
    {"name": "Vers. Ass.",    "skills_needed": ["Röntgen"]},
    {"name": "Akut",          "skills_needed": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Lid",           "skills_needed": ["EKG"]},
    {"name": "Rondeau",       "skills_needed": ["Blutabnahme"]},
    {"name": "Allgemein",     "skills_needed": ["Röntgen"]},
    {"name": "Makula",        "skills_needed": ["Blutabnahme", "EKG"]},
    {"name": "Refr. VU",      "skills_needed": ["EKG", "Röntgen"]},
    {"name": "Kat VU",        "skills_needed": ["Blutabnahme"]},
    {"name": "Springer",      "skills_needed": ["Blutabnahme", "EKG", "Röntgen"]},
]

async def seed():
    async with SessionLocal() as db:
        count = await db.scalar(select(func.count()).select_from(Station))
        if count > 0:
            print("Already seeded, skipping.")
            return

        result = await db.execute(select(Skill))
        skills_by_name = {s.name: s for s in result.scalars().all()}

        for data in STATIONS:
            station = Station(
                name=data["name"],
                maxAssignments=1,
                skill_relations=[skills_by_name[s] for s in data["skills_needed"] if s in skills_by_name]
            )
            db.add(station)

        await db.commit()
        print(f"Seeded {len(STATIONS)} stations.")

if __name__ == "__main__":
    asyncio.run(seed())