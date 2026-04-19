import csv
import io
import os
from datetime import datetime
from typing import Any

import httpx
from bson import ObjectId
from fastapi import FastAPI, File, Query, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo import DESCENDING

from database import earnings_collection
from models import EarningCreate, EarningVerify

ANOMALY_URL = os.getenv("ANOMALY_SERVICE_URL", "http://localhost:8002")
ANALYTICS_URL = os.getenv("ANALYTICS_SERVICE_URL", "http://localhost:8003")

app = FastAPI(title="FairGig Earnings Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def serialize_doc(doc: dict[str, Any]) -> dict[str, Any]:
    if not doc:
        return doc
    item = dict(doc)
    item["id"] = str(item.pop("_id"))
    for key, value in item.items():
        if isinstance(value, datetime):
            item[key] = value.isoformat()
        elif isinstance(value, ObjectId):
            item[key] = str(value)
    return item


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"data": None, "error": "Validation failed", "message": "Validation failed", "detail": exc.errors()})


@app.exception_handler(Exception)
async def general_exception_handler(_, exc: Exception):
    return JSONResponse(status_code=500, content={"data": None, "error": str(exc), "message": "Internal server error", "detail": "Internal server error"})


@app.post("/earnings")
async def create_earning(payload: EarningCreate):
    week_number = payload.date.isocalendar().week
    record = payload.model_dump()
    record.update(
        {"weekNumber": week_number, "anomalyScore": 0, "anomalyMessage": "", "isVerified": False, "verifiedBy": None, "createdAt": datetime.utcnow()}
    )
    result = await earnings_collection.insert_one(record)
    saved = await earnings_collection.find_one({"_id": result.inserted_id})

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{ANOMALY_URL}/detect",
                json={
                    "workerId": payload.workerId,
                    "amount": payload.amount,
                    "hoursWorked": payload.hoursWorked,
                    "date": payload.date.isoformat(),
                    "platform": payload.platform,
                },
            )
            anomaly_data = response.json().get("data", {})
            await earnings_collection.update_one(
                {"_id": result.inserted_id},
                {"$set": {"anomalyScore": anomaly_data.get("anomalyScore", 0), "anomalyMessage": anomaly_data.get("anomalyMessage", "")}},
            )
            saved = await earnings_collection.find_one({"_id": result.inserted_id})
    except (httpx.TimeoutException, httpx.ConnectError):
        pass

    return JSONResponse(content=jsonable_encoder({"data": serialize_doc(saved), "error": None, "message": "Earning created"}))


@app.get("/earnings/pending")
async def pending_earnings(limit: int = Query(50), skip: int = Query(0)):
    query: dict[str, Any] = {"isVerified": False}
    total = await earnings_collection.count_documents(query)
    rows = await earnings_collection.find(query).sort("createdAt", DESCENDING).skip(skip).limit(limit).to_list(length=limit)
    return JSONResponse(content=jsonable_encoder({"data": [serialize_doc(row) for row in rows], "error": None, "message": "Pending earnings fetched"}))


@app.get("/earnings/{workerId}")
async def list_earnings(workerId: str, platform: str | None = None, startDate: datetime | None = None, endDate: datetime | None = None, limit: int = Query(50), skip: int = Query(0)):
    query: dict[str, Any] = {"workerId": workerId}
    if platform:
        query["platform"] = platform
    if startDate or endDate:
        query["date"] = {}
        if startDate:
            query["date"]["$gte"] = startDate
        if endDate:
            query["date"]["$lte"] = endDate
    total = await earnings_collection.count_documents(query)
    rows = await earnings_collection.find(query).sort("date", DESCENDING).skip(skip).limit(limit).to_list(length=limit)
    return JSONResponse(content=jsonable_encoder({"data": {"earnings": [serialize_doc(row) for row in rows], "total": total}, "error": None, "message": "Earnings fetched"}))


@app.get("/earnings/dashboard/{workerId}")
async def dashboard(workerId: str):
    rows = await earnings_collection.find({"workerId": workerId}).sort("date", DESCENDING).to_list(length=500)
    serialized = [serialize_doc(row) for row in rows]
    city = serialized[0]["city"] if serialized else "Lahore"
    analytics = {"fairnessScore": 0, "cityMedian": 2800, "insights": [], "commissionTrends": []}
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(f"{ANALYTICS_URL}/analyze", json={"workerId": workerId, "city": city, "earnings": serialized})
            analytics = response.json().get("data", analytics)
    except (httpx.TimeoutException, httpx.ConnectError):
        pass
    return JSONResponse(content=jsonable_encoder({"data": {"earnings": serialized, "analytics": analytics}, "error": None, "message": "Dashboard fetched"}))


@app.put("/earnings/{earningId}/verify")
async def verify_earning(earningId: str, payload: EarningVerify):
    await earnings_collection.update_one({"_id": ObjectId(earningId)}, {"$set": payload.model_dump()})
    updated = await earnings_collection.find_one({"_id": ObjectId(earningId)})
    return JSONResponse(content=jsonable_encoder({"data": serialize_doc(updated), "error": None, "message": "Earning verification updated"}))


@app.post("/earnings/import-csv")
async def import_csv(workerId: str, city: str, file: UploadFile = File(...)):
    content = await file.read()
    reader = csv.DictReader(io.StringIO(content.decode("utf-8")))
    inserted = 0
    skipped = 0
    errors = []
    for index, row in enumerate(reader, start=2):
        try:
            date_value = datetime.fromisoformat(row["date"])
            amount = float(row["amount"])
            hours = float(row["hoursWorked"])
            if amount <= 0 or hours <= 0 or hours > 24:
                raise ValueError("Invalid amount/hours")
            payload = EarningCreate(workerId=workerId, city=city, platform=row["platform"], amount=amount, hoursWorked=hours, date=date_value)
            await create_earning(payload)
            inserted += 1
        except Exception as exc:
            skipped += 1
            errors.append({"row": index, "error": str(exc)})
    return JSONResponse(content=jsonable_encoder({"data": {"inserted": inserted, "skipped": skipped, "errors": errors}, "error": None, "message": "CSV import complete"}))


@app.get("/earnings/stats/platform/{workerId}")
async def platform_stats(workerId: str):
    pipeline = [
        {"$match": {"workerId": workerId}},
        {"$group": {"_id": "$platform", "totalEarnings": {"$sum": "$amount"}, "avgAmount": {"$avg": "$amount"}, "count": {"$sum": 1}, "fairnessScore": {"$avg": {"$subtract": [100, "$anomalyScore"]}}}},
    ]
    rows = await earnings_collection.aggregate(pipeline).to_list(length=20)
    return JSONResponse(content=jsonable_encoder({
        "data": [
            {"platform": row["_id"], "totalEarnings": round(row["totalEarnings"], 2), "avgAmount": round(row["avgAmount"], 2), "count": row["count"], "fairnessScore": round(row["fairnessScore"], 2)}
            for row in rows
        ],
        "error": None,
        "message": "Platform stats fetched",
    }))
