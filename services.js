document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('[data-services-grid]');
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const render = (filter = 'all') => {
    const items = window.BP_DATA.services.filter((service) => filter === 'all' || service.category === filter);
    if (!grid) return;
    grid.innerHTML = items.map((item) => `
      <div class="col-md-6 col-lg-4">
        <div class="service-card p-4 h-100">
          <div class="d-flex justify-content-between gap-2">
            <span class="badge badge-soft rounded-pill">${item.categoryLabel}</span>
            <span class="small-note">${item.duration}</span>
          </div>
          <h2 class="h5 mt-3">${item.name}</h2>
          <p class="text-muted">${item.description}</p>
          <div class="d-flex justify-content-between align-items-center mt-auto pt-2">
            <strong>${item.price}</strong>
            <button class="btn btn-primary btn-book" data-target="booking.html?service=${item.id}">Записаться</button>
          </div>
        </div>
      </div>
    `).join('');
  };

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.toggle('active', b === btn));
      render(btn.dataset.filter);
    });
  });

  render('all');
});
