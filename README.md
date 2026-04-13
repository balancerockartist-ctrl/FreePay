# FreePay

> An off-chain payment ledger MVP — designed to grow into a full Stripe/crypto payment layer.

[![Markdown Lint](https://github.com/balancerockartist-ctrl/FreePay/actions/workflows/markdown-lint.yml/badge.svg)](https://github.com/balancerockartist-ctrl/FreePay/actions/workflows/markdown-lint.yml)

---

## What is FreePay?

FreePay is a lightweight, off-chain payment ledger built to help developers and small teams
track transactions, balances, and payment events **without requiring a blockchain or a
third-party payment processor**. It is designed as the first step in a larger
[Quantum-Economics](https://github.com/balancerockartist-ctrl/Quantum-Economics-) ecosystem.

### Key goals

| Goal | Description |
|------|-------------|
| **Off-chain first** | Store and query payment records in a standard database (MongoDB). No smart-contracts required to get started. |
| **Stripe-ready** | API surface mirrors Stripe's core objects (Charge, PaymentIntent, Transfer) so future Stripe integration requires minimal refactoring. |
| **Crypto-compatible** | Wallet addresses and transaction hashes are first-class fields, enabling a seamless upgrade path to on-chain settlement. |
| **AI-augmented** | Designed to plug into agent frameworks for automated reconciliation, fraud detection, and spend analytics. |

---

## Project structure

```text
FreePay/
├── backend/          # FastAPI service — ledger API
│   ├── server.py     # Entry point, routes, models
│   └── requirements.txt
├── frontend/         # React 19 + Tailwind + shadcn/ui dashboard
│   └── src/
├── docs/             # Vision, architecture, AI policy, roadmap
├── projects/         # Sub-project overviews (MVP, agents, economics-lab)
├── demos/            # Runnable demos and screenshots
└── tests/            # Backend test suite
```

---

## Quick start

### Docker Compose (recommended)

```bash
cp backend/.env.example backend/.env   # only DB_NAME is required; MONGO_URL and CORS_ORIGINS are set by docker-compose
docker compose up --build
```

- API: `http://localhost:8000/api`
- Dashboard: `http://localhost:3000`

### Manual setup

#### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in MONGO_URL, DB_NAME, CORS_ORIGINS
uvicorn server:app --reload
```

The API will be available at `http://localhost:8000/api`.

#### Frontend

```bash
cd frontend
yarn install
REACT_APP_BACKEND_URL=http://localhost:8000 yarn start
```

The dashboard will be available at `http://localhost:3000`.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Vision](docs/vision.md) | Why FreePay exists and where it is headed |
| [Architecture](docs/architecture.md) | System design and component overview |
| [AI Policy](docs/ai-policy.md) | How AI is used responsibly in this project |
| [Roadmap](docs/roadmap.md) | Upcoming milestones and feature priorities |

---

## Related projects

| Project | Description |
|---------|-------------|
| [FreePay MVP](projects/freepay-mvp.md) | This repository — off-chain ledger core |
| [Agents](projects/agents.md) | AI agents for reconciliation & analytics |
| [Economics Lab](projects/economics-lab.md) | Experimental economic models & simulations |

---

## Contributing

1. Fork the repository and create a feature branch.
2. Follow the coding conventions described in [docs/architecture.md](docs/architecture.md).
3. Ensure all Markdown files pass the CI lint check (`markdownlint`).
4. Open a pull request with a clear description of the change.

---

## License

MIT — see [LICENSE](LICENSE) for details.
