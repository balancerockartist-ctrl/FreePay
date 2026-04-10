import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

# Set required env vars before importing server
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "test_db")


@pytest.fixture()
def mock_db():
    """Return a mock database with a mocked status_checks collection."""
    mock_collection = MagicMock()
    mock_collection.insert_one = AsyncMock(return_value=MagicMock())
    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_collection.find.return_value = mock_cursor

    db = MagicMock()
    db.status_checks = mock_collection
    return db


@pytest.fixture()
def client(mock_db):
    """Return a TestClient with the MongoDB database patched."""
    with patch("backend.server.db", mock_db):
        from fastapi.testclient import TestClient
        from backend.server import app
        with TestClient(app) as c:
            yield c, mock_db
