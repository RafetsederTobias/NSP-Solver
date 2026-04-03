from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db import get_db
from models.skill import Skill as SkillModel
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/skills", tags=["skills"])

class Skill(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}

class SkillPayload(BaseModel):
    name: str

@router.get("", response_model=list[Skill])
async def get_skills(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SkillModel))
    return result.scalars().all()

@router.get("/{skill_id}", response_model=Skill)
async def get_skill(skill_id: int, db: AsyncSession = Depends(get_db)):
    skill = await db.get(SkillModel, skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    return skill

@router.post("", response_model=Skill, status_code=201)
async def create_skill(payload: SkillPayload, db: AsyncSession = Depends(get_db)):
    skill = SkillModel(**payload.model_dump())
    db.add(skill)
    await db.commit()
    await db.refresh(skill)
    return skill

@router.put("/{skill_id}", response_model=Skill)
async def update_skill(skill_id: int, payload: SkillPayload, db: AsyncSession = Depends(get_db)):
    skill = await db.get(SkillModel, skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    for key, val in payload.model_dump().items():
        setattr(skill, key, val)
    await db.commit()
    await db.refresh(skill)
    return skill

@router.delete("/{skill_id}", status_code=204)
async def delete_skill(skill_id: int, db: AsyncSession = Depends(get_db)):
    skill = await db.get(SkillModel, skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    await db.delete(skill)
    await db.commit()