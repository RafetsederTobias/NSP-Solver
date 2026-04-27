import asyncio
from db import SessionLocal
from models.Station import Station
from models.Skill import Skill
from models.User import User
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

USERS = [
    {"name": "User 1", "skills": ["EKG", "Röntgen"]},
    {"name": "User 2", "skills": ["Blutabnahme"]},
    {"name": "User 3", "skills": ["EKG"]},
    {"name": "User 4", "skills": ["Röntgen"]},
    {"name": "User 5", "skills": ["Blutabnahme", "EKG"]},
    {"name": "User 6", "skills": ["Blutabnahme", "Röntgen"]},
    {"name": "User 7", "skills": ["EKG", "Röntgen"]},
    {"name": "User 8", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 9", "skills": ["EKG"]},
    {"name": "User 10", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 11", "skills": ["Blutabnahme"]},
    {"name": "User 12", "skills": ["EKG", "Röntgen"]},
    {"name": "User 13", "skills": ["Blutabnahme", "EKG"]},
    {"name": "User 14", "skills": ["Blutabnahme", "Röntgen"]},
    {"name": "User 15", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 16", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 17", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 18", "skills": ["EKG", "Röntgen"]},
    {"name": "User 19", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 20", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 21", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 22", "skills": ["Blutabnahme"]},
    {"name": "User 23", "skills": ["EKG", "Röntgen"]},
    {"name": "User 24", "skills": ["Blutabnahme", "EKG"]},
    {"name": "User 25", "skills": ["Blutabnahme", "Röntgen"]},
    {"name": "User 26", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 27", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 28", "skills": ["Blutabnahme"]},
    {"name": "User 29", "skills": ["EKG", "Röntgen"]},
    {"name": "User 30", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 31", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 32", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 33", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 34", "skills": ["EKG", "Röntgen"]},
    {"name": "User 35", "skills": ["Blutabnahme", "EKG"]},
    {"name": "User 36", "skills": ["Blutabnahme", "Röntgen"]},
    {"name": "User 37", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 38", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 39", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 40", "skills": ["EKG", "Röntgen"]},
    {"name": "User 41", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 42", "skills": ["EKG"]},
    {"name": "User 43", "skills": ["Röntgen"]},
    {"name": "User 44", "skills": ["Blutabnahme"]},
    {"name": "User 45", "skills": ["EKG", "Röntgen"]},
    {"name": "User 46", "skills": ["Blutabnahme", "EKG"]},
    {"name": "User 47", "skills": ["Blutabnahme", "Röntgen"]},
    {"name": "User 48", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 49", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 50", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "User 51", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
]


async def seed():
    async with SessionLocal() as db:
        count = await db.scalar(select(func.count()).select_from(Station))
        if count > 0:
            print("Already seeded, skipping.")
            return

        result = await db.execute(select(Skill))
        skills_by_name = {s.name: s for s in result.scalars().all()}

        # Stations
        for data in STATIONS:
            station = Station(
                name=data["name"],
                maxAssignments=1,
                skill_relations=[skills_by_name[s] for s in data["skills_needed"]]
            )
            db.add(station)

        # Users
        for data in USERS:
            user = User(
                name=data["name"],
                skill_relations=[skills_by_name[s] for s in data["skills"]]
            )
            db.add(user)

        await db.commit()
        print("Seeded stations and users.")


if __name__ == "__main__":
    asyncio.run(seed())