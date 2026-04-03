from sqlalchemy import Column, Integer, String
from db import Base

class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)