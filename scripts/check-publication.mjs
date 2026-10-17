import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Deliberately limited; prints paths and pattern names, never matching values.
const patterns = {
  private_key: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  provider_key: /\bsk-(?:ant-|proj-)[A-Za-z0-9_-]{24,}\b/,
  github_token: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  storage_key: /AccountKey=[A-Za-z0-9+/]{40,}={0,2}/,
  password_url: /(?:postgres(?:ql)?|mysql):\/\/[^\s/:]+:[^\s@]+@/,
};
const git = (...args) => execFileSync("git", args, { maxBuffer: 20_000_000 });
let failed = false;
function check(name, data) {
  if (/(^|\/)\.env|\.(pem|pfx|p12|key|docx?|pdf|csproj|dll)$/i.test(name)) {
    console.error(`prohibited_file:${name}`);
    failed = true;
  }
  for (const [code, pattern] of Object.entries(patterns))
    if (pattern.test(data)) {
      console.error(`${code}:${name}`);
      failed = true;
    }
}
for (const name of git("ls-files", "-z").toString().split("\0").filter(Boolean))
  check(name, readFileSync(name).toString());
const seen = new Set();
for (const commit of git("rev-list", "--all")
  .toString()
  .trim()
  .split("\n")
  .filter(Boolean)) {
  for (const entry of git("ls-tree", "-rz", commit)
    .toString()
    .split("\0")
    .filter(Boolean)) {
    const [meta, name] = entry.split("\t");
    const [, type, oid] = meta.split(" ");
    if (type !== "blob" || seen.has(`${oid}:${name}`)) continue;
    seen.add(`${oid}:${name}`);
    check(name, git("cat-file", "blob", oid).toString());
  }
}
const manifest = JSON.parse(readFileSync("package.json", "utf8"));
const allowed = new Set(["express", "vue", "zod"]);
for (const dependency of Object.keys(manifest.dependencies))
  if (!allowed.has(dependency)) {
    console.error(`unexpected_runtime_dependency:${dependency}`);
    failed = true;
  }
console.log(failed ? "publication_check_failed" : "publication_check_passed");
process.exitCode = failed ? 1 : 0;
