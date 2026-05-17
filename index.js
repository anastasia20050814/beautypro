document.addEventListener('DOMContentLoaded', () => {
  const servicesWrap = document.querySelector('[data-home-services]');
  const mastersWrap = document.querySelector('[data-home-masters]');
  const testimonialsWrap = document.querySelector('[data-home-testimonials]');
  const services = window.BP_DATA.services.slice(0, 4);
  const masters = [...window.BP_DATA.masters].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const testimonials = window.BP_DATA.testimonials;

  if (servicesWrap) {
    servicesWrap.innerHTML = services.map((item) => `
      <div class="col-md-6 col-lg-3">
        <div class="service-card p-4 h-100 service-card-accent-1 d-flex flex-column">
          <div class="d-flex justify-content-between gap-2 align-items-start">
            <span class="badge badge-soft rounded-pill">${item.categoryLabel}</span>
            <span class="small-note">${item.duration}</span>
          </div>
          <h3 class="h5 mt-3 mb-2">${item.name}</h3>
          <p class="text-muted flex-grow-1">${item.description}</p>
          <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top" style="border-color:var(--border)!important">
            <strong class="fs-5">${item.price}</strong>
            <button class="btn btn-primary btn-sm btn-book" data-target="booking.html?service=${item.id}">Записаться</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  if (mastersWrap) {
    mastersWrap.innerHTML = masters.map((item) => `
      <div class="col-md-6 col-lg-3">
        <div class="master-card h-100 d-flex flex-column overflow-hidden">
          <a href="master-detail.html?id=${item.id}" class="d-block text-decoration-none">
            <img class="w-100 master-photo" src="${window.BP.makeAvatar(item.photoLabel)}" alt="Фото мастера ${item.name}">
          </a>
          <div class="p-4 d-flex flex-column flex-grow-1">
            <div class="d-flex justify-content-between gap-2 mb-2">
              <span class="badge badge-status rounded-pill">${item.experience}</span>
              <div class="rating">${window.BP.formatStars(item.rating)}</div>
            </div>
            <h3 class="h5 mb-1">${item.name}</h3>
            <p class="small-note flex-grow-1">${item.specialization}</p>
            <div class="d-flex gap-2 mt-auto pt-3">
              <a class="btn btn-outline-primary flex-fill" href="master-detail.html?id=${item.id}">Открыть профиль</a>
              <button class="btn btn-outline-secondary fav-btn px-3" data-id="${item.id}" title="В избранное">
                ${window.BP.isFavorite(item.id) ? '❤️' : '🤍'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    mastersWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.fav-btn');
      if (!btn) return;
      const id = btn.dataset.id;
      window.BP.toggleFavorite(id);
      btn.textContent = window.BP.isFavorite(id) ? '❤️' : '🤍';
    });
  }

  if (testimonialsWrap) {
    testimonialsWrap.innerHTML = testimonials.map((item, index) => `
      <div class="carousel-item ${index === 0 ? 'active' : ''}">
        <div class="p-4 p-md-5">
          <div class="row justify-content-center">
            <div class="col-lg-10">
              <div class="testimonial-quote mb-3"><i class="bi bi-quote"></i></div>
              <div class="d-flex justify-content-between flex-wrap gap-2 mb-3">
                <strong>${item.name}</strong>
                <div class="rating">${window.BP.formatStars(item.rating)}</div>
              </div>
              <p class="fs-5 mb-0">${item.text}</p>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }
});
