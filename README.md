# FreePay

**FreePay** is an open-source payment platform built with a modern stack — organized and maintained by **Claudia AI**.

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | React 19, Tailwind CSS, shadcn/ui   |
| Backend  | FastAPI (Python), Motor (async MongoDB driver) |
| Database | MongoDB                             |

## Project Structure

```
FreePay/
├── backend/                # FastAPI backend
│   ├── config.py           # App configuration & database setup
│   ├── models.py           # Pydantic data models
│   ├── routes/             # API route modules
│   │   ├── __init__.py
│   │   └── status.py       # Status check endpoints
│   ├── server.py           # Application entry point
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   ├── App.js          # Root application component
│   │   └── index.js        # Entry point
│   └── package.json        # Node dependencies
├── tests/                  # Test suites
│   └── __init__.py
├── memory/                 # Persistent memory store
└── test_reports/           # Test output artifacts
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB instance (local or cloud)

### Backend

```bash
cd backend
pip install -r requirements.txt
# Set environment variables in backend/.env:
#   MONGO_URL=mongodb://localhost:27017
#   DB_NAME=freepay
uvicorn server:app --reload --port 8000
```

### Frontend

```bash
cd frontend
yarn install
yarn start
# App runs on http://localhost:3000
```

## API Endpoints

| Method | Path           | Description              |
| ------ | -------------- | ------------------------ |
| GET    | `/api/`        | Health check             |
| POST   | `/api/status`  | Create a status check    |
| GET    | `/api/status`  | List all status checks   |

## License

This project is open-source.
