# FreePay — Frontend

React 19 application with Tailwind CSS and shadcn/ui components.

## Quick Start

```bash
yarn install
yarn start          # http://localhost:3000
yarn build          # production build
yarn test           # run tests
```

## Environment

Create a `.env` file (or set these variables):

| Variable                  | Default | Description                     |
| ------------------------- | ------- | ------------------------------- |
| `REACT_APP_BACKEND_URL`  | —       | Base URL of the FastAPI backend |

## Project Layout

```
src/
├── components/ui/    # shadcn/ui primitives
├── hooks/            # Custom React hooks
├── lib/              # Utility helpers
├── App.js            # Root component & routing
└── index.js          # Entry point
```
