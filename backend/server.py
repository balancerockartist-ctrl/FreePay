"""FreePay API — Application entry point.

Organized by Claudia AI.
"""

from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

from config import client, CORS_ORIGINS, logger
from routes.status import router as status_router

# Application
app = FastAPI(title="FreePay API", version="0.1.0")

# API router — all routes live under /api
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    """Health-check endpoint."""
    return {"message": "Hello World"}


# Mount feature routers
api_router.include_router(status_router)

# Register the /api prefix
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    """Close the MongoDB connection on shutdown."""
    client.close()
    logger.info("MongoDB connection closed.")