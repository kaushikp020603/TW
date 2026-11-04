// Shared helpers for the end-to-end suites.
import { chromium } from "playwright-core";
import fs from "node:fs";

export const BASE = process.env.BASE_URL || "http://localhost:3300";
export const OUT = process.env.OUT_DIR || "tests/out";
export const ADMIN = process.env.ADMIN_PASSWORD || "test-admin-pass-123";
fs.mkdirSync(OUT, { recursive: true });

/** Launches Chromium. Set PW_CHANNEL=msedge (or chrome) to use an installed browser instead of Playwright's download. */
export const launchBrowser = (opts = {}) => chromium.launch({ headless: true, ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}), ...opts });

/** A tiny valid WAV file (silence) for upload tests. */
export const wav = (secs = 1) => {
  const n = 8000 * secs, h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + n, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(8000, 24); h.writeUInt32LE(8000, 28); h.writeUInt16LE(1, 32); h.writeUInt16LE(8, 34); h.write("data", 36); h.writeUInt32LE(n, 40);
  return Buffer.concat([h, Buffer.alloc(n, 128)]);
};

export const isoDay = (offsetDays) => { const d = new Date(Date.now() + offsetDays * 864e5); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };

/** Collects PASS/FAIL results, prints them, and sets a non-zero exit code on any failure. */
export function reporter(name) {
  const results = [];
  return {
    ok: (n, c, x = "") => results.push([c ? "PASS" : "FAIL", n, x]),
    done: () => {
      console.log(`\n── ${name} ──`);
      console.log(results.map((r) => `${r[0]}  ${r[1]}${r[2] ? "  [" + r[2] + "]" : ""}`).join("\n"));
      const pass = results.filter((r) => r[0] === "PASS").length;
      console.log(`\n${pass}/${results.length} passed`);
      if (pass !== results.length) process.exitCode = 1;
    },
  };
}
