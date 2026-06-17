
from sqlalchemy import Column, Integer, String, Date, ForeignKey, UniqueConstraint, Index, Boolean
from sqlalchemy.orm import relationship
from db import Base

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)         
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False) 
    is_loaded = Column(Boolean, nullable=False, default=False)


    station_assignments = relationship("StationAssignment", back_populates="schedule", cascade="all, delete-orphan")
    
    __table_args__ = (
    Index(
        "uq_one_loaded_per_month",
        "year", "month",
        unique=True,
        postgresql_where=Column("is_loaded") == True,
    ),
)
