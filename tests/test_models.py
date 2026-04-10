"""Tests for the Pydantic models defined in backend/server.py."""
import os
import uuid
from datetime import datetime, timezone

import pytest

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_db")


from backend.server import StatusCheck, StatusCheckCreate  # noqa: E402


class TestStatusCheckCreate:
    def test_valid_creation(self):
        obj = StatusCheckCreate(client_name="test-client")
        assert obj.client_name == "test-client"

    def test_missing_client_name_raises(self):
        with pytest.raises(Exception):
            StatusCheckCreate()

    def test_model_dump(self):
        obj = StatusCheckCreate(client_name="alice")
        data = obj.model_dump()
        assert data == {"client_name": "alice"}


class TestStatusCheck:
    def test_auto_generated_id(self):
        obj = StatusCheck(client_name="bob")
        # id should be a valid UUID string
        parsed = uuid.UUID(obj.id)
        assert str(parsed) == obj.id

    def test_unique_ids(self):
        a = StatusCheck(client_name="a")
        b = StatusCheck(client_name="b")
        assert a.id != b.id

    def test_auto_generated_timestamp(self):
        before = datetime.now(timezone.utc)
        obj = StatusCheck(client_name="ts-test")
        after = datetime.now(timezone.utc)
        assert before <= obj.timestamp <= after

    def test_explicit_id_accepted(self):
        custom_id = str(uuid.uuid4())
        obj = StatusCheck(id=custom_id, client_name="explicit")
        assert obj.id == custom_id

    def test_explicit_timestamp_accepted(self):
        ts = datetime(2024, 1, 15, 12, 0, 0, tzinfo=timezone.utc)
        obj = StatusCheck(client_name="ts", timestamp=ts)
        assert obj.timestamp == ts

    def test_extra_fields_ignored(self):
        """model_config extra='ignore' should silently drop unknown fields."""
        obj = StatusCheck(client_name="extra", _id="mongo-object-id")
        assert not hasattr(obj, "_id")

    def test_model_dump_contains_expected_keys(self):
        obj = StatusCheck(client_name="dump-test")
        data = obj.model_dump()
        assert set(data.keys()) == {"id", "client_name", "timestamp"}
