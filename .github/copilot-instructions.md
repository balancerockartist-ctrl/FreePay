# FreePay – Copilot Instructions

## Project Overview
FreePay is a full-stack payment application with a Python FastAPI backend and a React frontend.

## Architecture
- **Backend**: Python + FastAPI + MongoDB (async via Motor) — lives in `backend/`
- **Frontend**: React 19 + Tailwind CSS + shadcn/ui (Radix UI) + React Router v7 — lives in `frontend/`

## Build & Run Commands

### Backend
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run the server (from repo root)
uvicorn backend.server:app --reload

# Lint / format
cd backend && black . && isort . && flake8 . && mypy .

# Run tests
pytest tests/
```

### Frontend
```bash
cd frontend

# Install dependencies
yarn install

# Start dev server
yarn start

# Build for production
yarn build

# Run tests
yarn test
```

## Code Style

### Backend (Python)
- Use **Pydantic v2** models (`model_config`, `model_dump()`, `Field`)
- Prefer `async`/`await` throughout; use `motor` for all MongoDB operations
- Format with `black`, sort imports with `isort`, lint with `flake8`, type-check with `mypy`
- Use `uuid.uuid4()` for IDs, `datetime.now(timezone.utc)` for timestamps
- Store environment secrets in `.env`; load with `python-dotenv`

### Frontend (JavaScript/React)
- Functional components only — no class components
- Use `@/` path alias for `src/` imports (configured via craco + jsconfig)
- Use shadcn/ui (Radix UI) components from `frontend/src/components/`
- Style with Tailwind CSS utility classes
- Fetch backend data via `axios`; base URL from `process.env.REACT_APP_BACKEND_URL`
- Use `react-hook-form` + `zod` for form validation

## Workflow
- Run lint + tests after making changes: `black . && isort . && flake8 .` (backend) or `yarn test` (frontend)
- Keep backend routes under the `/api` prefix (via `APIRouter(prefix="/api")`)
- CORS is configured on the backend; the frontend and backend must both be running during development
