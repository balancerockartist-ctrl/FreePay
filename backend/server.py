from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
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