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
app = FastAPI(title="FreePay API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ── Models ─────────────────────────────────────────────────────────────────

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class CameraPaymentRequest(BaseModel):
    item_label: str
    amount: float
    currency: str = "USD"
    buyer_wallet: Optional[str] = None
    merchant_wallet: Optional[str] = None

class CameraPaymentResponse(BaseModel):
    transaction_id: str
    item_label: str
    original_amount: float
    discount_amount: float
    consumer_price: float
    voluntary_tip_suggestion: float
    currency: str
    status: str
    timestamp: datetime

class SavingsCalculation(BaseModel):
    original_amount: float
    discount_rate: float
    discount_amount: float
    consumer_price: float
    voluntary_tip_suggestion: float
    tip_rate: float

class AIModel(BaseModel):
    id: str
    name: str
    role: str
    description: str

# ── Routes ──────────────────────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "FreePay API is running"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)

    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()

    _ = await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)

    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])

    return status_checks


@api_router.get("/models", response_model=List[AIModel])
async def get_models():
    """Return the AI model configuration used by the FreePay logic layer."""
    models = [
        AIModel(
            id="abundance-oracle",
            name="Abundance Oracle",
            role="discount_engine",
            description="Applies the configurable discount rate to the transaction amount.",
        ),
        AIModel(
            id="closed-loop-sage",
            name="Closed Loop Sage",
            role="balance_monitor",
            description="Monitors reserve balances and flags transactions when liquidity is insufficient.",
        ),
        AIModel(
            id="paradigm-shifter",
            name="Paradigm Shifter",
            role="protocol_bridge",
            description="Translates between legacy payment rail formats and the on-chain instruction set.",
        ),
        AIModel(
            id="donor-spirit",
            name="Donor Spirit",
            role="safety_net",
            description="Identifies zero-balance users and routes them to available assistance programs.",
        ),
        AIModel(
            id="eternal-guardian",
            name="Eternal Guardian",
            role="membership_verifier",
            description="Verifies membership status and tracks the 24-hour activation cycle.",
        ),
        AIModel(
            id="retailer-illuminator",
            name="Retailer Illuminator",
            role="settlement_coordinator",
            description="Coordinates merchant credit settlement and reconciliation.",
        ),
        AIModel(
            id="camera-consciousness",
            name="Camera Consciousness",
            role="visual_classifier",
            description="Classifies captured frames into item categories (Food, Clothing, Shelter, Transport).",
        ),
    ]
    return models


@api_router.get("/savings/calculate", response_model=SavingsCalculation)
async def calculate_savings(amount: float, discount_rate: float = 0.10, tip_rate: float = 0.90):
    """
    Calculate the payment split for a given transaction amount.

    - discount_rate: fraction of the total offered as an instant discount (default 10%).
    - tip_rate: fraction of the remaining amount suggested as a voluntary tip (default 90%).
    """
    if amount <= 0:
        raise HTTPException(status_code=422, detail="amount must be positive")
    if not (0 <= discount_rate < 1):
        raise HTTPException(status_code=422, detail="discount_rate must be between 0 and 1")
    if not (0 <= tip_rate <= 1):
        raise HTTPException(status_code=422, detail="tip_rate must be between 0 and 1")

    discount_amount = round(amount * discount_rate, 2)
    consumer_price = round(amount - discount_amount, 2)
    voluntary_tip_suggestion = round(consumer_price * tip_rate, 2)

    return SavingsCalculation(
        original_amount=amount,
        discount_rate=discount_rate,
        discount_amount=discount_amount,
        consumer_price=consumer_price,
        voluntary_tip_suggestion=voluntary_tip_suggestion,
        tip_rate=tip_rate,
    )


@api_router.post("/camera/payment", response_model=CameraPaymentResponse)
async def process_camera_payment(payload: CameraPaymentRequest):
    """
    Accept a visual-recognition payment request and return the calculated
    transaction breakdown.  Wallet addresses are supplied by the client and
    are never hard-coded server-side.
    """
    if payload.amount <= 0:
        raise HTTPException(status_code=422, detail="amount must be positive")

    discount_rate = 0.10
    discount_amount = round(payload.amount * discount_rate, 2)
    consumer_price = round(payload.amount - discount_amount, 2)
    voluntary_tip_suggestion = round(consumer_price * 0.90, 2)

    transaction_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    doc = {
        "transaction_id": transaction_id,
        "item_label": payload.item_label,
        "original_amount": payload.amount,
        "discount_amount": discount_amount,
        "consumer_price": consumer_price,
        "voluntary_tip_suggestion": voluntary_tip_suggestion,
        "currency": payload.currency,
        "buyer_wallet": payload.buyer_wallet,
        "merchant_wallet": payload.merchant_wallet,
        "status": "pending",
        "timestamp": now.isoformat(),
    }
    await db.camera_payments.insert_one(doc)

    return CameraPaymentResponse(
        transaction_id=transaction_id,
        item_label=payload.item_label,
        original_amount=payload.amount,
        discount_amount=discount_amount,
        consumer_price=consumer_price,
        voluntary_tip_suggestion=voluntary_tip_suggestion,
        currency=payload.currency,
        status="pending",
        timestamp=now,
    )


# ── App wiring ──────────────────────────────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()