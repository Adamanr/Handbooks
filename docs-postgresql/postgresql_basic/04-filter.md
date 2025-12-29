---
sidebar_position: 4
description: "В этой главе изучим фильтрацию и поиск данных в PostgreSQL"
---

# Фильтрация и поиск

## Логические операторы — строим сложные условия

### Базовые логические операторы

PostgreSQL поддерживает три основных логических оператора:
- **AND** — все условия должны быть истинны
- **OR** — хотя бы одно условие истинно
- **NOT** — инверсия условия

### Оператор AND — все условия истинны

```sql
-- Создадим тестовую таблицу
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    price DECIMAL(10, 2),
    stock_quantity INTEGER,
    rating DECIMAL(2, 1),
    is_available BOOLEAN DEFAULT TRUE
);

-- Добавим тестовые данные
INSERT INTO products (name, category, price, stock_quantity, rating, is_available)
VALUES 
    ('iPhone 15 Pro', 'Электроника', 89990.00, 15, 4.8, TRUE),
    ('Samsung Galaxy S24', 'Электроника', 69990.00, 20, 4.7, TRUE),
    ('MacBook Pro', 'Электроника', 199990.00, 5, 4.9, TRUE),
    ('Диван угловой', 'Мебель', 45000.00, 3, 4.5, TRUE),
    ('Стол письменный', 'Мебель', 15000.00, 10, 4.2, TRUE),
    ('Футболка Nike', 'Одежда', 2990.00, 50, 4.0, TRUE),
    ('Джинсы Levis', 'Одежда', 6990.00, 25, 4.3, TRUE),
    ('Кроссовки Adidas', 'Одежда', 8990.00, 0, 4.4, FALSE),
    ('Наушники Sony', 'Электроника', 24990.00, 30, 4.6, TRUE),
    ('Кресло офисное', 'Мебель', 12000.00, 15, 4.1, TRUE);
```

**Примеры с AND:**

```sql
-- Электроника дешевле 50000
SELECT name, category, price 
FROM products
WHERE category = 'Электроника' AND price < 50000;
```

**Результат:**
```
       name        |  category   |  price   
-------------------+-------------+----------
 Samsung Galaxy S24| Электроника | 69990.00
 Наушники Sony     | Электроника | 24990.00
```

```sql
-- Товары в наличии с рейтингом выше 4.5
SELECT name, rating, stock_quantity
FROM products
WHERE is_available = TRUE 
  AND rating > 4.5 
  AND stock_quantity > 0;
```

```sql
-- Три условия: категория, цена, наличие
SELECT name, category, price, stock_quantity
FROM products
WHERE category IN ('Электроника', 'Одежда')
  AND price BETWEEN 5000 AND 30000
  AND stock_quantity > 10;
```

### Оператор OR — хотя бы одно условие истинно

```sql
-- Дешевые ИЛИ дорогие товары (без средней ценовой категории)
SELECT name, price
FROM products
WHERE price < 10000 OR price > 50000
ORDER BY price;
```

```sql
-- Товары категории "Мебель" ИЛИ с низким рейтингом
SELECT name, category, rating
FROM products
WHERE category = 'Мебель' OR rating < 4.3;
```

```sql
-- Товары не в наличии ИЛИ заканчивающиеся (< 5 штук)
SELECT name, stock_quantity, is_available
FROM products
WHERE is_available = FALSE OR stock_quantity < 5
ORDER BY stock_quantity;
```

### Оператор NOT — инверсия условия

```sql
-- Все товары КРОМЕ электроники
SELECT name, category
FROM products
WHERE NOT category = 'Электроника';

-- Эквивалентно:
SELECT name, category
FROM products
WHERE category != 'Электроника';
-- или
WHERE category <> 'Электроника';
```

```sql
-- Товары НЕ из списка категорий
SELECT name, category
FROM products
WHERE NOT category IN ('Электроника', 'Одежда');
```

```sql
-- Неактивные товары
SELECT name, is_available
FROM products
WHERE NOT is_available;

-- Эквивалентно:
WHERE is_available = FALSE;
```

### Комбинирование операторов со скобками

**Важно:** Скобки определяют порядок выполнения условий!

```sql
-- БЕЗ скобок (неправильная логика):
SELECT name, category, price
FROM products
WHERE category = 'Электроника' 
   OR category = 'Одежда' 
  AND price < 10000;
-- AND выполняется первым! Получим ВСЮ электронику + дешевую одежду

-- СО скобками (правильная логика):
SELECT name, category, price
FROM products
WHERE (category = 'Электроника' OR category = 'Одежда')
  AND price < 10000;
-- Сначала выберем нужные категории, ПОТОМ отфильтруем по цене
```

**Сложный пример:**

```sql
-- Найти:
-- 1. Электронику дороже 50000
-- 2. ИЛИ мебель в наличии с рейтингом > 4.0
-- 3. НО исключить товары, которых нет на складе

SELECT name, category, price, rating, stock_quantity
FROM products
WHERE (
    (category = 'Электроника' AND price > 50000)
    OR
    (category = 'Мебель' AND is_available = TRUE AND rating > 4.0)
  )
  AND stock_quantity > 0
ORDER BY category, price DESC;
```

### Таблица истинности

Понимание логики:

```
AND:
TRUE  AND TRUE  = TRUE
TRUE  AND FALSE = FALSE
FALSE AND FALSE = FALSE

OR:
TRUE  OR TRUE  = TRUE
TRUE  OR FALSE = TRUE
FALSE OR FALSE = FALSE

NOT:
NOT TRUE  = FALSE
NOT FALSE = TRUE
```

---

## Поиск текста с LIKE и ILIKE

### Оператор LIKE — поиск по шаблону

**Специальные символы:**
- `%` — любое количество любых символов (включая ноль)
- `_` — ровно один любой символ

### Примеры с %

```sql
-- Создадим таблицу пользователей для примеров
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100),
    full_name VARCHAR(100)
);

INSERT INTO users (username, email, full_name)
VALUES 
    ('alice123', 'alice@gmail.com', 'Alice Johnson'),
    ('bob_smith', 'bob.smith@yahoo.com', 'Bob Smith'),
    ('charlie', 'charlie@gmail.com', 'Charlie Brown'),
    ('diana_w', 'diana@company.com', 'Diana Williams'),
    ('eve_adams', 'eve.adams@gmail.com', 'Eve Adams');
```

**Начинается с:**

```sql
-- Имена, начинающиеся с "alice"
SELECT username, full_name
FROM users
WHERE username LIKE 'alice%';
-- Результат: alice123
```

**Заканчивается на:**

```sql
-- Email на gmail.com
SELECT username, email
FROM users
WHERE email LIKE '%@gmail.com';
-- Результат: alice, charlie, eve_adams
```

**Содержит подстроку:**

```sql
-- Имена, содержащие "smith"
SELECT username, full_name
FROM users
WHERE full_name LIKE '%Smith%';
-- Результат: bob_smith (Bob Smith)
```

**Комбинации:**

```sql
-- Username содержит подчеркивание и начинается с буквы
SELECT username
FROM users
WHERE username LIKE '__%_%';
-- Результат: bob_smith, diana_w, eve_adams
```

### Примеры с _ (один символ)

```sql
-- Username из ровно 5 символов
SELECT username
FROM users
WHERE username LIKE '_____';
-- _____ = 5 символов подчеркивания
```

```sql
-- Email формата x@x.xx (короткий домен)
SELECT email
FROM users
WHERE email LIKE '%@_.%';
```

### ILIKE — регистронезависимый поиск

**LIKE чувствителен к регистру, ILIKE — нет!**

```sql
-- LIKE (чувствителен к регистру)
SELECT full_name
FROM users
WHERE full_name LIKE '%smith%';
-- Результат: пусто (нет "smith" с маленькой буквы)

-- ILIKE (НЕ чувствителен к регистру)
SELECT full_name
FROM users
WHERE full_name ILIKE '%smith%';
-- Результат: Bob Smith (нашёл "Smith")
```

```sql
-- Поиск пользователей с именем Alice/alice/ALICE
SELECT username, full_name
FROM users
WHERE full_name ILIKE 'alice%';
-- Найдёт: Alice, alice, ALICE, aLiCe и т.д.
```

### Экранирование специальных символов

Что если нужно найти символы `%` или `_` в тексте?

```sql
-- Создадим таблицу с примерами
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(100)
);

INSERT INTO documents (filename)
VALUES 
    ('report_2024.pdf'),
    ('data_analysis_v1.xlsx'),
    ('100%_complete.txt'),
    ('file_1.doc'),
    ('file_2.doc');
```

**Поиск символа подчеркивания:**

```sql
-- НЕПРАВИЛЬНО (найдёт все файлы с любым символом между "file" и "1"):
SELECT filename
FROM documents
WHERE filename LIKE 'file_1%';

-- ПРАВИЛЬНО (экранируем подчеркивание):
SELECT filename
FROM documents
WHERE filename LIKE 'file\_1%' ESCAPE '\';
-- Результат: file_1.doc
```

**Поиск символа процента:**

```sql
-- Файлы, содержащие символ %
SELECT filename
FROM documents
WHERE filename LIKE '%\%%' ESCAPE '\';
-- Результат: 100%_complete.txt
```

### Практические примеры поиска

**Поиск телефонных номеров:**

```sql
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(20)
);

INSERT INTO contacts (name, phone)
VALUES 
    ('Иван Петров', '+7 900 123-45-67'),
    ('Мария Сидорова', '+7 901 234-56-78'),
    ('Алексей Смирнов', '8 (902) 345-67-89'),
    ('Елена Кузнецова', '+7 903 456-78-90');

-- Найти московские номера (+7 900, +7 901, +7 902, +7 903)
SELECT name, phone
FROM contacts
WHERE phone LIKE '+7 90%';

-- Найти номера в формате с скобками
SELECT name, phone
FROM contacts
WHERE phone LIKE '%(%';
```

**Поиск по артикулам:**

```sql
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(20),
    product_name VARCHAR(100)
);

INSERT INTO inventory (sku, product_name)
VALUES 
    ('ELC-2024-001', 'Ноутбук'),
    ('ELC-2024-002', 'Телефон'),
    ('FUR-2024-001', 'Стол'),
    ('FUR-2024-002', 'Стул'),
    ('CLO-2024-001', 'Футболка');

-- Все товары электроники (ELC) 2024 года
SELECT sku, product_name
FROM inventory
WHERE sku LIKE 'ELC-2024-%';

-- Все товары с номером 001 в любой категории
SELECT sku, product_name
FROM inventory
WHERE sku LIKE '%-001';
```

---

## Регулярные выражения

### Что такое регулярные выражения?

**Регулярные выражения (regex)** — это мощный инструмент для сложного поиска по шаблонам.

PostgreSQL поддерживает regex через операторы:
- `~` — соответствует regex (чувствителен к регистру)
- `~*` — соответствует regex (НЕ чувствителен к регистру)
- `!~` — НЕ соответствует regex (чувствителен к регистру)
- `!~*` — НЕ соответствует regex (НЕ чувствителен к регистру)

### Базовые паттерны regex

**Символы:**
- `.` — любой символ
- `^` — начало строки
- `$` — конец строки
- `*` — 0 или более повторений
- `+` — 1 или более повторений
- `?` — 0 или 1 повторение
- `[abc]` — любой из символов a, b, c
- `[^abc]` — любой символ КРОМЕ a, b, c
- `[0-9]` — любая цифра
- `[a-z]` — любая строчная буква
- `\d` — цифра (эквивалент [0-9])
- `\w` — буква, цифра или подчеркивание
- `\s` — пробельный символ

### Простые примеры regex

```sql
-- Создадим таблицу для примеров
CREATE TABLE test_data (
    id SERIAL PRIMARY KEY,
    text_value VARCHAR(100)
);

INSERT INTO test_data (text_value)
VALUES 
    ('abc123'),
    ('test@example.com'),
    ('Hello World'),
    ('Price: $99.99'),
    ('Phone: +7-900-123-45-67'),
    ('192.168.1.1'),
    ('ABC123XYZ');
```

**Начинается с цифры:**

```sql
SELECT text_value
FROM test_data
WHERE text_value ~ '^[0-9]';
-- Результат: 192.168.1.1
```

**Содержит email (простая проверка):**

```sql
SELECT text_value
FROM test_data
WHERE text_value ~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
-- Результат: test@example.com
```

**Содержит хотя бы одну цифру:**

```sql
SELECT text_value
FROM test_data
WHERE text_value ~ '[0-9]';
-- Результат: abc123, test@example.com, Price: $99.99, и т.д.
```

**Только буквы (без цифр и символов):**

```sql
SELECT text_value
FROM test_data
WHERE text_value ~ '^[a-zA-Z\s]+$';
-- Результат: Hello World
```

### Практические примеры regex

**Валидация email:**

```sql
CREATE TABLE user_emails (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100)
);

INSERT INTO user_emails (email)
VALUES 
    ('valid@example.com'),
    ('also.valid@test.co.uk'),
    ('invalid@'),
    ('no-at-sign.com'),
    ('spaces in@email.com');

-- Найти валидные email
SELECT email
FROM user_emails
WHERE email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
-- Результат: valid@example.com, also.valid@test.co.uk
```

**Валидация телефонных номеров:**

```sql
CREATE TABLE phone_numbers (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(30)
);

INSERT INTO phone_numbers (phone)
VALUES 
    ('+7-900-123-45-67'),
    ('+7 900 123 45 67'),
    ('8 (900) 123-45-67'),
    ('+79001234567'),
    ('invalid phone'),
    ('123');

-- Российские номера в формате +7... или 8...
SELECT phone
FROM phone_numbers
WHERE phone ~ '^(\+7|8)[\d\s\-\(\)]{10,}$';
```

**Поиск IP-адресов:**

```sql
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    log_message TEXT
);

INSERT INTO logs (log_message)
VALUES 
    ('Connection from 192.168.1.1'),
    ('User logged in from 10.0.0.5'),
    ('Invalid IP: 999.999.999.999'),
    ('Server started on localhost'),
    ('Request from 172.16.0.100');

-- Найти записи с валидными IP-адресами
SELECT log_message
FROM logs
WHERE log_message ~ '\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}';
```

**Извлечение цифр из текста:**

```sql
CREATE TABLE products_text (
    id SERIAL PRIMARY KEY,
    description TEXT
);

INSERT INTO products_text (description)
VALUES 
    ('Цена: 1500 рублей'),
    ('Скидка 20% на товар'),
    ('В наличии 100 штук'),
    ('Артикул: ABC-123-XYZ');

-- Найти описания с ценой (число + "рублей")
SELECT description
FROM products_text
WHERE description ~* '\d+\s*рубл';
-- ~* = регистронезависимый поиск
```

### Функции для работы с regex

**REGEXP_MATCH — извлечь первое совпадение:**

```sql
SELECT 
    description,
    (REGEXP_MATCH(description, '\d+'))[1] AS extracted_number
FROM products_text;
```

**REGEXP_MATCHES — извлечь все совпадения:**

```sql
SELECT 
    description,
    REGEXP_MATCHES(description, '\d+', 'g') AS all_numbers
FROM products_text;
-- 'g' = глобальный поиск (все вхождения)
```

**REGEXP_REPLACE — заменить по паттерну:**

```sql
-- Заменить все цифры на "X"
SELECT 
    description,
    REGEXP_REPLACE(description, '\d', 'X', 'g') AS masked
FROM products_text;
```

---

## Работа с диапазонами и списками

### BETWEEN — диапазон значений

**Синтаксис:**
```sql
WHERE column BETWEEN min_value AND max_value
```

**Важно:** BETWEEN включает границы (min и max)!

**Числовые диапазоны:**

```sql
-- Товары от 10000 до 50000 рублей (включительно)
SELECT name, price
FROM products
WHERE price BETWEEN 10000 AND 50000
ORDER BY price;

-- Эквивалентно:
WHERE price >= 10000 AND price <= 50000
```

**Диапазоны дат:**

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100),
    order_date DATE,
    total DECIMAL(10, 2)
);

INSERT INTO orders (customer_name, order_date, total)
VALUES 
    ('Иван', '2024-01-15', 5000),
    ('Мария', '2024-02-10', 3000),
    ('Алексей', '2024-03-05', 7000),
    ('Елена', '2024-03-20', 4500);

-- Заказы за февраль-март 2024
SELECT customer_name, order_date, total
FROM orders
WHERE order_date BETWEEN '2024-02-01' AND '2024-03-31'
ORDER BY order_date;
```

**НЕ в диапазоне:**

```sql
-- Товары дешевле 5000 или дороже 100000
SELECT name, price
FROM products
WHERE price NOT BETWEEN 5000 AND 100000
ORDER BY price;

-- Эквивалентно:
WHERE price < 5000 OR price > 100000
```

### IN — список значений

**Синтаксис:**
```sql
WHERE column IN (value1, value2, value3)
```

**Примеры с IN:**

```sql
-- Товары из определённых категорий
SELECT name, category, price
FROM products
WHERE category IN ('Электроника', 'Мебель')
ORDER BY category, price;

-- Эквивалентно:
WHERE category = 'Электроника' OR category = 'Мебель'
```

```sql
-- Конкретные ID
SELECT name, price
FROM products
WHERE id IN (1, 3, 5, 7)
ORDER BY id;
```

**NOT IN — исключить значения:**

```sql
-- Все товары КРОМЕ электроники и одежды
SELECT name, category
FROM products
WHERE category NOT IN ('Электроника', 'Одежда');

-- Эквивалентно:
WHERE category != 'Электроника' AND category != 'Одежда'
```

**IN с подзапросом:**

```sql
-- Найти товары тех же категорий, что у топовых товаров (рейтинг > 4.7)
SELECT name, category, rating
FROM products
WHERE category IN (
    SELECT DISTINCT category 
    FROM products 
    WHERE rating > 4.7
);
```

### Комбинирование BETWEEN и IN

```sql
-- Электроника или мебель в ценовом диапазоне 10000-50000
SELECT name, category, price
FROM products
WHERE category IN ('Электроника', 'Мебель')
  AND price BETWEEN 10000 AND 50000
ORDER BY category, price;
```

---

## Работа с NULL

### Что такое NULL?

**NULL** — это отсутствие значения (НЕ ноль, НЕ пустая строка!).

```
NULL = неизвестно
NULL ≠ 0
NULL ≠ ''
NULL ≠ FALSE
```

### Проверка на NULL

**Только IS NULL и IS NOT NULL!**

```sql
-- Создадим таблицу с NULL значениями
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    salary DECIMAL(10, 2)
);

INSERT INTO employees (name, email, phone, salary)
VALUES 
    ('Иван', 'ivan@example.com', '+79001111111', 50000),
    ('Мария', 'maria@example.com', NULL, 60000),
    ('Алексей', NULL, '+79003333333', 55000),
    ('Елена', NULL, NULL, NULL);
```

**Найти записи без email:**

```sql
-- ❌ НЕПРАВИЛЬНО (не работает!):
SELECT name FROM employees WHERE email = NULL;

-- ✅ ПРАВИЛЬНО:
SELECT name FROM employees WHERE email IS NULL;
-- Результат: Алексей, Елена
```

**Найти записи с email:**

```sql
SELECT name, email
FROM employees
WHERE email IS NOT NULL;
-- Результат: Иван, Мария
```

### NULL в арифметике

**Любая операция с NULL даёт NULL:**

```sql
SELECT 
    name,
    salary,
    salary * 1.1 AS salary_with_bonus
FROM employees;

-- Для Елены (salary = NULL):
-- NULL * 1.1 = NULL
```

### COALESCE — замена NULL

**COALESCE** возвращает первое НЕ-NULL значение из списка:

```sql
-- Заменить NULL на значение по умолчанию
SELECT 
    name,
    COALESCE(email, 'Email не указан') AS email,
    COALESCE(phone, 'Телефон не указан') AS phone,
    COALESCE(salary, 0) AS salary
FROM employees;
```

**Результат:**
```
  name   |       email         |      phone          | salary
---------+---------------------+---------------------+--------
 Иван    | ivan@example.com    | +79001111111        | 50000
 Мария   | maria@example.com   | Телефон не указан   | 60000
 Алексей | Email не указан     | +79003333333        | 55000
 Елена   | Email не указан     | Телефон не указан   | 0
```

**COALESCE с вычислениями:**

```sql
-- Рассчитать бонус (10% от зарплаты), для NULL использовать 0
SELECT 
    name,
    salary,
    COALESCE(salary, 0) * 0.1 AS bonus
FROM employees;
```

### NULLIF — превратить значение в NULL

**NULLIF** возвращает NULL, если два значения равны:

```sql
-- Превратить пустые строки в NULL
SELECT 
    name,
    NULLIF(email, '') AS email
FROM employees;

-- Избежать деления на ноль
SELECT 
    10.0 / NULLIF(stock_quantity, 0) AS price_per_item
FROM products;
-- Если stock_quantity = 0, результат будет NULL вместо ошибки
```

### NULL в логических операциях

```sql
-- NULL в условиях даёт неожиданные результаты

-- Найти сотрудников с зарплатой выше 55000
SELECT name, salary
FROM employees
WHERE salary > 55000;
-- Елена (NULL) НЕ попадёт в результат!

-- Найти сотрудников с зарплатой НЕ выше 55000
SELECT name, salary
FROM employees
WHERE NOT salary > 55000;
-- Елена (NULL) тоже НЕ попадёт!
```

**Правильная обработка NULL:**

```sql
-- Включить сотрудников с неизвестной зарплатой
SELECT name, salary
FROM employees
WHERE salary > 55000 OR salary IS NULL;
```

---

## Сортировка и NULL

### Поведение NULL при сортировке

В PostgreSQL NULL считается "больше" всех значений:

```sql
-- По умолчанию NULL в конце при ASC
SELECT name, salary
FROM employees
ORDER BY salary ASC;
```

**Результат:**
```
  name   | salary
---------+--------
 Иван    | 50000
 Алексей | 55000
 Мария   | 60000
 Елена   | NULL      <- в конце
```

```sql
-- NULL в начале при DESC
SELECT name, salary
FROM employees
ORDER BY salary DESC;
```

**Результат:**
```
  name   | salary
---------+--------
 Елена   | NULL      <- в начале
 Мария   | 60000
 Алексей | 55000
 Иван    | 50000
```

### NULLS FIRST и NULLS LAST

Явно указать позицию NULL:

```sql
-- NULL в начале при сортировке по возрастанию
SELECT name, salary
FROM employees
ORDER BY salary ASC NULLS FIRST;
```

```sql
-- NULL в конце при сортировке по убыванию
SELECT name, salary
FROM employees
ORDER BY salary DESC NULLS LAST;
```

### Сортировка с обработкой NULL

```sql
-- Сортировать по зарплате, NULL считать как 0
SELECT name, salary
FROM employees
ORDER BY COALESCE(salary, 0) DESC;
```

---

## Оптимизация поиска

### Проблемы производительности

```sql
-- МЕДЛЕННО для больших таблиц:
SELECT * FROM products WHERE name LIKE '%phone%';
-- Не может использовать индекс!

-- БЫСТРО:
SELECT * FROM products WHERE name LIKE 'phone%';
-- Может использовать индекс
```

### Создание индексов для поиска

**Обычный B-tree индекс:**

```sql
-- Для точного поиска и поиска по началу строки
CREATE INDEX idx_products_name ON products(name);

-- Теперь быстро работает:
SELECT * FROM products WHERE name = 'iPhone 15 Pro';
SELECT * FROM products WHERE name LIKE 'iPhone%';
```

**GIN индекс для полнотекстового поиска:**

```sql
-- Для поиска подстрок в любом месте
CREATE INDEX idx_products_name_gin ON products USING gin(name gin_trgm_ops);

-- Сначала нужно подключить расширение
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Теперь быстро работает даже:
SELECT * FROM products WHERE name ILIKE '%phone%';
```

### EXPLAIN — анализ производительности

```sql
-- Посмотреть план выполнения запроса
EXPLAIN SELECT * FROM products WHERE name LIKE '%phone%';

-- Более подробная информация с реальным временем выполнения
EXPLAIN ANALYZE SELECT * FROM products WHERE name LIKE '%phone%';
```

**Пример вывода:**
```
Seq Scan on products  (cost=0.00..15.00 rows=1 width=100) (actual time=0.020..0.045 rows=2 loops=1)
  Filter: (name ~~ '%phone%'::text)
Planning Time: 0.123 ms
Execution Time: 0.067 ms
```

### Лучшие практики поиска

**1. Избегайте LIKE с % в начале:**

```sql
-- ❌ МЕДЛЕННО:
WHERE name LIKE '%phone%'

-- ✅ БЫСТРО (если возможно):
WHERE name LIKE 'phone%'
```

**2. Используйте полнотекстовый поиск для сложных случаев:**

```sql
-- Создать полнотекстовый индекс
ALTER TABLE products ADD COLUMN name_tsv tsvector;
UPDATE products SET name_tsv = to_tsvector('russian', name);
CREATE INDEX idx_products_name_tsv ON products USING gin(name_tsv);

-- Быстрый полнотекстовый поиск
SELECT * FROM products 
WHERE name_tsv @@ to_tsquery('russian', 'телефон');
```

**3. Используйте LIMIT для больших результатов:**

```sql
-- Вместо загрузки всех результатов:
SELECT * FROM products WHERE category = 'Электроника'
LIMIT 20;  -- Взять только первые 20
```

**4. Фильтруйте по индексированным колонкам:**

```sql
-- Если есть индекс на category:
-- БЫСТРО:
WHERE category = 'Электроника' AND name LIKE '%phone%'

-- Лучше сначала фильтровать по индексированному полю
```

---

## Практическое задание

### Задание 1: Поисковая система товаров (обязательно)

Создайте базу данных интернет-магазина с продвинутым поиском.

**Шаг 1: Создание структуры**

```sql
CREATE DATABASE search_practice;
\c search_practice

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    brand VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL,
    discount_percent INTEGER DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
    stock_quantity INTEGER DEFAULT 0,
    rating DECIMAL(2, 1) CHECK (rating BETWEEN 0 AND 5),
    tags TEXT[],  -- Массив тегов
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Добавить расширение для поиска
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

**Шаг 2: Заполнение тестовыми данными**

```sql
INSERT INTO products (name, description, category, brand, price, discount_percent, stock_quantity, rating, tags, is_active)
VALUES 
    ('iPhone 15 Pro 256GB', 'Смартфон Apple с тройной камерой и процессором A17 Pro', 'Смартфоны', 'Apple', 89990.00, 5, 25, 4.8, ARRAY['смартфон', 'apple', 'ios', '5g'], TRUE),
    ('Samsung Galaxy S24 Ultra', 'Флагманский смартфон с S Pen и камерой 200MP', 'Смартфоны', 'Samsung', 99990.00, 10, 15, 4.7, ARRAY['смартфон', 'android', 'samsung'], TRUE),
    ('MacBook Pro 14 M3', 'Ноутбук Apple для профессионалов', 'Ноутбуки', 'Apple', 199990.00, 0, 8, 4.9, ARRAY['ноутбук', 'apple', 'macbook'], TRUE),
    ('Dell XPS 15', 'Мощный ноутбук с процессором Intel Core i7', 'Ноутбуки', 'Dell', 149990.00, 15, 12, 4.6, ARRAY['ноутбук', 'windows', 'intel'], TRUE),
    ('AirPods Pro 2', 'Беспроводные наушники с активным шумоподавлением', 'Аксессуары', 'Apple', 24990.00, 0, 50, 4.7, ARRAY['наушники', 'apple', 'bluetooth'], TRUE),
    ('Sony WH-1000XM5', 'Премиальные накладные наушники', 'Аксессуары', 'Sony', 32990.00, 20, 30, 4.8, ARRAY['наушники', 'sony', 'шумоподавление'], TRUE),
    ('iPad Air M2', 'Планшет Apple с поддержкой Apple Pencil', 'Планшеты', 'Apple', 64990.00, 5, 20, 4.6, ARRAY['планшет', 'apple', 'ipad'], TRUE),
    ('Samsung Galaxy Tab S9', 'Android планшет премиум класса', 'Планшеты', 'Samsung', 54990.00, 10, 18, 4.5, ARRAY['планшет', 'android', 'samsung'], TRUE),
    ('Apple Watch Series 9', 'Умные часы с функциями здоровья', 'Умные часы', 'Apple', 39990.00, 0, 35, 4.7, ARRAY['часы', 'apple', 'фитнес'], TRUE),
    ('Logitech MX Master 3S', 'Беспроводная мышь для профессионалов', 'Аксессуары', 'Logitech', 9990.00, 15, 45, 4.8, ARRAY['мышь', 'logitech', 'беспроводная'], TRUE),
    ('iPhone 14 128GB', 'Прошлогодняя модель со скидкой', 'Смартфоны', 'Apple', 69990.00, 25, 10, 4.6, ARRAY['смартфон', 'apple', 'ios'], TRUE),
    ('Xiaomi Redmi Note 13', 'Бюджетный смартфон с хорошей камерой', 'Смартфоны', 'Xiaomi', 19990.00, 10, 60, 4.3, ARRAY['смартфон', 'android', 'xiaomi', 'бюджетный'], TRUE),
    ('JBL Flip 6', 'Портативная Bluetooth колонка', 'Аксессуары', 'JBL', 11990.00, 0, 40, 4.5, ARRAY['колонка', 'jbl', 'bluetooth', 'портативная'], TRUE),
    ('Kindle Paperwhite', 'Электронная книга с подсветкой', 'Электронные книги', 'Amazon', 12990.00, 10, 25, 4.7, ARRAY['kindle', 'amazon', 'книга'], TRUE),
    ('GoPro HERO 12', 'Экшн-камера для экстремалов', 'Камеры', 'GoPro', 44990.00, 15, 15, 4.6, ARRAY['камера', 'gopro', 'экшн'], TRUE);
```

**Шаг 3: Задания по поиску**

Напишите запросы для следующих сценариев:

1. **Найти все товары Apple:**
```sql
SELECT name, brand, price
FROM products
WHERE brand = 'Apple'
ORDER BY price DESC;
```

2. **Найти товары со скидкой больше 10%:**
```sql
SELECT 
    name, 
    price, 
    discount_percent,
    price * (1 - discount_percent / 100.0) AS discounted_price
FROM products
WHERE discount_percent > 10
ORDER BY discount_percent DESC;
```

3. **Найти товары в ценовом диапазоне 20000-60000:**
```sql
SELECT name, category, price
FROM products
WHERE price BETWEEN 20000 AND 60000
ORDER BY price;
```

4. **Найти все товары категорий "Смартфоны" или "Планшеты":**
```sql
SELECT name, category, brand, price
FROM products
WHERE category IN ('Смартфоны', 'Планшеты')
ORDER BY category, price DESC;
```

5. **Найти товары, в названии которых есть слово "Pro" (регистронезависимо):**
```sql
SELECT name, brand, price
FROM products
WHERE name ILIKE '%Pro%'
ORDER BY price DESC;
```

6. **Найти товары с рейтингом 4.7 и выше:**
```sql
SELECT name, rating, brand
FROM products
WHERE rating >= 4.7
ORDER BY rating DESC, name;
```

7. **Найти все товары Apple КРОМЕ iPhone:**
```sql
SELECT name, category, price
FROM products
WHERE brand = 'Apple' 
  AND name NOT ILIKE '%iPhone%'
ORDER BY price DESC;
```

8. **Найти товары без скидки И в наличии больше 20 штук:**
```sql
SELECT name, stock_quantity, price
FROM products
WHERE discount_percent = 0 
  AND stock_quantity > 20
ORDER BY stock_quantity DESC;
```

9. **Найти товары с описанием, содержащим "процессор" или "камера":**
```sql
SELECT name, description
FROM products
WHERE description ILIKE '%процессор%' 
   OR description ILIKE '%камера%';
```

10. **Найти неактивные товары или товары без описания:**
```sql
SELECT name, is_active, description
FROM products
WHERE is_active = FALSE 
   OR description IS NULL;
```

---

### Задание 2: Сложные поисковые запросы (обязательно)

1. **Найти топ-5 самых дорогих товаров со скидкой:**
```sql
SELECT 
    name, 
    price,
    discount_percent,
    price * (1 - discount_percent / 100.0) AS final_price
FROM products
WHERE discount_percent > 0
ORDER BY final_price DESC
LIMIT 5;
```

2. **Найти товары с рейтингом выше среднего:**
```sql
SELECT name, rating, brand
FROM products
WHERE rating > (SELECT AVG(rating) FROM products WHERE rating IS NOT NULL)
ORDER BY rating DESC;
```

3. **Найти бренды с товарами дороже 50000:**
```sql
SELECT DISTINCT brand
FROM products
WHERE price > 50000
ORDER BY brand;
```

4. **Товары с определенными тегами:**
```sql
-- Найти товары с тегом "apple"
SELECT name, tags
FROM products
WHERE 'apple' = ANY(tags);

-- Найти товары с тегами "беспроводная" ИЛИ "bluetooth"
SELECT name, tags
FROM products
WHERE tags && ARRAY['беспроводная', 'bluetooth'];
```

5. **Поиск по regex — номера моделей:**
```sql
-- Найти товары с номерами моделей (содержат цифры после букв)
SELECT name
FROM products
WHERE name ~ '[A-Za-z]+\s*\d+';
-- Результат: iPhone 15, Galaxy S24, XPS 15, и т.д.
```

6. **Комбинированный поиск:**
```sql
-- Найти:
-- - Смартфоны или планшеты
-- - Цена от 30000 до 100000
-- - Рейтинг выше 4.5
-- - В наличии
-- - Со скидкой ИЛИ от Apple

SELECT 
    name, 
    category, 
    brand, 
    price,
    discount_percent,
    rating
FROM products
WHERE category IN ('Смартфоны', 'Планшеты')
  AND price BETWEEN 30000 AND 100000
  AND rating > 4.5
  AND stock_quantity > 0
  AND (discount_percent > 0 OR brand = 'Apple')
ORDER BY rating DESC, price DESC;
```

---

### Задание 3: Полнотекстовый поиск (дополнительно)

Реализуйте продвинутый поиск:

```sql
-- 1. Добавить поле для полнотекстового поиска
ALTER TABLE products ADD COLUMN search_vector tsvector;

-- 2. Заполнить поле (name + description)
UPDATE products 
SET search_vector = 
    to_tsvector('russian', COALESCE(name, '') || ' ' || COALESCE(description, ''));

-- 3. Создать индекс
CREATE INDEX idx_products_search ON products USING gin(search_vector);

-- 4. Поиск товаров, содержащих слова "беспроводн" И "наушник"
SELECT 
    name, 
    description,
    ts_rank(search_vector, query) AS rank
FROM products, 
     to_tsquery('russian', 'беспроводн & наушник') query
WHERE search_vector @@ query
ORDER BY rank DESC;

-- 5. Поиск с подсветкой результатов
SELECT 
    name,
    ts_headline('russian', description, 
                to_tsquery('russian', 'камера'), 
                'StartSel=<b>, StopSel=</b>') AS highlighted
FROM products
WHERE search_vector @@ to_tsquery('russian', 'камера');
```

---

## Контрольные вопросы

Проверьте себя:

1. В чем разница между AND и OR?
2. Зачем нужны скобки в сложных условиях WHERE?
3. Что делают символы % и _ в LIKE?
4. В чем разница между LIKE и ILIKE?
5. Когда использовать регулярные выражения вместо LIKE?
6. Что означает оператор ~*?
7. Включает ли BETWEEN граничные значения?
8. Почему нельзя писать WHERE column = NULL?
9. Что делает функция COALESCE?
10. Как изменить позицию NULL при сортировке?
11. Почему LIKE '%text%' медленный?
12. Что показывает EXPLAIN ANALYZE?

<details>
<summary>Ответы</summary>

1. AND — все условия истинны, OR — хотя бы одно истинно.
2. Скобки определяют порядок выполнения логических операций.
3. % = любое количество символов, _ = один символ.
4. LIKE чувствителен к регистру, ILIKE — нет.
5. Для сложных паттернов (email, телефоны, валидация).
6. Регулярное выражение, нечувствительное к регистру.
7. Да, BETWEEN включает min и max.
8. NULL означает "неизвестно", сравнение через = не работает.
9. Возвращает первое не-NULL значение из списка.
10. NULLS FIRST или NULLS LAST в ORDER BY.
11. Не может использовать индекс (% в начале).
12. План выполнения запроса и реальное время работы.
</details>

---

## Шпаргалка по фильтрации

```sql
-- ЛОГИЧЕСКИЕ ОПЕРАТОРЫ
WHERE condition1 AND condition2
WHERE condition1 OR condition2
WHERE NOT condition
WHERE (cond1 OR cond2) AND cond3

-- ПОИСК ТЕКСТА
WHERE text LIKE 'pattern%'      -- Начинается с
WHERE text LIKE '%pattern'      -- Заканчивается на
WHERE text LIKE '%pattern%'     -- Содержит
WHERE text ILIKE '%pattern%'    -- Регистронезависимо
WHERE text ~ 'regex'            -- Регулярное выражение
WHERE text ~* 'regex'           -- Regex без учета регистра

-- ДИАПАЗОНЫ И СПИСКИ
WHERE number BETWEEN 10 AND 100
WHERE value IN (1, 2, 3)
WHERE value NOT IN (1, 2, 3)

-- NULL
WHERE column IS NULL
WHERE column IS NOT NULL
WHERE COALESCE(column, 0) > 10

-- МАССИВЫ
WHERE 'value' = ANY(array_column)
WHERE array_column && ARRAY['val1', 'val2']

-- СОРТИРОВКА С NULL
ORDER BY column NULLS FIRST
ORDER BY column NULLS LAST
ORDER BY COALESCE(column, 0) DESC
```
