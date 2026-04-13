# Roadmap

## Milestone overview

| Phase | Name | Status |
|-------|------|--------|
| 1 | Off-chain ledger MVP | 🟡 In progress |
| 2 | Stripe integration | ⬜ Planned |
| 3 | Crypto rails | ⬜ Planned |
| 4 | Agent economy | ⬜ Planned |

---

## Phase 1 — Off-chain ledger MVP

**Goal**: A working, deployable payment ledger with a REST API and a simple dashboard.

### Completed

- [x] FastAPI backend with MongoDB persistence
- [x] Pydantic v2 models with UUID identifiers
- [x] CORS-configured API with environment-driven secrets
- [x] React 19 frontend scaffolded with Tailwind + shadcn/ui
- [x] Repository documentation (README, vision, architecture, AI policy, roadmap)
- [x] CI workflow for Markdown linting

### In progress

- [ ] `Transaction` model and CRUD routes
- [ ] `Account` model with running balance calculation
- [ ] Basic dashboard — transaction list and account balance card
- [x] `.env.example` with documented variables
- [x] Docker Compose for local development

### Stretch goals

- [ ] CSV export of transaction history
- [ ] Pagination and filtering on `GET /api/transactions`
- [ ] OpenAPI documentation published to GitHub Pages

---

## Phase 2 — Stripe integration

**Goal**: Accept real card payments via Stripe; sync webhooks back to the FreePay ledger.

- [ ] Stripe SDK integration in backend
- [ ] `PaymentIntent` creation and webhook handler
- [ ] Stripe event reconciliation against local `Transaction` records
- [ ] Dashboard: Stripe payment status indicators

---

## Phase 3 — Crypto rails

**Goal**: Support EVM-compatible wallet payments and stablecoin settlement.

- [ ] Wallet address as first-class `Account` field
- [ ] EVM transaction hash stored in `Transaction.external_ref`
- [ ] Optional on-chain settlement via USDC / stablecoins
- [ ] Read-only blockchain explorer link in dashboard

---

## Phase 4 — Agent economy

**Goal**: AI agents participate as autonomous payers and payees.

- [ ] Agent JWT identity with spend-limit enforcement
- [ ] Automated reconciliation job (scheduled via `APScheduler`)
- [ ] Anomaly detection pipeline (flag unusual patterns)
- [ ] Agent dashboard — spend breakdown, flagged transactions

---

## Version history

| Version | Date | Highlights |
|---------|------|------------|
| 0.1.0 | 2026-04-05 | Initial MVP scaffold — API, frontend, CI, documentation |
