---
sidebar_position: 9
description: "В этой главе мы рассмотрим основы PostgreSQL, включая установку, настройку и базовые команды."
---

# Работа с датами и текстом

## Типы данных для дат и времени

### Обзор типов

| Тип | Описание | Пример | Размер |
|-----|----------|--------|--------|
| `DATE` | Только дата | 2024-01-15 | 4 байта |
| `TIME` | Только время | 14:30:00 | 8 байт |
| `TIME WITH TIME ZONE` | Время + часовой пояс | 14:30:00+03 | 12 байт |
| `TIMESTAMP` | Дата + время | 2024-01-15 14:30:00 | 8 байт |
| `TIMESTAMP WITH TIME ZONE` | Дата + время + часовой пояс | 2024-01-15 14:30:00+03 | 8 байт |
| `INTERVAL` | Промежуток времени | 3 days 04:30:00 | 16 байт |

### Подготовка данных

```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    event_date DATE,
    start_time TIME,
    start_timestamp TIMESTAMP,
    start_timestamptz TIMESTAMPTZ,
    duration INTERVAL,
    description TEXT,
    tags TEXT[]
);

INSERT INTO events (name, event_date, start_time, start_timestamp, start_timestamptz, duration, description, tags) VALUES 
    ('Конференция PostgreSQL', '2024-06-15', '09:00:00', '2024-06-15 09:00:00', '2024-06-15 09:00:00+03', '8 hours', 'Большая конференция по PostgreSQL', ARRAY['tech', 'database', 'postgresql']),
    ('Встреча команды', '2024-03-20', '14:30:00', '2024-03-20 14:30:00', '2024-03-20 14:30:00+03', '1 hour 30 minutes', 'Еженедельная встреча команды разработки', ARRAY['meeting', 'team']),
    ('Вебинар по SQL', '2024-04-10', '18:00:00', '2024-04-10 18:00:00', '2024-04-10 18:00:00+03', '2 hours', 'Вводный курс по SQL для начинающих', ARRAY['education', 'sql', 'webinar']),
    ('День рождения компании', '2024-05-01', '12:00:00', '2024-05-01 12:00:00', '2024-05-01 12:00:00+03', '5 hours', 'Празднование 10-летия компании', ARRAY['celebration', 'corporate']),
    ('Хакатон', '2024-07-20', '10:00:00', '2024-07-20 10:00:00', '2024-07-20 10:00:00+03', '2 days', 'Двухдневный хакатон по созданию инноваций', ARRAY['hackathon', 'tech', 'competition']);
```

---

## Получение текущих даты и времени

### Функции для получения текущего времени

```sql
-- Текущая дата (без времени)
SELECT CURRENT_DATE;
-- 2024-01-15

-- Текущее время (без даты)
SELECT CURRENT_TIME;
-- 14:30:45.123456+03:00

-- Текущая дата и время (без часового пояса)
SELECT CURRENT_TIMESTAMP;
-- 2024-01-15 14:30:45.123456

-- Текущая дата и время (с часовым поясом)
SELECT NOW();
-- 2024-01-15 14:30:45.123456+03

-- Локальная дата и время (игнорирует часовой пояс)
SELECT LOCALTIMESTAMP;
-- 2024-01-15 14:30:45.123456

-- Время начала транзакции
SELECT TRANSACTION_TIMESTAMP();

-- Время выполнения команды
SELECT STATEMENT_TIMESTAMP();

-- Текущее время (функция PostgreSQL)
SELECT CLOCK_TIMESTAMP();
```

### Разница между функциями

```sql
-- NOW() и CURRENT_TIMESTAMP одинаковы в одной транзакции
BEGIN;
SELECT NOW() AS now1, pg_sleep(2), NOW() AS now2;
-- now1 = now2 (одинаковое время)
COMMIT;

-- CLOCK_TIMESTAMP() всегда текущее
SELECT CLOCK_TIMESTAMP() AS t1, pg_sleep(2), CLOCK_TIMESTAMP() AS t2;
-- t1 != t2 (разное время)
```

### Практическое применение

```sql
-- Создание записей с автоматической датой
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO posts (title) VALUES ('Мой первый пост');

SELECT * FROM posts;
-- created_at заполнится автоматически

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## Арифметика с датами

### Операции сложения и вычитания

```sql
-- Добавить дни
SELECT CURRENT_DATE + 7 AS week_later;
SELECT CURRENT_DATE + INTERVAL '7 days' AS week_later;

-- Вычесть дни
SELECT CURRENT_DATE - 30 AS month_ago;
SELECT CURRENT_DATE - INTERVAL '30 days' AS month_ago;

-- Добавить месяцы
SELECT CURRENT_DATE + INTERVAL '3 months' AS quarter_later;

-- Добавить годы
SELECT CURRENT_DATE + INTERVAL '1 year' AS next_year;

-- Комбинированные интервалы
SELECT CURRENT_DATE + INTERVAL '1 year 2 months 3 days' AS complex_date;

-- Добавить время к TIMESTAMP
SELECT NOW() + INTERVAL '2 hours 30 minutes' AS later;

-- Вычесть время
SELECT NOW() - INTERVAL '1 hour' AS hour_ago;
```

### Разница между датами

```sql
-- Разница в днях (DATE)
SELECT DATE '2024-12-31' - DATE '2024-01-01' AS days_in_year;
-- 365

-- Разница между TIMESTAMP (возвращает INTERVAL)
SELECT 
    TIMESTAMP '2024-06-15 18:00:00' - TIMESTAMP '2024-06-15 09:00:00' AS time_diff;
-- 09:00:00

-- Возраст (функция AGE)
SELECT AGE(DATE '2024-01-15', DATE '1990-05-20') AS age;
-- 33 years 7 mons 26 days

-- Возраст от текущей даты
SELECT AGE(DATE '1990-05-20') AS age_now;
-- 33 years 7 mons 26 days
```

### Практические примеры

```sql
-- События на следующей неделе
SELECT 
    name,
    event_date,
    event_date - CURRENT_DATE AS days_until_event
FROM events
WHERE event_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
ORDER BY event_date;

-- События, которые уже прошли
SELECT 
    name,
    event_date,
    CURRENT_DATE - event_date AS days_ago
FROM events
WHERE event_date < CURRENT_DATE
ORDER BY event_date DESC;

-- Продолжительность событий в часах
SELECT 
    name,
    duration,
    EXTRACT(EPOCH FROM duration) / 3600 AS duration_hours
FROM events;

-- Время до начала события
SELECT 
    name,
    start_timestamptz,
    start_timestamptz - NOW() AS time_until_start
FROM events
WHERE start_timestamptz > NOW()
ORDER BY start_timestamptz;
```

---

## Извлечение частей из дат

### EXTRACT — извлечение компонентов

```sql
-- Извлечь год
SELECT EXTRACT(YEAR FROM DATE '2024-06-15') AS year;
-- 2024

-- Извлечь месяц
SELECT EXTRACT(MONTH FROM DATE '2024-06-15') AS month;
-- 6

-- Извлечь день
SELECT EXTRACT(DAY FROM DATE '2024-06-15') AS day;
-- 15

-- День недели (0 = воскресенье, 6 = суббота)
SELECT EXTRACT(DOW FROM DATE '2024-06-15') AS day_of_week;
-- 6 (суббота)

-- День недели (1 = понедельник, 7 = воскресенье)
SELECT EXTRACT(ISODOW FROM DATE '2024-06-15') AS iso_day_of_week;
-- 6 (суббота)

-- День года (1-366)
SELECT EXTRACT(DOY FROM DATE '2024-06-15') AS day_of_year;
-- 167

-- Неделя года
SELECT EXTRACT(WEEK FROM DATE '2024-06-15') AS week;
-- 24

-- Квартал
SELECT EXTRACT(QUARTER FROM DATE '2024-06-15') AS quarter;
-- 2

-- Час, минута, секунда из TIMESTAMP
SELECT 
    EXTRACT(HOUR FROM TIMESTAMP '2024-06-15 14:30:45') AS hour,
    EXTRACT(MINUTE FROM TIMESTAMP '2024-06-15 14:30:45') AS minute,
    EXTRACT(SECOND FROM TIMESTAMP '2024-06-15 14:30:45') AS second;
-- 14, 30, 45

-- Эпоха (секунды с 1970-01-01)
SELECT EXTRACT(EPOCH FROM TIMESTAMP '2024-06-15 14:30:45') AS epoch;
-- 1718457045
```

### DATE_PART — альтернатива EXTRACT

```sql
-- Аналогично EXTRACT, но принимает строку
SELECT DATE_PART('year', DATE '2024-06-15') AS year;
SELECT DATE_PART('month', DATE '2024-06-15') AS month;
SELECT DATE_PART('day', DATE '2024-06-15') AS day;
```

### Практические примеры

```sql
-- Группировка по месяцам
SELECT 
    EXTRACT(YEAR FROM event_date) AS year,
    EXTRACT(MONTH FROM event_date) AS month,
    COUNT(*) AS events_count
FROM events
GROUP BY EXTRACT(YEAR FROM event_date), EXTRACT(MONTH FROM event_date)
ORDER BY year, month;

-- События по дням недели
SELECT 
    CASE EXTRACT(ISODOW FROM event_date)
        WHEN 1 THEN 'Понедельник'
        WHEN 2 THEN 'Вторник'
        WHEN 3 THEN 'Среда'
        WHEN 4 THEN 'Четверг'
        WHEN 5 THEN 'Пятница'
        WHEN 6 THEN 'Суббота'
        WHEN 7 THEN 'Воскресенье'
    END AS day_name,
    COUNT(*) AS events_count
FROM events
GROUP BY EXTRACT(ISODOW FROM event_date)
ORDER BY EXTRACT(ISODOW FROM event_date);

-- Рабочие дни vs выходные
SELECT 
    CASE 
        WHEN EXTRACT(ISODOW FROM event_date) IN (6, 7) THEN 'Выходной'
        ELSE 'Рабочий день'
    END AS day_type,
    COUNT(*) AS events_count
FROM events
GROUP BY day_type;

-- Возраст в годах
SELECT 
    name,
    event_date,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, event_date)) AS years_ago
FROM events
WHERE event_date < CURRENT_DATE
ORDER BY years_ago DESC;
```

---

## Форматирование дат

### TO_CHAR — форматирование в строку

```sql
-- Базовые форматы
SELECT TO_CHAR(DATE '2024-06-15', 'DD.MM.YYYY') AS format1;
-- 15.06.2024

SELECT TO_CHAR(DATE '2024-06-15', 'DD/MM/YYYY') AS format2;
-- 15/06/2024

SELECT TO_CHAR(DATE '2024-06-15', 'YYYY-MM-DD') AS format3;
-- 2024-06-15

SELECT TO_CHAR(DATE '2024-06-15', 'Month DD, YYYY') AS format4;
-- June     15, 2024

SELECT TO_CHAR(DATE '2024-06-15', 'FMMonth DD, YYYY') AS format5;
-- June 15, 2024 (FM убирает пробелы)

SELECT TO_CHAR(DATE '2024-06-15', 'Day, DD Month YYYY') AS format6;
-- Saturday , 15 June      2024

SELECT TO_CHAR(DATE '2024-06-15', 'FMDay, DD FMMonth YYYY') AS format7;
-- Saturday, 15 June 2024

-- Короткие названия
SELECT TO_CHAR(DATE '2024-06-15', 'Dy, DD Mon YYYY') AS format8;
-- Sat, 15 Jun 2024
```

### Форматы времени

```sql
-- 24-часовой формат
SELECT TO_CHAR(TIMESTAMP '2024-06-15 14:30:45', 'HH24:MI:SS') AS time1;
-- 14:30:45

-- 12-часовой формат с AM/PM
SELECT TO_CHAR(TIMESTAMP '2024-06-15 14:30:45', 'HH:MI:SS AM') AS time2;
-- 02:30:45 PM

-- Полный формат
SELECT TO_CHAR(TIMESTAMP '2024-06-15 14:30:45', 'DD.MM.YYYY HH24:MI:SS') AS full_format;
-- 15.06.2024 14:30:45

-- С миллисекундами
SELECT TO_CHAR(NOW(), 'DD.MM.YYYY HH24:MI:SS.MS') AS with_ms;
-- 15.06.2024 14:30:45.123
```

### Паттерны форматирования

| Паттерн | Описание | Пример |
|---------|----------|--------|
| YYYY | Год (4 цифры) | 2024 |
| YY | Год (2 цифры) | 24 |
| MM | Месяц (01-12) | 06 |
| Month | Название месяца | June |
| Mon | Короткое название | Jun |
| DD | День месяца | 15 |
| DDD | День года | 167 |
| Day | Название дня | Saturday |
| Dy | Короткое название дня | Sat |
| HH24 | Час (00-23) | 14 |
| HH или HH12 | Час (01-12) | 02 |
| MI | Минуты | 30 |
| SS | Секунды | 45 |
| MS | Миллисекунды | 123 |
| AM/PM | До/после полудня | PM |
| TZ | Часовой пояс | MSK |

### TO_DATE и TO_TIMESTAMP — парсинг строк

```sql
-- Преобразовать строку в дату
SELECT TO_DATE('15.06.2024', 'DD.MM.YYYY') AS parsed_date;
-- 2024-06-15

SELECT TO_DATE('06/15/2024', 'MM/DD/YYYY') AS us_format;
-- 2024-06-15

SELECT TO_DATE('15-Jun-2024', 'DD-Mon-YYYY') AS with_month_name;
-- 2024-06-15

-- Преобразовать строку в TIMESTAMP
SELECT TO_TIMESTAMP('15.06.2024 14:30:45', 'DD.MM.YYYY HH24:MI:SS') AS parsed_timestamp;
-- 2024-06-15 14:30:45

-- Обработка разных форматов
SELECT TO_TIMESTAMP('2024-06-15T14:30:45', 'YYYY-MM-DD"T"HH24:MI:SS') AS iso_format;
-- 2024-06-15 14:30:45
```

### Практические примеры

```sql
-- Красивое отображение событий
SELECT 
    name,
    TO_CHAR(event_date, 'FMDay, DD FMMonth YYYY') AS formatted_date,
    TO_CHAR(start_time, 'HH24:MI') AS start_time_formatted
FROM events
ORDER BY event_date;

-- Отчет с датами на русском (требует локаль ru_RU)
SELECT 
    name,
    TO_CHAR(event_date, 'TMDay, DD TMMonth YYYY', 'ru_RU.UTF-8') AS russian_date
FROM events;

-- Создание уникальных идентификаторов с датой
SELECT 
    'EVENT_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS') AS event_id;
-- EVENT_20240615_143045

-- Группировка по месяцам с красивыми названиями
SELECT 
    TO_CHAR(event_date, 'YYYY-MM') AS month_key,
    TO_CHAR(event_date, 'FMMonth YYYY') AS month_name,
    COUNT(*) AS events_count
FROM events
GROUP BY TO_CHAR(event_date, 'YYYY-MM'), TO_CHAR(event_date, 'FMMonth YYYY')
ORDER BY month_key;
```

---

## DATE_TRUNC — усечение дат

### Что делает DATE_TRUNC?

**DATE_TRUNC** усекает дату/время до указанной точности.

```sql
-- Усечь до начала года
SELECT DATE_TRUNC('year', TIMESTAMP '2024-06-15 14:30:45') AS start_of_year;
-- 2024-01-01 00:00:00

-- Усечь до начала месяца
SELECT DATE_TRUNC('month', TIMESTAMP '2024-06-15 14:30:45') AS start_of_month;
-- 2024-06-01 00:00:00

-- Усечь до начала недели (понедельник)
SELECT DATE_TRUNC('week', TIMESTAMP '2024-06-15 14:30:45') AS start_of_week;
-- 2024-06-10 00:00:00

-- Усечь до начала дня
SELECT DATE_TRUNC('day', TIMESTAMP '2024-06-15 14:30:45') AS start_of_day;
-- 2024-06-15 00:00:00

-- Усечь до часа
SELECT DATE_TRUNC('hour', TIMESTAMP '2024-06-15 14:30:45') AS start_of_hour;
-- 2024-06-15 14:00:00

-- Усечь до минуты
SELECT DATE_TRUNC('minute', TIMESTAMP '2024-06-15 14:30:45') AS start_of_minute;
-- 2024-06-15 14:30:00
```

### Доступные единицы

- `microseconds`, `milliseconds`, `second`, `minute`, `hour`
- `day`, `week`, `month`, `quarter`, `year`
- `decade`, `century`, `millennium`

### Практическое применение

```sql
-- Группировка по дням
SELECT 
    DATE_TRUNC('day', start_timestamp) AS day,
    COUNT(*) AS events_count
FROM events
GROUP BY DATE_TRUNC('day', start_timestamp)
ORDER BY day;

-- Группировка по неделям
SELECT 
    DATE_TRUNC('week', event_date) AS week_start,
    COUNT(*) AS events_count,
    STRING_AGG(name, ', ') AS event_names
FROM events
GROUP BY DATE_TRUNC('week', event_date)
ORDER BY week_start;

-- Группировка по месяцам
SELECT 
    DATE_TRUNC('month', event_date) AS month,
    TO_CHAR(DATE_TRUNC('month', event_date), 'FMMonth YYYY') AS month_name,
    COUNT(*) AS events_count
FROM events
GROUP BY DATE_TRUNC('month', event_date)
ORDER BY month;

-- События в текущем месяце
SELECT 
    name,
    event_date
FROM events
WHERE DATE_TRUNC('month', event_date) = DATE_TRUNC('month', CURRENT_DATE)
ORDER BY event_date;

-- Сравнение периодов (этот месяц vs прошлый)
WITH current_month AS (
    SELECT COUNT(*) AS count
    FROM events
    WHERE DATE_TRUNC('month', event_date) = DATE_TRUNC('month', CURRENT_DATE)
),
previous_month AS (
    SELECT COUNT(*) AS count
    FROM events
    WHERE DATE_TRUNC('month', event_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
)
SELECT 
    cm.count AS current_count,
    pm.count AS previous_count,
    cm.count - pm.count AS difference,
    ROUND((cm.count - pm.count) * 100.0 / NULLIF(pm.count, 0), 2) AS growth_percent
FROM current_month cm, previous_month pm;
```

---

## Работа с текстом — основные функции

### Длина и размер строк

```sql
-- Длина строки (количество символов)
SELECT LENGTH('PostgreSQL') AS length;
-- 10

SELECT LENGTH('Привет, мир!') AS length_cyrillic;
-- 12

-- Размер в байтах
SELECT OCTET_LENGTH('PostgreSQL') AS bytes;
-- 10

SELECT OCTET_LENGTH('Привет') AS bytes_cyrillic;
-- 12 (UTF-8: 2 байта на символ)

-- Количество символов (для многобайтовых кодировок)
SELECT CHAR_LENGTH('Привет') AS char_count;
-- 6
```

### Изменение регистра

```sql
-- Верхний регистр
SELECT UPPER('PostgreSQL') AS uppercase;
-- POSTGRESQL

SELECT UPPER('привет') AS uppercase_cyrillic;
-- ПРИВЕТ

-- Нижний регистр
SELECT LOWER('PostgreSQL') AS lowercase;
-- postgresql

-- Первая буква заглавная (каждое слово)
SELECT INITCAP('hello world from postgresql') AS titlecase;
-- Hello World From Postgresql

SELECT INITCAP('привет мир от postgresql') AS titlecase_cyrillic;
-- Привет Мир От Postgresql
```

### Обрезка пробелов

```sql
-- Удалить пробелы с обеих сторон
SELECT TRIM('  PostgreSQL  ') AS trimmed;
-- 'PostgreSQL'

-- Удалить слева
SELECT LTRIM('  PostgreSQL  ') AS left_trimmed;
-- 'PostgreSQL  '

-- Удалить справа
SELECT RTRIM('  PostgreSQL  ') AS right_trimmed;
-- '  PostgreSQL'

-- Удалить конкретные символы
SELECT TRIM(BOTH '.' FROM '...PostgreSQL...') AS custom_trim;
-- 'PostgreSQL'

SELECT TRIM(LEADING '0' FROM '00012345') AS trim_zeros;
-- '12345'
```

### Извлечение подстрок

```sql
-- SUBSTRING (SUBSTR) — извлечь подстроку
SELECT SUBSTRING('PostgreSQL' FROM 1 FOR 6) AS sub1;
-- 'Postgr'

SELECT SUBSTRING('PostgreSQL', 7, 3) AS sub2;
-- 'SQL'

-- LEFT и RIGHT — с начала/конца
SELECT LEFT('PostgreSQL', 6) AS left_part;
-- 'Postgr'

SELECT RIGHT('PostgreSQL', 3) AS right_part;
-- 'SQL'

-- SPLIT_PART — разделить по разделителю
SELECT SPLIT_PART('one,two,three', ',', 1) AS first;
-- 'one'

SELECT SPLIT_PART('one,two,three', ',', 2) AS second;
-- 'two'

-- Примеры с данными
SELECT 
    name,
    LEFT(name, 20) AS short_name,
    SUBSTRING(description FROM 1 FOR 50) || '...' AS preview
FROM events
WHERE LENGTH(description) > 50;
```

### Объединение строк

```sql
-- Конкатенация через ||
SELECT 'Hello' || ' ' || 'World' AS greeting;
-- 'Hello World'

-- CONCAT — игнорирует NULL
SELECT CONCAT('Hello', NULL, 'World') AS concat_result;
-- 'HelloWorld'

-- Оператор || с NULL дает NULL
SELECT 'Hello' || NULL || 'World' AS concat_null;
-- NULL

-- CONCAT_WS — с разделителем
SELECT CONCAT_WS(', ', 'Apple', 'Banana', 'Cherry') AS fruits;
-- 'Apple, Banana, Cherry'

SELECT CONCAT_WS(' | ', 'PostgreSQL', NULL, 'SQL') AS with_null;
-- 'PostgreSQL | SQL' (NULL пропущен)

-- Практический пример
SELECT 
    CONCAT(EXTRACT(DAY FROM event_date), '.', 
           EXTRACT(MONTH FROM event_date), '.', 
           EXTRACT(YEAR FROM event_date)) AS formatted_date,
    name
FROM events;
```

### Замена и удаление

```sql
-- REPLACE — заменить подстроку
SELECT REPLACE('Hello World', 'World', 'PostgreSQL') AS replaced;
-- 'Hello PostgreSQL'

SELECT REPLACE('one-two-three', '-', ' ') AS replaced_dash;
-- 'one two three'

-- TRANSLATE — заменить символы
SELECT TRANSLATE('Hello123', '123', 'ABC') AS translated;
-- 'HelloABC'

-- Удалить символы (заменить на пустоту)
SELECT REPLACE('Hello@World!', '@', '') AS removed;
-- 'HelloWorld!'

-- Практический пример: очистка номеров телефонов
SELECT REPLACE(REPLACE(REPLACE(
    '+7 (900) 123-45-67', 
    ' ', ''), '(', ''), ')', '') AS clean_phone;
-- '+790012345-67'

SELECT TRANSLATE('+7 (900) 123-45-67', ' ()-', '') AS cleaner_phone;
-- '+790012345'
```

---

## Поиск и сравнение текста

### LIKE и ILIKE

```sql
-- LIKE (чувствителен к регистру)
SELECT name FROM events WHERE name LIKE 'Конференция%';
-- Найдет "Конференция PostgreSQL"

SELECT name FROM events WHERE name LIKE '%SQL%';
-- Найдет все с "SQL"

-- ILIKE (регистронезависимый)
SELECT name FROM events WHERE name ILIKE '%sql%';
-- Найдет "SQL", "sql", "Sql"

-- _ — один любой символ
SELECT name FROM events WHERE name LIKE 'Встреча_______';
-- "Встреча" + ровно 7 символов

-- Экранирование спецсимволов
SELECT * FROM events WHERE name LIKE '%\%%' ESCAPE '\';
-- Найдет строки с символом %
```

### POSITION и STRPOS — позиция подстроки

```sql
-- POSITION — найти позицию
SELECT POSITION('SQL' IN 'PostgreSQL') AS position;
-- 7

SELECT POSITION('xyz' IN 'PostgreSQL') AS not_found;
-- 0 (не найдено)

-- STRPOS — то же самое
SELECT STRPOS('PostgreSQL', 'SQL') AS position;
-- 7

-- Проверка вхождения
SELECT 
    name,
    CASE 
        WHEN POSITION('SQL' IN name) > 0 THEN 'Содержит SQL'
        ELSE 'Не содержит SQL'
    END AS has_sql
FROM events;
```

### Начало и конец строки

```sql
-- Проверить, начинается ли строка
SELECT 
    name,
    name LIKE 'Конференция%' AS starts_with_conf
FROM events;

-- Функция STARTS_WITH (PostgreSQL 12+)
SELECT 
    name,
    STARTS_WITH(name, 'Конференция') AS starts_with
FROM events;

-- Проверить окончание
SELECT 
    name,
    name LIKE '%компании' AS ends_with
FROM events;
```

### STRING_AGG — агрегация строк

```sql
-- Объединить строки с разделителем
SELECT STRING_AGG(name, ', ') AS all_events
FROM events;
-- 'Конференция PostgreSQL, Встреча команды, ...'

-- С сортировкой
SELECT STRING_AGG(name, ', ' ORDER BY event_date) AS events_chronological
FROM events;

-- Группировка по месяцам с списком событий
SELECT 
    DATE_TRUNC('month', event_date) AS month,
    COUNT(*) AS events_count,
    STRING_AGG(name, ' | ' ORDER BY event_date) AS events_list
FROM events
GROUP BY DATE_TRUNC('month', event_date)
ORDER BY month;
```

---

## Регулярные выражения

### Операторы регулярных выражений

| Оператор | Описание | Чувствительность к регистру |
|----------|----------|----------------------------|
| `~` | Совпадает | Да |
| `~*` | Совпадает | Нет |
| `!~` | Не совпадает | Да |
| `!~*` | Не совпадает | Нет |

### Базовые паттерны

```sql
-- Начинается с цифры
SELECT name FROM events WHERE name ~ '^[0-9]';

-- Содержит email
SELECT description FROM events 
WHERE description ~ '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}';

-- Только буквы и пробелы (без цифр)
SELECT name FROM events WHERE name ~ '^[А-Яа-яA-Za-z\s]+;

-- Содержит слово целиком (с границами)
SELECT name FROM events WHERE name ~* '\mSQL\M';
-- Найдет "SQL", но не "MySQLite"

-- Телефонный номер (простая проверка)
CREATE TABLE contacts (phone VARCHAR(20));
INSERT INTO contacts VALUES ('+7 900 123-45-67'), ('invalid'), ('+7-901-234-56-78');

SELECT phone FROM contacts 
WHERE phone ~ '^\+?[0-9\s\-\(\)]{10,};
```

### REGEXP_MATCH — извлечение совпадений

```sql
-- Извлечь первое совпадение
SELECT REGEXP_MATCH('Price: 1500 rubles', '\d+') AS price;
-- {1500}

-- Извлечь с группами
SELECT REGEXP_MATCH('Email: user@example.com', '([^@]+)@([^\.]+)\.(.+)') AS email_parts;
-- {user,example,com}

-- Практический пример: извлечь год из текста
SELECT 
    description,
    (REGEXP_MATCH(description, '\d{4}'))[1] AS year
FROM events
WHERE description ~ '\d{4}';

-- Извлечь все числа
SELECT REGEXP_MATCHES('Order #123 costs 1500 RUB', '\d+', 'g') AS numbers;
-- {123}, {1500}
```

### REGEXP_REPLACE — замена по паттерну

```sql
-- Заменить все цифры на X
SELECT REGEXP_REPLACE('Phone: 123-456-7890', '\d', 'X', 'g') AS masked;
-- 'Phone: XXX-XXX-XXXX'

-- Удалить все небуквенные символы
SELECT REGEXP_REPLACE('Hello, World! 123', '[^A-Za-z\s]', '', 'g') AS clean;
-- 'Hello World '

-- Форматирование телефона
SELECT REGEXP_REPLACE(
    '+79001234567', 
    '^\+?(\d)(\d{3})(\d{3})(\d{2})(\d{2}), 
    '+\1 (\2) \3-\4-\5'
) AS formatted_phone;
-- '+7 (900) 123-45-67'

-- Практический пример: очистка HTML тегов
CREATE TABLE posts (content TEXT);
INSERT INTO posts VALUES 
    ('<p>Hello <b>World</b>!</p>'),
    ('Plain text'),
    ('<div>Text with <a href="#">link</a></div>');

SELECT 
    content AS original,
    REGEXP_REPLACE(content, '<[^>]+>', '', 'g') AS clean_text
FROM posts;
```

### REGEXP_SPLIT_TO_TABLE — разделение строки

```sql
-- Разделить строку по паттерну
SELECT REGEXP_SPLIT_TO_TABLE('one,two;three:four', '[,;:]') AS parts;
-- one
-- two
-- three
-- four

-- Разделить по пробелам
SELECT REGEXP_SPLIT_TO_TABLE('Hello   World  PostgreSQL', '\s+') AS words;
-- Hello
-- World
-- PostgreSQL
```

### Практические примеры

```sql
-- Валидация email
CREATE TABLE users (email VARCHAR(100));
INSERT INTO users VALUES 
    ('valid@example.com'),
    ('also.valid@test.co.uk'),
    ('invalid@'),
    ('no-at-sign.com');

SELECT 
    email,
    email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,} AS is_valid
FROM users;

-- Извлечение доменов из email
SELECT 
    email,
    (REGEXP_MATCH(email, '@([^@]+)))[1] AS domain
FROM users
WHERE email ~* '@';

-- Поиск хештегов в тексте
SELECT 
    name,
    REGEXP_MATCHES(name, '#\w+', 'g') AS hashtags
FROM events;

-- Извлечение всех чисел
SELECT 
    description,
    ARRAY_AGG((REGEXP_MATCHES(description, '\d+', 'g'))[1]) AS all_numbers
FROM events
WHERE description ~ '\d+'
GROUP BY description;
```

---

## Работа с JSON

### JSON типы в PostgreSQL

- `JSON` — текстовое хранение, сохраняет форматирование
- `JSONB` — бинарное хранение, быстрее, поддерживает индексы (рекомендуется!)

### Создание JSON данных

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    specs JSONB,
    metadata JSON
);

INSERT INTO products (name, specs, metadata) VALUES 
    ('Ноутбук', 
     '{"brand": "Dell", "cpu": "Intel i7", "ram": 16, "storage": {"type": "SSD", "size": 512}}',
     '{"created": "2024-01-15", "tags": ["electronics", "computer"]}'),
    ('Телефон',
     '{"brand": "Apple", "model": "iPhone 15", "storage": 256, "colors": ["black", "white"]}',
     '{"created": "2024-01-20", "tags": ["electronics", "mobile"]}'),
    ('Монитор',
     '{"brand": "Samsung", "size": 27, "resolution": "2560x1440", "features": ["HDR", "FreeSync"]}',
     '{"created": "2024-02-01", "tags": ["electronics", "display"]}');
```

### Извлечение данных из JSON

```sql
-- Оператор -> возвращает JSON
SELECT 
    name,
    specs -> 'brand' AS brand_json
FROM products;
-- "Dell"

-- Оператор ->> возвращает TEXT
SELECT 
    name,
    specs ->> 'brand' AS brand_text
FROM products;
-- Dell

-- Вложенные данные
SELECT 
    name,
    specs -> 'storage' ->> 'type' AS storage_type
FROM products
WHERE specs -> 'storage' IS NOT NULL;

-- Доступ к массивам
SELECT 
    name,
    specs -> 'colors' AS colors_array,
    specs -> 'colors' ->> 0 AS first_color
FROM products
WHERE specs ? 'colors';

-- Извлечь массив как строки
SELECT 
    name,
    JSONB_ARRAY_ELEMENTS_TEXT(specs -> 'colors') AS color
FROM products
WHERE specs ? 'colors';
```

### Операторы для работы с JSON

```sql
-- ? — ключ существует
SELECT name FROM products WHERE specs ? 'ram';
-- Ноутбук

-- ?& — все ключи существуют
SELECT name FROM products WHERE specs ?& ARRAY['brand', 'model'];
-- Телефон

-- ?| — хотя бы один ключ существует
SELECT name FROM products WHERE specs ?| ARRAY['cpu', 'model'];
-- Ноутбук, Телефон

-- @> — содержит JSON
SELECT name FROM products WHERE specs @> '{"brand": "Apple"}';
-- Телефон

-- <@ — содержится в JSON
SELECT name FROM products WHERE '{"brand": "Dell"}' <@ specs;
-- Ноутбук

-- Поиск в массивах
SELECT name FROM products 
WHERE specs -> 'features' @> '["HDR"]';
-- Монитор
```

### Функции для работы с JSON

```sql
-- JSONB_BUILD_OBJECT — создать JSON объект
SELECT JSONB_BUILD_OBJECT(
    'name', name,
    'brand', specs ->> 'brand',
    'has_storage', specs ? 'storage'
) AS product_info
FROM products;

-- JSONB_BUILD_ARRAY — создать JSON массив
SELECT JSONB_BUILD_ARRAY(
    specs ->> 'brand',
    name,
    id
) AS product_array
FROM products;

-- JSONB_OBJECT_KEYS — получить все ключи
SELECT 
    name,
    JSONB_OBJECT_KEYS(specs) AS spec_keys
FROM products;

-- JSONB_EACH — развернуть JSON в строки
SELECT 
    name,
    key,
    value
FROM products, JSONB_EACH(specs)
WHERE name = 'Ноутбук';

-- JSONB_ARRAY_LENGTH — длина массива
SELECT 
    name,
    JSONB_ARRAY_LENGTH(specs -> 'colors') AS colors_count
FROM products
WHERE specs ? 'colors';

-- JSONB_SET — изменить значение
UPDATE products
SET specs = JSONB_SET(specs, '{ram}', '32')
WHERE name = 'Ноутбук';

-- JSONB_INSERT — вставить значение
UPDATE products
SET specs = JSONB_INSERT(specs, '{warranty}', '"2 years"')
WHERE id = 1;

-- Удалить ключ
UPDATE products
SET specs = specs - 'metadata'
WHERE id = 1;
```

### Агрегация JSON

```sql
-- Собрать результаты в JSON массив
SELECT JSONB_AGG(
    JSONB_BUILD_OBJECT(
        'name', name,
        'brand', specs ->> 'brand'
    )
) AS all_products
FROM products;

-- Собрать в JSON объект
SELECT JSONB_OBJECT_AGG(
    name,
    specs ->> 'brand'
) AS products_brands
FROM products;
```

### Индексирование JSON

```sql
-- GIN индекс для быстрого поиска
CREATE INDEX idx_products_specs ON products USING GIN (specs);

-- Теперь быстро работает
SELECT * FROM products WHERE specs @> '{"brand": "Apple"}';

-- Индекс для конкретного пути
CREATE INDEX idx_products_brand ON products ((specs ->> 'brand'));

SELECT * FROM products WHERE specs ->> 'brand' = 'Apple';
```

---

## Практическое задание

### Задание 1: Система событий с умными датами (обязательно)

```sql
CREATE DATABASE events_system;
\c events_system

CREATE TABLE events_full (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    location VARCHAR(200),
    organizer VARCHAR(100),
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (end_datetime > start_datetime)
);

INSERT INTO events_full (title, description, start_datetime, end_datetime, location, organizer, tags, metadata) VALUES 
    ('PostgreSQL Meetup #15', 'Обсуждаем новые возможности PostgreSQL 16', '2024-03-15 18:00:00+03', '2024-03-15 21:00:00+03', 'Москва, ул. Ленина 1', 'Tech Community', ARRAY['database', 'postgresql', 'meetup'], '{"capacity": 50, "price": "free", "level": "intermediate"}'),
    ('SQL Workshop', 'Практический воркшоп по оптимизации запросов', '2024-04-20 10:00:00+03', '2024-04-20 18:00:00+03', 'Онлайн', 'DB Academy', ARRAY['education', 'sql', 'workshop'], '{"capacity": 100, "price": 2500, "level": "advanced"}'),
    ('Data Engineering Conference 2024', 'Главная конференция по Data Engineering в России', '2024-06-15 09:00:00+03', '2024-06-16 18:00:00+03', 'Санкт-Петербург, КВЦ', 'DataCon', ARRAY['conference', 'data', 'engineering'], '{"capacity": 500, "price": 15000, "level": "all"}');

-- Задания:

-- 1. Найти события на следующей неделе
SELECT 
    title,
    TO_CHAR(start_datetime, 'DD.MM.YYYY (Dy) в HH24:MI') AS when_formatted,
    start_datetime - NOW() AS time_until
FROM events_full
WHERE start_datetime BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY start_datetime;

-- 2. Продолжительность каждого события
SELECT 
    title,
    start_datetime,
    end_datetime,
    end_datetime - start_datetime AS duration,
    EXTRACT(EPOCH FROM (end_datetime - start_datetime)) / 3600 AS hours
FROM events_full;

-- 3. Групп��ровка по месяцам с подсчетом
SELECT 
    DATE_TRUNC('month', start_datetime) AS month,
    TO_CHAR(DATE_TRUNC('month', start_datetime), 'FMMonth YYYY') AS month_name,
    COUNT(*) AS events_count,
    STRING_AGG(title, ' | ' ORDER BY start_datetime) AS events_list
FROM events_full
GROUP BY DATE_TRUNC('month', start_datetime)
ORDER BY month;

-- 4. События в рабочее/нерабочее время
SELECT 
    title,
    TO_CHAR(start_datetime, 'HH24:MI') AS start_time,
    CASE 
        WHEN EXTRACT(HOUR FROM start_datetime) BETWEEN 9 AND 18 
         AND EXTRACT(ISODOW FROM start_datetime) < 6
        THEN 'Рабочее время'
        WHEN EXTRACT(ISODOW FROM start_datetime) >= 6
        THEN 'Выходной'
        ELSE 'Нерабочее время'
    END AS time_type
FROM events_full;

-- 5. Поиск по тегам и метаданным
SELECT 
    title,
    tags,
    metadata ->> 'level' AS level,
    metadata ->> 'price' AS price
FROM events_full
WHERE 'postgresql' = ANY(tags)
   OR metadata @> '{"level": "advanced"}';

-- 6. Статистика по организаторам
SELECT 
    organizer,
    COUNT(*) AS events_count,
    MIN(start_datetime) AS first_event,
    MAX(start_datetime) AS last_event,
    STRING_AGG(DISTINCT tags::TEXT, ', ') AS all_tags
FROM events_full, UNNEST(tags) AS tags
GROUP BY organizer;
```

---

### Задание 2: Обработка текстовых данных (обязательно)

```sql
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(100),
    email VARCHAR(100),
    published_at TIMESTAMPTZ,
    url VARCHAR(500)
);

INSERT INTO articles (title, content, author, email, published_at, url) VALUES 
    ('Введение в PostgreSQL', 'PostgreSQL - это мощная объектно-реляционная СУБД. В этой статье мы рассмотрим основы работы с PostgreSQL и узнаем, почему она так популярна. Email для связи: admin@example.com', 'Иван Петров', 'ivan@tech.com', '2024-01-15 10:00:00+03', 'https://blog.example.com/intro-postgresql'),
    ('Оптимизация запросов SQL', 'Оптимизация SQL-запросов - ключевой навык. Рассмотрим 10 способов ускорить ваши запросы. Контакт: support@db.com. Телефон: +7-900-123-4567', 'Мария Сидорова', 'maria@db.com', '2024-02-20 14:30:00+03', 'https://blog.example.com/sql-optimization'),
    ('JSON в PostgreSQL', 'JSON и JSONB типы данных позволяют хранить полуструктурированные данные. В статье 3000+ слов подробной информации!', 'Алексей Смирнов', 'alex@data.com', '2024-03-10 09:15:00+03', 'https://blog.example.com/json-postgresql');

-- Задания:

-- 1. Извлечь email из текста
SELECT 
    title,
    (REGEXP_MATCH(content, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'))[1] AS extracted_email
FROM articles
WHERE content ~ '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}';

-- 2. Очистить телефоны
SELECT 
    title,
    (REGEXP_MATCH(content, '\+?[0-9\-\(\)\s]{10,}'))[1] AS phone_raw,
    REGEXP_REPLACE(
        (REGEXP_MATCH(content, '\+?[0-9\-\(\)\s]{10,}'))[1],
        '[^0-9+]', '', 'g'
    ) AS phone_clean
FROM articles
WHERE content ~ '\+?[0-9\-\(\)\s]{10,}';

-- 3. Статистика по тексту
SELECT 
    title,
    LENGTH(content) AS chars,
    ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(content, '\s+'), 1) AS words,
    ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(content, '\.'), 1) - 1 AS sentences,
    ROUND(
        ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(content, '\s+'), 1)::NUMERIC / 
        (ARRAY_LENGTH(REGEXP_SPLIT_TO_ARRAY(content, '\.'), 1) - 1),
        1
    ) AS avg_words_per_sentence
FROM articles;

-- 4. Поиск по ключевым словам (регистронезависимо)
SELECT 
    title,
    CASE 
        WHEN content ~* 'оптимизация' THEN TRUE
        ELSE FALSE
    END AS has_optimization,
    CASE 
        WHEN content ~* 'json' THEN TRUE
        ELSE FALSE
    END AS has_json
FROM articles;

-- 5. Извлечь домен из URL
SELECT 
    title,
    url,
    (REGEXP_MATCH(url, 'https?://([^/]+)'))[1] AS domain
FROM articles;

-- 6. Создать превью (первые 100 символов + ...)
SELECT 
    title,
    CASE 
        WHEN LENGTH(content) > 100 
        THEN LEFT(content, 100) || '...'
        ELSE content
    END AS preview
FROM articles;

-- 7. Подсчет упоминаний PostgreSQL
SELECT 
    title,
    author,
    (LENGTH(content) - LENGTH(REPLACE(LOWER(content), 'postgresql', ''))) / LENGTH('postgresql') AS postgresql_mentions
FROM articles
ORDER BY postgresql_mentions DESC;
```

---

### Задание 3: Комплексный анализ (дополнительно)

Создайте отчет с использованием всех изученных функций:

```sql
-- Полный аналитический отчет по событиям
WITH event_analysis AS (
    SELECT 
        id,
        title,
        start_datetime,
        end_datetime,
        -- Даты
        TO_CHAR(start_datetime, 'DD.MM.YYYY') AS date_formatted,
        EXTRACT(DOW FROM start_datetime) AS day_of_week,
        DATE_TRUNC('month', start_datetime) AS month,
        -- Время
        EXTRACT(HOUR FROM start_datetime) AS start_hour,
        end_datetime - start_datetime AS duration,
        -- Текст
        LENGTH(description) AS description_length,
        ARRAY_LENGTH(tags, 1) AS tags_count,
        -- JSON
        (metadata ->> 'price')::NUMERIC AS price,
        metadata ->> 'level' AS level
    FROM events_full
)
SELECT 
    TO_CHAR(month, 'FMMonth YYYY') AS month_name,
    COUNT(*) AS events_count,
    ROUND(AVG(EXTRACT(EPOCH FROM duration) / 3600), 2) AS avg_duration_hours,
    ROUND(AVG(price), 0) AS avg_price,
    ROUND(AVG(description_length), 0) AS avg_description_length,
    STRING_AGG(DISTINCT level, ', ') AS levels,
    ARRAY_AGG(DISTINCT 
        CASE day_of_week
            WHEN 1 THEN 'ПН' WHEN 2 THEN 'ВТ' WHEN 3 THEN 'СР'
            WHEN 4 THEN 'ЧТ' WHEN 5 THEN 'ПТ' WHEN 6 THEN 'СБ' WHEN 0 THEN 'ВС'
        END
    ORDER BY day_of_week) AS weekdays
FROM event_analysis
GROUP BY month
ORDER BY month;
```

---

## Контрольные вопросы

1. В чем разница между DATE, TIMESTAMP и TIMESTAMPTZ?
2. Как добавить 3 месяца к дате?
3. Что делает функция AGE()?
4. Для чего используется DATE_TRUNC()?
5. Как извлечь день недели из даты?
6. В чем разница между UPPER() и INITCAP()?
7. Что делает TRIM() и чем отличается от LTRIM()?
8. Как объединить строки с разделителем?
9. В чем разница между LIKE и регулярными выражениями?
10. Что делает оператор ->> в JSON?
11. В чем разница между JSON и JSONB?
12. Зачем нужен GIN индекс для JSONB?

<details>
<summary>Ответы</summary>

1. DATE — только дата, TIMESTAMP — дата+время без пояса, TIMESTAMPTZ — с часовым поясом.
2. date_column + INTERVAL '3 months'
3. Вычисляет разницу между датами в читаемом формате (годы, месяцы, дни).
4. Усекает дату/время до указанной точности (день, месяц, год и т.д.).
5. EXTRACT(DOW FROM date) или EXTRACT(ISODOW FROM date)
6. UPPER — весь текст в верхнем регистре, INITCAP — первая буква каждого слова заглавная.
7. TRIM убирает пробелы с обеих сторон, LTRIM — только слева.
8. CONCAT_WS(separator, str1, str2, ...) или STRING_AGG(column, separator)
9. LIKE для простых паттернов (% и _), regex для сложных (~ оператор).
10. Извлекает значение из JSON как TEXT (-> возвращает JSON).
11. JSON — текстовое хранение, JSONB — бинарное, быстрее, поддерживает индексы.
12. Для быстрого поиска по содержимому JSONB (@>, ? операторы).
</details>
