# Free Pay ♾️

> **The End of Exchange** — an automated, self-sustaining, closed-loop decentralized payment
> ecosystem designed to end economic scarcity and empower humanitarian resource allocation
> globally.

---

## Overview

Free Pay is a **7G humanitarian payment infrastructure** that bridges traditional financial
rails with decentralized Solana-based smart contracts. It provides:

- **Zero-friction checkout** via Camera Pay (Dual C Technology) — scan an item, pay instantly.
- **25 % consumer discount** absorbed by the closed-loop smart contract while merchants
  receive **100 % settlement**.
- **Lifetime membership** unlocked after a 24-hour activation cycle.
- **7 Spiritual LLMs** hard-coding humanitarian ethics into every transaction.
- **SOLULM** — a Solana-integrated AI engine that hashes visual data into economic action with
  near-zero latency.

---

## Repository Structure

```text
FreePay/
│
├── docs/
│   ├── audit/
│   │   └── TECHNICAL_AUDIT_CHECKLIST.md   # Requirements for licensees
│   ├── legal/
│   │   └── LICENSE_AGREEMENT.md           # Universal IP & Operational Agreement
│   ├── architecture.md
│   ├── roadmap.md
│   ├── vision.md
│   └── ai-policy.md
│
├── backend/                               # FastAPI + MongoDB + SOLULM logic
│   ├── server.py
│   └── requirements.txt
│
├── frontend/                              # React 19 + Tailwind + shadcn/ui (Dual C UI)
│   └── src/
│
└── tests/                                 # pytest suite
```

---

## Quick Start

### Backend

```bash
cd backend
cp ../.env.example .env          # fill in MONGO_URL, DB_NAME, CORS_ORIGINS
pip install -r requirements.txt
uvicorn server:app --reload
```

Interactive API docs available at **`http://localhost:8000/docs`**.

### Frontend

```bash
cd frontend
yarn install
REACT_APP_BACKEND_URL=http://localhost:8000 yarn start
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/models` | Returns the 7 Spiritual LLMs and their ethical parameters |
| `GET` | `/api/savings/calculate` | Calculates the 25 % consumer discount and 100 % retailer settlement |
| `GET` | `/api/membership/status` | Verifies 24-hour activation cycle and lifetime-benefit status |
| `GET` | `/api/camera/payment` | Executes a Dual C visual checkout transaction on Solana |
| `GET` | `/api/status` | Lists health-check records |
| `POST` | `/api/status` | Creates a health-check record |

---

## Vision

Free Pay is the commercial layer powering **Godworld.org** — a humanitarian logistics ecosystem
(G.L.S.) that tracks real-time global supply and demand of necessities (food, clothing,
transportation, shelter) and routes resources automatically to where they are needed.

For the full vision statement see [`docs/vision.md`](docs/vision.md).  
For the licensing and IP terms see [`docs/legal/LICENSE_AGREEMENT.md`](docs/legal/LICENSE_AGREEMENT.md).

---

## License

The **G.L.S. methodology and framework** are dedicated to the public domain under a
[Creative Commons CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/)
license.

The **SOLULM weights, operational API keys, and administrative root access** remain the
exclusive proprietary intellectual property of the Sole Proprietor.

---

*Provenance: Project Blue Star — conceived 2020.*
