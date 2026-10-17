# Contributing

Use Node.js 22.12+ and `npm ci`. Keep source comments and documentation in English.
Run `npm run check` and `npm run test:e2e` before proposing changes. Format with
`npm run format` and verify formatting with `npm run format:check`.

Keep the application example-only. Use authored synthetic records, validate commands
at the API boundary and test meaningful invalid transitions as well as complete flows.
Do not add real documents, identities, credentials, private packages, deployment
settings or production integrations. Do not represent the example role switch as
real authentication or the example review as a compliance determination.

Describe the behavior changed, relevant tests and limits in each pull request.
Repository publication requires the owner's explicit final decision.
