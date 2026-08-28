# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

`AGENTS.md` at the repo root has the authoritative stack/commands table — read it too. This file adds the architecture context that isn't obvious from a single file.

## What this is

Ohana — rental/lease marketplace platform for Colombia (properties, biometric KYC, P2P rental transactions with escrow, real-time chat, GPS navigation). Three apps sharing one Express/PostgreSQL backend: a React SPA, a Flutter mobile app, and the backend itself.

## Commands

pnpm workspace (`apps/*`); mobile is Flutter-managed, **not** a pnpm workspace member.

```bash
pnpm install                          # web + backend deps
cd apps/mobile && flutter pub get     # mobile deps

pnpm dev                              # backend (3026) + frontend (8080) in parallel
pnpm --filter @ohana/backend dev      # backend only (tsx watch)
pnpm --filter @ohana/frontend dev     # frontend only (vite)
cd apps/mobile && flutter run         # mobile (API defaults to http://10.0.2.2:3026/api on Android emulator)

pnpm test                             # jest (backend) + vitest (frontend)
pnpm --filter @ohana/backend test     # jest --coverage
pnpm --filter @ohana/frontend test    # vitest run
cd apps/mobile && flutter test

pnpm lint                             # eslint (frontend)
cd apps/mobile && flutter analyze

pnpm build                            # tsc (backend) + vite build (frontend)
```

Run a single backend test: `cd apps/backend && npx jest path/to/file.test.ts` (or `-t "test name"`).
Run a single frontend test: `cd apps/frontend && npx vitest run path/to/file.test.tsx`.

**Database setup** (backend, from `apps/backend`):
```bash
cp .env.example .env      # set JWT_SECRET etc.; DB defaults postgres/1234/ohana_db
pnpm run reset             # sync models + full seed
pnpm run migrate           # run custom migration runner (up)
```

## Backend architecture (`apps/backend/src`)

Layering: `routes/*.routes.ts` → `controllers/*.controller.ts` → `services/*.service.ts` → Sequelize `models/`. All models are declared individually under `models/` and wired together with associations in `models/index.ts` — check there when tracing a relation that isn't obvious from a single model file.

**Errors & responses**: every endpoint returns the `ApiResponse<T>` envelope (`{ success, data?, error? }`) defined in `types/index.ts`, with `ErrorCodes` as the closed set of error codes. Throw `AppError` subclasses (`ValidationError`, `AuthenticationError`, `AuthorizationError`, `NotFoundError`, `ProcessingError` — in `middleware/error.middleware.ts`) from services/controllers; the centralized `errorHandler` maps them (and raw Sequelize/Multer errors) to the right HTTP status. Don't hand-roll `res.status().json()` error shapes in new code — throw instead.

**Auth**: JWT access tokens (15 min, `JWT_SECRET` required at boot) carry `sessionId`. `UserSession` rows are the source of truth for "is this session still alive" — `authenticate` middleware re-checks the session on every request, so revoking a session (or a fresh login, which invalidates all prior sessions for that user — single-session model) takes effect immediately even though the JWT itself is still cryptographically valid. Refresh tokens are opaque 32-byte hex secrets, stored SHA-256-hashed on `UserSession.refreshToken`, rotated on every use, 30-day expiry (see `services/jwt.service.ts`, `SECURITY.md`). This refresh-token-rotation flow is being added right now — check `git status`/`git diff` before assuming it's finished end-to-end.

**CORS/CSRF**: handled by hand in `app.ts`, not a library — origin allowlist built from `FRONTEND_URL` + `CORS_ORIGINS` env var. CSRF is a non-issue by design: everything auths via `Authorization: Bearer`, no cookies, so there's deliberately no CSRF token.

**Rate limiting**: tiered via `express-rate-limit` in `middleware/rate-limit.middleware.ts` — global `/api/*` (100/min/IP) is looser than auth routes (5/15min), password reset (3/15min), and heavy KYC ops (10/15min). See `SECURITY.md` for the exact table before changing limits.

**Migrations are hand-registered, not sequelize-cli**: adding a migration means creating a file under `src/migrations/`, then importing it AND adding it to the array in `src/scripts/migrate.ts` (which delegates to `migration-runner.ts`). Forgetting the registration step means the migration silently never runs. `unified-migrations` is the baseline schema; everything else is incremental.

**Real-time (`websocket/socket.ts`)**: Socket.IO, JWT-authenticated at handshake, Redis adapter when `isRedisConnected()` else falls back to in-memory (single-instance only — be aware of this when reasoning about multi-instance chat delivery). Rooms are per-user (`user_{id}`) and per-conversation (`conversation_{id}`), plus an `operators` room. Chat messages pass through `chat.service.ts`'s content filter (`filterContent`) and an in-memory heuristic (`detectDistributedPhonePattern`) that scores messages to catch contact info being smuggled across multiple messages (e.g. splitting a phone number into separate digit-only messages) — this state lives in a module-level `Map`, not Redis, so it resets on restart and doesn't share across instances.

**P2P transaction/escrow flow**: `RentalRequest` (pending → approved) creates a `Transaction` that moves through `TransactionStatus`/`EscrowStatus` (pending_payment → payment_submitted/holding → completed) inside `sequelize.transaction()` blocks, with every transition logged to `TransactionTimeline` for audit. `escrow.service.ts` holds/releases payment, `transaction-expiry.service.ts` auto-expires stale transactions (cron), `dispute.service.ts` covers the open→under_review→resolved dispute path. Read `escrow.service.ts` alongside `transaction.service.ts` — they share the same state machine and both need to stay in sync when either changes.

**KYC**: 3 progressive levels (basic info → additional info → documents+biometrics), the last requiring operator review. Biometrics pipeline is Tesseract.js OCR (`ocr.service.ts`) → face-api face match (`face-match.service.ts`) → TensorFlow liveness (`services/liveness/`, `liveness-detection.service.ts`). `requireVerificationLevel(n)` middleware gates routes by level.

**Logging**: `config/logger.ts` (pino) is a recent addition, being threaded through incrementally — some code paths still use raw `console.log`/`console.error` (e.g. `websocket/socket.ts`). Prefer `logger` in code you touch, but don't assume the whole codebase has migrated yet.

## Frontend architecture (`apps/frontend/src`)

Vite + React SPA. Role-based dashboards (`AdminDashboard`, `OperatorDashboard`, `OwnerDashboard`, `TenantDashboard`) are the main entry points post-login, matching the backend's `UserRole` set. `AuthContext` + `httpClient.ts` own the token lifecycle — access tokens are kept in memory, not `localStorage` (see `SECURITY.md`), so a page refresh relies on the refresh-token flow to re-establish a session; check `httpClient.ts` for how/whether that's wired before assuming silent refresh works everywhere. `services/api.ts` vs `services/mockApi.ts`/`mockData.ts` — the mock layer exists for offline/demo development, don't confuse it with the real API client.

## Mobile architecture (`apps/mobile/lib`)

Flutter, Clean Architecture split into `core/` (constants, utilities), `data/` (API clients, repositories), `presentation/` (Riverpod providers, widgets, screens). Routing via `go_router`, models via `freezed`/`json_serializable`, JWT stored in `flutter_secure_storage`. Talks to the same backend as the web app — role dashboards mirror the frontend's.

## Cross-cutting notes

- User roles: `admin`, `operator`, `propietario` (owner), `cliente` (tenant), `estudiante` (tenant sub-role) — this set shows up as a literal union type in backend `types/index.ts`, frontend, and mobile; keep them in sync if it ever changes.
- Property types (`Apartamento`, `Casa`, `Cuarto`, `Residencia`, `Finca`, `Local`, `Terreno`) each may have type-specific fields (e.g. `Residencia` has `availableRooms`/`occupiedRooms`/`roomsWithBathroom`) — see `PropertyAttributes` in `types/index.ts`.
- Payment methods are Colombia-specific: Nequi, Daviplata, PSE, Efecty — don't assume Stripe/generic card rails exist.
- A `graphify-out/` directory exists at the repo root from a prior `graphify` run (2026-08-05) — it predates the in-flight auth/security changes, so treat it as a stale snapshot, not current truth.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Ohana-Inc** (11675 symbols, 20017 relationships, 272 execution flows).

> Index stale? Run `node .gitnexus/run.cjs analyze --index-only` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? Bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact analysis before editing.** Use `impact({target: "symbolName", direction: "upstream"})` (MCP) or `node .gitnexus/run.cjs impact "symbolName" --direction upstream --repo .` (CLI fallback); report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node .gitnexus/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "main"})` or `node .gitnexus/run.cjs detect-changes --scope compare --base-ref "main" --repo .`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/Ohana-Inc/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Ohana-Inc/clusters` | All functional areas |
| `gitnexus://repo/Ohana-Inc/processes` | All execution flows |
| `gitnexus://repo/Ohana-Inc/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
