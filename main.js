// Общая логика сайта BeautyPro
(function () {
  const STORAGE_THEME = 'bpTheme';
  const STORAGE_AUTH = 'bpAuth';
  const STORAGE_REVIEWS = 'bpReviews';
  const STORAGE_BOOKINGS = 'bpBookings';

  const DEFAULT_AUTH = { loggedIn: false, name: '', role: 'client' };

  function safeParse(raw, fallback) {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function getAuth() {
    return safeParse(localStorage.getItem(STORAGE_AUTH), DEFAULT_AUTH);
  }

  function setAuth(next) {
    localStorage.setItem(STORAGE_AUTH, JSON.stringify(next));
    document.dispatchEvent(new CustomEvent('bp-auth-changed', { detail: next }));
  }

  function isLoggedIn() {
    return !!getAuth().loggedIn;
  }

  function applyTheme(theme) {
    const dark = theme === 'dark';
    document.body.classList.toggle('theme-dark', dark);
    localStorage.setItem(STORAGE_THEME, theme);

    const btn = document.querySelector('[data-theme-toggle]');
    if (btn) {
      btn.innerHTML = dark
        ? '<i class="bi bi-sun"></i> Светлая тема'
        : '<i class="bi bi-moon-stars"></i> Тёмная тема';
    }
  }

  function initTheme() {
    const saved = localStorage.getItem(STORAGE_THEME);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));

    document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
      applyTheme(document.body.classList.contains('theme-dark') ? 'light' : 'dark');
    });
  }

  function initActiveNav() {
    const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('[data-nav]').forEach((link) => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      if (href === current) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function initBookingModal() {
    const modalEl = document.getElementById('authPromptModal');
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('.btn-book');
      if (!trigger) return;

      const targetHref = trigger.dataset.target || 'booking.html';
      if (isLoggedIn()) {
        window.location.href = targetHref;
        return;
      }

      event.preventDefault();
      const loginLink = modalEl.querySelector('[data-login-link]');
      const registerLink = modalEl.querySelector('[data-register-link]');
      const returnUrl = encodeURIComponent(targetHref);
      if (loginLink) loginLink.href = `login.html?next=${returnUrl}`;
      if (registerLink) registerLink.href = `register.html?next=${returnUrl}`;
      modal.show();
    });
  }

  function initAuthStatus() {
    const badge = document.querySelector('[data-auth-badge]');
    const navbarAuthButtons = document.querySelectorAll('.navbar a[href="login.html"], .navbar a[href="register.html"], .navbar [data-logout]');
    const dashboardLogoutButtons = document.querySelectorAll('[data-dashboard-logout]');

    const adminLinks = document.querySelectorAll('[data-admin-link]');

    function render() {
      const auth = getAuth();
      if (badge) {
        badge.textContent = auth.loggedIn ? `Вы вошли как ${auth.name || 'гость'}` : 'Гость';
      }

      navbarAuthButtons.forEach((btn) => {
        btn.classList.toggle('d-none', auth.loggedIn);
      });

      dashboardLogoutButtons.forEach((btn) => {
        btn.classList.toggle('d-none', !auth.loggedIn);
      });

      adminLinks.forEach((link) => {
        link.classList.toggle('d-none', auth.role !== 'admin');
      });
    }

    render();
    document.addEventListener('bp-auth-changed', render);

    dashboardLogoutButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        setAuth(DEFAULT_AUTH);
        render();
        if (location.pathname.toLowerCase().includes('dashboard.html')) {
          location.href = 'index.html';
        }
      });
    });
  }

  function initAuthForms() {
    document.querySelectorAll('form[data-auth-form]').forEach((form) => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitBtn = form.querySelector('[type="submit"]');
        const originalText = submitBtn?.textContent || '';
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Загрузка...'; }

        const nameInput = form.querySelector('[name="name"]');
        const emailInput = form.querySelector('[name="email"]');
        const passwordInput = form.querySelector('[name="password"]');
        const isRegister = !!nameInput;

        try {
          let data;
          if (isRegister) {
            data = await window.API.register(
              nameInput.value.trim(),
              emailInput.value.trim(),
              passwordInput.value
            );
            setAuth({ loggedIn: true, name: data.user.name, role: data.user.role });

            // Предложить привязать Telegram после регистрации
            try {
              const codeRes = await fetch('/api/telegram/code', {
                method: 'POST',
                headers: { Authorization: `Bearer ${window.API.getToken()}` }
              });
              const codeData = await codeRes.json();
              const botUrl = `https://t.me/${codeData.botUsername}?start=${codeData.code}`;
              const wantTg = confirm(
                `✅ Регистрация прошла успешно!

Хотите привязать Telegram для получения напоминаний о записях за 12 часов?

Нажмите ОК — откроется бот, нажмите Start.`
              );
              if (wantTg) window.open(botUrl, '_blank');
            } catch {}

            const next = new URLSearchParams(location.search).get('next');
            location.href = next ? decodeURIComponent(next) : 'dashboard.html';
          } else {
            data = await window.API.login(
              emailInput.value.trim(),
              passwordInput.value
            );
            setAuth({ loggedIn: true, name: data.user.name, role: data.user.role });
            const next = new URLSearchParams(location.search).get('next');
            location.href = next ? decodeURIComponent(next) : 'dashboard.html';
          }
        } catch (err) {
          alert(err.message || 'Ошибка. Попробуй ещё раз.');
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
        }
      });
    });
  }

  function getReviews(masterId) {
    const stored = safeParse(localStorage.getItem(STORAGE_REVIEWS), {});
    const defaults = window.BP_DATA?.defaultReviews?.[masterId] || [];
    const current = stored[masterId] || [];
    return [...defaults, ...current].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }

  function saveReview(masterId, review) {
    const stored = safeParse(localStorage.getItem(STORAGE_REVIEWS), {});
    if (!stored[masterId]) stored[masterId] = [];
    stored[masterId].unshift(review);
    localStorage.setItem(STORAGE_REVIEWS, JSON.stringify(stored));
    document.dispatchEvent(new CustomEvent('bp-reviews-changed', { detail: { masterId } }));
  }

  function getBookings() {
    return safeParse(localStorage.getItem(STORAGE_BOOKINGS), []);
  }

  function saveBooking(booking) {
    const bookings = getBookings();
    bookings.unshift(booking);
    localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(bookings));
    document.dispatchEvent(new CustomEvent('bp-bookings-changed'));
  }

  function formatStars(value) {
    const full = Math.round(value);
    return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
  }

  function findService(id) {
    return window.BP_DATA?.services.find((item) => item.id === id);
  }

  function findMaster(id) {
    return window.BP_DATA?.masters.find((item) => item.id === id);
  }

  function serviceLabel(serviceId) {
    const item = findService(serviceId);
    return item ? item.name : 'Не выбрано';
  }

  function masterLabel(masterId) {
    const item = findMaster(masterId);
    return item ? item.name : 'Не выбран';
  }

  function formatDateRu(dateValue) {
    if (!dateValue) return '';
    if (typeof dateValue === 'string') {
      const parts = dateValue.split('-');
      if (parts.length === 3 && parts.every(Boolean)) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
    }
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return String(dateValue);
    return date.toLocaleDateString('ru-RU');
  }

  function makeAvatar(label) {
    const text = String(label || 'BP').trim().slice(0, 2).toUpperCase();
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900" role="img" aria-label="${text}">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0f766e"/>
            <stop offset="100%" stop-color="#b48b57"/>
          </linearGradient>
        </defs>
        <rect width="900" height="900" rx="72" fill="url(#g)"/>
        <circle cx="682" cy="210" r="180" fill="#ffffff" fill-opacity=".10"/>
        <circle cx="194" cy="708" r="220" fill="#ffffff" fill-opacity=".08"/>
        <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif" font-size="210" font-weight="700" fill="#ffffff">${text}</text>
      </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  // Избранное хранится в БД через /api/favorites
  // Кэш для текущей сессии
  let _favoritesCache = null;

  async function getFavorites() {
    if (!isLoggedIn()) return [];
    if (_favoritesCache !== null) return _favoritesCache;
    _favoritesCache = await window.API.getFavorites();
    return _favoritesCache;
  }

  async function isFavorite(masterId) {
    const favs = await getFavorites();
    return favs.includes(masterId);
  }

  async function toggleFavorite(masterId) {
    const favs = await getFavorites();
    if (favs.includes(masterId)) {
      await window.API.removeFavorite(masterId);
      _favoritesCache = favs.filter(id => id !== masterId);
    } else {
      await window.API.addFavorite(masterId);
      _favoritesCache = [...favs, masterId];
    }
  }

  window.BP = {
    getAuth,
    setAuth,
    isLoggedIn,
    applyTheme,
    getReviews,
    saveReview,
    getBookings,
    saveBooking,
    getFavorites,
    isFavorite,
    toggleFavorite,
    formatStars,
    findService,
    findMaster,
    serviceLabel,
    masterLabel,
    formatDateRu,
    makeAvatar
  };

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initActiveNav();
    initBookingModal();
    initAuthStatus();
    initAuthForms();
  });
})();
