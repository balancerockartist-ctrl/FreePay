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

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    balance: float = 1000.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserCreate(BaseModel):
    name: str
    email: str


class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    sender_name: str
    receiver_id: str
    receiver_name: str
    amount: float
    note: Optional[str] = None
    status: str = "completed"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TransactionCreate(BaseModel):
    sender_id: str
    receiver_id: str
    amount: float
    note: Optional[str] = None


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _serialize(doc: dict) -> dict:
    """Convert datetime fields to ISO strings for MongoDB storage."""
    out = {}
    for k, v in doc.items():
        out[k] = v.isoformat() if isinstance(v, datetime) else v
    return out


def _deserialize_user(doc: dict) -> dict:
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return doc


def _deserialize_tx(doc: dict) -> dict:
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return doc


# ---------------------------------------------------------------------------
# User Routes
# ---------------------------------------------------------------------------

@api_router.post("/users", response_model=User)
async def create_user(input: UserCreate):
    existing = await db.users.find_one({"email": input.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(**input.model_dump())
    await db.users.insert_one(_serialize(user.model_dump()))
    return user


@api_router.get("/users", response_model=List[User])
async def list_users():
    docs = await db.users.find({}, {"_id": 0}).to_list(1000)
    return [User(**_deserialize_user(d)) for d in docs]


@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**_deserialize_user(doc))


# ---------------------------------------------------------------------------
# Transaction Routes
# ---------------------------------------------------------------------------

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(input: TransactionCreate):
    sender_doc = await db.users.find_one({"id": input.sender_id}, {"_id": 0})
    if not sender_doc:
        raise HTTPException(status_code=404, detail="Sender not found")

    receiver_doc = await db.users.find_one({"id": input.receiver_id}, {"_id": 0})
    if not receiver_doc:
        raise HTTPException(status_code=404, detail="Receiver not found")

    amount = round(input.amount, 2)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    # Atomic deduction: only succeeds when balance >= amount
    updated_sender = await db.users.find_one_and_update(
        {"id": input.sender_id, "balance": {"$gte": amount}},
        {"$inc": {"balance": -amount}},
        return_document=True,
    )
    if not updated_sender:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    await db.users.update_one(
        {"id": input.receiver_id},
        {"$inc": {"balance": amount}}
    )

    tx = Transaction(
        sender_id=input.sender_id,
        sender_name=sender_doc["name"],
        receiver_id=input.receiver_id,
        receiver_name=receiver_doc["name"],
        amount=amount,
        note=input.note,
    )
    await db.transactions.insert_one(_serialize(tx.model_dump()))
    return tx


@api_router.get("/transactions", response_model=List[Transaction])
async def list_transactions():
    docs = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [Transaction(**_deserialize_tx(d)) for d in docs]


@api_router.get("/transactions/user/{user_id}", response_model=List[Transaction])
async def get_user_transactions(user_id: str):
    docs = await db.transactions.find(
        {"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return [Transaction(**_deserialize_tx(d)) for d in docs]


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@api_router.get("/")
async def root():
    return {"message": "FreePay API"}


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