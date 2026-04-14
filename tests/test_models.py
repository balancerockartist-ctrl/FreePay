"""Tests for the Pydantic models in backend/server.py."""
import os
import sys
from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

# Ensure env vars are set before app import (conftest does this too, but be safe)
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_freepay")

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.server import StatusCheck, StatusCheckCreate


# ---------------------------------------------------------------------------
# StatusCheckCreate
# ---------------------------------------------------------------------------

class TestStatusCheckCreate:
    def test_valid_client_name(self):
        obj = StatusCheckCreate(client_name="my-service")
        assert obj.client_name == "my-service"

    def test_missing_client_name_raises(self):
        with pytest.raises(ValidationError):
            StatusCheckCreate()

    def test_none_client_name_raises(self):
        with pytest.raises(ValidationError):
            StatusCheckCreate(client_name=None)

    def test_empty_string_is_accepted(self):
        obj = StatusCheckCreate(client_name="")
        assert obj.client_name == ""

    def test_integer_client_name_raises_validation_error(self):
        """Pydantic v2 does not coerce int to str by default."""
        with pytest.raises(ValidationError):
            StatusCheckCreate(client_name=42)

    def test_extra_fields_are_ignored(self):
        # StatusCheckCreate does not set extra="ignore" explicitly;
        # Pydantic v2 default is to ignore extras when not configured
        obj = StatusCheckCreate(client_name="ok", extra_field="ignored")
        assert obj.client_name == "ok"


# ---------------------------------------------------------------------------
# StatusCheck
# ---------------------------------------------------------------------------

class TestStatusCheck:
    def test_auto_generates_id(self):
        obj = StatusCheck(client_name="svc")
        assert obj.id is not None
        assert len(obj.id) > 0

    def test_ids_are_unique(self):
        ids = {StatusCheck(client_name="svc").id for _ in range(20)}
        assert len(ids) == 20

    def test_auto_generates_timestamp(self):
        before = datetime.now(timezone.utc)
        obj = StatusCheck(client_name="svc")
        after = datetime.now(timezone.utc)
        assert before <= obj.timestamp <= after

    def test_explicit_id_is_preserved(self):
        obj = StatusCheck(id="fixed-id", client_name="svc")
        assert obj.id == "fixed-id"

    def test_explicit_timestamp_is_preserved(self):
        ts = datetime(2024, 6, 1, 12, 0, 0, tzinfo=timezone.utc)
        obj = StatusCheck(client_name="svc", timestamp=ts)
        assert obj.timestamp == ts

    def test_client_name_is_stored(self):
        obj = StatusCheck(client_name="hello")
        assert obj.client_name == "hello"

    def test_missing_client_name_raises(self):
        with pytest.raises(ValidationError):
            StatusCheck()

    def test_extra_fields_ignored_due_to_config(self):
        """model_config = ConfigDict(extra="ignore") should drop unknown fields."""
        obj = StatusCheck(client_name="svc", _id="mongo-id", unknown="value")
        assert not hasattr(obj, "_id")
        assert not hasattr(obj, "unknown")

    def test_model_dump_contains_expected_keys(self):
        obj = StatusCheck(client_name="svc")
        dumped = obj.model_dump()
        assert set(dumped.keys()) == {"id", "client_name", "timestamp"}

    def test_model_dump_timestamp_is_datetime(self):
        obj = StatusCheck(client_name="svc")
        dumped = obj.model_dump()
        assert isinstance(dumped["timestamp"], datetime)
