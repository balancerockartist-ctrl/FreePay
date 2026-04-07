# Demos

This directory contains runnable demos and screenshots that illustrate FreePay's
capabilities at each development phase.

---

## Planned demos

| Demo | Phase | Description |
|------|-------|-------------|
| `01-ledger-api/` | 1 | `curl` / HTTPie script showing transaction creation and balance query |
| `02-dashboard/` | 1 | Screenshot walkthrough of the React dashboard |
| `03-stripe/` | 2 | End-to-end Stripe payment flow (test mode) |
| `04-crypto/` | 3 | USDC payment settled on a local Hardhat node |
| `05-agents/` | 4 | Reconciliation agent run with annotated output |

---

## Running a demo

Each demo subdirectory will contain its own `README.md` with step-by-step instructions.
Prerequisites (environment variables, running services) will be documented there.

---

## Contributing a demo

1. Create a new subdirectory under `demos/` with a sequential prefix (e.g., `06-my-demo/`).
2. Include a `README.md` explaining the demo's purpose and how to run it.
3. Keep external dependencies minimal — demos should work with the standard local dev setup
   described in the main [README](../README.md).
