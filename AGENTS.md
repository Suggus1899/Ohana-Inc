# AGENTS.md

## Stack

- **Monorepo**: pnpm workspaces (pnpm >=9, Node >=20)
- **Workspace**: `apps/*`
  - `apps/backend` — `@ohana/backend`
  - `apps/frontend` — `@ohana/frontend`

## Frameworks

| App | Path | Framework | Language | Database | Testing |
|-----|------|-----------|----------|----------|---------|
| Backend | `apps/backend` | Express | TypeScript | PostgreSQL (Sequelize) | Jest |
| Frontend | `apps/frontend` | Vite + React | TypeScript | — | Vitest |

### Backend (`apps/backend`)
- Runtime: Express + TypeScript + Sequelize + PostgreSQL
- Dev server: `tsx watch src/index.ts`
- Build: `tsc`
- Test: `jest --coverage`
- Extras: Socket.IO, Redis (ioredis), Passport, AWS S3, face-api/tensorflow, sharp, tesseract

### Frontend (`apps/frontend`)
- Runtime: Vite + React 18 + TypeScript
- Build: `vite build`
- Test: `vitest run`
- Lint: `eslint .`
- Extras: React Router, TanStack Query, Radix UI, Tailwind CSS, framer-motion, recharts

## Commands

Run from the repository root unless noted.

| Task | Command |
|------|---------|
| Install dependencies | `pnpm install` |
| Dev (both apps) | `pnpm dev` |
| Dev backend only | `pnpm --filter @ohana/backend dev` |
| Dev frontend only | `pnpm --filter @ohana/frontend dev` |
| Test (all apps) | `pnpm test` |
| Test backend only | `pnpm --filter @ohana/backend test` |
| Test frontend only | `pnpm --filter @ohana/frontend test` |
| Build (all apps) | `pnpm build` |
| Build backend only | `pnpm --filter @ohana/backend build` |
| Build frontend only | `pnpm --filter @ohana/frontend build` |
| Lint (all apps) | `pnpm lint` |
| Lint frontend only | `pnpm --filter @ohana/frontend lint` |

General per-app pattern: `pnpm --filter <app> run <script>` (e.g. `dev`, `test`, `build`, `lint`).

## Conventions

- **Commits**: Conventional Commits only (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `style:`).
- **No AI attribution**: Never add `Co-Authored-By` or any AI attribution to commits, PRs, or code.
- **Language**: Source code, comments, and UI copy in English.

## SDD

Run `/sdd-init` with cwd here. Stack: pnpm monorepo. Testing: Jest (backend), Vitest (frontend).
