from sqlalchemy import Column, Integer, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from db import Base

class StationAssignment(Base):
    __tablename__ = "station_assignments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    station = relationship("Station", back_populates="station_assignments")
    user = relationship("User", back_populates="station_assignments")

    __table_args__ = (
        UniqueConstraint("date", "user_id", name="uq_user_per_day"),
    )