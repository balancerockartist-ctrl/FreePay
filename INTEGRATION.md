# Integration Guide (short)

This document explains the end-to-end flow and how to get the backend running locally or on Cloud Run.

1) Local development
- Copy backend/.env.example to backend/.env and fill values
- Create virtualenv: python -m venv .venv && source .venv/bin/activate
- Install deps: pip install -r backend/requirements.txt
- Run: uvicorn backend.main:app --host 0.0.0.0 --port 8080

2) Cloud Run deployment (CI)
- Add GitHub repository secrets:
  - GCP_PROJECT: your GCP project id
  - GCP_SA_KEY: JSON key for a service account with roles: "roles/run.admin, roles/storage.admin, roles/cloudbuild.builds.editor"
  - CLOUD_RUN_SERVICE: the desired Cloud Run service name (e.g. freepay-backend)
- Merge to main to trigger .github/workflows/gcloud-deploy.yml

3) Endpoints
- /health
- /camera/verify (POST)
- /redeem (POST)
- /agent/truth (POST)
- /agent/claudia (POST)
- /stats (GET)
- /user/settings (GET)

4) Notes
- This repository currently contains placeholder implementations. Integrate OCR, Solana Anchor program calls, and database persistence as next steps.
