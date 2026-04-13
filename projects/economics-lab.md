# Economics Lab

## Overview

The Economics Lab is an experimental sandbox within the
[Quantum-Economics](https://github.com/balancerockartist-ctrl/Quantum-Economics-) initiative.
It explores new economic models enabled by AI agents, programmable money, and real-time
ledger data from FreePay.

---

## Research areas

### 1. Agent-mediated markets

Can autonomous agents negotiate prices and settle payments without human intervention?
The lab implements toy market simulations where buyer and seller agents interact through
the FreePay API.

**Tooling**: Python simulation scripts, FreePay sandbox environment, Jupyter notebooks.

---

### 2. Tokenomics modelling

Before any token is launched, its economic properties should be stress-tested. The lab
provides Monte Carlo simulations of token velocity, inflation, and equilibrium price
under various demand shocks.

**Tooling**: NumPy, Pandas, matplotlib; results exported as CSV and visualised in the
FreePay dashboard.

---

### 3. Algorithmic pricing

Exploring dynamic fee structures where transaction fees adjust based on network load,
account history, and real-time market data.

**Tooling**: Reinforcement learning experiments (future); rule-based prototype in Phase 3.

---

## Relationship to FreePay

Economics Lab experiments consume the FreePay ledger API as their settlement layer.
Every simulated trade produces a real `Transaction` record, allowing researchers to
replay, audit, and analyse economic outcomes using actual ledger data.

---

## Status

⬜ **Planned** — initial simulations will be introduced alongside the crypto rails work
in Phase 3 of the [Roadmap](../docs/roadmap.md).
