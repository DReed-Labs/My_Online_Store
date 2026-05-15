const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;
const SITE_NAME = "JRs Thread Shop";

// Load product catalog once at boot. Re-require with cache-bust in dev if you edit JSON live.
const productsPath = path.join(__dirname, 'data', 'products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
const productById = Object.fromEntries(products.map(p => [p.id, p]));
const categories = [...new Set(products.map(p => p.category))].sort();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static assets (CSS, JS, images, robots.txt)
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  },
}));

// Make site-wide values available to every template.
app.use((req, res, next) => {
  res.locals.site = { name: SITE_NAME, url: SITE_URL };
  res.locals.currentPath = req.path;
  res.locals.canonical = SITE_URL + req.path;
  next();
});

// Home
app.get('/', (req, res) => {
  const featured = products.filter(p => p.featured).slice(0, 6);
  res.render('home', {
    title: `${SITE_NAME} — Bold Tees, Limited Drops`,
    description: 'Streetwear tees, limited runs, screen-printed in small batches. Shop the latest drop at JRs Thread Shop.',
    featured,
  });
});

// Listing
app.get('/shop', (req, res) => {
  res.render('shop', {
    title: `Shop All Tees — ${SITE_NAME}`,
    description: 'Browse every drop. Filter by category, sort by price or newest, search by name.',
    products,
    categories,
  });
});

// Detail
app.get('/product/:id', (req, res, next) => {
  const product = productById[req.params.id];
  if (!product) return next();
  const related = products
    .filter(p => p.id !== product.id && p.category === product.category)
    .slice(0, 3);
  res.render('product', {
    title: `${product.name} — ${SITE_NAME}`,
    description: product.description,
    product,
    related,
  });
});

// Cart (cart contents live in localStorage; this page hydrates from the client)
app.get('/cart', (req, res) => {
  res.render('cart', {
    title: `Your Cart — ${SITE_NAME}`,
    description: 'Review the tees in your cart before checkout.',
  });
});

// Dynamic sitemap — keeps URLs in sync with the product catalog automatically.
app.get('/sitemap.xml', (req, res) => {
  const urls = [
    '/',
    '/shop',
    '/cart',
    ...products.map(p => `/product/${p.id}`),
  ];
  const today = new Date().toISOString().slice(0, 10);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>`;
  res.type('application/xml').send(body);
});

// 404
app.use((req, res) => {
  res.status(404).render('404', {
    title: `Page Not Found — ${SITE_NAME}`,
    description: 'That page does not exist.',
  });
});

app.listen(PORT, () => {
  console.log(`${SITE_NAME} running at ${SITE_URL}`);
});
