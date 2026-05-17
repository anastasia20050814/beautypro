document.addEventListener('DOMContentLoaded', async () => {
  const auth = window.BP.getAuth();
  const title = document.querySelector('[data-dashboard-title]');
  const user = document.querySelector('[data-dashboard-user]');
  const bookingsWrap = document.querySelector('[data-dashboard-bookings]');
  const favoritesWrap = document.querySelector('[data-dashboard-favorites]');
  const count = document.querySelector('[data-dashboard-bookings-count]');
  const logoutBtn = document.querySelector('[data-dashboard-logout]');

  if (title) title.textContent = auth.loggedIn ? `Личный кабинет: ${auth.name}` : 'Личный кабинет';
  if (user) user.textContent = auth.loggedIn ? auth.name : 'Гость';

  if (bookingsWrap) {
    bookingsWrap.innerHTML = '<div class="small-note">Загрузка записей...</div>';
    try {
      const bookings = await window.API.getBookings();
      if (count) count.textContent = String(bookings.length);
      bookingsWrap.innerHTML = bookings.length ? bookings.map((item) => `
        <div class="review-card p-3">
          <div class="d-flex justify-content-between flex-wrap gap-2 mb-2">
            <strong>${window.BP.serviceLabel(item.service_id)}</strong>
            <span class="badge badge-status rounded-pill">${String(item.time).substring(0,5)}</span>
          </div>
          <div class="small-note mb-1">Мастер: ${window.BP.masterLabel(item.master_id)}</div>
          <div class="small-note">Дата: ${new Date(item.date).toLocaleDateString('ru-RU', {timeZone:'UTC'})}</div>
        </div>
      `).join('') : '<div class="small-note">Пока нет записей. Нажмите «Записаться».</div>';
    } catch {
      bookingsWrap.innerHTML = '<div class="small-note">Не удалось загрузить записи.</div>';
    }
  }

  if (favoritesWrap) {
    const favIds = await window.API.getFavorites();
    const favMasters = window.BP_DATA.masters.filter(m => favIds.includes(m.id));
    if (favMasters.length === 0) {
      favoritesWrap.closest('.card')?.querySelector('h2')?.closest('.card').querySelector('[data-dashboard-favorites]');
      favoritesWrap.innerHTML = '<div class="small-note col-12">Нет избранных мастеров. Нажмите 🤍 на странице мастеров чтобы добавить.</div>';
    } else {
      favoritesWrap.innerHTML = favMasters.map((item) => `
        <div class="col-md-4">
          <div class="master-card h-100 overflow-hidden d-flex flex-column">
            <a href="master-detail.html?id=${item.id}" class="d-block text-decoration-none">
              <img class="w-100 master-photo" src="${window.BP.makeAvatar(item.photoLabel)}" alt="Фото мастера ${item.name}">
            </a>
            <div class="p-3 d-flex flex-column flex-grow-1">
              <div class="fw-bold mb-1">${item.name}</div>
              <div class="small-note mb-2 flex-grow-1">${item.specialization}</div>
              <div class="rating mb-3">${window.BP.formatStars(item.rating)}</div>
              <div class="d-flex gap-2">
                <a class="btn btn-outline-primary btn-sm flex-fill" href="master-detail.html?id=${item.id}">Профиль</a>
                <button class="btn btn-outline-secondary btn-sm fav-btn px-2" data-id="${item.id}" title="Убрать из избранного">❤️</button>
              </div>
            </div>
          </div>
        </div>
      `).join('');

      favoritesWrap.addEventListener('click', async (e) => {
        const btn = e.target.closest('.fav-btn');
        if (!btn) return;
        await window.BP.toggleFavorite(btn.dataset.id);
        location.reload();
      });
    }
  }

  // Phone editing
  const phoneInput = document.getElementById('phoneInput');
  const savePhoneBtn = document.getElementById('savePhone');
  const phoneMsg = document.getElementById('phoneMsg');

  if (phoneInput) {
    const savedPhone = localStorage.getItem('bpPhone') || '';
    phoneInput.value = savedPhone;
  }

  savePhoneBtn?.addEventListener('click', () => {
    const phone = phoneInput.value.trim();
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 11) {
      phoneMsg.textContent = 'Введите номер из 11 цифр, например +79991234567';
      phoneMsg.style.color = 'var(--danger, red)';
      return;
    }
    localStorage.setItem('bpPhone', phone);
    phoneMsg.textContent = 'Номер сохранён ✓';
    phoneMsg.style.color = 'var(--primary)';
    setTimeout(() => phoneMsg.textContent = '', 3000);
  });

  // ── Telegram привязка ───────────────────────────────────────
  async function checkTgStatus() {
    try {
      const res = await fetch('/api/telegram/status', { headers: { Authorization: `Bearer ${window.API.getToken()}` } });
      const data = await res.json();
      document.getElementById('tgStatus').textContent = '';
      if (data.linked) {
        document.getElementById('tgLinked').classList.remove('d-none');
        document.getElementById('tgNotLinked').classList.add('d-none');
      } else {
        document.getElementById('tgLinked').classList.add('d-none');
        document.getElementById('tgNotLinked').classList.remove('d-none');
      }
    } catch { document.getElementById('tgStatus').textContent = 'Не удалось загрузить статус.'; }
  }

  document.getElementById('tgGetCode')?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/telegram/code', { method: 'POST', headers: { Authorization: `Bearer ${window.API.getToken()}` } });
      const data = await res.json();
      document.getElementById('tgCode').textContent = data.code;
      document.getElementById('tgBotName').textContent = '@' + data.botUsername;
      document.getElementById('tgBotLink').href = `https://t.me/${data.botUsername}?start=${data.code}`;
      document.getElementById('tgCodeBlock').classList.remove('d-none');
    } catch { alert('Ошибка получения кода'); }
  });

  document.getElementById('tgUnlink')?.addEventListener('click', async () => {
    if (!confirm('Отвязать Telegram?')) return;
    await fetch('/api/telegram', { method: 'DELETE', headers: { Authorization: `Bearer ${window.API.getToken()}` } });
    checkTgStatus();
  });

  checkTgStatus();

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.BP.setAuth({ loggedIn: false, name: '', role: 'client' });
      window.location.href = 'index.html';
    });
  }
});
