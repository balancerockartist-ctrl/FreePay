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


# ── Models ────────────────────────────────────────────────────────────────────

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class SavingsResult(BaseModel):
    total_amount: float
    consumer_price: float
    network_fee_sol: float

class CameraPaymentRequest(BaseModel):
    image_data_url: str
    item_category: str
    amount_sol: float
    recipient_address: str

class CameraPaymentResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    item_category: str
    amount_sol: float
    recipient_address: str
    status: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ── Routes ────────────────────────────────────────────────────────────────────

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

@api_router.get("/savings/calculate", response_model=SavingsResult)
async def calculate_savings(total_amount: float):
    """Return a simple price breakdown for the given total amount (USD).

    The Solana network fee shown here is a typical estimate in SOL; the actual
    fee is determined by the network at transaction time.
    """
    # Example: display the amount as-is with an estimated Solana network fee.
    # There is no hidden discount, subsidy, or royalty applied here.
    estimated_network_fee_sol = 0.000005  # ~5000 lamports, typical base fee
    return SavingsResult(
        total_amount=total_amount,
        consumer_price=total_amount,
        network_fee_sol=estimated_network_fee_sol,
    )

@api_router.post("/camera/payment", response_model=CameraPaymentResponse)
async def create_camera_payment(payload: CameraPaymentRequest):
    """Record a camera-initiated payment intent in the database.

    The actual SOL transfer is signed and broadcast by the client wallet;
    this endpoint stores the intent for audit and history purposes.
    """
    record = CameraPaymentResponse(
        item_category=payload.item_category,
        amount_sol=payload.amount_sol,
        recipient_address=payload.recipient_address,
        status="pending",
    )
    doc = record.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.camera_payments.insert_one(doc)
    return record

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
