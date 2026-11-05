// Card shop: public page, free guidance pull, ordering through WhatsApp, admin products and orders.
import { BASE, ADMIN, launchBrowser, reporter } from "./lib.mjs";

const { ok, done } = reporter("card shop");
const b = await launchBrowser();
const J = async (r) => ({ status: r.status(), body: await r.json().catch(() => null) });
const post = (req, path, data) => req.fetch(BASE + path, { method: "POST", data, headers: { "content-type": "application/json" } }).then(J);
const A = (await b.newContext()).request;
await post(A, "/api/admin", { action: "login", password: ADMIN });
const adm = (d) => post(A, "/api/admin", d);

const pub = await fetch(BASE + "/api/public?q=products").then((r) => r.json());
ok("five starter products are published", pub.products.length === 5 && pub.products.some((p) => p.id === "guidance-deck"), String(pub.products.length));

const bad = await post(A, "/api/shop", { product: "nope", qty: 1, name: "Asha" });
ok("unknown product rejected", bad.status === 404);
const noName = await post(A, "/api/shop", { product: "guidance-deck", qty: 1, name: "" });
ok("name required", noName.status === 400);
const noNote = await post(A, "/api/shop", { product: "custom-card", qty: 1, name: "Asha" });
ok("custom card needs a description", noNote.status === 400);

// UI
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.addInitScript(() => { sessionStorage.setItem("arcana-intro", "1"); localStorage.setItem("stc-consent", "essential"); localStorage.setItem("stc-consent", "essential"); });
const res = await p.goto(BASE + "/shop"); await p.waitForTimeout(1200);
ok("shop page loads", res.status() === 200 && await p.getByRole("heading", { name: /Cards you can hold/ }).isVisible());
ok("all five products listed", (await p.locator("article").count()) === 5);
await p.getByRole("button", { name: "Pull my card" }).click(); await p.waitForTimeout(900);
ok("guidance card pulled with a message", (await p.getByRole("img", { name: /guidance card:/ }).count()) >= 1);

await p.getByRole("article", { name: /Guidance Deck/ }).getByRole("button", { name: "Order" }).click();
const dlg = p.getByRole("dialog", { name: /Order Guidance Deck/ });
await dlg.getByLabel("Your name").fill("Asha Test");
await dlg.getByLabel("Quantity").selectOption("2");
ok("total updates with quantity", await dlg.getByText("₹1,798").isVisible());
await dlg.getByRole("button", { name: "Continue to WhatsApp" }).click(); await p.waitForTimeout(900);
const link = await dlg.getByRole("link", { name: "Send order on WhatsApp" }).getAttribute("href");
ok("order saved and WhatsApp link opens to the business number", /wa\.me\/919027845106/.test(link) && /SHOP-/.test(decodeURIComponent(link)) && /2 × Guidance Deck/.test(decodeURIComponent(link)), link);

// admin
const list = await adm({ action: "listShop" });
const o = list.body.orders[0];
ok("admin sees the order", list.body.orders.length === 1 && o.qty === 2 && o.total === 1798 && o.status === "new");
await adm({ action: "setOrderStatus", id: o.id, status: "paid" });
ok("order status can be changed", (await adm({ action: "listShop" })).body.orders[0].status === "paid");

await adm({ action: "saveProduct", id: "test-card", name: "Test Card", kind: "guidance", price: 123, blurb: "b", details: "d", art: "heart", active: true, sort: 9 });
ok("new product appears publicly", (await fetch(BASE + "/api/public?q=products").then((r) => r.json())).products.some((x) => x.id === "test-card"));
await adm({ action: "saveProduct", id: "test-card", name: "Test Card", kind: "guidance", price: 123, blurb: "b", details: "d", art: "heart", active: false, sort: 9 });
ok("hidden product disappears", !(await fetch(BASE + "/api/public?q=products").then((r) => r.json())).products.some((x) => x.id === "test-card"));
await adm({ action: "deleteProduct", id: "test-card" });
ok("product can be deleted", !(await adm({ action: "listShop" })).body.products.some((x) => x.id === "test-card"));

// admin UI
const ap = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await ap.goto(BASE + "/admin"); await ap.getByLabel(/password/i).first().fill(ADMIN); await ap.keyboard.press("Enter"); await ap.waitForTimeout(1500);
await ap.goto(BASE + "/admin#/shop"); await ap.waitForTimeout(1500);
ok("admin Card shop page shows products", await ap.getByRole("heading", { name: "Card shop" }).isVisible() && await ap.getByText("Guidance Deck · 36 Cards").first().isVisible());

// testimonials: admin adds, edits, places
const before = (await fetch(BASE + "/api/public?q=reviews&place=shop").then((r) => r.json())).reviews.length;
const bad2 = await adm({ action: "saveReview", name: "X", text: "" });
ok("empty testimonial rejected", bad2.status === 400);
await adm({ action: "saveReview", name: "Priya S.", city: "Pune", category: "Card shop", text: "The guidance deck is beautiful.", rating: 5, place: "shop", featured: true });
await adm({ action: "saveReview", name: "Rahul M.", city: "Delhi", category: "Career & finance", text: "Clear and kind reading.", rating: 4, place: "home" });
const shopR = (await fetch(BASE + "/api/public?q=reviews&place=shop").then((r) => r.json())).reviews;
const homeR = (await fetch(BASE + "/api/public?q=reviews&place=home").then((r) => r.json())).reviews;
ok("shop-only testimonial shows on shop, not home", shopR.length === before + 1 && shopR[0].name === "Priya S." && !homeR.some((r) => r.name === "Priya S.") && homeR.some((r) => r.name === "Rahul M."));
const all = (await adm({ action: "listShop" })) && (await A.get(BASE + "/api/admin").then(J)).body.reviews;
const rid = all.find((r) => r.name === "Rahul M.").id;
await adm({ action: "saveReview", id: rid, name: "Rahul M.", city: "Delhi", category: "Career & finance", text: "Edited text.", rating: 5, place: "all" });
ok("testimonial text can be edited and shown everywhere", (await fetch(BASE + "/api/public?q=reviews&place=shop").then((r) => r.json())).reviews.some((r) => r.text === "Edited text."));
await p.goto(BASE + "/shop"); await p.waitForTimeout(1500);
ok("shop page shows the testimonial strip", await p.getByRole("region", { name: "Loved by customers" }).isVisible());

// home teaser + sitemap
await p.goto(BASE + "/"); await p.waitForTimeout(1500);
ok("home page links to the shop", (await p.locator("a[href='/shop']").count()) >= 1);
ok("sitemap lists /shop", /\/shop</.test(await (await fetch(BASE + "/sitemap.xml")).text()));
ok("no page errors", errs.length === 0, errs.join(" | "));
done(); await b.close();
