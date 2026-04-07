from sqlalchemy import Column, Integer, Date, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from db import Base

assignment_users = Table(
    "assignment_users", Base.metadata,
    Column("assignment_id", ForeignKey("assignments.id"), primary_key=True),
    Column("user_id", ForeignKey("users.id"), primary_key=True),
)

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, index=True)
    users = relationship("User", secondary=assignment_users, back_populates="assignments")
