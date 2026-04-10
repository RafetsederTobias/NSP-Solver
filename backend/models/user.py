from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from db import Base
from models.Assignment import assignment_users

user_skills = Table(
    "user_skills", Base.metadata,
    Column("user_id", ForeignKey("users.id"), primary_key=True),
    Column("skill_id", ForeignKey("skills.id"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    skill_relations = relationship("Skill", secondary=user_skills)
    assignments = relationship("Assignment", secondary=assignment_users, back_populates="users")
