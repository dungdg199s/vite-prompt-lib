---
name: "Migration Review"
description: "Run a migration-focused maintainability review on a file, route, store, API client, or feature in this repo."
argument-hint: "Target file, route, store, API client, or feature to review"
agent: "Migration Reviewer"
---

Review the target supplied by the user for migration-safe maintainability issues in this repository.

Use this workflow:

1. Determine the owning layer first in this order: API call layer, then store/state ownership, then UI composition.
2. Identify the narrowest file or function where responsibilities are mixed or the file has become too large.
3. Report findings ordered by severity with concrete file references.
4. Propose only the smallest safe splits or extractions that improve readability and ownership boundaries.
5. Keep route contracts, backend endpoint contracts, and current behavior stable unless the target explicitly requires change.
6. End with the narrowest validation step to run next.

Required output:

- Findings
- Safe split suggestions
- Boundary notes for API, store, and UI ownership
- Validation

Repository-specific rules:

- Navigation should remain router-driven and aligned with [src/App.jsx](src/App.jsx).
- Shared record data belongs in Zustand under [src/stores](src/stores).
- Thin endpoint-shaped client methods belong in [src/lib/workspacesClient.js](src/lib/workspacesClient.js), while transport concerns stay in [src/lib/gasApi.js](src/lib/gasApi.js).
- If backend route or payload shape is involved, verify against [appscripts/AppRouters.js](appscripts/AppRouters.js) and [appscripts/_GasServer.js](appscripts/_GasServer.js).