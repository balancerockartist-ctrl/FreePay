# Deploying FreePay to Google Cloud Run

This guide walks through deploying the FreePay backend and frontend to
[Google Cloud Run](https://cloud.google.com/run) using Cloud Build for CI/CD.

---

## Prerequisites

- A Google Cloud project with billing enabled
- `gcloud` CLI installed and authenticated (`gcloud auth login`)
- [Cloud Run API](https://console.cloud.google.com/apis/library/run.googleapis.com) enabled
- [Cloud Build API](https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com) enabled
- [Container Registry API](https://console.cloud.google.com/apis/library/containerregistry.googleapis.com) enabled

---

## 1. Set environment variables

```bash
export PROJECT_ID=$(gcloud config get-value project)
export REGION=us-central1
```

---

## 2. Store secrets in Secret Manager

FreePay reads `MONGO_URL` from a Secret Manager secret named `freepay-secrets`.

```bash
# Create the secret
echo -n "mongodb+srv://<user>:<password>@<cluster>.mongodb.net" | \
  gcloud secrets create freepay-secrets \
    --replication-policy=automatic \
    --data-file=-

# Grant Cloud Run access to the secret
gcloud secrets add-iam-policy-binding freepay-secrets \
  --member="serviceAccount:$(gcloud iam service-accounts list \
    --filter='displayName:Compute Engine default service account' \
    --format='value(email)')" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Deploy with Cloud Build

Trigger a build and deploy from the repository root:

```bash
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions _REGION=$REGION \
  .
```

Cloud Build will:

1. Build the backend Docker image and push it to Container Registry
2. Build the frontend Docker image and push it to Container Registry
3. Deploy the backend to Cloud Run as `freepay-backend`
4. Deploy the frontend to Cloud Run as `freepay-frontend`

---

## 4. Manual deployment (optional)

### Backend

```bash
# Build and push
docker build -t gcr.io/$PROJECT_ID/freepay-backend ./backend
docker push gcr.io/$PROJECT_ID/freepay-backend

# Deploy
gcloud run deploy freepay-backend \
  --image gcr.io/$PROJECT_ID/freepay-backend \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars DB_NAME=freepay,CORS_ORIGINS="*" \
  --set-secrets MONGO_URL=freepay-secrets:latest
```

### Frontend

```bash
# Retrieve the backend URL first
BACKEND_URL=$(gcloud run services describe freepay-backend \
  --region $REGION \
  --format 'value(status.url)')

# Build and push (pass backend URL as build arg if needed)
docker build -t gcr.io/$PROJECT_ID/freepay-frontend ./frontend
docker push gcr.io/$PROJECT_ID/freepay-frontend

# Deploy
gcloud run deploy freepay-frontend \
  --image gcr.io/$PROJECT_ID/freepay-frontend \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars REACT_APP_BACKEND_URL=$BACKEND_URL
```

---

## 5. Continuous deployment (Cloud Build trigger)

Set up automatic deploys on every push to `main`:

```bash
gcloud builds triggers create github \
  --repo-name=FreePay \
  --repo-owner=<your-github-org> \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --substitutions _REGION=$REGION
```

---

## Useful commands

| Command | Purpose |
|---------|---------|
| `gcloud run services list --region $REGION` | List deployed services |
| `gcloud run services describe freepay-backend --region $REGION` | Service details & URL |
| `gcloud builds list --limit 5` | Recent build history |
| `gcloud logging read "resource.type=cloud_run_revision" --limit 50` | View logs |
