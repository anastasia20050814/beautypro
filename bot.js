const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

function initBot(pool) {
  const token = process.env.TELEGRAM_TOKEN;
  if (!token) {
    console.log('⚠️  TELEGRAM_TOKEN не найден, бот не запущен');
    return;
  }

  const bot = new TelegramBot(token, { polling: true });
  console.log('🤖 Телеграм-бот запущен');

  // ── /start ───────────────────────────────────────────────

  bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const param = (match[1] || '').trim();

    if (param.startsWith('REG_')) {
      // Регистрация через Telegram
      const code = param.replace('REG_', '');
      try {
        const existing = await pool.query('SELECT code FROM telegram_reg_codes WHERE code = $1 AND expires_at > NOW()', [code]);
        if (!existing.rows.length) {
          return bot.sendMessage(chatId, '❌ Код недействителен или истёк. Попробуйте снова на сайте.');
        }

        // Проверяем не зарегистрирован ли уже этот chat_id
        const existUser = await pool.query('SELECT id, name FROM users WHERE telegram_chat_id = $1', [chatId]);
        if (existUser.rows.length > 0) {
          await pool.query('UPDATE telegram_reg_codes SET chat_id = $1 WHERE code = $2', [chatId, code]);
          return bot.sendMessage(chatId,
            `✅ Привет, ${existUser.rows[0].name}! Вы уже зарегистрированы. Выполняем вход...`
          );
        }

        // Создаём нового пользователя
        const firstName = msg.from.first_name || '';
        const lastName = msg.from.last_name || '';
        const name = (firstName + ' ' + lastName).trim() || 'Пользователь';
        const email = `tg_${chatId}@beautypro.local`;
        const hash = require('bcryptjs').hashSync(Math.random().toString(36), 10);

        const newUser = await pool.query(
          'INSERT INTO users (name, email, password_hash, telegram_chat_id) VALUES ($1,$2,$3,$4) RETURNING id, name',
          [name, email, hash, chatId]
        );

        // Сохраняем chat_id в коде чтобы фронтенд мог получить токен
        await pool.query('UPDATE telegram_reg_codes SET chat_id = $1 WHERE code = $2', [chatId, code]);

        bot.sendMessage(chatId,
          `🎉 Добро пожаловать, ${newUser.rows[0].name}!

Ваш аккаунт в BeautyPro создан. Теперь вы можете:
— Получать напоминания о записях
— Смотреть свои записи

Команды:
/mybookings — мои записи
/help — помощь

Записаться можно на сайте: http://localhost:3000`
        );
      } catch (err) {
        console.error('Ошибка TG регистрации:', err.message);
        bot.sendMessage(chatId, '❌ Ошибка регистрации. Попробуйте позже.');
      }

    } else if (param) {
      // Привязка существующего аккаунта
      try {
        const result = await pool.query(
          'UPDATE users SET telegram_chat_id = $1, telegram_code = NULL WHERE telegram_code = $2 RETURNING name',
          [chatId, param]
        );
        if (result.rows.length > 0) {
          bot.sendMessage(chatId,
            `✅ Аккаунт привязан, ${result.rows[0].name}!

Теперь вы будете получать напоминания о записях за 12 часов.

Команды:
/mybookings — мои записи
/help — помощь`
          );
        } else {
          bot.sendMessage(chatId, '❌ Код недействителен. Получите новый код в личном кабинете.');
        }
      } catch (err) {
        console.error('Ошибка привязки:', err.message);
        bot.sendMessage(chatId, '❌ Ошибка. Попробуйте позже.');
      }

    } else {
      bot.sendMessage(chatId,
        `👋 Привет! Я бот салона красоты BeautyPro.

Зарегистрируйтесь или привяжите аккаунт на сайте:
http://localhost:3000/register.html

Команды:
/mybookings — мои записи
/help — помощь`
      );
    }
  });

  // ── /mybookings ──────────────────────────────────────────

  bot.onText(/\/mybookings/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const result = await pool.query(
        `SELECT b.service_id, b.master_id, b.date, b.time, b.status
         FROM bookings b
         JOIN users u ON b.user_id = u.id
         WHERE u.telegram_chat_id = $1
         AND b.date >= CURRENT_DATE
         ORDER BY b.date ASC, b.time ASC
         LIMIT 5`,
        [chatId]
      );

      if (!result.rows.length) {
        return bot.sendMessage(chatId, '📭 У вас нет предстоящих записей.\n\nЗапишитесь на сайте: http://localhost:3000');
      }

      const lines = result.rows.map(b => {
        const date = new Date(b.date).toLocaleDateString('ru-RU');
        const status = { pending: '⏳ Ожидает', confirmed: '✅ Подтверждена', cancelled: '❌ Отменена' }[b.status] || b.status;
        return `📅 ${date} в ${b.time}\n💆 Услуга: ${b.service_id}\n👤 Мастер: ${b.master_id}\n${status}`;
      }).join('\n\n');

      bot.sendMessage(chatId, `📋 Ваши записи:\n\n${lines}`);
    } catch (err) {
      console.error('Ошибка mybookings:', err.message);
      bot.sendMessage(chatId, '❌ Ошибка загрузки записей.');
    }
  });

  // ── /help ────────────────────────────────────────────────

  bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id,
      `ℹ️ BeautyPro Bot\n\nКоманды:\n/start — начало работы\n/mybookings — мои предстоящие записи\n/help — помощь\n\nСайт: http://localhost:3000`
    );
  });

  // ── УВЕДОМЛЕНИЯ ЗА 12 ЧАСОВ ─────────────────────────────
  // Проверяем каждые 30 минут

  cron.schedule('*/30 * * * *', async () => {
    try {
      const now = new Date();
      const targetTime = new Date(now.getTime() + 12 * 60 * 60 * 1000); // +12 часов

      const dateStr = targetTime.toISOString().split('T')[0];
      const hours = String(targetTime.getHours()).padStart(2, '0');
      const minutes = String(targetTime.getMinutes()).padStart(2, '0');

      // Ищем записи которые начинаются примерно через 12 часов (±15 минут)
      const result = await pool.query(
        `SELECT b.service_id, b.master_id, b.date, b.time, b.status,
                u.telegram_chat_id, u.name
         FROM bookings b
         JOIN users u ON b.user_id = u.id
         WHERE u.telegram_chat_id IS NOT NULL
         AND b.status != 'cancelled'
         AND b.date = $1
         AND b.time BETWEEN $2 AND $3`,
        [
          dateStr,
          `${String(targetTime.getHours()).padStart(2,'0')}:${String(Math.max(0, targetTime.getMinutes()-15)).padStart(2,'0')}`,
          `${String(targetTime.getHours()).padStart(2,'0')}:${String(Math.min(59, targetTime.getMinutes()+15)).padStart(2,'0')}`
        ]
      );

      for (const booking of result.rows) {
        const date = new Date(booking.date).toLocaleDateString('ru-RU');
        try {
          await bot.sendMessage(booking.telegram_chat_id,
            `⏰ Напоминание!\n\nЧерез 12 часов у вас запись в BeautyPro:\n\n📅 ${date} в ${booking.time}\n💆 Услуга: ${booking.service_id}\n👤 Мастер: ${booking.master_id}\n\nБудем ждать вас! 💚`
          );
          console.log(`✉️  Уведомление отправлено пользователю ${booking.name}`);
        } catch (err) {
          console.error(`Ошибка отправки уведомления:`, err.message);
        }
      }
    } catch (err) {
      console.error('Ошибка cron:', err.message);
    }
  });

  return bot;
}

module.exports = initBot;
