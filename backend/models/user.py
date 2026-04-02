# models/user.py
from sqlalchemy import Column, Integer, String, ARRAY
from db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    skills = Column(ARRAY(String), default=[])