# AGENTS

Purpose: help coding agents become productive quickly in this repository.

## Scope

- This repo contains a React + Vite frontend and a Google Apps Script backend bundle.
- Keep changes minimal and scoped. Do not refactor unrelated areas.
- Prefer linking to existing docs instead of duplicating long explanations.

## Runbook

- Install deps: `yarn install`
- Start dev server: `yarn dev`
- Build frontend + GAS bundle: `yarn build`
- Lint and format: `yarn lint`
- Run all e2e tests: `yarn test:e2e`
- Run phase 1 tests only: `yarn test:e2e:phase1`
- Run phase 2 tests only: `yarn test:e2e:phase2`
- Push Apps Script: `yarn push`
- Publish Apps Script deployment: `yarn publish`

## Project Map

- Frontend app entry: [src/main.jsx](src/main.jsx)
- App shell/routes: [src/App.jsx](src/App.jsx)
- Pages: [src/pages](src/pages)
- Domain components: [src/components](src/components)
- API clients and bridge: [src/lib](src/lib)
- Contexts: [src/contexts](src/contexts)
- Zustand stores: [src/store](src/store)
- State tree utilities: [src/state](src/state)
- GAS backend source: [src-gs](src-gs)
- GAS router: [src-gs/gas-server.js](src-gs/gas-server.js)
- Workspace API: [src-gs/workplaces-api.js](src-gs/workplaces-api.js)
- Prompt API: [src-gs/prompts-api.js](src-gs/prompts-api.js)
- Document API: [src-gs/documents-api.js](src-gs/documents-api.js)
- E2E tests: [tests/phase-gates](tests/phase-gates)

## Architecture Notes

- Frontend calls [src/lib/gas-client.js](src/lib/gas-client.js), which invokes Apps Script using `window.google.script.run.invoke("METHOD:/path", payload)`.
- Backend request routing is handled by [src-gs/gas-server.js](src-gs/gas-server.js), including path params like `/api/workspaces/:name`.
- Data persistence is spreadsheet-based in [src-gs/g-sheet-db.js](src-gs/g-sheet-db.js).
- Global app data caching and refresh flows are managed in [src/contexts/AppDataContext.jsx](src/contexts/AppDataContext.jsx).

## Code Conventions

- Keep API client wrappers thin and Promise-based.
- Preserve existing path patterns for GAS routes and dynamic params.
- Follow existing component/domain folder boundaries.
- Use store/context update pathways already present instead of adding duplicate state sources.
- Prefer focused edits over broad style churn.

## Critical Pitfalls

- Cache only GET responses in [src/lib/gas-client.js](src/lib/gas-client.js).
- Do not cache mutation responses (POST/PUT/DELETE); clear/invalidate relevant caches after mutations.
- Keep `METHOD:/path` request format exact when calling Apps Script invoke.
- Ensure GAS route definitions include dynamic segments where clients call detail/update/delete endpoints.
- In e2e tests, avoid racey assertions around modals/dialogs; wait for UI state to settle after navigation or async list reload.

## Testing Guidance

- For navigation and CRUD regressions, start with [tests/phase-gates/phase2.crud-navigation.spec.js](tests/phase-gates/phase2.crud-navigation.spec.js).
- For store migration behavior, use [tests/phase-gates/phase1.store-migration.spec.js](tests/phase-gates/phase1.store-migration.spec.js).
- Prefer running the smallest relevant phase test before running full suite.

## Existing Docs

- Product/design behavior: [design.md](design.md)
- Setup/config scripts: [package.json](package.json)
- Vite baseline README: [README.md](README.md)
- Repo memory: [/memories/repo/apps-script-storage.md](/memories/repo/apps-script-storage.md)
- Repo memory: [/memories/repo/frontend-state-tree.md](/memories/repo/frontend-state-tree.md)

## Agent Behavior Checklist

- Confirm target area and read related files before editing.
- After edits, run the narrowest relevant lint/test command.
- Report changed files and behavioral impact.
- If blocked by missing runtime context (Apps Script environment, auth, or deployment IDs), explain the blocker and continue with best local validation.
