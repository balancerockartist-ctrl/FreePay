"""Tests for the FastAPI API endpoints defined in backend/server.py."""
import os
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_db")


class TestRootEndpoint:
    def test_returns_hello_world(self, client):
        c, _ = client
        response = c.get("/api/")
        assert response.status_code == 200
        assert response.json() == {"message": "Hello World"}


class TestCreateStatusCheck:
    def test_creates_successfully(self, client):
        c, _ = client
        response = c.post("/api/status", json={"client_name": "test-client"})
        assert response.status_code == 200
        data = response.json()
        assert data["client_name"] == "test-client"
        assert "id" in data
        assert "timestamp" in data

    def test_response_has_valid_uuid(self, client):
        import uuid
        c, _ = client
        response = c.post("/api/status", json={"client_name": "uuid-check"})
        assert response.status_code == 200
        returned_id = response.json()["id"]
        # Should not raise
        uuid.UUID(returned_id)

    def test_response_has_timestamp(self, client):
        c, _ = client
        response = c.post("/api/status", json={"client_name": "ts-check"})
        assert response.status_code == 200
        ts_str = response.json()["timestamp"]
        # Should be a parseable datetime string
        parsed = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
        assert isinstance(parsed, datetime)

    def test_missing_client_name_returns_422(self, client):
        c, _ = client
        response = c.post("/api/status", json={})
        assert response.status_code == 422

    def test_inserts_into_db(self, client):
        c, mock_db = client
        c.post("/api/status", json={"client_name": "db-test"})
        mock_db.status_checks.insert_one.assert_called_once()

    def test_inserted_doc_has_isoformat_timestamp(self, client):
        c, mock_db = client
        c.post("/api/status", json={"client_name": "iso-test"})
        call_args = mock_db.status_checks.insert_one.call_args
        doc = call_args[0][0]
        assert isinstance(doc["timestamp"], str)
        # Verify it's a valid ISO datetime string
        datetime.fromisoformat(doc["timestamp"])

    def test_empty_client_name_accepted(self, client):
        """Empty string is a valid string value for client_name."""
        c, _ = client
        response = c.post("/api/status", json={"client_name": ""})
        assert response.status_code == 200

    def test_extra_fields_in_body_ignored(self, client):
        """Extra fields in the request body should not cause errors."""
        c, _ = client
        response = c.post(
            "/api/status",
            json={"client_name": "extra", "unknown_field": "value"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["client_name"] == "extra"


class TestGetStatusChecks:
    def test_returns_empty_list_when_no_records(self, client):
        c, mock_db = client
        mock_db.status_checks.find.return_value.to_list = AsyncMock(return_value=[])
        response = c.get("/api/status")
        assert response.status_code == 200
        assert response.json() == []

    def test_returns_list_with_records(self, client):
        c, mock_db = client
        ts = datetime.now(timezone.utc)
        mock_db.status_checks.find.return_value.to_list = AsyncMock(
            return_value=[
                {
                    "id": "some-uuid",
                    "client_name": "test",
                    "timestamp": ts.isoformat(),
                }
            ]
        )
        response = c.get("/api/status")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["client_name"] == "test"
        assert data[0]["id"] == "some-uuid"

    def test_iso_string_timestamps_converted_to_datetime(self, client):
        c, mock_db = client
        ts = datetime(2024, 6, 15, 10, 30, 0, tzinfo=timezone.utc)
        mock_db.status_checks.find.return_value.to_list = AsyncMock(
            return_value=[
                {
                    "id": "abc",
                    "client_name": "ts-conv",
                    "timestamp": ts.isoformat(),
                }
            ]
        )
        response = c.get("/api/status")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        # FastAPI serialises the datetime; verify field is present and parseable
        assert "timestamp" in data[0]
        parsed = datetime.fromisoformat(data[0]["timestamp"].replace("Z", "+00:00"))
        assert isinstance(parsed, datetime)

    def test_excludes_mongodb_id_field(self, client):
        c, mock_db = client
        ts = datetime.now(timezone.utc)
        mock_db.status_checks.find.return_value.to_list = AsyncMock(
            return_value=[
                {
                    "id": "xyz",
                    "client_name": "no-mongo-id",
                    "timestamp": ts.isoformat(),
                }
            ]
        )
        response = c.get("/api/status")
        assert response.status_code == 200
        data = response.json()
        assert "_id" not in data[0]

    def test_find_called_with_correct_projection(self, client):
        c, mock_db = client
        c.get("/api/status")
        mock_db.status_checks.find.assert_called_with({}, {"_id": 0})

    def test_returns_multiple_records(self, client):
        c, mock_db = client
        ts = datetime.now(timezone.utc).isoformat()
        records = [
            {"id": f"id-{i}", "client_name": f"client-{i}", "timestamp": ts}
            for i in range(3)
        ]
        mock_db.status_checks.find.return_value.to_list = AsyncMock(
            return_value=records
        )
        response = c.get("/api/status")
        assert response.status_code == 200
        assert len(response.json()) == 3
