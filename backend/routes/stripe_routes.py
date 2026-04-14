"""Stripe integration routes.

Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET env vars.
"""
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status

from auth import get_current_user
from config import db, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
from models import (
    PaymentIntent, PaymentIntentCreate, PaymentIntentStatus,
    Transaction, TransactionStatus, User, _now,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/stripe", tags=["stripe"])


def _get_stripe():
    """Lazily import stripe to avoid hard-failing if SDK not installed."""
    try:
        import stripe as _stripe
        if not STRIPE_SECRET_KEY:
            raise HTTPException(status_code=503, detail="Stripe not configured")
        _stripe.api_key = STRIPE_SECRET_KEY
        return _stripe
    except ImportError:
        raise HTTPException(status_code=503, detail="Stripe SDK not installed")


def _serialize_pi(obj: PaymentIntent) -> dict:
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    return doc


@router.post("/payment-intent", response_model=PaymentIntent, status_code=status.HTTP_201_CREATED)
async def create_stripe_payment_intent(
    body: PaymentIntentCreate, current: User = Depends(get_current_user)
) -> PaymentIntent:
    """Create a real Stripe PaymentIntent and store a local mirror."""
    stripe = _get_stripe()

    # Stripe amounts are in the smallest currency unit (cents for USD)
    amount_cents = int(body.amount * 100)
    try:
        stripe_pi = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency=body.currency.lower(),
            metadata={"account_id": body.account_id},
        )
    except Exception as exc:
        logger.exception("Stripe PaymentIntent creation failed")
        raise HTTPException(status_code=502, detail=str(exc))

    pi = PaymentIntent(
        amount=body.amount,
        currency=body.currency,
        status=PaymentIntentStatus.processing,
        account_id=body.account_id,
        stripe_pi_id=stripe_pi["id"],
    )
    await db.payment_intents.insert_one(_serialize_pi(pi))
    return pi


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request) -> dict:
    """Handle Stripe webhook events. No auth required — verified by signature."""
    stripe = _get_stripe()
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Webhook verification failed: {exc}")

    event_type = event["type"]
    pi_obj = event.get("data", {}).get("object", {})
    stripe_pi_id = pi_obj.get("id")

    if not stripe_pi_id:
        return {"status": "ignored"}

    now_iso = _now().isoformat()

    if event_type == "payment_intent.succeeded":
        doc = await db.payment_intents.find_one({"stripe_pi_id": stripe_pi_id}, {"_id": 0})
        if doc:
            # Create linked transaction if not already present
            if not doc.get("transaction_id"):
                tx = Transaction(
                    from_account=doc["account_id"],
                    to_account=doc["account_id"],
                    amount=doc["amount"],
                    currency=doc["currency"],
                    status=TransactionStatus.settled,
                    external_ref=stripe_pi_id,
                    settled_at=_now(),
                )
                tx_doc = tx.model_dump()
                tx_doc["created_at"] = tx_doc["created_at"].isoformat()
                tx_doc["settled_at"] = tx_doc["settled_at"].isoformat()
                await db.transactions.insert_one(tx_doc)
                await db.payment_intents.update_one(
                    {"stripe_pi_id": stripe_pi_id},
                    {"$set": {"status": PaymentIntentStatus.succeeded, "transaction_id": tx.id}},
                )
            else:
                await db.payment_intents.update_one(
                    {"stripe_pi_id": stripe_pi_id},
                    {"$set": {"status": PaymentIntentStatus.succeeded}},
                )
            await db.transactions.update_many(
                {"external_ref": stripe_pi_id},
                {"$set": {"status": TransactionStatus.settled, "settled_at": now_iso}},
            )

    elif event_type in ("payment_intent.payment_failed", "payment_intent.canceled"):
        await db.payment_intents.update_one(
            {"stripe_pi_id": stripe_pi_id},
            {"$set": {"status": PaymentIntentStatus.canceled}},
        )
        await db.transactions.update_many(
            {"external_ref": stripe_pi_id},
            {"$set": {"status": TransactionStatus.failed}},
        )

    elif event_type == "charge.refunded":
        # Mark the associated transaction as failed (refunded)
        charge = pi_obj
        pi_id = charge.get("payment_intent")
        if pi_id:
            await db.transactions.update_many(
                {"external_ref": pi_id},
                {"$set": {"status": TransactionStatus.failed}},
            )

    return {"status": "ok", "type": event_type}
