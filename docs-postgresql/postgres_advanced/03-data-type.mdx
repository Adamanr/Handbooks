---
sidebar_position: 3
title: "Типы данных"
description: "В этой главе мы рассмотрим основы PostgreSQL, включая установку, настройку и базовые команды."
---

# Типы данных в PostgreSQL: числовые, строковые, временные, специальные

## Введение

PostgreSQL поддерживает богатый набор встроенных типов данных, что делает его одной из самых гибких и мощных реляционных СУБД. Правильный выбор типа данных критически важен для:

- **Производительности** — оптимальные типы занимают меньше места и обрабатываются быстрее
- **Целостности данных** — типы данных помогают предотвратить некорректные значения
- **Функциональности** — специализированные типы предоставляют дополнительные возможности

В этом уроке мы подробно рассмотрим все основные категории типов данных PostgreSQL.

## Числовые типы данных

### Целочисленные типы

PostgreSQL предоставляет три основных целочисленных типа:

| Тип | Размер | Диапазон | Применение |
|-----|--------|----------|------------|
| `SMALLINT` | 2 байта | -32,768 до 32,767 | Небольшие числа (возраст, количество) |
| `INTEGER` (INT) | 4 байта | -2,147,483,648 до 2,147,483,647 | Стандартный выбор для целых чисел |
| `BIGINT` | 8 байт | -9,223,372,036,854,775,808 до 9,223,372,036,854,775,807 | Очень большие числа |

#### Примеры использования

```sql
-- Создание таблицы с разными целочисленными типами
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,        -- AUTO INCREMENT INTEGER
    quantity SMALLINT NOT NULL,           -- количество товара
    views_count INTEGER DEFAULT 0,        -- счетчик просмотров
    total_sales BIGINT DEFAULT 0          -- общая выручка в копейках
);

-- Вставка данных
INSERT INTO products (quantity, views_count, total_sales)
VALUES (150, 1000, 1500000);

-- Проверка диапазонов
INSERT INTO products (quantity) VALUES (40000);  -- ERROR: значение вне диапазона SMALLINT
```

:::tip Совет
Используйте `INTEGER` по умолчанию. Переходите на `SMALLINT` только если уверены в ограниченном диапазоне и экономия памяти критична. Используйте `BIGINT` для счетчиков, которые могут вырасти очень большими.
:::

### Типы с автоинкрементом (Serial)

PostgreSQL предоставляет специальные типы для автоматической генерации уникальных идентификаторов:

| Тип | Эквивалент | Диапазон |
|-----|------------|----------|
| `SMALLSERIAL` | SMALLINT + SEQUENCE | 1 до 32,767 |
| `SERIAL` | INTEGER + SEQUENCE | 1 до 2,147,483,647 |
| `BIGSERIAL` | BIGINT + SEQUENCE | 1 до 9,223,372,036,854,775,807 |

```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL
);

-- SERIAL автоматически создает последовательность
-- Эквивалентно:
CREATE SEQUENCE users_user_id_seq;
CREATE TABLE users (
    user_id INTEGER NOT NULL DEFAULT nextval('users_user_id_seq'),
    username VARCHAR(50) NOT NULL
);
```

### Числа с плавающей точкой

| Тип | Размер | Точность | Применение |
|-----|--------|----------|------------|
| `REAL` | 4 байта | 6 десятичных знаков | Приблизительные вычисления |
| `DOUBLE PRECISION` | 8 байт | 15 десятичных знаков | Научные расчеты |

```sql
CREATE TABLE measurements (
    temperature REAL,              -- температура
    coordinates DOUBLE PRECISION   -- координаты GPS
);

-- Примеры
INSERT INTO measurements VALUES (36.6, 55.751244);

-- Проблема точности с плавающей точкой
SELECT 0.1 + 0.2;  -- Результат: 0.30000000000000004
```

:::warning Внимание
Никогда не используйте типы с плавающей точкой для денежных расчетов! Они приблизительны и могут привести к ошибкам округления.
:::

### Тип NUMERIC (DECIMAL)

Тип `NUMERIC` предназначен для точных вычислений с фиксированной точностью.

**Синтаксис:** `NUMERIC(precision, scale)`
- `precision` — общее количество значащих цифр
- `scale` — количество цифр после десятичной точки

```sql
CREATE TABLE financial_transactions (
    transaction_id SERIAL PRIMARY KEY,
    amount NUMERIC(10, 2),        -- до 99,999,999.99
    tax_rate NUMERIC(5, 4),       -- до 9.9999 (например, 0.2000 для 20%)
    precise_value NUMERIC         -- неограниченная точность
);

-- Примеры
INSERT INTO financial_transactions (amount, tax_rate, precise_value)
VALUES (1234.56, 0.2000, 123456789.123456789123456789);

-- Точные вычисления
SELECT 0.1::NUMERIC + 0.2::NUMERIC;  -- Результат: 0.3

-- Вычисление с налогом
SELECT 
    amount,
    amount * tax_rate AS tax,
    amount * (1 + tax_rate) AS total
FROM financial_transactions;
```

:::tip Рекомендация для денег
Для денежных сумм используйте `NUMERIC(10, 2)` или специальный тип `MONEY`. Для процентов и коэффициентов — `NUMERIC(5, 4)`.
:::

### Специальный тип MONEY

```sql
CREATE TABLE prices (
    product_name VARCHAR(100),
    price MONEY
);

-- Вставка с указанием валюты (зависит от локали)
INSERT INTO prices VALUES ('Ноутбук', 75000.00);
INSERT INTO prices VALUES ('Мышь', '$25.50');

-- Арифметические операции
SELECT price * 1.2 FROM prices;  -- увеличение на 20%
```

:::caution Ограничения MONEY
Тип `MONEY` привязан к локали сервера и может вызывать проблемы при работе с несколькими валютами. В современных приложениях часто предпочитают `NUMERIC(10, 2)` с отдельным полем для кода валюты.
:::

## Строковые типы данных

### Символьные типы

| Тип | Описание | Хранение |
|-----|----------|----------|
| `CHAR(n)` | Фиксированная длина | Дополняется пробелами до n символов |
| `VARCHAR(n)` | Переменная длина с ограничением | До n символов |
| `TEXT` | Неограниченная длина | Любое количество символов |

```sql
CREATE TABLE string_examples (
    code CHAR(5),              -- всегда 5 символов
    name VARCHAR(100),         -- до 100 символов
    description TEXT           -- без ограничений
);

-- Примеры вставки
INSERT INTO string_examples VALUES 
    ('A001', 'Товар 1', 'Длинное описание товара...'),
    ('B2', 'Товар 2', 'Описание');  -- 'B2' будет сохранено как 'B2   '

-- Сравнение типов
SELECT 
    code,
    LENGTH(code) as char_length,      -- всегда 5
    LENGTH(name) as varchar_length    -- фактическая длина
FROM string_examples;
```

:::info Что выбрать?
- **CHAR(n)** — только для полей фиксированной длины (коды, идентификаторы)
- **VARCHAR(n)** — для большинства текстовых полей с известным максимумом
- **TEXT** — для длинных текстов без предсказуемого размера (описания, комментарии, статьи)

В PostgreSQL разницы в производительности между `VARCHAR` и `TEXT` практически нет.
:::

### Работа со строками

```sql
-- Конкатенация строк
SELECT 'Hello' || ' ' || 'World';  -- 'Hello World'
SELECT CONCAT('Hello', ' ', 'World', '!');

-- Изменение регистра
SELECT 
    UPPER('postgresql'),    -- POSTGRESQL
    LOWER('POSTGRESQL'),    -- postgresql
    INITCAP('hello world'); -- Hello World

-- Обрезка пробелов
SELECT 
    TRIM('  text  '),           -- 'text'
    LTRIM('  text'),            -- 'text'
    RTRIM('text  ');            -- 'text'

-- Подстроки
SELECT 
    SUBSTRING('PostgreSQL' FROM 1 FOR 6),  -- 'Postgr'
    LEFT('PostgreSQL', 4),                  -- 'Post'
    RIGHT('PostgreSQL', 3);                 -- 'SQL'

-- Поиск и замена
SELECT 
    POSITION('SQL' IN 'PostgreSQL'),       -- 7
    REPLACE('Hello World', 'World', 'PostgreSQL');  -- 'Hello PostgreSQL'

-- Длина строки
SELECT 
    LENGTH('Привет'),           -- 6 (количество символов)
    OCTET_LENGTH('Привет');     -- 12 (байт в UTF-8)
```

### Регулярные выражения

PostgreSQL поддерживает мощные операции с регулярными выражениями:

```sql
-- Оператор соответствия ~
SELECT 'PostgreSQL' ~ 'Post';     -- true
SELECT 'PostgreSQL' ~ '^Post';    -- true (начало строки)
SELECT 'PostgreSQL' ~ 'SQL$';     -- true (конец строки)

-- Регистронезависимое соответствие ~*
SELECT 'PostgreSQL' ~* 'postgresql';  -- true

-- Извлечение подстрок
SELECT 
    SUBSTRING('Email: user@example.com' FROM '\w+@\w+\.\w+');  -- user@example.com

-- Замена с регулярными выражениями
SELECT REGEXP_REPLACE('Phone: +7-999-123-45-67', '[^0-9]', '', 'g');  -- '79991234567'

-- Практический пример: валидация email
CREATE TABLE users (
    email VARCHAR(255) CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);
```

## Временные типы данных

### Обзор временных типов

| Тип | Размер | Описание | Диапазон |
|-----|--------|----------|----------|
| `DATE` | 4 байта | Только дата | 4713 BC до 5874897 AD |
| `TIME` | 8 байт | Только время | 00:00:00 до 24:00:00 |
| `TIMESTAMP` | 8 байт | Дата и время | 4713 BC до 294276 AD |
| `TIMESTAMPTZ` | 8 байт | Дата, время + часовой пояс | 4713 BC до 294276 AD |
| `INTERVAL` | 16 байт | Временной интервал | ±178,000,000 лет |

### Работа с датами (DATE)

```sql
-- Создание таблицы
CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    event_name VARCHAR(100),
    event_date DATE
);

-- Вставка дат в различных форматах
INSERT INTO events (event_name, event_date) VALUES
    ('Конференция', '2024-12-15'),
    ('Встреча', 'December 15, 2024'),
    ('Вебинар', '15.12.2024');

-- Текущая дата
SELECT CURRENT_DATE;
SELECT NOW()::DATE;

-- Арифметика с датами
SELECT 
    CURRENT_DATE + 7 AS week_later,              -- через неделю
    CURRENT_DATE - 30 AS month_ago,              -- месяц назад
    CURRENT_DATE - DATE '2024-01-01' AS days_passed;  -- дней прошло

-- Извлечение компонентов даты
SELECT 
    EXTRACT(YEAR FROM CURRENT_DATE) AS year,
    EXTRACT(MONTH FROM CURRENT_DATE) AS month,
    EXTRACT(DAY FROM CURRENT_DATE) AS day,
    EXTRACT(DOW FROM CURRENT_DATE) AS day_of_week;  -- 0=воскресенье

-- Форматирование дат
SELECT 
    TO_CHAR(CURRENT_DATE, 'DD.MM.YYYY') AS russian_format,
    TO_CHAR(CURRENT_DATE, 'Day, DD Month YYYY') AS full_format,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AS iso_format;
```

### Работа со временем (TIME)

```sql
CREATE TABLE work_schedule (
    schedule_id SERIAL PRIMARY KEY,
    start_time TIME,
    end_time TIME
);

INSERT INTO work_schedule (start_time, end_time) VALUES
    ('09:00:00', '18:00:00'),
    ('14:30', '22:00');  -- секунды опциональны

-- Текущее время
SELECT CURRENT_TIME;
SELECT LOCALTIME;

-- Арифметика со временем
SELECT 
    TIME '14:30:00' + INTERVAL '2 hours' AS later_time,
    TIME '18:00:00' - TIME '09:00:00' AS work_duration;

-- Извлечение компонентов
SELECT 
    EXTRACT(HOUR FROM TIME '14:35:22') AS hour,
    EXTRACT(MINUTE FROM TIME '14:35:22') AS minute,
    EXTRACT(SECOND FROM TIME '14:35:22') AS second;
```

### Метки времени (TIMESTAMP и TIMESTAMPTZ)

```sql
CREATE TABLE logs (
    log_id SERIAL PRIMARY KEY,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at_tz TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Вставка записей
INSERT INTO logs (message) VALUES ('Запуск системы');

-- Разница между TIMESTAMP и TIMESTAMPTZ
SELECT 
    created_at,
    created_at_tz,
    created_at_tz AT TIME ZONE 'America/New_York' AS ny_time,
    created_at_tz AT TIME ZONE 'Asia/Tokyo' AS tokyo_time
FROM logs;

-- Текущее время с часовым поясом
SELECT 
    NOW(),                          -- TIMESTAMP WITH TIME ZONE
    CURRENT_TIMESTAMP,              -- то же самое
    TIMEZONE('UTC', NOW()) AS utc;  -- конвертация в UTC

-- Разница между метками времени
SELECT 
    NOW() - TIMESTAMP '2024-01-01 00:00:00' AS time_passed;

-- Округление меток времени
SELECT 
    DATE_TRUNC('hour', NOW()) AS current_hour,
    DATE_TRUNC('day', NOW()) AS today_start,
    DATE_TRUNC('month', NOW()) AS month_start,
    DATE_TRUNC('year', NOW()) AS year_start;
```

:::tip Рекомендация
Всегда используйте `TIMESTAMPTZ` вместо `TIMESTAMP` для хранения временных меток, если данные могут просматриваться из разных часовых поясов. PostgreSQL автоматически конвертирует значения в часовой пояс сессии.
:::

### Интервалы (INTERVAL)

```sql
-- Создание интервалов
SELECT 
    INTERVAL '1 day' AS one_day,
    INTERVAL '2 weeks' AS two_weeks,
    INTERVAL '3 months' AS three_months,
    INTERVAL '1 year 2 months 3 days' AS complex_interval,
    INTERVAL '2 hours 30 minutes' AS duration;

-- Арифметика с интервалами
SELECT 
    NOW() + INTERVAL '1 week' AS next_week,
    NOW() - INTERVAL '30 days' AS month_ago,
    DATE '2024-12-31' + INTERVAL '1 day' AS new_year;

-- Умножение интервалов
SELECT 
    INTERVAL '1 day' * 7 AS one_week,
    INTERVAL '1 hour' * 2.5 AS two_and_half_hours;

-- Практический пример: напоминания
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    due_date TIMESTAMPTZ,
    reminder_interval INTERVAL DEFAULT INTERVAL '1 day'
);

INSERT INTO tasks (title, due_date, reminder_interval) VALUES
    ('Встреча', NOW() + INTERVAL '3 days', INTERVAL '2 hours'),
    ('Отчет', NOW() + INTERVAL '1 week', INTERVAL '1 day');

-- Выборка задач с напоминанием
SELECT 
    title,
    due_date,
    due_date - reminder_interval AS remind_at,
    due_date - NOW() AS time_until_due
FROM tasks
WHERE due_date - reminder_interval <= NOW()
  AND due_date > NOW();
```

### Практические примеры работы с датами

```sql
-- Возраст пользователя
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    birth_date DATE
);

SELECT 
    name,
    birth_date,
    AGE(birth_date) AS full_age,
    DATE_PART('year', AGE(birth_date)) AS years_old
FROM users;

-- Рабочие дни между датами
CREATE FUNCTION count_workdays(start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
DECLARE
    total_days INTEGER;
    weekend_days INTEGER;
BEGIN
    total_days := end_date - start_date;
    weekend_days := (
        SELECT COUNT(*)
        FROM generate_series(start_date, end_date, '1 day'::INTERVAL) AS day
        WHERE EXTRACT(DOW FROM day) IN (0, 6)  -- воскресенье и суббота
    );
    RETURN total_days - weekend_days;
END;
$$ LANGUAGE plpgsql;

-- Использование
SELECT count_workdays('2024-12-01', '2024-12-31') AS workdays;

-- Статистика по месяцам
SELECT 
    DATE_TRUNC('month', order_date) AS month,
    COUNT(*) AS orders_count,
    SUM(total_amount) AS total_revenue
FROM orders
WHERE order_date >= NOW() - INTERVAL '1 year'
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month;
```

## Логический тип данных

PostgreSQL имеет встроенный тип `BOOLEAN` для хранения логических значений.

```sql
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    in_stock BOOLEAN
);

-- Вставка логических значений (множество вариантов)
INSERT INTO products (name, is_active, is_featured, in_stock) VALUES
    ('Товар 1', TRUE, FALSE, 't'),
    ('Товар 2', 'yes', 'no', '1'),
    ('Товар 3', 'y', 'n', 'true');

-- Все эти значения означают TRUE: TRUE, 't', 'true', 'y', 'yes', '1'
-- Все эти значения означают FALSE: FALSE, 'f', 'false', 'n', 'no', '0'

-- Выборка с логическими условиями
SELECT * FROM products WHERE is_active;  -- неявное = TRUE
SELECT * FROM products WHERE NOT is_featured;
SELECT * FROM products WHERE is_active AND in_stock;

-- Подсчет по логическому полю
SELECT 
    COUNT(*) FILTER (WHERE is_active) AS active_products,
    COUNT(*) FILTER (WHERE NOT is_active) AS inactive_products,
    COUNT(*) FILTER (WHERE in_stock) AS in_stock_count
FROM products;

-- Преобразование логических значений
SELECT 
    is_active,
    is_active::INTEGER AS as_number,  -- TRUE=1, FALSE=0
    CASE 
        WHEN is_active THEN 'Активен' 
        ELSE 'Неактивен' 
    END AS status_text
FROM products;
```

:::info NULL в логических полях
`BOOLEAN` поле может иметь три состояния: `TRUE`, `FALSE` и `NULL`. `NULL` означает "неизвестно" и отличается от `FALSE`. Будьте внимательны при проверке условий.
:::

## Специальные типы данных

### UUID (Universally Unique Identifier)

UUID — это 128-битный идентификатор, гарантирующий уникальность без центральной координации.

```sql
-- Включение расширения для генерации UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Вставка с автогенерацией UUID
INSERT INTO users (username) VALUES ('john_doe');

-- Вставка с явным UUID
INSERT INTO users (user_id, username) 
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'jane_smith');

-- Выборка
SELECT * FROM users;
-- user_id: 550e8400-e29b-41d4-a716-446655440000 (пример)

-- Генерация UUID вручную
SELECT uuid_generate_v4();
```

**Преимущества UUID:**
- ✅ Глобальная уникальность без координации
- ✅ Безопасность — невозможно предсказать следующий ID
- ✅ Подходит для распределенных систем
- ❌ Занимает больше места (16 байт vs 4 байта для INTEGER)
- ❌ Менее эффективен для индексов B-tree

### JSON и JSONB

PostgreSQL поддерживает работу с JSON документами, предоставляя два типа:

| Тип | Описание | Когда использовать |
|-----|----------|-------------------|
| `JSON` | Сохраняет точную копию текста | Когда важен исходный формат |
| `JSONB` | Бинарный формат с индексацией | Для запросов и индексации (рекомендуется) |

```sql
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    attributes JSONB
);

-- Вставка JSON данных
INSERT INTO products (name, attributes) VALUES
    ('Ноутбук', '{"brand": "Dell", "cpu": "Intel i7", "ram": 16, "ssd": 512}'),
    ('Смартфон', '{"brand": "Samsung", "model": "Galaxy S21", "color": ["black", "white"]}');

-- Выборка JSON полей
SELECT 
    name,
    attributes->>'brand' AS brand,           -- извлечение как текст
    attributes->'ram' AS ram_json,           -- извлечение как JSON
    (attributes->>'ram')::INTEGER AS ram     -- извлечение и преобразование
FROM products;

-- Проверка существования ключа
SELECT * FROM products 
WHERE attributes ? 'cpu';  -- есть ли ключ 'cpu'

-- Проверка значения
SELECT * FROM products 
WHERE attributes->>'brand' = 'Dell';

-- Работа с массивами в JSON
SELECT 
    name,
    jsonb_array_elements_text(attributes->'color') AS color
FROM products
WHERE attributes ? 'color';

-- Обновление JSON полей
UPDATE products 
SET attributes = attributes || '{"warranty": "2 years"}'
WHERE product_id = 1;

UPDATE products 
SET attributes = jsonb_set(attributes, '{ram}', '32')
WHERE name = 'Ноутбук';

-- Создание индекса для быстрого поиска
CREATE INDEX idx_attributes_gin ON products USING GIN (attributes);

-- Функции для работы с JSONB
SELECT 
    jsonb_object_keys(attributes) AS keys  -- все ключи
FROM products;

SELECT 
    name,
    jsonb_each(attributes)  -- каждая пара ключ-значение
FROM products;
```

:::tip Когда использовать JSONB?
JSONB идеален для:
- Гибких атрибутов продуктов (разные товары имеют разные характеристики)
- Настроек пользователей
- Метаданных и тегов
- API ответов
- Аудит-логов

Но не злоупотребляйте: если структура стабильна, используйте обычные столбцы.
:::

### Массивы (ARRAY)

PostgreSQL позволяет хранить массивы практически любого типа данных.

```sql
CREATE TABLE articles (
    article_id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    tags TEXT[],                    -- массив строк
    ratings INTEGER[],              -- массив чисел
    coordinates NUMERIC[][]         -- двумерный массив
);

-- Вставка массивов
INSERT INTO articles (title, tags, ratings) VALUES
    ('PostgreSQL Tips', ARRAY['database', 'sql', 'postgresql'], ARRAY[5, 4, 5, 5]),
    ('Web Development', '{"html", "css", "javascript"}', '{4, 3, 5, 4}');

-- Доступ к элементам массива (индексация с 1!)
SELECT 
    title,
    tags[1] AS first_tag,           -- первый элемент
    tags[2:3] AS middle_tags,       -- срез
    array_length(tags, 1) AS tags_count
FROM articles;

-- Поиск в массивах
SELECT * FROM articles 
WHERE 'postgresql' = ANY(tags);

SELECT * FROM articles 
WHERE tags @> ARRAY['database'];  -- содержит элемент

SELECT * FROM articles 
WHERE tags && ARRAY['sql', 'nosql'];  -- пересекается с массивом

-- Работа с массивами
SELECT 
    title,
    array_append(tags, 'tutorial') AS with_tutorial,
    array_remove(tags, 'sql') AS without_sql,
    array_cat(tags, ARRAY['new', 'tag']) AS concatenated
FROM articles;

-- Разворачивание массива в строки
SELECT 
    title,
    unnest(tags) AS tag
FROM articles;

-- Агрегация в массив
SELECT 
    array_agg(title ORDER BY article_id) AS all_titles
FROM articles;

-- Индекс для массивов
CREATE INDEX idx_tags_gin ON articles USING GIN (tags);
```

### Диапазоны (Range Types)

Range типы позволяют хранить диапазоны значений.

```sql
-- Встроенные range типы
-- INT4RANGE, INT8RANGE, NUMRANGE, TSRANGE, TSTZRANGE, DATERANGE

CREATE TABLE room_bookings (
    booking_id SERIAL PRIMARY KEY,
    room_number INTEGER,
    guest_name VARCHAR(100),
    stay_period DATERANGE,
    price_range NUMRANGE
);

-- Вставка диапазонов
INSERT INTO room_bookings (room_number, guest_name, stay_period, price_range) VALUES
    (101, 'Иван Иванов', '[2024-12-15, 2024-12-20)', 'numrange(5000, 7000)'),
    (102, 'Петр Петров', '[2024-12-18, 2024-12-25)', '[6000, 9000]');

-- '[' означает включительно, ')' означает исключительно
-- [2024-12-15, 2024-12-20) = с 15 по 19 декабря включительно

-- Проверка пересечения диапазонов
SELECT * FROM room_bookings 
WHERE stay_period && '[2024-12-17, 2024-12-22)'::DATERANGE;

-- Проверка вхождения
SELECT * FROM room_bookings 
WHERE stay_period @> '2024-12-16'::DATE;  -- содержит дату

SELECT * FROM room_bookings 
WHERE price_range @> 6500;  -- содержит значение

-- Операции с диапазонами
SELECT 
    guest_name,
    stay_period,
    lower(stay_period) AS check_in,
    upper(stay_period) AS check_out,
    upper(stay_period) - lower(stay_period) AS nights,
    isempty(stay_period) AS is_empty
FROM room_bookings;

-- Предотвращение пересекающихся бронирований
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE room_bookings 
ADD CONSTRAINT no_overlapping_bookings 
EXCLUDE USING GIST (room_number WITH =, stay_period WITH &&);

-- Попытка добавить пересекающееся бронирование вызовет ошибку
-- INSERT INTO room_bookings (room_number, guest_name, stay_period)
-- VALUES (101, 'Сидор
