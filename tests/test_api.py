"""Tests for the FastAPI endpoints in backend/server.py."""
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest


# ---------------------------------------------------------------------------
# GET /api/
# ---------------------------------------------------------------------------

class TestRoot:
    def test_returns_hello_world(self, client):
        response = client.get("/api/")
        assert response.status_code == 200
        assert response.json() == {"message": "Hello World"}

    def test_content_type_is_json(self, client):
        response = client.get("/api/")
        assert "application/json" in response.headers["content-type"]


# ---------------------------------------------------------------------------
# POST /api/status
# ---------------------------------------------------------------------------

class TestCreateStatusCheck:
    def test_create_with_valid_data(self, client):
        payload = {"client_name": "test-client"}
        response = client.post("/api/status", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["client_name"] == "test-client"

    def test_create_returns_generated_id(self, client):
        payload = {"client_name": "id-check-client"}
        response = client.post("/api/status", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert len(data["id"]) > 0

    def test_create_returns_timestamp(self, client):
        payload = {"client_name": "timestamp-client"}
        response = client.post("/api/status", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "timestamp" in data
        # Should be a valid ISO-8601 datetime string
        dt = datetime.fromisoformat(data["timestamp"])
        assert dt is not None

    def test_create_inserts_into_db(self, client, mock_db):
        payload = {"client_name": "db-write-client"}
        client.post("/api/status", json=payload)
        mock_db.status_checks.insert_one.assert_called_once()
        inserted_doc = mock_db.status_checks.insert_one.call_args[0][0]
        assert inserted_doc["client_name"] == "db-write-client"

    def test_create_serialises_timestamp_as_string_in_db(self, client, mock_db):
        """Timestamps stored in MongoDB must be ISO strings, not datetime objects."""
        payload = {"client_name": "serialise-client"}
        client.post("/api/status", json=payload)
        inserted_doc = mock_db.status_checks.insert_one.call_args[0][0]
        assert isinstance(inserted_doc["timestamp"], str)

    def test_create_missing_client_name_returns_422(self, client):
        response = client.post("/api/status", json={})
        assert response.status_code == 422

    def test_create_wrong_type_returns_422(self, client):
        """Pydantic v2 does not coerce int to str, so this must fail validation."""
        response = client.post("/api/status", json={"client_name": 12345})
        assert response.status_code == 422

    def test_create_null_client_name_returns_422(self, client):
        response = client.post("/api/status", json={"client_name": None})
        assert response.status_code == 422

    def test_create_extra_fields_are_ignored(self, client):
        payload = {"client_name": "extra-fields", "unknown_field": "value"}
        response = client.post("/api/status", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["client_name"] == "extra-fields"
        assert "unknown_field" not in data

    def test_created_ids_are_unique(self, client):
        ids = []
        for i in range(5):
            response = client.post("/api/status", json={"client_name": f"client-{i}"})
            assert response.status_code == 200
            ids.append(response.json()["id"])
        assert len(set(ids)) == 5, "All generated IDs should be unique"


# ---------------------------------------------------------------------------
# GET /api/status
# ---------------------------------------------------------------------------

class TestGetStatusChecks:
    def test_empty_list_when_no_records(self, client):
        response = client.get("/api/status")
        assert response.status_code == 200
        assert response.json() == []

    def test_returns_existing_records(self, client, mock_db):
        now_iso = datetime.now(timezone.utc).isoformat()
        mock_db.status_checks.find.return_value.to_list = AsyncMock(
            return_value=[
                {"id": "abc-123", "client_name": "alice", "timestamp": now_iso},
                {"id": "def-456", "client_name": "bob", "timestamp": now_iso},
            ]
        )
        response = client.get("/api/status")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        names = {d["client_name"] for d in data}
        assert names == {"alice", "bob"}

    def test_timestamps_converted_from_iso_strings(self, client, mock_db):
        """ISO string timestamps stored in Mongo must be returned as datetime fields."""
        iso_ts = "2024-01-15T12:30:00+00:00"
        mock_db.status_checks.find.return_value.to_list = AsyncMock(
            return_value=[
                {"id": "ts-test", "client_name": "ts-client", "timestamp": iso_ts}
            ]
        )
        response = client.get("/api/status")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        # The response timestamp should round-trip back to the same instant
        returned_dt = datetime.fromisoformat(data[0]["timestamp"])
        original_dt = datetime.fromisoformat(iso_ts)
        assert returned_dt == original_dt

    def test_mongodb_id_excluded_from_response(self, client, mock_db):
        """The _id: 0 projection means _id must never appear in responses."""
        now_iso = datetime.now(timezone.utc).isoformat()
        mock_db.status_checks.find.return_value.to_list = AsyncMock(
            return_value=[
                {"id": "no-mongo-id", "client_name": "clean", "timestamp": now_iso}
            ]
        )
        response = client.get("/api/status")
        data = response.json()
        assert "_id" not in data[0]

    def test_find_called_with_id_exclusion(self, client, mock_db):
        """Verify find() is called with the correct projection to exclude _id."""
        client.get("/api/status")
        call_args = mock_db.status_checks.find.call_args
        assert call_args is not None
        # Second positional arg is the projection dict
        projection = call_args[0][1] if len(call_args[0]) > 1 else call_args[1].get("projection")
        assert projection == {"_id": 0}

    def test_content_type_is_json(self, client):
        response = client.get("/api/status")
        assert "application/json" in response.headers["content-type"]
