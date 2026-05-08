from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os
import logging

app = FastAPI(title="FreePay Backend (GodWorld)")
logger = logging.getLogger("uvicorn")

# Simple health endpoint
@app.get("/health")
async def health():
    return {"status": "ok", "service": "freepay-backend"}

# Placeholder models
class CameraVerifyRequest(BaseModel):
    image_base64: str
    user_id: str

class RedeemRequest(BaseModel):
    qr_payload: str
    user_id: str

@app.post("/camera/verify")
async def camera_verify(req: CameraVerifyRequest):
    # TODO: integrate OCR, escrow DB write, Solana call
    logger.info("camera_verify for user %s", req.user_id)
    return {"result": "verified", "details": "stub - implement OCR+Solana"}

@app.post("/redeem")
async def redeem(req: RedeemRequest):
    # TODO: validate QR, call Solana program to transfer FPY
    logger.info("redeem for user %s", req.user_id)
    return {"result": "redeemed", "details": "stub - implement QR validation+Solana transfer"}

@app.post("/agent/truth")
async def agent_truth(payload: dict):
    # TODO: proxy to Claude execution layer
    return {"agent": "truth", "response": "stub - implement Claude call"}

@app.post("/agent/claudia")
async def agent_claudia(payload: dict):
    # TODO: proxy to Claude governance layer
    return {"agent": "claudia", "response": "stub - implement Claude call"}

@app.get("/stats")
async def stats():
    # TODO: return dashboard metrics from DB
    return {"uptime": "unknown", "escrows": 0, "settlements": 0}

@app.get("/user/settings")
async def user_settings(user_id: str = "unknown"):
    # TODO: fetch vendor config from DB
    return {"user_id": user_id, "settings": {}}

# Local run
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
