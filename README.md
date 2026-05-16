# JRs Thread Shop

Server-rendered streetwear t-shirt store. Mobile-first, vanilla CSS, Express + EJS,
backed by SQLite with a session-keyed cart and a stub-provider checkout flow ready
to be swapped for Stripe.

## Stack
- **Server:** Node 22.5+ + Express
- **Templates:** EJS (server-rendered for SEO)
- **Styles:** Vanilla CSS with custom properties, mobile-first
- **Scripts:** Vanilla JS, no framework
- **Database:** SQLite via the built-in `node:sqlite` module — single file at `data/shop.db`
- **Sessions:** `express-session` with a custom SQLite-backed store (persists across restarts)
- **Cart:** session-backed, JSON API (`/api/cart`), follows the user across tabs/devices
- **Checkout:** stub provider with the shape required to drop in Stripe Checkout later

## Run

```powershell
npm.cmd install
npm.cmd run dev     # auto-reload on save
# or
npm.cmd start
```

Open <http://localhost:3000>. On first boot, `data/products.json` is imported into
`data/shop.db`; after that the DB is the source of truth.

> Use `npm.cmd` on Windows PowerShell to bypass the execution-policy block on
> `npm.ps1`. See the handbook for the permanent fix.

## Project layout

```
.
├── app.js                    # Express app: middleware, routes, exports app
├── server.js                 # Starts the HTTP listener (requires app.js)
├── db/
│   ├── index.js              # SQLite handle (node:sqlite)
│   ├── migrate.js            # Schema DDL + first-run JSON import
│   ├── products.js           # Product repository
│   ├── carts.js              # Session-keyed cart repository
│   ├── orders.js             # Orders + order_items repository
│   └── session-store.js      # express-session Store backed by the same DB
├── data/
│   ├── products.json         # Seed data — only re-imported when products table is empty
│   └── shop.db               # SQLite DB (gitignored; created on boot)
├── views/                    # EJS templates
│   ├── partials/             # head, header, footer, product-card
│   ├── home.ejs
│   ├── shop.ejs
│   ├── product.ejs
│   ├── cart.ejs              # Server-rendered from session cart
│   ├── order-stub.ejs        # Stub provider checkout page
│   ├── order-success.ejs
│   ├── order-cancel.ejs
│   └── 404.ejs
├── public/
│   ├── css/                  # base, components, pages
│   ├── js/                   # cart (API client), mini-cart, cart-page, product, shop
│   ├── images/tees/          # SVG placeholders (swap for real photos)
│   └── robots.txt
├── scripts/
│   ├── generate-tees.js      # Regenerate SVG placeholders
│   └── build-handbook.py     # Rebuild the operator handbook PDF
├── docs/JRs-Thread-Shop-Handbook.pdf
└── README.md
```

## Pages
- `/` — Home (hero + featured grid)
- `/shop` — Listing (category filter, sort, search)
- `/product/:id` — Detail (size picker, add to cart)
- `/cart` — Cart (server-rendered, JS-hydrated)
- `/order/stub/:id` — Stub provider payment page (replace with Stripe redirect)
- `/order/success`, `/order/cancel`

## API

| Method | Path | Body | Returns |
|---|---|---|---|
| `GET`    | `/api/cart`            | —                                                | `{ items, count, subtotal }` |
| `POST`   | `/api/cart/items`      | `{ productId, color, size, qty }`                | full cart |
| `PATCH`  | `/api/cart/items/:id`  | `{ qty }`                                        | full cart |
| `DELETE` | `/api/cart/items/:id`  | —                                                | full cart |
| `DELETE` | `/api/cart`            | —                                                | empty cart |
| `POST`   | `/api/checkout`        | —                                                | `{ orderId, checkoutUrl }` |

All cart routes are session-scoped — no auth required for guest checkout.

## Swapping the stub provider for Stripe

In `app.js`, `POST /api/checkout` currently creates a stub-provider order and points
the user at `/order/stub/:id`. To switch to Stripe Checkout (hosted), replace the
URL construction with:

```js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  line_items: cart.items.map(it => ({
    price_data: {
      currency: 'usd',
      unit_amount: Math.round(it.price * 100),
      product_data: { name: `${it.name} (${it.color}, ${it.size})`, images: [`${SITE_URL}${it.image}`] },
    },
    quantity: it.qty,
  })),
  success_url: `${SITE_URL}/order/success?id=${order.id}`,
  cancel_url:  `${SITE_URL}/order/cancel?id=${order.id}`,
});
orders.setProviderSessionId(order.id, session.id);   // small repo addition
return res.json({ orderId: order.id, checkoutUrl: session.url });
```

Then add `POST /api/checkout/webhook` listening for `checkout.session.completed`
and call `orders.setStatus(orderId, 'paid')` + `products.decrementStock(...)`,
exactly the same logic the stub's `/pay` handler runs today.

## Migrations

The schema is created (idempotently) and seed data is imported (only when empty)
on every boot. Force a re-run after dropping the DB:

```powershell
npm.cmd run migrate
```

To reset to a fresh DB:

```powershell
Remove-Item data\shop.db*
npm.cmd run dev
```

## SEO
- Server-rendered HTML (crawlers see real content)
- Per-page `<title>`, meta description, Open Graph, canonical
- Product pages embed `Product` JSON-LD
- Dynamic `/sitemap.xml` rebuilt from the products table on each request
- `robots.txt` disallows `/cart` and `/order/*`

## Handbook
See [docs/JRs-Thread-Shop-Handbook.pdf](docs/JRs-Thread-Shop-Handbook.pdf) for
day-to-day operation, maintenance, and the next-steps roadmap.
