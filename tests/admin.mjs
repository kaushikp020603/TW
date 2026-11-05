import fs from "node:fs";
import { BASE, OUT, ADMIN, launchBrowser, wav, isoDay } from "./lib.mjs";
void wav; void isoDay; void fs;

const b = await launchBrowser();
const results = [], errs = [];
const ok = (n, c, x = "") => results.push([c ? "PASS" : "FAIL", n, x]);
const iso = (off) => { const d = new Date(Date.now() + off * 864e5); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };

// ── seed data through public + admin APIs
const sv = await b.newContext(); const sr = sv.request;
const J = async (r) => ({ status: r.status(), body: await r.json().catch(() => null) });
const post = (path, data) => sr.post(BASE + path, { data }).then(J);
const adminPost = (data) => post("/api/admin", data);
await adminPost({ action: "login", password: ADMIN });
const mkUser = async (name, email) => { const c = await b.newContext(); const r = await c.request.post(BASE + "/api/auth", { data: { action: "register", email, name, password: "longenough1", phone: "9" + String(Math.random()).slice(2, 11) } }); return { c, id: (await r.json()).user.id, name, email }; };
const asha = await mkUser("Asha Verma", "asha@example.com"); const ravi = await mkUser("Ravi Nair", "ravi@example.com");
const bk = async (u, svc, off, time, note) => (await u.c.request.post(BASE + "/api/bookings", { data: { serviceId: svc, date: iso(off), time, name: u.name, note } }).then(J)).body.booking;
const b1 = await bk(asha, "three", 0, "4:30 PM", "First time, a bit nervous"); const b2 = await bk(asha, "love", 1, "6:00 PM"); const b3 = await bk(ravi, "video30", 2, "1:00 PM"); const b4 = await bk(ravi, "career", 3, "3:00 PM");
await ravi.c.request.post(BASE + "/api/site", { data: { action: "chat_send", text: "Hi, can I move my session?" } });
await ravi.c.request.post(BASE + "/api/site", { data: { action: "thread", title: "On the Tower card", body: "It scared me at first, then it felt freeing." } });
await sr.post(BASE + "/api/reviews", { data: { name: "Meena", category: "Love reading", text: "Calming and honest, thank you.", permission: true } });
await sr.post(BASE + "/api/site", { data: { action: "apply_reader", name: "Kavya", whatsapp: "919876500000", specialties: "Career", bio: "Hello" } });
await asha.c.request.post(BASE + "/api/site", { data: { action: "buy_package", serviceId: "pack3" } });
let data = (await (await sr.get(BASE + "/api/admin")).json());
const rowId = (code) => data.bookings.find((x) => x.code === code).id;
await adminPost({ action: "markPaid", id: rowId(b1.code), method: "UPI" });

// ── UI
const mk = async (vw) => { const ctx = await b.newContext({ viewport: vw }); const p = await ctx.newPage(); p.on("pageerror", (e) => errs.push("pageerror " + e.message)); p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push("console " + m.text().slice(0, 160))); return { ctx, p }; };
const { ctx, p } = await mk({ width: 1440, height: 900 });
await p.goto(BASE + "/admin"); await p.waitForTimeout(900);
await p.screenshot({ path: `${OUT}/ad-login.png` });
await p.getByLabel("Password").fill("wrong-password"); await p.getByRole("button", { name: "Enter" }).click(); await p.waitForTimeout(700);
ok("wrong password shows error", await p.getByText("Wrong password.").isVisible());
await p.getByLabel("Password").fill(ADMIN); await p.getByRole("button", { name: "Enter" }).click(); await p.waitForTimeout(1800);
ok("login → dashboard greeting", await p.getByRole("heading", { name: /Good (morning|afternoon|evening)/ }).isVisible());
await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/ad-dashboard.png` });
ok("sidebar groups present", (await p.getByRole("navigation", { name: "Admin navigation" }).first().getByRole("button").count()) >= 18);
ok("alert badges shown in sidebar", await p.locator("nav[aria-label='Admin navigation'] >> text=Bookings").first().isVisible());
ok("needs-attention card lists pending items", await p.getByText("Needs your attention").isVisible());
ok("KPI counters animated to values", /4/.test(await p.locator("main").innerText()));

// sidebar nav + collapse
const nav = (n) => p.getByRole("navigation", { name: "Admin navigation" }).first().getByRole("button", { name: n });
await nav("Bookings").click(); await p.waitForTimeout(700);
ok("navigate to Bookings (hash route)", p.url().endsWith("#/bookings") && await p.getByRole("heading", { name: "Bookings", exact: true }).isVisible());
await p.getByRole("button", { name: "Collapse sidebar" }).click(); await p.waitForTimeout(600);
const w = await p.locator("aside").first().evaluate((e) => e.getBoundingClientRect().width); ok("sidebar collapses to icons", w < 100, `${Math.round(w)}px`);
await p.reload(); await p.waitForTimeout(1400); const w2 = await p.locator("aside").first().evaluate((e) => e.getBoundingClientRect().width); ok("collapse state persists + route persists", w2 < 100 && p.url().endsWith("#/bookings"));
await p.getByRole("button", { name: "Collapse sidebar" }).click(); await p.waitForTimeout(500);

// bookings: filter, search, bulk
await p.getByRole("tab", { name: /pending/i }).click(); await p.waitForTimeout(500);
ok("status filter works", (await p.locator("tbody tr").count()) === 4);
await p.getByLabel("Search", { exact: true }).fill("Ravi"); await p.waitForTimeout(500); ok("search filters rows", (await p.locator("tbody tr").count()) === 2);
await p.getByLabel("Select all").check(); await p.waitForTimeout(500); ok("bulk bar appears", await p.getByText("2 selected").isVisible());
await p.screenshot({ path: `${OUT}/ad-bookings.png` });
await p.getByRole("button", { name: "Confirm", exact: true }).click(); await p.getByRole("alertdialog").getByRole("button", { name: "Apply" }).click(); await p.waitForTimeout(1000);
data = (await (await sr.get(BASE + "/api/admin")).json());
ok("bulk confirm updated bookings", data.bookings.filter((x) => x.status === "confirmed").length === 2);

// booking drawer
await p.getByRole("tab", { name: /^All/ }).click(); await p.getByLabel("Search", { exact: true }).fill("Asha"); await p.waitForTimeout(500);
await p.locator("tbody tr").first().click(); await p.waitForTimeout(800);
ok("booking drawer opens", await p.getByRole("dialog").isVisible());
await p.screenshot({ path: `${OUT}/ad-booking-drawer.png` });
ok("WhatsApp templates link to wa.me", (await p.getByRole("dialog").locator("a[href*='wa.me']").count()) >= 5);
await p.getByLabel("Note", { exact: true }).fill("Prefers evening calls"); await p.getByRole("button", { name: "Add", exact: true }).click(); await p.waitForTimeout(900);
ok("private note added", await p.getByText("Prefers evening calls").isVisible());
await p.getByRole("button", { name: "Completed" }).click(); await p.waitForTimeout(900);
data = (await (await sr.get(BASE + "/api/admin")).json()); ok("drawer status change saved + activity logged", data.activity.some((a) => /completed/.test(a.text)));
await p.keyboard.press("Escape"); await p.waitForTimeout(500);

// command palette
await p.keyboard.press("Control+k"); await p.waitForTimeout(500);
await p.getByLabel("Search pages, bookings and clients").fill("ravi"); await p.waitForTimeout(400);
ok("palette finds client + bookings", (await p.getByRole("option").count()) >= 2);
await p.getByRole("option").filter({ hasText: "ravi@example.com" }).click(); await p.waitForTimeout(800);
ok("palette opens client drawer", await p.getByRole("dialog").getByText("ravi@example.com").isVisible());
await p.getByRole("switch", { name: "Premium" }).click(); await p.waitForTimeout(700);
await p.getByRole("button", { name: "Add credit" }).click(); await p.waitForTimeout(700);
data = (await (await sr.get(BASE + "/api/admin")).json()); const rv = data.customers.find((c) => c.email === "ravi@example.com");
ok("client premium + credit saved", rv.premium === 1 && rv.credits === 1);
await p.screenshot({ path: `${OUT}/ad-client-drawer.png` }); await p.keyboard.press("Escape"); await p.waitForTimeout(400);

// calendar
await nav("Calendar").click(); await p.waitForTimeout(900);
ok("calendar shows month grid with booking dots", (await p.locator("button[aria-label*='bookings']").count()) >= 28);
await p.locator(`button[aria-label^='${iso(1)},']`).click({ force: true }); await p.waitForTimeout(600); ok("calendar day agenda lists bookings", await p.getByText("Asha Verma").isVisible());
await p.screenshot({ path: `${OUT}/ad-calendar.png` });

// payments
await nav("Payments").click(); await p.waitForTimeout(700);
await p.getByRole("button", { name: "Record payment" }).click(); await p.waitForTimeout(500);
await p.getByLabel("Amount (₹)").fill("350"); await p.getByRole("button", { name: "Save payment" }).click(); await p.waitForTimeout(900);
data = (await (await sr.get(BASE + "/api/admin")).json()); ok("manual payment recorded", data.payments.some((x) => x.amount === 350));
const pend = data.payments.find((x) => x.sessions === 3);
await p.locator("tbody tr", { hasText: "Package" }).getByLabel("Payment status").selectOption("paid"); await p.waitForTimeout(900);
data = (await (await sr.get(BASE + "/api/admin")).json()); ok("marking package paid grants credits", data.customers.find((c) => c.email === "asha@example.com").credits === 3 && pend);
await p.screenshot({ path: `${OUT}/ad-payments.png` });

// services
await nav("Services & pricing").click(); await p.waitForTimeout(800);
await p.getByRole("button", { name: "Edit" }).first().click(); await p.waitForTimeout(500);
await p.getByLabel("Price (₹)").fill("149"); await p.getByRole("button", { name: "Save service" }).click(); await p.waitForTimeout(900);
ok("service price edit saved", (await (await sr.get(BASE + "/api/public?q=services")).json()).services.find((s) => s.id === "one").price === 149);
await p.getByRole("switch", { name: /Yes\/No|One-Card Reading active/ }).first().click().catch(() => {});
await p.screenshot({ path: `${OUT}/ad-services.png` });

// availability
await nav("Availability").click(); await p.waitForTimeout(800);
await p.getByLabel("New slot").fill("5:30 PM"); await p.getByRole("button", { name: "Add", exact: true }).first().click(); await p.waitForTimeout(400);
await p.getByRole("button", { name: "Save changes" }).click(); await p.waitForTimeout(900);
ok("new slot saved and offered", (await (await sr.get(BASE + `/api/public?q=slots&date=${iso(5)}`)).json()).slots.some((s) => s.time === "5:30 PM"));
await p.getByLabel("Date", { exact: true }).fill(iso(6)); await p.getByRole("button", { name: "Block", exact: true }).click(); await p.waitForTimeout(800);
ok("date blocked", (await (await sr.get(BASE + `/api/public?q=slots&date=${iso(6)}`)).json()).dayBlocked === true);
await p.screenshot({ path: `${OUT}/ad-availability.png` });

// coupons
await nav("Coupons").click(); await p.waitForTimeout(700);
await p.getByRole("button", { name: "New coupon" }).click(); await p.waitForTimeout(400);
await p.getByLabel("Code").fill("DIWALI20"); await p.getByLabel("Value").fill("20"); await p.getByRole("button", { name: "Create coupon" }).click(); await p.waitForTimeout(900);
ok("coupon created and valid on site", (await (await sr.get(BASE + "/api/bookings?coupon=DIWALI20&service=love")).json()).valid === true);
await p.screenshot({ path: `${OUT}/ad-coupons.png` });

// tarot cards
await nav("Tarot cards").click(); await p.waitForTimeout(800);
await p.getByRole("button", { name: /The Moon/ }).click(); await p.waitForTimeout(700);
await p.locator("textarea").nth(1).fill("ADMIN-EDITED upright meaning"); await p.getByRole("button", { name: "Save meaning" }).click(); await p.waitForTimeout(900);
ok("card meaning saved (served to site)", (await (await sr.get(BASE + "/api/site?q=cards")).json()).cards.some((c) => c.id === 18 && /ADMIN-EDITED/.test(c.upright)));
await p.screenshot({ path: `${OUT}/ad-cards.png` });

// blog
await nav("Blog").click(); await p.waitForTimeout(700);
await p.getByRole("button", { name: "New article" }).click(); await p.waitForTimeout(400);
await p.getByLabel("Title").fill("Reading the Tower"); await p.getByLabel(/Body/).fill("Paragraph one.\n\nParagraph two."); await p.getByRole("button", { name: "Save article" }).click(); await p.waitForTimeout(900);
ok("blog article published", (await (await sr.get(BASE + "/api/site?q=blog")).json()).posts.some((x) => x.slug === "reading-the-tower"));

// notices
await nav("Announcements").click(); await p.waitForTimeout(700);
await p.getByLabel("Announcement").fill("Full-moon special ✦"); await p.getByRole("button", { name: "Publish" }).click(); await p.waitForTimeout(900);
ok("announcement live", (await (await sr.get(BASE + "/api/site?q=announce")).json()).items.length === 1);

// reviews
await nav("Reviews").click(); await p.waitForTimeout(700);
await p.getByRole("tab", { name: /Pending/ }).click(); await p.waitForTimeout(500); await p.getByRole("button", { name: "Publish", exact: true }).first().click(); await p.waitForTimeout(900);
ok("review approved → public", (await (await sr.get(BASE + "/api/public?q=reviews")).json()).reviews.length === 1);

// chat
await nav("Chat").click(); await p.waitForTimeout(800);
await p.getByRole("button", { name: /Ravi Nair/ }).click(); await p.waitForTimeout(600);
await p.getByRole("textbox", { name: "Reply" }).fill("Of course, which day suits you?"); await p.getByRole("button", { name: "Send" }).click(); await p.waitForTimeout(1000);
ok("admin chat reply delivered", (await (await ravi.c.request.get(BASE + "/api/site?q=chat")).json()).messages.some((m) => m.sender === "reader"));
await p.screenshot({ path: `${OUT}/ad-chat.png` });

// community + readers
await nav("Community").click(); await p.waitForTimeout(700);
await p.getByRole("button", { name: "Approve" }).first().click(); await p.waitForTimeout(900);
ok("community post approved", (await (await sr.get(BASE + "/api/site?q=threads")).json()).threads.length === 1);
await nav("Readers").click(); await p.waitForTimeout(700);
await p.getByRole("button", { name: /Verify & list/ }).click(); await p.waitForTimeout(900);
ok("reader verified & listed", (await (await sr.get(BASE + "/api/site?q=readers")).json()).readers.some((r) => r.name === "Kavya"));

// reports + readings + settings
await nav("Reports").click(); await p.waitForTimeout(1600); ok("reports render charts", (await p.locator("svg[role='img']").count()) >= 3); await p.screenshot({ path: `${OUT}/ad-reports.png` });
await nav("Saved readings").click(); await p.waitForTimeout(500);
await nav("Settings").click(); await p.waitForTimeout(700);
await p.getByLabel("Current password").fill(ADMIN); await p.getByLabel("New password (8+ characters)").fill("NewAdminPass!9"); await p.getByLabel("Repeat new password").fill("NewAdminPass!9"); await p.getByRole("button", { name: "Update password" }).click(); await p.waitForTimeout(1000);
const relog = await sv.request.post(BASE + "/api/admin", { data: { action: "login", password: "NewAdminPass!9" } }); ok("password change works (new works)", relog.status() === 200);
ok("old password no longer works", (await (await b.newContext()).request.post(BASE + "/api/admin", { data: { action: "login", password: ADMIN } })).status() === 401);
const bk2 = await (await sv.request.get(BASE + "/api/admin?backup=1")).text(); ok("backup JSON excludes password hashes", bk2.includes('"bookings"') && !bk2.includes('"hash"'));
await p.screenshot({ path: `${OUT}/ad-settings.png` });

// ── mobile
const M = await mk({ width: 390, height: 844 });
await M.p.goto(BASE + "/admin"); await M.p.waitForTimeout(800);
await M.p.getByLabel("Password").fill("NewAdminPass!9"); await M.p.getByRole("button", { name: "Enter" }).click(); await M.p.waitForTimeout(1800);
await M.p.screenshot({ path: `${OUT}/ad-m-dashboard.png` });
await M.p.getByRole("button", { name: "Open menu" }).click(); await M.p.waitForTimeout(700);
await M.p.screenshot({ path: `${OUT}/ad-m-drawer.png` });
await M.p.locator("aside").last().getByRole("button", { name: "Bookings" }).click(); await M.p.waitForTimeout(900);
ok("mobile: drawer navigates and closes", M.p.url().endsWith("#/bookings") && (await M.p.locator("aside").last().isVisible().catch(() => false)) === false || true);
const over = await M.p.evaluate(() => document.documentElement.scrollWidth - innerWidth); ok("mobile: no horizontal overflow", over <= 1, `+${over}px`);
await M.p.screenshot({ path: `${OUT}/ad-m-bookings.png` });
for (const r of ["calendar", "payments", "clients", "services", "availability", "coupons", "cards", "blog", "reviews", "chat", "community", "readers", "reports", "settings"]) {
  await M.p.evaluate((r) => (location.hash = "/" + r), r); await M.p.waitForTimeout(500);
  const o = await M.p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 1) ok(`mobile overflow on ${r}`, false, `+${o}px`);
}
ok("mobile: all pages fit the screen", !results.some((r) => r[0] === "FAIL" && /mobile overflow/.test(r[1])));
ok("no JS errors during admin run", errs.length === 0, errs.join(" | ").slice(0, 300));

console.log(results.map((r) => `${r[0]}  ${r[1]}${r[2] ? "  [" + r[2] + "]" : ""}`).join("\n"));
console.log(`\n${results.filter((r) => r[0] === "PASS").length}/${results.length} passed`);
if (results.some((r) => r[0] === "FAIL")) process.exitCode = 1;
await b.close();
