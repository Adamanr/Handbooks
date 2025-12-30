---
sidebar_position: 6
description: "В этой главе мы изучим ключи и связи в PostgreSQL."
---

# JOIN - объединение таблиц

## Что такое JOIN и зачем он нужен

### Проблема разделенных данных

Представьте, что у вас есть две таблицы:

```sql
-- Таблица заказов
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    total DECIMAL(10, 2),
    created_at DATE
);

-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100)
);

-- Добавим данные
INSERT INTO users (name, email) VALUES 
    ('Алиса', 'alice@example.com'),
    ('Боб', 'bob@example.com'),
    ('Чарли', 'charlie@example.com');

INSERT INTO orders (user_id, total, created_at) VALUES 
    (1, 5000, '2024-01-15'),
    (1, 3000, '2024-01-20'),
    (2, 7000, '2024-01-18');
```

**Задача:** Показать заказы вместе с именами пользователей.

**Без JOIN (плохой способ):**
```sql
-- Получаем заказы
SELECT * FROM orders;
-- id | user_id | total | created_at
-- 1  | 1       | 5000  | 2024-01-15

-- Вручную ищем пользователя
SELECT name FROM users WHERE id = 1;
-- Алиса

-- Нужно делать отдельный запрос для каждого заказа! 😫
```

**С JOIN (правильный способ):**
```sql
SELECT 
    orders.id,
    users.name AS customer_name,
    orders.total,
    orders.created_at
FROM orders
JOIN users ON orders.user_id = users.id;
```

**Результат:**
```
 id | customer_name | total | created_at 
----+---------------+-------+------------
  1 | Алиса         | 5000  | 2024-01-15
  2 | Алиса         | 3000  | 2024-01-20
  3 | Боб           | 7000  | 2024-01-18
```

### Как работает JOIN?

JOIN объединяет строки из двух таблиц на основе условия (обычно равенство ключей).

**Визуально:**
```
orders              users
------              -----
1 | user_id=1  ──→  1 | Алиса
2 | user_id=1  ──→  1 | Алиса
3 | user_id=2  ──→  2 | Боб
```

**Результат объединения:**
```
1 | user_id=1 | Алиса
2 | user_id=1 | Алиса
3 | user_id=2 | Боб
```

---

## INNER JOIN - внутреннее соединение

### Что делает INNER JOIN?

**INNER JOIN** возвращает только те строки, где есть совпадение в **обеих** таблицах.

**Диаграмма Венна:**
```
  Таблица A      Таблица B
     ┌───┐         ┌───┐
     │   │         │   │
     │  ┌┴─────────┴┐  │
     │  │ INNER JOIN│  │  ← Только эта часть
     │  └┬─────────┬┘  │
     │   │         │   │
     └───┘         └───┘
```

### Синтаксис INNER JOIN

```sql
SELECT столбцы
FROM таблица1
INNER JOIN таблица2 ON таблица1.ключ = таблица2.ключ;

-- Или короче (INNER можно опустить)
FROM таблица1
JOIN таблица2 ON таблица1.ключ = таблица2.ключ;
```

### Примеры INNER JOIN

**Подготовка данных:**

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    price DECIMAL(10, 2),
    category_id INTEGER
);

INSERT INTO categories (name) VALUES 
    ('Электроника'),
    ('Мебель'),
    ('Одежда');

INSERT INTO products (name, price, category_id) VALUES 
    ('iPhone 15', 89990, 1),
    ('MacBook Pro', 199990, 1),
    ('Диван', 45000, 2),
    ('Стол', 15000, 2),
    ('Футболка', 1500, 3),
    ('Товар без категории', 1000, NULL);  -- Без категории!
```

**Пример 1: Базовый JOIN**

```sql
SELECT 
    products.name AS product_name,
    products.price,
    categories.name AS category_name
FROM products
INNER JOIN categories ON products.category_id = categories.id;
```

**Результат:**
```
 product_name  | price   | category_name
---------------+---------+---------------
 iPhone 15     | 89990   | Электроника
 MacBook Pro   | 199990  | Электроника
 Диван         | 45000   | Мебель
 Стол          | 15000   | Мебель
 Футболка      | 1500    | Одежда
```

**Важно:** "Товар без категории" НЕ попал в результат, потому что у него category_id = NULL!

**Пример 2: JOIN с псевдонимами таблиц**

```sql
SELECT 
    p.name AS product_name,
    p.price,
    c.name AS category_name
FROM products p
JOIN categories c ON p.category_id = c.id;
```

Псевдонимы (`p`, `c`) делают запрос короче и читабельнее.

**Пример 3: JOIN с фильтрацией**

```sql
-- Товары категории "Электроника" дороже 50000
SELECT 
    p.name,
    p.price,
    c.name AS category
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = 'Электроника' AND p.price > 50000;
```

**Результат:**
```
    name     | price   | category
-------------+---------+-------------
 iPhone 15   | 89990   | Электроника
 MacBook Pro | 199990  | Электроника
```

**Пример 4: JOIN с сортировкой**

```sql
SELECT 
    p.name,
    p.price,
    c.name AS category
FROM products p
JOIN categories c ON p.category_id = c.id
ORDER BY c.name, p.price DESC;
```

### Когда использовать INNER JOIN?

- ✅ Когда нужны только записи с совпадениями в обеих таблицах
- ✅ Когда связь обязательна (каждый товар ДОЛЖЕН иметь категорию)
- ✅ По умолчанию, если не указано иное

---

## LEFT JOIN - левое внешнее соединение

### Что делает LEFT JOIN?

**LEFT JOIN** возвращает **все строки из левой таблицы** + совпадения из правой. Если совпадений нет — в правых столбцах будет NULL.

**Диаграмма Венна:**
```
  Таблица A      Таблица B
     ┌───┐         ┌───┐
     │███│         │   │
     │██┌┴─────────┴┐  │
     │██│ LEFT JOIN │  │  ← Вся левая + пересечение
     │██└┬─────────┬┘  │
     │███│         │   │
     └───┘         └───┘
```

### Синтаксис LEFT JOIN

```sql
SELECT столбцы
FROM таблица1
LEFT JOIN таблица2 ON таблица1.ключ = таблица2.ключ;

-- Или полное название
LEFT OUTER JOIN
```

### Примеры LEFT JOIN

**Пример 1: Все товары (с категорией и без)**

```sql
SELECT 
    p.name AS product_name,
    p.price,
    c.name AS category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id;
```

**Результат:**
```
      product_name      | price   | category_name
------------------------+---------+---------------
 iPhone 15              | 89990   | Электроника
 MacBook Pro            | 199990  | Электроника
 Диван                  | 45000   | Мебель
 Стол                   | 15000   | Мебель
 Футболка               | 1500    | Одежда
 Товар без категории    | 1000    | NULL          ← Появился!
```

**Пример 2: Найти товары БЕЗ категории**

```sql
SELECT 
    p.name AS product_name,
    p.price
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE c.id IS NULL;  -- Нет совпадения в categories
```

**Результат:**
```
      product_name      | price
------------------------+-------
 Товар без категории    | 1000
```

**Пример 3: Пользователи и их заказы**

```sql
-- Добавим пользователя без заказов
INSERT INTO users (name, email) 
VALUES ('Диана', 'diana@example.com');

-- Все пользователи (с заказами и без)
SELECT 
    u.name,
    o.id AS order_id,
    o.total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
ORDER BY u.name;
```

**Результат:**
```
  name  | order_id | total
--------+----------+-------
 Алиса  | 1        | 5000
 Алиса  | 2        | 3000
 Боб    | 3        | 7000
 Чарли  | NULL     | NULL   ← Нет заказов
 Диана  | NULL     | NULL   ← Нет заказов
```

**Пример 4: Пользователи БЕЗ заказов**

```sql
SELECT 
    u.name,
    u.email
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.id IS NULL;
```

**Результат:**
```
  name  |        email
--------+---------------------
 Чарли  | charlie@example.com
 Диана  | diana@example.com
```

### Когда использовать LEFT JOIN?

- ✅ Когда нужны ВСЕ записи из левой таблицы
- ✅ Для поиска записей без связей (WHERE правая_таблица.id IS NULL)
- ✅ Когда связь необязательна (товары могут быть без категории)

---

## RIGHT JOIN и FULL JOIN

### RIGHT JOIN - правое внешнее соединение

**RIGHT JOIN** — зеркало LEFT JOIN. Возвращает все строки из **правой** таблицы.

**Диаграмма Венна:**
```
  Таблица A      Таблица B
     ┌───┐         ┌───┐
     │   │         │███│
     │  ┌┴─────────┴┐██│
     │  │RIGHT JOIN │██│  ← Пересечение + вся правая
     │  └┬─────────┬┘██│
     │   │         │███│
     └───┘         └───┘
```

**Пример:**

```sql
-- Все категории (с товарами и без)
SELECT 
    c.name AS category_name,
    p.name AS product_name
FROM products p
RIGHT JOIN categories c ON p.category_id = c.id;
```

**Результат:**
```
 category_name | product_name
---------------+--------------
 Электроника   | iPhone 15
 Электроника   | MacBook Pro
 Мебель        | Диван
 Мебель        | Стол
 Одежда        | Футболка
```

**Примечание:** RIGHT JOIN используется редко. Обычно переписывают как LEFT JOIN:

```sql
-- То же самое через LEFT JOIN (более читабельно)
SELECT 
    c.name AS category_name,
    p.name AS product_name
FROM categories c
LEFT JOIN products p ON c.id = p.category_id;
```

### FULL JOIN - полное внешнее соединение

**FULL JOIN** возвращает **все строки из обеих таблиц**. Где нет совпадения — NULL.

**Диаграмма Венна:**
```
  Таблица A      Таблица B
     ┌───┐         ┌───┐
     │███│         │███│
     │██┌┴─────────┴┐██│
     │██│ FULL JOIN │██│  ← Всё!
     │██└┬─────────┬┘██│
     │███│         │███│
     └───┘         └───┘
```

**Пример:**

```sql
SELECT 
    c.name AS category_name,
    p.name AS product_name
FROM categories c
FULL OUTER JOIN products p ON c.id = p.category_id;
```

**Результат:**
```
 category_name |      product_name
---------------+------------------------
 Электроника   | iPhone 15
 Электроника   | MacBook Pro
 Мебель        | Диван
 Мебель        | Стол
 Одежда        | Футболка
 NULL          | Товар без категории    ← Товар без категории
```

**Когда использовать FULL JOIN:**
- Редко! Только когда нужны абсолютно все записи из обеих таблиц
- Для поиска несоответствий данных
- Для аудита и сравнения таблиц

### Сравнение типов JOIN

| JOIN | Возвращает | Использование |
|------|-----------|---------------|
| **INNER** | Только совпадения | По умолчанию (90% случаев) |
| **LEFT** | Все из левой + совпадения | Очень часто |
| **RIGHT** | Все из правой + совпадения | Редко (используйте LEFT) |
| **FULL** | Все из обеих | Очень редко |

---

## Множественные JOIN

### Объединение трех и более таблиц

**Синтаксис:**
```sql
SELECT столбцы
FROM таблица1
JOIN таблица2 ON условие1
JOIN таблица3 ON условие2
JOIN таблица4 ON условие3;
```

### Пример: Интернет-магазин

**Создадим структуру:**

```sql
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100)
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    order_date DATE,
    status VARCHAR(20)
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price DECIMAL(10, 2)
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    category VARCHAR(50)
);

-- Заполним данными
INSERT INTO customers (name, email) VALUES 
    ('Алиса', 'alice@example.com'),
    ('Боб', 'bob@example.com');

INSERT INTO products (name, category) VALUES 
    ('iPhone 15', 'Электроника'),
    ('AirPods Pro', 'Электроника'),
    ('Диван', 'Мебель');

INSERT INTO orders (customer_id, order_date, status) VALUES 
    (1, '2024-01-15', 'delivered'),
    (1, '2024-01-20', 'shipped'),
    (2, '2024-01-18', 'pending');

INSERT INTO order_items (order_id, product_id, quantity, price) VALUES 
    (1, 1, 1, 89990),  -- Заказ 1: iPhone
    (1, 2, 1, 24990),  -- Заказ 1: AirPods
    (2, 2, 2, 24990),  -- Заказ 2: 2x AirPods
    (3, 3, 1, 45000);  -- Заказ 3: Диван
```

**Запрос с тремя JOIN:**

```sql
-- Показать все заказы с товарами
SELECT 
    c.name AS customer_name,
    o.id AS order_id,
    o.order_date,
    o.status,
    p.name AS product_name,
    oi.quantity,
    oi.price
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
ORDER BY o.id, p.name;
```

**Результат:**
```
customer_name | order_id | order_date | status    | product_name | quantity | price
--------------+----------+------------+-----------+--------------+----------+--------
Алиса         | 1        | 2024-01-15 | delivered | AirPods Pro  | 1        | 24990
Алиса         | 1        | 2024-01-15 | delivered | iPhone 15    | 1        | 89990
Алиса         | 2        | 2024-01-20 | shipped   | AirPods Pro  | 2        | 24990
Боб           | 3        | 2024-01-18 | pending   | Диван        | 1        | 45000
```

**С агрегацией:**

```sql
-- Сумма каждого заказа
SELECT 
    c.name AS customer_name,
    o.id AS order_id,
    o.order_date,
    SUM(oi.quantity * oi.price) AS total
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN order_items oi ON o.id = oi.order_id
GROUP BY c.name, o.id, o.order_date
ORDER BY o.id;
```

**Результат:**
```
customer_name | order_id | order_date | total
--------------+----------+------------+--------
Алиса         | 1        | 2024-01-15 | 114980
Алиса         | 2        | 2024-01-20 | 49980
Боб           | 3        | 2024-01-18 | 45000
```

### Комбинирование INNER и LEFT JOIN

```sql
-- Все клиенты + их заказы (если есть) + товары в заказах
SELECT 
    c.name AS customer_name,
    o.id AS order_id,
    p.name AS product_name,
    oi.quantity
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id  -- Все клиенты
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
ORDER BY c.name, o.id;
```

**Важно:** Порядок JOIN имеет значение при использовании LEFT JOIN!

---

## Самосоединение (Self-Join)

### Что такое Self-Join?

**Self-Join** — это JOIN таблицы с самой собой. Используется для работы с иерархическими данными.

### Пример: Сотрудники и менеджеры

```sql
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    position VARCHAR(50),
    manager_id INTEGER  -- Ссылка на другого сотрудника
);

INSERT INTO employees (name, position, manager_id) VALUES 
    ('Анна Иванова', 'CEO', NULL),           -- id=1, нет менеджера
    ('Борис Петров', 'CTO', 1),              -- id=2, менеджер=CEO
    ('Виктор Сидоров', 'Senior Dev', 2),     -- id=3, менеджер=CTO
    ('Галина Смирнова', 'Junior Dev', 3),    -- id=4, менеджер=Senior Dev
    ('Дмитрий Кузнецов', 'CFO', 1),          -- id=5, менеджер=CEO
    ('Елена Новикова', 'Accountant', 5);     -- id=6, менеджер=CFO
```

**Показать сотрудников с их менеджерами:**

```sql
SELECT 
    e.name AS employee_name,
    e.position AS employee_position,
    m.name AS manager_name,
    m.position AS manager_position
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id
ORDER BY e.id;
```

**Результат:**
```
   employee_name   | employee_position |  manager_name  | manager_position
-------------------+-------------------+----------------+------------------
 Анна Иванова      | CEO               | NULL           | NULL
 Борис Петров      | CTO               | Анна Иванова   | CEO
 Виктор Сидоров    | Senior Dev        | Борис Петров   | CTO
 Галина Смирнова   | Junior Dev        | Виктор Сидоров | Senior Dev
 Дмитрий Кузнецов  | CFO               | Анна Иванова   | CEO
 Елена Новикова    | Accountant        | Дмитрий Кузнецов| CFO
```

**Найти всех подчиненных конкретного менеджера:**

```sql
-- Все подчиненные Анны Ивановой (прямые)
SELECT 
    e.name AS employee_name,
    e.position
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE m.name = 'Анна Иванова';
```

**Результат:**
```
   employee_name   | position
-------------------+----------
 Борис Петров      | CTO
 Дмитрий Кузнецов  | CFO
```

### Пример: Связанные товары

```sql
CREATE TABLE product_relations (
    product_id INTEGER,
    related_product_id INTEGER
);

-- iPhone связан с AirPods и MacBook
INSERT INTO product_relations VALUES 
    (1, 2),  -- iPhone → AirPods
    (1, 3),  -- iPhone → MacBook
    (2, 1);  -- AirPods → iPhone

-- Показать товары и их связанные товары
SELECT 
    p1.name AS product,
    p2.name AS related_product
FROM product_relations pr
JOIN products p1 ON pr.product_id = p1.id
JOIN products p2 ON pr.related_product_id = p2.id;
```

---

## CROSS JOIN и производительность

### CROSS JOIN - декартово произведение

**CROSS JOIN** возвращает все возможные комбинации строк из двух таблиц.

```sql
CREATE TABLE colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20)
);

CREATE TABLE sizes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(10)
);

INSERT INTO colors (name) VALUES ('Красный'), ('Синий'), ('Зеленый');
INSERT INTO sizes (name) VALUES ('S'), ('M'), ('L');

-- Все комбинации цвет×размер
SELECT 
    c.name AS color,
    s.name AS size
FROM colors c
CROSS JOIN sizes s;
```

**Результат (3 × 3 = 9 строк):**
```
  color   | size
----------+------
 Красный  | S
 Красный  | M
 Красный  | L
 Синий    | S
 Синий    | M
 Синий    | L
 Зеленый  | S
 Зеленый  | M
 Зеленый  | L
```

**Когда использовать:**
- Генерация всех комбинаций (товары × варианты)
- Создание календарей (дни × часы)
- Тестовые данные

**Осторожно:** CROSS JOIN может создать огромное количество строк! (1000 × 1000 = 1,000,000)

### Оптимизация JOIN запросов

**1. Используйте индексы на ключах JOIN:**

```sql
-- Индекс на внешний ключ
CREATE INDEX idx_products_category ON products(category_id);

-- Теперь JOIN работает быстрее
SELECT p.name, c.name
FROM products p
JOIN categories c ON p.category_id = c.id;
```

**2. Фильтруйте до JOIN, если возможно:**

```sql
-- ❌ МЕДЛЕННО: JOIN всех, потом фильтрация
SELECT p.name, c.name
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.price > 50000;

-- ✅ БЫСТРЕЕ: сначала фильтрация, потом JOIN меньшего набора
-- (в данном случае разницы нет, но для больших таблиц важно)
```

**3. Используйте EXPLAIN для анализа:**

```sql
EXPLAIN ANALYZE
SELECT p.name, c.name
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE c.name = 'Электроника';
```

**4. Избегайте лишних JOIN:**

```sql
-- ❌ ПЛОХО: JOIN, который не нужен
SELECT p.name
FROM products p
JOIN categories c ON p.category_id = c.id
WHERE p.price > 1000;

-- ✅ ХОРОШО: если category не используется, не JOIN-ить
SELECT name FROM products WHERE price > 1000;
```

---

## Практическое задание

### Задание 1: База данных блога (обязательно)

Создайте систему блога и напишите запросы с JOIN.

```sql
CREATE DATABASE blog_system;
\c blog_system

-- Пользователи
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Категории
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- Посты
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id),
    category_id INTEGER REFERENCES categories(id),
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    views INTEGER DEFAULT 0
);

-- Комментарии
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Лайки
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Заполнение данными
INSERT INTO users (username, email) VALUES 
    ('alice', 'alice@blog.com'),
    ('bob', 'bob@blog.com'),
    ('charlie', 'charlie@blog.com'),
    ('diana', 'diana@blog.com');

INSERT INTO categories (name, description) VALUES 
    ('Технологии', 'Статьи о технологиях'),
    ('Путешествия', 'Рассказы о путешествиях'),
    ('Кулинария', 'Рецепты и советы');

INSERT INTO posts (title, content, author_id, category_id, views) VALUES 
    ('Введение в PostgreSQL', 'PostgreSQL - мощная СУБД...', 1, 1, 150),
    ('Поездка в Японию', 'Мое путешествие в Токио...', 2, 2, 320),
    ('Лучший борщ', 'Рецепт традиционного борща...', 3, 3, 85),
    ('Docker для начинающих', 'Как начать работать с Docker...', 1, 1, 210),
    ('Париж зимой', 'Что посмотреть в Париже зимой...', 2, 2, 180);

INSERT INTO comments (post_id, user_id, content) VALUES 
    (1, 2, 'Отличная статья!'),
    (1, 3, 'Очень полезно, спасибо'),
    (2, 1, 'Хочу тоже в Японию!'),
    (2, 4, 'Красивые фотографии'),
    (3, 1, 'Попробую приготовить'),
    (4, 3, 'Docker действительно полезен');

INSERT INTO likes (post_id, user_id) VALUES 
    (1, 2), (1, 3), (1, 4),  -- 3 лайка на пост 1
    (2, 1), (2, 3),          -- 2 лайка на пост 2
    (3, 1),                  -- 1 лайк на пост 3
    (4, 2), (4, 3), (4, 4),  -- 3 лайка на пост 4
    (5, 1), (5, 4);          -- 2 лайка на пост 5
```

**Теперь напишите следующие запросы:**

**1. Все посты с авторами и категориями:**
```sql
SELECT 
    p.title,
    u.username AS author,
    c.name AS category,
    p.views,
    p.published_at
FROM posts p
JOIN users u ON p.author_id = u.id
JOIN categories c ON p.category_id = c.id
ORDER BY p.published_at DESC;
```

**2. Посты с количеством комментариев:**
```sql
SELECT 
    p.title,
    u.username AS author,
    COUNT(cm.id) AS comment_count
FROM posts p
JOIN users u ON p.author_id = u.id
LEFT JOIN comments cm ON p.id = cm.post_id
GROUP BY p.id, p.title, u.username
ORDER BY comment_count DESC;
```

**3. Посты с количеством лайков:**
```sql
SELECT 
    p.title,
    u.username AS author,
    COUNT(l.id) AS likes_count
FROM posts p
JOIN users u ON p.author_id = u.id
LEFT JOIN likes l ON p.id = l.post_id
GROUP BY p.id, p.title, u.username
ORDER BY likes_count DESC;
```

**4. Популярные посты (с лайками и комментариями):**
```sql
SELECT 
    p.title,
    u.username AS author,
    c.name AS category,
    p.views,
    COUNT(DISTINCT l.id) AS likes,
    COUNT(DISTINCT cm.id) AS comments
FROM posts p
JOIN users u ON p.author_id = u.id
JOIN categories c ON p.category_id = c.id
LEFT JOIN likes l ON p.id = l.post_id
LEFT JOIN comments cm ON p.id = cm.post_id
GROUP BY p.id, p.title, u.username, c.name, p.views
ORDER BY likes DESC, comments DESC;
```

**5. Все комментарии с информацией о посте и авторе:**
```sql
SELECT 
    p.title AS post_title,
    p_author.username AS post_author,
    c.content AS comment,
    c_author.username AS comment_author,
    c.created_at
FROM comments c
JOIN posts p ON c.post_id = p.id
JOIN users p_author ON p.author_id = p_author.id
JOIN users c_author ON c.user_id = c_author.id
ORDER BY c.created_at DESC;
```

**6. Пользователи без постов:**
```sql
SELECT 
    u.username,
    u.email
FROM users u
LEFT JOIN posts p ON u.id = p.author_id
WHERE p.id IS NULL;
```

**7. Самые активные авторы:**
```sql
SELECT 
    u.username,
    COUNT(p.id) AS posts_count,
    SUM(p.views) AS total_views,
    COUNT(DISTINCT l.id) AS total_likes
FROM users u
LEFT JOIN posts p ON u.id = p.author_id
LEFT JOIN likes l ON p.id = l.post_id
GROUP BY u.id, u.username
ORDER BY posts_count DESC;
```

**8. Посты категории с наибольшим количеством статей:**
```sql
SELECT 
    c.name AS category,
    p.title,
    u.username AS author
FROM categories c
JOIN posts p ON c.id = p.category_id
JOIN users u ON p.author_id = u.id
WHERE c.id = (
    SELECT category_id 
    FROM posts 
    GROUP BY category_id 
    ORDER BY COUNT(*) DESC 
    LIMIT 1
)
ORDER BY p.title;
```

---

### Задание 2: Аналитические запросы (обязательно)

**1. Топ-3 самых комментируемых поста:**
```sql
SELECT 
    p.title,
    u.username AS author,
    COUNT(c.id) AS comment_count
FROM posts p
JOIN users u ON p.author_id = u.id
LEFT JOIN comments c ON p.id = c.post_id
GROUP BY p.id, p.title, u.username
ORDER BY comment_count DESC
LIMIT 3;
```

**2. Категории с количеством постов и средним количеством просмотров:**
```sql
SELECT 
    c.name AS category,
    COUNT(p.id) AS posts_count,
    COALESCE(ROUND(AVG(p.views), 2), 0) AS avg_views
FROM categories c
LEFT JOIN posts p ON c.id = p.category_id
GROUP BY c.id, c.name
ORDER BY posts_count DESC;
```

**3. Пользователи, которые лайкнули посты других пользователей:**
```sql
SELECT DISTINCT
    u.username AS user_who_liked,
    p_author.username AS post_author
FROM likes l
JOIN users u ON l.user_id = u.id
JOIN posts p ON l.post_id = p.id
JOIN users p_author ON p.author_id = p_author.id
WHERE u.id != p_author.id  -- Только чужие посты
ORDER BY u.username;
```

**4. Посты без комментариев:**
```sql
SELECT 
    p.title,
    u.username AS author,
    p.published_at
FROM posts p
JOIN users u ON p.author_id = u.id
LEFT JOIN comments c ON p.id = c.post_id
WHERE c.id IS NULL
ORDER BY p.published_at DESC;
```

**5. Самые активные комментаторы:**
```sql
SELECT 
    u.username,
    COUNT(c.id) AS comments_count,
    MIN(c.created_at) AS first_comment,
    MAX(c.created_at) AS last_comment
FROM users u
LEFT JOIN comments c ON u.id = c.user_id
GROUP BY u.id, u.username
ORDER BY comments_count DESC;
```

---

### Задание 3: Сложные сценарии (дополнительно)

**1. Рекомендации постов (посты той же категории, что пользователь лайкал):**
```sql
-- Рекомендации для пользователя alice (id=1)
SELECT DISTINCT
    p.title,
    p_author.username AS author,
    c.name AS category
FROM posts p
JOIN users p_author ON p.author_id = p_author.id
JOIN categories c ON p.category_id = c.id
WHERE c.id IN (
    -- Категории постов, которые лайкал пользователь
    SELECT DISTINCT p2.category_id
    FROM likes l
    JOIN posts p2 ON l.post_id = p2.id
    WHERE l.user_id = 1
)
AND p.id NOT IN (
    -- Исключить посты, которые уже лайкал
    SELECT post_id FROM likes WHERE user_id = 1
)
ORDER BY p.title;
```

**2. Активность по дням (сколько постов и комментариев каждый день):**
```sql
SELECT 
    DATE(published_at) AS date,
    COUNT(*) AS posts_count
FROM posts
GROUP BY DATE(published_at)
UNION ALL
SELECT 
    DATE(created_at) AS date,
    COUNT(*) AS comments_count
FROM comments
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**3. "Влиятельные" пользователи (много постов, лайков и комментариев):**
```sql
SELECT 
    u.username,
    COUNT(DISTINCT p.id) AS posts_written,
    COUNT(DISTINCT l.id) AS likes_given,
    COUNT(DISTINCT c.id) AS comments_written,
    COUNT(DISTINCT p.id) + COUNT(DISTINCT l.id) + COUNT(DISTINCT c.id) AS activity_score
FROM users u
LEFT JOIN posts p ON u.id = p.author_id
LEFT JOIN likes l ON u.id = l.user_id
LEFT JOIN comments c ON u.id = c.user_id
GROUP BY u.id, u.username
ORDER BY activity_score DESC;
```

---

### Задание 4: Создайте свою систему (творческое)

Спроектируйте базу данных для одной из систем и напишите минимум 10 запросов с JOIN:

**Вариант A: Кинотеатр**
- Фильмы
- Сеансы
- Залы
- Билеты
- Клиенты

**Вариант B: Фитнес-клуб**
- Клиенты
- Тренеры
- Тренировки
- Расписание
- Абонементы

**Вариант C: Университет**
- Студенты
- Преподаватели
- Курсы
- Занятия
- Оценки
- Факультеты

---

## Контрольные вопросы

Проверьте себя:

1. Что делает JOIN и зачем он нужен?
2. В чем разница между INNER JOIN и LEFT JOIN?
3. Когда использовать LEFT JOIN вместо INNER JOIN?
4. Что вернет LEFT JOIN, если в правой таблице нет совпадений?
5. Можно ли объединить более двух таблиц в одном запросе?
6. Что такое Self-Join и когда его использовать?
7. Что делает CROSS JOIN?
8. Почему важно использовать псевдонимы таблиц?
9. Как найти записи, у которых НЕТ связанных записей?
10. В чем разница между RIGHT JOIN и LEFT JOIN?
11. Что такое декартово произведение?
12. Как оптимизировать запросы с JOIN?

<details>
<summary>Ответы</summary>

1. JOIN объединяет строки из нескольких таблиц на основе условия (обычно равенство ключей).
2. INNER возвращает только совпадения, LEFT возвращает все из левой + совпадения.
3. Когда нужны ВСЕ записи из левой таблицы, даже без совпадений в правой.
4. NULL в столбцах правой таблицы.
5. Да, можно объединять сколько угодно таблиц.
6. JOIN таблицы с самой собой. Для иерархических данных (сотрудники-менеджеры).
7. Возвращает все возможные комбинации строк (декартово произведение).
8. Для краткости и избежания конфликтов имен столбцов.
9. LEFT JOIN + WHERE правая_таблица.id IS NULL.
10. RIGHT возвращает все из правой, LEFT — все из левой. RIGHT редко используется.
11. Все возможные комбинации строк из двух таблиц.
12. Индексы на ключах JOIN, избегать лишних JOIN, фильтрация до JOIN.
</details>

---

## Типичные ошибки и их решения

### Ошибка 1: Забыли условие ON

```sql
-- ❌ ОШИБКА: нет условия ON
SELECT * FROM orders JOIN users;
-- ERROR: syntax error at or near ";"

-- ✅ ПРАВИЛЬНО:
SELECT * FROM orders JOIN users ON orders.user_id = users.id;
```

### Ошибка 2: Неоднозначность столбцов

```sql
-- ❌ ОШИБКА: столбец id есть в обеих таблицах
SELECT id, name FROM orders JOIN users ON orders.user_id = users.id;
-- ERROR: column reference "id" is ambiguous

-- ✅ ПРАВИЛЬНО: указать таблицу
SELECT orders.id, users.name 
FROM orders 
JOIN users ON orders.user_id = users.id;

-- ✅ ЕЩЕ ЛУЧШЕ: использовать псевдонимы
SELECT o.id, u.name 
FROM orders o 
JOIN users u ON o.user_id = u.id;
```

### Ошибка 3: Неправильный порядок LEFT JOIN

```sql
-- ❌ ПЛОХО: хотим всех пользователей, но пишем наоборот
SELECT u.name, o.id 
FROM orders o 
LEFT JOIN users u ON o.user_id = u.id;
-- Получим все заказы + пользователей (если есть)

-- ✅ ПРАВИЛЬНО: если нужны все пользователи
SELECT u.name, o.id 
FROM users u 
LEFT JOIN orders o ON u.id = o.user_id;
```

### Ошибка 4: Дублирование строк при множественных JOIN

```sql
-- Проблема: каждый JOIN может умножать количество строк
SELECT 
    p.title,
    COUNT(c.id) AS comments,  -- Может считать неправильно!
    COUNT(l.id) AS likes      -- Может считать неправильно!
FROM posts p
LEFT JOIN comments c ON p.id = c.post_id
LEFT JOIN likes l ON p.id = l.post_id
GROUP BY p.id, p.title;

-- ✅ РЕШЕНИЕ: COUNT(DISTINCT ...)
SELECT 
    p.title,
    COUNT(DISTINCT c.id) AS comments,
    COUNT(DISTINCT l.id) AS likes
FROM posts p
LEFT JOIN comments c ON p.id = c.post_id
LEFT JOIN likes l ON p.id = l.post_id
GROUP BY p.id, p.title;
```

### Ошибка 5: Использование WHERE вместо ON в LEFT JOIN

```sql
-- ❌ НЕПРАВИЛЬНО: WHERE превращает LEFT JOIN в INNER JOIN
SELECT u.name, o.id
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.status = 'paid';
-- Пользователи без заказов исчезнут!

-- ✅ ПРАВИЛЬНО: условие в ON
SELECT u.name, o.id
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'paid';
-- Пользователи без заказов останутся
```

---

## Шпаргалка по JOIN

```sql
-- INNER JOIN (по умолчанию)
SELECT * FROM table1
JOIN table2 ON table1.id = table2.foreign_id;

-- LEFT JOIN (все из левой)
SELECT * FROM table1
LEFT JOIN table2 ON table1.id = table2.foreign_id;

-- RIGHT JOIN (все из правой)
SELECT * FROM table1
RIGHT JOIN table2 ON table1.id = table2.foreign_id;

-- FULL JOIN (все из обеих)
SELECT * FROM table1
FULL OUTER JOIN table2 ON table1.id = table2.foreign_id;

-- CROSS JOIN (декартово произведение)
SELECT * FROM table1 CROSS JOIN table2;

-- Множественные JOIN
SELECT * FROM table1
JOIN table2 ON table1.id = table2.t1_id
JOIN table3 ON table2.id = table3.t2_id;

-- Self-Join
SELECT e.name, m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- Найти записи БЕЗ связей
SELECT * FROM table1
LEFT JOIN table2 ON table1.id = table2.foreign_id
WHERE table2.id IS NULL;

-- С псевдонимами и агрегацией
SELECT 
    t1.name,
    COUNT(t2.id) AS count
FROM table1 t1
LEFT JOIN table2 t2 ON t1.id = t2.t1_id
GROUP BY t1.id, t1.name;
```

---

## Визуальная шпаргалка JOIN

```
INNER JOIN              LEFT JOIN               RIGHT JOIN
    A  B                   A  B                    A  B
   ┌─┬─┐                 ┌───┬─┐                 ┌─┬───┐
   │ │█│                 │███│█│                 │█│███│
   └─┴─┘                 └───┴─┘                 └─┴───┘
   Только                Все A +                 Все B +
   пересечение           пересечение             пересечение

FULL JOIN               CROSS JOIN              
    A  B                   A  B
   ┌───┬───┐              ┌───┬───┐
   │███│███│              │█A1│█B1│
   └───┴───┘              │█A1│█B2│
   Все из                 │█A2│█B1│
   обеих                  │█A2│█B2│
                          └───┴───┘
                          Все комбинации
```

---

## Практические паттерны JOIN

### Паттерн 1: Подсчет связанных записей

```sql
-- Сколько заказов у каждого клиента?
SELECT 
    c.name,
    COUNT(o.id) AS order_count
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name
ORDER BY order_count DESC;
```

### Паттерн 2: Последняя связанная запись

```sql
-- Последний заказ каждого клиента
SELECT DISTINCT ON (c.id)
    c.name,
    o.order_date,
    o.total
FROM customers c
JOIN orders o ON c.id = o.customer_id
ORDER BY c.id, o.order_date DESC;
```

### Паттерн 3: Агрегация через промежуточную таблицу

```sql
-- Общая сумма заказов каждого клиента
SELECT 
    c.name,
    COALESCE(SUM(oi.quantity * oi.price), 0) AS total_spent
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY c.id, c.name
ORDER BY total_spent DESC;
```

### Паттерн 4: Фильтрация через связанную таблицу

```sql
-- Клиенты, купившие товары категории "Электроника"
SELECT DISTINCT
    c.name,
    c.email
FROM customers c
JOIN orders o ON c.id = o.customer_id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
JOIN categories cat ON p.category_id = cat.id
WHERE cat.name = 'Электроника';
```

---

## Полезные ресурсы

**Визуализация JOIN:**
- Visual JOIN (sql-joins.leopard.in.ua)
- Diagrammatic Explanation of SQL Joins

**Практика:**
- SQL Zoo - JOIN Tutorial
- LeetCode Database Problems
- HackerRank SQL (JOIN section)

**Документация:**
- https://www.postgresql.org/docs/current/queries-table-expressions.html
- https://www.postgresql.org/docs/current/tutorial-join.html
