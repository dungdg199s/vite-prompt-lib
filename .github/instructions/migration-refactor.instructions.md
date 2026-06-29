---
description: "Use when migrating old code, refactoring for readability/maintainability, or changing API, store, and UI boundaries in this repo."
applyTo: "src/**/*.js,src/**/*.jsx,appscripts/**/*.js"
---

# Migration Refactor Guidance

- Follow the migration order: API call layer first, then store/state ownership, then UI.
- Do not patch UI around a data-flow problem that belongs in the API client or store.
- Route-driven screens must follow the structure in [src/App.jsx](src/App.jsx). Prefer router params and navigation helpers over passing navigation intent through several components.
- Record data belongs in store. Only shared state should move into Zustand; form data and temporary modal input should remain local unless multiple unrelated branches need it.
- Avoid passing params through many component layers. Prefer store selectors, route params, or a focused hook close to the consuming area.
- If a component or module is getting long because it handles multiple concerns, split it by responsibility before adding more logic.
- Prefer small focused components with one job: detail view, edit modal, delete modal, list item, or data hook.
- Keep resource clients in [src/lib/workspacesClient.js](src/lib/workspacesClient.js) thin and endpoint-shaped. Keep transport details in [src/lib/gasApi.js](src/lib/gasApi.js).
- When changing backend routes or payloads, verify the contract in [appscripts/AppRouters.js](appscripts/AppRouters.js) and [appscripts/_GasServer.js](appscripts/_GasServer.js) before updating UI code.
- Reuse existing store update pathways in [src/stores](src/stores) instead of introducing a second source of truth.