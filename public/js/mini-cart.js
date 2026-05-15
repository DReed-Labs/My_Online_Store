/* mini-cart.js — slide-in cart drawer. Available on every page.
 *
 * Progressive enhancement: with JS, clicking the nav Cart link opens the
 * drawer. Without JS, the link just navigates to /cart as normal.
 */
(function () {
  const drawer = document.getElementById('mini-cart');
  if (!drawer) return;

  const panel = drawer.querySelector('.mini-cart__panel');
  const itemsEl = document.getElementById('mini-cart-items');
  const emptyEl = document.getElementById('mini-cart-empty');
  const subtotalEl = drawer.querySelector('[data-mini-cart-subtotal]');
  const countEl = drawer.querySelector('[data-mini-cart-count]');
  const checkoutBtn = document.getElementById('mini-cart-checkout');
  const closeBtn = drawer.querySelector('.mini-cart__close');

  const fmt = (n) => n.toFixed(2);
  let lastFocus = null;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
  }

  function lineHTML(line) {
    const key = window.JRsCart.lineKey(line);
    const href = `/product/${encodeURIComponent(line.id)}`;
    return `
      <li class="mini-cart-line" data-key="${escapeHtml(key)}">
        <a class="mini-cart-line__media" href="${href}">
          <img src="${escapeHtml(line.image)}" alt="" width="64" height="64" loading="lazy">
        </a>
        <div class="mini-cart-line__body">
          <h3 class="mini-cart-line__name"><a href="${href}">${escapeHtml(line.name)}</a></h3>
          <p class="mini-cart-line__meta">${escapeHtml(line.color)} · ${escapeHtml(line.size)}</p>
          <div class="mini-cart-line__controls">
            <div class="mini-cart-line__qty" role="group" aria-label="Quantity for ${escapeHtml(line.name)}">
              <button type="button" data-act="dec" aria-label="Decrease quantity">−</button>
              <span aria-live="polite">${line.qty}</span>
              <button type="button" data-act="inc" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="mini-cart-line__remove" data-act="remove">Remove</button>
          </div>
        </div>
        <p class="mini-cart-line__price">$${fmt(line.price * line.qty)}</p>
      </li>`;
  }

  function render() {
    const items = window.JRsCart.read();
    itemsEl.innerHTML = items.map(lineHTML).join('');
    const isEmpty = items.length === 0;
    emptyEl.toggleAttribute('hidden', !isEmpty);
    itemsEl.toggleAttribute('hidden', isEmpty);
    if (countEl) countEl.textContent = window.JRsCart.count(items);
    if (subtotalEl) subtotalEl.textContent = fmt(window.JRsCart.subtotal(items));
    if (checkoutBtn) checkoutBtn.disabled = isEmpty;
  }

  function isOpen() { return drawer.getAttribute('aria-hidden') === 'false'; }

  function open() {
    if (isOpen()) return;
    lastFocus = document.activeElement;
    render();
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('mini-cart-open');
    // Defer focus so the transition starts before focus jumps.
    setTimeout(() => closeBtn?.focus(), 50);
  }

  function close() {
    if (!isOpen()) return;
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('mini-cart-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  // Close triggers: backdrop, close button, any [data-mini-cart-close].
  drawer.addEventListener('click', (e) => {
    if (e.target.closest('[data-mini-cart-close]')) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) close(); });

  // Line controls.
  itemsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const li = e.target.closest('.mini-cart-line');
    if (!li) return;
    const key = li.dataset.key;
    const line = window.JRsCart.read().find((l) => window.JRsCart.lineKey(l) === key);
    if (!line) return;

    const act = btn.dataset.act;
    if (act === 'inc') window.JRsCart.updateQty(key, line.qty + 1);
    else if (act === 'dec') {
      if (line.qty <= 1) window.JRsCart.remove(key);
      else window.JRsCart.updateQty(key, line.qty - 1);
    }
    else if (act === 'remove') window.JRsCart.remove(key);
  });

  // Cart line items are re-rendered when state changes (including from other tabs).
  document.addEventListener('cart:change', () => { if (isOpen()) render(); });

  // Intercept nav Cart link → open drawer. Don't intercept if we're already on /cart.
  document.querySelectorAll('.nav-cart').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (window.location.pathname === '/cart') return;
      e.preventDefault();
      open();
    });
  });

  // Public API in case other scripts want to open the drawer (e.g. after add-to-cart).
  window.JRsMiniCart = { open, close, isOpen };
})();
