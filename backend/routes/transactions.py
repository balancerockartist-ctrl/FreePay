"""Transaction CRUD routes with pagination, filtering, and CSV export."""
import csv
import io
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from jose import jwt

from auth import get_current_user
from config import db, JWT_SECRET, JWT_ALGORITHM
from models import Transaction, TransactionCreate, TransactionStatus, User, UserRole, _now

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _serialize(obj: Transaction) -> dict:
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    if doc.get("settled_at"):
        doc["settled_at"] = doc["settled_at"].isoformat()
    return doc


def _deserialize(doc: dict) -> Transaction:
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    if doc.get("settled_at") and isinstance(doc["settled_at"], str):
        doc["settled_at"] = datetime.fromisoformat(doc["settled_at"])
    return Transaction(**doc)


async def _check_spend_limit(user: User, amount: float) -> None:
    """Reject if an agent JWT's spend_limit would be exceeded (rolling 24 h)."""
    if user.role != UserRole.agent or user.spend_limit is None:
        return

    since = _now().replace(hour=0, minute=0, second=0, microsecond=0)
    pipeline = [
        {
            "$match": {
                "from_account": {"$exists": True},
                "created_at": {"$gte": since.isoformat()},
            }
        },
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    # We scope to transactions created by accounts owned by this user
    owned = await db.accounts.find({"owner_id": user.id}, {"_id": 0, "id": 1}).to_list(1000)
    owned_ids = [a["id"] for a in owned]
    pipeline[0]["$match"]["from_account"] = {"$in": owned_ids}

    results = await db.transactions.aggregate(pipeline).to_list(1)
    rolling_total = results[0]["total"] if results else 0.0
    if rolling_total + amount > user.spend_limit:
        raise HTTPException(
            status_code=403,
            detail=f"Spend limit exceeded (limit: {user.spend_limit}, used: {rolling_total})",
        )


@router.post("", response_model=Transaction, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    body: TransactionCreate, current: User = Depends(get_current_user)
) -> Transaction:
    await _check_spend_limit(current, body.amount)
    obj = Transaction(**body.model_dump())
    await db.transactions.insert_one(_serialize(obj))
    return obj


@router.get("", response_model=List[Transaction])
async def list_transactions(
    format: Optional[str] = Query(None, description="Pass 'csv' for CSV download"),
    status_filter: Optional[TransactionStatus] = Query(None, alias="status"),
    from_account: Optional[str] = Query(None),
    to_account: Optional[str] = Query(None),
    currency: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    current: User = Depends(get_current_user),
) -> List[Transaction] | StreamingResponse:
    query: dict = {}
    if status_filter:
        query["status"] = status_filter.value
    if from_account:
        query["from_account"] = from_account
    if to_account:
        query["to_account"] = to_account
    if currency:
        query["currency"] = currency

    docs = (
        await db.transactions.find(query, {"_id": 0})
        .skip(skip)
        .limit(limit)
        .to_list(limit)
    )
    transactions = [_deserialize(d) for d in docs]

    if format == "csv":
        output = io.StringIO()
        writer = csv.DictWriter(
            output,
            fieldnames=["id", "from_account", "to_account", "amount", "currency",
                        "status", "external_ref", "flag_reason", "created_at", "settled_at"],
        )
        writer.writeheader()
        for t in transactions:
            writer.writerow(t.model_dump())
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=transactions.csv"},
        )

    return transactions


@router.get("/{transaction_id}", response_model=Transaction)
async def get_transaction(
    transaction_id: str, current: User = Depends(get_current_user)
) -> Transaction:
    doc = await db.transactions.find_one({"id": transaction_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return _deserialize(doc)
