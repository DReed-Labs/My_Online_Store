"""
Generates docs/JRs-Thread-Shop-Handbook.pdf.
Re-run any time the handbook content changes:
    python scripts\\build-handbook.py
"""
from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs"
OUT_DIR.mkdir(exist_ok=True)
OUT = OUT_DIR / "JRs-Thread-Shop-Handbook.pdf"

# ---------- palette ----------
INK = colors.HexColor("#0a0a0a")
INK_SOFT = colors.HexColor("#555555")
ACCENT = colors.HexColor("#ff3b30")
SURFACE = colors.HexColor("#f3f1ec")
RULE = colors.HexColor("#0a0a0a")

# ---------- styles ----------
base = getSampleStyleSheet()
styles = {
    "title": ParagraphStyle(
        "title", parent=base["Title"],
        fontName="Helvetica-Bold", fontSize=34, leading=38,
        textColor=INK, spaceAfter=4, alignment=TA_LEFT,
    ),
    "subtitle": ParagraphStyle(
        "subtitle", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=12, leading=16,
        textColor=ACCENT, spaceAfter=24, alignment=TA_LEFT,
        letterSpace=2,
    ),
    "h1": ParagraphStyle(
        "h1", parent=base["Heading1"],
        fontName="Helvetica-Bold", fontSize=20, leading=24,
        textColor=INK, spaceBefore=22, spaceAfter=10,
        keepWithNext=True,
    ),
    "h2": ParagraphStyle(
        "h2", parent=base["Heading2"],
        fontName="Helvetica-Bold", fontSize=13, leading=17,
        textColor=INK, spaceBefore=14, spaceAfter=4,
        keepWithNext=True,
    ),
    "body": ParagraphStyle(
        "body", parent=base["BodyText"],
        fontName="Helvetica", fontSize=10.5, leading=15,
        textColor=INK, spaceAfter=8,
    ),
    "bullet": ParagraphStyle(
        "bullet", parent=base["BodyText"],
        fontName="Helvetica", fontSize=10.5, leading=15,
        textColor=INK, leftIndent=16, bulletIndent=4, spaceAfter=4,
    ),
    "muted": ParagraphStyle(
        "muted", parent=base["BodyText"],
        fontName="Helvetica-Oblique", fontSize=9.5, leading=13,
        textColor=INK_SOFT, spaceAfter=10,
    ),
    "code": ParagraphStyle(
        "code", parent=base["Code"],
        fontName="Courier", fontSize=9.5, leading=13,
        textColor=INK, backColor=SURFACE,
        borderPadding=8, leftIndent=0, rightIndent=0,
        spaceBefore=4, spaceAfter=12,
    ),
}

# ---------- helpers ----------
story = []


def H1(text):
    story.append(Spacer(1, 6))
    story.append(Paragraph(text.upper(), styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=2, color=RULE, spaceAfter=10))


def H2(text):
    story.append(Paragraph(text, styles["h2"]))


def P(text):
    story.append(Paragraph(text, styles["body"]))


def Muted(text):
    story.append(Paragraph(text, styles["muted"]))


def Bullets(items):
    for it in items:
        story.append(Paragraph(it, styles["bullet"], bulletText="▪"))
    story.append(Spacer(1, 4))


def Code(text):
    story.append(Preformatted(text.rstrip(), styles["code"]))


def Pagebreak():
    story.append(PageBreak())


def InfoBox(title, body, fill=SURFACE):
    p_title = Paragraph(f"<b>{title}</b>", styles["body"])
    p_body = Paragraph(body, styles["body"])
    tbl = Table([[p_title], [p_body]], colWidths=[6.5 * inch])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), fill),
        ("LINEBEFORE", (0, 0), (0, -1), 3, ACCENT),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (0, 0), 8),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(KeepTogether(tbl))
    story.append(Spacer(1, 10))


# ============================================================
# Cover
# ============================================================
story.append(Spacer(1, 1.0 * inch))
story.append(Paragraph("JRs Thread Shop", styles["title"]))
story.append(Paragraph("OPERATOR HANDBOOK", styles["subtitle"]))
story.append(HRFlowable(width="40%", thickness=4, color=ACCENT, spaceAfter=18))
P("A practical guide to running, maintaining, and extending the JRs Thread Shop "
  "storefront. Covers daily operation, common edits, troubleshooting, and a "
  "prioritized roadmap from this frontend scaffold to a production e-commerce "
  "site.")
Muted(f"Generated {date.today().isoformat()} &middot; Frontend scaffold v0.1.0 "
      "&middot; Express + EJS + Vanilla JS/CSS")

story.append(Spacer(1, 0.4 * inch))
H2("What's in the box right now")
Bullets([
    "<b>Server</b> &mdash; Express app (<font face='Courier'>app.js</font>) + listener (<font face='Courier'>server.js</font>).",
    "<b>Pages</b> &mdash; Home, Shop (filter/sort/search), Product detail, Cart, 404.",
    "<b>Data</b> &mdash; 12-product seed in <font face='Courier'>data/products.json</font>; 12 generated SVG placeholders.",
    "<b>Cart</b> &mdash; localStorage-backed with cross-tab sync and a slide-in mini-cart drawer.",
    "<b>SEO</b> &mdash; per-page title/description/canonical, Open Graph, Product JSON-LD, dynamic sitemap, robots.txt.",
    "<b>Git</b> &mdash; initialized on <font face='Courier'>main</font>; <font face='Courier'>.claude/</font> and <font face='Courier'>node_modules/</font> ignored.",
])

Pagebreak()

# ============================================================
# 1. Running & stopping the server
# ============================================================
H1("1. Running & stopping the server")

P("On Windows + PowerShell, use the <b><font face='Courier'>npm.cmd</font></b> wrapper. "
  "The <font face='Courier'>npm</font> command resolves to <font face='Courier'>npm.ps1</font>, "
  "which is blocked by PowerShell's default execution policy. <font face='Courier'>.cmd</font> "
  "isn't subject to that policy.")

H2("Day-to-day (auto-reload on save)")
Code("npm.cmd run dev")
P("Then open <b>http://localhost:3000</b>. Node's <font face='Courier'>--watch</font> flag "
  "restarts the server when <font face='Courier'>app.js</font>, <font face='Courier'>server.js</font>, "
  "or anything it requires changes. EJS templates and CSS/JS in <font face='Courier'>public/</font> "
  "don't need a restart &mdash; just refresh the browser.")

H2("Plain (no auto-reload)")
Code("npm.cmd start")

H2("Stop the server")
P("Press <b>Ctrl+C</b> in the terminal running the server. If it didn't shut down cleanly "
  "and port 3000 is stuck:")
Code("Get-NetTCPConnection -LocalPort 3000 |\n"
     "  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }")

H2("Run on a different port")
P("Set <font face='Courier'>PORT</font> before launching. The site URL embedded in metadata "
  "(canonical, sitemap) also reads from <font face='Courier'>SITE_URL</font>:")
Code("$env:PORT=4000\n"
     "$env:SITE_URL='http://localhost:4000'\n"
     "npm.cmd run dev")

InfoBox(
    "Permanent PowerShell fix (optional)",
    "If you'd rather use <font face='Courier'>npm</font> directly (no <font face='Courier'>.cmd</font>), "
    "run this once: <font face='Courier'>Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy "
    "RemoteSigned</font>. It only affects your user account and is Microsoft's recommended "
    "developer-machine setting."
)

Pagebreak()

# ============================================================
# 2. Adding & editing products
# ============================================================
H1("2. Adding & editing products")

P("All product data lives in <b><font face='Courier'>data/products.json</font></b>. "
  "It's loaded once at server boot, so restart the server (or save any file under watch) "
  "after editing.")

H2("Product schema")
Code('''{
  "id": "midnight-grid",         // URL slug. Must be unique. Lowercase + hyphens.
  "name": "Midnight Grid",        // Display name.
  "price": 34,                    // Whole-dollar number. USD assumed.
  "category": "Men",              // Men | Women | Unisex (drives the listing filter).
  "image": "/images/tees/midnight-grid.svg",  // Path under /public.
  "colors": ["Navy", "Black"],    // First entry is the default selection.
  "sizes":  ["S","M","L","XL"],   // Order shown in the size chip row.
  "description": "...",           // Plain text. Used as meta description + JSON-LD.
  "tags": ["minimal","everyday"], // Free-form. Searchable on /shop.
  "featured": false,              // true -> shows on home page (max 6).
  "createdAt": "2026-01-10",      // ISO date. Drives the "Newest" sort.
  "stock": 60                     // <20 shows a "Low stock" badge on cards.
}''')

H2("Add a new product")
Bullets([
    "Append a new object to the array in <font face='Courier'>data/products.json</font>.",
    "Pick a unique <font face='Courier'>id</font> &mdash; this becomes the URL: <font face='Courier'>/product/&lt;id&gt;</font>.",
    "Drop a matching image at <font face='Courier'>public/images/tees/&lt;id&gt;.svg</font> (or .jpg/.png) and point <font face='Courier'>image</font> at it.",
    "Restart <font face='Courier'>npm.cmd run dev</font> if it isn't already watching.",
    "Verify: it appears on <b>/shop</b>, opens at <b>/product/&lt;id&gt;</b>, and is in <b>/sitemap.xml</b>.",
])

H2("Remove a product")
P("Delete the object from the JSON array. The sitemap auto-shrinks. Old URLs will 404 &mdash; "
  "if Google has indexed them, consider keeping the entry but setting <font face='Courier'>stock</font> "
  "to 0 instead.")

Pagebreak()

# ============================================================
# 3. Image management
# ============================================================
H1("3. Images: SVG placeholders & real photos")

H2("Regenerate the SVG placeholders")
P("The bundled SVGs are produced by a one-off script. Re-run it after editing colors or graphics "
  "in the generator (or after editing the first color of any product, since that drives the SVG fill):")
Code("node scripts\\generate-tees.js")
P("Output: 12 files in <font face='Courier'>public/images/tees/</font>, one per product id.")

H2("Swap a placeholder for a real photo")
Bullets([
    "Save the photo as <font face='Courier'>public/images/tees/&lt;product-id&gt;.jpg</font> (or .png/.webp).",
    "Update <font face='Courier'>image</font> in <font face='Courier'>data/products.json</font> to the new path.",
    "Use a square 1:1 image &mdash; cards and the detail page lock to <font face='Courier'>aspect-ratio: 1/1</font>.",
    "Target ~1200&times;1200 px, &lt;200&nbsp;KB. Use WebP for the smallest size.",
    "Add an <font face='Courier'>alt</font> override if you want product-specific phrasing &mdash; for now alt = product name.",
])

H2("Multiple images per product (future)")
P("Not wired yet. When you're ready, change <font face='Courier'>image</font> from a string to an "
  "<font face='Courier'>images: []</font> array, update the product card to show <font face='Courier'>images[0]</font>, "
  "and add a thumbnail strip + main-image swap on the detail page.")

H2("Open Graph preview image")
P("Each page&rsquo;s <font face='Courier'>og:image</font> defaults to the product image on detail pages. "
  "For home/shop you may want a branded 1200&times;630 image &mdash; drop it at "
  "<font face='Courier'>public/images/og-default.png</font> and pass <font face='Courier'>ogImage</font> "
  "into the head partial from those pages.")

Pagebreak()

# ============================================================
# 4. Editing styles & templates
# ============================================================
H1("4. Editing styles & templates")

H2("Where to change what")

t = [
    ["Want to change…", "Edit…"],
    ["Color palette / fonts / spacing scale", "public/css/base.css (the :root tokens)"],
    ["Buttons, cards, header, mini-cart, footer", "public/css/components.css"],
    ["Hero, listing layout, product page, cart layout", "public/css/pages.css"],
    ["Page <head> / SEO tags", "views/partials/head.ejs"],
    ["Top nav / cart badge / mobile menu", "views/partials/header.ejs"],
    ["Footer / drawer markup / script tags", "views/partials/footer.ejs"],
    ["Reusable product tile", "views/partials/product-card.ejs"],
    ["A whole page", "views/{home,shop,product,cart,404}.ejs"],
]
tbl = Table(t, colWidths=[2.6 * inch, 3.9 * inch])
tbl.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), INK),
    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
    ("FONTSIZE", (0, 0), (-1, -1), 9.5),
    ("LEADING", (0, 0), (-1, -1), 13),
    ("GRID", (0, 0), (-1, -1), 0.5, INK),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SURFACE]),
]))
story.append(tbl)
story.append(Spacer(1, 14))

H2("Design tokens")
P("All colors, spacing, type sizes, and breakpoints are CSS custom properties at the top of "
  "<font face='Courier'>base.css</font>. Change one variable &mdash; e.g. <font face='Courier'>--color-accent</font> &mdash; "
  "and every button, badge, hover state, and focus ring follows.")
Code("/* base.css */\n"
     ":root {\n"
     "  --color-accent: #ff3b30;   /* swap brand color here */\n"
     "  --font-display: 'Archivo Black', Impact, sans-serif;\n"
     "  --wrap-max: 1200px;\n"
     "  /* ... */\n"
     "}")

H2("Mobile-first breakpoints")
P("All media queries are <font face='Courier'>min-width</font>. Base styles target mobile; "
  "tablets/desktops layer on top:")
Bullets([
    "<b>640px</b> &mdash; small tablet (wrap padding & display sizes increase).",
    "<b>768px</b> &mdash; nav switches from drawer to horizontal; product grid goes to 3-up.",
    "<b>960px</b> &mdash; shop sidebar appears; cart switches to two-column layout.",
    "<b>1100px</b> &mdash; product grid becomes 4-up.",
])

Pagebreak()

# ============================================================
# 5. Git workflow
# ============================================================
H1("5. Git workflow")

H2("Daily loop")
Code("git status\n"
     "git diff                       # see what changed\n"
     "git add <paths>                # stage specific files\n"
     'git commit -m "message"\n'
     "git log --oneline -10")

P("Prefer staging by path over <font face='Courier'>git add .</font> &mdash; it keeps you from "
  "accidentally committing IDE junk, secrets, or generated files.")

H2("Branch for non-trivial changes")
Code("git checkout -b feature/checkout-stripe\n"
     "# ... work, commit ...\n"
     "git checkout main\n"
     "git merge --no-ff feature/checkout-stripe")

H2("What's already ignored")
Bullets([
    "<font face='Courier'>node_modules/</font> &mdash; reinstall with <font face='Courier'>npm.cmd install</font>.",
    "<font face='Courier'>.env</font> / <font face='Courier'>.env.*</font> &mdash; for the eventual Stripe key, DB URL, etc.",
    "<font face='Courier'>.vscode/</font>, <font face='Courier'>.idea/</font>, <font face='Courier'>.claude/</font> &mdash; per-machine editor settings.",
    "<font face='Courier'>*.log</font>, build artifacts.",
])

H2("Push to a remote (when ready)")
Code("git remote add origin <url-from-github-or-gitlab>\n"
     "git push -u origin main")

InfoBox(
    "Tip &mdash; line endings on Windows",
    "Git's <font face='Courier'>warning: LF will be replaced by CRLF</font> on commit is normal "
    "and harmless &mdash; it normalizes line endings. If it's noisy and you want it silent: "
    "<font face='Courier'>git config --global core.autocrlf true</font>."
)

Pagebreak()

# ============================================================
# 6. SEO maintenance
# ============================================================
H1("6. SEO maintenance")

H2("What's already wired")
Bullets([
    "Per-page <font face='Courier'>&lt;title&gt;</font>, meta description, canonical, robots.",
    "Open Graph + Twitter card tags on every page.",
    "<b>JSON-LD <font face='Courier'>Product</font> schema</b> on detail pages &mdash; price, availability, image, brand.",
    "<b>Dynamic <font face='Courier'>/sitemap.xml</font></b> rebuilt from the product catalog on each request.",
    "<font face='Courier'>/robots.txt</font> with <font face='Courier'>Disallow: /cart</font> (no point indexing it).",
    "Semantic HTML &mdash; one <font face='Courier'>&lt;h1&gt;</font> per page, breadcrumb nav on detail, skip-link, focus-visible outlines.",
])

H2("Things to do before launch")
Bullets([
    "Set <font face='Courier'>SITE_URL</font> to your real domain so canonical/OG/sitemap URLs are correct.",
    "Add a branded 1200&times;630 OG image at <font face='Courier'>/public/images/og-default.png</font>.",
    "Add Google Search Console &mdash; submit <font face='Courier'>https://&lt;domain&gt;/sitemap.xml</font>.",
    "Add a basic <font face='Courier'>Organization</font> JSON-LD block to the home page.",
    "Consider <font face='Courier'>BreadcrumbList</font> JSON-LD on the product page (you already render visual breadcrumbs).",
    "Add structured data testing &mdash; <font face='Courier'>https://search.google.com/test/rich-results</font>.",
    "Performance: compress photos, add <font face='Courier'>&lt;link rel=&quot;preload&quot;&gt;</font> for the hero image when you have one.",
])

Pagebreak()

# ============================================================
# 7. Troubleshooting
# ============================================================
H1("7. Troubleshooting")

H2("EADDRINUSE: address already in use :::3000")
P("Another process (usually a previous server you forgot to stop) is still bound to port 3000.")
Code("Get-NetTCPConnection -LocalPort 3000 |\n"
     "  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }")
P("Or run on a different port for this session: <font face='Courier'>$env:PORT=4000; npm.cmd run dev</font>.")

H2("npm.ps1 cannot be loaded / not digitally signed")
P("PowerShell execution policy blocks unsigned scripts. Two fixes:")
Bullets([
    "<b>Quick:</b> use <font face='Courier'>npm.cmd run dev</font> instead of <font face='Courier'>npm run dev</font>.",
    "<b>Permanent:</b> <font face='Courier'>Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned</font> (then answer Y).",
])

H2("Pages render unstyled or broken")
Bullets([
    "Check the browser DevTools Network tab &mdash; are <font face='Courier'>base.css</font>, <font face='Courier'>components.css</font>, <font face='Courier'>pages.css</font> returning 200?",
    "Hard-refresh: <b>Ctrl+F5</b>. Express serves static with <font face='Courier'>maxAge: 1d</font>, so browser cache can stick.",
    "Check the terminal for EJS errors &mdash; usually a typo in a template variable.",
])

H2("Cart is wrong / stuck")
P("The cart lives in your browser's localStorage. Clear it from DevTools &rarr; Application &rarr; Local Storage &rarr; "
  "delete the <font face='Courier'>jrs-cart-v1</font> key. Or in the browser console:")
Code("localStorage.removeItem('jrs-cart-v1'); location.reload()")

H2("Edits to products.json don't show up")
P("Products are loaded once at boot. Save any watched file (<font face='Courier'>app.js</font> works) or "
  "stop &amp; restart the server.")

H2("404 on an image I added")
Bullets([
    "Path is case-sensitive on macOS/Linux even if it works on Windows. Match the filename exactly.",
    "The path in <font face='Courier'>products.json</font> is the URL path, e.g. <font face='Courier'>/images/tees/foo.jpg</font>, not a Windows path.",
    "File must live under <font face='Courier'>public/</font> &mdash; that's the only directory Express serves statically.",
])

Pagebreak()

# ============================================================
# 8. Next-steps roadmap
# ============================================================
H1("8. Next-steps roadmap")

P("Ordered roughly by &lsquo;what unlocks selling first.&rsquo; Treat each phase as a "
  "stand-alone branch / PR.")

# ----- Phase 1 -----
H2("Phase 1 &middot; Make it shoppable")
Muted("Goal: a real customer can buy a tee. ~1&ndash;2 days of focused work.")
Bullets([
    "<b>Real product photos.</b> Replace the SVG placeholders. Single biggest visual upgrade.",
    "<b>Stripe Checkout (hosted)</b> &mdash; <font face='Courier'>npm.cmd install stripe</font>. Add <font face='Courier'>POST /api/checkout</font> that builds a Stripe Checkout session from the localStorage cart payload, returns the session URL. Stripe handles the entire payment UI &mdash; no PCI scope for you.",
    "<b>Webhook for fulfilment</b> &mdash; <font face='Courier'>POST /api/webhook</font> listens for <font face='Courier'>checkout.session.completed</font> and emails you the order. Use <font face='Courier'>stripe-cli</font> locally to forward events.",
    "<b>Success / cancel pages</b> &mdash; <font face='Courier'>/order/success</font> and <font face='Courier'>/order/cancel</font>. Clear the localStorage cart on success.",
    "<b>Inventory decrement</b> &mdash; on webhook, subtract from <font face='Courier'>products.json</font> stock. Crude but enough until phase 2.",
    "<b>Shipping &amp; tax</b> &mdash; configure inside Stripe Checkout (Stripe Tax + shipping rates).",
])

# ----- Phase 2 -----
H2("Phase 2 &middot; Real data layer")
Muted("Goal: stop editing JSON by hand; orders persist.")
Bullets([
    "<b>SQLite + better-sqlite3</b> &mdash; smallest possible jump. Tables: <font face='Courier'>products</font>, <font face='Courier'>orders</font>, <font face='Courier'>order_items</font>.",
    "<b>Migration script</b> &mdash; import the JSON into the DB on first run.",
    "<b>Repository module</b> &mdash; wrap DB calls so routes don't touch SQL directly. Makes a future Postgres swap easy.",
    "<b>Real stock tracking</b> per size &mdash; expand the schema to <font face='Courier'>product_variants(product_id, size, stock)</font>.",
])

# ----- Phase 3 -----
H2("Phase 3 &middot; Admin GUI")
Muted("Goal: edit products from a browser; no SSH-and-vim.")
Bullets([
    "<b>Auth.</b> Start with HTTP basic auth + a single <font face='Courier'>ADMIN_PASSWORD</font> env var. Upgrade to sessions when you add a second user.",
    "<b><font face='Courier'>/admin</font></b> &mdash; protected list view: products with edit / delete / &lsquo;mark out of stock.&rsquo;",
    "<b><font face='Courier'>/admin/products/new</font></b> &mdash; form to create products. Image upload to <font face='Courier'>public/images/tees/</font>.",
    "<b><font face='Courier'>/admin/orders</font></b> &mdash; list orders pulled from the DB / Stripe.",
])

# ----- Phase 4 -----
H2("Phase 4 &middot; Production readiness")
Muted("Goal: ship it to the public internet.")
Bullets([
    "<b>Hosting.</b> Easiest path: Fly.io, Railway, or Render. They all do Dockerless Node deploys with auto HTTPS.",
    "<b>Env vars in prod</b> &mdash; <font face='Courier'>STRIPE_SECRET_KEY</font>, <font face='Courier'>STRIPE_WEBHOOK_SECRET</font>, <font face='Courier'>SITE_URL</font>, <font face='Courier'>ADMIN_PASSWORD</font>, <font face='Courier'>SESSION_SECRET</font>.",
    "<b>Logging.</b> Add <font face='Courier'>morgan</font> for request logs. Pipe to the host's log drain.",
    "<b>Security headers.</b> Add <font face='Courier'>helmet</font>. Set a CSP that allows fonts.googleapis.com and Stripe.",
    "<b>Rate limit</b> the checkout + admin endpoints with <font face='Courier'>express-rate-limit</font>.",
    "<b>Health check.</b> <font face='Courier'>GET /healthz</font> returning 200. Most hosts require one.",
    "<b>Backups.</b> SQLite: nightly copy of the DB file to S3 / R2.",
    "<b>Analytics.</b> Plausible or Fathom (privacy-friendly, no cookie banner).",
])

# ----- Phase 5 -----
H2("Phase 5 &middot; Polish & growth")
Bullets([
    "<b>Email.</b> Order confirmation + shipping notification via Resend or Postmark.",
    "<b>Newsletter capture.</b> Footer email signup &rarr; ConvertKit / Buttondown.",
    "<b>Customer accounts.</b> Order history, saved addresses. Pull this in only when customers ask.",
    "<b>Wishlist.</b> localStorage-first, sync to account when logged in.",
    "<b>Sizing chart modal</b> on product pages.",
    "<b>Reviews</b> &mdash; start with manual curation (a few testimonials in EJS) before adding a real reviews system.",
    "<b>i18n / multi-currency.</b> Only when you actually have international demand.",
])

InfoBox(
    "Heuristic for what to build next",
    "Whatever blocks the next sale wins. Photos beat features; a working Stripe checkout beats a "
    "fancy admin GUI; a stable site beats a clever site. Defer everything that's not on that "
    "critical path until phase 5."
)

# ============================================================
# Build
# ============================================================
doc = SimpleDocTemplate(
    str(OUT),
    pagesize=LETTER,
    leftMargin=0.85 * inch,
    rightMargin=0.85 * inch,
    topMargin=0.85 * inch,
    bottomMargin=0.85 * inch,
    title="JRs Thread Shop — Operator Handbook",
    author="JRs Thread Shop",
    subject="Server use, maintenance, and roadmap",
)


def _footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(INK_SOFT)
    canvas.drawString(0.85 * inch, 0.55 * inch, "JRs Thread Shop · Operator Handbook")
    canvas.drawRightString(LETTER[0] - 0.85 * inch, 0.55 * inch, f"Page {doc.page}")
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(2)
    canvas.line(0.85 * inch, 0.72 * inch, LETTER[0] - 0.85 * inch, 0.72 * inch)
    canvas.restoreState()


doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
print(f"Wrote {OUT}")
