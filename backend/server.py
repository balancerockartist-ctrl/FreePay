"""
FreePay — application entry point.

All business logic lives in routes/ and models.py.
"""
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS, client, logger
from routes.status import router as status_router
from routes.auth import router as auth_router
from routes.accounts import router as accounts_router
from routes.transactions import router as transactions_router
from routes.payment_intents import router as payment_intents_router
from routes.transfers import router as transfers_router
from routes.stripe_routes import router as stripe_router
from routes.crypto import router as crypto_router
from routes.agents import router as agents_router, start_scheduler

app = FastAPI(title="FreePay", version="0.2.0")

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
from fastapi import APIRouter

api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {"message": "Hello World"}

api_router.include_router(status_router)
api_router.include_router(auth_router)
api_router.include_router(accounts_router)
api_router.include_router(transactions_router)
api_router.include_router(payment_intents_router)
api_router.include_router(transfers_router)
api_router.include_router(stripe_router)
api_router.include_router(crypto_router)
api_router.include_router(agents_router)

app.include_router(api_router)

# ── Lifecycle ─────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    await start_scheduler()
    logger.info("FreePay started")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()