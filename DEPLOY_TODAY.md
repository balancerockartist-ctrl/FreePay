# Deploy Today

Step-by-step guide to get FreePay running in production **right now**.

---

## Prerequisites

- Docker ≥ 24 and Docker Compose v2 installed on the target host
- Port **8000** (API) and **3000** (dashboard) open in your firewall / security-group rules
- (Optional) A domain name + TLS termination proxy (nginx, Caddy, Traefik, …)

---

## 1 — Clone the repository

```bash
git clone https://github.com/balancerockartist-ctrl/FreePay.git
cd FreePay
```

---

## 2 — Configure environment

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and set at minimum:

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_NAME` | **yes** | Name of the MongoDB database (e.g. `freepay`) |
| `MONGO_URL` | auto | Set by `docker-compose.yml`; override only if using an external cluster |
| `CORS_ORIGINS` | auto | Set by `docker-compose.yml`; override if your frontend is on a custom domain |

---

## 3 — Start the stack

```bash
docker compose up --build -d
```

| Service | Address |
|---------|---------|
| REST API | <http://localhost:8000/api> |
| Dashboard | <http://localhost:3000> |
| MongoDB | `localhost:27017` (internal only) |

---

## 4 — Verify

```bash
curl http://localhost:8000/api/
# → {"message":"Hello World"}
```

---

## 5 — Stop

```bash
docker compose down          # keep data volume
docker compose down -v       # also delete the mongo_data volume
```

---

## CI/CD (GitHub Actions)

Images are automatically built and pushed to the **GitHub Container Registry** on every
push to `main`. Before the first run, add a repository Actions variable:

```text
Settings → Secrets and variables → Actions → Variables → New repository variable

  Name:  REACT_APP_BACKEND_URL
  Value: https://api.yourdomain.com
```

Pull the latest images on your server after the workflow completes:

```bash
docker compose pull && docker compose up -d
```

---

## Updating

```bash
git pull
docker compose up --build -d
```
