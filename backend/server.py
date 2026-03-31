from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import json
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import Any, Dict, List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="FreePay – Universal AI API Gateway")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class ApiKeyCreate(BaseModel):
    """Request body for creating a new FreePay universal API key."""
    name: str
    owner_email: str


class ProviderKeysUpdate(BaseModel):
    """Map provider names to their secret API keys.

    Supported providers: openai, anthropic, google
    NOTE: In production these values should be encrypted at rest.
    """
    openai: Optional[str] = None
    anthropic: Optional[str] = None
    google: Optional[str] = None


class ApiKey(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key: str  # fp_<random> – the universal key handed to the user
    name: str
    owner_email: str
    provider_keys: Dict[str, str] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True


class ApiKeyPublic(BaseModel):
    """Safe view of an ApiKey – never exposes provider secrets."""
    id: str
    key: str
    name: str
    owner_email: str
    configured_providers: List[str]
    created_at: datetime
    is_active: bool


# ---------------------------------------------------------------------------
# Helper – resolve AI provider from model name
# ---------------------------------------------------------------------------

PROVIDER_PREFIXES: Dict[str, str] = {
    "gpt-": "openai",
    "o1-": "openai",
    "o3-": "openai",
    "o4-": "openai",
    "text-embedding-": "openai",
    "claude-": "anthropic",
    "gemini-": "google",
}


def _detect_provider(model: str) -> str:
    for prefix, provider in PROVIDER_PREFIXES.items():
        if model.startswith(prefix):
            return provider
    return "openai"  # sensible default


def _public_key(doc: dict) -> ApiKeyPublic:
    return ApiKeyPublic(
        id=doc["id"],
        key=doc["key"],
        name=doc["name"],
        owner_email=doc["owner_email"],
        configured_providers=list(doc.get("provider_keys", {}).keys()),
        created_at=datetime.fromisoformat(doc["created_at"])
        if isinstance(doc["created_at"], str)
        else doc["created_at"],
        is_active=doc.get("is_active", True),
    )


# ---------------------------------------------------------------------------
# Proxy helpers
# ---------------------------------------------------------------------------

async def _call_openai(body: dict, api_key: str, raw_request: Request) -> Any:
    """Forward an OpenAI-format request to OpenAI and return the response."""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=120) as hx:
        if body.get("stream"):
            async def _stream():
                async with hx.stream("POST", url, json=body, headers=headers) as r:
                    async for chunk in r.aiter_bytes():
                        yield chunk
            return StreamingResponse(_stream(), media_type="text/event-stream")
        resp = await hx.post(url, json=body, headers=headers)
        resp.raise_for_status()
        return resp.json()


async def _call_anthropic(body: dict, api_key: str, raw_request: Request) -> Any:
    """Translate OpenAI-format request → Anthropic Messages API → OpenAI-format response."""
    # --- translate request ---
    messages = body.get("messages", [])
    system_prompt = None
    anthropic_messages = []
    for m in messages:
        if m["role"] == "system":
            system_prompt = m["content"]
        else:
            anthropic_messages.append({"role": m["role"], "content": m["content"]})

    anthropic_body: Dict[str, Any] = {
        "model": body.get("model", "claude-3-5-sonnet-20241022"),
        "max_tokens": body.get("max_tokens", 1024),
        "messages": anthropic_messages,
    }
    if system_prompt:
        anthropic_body["system"] = system_prompt

    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }

    if body.get("stream"):
        anthropic_body["stream"] = True
        url = "https://api.anthropic.com/v1/messages"
        async with httpx.AsyncClient(timeout=120) as hx:
            async def _stream():
                async with hx.stream("POST", url, json=anthropic_body, headers=headers) as r:
                    async for chunk in r.aiter_bytes():
                        yield chunk
            return StreamingResponse(_stream(), media_type="text/event-stream")

    async with httpx.AsyncClient(timeout=120) as hx:
        resp = await hx.post(
            "https://api.anthropic.com/v1/messages", json=anthropic_body, headers=headers
        )
        resp.raise_for_status()
        data = resp.json()

    # --- translate response to OpenAI format ---
    content = data.get("content", [{}])[0].get("text", "")
    return {
        "id": data.get("id", str(uuid.uuid4())),
        "object": "chat.completion",
        "created": int(datetime.now(timezone.utc).timestamp()),
        "model": data.get("model", body.get("model")),
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": content},
                "finish_reason": data.get("stop_reason", "stop"),
            }
        ],
        "usage": {
            "prompt_tokens": data.get("usage", {}).get("input_tokens", 0),
            "completion_tokens": data.get("usage", {}).get("output_tokens", 0),
            "total_tokens": data.get("usage", {}).get("input_tokens", 0)
            + data.get("usage", {}).get("output_tokens", 0),
        },
    }


async def _call_google(body: dict, api_key: str, raw_request: Request) -> Any:
    """Translate OpenAI-format request → Google Gemini API → OpenAI-format response."""
    model = body.get("model", "gemini-1.5-pro")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    messages = body.get("messages", [])
    contents = []
    system_instruction = None
    for m in messages:
        if m["role"] == "system":
            system_instruction = {"parts": [{"text": m["content"]}]}
        else:
            role = "user" if m["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": m["content"]}]})

    google_body: Dict[str, Any] = {"contents": contents}
    if system_instruction:
        google_body["system_instruction"] = system_instruction

    async with httpx.AsyncClient(timeout=120) as hx:
        resp = await hx.post(url, json=google_body)
        resp.raise_for_status()
        data = resp.json()

    candidate = data.get("candidates", [{}])[0]
    content = candidate.get("content", {}).get("parts", [{}])[0].get("text", "")
    usage_meta = data.get("usageMetadata", {})

    return {
        "id": str(uuid.uuid4()),
        "object": "chat.completion",
        "created": int(datetime.now(timezone.utc).timestamp()),
        "model": model,
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": content},
                "finish_reason": candidate.get("finishReason", "stop").lower(),
            }
        ],
        "usage": {
            "prompt_tokens": usage_meta.get("promptTokenCount", 0),
            "completion_tokens": usage_meta.get("candidatesTokenCount", 0),
            "total_tokens": usage_meta.get("totalTokenCount", 0),
        },
    }


PROVIDER_CALLERS = {
    "openai": _call_openai,
    "anthropic": _call_anthropic,
    "google": _call_google,
}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@api_router.get("/")
async def root():
    return {"message": "FreePay – Universal AI API Gateway"}


# -- Status checks (kept for compatibility) --

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


# -- API Key management --

@api_router.post("/keys", response_model=ApiKeyPublic)
async def create_api_key(body: ApiKeyCreate):
    """Generate a new FreePay universal API key."""
    key = ApiKey(
        name=body.name,
        owner_email=body.owner_email,
        key="fp_" + secrets.token_urlsafe(32),
    )
    doc = key.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.api_keys.insert_one(doc)
    return _public_key(doc)


@api_router.get("/keys", response_model=List[ApiKeyPublic])
async def list_api_keys(owner_email: Optional[str] = None):
    """List all FreePay API keys, optionally filtered by owner email."""
    query: Dict[str, Any] = {}
    if owner_email:
        query["owner_email"] = owner_email
    docs = await db.api_keys.find(query, {"_id": 0}).to_list(1000)
    return [_public_key(d) for d in docs]


@api_router.delete("/keys/{key_id}")
async def delete_api_key(key_id: str):
    """Deactivate a FreePay API key."""
    result = await db.api_keys.update_one(
        {"id": key_id}, {"$set": {"is_active": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="API key not found")
    return {"message": "API key deactivated"}


@api_router.put("/keys/{key_id}/providers")
async def update_provider_keys(key_id: str, body: ProviderKeysUpdate):
    """Store the provider API keys associated with a FreePay key.

    Only non-null values are updated.  Provider keys are stored as-is;
    production deployments should encrypt them using the cryptography package.
    """
    doc = await db.api_keys.find_one({"id": key_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="API key not found")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No provider keys provided")

    existing = doc.get("provider_keys", {})
    existing.update(updates)
    await db.api_keys.update_one({"id": key_id}, {"$set": {"provider_keys": existing}})
    return {"message": "Provider keys updated", "configured_providers": list(existing.keys())}


# -- Universal proxy --

@api_router.post("/proxy/v1/chat/completions")
async def universal_proxy(request: Request):
    """Universal OpenAI-compatible endpoint.

    Pass your FreePay key (fp_...) as the Bearer token and any supported model
    name.  The gateway will:
      1. Validate the FreePay key.
      2. Auto-detect the target AI provider from the model name.
      3. Forward the request using the provider key stored for that FreePay key.
      4. Return an OpenAI-compatible response regardless of the underlying provider.

    This means a single FreePay key + a single base URL works with the OpenAI
    SDK, LangChain, LlamaIndex, and any tool that supports a custom base URL.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer fp_"):
        raise HTTPException(status_code=401, detail="Invalid FreePay API key. Expected 'Bearer fp_...'")

    fp_key = auth_header[len("Bearer "):]

    key_doc = await db.api_keys.find_one({"key": fp_key, "is_active": True}, {"_id": 0})
    if not key_doc:
        raise HTTPException(status_code=401, detail="FreePay API key not found or inactive")

    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    model = body.get("model", "gpt-4o")
    provider = _detect_provider(model)

    provider_keys = key_doc.get("provider_keys", {})
    provider_api_key = provider_keys.get(provider)
    if not provider_api_key:
        raise HTTPException(
            status_code=400,
            detail=f"No {provider} API key configured for this FreePay key. "
                   f"Add it via PUT /api/keys/{{key_id}}/providers",
        )

    caller = PROVIDER_CALLERS.get(provider)
    if not caller:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

    try:
        return await caller(body, provider_api_key, request)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=exc.response.status_code,
            detail=f"Upstream {provider} error: {exc.response.text}",
        )


# ---------------------------------------------------------------------------
# App assembly
# ---------------------------------------------------------------------------

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()