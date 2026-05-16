/* cart-page.js — interactive controls on /cart.
 *
 * The cart page is server-rendered. This file:
 *   - re-renders the item list after API mutations
 *   - wires qty +/- buttons, qty input, and Remove buttons
 *   - drives the Checkout button
 */
(function () {
  const list = document.getElementById('cart-items');
  const empty = document.getElementById('cart-empty');
  const subtotalEl = document.querySelector('[data-summary="subtotal"]');
  const totalEl = document.querySelector('[data-summary="total"]');
  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutMsg = document.getElementById('checkout-msg');
  if (!list) return;

  const fmt = (n) => n.toFixed(2);

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
  }

  function lineHTML(line) {
    const href = `/product/${encodeURIComponent(line.productId)}`;
    return `
      <li class="cart-line" data-id="${line.id}">
        <a class="cart-line__media" href="${href}">
          <img src="${escapeHtml(line.image)}" alt="${escapeHtml(line.name)}" width="96" height="96">
        </a>
        <div class="cart-line__body">
          <div class="cart-line__head">
            <div>
              <h3 class="cart-line__name"><a href="${href}" style="text-decoration:none;color:inherit">${escapeHtml(line.name)}</a></h3>
              <p class="cart-line__meta">${escapeHtml(line.color)} · Size ${escapeHtml(line.size)}</p>
            </div>
            <p class="cart-line__price">$${fmt(line.price * line.qty)}</p>
          </div>
          <div class="cart-line__actions">
            <div class="qty">
              <button type="button" class="qty__btn" data-act="dec" aria-label="Decrease quantity">−</button>
              <input type="number" value="${line.qty}" min="1" max="10" inputmode="numeric" aria-label="Quantity">
              <button type="button" class="qty__btn" data-act="inc" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="cart-line__remove" data-act="remove">Remove</button>
          </div>
        </div>
      </li>`;
  }

  function render() {
    const { items, subtotal } = window.JRsCart.state;
    list.innerHTML = items.map(lineHTML).join('');
    const isEmpty = items.length === 0;
    empty.toggleAttribute('hidden', !isEmpty);
    list.toggleAttribute('hidden', isEmpty);
    subtotalEl.textContent = fmt(subtotal);
    totalEl.textContent = fmt(subtotal);
    if (checkoutBtn) checkoutBtn.disabled = isEmpty;
  }

  async function withRowDisabled(li, fn) {
    li.querySelectorAll('button, input').forEach((el) => (el.disabled = true));
    try { await fn(); }
    catch (err) { console.warn(err); }
  }

  list.addEventListener('click', async (e) => {
    const li = e.target.closest('.cart-line');
    if (!li) return;
    const act = e.target.dataset.act;
    if (!act) return;
    const id = Number(li.dataset.id);
    const line = window.JRsCart.state.items.find((l) => l.id === id);
    if (!line) return;

    await withRowDisabled(li, async () => {
      if (act === 'inc') await window.JRsCart.updateQty(id, line.qty + 1);
      else if (act === 'dec') await window.JRsCart.updateQty(id, line.qty - 1);
      else if (act === 'remove') await window.JRsCart.remove(id);
    });
  });

  list.addEventListener('change', async (e) => {
    if (!e.target.matches('.qty input')) return;
    const li = e.target.closest('.cart-line');
    const next = Math.max(1, Math.min(10, Number(e.target.value) || 1));
    await withRowDisabled(li, () => window.JRsCart.updateQty(Number(li.dataset.id), next));
  });

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      checkoutBtn.disabled = true;
      const original = checkoutBtn.textContent;
      checkoutBtn.textContent = 'Starting checkout…';
      try {
        const res = await fetch('/api/checkout', { method: 'POST', credentials: 'same-origin' });
        const data = await res.json();
        if (!res.ok || !data.checkoutUrl) throw new Error(data.error || 'Checkout failed');
        window.location.href = data.checkoutUrl;
      } catch (err) {
        if (checkoutMsg) checkoutMsg.textContent = err.message;
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = original;
      }
    });
  }

  document.addEventListener('cart:change', render);
  // No initial render — server already rendered the list. cart.js will fire
  // cart:change after its refresh resolves, which keeps us in sync.
})();
