# AI Policy

## Purpose

This document describes how artificial intelligence is used within the FreePay project —
both in the development process and as a first-class runtime participant.

---

## AI in development

### Acceptable uses

| Use case | Notes |
|----------|-------|
| Code generation & review | AI-assisted drafting of boilerplate, tests, and documentation is encouraged. All AI-generated code must be reviewed by a human developer before merging. |
| Documentation drafting | AI may draft docs; a human must verify technical accuracy. |
| Test generation | AI can suggest test cases; humans verify coverage and correctness. |
| Dependency auditing | AI tools may flag vulnerable dependencies; fixes must be human-approved. |

### Requirements

- **Human review**: Every AI-generated or AI-modified code change must be reviewed and
  approved by at least one human contributor before merging.
- **Attribution**: Pull request descriptions must note when significant portions of code or
  documentation were AI-generated.
- **No secrets in prompts**: Never include API keys, passwords, or personal data in prompts
  sent to external AI services.

---

## AI in the runtime

FreePay is designed to support AI agents as first-class API consumers.

### Agent authentication

Agents authenticate using the same JWT mechanism as human users. Agent identities are
distinguished by a `agent: true` claim in the JWT payload.

### Permitted agent actions (Phase 1)

- Query transaction history and account balances.
- Create `status_check` records for health monitoring.

### Permitted agent actions (Phase 2+)

- Initiate payment intents (subject to spend limits).
- Trigger automated reconciliation jobs.
- Flag anomalous transactions for human review.

### Prohibited agent actions

- Agents may **never** approve their own flagged transactions.
- Agents may **never** modify another agent's spend limits.
- Agents may **never** access raw credential or secret fields.

---

## Data governance

- Transaction data is stored exclusively within infrastructure controlled by the project
  operator.
- No transaction data is sent to external AI services without explicit opt-in by the
  account holder.
- Anonymized, aggregated data may be used to train internal fraud-detection models.

---

## Incident response

If an AI agent behaves unexpectedly:

1. Disable the agent's JWT token immediately.
2. File an incident report in the repository issue tracker with the label `ai-incident`.
3. Review the agent's recent API calls in the audit log.
4. Determine root cause before re-enabling the agent.
