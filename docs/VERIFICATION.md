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
  isolation and reset on the desktop viewport. The individual flow also checks for
  JavaScript errors and external requests.
- Mobile smoke check: at a 390 × 844 viewport, the initial individual-registration
  button is visible and the page has no horizontal overflow. This does not test
  completion of either onboarding journey on mobile or establish full responsive
  usability.
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

The [five-minute README review](../README.md#five-minute-review) follows the tested
desktop individual journey: invalid/valid verification, checklist attachment,
submission, requested changes, checklist correction, resubmission and approval.
Expected state names are defined in `shared/contracts.ts` and enforced by
`shared/workflow.ts`; `tests/workflow.test.ts`, `tests/api.test.ts` and
`e2e/onboarding.spec.ts` exercise the domain, HTTP and browser boundaries respectively.
