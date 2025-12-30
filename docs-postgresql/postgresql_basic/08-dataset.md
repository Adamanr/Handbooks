---
sidebar_position: 8
description: "В этой главе мы изучим функции для работы с наборами данных."
---

# Работа с наборами данных

## Агрегатные функции

### Что такое агрегатные функции?

**Агрегатные функции** — это функции, которые обрабатывают набор строк и возвращают одно значение.

**Основные агрегатные функции:**

| Функция | Описание | Пример результата |
|---------|----------|-------------------|
| `COUNT()` | Количество строк | 150 |
| `SUM()` | Сумма значений | 250000.00 |
| `AVG()` | Среднее значение | 5234.50 |
| `MIN()` | Минимальное значение | 100.00 |
| `MAX()` | Максимальное значение | 99999.00 |

### Подготовка данных

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    product VARCHAR(100),
    quantity INTEGER,
    price DECIMAL(10, 2),
    order_date DATE,
    status VARCHAR(20)
);

INSERT INTO orders (customer_id, product, quantity, price, order_date, status) VALUES 
    (1, 'iPhone 15', 1, 89990, '2024-01-15', 'delivered'),
    (1, 'AirPods Pro', 1, 24990, '2024-01-15', 'delivered'),
    (2, 'MacBook Pro', 1, 199990, '2024-01-18', 'delivered'),
    (3, 'iPad Air', 1, 64990, '2024-01-20', 'shipped'),
    (2, 'Magic Mouse', 2, 8990, '2024-01-22', 'delivered'),
    (4, 'iPhone 15', 1, 89990, '2024-01-25', 'pending'),
    (1, 'USB-C Cable', 3, 1990, '2024-01-28', 'delivered'),
    (3, 'Apple Watch', 1, 39990, '2024-02-01', 'cancelled');
```

### COUNT — подсчет строк

```sql
-- Общее количество заказов
SELECT COUNT(*) AS total_orders
FROM orders;
-- Результат: 8

-- Количество доставленных заказов
SELECT COUNT(*) AS delivered_orders
FROM orders
WHERE status = 'delivered';
-- Результат: 5

-- Количество уникальных клиентов
SELECT COUNT(DISTINCT customer_id) AS unique_customers
FROM orders;
-- Результат: 4

-- Количество заказов с отменой
SELECT COUNT(*) AS cancelled
FROM orders
WHERE status = 'cancelled';
-- Результат: 1
```

**Важно:** `COUNT(*)` считает все строки, `COUNT(column)` игнорирует NULL.

```sql
-- Разница между COUNT(*) и COUNT(column)
CREATE TABLE test (id INT, value INT);
INSERT INTO test VALUES (1, 100), (2, NULL), (3, 200);

SELECT 
    COUNT(*) AS count_all,        -- 3 (все строки)
    COUNT(value) AS count_value   -- 2 (только НЕ-NULL)
FROM test;
```

### SUM — сумма значений

```sql
-- Общая сумма всех заказов
SELECT SUM(price * quantity) AS total_revenue
FROM orders;
-- Результат: 485890.00

-- Сумма доставленных заказов
SELECT SUM(price * quantity) AS delivered_revenue
FROM orders
WHERE status = 'delivered';
-- Результат: 345850.00

-- Сумма по конкретному клиенту
SELECT SUM(price * quantity) AS customer_total
FROM orders
WHERE customer_id = 1;
-- Результат: 120950.00
```

### AVG — среднее значение

```sql
-- Средняя стоимость заказа
SELECT AVG(price * quantity) AS avg_order_value
FROM orders;
-- Результат: 60736.25

-- Средняя стоимость доставленных заказов
SELECT AVG(price * quantity) AS avg_delivered
FROM orders
WHERE status = 'delivered';
-- Результат: 69170.00

-- Округление среднего
SELECT ROUND(AVG(price * quantity), 2) AS avg_rounded
FROM orders;
-- Результат: 60736.25
```

### MIN и MAX — минимум и максимум

```sql
-- Самый дешевый и самый дорогой заказ
SELECT 
    MIN(price * quantity) AS cheapest_order,
    MAX(price * quantity) AS most_expensive_order
FROM orders;
-- Результат: 5970.00 | 199990.00

-- Даты первого и последнего заказа
SELECT 
    MIN(order_date) AS first_order,
    MAX(order_date) AS last_order
FROM orders;
-- Результат: 2024-01-15 | 2024-02-01

-- Диапазон дат
SELECT 
    MAX(order_date) - MIN(order_date) AS date_range_days
FROM orders;
-- Результат: 17 дней
```

### Комбинирование агрегатных функций

```sql
-- Полная статистика заказов
SELECT 
    COUNT(*) AS total_orders,
    COUNT(DISTINCT customer_id) AS unique_customers,
    SUM(price * quantity) AS total_revenue,
    AVG(price * quantity) AS avg_order_value,
    MIN(price * quantity) AS min_order,
    MAX(price * quantity) AS max_order
FROM orders
WHERE status = 'delivered';
```

**Результат:**
```
total_orders | unique_customers | total_revenue | avg_order_value | min_order | max_order
-------------+------------------+---------------+-----------------+-----------+-----------
     5       |         3        |   345850.00   |    69170.00     |  5970.00  | 199990.00
```

---

## GROUP BY — группировка данных

### Что делает GROUP BY?

**GROUP BY** группирует строки с одинаковыми значениями и позволяет применять агрегатные функции к каждой группе.

**Аналогия:** Как разложить яблоки по корзинам (красные, зеленые, желтые) и посчитать в каждой корзине.

### Базовый синтаксис

```sql
SELECT 
    столбец_группировки,
    агрегатная_функция(столбец)
FROM таблица
GROUP BY столбец_группировки;
```

### Примеры GROUP BY

**Пример 1: Количество заказов по каждому клиенту**

```sql
SELECT 
    customer_id,
    COUNT(*) AS order_count,
    SUM(price * quantity) AS total_spent
FROM orders
GROUP BY customer_id
ORDER BY total_spent DESC;
```

**Результат:**
```
customer_id | order_count | total_spent
------------+-------------+-------------
     2      |      2      |  217980.00
     1      |      3      |  120950.00
     4      |      1      |   89990.00
     3      |      2      |  104980.00
```

**Пример 2: Статистика по статусам заказов**

```sql
SELECT 
    status,
    COUNT(*) AS count,
    SUM(price * quantity) AS total_amount,
    ROUND(AVG(price * quantity), 2) AS avg_amount
FROM orders
GROUP BY status
ORDER BY count DESC;
```

**Результат:**
```
  status   | count | total_amount | avg_amount
-----------+-------+--------------+------------
 delivered |   5   |   345850.00  |  69170.00
 pending   |   1   |    89990.00  |  89990.00
 shipped   |   1   |    64990.00  |  64990.00
 cancelled |   1   |    39990.00  |  39990.00
```

**Пример 3: Группировка по датам**

```sql
-- Заказы по дням
SELECT 
    order_date,
    COUNT(*) AS orders_count,
    SUM(price * quantity) AS daily_revenue
FROM orders
GROUP BY order_date
ORDER BY order_date;

-- Заказы по месяцам
SELECT 
    DATE_TRUNC('month', order_date) AS month,
    COUNT(*) AS orders_count,
    SUM(price * quantity) AS monthly_revenue
FROM orders
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month;
```

> **DATE_TRUNC** — функция в PostgreSQL, которая обрезает дату или время до указанной точности. Это полезно для работы с данными, связанными с временем, — функция позволяет группировать или агрегировать данные на разных уровнях времени. 


### GROUP BY с несколькими столбцами

```sql
-- Статистика по клиентам и статусам
SELECT 
    customer_id,
    status,
    COUNT(*) AS count,
    SUM(price * quantity) AS total
FROM orders
GROUP BY customer_id, status
ORDER BY customer_id, status;
```

**Результат:**
```
customer_id |  status   | count |   total
------------+-----------+-------+------------
     1      | delivered |   3   |  120950.00
     2      | delivered |   2   |  217980.00
     3      | cancelled |   1   |   39990.00
     3      | shipped   |   1   |   64990.00
     4      | pending   |   1   |   89990.00
```

### Правила GROUP BY

**Важно:** Все столбцы в SELECT (кроме агрегатных функций) должны быть в GROUP BY!

```sql
-- ❌ ОШИБКА: product не в GROUP BY
SELECT 
    customer_id,
    product,           -- Ошибка!
    COUNT(*) AS count
FROM orders
GROUP BY customer_id;
-- ERROR: column "product" must appear in GROUP BY clause

-- ✅ ПРАВИЛЬНО: все неагрегатные столбцы в GROUP BY
SELECT 
    customer_id,
    product,
    COUNT(*) AS count
FROM orders
GROUP BY customer_id, product;
```

### GROUP BY с WHERE

WHERE фильтрует строки **ДО** группировки:

```sql
-- Статистика только по доставленным заказам
SELECT 
    customer_id,
    COUNT(*) AS delivered_count,
    SUM(price * quantity) AS delivered_total
FROM orders
WHERE status = 'delivered'  -- Фильтр ДО группировки
GROUP BY customer_id;
```

---

## HAVING — фильтрация групп

### Разница между WHERE и HAVING

- **WHERE** фильтрует строки ДО группировки
- **HAVING** фильтрует группы ПОСЛЕ группировки

```sql
-- WHERE: фильтр строк
SELECT customer_id, COUNT(*) 
FROM orders 
WHERE price > 10000  -- Фильтр на уровне строк
GROUP BY customer_id;

-- HAVING: фильтр групп
SELECT customer_id, COUNT(*) AS order_count
FROM orders 
GROUP BY customer_id
HAVING COUNT(*) > 1;  -- Фильтр на уровне групп
```

### Примеры HAVING

**Пример 1: Клиенты с более чем 1 заказом**

```sql
SELECT 
    customer_id,
    COUNT(*) AS order_count,
    SUM(price * quantity) AS total_spent
FROM orders
GROUP BY customer_id
HAVING COUNT(*) > 1
ORDER BY order_count DESC;
```

**Результат:**
```
customer_id | order_count | total_spent
------------+-------------+-------------
     1      |      3      |  120950.00
     2      |      2      |  217980.00
     3      |      2      |  104980.00
```

**Пример 2: Клиенты, потратившие больше 100000**

```sql
SELECT 
    customer_id,
    COUNT(*) AS order_count,
    SUM(price * quantity) AS total_spent
FROM orders
GROUP BY customer_id
HAVING SUM(price * quantity) > 100000
ORDER BY total_spent DESC;
```

**Пример 3: Комбинирование WHERE и HAVING**

```sql
-- Клиенты с более чем 1 доставленным заказом
SELECT 
    customer_id,
    COUNT(*) AS delivered_count,
    SUM(price * quantity) AS total
FROM orders
WHERE status = 'delivered'  -- WHERE: до группировки
GROUP BY customer_id
HAVING COUNT(*) > 1         -- HAVING: после группировки
ORDER BY total DESC;
```

**Результат:**
```
customer_id | delivered_count |   total
------------+-----------------+------------
     1      |        3        |  120950.00
     2      |        2        |  217980.00
```

**Пример 4: Средняя стоимость заказа**

```sql
-- Клиенты со средней стоимостью заказа > 50000
SELECT 
    customer_id,
    COUNT(*) AS order_count,
    ROUND(AVG(price * quantity), 2) AS avg_order_value,
    SUM(price * quantity) AS total_spent
FROM orders
GROUP BY customer_id
HAVING AVG(price * quantity) > 50000
ORDER BY avg_order_value DESC;
```

### Порядок выполнения SQL

Важно понимать порядок:

```
1. FROM    - выбор таблиц
2. WHERE   - фильтрация строк
3. GROUP BY - группировка
4. HAVING  - фильтрация групп
5. SELECT  - выбор столбцов
6. ORDER BY - сортировка
7. LIMIT   - ограничение
```

**Пример:**

```sql
SELECT 
    customer_id,
    COUNT(*) AS order_count
FROM orders
WHERE status IN ('delivered', 'shipped')  -- 2. Фильтр строк
GROUP BY customer_id                       -- 3. Группировка
HAVING COUNT(*) >= 2                       -- 4. Фильтр групп
ORDER BY order_count DESC                  -- 6. Сортировка
LIMIT 5;                                   -- 7. Ограничение
```

---

## UNION, INTERSECT, EXCEPT

### UNION — объединение результатов

**UNION** объединяет результаты нескольких SELECT в один набор данных.

**Синтаксис:**

```sql
SELECT столбцы FROM таблица1
UNION
SELECT столбцы FROM таблица2;
```

**Правила:**
- Одинаковое количество столбцов
- Совместимые типы данных
- UNION удаляет дубликаты, UNION ALL оставляет

### Примеры UNION

**Пример 1: Объединение активных и завершенных заказов**

```sql
-- Активные заказы
SELECT 
    id,
    customer_id,
    'active' AS order_type,
    price * quantity AS amount
FROM orders
WHERE status IN ('pending', 'shipped')

UNION

-- Завершенные заказы
SELECT 
    id,
    customer_id,
    'completed' AS order_type,
    price * quantity AS amount
FROM orders
WHERE status = 'delivered'

ORDER BY customer_id, id;
```

**Пример 2: UNION ALL (с дубликатами)**

```sql
-- Создадим таблицу клиентов 2023 и 2024
CREATE TABLE customers_2023 (id INT, name VARCHAR(100));
CREATE TABLE customers_2024 (id INT, name VARCHAR(100));

INSERT INTO customers_2023 VALUES (1, 'Alice'), (2, 'Bob');
INSERT INTO customers_2024 VALUES (2, 'Bob'), (3, 'Charlie');

-- UNION - без дубликатов
SELECT name FROM customers_2023
UNION
SELECT name FROM customers_2024;
-- Результат: Alice, Bob, Charlie (Bob один раз)

-- UNION ALL - с дубликатами
SELECT name FROM customers_2023
UNION ALL
SELECT name FROM customers_2024;
-- Результат: Alice, Bob, Bob, Charlie (Bob два раза)
```

**Пример 3: Объединение статистики**

```sql
SELECT 
    'Delivered' AS status_group,
    COUNT(*) AS count,
    SUM(price * quantity) AS total
FROM orders
WHERE status = 'delivered'

UNION ALL

SELECT 
    'Other',
    COUNT(*),
    SUM(price * quantity)
FROM orders
WHERE status != 'delivered';
```

### INTERSECT — пересечение

**INTERSECT** возвращает только те строки, которые есть в обоих результатах.

```sql
-- Клиенты, которые делали заказы и в 2023, и в 2024
SELECT customer_id FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2023
INTERSECT
SELECT customer_id FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2024;
```

### EXCEPT — разность

**EXCEPT** возвращает строки из первого результата, которых нет во втором.

```sql
-- Клиенты, которые делали заказы в 2023, но не в 2024
SELECT customer_id FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2023
EXCEPT
SELECT customer_id FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2024;
```

---

## Подзапросы (Subqueries)

### Что такое подзапрос?

**Подзапрос** — это SELECT внутри другого SELECT.

### Типы подзапросов

1. **Скалярный** — возвращает одно значение
2. **Строковый** — возвращает одну строку
3. **Табличный** — возвращает таблицу
4. **Коррелированный** — зависит от внешнего запроса

### Подзапросы в WHERE

**Пример 1: Заказы дороже среднего**

```sql
SELECT 
    id,
    customer_id,
    price * quantity AS amount
FROM orders
WHERE price * quantity > (
    SELECT AVG(price * quantity) FROM orders
)
ORDER BY amount DESC;
```

**Пример 2: IN с подзапросом**

```sql
-- Клиенты, которые делали заказы дороже 50000
SELECT DISTINCT customer_id
FROM orders
WHERE customer_id IN (
    SELECT customer_id 
    FROM orders 
    WHERE price * quantity > 50000
);
```

**Пример 3: EXISTS**

```sql
-- Клиенты, у которых есть хотя бы один доставленный заказ
SELECT DISTINCT customer_id
FROM orders o1
WHERE EXISTS (
    SELECT 1 
    FROM orders o2 
    WHERE o2.customer_id = o1.customer_id 
      AND o2.status = 'delivered'
);
```

### Подзапросы в SELECT

```sql
-- Для каждого заказа показать процент от общей выручки
SELECT 
    id,
    customer_id,
    price * quantity AS amount,
    ROUND(
        (price * quantity) * 100.0 / (SELECT SUM(price * quantity) FROM orders),
        2
    ) AS percentage_of_total
FROM orders
ORDER BY amount DESC;
```

### Подзапросы в FROM (производные таблицы)

```sql
-- Статистика по активным клиентам
SELECT 
    active_customers.customer_id,
    active_customers.order_count,
    active_customers.total_spent
FROM (
    SELECT 
        customer_id,
        COUNT(*) AS order_count,
        SUM(price * quantity) AS total_spent
    FROM orders
    GROUP BY customer_id
) AS active_customers
WHERE active_customers.order_count > 1
ORDER BY active_customers.total_spent DESC;
```

### Коррелированные подзапросы

Подзапрос, который ссылается на внешний запрос:

```sql
-- Для каждого клиента показать его максимальный заказ
SELECT 
    o1.customer_id,
    o1.id AS order_id,
    o1.price * o1.quantity AS amount
FROM orders o1
WHERE o1.price * o1.quantity = (
    SELECT MAX(o2.price * o2.quantity)
    FROM orders o2
    WHERE o2.customer_id = o1.customer_id
)
ORDER BY o1.customer_id;
```

---

## Оконные функции (Window Functions)

### Что такое оконные функции?

**Оконные функции** позволяют выполнять вычисления по набору строк, связанных с текущей строкой, БЕЗ группировки.

**Отличие от GROUP BY:**
- GROUP BY сворачивает строки в одну
- Оконные функции сохраняют все строки

### Базовый синтаксис

```sql
функция() OVER (
    PARTITION BY столбец  -- Группировка (опционально)
    ORDER BY столбец      -- Сортировка (опционально)
)
```

### ROW_NUMBER — нумерация строк

```sql
-- Пронумеровать все заказы
SELECT 
    id,
    customer_id,
    price * quantity AS amount,
    ROW_NUMBER() OVER (ORDER BY order_date) AS row_num
FROM orders;
```

**Результат:**
```
 id | customer_id |  amount   | row_num
----+-------------+-----------+---------
  1 |      1      |  89990.00 |    1
  2 |      1      |  24990.00 |    2
  3 |      2      | 199990.00 |    3
  4 |      3      |  64990.00 |    4
  ...
```

**С PARTITION BY:**

```sql
-- Нумерация заказов каждого клиента
SELECT 
    id,
    customer_id,
    price * quantity AS amount,
    ROW_NUMBER() OVER (
        PARTITION BY customer_id 
        ORDER BY order_date
    ) AS order_number
FROM orders
ORDER BY customer_id, order_number;
```

**Результат:**
```
 id | customer_id |  amount   | order_number
----+-------------+-----------+--------------
  1 |      1      |  89990.00 |      1
  2 |      1      |  24990.00 |      2
  7 |      1      |   5970.00 |      3
  3 |      2      | 199990.00 |      1
  5 |      2      |  17980.00 |      2
  ...
```

### RANK и DENSE_RANK — ранжирование

```sql
-- Ранжирование заказов по сумме
SELECT 
    id,
    customer_id,
    price * quantity AS amount,
    RANK() OVER (ORDER BY price * quantity DESC) AS rank,
    DENSE_RANK() OVER (ORDER BY price * quantity DESC) AS dense_rank
FROM orders;
```

**Разница между RANK и DENSE_RANK:**
- **RANK**: 1, 2, 2, 4, 5 (пропускает номера)
- **DENSE_RANK**: 1, 2, 2, 3, 4 (не пропускает)

### SUM, AVG, COUNT с OVER

```sql
-- Накопительная сумма (running total)
SELECT 
    order_date,
    customer_id,
    price * quantity AS amount,
    SUM(price * quantity) OVER (
        ORDER BY order_date
    ) AS running_total
FROM orders
ORDER BY order_date;
```

**Результат:**
```
order_date  | customer_id |  amount   | running_total
------------+-------------+-----------+---------------
2024-01-15  |      1      |  89990.00 |     89990.00
2024-01-15  |      1      |  24990.00 |    114980.00
2024-01-18  |      2      | 199990.00 |    314970.00
2024-01-20  |      3      |  64990.00 |    379960.00
...
```

**Скользящее среднее (moving average):**

```sql
SELECT 
    order_date,
    price * quantity AS amount,
    AVG(price * quantity) OVER (
        ORDER BY order_date
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS moving_avg_3_days
FROM orders
ORDER BY order_date;
```

### LEAD и LAG — доступ к соседним строкам

```sql
-- Сравнение с предыдущим заказом
SELECT 
    order_date,
    customer_id,
    price * quantity AS amount,
    LAG(price * quantity) OVER (
        PARTITION BY customer_id 
        ORDER BY order_date
    ) AS previous_order_amount,
    price * quantity - LAG(price * quantity) OVER (
        PARTITION BY customer_id 
        ORDER BY order_date
    ) AS difference
FROM orders
ORDER BY customer_id, order_date;
```

### FIRST_VALUE и LAST_VALUE

```sql
-- Первый и последний заказ клиента
SELECT 
    customer_id,
    order_date,
    price * quantity AS amount,
    FIRST_VALUE(price * quantity) OVER (
        PARTITION BY customer_id 
        ORDER BY order_date
    ) AS first_order_amount,
    LAST_VALUE(price * quantity) OVER (
        PARTITION BY customer_id 
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS last_order_amount
FROM orders
ORDER BY customer_id, order_date;
```

---

## Практические примеры аналитики

### Когортный анализ

```sql
-- Первый заказ каждого клиента (когорта)
WITH first_orders AS (
    SELECT 
        customer_id,
        MIN(order_date) AS first_order_date
    FROM orders
    GROUP BY customer_id
)
SELECT 
    DATE_TRUNC('month', fo.first_order_date) AS cohort_month,
    COUNT(DISTINCT fo.customer_id) AS customers_in_cohort
FROM first_orders fo
GROUP BY DATE_TRUNC('month', fo.first_order_date)
ORDER BY cohort_month;
```

### RFM-анализ

```sql
-- Recency, Frequency, Monetary
SELECT 
    customer_id,
    CURRENT_DATE - MAX(order_date) AS recency_days,
    COUNT(*) AS frequency,
    SUM(price * quantity) AS monetary
FROM orders
WHERE status = 'delivered'
GROUP BY customer_id
ORDER BY monetary DESC;
```

### Топ-N в каждой группе

```sql
-- Топ-2 заказа каждого клиента
WITH ranked_orders AS (
    SELECT 
        customer_id,
        id,
        price * quantity AS amount,
        ROW_NUMBER() OVER (
            PARTITION BY customer_id 
            ORDER BY price * quantity DESC
        ) AS rank
    FROM orders
)
SELECT *
FROM ranked_orders
WHERE rank <= 2
ORDER BY customer_id, rank;
```

### Процентиль и медиана

```sql
-- Медиана и процентили стоимости заказов
SELECT 
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY price * quantity) AS q1,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY price * quantity) AS median,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY price * quantity) AS q3,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY price * quantity) AS p95
FROM orders;
```

---

## Практическое задание

### Задание 1: Аналитика интернет-магазина (обязательно)

Создайте базу данных и выполните аналитические запросы:

```sql
CREATE DATABASE analytics_practice;
\c analytics_practice

-- Клиенты
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    city VARCHAR(50),
    registered_at DATE DEFAULT CURRENT_DATE
);

-- Продукты
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

-- Заказы
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id),
    order_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'pending'
);

-- Позиции заказов
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

-- Заполнение данными
INSERT INTO customers (name, email, city, registered_at) VALUES 
    ('Алиса', 'alice@example.com', 'Москва', '2023-12-01'),
    ('Боб', 'bob@example.com', 'Санкт-Петербург', '2024-01-15'),
    ('Чарли', 'charlie@example.com', 'Москва', '2024-01-20'),
    ('Диана', 'diana@example.com', 'Казань', '2024-02-01'),
    ('Ева', 'eve@example.com', 'Москва', '2024-02-10');

INSERT INTO products (name, category, price) VALUES 
    ('iPhone 15', 'Электроника', 89990),
    ('MacBook Pro', 'Электроника', 199990),
    ('AirPods
  ```
