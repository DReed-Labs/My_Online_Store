/* cart.js — session-backed cart client.
 *
 * Cart truth lives on the server. This module:
 *   - keeps a cached snapshot (window.JRsCart.state)
 *   - wraps the /api/cart endpoints in a Promise-returning API
 *   - emits a `cart:change` CustomEvent on every state change
 *   - one-time migrates a legacy localStorage cart (from the old build)
 *   - drives the cart badge in the nav
 *
 * Loaded on every page.
 */
(function () {
  const LEGACY_KEY = 'jrs-cart-v1';

  // Seed cache from server-rendered snapshot so the badge is correct before
  // the first API call resolves.
  const seed = window.__INITIAL_CART__ || { count: 0, subtotal: 0 };
  const state = { items: [], count: seed.count || 0, subtotal: seed.subtotal || 0 };

  function broadcast() {
    document.dispatchEvent(new CustomEvent('cart:change', { detail: state }));
    updateBadge();
  }

  function updateBadge() {
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = state.count;
      el.toggleAttribute('hidden', state.count === 0);
    });
  }

  function applyCart(cart) {
    state.items = cart.items || [];
    state.count = cart.count ?? state.items.reduce((s, l) => s + l.qty, 0);
    state.subtotal = cart.subtotal ?? state.items.reduce((s, l) => s + l.price * l.qty, 0);
    broadcast();
    return cart;
  }

  async function request(path, opts = {}) {
    const res = await fetch(path, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      ...opts,
    });
    if (!res.ok) {
      let msg = `Request failed (${res.status})`;
      try { msg = (await res.json()).error || msg; } catch {}
      throw new Error(msg);
    }
    return res.json();
  }

  async function refresh() { return applyCart(await request('/api/cart')); }
  async function add(item) {
    return applyCart(await request('/api/cart/items', { method: 'POST', body: JSON.stringify(item) }));
  }
  async function updateQty(itemId, qty) {
    return applyCart(await request(`/api/cart/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ qty }) }));
  }
  async function remove(itemId) {
    return applyCart(await request(`/api/cart/items/${itemId}`, { method: 'DELETE' }));
  }
  async function clear() {
    return applyCart(await request('/api/cart', { method: 'DELETE' }));
  }

  // One-time migration from the old localStorage cart. Runs at most once;
  // removes the key on success so we don't double-add on every load.
  async function migrateLegacy() {
    let legacy;
    try { legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]'); } catch { legacy = []; }
    if (!Array.isArray(legacy) || legacy.length === 0) return;
    for (const it of legacy) {
      if (!it || !it.id || !it.color || !it.size) continue;
      try {
        await add({ productId: it.id, color: it.color, size: it.size, qty: it.qty || 1 });
      } catch (_) { /* ignore — product may have been removed */ }
    }
    localStorage.removeItem(LEGACY_KEY);
  }

  // Cross-tab refresh: re-sync when our tab regains focus (covers the case
  // where another tab modified the same session cart).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh().catch(() => {});
  });

  // Mobile nav toggle (unchanged from the old build).
  function initNavToggle() {
    const btn = document.querySelector('.nav-toggle');
    const nav = document.getElementById('primary-nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A' && window.matchMedia('(max-width: 767px)').matches) {
        nav.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    initNavToggle();
    updateBadge();
    try {
      await migrateLegacy();
      await refresh();
    } catch (err) {
      console.warn('Cart sync failed:', err.message);
    }
  });

  window.JRsCart = {
    state,
    items: () => state.items,
    count: () => state.count,
    subtotal: () => state.subtotal,
    refresh, add, updateQty, remove, clear,
  };
})();
