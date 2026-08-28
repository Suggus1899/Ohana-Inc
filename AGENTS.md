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
