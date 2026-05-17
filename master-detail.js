document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const masterId = params.get('id') || window.BP_DATA.masters[0].id;
  const master = window.BP.findMaster(masterId) || window.BP_DATA.masters[0];
  const main = document.querySelector('[data-master-detail-main]');
  const info = document.querySelector('[data-master-info-card]');
  const gallery = document.querySelector('[data-master-gallery]');
  const preview = document.querySelector('[data-master-reviews-preview]');
  const formWrap = document.querySelector('[data-review-form-wrap]');
  const loginNote = document.querySelector('[data-review-login-note]');
  const form = document.querySelector('[data-review-form]');
  const reviewsLink = document.querySelector('[data-reviews-link]');
  const pageLink = document.querySelector('[data-review-page-link]');

  if (reviewsLink) reviewsLink.href = `reviews.html?master=${master.id}`;
  if (pageLink) pageLink.href = `reviews.html?master=${master.id}`;

  const renderStars = (rating) => window.BP.formatStars(rating);

  function renderReviews() {
    const reviews = window.BP.getReviews(master.id);
    if (preview) {
      preview.innerHTML = reviews.slice(0, 3).map((review) => `
        <div class="review-card p-3">
          <div class="d-flex justify-content-between gap-2 flex-wrap mb-2">
            <strong>${review.name}</strong>
            <div class="rating">${renderStars(review.rating)}</div>
          </div>
          <div class="small-note mb-2">${review.date || ''}</div>
          <div>${review.text}</div>
        </div>
      `).join('');
    }
  }

  if (main) {
    main.innerHTML = `
      <div class="row g-4 align-items-center">
        <div class="col-md-4">
          <img class="w-100 master-photo rounded-4" src="${window.BP.makeAvatar(master.photoLabel)}" alt="Фото мастера ${master.name}">
        </div>
        <div class="col-md-8">
          <div class="d-flex justify-content-between flex-wrap gap-2 mb-2">
            <span class="badge badge-status rounded-pill">${master.experience}</span>
            <div class="rating">${renderStars(master.rating)}</div>
          </div>
          <h1 class="section-title h2 mb-2">${master.name}</h1>
          <div class="fs-5 mb-3">${master.specialization}</div>
          <p class="text-muted mb-4">${master.bio}</p>
          <div class="d-flex flex-wrap gap-2">
            ${master.services.map((service) => `<span class="badge badge-soft rounded-pill">${window.BP_DATA.services.find(s => s.category === service)?.categoryLabel || service}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }

  if (info) {
    info.innerHTML = `
      <h2 class="h5 mb-3">Информация о мастере</h2>
      <ul class="list-unstyled small-note mb-0">
        <li class="mb-2"><strong>Специализация:</strong> ${master.specialization}</li>
        <li class="mb-2"><strong>Стаж:</strong> ${master.experience}</li>
        <li class="mb-2"><strong>Город:</strong> ${master.city}</li>
        <li class="mb-2"><strong>Рейтинг:</strong> ${master.rating.toFixed(1)}</li>
      </ul>
    `;
  }

  if (gallery) {
    gallery.innerHTML = Array.from({ length: 4 }).map(() => `
      <div class="gallery-work-block">Фото работы</div>
    `).join('');
  }

  function syncAuth() {
    const loggedIn = window.BP.isLoggedIn();
    formWrap?.classList.toggle('d-none', !loggedIn);
    loginNote?.classList.toggle('d-none', loggedIn);
  }

  renderReviews();
  syncAuth();

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!window.BP.isLoggedIn()) {
      alert('Сначала войдите в аккаунт.');
      return;
    }
    const fd = new FormData(form);
    window.BP.saveReview(master.id, {
      name: String(fd.get('name') || 'Гость'),
      rating: Number(fd.get('rating') || 5),
      text: String(fd.get('text') || ''),
      date: new Date().toLocaleDateString('ru-RU')
    });
    form.reset();
    renderReviews();
  });

  document.addEventListener('bp-auth-changed', syncAuth);
  document.addEventListener('bp-reviews-changed', (event) => {
    if (event.detail?.masterId === master.id) renderReviews();
  });
});
