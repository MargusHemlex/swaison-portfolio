import assert from "node:assert/strict";
import { test } from "node:test";
import {
  envelopeSchema,
  type Command,
  type Workspace,
} from "../shared/contracts";
import {
  applyCommand,
  emptyWorkspace,
  WorkflowError,
} from "../shared/workflow";
const person = {
  firstName: "Robin",
  lastName: "Sample",
  email: "robin@example.test",
};
const address = {
  street: "12 Example Street",
  city: "Tallinn",
  country: "EE" as const,
};
const register: Command = { type: "register-individual", person };
function rejected(
  state: Workspace,
  command: Command,
  code: string,
  role: "applicant" | "reviewer" = "applicant",
) {
  const before = structuredClone(state);
  assert.throws(
    () => applyCommand(state, command, role),
    (error: unknown) => error instanceof WorkflowError && error.code === code,
  );
  assert.deepEqual(state, before, "rejected commands are atomic");
}
function readyIndividual() {
  let state = applyCommand(emptyWorkspace(), register, "applicant");
  for (const command of [
    { type: "verify-individual", code: "424242" },
    { type: "attach-document", kind: "individual", document: "identity" },
    { type: "attach-document", kind: "individual", document: "address" },
  ] satisfies Command[])
    state = applyCommand(state, command, "applicant");
  return state;
}
test("individual verification, submission, changes, resubmission and approval", () => {
  const created = applyCommand(emptyWorkspace(), register, "applicant");
  rejected(
    created,
    { type: "verify-individual", code: "000000" },
    "invalid-code",
  );
  rejected(
    created,
    { type: "attach-document", kind: "individual", document: "identity" },
    "invalid-transition",
  );
  let state = readyIndividual();
  state = applyCommand(
    state,
    { type: "submit", kind: "individual" },
    "applicant",
  );
  rejected(state, { type: "submit", kind: "individual" }, "invalid-transition");
  rejected(
    state,
    {
      type: "review",
      kind: "individual",
      decision: "approve",
      note: "Example complete",
    },
    "role-required",
  );
  state = applyCommand(
    state,
    {
      type: "review",
      kind: "individual",
      decision: "request-changes",
      note: "Please revisit your synthetic checklist.",
    },
    "reviewer",
  );
  assert.equal(state.individual?.status, "changes-requested");
  state = applyCommand(
    state,
    { type: "submit", kind: "individual" },
    "applicant",
  );
  assert.equal(state.individual?.reviewNote, null);
  state = applyCommand(
    state,
    {
      type: "review",
      kind: "individual",
      decision: "approve",
      note: "Example complete",
    },
    "reviewer",
  );
  assert.equal(state.individual?.status, "approved");
  assert.equal(state.events.at(-1)?.sequence, state.revision);
  rejected(state, { type: "submit", kind: "individual" }, "invalid-transition");
});
test("corporate prerequisites, duplicate signatories, document types and locked review state", () => {
  let state = applyCommand(
    emptyWorkspace(),
    {
      type: "register-company",
      name: "Example Company",
      registrationCode: "SYN-1001",
    },
    "applicant",
  );
  rejected(state, { type: "submit", kind: "company" }, "incomplete-checklist");
  rejected(
    state,
    { type: "attach-document", kind: "company", document: "identity" },
    "invalid-document",
  );
  for (const document of ["incorporation", "address"] as const)
    state = applyCommand(
      state,
      { type: "attach-document", kind: "company", document },
      "applicant",
    );
  rejected(state, { type: "submit", kind: "company" }, "incomplete-company");
  state = applyCommand(
    state,
    { type: "set-addresses", registration: address, operating: address },
    "applicant",
  );
  state = applyCommand(state, { type: "add-signatory", person }, "applicant");
  rejected(
    state,
    {
      type: "add-signatory",
      person: { ...person, email: "ROBIN@example.test" },
    },
    "duplicate-signatory",
  );
  state = applyCommand(state, { type: "submit", kind: "company" }, "applicant");
  rejected(
    state,
    { type: "set-addresses", registration: address, operating: address },
    "invalid-transition",
  );
  state = applyCommand(
    state,
    {
      type: "review",
      kind: "company",
      decision: "approve",
      note: "Synthetic company complete",
    },
    "reviewer",
  );
  assert.equal(state.company?.status, "approved");
});
test("missing records, premature review, duplicate documents and wrong-role edits fail", () => {
  rejected(
    emptyWorkspace(),
    { type: "verify-individual", code: "424242" },
    "not-found",
  );
  rejected(emptyWorkspace(), register, "role-required", "reviewer");
  const ready = readyIndividual();
  rejected(
    ready,
    {
      type: "review",
      kind: "individual",
      decision: "approve",
      note: "Example complete",
    },
    "invalid-transition",
    "reviewer",
  );
  rejected(
    ready,
    { type: "attach-document", kind: "individual", document: "address" },
    "duplicate-document",
  );
  rejected(ready, register, "already-exists");
});
test("reset clears application data and events while advancing the concurrency revision", () => {
  const original = readyIndividual();
  const reset = applyCommand(original, { type: "reset" }, "reviewer");
  assert.equal(reset.individual, null);
  assert.equal(reset.company, null);
  assert.equal(reset.revision, original.revision + 1);
  assert.equal(reset.events.length, 1);
  assert.equal(reset.events[0].action, "reset");
  assert.ok(original.individual);
});
test("contracts reject unknown fields, real email domains, unbounded inputs and invented actions", () => {
  for (const command of [
    { ...register, person: { ...person, email: "person@gmail.com" } },
    { ...register, person: { ...person, firstName: "x".repeat(101) } },
    { ...register, person: { ...person, password: "not-accepted" } },
    { type: "upload", bytes: "anything" },
    { type: "register-company", name: "Example", registrationCode: "12345678" },
    { type: "reset", extra: true },
  ])
    assert.equal(
      envelopeSchema.safeParse({ expectedRevision: 0, command }).success,
      false,
    );
  assert.equal(
    envelopeSchema.safeParse({ expectedRevision: 0, command: register })
      .success,
    true,
  );
});
test("workspace action and signatory limits bound in-memory examples", () => {
  const state = readyIndividual();
  state.events = Array.from({ length: 200 }, (_, i) => ({
    sequence: i,
    role: "applicant",
    action: "reset",
    detail: "Example",
  }));
  rejected(state, { type: "submit", kind: "individual" }, "workspace-limit");
  assert.equal(
    applyCommand(state, { type: "reset" }, "applicant").events.length,
    1,
  );
  let company = applyCommand(
    emptyWorkspace(),
    {
      type: "register-company",
      name: "Example Company",
      registrationCode: "SYN-1001",
    },
    "applicant",
  );
  for (let i = 0; i < 3; i++)
    company = applyCommand(
      company,
      {
        type: "add-signatory",
        person: { ...person, email: `person${i}@example.test` },
      },
      "applicant",
    );
  rejected(company, { type: "add-signatory", person }, "signatory-limit");
});

test("authored API examples form a valid reproducible journey", async () => {
  const { readFile } = await import("node:fs/promises");
  const examples = JSON.parse(
    await readFile(
      new URL("../examples/commands.json", import.meta.url),
      "utf8",
    ),
  ) as unknown[];
  let state = emptyWorkspace();
  for (const raw of examples) {
    const envelope = envelopeSchema.parse(raw);
    assert.equal(envelope.expectedRevision, state.revision);
    state = applyCommand(
      state,
      envelope.command,
      envelope.command.type === "review" ? "reviewer" : "applicant",
    );
  }
  assert.equal(state.individual?.status, "approved");
});

test("removing a checklist item reopens prerequisites without altering other items", () => {
  const ready = readyIndividual();
  const changed = applyCommand(
    ready,
    { type: "remove-document", kind: "individual", document: "identity" },
    "applicant",
  );
  assert.equal(changed.individual?.documents.length, 1);
  assert.equal(ready.individual?.documents.length, 2);
  rejected(
    changed,
    { type: "submit", kind: "individual" },
    "incomplete-checklist",
  );
  rejected(
    changed,
    { type: "remove-document", kind: "individual", document: "identity" },
    "not-found",
  );
});
