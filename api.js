// API клиент для BeautyPro
// Подключи этот файл первым скриптом в каждом HTML:
// <script src="api.js"></script>

const API_URL = '/api';

window.API = {
  // Токен из localStorage
  getToken() {
    return localStorage.getItem('bpToken');
  },

  // Заголовки с токеном
  headers() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  },

  // Регистрация
  async register(name, email, password) {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem('bpToken', data.token);
    return data;
  },

  // Вход
  async login(email, password) {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    localStorage.setItem('bpToken', data.token);
    return data;
  },

  // Выход
  logout() {
    localStorage.removeItem('bpToken');
  },

  // Создать запись
  async createBooking(booking) {
    const res = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(booking)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  // Мои записи
  async getBookings() {
    const res = await fetch(`${API_URL}/bookings`, { headers: this.headers() });
    return res.json();
  },

  // Удалить запись
  async deleteBooking(id) {
    await fetch(`${API_URL}/bookings/${id}`, {
      method: 'DELETE',
      headers: this.headers()
    });
  },

  // Отзывы мастера
  async getReviews(masterId) {
    const res = await fetch(`${API_URL}/reviews/${masterId}`);
    return res.json();
  },

  // Добавить отзыв
  async addReview(masterId, rating, text) {
    const res = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ master_id: masterId, rating, text })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },

  // Получить избранных мастеров (массив master_id)
  async getFavorites() {
    try {
      const res = await fetch(`${API_URL}/favorites`, { headers: this.headers() });
      return res.ok ? res.json() : [];
    } catch { return []; }
  },

  // Добавить мастера в избранное
  async addFavorite(masterId) {
    const res = await fetch(`${API_URL}/favorites/${masterId}`, {
      method: 'POST', headers: this.headers()
    });
    return res.json();
  },

  // Убрать мастера из избранного
  async removeFavorite(masterId) {
    const res = await fetch(`${API_URL}/favorites/${masterId}`, {
      method: 'DELETE', headers: this.headers()
    });
    return res.json();
  }
};
