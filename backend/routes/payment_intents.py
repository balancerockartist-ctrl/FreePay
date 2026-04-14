"""PaymentIntent CRUD routes.

Confirming a PaymentIntent creates a linked Transaction.
"""
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from config import db
from models import (
    PaymentIntent, PaymentIntentCreate, PaymentIntentStatus,
    Transaction, TransactionStatus, User, _now,
)

router = APIRouter(prefix="/payment-intents", tags=["payment-intents"])


def _serialize_pi(obj: PaymentIntent) -> dict:
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    return doc


def _deserialize_pi(doc: dict) -> PaymentIntent:
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return PaymentIntent(**doc)


@router.post("", response_model=PaymentIntent, status_code=status.HTTP_201_CREATED)
async def create_payment_intent(
    body: PaymentIntentCreate, current: User = Depends(get_current_user)
) -> PaymentIntent:
    obj = PaymentIntent(**body.model_dump())
    await db.payment_intents.insert_one(_serialize_pi(obj))
    return obj


@router.get("", response_model=List[PaymentIntent])
async def list_payment_intents(
    current: User = Depends(get_current_user),
) -> List[PaymentIntent]:
    docs = await db.payment_intents.find({}, {"_id": 0}).to_list(500)
    return [_deserialize_pi(d) for d in docs]


@router.get("/{pi_id}", response_model=PaymentIntent)
async def get_payment_intent(
    pi_id: str, current: User = Depends(get_current_user)
) -> PaymentIntent:
    doc = await db.payment_intents.find_one({"id": pi_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="PaymentIntent not found")
    return _deserialize_pi(doc)


@router.post("/{pi_id}/confirm", response_model=PaymentIntent)
async def confirm_payment_intent(
    pi_id: str, current: User = Depends(get_current_user)
) -> PaymentIntent:
    """Confirm a PaymentIntent → auto-create a linked Transaction."""
    doc = await db.payment_intents.find_one({"id": pi_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="PaymentIntent not found")
    pi = _deserialize_pi(doc)

    if pi.status != PaymentIntentStatus.requires_payment_method:
        raise HTTPException(status_code=400, detail=f"Cannot confirm PI in status '{pi.status}'")

    # Create the linked transaction
    tx = Transaction(
        from_account=pi.account_id,
        to_account=pi.account_id,  # self-transfer placeholder; caller can update
        amount=pi.amount,
        currency=pi.currency,
        status=TransactionStatus.settled,
        settled_at=_now(),
    )
    tx_doc = tx.model_dump()
    tx_doc["created_at"] = tx_doc["created_at"].isoformat()
    tx_doc["settled_at"] = tx_doc["settled_at"].isoformat()
    await db.transactions.insert_one(tx_doc)

    # Update PI
    now_iso = _now().isoformat()
    await db.payment_intents.update_one(
        {"id": pi_id},
        {"$set": {"status": PaymentIntentStatus.succeeded, "transaction_id": tx.id}},
    )
    pi.status = PaymentIntentStatus.succeeded
    pi.transaction_id = tx.id
    return pi
