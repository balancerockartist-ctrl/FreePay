# FreePay - GodWorld

This repository contains the backend and frontend components for the FreePay system (GodWorld project).

This branch introduces a deployable backend and CI to push a container image to Google Cloud Run.

Next steps after merge:
- Wire the Solana Anchor program or deploy an Anchor contract and set FREEPAY_PROGRAM_ID
- Provide CLAUDE_API_KEY and DATABASE_URL as secrets and configure managed DB (Cloud SQL)
- Implement OCR and Solana transaction signing with a secure key management flow
