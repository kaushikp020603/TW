import fs from "node:fs";
import { BASE, OUT, ADMIN, launchBrowser, wav, isoDay } from "./lib.mjs";
void wav; void isoDay; void fs;

const b = await launchBrowser();
const results = []; const errs = [];
const ok = (name, cond, extra = "") => { results.push([cond ? "PASS" : "FAIL", name, extra]); };
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
p.on("pageerror", (e) => errs.push("pageerror " + e.message));
p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push("console " + m.text()));
await p.addInitScript(() => sessionStorage.setItem("arcana-intro", "1"));
await p.goto(BASE, { waitUntil: "load" }); await p.waitForTimeout(1500);
const api = (path, opt) => p.evaluate(async ([path, opt]) => { const r = await fetch(path, opt); return { status: r.status, body: await r.json().catch(() => null) }; }, [path, opt]);
const post = (path, body, method = "POST") => api(path, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

// Story chapters
ok("story chapters render", (await p.locator("section[aria-label^='Chapter']").count()) === 6);
await p.evaluate(() => document.querySelector("section[aria-label^='Chapter']").scrollIntoView()); await p.waitForTimeout(800);
await p.screenshot({ path: `${OUT}/e-story.png` });

// Daily card
await p.evaluate(() => document.getElementById("reading").scrollIntoView());
await p.getByRole("button", { name: /Draw today/ }).click(); await p.waitForTimeout(1500);
ok("daily card drawn", await p.getByText("Come back tomorrow").isVisible());
await p.reload(); await p.waitForTimeout(1200);
ok("daily card persists same day", await p.getByText("Come back tomorrow").isVisible());

// Each spread
async function spread(label, n, cat = "General Guidance") {
  await p.evaluate(() => document.getElementById("reading").scrollIntoView());
  const again = p.getByRole("button", { name: "Draw again" }); if (await again.count()) await again.first().click();
  await p.locator("#reading").getByRole("button", { name: new RegExp("^" + cat) }).click();
  await p.locator("#reading").getByRole("button", { name: new RegExp("^" + label) }).click();
  await p.locator("#q").fill("Test question?");
  await p.getByRole("button", { name: "Shuffle the deck" }).click(); await p.waitForTimeout(3200);
  const cards = p.getByRole("button", { name: /^Card \d+ of 22$/ });
  const idx = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18].slice(0, n);
  for (const i of idx) { await cards.nth(i).click({ force: true }); await p.waitForTimeout(120); }
  await p.waitForTimeout(1500 + n * 450 + 1500);
  const names = await p.locator("#reading h3").allInnerTexts();
  const clean = names.map((x) => x.replace(/\s*reversed$/i, "").trim()).filter((x) => x && !/card of the day/i.test(x) && !/Your card of the day/.test(x));
  const spreadNames = clean.slice(-n);
  ok(`${label}: ${n} unique cards`, new Set(spreadNames).size === n, spreadNames.join(", "));
  ok(`${label}: personalised reading shown`, await p.getByText("Your reading", { exact: true }).isVisible());
  return spreadNames;
}
try { await spread("One card", 1); } catch (e) { await p.screenshot({ path: OUT + "/fail.png" }); console.log("FAILED spread:", (await p.locator("#reading").innerText()).slice(0,300)); throw e; }
await p.screenshot({ path: `${OUT}/e-one.png` });
await spread("Yes / No", 1);
ok("yes/no answer displayed", /Yes|No|Maybe/.test(await p.locator("#reading .font-display.text-5xl").first().innerText()));
await p.evaluate(() => window.scrollBy(0, 300)); await p.screenshot({ path: `${OUT}/e-yesno.png` });
await spread("Celtic Cross", 10);
await p.evaluate(() => document.querySelector("#reading .glass.frame.space-y-4")?.scrollIntoView()); await p.waitForTimeout(500);
await p.screenshot({ path: `${OUT}/e-celtic.png` });
await spread("Three cards", 3, "Love");

// save as guest (consent required)
ok("save disabled without consent", await p.getByRole("button", { name: "Save reading" }).isDisabled());
await p.getByText("Save this reading").click();
await p.getByRole("button", { name: "Save reading" }).click(); await p.waitForTimeout(600);
ok("guest saved locally", await p.getByText("Saved on this device").isVisible());
ok("history lists reading", (await p.locator("#hist-h").count()) === 1);
// PDF popup + share links
const [pop] = await Promise.all([p.waitForEvent("popup"), p.getByRole("button", { name: "Download PDF" }).click()]);
await pop.waitForTimeout(500); ok("PDF page opens with reading", /Spill the Cards/.test(await pop.content())); await pop.close();
const share = await p.getByRole("link", { name: "Share on WhatsApp" }).last().getAttribute("href");
ok("share link is wa.me text", share.startsWith("https://wa.me/?text="));

// Auth
const email = `t${Date.now()}@example.com`;
let r = await post("/api/auth", { action: "register", email, name: "Tester", password: "short" }); ok("register rejects weak password", r.status === 400);
r = await post("/api/auth", { action: "register", email, name: "Tester", password: "longenough1", phone: "9999999999" }); ok("register works", r.status === 200 && r.body.user.email === email);
r = await api("/api/auth"); ok("session persists", r.body.user?.email === email);
await post("/api/auth", { action: "logout" }); r = await api("/api/auth"); ok("logout works", r.body.user === null);
r = await post("/api/auth", { action: "login", email, password: "wrongwrong" }); ok("bad login rejected", r.status === 401);
r = await post("/api/auth", { action: "login", email, password: "longenough1" }); ok("login works", r.status === 200);
r = await post("/api/readings", { spread: "one", category: "general", question: "q", cards: [{ id: 1, reversed: false }] }); ok("saving reading needs consent", r.status === 400);
r = await post("/api/readings", { spread: "one", category: "general", question: "q", cards: [{ id: 1, reversed: false }], consent: true }); ok("account reading saved", r.status === 200);
r = await api("/api/readings"); ok("account readings listed", r.body.readings.length === 1);

// Booking via UI
const tomorrow = new Date(Date.now() + 864e5); const d2 = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
await p.reload(); await p.waitForTimeout(1500);
await p.evaluate(() => document.getElementById("book").scrollIntoView()); await p.waitForTimeout(800);
await p.getByRole("button", { name: /^Love & Relationships/ }).click();
await p.locator("#book fieldset").nth(1).locator("button").nth(1).click(); await p.waitForTimeout(600);
await p.getByRole("button", { name: "7:30 PM" }).click();
ok("name prefilled from account", (await p.locator("#nm").inputValue()) === "Tester");
await p.locator("#cp").fill("WELCOME10"); await p.getByRole("button", { name: "Apply" }).click(); await p.waitForTimeout(500);
ok("coupon applied", await p.getByText(/you save ₹30/).isVisible());
await p.getByRole("button", { name: "Reserve this slot" }).click(); await p.waitForTimeout(1200);
ok("booking saved + reference shown", await p.getByText(/Reference [0-9A-F]{8}/).isVisible());
const waHref = await p.getByRole("link", { name: "Send on WhatsApp" }).getAttribute("href");
ok("WhatsApp link targets +91 90278 45106", waHref.includes("919027845106") && decodeURIComponent(waHref).includes("₹269"));
await p.screenshot({ path: `${OUT}/e-booked.png` });
const ref = (await p.getByText(/Reference [0-9A-F]{8}/).innerText()).split(" ")[1];
// slot now unavailable & double book conflict
const date2 = d2;
r = await api(`/api/public?q=slots&date=${date2}`);
const tomorrowLabel = r.body.slots.find((s) => s.time === "7:30 PM");
r = await api("/api/bookings"); const mine = r.body.bookings[0];
ok("booking appears in my bookings", !!mine && mine.status === "pending");
r = await post("/api/bookings", { serviceId: "one", date: mine.date, time: mine.time, name: "Other" }); ok("double-booking blocked (409)", r.status === 409);
r = await api(`/api/public?q=slots&date=${mine.date}`); ok("slot marked unavailable", r.body.slots.find((s) => s.time === mine.time).available === false);
// reschedule + cancel
r = await post("/api/bookings", { code: mine.code, action: "reschedule", date: mine.date, time: "10:00 AM" }, "PATCH"); ok("reschedule works", r.status === 200);
r = await api(`/api/public?q=slots&date=${mine.date}`); ok("old slot freed after reschedule", r.body.slots.find((s) => s.time === "7:30 PM").available === true);
await p.reload(); await p.waitForTimeout(1500); await p.evaluate(() => document.getElementById("book").scrollIntoView()); await p.waitForTimeout(1500);
ok("My bookings panel lists it", await p.getByText("My bookings").first().isVisible());
p.once("dialog", (d) => d.accept());
await p.getByRole("button", { name: "Cancel" }).first().click(); await p.waitForTimeout(1000);
r = await api("/api/bookings"); ok("cancel works", r.body.bookings[0].status === "cancelled");

// Guest booking (no account)
const g = await b.newContext({ viewport: { width: 1280, height: 800 } }); const gp = await g.newPage();
await gp.goto(BASE); const gpost = (path, body, method = "POST") => gp.evaluate(async ([path, body, method]) => { const r = await fetch(path, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); return { status: r.status, body: await r.json() }; }, [path, body, method]);
let gr = await gpost("/api/bookings", { serviceId: "call30", date: mine.date, time: "4:30 PM", name: "Guest Gita", phone: "9876543210", note: "hello" });
ok("guest booking works (no account)", gr.status === 200 && !!gr.body.booking.code);
const guestCode = gr.body.booking.code;
gr = await gp.evaluate(async (c) => (await fetch(`/api/bookings?code=${c}`)).json(), guestCode); ok("guest lookup by code", gr.bookings?.[0]?.name === "Guest Gita");
await g.close();

// Reviews: submit → hidden until approved
r = await post("/api/reviews", { name: "Rita", category: "Love reading", text: "This reading helped me reflect clearly.", permission: false }); ok("review requires permission", r.status === 400);
r = await post("/api/reviews", { name: "Rita", category: "Love reading", text: "This reading helped me reflect clearly.", permission: true }); ok("review submitted", r.status === 200);
r = await api("/api/public?q=reviews"); ok("pending review not public", r.body.reviews.length === 0);

// Admin
const a = await b.newContext(); const ap = await a.newPage(); await ap.goto(BASE + "/admin");
const apost = (body) => ap.evaluate(async (body) => { const r = await fetch("/api/admin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); return { status: r.status, body: await r.json() }; }, body);
const aget = (u = "/api/admin") => ap.evaluate(async (u) => { const r = await fetch(u); return { status: r.status, text: await r.text() }; }, u);
ok("admin API locked without login", (await aget()).status === 401);
ok("wrong admin password rejected", (await apost({ action: "login", password: "nope" })).status === 401);
await ap.reload(); await ap.waitForTimeout(800);
await ap.getByLabel("Password").fill(ADMIN); await ap.getByRole("button", { name: "Enter" }).click(); await ap.waitForTimeout(1800);
ok("admin UI login works", await ap.getByRole("heading", { name: /Good (morning|afternoon|evening)/ }).isVisible());
await ap.screenshot({ path: `${OUT}/e-admin.png` });
let dd = JSON.parse((await aget()).text);
ok("admin sees bookings", dd.bookings.length >= 2, `${dd.bookings.length} bookings`);
const gb = dd.bookings.find((x) => x.code === guestCode);
await apost({ action: "setStatus", id: gb.id, status: "confirmed" }); await apost({ action: "markPaid", id: gb.id, method: "UPI" }); dd = JSON.parse((await aget()).text);
ok("admin confirms booking + revenue counts it", dd.bookings.find((x) => x.code === guestCode).status === "confirmed" && dd.stats.revenueAll >= 799, `revenue ${dd.stats.revenueAll}`);
await apost({ action: "saveService", id: "one", name: "One-Card Reading", price: 149, mins: "Quick", blurb: "x", active: true, sort: 0 });
r = await api("/api/public?q=services"); ok("admin price edit shows on site", r.body.services.find((s) => s.id === "one").price === 149);
await apost({ action: "saveCoupon", code: "FLAT50", kind: "flat", value: 50, max_uses: 1 });
r = await api("/api/bookings?coupon=flat50&service=one"); ok("new coupon works", r.body.valid && r.body.final === 99);
const nextWeek = new Date(Date.now() + 6 * 864e5); const nw = new Date(nextWeek.getTime() - nextWeek.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
await apost({ action: "block", date: nw });
r = await post("/api/bookings", { serviceId: "one", date: nw, time: "1:00 PM", name: "X Y" }); ok("blocked date refuses bookings", r.status === 409);
r = await api(`/api/public?q=slots&date=${nw}`); ok("blocked day shows no slots", r.body.slots.every((s) => !s.available));
const rv = dd.reviews[0]; await apost({ action: "reviewApprove", id: rv.id, approved: true });
r = await api("/api/public?q=reviews"); ok("approved review goes public", r.body.reviews.length === 1);
const csv = await aget("/api/admin?export=bookings"); ok("CSV export works", csv.status === 200 && csv.text.includes("Guest Gita"));
await a.close();

// Account deletion
r = await post("/api/auth", { action: "delete" }); ok("account deletion works", r.status === 200);
r = await post("/api/auth", { action: "login", email, password: "longenough1" }); ok("deleted account can't log in", r.status === 401);

// Oracle
const o = await api("/api/oracle", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: "hi" }) });
ok("oracle degrades gracefully without key", o.body?.configured === false);

console.log(results.map((r) => `${r[0]}  ${r[1]}${r[2] ? "  [" + r[2] + "]" : ""}`).join("\n"));
console.log(`\n${results.filter((r) => r[0] === "PASS").length}/${results.length} passed`);
if (results.some((r) => r[0] === "FAIL")) process.exitCode = 1;
console.log("JS ERRORS:", JSON.stringify(errs));
await b.close();
