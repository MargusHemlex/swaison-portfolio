# Verification

The checked-in test suite exercises behavior, rather than claiming regulatory or
production readiness.

- Domain tests: individual verification, wrong code, corporate prerequisites,
  duplicate signatories/documents, locked states, requested changes, resubmission,
  approval, missing records, role rules, atomic rejection, reset and state limits.
- HTTP integration: real loopback server, cookie properties, independent workspaces,
  stale revisions, request schema, Origin/Host restrictions, body/content-type limits,
  absence of upload routing and expiry with an injected clock.
- Playwright: complete individual and corporate journeys against the built client
  and actual local API, requested changes and checklist correction, browser context
  isolation, reset and a mobile viewport check. The individual flow also checks for
  JavaScript errors and external requests.
- Publication check: tracked files and reachable Git history for prohibited file
  types, common secret patterns and a small dependency allowlist. This is limited
  pattern matching, not a complete secret scanner or security audit.
- CI: clean npm installation, lint, types/build, domain/HTTP tests, dependency audit,
  Chromium journeys and publication check.

No production application, original database, real identity, external provider,
email delivery, hosting configuration or production migration is tested. No
accessibility certification, compliance assessment, exhaustive security review or
performance benchmark is claimed.

To reproduce the screenshot, build and run `UPDATE_SCREENSHOT=1 npm run test:e2e`.
The initial application screen is captured from the actual local browser session.
