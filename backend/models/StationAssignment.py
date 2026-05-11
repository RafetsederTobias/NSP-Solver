from sqlalchemy import Column, Integer, Date, ForeignKey, UniqueConstraint, extract, select
from sqlalchemy.orm import relationship
from db import Base
from sqlalchemy.ext.asyncio import AsyncSession

class StationAssignment(Base):
    __tablename__ = "station_assignments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)


    station = relationship("Station", back_populates="station_assignments")
    user = relationship("User", back_populates="station_assignments")

    __table_args__ = (
        UniqueConstraint("date", "user_id", name="uq_user_per_day"),
    )

    @classmethod
    async def get_unassigned_stations(
        cls, db: AsyncSession, year: int, month: int, scheduled_days: list
    ):
        from models.Station import Station
        from datetime import date as date_type

        day_dates = [
            d if isinstance(d, date_type) else date_type(year, month, d)
            for d in scheduled_days
        ]

        gaps = []
        for day in day_dates:
            result = await db.execute(
                select(Station)
                .where(
                    ~Station.id.in_(
                        select(cls.station_id).where(cls.date == day)
                    )
                )
            )
            unassigned = result.scalars().all()
            gaps.extend({"station": s.name, "day": day.day} for s in unassigned)

        return gaps