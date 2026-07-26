---
description: Run after any plan, implementation, change, or improvement is completed — tests, verifies, updates memory, commits, and pushes automatically.
---

# Post-Change Workflow

This workflow runs automatically after completing any plan, implementation, change, or improvement in the SaludTech_CasheaMedico project. All phases execute without asking for confirmation.

## Phase 1 — Test & Verify

1. **Backend (Go)**
   - Run `go build ./...` in `backend-go/` to verify compilation
   - Run `go test ./...` in `backend-go/` if test files exist
   - If compilation or tests fail, STOP and report the error to the user

2. **Frontend (Next.js)**
   - Identify which app(s) were affected (`web-patient`, `web-admin`, `web-merchant`, `web-landing`)
   - Run `pnpm --filter <app> build` for each affected app
   - If build fails, STOP and report the error to the user

3. **MCP Verification**
   - Use Puppeteer MCP to navigate to affected pages, take screenshots, and check for console errors
   - Use `Invoke-RestMethod` or `curl` to test affected API endpoints (e.g. `http://localhost:8081/api/v1/...`)
   - If any verification fails, STOP and report to the user

## Phase 2 — Update Memory

4. **Save context to memory**
   - Use `create_memory` to save:
     - What was changed and why
     - Key files modified (with paths)
     - Any architectural decisions made
     - Current project state (running services, DB status, etc.)
   - If a semantically related memory already exists, update it instead of creating a duplicate
   - Use tags like `saludtech`, `backend-go`, `web-patient`, etc. for discoverability

## Phase 3 — Commit

5. **Stage changes**
   - Run `git add -A` in the project root

6. **Create commit**
   - Use conventional commit format: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `style:`
   - Commit message must be concise and descriptive of the change
   - NEVER add "Co-Authored-By" or any AI attribution
   - Example: `feat: add dark mode toggle to patient settings page`

## Phase 4 — Push

7. **Push to remote**
   - Run `git push` to the current remote and branch
   - Report the push result (success or failure) to the user

## Rules

- All phases run automatically without asking for confirmation
- If ANY phase fails, stop immediately and report the error to the user
- This workflow is scoped to the SaludTech_CasheaMedico project only
- Conventional commits only, no AI attribution
