"""
Application configuration — environment loading and shared DB client.
"""
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ── Mongo ────────────────────────────────────────────────────────────────────
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

client: AsyncIOMotorClient = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ── Auth ─────────────────────────────────────────────────────────────────────
JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "1440"))  # 24 h

# ── CORS ─────────────────────────────────────────────────────────────────────
CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

# ── Stripe ────────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

# ── Crypto ────────────────────────────────────────────────────────────────────
CRYPTO_RPC_URL = os.environ.get("CRYPTO_RPC_URL", "")
ETHERSCAN_API_KEY = os.environ.get("ETHERSCAN_API_KEY", "")

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)
