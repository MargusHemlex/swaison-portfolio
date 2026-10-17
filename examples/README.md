# Synthetic journeys

Use the prefilled interface values. No real identity information or files are needed.

## Individual

1. Select Individual and the Applicant role. Create the prefilled application.
2. Try `000000` to see rejected verification; then use `424242`.
3. Attach the synthetic identity and address checklist items.
4. Submit, switch to Reviewer, enter an example note and request changes.
5. Switch to Applicant, remove and reattach a checklist item, then resubmit.
6. Switch to Reviewer and approve. Editing is now locked.

## Business

1. Select Business and Applicant. Create Northstar Example OÜ / SYN-1001.
2. Save the supplied registration and operating addresses.
3. Add Alex Sample / alex@example.test as a signatory.
4. Attach incorporation and address checklist items and submit.
5. Switch to Reviewer, inspect addresses, signatory and checklist, and approve.

The reviewer role is explicitly selectable, not a login. Reset clears both applications
in this browser workspace after confirmation. Separate browser profiles have isolated
state; ordinary tabs in the same browser share the workspace.

`commands.json` contains authored API command examples. Its revisions assume a fresh
workspace and consecutive successful commands. These are not production captures.
