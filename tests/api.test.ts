import assert from "node:assert/strict";
import { get } from "node:http";
import { test } from "node:test";
import type { AddressInfo } from "node:net";
import type { Command, Workspace } from "../shared/contracts";
import { createApi } from "../server/app";

test("HTTP boundaries, workspace isolation, revisions, malformed requests and expiry", async () => {
  let now = 1_000;
  const server = createApi({ now: () => now }).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const register: Command = {
    type: "register-individual",
    person: {
      firstName: "Robin",
      lastName: "Sample",
      email: "robin@example.test",
    },
  };
  try {
    const initial = await fetch(`${base}/api/workspace`);
    assert.equal(initial.status, 200);
    assert.equal(initial.headers.get("cache-control"), "no-store");
    const setCookie = initial.headers.get("set-cookie")!;
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Strict/);
    const cookie = setCookie.split(";")[0];
    const command = (
      value: unknown,
      revision = 0,
      role = "applicant",
      extraHeaders = {},
    ) =>
      fetch(`${base}/api/commands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie,
          "X-Example-Role": role,
          ...extraHeaders,
        },
        body: JSON.stringify({ expectedRevision: revision, command: value }),
      });
    assert.equal(
      (
        await command(register, 0, "applicant", {
          Origin: "https://outside.invalid",
        })
      ).status,
      403,
    );
    const foreignHostStatus = await new Promise<number | undefined>(
      (resolve, reject) => {
        get(
          `${base}/api/workspace`,
          { headers: { Host: "outside.invalid" } },
          (response) => {
            response.resume();
            resolve(response.statusCode);
          },
        ).on("error", reject);
      },
    );
    assert.equal(foreignHostStatus, 403);
    assert.equal((await command(register, 0, "reviewer")).status, 403);
    const created = await command(register);
    assert.equal(created.status, 200);
    const state = (await created.json()).workspace as Workspace;
    assert.equal(state.individual?.id, "individual-001");
    assert.equal(
      (await command({ type: "reset" }, 0)).status,
      409,
      "stale revision cannot mutate state",
    );
    const second = await fetch(`${base}/api/workspace`);
    assert.equal(
      (await second.json()).workspace.individual,
      null,
      "separate cookies have isolated state",
    );
    assert.equal(
      (await command({ type: "verify-individual", code: "000000" }, 1)).status,
      422,
    );
    assert.equal(
      (await command({ type: "verify-individual", code: "424242" }, 1)).status,
      200,
    );
    assert.equal((await command({ type: "reset" }, 2, "invented")).status, 400);
    assert.equal(
      (await command({ type: "reset", extra: "rejected" }, 2)).status,
      400,
    );
    assert.equal(
      (
        await fetch(`${base}/api/commands`, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: "{}",
        })
      ).status,
      415,
    );
    assert.equal(
      (
        await fetch(`${base}/api/commands`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{",
        })
      ).status,
      400,
    );
    assert.equal(
      (await command({ type: "reset", oversized: "x".repeat(17_000) }, 2))
        .status,
      413,
    );
    assert.equal(
      (
        await fetch(`${base}/api/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        })
      ).status,
      404,
    );
    const persisted = await fetch(`${base}/api/workspace`, {
      headers: { cookie },
    });
    assert.equal((await persisted.json()).workspace.revision, 2);
    now += 60 * 60 * 1000;
    const expired = await fetch(`${base}/api/workspace`, {
      headers: { cookie },
    });
    assert.equal((await expired.json()).workspace.individual, null);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
