---
sidebar_position: 2
description: "В этой главе мы изучим основные команды SQL и типы данных"
---

# Основы SQL и типы данных

## Что такое SQL

### Знакомство с SQL

**SQL** (Structured Query Language — Язык Структурированных Запросов) — это язык для общения с базами данных.

**Аналогия:** Если база данных — это библиотека, то SQL — это язык, на котором вы общаетесь с библиотекарем:
- "Покажи мне все книги о PostgreSQL" → `SELECT`
- "Добавь новую книгу на полку" → `INSERT`
- "Удали старую книгу" → `DELETE`
- "Измени цену книги" → `UPDATE`

### SQL — это стандарт

SQL стандартизирован, поэтому:
- Один раз изучив SQL для PostgreSQL, вы легко работаете с MySQL, Oracle и другими
- Синтаксис почти одинаковый во всех СУБД (есть небольшие различия)
- Знание SQL — востребованный навык на рынке труда

### Основные категории SQL-команд

**DDL (Data Definition Language) — Определение структуры:**
- `CREATE` — создать таблицу, базу данных
- `ALTER` — изменить структуру таблицы
- `DROP` — удалить таблицу, базу данных

**DML (Data Manipulation Language) — Работа с данными:**
- `SELECT` — получить данные (читать)
- `INSERT` — добавить данные
- `UPDATE` — изменить данные
- `DELETE` — удалить данные

**DCL (Data Control Language) — Управление доступом:**
- `GRANT` — дать права пользователю
- `REVOKE` — забрать права

На этой неделе мы сфокусируемся на **DDL** (создание таблиц) и **DML** (работа с данными).

### Правила написания SQL

1. **SQL нечувствителен к регистру** (но есть соглашения):
   ```sql
   SELECT * FROM users;  -- хорошо
   select * from users;  -- работает, но не принято
   ```

2. **Ключевые слова пишем БОЛЬШИМИ буквами:**
   ```sql
   SELECT name FROM products WHERE price > 100;
   ```

3. **Названия таблиц и столбцов — строчными:**
   ```sql
   CREATE TABLE customers (id, name, email);
   ```

4. **Команды заканчиваются точкой с запятой:**
   ```sql
   SELECT * FROM users;
   ```

5. **Комментарии:**
   ```sql
   -- Это однострочный комментарий
   
   /* Это многострочный
      комментарий */
   ```

---

## Типы данных в PostgreSQL

### Зачем нужны типы данных?

Типы данных определяют:
- **Что можно хранить:** число, текст, дату
- **Сколько места занимает:** INTEGER занимает 4 байта, BIGINT — 8 байт
- **Какие операции доступны:** с числами можно складывать, с текстом — нет

**Правило:** Выбирайте тип данных, который точно соответствует вашим данным!

### Числовые типы

#### Целые числа

| Тип | Размер | Диапазон | Когда использовать |
|-----|--------|----------|-------------------|
| `SMALLINT` | 2 байта | -32,768 до 32,767 | Возраст, количество (малое) |
| `INTEGER` (или `INT`) | 4 байта | -2 млрд до 2 млрд | Самый частый выбор |
| `BIGINT` | 8 байта | -9 квинтиллионов до 9 квинтиллионов | Очень большие числа |
| `SERIAL` | 4 байта | Автоинкремент 1, 2, 3... | ID записей (первичный ключ) |
| `BIGSERIAL` | 8 байта | Автоинкремент (большой) | ID для огромных таблиц |

**Примеры использования:**
```sql
age SMALLINT           -- Возраст человека (0-120)
product_count INTEGER  -- Количество товаров
user_id SERIAL         -- ID пользователя (автоматически растет)
views_count BIGINT     -- Количество просмотров видео на YouTube
```

#### Десятичные числа

| Тип | Описание | Когда использовать |
|-----|----------|-------------------|
| `DECIMAL(p, s)` или `NUMERIC(p, s)` | Точное число | **Деньги!** Всегда используйте для денег |
| `REAL` | Приблизительное (4 байта) | Научные расчеты |
| `DOUBLE PRECISION` | Приблизительное (8 байт) | Научные расчеты, координаты |

**p** = precision (общее количество цифр), **s** = scale (цифры после запятой)

**Примеры:**
```sql
price DECIMAL(10, 2)      -- Цена: 12345678.99 (10 цифр, 2 после запятой)
balance NUMERIC(15, 2)    -- Баланс счета: до 15 цифр
temperature REAL          -- Температура: 36.6
latitude DOUBLE PRECISION -- Координаты: 55.751244
```

**Важно:** Для денег ВСЕГДА используйте `DECIMAL` или `NUMERIC`, а не `REAL` или `DOUBLE PRECISION`! Последние могут давать ошибки округления.

```sql
-- ПЛОХО для денег:
price REAL -- может дать 9.99 вместо 10.00

-- ХОРОШО для денег:
price DECIMAL(10, 2) -- точное значение
```

### Текстовые типы

| Тип | Описание | Когда использовать |
|-----|----------|-------------------|
| `CHAR(n)` | Фиксированная длина | Редко (коды стран: 'US', 'RU') |
| `VARCHAR(n)` | До n символов | Имена, email, заголовки |
| `TEXT` | Неограниченная длина | Описания, статьи, комментарии |

**Примеры:**
```sql
country_code CHAR(2)       -- 'US', 'RU' (всегда 2 символа)
username VARCHAR(50)       -- Имя пользователя (до 50 символов)
email VARCHAR(100)         -- Email адрес
product_name VARCHAR(200)  -- Название товара
description TEXT           -- Описание товара (любая длина)
article_content TEXT       -- Текст статьи
```

**Совет:** Если не знаете, сколько текста будет — используйте `TEXT`. В PostgreSQL разницы в производительности между `VARCHAR` и `TEXT` практически нет!

### Типы для даты и времени

| Тип | Формат | Пример | Когда использовать |
|-----|--------|--------|-------------------|
| `DATE` | YYYY-MM-DD | 2024-01-15 | Дата рождения, дата заказа |
| `TIME` | HH:MM:SS | 14:30:00 | Время работы магазина |
| `TIMESTAMP` | Дата + время | 2024-01-15 14:30:00 | Время создания записи |
| `TIMESTAMPTZ` | Дата + время + часовой пояс | 2024-01-15 14:30:00+03 | Международные приложения |

**Примеры:**
```sql
birth_date DATE                    -- Дата рождения: 1990-05-15
created_at TIMESTAMP               -- Когда создана запись
updated_at TIMESTAMP               -- Когда обновлена запись
event_time TIMESTAMPTZ             -- Время события с часовым поясом
```

**Полезные значения по умолчанию:**
```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Автоматически текущее время
registered_at TIMESTAMPTZ DEFAULT NOW()         -- То же, но с часовым поясом
```

### Логический тип

| Тип | Значения | Когда использовать |
|-----|----------|-------------------|
| `BOOLEAN` | TRUE, FALSE, NULL | Да/Нет вопросы |

**Примеры:**
```sql
is_active BOOLEAN           -- Активен ли пользователь?
is_published BOOLEAN        -- Опубликована ли статья?
has_discount BOOLEAN        -- Есть ли скидка?
email_verified BOOLEAN      -- Подтвержден ли email?
```

**В запросах можно писать:**
```sql
-- Все эти варианты работают для TRUE:
is_active = TRUE
is_active = 't'
is_active = 'true'
is_active = 'yes'
is_active = '1'

-- Для FALSE:
is_active = FALSE
is_active = 'f'
is_active = 'false'
is_active = 'no'
is_active = '0'
```

### Специальные типы PostgreSQL

#### JSON / JSONB
Для хранения JSON-данных:
```sql
settings JSONB  -- Настройки пользователя в формате JSON
metadata JSON   -- Дополнительные данные
```

#### Массивы
PostgreSQL поддерживает массивы:
```sql
tags TEXT[]              -- Массив тегов: ['postgresql', 'sql', 'database']
prices INTEGER[]         -- Массив цен: [100, 200, 300]
```

#### UUID
Универсальные уникальные идентификаторы:
```sql
id UUID DEFAULT gen_random_uuid()  -- Генерация UUID автоматически
```

---

## Создание первой таблицы (CREATE TABLE)

### Синтаксис CREATE TABLE

```sql
CREATE TABLE имя_таблицы (
    название_столбца1 ТИП_ДАННЫХ ограничения,
    название_столбца2 ТИП_ДАННЫХ ограничения,
    ...
);
```

### Пример: Таблица пользователей

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    age INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Разбор по частям:**
- `id SERIAL PRIMARY KEY` — ID, автоматически увеличивается, первичный ключ
- `username VARCHAR(50) NOT NULL` — имя пользователя, до 50 символов, обязательное
- `email VARCHAR(100) NOT NULL UNIQUE` — email, обязательный и уникальный
- `age INTEGER` — возраст, может быть пустым (NULL)
- `is_active BOOLEAN DEFAULT TRUE` — активен ли пользователь, по умолчанию TRUE
- `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP` — дата создания, автоматически

### Основные ограничения (Constraints)

| Ограничение | Описание | Пример |
|-------------|----------|--------|
| `PRIMARY KEY` | Уникальный идентификатор | `id SERIAL PRIMARY KEY` |
| `NOT NULL` | Поле обязательно | `email VARCHAR(100) NOT NULL` |
| `UNIQUE` | Значения должны быть уникальны | `username VARCHAR(50) UNIQUE` |
| `DEFAULT` | Значение по умолчанию | `status VARCHAR(20) DEFAULT 'active'` |
| `CHECK` | Проверка условия | `age INTEGER CHECK (age >= 0)` |

### Пример: Таблица товаров

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    category VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Что мы добавили:**
- `CHECK (price > 0)` — цена должна быть положительной
- `CHECK (stock_quantity >= 0)` — количество не может быть отрицательным
- `description TEXT` — описание может быть длинным
- `category VARCHAR(50)` — категория товара

### Просмотр структуры таблицы

**В psql:**
```sql
\d products
```

**Результат:**
```
                                    Table "public.products"
     Column      |          Type          |                      Modifiers
-----------------+------------------------+-----------------------------------------------------
 id              | integer                | not null default nextval('products_id_seq'::regclass)
 name            | character varying(200) | not null
 description     | text                   |
 price           | numeric(10,2)          | not null
 stock_quantity  | integer                | default 0
 category        | character varying(50)  |
 is_available    | boolean                | default true
 created_at      | timestamp              | default CURRENT_TIMESTAMP
Indexes:
    "products_pkey" PRIMARY KEY, btree (id)
```

### Удаление таблицы

**Внимание:** Это удалит таблицу и ВСЕ данные безвозвратно!

```sql
DROP TABLE products;

-- Или безопасный вариант (не выдаст ошибку, если таблицы нет):
DROP TABLE IF EXISTS products;
```

---

## Добавление данных (INSERT)

### Базовый синтаксис INSERT

```sql
INSERT INTO имя_таблицы (столбец1, столбец2, ...)
VALUES (значение1, значение2, ...);
```

### Добавление одной записи

```sql
-- Добавим пользователя
INSERT INTO users (username, email, age)
VALUES ('alice', 'alice@example.com', 25);

-- Можно не указывать столбцы, если даем значения для ВСЕХ столбцов по порядку
-- (но это не рекомендуется)
INSERT INTO users
VALUES (DEFAULT, 'bob', 'bob@example.com', 30, TRUE, DEFAULT);
```

**Важно:**
- Текстовые значения в **одинарных кавычках**: `'alice'`
- Числа без кавычек: `25`
- `DEFAULT` — использовать значение по умолчанию

### Добавление нескольких записей

```sql
INSERT INTO products (name, price, stock_quantity, category)
VALUES 
    ('Ноутбук Lenovo', 45000.00, 10, 'Электроника'),
    ('Мышь Logitech', 1500.00, 50, 'Электроника'),
    ('Клавиатура', 2500.00, 30, 'Электроника'),
    ('Стол письменный', 8000.00, 5, 'Мебель'),
    ('Кресло офисное', 12000.00, 8, 'Мебель');
```

**Преимущества:**
- Быстрее, чем 5 отдельных INSERT
- Меньше кода
- Более эффективно для базы данных

### INSERT с возвратом данных

PostgreSQL позволяет вернуть добавленные данные:

```sql
INSERT INTO users (username, email, age)
VALUES ('charlie', 'charlie@example.com', 28)
RETURNING id, username, created_at;
```

**Результат:**
```
 id | username  |       created_at        
----+-----------+-------------------------
  3 | charlie   | 2024-01-15 14:30:00
```

Это очень полезно, когда нужно узнать автоматически созданный ID!

### Работа со специальными значениями

```sql
-- NULL (пустое значение)
INSERT INTO products (name, price, description)
VALUES ('Товар без описания', 100.00, NULL);

-- Логические значения
INSERT INTO users (username, email, is_active)
VALUES ('inactive_user', 'test@example.com', FALSE);

-- Текущая дата/время
INSERT INTO orders (user_id, total, created_at)
VALUES (1, 5000.00, CURRENT_TIMESTAMP);
-- или просто полагаться на DEFAULT
```

---

## Чтение данных (SELECT)

### Базовый синтаксис SELECT

```sql
SELECT столбцы FROM таблица;
```

### Получить все данные

```sql
-- Звездочка * означает "все столбцы"
SELECT * FROM users;
```

**Результат:**
```
 id | username | email              | age | is_active |     created_at      
----+----------+--------------------+-----+-----------+---------------------
  1 | alice    | alice@example.com  |  25 | t         | 2024-01-15 14:00:00
  2 | bob      | bob@example.com    |  30 | t         | 2024-01-15 14:05:00
  3 | charlie  | charlie@example.com|  28 | t         | 2024-01-15 14:30:00
```

### Получить конкретные столбцы

```sql
-- Только имя и email
SELECT username, email FROM users;
```

**Результат:**
```
 username | email              
----------+--------------------
 alice    | alice@example.com
 bob      | bob@example.com
 charlie  | charlie@example.com
```

**Совет:** В реальных проектах избегайте `SELECT *`. Указывайте только нужные столбцы — это быстрее и понятнее.

### Псевдонимы столбцов (AS)

```sql
SELECT 
    username AS имя_пользователя,
    email AS почта,
    age AS возраст
FROM users;
```

**Результат:**
```
 имя_пользователя | почта              | возраст
------------------+--------------------+---------
 alice            | alice@example.com  | 25
 bob              | bob@example.com    | 30
```

### Вычисления в SELECT

```sql
-- Рассчитать цену со скидкой 10%
SELECT 
    name,
    price,
    price * 0.9 AS price_with_discount,
    stock_quantity * price AS total_value
FROM products;
```

### Конкатенация (объединение) текста

```sql
-- Объединить имя и email
SELECT 
    username || ' (' || email || ')' AS user_info
FROM users;
```

**Результат:**
```
 user_info
---------------------------------
 alice (alice@example.com)
 bob (bob@example.com)
 charlie (charlie@example.com)
```

---

## Фильтрация данных (WHERE)

### Базовый синтаксис WHERE

```sql
SELECT столбцы 
FROM таблица 
WHERE условие;
```

### Операторы сравнения

| Оператор | Описание | Пример |
|----------|----------|--------|
| `=` | Равно | `age = 25` |
| `!=` или `<>` | Не равно | `age != 25` |
| `>` | Больше | `price > 1000` |
| `<` | Меньше | `age < 30` |
| `>=` | Больше или равно | `stock_quantity >= 10` |
| `<=` | Меньше или равно | `price <= 5000` |

### Примеры фильтрации

```sql
-- Пользователи старше 25 лет
SELECT * FROM users WHERE age > 25;

-- Товары дешевле 10000
SELECT name, price FROM products WHERE price < 10000;

-- Неактивные пользователи
SELECT username, email FROM users WHERE is_active = FALSE;

-- Товары категории "Электроника"
SELECT * FROM products WHERE category = 'Электроника';
```

### Логические операторы (AND, OR, NOT)

```sql
-- AND (И) - все условия должны выполняться
SELECT * FROM products 
WHERE category = 'Электроника' AND price < 5000;

-- OR (ИЛИ) - хотя бы одно условие
SELECT * FROM products 
WHERE category = 'Электроника' OR category = 'Мебель';

-- NOT (НЕ) - отрицание
SELECT * FROM users WHERE NOT is_active;
-- Эквивалентно: WHERE is_active = FALSE

-- Сложное условие со скобками
SELECT * FROM products 
WHERE (category = 'Электроника' OR category = 'Мебель') 
  AND price > 5000;
```

### Оператор BETWEEN

```sql
-- Товары в ценовом диапазоне от 1000 до 10000
SELECT name, price FROM products 
WHERE price BETWEEN 1000 AND 10000;

-- Эквивалентно:
-- WHERE price >= 1000 AND price <= 10000
```

### Оператор IN

```sql
-- Товары из списка категорий
SELECT * FROM products 
WHERE category IN ('Электроника', 'Мебель', 'Одежда');

-- Эквивалентно:
-- WHERE category = 'Электроника' 
--    OR category = 'Мебель' 
--    OR category = 'Одежда'
```

### Оператор LIKE (поиск по шаблону)

| Символ | Значение |
|--------|----------|
| `%` | Любое количество любых символов |
| `_` | Один любой символ |

```sql
-- Имена, начинающиеся на 'a'
SELECT * FROM users WHERE username LIKE 'a%';

-- Email-адреса gmail.com
SELECT * FROM users WHERE email LIKE '%@gmail.com';

-- Имена из 5 символов
SELECT * FROM users WHERE username LIKE '_____';

-- ILIKE - регистронезависимый поиск (специфично для PostgreSQL)
SELECT * FROM products WHERE name ILIKE '%ноутбук%';
```

### Работа с NULL

```sql
-- Товары БЕЗ описания
SELECT * FROM products WHERE description IS NULL;

-- Товары С описанием
SELECT * FROM products WHERE description IS NOT NULL;
```

**Важно:** Нельзя писать `WHERE description = NULL`! Только `IS NULL` или `IS NOT NULL`.

---

## Сортировка и ограничение результатов

### ORDER BY — сортировка

```sql
-- Сортировка по возрасту (по возрастанию)
SELECT * FROM users ORDER BY age;

-- Сортировка по возрасту (по убыванию)
SELECT * FROM users ORDER BY age DESC;

-- Сортировка по нескольким столбцам
SELECT * FROM products 
ORDER BY category ASC, price DESC;
-- Сначала по категории (А-Я), потом по цене (дорогие первые)
```

**ASC** = ascending (по возрастанию) — по умолчанию  
**DESC** = descending (по убыванию)

### LIMIT — ограничение количества

```sql
-- Первые 5 пользователей
SELECT * FROM users LIMIT 5;

-- 3 самых дорогих товара
SELECT name, price FROM products 
ORDER BY price DESC 
LIMIT 3;

-- 5 самых новых пользователей
SELECT * FROM users 
ORDER BY created_at DESC 
LIMIT 5;
```

### OFFSET — пропуск записей

```sql
-- Пропустить первые 5, взять следующие 5 (записи 6-10)
SELECT * FROM users 
ORDER BY id 
LIMIT 5 OFFSET 5;
```

**Использование:** Пагинация (постраничная навигация)
- Страница 1: `LIMIT 10 OFFSET 0` (записи 1-10)
- Страница 2: `LIMIT 10 OFFSET 10` (записи 11-20)
- Страница 3: `LIMIT 10 OFFSET 20` (записи 21-30)

### DISTINCT — уникальные значения

```sql
-- Все уникальные категории товаров
SELECT DISTINCT category FROM products;

-- Результат (без дубликатов):
-- Электроника
-- Мебель
-- Одежда
```

---

## Практическое задание

### Задание 1: Создание базы данных магазина (обязательно)

1. Создайте новую базу данных `shop_db`:
   ```sql
   CREATE DATABASE shop_db;
   \c shop_db
   ```

2. Создайте таблицу `customers` (клиенты):
   ```sql
   CREATE TABLE customers (
       id SERIAL PRIMARY KEY,
       first_name VARCHAR(50) NOT NULL,
       last_name VARCHAR(50) NOT NULL,
       email VARCHAR(100) UNIQUE NOT NULL,
       phone VARCHAR(20),
       city VARCHAR(50),
       registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

3. Создайте таблицу `products` (товары):
   ```sql
   CREATE TABLE products (
       id SERIAL PRIMARY KEY,
       name VARCHAR(200) NOT NULL,
       description TEXT,
       price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
       stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
       category VARCHAR(50) NOT NULL,
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   ```

4. Проверьте структуру таблиц:
   ```sql
   \dt
   \d customers
   \d products
   ```

### Задание 2: Заполнение данными (обязательно)

1. Добавьте 5 клиентов:
   ```sql
   INSERT INTO customers (first_name, last_name, email, phone, city)
   VALUES 
       ('Иван', 'Петров', 'ivan.petrov@mail.ru', '+79001234567', 'Москва'),
       ('Мария', 'Сидорова', 'maria.sidorova@gmail.com', '+79002345678', 'Санкт-Петербург'),
       ('Алексей', 'Смирнов', 'alex.smirnov@yandex.ru', '+79003456789', 'Москва'),
       ('Елена', 'Кузнецова', 'elena.k@mail.ru', '+79004567890', 'Казань'),
       ('Дмитрий', 'Попов', 'dmitry.popov@gmail.com', NULL, 'Новосибирск');
   ```

2. Добавьте 10 товаров (разные категории):
   ```sql
   INSERT INTO products (name, description, price, stock_quantity, category)
   VALUES 
       ('iPhone 15 Pro', 'Смартфон Apple 256GB', 89990.00, 15, 'Электроника'),
       ('Samsung Galaxy S24', 'Смартфон Samsung 128GB', 69990.00, 20, 'Электроника'),
       ('Ноутбук ASUS', 'Ноутбук 15.6" Intel i5', 54990.00, 8, 'Электроника'),
       ('Наушники Sony', 'Беспроводные наушники с шумоподавлением', 24990.00, 30, 'Электроника'),
       ('Диван угловой', 'Диван серый велюр 280x180', 45000.00, 3, 'Мебель'),
       ('Стол письменный', 'Стол дуб 120x60', 15000.00, 10, 'Мебель'),
       ('Кресло офисное', 'Кресло эргономичное черное', 12000.00, 15, 'Мебель'),
       ('Футболка Nike', 'Футболка спортивная размер L', 2990.00, 50, 'Одежда'),
       ('Джинсы Levis', 'Джинсы мужские синие W32L34', 6990.00, 25, 'Одежда'),
       ('Кроссовки Adidas', 'Кроссовки для бега размер 42', 8990.00, 18, 'Одежда');
   ```

### Задание 3: Запросы SELECT (обязательно)

Напишите запросы для получения следующей информации:

1. Все товары:
   ```sql
   SELECT * FROM products;
   ```

2. Имена и email всех клиентов:
   ```sql
   SELECT first_name, last_name, email FROM customers;
   ```

3. Товары категории "Электроника":
   ```sql
   SELECT name, price FROM products WHERE category = 'Электроника';
   ```

4. Товары дешевле 20000 рублей:
   ```sql
   SELECT name, price FROM products WHERE price < 20000;
   ```

5. Клиенты из Москвы:
   ```sql
   SELECT first_name, last_name, city FROM customers WHERE city = 'Москва';
   ```

6. Товары в наличии (stock_quantity > 0):
   ```sql
   SELECT name, stock_quantity FROM products WHERE stock_quantity > 0;
   ```

7. 3 самых дорогих товара:
   ```sql
   SELECT name, price FROM products ORDER BY price DESC LIMIT 3;
   ```

8. Клиенты без указанного телефона:
   ```sql
   SELECT first_name, last_name FROM customers WHERE phone IS NULL;
   ```

9. Товары категорий "Мебель" или "Одежда":
   ```sql
   SELECT name, category, price FROM products 
   WHERE category IN ('Мебель', 'Одежда');
   ```

10. Товары от 5000 до 50000 рублей:
    ```sql
    SELECT name, price FROM products 
    WHERE price BETWEEN 5000 AND 50000;
    ```

### Задание 4: Сложные запросы (дополнительно)

1. Найдите товары, в названии которых есть слово "черный":
   ```sql
   SELECT name, price FROM products WHERE name ILIKE '%черный%';
   ```

2. Выведите все товары, отсортированные по категории (А-Я), а внутри категории — по цене (дешевые первые):
   ```sql
   SELECT category, name, price FROM products 
   ORDER BY category ASC, price ASC;
   ```

3. Найдите 5 самых дешевых товаров категории "Электроника":
   ```sql
   SELECT name, price FROM products 
   WHERE category = 'Электроника' 
   ORDER BY price ASC 
   LIMIT 5;
   ```

4. Выведите клиентов, зарегистрировавшихся сегодня:
   ```sql
   SELECT first_name, last_name, registered_at FROM customers 
   WHERE DATE(registered_at) = CURRENT_DATE;
   ```

5. Посчитайте общую стоимость всех товаров на складе:
   ```sql
   SELECT name, price, stock_quantity, 
          price * stock_quantity AS total_value 
   FROM products;
   ```

### Задание 5: Создание собственной таблицы (творческое)

Создайте свою таблицу на любую тему (например: книги, фильмы, рецепты, автомобили).

**Требования:**
- Минимум 5 столбцов
- Используйте разные типы данных (текст, числа, даты, логический)
- Добавьте ограничения (NOT NULL, UNIQUE, CHECK, DEFAULT)
- Заполните минимум 5 записями
- Напишите 3 интересных SELECT-запроса

**Пример (таблица книг):**
```sql
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100) NOT NULL,
    pages INTEGER CHECK (pages > 0),
    price DECIMAL(8, 2) CHECK (price > 0),
    isbn VARCHAR(20) UNIQUE,
    published_year INTEGER CHECK (published_year >= 1000 AND published_year <= 2024),
    is_available BOOLEAN DEFAULT TRUE,
    genre VARCHAR(50)
);

INSERT INTO books (title, author, pages, price, isbn, published_year, genre)
VALUES 
    ('Война и мир', 'Лев Толстой', 1274, 890.00, '978-5-17-123456-1', 1869, 'Роман'),
    ('Мастер и Маргарита', 'Михаил Булгаков', 480, 650.00, '978-5-17-123456-2', 1967, 'Роман'),
    ('Преступление и наказание', 'Фёдор Достоевский', 671, 720.00, '978-5-17-123456-3', 1866, 'Роман'),
    ('Евгений Онегин', 'Александр Пушкин', 224, 450.00, '978-5-17-123456-4', 1833, 'Поэма'),
    ('Горе от ума', 'Александр Грибоедов', 160, 380.00, '978-5-17-123456-5', 1825, 'Пьеса');

-- Запросы:
SELECT title, author FROM books WHERE pages > 500;
SELECT * FROM books WHERE published_year < 1900 ORDER BY published_year;
SELECT genre, COUNT(*) as count FROM books GROUP BY genre;
```

---

## Контрольные вопросы

Проверьте себя, ответив на эти вопросы:

1. Что означает SQL и для чего он нужен?
2. В чем разница между INTEGER и DECIMAL?
3. Когда использовать VARCHAR, а когда TEXT?
4. Какой тип данных всегда нужно использовать для денег?
5. Что такое SERIAL и зачем он нужен?
6. В чем разница между DATE и TIMESTAMP?
7. Что делает ограничение NOT NULL?
8. Как добавить несколько записей одним запросом INSERT?
9. Чем отличается = от LIKE?
10. Как получить только уникальные значения из столбца?
11. Что делает LIMIT и OFFSET?
12. Почему нельзя писать `WHERE age = NULL`?

<details>
<summary>Ответы</summary>

1. SQL — Structured Query Language, язык для работы с базами данных (создание таблиц, добавление, чтение, изменение, удаление данных).
2. INTEGER — целые числа, DECIMAL — точные десятичные числа (для денег).
3. VARCHAR — когда знаем примерную длину (email, имя), TEXT — для текста неопределенной длины (статьи, описания).
4. DECIMAL или NUMERIC — они дают точные значения без ошибок округления.
5. SERIAL — автоматически увеличивающееся целое число, используется для ID.
6. DATE — только дата (2024-01-15), TIMESTAMP — дата и время (2024-01-15 14:30:00).
7. NOT NULL означает, что поле обязательно должно быть заполнено.
8. Перечислить несколько наборов значений через запятую после VALUES.
9. = проверяет точное совпадение, LIKE ищет по шаблону с % и _.
10. Использовать SELECT DISTINCT.
11. LIMIT ограничивает количество записей, OFFSET пропускает первые N записей.
12. NULL — это отсутствие значения, нельзя сравнивать с ним через =, нужно использовать IS NULL.
</details>

---

## Типичные ошибки и их решения

### Ошибка: "column does not exist"

```sql
-- ОШИБКА:
SELECT name, prise FROM products;
-- ERROR: column "prise" does not exist

-- ПРАВИЛЬНО:
SELECT name, price FROM products;
```

**Причина:** Опечатка в названии столбца.

### Ошибка: "syntax error at or near"

```sql
-- ОШИБКА (забыли запятую):
SELECT name price FROM products;

-- ПРАВИЛЬНО:
SELECT name, price FROM products;
```

### Ошибка: "value too long for type character varying(50)"

```sql
-- ОШИБКА:
INSERT INTO users (username) 
VALUES ('очень_очень_очень_длинное_имя_которое_не_помещается_в_50_символов');

-- РЕШЕНИЕ: увеличить размер VARCHAR или сократить значение
```

### Ошибка: CHECK constraint violated

```sql
-- ОШИБКА:
INSERT INTO products (name, price) VALUES ('Товар', -100);
-- ERROR: new row violates check constraint "products_price_check"

-- ПРИЧИНА: price CHECK (price > 0), а мы пытаемся вставить отрицательное число
```

### Ошибка: NULL value in column violates not-null constraint

```sql
-- ОШИБКА:
INSERT INTO products (name) VALUES ('Товар');
-- ERROR: null value in column "price" violates not-null constraint

-- ПРИЧИНА: столбец price имеет NOT NULL, но мы не указали значение
-- РЕШЕНИЕ: указать цену
INSERT INTO products (name, price) VALUES ('Товар', 100);
```

---

## Шпаргалка по типам данных

```sql
-- ЧИСЛА
age INTEGER                    -- Целое: 25
price DECIMAL(10, 2)          -- Десятичное: 1234.56
count BIGINT                  -- Большое целое
id SERIAL PRIMARY KEY         -- Автоинкремент

-- ТЕКСТ
name VARCHAR(100)             -- До 100 символов
description TEXT              -- Неограниченный текст
code CHAR(5)                  -- Ровно 5 символов

-- ДАТА И ВРЕМЯ
birth_date DATE               -- Дата: 1990-05-15
start_time TIME               -- Время: 14:30:00
created_at TIMESTAMP          -- Дата и время
updated_at TIMESTAMPTZ        -- С часовым поясом

-- ЛОГИЧЕСКИЙ
is_active BOOLEAN             -- TRUE/FALSE

-- СПЕЦИАЛЬНЫЕ
settings JSONB                -- JSON данные
tags TEXT[]                   -- Массив
id UUID                       -- Уникальный ID
```

---

## Шпаргалка по командам

```sql
-- СОЗДАНИЕ ТАБЛИЦЫ
CREATE TABLE table_name (
    id SERIAL PRIMARY KEY,
    column1 TYPE constraints,
    column2 TYPE constraints
);

-- ПРОСМОТР СТРУКТУРЫ (psql)
\d table_name

-- ДОБАВЛЕНИЕ ДАННЫХ
INSERT INTO table_name (col1, col2) VALUES (val1, val2);
INSERT INTO table_name (col1, col2) VALUES 
    (val1, val2),
    (val3, val4);

-- ЧТЕНИЕ ДАННЫХ
SELECT * FROM table_name;
SELECT col1, col2 FROM table_name;
SELECT * FROM table_name WHERE condition;
SELECT * FROM table_name ORDER BY col1 DESC;
SELECT * FROM table_name LIMIT 10;

-- ФИЛЬТРАЦИЯ
WHERE col = value
WHERE col > 100
WHERE col BETWEEN 10 AND 100
WHERE col IN ('value1', 'value2')
WHERE col LIKE '%pattern%'
WHERE col IS NULL
WHERE col IS NOT NULL
WHERE condition1 AND condition2
WHERE condition1 OR condition2

-- УДАЛЕНИЕ ТАБЛИЦЫ
DROP TABLE table_name;
DROP TABLE IF EXISTS table_name;
```

---

## Полезные ресурсы

**Документация PostgreSQL:**
- Типы данных: https://www.postgresql.org/docs/current/datatype.html
- SQL команды: https://www.postgresql.org/docs/current/sql-commands.html

**Практика SQL:**
- HackerRank SQL: https://www.hackerrank.com/domains/sql

**Инструменты для тестирования:**
- DB Fiddle: https://www.db-fiddle.com/ (онлайн PostgreSQL)
- SQL Fiddle: http://sqlfiddle.com/
