// Card shop: starts empty, owner uploads own designs, public page, ordering through WhatsApp, stock, testimonials.
import { BASE, ADMIN, launchBrowser, reporter } from "./lib.mjs";

const { ok, done } = reporter("card shop");
const b = await launchBrowser();
const J = async (r) => ({ status: r.status(), body: await r.json().catch(() => null) });
const post = (req, path, data) => req.fetch(BASE + path, { method: "POST", data, headers: { "content-type": "application/json" } }).then(J);
const A = (await b.newContext()).request;
await post(A, "/api/admin", { action: "login", password: ADMIN });
const adm = (d) => post(A, "/api/admin", d);
const pubProducts = async () => (await fetch(BASE + "/api/public?q=products").then((r) => r.json())).products;
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

ok("shop starts empty (no pre-made cards)", (await pubProducts()).length === 0);

// UI: empty state, no home teaser
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage();
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.addInitScript(() => { sessionStorage.setItem("arcana-intro", "1"); localStorage.setItem("stc-consent", "essential"); });
await p.goto(BASE + "/shop"); await p.waitForTimeout(1500);
ok("empty shop shows a friendly message", await p.getByText("Our collection is on its way").isVisible());
await p.goto(BASE + "/"); await p.waitForTimeout(1500);
ok("home hides the shop teaser while empty", (await p.locator("#shop").count()) === 0);

// owner uploads a design and adds a product
const noAuth = await (await b.newContext()).request.post(BASE + "/api/admin/media", { multipart: { file: { name: "x.png", mimeType: "image/png", buffer: PNG } } });
ok("upload needs admin login", noAuth.status() === 401);
const up = await A.post(BASE + "/api/admin/media", { multipart: { file: { name: "design.png", mimeType: "image/png", buffer: PNG } } }).then(J);
ok("admin can upload a product picture", up.status === 200 && up.body.media.id > 0);
const svg = await A.post(BASE + "/api/admin/media", { multipart: { file: { name: "x.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg/>") } } }).then(J);
ok("SVG pictures are refused", svg.status === 415);
const img = await A.get(BASE + "/api/media/" + up.body.media.id);
ok("picture is served as an image", img.status() === 200 && /image\/png/.test(img.headers()["content-type"]));

await adm({ action: "saveProduct", id: "my-deck", name: "Moonlit Deck", kind: "Tarot deck", price: 899, blurb: "My own design.", details: "Matte cards.", active: true, sort: 1, stock: 3, image: up.body.media.id });
const list = await pubProducts();
ok("new product appears with its picture and free-text type", list.length === 1 && list[0].image === up.body.media.id && list[0].kind === "Tarot deck" && list[0].stock === 3);

ok("unknown product rejected", (await post(A, "/api/shop", { product: "nope", qty: 1, name: "Asha" })).status === 404);
ok("name required", (await post(A, "/api/shop", { product: "my-deck", qty: 1, name: "" })).status === 400);
ok("cannot order more than the stock", (await post(A, "/api/shop", { product: "my-deck", qty: 5, name: "Asha" })).status === 409);

await p.goto(BASE + "/shop"); await p.waitForTimeout(1500);
ok("product shows with the picture and low-stock note", (await p.locator("article img").count()) === 1 && await p.getByText("Only 3 left").isVisible());
await p.getByRole("article", { name: /Moonlit Deck/ }).getByRole("button", { name: "Order" }).click();
const dlg = p.getByRole("dialog", { name: /Order Moonlit Deck/ });
await dlg.getByLabel("Your name").fill("Asha Test");
await dlg.getByLabel("Quantity").selectOption("2");
ok("total updates with quantity", await dlg.getByText("₹1,798").isVisible());
await dlg.getByRole("button", { name: "Continue to WhatsApp" }).click(); await p.waitForTimeout(900);
const link = await dlg.getByRole("link", { name: "Send order on WhatsApp" }).getAttribute("href");
ok("order saved and WhatsApp link opens to the business number", /wa\.me\/919027845106/.test(link) && /SHOP-/.test(decodeURIComponent(link)) && /2 × Moonlit Deck/.test(decodeURIComponent(link)), link);
ok("stock goes down after an order", (await pubProducts())[0].stock === 1);
ok("last unit can still be ordered", (await post(A, "/api/shop", { product: "my-deck", qty: 1, name: "Rhea" })).status === 200);
await p.goto(BASE + "/shop"); await p.waitForTimeout(1500);
ok("sold out shows Notify me", await p.getByRole("link", { name: "Notify me" }).isVisible());
await p.goto(BASE + "/"); await p.waitForTimeout(1500);
ok("home shows the shop teaser once a product exists", (await p.locator("#shop").count()) === 1);

// admin orders
const orders = (await adm({ action: "listShop" })).body.orders;
ok("admin sees the orders", orders.length === 2 && orders.some((o) => o.qty === 2 && o.total === 1798 && o.status === "new"));
await adm({ action: "setOrderStatus", id: orders[0].id, status: "sent" });
ok("order can be marked sent", (await adm({ action: "listShop" })).body.orders.some((o) => o.status === "sent"));
await adm({ action: "saveProduct", id: "my-deck", name: "Moonlit Deck", kind: "Tarot deck", price: 899, blurb: "x", details: "y", active: false, sort: 1, stock: "", image: up.body.media.id });
ok("hidden product disappears from the shop", (await pubProducts()).length === 0);
await adm({ action: "deleteProduct", id: "my-deck" });
ok("product can be deleted", !(await adm({ action: "listShop" })).body.products.some((x) => x.id === "my-deck"));

// admin UI
const ap = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await ap.goto(BASE + "/admin"); await ap.getByLabel(/password/i).first().fill(ADMIN); await ap.keyboard.press("Enter"); await ap.waitForTimeout(1500);
await ap.goto(BASE + "/admin#/shop"); await ap.waitForTimeout(1500);
ok("admin Card shop page opens with a New product button", await ap.getByRole("heading", { name: "Card shop" }).isVisible() && await ap.getByRole("button", { name: /New product/ }).isVisible());

// testimonials: admin adds, edits, places
const before = (await fetch(BASE + "/api/public?q=reviews&place=shop").then((r) => r.json())).reviews.length;
ok("empty testimonial rejected", (await adm({ action: "saveReview", name: "X", text: "" })).status === 400);
await adm({ action: "saveReview", name: "Priya S.", city: "Pune", category: "Card shop", text: "Added by the owner.", rating: 5, place: "shop", featured: true });
await adm({ action: "saveReview", name: "Rahul M.", city: "Delhi", category: "Career & finance", text: "Clear and kind reading.", rating: 4, place: "home" });
const shopR = (await fetch(BASE + "/api/public?q=reviews&place=shop").then((r) => r.json())).reviews;
const homeR = (await fetch(BASE + "/api/public?q=reviews&place=home").then((r) => r.json())).reviews;
ok("shop-only testimonial shows on shop, not home", shopR.length === before + 1 && shopR[0].name === "Priya S." && !homeR.some((r) => r.name === "Priya S.") && homeR.some((r) => r.name === "Rahul M."));
const all = (await A.get(BASE + "/api/admin").then(J)).body.reviews;
await adm({ action: "saveReview", id: all.find((r) => r.name === "Rahul M.").id, name: "Rahul M.", city: "Delhi", category: "Career & finance", text: "Edited text.", rating: 5, place: "all" });
ok("testimonial text can be edited and shown everywhere", (await fetch(BASE + "/api/public?q=reviews&place=shop").then((r) => r.json())).reviews.some((r) => r.text === "Edited text."));
await p.goto(BASE + "/shop"); await p.waitForTimeout(1500);
ok("shop page shows the testimonial strip", await p.getByRole("region", { name: "Loved by customers" }).isVisible());
await p.goto(BASE + "/"); await p.waitForTimeout(1800);
ok("home has no placeholder testimonials", (await p.getByText("Placeholder").count()) === 0);

ok("sitemap lists /shop", /\/shop</.test(await (await fetch(BASE + "/sitemap.xml")).text()));
ok("no page errors", errs.length === 0, errs.join(" | "));
done(); await b.close();
