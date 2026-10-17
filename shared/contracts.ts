import { z } from "zod";

export const roleSchema = z.enum(["applicant", "reviewer"]);
export type Role = z.infer<typeof roleSchema>;
export const kindSchema = z.enum(["individual", "company"]);
export type Kind = z.infer<typeof kindSchema>;
const shortText = z.string().trim().min(2).max(100);
const email = z
  .email()
  .max(120)
  .refine(
    (value) => value.endsWith("@example.test"),
    "Use an @example.test address for synthetic data.",
  );
export const personSchema = z.strictObject({
  firstName: shortText,
  lastName: shortText,
  email,
});
export const addressSchema = z.strictObject({
  street: shortText,
  city: shortText,
  country: z.enum(["EE", "LV", "LT"]),
});
const commandSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("register-individual"),
    person: personSchema,
  }),
  z.strictObject({
    type: z.literal("verify-individual"),
    code: z.string().regex(/^\d{6}$/),
  }),
  z.strictObject({
    type: z.literal("register-company"),
    name: shortText,
    registrationCode: z.string().regex(/^SYN-\d{4}$/),
  }),
  z.strictObject({
    type: z.literal("set-addresses"),
    registration: addressSchema,
    operating: addressSchema,
  }),
  z.strictObject({ type: z.literal("add-signatory"), person: personSchema }),
  z.strictObject({
    type: z.literal("attach-document"),
    kind: kindSchema,
    document: z.enum(["identity", "address", "incorporation"]),
  }),
  z.strictObject({
    type: z.literal("remove-document"),
    kind: kindSchema,
    document: z.enum(["identity", "address", "incorporation"]),
  }),
  z.strictObject({ type: z.literal("submit"), kind: kindSchema }),
  z.strictObject({
    type: z.literal("review"),
    kind: kindSchema,
    decision: z.enum(["approve", "request-changes"]),
    note: z.string().trim().min(5).max(500),
  }),
  z.strictObject({ type: z.literal("reset") }),
]);
export const envelopeSchema = z.strictObject({
  expectedRevision: z.number().int().nonnegative(),
  command: commandSchema,
});
export type Command = z.infer<typeof commandSchema>;
export type Person = z.infer<typeof personSchema>;
export type Address = z.infer<typeof addressSchema>;
export type Status =
  | "awaiting-verification"
  | "draft"
  | "submitted"
  | "changes-requested"
  | "approved";
export interface DocumentRecord {
  type: "identity" | "address" | "incorporation";
  filename: string;
  source: "synthetic";
}
interface ApplicationBase {
  id: string;
  status: Status;
  documents: DocumentRecord[];
  reviewNote: string | null;
}
export interface Individual extends ApplicationBase {
  person: Person;
}
export interface Company extends ApplicationBase {
  name: string;
  registrationCode: string;
  registration: Address | null;
  operating: Address | null;
  signatories: Person[];
}
export interface AuditEvent {
  sequence: number;
  role: Role;
  action: Command["type"];
  detail: string;
}
export interface Workspace {
  source: "synthetic";
  revision: number;
  individual: Individual | null;
  company: Company | null;
  events: AuditEvent[];
}
export const VERIFICATION_CODE = "424242";
export const statusLabel: Record<Status, string> = {
  "awaiting-verification": "Awaiting verification",
  draft: "Draft",
  submitted: "Awaiting review",
  "changes-requested": "Changes requested",
  approved: "Approved",
};
