const ADMIN_URL = '/api/admin';

// Запуск панели
document.addEventListener('DOMContentLoaded', init);

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('bpToken')}`
  };
}

async function apiGet(path) {
  const res = await fetch(ADMIN_URL + path, { headers: adminHeaders() });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function apiPatch(path, body) {
  const res = await fetch(ADMIN_URL + path, {
    method: 'PATCH', headers: adminHeaders(), body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(ADMIN_URL + path, { method: 'DELETE', headers: adminHeaders() });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

// Навигация
function init() {
  // Разделы
  document.querySelectorAll('[data-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-section]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.section).classList.add('active');
      loadSection(btn.dataset.section);
    });
  });

  // Фильтр статуса
  document.getElementById('filterStatus')?.addEventListener('change', loadBookings);

  // Выход
  document.getElementById('adminLogout')?.addEventListener('click', () => {
    localStorage.removeItem('bpToken');
    localStorage.removeItem('bpAuth');
    location.href = 'index.html';
  });

  loadSection('stats');
}

function loadSection(section) {
  if (section === 'stats') loadStats();
  if (section === 'bookings') loadBookings();
  if (section === 'users') loadUsers();
  if (section === 'reviews') loadReviews();
}

// ── СТАТИСТИКА ───────────────────────────────────────────────

async function loadStats() {
  try {
    const data = await apiGet('/stats');
    document.getElementById('stat-bookings').textContent = data.bookings;
    document.getElementById('stat-pending').textContent = data.pending;
    document.getElementById('stat-users').textContent = data.users;
    document.getElementById('stat-reviews').textContent = data.reviews;
  } catch (err) {
    console.error(err);
  }
}

// ── ЗАПИСИ ───────────────────────────────────────────────────

const STATUS_LABELS = {
  pending: 'Ожидает',
  confirmed: 'Подтверждена',
  cancelled: 'Отменена'
};

function serviceLabel(id) {
  return window.BP_DATA?.services.find(s => s.id === id)?.name || id;
}
function masterLabel(id) {
  return window.BP_DATA?.masters.find(m => m.id === id)?.name || id;
}

async function loadBookings() {
  const tbody = document.getElementById('bookings-tbody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 small-note">Загрузка...</td></tr>';
  try {
    let bookings = await apiGet('/bookings');
    const filter = document.getElementById('filterStatus').value;
    if (filter) bookings = bookings.filter(b => b.status === filter);

    if (!bookings.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 small-note">Записей нет</td></tr>';
      return;
    }

    tbody.innerHTML = bookings.map(b => `
      <tr>
        <td>
          <div class="fw-semibold">${b.user_name || '—'}</div>
          <div class="small-note">${b.user_email || ''}</div>
        </td>
        <td>${serviceLabel(b.service_id)}</td>
        <td>${masterLabel(b.master_id)}</td>
        <td>${new Date(b.date).toLocaleDateString('ru-RU')}</td>
        <td>${b.time}</td>
        <td>
          <span class="status-badge status-${b.status}">${STATUS_LABELS[b.status] || b.status}</span>
        </td>
        <td>
          <div class="d-flex gap-1 flex-wrap">
            ${b.status !== 'confirmed' ? `<button class="btn btn-success btn-sm" onclick="changeStatus(${b.id},'confirmed')">✓</button>` : ''}
            ${b.status !== 'cancelled' ? `<button class="btn btn-warning btn-sm" onclick="changeStatus(${b.id},'cancelled')">✗</button>` : ''}
            <button class="btn btn-outline-danger btn-sm" onclick="deleteBooking(${b.id})">🗑</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">${err.message}</td></tr>`;
  }
}

async function changeStatus(id, status) {
  try {
    await apiPatch(`/bookings/${id}`, { status });
    loadBookings();
    loadStats();
  } catch (err) {
    alert('Ошибка: ' + err.message);
  }
}

async function deleteBooking(id) {
  if (!confirm('Удалить запись?')) return;
  try {
    await apiDelete(`/bookings/${id}`);
    loadBookings();
    loadStats();
  } catch (err) {
    alert('Ошибка: ' + err.message);
  }
}

// ── ПОЛЬЗОВАТЕЛИ ─────────────────────────────────────────────

async function loadUsers() {
  const tbody = document.getElementById('users-tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 small-note">Загрузка...</td></tr>';
  try {
    const users = await apiGet('/users');
    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 small-note">Пользователей нет</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td class="small-note">${u.id}</td>
        <td class="fw-semibold">${u.name}</td>
        <td>${u.email}</td>
        <td>
          <span class="badge ${u.role === 'admin' ? 'bg-danger' : 'bg-secondary'}">${u.role === 'admin' ? 'Админ' : 'Клиент'}</span>
        </td>
        <td class="small-note">${new Date(u.created_at).toLocaleDateString('ru-RU')}</td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-outline-secondary btn-sm"
              onclick="toggleRole(${u.id}, '${u.role}')">
              ${u.role === 'admin' ? '→ Клиент' : '→ Админ'}
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteUser(${u.id})">🗑</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">${err.message}</td></tr>`;
  }
}

async function toggleRole(id, currentRole) {
  const newRole = currentRole === 'admin' ? 'client' : 'admin';
  if (!confirm(`Сменить роль на "${newRole}"?`)) return;
  try {
    await apiPatch(`/users/${id}/role`, { role: newRole });
    loadUsers();
  } catch (err) {
    alert('Ошибка: ' + err.message);
  }
}

async function deleteUser(id) {
  if (!confirm('Удалить пользователя? Все его записи тоже удалятся.')) return;
  try {
    await apiDelete(`/users/${id}`);
    loadUsers();
    loadStats();
  } catch (err) {
    alert('Ошибка: ' + err.message);
  }
}

// ── ОТЗЫВЫ ───────────────────────────────────────────────────

async function loadReviews() {
  const tbody = document.getElementById('reviews-tbody');
  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 small-note">Загрузка...</td></tr>';
  try {
    const reviews = await apiGet('/reviews');
    if (!reviews.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 small-note">Отзывов нет</td></tr>';
      return;
    }
    tbody.innerHTML = reviews.map(r => `
      <tr>
        <td class="fw-semibold">${r.user_name || '—'}</td>
        <td>${masterLabel(r.master_id)}</td>
        <td>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</td>
        <td style="max-width:260px">${r.text}</td>
        <td class="small-note">${new Date(r.created_at).toLocaleDateString('ru-RU')}</td>
        <td>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteReview(${r.id})">🗑</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-danger">${err.message}</td></tr>`;
  }
}

async function deleteReview(id) {
  if (!confirm('Удалить отзыв?')) return;
  try {
    await apiDelete(`/reviews/${id}`);
    loadReviews();
    loadStats();
  } catch (err) {
    alert('Ошибка: ' + err.message);
  }
}
