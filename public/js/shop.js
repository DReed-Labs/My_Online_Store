/* shop.js — client-side filter/sort/search for /shop.
 * Operates on the existing server-rendered grid (no re-fetching).
 */
(function () {
  const form = document.getElementById('filters');
  const grid = document.getElementById('product-grid');
  if (!form || !grid) return;

  const cards = Array.from(grid.querySelectorAll('.product-card'));
  const countEl = document.querySelector('[data-result-count]');
  const emptyEl = document.getElementById('shop-empty');
  const emptyReset = document.getElementById('shop-empty-reset');
  const search = document.getElementById('search');
  const sortSel = document.getElementById('sort');

  // Allow deep-linking like /shop#cat=Men.
  function applyHash() {
    const m = /cat=([^&]+)/.exec(location.hash || '');
    if (!m) return;
    const cat = decodeURIComponent(m[1]);
    const radio = form.querySelector(`input[name="category"][value="${cat}"]`);
    if (radio) radio.checked = true;
  }

  function getState() {
    const data = new FormData(form);
    return {
      q: (data.get('search') || '').toString().trim().toLowerCase(),
      category: (data.get('category') || 'all').toString(),
      sort: (data.get('sort') || 'featured').toString(),
    };
  }

  function matches(card, { q, category }) {
    if (category !== 'all' && card.dataset.category !== category) return false;
    if (q && !card.dataset.name.includes(q)) return false;
    return true;
  }

  function sortCards(list, sort) {
    const copy = list.slice();
    switch (sort) {
      case 'newest':
        return copy.sort((a, b) => b.dataset.created.localeCompare(a.dataset.created));
      case 'price-asc':
        return copy.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
      case 'price-desc':
        return copy.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
      case 'name':
        return copy.sort((a, b) => a.dataset.name.localeCompare(b.dataset.name));
      default:
        return copy; // featured = server order
    }
  }

  function render() {
    const state = getState();
    const visible = [];
    cards.forEach((c) => {
      const ok = matches(c, state);
      c.toggleAttribute('hidden', !ok);
      if (ok) visible.push(c);
    });

    const sorted = sortCards(visible, state.sort);
    sorted.forEach((c) => grid.appendChild(c)); // reorder DOM

    if (countEl) countEl.textContent = `${visible.length} tee${visible.length === 1 ? '' : 's'}`;
    if (emptyEl) emptyEl.toggleAttribute('hidden', visible.length > 0);
  }

  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('reset', () => setTimeout(render, 0));
  if (emptyReset) emptyReset.addEventListener('click', () => { form.reset(); render(); });

  if (search) {
    search.addEventListener('keydown', (e) => { if (e.key === 'Escape') { search.value = ''; render(); } });
  }
  if (sortSel) sortSel.addEventListener('change', render);

  applyHash();
  render();
})();
