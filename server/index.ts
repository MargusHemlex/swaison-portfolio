import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createApi } from "./app";

const app = createApi();
const port = Number(process.env.PORT ?? "3108");
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("PORT must be between 1024 and 65535.");
if (process.argv.includes("--dev")) {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const dist = fileURLToPath(new URL("../dist/", import.meta.url));
  app.use(express.static(dist));
  app.get("/", (_req, res) => {
    res.sendFile(path.join(dist, "index.html"));
  });
}
const server = app.listen(port, "127.0.0.1", () =>
  console.log(`Swaison synthetic workspace: http://127.0.0.1:${port}`),
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => server.close(() => process.exit(0)));
