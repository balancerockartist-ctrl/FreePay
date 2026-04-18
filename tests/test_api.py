"""Tests for the FreePay API endpoints.

Uses the Starlette TestClient with a mocked Motor database so no real MongoDB
connection is required.
"""
import sys
import types
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

# ---------------------------------------------------------------------------
# Minimal stubs so server.py can be imported without real env vars or Motor
# ---------------------------------------------------------------------------

# Stub out motor so the import of server.py doesn't fail
motor_stub = types.ModuleType("motor")
motor_async = types.ModuleType("motor.motor_asyncio")


class _FakeCollection:
    async def insert_one(self, doc):
        return None

    def find(self, *args, **kwargs):
        return _FakeCursor()


class _FakeCursor:
    async def to_list(self, length):
        return []


class _FakeDB:
    def __getattr__(self, name):
        return _FakeCollection()


class _FakeClient:
    def __getitem__(self, name):
        return _FakeDB()

    def close(self):
        pass


motor_async.AsyncIOMotorClient = lambda *a, **kw: _FakeClient()
motor_stub.motor_asyncio = motor_async
sys.modules.setdefault("motor", motor_stub)
sys.modules.setdefault("motor.motor_asyncio", motor_async)

import os
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "freepay_test")

from fastapi.testclient import TestClient
import importlib

# Re-import server after env setup
import backend.server as server_module

client = TestClient(server_module.app)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_root():
    response = client.get("/api/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello World"}


def test_savings_calculate_basic():
    response = client.get("/api/savings/calculate", params={"total_amount": 10.0})
    assert response.status_code == 200
    data = response.json()
    assert data["total_amount"] == 10.0
    assert data["consumer_price"] == 10.0
    assert data["network_fee_sol"] > 0


def test_savings_calculate_zero():
    response = client.get("/api/savings/calculate", params={"total_amount": 0.0})
    assert response.status_code == 200
    data = response.json()
    assert data["total_amount"] == 0.0
    assert data["consumer_price"] == 0.0


def test_camera_payment_creates_record():
    payload = {
        "image_data_url": "data:image/jpeg;base64,/9j/fake",
        "item_category": "food",
        "amount_sol": 0.01,
        "recipient_address": "So11111111111111111111111111111111111111112",
    }
    response = client.post("/api/camera/payment", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["item_category"] == "food"
    assert data["amount_sol"] == 0.01
    assert data["status"] == "pending"
    assert "id" in data
    assert "created_at" in data
