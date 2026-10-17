import express from "express";
import { randomBytes } from "node:crypto";
import {
  envelopeSchema,
  roleSchema,
  type Workspace,
} from "../shared/contracts";
import {
  applyCommand,
  emptyWorkspace,
  WorkflowError,
} from "../shared/workflow";

const TTL_MS = 60 * 60 * 1000;
const MAX_SESSIONS = 128;
interface Session {
  state: Workspace;
  touched: number;
}
export function createApi(options: { now?: () => number } = {}) {
  const app = express();
  const now = options.now ?? Date.now;
  const sessions = new Map<string, Session>();
  app.disable("x-powered-by");
  app.use("/api", (req, res, next) => {
    res.set({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.get("host") ?? "")) {
      res.status(403).json({
        error: { code: "host-rejected", message: "Use a loopback address." },
      });
      return;
    }
    // Loopback-only server, plus a same-origin check on every mutation. No CORS middleware.
    if (req.method !== "GET") {
      const origin = req.get("origin");
      if (origin && origin !== `http://${req.get("host")}`) {
        res.status(403).json({
          error: {
            code: "origin-rejected",
            message: "Use this local workspace origin.",
          },
        });
        return;
      }
      if (!req.is("application/json")) {
        res.status(415).json({
          error: { code: "content-type", message: "Send application/json." },
        });
        return;
      }
    }
    next();
  });
  app.use("/api", express.json({ limit: "16kb", strict: true }));
  app.use("/api", (req, res, next) => {
    for (const [id, session] of sessions)
      if (now() - session.touched >= TTL_MS) sessions.delete(id);
    const cookie = req
      .get("cookie")
      ?.match(/(?:^|;\s*)swaison_workspace=([a-f0-9]{48})(?:;|$)/)?.[1];
    let session = cookie ? sessions.get(cookie) : undefined;
    if (!session) {
      if (sessions.size >= MAX_SESSIONS) {
        res.status(503).json({
          error: {
            code: "workspace-capacity",
            message:
              "Local example workspace capacity reached. Try again after inactive workspaces expire.",
          },
        });
        return;
      }
      const id = randomBytes(24).toString("hex");
      session = { state: emptyWorkspace(), touched: now() };
      sessions.set(id, session);
      res.cookie("swaison_workspace", id, {
        httpOnly: true,
        sameSite: "strict",
        path: "/api",
        maxAge: TTL_MS,
      });
    }
    session.touched = now();
    res.locals.session = session;
    next();
  });
  app.get("/api/workspace", (_req, res) =>
    res.json({ workspace: (res.locals.session as Session).state }),
  );
  app.post("/api/commands", (req, res) => {
    const parsed = envelopeSchema.safeParse(req.body);
    const role = roleSchema.safeParse(req.get("x-example-role"));
    if (!parsed.success || !role.success) {
      res.status(400).json({
        error: {
          code: "invalid-request",
          message: "Check the command fields and example role.",
        },
      });
      return;
    }
    const session = res.locals.session as Session;
    if (parsed.data.expectedRevision !== session.state.revision) {
      res.status(409).json({
        error: {
          code: "revision-conflict",
          message: "The workspace changed. Refresh it before retrying.",
        },
      });
      return;
    }
    try {
      session.state = applyCommand(
        session.state,
        parsed.data.command,
        role.data,
      );
      res.json({ workspace: session.state });
    } catch (error) {
      if (!(error instanceof WorkflowError)) throw error;
      res
        .status(error.status)
        .json({ error: { code: error.code, message: error.message } });
    }
  });
  app.use("/api", (_req, res) => {
    res.status(404).json({
      error: { code: "not-found", message: "Unknown example API route." },
    });
  });
  app.use(
    (
      error: { type?: string },
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const tooLarge = error.type === "entity.too.large";
      const malformed = error.type === "entity.parse.failed";
      res.status(tooLarge ? 413 : malformed ? 400 : 500).json({
        error: {
          code: tooLarge ? "body-too-large" : "request-failed",
          message: tooLarge
            ? "Request body exceeds 16 KiB."
            : "The request could not be processed.",
        },
      });
    },
  );
  return app;
}
