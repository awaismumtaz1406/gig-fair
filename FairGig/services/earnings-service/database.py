import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/fairgig_db")
client = AsyncIOMotorClient(MONGODB_URI)
db = client["fairgig_db"]
earnings_collection = db["earnings"]
