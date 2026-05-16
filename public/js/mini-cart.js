/* mini-cart.js — slide-in cart drawer, hydrated from JRsCart cache.
 *
 * Re-renders when `cart:change` fires (so it stays accurate as items are
 * added/removed elsewhere on the page or in another tab).
 */
(function () {
  const drawer = document.getElementById('mini-cart');
  if (!drawer) return;

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
    const href = `/product/${encodeURIComponent(line.productId)}`;
    return `
      <li class="mini-cart-line" data-id="${line.id}">
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
    const { items, count, subtotal } = window.JRsCart.state;
    itemsEl.innerHTML = items.map(lineHTML).join('');
    const isEmpty = items.length === 0;
    emptyEl.toggleAttribute('hidden', !isEmpty);
    itemsEl.toggleAttribute('hidden', isEmpty);
    if (countEl) countEl.textContent = count;
    if (subtotalEl) subtotalEl.textContent = fmt(subtotal);
    if (checkoutBtn) checkoutBtn.disabled = isEmpty;
  }

  function isOpen() { return drawer.getAttribute('aria-hidden') === 'false'; }

  function open() {
    if (isOpen()) return;
    lastFocus = document.activeElement;
    render();
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('mini-cart-open');
    setTimeout(() => closeBtn?.focus(), 50);
    // Sync from server in the background in case another tab changed things.
    window.JRsCart.refresh().catch(() => {});
  }

  function close() {
    if (!isOpen()) return;
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('mini-cart-open');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  drawer.addEventListener('click', (e) => {
    if (e.target.closest('[data-mini-cart-close]')) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) close(); });

  itemsEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const li = e.target.closest('.mini-cart-line');
    if (!li) return;
    const id = Number(li.dataset.id);
    const line = window.JRsCart.state.items.find((l) => l.id === id);
    if (!line) return;

    btn.disabled = true;
    try {
      const act = btn.dataset.act;
      if (act === 'inc') await window.JRsCart.updateQty(id, line.qty + 1);
      else if (act === 'dec') await window.JRsCart.updateQty(id, line.qty - 1);
      else if (act === 'remove') await window.JRsCart.remove(id);
    } catch (err) {
      console.warn(err);
    } finally {
      btn.disabled = false;
    }
  });

  // Wire the drawer's checkout button.
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Starting…';
      try {
        const res = await fetch('/api/checkout', { method: 'POST', credentials: 'same-origin' });
        const data = await res.json();
        if (!res.ok || !data.checkoutUrl) throw new Error(data.error || 'Checkout failed');
        window.location.href = data.checkoutUrl;
      } catch (err) {
        alert(err.message);
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Checkout';
      }
    });
    checkoutBtn.textContent = 'Checkout';
  }

  document.addEventListener('cart:change', () => { if (isOpen()) render(); });

  // Intercept nav Cart link → open drawer (unless we're already on /cart).
  document.querySelectorAll('.nav-cart').forEach((link) => {
    link.addEventListener('click', (e) => {
      if (window.location.pathname === '/cart') return;
      e.preventDefault();
      open();
    });
  });

  window.JRsMiniCart = { open, close, isOpen };
})();
