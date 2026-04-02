from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db import get_db
from models.user import User as UserModel
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/users", tags=["users"])

class User(BaseModel):
    id: int
    name: str
    skills: list[str]

    model_config = {"from_attributes": True}

class UserPayload(BaseModel):
    name: str
    skills: list[str]

@router.get("/", response_model=list[User])
async def get_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserModel))
    return result.scalars().all()

@router.get("/{user_id}", response_model=User)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(UserModel, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/", response_model=User, status_code=201)
async def create_user(payload: UserPayload, db: AsyncSession = Depends(get_db)):
    user = UserModel(**payload.model_dump())
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.put("/{user_id}", response_model=User)
async def update_user(user_id: int, payload: UserPayload, db: AsyncSession = Depends(get_db)):
    user = await db.get(UserModel, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, val in payload.model_dump().items():
        setattr(user, key, val)
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(UserModel, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()