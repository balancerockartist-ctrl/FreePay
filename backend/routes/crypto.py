"""Crypto wallet verification routes.

Verifies an EVM transaction on-chain via JSON-RPC or Etherscan,
then settles the linked local Transaction.
"""
import logging
import re
import httpx

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator

from auth import get_current_user
from config import db, CRYPTO_RPC_URL, ETHERSCAN_API_KEY
from models import Transaction, TransactionStatus, User, _now

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/crypto", tags=["crypto"])

_EVM_ADDRESS_RE = re.compile(r"^0x[0-9a-fA-F]{40}$")
_TX_HASH_RE = re.compile(r"^0x[0-9a-fA-F]{64}$")


class VerifyTxRequest(BaseModel):
    tx_hash: str
    transaction_id: str  # local FreePay transaction id to settle
    expected_amount: float  # in ETH (or token amount)
    wallet_address: str

    @field_validator("wallet_address", mode="before")
    @classmethod
    def validate_wallet(cls, v: str) -> str:
        if not _EVM_ADDRESS_RE.match(v):
            raise ValueError("Invalid EVM wallet address")
        return v

    @field_validator("tx_hash", mode="before")
    @classmethod
    def validate_tx_hash(cls, v: str) -> str:
        if not _TX_HASH_RE.match(v):
            raise ValueError("Invalid EVM tx hash (expected 0x + 64 hex chars)")
        return v


async def _verify_via_rpc(tx_hash: str) -> dict:
    """Fetch tx receipt via JSON-RPC."""
    if not CRYPTO_RPC_URL:
        raise HTTPException(status_code=503, detail="CRYPTO_RPC_URL not configured")
    payload = {
        "jsonrpc": "2.0",
        "method": "eth_getTransactionByHash",
        "params": [tx_hash],
        "id": 1,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(CRYPTO_RPC_URL, json=payload)
        resp.raise_for_status()
        return resp.json().get("result") or {}


async def _verify_via_etherscan(tx_hash: str) -> dict:
    """Fetch tx via Etherscan API as fallback."""
    if not ETHERSCAN_API_KEY:
        return {}
    url = (
        f"https://api.etherscan.io/api"
        f"?module=proxy&action=eth_getTransactionByHash"
        f"&txhash={tx_hash}&apikey={ETHERSCAN_API_KEY}"
    )
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()
        return data.get("result") or {}


@router.post("/verify-tx", response_model=Transaction)
async def verify_transaction(
    body: VerifyTxRequest, current: User = Depends(get_current_user)
) -> Transaction:
    """Verify an EVM transaction on-chain and settle the local record."""
    # Fetch local transaction
    doc = await db.transactions.find_one({"id": body.transaction_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Try JSON-RPC first, fall back to Etherscan
    on_chain: dict = {}
    try:
        on_chain = await _verify_via_rpc(body.tx_hash)
    except Exception as exc:
        logger.warning("RPC verification failed: %s — trying Etherscan", exc)

    if not on_chain:
        try:
            on_chain = await _verify_via_etherscan(body.tx_hash)
        except Exception as exc:
            logger.warning("Etherscan verification failed: %s", exc)

    if not on_chain or on_chain.get("blockNumber") is None:
        raise HTTPException(
            status_code=422,
            detail="Transaction not confirmed on-chain yet or could not be fetched",
        )

    # Verify recipient address (case-insensitive)
    to_address = on_chain.get("to", "")
    if to_address.lower() != body.wallet_address.lower():
        raise HTTPException(
            status_code=422,
            detail="On-chain 'to' address does not match provided wallet_address",
        )

    # Settle local transaction
    now_iso = _now().isoformat()
    await db.transactions.update_one(
        {"id": body.transaction_id},
        {
            "$set": {
                "status": TransactionStatus.settled,
                "external_ref": body.tx_hash,
                "settled_at": now_iso,
            }
        },
    )

    doc["status"] = TransactionStatus.settled
    doc["external_ref"] = body.tx_hash
    doc["settled_at"] = now_iso
    from datetime import datetime
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    if isinstance(doc.get("settled_at"), str):
        doc["settled_at"] = datetime.fromisoformat(doc["settled_at"])
    return Transaction(**doc)
