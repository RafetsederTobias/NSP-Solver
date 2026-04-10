from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db import get_db
from models.Assignment import Assignment as AssignmentModel
from models.User import User as UserModel
from pydantic import BaseModel
from sqlalchemy.orm import selectinload
from datetime import date

router = APIRouter(prefix="/api/v1/assignments", tags=["assignments"])

class Assignment(BaseModel):
    id: int
    date: date
    users: list[str]

    model_config = {"from_attributes": True}

class AssignmentPayload(BaseModel):
    date: date
    users: list[str]

@router.get("/{assignment_id}", response_model=Assignment)
async def get_assignment(assignment_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AssignmentModel).options(selectinload(AssignmentModel.users)).where(AssignmentModel.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return {"id": assignment.id, "date": assignment.date, "users": [u.name for u in assignment.users]}

@router.get("", response_model=list[Assignment])
async def get_assignments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AssignmentModel).options(selectinload(AssignmentModel.users)))
    return [
        {"id": a.id, "date": a.date, "users": [u.name for u in a.users]}
        for a in result.scalars().all()
    ]

@router.get("/by-date/{date}", response_model=list[Assignment])
async def get_assignments_by_date(date: date, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AssignmentModel).options(selectinload(AssignmentModel.users)).where(AssignmentModel.date == date)
    )
    return [
        {"id": a.id, "date": a.date, "users": [u.name for u in a.users]}
        for a in result.scalars().all()
    ]

@router.post("", response_model=Assignment, status_code=201)
async def create_assignment(payload: AssignmentPayload, db: AsyncSession = Depends(get_db)):
    users = (await db.execute(select(UserModel).where(UserModel.name.in_(payload.users)))).scalars().all()
    assignment = AssignmentModel(date=payload.date, users=users)
    db.add(assignment)
    await db.commit()
    result = await db.execute(
        select(AssignmentModel).options(selectinload(AssignmentModel.users)).where(AssignmentModel.id == assignment.id)
    )
    assignment = result.scalar_one()
    return {"id": assignment.id, "date": assignment.date, "users": [u.name for u in assignment.users]}

@router.put("/{assignment_id}", response_model=Assignment)
async def update_assignment(assignment_id: int, payload: AssignmentPayload, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AssignmentModel).options(selectinload(AssignmentModel.users)).where(AssignmentModel.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    users = (await db.execute(select(UserModel).where(UserModel.name.in_(payload.users)))).scalars().all()
    assignment.date = payload.date
    assignment.users = users
    await db.commit()
    result = await db.execute(
        select(AssignmentModel).options(selectinload(AssignmentModel.users)).where(AssignmentModel.id == assignment_id)
    )
    assignment = result.scalar_one()
    return {"id": assignment.id, "date": assignment.date, "users": [u.name for u in assignment.users]}

@router.delete("/{assignment_id}", status_code=204)
async def delete_assignment(assignment_id: int, db: AsyncSession = Depends(get_db)):
    assignment = await db.get(AssignmentModel, assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    await db.delete(assignment)
    await db.commit()

@router.get("/by-date/{date_str}/users")
async def get_users_by_date(date_str: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AssignmentModel)
        .options(selectinload(AssignmentModel.users))
        .where(AssignmentModel.date == date.fromisoformat(date_str))
    )
    assignments = result.scalars().all()
    return [user for assignment in assignments for user in assignment.users]