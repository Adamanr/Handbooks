---
sidebar_position: 3
description: "В этой главе мы изучим CRUD операции"
---

# CRUD операции

## Что такое CRUD

### Понимание CRUD

**CRUD** — это акроним из четырех основных операций с данными:

- **C**reate (Создать) → `INSERT`
- **R**ead (Прочитать) → `SELECT`
- **U**pdate (Обновить) → `UPDATE`
- **D**elete (Удалить) → `DELETE`

Эти четыре операции составляют основу работы с данными в любом приложении.

### CRUD в реальной жизни

**Пример: Социальная сеть**

```
CREATE:  Пользователь регистрируется → INSERT INTO users
READ:    Открываем профиль → SELECT * FROM users WHERE id = ...
UPDATE:  Изменяем аватар → UPDATE users SET avatar = ... WHERE id = ...
DELETE:  Удаляем аккаунт → DELETE FROM users WHERE id = ...
```

**Пример: Интернет-магазин**

```
CREATE:  Добавили товар в корзину → INSERT INTO cart_items
READ:    Просматриваем корзину → SELECT * FROM cart_items
UPDATE:  Изменили количество → UPDATE cart_items SET quantity = ...
DELETE:  Убрали товар из корзины → DELETE FROM cart_items WHERE ...
```

### Почему CRUD важен?

Практически любое приложение использует CRUD:
- 📱 Мобильные приложения
- 🌐 Веб-сайты
- 💼 Бизнес-системы
- 🎮 Игры (сохранение прогресса)

Освоив CRUD, вы сможете работать с данными в любом проекте!

### Что мы уже знаем

На прошлой неделе мы изучили:
- ✅ **C**reate → `INSERT INTO`
- ✅ **R**ead → `SELECT ... FROM ... WHERE`

На этой неделе добавим:
- 🆕 **U**pdate → `UPDATE`
- 🆕 **D**elete → `DELETE`

---

## UPDATE — изменение данных

### Базовый синтаксис UPDATE

```sql
UPDATE имя_таблицы
SET столбец1 = новое_значение1,
    столбец2 = новое_значение2
WHERE условие;
```

**⚠️ КРИТИЧЕСКИ ВАЖНО:** Всегда используйте WHERE! Без него изменятся ВСЕ строки в таблице!

### Простые примеры UPDATE

Подготовим данные для примеров:

```sql
-- Создадим таблицу пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    age INTEGER,
    balance DECIMAL(10, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP
);

-- Добавим тестовых пользователей
INSERT INTO users (username, email, age, balance)
VALUES 
    ('alice', 'alice@example.com', 25, 1000.00),
    ('bob', 'bob@example.com', 30, 1500.00),
    ('charlie', 'charlie@example.com', 28, 500.00),
    ('diana', 'diana@example.com', 22, 2000.00),
    ('eve', 'eve@example.com', 35, 750.00);
```

**Пример 1: Изменить email одного пользователя**

```sql
UPDATE users
SET email = 'alice_new@example.com'
WHERE username = 'alice';

-- Проверим изменения
SELECT * FROM users WHERE username = 'alice';
```

**Пример 2: Увеличить возраст**

```sql
UPDATE users
SET age = age + 1
WHERE username = 'bob';
```

**Пример 3: Изменить несколько столбцов одновременно**

```sql
UPDATE users
SET age = 29,
    balance = 1200.00,
    last_login = CURRENT_TIMESTAMP
WHERE username = 'charlie';
```

### UPDATE с условиями

**Пример 4: Деактивировать неактивных пользователей**

```sql
-- Деактивировать пользователей с балансом меньше 1000
UPDATE users
SET is_active = FALSE
WHERE balance < 1000;

-- Проверим результат
SELECT username, balance, is_active FROM users;
```

**Пример 5: Обновить по нескольким условиям**

```sql
-- Добавить бонус 100 рублей активным пользователям старше 25 лет
UPDATE users
SET balance = balance + 100
WHERE is_active = TRUE AND age > 25;
```

**Пример 6: UPDATE с IN**

```sql
-- Обновить email для нескольких пользователей
UPDATE users
SET email = LOWER(email)  -- Перевести email в нижний регистр
WHERE username IN ('alice', 'bob', 'charlie');
```

### UPDATE с возвратом данных (RETURNING)

PostgreSQL позволяет увидеть, что именно изменилось:

```sql
-- Начислить всем бонус 50 и показать результат
UPDATE users
SET balance = balance + 50
WHERE is_active = TRUE
RETURNING username, balance;
```

**Результат:**
```
 username | balance  
----------+----------
 alice    | 1150.00
 bob      | 1550.00
 diana    | 2050.00
```

**Полезно для:**
- Проверки, что обновилось
- Логирования изменений
- Получения новых значений после UPDATE

### Частые паттерны UPDATE

**Увеличение/уменьшение числовых значений:**

```sql
-- Увеличить баланс
UPDATE products SET stock_quantity = stock_quantity + 10 WHERE id = 5;

-- Уменьшить количество
UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = 5;

-- Применить скидку 10%
UPDATE products SET price = price * 0.9 WHERE category = 'Электроника';
```

**Работа с датами:**

```sql
-- Обновить время последнего входа
UPDATE users SET last_login = NOW() WHERE username = 'alice';

-- Установить дату истечения через 30 дней
UPDATE subscriptions 
SET expires_at = CURRENT_DATE + INTERVAL '30 days'
WHERE user_id = 10;
```

**Работа с текстом:**

```sql
-- Перевести в верхний регистр
UPDATE users SET username = UPPER(username) WHERE id = 1;

-- Добавить префикс
UPDATE products SET name = 'NEW: ' || name WHERE created_at > CURRENT_DATE - 7;

-- Заменить часть текста
UPDATE users SET email = REPLACE(email, '@old.com', '@new.com');
```

### Опасности UPDATE без WHERE

**❌ ОПАСНО — обновит ВСЕ строки:**

```sql
UPDATE users SET balance = 0;
-- Это обнулит баланс ВСЕХ пользователей!
```

**✅ БЕЗОПАСНО — обновит только нужные:**

```sql
UPDATE users SET balance = 0 WHERE username = 'test_user';
```

**Лучшая практика:** Всегда сначала проверяйте SELECT:

```sql
-- Шаг 1: Проверить, что выберется
SELECT * FROM users WHERE age > 30;

-- Шаг 2: Если правильно, заменить SELECT на UPDATE
UPDATE users SET is_active = FALSE WHERE age > 30;
```

---

## DELETE — удаление данных

### Базовый синтаксис DELETE

```sql
DELETE FROM имя_таблицы
WHERE условие;
```

**⚠️ КРИТИЧЕСКИ ВАЖНО:** Без WHERE удалятся ВСЕ строки!

### Простые примеры DELETE

Создадим тестовую таблицу для безопасных экспериментов:

```sql
-- Таблица временных записей
CREATE TABLE temp_logs (
    id SERIAL PRIMARY KEY,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавим тестовые данные
INSERT INTO temp_logs (message)
VALUES 
    ('Старая запись 1'),
    ('Старая запись 2'),
    ('Новая запись 1'),
    ('Новая запись 2'),
    ('Тестовая запись');
```

**Пример 1: Удалить одну запись по ID**

```sql
DELETE FROM temp_logs WHERE id = 1;

-- Проверим
SELECT * FROM temp_logs;
```

**Пример 2: Удалить по условию**

```sql
-- Удалить все записи со словом "Старая"
DELETE FROM temp_logs WHERE message LIKE 'Старая%';
```

**Пример 3: Удалить с несколькими условиями**

```sql
-- Удалить записи старше 30 дней
DELETE FROM temp_logs 
WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
```

### DELETE с RETURNING

Посмотреть, что удалилось:

```sql
DELETE FROM temp_logs 
WHERE message LIKE 'Тестовая%'
RETURNING *;
```

**Результат покажет удаленные строки:**
```
 id |      message      |       created_at        
----+-------------------+-------------------------
  5 | Тестовая запись   | 2024-01-15 10:30:00
```

### Каскадное удаление (важная концепция)

Представим две связанные таблицы:

```sql
-- Таблица категорий
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- Таблица товаров (связана с категориями)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE
);

-- Добавим данные
INSERT INTO categories (name) VALUES ('Электроника'), ('Мебель');
INSERT INTO products (name, category_id) VALUES 
    ('Ноутбук', 1),
    ('Телефон', 1),
    ('Стол', 2);
```

**Что происходит при удалении категории?**

```sql
-- Удаляем категорию "Электроника"
DELETE FROM categories WHERE name = 'Электроника';

-- Проверяем товары
SELECT * FROM products;
```

**Результат:** Все товары категории "Электроника" тоже удалились!
Это произошло благодаря `ON DELETE CASCADE`.

### Варианты поведения при удалении

При создании внешнего ключа можно указать:

```sql
-- 1. CASCADE - удалить связанные записи
category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE

-- 2. SET NULL - установить NULL
category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL

-- 3. RESTRICT - запретить удаление (по умолчанию)
category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT

-- 4. SET DEFAULT - установить значение по умолчанию
category_id INTEGER REFERENCES categories(id) ON DELETE SET DEFAULT
```

### Мягкое удаление (Soft Delete)

Вместо физического удаления часто используют **мягкое удаление** — помечают запись как удаленную:

```sql
-- Добавляем поле deleted_at
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;

-- Вместо DELETE используем UPDATE
UPDATE users 
SET deleted_at = CURRENT_TIMESTAMP 
WHERE id = 5;

-- При выборке исключаем "удаленные"
SELECT * FROM users WHERE deleted_at IS NULL;
```

**Преимущества мягкого удаления:**
- ✅ Можно восстановить данные
- ✅ Сохраняется история
- ✅ Нет проблем с внешними ключами

**Недостатки:**
- ❌ Данные занимают место
- ❌ Нужно везде помнить про WHERE deleted_at IS NULL

### Удаление всех записей

**Вариант 1: DELETE FROM (медленный)**

```sql
DELETE FROM temp_logs;  -- Удаляет по одной записи, медленно
```

**Вариант 2: TRUNCATE (быстрый)**

```sql
TRUNCATE TABLE temp_logs;  -- Очищает таблицу мгновенно
-- Но! Сбрасывает SERIAL счетчик на 1
```

**Вариант 3: TRUNCATE с сохранением счетчика**

```sql
TRUNCATE TABLE temp_logs RESTART IDENTITY;  -- Сбросить счетчик
TRUNCATE TABLE temp_logs CONTINUE IDENTITY; -- Не сбрасывать счетчик
```

**Когда использовать TRUNCATE:**
- Нужно быстро очистить большую таблицу
- Не важна история операций
- Нет сложных зависимостей с другими таблицами

---

## Транзакции — безопасность данных

### Что такое транзакция?

**Транзакция** — это группа операций, которые выполняются как одно целое: либо все, либо ничего.

**Аналогия:** Перевод денег между счетами

```
1. Снять деньги со счета A
2. Добавить деньги на счет B

Если шаг 2 не удался, шаг 1 должен быть отменен!
```

### Базовый синтаксис транзакций

```sql
BEGIN;  -- Начать транзакцию

-- Ваши SQL команды
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

COMMIT;  -- Подтвердить изменения (сохранить)

-- Или
ROLLBACK;  -- Отменить все изменения
```

### Пример: Перевод денег

```sql
-- Создадим таблицу счетов
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    balance DECIMAL(10, 2) NOT NULL CHECK (balance >= 0)
);

INSERT INTO accounts (username, balance) VALUES 
    ('alice', 1000.00),
    ('bob', 500.00);
```

**Безопасный перевод с транзакцией:**

```sql
BEGIN;

-- Снять 200 у alice
UPDATE accounts SET balance = balance - 200 WHERE username = 'alice';

-- Добавить 200 bob
UPDATE accounts SET balance = balance + 200 WHERE username = 'bob';

-- Проверим результат
SELECT * FROM accounts;

-- Если все хорошо - подтверждаем
COMMIT;

-- Если что-то не так - отменяем
-- ROLLBACK;
```

**Что произойдет при ошибке?**

```sql
BEGIN;

UPDATE accounts SET balance = balance - 200 WHERE username = 'alice';
-- alice теперь имеет 800

UPDATE accounts SET balance = balance + 200 WHERE username = 'nonexistent';
-- Этот пользователь не существует! Ошибка!

-- PostgreSQL автоматически откатит ВСЮ транзакцию
-- alice все еще будет иметь 1000
```

### Практические примеры транзакций

**Пример 1: Создание заказа с товарами**

```sql
BEGIN;

-- Создать заказ
INSERT INTO orders (user_id, total) 
VALUES (1, 5000.00)
RETURNING id;  -- Допустим, получили id = 42

-- Добавить товары в заказ
INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES 
    (42, 10, 2, 2000.00),
    (42, 15, 1, 1000.00);

-- Уменьшить количество товаров на складе
UPDATE products SET stock_quantity = stock_quantity - 2 WHERE id = 10;
UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = 15;

-- Если все прошло успешно
COMMIT;
```

Если любая операция не удастся — весь заказ откатится!

**Пример 2: Массовое обновление с проверкой**

```sql
BEGIN;

-- Применить скидку 20%
UPDATE products 
SET price = price * 0.8 
WHERE category = 'Электроника';

-- Проверить результат
SELECT name, price FROM products WHERE category = 'Электроника';

-- Если цены выглядят правильно
COMMIT;

-- Если что-то не так
-- ROLLBACK;
```

### Свойства транзакций (ACID)

PostgreSQL гарантирует ACID:

- **A**tomicity (Атомарность) — все или ничего
- **C**onsistency (Согласованность) — данные всегда корректны
- **I**solation (Изолированность) — транзакции не мешают друг другу
- **D**urability (Долговечность) — после COMMIT данные сохранены навсегда

### Savepoints — точки сохранения

Можно создавать промежуточные точки сохранения:

```sql
BEGIN;

INSERT INTO logs (message) VALUES ('Начало операции');
SAVEPOINT step1;

UPDATE users SET balance = balance + 100;
SAVEPOINT step2;

UPDATE users SET is_active = FALSE WHERE balance < 0;
-- Ой, это неправильно!

-- Откатиться только до step2
ROLLBACK TO step2;

-- step1 и все до него остается
COMMIT;
```

---

## Работа с датами и временем

### Текущие дата и время

```sql
-- Текущая дата (без времени)
SELECT CURRENT_DATE;
-- 2024-01-15

-- Текущее время (без даты)
SELECT CURRENT_TIME;
-- 14:30:45.123456+03

-- Текущие дата и время
SELECT CURRENT_TIMESTAMP;
-- 2024-01-15 14:30:45.123456

-- То же самое, короче
SELECT NOW();
-- 2024-01-15 14:30:45.123456+03
```

### Арифметика с датами

```sql
-- Через 7 дней
SELECT CURRENT_DATE + INTERVAL '7 days';

-- Месяц назад
SELECT CURRENT_DATE - INTERVAL '1 month';

-- Через 2 часа 30 минут
SELECT NOW() + INTERVAL '2 hours 30 minutes';

-- Вчера
SELECT CURRENT_DATE - 1;

-- Разница между датами
SELECT AGE(TIMESTAMP '2024-01-15', TIMESTAMP '1990-05-20');
-- 33 years 7 mons 26 days
```

### Извлечение частей даты

```sql
-- Год
SELECT EXTRACT(YEAR FROM CURRENT_DATE);
-- 2024

-- Месяц (число)
SELECT EXTRACT(MONTH FROM CURRENT_DATE);
-- 1

-- День месяца
SELECT EXTRACT(DAY FROM CURRENT_DATE);
-- 15

-- День недели (0 = воскресенье, 6 = суббота)
SELECT EXTRACT(DOW FROM CURRENT_DATE);

-- Час
SELECT EXTRACT(HOUR FROM NOW());
```

### Форматирование дат

```sql
-- Форматирование в строку
SELECT TO_CHAR(NOW(), 'DD.MM.YYYY');
-- 15.01.2024

SELECT TO_CHAR(NOW(), 'DD Month YYYY');
-- 15 January 2024

SELECT TO_CHAR(NOW(), 'HH24:MI:SS');
-- 14:30:45

-- Парсинг строки в дату
SELECT TO_DATE('15.01.2024', 'DD.MM.YYYY');

SELECT TO_TIMESTAMP('2024-01-15 14:30', 'YYYY-MM-DD HH24:MI');
```

### Практические примеры с датами

**Найти заказы за последнюю неделю:**

```sql
SELECT * FROM orders 
WHERE created_at >= NOW() - INTERVAL '7 days';
```

**Найти пользователей, зарегистрированных в этом месяце:**

```sql
SELECT * FROM users 
WHERE EXTRACT(YEAR FROM registered_at) = EXTRACT(YEAR FROM CURRENT_DATE)
  AND EXTRACT(MONTH FROM registered_at) = EXTRACT(MONTH FROM CURRENT_DATE);
```

**Найти товары, добавленные сегодня:**

```sql
SELECT * FROM products 
WHERE DATE(created_at) = CURRENT_DATE;
```

**Рассчитать возраст:**

```sql
SELECT 
    username,
    birth_date,
    EXTRACT(YEAR FROM AGE(birth_date)) AS age
FROM users;
```

**Группировка по датам:**

```sql
-- Количество заказов по дням
SELECT 
    DATE(created_at) AS order_date,
    COUNT(*) AS order_count
FROM orders
GROUP BY DATE(created_at)
ORDER BY order_date DESC;
```

---

## Комплексные CRUD операции

### Сценарий: Интернет-магазин

Создадим полноценную структуру:

```sql
-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица товаров
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заказов
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица товаров в заказе
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL
);
```

### Операция 1: Регистрация пользователя (CREATE)

```sql
INSERT INTO users (username, email, password_hash)
VALUES ('john_doe', 'john@example.com', 'hashed_password_here')
RETURNING id, username, created_at;
```

### Операция 2: Добавление товаров (CREATE)

```sql
INSERT INTO products (name, price, stock_quantity)
VALUES 
    ('iPhone 15', 89990.00, 50),
    ('MacBook Pro', 199990.00, 20),
    ('AirPods Pro', 24990.00, 100)
RETURNING *;
```

### Операция 3: Просмотр каталога (READ)

```sql
-- Все товары в наличии
SELECT 
    id,
    name,
    price,
    stock_quantity,
    TO_CHAR(created_at, 'DD.MM.YYYY') AS added_date
FROM products
WHERE stock_quantity > 0
ORDER BY created_at DESC;
```

### Операция 4: Создание заказа (сложная CREATE с транзакцией)

```sql
BEGIN;

-- 1. Создать заказ
INSERT INTO orders (user_id, total, status)
VALUES (1, 114980.00, 'pending')
RETURNING id;  -- Получили id = 1

-- 2. Добавить товары в заказ
INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES 
    (1, 1, 1, 89990.00),  -- 1x iPhone
    (1, 3, 1, 24990.00);  -- 1x AirPods

-- 3. Уменьшить количество на складе
UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = 1;
UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = 3;

-- 4. Обновить время изменения пользователя
UPDATE users SET updated_at = NOW() WHERE id = 1;

COMMIT;
```

### Операция 5: Просмотр своих заказов (READ)

```sql
SELECT 
    o.id AS order_id,
    o.status,
    o.total,
    TO_CHAR(o.created_at, 'DD.MM.YYYY HH24:MI') AS order_date,
    p.name AS product_name,
    oi.quantity,
    oi.price
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE o.user_id = 1
ORDER BY o.created_at DESC;
```

### Операция 6: Изменение статуса заказа (UPDATE)

```sql
-- Отметить заказ как оплаченный
UPDATE orders
SET status = 'paid'
WHERE id = 1 AND status = 'pending'
RETURNING id, status, updated_at;

-- Отправить заказ
UPDATE orders
SET status = 'shipped'
WHERE id = 1 AND status = 'paid'
RETURNING *;
```

### Операция 7: Отмена заказа (сложная UPDATE/DELETE с транзакцией)

```sql
BEGIN;

-- 1. Получить информацию о товарах в заказе
SELECT product_id, quantity 
FROM order_items 
WHERE order_id = 1;

-- 2. Вернуть товары на склад
UPDATE products 
SET stock_quantity = stock_quantity + oi.quantity
FROM order_items oi
WHERE products.id = oi.product_id 
  AND oi.order_id = 1;

-- 3. Изменить статус заказа
UPDATE orders 
SET status = 'cancelled'
WHERE id = 1;

-- Или полностью удалить (каскадно удалятся order_items)
-- DELETE FROM orders WHERE id = 1;

COMMIT;
```

### Операция 8: Обновление цен (массовый UPDATE)

```sql
-- Повысить цены на 10% для товаров дешевле 50000
UPDATE products
SET price = price * 1.1
WHERE price < 50000
RETURNING name, price;
```

### Операция 9: Удаление неактивных пользователей (DELETE)

```sql
-- Удалить пользователей, не заходивших 6 месяцев
DELETE FROM users
WHERE updated_at < NOW() - INTERVAL '6 months'
  AND id NOT IN (SELECT DISTINCT user_id FROM orders)
RETURNING username, email;
```

### Операция 10: Очистка старых логов (DELETE)

```sql
-- Удалить логи старше 90 дней
DELETE FROM logs
WHERE created_at < CURRENT_DATE - INTERVAL '90 days';

-- Показать, сколько удалилось
SELECT COUNT(*) FROM logs;
```

---

## Практическое задание

### Задание 1: Система управления библиотекой (обязательно)

Создайте базу данных библиотеки и выполните CRUD операции.

**Шаг 1: Создание структуры**

```sql
CREATE DATABASE library_db;
\c library_db

-- Таблица читателей
CREATE TABLE readers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    registered_at DATE DEFAULT CURRENT_DATE
);

-- Таблица книг
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    total_copies INTEGER NOT NULL CHECK (total_copies > 0),
    available_copies INTEGER NOT NULL CHECK (available_copies >= 0),
    CHECK (available_copies <= total_copies)
);

-- Таблица выдачи книг
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    reader_id INTEGER REFERENCES readers(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id),
    loan_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue'))
);
```

**Шаг 2: Заполнение данными (CREATE)**

```sql
-- Добавьте 5 читателей
INSERT INTO readers (first_name, last_name, email, phone)
VALUES 
    ('Анна', 'Петрова', 'anna@example.com', '+79001111111'),
    ('Иван', 'Сидоров', 'ivan@example.com', '+79002222222'),
    ('Мария', 'Кузнецова', 'maria@example.com', '+79003333333'),
    ('Алексей', 'Смирнов', 'alex@example.com', '+79004444444'),
    ('Елена', 'Новикова', 'elena@example.com', '+79005555555');

-- Добавьте 7 книг
INSERT INTO books (title, author, isbn, total_copies, available_copies)
VALUES 
    ('Война и мир', 'Лев Толстой', '978-5-17-001', 3, 3),
    ('Преступление и наказание', 'Фёдор Достоевский', '978-5-17-002', 2, 2),
    ('Мастер и Маргарита', 'Михаил Булгаков', '978-5-17-003', 4, 4),
    ('Анна Каренина', 'Лев Толстой', '978-5-17-004', 2, 2),
    ('Идиот', 'Фёдор Достоевский', '978-5-17-005', 2, 2),
    ('Евгений Онегин', 'Александр Пушкин', '978-5-17-006', 3, 3),
    ('Горе от ума', 'Александр Грибоедов', '978-5-17-007', 2, 2);
```

**Шаг 3: Выдача книги (CREATE + UPDATE в транзакции)**

```sql
-- Анна берет "Война и мир"
BEGIN;

-- 1. Создать запись о выдаче
INSERT INTO loans (reader_id, book_id, due_date)
VALUES (1, 1, CURRENT_DATE + INTERVAL '14 days')
RETURNING *;

-- 2. Уменьшить количество доступных копий
UPDATE books 
SET available_copies = available_copies - 1 
WHERE id = 1;

COMMIT;

-- Выдайте еще несколько книг
BEGIN;
INSERT INTO loans (reader_id, book_id, due_date)
VALUES (2, 3, CURRENT_DATE + INTERVAL '14 days');
UPDATE books SET available_copies = available_copies - 1 WHERE id = 3;
COMMIT;

BEGIN;
INSERT INTO loans (reader_id, book_id, due_date)
VALUES (3, 2, CURRENT_DATE + INTERVAL '14 days');
UPDATE books SET available_copies = available_copies - 1 WHERE id = 2;
COMMIT;
```

**Шаг 4: Запросы для чтения данных (READ)**

```sql
-- 1. Список всех доступных книг
SELECT 
    title, 
    author, 
    available_copies,
    total_copies
FROM books
WHERE available_copies > 0
ORDER BY author, title;

-- 2. Книги на руках у читателей (активные выдачи)
SELECT 
    r.first_name || ' ' || r.last_name AS reader_name,
    b.title,
    b.author,
    l.loan_date,
    l.due_date,
    CURRENT_DATE - l.due_date AS days_overdue
FROM loans l
JOIN readers r ON l.reader_id = r.id
JOIN books b ON l.book_id = b.id
WHERE l.status = 'active'
ORDER BY l.due_date;

-- 3. Просроченные книги
SELECT 
    r.first_name || ' ' || r.last_name AS reader_name,
    r.email,
    b.title,
    l.due_date,
    CURRENT_DATE - l.due_date AS days_overdue
FROM loans l
JOIN readers r ON l.reader_id = r.id
JOIN books b ON l.book_id = b.id
WHERE l.status = 'active' 
  AND l.due_date < CURRENT_DATE
ORDER BY days_overdue DESC;

-- 4. История чтения конкретного читателя
SELECT 
    b.title,
    b.author,
    l.loan_date,
    l.return_date,
    l.status
FROM loans l
JOIN books b ON l.book_id = b.id
WHERE l.reader_id = 1
ORDER BY l.loan_date DESC;

-- 5. Самые популярные книги (сколько раз брали)
SELECT 
    b.title,
    b.author,
    COUNT(l.id) AS times_borrowed
FROM books b
LEFT JOIN loans l ON b.id = l.book_id
GROUP BY b.id, b.title, b.author
ORDER BY times_borrowed DESC;
```

**Шаг 5: Возврат книги (UPDATE в транзакции)**

```sql
-- Анна возвращает книгу
BEGIN;

-- 1. Отметить возврат
UPDATE loans
SET return_date = CURRENT_DATE,
    status = 'returned'
WHERE reader_id = 1 
  AND book_id = 1 
  AND status = 'active'
RETURNING *;

-- 2. Увеличить количество доступных копий
UPDATE books
SET available_copies = available_copies + 1
WHERE id = 1;

COMMIT;
```

**Шаг 6: Обновление информации о читателе (UPDATE)**

```sql
-- Обновить email и телефон
UPDATE readers
SET email = 'anna.new@example.com',
    phone = '+79009999999'
WHERE id = 1
RETURNING *;

-- Обновить срок возврата книги (продлить на 7 дней)
UPDATE loans
SET due_date = due_date + INTERVAL '7 days'
WHERE id = 2 AND status = 'active'
RETURNING reader_id, book_id, due_date;
```

**Шаг 7: Пометить просроченные книги (UPDATE)**

```sql
-- Автоматически пометить все просроченные выдачи
UPDATE loans
SET status = 'overdue'
WHERE status = 'active' 
  AND due_date < CURRENT_DATE
RETURNING id, reader_id, book_id, due_date;
```

**Шаг 8: Удаление данных (DELETE)**

```sql
-- Удалить читателя без активных выдач
DELETE FROM readers
WHERE id = 5
  AND id NOT IN (SELECT reader_id FROM loans WHERE status = 'active')
RETURNING first_name, last_name;

-- Удалить старые записи о возвратах (старше года)
DELETE FROM loans
WHERE status = 'returned' 
  AND return_date < CURRENT_DATE - INTERVAL '1 year'
RETURNING id, book_id, return_date;
```

---

### Задание 2: Аналитические запросы (обязательно)

Напишите запросы для получения следующей статистики:

1. **Сколько книг сейчас на руках у читателей?**
```sql
SELECT COUNT(*) AS active_loans
FROM loans
WHERE status = 'active';
```

2. **Какие книги никогда не брали?**
```sql
SELECT title, author
FROM books
WHERE id NOT IN (SELECT DISTINCT book_id FROM loans)
ORDER BY title;
```

3. **Топ-3 самых активных читателей**
```sql
SELECT 
    r.first_name || ' ' || r.last_name AS reader_name,
    COUNT(l.id) AS books_borrowed
FROM readers r
LEFT JOIN loans l ON r.id = l.reader_id
GROUP BY r.id, reader_name
ORDER BY books_borrowed DESC
LIMIT 3;
```

4. **Авторы с наибольшим количеством книг в библиотеке**
```sql
SELECT 
    author,
    COUNT(*) AS book_count,
    SUM(total_copies) AS total_copies
FROM books
GROUP BY author
ORDER BY book_count DESC;
```

5. **Средний срок удержания книги**
```sql
SELECT 
    AVG(return_date - loan_date) AS avg_days
FROM loans
WHERE status = 'returned';
```

---

### Задание 3: Сложные сценарии (дополнительно)

**Сценарий 1: Инвентаризация**

Проверьте целостность данных:

```sql
-- Найти книги, где available_copies > total_copies (ошибка!)
SELECT title, available_copies, total_copies
FROM books
WHERE available_copies > total_copies;

-- Найти книги с отрицательным количеством
SELECT title, available_copies
FROM books
WHERE available_copies < 0;

-- Исправить ошибки
UPDATE books
SET available_copies = total_copies
WHERE available_copies > total_copies;
```

**Сценарий 2: Массовое продление книг**

Продлить все активные выдачи на 7 дней:

```sql
UPDATE loans
SET due_date = due_date + INTERVAL '7 days'
WHERE status = 'active'
RETURNING 
    reader_id,
    book_id,
    due_date AS new_due_date;
```

**Сценарий 3: Списание утерянной книги**

```sql
BEGIN;

-- Пометить книгу как утерянную
UPDATE loans
SET status = 'lost'
WHERE id = 5;

-- Уменьшить общее количество копий
UPDATE books
SET total_copies = total_copies - 1,
    available_copies = GREATEST(available_copies - 1, 0)
WHERE id = (SELECT book_id FROM loans WHERE id = 5);

COMMIT;
```

---

## Контрольные вопросы

Проверьте себя, ответив на эти вопросы:

1. Что означает аббревиатура CRUD?
2. Почему важно всегда использовать WHERE в UPDATE и DELETE?
3. Что делает RETURNING в конце запроса?
4. В чем разница между DELETE и TRUNCATE?
5. Что такое транзакция и когда её использовать?
6. Какие команды используются для управления транзакциями?
7. Что такое ACID?
8. Как увеличить числовое значение в столбце?
9. Как удалить все записи старше 30 дней?
10. В чем преимущество мягкого удаления?
11. Как добавить 7 дней к дате?
12. Что такое каскадное удаление?

<details>
<summary>Ответы</summary>

1. Create, Read, Update, Delete — четыре основные операции с данными.
2. Без WHERE изменятся или удалятся ВСЕ строки в таблице!
3. RETURNING возвращает измененные/добавленные/удаленные данные после выполнения операции.
4. DELETE удаляет по одной записи и можно откатить, TRUNCATE очищает таблицу мгновенно.
5. Транзакция — группа операций, выполняющихся как одно целое. Используется, когда операции взаимосвязаны.
6. BEGIN, COMMIT, ROLLBACK, SAVEPOINT.
7. Atomicity, Consistency, Isolation, Durability — свойства транзакций.
8. `UPDATE table SET column = column + 1 WHERE ...`
9. `DELETE FROM table WHERE created_at < CURRENT_DATE - INTERVAL '30 days'`
10. Можно восстановить данные, сохраняется история.
11. `date_column + INTERVAL '7 days'`
12. Автоматическое удаление связанных записей при удалении главной записи (ON DELETE CASCADE).
</details>

---

## Типичные ошибки и их решения

### Ошибка 1: UPDATE/DELETE без WHERE

```sql
-- ❌ ОПАСНО: обновит ВСЕ записи
UPDATE users SET balance = 0;

-- ✅ ПРАВИЛЬНО: обновит только нужные
UPDATE users SET balance = 0 WHERE username = 'test';
```

**Защита:** Всегда сначала проверяйте SELECT:
```sql
-- Шаг 1: Проверить
SELECT * FROM users WHERE username = 'test';

-- Шаг 2: Если правильно, заменить на UPDATE
UPDATE users SET balance = 0 WHERE username = 'test';
```

### Ошибка 2: Забыли COMMIT в транзакции

```sql
BEGIN;
UPDATE users SET balance = balance + 100;
-- Забыли COMMIT!
\q  -- Выход - все откатится!

-- ПРАВИЛЬНО:
BEGIN;
UPDATE users SET balance = balance + 100;
COMMIT;  -- Обязательно!
```

### Ошибка 3: Нарушение ограничений

```sql
-- Попытка установить отрицательный баланс
UPDATE accounts SET balance = -100 WHERE id = 1;
-- ERROR: new row violates check constraint

-- Решение: проверить условие перед обновлением
UPDATE accounts 
SET balance = GREATEST(balance - 100, 0) 
WHERE id = 1;
```

### Ошибка 4: Каскадное удаление без понимания последствий

```sql
-- Удаление пользователя удалит ВСЕ его заказы!
DELETE FROM users WHERE id = 1;
-- Если есть ON DELETE CASCADE

-- Решение: сначала проверить связанные данные
SELECT COUNT(*) FROM orders WHERE user_id = 1;
```

### Ошибка 5: Неправильная работа с NULL

```sql
-- ❌ НЕ РАБОТАЕТ
UPDATE users SET age = age + 1 WHERE age = NULL;

-- ✅ ПРАВИЛЬНО
UPDATE users SET age = 25 WHERE age IS NULL;
```

### Ошибка 6: Арифметика с NULL

```sql
-- Если balance = NULL, результат будет NULL!
UPDATE users SET balance = balance + 100;

-- ПРАВИЛЬНО: обработать NULL
UPDATE users SET balance = COALESCE(balance, 0) + 100;
```

---

## Шпаргалка по CRUD операциям

```sql
-- CREATE (INSERT)
INSERT INTO table (col1, col2) VALUES (val1, val2);
INSERT INTO table (col1, col2) VALUES (v1, v2), (v3, v4);
INSERT INTO table (col1) VALUES (val) RETURNING *;

-- READ (SELECT)
SELECT * FROM table;
SELECT col1, col2 FROM table WHERE condition;
SELECT * FROM table ORDER BY col1 DESC LIMIT 10;

-- UPDATE
UPDATE table SET col1 = val1 WHERE condition;
UPDATE table SET col1 = val1, col2 = val2 WHERE condition;
UPDATE table SET col = col + 1 WHERE condition;
UPDATE table SET col = val WHERE condition RETURNING *;

-- DELETE
DELETE FROM table WHERE condition;
DELETE FROM table WHERE condition RETURNING *;
TRUNCATE TABLE table;

-- ТРАНЗАКЦИИ
BEGIN;
  -- SQL команды
COMMIT;  -- или ROLLBACK;

-- ДАТЫ
CURRENT_DATE
CURRENT_TIMESTAMP
NOW()
date_column + INTERVAL '7 days'
EXTRACT(YEAR FROM date_column)
TO_CHAR(date_column, 'DD.MM.YYYY')
```

---

## Лучшие практики

### 1. Всегда используйте транзакции для связанных операций

```sql
-- ❌ ПЛОХО: операции независимы
INSERT INTO orders (...) VALUES (...);
UPDATE products SET stock = stock - 1 WHERE id = 5;

-- ✅ ХОРОШО: операции в транзакции
BEGIN;
INSERT INTO orders (...) VALUES (...);
UPDATE products SET stock = stock - 1 WHERE id = 5;
COMMIT;
```

### 2. Проверяйте SELECT перед UPDATE/DELETE

```sql
-- Шаг 1: Проверить
SELECT * FROM users WHERE last_login < '2023-01-01';

-- Шаг 2: Если всё правильно, удалить
DELETE FROM users WHERE last_login < '2023-01-01';
```

### 3. Используйте RETURNING для логирования

```sql
-- Записать в лог, что изменилось
UPDATE products 
SET price = price * 1.1 
WHERE category = 'Electronics'
RETURNING id, name, price;
```

### 4. Добавляйте временные метки

```sql
CREATE TABLE table_name (
    id SERIAL PRIMARY KEY,
    -- ...
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- При UPDATE обновляйте updated_at
UPDATE table_name 
SET 
    column = value,
    updated_at = NOW()
WHERE id = 1;
```

### 5. Используйте CHECK для защиты данных

```sql
CREATE TABLE products (
    price DECIMAL(10,2) CHECK (price >= 0),
    stock INTEGER CHECK (stock >= 0),
    discount_percent INTEGER CHECK (discount_percent BETWEEN 0 AND 100)
);
```

### 6. Мягкое удаление для важных данных

```sql
-- Вместо DELETE используйте UPDATE
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;

UPDATE users SET deleted_at = NOW() WHERE id = 5;

-- Не показывать удаленные
SELECT * FROM users WHERE deleted_at IS NULL;
```

---

## Практический проект: Система управления задачами (TODO)

Создайте полноценное TODO-приложение:

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Добавить задачи
INSERT INTO tasks (title, description, priority, due_date)
VALUES 
    ('Изучить PostgreSQL', 'Пройти курс по PostgreSQL', 1, CURRENT_DATE + 7),
    ('Сделать проект', 'Создать базу данных для проекта', 2, CURRENT_DATE + 14),
    ('Купить продукты', 'Молоко, хлеб, яйца', 3, CURRENT_DATE + 1);

-- Начать работу над задачей
UPDATE tasks 
SET status = 'in_progress',
    updated_at = NOW()
WHERE id = 1;

-- Завершить задачу
UPDATE tasks
SET status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
WHERE id = 1
RETURNING title, completed_at;

-- Просмотр активных задач
SELECT 
    id,
    title,
    status,
    priority,
    due_date,
    CASE 
        WHEN due_date < CURRENT_DATE THEN 'ПРОСРОЧЕНО'
        WHEN due_date = CURRENT_DATE THEN 'СЕГОДНЯ'
        WHEN due_date <= CURRENT_DATE + 3 THEN 'СКОРО'
        ELSE 'В ПЛАНЕ'
    END AS urgency
FROM tasks
WHERE status NOT IN ('completed', 'cancelled')
ORDER BY priority ASC, due_date ASC;

-- Удалить отмененные задачи старше месяца
DELETE FROM tasks
WHERE status = 'cancelled' 
  AND updated_at < NOW() - INTERVAL '1 month'
RETURNING title;
```

---

## Полезные ресурсы

**Практика:**
- HackerRank SQL: https://www.hackerrank.com/domains/sql

**Документация:**
- UPDATE: https://www.postgresql.org/docs/current/sql-update.html
- DELETE: https://www.postgresql.org/docs/current/sql-delete.html
- Транзакции: https://www.postgresql.org/docs/current/tutorial-transactions.html
