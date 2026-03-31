"""Pydantic models for the FreePay application."""

import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field


class StatusCheck(BaseModel):
    """Represents a recorded status check."""

    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    """Payload for creating a new status check."""

    client_name: str
