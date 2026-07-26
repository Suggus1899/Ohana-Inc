# Ohana

Senior care homes (residencias) platform — KYC biometrics, P2P transactions, real-time chat, navigation.

## Structure

```
ohana/
├── apps/
│   ├── backend/    # Express + TypeScript + Sequelize + PostgreSQL + Redis
│   └── frontend/   # React + Vite + Tailwind + shadcn/ui
├── package.json    # workspace root
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- PostgreSQL 16
- Redis 7
- Docker (optional, for containerized dev/prod)

## Setup

```bash
# Install dependencies for all workspaces
pnpm install

# Run both apps in parallel
pnpm dev

# Run individually
pnpm dev:backend
pnpm dev:frontend

# Build all
pnpm build

# Test all
pnpm test
```

## Apps

- **Backend**: `apps/backend/` — see `apps/backend/README.md`
- **Frontend**: `apps/frontend/` — see `apps/frontend/README.md`
