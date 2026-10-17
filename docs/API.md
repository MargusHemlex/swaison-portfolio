# Example API

Run the local server before using these endpoints. Every response is `no-store`.
`GET /api/workspace` sets a workspace cookie if needed and returns `{ workspace }`.
`workspace.source` is always `synthetic`.

`POST /api/commands` requires `Content-Type: application/json`, the workspace
cookie and `X-Example-Role: applicant` or `reviewer`.

```json
{
  "expectedRevision": 0,
  "command": {
    "type": "register-individual",
    "person": {
      "firstName": "Robin",
      "lastName": "Sample",
      "email": "robin@example.test"
    }
  }
}
```

Success returns the complete `{ workspace }`, with its revision incremented by one.
Send that revision with the next command. Unknown fields are rejected at every
request-object level. Commands are defined in `shared/contracts.ts`.

| Command                           | Required command fields beyond `type`                     | Example role |
| --------------------------------- | --------------------------------------------------------- | ------------ |
| register-individual               | person: firstName, lastName, email                        | applicant    |
| verify-individual                 | code: six digits; synthetic code 424242                   | applicant    |
| register-company                  | name, registrationCode: SYN- followed by four digits      | applicant    |
| set-addresses                     | registration, operating: street, city, country (EE/LV/LT) | applicant    |
| add-signatory                     | person                                                    | applicant    |
| attach-document / remove-document | kind, document                                            | applicant    |
| submit                            | kind                                                      | applicant    |
| review                            | kind, decision: approve/request-changes, note             | reviewer     |
| reset                             | no extra fields                                           | either       |

`kind` is `individual` or `company`. Document identifiers are `identity`, `address`,
`incorporation`; only the applicable two are accepted for each application.
Names, street/city and company names have 2–100 characters, synthetic email at most
120 characters, notes 5–500 characters. A company permits three distinct signatories.

## Errors

Errors return `{ "error": { "code": "...", "message": "..." } }` without a
stack trace, submitted body or raw exception. Failed commands do not advance state.

| Status | Meaning                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------- |
| 400    | Invalid JSON, request shape or example role                                                    |
| 403    | Wrong example role, nonlocal Host or foreign Origin                                            |
| 404    | Missing application/checklist item or unknown API route                                        |
| 409    | Stale revision, invalid transition or existing application                                     |
| 413    | JSON body exceeds 16 KiB                                                                       |
| 415    | Content type is not JSON                                                                       |
| 422    | Wrong synthetic code, incomplete application, duplicate item or capacity within an application |
| 429    | Workspace event limit reached; reset it                                                        |
| 503    | Server workspace capacity reached; inactive sessions expire                                    |

The role header is not authentication. There are no real login, upload, email or
provider endpoints. This API is deliberately local and example-only.
