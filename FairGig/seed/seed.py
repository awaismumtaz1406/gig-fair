import random
from datetime import datetime, timedelta

import bcrypt
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/fairgig_db")
db = client["fairgig_db"]
users_col = db["users"]
earnings_col = db["earnings"]
complaints_col = db["complaints"]

users_col.delete_many({})
earnings_col.delete_many({})
complaints_col.delete_many({})

users = [
    {"name": "Ali Hassan", "email": "worker@demo.com", "password": "demo1234", "role": "worker", "city": "Lahore"},
    {"name": "Sara Khan", "email": "worker2@demo.com", "password": "demo1234", "role": "worker", "city": "Karachi"},
    {"name": "Usman Malik", "email": "verifier@demo.com", "password": "demo1234", "role": "verifier", "city": "Islamabad"},
    {"name": "Ayesha Raza", "email": "advocate@demo.com", "password": "demo1234", "role": "advocate", "city": "Lahore"},
]

for user in users:
    user["password"] = bcrypt.hashpw(user["password"].encode(), bcrypt.gensalt(10)).decode()
    user["createdAt"] = datetime.utcnow()

users_col.insert_many(users)
workers = list(users_col.find({"role": "worker"}))

platform_ranges = {"Uber": (800, 4000), "Foodpanda": (500, 2500), "Fiverr": (1000, 8000), "Careem": (700, 3500), "Daraz": (600, 2800)}
platforms = list(platform_ranges.keys())
cities = ["Lahore", "Karachi", "Islamabad"]

records = []
for _ in range(150):
    platform = random.choice(platforms)
    min_amt, max_amt = platform_ranges[platform]
    amount = random.randint(min_amt, max_amt)
    if random.random() < 0.1:
        amount = random.randint(300, 700)
    worker = random.choice(workers)
    date = datetime.utcnow() - timedelta(days=random.randint(0, 90))
    records.append(
        {
            "workerId": str(worker["_id"]),
            "platform": platform,
            "amount": float(amount),
            "hoursWorked": round(random.uniform(2, 10), 1),
            "date": date,
            "weekNumber": date.isocalendar().week,
            "anomalyScore": random.randint(61, 95) if random.random() < 0.1 else random.randint(0, 25),
            "anomalyMessage": "Potential anomaly detected" if random.random() < 0.1 else "Your earnings look normal for this period",
            "isVerified": random.random() < 0.3,
            "verifiedBy": None,
            "city": random.choice(cities),
            "screenshotUrl": None,
            "createdAt": datetime.utcnow(),
        }
    )
earnings_col.insert_many(records)

complaint_samples = [
    ("Uber", "My payment was delayed and still pending for weeks"),
    ("Foodpanda", "Account was blocked without warning"),
    ("Careem", "I got an unfair rating and wrong score"),
    ("Daraz", "App crash and gps wrong location issue"),
    ("Uber", "They deducted unfair penalty from my earnings"),
]

complaints = []
for _ in range(20):
    platform, text = random.choice(complaint_samples)
    worker = random.choice(workers)
    complaints.append(
        {
            "workerId": str(worker["_id"]),
            "platform": platform,
            "text": text,
            "tags": [],
            "clusterLabel": "General Complaint",
            "status": random.choice(["open", "under_review", "resolved"]),
            "createdAt": datetime.utcnow() - timedelta(days=random.randint(0, 45)),
        }
    )
complaints_col.insert_many(complaints)
print("Seed complete")
