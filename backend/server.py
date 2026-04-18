from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import string
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


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

class CameraPaymentRequest(BaseModel):
    item_label: str
    amount: float
    wallet_address: Optional[str] = None


class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    account_id: str
    amount: float  # positive = credit, negative = debit
    currency: str = "USD"
    description: str = ""
    status: Literal["pending", "completed", "failed"] = "completed"
    external_ref: Optional[str] = None  # wallet tx hash, Stripe charge id, etc.
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    account_id: str
    amount: float
    currency: str = "USD"
    description: str = ""
    status: Literal["pending", "completed", "failed"] = "completed"
    external_ref: Optional[str] = None

class TransactionUpdate(BaseModel):
    description: Optional[str] = None
    status: Optional[Literal["pending", "completed", "failed"]] = None
    external_ref: Optional[str] = None


class Account(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    currency: str = "USD"
    owner: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AccountCreate(BaseModel):
    name: str
    currency: str = "USD"
    owner: Optional[str] = None

class AccountWithBalance(Account):
    balance: float = 0.0


# ---------------------------------------------------------------------------
# Helper: datetime serialization
# ---------------------------------------------------------------------------

def _serialize_doc(doc: dict) -> dict:
    """Convert datetime fields to ISO strings for MongoDB storage."""
    for key in ("created_at", "updated_at", "timestamp"):
        if key in doc and isinstance(doc[key], datetime):
            doc[key] = doc[key].isoformat()
    return doc

def _deserialize_transactions(docs: list) -> list:
    for doc in docs:
        for key in ("created_at", "updated_at"):
            if key in doc and isinstance(doc[key], str):
                doc[key] = datetime.fromisoformat(doc[key])
    return docs

def _deserialize_accounts(docs: list) -> list:
    for doc in docs:
        for key in ("created_at", "updated_at"):
            if key in doc and isinstance(doc[key], str):
                doc[key] = datetime.fromisoformat(doc[key])
    return docs


# ---------------------------------------------------------------------------
# Status routes
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)

    doc = _serialize_doc(status_obj.model_dump())
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check.get('timestamp'), str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


# ---------------------------------------------------------------------------
# Transaction routes
# ---------------------------------------------------------------------------

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(input: TransactionCreate):
    account = await db.accounts.find_one({"id": input.account_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    tx = Transaction(**input.model_dump())
    doc = _serialize_doc(tx.model_dump())
    await db.transactions.insert_one(doc)
    logger.info("Transaction created: id=%s account=%s amount=%s", tx.id, tx.account_id, tx.amount)
    return tx

@api_router.get("/transactions", response_model=List[Transaction])
async def list_transactions(account_id: Optional[str] = None):
    query: dict = {}
    if account_id:
        query["account_id"] = account_id
    docs = await db.transactions.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return _deserialize_transactions(docs)

# Recent transactions feed (must be defined before /{transaction_id} to avoid routing conflict)
@api_router.get("/transactions/feed")
async def get_transaction_feed():
    txs = await db.transactions.find({}, {"_id": 0}).sort("timestamp", -1).to_list(20)
    return txs

@api_router.get("/transactions/{transaction_id}", response_model=Transaction)
async def get_transaction(transaction_id: str):
    doc = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Transaction not found")
    _deserialize_transactions([doc])
    return doc

@api_router.patch("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, input: TransactionUpdate):
    doc = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Transaction not found")

    update_fields = {k: v for k, v in input.model_dump().items() if v is not None}
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.transactions.update_one({"id": transaction_id}, {"$set": update_fields})
    updated = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    _deserialize_transactions([updated])
    logger.info("Transaction updated: id=%s fields=%s", transaction_id, list(update_fields.keys()))
    return updated

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    result = await db.transactions.delete_one({"id": transaction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    logger.info("Transaction deleted: id=%s", transaction_id)
    return {"deleted": True, "id": transaction_id}


# ---------------------------------------------------------------------------
# Account routes
# ---------------------------------------------------------------------------

@api_router.post("/accounts", response_model=Account)
async def create_account(input: AccountCreate):
    account = Account(**input.model_dump())
    doc = _serialize_doc(account.model_dump())
    await db.accounts.insert_one(doc)
    logger.info("Account created: id=%s name=%s", account.id, account.name)
    return account

@api_router.get("/accounts", response_model=List[AccountWithBalance])
async def list_accounts():
    docs = await db.accounts.find({}, {"_id": 0}).to_list(1000)
    _deserialize_accounts(docs)
    result = []
    for doc in docs:
        balance = await _compute_balance(doc["id"])
        result.append({**doc, "balance": balance})
    return result

@api_router.get("/accounts/{account_id}", response_model=AccountWithBalance)
async def get_account(account_id: str):
    doc = await db.accounts.find_one({"id": account_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Account not found")
    _deserialize_accounts([doc])
    balance = await _compute_balance(account_id)
    return {**doc, "balance": balance}

@api_router.delete("/accounts/{account_id}")
async def delete_account(account_id: str):
    result = await db.accounts.delete_one({"id": account_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    logger.info("Account deleted: id=%s", account_id)
    return {"deleted": True, "id": account_id}


async def _compute_balance(account_id: str) -> float:
    """Sum all completed transaction amounts for an account."""
    pipeline = [
        {"$match": {"account_id": account_id, "status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    cursor = db.transactions.aggregate(pipeline)
    result = await cursor.to_list(1)
    return result[0]["total"] if result else 0.0


# ---------------------------------------------------------------------------
# 7G Camera Consciousness routes
# ---------------------------------------------------------------------------
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()