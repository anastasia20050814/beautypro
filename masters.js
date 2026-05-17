document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('[data-masters-grid]');
  const search = document.querySelector('[data-master-search]');
  let items = [...window.BP_DATA.masters].sort((a, b) => b.rating - a.rating);

  function render(list) {
    if (!grid) return;
    grid.innerHTML = list.map((item) => `
      <div class="col-md-6 col-lg-4">
        <div class="master-card h-100 overflow-hidden d-flex flex-column">
          <a href="master-detail.html?id=${item.id}" class="d-block text-decoration-none">
            <img class="w-100 master-photo" src="${window.BP.makeAvatar(item.photoLabel)}" alt="Фото мастера ${item.name}">
          </a>
          <div class="p-4 d-flex flex-column flex-grow-1">
            <div class="d-flex justify-content-between gap-2 mb-2">
              <span class="badge badge-status rounded-pill">${item.experience}</span>
              <div class="rating">${window.BP.formatStars(item.rating)}</div>
            </div>
            <h2 class="h5 mb-1"><a class="text-decoration-none" href="master-detail.html?id=${item.id}">${item.name}</a></h2>
            <div class="small-note mb-2">${item.specialization}</div>
            <p class="text-muted flex-grow-1">${item.shortBio}</p>
            <div class="d-flex gap-2 mt-auto pt-3">
              <a class="btn btn-outline-primary flex-fill" href="master-detail.html?id=${item.id}">Профиль</a>
              <button class="btn btn-primary flex-fill btn-book" data-target="booking.html?master=${item.id}">Записаться</button>
              <button class="btn btn-outline-secondary fav-btn px-3" data-id="${item.id}" title="В избранное">
                ${window.BP.isFavorite(item.id) ? '❤️' : '🤍'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.fav-btn');
      if (!btn) return;
      const id = btn.dataset.id;
      window.BP.toggleFavorite(id);
      btn.textContent = window.BP.isFavorite(id) ? '❤️' : '🤍';
    });
  }

  render(items);

  search?.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const haystack = `${item.name} ${item.specialization} ${item.shortBio}`.toLowerCase();
      return !q || haystack.includes(q);
    });
    render(filtered);
  });
});
