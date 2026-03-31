"""Status check API endpoints."""

from datetime import datetime
from typing import List

from fastapi import APIRouter

from config import db
from models import StatusCheck, StatusCheckCreate

router = APIRouter()


@router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    """Record a new status check."""
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)

    doc = status_obj.model_dump()
    doc["timestamp"] = doc["timestamp"].isoformat()

    await db.status_checks.insert_one(doc)
    return status_obj


@router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    """Retrieve all recorded status checks."""
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)

    for check in status_checks:
        if isinstance(check["timestamp"], str):
            check["timestamp"] = datetime.fromisoformat(check["timestamp"])

    return status_checks
