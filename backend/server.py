from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import string
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

class CameraPaymentRequest(BaseModel):
    item_label: str
    amount: float
    wallet_address: Optional[str] = None

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

# 7 Spiritual LLMs configuration endpoint
@api_router.get("/models")
async def get_spiritual_llms():
    return {
        "protocol": "Free Pay 7G",
        "license": "CC0",
        "models": [
            {
                "id": 1,
                "name": "Abundance Oracle",
                "role": "Manages the flow of infinite giving by applying the 25% abundance discount.",
                "parameter": "abundance_discount",
                "value": 0.25
            },
            {
                "id": 2,
                "name": "Closed Loop Sage",
                "role": "Balances internal funding reserves so the protocol absorbs the subsidy.",
                "parameter": "protocol_absorption_rate",
                "value": 0.25
            },
            {
                "id": 3,
                "name": "Paradigm Shifter",
                "role": "Bridges traditional payment rails with the 7G protocol.",
                "parameter": "bridge_enabled",
                "value": True
            },
            {
                "id": 4,
                "name": "Donor Spirit",
                "role": "Activates the safety net for users whose balance reaches zero.",
                "parameter": "safety_net_threshold",
                "value": 0.0
            },
            {
                "id": 5,
                "name": "Eternal Guardian",
                "role": "Secures Lifetime Status after the initial 24-hour activation cycle.",
                "parameter": "lifetime_cycle_hours",
                "value": 24
            },
            {
                "id": 6,
                "name": "Retailer Illuminator",
                "role": "Guarantees 100% instant credit settlement to merchants at checkout.",
                "parameter": "retailer_settlement_rate",
                "value": 1.0
            },
            {
                "id": 7,
                "name": "Camera Consciousness",
                "role": "Translates visual data from Dual C into economic action on the SOLANA network.",
                "parameter": "visual_ai_enabled",
                "value": True
            }
        ]
    }

# Closed-loop savings calculation: 25% consumer discount / 100% retailer settlement
@api_router.get("/savings/calculate")
async def calculate_savings(amount: float = 100.0):
    abundance_discount = 0.25
    consumer_price = round(amount * (1 - abundance_discount), 2)
    retailer_credit = round(amount, 2)
    protocol_absorption = round(amount * abundance_discount, 2)
    savings = round(amount - consumer_price, 2)
    return {
        "original_amount": amount,
        "consumer_price": consumer_price,
        "retailer_credit": retailer_credit,
        "protocol_absorption": protocol_absorption,
        "savings": savings,
        "abundance_discount_pct": int(abundance_discount * 100),
        "retailer_settlement_pct": 100,
        "currency": "USD"
    }

# Membership / Lifetime Status check
@api_router.get("/membership/status")
async def get_membership_status(wallet_address: Optional[str] = None):
    now = datetime.now(timezone.utc)
    member = None
    if wallet_address:
        member = await db.members.find_one({"wallet_address": wallet_address}, {"_id": 0})
    if member:
        joined_at = datetime.fromisoformat(member["joined_at"]) if isinstance(member["joined_at"], str) else member["joined_at"]
        hours_active = (now - joined_at).total_seconds() / 3600
        is_lifetime = hours_active >= 24
        return {
            "wallet_address": wallet_address,
            "is_lifetime": is_lifetime,
            "hours_active": round(hours_active, 2),
            "lifetime_threshold_hours": 24,
            "joined_at": joined_at.isoformat()
        }
    # Default for new/unknown wallets
    return {
        "wallet_address": wallet_address,
        "is_lifetime": False,
        "hours_active": 0,
        "lifetime_threshold_hours": 24,
        "joined_at": now.isoformat()
    }

# Camera payment trigger: Dual C visual logic
@api_router.post("/camera/payment")
async def process_camera_payment(payload: CameraPaymentRequest):
    # NOTE: This generates a simulated transaction hash in the format used by the
    # Solana network. Full on-chain execution requires a deployed SOLULM program
    # and funded protocol reserve account. This PoC demonstrates the closed-loop
    # economics logic (25% consumer discount / 100% retailer settlement) and
    # produces a placeholder tx_hash in the expected Solana base-58 format.
    simulated_tx_hash = "Sol" + "".join(random.choices(string.ascii_letters + string.digits, k=43))
    savings_data = await calculate_savings(payload.amount)
    transaction = {
        "id": str(uuid.uuid4()),
        "tx_hash": simulated_tx_hash,
        "item_label": payload.item_label,
        "wallet_address": payload.wallet_address,
        "original_amount": savings_data["original_amount"],
        "consumer_price": savings_data["consumer_price"],
        "retailer_credit": savings_data["retailer_credit"],
        "protocol_absorption": savings_data["protocol_absorption"],
        "network": "SOLANA",
        "status": "confirmed",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    doc = dict(transaction)
    await db.transactions.insert_one(doc)
    return transaction

# Recent transactions feed
@api_router.get("/transactions/feed")
async def get_transaction_feed():
    txs = await db.transactions.find({}, {"_id": 0}).sort("timestamp", -1).to_list(20)
    return txs

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