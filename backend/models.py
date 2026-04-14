"""
All Pydantic models for FreePay.
"""
from __future__ import annotations

import uuid
import re
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict, field_validator


# ── Helpers ───────────────────────────────────────────────────────────────────

def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ── Enums ─────────────────────────────────────────────────────────────────────

class UserRole(str, Enum):
    admin = "admin"
    user = "user"
    agent = "agent"


class TransactionStatus(str, Enum):
    pending = "pending"
    settled = "settled"
    failed = "failed"
    flagged = "flagged"


class PaymentIntentStatus(str, Enum):
    requires_payment_method = "requires_payment_method"
    processing = "processing"
    succeeded = "succeeded"
    canceled = "canceled"


class TransferStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"


# ── StatusCheck ───────────────────────────────────────────────────────────────

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=_uuid)
    client_name: str
    timestamp: datetime = Field(default_factory=_now)


class StatusCheckCreate(BaseModel):
    client_name: str


# ── User ──────────────────────────────────────────────────────────────────────

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=_uuid)
    email: str
    hashed_password: str
    role: UserRole = UserRole.user
    api_key: str = Field(default_factory=_uuid)
    spend_limit: Optional[float] = None  # used for agent JWTs
    created_at: datetime = Field(default_factory=_now)


class UserCreate(BaseModel):
    email: str
    password: str
    role: UserRole = UserRole.user
    spend_limit: Optional[float] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    email: str
    role: UserRole
    api_key: str
    spend_limit: Optional[float]
    created_at: datetime


# ── Account ───────────────────────────────────────────────────────────────────

_EVM_ADDRESS_RE = re.compile(r"^0x[0-9a-fA-F]{40}$")


class Account(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=_uuid)
    owner_id: str
    label: str
    currency: str = "USD"
    wallet_address: Optional[str] = None
    created_at: datetime = Field(default_factory=_now)

    @field_validator("wallet_address", mode="before")
    @classmethod
    def validate_wallet(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not _EVM_ADDRESS_RE.match(v):
            raise ValueError("wallet_address must be a valid EVM address (0x + 40 hex chars)")
        return v


class AccountCreate(BaseModel):
    label: str
    currency: str = "USD"
    wallet_address: Optional[str] = None

    @field_validator("wallet_address", mode="before")
    @classmethod
    def validate_wallet(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not _EVM_ADDRESS_RE.match(v):
            raise ValueError("wallet_address must be a valid EVM address (0x + 40 hex chars)")
        return v


class AccountWithBalance(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    owner_id: str
    label: str
    currency: str
    wallet_address: Optional[str]
    created_at: datetime
    balance: float = 0.0


# ── Transaction ───────────────────────────────────────────────────────────────

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=_uuid)
    from_account: str
    to_account: str
    amount: float
    currency: str = "USD"
    status: TransactionStatus = TransactionStatus.pending
    external_ref: Optional[str] = None
    flag_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=_now)
    settled_at: Optional[datetime] = None


class TransactionCreate(BaseModel):
    from_account: str
    to_account: str
    amount: float
    currency: str = "USD"
    external_ref: Optional[str] = None


# ── PaymentIntent ─────────────────────────────────────────────────────────────

class PaymentIntent(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=_uuid)
    amount: float
    currency: str = "USD"
    status: PaymentIntentStatus = PaymentIntentStatus.requires_payment_method
    account_id: str
    stripe_pi_id: Optional[str] = None
    transaction_id: Optional[str] = None  # linked after confirmation
    created_at: datetime = Field(default_factory=_now)


class PaymentIntentCreate(BaseModel):
    amount: float
    currency: str = "USD"
    account_id: str


# ── Transfer ──────────────────────────────────────────────────────────────────

class Transfer(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=_uuid)
    from_account: str
    to_account: str
    amount: float
    currency: str = "USD"
    status: TransferStatus = TransferStatus.pending
    created_at: datetime = Field(default_factory=_now)


class TransferCreate(BaseModel):
    from_account: str
    to_account: str
    amount: float
    currency: str = "USD"
