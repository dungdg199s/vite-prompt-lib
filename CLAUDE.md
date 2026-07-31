# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A React + Vite frontend for managing "workspaces" containing prompts and documents, bundled as a single HTML file and deployed as a Google Apps Script (GAS) web app. The backend is a hand-rolled request router running inside Apps Script, backed by a Google Sheets "database". There is no real HTTP server — the frontend calls Apps Script server functions via `google.script.run`.

This repo already has an `AGENTS.md` with detailed conventions (project map, migration workflow, code conventions, pitfalls). Read it — it is the primary source of repo-specific guidance and this file summarizes/complements it rather than duplicating it in full.

## Commands

- Install: `yarn install`
- Dev server: `yarn dev` (Vite, uses a mock GAS backend in-browser — see Architecture below)
- Build (frontend + GAS bundle into `dist/`): `yarn build`
- Lint + format (writes fixes): `yarn lint`
- E2E tests (all): `yarn test:e2e`
- E2E tests, phase 1 only (store migration): `yarn test:e2e:phase1`
- E2E tests, phase 2 only (CRUD/navigation): `yarn test:e2e:phase2`
- Run a single Playwright test file: `npx playwright test tests/phase-gates/phase2.crud-navigation.spec.js --project=chromium`
- Push build to Apps Script: `yarn push` (builds, then `clasp push -f`)
- Pull from Apps Script: `yarn pull`
- Publish/redeploy the Apps Script web app: `yarn publish` (push, then update or create a clasp deployment)

Playwright starts its own dev server (`npm run dev` on `127.0.0.1:4173`) automatically per `playwright.config.js`, so you don't need to start `yarn dev` separately before running e2e tests.

## Architecture

### Two runtimes sharing one route contract

- Frontend: `src/lib/gasApi.js` exposes `gasClient.{get,post,put,del}`, which calls `window.google.script.run.withSuccessHandler(...).withFailureHandler(...).invoke(method, url, payload)`.
- Backend: `appscripts/_GasServer.js` defines a minimal Express-like router (`GasServer`) that matches `method` + `url` (supporting `:param` segments) against route definitions in `appscripts/AppRouters.js`, then calls the matching handler with `{ params, query, body }`. `appscripts/Code.js` wires this up as the `invoke(method, requestUrl, payload)` global function GAS exposes to the client.
- **The method/URL/payload contract must stay aligned between `src/lib/workspacesClient.js` (or any new client), `appscripts/AppRouters.js`, and the backend handler.** Adding a client call without a matching route (including dynamic `:id` segments) fails silently only at runtime.

### Dev-time backend mock

`window.google.script.run` doesn't exist outside the Apps Script iframe, so `src/lib/gasApi.js` falls back to `src/lib/gasApiMock.js` (an in-memory reimplementation of the same routes over `src/lib/gasApiMockData.js`, with simulated latency) whenever `window.google?.script?.run` is undefined. This is what powers `yarn dev`. When adding a backend route, mirror it in `gasApiMock.js` too, or the dev server and e2e tests will 404 against the mock.

### GAS backend has no module system

Files under `appscripts/` are plain scripts concatenated/pushed as-is (no imports/exports) — everything is a global (`Config`, `AppDatabase`, `GasServer`, `AppRouters`, `gasServer`, `doGet`, `invoke`). They're wrapped in IIFEs to avoid leaking internals, but cross-file references (e.g. `AppDatabase` reading `Config` at module-eval time) depend on load order. File naming (`__Config.js`, `_AppDatabase.js`, `_DocumentService.js`, `_GasServer.js`, then `AppRouters.js`, `Code.js`) encodes that load order — keep new backend files consistent with it if they have eval-time dependencies on each other.

### Build pipeline (`gs.build.cjs`)

`yarn build` runs `vite build` (bundles the SPA into a single HTML file via `vite-plugin-singlefile`, per `vite.config.js`) and then `gs.build.cjs`, which copies every `appscripts/*.js` file into `dist/`, textually substituting `process.env.FOO` references with the value from `.env` (throws if a referenced var is missing from `.env`). `appsscript.json` (the GAS manifest) is copied to `dist/` unchanged. `dist/` is what `clasp push` deploys (see `.clasp.json`'s `rootDir: "dist"`).

### "Database" = Google Sheets

`appscripts/_AppDatabase.js` implements a tiny ORM (`SheetDb`/`SheetTable`) over a Google Sheet: one spreadsheet (found/created via `Config.WORKSPACES_SPREADSHEET_NAME`, tracked in Script Properties), one sheet-tab per table (`workspaces`, `prompts`, `documents`), rows keyed by a generated `id` column. Deletes are soft (`isDeleted` flag). `findAll()` enforces per-record sharing (`shareMode: "private"|"shared"|"public"`, `shareWith` list, `owner`) against the current session user unless the user is in `Config.SYSTEM_ADMIN_EMAIL` — keep this in mind when adding new record types or list endpoints.

### Frontend routing and modals

`src/App.jsx` defines the route tree (all under `/workspaces/...`). Detail views render into the router's normal outlet; create/edit/delete flows render as an _overlaid_ second `<Routes>` block driven by `location.state.backgroundLocation`, so a modal route renders on top of whatever background route was active instead of replacing it. `src/hooks/useAppNavigate.js` centralizes path-building for all `object`/`action` combinations (`workspace|document|prompt` × `view|edit|delete|new|home`) and sets `backgroundLocation` automatically for `edit|delete|new`. Prefer extending that hook over constructing paths ad hoc.

### State ownership

`src/stores/workspaceStore.js` (Zustand) owns all server-backed record data (workspaces/prompts/documents, keyed both as lists and by-id maps), loading state per list/record, a per-key error map, and client-side "open tabs" state that mirrors the current route (`syncTabsWithRoute`, called from `src/AppLayout.jsx`). `src/hooks/useWorkspaces.js` and `useWorkspace.js`-equivalent hooks are the intended read/write surface for components — components should select from the store via these hooks rather than fetching independently. `src/stores/toastStore.js` is a separate small store for toast notifications, used directly by store actions on error (`useToastStore.getState().error(...)`).

### Prompt generator token syntax

Documented in `design.md`: prompt bodies can contain `${Label|options:A,B,C}` (select), `${Label|textarea}` (textarea), or `${Label|anything-else}` (text input), parsed via regex `\$\{([^}|]+)\|([^}]+)\}` in `src/components/prompts/PromptGenerator.jsx`. If you touch prompt rendering/generation, this token format is the contract.

## Conventions worth knowing

- Formatting is enforced by Prettier (`.prettierrc`: 120 col width, semicolons, trailing commas `es-5`) and ESLint (`eslint.config.js`); `yarn lint` runs both and auto-fixes.
- API client wrappers (`src/lib/*Client.js`) should stay thin/Promise-based and endpoint-shaped — no UI logic, no cross-resource orchestration.
- Only GET responses may be cached in `gasApi.js`'s cache layer (currently disabled via `isCacheEnabled = false`); mutation responses must never be cached.
- `.github/instructions/*.md` and `.github/agents/*.md` contain Copilot-targeted guidance that overlaps with `AGENTS.md` (API/store review boundaries, migration refactor order, a migration-reviewer and ui-ux-designer agent persona) — consistent with, not contradictory to, `AGENTS.md`.
