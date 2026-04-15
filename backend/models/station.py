from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from db import Base
from models.Skill import Skill
from models.StationAssignment import StationAssignment
from models.User import User

station_skills = Table(
    "station_skills", Base.metadata,
    Column("station_id", ForeignKey("stations.id"), primary_key=True),
    Column("skill_id", ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True),
)

class Station(Base):
    __tablename__ = "stations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    maxAssignments = Column(Integer, nullable=False)
    skill_relations = relationship("Skill", secondary=station_skills, passive_deletes=True)
    station_assignments = relationship("StationAssignment", back_populates="station")
    
