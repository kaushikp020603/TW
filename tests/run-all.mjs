// Runs every end-to-end suite against a freshly started production server with its own empty database.
//   npm run build && node tests/run-all.mjs          (or: npm test)
//   node tests/run-all.mjs core admin                 (only some suites)
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ALL = ["shop", "core", "extended", "admin", "experience", "growth", "loyalty", "responsive"];
const wanted = process.argv.slice(2).filter((a) => ALL.includes(a));
const suites = wanted.length ? wanted : ALL;
const PORT = process.env.TEST_PORT || "3300";
const ADMIN_PASSWORD = "test-admin-pass-123";
const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const outDir = path.join(process.cwd(), "tests", "out");
fs.mkdirSync(outDir, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitReady(url, ms = 60000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { try { const r = await fetch(url); if (r.ok) return true; } catch { /* not up yet */ } await sleep(500); }
  return false;
}
const kill = (child) => { if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"]); else child.kill("SIGTERM"); };

const summary = [];
for (const suite of suites) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "arcana-test-"));
  const env = { ...process.env, ARCANA_DATA_DIR: dataDir, ADMIN_PASSWORD, PORT, NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}` };
  delete env.TURSO_DATABASE_URL; delete env.TURSO_AUTH_TOKEN; delete env.RESEND_API_KEY; delete env.ANTHROPIC_API_KEY;
  const server = spawn(process.execPath, [nextBin, "start", "-p", PORT], { env, stdio: "ignore" });
  const ready = await waitReady(`http://localhost:${PORT}/api/health`);
  let code = 1;
  if (!ready) console.log(`✗ ${suite}: server did not start`);
  else {
    console.log(`\n▶ ${suite}`);
    const r = spawnSync(process.execPath, [path.join("tests", `${suite}.mjs`)], { env: { ...env, BASE_URL: `http://localhost:${PORT}`, OUT_DIR: outDir }, stdio: "inherit" });
    code = r.status ?? 1;
  }
  kill(server); await sleep(1500);
  summary.push([suite, code === 0]);
}
console.log("\n══════ SUMMARY ══════");
for (const [s, ok] of summary) console.log(`${ok ? "PASS" : "FAIL"}  ${s}`);
process.exit(summary.every(([, ok]) => ok) ? 0 : 1);
