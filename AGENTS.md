# AGENTS

Purpose: help coding agents become productive quickly in this repository.

## Scope

- This repo contains a React + Vite frontend and a Google Apps Script backend bundle.
- The codebase is being migrated from older flows; optimize and simplify in this order: API call layer, then store/state layer, then UI.
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
- App shell layout and sidebar/tabs: [src/AppLayout.jsx](src/AppLayout.jsx), [src/AppSideBar.jsx](src/AppSideBar.jsx), [src/AppNavTabs.jsx](src/AppNavTabs.jsx)
- Pages: [src/pages](src/pages)
- Domain components: [src/components](src/components)
- API bridge and resource clients: [src/lib/gasApi.js](src/lib/gasApi.js), [src/lib/workspacesClient.js](src/lib/workspacesClient.js)
- Contexts: [src/contexts](src/contexts)
- Hooks: [src/hooks](src/hooks)
- Zustand stores: [src/stores](src/stores)
- State tree utilities: [src/state](src/state)
- GAS backend source: [appscripts](appscripts)
- GAS router/runtime entry: [appscripts/_GasServer.js](appscripts/_GasServer.js), [appscripts/Code.js](appscripts/Code.js)
- GAS route definitions: [appscripts/AppRouters.js](appscripts/AppRouters.js)
- Data access and document helpers: [appscripts/_AppDatabase.js](appscripts/_AppDatabase.js), [appscripts/_DocumentService.js](appscripts/_DocumentService.js)
- E2E tests: [tests/phase-gates](tests/phase-gates)

## Architecture Notes

- Frontend navigation is router-driven. Screen changes should follow the route tree in [src/App.jsx](src/App.jsx); modal flows use `location.state.backgroundLocation` instead of ad hoc local toggles.
- Frontend calls [src/lib/gasApi.js](src/lib/gasApi.js), which bridges to Apps Script through `window.google.script.run.invoke(method, url, payload)`.
- Resource clients in [src/lib/workspacesClient.js](src/lib/workspacesClient.js) should stay thin and map directly to backend endpoints.
- Backend request routing is handled by [appscripts/_GasServer.js](appscripts/_GasServer.js) and route declarations in [appscripts/AppRouters.js](appscripts/AppRouters.js), including dynamic params like `/api/workspaces/:id`.
- Shared record data belongs in Zustand stores under [src/stores](src/stores). Local form state should stay inside the owning component or modal unless multiple screens truly share it.
- State tree helpers in [src/state/treeState.js](src/state/treeState.js) support UI state shaping; use them instead of inventing new parallel tree utilities.

## Migration Workflow

- For migration and cleanup, inspect and simplify in this order: API bridge/client, then store/state ownership, then UI composition.
- Start from the layer that owns behavior. If a UI issue is caused by store shape or API response handling, fix the lower layer first.
- Prefer extracting narrow hooks, helpers, or focused components over growing large files such as page containers or modal components.
- When a file mixes fetching, data normalization, routing, and rendering, split by responsibility instead of adding another conditional branch.
- Use the smallest shared state surface possible: record collections and cross-screen selection in store, transient form input in component state.

## Code Conventions

- Keep API client wrappers thin and Promise-based.
- Preserve existing path patterns for GAS routes and dynamic params.
- Follow existing component/domain folder boundaries.
- Navigation between screens should be expressed through router paths and navigation helpers, not custom cross-component event chains.
- Keep record data ownership in store. Only move state into store when it is shared across screens or unrelated branches.
- Avoid heavy prop drilling. Prefer route params, store selectors, or narrowly scoped context/hooks when data must cross multiple layers.
- Split overly long handlers, components, and modules before adding more behavior to them.
- Prefer focused edits over broad style churn.

## Critical Pitfalls

- Cache only GET responses in [src/lib/gasApi.js](src/lib/gasApi.js).
- Do not cache mutation responses (POST/PUT/DELETE); clear/invalidate relevant caches after mutations.
- Keep the method, URL, and payload contract aligned between [src/lib/gasApi.js](src/lib/gasApi.js) and [appscripts/_GasServer.js](appscripts/_GasServer.js).
- Ensure GAS route definitions include dynamic segments where clients call detail/update/delete endpoints.
- In e2e tests, avoid racey assertions around modals/dialogs; wait for UI state to settle after navigation or async list reload.
- Import styles are mixed across the codebase. Verify path aliases and existing relative imports before standardizing them inside a feature change.

## Testing Guidance

- For navigation and CRUD regressions, start with [tests/phase-gates/phase2.crud-navigation.spec.js](tests/phase-gates/phase2.crud-navigation.spec.js).
- For store migration behavior, use [tests/phase-gates/phase1.store-migration.spec.js](tests/phase-gates/phase1.store-migration.spec.js).
- For route-driven modal or detail changes, validate against [src/App.jsx](src/App.jsx) and run the narrowest affected phase-gate first.
- Prefer running the smallest relevant phase test before running full suite.

## Existing Docs

- Product/design behavior: [design.md](design.md)
- Setup/config scripts: [package.json](package.json)
- Vite baseline README: [README.md](README.md)
- Repo memory: [/memories/repo/apps-script-storage.md](/memories/repo/apps-script-storage.md)
- Repo memory: [/memories/repo/frontend-state-tree.md](/memories/repo/frontend-state-tree.md)

## Agent Behavior Checklist

- For migration tasks, read the owning layer first: [src/lib/gasApi.js](src/lib/gasApi.js) or [src/lib/workspacesClient.js](src/lib/workspacesClient.js) before store work, and store before UI composition.
- Confirm target area and read related files before editing.
- After edits, run the narrowest relevant lint/test command.
- Report changed files and behavioral impact.
- If blocked by missing runtime context (Apps Script environment, auth, or deployment IDs), explain the blocker and continue with best local validation.
