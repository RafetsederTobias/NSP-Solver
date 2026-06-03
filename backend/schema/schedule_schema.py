from pydantic import BaseModel, ConfigDict, Field
from typing import List

class UserConstraint(BaseModel):
    user_id: int = Field(alias="userId")
    maxDaysPerMonth: int | None = None
    minDaysPerMonth: int | None = None
    exactDaysPerMonth: int | None = None
    fixedDays: List[int] | None = None
    blockedDays: List[int] | None = None

class SchedulePayload(BaseModel):
    currentMonth: int
    currentYear: int
    daysInMonth: int
    keepExistingAssignments: bool
    newPlan: bool
    alternativePlan: bool
    constraints: List[UserConstraint]

class ScheduleResponse(BaseModel):
    id: int
    name: str
    year: int
    month: int
    is_loaded: bool

    model_config = ConfigDict(from_attributes=True)