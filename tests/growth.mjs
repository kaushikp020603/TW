// Covers: password reset, UPI payment box, SEO, analytics, health, backups, trash/undo, leads, import, reminders,
// day sheet, share image, floating WhatsApp, PWA/offline, mobile booking steps, larger text, new admin pages.
import { BASE, OUT, ADMIN, launchBrowser, reporter, isoDay } from "./lib.mjs";

const { ok, done } = reporter("growth features");
const b = await launchBrowser();
const errs = [];
const J = async (r) => ({ status: r.status(), body: await r.json().catch(() => null), headers: r.headers() });
const mkPage = async (vw = { width: 1440, height: 900 }, opts = {}) => {
  const ctx = await b.newContext({ viewport: vw, ...opts }); const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push("pageerror " + e.message));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource|ERR_|net::/.test(m.text()) && errs.push("console " + m.text().slice(0, 160)));
  await p.addInitScript(() => sessionStorage.setItem("arcana-intro", "1"));
  return { ctx, p };
};

// API actors (each has its own cookie jar)
const adminCtx = await b.newContext(); const A = adminCtx.request;
const anonCtx = await b.newContext(); const anon = anonCtx.request;
const post = (req, path, data, method = "POST") => req.fetch(BASE + path, { method, data, headers: { "content-type": "application/json" } }).then(J);
await post(A, "/api/admin", { action: "login", password: ADMIN });
const adm = (data) => post(A, "/api/admin", data);
const adminData = async () => (await A.get(BASE + "/api/admin").then(J)).body;

// ───────────── SEO ─────────────
let r = await anon.get(BASE + "/robots.txt"); let t = await r.text();
ok("robots.txt blocks admin/api and lists the sitemap", r.status() === 200 && /Disallow: \/admin/.test(t) && /Sitemap:/.test(t));
r = await anon.get(BASE + "/sitemap.xml"); t = await r.text();
ok("sitemap lists the home page, About, and all 22 card pages", r.status() === 200 && t.includes("/about") && t.includes("/cards/the-fool") && t.includes("/cards/the-world") && (t.match(/\/cards\/[a-z-]+</g) || []).length >= 22);
r = await anon.get(BASE + "/manifest.webmanifest"); let man = await r.json();
ok("web app manifest has name, icons, start_url and shortcuts", man.name && man.start_url === "/" && man.icons.length >= 3 && man.shortcuts.length >= 2 && man.display === "standalone");
for (const icon of ["/icons/icon-192.png", "/icons/icon-512.png", "/icons/maskable-512.png", "/icons/apple-touch-icon.png"]) { r = await anon.get(BASE + icon); if (r.status() !== 200 || r.headers()["content-type"] !== "image/png") ok(`icon ${icon}`, false); }
ok("all PWA icons are served as PNG", true);
r = await anon.get(BASE + "/"); t = await r.text();
ok("home page has title, description, Open Graph and JSON-LD structured data", /<title>Spill the Cards/.test(t) && /name="description"/.test(t) && /property="og:title"/.test(t) && /application\/ld\+json/.test(t) && /ProfessionalService/.test(t) && /rel="manifest"/.test(t));
r = await anon.get(BASE + "/cards/the-moon"); t = await r.text();
ok("card page: SEO title, FAQ + Article JSON-LD and real content", r.status() === 200 && /The Moon Tarot Card Meaning/.test(t) && /FAQPage/.test(t) && /"Article"/.test(t) && /reversed/i.test(t) && /canonical/.test(t));
r = await anon.get(BASE + "/cards/not-a-card"); ok("unknown card page returns 404", r.status() === 404);
r = await anon.get(BASE + "/cards"); t = await r.text(); ok("cards index links to every card", r.status() === 200 && (t.match(/href="\/cards\/[a-z-]+"/g) || []).length >= 22);
r = await anon.get(BASE + "/about"); t = await r.text(); ok("About page has FAQ structured data and booking call to action", r.status() === 200 && /FAQPage/.test(t) && /How a reading works/.test(t));
r = await anon.get(BASE + "/this-page-does-not-exist"); t = await r.text(); ok("themed 404 page", r.status() === 404 && /slipped through the veil/.test(t));
r = await anon.get(BASE + "/offline"); ok("offline page exists", r.status() === 200 && /out of reach/.test(await r.text()));
r = await anon.get(BASE + "/sw.js"); ok("service worker script is served", r.status() === 200 && /fetch/.test(await r.text()));
await adm({ action: "saveCard", id: 18, keywords: "dreams · illusion", upright: "EDITED-MOON-SEO-TEXT here.", reversed: "r", love: "l", career: "c" });
r = await anon.get(BASE + "/cards/the-moon"); ok("admin card edits appear on the SEO card page", /EDITED-MOON-SEO-TEXT/.test(await r.text()));
await adm({ action: "resetCard", id: 18 });
await adm({ action: "savePost", title: "SEO Blog Test Post", body: "Hello world paragraph for the sitemap." });
r = await anon.get(BASE + "/sitemap.xml"); ok("published blog posts join the sitemap", /\/blog\/seo-blog-test-post/.test(await r.text()));
r = await anon.get(BASE + "/blog/seo-blog-test-post"); ok("blog post page has its own title tag", /<title>SEO Blog Test Post/.test(await r.text()));

// ───────────── health + analytics ─────────────
r = await anon.get(BASE + "/api/health").then(J); ok("health endpoint reports database up", r.status === 200 && r.body.ok === true && r.body.db === "up");
for (let i = 0; i < 3; i++) await anon.post(BASE + "/api/track", { data: { type: "pageview", path: "/", ref: "https://google.com/search?q=tarot" }, headers: { "content-type": "application/json" } });
await anon.post(BASE + "/api/track", { data: { type: "reading_start", path: "/" }, headers: { "content-type": "application/json" } });
await anon.post(BASE + "/api/track", { data: { type: "reading_complete", path: "/" }, headers: { "content-type": "application/json" } });
await anon.post(BASE + "/api/track", { data: { type: "evil_type", path: "/" }, headers: { "content-type": "application/json" } });
await anon.post(BASE + "/api/track", { data: { type: "error", path: "/cards", msg: "TypeError: demo error for tests" }, headers: { "content-type": "application/json" } });
r = await adm({ action: "analytics", days: 30 });
ok("analytics: page views, unique visitor and funnel counted", r.body.pageviews === 3 && r.body.visitors === 1 && r.body.funnel[1][1] === 1 && r.body.funnel[2][1] === 1);
ok("analytics: top pages and referrer sources", r.body.pages[0].path === "/" && r.body.sources.some((s) => s.r === "google.com"));
ok("analytics: unknown event types are ignored", !JSON.stringify(r.body).includes("evil_type"));
ok("analytics: browser errors are logged for the admin", r.body.errors.some((e) => /demo error/.test(e.message)));
r = await post(anon, "/api/admin", { action: "analytics", days: 30 }); ok("analytics data needs the admin login", r.status === 401);
let d = await adminData(); ok("error count shows as an alert", d.alerts.errors >= 1);

// ───────────── password reset ─────────────
const email = `reset${Date.now()}@example.com`;
const userCtx = await b.newContext(); const U = userCtx.request;
r = await post(U, "/api/auth", { action: "register", email, name: "Rina Reset", password: "originalpass1", phone: "9000000042" }); const uid = r.body.user.id;
const oldSessionUser = (await U.get(BASE + "/api/auth").then(J)).body.user;
ok("(setup) account created and signed in", oldSessionUser?.email === email);
r = await post(anon, "/api/auth", { action: "forgot", email }); const known = r.body;
r = await post(anon, "/api/auth", { action: "forgot", email: "nobody@example.com" });
ok("forgot-password answers identically for unknown emails (no account leak)", r.status === 200 && JSON.stringify(r.body) === JSON.stringify(known) && known.emailSent === false);
d = await adminData(); ok("admin sees the reset request and an alert badge", d.resetRequests.some((x) => x.email === email) && d.alerts.resets >= 1);
r = await adm({ action: "resetLink", id: uid }); const link = r.body.url; const token = new URL(link).searchParams.get("token");
ok("admin can create a one-time reset link", r.status === 200 && /\/reset\?token=/.test(link) && token.length > 30);
d = await adminData(); ok("creating a link clears the pending request", !d.resetRequests.some((x) => x.email === email));
r = await post(anon, "/api/auth", { action: "reset", token: "bogus-token", password: "whatever123" }); ok("invalid token refused", r.status === 400);
r = await post(anon, "/api/auth", { action: "reset", token, password: "short" }); ok("weak new password refused", r.status === 400);
r = await post(anon, "/api/auth", { action: "reset", token, password: "brandnewpass9" }); ok("valid token sets the new password", r.status === 200);
r = await post(anon, "/api/auth", { action: "reset", token, password: "anotherpass9" }); ok("token is single-use", r.status === 400);
r = await post(anon, "/api/auth", { action: "login", email, password: "originalpass1" }); ok("old password no longer works", r.status === 401);
r = await post(anon, "/api/auth", { action: "login", email, password: "brandnewpass9" }); ok("new password works", r.status === 200);
ok("existing sessions were signed out after the reset", (await U.get(BASE + "/api/auth").then(J)).body.user === null);
r = await post(anon, "/api/admin", { action: "resetLink", id: uid }); ok("reset links need the admin login", r.status === 401);

// UI: forgot flow in the sign-in window + the reset page
{
  const { p } = await mkPage(); await p.goto(BASE); await p.waitForTimeout(1500);
  await p.getByRole("button", { name: "Sign in" }).first().click(); await p.waitForTimeout(500);
  await p.getByText("Forgot your password?").click(); await p.getByLabel("Email", { exact: true }).fill(email); await p.getByRole("button", { name: "Send reset help" }).click(); await p.waitForTimeout(900);
  ok("forgot-password window offers the WhatsApp route when email isn't configured", await p.getByRole("link", { name: /Message the reader on WhatsApp/ }).isVisible());
  const t2 = (await post(A, "/api/admin", { action: "resetLink", id: uid })).body.url;
  await p.goto(t2); await p.waitForTimeout(900);
  await p.getByLabel("New password (8+ characters)").fill("uipassword123"); await p.getByLabel("Repeat new password").fill("different999"); await p.getByRole("button", { name: "Update password" }).click(); await p.waitForTimeout(500);
  ok("reset page: mismatched passwords show an error", await p.getByText("don't match").isVisible());
  await p.getByLabel("Repeat new password").fill("uipassword123"); await p.getByRole("button", { name: "Update password" }).click(); await p.waitForTimeout(1000);
  ok("reset page: success message", await p.getByText("Password updated").isVisible());
  await p.screenshot({ path: `${OUT}/g-reset.png` });
}

// ───────────── UPI payment box ─────────────
r = await adm({ action: "saveBusiness", business: { upiId: "not a upi", instagram: "javascript:alert(1)", channel: "https://whatsapp.com/channel/abc" } }); r = (await anon.get(BASE + "/api/site?q=business").then(J)).body;
ok("invalid UPI ID and unsafe links are rejected", r.upiId === "" && r.instagram === "" && r.channel === "https://whatsapp.com/channel/abc");
const day = isoDay(6);
{
  const { p } = await mkPage(); await p.goto(BASE); await p.waitForTimeout(1400); await p.evaluate(() => document.getElementById("book").scrollIntoView()); await p.waitForTimeout(700);
  await p.locator("#book fieldset").nth(1).locator("button").nth(5).click(); await p.waitForTimeout(500);
  await p.getByRole("button", { name: "4:30 PM" }).click(); await p.locator("#nm").fill("Payer One"); await p.getByRole("button", { name: "Reserve this slot" }).click(); await p.waitForTimeout(1200);
  ok("no payment box until a UPI ID is configured", (await p.getByLabel("Pay with UPI").count()) === 0 && await p.getByText(/Reference [0-9A-F]{8}/).isVisible());
}
await adm({ action: "saveBusiness", business: { upiId: "arcana.test@okhdfc", upiName: "Spill the Cards", instagram: "https://instagram.com/arcana", channel: "https://whatsapp.com/channel/abc", aboutName: "Test Reader", aboutBio: "Para one.\n\nPara two.", aboutSpecialties: "Love", aboutExperience: "" } });
{
  const { p } = await mkPage(); await p.goto(BASE); await p.waitForTimeout(1400); await p.evaluate(() => document.getElementById("book").scrollIntoView()); await p.waitForTimeout(700);
  await p.locator("#book fieldset").nth(1).locator("button").nth(6).click(); await p.waitForTimeout(500);
  await p.getByRole("button", { name: "6:00 PM" }).click(); await p.locator("#nm").fill("Payer Two"); await p.getByRole("button", { name: "Reserve this slot" }).click(); await p.waitForTimeout(1500);
  const box = p.getByLabel("Pay with UPI"); ok("UPI payment box appears after booking", await box.isVisible());
  ok("payment box shows a QR code and the UPI ID", (await box.locator("img").count()) === 1 && (await box.getByText("arcana.test@okhdfc").count()) >= 1);
  const ref = (await p.getByText(/Reference [0-9A-F]{8}/).innerText()).split(" ")[1];
  const paid = await box.getByRole("link", { name: /I've paid/ }).getAttribute("href"); ok("'I've paid' opens WhatsApp with the reference and amount", paid.includes("919027845106") && decodeURIComponent(paid).includes(ref) && /%E2%82%B9199/.test(paid));
  const upiHref = await box.getByRole("link", { name: "Open UPI app" }).getAttribute("href"); ok("UPI deep link carries payee, amount and note", /^upi:\/\/pay\?pa=arcana\.test%40okhdfc/.test(upiHref) && /am=199/.test(upiHref) && upiHref.includes("ARCANA"));
  await p.screenshot({ path: `${OUT}/g-payment.png` });
}

// ───────────── footer: weekly-card signup, WhatsApp float, larger text, social links ─────────────
{
  const { p } = await mkPage(); await p.goto(BASE); await p.waitForTimeout(1500);
  const wa = await p.locator("a[aria-label='Chat on WhatsApp']").getAttribute("href"); ok("floating WhatsApp button links to the business number", wa.includes("919027845106"));
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(900);
  ok("footer shows Instagram and WhatsApp Channel from the admin settings", (await p.locator("footer a[href='https://instagram.com/arcana']").count()) === 1 && (await p.locator("footer a[href*='whatsapp.com/channel']").count()) === 1);
  const form = p.getByLabel("Weekly card signup"); await form.getByLabel("Email or WhatsApp number").fill("fan@example.com");
  await form.getByRole("button", { name: "Join" }).click(); await p.waitForTimeout(600);
  ok("signup requires consent", await p.getByText("Please tick the box").isVisible());
  await form.getByRole("checkbox").check(); await form.getByRole("button", { name: "Join" }).click(); await p.waitForTimeout(900);
  ok("weekly-card signup succeeds", await p.getByText("You're in!").first().isVisible());
  await p.getByRole("button", { name: "Larger text" }).click(); ok("larger text toggle applies and persists", (await p.evaluate(() => document.documentElement.dataset.text)) === "large");
  await p.reload(); await p.waitForTimeout(1200); ok("larger text survives a reload", (await p.evaluate(() => document.documentElement.dataset.text)) === "large");
}
await post(anon, "/api/site", { action: "subscribe", contact: "98765 43210", consent: true }); await post(anon, "/api/site", { action: "subscribe", contact: "fan@example.com", consent: true });
r = await post(anon, "/api/site", { action: "subscribe", contact: "nope", consent: true }); ok("signup validates the contact", r.status === 400);
d = await adminData(); ok("subscribers saved once each (duplicates ignored), WhatsApp numbers normalised", d.leads.length === 2 && d.leads.some((l) => l.contact === "919876543210" && l.kind === "whatsapp"));
r = await A.get(BASE + "/api/admin?export=leads"); ok("subscribers export to CSV", r.status() === 200 && (await r.text()).includes("fan@example.com"));

// ───────────── backups, cron, trash ─────────────
await adm({ action: "backupNow" }); d = await adminData(); ok("manual backup is stored", d.backups.length === 1 && d.backups[0].kind === "manual");
r = await A.get(BASE + `/api/admin?backupId=${d.backups[0].id}`); t = await r.text(); ok("stored backup downloads as JSON without password hashes", r.status() === 200 && t.includes('"bookings"') && !t.includes('"hash"') && !t.includes("brandnewpass"));
r = await anon.get(BASE + "/api/cron?job=backup"); ok("cron endpoint refuses anonymous callers", r.status() === 401);
r = await A.get(BASE + "/api/cron?job=backup").then(J); ok("cron backup job runs for the admin", r.status === 200 && r.body.ok && r.body.id > 0);
r = await A.get(BASE + "/api/cron?job=reminders").then(J); ok("cron reminders job reports email isn't configured", r.status === 200 && r.body.emailConfigured === false);
await adm({ action: "savePost", title: "Trash Test Post", body: "To be deleted." }); d = await adminData(); const pid = d.posts.find((x) => x.title === "Trash Test Post").id;
await adm({ action: "deletePost", id: pid }); d = await adminData();
ok("deleted post moves to Recently deleted (not gone)", !d.posts.some((x) => x.id === pid) && d.trash.some((x) => x.tbl === "posts"));
await adm({ action: "restoreTrash", id: d.trash.find((x) => x.tbl === "posts").id }); d = await adminData(); ok("restoring brings the post back intact", d.posts.some((x) => x.id === pid && x.title === "Trash Test Post") && d.trash.length === 0);
await adm({ action: "saveCoupon", code: "UNDO10", kind: "percent", value: 10 }); await adm({ action: "deleteCoupon", code: "UNDO10" }); d = await adminData();
ok("deleted coupon can be restored", d.trash.some((x) => x.label.includes("UNDO10")));
await adm({ action: "restoreTrash", id: d.trash.find((x) => x.label.includes("UNDO10")).id }); d = await adminData(); ok("restored coupon is valid again", d.coupons.some((c) => c.code === "UNDO10"));

// ───────────── client import ─────────────
r = await adm({ action: "importClients", rows: [{ name: "Imp One", email: "imp1@example.com", phone: "9111111111" }, { name: "Imp Two", email: "imp2@example.com" }, { name: "Dup", email: "imp1@example.com" }, { name: "X", email: "bad" }] });
ok("CSV import adds new clients and skips duplicates/invalid rows", r.body.added === 2 && r.body.skipped === 2);
const impId = (await adminData()).customers.find((c) => c.email === "imp1@example.com").id;
r = await post(anon, "/api/auth", { action: "login", email: "imp1@example.com", password: "password" }); ok("imported clients can't be logged into without a reset", r.status === 401);
r = await adm({ action: "resetLink", id: impId }); ok("imported client gets access through a reset link", r.status === 200);

// ───────────── tomorrow's reminders + day sheet + admin pages (UI) ─────────────
const tomorrow = isoDay(1);
const resv = await post(anon, "/api/bookings", { serviceId: "three", date: tomorrow, time: "7:30 PM", name: "Remind Me", phone: "9222222222" });
ok("(setup) booking for tomorrow created", resv.status === 200);
{
  const { p } = await mkPage();
  await p.goto(BASE + "/admin"); await p.waitForTimeout(900); await p.getByLabel("Password").fill(ADMIN); await p.getByRole("button", { name: "Enter" }).click(); await p.waitForTimeout(1600);
  const nav = (n) => p.getByRole("navigation", { name: "Admin navigation" }).first().getByRole("button", { name: n });
  await nav("Bookings").click(); await p.waitForTimeout(700);
  await p.getByRole("button", { name: /Tomorrow's reminders/ }).click(); await p.waitForTimeout(600);
  ok("reminders window lists tomorrow's clients with a WhatsApp link", await p.getByRole("dialog").getByText("Remind Me").isVisible() && (await p.locator("a[href*='wa.me/919222222222']").count()) === 1);
  await p.getByRole("button", { name: "Also send email reminders" }).click(); await p.waitForTimeout(700); ok("email reminders explain when email isn't configured", await p.getByText("Email isn't set up yet").first().isVisible());
  await p.keyboard.press("Escape"); await p.waitForTimeout(400);
  await nav("Calendar").click(); await p.waitForTimeout(800);
  await p.locator(`button[aria-label^='${tomorrow},']`).click({ force: true }); await p.waitForTimeout(500);
  const [pop] = await Promise.all([p.waitForEvent("popup"), p.getByRole("button", { name: "Print day sheet" }).click()]); await pop.waitForTimeout(500);
  ok("printable day sheet opens with the day's clients", /Remind Me/.test(await pop.content()) && /Day sheet/.test(await pop.content())); await pop.close();
  await nav("Clients").click(); await p.waitForTimeout(700);
  ok("clients page offers CSV import", await p.getByLabel("Import clients from CSV").count() === 1);
  await p.getByRole("row", { name: /Imp One/ }).click(); await p.waitForTimeout(600);
  await p.getByRole("button", { name: "Password reset link" }).click(); await p.waitForTimeout(1200);
  ok("client panel can create a reset link and send it on WhatsApp", await p.getByText(/\/reset\?token=/).isVisible() && (await p.getByRole("dialog", { name: "Password reset link" }).locator("a[href*='wa.me/919111111111']").count()) === 1);
  await p.keyboard.press("Escape"); await p.keyboard.press("Escape"); await p.waitForTimeout(400);
  await nav("Analytics & health").click(); await p.waitForTimeout(1200);
  ok("analytics page shows visitors and the funnel", await p.getByText("Booking funnel").isVisible() && await p.getByText("Unique visitors").isVisible());
  await p.getByRole("tab", { name: "Health & errors" }).click(); await p.waitForTimeout(500);
  await p.getByRole("button", { name: "Check now" }).click(); await p.waitForTimeout(800); ok("health tab: uptime address, live check and error list", await p.getByText(/Healthy/).isVisible() && await p.getByText(/demo error/).isVisible());
  await p.screenshot({ path: `${OUT}/g-admin-analytics.png` });
  await nav("Marketing").click(); await p.waitForTimeout(900);
  ok("marketing page: subscribers and this week's card message", await p.getByText("This week's card").isVisible() && (await p.locator("a[href*='wa.me/919876543210']").count()) === 1);
  await p.screenshot({ path: `${OUT}/g-admin-marketing.png` });
  await nav("Settings").click(); await p.waitForTimeout(900);
  ok("settings: business details, automatic backups, recently deleted", await p.getByRole("heading", { name: "Business details" }).isVisible() && await p.getByRole("heading", { name: "Automatic backups" }).isVisible() && await p.getByRole("heading", { name: "Recently deleted" }).isVisible());
  await p.getByLabel("UPI ID (for the payment QR code)").fill("ui.saved@upi"); await p.getByRole("button", { name: "Save details" }).click(); await p.waitForTimeout(900);
  ok("business details save from the admin UI", (await anon.get(BASE + "/api/site?q=business").then(J)).body.upiId === "ui.saved@upi");
  await p.getByRole("button", { name: "Back up now" }).click(); await p.waitForTimeout(900); d = await adminData(); ok("'Back up now' button stores a backup", d.backups.length >= 3);
  await p.screenshot({ path: `${OUT}/g-admin-settings.png` });
}

// ───────────── share as image ─────────────
{
  const { p } = await mkPage({ width: 1280, height: 900 }, { acceptDownloads: true }); await p.goto(BASE); await p.waitForTimeout(1500);
  await p.evaluate(() => document.getElementById("reading").scrollIntoView());
  await p.getByRole("button", { name: "Draw today's card" }).click(); await p.waitForTimeout(1500);
  const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 15000 }), p.getByRole("button", { name: "Share as image" }).first().click()]);
  const fs = await import("node:fs"); const buf = fs.readFileSync(await dl.path());
  ok("daily card exports a 1080×1920 PNG share image", buf.subarray(1, 4).toString() === "PNG" && buf.readUInt32BE(16) === 1080 && buf.readUInt32BE(20) === 1920, `${buf.length} bytes`);
  await p.locator("#reading").getByRole("button", { name: /^One card/ }).click(); await p.locator("#reading").getByRole("button", { name: "Shuffle the deck" }).click(); await p.waitForTimeout(3300);
  await p.getByRole("button", { name: /^Card 4 of 22$/ }).click({ force: true }); await p.waitForTimeout(4500);
  const [dl2] = await Promise.all([p.waitForEvent("download", { timeout: 15000 }), p.getByRole("button", { name: "Share as image" }).last().click()]);
  ok("a reading can be exported as a share image", dl2.suggestedFilename() === "my-spill-the-cards-reading.png");
}
d = await adminData(); await adm({ action: "analytics", days: 30 }).then((x) => ok("share and reading events reach the analytics", x.body.other.share >= 2 && x.body.funnel[2][1] >= 1));

// ───────────── PWA: installable + offline ─────────────
{
  const { ctx, p } = await mkPage(); await p.goto(BASE); await p.waitForTimeout(2500);
  const reg = await p.evaluate(async () => { try { const r = await navigator.serviceWorker.ready; return !!r.active; } catch { return false; } });
  ok("service worker registers and activates", reg);
  await p.goto(BASE + "/cards"); await p.waitForTimeout(1200); await p.goto(BASE + "/"); await p.waitForTimeout(1200);
  await ctx.setOffline(true);
  await p.goto(BASE + "/cards").catch(() => {}); await p.waitForTimeout(800);
  ok("a page you already visited still opens offline", /Tarot card/i.test(await p.locator("body").innerText()));
  await p.goto(BASE + "/readers").catch(() => {}); await p.waitForTimeout(800);
  ok("an unvisited page shows the friendly offline screen", /out of reach/.test(await p.locator("body").innerText()));
  await p.screenshot({ path: `${OUT}/g-offline.png` }); await ctx.setOffline(false);
}

// ───────────── mobile booking: step by step with a sticky price bar ─────────────
{
  const { p } = await mkPage({ width: 390, height: 844 }, { isMobile: true, hasTouch: true });
  await p.goto(BASE); await p.waitForTimeout(1600); await p.evaluate(() => document.getElementById("book").scrollIntoView()); await p.waitForTimeout(900);
  ok("mobile booking starts at step 1 with a step indicator", await p.getByText("Step 1 of 3").isVisible() && (await p.getByRole("region", { name: "Booking summary" }).count()) === 1);
  ok("only the current step's fields are visible", await p.getByText("1 · Service").isVisible() && !(await p.getByText("3 · Time").isVisible()));
  await p.getByRole("button", { name: "Next", exact: true }).click(); await p.waitForTimeout(700); ok("step 2 shows dates and times", await p.getByText("Step 2 of 3").isVisible() && await p.getByText("3 · Time").isVisible());
  ok("Next stays disabled until a time is chosen", await p.getByRole("button", { name: "Next", exact: true }).isDisabled());
  await p.locator("#book fieldset").nth(1).locator("button").nth(7).click(); await p.waitForTimeout(500);
  const slotBtn = p.locator("#book fieldset button:not([disabled])", { hasText: /\d:\d\d [AP]M/ }).first(); await slotBtn.click(); await p.waitForTimeout(300);
  await p.getByRole("button", { name: "Next", exact: true }).click(); await p.waitForTimeout(700);
  await p.locator("#nm").fill("Mobile Mina"); ok("step 3 asks for details and the bar offers Reserve", await p.getByText("Step 3 of 3").isVisible() && await p.getByRole("button", { name: "Reserve", exact: true }).isEnabled());
  await p.screenshot({ path: `${OUT}/g-mobile-booking.png` });
  await p.getByRole("button", { name: "Reserve", exact: true }).click(); await p.waitForTimeout(1500); ok("mobile booking completes", await p.getByText(/Reference [0-9A-F]{8}/).isVisible());
  ok("sticky bar goes away after booking", (await p.getByRole("region", { name: "Booking summary" }).count()) === 0);
}

ok("no JavaScript errors across the run", errs.length === 0, errs.join(" | ").slice(0, 300));
done(); await b.close();
