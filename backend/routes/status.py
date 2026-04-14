"""Status-check routes (kept for backward compatibility)."""
from datetime import datetime
from typing import List

from fastapi import APIRouter

from config import db
from models import StatusCheck, StatusCheckCreate

router = APIRouter(prefix="/status", tags=["status"])


@router.post("", response_model=StatusCheck)
async def create_status_check(body: StatusCheckCreate) -> StatusCheck:
    obj = StatusCheck(**body.model_dump())
    doc = obj.model_dump()
    doc["timestamp"] = doc["timestamp"].isoformat()
    await db.status_checks.insert_one(doc)
    return obj


@router.get("", response_model=List[StatusCheck])
async def get_status_checks() -> List[StatusCheck]:
    records = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for r in records:
        if isinstance(r["timestamp"], str):
            r["timestamp"] = datetime.fromisoformat(r["timestamp"])
    return records
