from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import random


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# --- FreePay models ---

class ScanRequest(BaseModel):
    item_category: str  # Hotel | Food | Housing | Water | Medical

class ScanResult(BaseModel):
    scan_id: str
    item_category: str
    item_name: str
    item_price: float
    scanned_at: datetime

class VerifyRequest(BaseModel):
    scan_id: str

class VerifyResult(BaseModel):
    scan_id: str
    dual_c_verified: bool
    credit_released: bool
    tx_hash: Optional[str]
    verified_at: datetime

class PoolStatus(BaseModel):
    available_balance: float
    daily_capacity: float
    capacity_used_pct: float
    incoming_tips_24h: float

class Transaction(BaseModel):
    tx_id: str
    item_category: str
    item_name: str
    amount: float
    status: str  # pending | settled | failed
    tx_hash: Optional[str]
    created_at: datetime

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks

# --- FreePay endpoints ---

_ITEM_NAMES = {
    "Hotel": ["Deluxe Room (1 night)", "Standard Room (1 night)", "Suite (1 night)"],
    "Food": ["Meal Combo", "Grocery Bundle", "Restaurant Voucher"],
    "Housing": ["Monthly Rent Credit", "Deposit Cover", "Utility Bill"],
    "Water": ["Monthly Water Bill", "Emergency Supply", "Filter System"],
    "Medical": ["Doctor Visit", "Prescription Refill", "Emergency Care"],
}

_ITEM_PRICES = {
    "Hotel": [89.99, 59.99, 249.99],
    "Food": [12.50, 45.00, 30.00],
    "Housing": [850.00, 200.00, 120.00],
    "Water": [35.00, 15.00, 89.99],
    "Medical": [75.00, 25.00, 350.00],
}

@api_router.post("/scan", response_model=ScanResult)
async def trigger_scan(req: ScanRequest):
    category = req.item_category
    if category not in _ITEM_NAMES:
        category = "Food"
    idx = random.randint(0, 2)
    result = ScanResult(
        scan_id=str(uuid.uuid4()),
        item_category=category,
        item_name=_ITEM_NAMES[category][idx],
        item_price=_ITEM_PRICES[category][idx],
        scanned_at=datetime.now(timezone.utc),
    )
    doc = result.model_dump()
    doc["scanned_at"] = doc["scanned_at"].isoformat()
    await db.scans.insert_one(doc)
    return result

@api_router.post("/verify", response_model=VerifyResult)
async def dual_c_verify(req: VerifyRequest):
    scan_doc = await db.scans.find_one({"scan_id": req.scan_id}, {"_id": 0})
    if not scan_doc:
        verified = False
        credit_released = False
        tx_hash = None
    else:
        verified = True
        credit_released = True
        tx_hash = "0x" + uuid.uuid4().hex
        # Record transaction
        tx = {
            "tx_id": str(uuid.uuid4()),
            "item_category": scan_doc["item_category"],
            "item_name": scan_doc["item_name"],
            "amount": scan_doc["item_price"],
            "status": "settled",
            "tx_hash": tx_hash,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.transactions.insert_one(tx)
    return VerifyResult(
        scan_id=req.scan_id,
        dual_c_verified=verified,
        credit_released=credit_released,
        tx_hash=tx_hash,
        verified_at=datetime.now(timezone.utc),
    )

@api_router.get("/pool", response_model=PoolStatus)
async def get_pool():
    count = await db.transactions.count_documents({"status": "settled"})
    total = 0.0
    async for tx in db.transactions.find({"status": "settled"}, {"_id": 0, "amount": 1}):
        total += tx.get("amount", 0.0)
    daily_capacity = 5000.0
    return PoolStatus(
        available_balance=round(max(0.0, daily_capacity - total), 2),
        daily_capacity=daily_capacity,
        capacity_used_pct=round(min(100.0, (total / daily_capacity) * 100), 1),
        incoming_tips_24h=round(total * 0.02, 2),
    )

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions():
    docs = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    result = []
    for doc in docs:
        if isinstance(doc.get("created_at"), str):
            doc["created_at"] = datetime.fromisoformat(doc["created_at"])
        result.append(Transaction(**doc))
    return result

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()