"""Shared pytest fixtures for the FreePay test suite."""
import os
import sys
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

# Ensure env vars are set before any app import
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_freepay")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")

# Make sure the backend package is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def make_mock_collection(documents: list | None = None):
    """Return a MagicMock that quacks like a Motor collection."""
    docs = list(documents or [])
    collection = MagicMock()

    # insert_one returns an object with an inserted_id
    insert_result = MagicMock()
    insert_result.inserted_id = "mock_id"
    collection.insert_one = AsyncMock(return_value=insert_result)

    # find().to_list(n) returns a coroutine yielding docs
    cursor = MagicMock()
    cursor.to_list = AsyncMock(return_value=docs)
    collection.find = MagicMock(return_value=cursor)

    return collection


@pytest.fixture()
def mock_db():
    """A mock Motor database whose collections are pre-wired."""
    db = MagicMock()
    db.status_checks = make_mock_collection()
    return db


@pytest.fixture()
def client(mock_db, monkeypatch):
    """
    A Starlette TestClient with the real FastAPI app but a mocked database.
    Using monkeypatch to replace the module-level ``db`` object in server.py
    means the patching is automatically undone after each test.
    """
    import backend.server as server_module

    monkeypatch.setattr(server_module, "db", mock_db)

    from starlette.testclient import TestClient

    with TestClient(server_module.app) as tc:
        yield tc
