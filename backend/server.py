from fastapi import FastAPI, APIRouter, Query
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


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

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

# ---------------------------------------------------------------------------
# Models — GET /api/models
# ---------------------------------------------------------------------------

SPIRITUAL_LLMS = [
    {
        "id": 1,
        "name": "Abundance Oracle",
        "role": "Output Multiplier",
        "description": "Manages the flow of infinite giving by multiplying resource output across the network.",
    },
    {
        "id": 2,
        "name": "Closed Loop Sage",
        "role": "Reserve Balancer",
        "description": "Balances the internal funding reserves to maintain a self-sustaining closed-loop economy.",
    },
    {
        "id": 3,
        "name": "Paradigm Shifter",
        "role": "Rail Bridge",
        "description": "Bridges the gap between traditional 6G financial rails and the 7G decentralised protocol.",
    },
    {
        "id": 4,
        "name": "The Donor Spirit",
        "role": "Safety Net Activator",
        "description": "Automatically activates the humanitarian safety net for users whose balance reaches zero.",
    },
    {
        "id": 5,
        "name": "Eternal Guardian",
        "role": "Lifetime Status Keeper",
        "description": "Secures the Lifetime Membership status of a user after the initial 24-hour activation cycle.",
    },
    {
        "id": 6,
        "name": "Retailer Illuminator",
        "role": "Merchant Settlement Agent",
        "description": "Guarantees 100% instant credit settlement to merchants at checkout regardless of consumer subsidy.",
    },
    {
        "id": 7,
        "name": "Camera Consciousness",
        "role": "Visual Payment Translator",
        "description": "Translates visual data captured by the device camera into verified economic action via Dual C technology.",
    },
]


class SpiritualLLM(BaseModel):
    id: int
    name: str
    role: str
    description: str


@api_router.get("/models", response_model=List[SpiritualLLM])
async def get_models():
    """Return the parameters and ethical bounds of the 7 Spiritual LLMs."""
    return SPIRITUAL_LLMS


# ---------------------------------------------------------------------------
# Savings — GET /api/savings/calculate
# ---------------------------------------------------------------------------

CONSUMER_DISCOUNT_RATE = 0.25  # 25 % discount applied to the consumer
RETAILER_SETTLEMENT_RATE = 1.00  # Retailer always receives 100 %


class SavingsResult(BaseModel):
    original_price: float
    consumer_price: float
    retailer_settlement: float
    contract_subsidy: float
    consumer_savings: float
    discount_rate_pct: float
    settlement_rate_pct: float


@api_router.get("/savings/calculate", response_model=SavingsResult)
async def calculate_savings(
    price: float = Query(..., gt=0, description="Original item price in USD"),
):
    """
    Execute the closed-loop savings logic.

    The consumer pays ``price * (1 - CONSUMER_DISCOUNT_RATE)`` while the
    retailer receives the full ``price``.  The difference is absorbed by the
    smart contract reserve.
    """
    consumer_price = round(price * (1 - CONSUMER_DISCOUNT_RATE), 2)
    retailer_settlement = round(price * RETAILER_SETTLEMENT_RATE, 2)
    contract_subsidy = round(retailer_settlement - consumer_price, 2)
    consumer_savings = round(price - consumer_price, 2)

    return SavingsResult(
        original_price=price,
        consumer_price=consumer_price,
        retailer_settlement=retailer_settlement,
        contract_subsidy=contract_subsidy,
        consumer_savings=consumer_savings,
        discount_rate_pct=CONSUMER_DISCOUNT_RATE * 100,
        settlement_rate_pct=RETAILER_SETTLEMENT_RATE * 100,
    )


# ---------------------------------------------------------------------------
# Membership — GET /api/membership/status
# ---------------------------------------------------------------------------

ACTIVATION_WINDOW_HOURS = 24


class MembershipStatus(BaseModel):
    model_config = ConfigDict(extra="ignore")

    user_id: str
    status: str  # "trial" | "lifetime"
    joined_at: Optional[datetime]
    cycle_complete: bool
    hours_active: Optional[float]
    message: str


@api_router.get("/membership/status", response_model=MembershipStatus)
async def get_membership_status(
    user_id: str = Query(..., description="User wallet address or account ID"),
):
    """
    Verify whether the 24-hour activation cycle has been completed and return
    the user's current membership tier (trial → lifetime).
    """
    record = await db.memberships.find_one({"user_id": user_id}, {"_id": 0})

    if record is None:
        # Auto-provision a trial record on first inquiry
        joined_at = datetime.now(timezone.utc)
        new_record = {
            "user_id": user_id,
            "joined_at": joined_at.isoformat(),
            "status": "trial",
        }
        await db.memberships.insert_one(new_record)
        return MembershipStatus(
            user_id=user_id,
            status="trial",
            joined_at=joined_at,
            cycle_complete=False,
            hours_active=0.0,
            message="Trial membership started. Complete the 24-hour cycle to unlock lifetime access.",
        )

    joined_at_raw = record.get("joined_at")
    if isinstance(joined_at_raw, str):
        joined_at = datetime.fromisoformat(joined_at_raw)
    else:
        joined_at = joined_at_raw

    hours_active = (datetime.now(timezone.utc) - joined_at).total_seconds() / 3600
    cycle_complete = hours_active >= ACTIVATION_WINDOW_HOURS

    current_status = record.get("status", "trial")
    if cycle_complete and current_status == "trial":
        current_status = "lifetime"
        await db.memberships.update_one(
            {"user_id": user_id}, {"$set": {"status": "lifetime"}}
        )

    message = (
        "Lifetime membership active. All benefits unlocked."
        if current_status == "lifetime"
        else f"Trial active. {max(0.0, ACTIVATION_WINDOW_HOURS - hours_active):.1f} hours remaining to unlock lifetime access."
    )

    return MembershipStatus(
        user_id=user_id,
        status=current_status,
        joined_at=joined_at,
        cycle_complete=cycle_complete,
        hours_active=round(hours_active, 2),
        message=message,
    )


# ---------------------------------------------------------------------------
# Camera payment — GET /api/camera/payment
# ---------------------------------------------------------------------------

class CameraPaymentResult(BaseModel):
    item_id: str
    item_label: str
    detected_price: Optional[float]
    consumer_price: Optional[float]
    retailer_settlement: Optional[float]
    contract_subsidy: Optional[float]
    transaction_hash: str
    network: str
    status: str
    message: str


@api_router.get("/camera/payment", response_model=CameraPaymentResult)
async def camera_payment(
    item_id: str = Query(..., description="Identifier or label returned by the visual recognition pipeline"),
    price: Optional[float] = Query(None, gt=0, description="Detected item price in USD (supplied by the Dual C visual pipeline)"),
):
    """
    Trigger the Dual C visual logic sequence for language-agnostic checkout.

    Accepts the item identifier resolved by the device camera, applies the
    closed-loop savings calculation, and returns a pending transaction record
    hashed for settlement on the SOLANA network.
    """
    transaction_hash = str(uuid.uuid4()).replace("-", "")

    consumer_price: Optional[float] = None
    retailer_settlement: Optional[float] = None
    contract_subsidy: Optional[float] = None

    if price is not None:
        consumer_price = round(price * (1 - CONSUMER_DISCOUNT_RATE), 2)
        retailer_settlement = round(price * RETAILER_SETTLEMENT_RATE, 2)
        contract_subsidy = round(retailer_settlement - consumer_price, 2)

    doc = {
        "transaction_hash": transaction_hash,
        "item_id": item_id,
        "detected_price": price,
        "consumer_price": consumer_price,
        "retailer_settlement": retailer_settlement,
        "contract_subsidy": contract_subsidy,
        "network": "SOLANA",
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.camera_transactions.insert_one(doc)

    return CameraPaymentResult(
        item_id=item_id,
        item_label=item_id,
        detected_price=price,
        consumer_price=consumer_price,
        retailer_settlement=retailer_settlement,
        contract_subsidy=contract_subsidy,
        transaction_hash=transaction_hash,
        network="SOLANA",
        status="pending",
        message="Transaction initiated via Dual C visual pipeline. Awaiting SOLANA settlement.",
    )


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