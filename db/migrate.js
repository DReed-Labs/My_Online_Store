/**
 * db/migrate.js — create tables (idempotent) and import data/products.json
 * into the products table on first run.
 *
 * Called automatically on app boot. Re-run safely any time.
 */
const fs = require('fs');
const path = require('path');
const db = require('./index');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  price        REAL NOT NULL,
  category     TEXT NOT NULL,
  image        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  featured     INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  stock        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_colors (
  product_id   TEXT NOT NULL,
  color        TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, color),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_sizes (
  product_id   TEXT NOT NULL,
  size         TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, size),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_tags (
  product_id   TEXT NOT NULL,
  tag          TEXT NOT NULL,
  PRIMARY KEY (product_id, tag),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id   TEXT NOT NULL,
  product_id   TEXT NOT NULL,
  color        TEXT NOT NULL,
  size         TEXT NOT NULL,
  qty          INTEGER NOT NULL CHECK (qty > 0),
  added_at     TEXT NOT NULL,
  UNIQUE(session_id, product_id, color, size),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cart_items_session ON cart_items(session_id);

CREATE TABLE IF NOT EXISTS orders (
  id                    TEXT PRIMARY KEY,
  session_id            TEXT NOT NULL,
  email                 TEXT,
  subtotal              REAL NOT NULL,
  status                TEXT NOT NULL,
  provider              TEXT NOT NULL,
  provider_session_id   TEXT,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id     TEXT NOT NULL,
  product_id   TEXT NOT NULL,
  name         TEXT NOT NULL,
  price        REAL NOT NULL,
  image        TEXT NOT NULL,
  color        TEXT NOT NULL,
  size         TEXT NOT NULL,
  qty          INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS sessions (
  sid          TEXT PRIMARY KEY,
  data         TEXT NOT NULL,
  expires      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);
`;

function importProductsFromJSON() {
  const jsonPath = path.join(__dirname, '..', 'data', 'products.json');
  if (!fs.existsSync(jsonPath)) return 0;

  const products = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, price, category, image, description, featured, created_at, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertColor = db.prepare('INSERT INTO product_colors (product_id, color, sort_order) VALUES (?, ?, ?)');
  const insertSize = db.prepare('INSERT INTO product_sizes (product_id, size, sort_order) VALUES (?, ?, ?)');
  const insertTag = db.prepare('INSERT INTO product_tags (product_id, tag) VALUES (?, ?)');

  // node:sqlite supports DatabaseSync#exec for BEGIN/COMMIT.
  db.exec('BEGIN');
  try {
    for (const p of products) {
      insertProduct.run(
        p.id,
        p.name,
        p.price,
        p.category,
        p.image,
        p.description || '',
        p.featured ? 1 : 0,
        p.createdAt,
        p.stock ?? 0,
      );
      (p.colors || []).forEach((c, i) => insertColor.run(p.id, c, i));
      (p.sizes || []).forEach((s, i) => insertSize.run(p.id, s, i));
      (p.tags || []).forEach((t) => insertTag.run(p.id, t));
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return products.length;
}

function migrate() {
  db.exec(SCHEMA);

  // Seed products only if the table is empty. Edits go to the DB after that.
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM products').get();
  if (count === 0) {
    const n = importProductsFromJSON();
    if (n > 0) console.log(`[migrate] imported ${n} products from data/products.json`);
  }
}

module.exports = migrate;
