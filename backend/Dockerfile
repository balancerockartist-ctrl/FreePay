# Multi-stage Dockerfile for FreePay backend

FROM python:3.11-slim as builder
WORKDIR /app

# Install build deps
RUN apt-get update && apt-get install -y --no-install-recommends build-essential gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/
RUN python -m pip install --upgrade pip
RUN pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

FROM python:3.11-slim
WORKDIR /app

# Copy wheels
COPY --from=builder /wheels /wheels
RUN pip install --no-cache /wheels/*

# Copy source
COPY backend /app

ENV PORT=8080
EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
