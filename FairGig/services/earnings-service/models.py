from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class EarningCreate(BaseModel):
    workerId: str
    platform: Literal["Uber", "Foodpanda", "Fiverr", "Careem", "Daraz"]
    amount: float = Field(gt=0)
    hoursWorked: float = Field(gt=0, le=24)
    date: datetime
    city: str
    screenshotUrl: Optional[str] = None


class EarningVerify(BaseModel):
    isVerified: bool
    verifiedBy: str
