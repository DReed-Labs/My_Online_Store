# JRs Thread Shop

Server-rendered streetwear t-shirt store. Mobile-first, vanilla CSS, Express + EJS.

## Stack
- **Server:** Node + Express
- **Templates:** EJS (server-rendered for SEO)
- **Styles:** Vanilla CSS with custom properties, mobile-first
- **Scripts:** Vanilla JS (no framework)
- **Data:** Static `data/products.json`
- **Cart:** `localStorage`

## Run

```bash
npm install
npm run dev     # auto-reload on changes
# or
npm start
```

Then open <http://localhost:3000>.

## Project layout

```
.
├── server.js                 # Express app + routes
├── data/products.json        # Product catalog (edit to add/remove tees)
├── views/                    # EJS templates
│   ├── partials/             # head, header, footer, product-card
│   ├── home.ejs
│   ├── shop.ejs
│   ├── product.ejs
│   ├── cart.ejs
│   └── 404.ejs
├── public/
│   ├── css/                  # base, components, pages
│   ├── js/                   # cart, shop, product
│   ├── images/tees/          # SVG placeholders (swap for real photos)
│   ├── robots.txt
│   └── sitemap.xml
└── README.md
```

## Pages
- `/` — Home (hero + featured grid)
- `/shop` — Listing (category filter, sort, search)
- `/product/:id` — Detail (size picker, add to cart)
- `/cart` — Cart (line items, quantity, total)

## SEO
- Server-rendered HTML (crawlers see real content)
- Per-page `<title>`, meta description, Open Graph, canonical
- Product pages embed `Product` JSON-LD
- `robots.txt` + `sitemap.xml` served from `/public`

## Swapping placeholder images
Drop real photos into `public/images/tees/` and update the `image` field
on each product in `data/products.json`.

## Next steps (backend)
- Replace `data/products.json` with a DB
- Add `/api/checkout` and a payment provider
- Move cart from `localStorage` to a session-backed cart for cross-device
