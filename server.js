require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const initBot = require('./bot');
const swaggerUi = require('swagger-ui-express');
const YAML = require('js-yaml');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../BeautyPro-4')));

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Нет токена' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Токен недействителен' }); }
}

function adminMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Нет токена' });
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== 'admin') return res.status(403).json({ error: 'Нет прав администратора' });
    req.user = user; next();
  } catch { res.status(401).json({ error: 'Токен недействителен' }); }
}

// АВТОРИЗАЦИЯ
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Заполни все поля' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role',
      [name, email, hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    console.error('Регистрация:', err.message);
    if (err.code === '23505') return res.status(400).json({ error: 'Email уже используется' });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: 'Пользователь не найден' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(400).json({ error: 'Неверный пароль' });
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Вход:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ЗАПИСИ
app.get('/api/bookings/slots', async (req, res) => {
  const { master_id, date } = req.query;
  if (!master_id || !date) return res.json([]);
  try {
    const result = await pool.query("SELECT time FROM bookings WHERE master_id = $1 AND date = $2 AND status != 'cancelled'", [master_id, date]);
    res.json(result.rows.map(r => r.time));
  } catch { res.json([]); }
});

app.post('/api/bookings', authMiddleware, async (req, res) => {
  const { service_id, master_id, date, time } = req.body;
  try {
    const slot = await pool.query("SELECT id FROM bookings WHERE master_id=$1 AND date=$2 AND time=$3 AND status!='cancelled'", [master_id, date, time]);
    if (slot.rows.length > 0) return res.status(400).json({ error: 'Это время уже занято. Выберите другое.' });
    const dup = await pool.query('SELECT id FROM bookings WHERE user_id=$1 AND master_id=$2 AND service_id=$3 AND date=$4', [req.user.id, master_id, service_id, date]);
    if (dup.rows.length > 0) return res.status(400).json({ error: 'Вы уже записаны к этому мастеру на эту услугу в этот день.' });
    const result = await pool.query(
      'INSERT INTO bookings (user_id, service_id, master_id, date, time) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, service_id, master_id, date, time]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Запись:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bookings', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bookings WHERE user_id=$1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/bookings/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM bookings WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ОТЗЫВЫ
app.post('/api/reviews', authMiddleware, async (req, res) => {
  const { master_id, rating, text } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO reviews (user_id, master_id, rating, text) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.id, master_id, rating, text]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reviews/:masterId', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as user_name FROM reviews r LEFT JOIN users u ON r.user_id=u.id WHERE r.master_id=$1 ORDER BY r.created_at DESC`,
      [req.params.masterId]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADMIN: СТАТИСТИКА
app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const [b, u, r, p] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM bookings'),
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM reviews'),
      pool.query("SELECT COUNT(*) FROM bookings WHERE status='pending'"),
    ]);
    res.json({ bookings: +b.rows[0].count, users: +u.rows[0].count, reviews: +r.rows[0].count, pending: +p.rows[0].count });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADMIN: ЗАПИСИ
app.get('/api/admin/bookings', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, u.name as user_name, u.email as user_email FROM bookings b LEFT JOIN users u ON b.user_id=u.id ORDER BY b.date DESC, b.time ASC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/admin/bookings/:id', adminMiddleware, async (req, res) => {
  const { status } = req.body;
  if (!['pending','confirmed','cancelled'].includes(status)) return res.status(400).json({ error: 'Недопустимый статус' });
  try {
    const result = await pool.query('UPDATE bookings SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/bookings/:id', adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM bookings WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADMIN: ПОЛЬЗОВАТЕЛИ
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/admin/users/:id/role', adminMiddleware, async (req, res) => {
  const { role } = req.body;
  if (!['client','admin'].includes(role)) return res.status(400).json({ error: 'Недопустимая роль' });
  try {
    const result = await pool.query('UPDATE users SET role=$1 WHERE id=$2 RETURNING id,name,email,role', [role, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/users/:id', adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADMIN: ОТЗЫВЫ
app.get('/api/admin/reviews', adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as user_name FROM reviews r LEFT JOIN users u ON r.user_id=u.id ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/reviews/:id', adminMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM reviews WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ИЗБРАННОЕ ────────────────────────────────────────────────

// Получить избранных мастеров
app.get('/api/favorites', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT master_id, created_at FROM favorites WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows.map(r => r.master_id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Добавить в избранное
app.post('/api/favorites/:masterId', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO favorites (user_id, master_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, req.params.masterId]
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Убрать из избранного
app.delete('/api/favorites/:masterId', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND master_id = $2',
      [req.user.id, req.params.masterId]
    );
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── МАСТЕРА И УСЛУГИ ИЗ БД (опционально) ────────────────────
// Примечание: в текущей учебной версии мастера и услуги
// хранятся в data.js на клиентской стороне.
// Эти маршруты возвращают данные из БД если они там есть.

app.get('/api/masters', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM masters WHERE is_active = TRUE ORDER BY full_name'
    );
    if (result.rows.length === 0) {
      return res.json({ source: 'static', message: 'Данные хранятся в data.js' });
    }
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/services', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, c.name as category_label
       FROM services s
       LEFT JOIN service_categories c ON s.category_id = c.id
       WHERE s.is_active = TRUE
       ORDER BY s.category_id, s.name`
    );
    if (result.rows.length === 0) {
      return res.json({ source: 'static', message: 'Данные хранятся в data.js' });
    }
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── TELEGRAM ─────────────────────────────────────────────────

// Начало регистрации через Telegram
app.get('/api/telegram/register/start', async (req, res) => {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  try {
    // Сохраняем временный код в отдельной таблице
    await pool.query(
      `INSERT INTO telegram_reg_codes (code, created_at, expires_at)
       VALUES ($1, NOW(), NOW() + INTERVAL '10 minutes')
       ON CONFLICT DO NOTHING`,
      [code]
    );
    res.json({ code, botUsername: process.env.BOT_USERNAME || 'beautypro_bot' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Проверка статуса Telegram-регистрации
app.get('/api/telegram/register/status', async (req, res) => {
  const { code } = req.query;
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role FROM telegram_reg_codes t
       JOIN users u ON u.telegram_chat_id = t.chat_id
       WHERE t.code = $1 AND t.chat_id IS NOT NULL`,
      [code]
    );
    if (!result.rows.length) return res.json({ ready: false });

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    // Удаляем использованный код
    await pool.query('DELETE FROM telegram_reg_codes WHERE code = $1', [code]);
    res.json({ ready: true, token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Генерация кода привязки Telegram
app.post('/api/telegram/code', authMiddleware, async (req, res) => {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  try {
    await pool.query('UPDATE users SET telegram_code = $1 WHERE id = $2', [code, req.user.id]);
    res.json({ code, botUsername: process.env.BOT_USERNAME || 'beautypro_bot' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Отвязать Telegram
app.delete('/api/telegram', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE users SET telegram_chat_id = NULL, telegram_code = NULL WHERE id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Статус привязки
app.get('/api/telegram/status', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT telegram_chat_id FROM users WHERE id = $1', [req.user.id]);
    res.json({ linked: !!result.rows[0]?.telegram_chat_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Сервер: http://localhost:${PORT}`);
  console.log(`🌐 Сайт: http://localhost:${PORT}/index.html`);
  console.log(`🔐 Админка: http://localhost:${PORT}/admin.html`);
  initBot(pool);
});
