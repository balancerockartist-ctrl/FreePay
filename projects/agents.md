# Agents

## Overview

The Agents project brings AI-powered automation to the FreePay ecosystem. Agents are
autonomous programs that interact with the FreePay API to perform tasks such as
reconciliation, anomaly detection, and spend analytics — all without direct human
intervention in the happy path.

---

## Planned agents

### 1. Reconciliation Agent

**Purpose**: Automatically match internal `Transaction` records against external sources
(Stripe webhooks, blockchain confirmations).

**Triggers**:

- Scheduled run (every 15 minutes)
- On-demand via `POST /api/agents/reconcile`

**Outputs**:

- Updated `Transaction.status` fields
- `ReconciliationReport` document stored in MongoDB

---

### 2. Anomaly Detection Agent

**Purpose**: Flag transactions that deviate from established account patterns.

**Method**: Statistical baseline (mean ± 3σ on transaction amounts per account); ML model
in Phase 4.

**Outputs**:

- `Transaction.flagged = true` on suspicious records
- Alert posted to a configurable webhook (Slack, email, etc.)

---

### 3. Spend Analytics Agent

**Purpose**: Generate periodic spend summaries per account.

**Outputs**:

- Aggregated spend report (daily / weekly / monthly)
- Dashboard data endpoint: `GET /api/agents/spend-summary`

---

## Agent authentication

Agents use JWT tokens with an `agent: true` claim. Spend limits are enforced per-agent
and stored in the `AgentConfig` collection.

See [AI Policy](../docs/ai-policy.md) for the full governance model.

---

## Status

⬜ **Planned** — agents will be introduced in Phase 4 of the
[Roadmap](../docs/roadmap.md).
