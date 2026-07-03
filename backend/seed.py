import asyncio
from models.StationAssignment import StationAssignment
from db import SessionLocal
from models.Station import Station, station_skills
from models.Skill import Skill
from models.User import User, user_skills
from sqlalchemy import delete, select, func

STATIONS = [
    {"name": "Leitung / V.",  "skills_needed": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Koord. TK",     "skills_needed": ["Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Koord. Amb.",   "skills_needed": ["Sehtest", "Perimetrie"]},
    {"name": "OP 1",          "skills_needed": ["Sehtest", "Tonometrie"]},
    {"name": "OP 2",          "skills_needed": ["Sehtest", "Spaltlampenuntersuchung"]},
    {"name": "OP Vorb.",      "skills_needed": ["OCT", "Tonometrie"]},
    {"name": "KAT 1",         "skills_needed": ["Sehtest"]},
    {"name": "KAT 2",         "skills_needed": ["Sehtest", "Perimetrie"]},
    {"name": "KAT Vorb.",     "skills_needed": ["Spaltlampenuntersuchung", "OCT"]},
    {"name": "Laser",         "skills_needed": ["OCT", "Tonometrie"]},
    {"name": "IVOM",          "skills_needed": ["Sehtest", "OCT"]},
    {"name": "Stützpunkt",    "skills_needed": ["Spaltlampenuntersuchung", "Perimetrie"]},
    {"name": "EGR 3",         "skills_needed": ["Sehtest", "Spaltlampenuntersuchung"]},
    {"name": "Vers. Ass.",    "skills_needed": ["OCT"]},
    {"name": "Akut",          "skills_needed": ["Sehtest", "OCT", "Tonometrie"]},
    {"name": "Lid",           "skills_needed": ["Spaltlampenuntersuchung"]},
    {"name": "Rondeau",       "skills_needed": ["Sehtest"]},
    {"name": "Allgemein",     "skills_needed": ["OCT", "Perimetrie"]},
    {"name": "Makula",        "skills_needed": ["Sehtest", "OCT"]},
    {"name": "Refr. VU",      "skills_needed": ["Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Kat VU",        "skills_needed": ["Sehtest", "Tonometrie"]},
    {"name": "Springer",      "skills_needed": ["Tonometrie", "Perimetrie"]},
]
USERS = [
    {"name": "Anna Müller", "skills": ["Spaltlampenuntersuchung", "OCT", "Tonometrie", "Perimetrie"]},
    {"name": "Lukas Schmidt", "skills": ["Sehtest", "Perimetrie", "OCT"]},
    {"name": "Marie Schneider", "skills": ["Spaltlampenuntersuchung", "OCT"]},
    {"name": "Leon Fischer", "skills": ["OCT", "Tonometrie", "Sehtest"]},
    {"name": "Laura Weber", "skills": ["Sehtest", "Spaltlampenuntersuchung", "Perimetrie", "OCT"]},
    {"name": "Paul Wagner", "skills": ["Sehtest", "OCT", "Tonometrie"]},
    {"name": "Sophie Becker", "skills": ["Spaltlampenuntersuchung", "OCT", "Perimetrie", "Sehtest"]},
    {"name": "Felix Hoffmann", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie", "Perimetrie"]},
    {"name": "Emma Schäfer", "skills": ["Spaltlampenuntersuchung", "OCT"]},
    {"name": "Jonas Koch", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Mia Bauer", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Noah Richter", "skills": ["Spaltlampenuntersuchung", "OCT", "Sehtest"]},
    {"name": "Lena Klein", "skills": ["Sehtest", "Spaltlampenuntersuchung", "Tonometrie", "OCT"]},
    {"name": "Tim Wolf", "skills": ["Sehtest", "OCT", "Perimetrie"]},
    {"name": "Leonie Schröder", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie", "Tonometrie"]},
    {"name": "Ben Neumann", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie", "Perimetrie"]},
    {"name": "Clara Schwarz", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "David Zimmermann", "skills": ["Spaltlampenuntersuchung", "OCT", "Sehtest"]},
    {"name": "Hannah Braun", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Julian Krüger", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Nina Hofmann", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie", "Perimetrie"]},
    {"name": "Max Hartmann", "skills": ["Sehtest", "OCT", "Perimetrie"]},
    {"name": "Sarah Lange", "skills": ["Spaltlampenuntersuchung", "OCT", "Sehtest"]},
    {"name": "Tom Schmitt", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Julia Werner", "skills": ["Sehtest", "OCT", "Tonometrie"]},
    {"name": "Philipp Schmitz", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Katharina Krause", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Daniel Meier", "skills": ["Sehtest", "OCT", "Perimetrie"]},
    {"name": "Vanessa Lehmann", "skills": ["Spaltlampenuntersuchung", "OCT", "Sehtest"]},
    {"name": "Sebastian Schulz", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie", "Perimetrie"]},
    {"name": "Alina Maier", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Robin Herrmann", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Melanie König", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Tobias Frank", "skills": ["Spaltlampenuntersuchung", "OCT", "Sehtest"]},
    {"name": "Franziska Vogel", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Andreas Graf", "skills": ["Sehtest", "OCT", "Tonometrie", "Perimetrie"]},
    {"name": "Stefanie Sommer", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie", "Tonometrie"]},
    {"name": "Marco Haas", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Carina Seidel", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Patrick Brandt", "skills": ["Spaltlampenuntersuchung", "OCT", "Tonometrie", "Sehtest"]},
    {"name": "Lisa Otto", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
]


async def seed():
    async with SessionLocal() as db:

        await db.execute(delete(station_skills))
        await db.execute(delete(user_skills))
        await db.execute(delete(StationAssignment))
        await db.execute(delete(Station))
        await db.execute(delete(User))

        result = await db.execute(select(Skill))
        skills_by_name = {s.name: s for s in result.scalars().all()}

        for data in STATIONS:
            station = Station(
                name=data["name"],
                maxAssignments=3,
                skill_relations=[skills_by_name[s] for s in data["skills_needed"]]
            )
            db.add(station)

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