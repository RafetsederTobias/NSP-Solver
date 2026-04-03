from sqlalchemy import Column, Integer, String, ARRAY
from db import Base

class Station(Base):
    __tablename__ = "stations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    skills_needed = Column(ARRAY(String), default=[])