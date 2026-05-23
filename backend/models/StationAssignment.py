from sqlalchemy import Column, Integer, Date, ForeignKey, UniqueConstraint, extract, select
from sqlalchemy.orm import relationship
from db import Base
from sqlalchemy.ext.asyncio import AsyncSession

class StationAssignment(Base):
    __tablename__ = "station_assignments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id", ondelete="CASCADE"), nullable=False)


    station = relationship("Station", back_populates="station_assignments")
    user = relationship("User", back_populates="station_assignments")
    schedule = relationship("Schedule", back_populates="station_assignments")


    __table_args__ = (
        UniqueConstraint("schedule_id", "date", "user_id", name="uq_user_per_day_per_schedule"),
    )

    @property
    def is_placeholder(self) -> bool:
        return self.user_id is None