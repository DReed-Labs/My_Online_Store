/* cart-page.js — renders the cart contents on /cart, hydrated from localStorage. */
(function () {
  const list = document.getElementById('cart-items');
  const empty = document.getElementById('cart-empty');
  const subtotalEl = document.querySelector('[data-summary="subtotal"]');
  const totalEl = document.querySelector('[data-summary="total"]');
  const checkoutBtn = document.getElementById('checkout-btn');
  if (!list) return;

  const fmt = (n) => n.toFixed(2);

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
  }

  function lineHTML(line) {
    const key = window.JRsCart.lineKey(line);
    return `
      <li class="cart-line" data-key="${escapeHtml(key)}">
        <a class="cart-line__media" href="/product/${encodeURIComponent(line.id)}">
          <img src="${escapeHtml(line.image)}" alt="${escapeHtml(line.name)}" width="96" height="96">
        </a>
        <div class="cart-line__body">
          <div class="cart-line__head">
            <div>
              <h3 class="cart-line__name"><a href="/product/${encodeURIComponent(line.id)}" style="text-decoration:none;color:inherit">${escapeHtml(line.name)}</a></h3>
              <p class="cart-line__meta">${escapeHtml(line.color)} · Size ${escapeHtml(line.size)}</p>
            </div>
            <p class="cart-line__price">$${fmt(line.price * line.qty)}</p>
          </div>
          <div class="cart-line__actions">
            <div class="qty">
              <button type="button" class="qty__btn" data-act="dec" aria-label="Decrease quantity">−</button>
              <input type="number" value="${line.qty}" min="1" max="99" inputmode="numeric" aria-label="Quantity">
              <button type="button" class="qty__btn" data-act="inc" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="cart-line__remove" data-act="remove">Remove</button>
          </div>
        </div>
      </li>`;
  }

  function render() {
    const items = window.JRsCart.read();
    list.innerHTML = items.map(lineHTML).join('');
    const isEmpty = items.length === 0;
    empty.toggleAttribute('hidden', !isEmpty);
    list.toggleAttribute('hidden', isEmpty);

    const sub = window.JRsCart.subtotal(items);
    subtotalEl.textContent = fmt(sub);
    totalEl.textContent = fmt(sub);
    if (checkoutBtn) checkoutBtn.disabled = isEmpty;
  }

  list.addEventListener('click', (e) => {
    const li = e.target.closest('.cart-line');
    if (!li) return;
    const key = li.dataset.key;
    const act = e.target.dataset.act;
    if (!act) return;

    const items = window.JRsCart.read();
    const line = items.find((l) => window.JRsCart.lineKey(l) === key);
    if (!line) return;

    if (act === 'inc') window.JRsCart.updateQty(key, line.qty + 1);
    else if (act === 'dec') window.JRsCart.updateQty(key, line.qty - 1);
    else if (act === 'remove') window.JRsCart.remove(key);
  });

  list.addEventListener('change', (e) => {
    if (e.target.matches('.qty input')) {
      const li = e.target.closest('.cart-line');
      const next = Math.max(1, Math.min(99, Number(e.target.value) || 1));
      window.JRsCart.updateQty(li.dataset.key, next);
    }
  });

  document.addEventListener('cart:change', render);
  render();
})();
