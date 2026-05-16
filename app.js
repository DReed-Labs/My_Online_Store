/**
 * app.js — Express app: middleware, page routes, cart API, checkout, order pages.
 *
 * Data lives in SQLite (db/index.js). The cart is keyed by session cookie so
 * it follows the user across tabs/devices once they sign in (future work).
 *
 * server.js requires this and starts the HTTP listener.
 */
const express = require('express');
const session = require('express-session');
const path = require('path');

const migrate = require('./db/migrate');
const products = require('./db/products');
const carts = require('./db/carts');
const orders = require('./db/orders');
const SQLiteSessionStore = require('./db/session-store');

const SITE_URL = process.env.SITE_URL || `http://localhost:${process.env.PORT || 3000}`;
const SITE_NAME = "JRs Thread Shop";
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-change-me-in-prod';

// Run migrations + import seed data on boot. Idempotent.
migrate();

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsing for JSON API endpoints.
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: false, limit: '64kb' }));

// Sessions: persistent SQLite store so carts survive server restarts.
app.use(session({
  name: 'jrs.sid',
  secret: SESSION_SECRET,
  store: new SQLiteSessionStore(),
  resave: false,
  saveUninitialized: true,                // we need a session id to key the cart
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,     // 30 days
  },
}));

// Static assets.
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  },
}));

// Site-wide template locals, including the cart count for the header badge so
// the first paint already shows the right number (no flicker after JS hydrates).
app.use((req, res, next) => {
  const cart = carts.getCart(req.sessionID);
  res.locals.site = { name: SITE_NAME, url: SITE_URL };
  res.locals.currentPath = req.path;
  res.locals.canonical = SITE_URL + req.path;
  res.locals.cartCount = cart.count;
  res.locals.cartSubtotal = cart.subtotal;
  next();
});

// ----------------------------------------------------------------------------
// Page routes
// ----------------------------------------------------------------------------

app.get('/', (req, res) => {
  const featured = products.listProducts().filter(p => p.featured).slice(0, 6);
  res.render('home', {
    title: `${SITE_NAME} — Bold Tees, Limited Drops`,
    description: 'Streetwear tees, limited runs, screen-printed in small batches. Shop the latest drop at JRs Thread Shop.',
    featured,
  });
});

app.get('/shop', (req, res) => {
  const list = products.listProducts();
  res.render('shop', {
    title: `Shop All Tees — ${SITE_NAME}`,
    description: 'Browse every drop. Filter by category, sort by price or newest, search by name.',
    products: list,
    categories: products.listCategories(),
  });
});

app.get('/product/:id', (req, res, next) => {
  const product = products.getProductById(req.params.id);
  if (!product) return next();
  const related = products.getRelated(product.id, product.category, 3);
  res.render('product', {
    title: `${product.name} — ${SITE_NAME}`,
    description: product.description,
    product,
    related,
  });
});

app.get('/cart', (req, res) => {
  const cart = carts.getCart(req.sessionID);
  res.render('cart', {
    title: `Your Cart — ${SITE_NAME}`,
    description: 'Review the tees in your cart before checkout.',
    initialCart: cart,
  });
});

// ----------------------------------------------------------------------------
// Cart API — session-backed, JSON in/out
// ----------------------------------------------------------------------------

function safeCart(req, res, fn) {
  try {
    res.json(fn(req.sessionID));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  }
}

app.get('/api/cart', (req, res) => safeCart(req, res, (sid) => carts.getCart(sid)));

app.post('/api/cart/items', (req, res) => {
  const { productId, color, size, qty } = req.body || {};
  if (!productId || !color || !size) {
    return res.status(400).json({ error: 'productId, color and size are required' });
  }
  safeCart(req, res, (sid) => carts.addItem(sid, { productId, color, size, qty: qty || 1 }));
});

app.patch('/api/cart/items/:id', (req, res) => {
  const id = Number(req.params.id);
  const qty = Number(req.body && req.body.qty);
  if (!Number.isFinite(id) || !Number.isFinite(qty)) {
    return res.status(400).json({ error: 'Numeric id and qty required' });
  }
  safeCart(req, res, (sid) => carts.updateItemQty(sid, id, qty));
});

app.delete('/api/cart/items/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Numeric id required' });
  safeCart(req, res, (sid) => carts.removeItem(sid, id));
});

app.delete('/api/cart', (req, res) => safeCart(req, res, (sid) => carts.clearCart(sid)));

// ----------------------------------------------------------------------------
// Checkout — currently a stub provider. Swap createStubCheckout() for a real
// Stripe call when you're ready (see docs/handbook Phase 1).
// ----------------------------------------------------------------------------

app.post('/api/checkout', (req, res) => {
  const cart = carts.getCart(req.sessionID);
  if (cart.items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Snapshot the cart into an order. Real provider integration would create a
  // provider checkout session (e.g. stripe.checkout.sessions.create) and
  // store its id in providerSessionId.
  const order = orders.createOrder({
    sessionId: req.sessionID,
    items: cart.items,
    subtotal: cart.subtotal,
    provider: 'stub',
  });

  res.json({
    orderId: order.id,
    checkoutUrl: `/order/stub/${order.id}`,
  });
});

// Stub provider "checkout page" — replace with a redirect to Stripe.
app.get('/order/stub/:id', (req, res, next) => {
  const order = orders.getOrder(req.params.id);
  if (!order || order.sessionId !== req.sessionID) return next();
  res.render('order-stub', {
    title: `Confirm Order — ${SITE_NAME}`,
    description: 'Stub payment page.',
    order,
  });
});

// Mark an order paid (stub). With real Stripe, this becomes a webhook handler
// at /api/checkout/webhook listening for checkout.session.completed.
app.post('/order/stub/:id/pay', (req, res, next) => {
  const order = orders.getOrder(req.params.id);
  if (!order || order.sessionId !== req.sessionID) return next();
  if (order.status === 'pending') {
    orders.setStatus(order.id, 'paid');
    for (const it of order.items) products.decrementStock(it.productId, it.qty);
    carts.clearCart(req.sessionID);
  }
  res.redirect(`/order/success?id=${encodeURIComponent(order.id)}`);
});

app.post('/order/stub/:id/cancel', (req, res, next) => {
  const order = orders.getOrder(req.params.id);
  if (!order || order.sessionId !== req.sessionID) return next();
  if (order.status === 'pending') orders.setStatus(order.id, 'cancelled');
  res.redirect(`/order/cancel?id=${encodeURIComponent(order.id)}`);
});

app.get('/order/success', (req, res, next) => {
  const order = orders.getOrder(req.query.id);
  if (!order || order.sessionId !== req.sessionID) return next();
  res.render('order-success', {
    title: `Order Confirmed — ${SITE_NAME}`,
    description: 'Thanks for your order.',
    order,
  });
});

app.get('/order/cancel', (req, res, next) => {
  const order = orders.getOrder(req.query.id);
  if (!order || order.sessionId !== req.sessionID) return next();
  res.render('order-cancel', {
    title: `Order Cancelled — ${SITE_NAME}`,
    description: 'Your order was cancelled.',
    order,
  });
});

// ----------------------------------------------------------------------------
// SEO + 404
// ----------------------------------------------------------------------------

app.get('/sitemap.xml', (req, res) => {
  const list = products.listProducts();
  const urls = ['/', '/shop', ...list.map(p => `/product/${p.id}`)];
  const today = new Date().toISOString().slice(0, 10);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE_URL}${encodeURI(u)}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>`;
  res.type('application/xml').send(body);
});

app.use((req, res) => {
  res.status(404).render('404', {
    title: `Page Not Found — ${SITE_NAME}`,
    description: 'That page does not exist.',
  });
});

module.exports = app;
module.exports.SITE_URL = SITE_URL;
module.exports.SITE_NAME = SITE_NAME;
