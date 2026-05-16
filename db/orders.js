/**
 * db/orders.js — orders + order_items repository.
 *
 * Order lifecycle:
 *   pending  -> created when checkout starts
 *   paid     -> set by provider success (webhook for real Stripe, button for stub)
 *   cancelled-> set when the user backs out
 */
const crypto = require('crypto');
const db = require('./index');

function newId() {
  return 'ord_' + crypto.randomBytes(8).toString('hex');
}

function createOrder({ sessionId, items, subtotal, provider = 'stub', providerSessionId = null, email = null }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw Object.assign(new Error('Cannot create empty order'), { status: 400 });
  }
  const id = newId();
  const now = new Date().toISOString();

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, session_id, email, subtotal, status, provider, provider_session_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)
  `);
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, name, price, image, color, size, qty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN');
  try {
    insertOrder.run(id, sessionId, email, subtotal, provider, providerSessionId, now, now);
    for (const it of items) {
      insertItem.run(id, it.productId, it.name, it.price, it.image, it.color, it.size, it.qty);
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  return getOrder(id);
}

function getOrder(id) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!order) return null;
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
  return {
    id: order.id,
    sessionId: order.session_id,
    email: order.email,
    subtotal: order.subtotal,
    status: order.status,
    provider: order.provider,
    providerSessionId: order.provider_session_id,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items: items.map((it) => ({
      id: it.id,
      productId: it.product_id,
      name: it.name,
      price: it.price,
      image: it.image,
      color: it.color,
      size: it.size,
      qty: it.qty,
    })),
  };
}

function setStatus(id, status) {
  const now = new Date().toISOString();
  const res = db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);
  if (res.changes === 0) throw Object.assign(new Error('Order not found'), { status: 404 });
  return getOrder(id);
}

module.exports = {
  createOrder,
  getOrder,
  setStatus,
};
