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
    {"name": "Notaufnahme",   "skills_needed": ["Sehtest", "Spaltlampenuntersuchung", "Tonometrie"]},
    {"name": "Amb. OP",       "skills_needed": ["OCT", "Tonometrie"]},
    {"name": "Glaukom",       "skills_needed": ["Tonometrie", "Perimetrie"]},
    {"name": "Netzhaut",      "skills_needed": ["Sehtest", "OCT"]},
    {"name": "Kornea",        "skills_needed": ["Spaltlampenuntersuchung", "OCT"]},
    {"name": "Orthoptik",     "skills_needed": ["Sehtest", "Perimetrie"]},
    {"name": "Kontaktlinse",  "skills_needed": ["Spaltlampenuntersuchung", "Sehtest"]},
    {"name": "Ultraschall",   "skills_needed": ["OCT", "Spaltlampenuntersuchung"]},
    {"name": "Foto",          "skills_needed": ["OCT"]},
    {"name": "Angio",         "skills_needed": ["Sehtest", "OCT", "Perimetrie"]},
    {"name": "Strabismus",    "skills_needed": ["Sehtest", "Spaltlampenuntersuchung"]},
    {"name": "Trockenes Auge","skills_needed": ["Spaltlampenuntersuchung", "Tonometrie"]},
    {"name": "Okklusio",      "skills_needed": ["Sehtest", "Perimetrie"]},
    {"name": "Retina VU",     "skills_needed": ["OCT", "Tonometrie", "Perimetrie"]},
    {"name": "Amb. Koord.",   "skills_needed": ["Sehtest", "Spaltlampenuntersuchung"]},
    {"name": "Diab. VU",      "skills_needed": ["Sehtest", "OCT", "Tonometrie"]},
    {"name": "Wundvers.",     "skills_needed": ["Spaltlampenuntersuchung"]},
    {"name": "EGR 1",         "skills_needed": ["Sehtest", "Perimetrie"]},
    {"name": "EGR 2",         "skills_needed": ["OCT", "Spaltlampenuntersuchung"]},
    {"name": "Reserve",       "skills_needed": ["Sehtest", "OCT", "Tonometrie", "Perimetrie"]},
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
    {"name": "Kevin Roth", "skills": ["Sehtest", "OCT", "Tonometrie"]},
    {"name": "Sabrina Fuchs", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Markus Peters", "skills": ["Spaltlampenuntersuchung", "OCT", "Sehtest"]},
    {"name": "Nadine Keller", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Fabian Jung", "skills": ["Sehtest", "OCT", "Perimetrie", "Tonometrie"]},
    {"name": "Petra Weiß", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Christian Lenz", "skills": ["Spaltlampenuntersuchung", "OCT", "Tonometrie", "Perimetrie"]},
    {"name": "Birgit Horn", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Stefan Bergmann", "skills": ["Sehtest", "OCT", "Tonometrie"]},
    {"name": "Monika Dietrich", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie", "Perimetrie"]},
    {"name": "Dominik Huber", "skills": ["Spaltlampenuntersuchung", "OCT", "Sehtest"]},
    {"name": "Verena Pohl", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Michael Krämer", "skills": ["Sehtest", "OCT", "Perimetrie"]},
    {"name": "Claudia Ziegler", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Jens Baumann", "skills": ["Spaltlampenuntersuchung", "OCT", "Sehtest", "Perimetrie"]},
    {"name": "Anja Lorenz", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie", "Perimetrie"]},
    {"name": "Sven Albrecht", "skills": ["Sehtest", "OCT", "Perimetrie"]},
    {"name": "Tanja Schreiber", "skills": ["Spaltlampenuntersuchung", "OCT", "Sehtest"]},
    {"name": "Lars Böhm", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Kerstin Simon", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Oliver Busch", "skills": ["Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Simone Kramer", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Carsten Engel", "skills": ["Sehtest", "OCT", "Perimetrie", "Tonometrie"]},
    {"name": "Heike Vogt", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "René Sauer", "skills": ["Spaltlampenuntersuchung", "OCT", "Sehtest", "Perimetrie"]},
    {"name": "Antje Beck", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Ralf Stein", "skills": ["Sehtest", "OCT", "Tonometrie", "Perimetrie"]},
    {"name": "Sonja Möller", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Thomas Kuhn", "skills": ["Spaltlampenuntersuchung", "OCT", "Sehtest"]},
    {"name": "Iris Schubert", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Holger Wolff", "skills": ["Sehtest", "OCT", "Perimetrie"]},
    {"name": "Gabriele Naumann", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie", "Perimetrie"]},
    {"name": "Dirk Günther", "skills": ["Spaltlampenuntersuchung", "OCT", "Sehtest"]},
    {"name": "Ute Brauer", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Bernd Pfeiffer", "skills": ["Sehtest", "OCT", "Tonometrie"]},
    {"name": "Gabi Walther", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Frank Hahn", "skills": ["Spaltlampenuntersuchung", "OCT", "Tonometrie", "Sehtest"]},
    {"name": "Ingrid Kühn", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie", "Tonometrie"]},
    {"name": "Uwe Schuster", "skills": ["Sehtest", "OCT", "Perimetrie"]},
    {"name": "Renate Gruber", "skills": ["Spaltlampenuntersuchung", "OCT", "Sehtest"]},
    {"name": "Günter Riedel", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Elke Kraft", "skills": ["Sehtest", "OCT", "Perimetrie", "Tonometrie"]},
    {"name": "Werner Fuchs", "skills": ["Spaltlampenuntersuchung", "OCT", "Sehtest", "Perimetrie"]},
    {"name": "Sigrid Bender", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT"]},
    {"name": "Klaus Reimer", "skills": ["Sehtest", "OCT", "Tonometrie", "Perimetrie"]},
    {"name": "Hildegard Steinbach", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Perimetrie"]},
    {"name": "Manfred Burger", "skills": ["Spaltlampenuntersuchung", "OCT", "Sehtest"]},
    {"name": "Brigitte Seifert", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie"]},
    {"name": "Joachim Decker", "skills": ["Sehtest", "OCT", "Perimetrie"]},
    {"name": "Margot Fiedler", "skills": ["Sehtest", "Spaltlampenuntersuchung", "OCT", "Tonometrie", "Perimetrie"]},
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