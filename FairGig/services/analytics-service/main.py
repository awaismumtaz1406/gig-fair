import os
from collections import defaultdict
from datetime import datetime, timedelta
from statistics import mean, median, pstdev
from typing import Any, Literal

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

DEFAULT_MEDIANS = {"Lahore": 2800, "Karachi": 3200, "Islamabad": 3600}
client = AsyncIOMotorClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017/fairgig_db"))
earnings_collection = client["fairgig_db"]["earnings"]


class AnalyzePayload(BaseModel):
    workerId: str
    city: Literal["Lahore", "Karachi", "Islamabad"]
    earnings: list[dict[str, Any]]


app = FastAPI(title="FairGig Analytics Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"data": None, "error": "Validation failed", "message": "Validation failed", "detail": exc.errors()})


@app.exception_handler(Exception)
async def general_exception_handler(_, exc: Exception):
    return JSONResponse(status_code=500, content={"data": None, "error": str(exc), "message": "Internal server error", "detail": "Internal server error"})


@app.post("/analyze")
async def analyze(payload: AnalyzePayload):
    now = datetime.utcnow()
    recent = await earnings_collection.find({"city": payload.city, "isVerified": True, "date": {"$gte": now - timedelta(days=30)}}).to_list(length=5000)
    city_median = median([item["amount"] for item in recent]) if recent else DEFAULT_MEDIANS[payload.city]

    amounts = [float(item.get("amount", 0)) for item in payload.earnings]
    anomaly_scores = [float(item.get("anomalyScore", 0)) for item in payload.earnings]
    worker_avg = mean(amounts) if amounts else 0.0
    std_dev = pstdev(amounts) if len(amounts) > 1 else 0.0

    income_ratio = min((worker_avg / city_median), 1.5) if city_median else 0
    consistency = max(0.0, min(1.0, 1 - (std_dev / worker_avg))) if worker_avg else 0
    anomaly_penalty = (mean(anomaly_scores) / 100) if anomaly_scores else 0
    fairness_score = round((income_ratio * 40) + (consistency * 35) + ((1 - anomaly_penalty) * 25))

    week_buckets = defaultdict(list)
    platform_buckets = defaultdict(list)
    for item in payload.earnings:
        date_value = item.get("date")
        if isinstance(date_value, str):
            date_value = datetime.fromisoformat(date_value.replace("Z", "+00:00")).replace(tzinfo=None)
        week = date_value.isocalendar().week if isinstance(date_value, datetime) else item.get("weekNumber", 0)
        week_buckets[week].append(float(item.get("amount", 0)))
        platform_buckets[item.get("platform", "Unknown")].append(float(item.get("amount", 0)))

    commission_trends = []
    for week, values in sorted(week_buckets.items())[-8:]:
        commission_trends.append({"week": week, "total": round(sum(values), 2), "avg": round(mean(values), 2), "count": len(values)})

    platform_breakdown = []
    for platform, values in platform_buckets.items():
        platform_breakdown.append({"platform": platform, "count": len(values), "avgAmount": round(mean(values), 2), "totalAmount": round(sum(values), 2)})

    insights = []
    if fairness_score < 40 and city_median:
        diff = round(((city_median - worker_avg) / city_median) * 100, 1)
        insights.append(f"You earned {diff}% less than the {payload.city} median this month")
    if consistency < 0.5:
        insights.append("Your income is inconsistent — consider diversifying platforms")
    if platform_breakdown:
        best = max(platform_breakdown, key=lambda item: item["totalAmount"])
        insights.append(f"You earn most on {best['platform']} — consider focusing there")
    if len(commission_trends) >= 2 and commission_trends[-2]["total"] > 0 and commission_trends[-1]["total"] > commission_trends[-2]["total"]:
        growth = round(((commission_trends[-1]["total"] - commission_trends[-2]["total"]) / commission_trends[-2]["total"]) * 100, 1)
        insights.append(f"Great! Your earnings grew {growth}% this week")
    if anomaly_penalty > 0.3:
        insights.append("Multiple unusual earnings detected — review your records")
    if not insights:
        insights = ["Your earnings trend is stable this month", "Keep logging verified records for stronger insights"]

    return {
        "data": {
            "fairnessScore": fairness_score,
            "cityMedian": round(city_median, 2),
            "workerAvg": round(worker_avg, 2),
            "insights": insights[:4],
            "commissionTrends": commission_trends,
            "platformBreakdown": platform_breakdown,
            "scoreComponents": {
                "incomeRatio": round(income_ratio, 3),
                "consistency": round(consistency, 3),
                "anomalyPenalty": round(anomaly_penalty, 3),
            },
        },
        "error": None,
        "message": "Analytics generated",
    }
