import fs from "node:fs";
import { BASE, OUT, ADMIN, launchBrowser, wav, isoDay } from "./lib.mjs";
void wav; void isoDay; void fs;

const results = [], errs = []; const ok = (n, c, x = "") => results.push([c ? "PASS" : "FAIL", n, x]);
const b = await launchBrowser({ args: ["--autoplay-policy=no-user-gesture-required"] });


const adminCtx = await b.newContext(); const A = adminCtx.request; const anon = (await b.newContext()).request;
const J = async (r) => ({ status: r.status(), body: await r.json().catch(() => null), headers: r.headers() });
await A.post(BASE + "/api/admin", { data: { action: "login", password: ADMIN } });
const save = (config) => A.post(BASE + "/api/admin", { data: { action: "saveConfig", config } }).then(J);
const cfg = async () => (await anon.get(BASE + "/api/site?q=config").then(J)).body;

// ── API
let c = await cfg(); ok("default config: built-in moonlit music + short intro", c.music.mode === "preset" && c.music.preset === "moonlit" && c.intro.style === "short");
let r = await save({ music: { mode: "url", url: "javascript:alert(1)", volume: 40 }, intro: { style: "quick" } }); c = await cfg();
ok("unsafe link rejected (falls back to built-in)", c.music.mode === "preset" && c.music.url === "");
r = await save({ music: { mode: "url", url: "https://example.com/song.mp3", volume: 250 }, intro: { style: "bogus" } }); c = await cfg();
ok("valid link accepted, volume clamped to 100, bad intro style → default", c.music.mode === "url" && c.music.volume === 100 && c.intro.style === "short");
r = await anon.post(BASE + "/api/admin/media", { multipart: { file: { name: "x.wav", mimeType: "audio/wav", buffer: wav() } } }).then(J); ok("upload without admin login refused (401)", r.status === 401);
r = await anon.post(BASE + "/api/admin", { data: { action: "saveConfig", config: {} } }).then(J); ok("saving config without admin refused (401)", r.status === 401);
r = await A.post(BASE + "/api/admin/media", { multipart: { file: { name: "evil.html", mimeType: "text/html", buffer: Buffer.from("<script>alert(1)</script>") } } }).then(J); ok("non-audio upload refused (415)", r.status === 415);
r = await A.post(BASE + "/api/admin/media", { multipart: { file: { name: "big.wav", mimeType: "audio/wav", buffer: Buffer.alloc(3 * 1024 * 1024 + 10) } } }).then(J); ok("file over 3 MB refused (413)", r.status === 413, r.body?.error?.slice(0, 40));
r = await A.post(BASE + "/api/admin/media", { multipart: { file: { name: "temple loop.wav", mimeType: "audio/wav", buffer: wav(2) } } }).then(J); ok("valid audio upload stored", r.status === 200 && r.body.media.id > 0, `id ${r.body?.media?.id}`);
const mid = r.body.media.id;
let g = await anon.get(BASE + `/api/media/${mid}`); ok("uploaded song is served publicly with audio type", g.status() === 200 && g.headers()["content-type"] === "audio/wav" && (await g.body()).length === 44 + 16000);
ok("served with nosniff header", g.headers()["x-content-type-options"] === "nosniff");
g = await anon.get(BASE + `/api/media/${mid}`, { headers: { range: "bytes=0-99" } }); ok("range requests supported (206) for seeking", g.status() === 206 && (await g.body()).length === 100);
g = await anon.get(BASE + "/api/media/99999"); ok("unknown media id → 404", g.status() === 404);
await save({ music: { mode: "media", mediaId: mid, mediaName: "temple loop.wav", volume: 60 }, intro: { style: "short" } }); c = await cfg(); ok("media mode saved with id", c.music.mode === "media" && c.music.mediaId === mid);
r = await A.get(BASE + "/api/admin").then(J); ok("admin data lists uploaded media (no binary)", r.body.media.length === 1 && !("data" in r.body.media[0]));
await A.post(BASE + "/api/admin", { data: { action: "deleteMedia", id: mid } }); c = await cfg(); ok("deleting the active song falls back to built-in", c.music.mode === "preset" && c.music.mediaId === null);
await save({ music: { mode: "preset", preset: "moonlit", volume: 50 }, intro: { style: "short" } });

// ── Admin UI
const mk = async (vw) => { const ctx = await b.newContext({ viewport: vw }); const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push("pageerror " + e.message)); p.on("console", (m) => m.type() === "error" && !/Failed to load resource|ERR_|net::|NotSupported|play\(\)/.test(m.text()) && errs.push("console " + m.text().slice(0, 150))); return { ctx, p }; };
const { p } = await mk({ width: 1440, height: 1000 });
await p.goto(BASE + "/admin"); await p.waitForTimeout(700); await p.getByLabel("Password").fill(ADMIN); await p.getByRole("button", { name: "Enter" }).click(); await p.waitForTimeout(1500);
await p.getByRole("navigation", { name: "Admin navigation" }).first().getByRole("button", { name: "Music & intro" }).click(); await p.waitForTimeout(900);
ok("Music & intro page opens from the drawer", await p.getByRole("heading", { name: "Music & intro" }).isVisible());
await p.screenshot({ path: `${OUT}/ex-admin.png` });
await p.getByRole("radio", { name: /Temple bells/ }).click(); await p.waitForTimeout(400);
ok("selecting a track shows Save changes", await p.getByRole("button", { name: "Save changes" }).isVisible());
await p.getByRole("button", { name: "Listen" }).nth(1).click(); await p.waitForTimeout(700); ok("Listen toggles to Stop (preview playing)", await p.getByRole("button", { name: "Stop" }).first().isVisible());
await p.getByRole("button", { name: "Stop" }).first().click();
await p.getByRole("radio", { name: /Quick/ }).click();
ok("intro preview link carries chosen style (unsaved)", (await p.getByRole("link", { name: /Preview intro/ }).getAttribute("href")).includes("style=quick"));
await p.getByRole("button", { name: "Save changes" }).click(); await p.waitForTimeout(1200);
c = await cfg(); ok("UI save persists preset + intro style", c.music.preset === "bells" && c.intro.style === "quick");
// upload via UI
await p.getByRole("tab", { name: "My song" }).click(); await p.waitForTimeout(500);
await p.getByLabel("Upload a song").setInputFiles({ name: "my-song.wav", mimeType: "audio/wav", buffer: wav(2) }); await p.waitForTimeout(1500);
ok("UI upload lists the song and selects it", await p.getByText("my-song.wav").isVisible());
await p.getByRole("button", { name: "Save changes" }).click(); await p.waitForTimeout(1200);
c = await cfg(); ok("UI: uploaded song saved as the site music", c.music.mode === "media" && c.music.mediaName === "my-song.wav");
await p.screenshot({ path: `${OUT}/ex-admin-upload.png` });
await p.getByRole("tab", { name: "Link" }).click(); await p.getByLabel("Link to an audio file").fill("https://example.com/a.mp3"); ok("link tab: Listen enabled for valid URL", await p.getByRole("button", { name: "Listen" }).isEnabled());
await p.getByRole("button", { name: "Discard" }).click(); await p.waitForTimeout(500);

// ── public site reflects it
const mediaId = (await cfg()).music.mediaId;
const S = await mk({ width: 1280, height: 800 });
await S.p.addInitScript(() => sessionStorage.setItem("arcana-intro", "1"));
await S.p.goto(BASE); await S.p.waitForTimeout(1800);
const reqP = S.p.waitForRequest((q) => new RegExp(`/api/media/${mediaId}$`).test(q.url()), { timeout: 6000 }).catch(() => null);
await S.p.getByRole("button", { name: "Turn ambient sound on" }).first().click(); const rq = await reqP;
ok("site plays the uploaded song when sound is turned on", !!rq);
await S.p.getByRole("button", { name: "Turn ambient sound off" }).first().click();
await save({ music: { mode: "off", volume: 50 }, intro: { style: "short" } });
await S.p.goto(BASE); await S.p.waitForTimeout(1800); ok("music off → sound button hidden on the site", (await S.p.getByRole("button", { name: /ambient sound/ }).count()) === 0);
await S.p.screenshot({ path: `${OUT}/ex-site-nomusic.png` });
await save({ music: { mode: "preset", preset: "space", volume: 50 }, intro: { style: "short" } });
await S.p.goto(BASE); await S.p.waitForTimeout(1800);
await S.p.getByRole("button", { name: "Turn ambient sound on" }).first().click(); await S.p.waitForTimeout(600); ok("built-in 'Deep space' starts without errors", (await S.p.getByRole("button", { name: "Turn ambient sound off" }).count()) >= 1);

// ── intro timing (fresh visitor each time)
async function introMs(style) {
  await save({ music: { mode: "off", volume: 50 }, intro: { style } });
  const { p, ctx } = await mk({ width: 1280, height: 800 }); const t0 = Date.now();
  await p.goto(BASE, { waitUntil: "domcontentloaded" });
  const shown = await p.locator("[aria-label='Introduction']").waitFor({ state: "attached", timeout: 3500 }).then(() => true).catch(() => false);
  if (!shown) { await ctx.close(); return { shown: false, ms: 0 }; }
  await p.locator("[aria-label='Introduction']").waitFor({ state: "detached", timeout: 20000 });
  const ms = Date.now() - t0; await ctx.close(); return { shown: true, ms };
}
const off = await introMs("off"); ok("intro 'off': no animation at all", !off.shown);
const quick = await introMs("quick"); ok("intro 'quick' finishes in under 3.6 s", quick.shown && quick.ms < 3600, `${quick.ms} ms`);
const short = await introMs("short"); ok("intro 'short' finishes in under 4.6 s", short.shown && short.ms < 4600, `${short.ms} ms`);
const full = await introMs("full"); ok("intro 'full' is the long original (over 6 s)", full.shown && full.ms > 6000, `${full.ms} ms`);
// skip + once-per-session
await save({ music: { mode: "off", volume: 50 }, intro: { style: "short" } });
const k = await mk({ width: 1280, height: 800 }); await k.p.goto(BASE); await k.p.locator("[aria-label='Introduction']").waitFor({ timeout: 4000 });
const t1 = Date.now(); await k.p.getByRole("button", { name: "Skip intro" }).click({ timeout: 4000 }); await k.p.locator("[aria-label='Introduction']").waitFor({ state: "detached", timeout: 4000 }); ok("skip button ends the intro immediately", Date.now() - t1 < 1800, `${Date.now() - t1} ms`);
await k.p.reload(); await k.p.waitForTimeout(1500); ok("intro does not replay in the same visit", (await k.p.locator("[aria-label='Introduction']").count()) === 0);
const pv = await mk({ width: 1280, height: 800 }); await pv.p.goto(BASE + "/?intro=preview&style=quick"); ok("admin preview link forces the intro to play", await pv.p.locator("[aria-label='Introduction']").waitFor({ timeout: 3500 }).then(() => true).catch(() => false));
await save({ music: { mode: "preset", preset: "moonlit", volume: 50 }, intro: { style: "short" } });
ok("no JS errors", errs.length === 0, errs.join(" | ").slice(0, 300));
console.log(results.map((x) => `${x[0]}  ${x[1]}${x[2] ? "  [" + x[2] + "]" : ""}`).join("\n")); console.log(`\n${results.filter((x) => x[0] === "PASS").length}/${results.length} passed`);
if (results.some((r) => r[0] === "FAIL")) process.exitCode = 1;
await b.close();
