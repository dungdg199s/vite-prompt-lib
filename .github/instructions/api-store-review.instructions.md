---
description: "Use when editing src/lib or src/stores to verify API contracts, store ownership, and data-flow boundaries before changing UI in this repo."
applyTo: "src/lib/**/*.js,src/lib/**/*.jsx,src/stores/**/*.js,src/stores/**/*.jsx"
---

# API And Store Review Guidance

- Check the contract closest to the source first: transport in [src/lib/gasApi.js](src/lib/gasApi.js), endpoint mapping in [src/lib/workspacesClient.js](src/lib/workspacesClient.js), then store ownership in [src/stores/workspaceStore.js](src/stores/workspaceStore.js).
- Keep transport concerns inside [src/lib/gasApi.js](src/lib/gasApi.js). Do not spread invoke format, cache behavior, or Apps Script fallback logic across resource clients.
- Keep resource clients thin and endpoint-shaped. Avoid UI-specific branching, view formatting, or cross-resource orchestration inside [src/lib](src/lib).
- When changing a client method, verify the matching backend route and payload shape in [appscripts/AppRouters.js](appscripts/AppRouters.js) and [appscripts/\_GasServer.js](appscripts/_GasServer.js) before updating callers.
- Preserve the GET-only caching rule in [src/lib/gasApi.js](src/lib/gasApi.js). Mutation responses must not be cached.
- Store owns shared record data, loading state, error state, and cross-screen selection. Do not move local form fields or temporary modal input into Zustand unless multiple unrelated branches need the same draft state.
- Before adding a new store field, check whether the value is server-backed shared data, cross-route UI state, or only local component state. Prefer the smallest owner that fits.
- Reuse existing async action patterns in [src/stores/workspaceStore.js](src/stores/workspaceStore.js): set loading, clear scoped error key, call client, merge normalized record data, then emit toast or error handling consistently.
- If a UI change depends on reshaping server data, perform the normalization once in the store or a dedicated helper instead of repeating it across components.
- Avoid introducing a second source of truth. If a resource already lives in store, components and hooks should select from store rather than fetch the same data independently.
- When store and UI disagree, fix ownership or contract boundaries first instead of adding synchronization effects to hide the mismatch.
