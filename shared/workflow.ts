import {
  VERIFICATION_CODE,
  type Command,
  type Kind,
  type Role,
  type Workspace,
} from "./contracts";

export class WorkflowError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 409,
  ) {
    super(message);
  }
}
export const emptyWorkspace = (revision = 0): Workspace => ({
  source: "synthetic",
  revision,
  individual: null,
  company: null,
  events: [],
});
function fail(code: string, message: string, status = 409): never {
  throw new WorkflowError(code, message, status);
}
function application(state: Workspace, kind: Kind) {
  return (
    state[kind] ?? fail("not-found", "Create this application first.", 404)
  );
}
function editable(state: Workspace, kind: Kind) {
  const item = application(state, kind);
  if (!["draft", "changes-requested"].includes(item.status))
    fail(
      "invalid-transition",
      "This application cannot be edited in its current state.",
    );
  return item;
}

// A failed command never mutates the caller's state. The HTTP layer commits only a successful result.
export function applyCommand(
  current: Workspace,
  command: Command,
  role: Role,
): Workspace {
  if (command.type === "review" && role !== "reviewer")
    fail(
      "role-required",
      "Choose the example reviewer role for review actions.",
      403,
    );
  if (
    command.type !== "review" &&
    command.type !== "reset" &&
    role !== "applicant"
  )
    fail(
      "role-required",
      "Choose the example applicant role for this action.",
      403,
    );
  if (current.events.length >= 200 && command.type !== "reset")
    fail(
      "workspace-limit",
      "Reset this example workspace before continuing.",
      429,
    );
  const state =
    command.type === "reset"
      ? emptyWorkspace(current.revision)
      : structuredClone(current);
  let detail: string = command.type;
  switch (command.type) {
    case "register-individual":
      if (state.individual)
        fail(
          "already-exists",
          "Reset the workspace to register another individual.",
        );
      state.individual = {
        id: "individual-001",
        person: command.person,
        status: "awaiting-verification",
        documents: [],
        reviewNote: null,
      };
      detail = "Individual application created";
      break;
    case "verify-individual": {
      const item = application(state, "individual");
      if (item.status !== "awaiting-verification")
        fail(
          "invalid-transition",
          "Verification is only available before the draft stage.",
        );
      if (command.code !== VERIFICATION_CODE)
        fail(
          "invalid-code",
          "Use the synthetic verification code shown in the workspace.",
          422,
        );
      item.status = "draft";
      detail = "Synthetic verification completed";
      break;
    }
    case "register-company":
      if (state.company)
        fail(
          "already-exists",
          "Reset the workspace to register another company.",
        );
      state.company = {
        id: "company-001",
        name: command.name,
        registrationCode: command.registrationCode,
        registration: null,
        operating: null,
        signatories: [],
        status: "draft",
        documents: [],
        reviewNote: null,
      };
      detail = "Company application created";
      break;
    case "set-addresses":
      editable(state, "company");
      state.company!.registration = command.registration;
      state.company!.operating = command.operating;
      detail = "Registration and operating addresses saved";
      break;
    case "add-signatory": {
      editable(state, "company");
      const company = state.company!;
      if (company.signatories.length >= 3)
        fail(
          "signatory-limit",
          "This example supports at most three signatories.",
          422,
        );
      if (
        company.signatories.some(
          (p) => p.email.toLowerCase() === command.person.email.toLowerCase(),
        )
      )
        fail("duplicate-signatory", "This signatory is already listed.", 422);
      company.signatories.push(command.person);
      detail = "Synthetic signatory added";
      break;
    }
    case "attach-document": {
      const item = editable(state, command.kind);
      const allowed =
        command.kind === "individual"
          ? ["identity", "address"]
          : ["incorporation", "address"];
      if (!allowed.includes(command.document))
        fail(
          "invalid-document",
          "This document type does not belong to this application.",
          422,
        );
      if (item.documents.some((d) => d.type === command.document))
        fail(
          "duplicate-document",
          "This checklist item is already attached.",
          422,
        );
      item.documents.push({
        type: command.document,
        filename: `synthetic-${command.document}.pdf`,
        source: "synthetic",
      });
      detail = `Synthetic ${command.document} checklist item attached`;
      break;
    }
    case "remove-document": {
      const item = editable(state, command.kind);
      if (!item.documents.some((doc) => doc.type === command.document))
        fail("not-found", "This checklist item is not attached.", 404);
      item.documents = item.documents.filter(
        (doc) => doc.type !== command.document,
      );
      detail = `Synthetic ${command.document} checklist item removed`;
      break;
    }
    case "submit": {
      const item = editable(state, command.kind);
      const required =
        command.kind === "individual"
          ? ["identity", "address"]
          : ["incorporation", "address"];
      if (
        !required.every((type) =>
          item.documents.some((doc) => doc.type === type),
        )
      )
        fail(
          "incomplete-checklist",
          "Complete the synthetic document checklist before submitting.",
          422,
        );
      if (command.kind === "company") {
        const company = state.company!;
        if (
          !company.registration ||
          !company.operating ||
          !company.signatories.length
        )
          fail(
            "incomplete-company",
            "Add both addresses and at least one signatory.",
            422,
          );
      }
      item.status = "submitted";
      item.reviewNote = null;
      detail = "Application submitted for example review";
      break;
    }
    case "review": {
      const item = application(state, command.kind);
      if (item.status !== "submitted")
        fail(
          "invalid-transition",
          "Only a submitted application can be reviewed.",
        );
      item.status =
        command.decision === "approve" ? "approved" : "changes-requested";
      item.reviewNote = command.note;
      detail =
        command.decision === "approve"
          ? "Example reviewer approved application"
          : "Example reviewer requested changes";
      break;
    }
    case "reset":
      detail = "Example workspace reset";
      break;
  }
  state.revision += 1;
  state.events.push({
    sequence: state.revision,
    role,
    action: command.type,
    detail,
  });
  return state;
}
