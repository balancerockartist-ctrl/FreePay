"""Transfer CRUD routes."""
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from config import db
from models import Transfer, TransferCreate, User

router = APIRouter(prefix="/transfers", tags=["transfers"])


def _serialize(obj: Transfer) -> dict:
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    return doc


def _deserialize(doc: dict) -> Transfer:
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return Transfer(**doc)


@router.post("", response_model=Transfer, status_code=status.HTTP_201_CREATED)
async def create_transfer(
    body: TransferCreate, current: User = Depends(get_current_user)
) -> Transfer:
    obj = Transfer(**body.model_dump())
    await db.transfers.insert_one(_serialize(obj))
    return obj


@router.get("", response_model=List[Transfer])
async def list_transfers(current: User = Depends(get_current_user)) -> List[Transfer]:
    docs = await db.transfers.find({}, {"_id": 0}).to_list(500)
    return [_deserialize(d) for d in docs]


@router.get("/{transfer_id}", response_model=Transfer)
async def get_transfer(
    transfer_id: str, current: User = Depends(get_current_user)
) -> Transfer:
    doc = await db.transfers.find_one({"id": transfer_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Transfer not found")
    return _deserialize(doc)
