from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from db import Base
from models.skill import Skill

station_skills = Table(
    "station_skills", Base.metadata,
    Column("station_id", ForeignKey("stations.id"), primary_key=True),
    Column("skill_id", ForeignKey("skills.id"), primary_key=True),
)

class Station(Base):
    __tablename__ = "stations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    skill_relations = relationship("Skill", secondary=station_skills)