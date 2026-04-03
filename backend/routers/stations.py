from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db import get_db
from models.station import Station as StationModel
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
    result = await db.execute(select(StationModel))
    return result.scalars().all()

@router.get("/{station_id}", response_model=Station)
async def get_station(station_id: int, db: AsyncSession = Depends(get_db)):
    station = await db.get(StationModel, station_id)
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    return station

@router.post("", response_model=Station, status_code=201)
async def create_station(payload: StationPayload, db: AsyncSession = Depends(get_db)):
    station = StationModel(**payload.model_dump())
    db.add(station)
    await db.commit()
    await db.refresh(station)
    return station

@router.put("/{station_id}", response_model=Station)
async def update_station(station_id: int, payload: StationPayload, db: AsyncSession = Depends(get_db)):
    station = await db.get(StationModel, station_id)
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    for key, val in payload.model_dump().items():
        setattr(station, key, val)
    await db.commit()
    await db.refresh(station)
    return station

@router.delete("/{station_id}", status_code=204)
async def delete_station(station_id: int, db: AsyncSession = Depends(get_db)):
    station = await db.get(StationModel, station_id)
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    await db.delete(station)
    await db.commit()