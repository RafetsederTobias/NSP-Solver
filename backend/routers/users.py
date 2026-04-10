from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db import get_db
from models.User import User as UserModel
from models.Skill import Skill as SkillModel
from pydantic import BaseModel
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/api/v1/users", tags=["users"])

class User(BaseModel):
    id: int
    name: str
    skills: list[str]

    model_config = {"from_attributes": True}

class UserPayload(BaseModel):
    name: str
    skills: list[str]

@router.get("/{user_id}", response_model=User)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(UserModel).options(selectinload(UserModel.skill_relations)).where(UserModel.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user.id, "name": user.name, "skills": [s.name for s in user.skill_relations]}

@router.get("", response_model=list[User])
async def get_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserModel).options(selectinload(UserModel.skill_relations)))
    return [
        {"id": u.id, "name": u.name, "skills": [s.name for s in u.skill_relations]}
        for u in result.scalars().all()
    ]

@router.post("", response_model=User, status_code=201)
async def create_user(payload: UserPayload, db: AsyncSession = Depends(get_db)):
    skills = (await db.execute(select(SkillModel).where(SkillModel.name.in_(payload.skills)))).scalars().all()
    user = UserModel(name=payload.name, skill_relations=skills)
    db.add(user)
    await db.commit()
    result = await db.execute(
        select(UserModel).options(selectinload(UserModel.skill_relations)).where(UserModel.id == user.id)
    )
    user = result.scalar_one()
    return {"id": user.id, "name": user.name, "skills": [s.name for s in user.skill_relations]}

@router.put("/{user_id}", response_model=User)
async def update_user(user_id: int, payload: UserPayload, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(UserModel).options(selectinload(UserModel.skill_relations)).where(UserModel.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    skills = (await db.execute(select(SkillModel).where(SkillModel.name.in_(payload.skills)))).scalars().all()
    user.name = payload.name
    user.skill_relations = skills
    await db.commit()
    result = await db.execute(
        select(UserModel).options(selectinload(UserModel.skill_relations)).where(UserModel.id == user_id)
    )
    user = result.scalar_one()
    return {"id": user.id, "name": user.name, "skills": [s.name for s in user.skill_relations]}

@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(UserModel, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()