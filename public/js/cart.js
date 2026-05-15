/* cart.js — global cart state + cross-page UI (nav toggle, cart badge).
 * Loaded on every page. Exposes window.JRsCart for shop/product/cart pages.
 *
 * Cart shape: Array<{ id, name, price, image, color, size, qty }>
 * Line uniqueness: id + color + size.
 */
(function () {
  const STORAGE_KEY = 'jrs-cart-v1';

  const read = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  };
  const write = (items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    broadcast(items);
  };
  const broadcast = (items) => {
    document.dispatchEvent(new CustomEvent('cart:change', { detail: { items } }));
    updateBadge(items);
  };
  const lineKey = (l) => `${l.id}::${l.color}::${l.size}`;

  function add(item) {
    const items = read();
    const key = lineKey(item);
    const existing = items.find((l) => lineKey(l) === key);
    if (existing) existing.qty = Math.min(99, existing.qty + item.qty);
    else items.push({ ...item, qty: Math.max(1, item.qty) });
    write(items);
  }
  function updateQty(key, qty) {
    const items = read();
    const line = items.find((l) => lineKey(l) === key);
    if (!line) return;
    line.qty = Math.max(1, Math.min(99, qty));
    write(items);
  }
  function remove(key) {
    write(read().filter((l) => lineKey(l) !== key));
  }
  function clear() { write([]); }
  function count(items = read()) { return items.reduce((s, l) => s + l.qty, 0); }
  function subtotal(items = read()) { return items.reduce((s, l) => s + l.price * l.qty, 0); }

  function updateBadge(items = read()) {
    const c = count(items);
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = c;
      el.toggleAttribute('hidden', c === 0);
    });
  }

  // Sync across tabs.
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) broadcast(read());
  });

  // Mobile nav toggle.
  function initNavToggle() {
    const btn = document.querySelector('.nav-toggle');
    const nav = document.getElementById('primary-nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
    // Close after a link tap on mobile.
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && window.matchMedia('(max-width: 767px)').matches) {
        nav.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateBadge();
    initNavToggle();
  });

  window.JRsCart = { read, add, updateQty, remove, clear, count, subtotal, lineKey };
})();
