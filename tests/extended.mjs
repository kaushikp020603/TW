import fs from "node:fs";
import { BASE, OUT, ADMIN, launchBrowser, wav, isoDay } from "./lib.mjs";
void wav; void isoDay; void fs;

const b = await launchBrowser();
const results = []; const errs = [];
const ok = (name, cond, extra = "") => results.push([cond ? "PASS" : "FAIL", name, extra]);
const mk = async (vw = { width: 1440, height: 900 }) => {
  const ctx = await b.newContext({ viewport: vw }); const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push("pageerror " + e.message));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push("console " + m.text().slice(0, 200)));
  await p.addInitScript(() => { sessionStorage.setItem("arcana-intro", "1"); localStorage.setItem("stc-consent", "essential"); });
  await p.goto(BASE, { waitUntil: "load" }); await p.waitForTimeout(800); return { ctx, p };
};
const call = (p) => async (path, body, method = "POST") => p.evaluate(async ([path, body, method]) => {
  const r = await fetch(path, body === undefined ? {} : { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); return { status: r.status, body: await r.json().catch(() => null), text: "" };
}, [path, body, method]);

const U = await mk(); const u = call(U.p);
const A = await mk(); const a = call(A.p);
await a("/api/admin", { action: "login", password: ADMIN });
const adm = (body) => a("/api/admin", body);
const adminData = async () => (await a("/api/admin")).body;

// ── pages load
for (const path of ["/insights", "/journey", "/community", "/blog", "/readers", "/chat", "/admin"]) {
  const r = await U.p.goto(BASE + path, { waitUntil: "load" }); await U.p.waitForTimeout(500);
  ok(`page ${path} loads`, r.status() === 200);
}

// ── numerology / zodiac / compatibility (UI)
await U.p.goto(BASE + "/insights"); await U.p.waitForTimeout(600);
await U.p.locator("#d").fill("1990-05-15"); await U.p.getByRole("button", { name: "Reveal my reading" }).click(); await U.p.waitForTimeout(1500);
const txt = await U.p.locator("main").innerText();
ok("life path 3 (The Creator) for 1990-05-15", /Life path 3/i.test(txt) && /The Creator/.test(txt));
ok("zodiac Taurus + tarot correspondence", /Taurus/.test(txt) && /The Hierophant/.test(txt));
await U.p.screenshot({ path: `${OUT}/n-insights.png` });
await U.p.getByRole("tab", { name: "Compatibility" }).click();
await U.p.getByLabel("Person 1 name").fill("Asha"); await U.p.getByLabel("Person 1 date of birth").fill("1990-05-15");
await U.p.getByLabel("Person 2 name").fill("Ravi"); await U.p.getByLabel("Person 2 date of birth").fill("1988-11-02");
await U.p.getByRole("button", { name: "Read our compatibility" }).click(); await U.p.waitForTimeout(2200);
const ct = await U.p.locator("main").innerText();
ok("compatibility shows score + 3 cards", /\d+%/.test(ct) && /the bond/i.test(ct) && /Asha/.test(ct) && /Ravi/.test(ct));
await U.p.screenshot({ path: `${OUT}/n-compat.png` });

// ── mood-based reading (UI)
await U.p.goto(BASE + "/reading"); await U.p.waitForTimeout(1500);
await U.p.getByRole("button", { name: /Restless/ }).click();
ok("mood sets spread + question", (await U.p.locator("#q").inputValue()).includes("right time") && (await U.p.locator("#reading").getByRole("button", { name: /^Yes \/ No/ }).getAttribute("aria-pressed")) === "true");

// ── journal (guest) + reminder download
await U.p.goto(BASE + "/journey"); await U.p.waitForTimeout(700);
await U.p.getByLabel("Journal entry").fill("Today the Moon card stayed with me."); await U.p.getByRole("button", { name: /Hopeful/ }).click(); await U.p.getByRole("button", { name: "Add note" }).click(); await U.p.waitForTimeout(500);
ok("guest journal entry in timeline", await U.p.getByText("Moon card stayed with me").isVisible());
const [dl] = await Promise.all([U.p.waitForEvent("download"), U.p.getByRole("button", { name: "Add reminder" }).click()]);
const ics = fs.readFileSync(await dl.path(), "utf8");
ok("daily reminder .ics downloads (recurring)", dl.suggestedFilename().endsWith(".ics") && ics.includes("RRULE:FREQ=DAILY") && ics.includes("BEGIN:VALARM"));
await U.p.screenshot({ path: `${OUT}/n-journey.png` });

// ── account + premium/priority/packages/credits
const email = `p${Date.now()}@example.com`;
let r = await u("/api/auth", { action: "register", email, name: "Priya", password: "longenough1", phone: "9000000001" }); ok("register", r.status === 200);
const uid = r.body.user.id;
const day = new Date(Date.now() + (3 + Math.floor(Math.random() * 9)) * 864e5); const date = new Date(day.getTime() - day.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
r = await u(`/api/public?q=slots&date=${date}`); ok("non-premium: priority slots hidden", !r.body.slots.some((s) => s.priority) && r.body.priorityHidden === true);
r = await u("/api/bookings", { serviceId: "one", date, time: "8:00 AM", name: "Priya" }); ok("non-premium can't book priority slot (403)", r.status === 403);
await adm({ action: "userSet", id: uid, premium: true, credits: 0 });
r = await u(`/api/public?q=slots&date=${date}`); ok("premium: priority slots visible", r.body.slots.some((s) => s.priority && s.time === "8:00 AM"));
r = await u("/api/bookings", { serviceId: "one", date, time: "8:00 AM", name: "Priya" }); ok("premium books priority slot", r.status === 200);
// package purchase
r = await u("/api/site", { action: "buy_package", serviceId: "pack3" }); ok("package order created", r.status === 200);
let d = await adminData(); const pay = d.payments.find((p) => p.status === "pending" && p.sessions === 3);
ok("pending package payment visible to admin", !!pay);
r = await u("/api/bookings", { serviceId: "one", date, time: "10:00 AM", name: "Priya", useCredit: true }); ok("can't use credit before payment (400)", r.status === 400);
await adm({ action: "setPayment", id: pay.id, status: "paid" });
r = await u("/api/site?q=account"); ok("credits added after payment confirmed", r.body.credits === 3);
r = await u("/api/bookings", { serviceId: "one", date, time: "10:00 AM", name: "Priya", useCredit: true }); ok("booking with credit costs ₹0", r.status === 200 && r.body.booking.final === 0);
if (!r.body.booking) { console.log("CREDIT BOOKING RESPONSE:", r.status, JSON.stringify(r.body)); }
const creditBk = r.body.booking?.code;
r = await u("/api/site?q=account"); ok("credit deducted", r.body.credits === 2);
await u("/api/bookings", { code: creditBk, action: "cancel" }, "PATCH"); r = await u("/api/site?q=account"); ok("credit restored on cancel", r.body.credits === 3);
await adm({ action: "setPayment", id: pay.id, status: "refunded" }); r = await u("/api/site?q=account"); ok("refund removes package credits", r.body.credits === 0);

// ── video / voice sessions
r = await u("/api/bookings", { serviceId: "video30", date, time: "4:30 PM", name: "Priya" }); ok("video session booked", r.status === 200);
const vb = r.body.booking.code; d = await adminData(); const vrow = d.bookings.find((x) => x.code === vb);
await adm({ action: "setStatus", id: vrow.id, status: "confirmed" }); r = await u("/api/bookings"); const vmine = r.body.bookings.find((x) => x.code === vb);
ok("confirmed video booking gets meeting link", /meet\.jit\.si\/SpillTheCards-/.test(vmine.meeting_link || ""), vmine.meeting_link);
r = await u("/api/bookings", { serviceId: "voice30", date, time: "6:00 PM", name: "Priya" }); d = await adminData();
await adm({ action: "setStatus", id: d.bookings.find((x) => x.code === r.body.booking.code).id, status: "confirmed" }); r = await u("/api/bookings");
ok("voice session link is audio-only", r.body.bookings.some((x) => x.kind === "voice" && /startWithVideoMuted/.test(x.meeting_link || "")));

// ── payments + revenue analytics
d = await adminData(); const before = d.stats.revenueAll;
await adm({ action: "markPaid", id: vrow.id, method: "UPI" }); d = await adminData();
ok("mark paid records payment + revenue", d.stats.revenueAll === before + 999, `${before} → ${d.stats.revenueAll}`);
ok("weekly (7) and monthly (12) analytics present", d.weekly.length === 7 && d.monthly.length === 12);
await adm({ action: "addPayment", label: "Cash reading", amount: 300, method: "Cash", status: "failed" }); d = await adminData();
ok("failed payment not counted as revenue", d.stats.revenueAll === before + 999);

// ── chat
r = await u("/api/site", { action: "chat_send", text: "Hello reader" }); ok("user sends chat", r.status === 200);
d = await adminData(); ok("admin sees conversation", d.chats.some((c) => c.id === uid));
await adm({ action: "chatReply", userId: uid, text: "Hi Priya, welcome." }); r = await u("/api/site?q=chat");
ok("user receives reader reply", r.body.messages.some((m) => m.sender === "reader" && /welcome/.test(m.text)));
const guestChat = await call((await mk()).p)("/api/site?q=chat"); ok("chat private (guest sees none)", guestChat.body.messages.length === 0);

// ── community moderation
const G = await mk(); const g = call(G.p);
r = await g("/api/site", { action: "thread", title: "Hello all", body: "My first post here." }); ok("guest can't post (401)", r.status === 401);
r = await u("/api/site", { action: "thread", title: "Moon card thoughts", body: "What does the Moon mean to you?" }); ok("member posts", r.status === 200);
r = await g("/api/site?q=threads"); ok("post hidden until approved", r.body.threads.length === 0);
d = await adminData(); await adm({ action: "approveThread", id: d.threads[0].id, approved: true });
r = await g("/api/site?q=threads"); ok("approved post visible", r.body.threads.length === 1);
await u("/api/site", { action: "reply", threadId: r.body.threads[0].id, body: "Intuition, mostly." }); r = await g("/api/site?q=threads"); ok("reply hidden until approved", r.body.threads[0].replies.length === 0);
d = await adminData(); await adm({ action: "approveReply", id: d.replies[0].id, approved: true }); r = await g("/api/site?q=threads"); ok("approved reply visible", r.body.threads[0].replies.length === 1);
await G.p.goto(BASE + "/community"); await G.p.waitForTimeout(900); ok("community page shows post", await G.p.getByText("Moon card thoughts").isVisible());

// ── readers marketplace
r = await g("/api/site?q=readers"); ok("main reader listed", r.body.readers.length === 1 && r.body.readers[0].main === 1);
r = await g("/api/site", { action: "apply_reader", name: "Meera", whatsapp: "919811122233", specialties: "Love", bio: "Hello" }); ok("reader application accepted", r.status === 200);
r = await g("/api/site?q=readers"); ok("unverified reader hidden", r.body.readers.length === 1);
d = await adminData(); await adm({ action: "readerVerify", id: d.readers.find((x) => x.name === "Meera").id, verified: true });
r = await g("/api/site?q=readers"); ok("verified reader listed", r.body.readers.some((x) => x.name === "Meera"));
await G.p.goto(BASE + "/readers"); await G.p.waitForTimeout(900); ok("readers page lists Meera w/ WhatsApp link", (await G.p.locator("a[href*='wa.me/919811122233']").count()) === 1);
await G.p.screenshot({ path: `${OUT}/n-readers.png` });

// ── blog
await adm({ action: "savePost", title: "How to read the Moon card", body: "First paragraph about the Moon.\n\nSecond paragraph about intuition." });
r = await g("/api/site?q=blog"); ok("blog post published", r.body.posts.some((p) => p.slug === "how-to-read-the-moon-card"));
await G.p.goto(BASE + "/blog/how-to-read-the-moon-card"); await G.p.waitForTimeout(1000);
ok("blog article page renders", await G.p.getByText("Second paragraph about intuition").isVisible());
await G.p.screenshot({ path: `${OUT}/n-blog.png` });

// ── announcements + card management
await adm({ action: "addAnnouncement", text: "Full-moon special: 20% off this week" });
await G.p.addInitScript(() => sessionStorage.removeItem("arcana-notice-x"));
await G.p.goto(BASE); await G.p.waitForTimeout(1500); ok("announcement banner shows on site", await G.p.getByText("Full-moon special").isVisible());
await adm({ action: "saveCard", id: 18, keywords: "dreams · illusion · intuition", upright: "CUSTOM-MOON-MEANING for tests.", reversed: "Clarity returns.", love: "x", career: "y" });
await G.p.goto(BASE + "/cards/the-moon"); await G.p.waitForTimeout(1500);
ok("admin-edited card meaning appears on site", await G.p.getByText("CUSTOM-MOON-MEANING").first().isVisible());
await adm({ action: "resetCard", id: 18 });

// ── reading management
await u("/api/readings", { spread: "three", category: "love", question: "q?", cards: [{ id: 3, reversed: false }], consent: true });
d = await adminData(); ok("admin sees saved readings", d.readings.length >= 1);

console.log(results.map((r) => `${r[0]}  ${r[1]}${r[2] ? "  [" + r[2] + "]" : ""}`).join("\n"));
console.log(`\n${results.filter((r) => r[0] === "PASS").length}/${results.length} passed`);
if (results.some((r) => r[0] === "FAIL")) process.exitCode = 1;
console.log("JS ERRORS:", JSON.stringify(errs));
await b.close();
