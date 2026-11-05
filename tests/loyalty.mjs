// Covers: reading summaries, waitlist, referral codes and rewards, gift cards, invite card, ?ref= prefill.
import { BASE, OUT, ADMIN, launchBrowser, reporter, isoDay } from "./lib.mjs";

const { ok, done } = reporter("loyalty features");
const b = await launchBrowser();
const errs = [];
const J = async (r) => ({ status: r.status(), body: await r.json().catch(() => null), text: await r.text().catch(() => "") });
const J2 = async (r) => ({ status: r.status(), body: await r.json().catch(() => null) });
const post = (req, path, data, method = "POST") => req.fetch(BASE + path, { method, data, headers: { "content-type": "application/json" } }).then(J2);
const mkReq = async () => (await b.newContext()).request;
const mkPage = async (vw = { width: 1440, height: 900 }) => {
  const ctx = await b.newContext({ viewport: vw }); const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push("pageerror " + e.message));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource|ERR_|net::/.test(m.text()) && errs.push("console " + m.text().slice(0, 160)));
  await p.addInitScript(() => { sessionStorage.setItem("arcana-intro", "1"); localStorage.setItem("stc-consent", "essential"); });
  return { ctx, p };
};
const A = await mkReq(), anon = await mkReq();
await post(A, "/api/admin", { action: "login", password: ADMIN });
const adm = (d) => post(A, "/api/admin", d);
const data = async () => (await A.get(BASE + "/api/admin").then(J2)).body;
const register = async (name, email) => { const r = await mkReq(); const x = await post(r, "/api/auth", { action: "register", email, name, password: "longenough1", phone: "9000000" + String(Math.random()).slice(2, 5) }); return { r, id: x.body.user.id, name, email }; };
const stamp = Date.now();

// ───────────── reading summary ─────────────
const alice = await register("Alice Summary", `alice${stamp}@example.com`);
let r = await post(alice.r, "/api/bookings", { serviceId: "three", date: isoDay(3), time: "10:00 AM", name: "Alice Summary" }); const bk = r.body.booking;
let d = await data(); const row = d.bookings.find((x) => x.code === bk.code);
r = await post(anon, "/api/admin", { action: "saveSummary", id: row.id, text: "x", cards: [] }); ok("saving a summary needs the admin login", r.status === 401);
r = await anon.get(BASE + `/api/bookings?summary=${bk.code}`).then(J2); ok("no summary yet → 404", r.status === 404);
await adm({ action: "saveSummary", id: row.id, text: "You are in a season of change. Be patient with yourself.\n\nReflect on what you want to keep.", cards: [{ id: 17, reversed: false, label: "Present" }, { id: 18, reversed: true, label: "Challenge" }, { id: 999, reversed: false }] });
r = await anon.get(BASE + `/api/bookings?summary=${bk.code.toLowerCase()}`).then(J2);
ok("summary opens with the secret booking code (any letter case)", r.status === 200 && /season of change/.test(r.body.summary.text) && r.body.summary.cards.length === 3 && r.body.summary.name === "Alice Summary");
ok("card ids are clamped to the deck (0-21)", r.body.summary.cards[2].id === 21);
r = await anon.get(BASE + "/api/bookings?summary=ZZZZZZZZ").then(J2); ok("wrong code → 404 (nothing leaks)", r.status === 404);
r = await alice.r.get(BASE + "/api/bookings").then(J2); ok("client's booking list flags that a summary exists", r.body.bookings[0].has_summary === 1);
await adm({ action: "saveSummary", id: row.id, text: "", cards: [] }); r = await anon.get(BASE + `/api/bookings?summary=${bk.code}`).then(J2); ok("clearing the summary hides it again", r.status === 404);
await adm({ action: "saveSummary", id: row.id, text: "You are in a season of change. Be patient with yourself.\n\nReflect on what you want to keep.", cards: [{ id: 17, reversed: false, label: "Present" }, { id: 18, reversed: true, label: "Challenge" }] });
{
  const { p } = await mkPage(); const resp = await p.goto(BASE + `/summary/${bk.code}`); await p.waitForTimeout(1500);
  ok("summary page shows the cards, their meanings and the reader's notes", await p.getByText("The Star").first().isVisible() && await p.getByText("The Moon").first().isVisible() && await p.getByText("season of change").isVisible() && await p.getByText("Present").first().isVisible());
  ok("summary page is private (noindex) and offers PDF + rebooking", /noindex/.test(await p.content()) && await p.getByRole("button", { name: "Save as PDF" }).isVisible() && resp.status() === 200);
  await p.screenshot({ path: `${OUT}/l-summary.png` });
  await p.goto(BASE + "/summary/BADCODE1"); await p.waitForTimeout(1000); ok("bad link shows a friendly message", await p.getByText("Summary not found").isVisible());
}

// ───────────── waitlist ─────────────
const fullDay = isoDay(9);
r = await post(anon, "/api/site", { action: "waitlist", date: "2020-01-01", name: "Past", contact: "9876543210" }); ok("waitlist refuses past dates", r.status === 400);
r = await post(anon, "/api/site", { action: "waitlist", date: fullDay, name: "X", contact: "12" }); ok("waitlist validates name and contact", r.status === 400);
await adm({ action: "block", date: fullDay });
{
  const { p } = await mkPage(); await p.goto(BASE); await p.waitForTimeout(1500); await p.evaluate(() => document.getElementById("book").scrollIntoView()); await p.waitForTimeout(800);
  const dateBtn = p.locator("#book fieldset").nth(1).locator("button").filter({ hasText: new Date(fullDay + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) });
  await dateBtn.click(); await p.waitForTimeout(900);
  ok("a fully booked day offers the waitlist", await p.getByText(/fully booked/).isVisible() && await p.getByLabel("Join the waitlist").isVisible());
  const form = p.getByLabel("Join the waitlist"); await form.getByLabel("Your name").fill("Wanda Wait"); await form.getByLabel("WhatsApp number or email").fill("98765 11111"); await form.getByRole("button", { name: "Join waitlist" }).click(); await p.waitForTimeout(900);
  ok("joining the waitlist confirms to the visitor", await p.getByText("You're on the waitlist").isVisible());
  await p.screenshot({ path: `${OUT}/l-waitlist.png` });
}
await post(anon, "/api/site", { action: "waitlist", date: fullDay, name: "Wanda Wait", contact: "9876511111" });
d = await data(); ok("waitlist stores one entry per person/date, with the number normalised", d.waitlist.length === 1 && d.waitlist[0].contact === "919876511111" && d.alerts.waitlist === 1);
{
  const { p } = await mkPage(); await p.goto(BASE + "/admin"); await p.waitForTimeout(800); await p.getByLabel("Password").fill(ADMIN); await p.getByRole("button", { name: "Enter" }).click(); await p.waitForTimeout(1600);
  const nav = (n) => p.getByRole("navigation", { name: "Admin navigation" }).first().getByRole("button", { name: n });
  await nav("Calendar").click(); await p.waitForTimeout(900);
  ok("calendar shows the waitlist with a notify link", await p.getByText("Waitlist (1)").isVisible() && (await p.locator("a[href*='wa.me/919876511111']").count()) === 1);
  await adm({ action: "unblock", id: (await data()).blocked.find((x) => x.date === fullDay).id }); await p.waitForTimeout(13000);
  ok("when the day frees up, the waitlist says slots are free now", await p.getByText(/slots? free now/).isVisible());
  await p.screenshot({ path: `${OUT}/l-admin-waitlist.png` });
  await p.getByRole("button", { name: "Remove from waitlist" }).click(); await p.waitForTimeout(900); ok("admin can remove a waitlist entry", (await data()).waitlist.length === 0);
}

// ───────────── referral ─────────────
const ann = await register("Ann Inviter", `ann${stamp}@example.com`);
const code1 = (await ann.r.get(BASE + "/api/site?q=account").then(J2)).body.refCode; const code2 = (await ann.r.get(BASE + "/api/site?q=account").then(J2)).body.refCode;
ok("each client gets a stable invite code like ARC-XXXXX", /^ARC-[A-Z2-9]{5}$/.test(code1) && code1 === code2);
const ben = await register("Ben Invited", `ben${stamp}@example.com`);
r = await ben.r.get(BASE + `/api/bookings?coupon=${code1}&service=love`).then(J2); ok("a new client gets 10% off with a friend's code", r.body.valid && r.body.discount === 30 && r.body.final === 269);
r = await ann.r.get(BASE + `/api/bookings?coupon=${code1}&service=love`).then(J2); ok("you can't use your own invite code", r.body.valid === false);
r = await anon.get(BASE + `/api/bookings?coupon=${code1}&service=love`).then(J2); ok("guests (no account) can't use invite codes", r.body.valid === false);
r = await ben.r.get(BASE + "/api/bookings?coupon=ARC-AAAAA&service=love").then(J2); ok("unknown invite code is invalid", r.body.valid === false);
r = await post(ben.r, "/api/bookings", { serviceId: "love", date: isoDay(4), time: "11:30 AM", name: "Ben Invited", coupon: code1 }); const benBk = r.body.booking;
ok("the invited friend's booking carries the discount", r.status === 200 && benBk.discount === 30 && benBk.final === 269);
r = await ben.r.get(BASE + `/api/bookings?coupon=${code1}&service=love`).then(J2); ok("an invite code only works on a first booking", r.body.valid === false);
d = await data(); const benRow = d.bookings.find((x) => x.code === benBk.code); const annBefore = d.customers.find((c) => c.id === ann.id).credits;
await adm({ action: "setStatus", id: benRow.id, status: "confirmed" }); d = await data(); ok("no reward before the session is completed", d.customers.find((c) => c.id === ann.id).credits === annBefore);
await adm({ action: "setStatus", id: benRow.id, status: "completed" }); d = await data(); ok("completing the friend's booking gives the inviter +1 session credit", d.customers.find((c) => c.id === ann.id).credits === annBefore + 1);
await adm({ action: "setStatus", id: benRow.id, status: "confirmed" }); await adm({ action: "setStatus", id: benRow.id, status: "completed" }); await adm({ action: "bulkStatus", ids: [benRow.id], status: "completed" });
d = await data(); ok("the reward is paid once only", d.customers.find((c) => c.id === ann.id).credits === annBefore + 1);
d = await data(); ok("activity log records the referral reward", d.activity.some((a) => /Referral reward/.test(a.text)));
const cat = await register("Cat Bulk", `cat${stamp}@example.com`);
r = await post(cat.r, "/api/bookings", { serviceId: "one", date: isoDay(5), time: "1:00 PM", name: "Cat Bulk", coupon: code1 }); d = await data();
await adm({ action: "bulkStatus", ids: [d.bookings.find((x) => x.code === r.body.booking.code).id], status: "completed" }); d = await data(); ok("bulk-completing a referred booking also rewards the inviter", d.customers.find((c) => c.id === ann.id).credits === annBefore + 2);
{
  const { p } = await mkPage(); await p.goto(BASE + `/?ref=${code1}`); await p.waitForTimeout(1500); await p.evaluate(() => document.getElementById("book").scrollIntoView()); await p.waitForTimeout(700);
  ok("a ?ref= link pre-fills the coupon box", (await p.locator("#cp").inputValue()) === code1);
}
{
  const { p } = await mkPage(); await p.goto(BASE); await p.waitForTimeout(1400); await p.getByRole("button", { name: "Sign in" }).first().click(); await p.waitForTimeout(500);
  await p.getByLabel("Email", { exact: true }).fill(ann.email); await p.getByLabel("Password").fill("longenough1"); await p.getByRole("button", { name: "Sign in", exact: true }).last().click(); await p.waitForTimeout(1600);
  await p.evaluate(() => document.getElementById("book").scrollIntoView()); await p.waitForTimeout(1200);
  const card = p.getByLabel("Invite a friend"); ok("signed-in clients see their invite card with the code", await card.isVisible() && (await card.getByText(code1).count()) === 1 && (await card.getByRole("link", { name: "Share on WhatsApp" }).getAttribute("href")).includes("wa.me"));
  await card.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${OUT}/l-invite.png` });
}

// ───────────── gift cards ─────────────
await adm({ action: "saveCoupon", code: "GIFT-TEST22", kind: "flat", value: 300, max_uses: 1 });
r = await anon.get(BASE + "/api/bookings?coupon=gift-test22&service=love").then(J2); ok("gift code covers a ₹299 reading fully (never below zero)", r.body.valid && r.body.discount === 299 && r.body.final === 0);
const dan = await register("Dan Gifted", `dan${stamp}@example.com`);
r = await post(dan.r, "/api/bookings", { serviceId: "love", date: isoDay(6), time: "3:00 PM", name: "Dan Gifted", coupon: "GIFT-TEST22" }); ok("booking with a gift code costs ₹0", r.status === 200 && r.body.booking.final === 0);
r = await anon.get(BASE + "/api/bookings?coupon=GIFT-TEST22&service=love").then(J2); ok("a gift code works once only", r.body.valid === false);
r = await anon.get(BASE + "/gift"); const gt = await r.text(); ok("gift page lists amounts with WhatsApp purchase links", r.status() === 200 && /Gift a/.test(gt) && (gt.match(/wa\.me\/919027845106\?text=[^"]*gift/gi) || []).length >= 4);
{
  const { p } = await mkPage(); await p.goto(BASE + "/admin"); await p.waitForTimeout(800); await p.getByLabel("Password").fill(ADMIN); await p.getByRole("button", { name: "Enter" }).click(); await p.waitForTimeout(1600);
  await p.getByRole("navigation", { name: "Admin navigation" }).first().getByRole("button", { name: "Coupons" }).click(); await p.waitForTimeout(800);
  await p.getByRole("button", { name: "New gift card" }).click(); await p.waitForTimeout(500); await p.getByLabel("Amount (₹)").fill("750"); await p.getByRole("button", { name: "Create gift code" }).click(); await p.waitForTimeout(1000);
  const codeText = await p.locator("[role=dialog] p.font-display").first().innerText();
  ok("admin creates a gift card and gets a shareable code", /^GIFT-[A-Z2-9]{6}$/.test(codeText) && (await p.locator("[role=dialog] a[href*='wa.me']").count()) === 1);
  const dd = await data(); ok("the gift code exists as a single-use ₹750 coupon", dd.coupons.some((c) => c.code === codeText && c.value === 750 && c.max_uses === 1 && c.kind === "flat"));
  await p.screenshot({ path: `${OUT}/l-gift-admin.png` });
}
// summary editor in the admin booking panel
{
  const { p } = await mkPage(); await p.goto(BASE + "/admin"); await p.waitForTimeout(800); await p.getByLabel("Password").fill(ADMIN); await p.getByRole("button", { name: "Enter" }).click(); await p.waitForTimeout(1600);
  await p.getByRole("navigation", { name: "Admin navigation" }).first().getByRole("button", { name: "Bookings" }).click(); await p.waitForTimeout(800);
  await p.getByLabel("Search", { exact: true }).fill("Dan Gifted"); await p.waitForTimeout(500); await p.locator("tbody tr").first().click(); await p.waitForTimeout(800);
  await p.getByLabel("Card to add").selectOption({ label: "XVII · The Star" }); await p.getByRole("button", { name: "Add card" }).click();
  await p.getByLabel("Summary text").fill("A hopeful card. Trust the slow healing."); await p.getByRole("button", { name: "Save summary" }).click(); await p.waitForTimeout(1000);
  const dd = await data(); const dan1 = dd.bookings.find((x) => x.name === "Dan Gifted");
  ok("admin writes a reading summary from the booking panel", /slow healing/.test(dan1.summary) && JSON.parse(dan1.summary_cards)[0].id === 17);
  ok("panel then offers the client link and a WhatsApp message", await p.getByRole("button", { name: "Copy client link" }).isVisible() && (await p.locator("a[href*='wa.me'][href*='summary']").count()) === 1);
  await p.screenshot({ path: `${OUT}/l-admin-summary.png` });
}

ok("no JavaScript errors across the run", errs.length === 0, errs.join(" | ").slice(0, 300));
done(); await b.close();
