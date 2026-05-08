# Master deploy script for local / Cloud Run deployments
# Usage: set required env vars then run: bash master-deploy.sh

set -e

if [ -z "$GCP_PROJECT" ]; then
  echo "GCP_PROJECT not set"
  exit 1
fi
if [ -z "$CLOUD_RUN_SERVICE" ]; then
  echo "CLOUD_RUN_SERVICE not set"
  exit 1
fi

IMAGE=gcr.io/$GCP_PROJECT/freepay-backend:latest

echo "Building Docker image..."
docker build -t $IMAGE -f backend/Dockerfile .

echo "Pushing to GCR..."
gcloud auth configure-docker --quiet
docker push $IMAGE

echo "Deploying to Cloud Run..."
gcloud run deploy $CLOUD_RUN_SERVICE --image $IMAGE --region ${REGION:-us-central1} --platform managed --allow-unauthenticated

echo "Done. Visit the Cloud Run service to get the URL."
