# FreePay MVP

## Overview

FreePay is the foundational project in the
[Quantum-Economics](https://github.com/balancerockartist-ctrl/Quantum-Economics-) ecosystem.
It provides an **off-chain payment ledger** — a reliable source of truth for payment events
that can be queried, audited, and extended without the complexity of a blockchain.

---

## Problem it solves

Most early-stage products don't need on-chain settlement. They need:

1. A record of who paid what, when, and to whom.
2. The ability to query and export that record.
3. A clear upgrade path to real payment processors or crypto rails later.

FreePay delivers exactly that — no over-engineering, no lock-in.

---

## Core features (Phase 1)

| Feature | Description |
|---------|-------------|
| Transaction ledger | Create and query payment records via REST API |
| Account balances | Running balance derived from transaction history |
| Audit trail | Immutable records with UTC timestamps and UUID identifiers |
| Dashboard | React-based UI to view transactions and balances |
| CI / CD | Automated Markdown lint and (future) backend tests |

---

## Technology stack

| Layer | Technology |
|-------|-----------|
| API | FastAPI (Python 3.11+) |
| Database | MongoDB via Motor (async) |
| Validation | Pydantic v2 |
| Frontend | React 19, Tailwind CSS, shadcn/ui |
| Auth | JWT (pyjwt + passlib) |
| Tests | pytest |

---

## Repository layout

See the main [README](../README.md) and [Architecture doc](../docs/architecture.md) for
the full directory structure and design decisions.

---

## Status

🟡 **Phase 1 — In progress**. Core API scaffold complete; Transaction and Account models
are next. See the [Roadmap](../docs/roadmap.md) for details.
