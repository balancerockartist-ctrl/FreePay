"""Account CRUD routes with running-balance aggregation."""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from config import db
from models import Account, AccountCreate, AccountWithBalance, User

router = APIRouter(prefix="/accounts", tags=["accounts"])


def _serialize(obj: Account) -> dict:
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    return doc


async def _get_balance(account_id: str) -> float:
    """Sum settled credits minus settled debits for an account."""
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"to_account": account_id, "status": "settled"},
                    {"from_account": account_id, "status": "settled"},
                ]
            }
        },
        {
            "$group": {
                "_id": None,
                "credits": {
                    "$sum": {
                        "$cond": [{"$eq": ["$to_account", account_id]}, "$amount", 0]
                    }
                },
                "debits": {
                    "$sum": {
                        "$cond": [{"$eq": ["$from_account", account_id]}, "$amount", 0]
                    }
                },
            }
        },
    ]
    results = await db.transactions.aggregate(pipeline).to_list(1)
    if not results:
        return 0.0
    return results[0]["credits"] - results[0]["debits"]


@router.post("", response_model=Account, status_code=status.HTTP_201_CREATED)
async def create_account(
    body: AccountCreate, current: User = Depends(get_current_user)
) -> Account:
    obj = Account(owner_id=current.id, **body.model_dump())
    await db.accounts.insert_one(_serialize(obj))
    return obj


@router.get("", response_model=List[Account])
async def list_accounts(current: User = Depends(get_current_user)) -> List[Account]:
    query = {} if current.role == "admin" else {"owner_id": current.id}
    docs = await db.accounts.find(query, {"_id": 0}).to_list(1000)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs


@router.get("/{account_id}", response_model=AccountWithBalance)
async def get_account(
    account_id: str, current: User = Depends(get_current_user)
) -> AccountWithBalance:
    doc = await db.accounts.find_one({"id": account_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Account not found")
    if current.role != "admin" and doc["owner_id"] != current.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    balance = await _get_balance(account_id)
    return AccountWithBalance(**doc, balance=balance)
