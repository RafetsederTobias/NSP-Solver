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
    {"name": "Anna Müller", "skills": ["EKG", "Röntgen"]},
    {"name": "Lukas Schmidt", "skills": ["Blutabnahme"]},
    {"name": "Marie Schneider", "skills": ["EKG"]},
    {"name": "Leon Fischer", "skills": ["Röntgen"]},
    {"name": "Laura Weber", "skills": ["Blutabnahme", "EKG"]},
    {"name": "Paul Wagner", "skills": ["Blutabnahme", "Röntgen"]},
    {"name": "Sophie Becker", "skills": ["EKG", "Röntgen"]},
    {"name": "Felix Hoffmann", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Emma Schäfer", "skills": ["EKG"]},
    {"name": "Jonas Koch", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Mia Bauer", "skills": ["Blutabnahme"]},
    {"name": "Noah Richter", "skills": ["EKG", "Röntgen"]},
    {"name": "Lena Klein", "skills": ["Blutabnahme", "EKG"]},
    {"name": "Tim Wolf", "skills": ["Blutabnahme", "Röntgen"]},
    {"name": "Leonie Schröder", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Ben Neumann", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Clara Schwarz", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "David Zimmermann", "skills": ["EKG", "Röntgen"]},
    {"name": "Hannah Braun", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Julian Krüger", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Nina Hofmann", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Max Hartmann", "skills": ["Blutabnahme"]},
    {"name": "Sarah Lange", "skills": ["EKG", "Röntgen"]},
    {"name": "Tom Schmitt", "skills": ["Blutabnahme", "EKG"]},
    {"name": "Julia Werner", "skills": ["Blutabnahme", "Röntgen"]},
    {"name": "Philipp Schmitz", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Katharina Krause", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Daniel Meier", "skills": ["Blutabnahme"]},
    {"name": "Vanessa Lehmann", "skills": ["EKG", "Röntgen"]},
    {"name": "Sebastian Schulz", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Alina Maier", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Robin Herrmann", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Melanie König", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Tobias Frank", "skills": ["EKG", "Röntgen"]},
    {"name": "Franziska Vogel", "skills": ["Blutabnahme", "EKG"]},
    {"name": "Andreas Graf", "skills": ["Blutabnahme", "Röntgen"]},
    {"name": "Stefanie Sommer", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Marco Haas", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Carina Seidel", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Patrick Brandt", "skills": ["EKG", "Röntgen"]},
    {"name": "Lisa Otto", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Erik Sauer", "skills": ["EKG"]},
    {"name": "Monika Bergmann", "skills": ["Röntgen"]},
    {"name": "Heike Busch", "skills": ["Blutabnahme"]},
    {"name": "Dennis Roth", "skills": ["EKG", "Röntgen"]},
    {"name": "Nadine Lorenz", "skills": ["Blutabnahme", "EKG"]},
    {"name": "Kevin Dietrich", "skills": ["Blutabnahme", "Röntgen"]},
    {"name": "Jasmin Günther", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Sven Berger", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Bianca Albrecht", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
    {"name": "Oliver Pohl", "skills": ["Blutabnahme", "EKG", "Röntgen"]},
]


async def seed():
    async with SessionLocal() as db:
   

        result = await db.execute(select(Skill))
        skills_by_name = {s.name: s for s in result.scalars().all()}

    

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