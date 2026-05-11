import asyncio
from db import SessionLocal
from models.Station import Station
from models.Skill import Skill
from models.User import User
from sqlalchemy import delete, select, func

STATIONS = [
    {"name": "Leitung / V.",  "skills_needed": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie", "Perimetrie"]},
    {"name": "Koord. TK",     "skills_needed": ["Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Koord. Amb.",   "skills_needed": ["Sehtest", "Perimetrie"]},
    {"name": "OP 1",          "skills_needed": ["Sehtest", "Spaltlampenuntersuchung", "Tonometrie"]},
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
    {"name": "Akut",          "skills_needed": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Lid",           "skills_needed": ["Spaltlampenuntersuchung"]},
    {"name": "Rondeau",       "skills_needed": ["Sehtest"]},
    {"name": "Allgemein",     "skills_needed": ["OCT", "Perimetrie"]},
    {"name": "Makula",        "skills_needed": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Refr. VU",      "skills_needed": ["Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Kat VU",        "skills_needed": ["Sehtest", "Tonometrie"]},
    {"name": "Springer",      "skills_needed": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie", "Perimetrie"]},
]

USERS = [
    {"name": "Anna Müller", "skills": ["Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Lukas Schmidt", "skills": ["Sehtest", "Perimetrie"]},
    {"name": "Marie Schneider", "skills": ["Spaltlampenuntersuchung"]},
    {"name": "Leon Fischer", "skills": ["OCT", "Tonometrie"]},
    {"name": "Laura Weber", "skills": ["Sehtest", "Spaltlampenuntersuchung", "Perimetrie"]},
    {"name": "Paul Wagner", "skills": ["Sehtest", "OCT"]},
    {"name": "Sophie Becker", "skills": ["Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Felix Hoffmann", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Emma Schäfer", "skills": ["Spaltlampenuntersuchung"]},
    {"name": "Jonas Koch", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Mia Bauer", "skills": ["Sehtest"]},
    {"name": "Noah Richter", "skills": ["Spaltlampenuntersuchung", "OCT"]},
    {"name": "Lena Klein", "skills": ["Sehtest", "Spaltlampenuntersuchung", "Tonometrie"]},
    {"name": "Tim Wolf", "skills": ["Sehtest", "OCT"]},
    {"name": "Leonie Schröder", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Ben Neumann", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Clara Schwarz", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "David Zimmermann", "skills": ["Spaltlampenuntersuchung", "OCT"]},
    {"name": "Hannah Braun", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Julian Krüger", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Nina Hofmann", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Max Hartmann", "skills": ["Sehtest"]},
    {"name": "Sarah Lange", "skills": ["Spaltlampenuntersuchung", "OCT"]},
    {"name": "Tom Schmitt", "skills": ["Sehtest", "Spaltlampenuntersuchung"]},
    {"name": "Julia Werner", "skills": ["Sehtest", "OCT"]},
    {"name": "Philipp Schmitz", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Katharina Krause", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Daniel Meier", "skills": ["Sehtest"]},
    {"name": "Vanessa Lehmann", "skills": ["Spaltlampenuntersuchung", "OCT"]},
    {"name": "Sebastian Schulz", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Alina Maier", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Robin Herrmann", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Melanie König", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Tobias Frank", "skills": ["Spaltlampenuntersuchung", "OCT"]},
    {"name": "Franziska Vogel", "skills": ["Sehtest", "Spaltlampenuntersuchung"]},
    {"name": "Andreas Graf", "skills": ["Sehtest", "OCT"]},
    {"name": "Stefanie Sommer", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Marco Haas", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Carina Seidel", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Patrick Brandt", "skills": ["Spaltlampenuntersuchung", "OCT"]},
    {"name": "Lisa Otto", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Erik Sauer", "skills": ["Spaltlampenuntersuchung"]},
    {"name": "Monika Bergmann", "skills": ["OCT"]},
    {"name": "Heike Busch", "skills": ["Sehtest"]},
    {"name": "Dennis Roth", "skills": ["Spaltlampenuntersuchung", "OCT"]},
    {"name": "Nadine Lorenz", "skills": ["Sehtest", "Spaltlampenuntersuchung"]},
    {"name": "Kevin Dietrich", "skills": ["Sehtest", "OCT"]},
    {"name": "Jasmin Günther", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Sven Berger", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Bianca Albrecht", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Oliver Pohl", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
]


async def seed():
    async with SessionLocal() as db:

        await db.execute(delete(Station))
        await db.execute(delete(User))

        result = await db.execute(select(Skill))
        skills_by_name = {s.name: s for s in result.scalars().all()}

        for data in STATIONS:
            station = Station(
                name=data["name"],
                maxAssignments=1,
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