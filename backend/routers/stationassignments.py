from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import date

from db import get_db
from models.StationAssignment import StationAssignment


class StationAssignmentCreate(BaseModel):
    date: date
    station_id: int
    user_id: int

class StationAssignmentRead(BaseModel):
    id: int
    date: date
    station_id: int
    user_id: int

    model_config = {"from_attributes": True}

router = APIRouter(prefix="/api/v1/station-assignments", tags=["station-assignments"])


@router.get("", response_model=list[StationAssignmentRead])
def get_by_date(date: date, db: Session = Depends(get_db)):
    return db.query(StationAssignment).filter(StationAssignment.date == date).all()


@router.get("/{assignment_id}", response_model=StationAssignmentRead)
def get_by_id(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(StationAssignment).filter(StationAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")
    return assignment


@router.post("", response_model=StationAssignmentRead, status_code=201)
def create(body: StationAssignmentCreate, db: Session = Depends(get_db)):
    assignment = StationAssignment(**body.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.patch("/{assignment_id}", response_model=StationAssignmentRead)
def update(assignment_id: int, body: StationAssignmentCreate, db: Session = Depends(get_db)):
    assignment = db.query(StationAssignment).filter(StationAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")
    for key, value in body.model_dump().items():
        setattr(assignment, key, value)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/{assignment_id}", status_code=204)
def delete(assignment_id: int, db: Session = Depends(get_db)):
    assignment = db.query(StationAssignment).filter(StationAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")
    db.delete(assignment)
    db.commit()