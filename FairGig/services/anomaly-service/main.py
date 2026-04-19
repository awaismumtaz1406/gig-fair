from statistics import mean, pstdev
from typing import List, Literal, Optional

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

PLATFORM_BASELINES = {
    "Uber": 400,
    "Foodpanda": 300,
    "Fiverr": 800,
    "Careem": 350,
    "Daraz": 250,
}


class RecentEarning(BaseModel):
    amount: float


class DetectRequest(BaseModel):
    workerId: str
    amount: float = Field(gt=0)
    hoursWorked: float = Field(gt=0, le=24)
    date: str
    platform: Literal["Uber", "Foodpanda", "Fiverr", "Careem", "Daraz"]
    recentEarnings: Optional[List[RecentEarning]] = None


app = FastAPI(title="FairGig Anomaly Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"data": None, "error": "Validation failed", "message": "Validation failed", "detail": exc.errors()},
    )


@app.exception_handler(Exception)
async def general_exception_handler(_, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"data": None, "error": str(exc), "message": "Internal server error", "detail": "Internal server error"},
    )


@app.post("/detect")
async def detect(payload: DetectRequest):
    flags: List[str] = []
    details = {}
    messages: List[str] = []
    score = 0.0

    baseline = PLATFORM_BASELINES[payload.platform]
    hourly_rate = payload.amount / payload.hoursWorked
    details["hourlyRate"] = round(hourly_rate, 2)
    details["platformBaseline"] = baseline

    if hourly_rate < baseline * 0.6:
        flags.append("LOW_RATE")
        score += 35
        messages.append(f"Your hourly earnings on {payload.platform} are 40% below the typical rate")
    elif hourly_rate > baseline * 2.5:
        flags.append("SUSPICIOUS_HIGH")
        messages.append("This earning is unusually high — verify it's correct")

    recent = payload.recentEarnings or []
    recent_amounts = [item.amount for item in recent if item.amount > 0]

    if recent_amounts:
        weekly_avg = mean(recent_amounts[-4:]) if len(recent_amounts) >= 4 else mean(recent_amounts)
        details["weeklyAvg"] = round(weekly_avg, 2)
        if weekly_avg > 0 and payload.amount < weekly_avg * 0.8:
            drop_percent = ((weekly_avg - payload.amount) / weekly_avg) * 100
            flags.append("INCOME_DROP")
            score += min(drop_percent * 1.5, 40)
            messages.append(f"Your income dropped {round(drop_percent, 1)}% compared to your recent average")

    if len(recent_amounts) >= 5:
        amount_mean = mean(recent_amounts)
        amount_std = pstdev(recent_amounts)
        if amount_std > 0:
            z = (payload.amount - amount_mean) / amount_std
            details["zScore"] = round(z, 2)
            if z < -2.0:
                flags.append("STATISTICAL_OUTLIER_LOW")
                score += 25
                messages.append("This earning is unusually low compared to your history")
            elif z > 2.5:
                flags.append("STATISTICAL_OUTLIER_HIGH")
                score += 25
                messages.append("This earning is unusually high — verify it's correct")

    anomaly_score = round(min(score, 100), 2)
    anomaly_message = "Your earnings look normal for this period" if not messages else " | ".join(messages[:2])

    return {
        "data": {
            "anomalyScore": anomaly_score,
            "anomalyMessage": anomaly_message,
            "flags": flags,
            "details": details,
        },
        "error": None,
        "message": "Anomaly analysis complete",
    }
