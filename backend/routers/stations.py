from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from db import get_db
from models.station import Station as StationModel
from models.skill import Skill as SkillModel
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/stations", tags=["stations"])

class Station(BaseModel):
    id: int
    name: str
    skills_needed: list[str]

    model_config = {"from_attributes": True}

class StationPayload(BaseModel):
    name: str
    skills_needed: list[str]

@router.get("", response_model=list[Station])
async def get_stations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(StationModel).options(selectinload(StationModel.skill_relations)))
    return [
        {"id": s.id, "name": s.name, "skills_needed": [sk.name for sk in s.skill_relations]}
        for s in result.scalars().all()
    ]

@router.get("/{station_id}", response_model=Station)
async def get_station(station_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(StationModel).options(selectinload(StationModel.skill_relations)).where(StationModel.id == station_id)
    )
    station = result.scalar_one_or_none()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    return {"id": station.id, "name": station.name, "skills_needed": [s.name for s in station.skill_relations]}

@router.post("", response_model=Station, status_code=201)
async def create_station(payload: StationPayload, db: AsyncSession = Depends(get_db)):
    skills = (await db.execute(select(SkillModel).where(SkillModel.name.in_(payload.skills_needed)))).scalars().all()
    station = StationModel(name=payload.name, skill_relations=skills)
    db.add(station)
    await db.commit()
    result = await db.execute(
        select(StationModel).options(selectinload(StationModel.skill_relations)).where(StationModel.id == station.id)
    )
    station = result.scalar_one()
    return {"id": station.id, "name": station.name, "skills_needed": [s.name for s in station.skill_relations]}

@router.put("/{station_id}", response_model=Station)
async def update_station(station_id: int, payload: StationPayload, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(StationModel).options(selectinload(StationModel.skill_relations)).where(StationModel.id == station_id)
    )
    station = result.scalar_one_or_none()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    skills = (await db.execute(select(SkillModel).where(SkillModel.name.in_(payload.skills_needed)))).scalars().all()
    station.name = payload.name
    station.skill_relations = skills
    await db.commit()
    result = await db.execute(
        select(StationModel).options(selectinload(StationModel.skill_relations)).where(StationModel.id == station_id)
    )
    station = result.scalar_one()
    return {"id": station.id, "name": station.name, "skills_needed": [s.name for s in station.skill_relations]}

@router.delete("/{station_id}", status_code=204)
async def delete_station(station_id: int, db: AsyncSession = Depends(get_db)):
    station = await db.get(StationModel, station_id)
    if not station:
        raise HTTPException(status_call=404, detail="Station not found")
    await db.delete(station)
    await db.commit()