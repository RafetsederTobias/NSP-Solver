import select

from db import SessionLocal
from sqlalchemy import delete, select, func
from seed import STATIONS, USERS
from db import SessionLocal
from models.Station import Station, station_skills
from models.Skill import Skill
from models.User import User, user_skills

async def seed():
    async with SessionLocal() as db:

        station_count = await db.scalar(select(func.count()).select_from(Station))
        target_user_count = station_count - 1

        result = await db.execute(select(User))
        users = result.scalars().all()

        for user in users[target_user_count:]:
            await db.delete(user)

        await db.commit()
        print(f"Stations: {station_count}, Users after delete: {target_user_count}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(seed())