/* product.js — quantity stepper + add-to-cart on /product/:id. */
(function () {
  const form = document.getElementById('add-to-cart-form');
  if (!form) return;

  const qtyInput = form.querySelector('#qty');
  const submit = form.querySelector('button[type="submit"]');
  const msg = document.getElementById('add-msg');
  let msgTimer;

  form.querySelectorAll('[data-qty-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = Number(btn.dataset.qtyStep);
      const next = Math.max(1, Math.min(10, Number(qtyInput.value || 1) + step));
      qtyInput.value = String(next);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const color = data.get('color');
    const size = data.get('size');
    if (!color || !size) {
      msg.textContent = 'Please choose a color and size.';
      return;
    }

    submit.disabled = true;
    const originalLabel = submit.textContent;
    submit.textContent = 'Adding…';

    try {
      await window.JRsCart.add({
        productId: form.dataset.productId,
        color,
        size,
        qty: Math.max(1, Number(data.get('qty') || 1)),
      });

      msg.textContent = `Added ${data.get('qty')} × ${form.dataset.productName} (${size}, ${color}) to cart.`;
      msg.style.color = 'var(--color-ink)';

      if (window.JRsMiniCart) window.JRsMiniCart.open();
    } catch (err) {
      msg.textContent = err.message || 'Could not add to cart.';
      msg.style.color = 'var(--color-accent)';
    } finally {
      submit.disabled = false;
      submit.textContent = originalLabel;
      clearTimeout(msgTimer);
      msgTimer = setTimeout(() => { msg.textContent = ''; }, 4000);
    }
  });
})();
