/* product.js — quantity stepper + add-to-cart on /product/:id. */
(function () {
  const form = document.getElementById('add-to-cart-form');
  if (!form) return;

  const qtyInput = form.querySelector('#qty');
  form.querySelectorAll('[data-qty-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = Number(btn.dataset.qtyStep);
      const next = Math.max(1, Math.min(10, Number(qtyInput.value || 1) + step));
      qtyInput.value = String(next);
    });
  });

  const msg = document.getElementById('add-msg');
  let msgTimer;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const color = data.get('color');
    const size = data.get('size');
    if (!color || !size) {
      msg.textContent = 'Please choose a color and size.';
      return;
    }
    const item = {
      id: form.dataset.productId,
      name: form.dataset.productName,
      price: Number(form.dataset.productPrice),
      image: form.dataset.productImage,
      color,
      size,
      qty: Math.max(1, Number(data.get('qty') || 1)),
    };
    window.JRsCart.add(item);

    msg.textContent = `Added ${item.qty} × ${item.name} (${size}, ${color}) to cart.`;
    msg.style.color = 'var(--color-ink)';
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => { msg.textContent = ''; }, 4000);

    // Open the mini-cart so the user sees what they just added.
    if (window.JRsMiniCart) window.JRsMiniCart.open();
  });
})();
