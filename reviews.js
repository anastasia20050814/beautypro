document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const masterId = params.get('master') || window.BP_DATA.masters[0].id;
  const master = window.BP.findMaster(masterId) || window.BP_DATA.masters[0];
  const list = document.querySelector('[data-reviews-list]');
  const masterCard = document.querySelector('[data-reviews-master-card]');
  const formWrap = document.querySelector('[data-review-form-wrap]');
  const loginNote = document.querySelector('[data-review-login-note]');
  const form = document.querySelector('[data-review-form]');
  const backLink = document.querySelector('[data-back-link]');
  const title = document.querySelector('[data-reviews-title]');

  if (backLink) backLink.href = `master-detail.html?id=${master.id}`;
  if (title) title.textContent = `Отзывы о мастере: ${master.name}`;

  async function render() {
    if (list) list.innerHTML = '<div class="small-note">Загрузка отзывов...</div>';
    try {
      const reviews = await window.API.getReviews(master.id);
      if (list) {
        list.innerHTML = reviews.length ? reviews.map((review) => `
          <div class="review-card p-3">
            <div class="d-flex justify-content-between gap-2 flex-wrap mb-2">
              <strong>${review.user_name || review.name || 'Клиент'}</strong>
              <div class="rating">${window.BP.formatStars(review.rating)}</div>
            </div>
            <div class="small-note mb-2">${review.created_at ? new Date(review.created_at).toLocaleDateString('ru-RU') : ''}</div>
            <div>${review.text}</div>
          </div>
        `).join('') : '<div class="small-note">Отзывов пока нет. Будьте первым!</div>';
      }
    } catch {
      if (list) list.innerHTML = '<div class="small-note">Не удалось загрузить отзывы.</div>';
    }
    if (masterCard) {
      masterCard.innerHTML = `
        <h2 class="h5 mb-3">О мастере</h2>
        <div class="d-flex align-items-center gap-3 mb-3">
          <img src="${window.BP.makeAvatar(master.photoLabel)}" class="rounded-4" alt="Фото мастера ${master.name}" style="width:88px;height:88px;object-fit:cover;">
          <div>
            <div class="fw-bold">${master.name}</div>
            <div class="small-note">${master.specialization}</div>
            <div class="rating">${window.BP.formatStars(master.rating)}</div>
          </div>
        </div>
        <p class="small-note mb-0">${master.shortBio}</p>
      `;
    }
  }

  function syncAuth() {
    const loggedIn = window.BP.isLoggedIn();
    formWrap?.classList.toggle('d-none', !loggedIn);
    loginNote?.classList.toggle('d-none', loggedIn);
  }

  render();
  syncAuth();

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!window.BP.isLoggedIn()) {
      alert('Сначала войдите в аккаунт.');
      return;
    }
    const fd = new FormData(form);
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Отправляем...'; }

    try {
      await window.API.addReview(
        master.id,
        Number(fd.get('rating') || 5),
        String(fd.get('text') || '')
      );
      form.reset();
      await render();
    } catch (err) {
      alert('Ошибка: ' + err.message);
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Отправить отзыв'; }
    }
  });

  document.addEventListener('bp-auth-changed', syncAuth);
});
