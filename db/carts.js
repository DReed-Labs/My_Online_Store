/**
 * db/carts.js — session-keyed cart repository.
 *
 * Cart "line" identity = (session_id, product_id, color, size). Adding the same
 * variant twice merges qty rather than creating a second line.
 */
const db = require('./index');

const MAX_QTY = 10;

function getItems(sessionId) {
  return db.prepare(`
    SELECT
      ci.id                           AS id,
      ci.product_id                   AS productId,
      p.name                          AS name,
      p.price                         AS price,
      p.image                         AS image,
      p.stock                         AS stock,
      ci.color                        AS color,
      ci.size                         AS size,
      ci.qty                          AS qty
    FROM cart_items ci
    INNER JOIN products p ON p.id = ci.product_id
    WHERE ci.session_id = ?
    ORDER BY ci.added_at
  `).all(sessionId);
}

function summarize(items) {
  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  return { items, count, subtotal: Math.round(subtotal * 100) / 100 };
}

function getCart(sessionId) {
  return summarize(getItems(sessionId));
}

function addItem(sessionId, { productId, color, size, qty }) {
  qty = Math.max(1, Math.min(MAX_QTY, Number(qty) || 1));

  // Validate that the product + variant exist.
  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!product) throw Object.assign(new Error('Unknown product'), { status: 404 });
  const hasColor = db.prepare('SELECT 1 FROM product_colors WHERE product_id = ? AND color = ?').get(productId, color);
  const hasSize = db.prepare('SELECT 1 FROM product_sizes WHERE product_id = ? AND size = ?').get(productId, size);
  if (!hasColor) throw Object.assign(new Error(`Unknown color "${color}"`), { status: 400 });
  if (!hasSize) throw Object.assign(new Error(`Unknown size "${size}"`), { status: 400 });

  const now = new Date().toISOString();
  const existing = db.prepare(`
    SELECT id, qty FROM cart_items
    WHERE session_id = ? AND product_id = ? AND color = ? AND size = ?
  `).get(sessionId, productId, color, size);

  if (existing) {
    const next = Math.min(MAX_QTY, existing.qty + qty);
    db.prepare('UPDATE cart_items SET qty = ? WHERE id = ?').run(next, existing.id);
  } else {
    db.prepare(`
      INSERT INTO cart_items (session_id, product_id, color, size, qty, added_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(sessionId, productId, color, size, qty, now);
  }
  return getCart(sessionId);
}

function updateItemQty(sessionId, itemId, qty) {
  qty = Math.max(0, Math.min(MAX_QTY, Number(qty) || 0));
  if (qty === 0) return removeItem(sessionId, itemId);
  const res = db.prepare('UPDATE cart_items SET qty = ? WHERE id = ? AND session_id = ?').run(qty, itemId, sessionId);
  if (res.changes === 0) throw Object.assign(new Error('Cart item not found'), { status: 404 });
  return getCart(sessionId);
}

function removeItem(sessionId, itemId) {
  db.prepare('DELETE FROM cart_items WHERE id = ? AND session_id = ?').run(itemId, sessionId);
  return getCart(sessionId);
}

function clearCart(sessionId) {
  db.prepare('DELETE FROM cart_items WHERE session_id = ?').run(sessionId);
  return getCart(sessionId);
}

module.exports = {
  getCart,
  addItem,
  updateItemQty,
  removeItem,
  clearCart,
  MAX_QTY,
};
