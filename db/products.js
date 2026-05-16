/**
 * db/products.js — product repository.
 * Returns objects shaped like the original JSON so templates need no changes.
 */
const db = require('./index');

function hydrate(row) {
  if (!row) return null;
  const colors = db.prepare('SELECT color FROM product_colors WHERE product_id = ? ORDER BY sort_order').all(row.id).map(r => r.color);
  const sizes = db.prepare('SELECT size FROM product_sizes WHERE product_id = ? ORDER BY sort_order').all(row.id).map(r => r.size);
  const tags = db.prepare('SELECT tag FROM product_tags WHERE product_id = ?').all(row.id).map(r => r.tag);
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    category: row.category,
    image: row.image,
    description: row.description,
    featured: !!row.featured,
    createdAt: row.created_at,
    stock: row.stock,
    colors,
    sizes,
    tags,
  };
}

function listProducts() {
  const rows = db.prepare('SELECT * FROM products ORDER BY featured DESC, created_at DESC').all();
  return rows.map(hydrate);
}

function getProductById(id) {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  return hydrate(row);
}

function getRelated(productId, category, limit = 3) {
  const rows = db.prepare(`
    SELECT * FROM products
    WHERE category = ? AND id != ?
    ORDER BY featured DESC, created_at DESC
    LIMIT ?
  `).all(category, productId, limit);
  return rows.map(hydrate);
}

function listCategories() {
  return db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all().map(r => r.category);
}

function decrementStock(productId, qty) {
  return db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?').run(qty, productId);
}

module.exports = {
  listProducts,
  getProductById,
  getRelated,
  listCategories,
  decrementStock,
};
