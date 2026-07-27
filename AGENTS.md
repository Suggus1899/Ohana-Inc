# AGENTS.md

## Stack

- **Monorepo**: pnpm workspaces (pnpm >=9, Node >=20) + Flutter app (no pnpm-managed)
- **Workspace**: `apps/*`
  - `apps/backend` — `@ohana/backend`
  - `apps/frontend` — `@ohana/frontend`
  - `apps/mobile` — Flutter app (managed with `flutter` CLI, not pnpm)

## Frameworks

| App | Path | Framework | Language | Database | Testing |
|-----|------|-----------|----------|----------|---------|
| Backend | `apps/backend` | Express | TypeScript | PostgreSQL (Sequelize) | Jest |
| Frontend | `apps/frontend` | Vite + React | TypeScript | — | Vitest |
| Mobile | `apps/mobile` | Flutter | Dart | — | `flutter test` |

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

### Mobile (`apps/mobile`)
- Runtime: Flutter 3 + Dart 3
- State: Riverpod 2 (riverpod_annotation)
- Routing: go_router
- HTTP: dio
- Real-time: socket_io_client
- Maps: flutter_map + latlong2
- Models: freezed + json_serializable
- Storage: flutter_secure_storage (JWT), shared_preferences
- Dev: `flutter run` (default API at `http://10.0.2.2:3026/api` for Android emulator)
- Build: `flutter build apk` / `flutter build appbundle` / `flutter build ios`
- Test: `flutter test`
- Lint: `flutter analyze`

## Commands

Run from the repository root unless noted.

| Task | Command |
|------|---------|
| Install dependencies (web + backend) | `pnpm install` |
| Install dependencies (mobile) | `cd apps/mobile && flutter pub get` |
| Dev (web + backend) | `pnpm dev` |
| Dev backend only | `pnpm --filter @ohana/backend dev` |
| Dev frontend only | `pnpm --filter @ohana/frontend dev` |
| Dev mobile | `cd apps/mobile && flutter run` |
| Test (web + backend) | `pnpm test` |
| Test backend only | `pnpm --filter @ohana/backend test` |
| Test frontend only | `pnpm --filter @ohana/frontend test` |
| Test mobile | `cd apps/mobile && flutter test` |
| Build (web + backend) | `pnpm build` |
| Build backend only | `pnpm --filter @ohana/backend build` |
| Build frontend only | `pnpm --filter @ohana/frontend build` |
| Build mobile (Android apk) | `cd apps/mobile && flutter build apk` |
| Lint (web) | `pnpm lint` |
| Lint frontend only | `pnpm --filter @ohana/frontend lint` |
| Lint mobile | `cd apps/mobile && flutter analyze` |

General per-app pattern: `pnpm --filter <app> run <script>` (e.g. `dev`, `test`, `build`, `lint`).
Mobile is NOT a pnpm workspace — use the `flutter` CLI directly from `apps/mobile`.

## Conventions

- **Commits**: Conventional Commits only (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `style:`).
- **No AI attribution**: Never add `Co-Authored-By` or any AI attribution to commits, PRs, or code.
- **Language**: Source code, comments, and UI copy in English.

## SDD

Run `/sdd-init` with cwd here. Stack: pnpm monorepo. Testing: Jest (backend), Vitest (frontend).
