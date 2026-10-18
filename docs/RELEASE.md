# Publication checklist

The owner approved publication on **2026-10-18**, after the final review of
`eecf72457efad1f9d9c8a549a69692c2cab38cf7`. The portfolio edition is public;
the separate production repository remains private.
No deployment is connected to the private production application.

Before publication:

- Confirm the intended code scope, independent implementation and authorship description.
- Confirm that source, paths, dependency metadata, generated output and assets contain
  none of the excluded legacy vendor identifiers or branding.
- Review the full tracked inventory and reachable history for credentials, personal
  data, old documents, original assets and deployment configuration.
- Run `npm ci`, `npm run check`, `npm audit`, and the Playwright tests.
- Inspect the desktop screenshot and mobile page, and verify examples against the API.
- Confirm third-party dependency licenses and keep required notices intact.
- Confirm the original private repository and deployment are unchanged.
- Obtain the owner's final decision before changing repository visibility.

The automated checks support this review; they do not replace it. If this edition
is later hosted, plan authentication, retention, abuse limits and infrastructure
separately. Keep the existing production Git connection unchanged.
