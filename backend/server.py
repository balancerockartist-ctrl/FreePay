from fastapi import FastAPI, APIRouter, HTTPException
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


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class PaymentInitiate(BaseModel):
    amount: float
    currency: str = "USD"
    is_member: bool = False
    payer_name: str = "Anonymous"
    payer_email: Optional[str] = None
    merchant_name: str = "FreePay Checkout"

class PaymentSession(BaseModel):
    model_config = ConfigDict(extra="ignore")

    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    amount: float
    currency: str
    is_member: bool
    payer_name: str
    payer_email: Optional[str]
    merchant_name: str
    status: str = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DeviceRegister(BaseModel):
    device_id: str
    nickname: str = "My Device"
    user_agent: Optional[str] = None

class DeviceRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")

    device_id: str
    nickname: str
    user_agent: Optional[str]
    status: str = "active"
    linked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# Routes – status (existing)
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Routes – payments
# ---------------------------------------------------------------------------

@api_router.post("/payment/initiate", response_model=PaymentSession)
async def initiate_payment(input: PaymentInitiate):
    if input.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero.")

    session = PaymentSession(**input.model_dump())
    doc = session.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()

    await db.payment_sessions.insert_one(doc)
    return session


@api_router.get("/payment/{session_id}", response_model=PaymentSession)
async def get_payment_session(session_id: str):
    doc = await db.payment_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Payment session not found.")

    if isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])

    return PaymentSession(**doc)


# ---------------------------------------------------------------------------
# Routes – device registration
# ---------------------------------------------------------------------------

@api_router.post("/device/register", response_model=DeviceRecord)
async def register_device(input: DeviceRegister):
    if not input.device_id or len(input.device_id) < 8:
        raise HTTPException(status_code=400, detail="Invalid device_id: must be at least 8 characters.")

    # Upsert: update if exists, insert otherwise
    record = DeviceRecord(**input.model_dump())
    doc = record.model_dump()
    doc['linked_at'] = doc['linked_at'].isoformat()

    await db.devices.update_one(
        {"device_id": input.device_id},
        {"$set": doc},
        upsert=True,
    )
    return record


@api_router.get("/device/{device_id}", response_model=DeviceRecord)
async def get_device(device_id: str):
    doc = await db.devices.find_one({"device_id": device_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Device not found.")

    if isinstance(doc.get('linked_at'), str):
        doc['linked_at'] = datetime.fromisoformat(doc['linked_at'])

    return DeviceRecord(**doc)


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

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