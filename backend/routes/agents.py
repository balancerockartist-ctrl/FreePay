"""AI reconciliation agent routes and APScheduler job."""
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends

from auth import get_current_user, require_role
from config import db
from models import Transaction, TransactionStatus, UserRole, _now

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agents", tags=["agents"])

# ── Anomaly detection ─────────────────────────────────────────────────────────

async def _run_anomaly_detection() -> int:
    """
    Flag transactions whose amount deviates more than 3 std-devs from the
    per-account mean (z-score > 3).  Returns count of newly flagged records.
    """
    try:
        import numpy as np
    except ImportError:
        logger.warning("numpy not available — skipping anomaly detection")
        return 0

    # Pull all pending/settled transactions (not already flagged/failed)
    docs = await db.transactions.find(
        {"status": {"$in": ["pending", "settled"]}, "flag_reason": None},
        {"_id": 0},
    ).to_list(10000)

    if not docs:
        return 0

    # Group amounts by from_account
    from collections import defaultdict
    by_account: dict = defaultdict(list)
    for d in docs:
        by_account[d["from_account"]].append(d)

    flagged = 0
    for account_id, records in by_account.items():
        if len(records) < 5:
            # Not enough data to compute meaningful statistics
            continue
        amounts = np.array([r["amount"] for r in records], dtype=float)
        mean = amounts.mean()
        std = amounts.std()
        if std == 0:
            continue
        for record in records:
            z = abs((record["amount"] - mean) / std)
            if z > 3.0:
                reason = f"Anomalous amount (z-score={z:.2f}, mean={mean:.2f}, std={std:.2f})"
                await db.transactions.update_one(
                    {"id": record["id"]},
                    {"$set": {"status": TransactionStatus.flagged, "flag_reason": reason}},
                )
                flagged += 1

    return flagged


async def _reconcile_pending() -> int:
    """
    Attempt to resolve pending transactions older than 30 minutes.
    Currently auto-fails them (Stripe/EVM resolution happens via webhooks/verify-tx).
    Returns count of reconciled records.
    """
    cutoff = (_now() - timedelta(minutes=30)).isoformat()
    docs = await db.transactions.find(
        {"status": "pending", "created_at": {"$lte": cutoff}},
        {"_id": 0},
    ).to_list(1000)

    if not docs:
        return 0

    ids = [d["id"] for d in docs]
    result = await db.transactions.update_many(
        {"id": {"$in": ids}},
        {"$set": {"status": TransactionStatus.failed}},
    )
    return result.modified_count


# ── Scheduler setup ───────────────────────────────────────────────────────────

async def start_scheduler() -> None:
    """Start the APScheduler background job."""
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
    except ImportError:
        logger.warning("APScheduler not installed — skipping background jobs")
        return

    async def job():
        logger.info("Reconciliation job starting …")
        reconciled = await _reconcile_pending()
        flagged = await _run_anomaly_detection()
        logger.info("Reconciliation done — reconciled=%d, flagged=%d", reconciled, flagged)

    scheduler = AsyncIOScheduler()
    scheduler.add_job(job, "interval", minutes=15, id="reconciliation")
    scheduler.start()
    logger.info("APScheduler started (reconciliation every 15 min)")


# ── API routes ────────────────────────────────────────────────────────────────

def _deserialize_tx(doc: dict) -> Transaction:
    for field in ("created_at", "settled_at"):
        if doc.get(field) and isinstance(doc[field], str):
            doc[field] = datetime.fromisoformat(doc[field])
    return Transaction(**doc)


@router.get("/reconciliation-report", response_model=List[Transaction])
async def reconciliation_report(
    limit: int = 50,
    current=Depends(require_role(UserRole.admin, UserRole.agent)),
) -> List[Transaction]:
    """Return the most recently flagged or auto-reconciled transactions."""
    docs = await db.transactions.find(
        {"status": {"$in": [TransactionStatus.flagged, TransactionStatus.failed]}},
        {"_id": 0},
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return [_deserialize_tx(d) for d in docs]


@router.post("/run-reconciliation")
async def trigger_reconciliation(
    current=Depends(require_role(UserRole.admin)),
) -> dict:
    """Manually trigger a reconciliation + anomaly-detection pass."""
    reconciled = await _reconcile_pending()
    flagged = await _run_anomaly_detection()
    return {"reconciled": reconciled, "flagged": flagged}
