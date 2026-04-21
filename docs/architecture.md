# Architecture

## Overview

FreePay follows a **monorepo layout** with a clear separation between the API backend and the
React frontend. A shared MongoDB instance stores all ledger state.

```text
┌─────────────────────────────────────────────────────┐
│                     Client (Browser)                │
│                React 19 + Tailwind + shadcn/ui       │
└───────────────────────┬─────────────────────────────┘
                        │  HTTP / JSON
┌───────────────────────▼─────────────────────────────┐
│                   FastAPI Backend                    │
│  /api/*  routes  │  Pydantic models  │  Auth (JWT)  │
└───────────────────────┬─────────────────────────────┘
                        │  motor (async)
┌───────────────────────▼─────────────────────────────┐
│                      MongoDB                         │
│  Collections: status_checks, transactions, accounts  │
└─────────────────────────────────────────────────────┘
```

---

## Backend (`backend/`)

| File | Purpose |
|------|---------|
| `server.py` | Application entry point; mounts the `api_router`, configures CORS and logging |
| `requirements.txt` | Python dependencies |

### Key design decisions

- **FastAPI** — async-native, automatic OpenAPI docs, Pydantic validation.
- **Motor** — async MongoDB driver; avoids blocking the event loop on I/O.
- **Pydantic v2** — strict schema validation; `model_config = ConfigDict(extra="ignore")`
  prevents MongoDB `_id` fields from leaking into responses.
- **UUID identifiers** — all entities use UUID v4 `id` fields rather than Mongo ObjectIDs,
  making records portable across storage backends.
- **UTC timestamps** — all `datetime` fields are stored as ISO 8601 strings and
  round-tripped through `datetime.fromisoformat`.

### API surface

```text
GET  /api/          → health check
POST /api/status    → create a status check record
GET  /api/status    → list all status check records
GET  /api/models    → list the 7 Spiritual LLMs with their roles and descriptions
GET  /api/savings/calculate?price=<USD> → closed-loop savings calculation (25% consumer discount, 100% retailer settlement)
GET  /api/membership/status?user_id=<id> → trial / lifetime membership status and 24-hour cycle progress
GET  /api/camera/payment?item_id=<label>&price=<USD> → initiate a Dual C visual-pipeline payment on SOLANA
```

---

## Frontend (`frontend/`)

| Path | Purpose |
|------|---------|
| `src/App.js` | Root component; React Router setup |
| `src/components/` | shadcn/ui component library |
| `src/hooks/` | Custom React hooks |
| `src/lib/` | Shared utilities (e.g., `cn` class helper) |

### Frontend design decisions

- **React 19** with functional components and hooks only.
- **Tailwind CSS** for utility-first styling.
- **shadcn/ui** for accessible, composable UI primitives.
- **Axios** for HTTP requests; `REACT_APP_BACKEND_URL` env var controls the API base URL.
- **CRACO** for Create React App config overrides without ejecting.

---

## Data model

### `StatusCheck` (current)

```json
{
  "id": "uuid-v4",
  "client_name": "string",
  "timestamp": "2024-01-01T00:00:00+00:00"
}
```

### `Transaction` (planned)

```json
{
  "id": "uuid-v4",
  "from_account": "string",
  "to_account": "string",
  "amount": "decimal",
  "currency": "USD | ETH | USDC | ...",
  "status": "pending | settled | failed",
  "external_ref": "stripe_pi_xxx | 0xabc...",
  "created_at": "ISO 8601",
  "settled_at": "ISO 8601 | null"
}
```

---

## Security considerations

- CORS origins are configured via the `CORS_ORIGINS` environment variable (comma-separated).
- Secrets (MongoDB URL, API keys) are loaded exclusively from environment variables via
  `python-dotenv`; **never commit `.env` files**.
- JWT authentication (via `pyjwt`) is available as a dependency and will be wired into
  protected routes in Phase 2.
