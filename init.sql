-- ============================================================
--  BeautyPro — инициализация базы данных v2.0
-- ============================================================

-- Мастера
CREATE TABLE IF NOT EXISTS masters (
  id             VARCHAR(50)   PRIMARY KEY,
  full_name      VARCHAR(100)  NOT NULL,
  specialization VARCHAR(150)  NOT NULL,
  description    TEXT,
  photo_label    VARCHAR(10),
  rating         NUMERIC(3,2)  DEFAULT 5.0 CHECK (rating BETWEEN 1 AND 5),
  is_active      BOOLEAN       DEFAULT TRUE,
  created_at     TIMESTAMP     DEFAULT NOW()
);

-- Категории услуг
CREATE TABLE IF NOT EXISTS service_categories (
  id   VARCHAR(50)  PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Услуги
CREATE TABLE IF NOT EXISTS services (
  id               VARCHAR(50)  PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  category_id      VARCHAR(50)  REFERENCES service_categories(id),
  description      TEXT,
  duration_minutes INTEGER      NOT NULL CHECK (duration_minutes > 0),
  price            INTEGER      NOT NULL CHECK (price >= 0),
  is_active        BOOLEAN      DEFAULT TRUE,
  created_at       TIMESTAMP    DEFAULT NOW()
);

-- Связь мастер–категория
CREATE TABLE IF NOT EXISTS master_services (
  master_id        VARCHAR(50) REFERENCES masters(id) ON DELETE CASCADE,
  service_category VARCHAR(50),
  PRIMARY KEY (master_id, service_category)
);

-- Пользователи
CREATE TABLE IF NOT EXISTS users (
  id               SERIAL      PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  email            VARCHAR(150) UNIQUE NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,
  role             VARCHAR(20)  DEFAULT 'client'
                                CHECK (role IN ('client', 'admin')),
  telegram_chat_id BIGINT,
  telegram_code    VARCHAR(20),
  created_at       TIMESTAMP    DEFAULT NOW()
);

-- Записи
-- Поле time имеет тип TIME (не VARCHAR) — PostgreSQL понимает что это время
CREATE TABLE IF NOT EXISTS bookings (
  id         SERIAL      PRIMARY KEY,
  user_id    INTEGER     REFERENCES users(id) ON DELETE CASCADE,
  service_id VARCHAR(50) NOT NULL,
  master_id  VARCHAR(50) NOT NULL,
  date       DATE        NOT NULL,
  time       TIME        NOT NULL,
  status     VARCHAR(20) DEFAULT 'pending'
                         CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP   DEFAULT NOW()
);

-- Частичный уникальный индекс:
-- один мастер — одна активная запись на слот.
-- Отменённые записи (cancelled) слот НЕ блокируют.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_active_slot_unique
  ON bookings (master_id, date, time)
  WHERE status != 'cancelled';

-- Отзывы
CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL      PRIMARY KEY,
  user_id    INTEGER     REFERENCES users(id) ON DELETE SET NULL,
  master_id  VARCHAR(50) NOT NULL,
  rating     INTEGER     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text       TEXT        NOT NULL,
  created_at TIMESTAMP   DEFAULT NOW()
);

-- Избранные мастера
CREATE TABLE IF NOT EXISTS favorites (
  user_id    INTEGER     REFERENCES users(id) ON DELETE CASCADE,
  master_id  VARCHAR(50) NOT NULL,
  created_at TIMESTAMP   DEFAULT NOW(),
  PRIMARY KEY (user_id, master_id)
);

-- Временные коды Telegram-регистрации
-- expires_at: код действует 10 минут
CREATE TABLE IF NOT EXISTS telegram_reg_codes (
  code        VARCHAR(20) PRIMARY KEY,
  chat_id     BIGINT,
  created_at  TIMESTAMP   DEFAULT NOW(),
  expires_at  TIMESTAMP   DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- ── Начальные данные ─────────────────────────────────────────

INSERT INTO service_categories (id, name) VALUES
  ('hair','Волосы'),('nails','Ногти'),('cosmetology','Косметология'),
  ('brows','Брови и ресницы'),('massage','Массаж'),('spa','SPA'),
  ('makeup','Визаж'),('other','Другое')
ON CONFLICT DO NOTHING;

INSERT INTO masters (id, full_name, specialization, description, photo_label, rating) VALUES
  ('master-1','Елена Орлова','Стилист по волосам','Опыт 10 лет. Окрашивание и стрижки.','ЕЛ',4.9),
  ('master-2','Ирина Смирнова','Массажист','Опыт 12 лет. Лечебный и релаксирующий массаж.','ИР',5.0),
  ('master-3','Мария Иванова','Мастер маникюра и педикюра','Опыт 8 лет. Гель-лак, наращивание.','МА',4.8),
  ('master-4','Светлана Ким','Косметолог-эстетист','Опыт 9 лет. Уход за лицом и телом.','СВ',4.7),
  ('master-5','Алина Петрова','Специалист по бровям','Опыт 6 лет. Коррекция и ламинирование.','АП',4.9),
  ('master-6','Юлия Новикова','Визажист','Опыт 7 лет. Вечерний и свадебный макияж.','ЮН',4.8)
ON CONFLICT DO NOTHING;

INSERT INTO services (id, name, category_id, description, duration_minutes, price) VALUES
  ('haircut-women','Женская стрижка','hair','Подбор формы, мытьё, стрижка и укладка.',60,2500),
  ('coloring-single','Окрашивание в один тон','hair','Стойкий цвет, бережный уход.',120,4900),
  ('manicure','Маникюр с покрытием','nails','Обработка, покрытие, уход за кутикулой.',90,2200),
  ('pedicure','Педикюр','nails','Комфортная процедура, деликатный уход.',75,2800),
  ('facial-classic','Классическая чистка','cosmetology','Глубокое очищение и увлажнение.',90,3500),
  ('brow-correction','Коррекция бровей','brows','Придание формы, оформление.',45,1200),
  ('relax-massage','Расслабляющий массаж','massage','Снятие напряжения, улучшение кровообращения.',60,3000),
  ('spa-ritual','SPA-ритуал','spa','Обёртывание и массаж.',120,5500)
ON CONFLICT DO NOTHING;

INSERT INTO master_services (master_id, service_category) VALUES
  ('master-1','hair'),
  ('master-2','massage'),('master-2','spa'),
  ('master-3','nails'),
  ('master-4','cosmetology'),('master-4','spa'),
  ('master-5','brows'),
  ('master-6','makeup')
ON CONFLICT DO NOTHING;
