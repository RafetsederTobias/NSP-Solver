from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import date as Date
from db import get_db
from models.StationAssignment import StationAssignment
from sqlalchemy import delete as sa_delete



class StationAssignmentCreate(BaseModel):
    date: Date
    station_id: int
    user_id: int

class StationAssignmentRead(BaseModel):
    id: int
    date: Date
    station_id: int
    user_id: int

    model_config = {"from_attributes": True}

router = APIRouter(prefix="/api/v1/station-assignments", tags=["station-assignments"])


@router.get("", response_model=list[StationAssignmentRead])
async def get_by_date(date: Date, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StationAssignment).where(StationAssignment.date == date))
    return result.scalars().all()


@router.get("/{assignment_id}", response_model=StationAssignmentRead)
async def get_by_id(assignment_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StationAssignment).where(StationAssignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")
    return assignment


@router.post("", response_model=StationAssignmentRead, status_code=201)
async def create(body: StationAssignmentCreate, db: AsyncSession = Depends(get_db)):
    assignment = StationAssignment(**body.model_dump())
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment


@router.patch("/{assignment_id}", response_model=StationAssignmentRead)
async def update(assignment_id: int, body: StationAssignmentCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StationAssignment).where(StationAssignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")
    for key, value in body.model_dump().items():
        setattr(assignment, key, value)
    await db.commit()
    await db.refresh(assignment)
    return assignment


@router.delete("/{assignment_id}", status_code=204)
async def delete(assignment_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StationAssignment).where(StationAssignment.id == assignment_id))
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")
    await db.delete(assignment)
    await db.commit()


@router.put("/by-date/{date}", response_model=list[StationAssignmentRead], status_code=200)
async def replace_all(date: Date, body: list[StationAssignmentCreate], db: AsyncSession = Depends(get_db)):
    await db.execute(sa_delete(StationAssignment).where(StationAssignment.date == date))
    new_assignments = [StationAssignment(**item.model_dump()) for item in body]
    db.add_all(new_assignments)
    await db.commit()
    for a in new_assignments:
        await db.refresh(a)
    return new_assignments