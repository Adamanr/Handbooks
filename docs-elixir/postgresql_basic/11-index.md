---
sidebar_position: 9
description: "В этой главе мы рассмотрим основы PostgreSQL, включая установку, настройку и базовые команды."
---

# Индексы и производительность

## Что такое индексы и зачем они нужны

### Аналогия с книгой

Представьте книгу на 1000 страниц:

**Без индекса:** Чтобы найти слово "PostgreSQL", нужно прочитать все 1000 страниц.

**С индексом:** Смотрите в предметный указатель → "PostgreSQL: стр. 42, 156, 789" → сразу на нужные страницы!

### Как работают индексы в БД

```
Без индекса (Sequential Scan):
┌──────────────────────────────────┐
│ id │ name        │ salary        │
├────┼─────────────┼───────────────┤
│ 1  │ Alice       │ 50000  ← читаем
│ 2  │ Bob         │ 60000  ← читаем
│ 3  │ Charlie     │ 55000  ← читаем
│ ...│ ...         │ ...    ← читаем
│1000│ Zachary     │ 58000  ← читаем
└────┴─────────────┴───────────────┘
Прочитали 1000 строк

С индексом (Index Scan):
Индекс на name:
┌─────────┬────┐
│ Alice   → 1  │
│ Bob     → 2  │
│ Charlie → 3  │
│ ...     → ...│
└─────────┴────┘
Поиск: O(log N) вместо O(N)
Прочитали ~10 строк вместо 1000!
```

### Подготовка данных

```sql
-- Создадим большую таблицу для тестов
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    department VARCHAR(50),
    position VARCHAR(50),
    salary DECIMAL(10, 2),
    hire_date DATE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Функция для генерации тестовых данных
INSERT INTO employees (first_name, last_name, email, department, position, salary, hire_date, is_active)
SELECT 
    'First_' || i,
    'Last_' || i,
    'user' || i || '@company.com',
    CASE (i % 5)
        WHEN 0 THEN 'IT'
        WHEN 1 THEN 'Sales'
        WHEN 2 THEN 'HR'
        WHEN 3 THEN 'Marketing'
        ELSE 'Support'
    END,
    CASE (i % 3)
        WHEN 0 THEN 'Junior'
        WHEN 1 THEN 'Middle'
        ELSE 'Senior'
    END,
    50000 + (random() * 100000)::INT,
    CURRENT_DATE - (random() * 3650)::INT,
    CASE WHEN random() > 0.1 THEN TRUE ELSE FALSE END
FROM generate_series(1, 100000) AS i;

-- Анализ таблицы для обновления статистики
ANALYZE employees;
```

### Когда индексы НЕ нужны

```sql
-- ❌ Маленькие таблицы (< 1000 строк)
-- Sequential Scan быстрее, чем Index Scan

-- ❌ Запросы, возвращающие большую часть таблицы
SELECT * FROM employees WHERE is_active = TRUE;
-- Если 90% сотрудников активны, индекс не поможет

-- ❌ Столбцы, которые часто обновляются
-- Индексы замедляют INSERT/UPDATE/DELETE
```

---

## EXPLAIN — анализ запросов

### Что показывает EXPLAIN?

**EXPLAIN** показывает план выполнения запроса — как PostgreSQL будет его выполнять.

```sql
-- Базовый EXPLAIN
EXPLAIN
SELECT * FROM employees WHERE department = 'IT';

-- EXPLAIN с реальным выполнением
EXPLAIN ANALYZE
SELECT * FROM employees WHERE department = 'IT';
```

### Результат EXPLAIN

```
Seq Scan on employees  (cost=0.00..2834.00 rows=20000 width=100)
  Filter: ((department)::text = 'IT'::text)

Разбор:
- Seq Scan — последовательное чтение (плохо для больших таблиц)
- cost=0.00..2834.00 — оценка стоимости (начало..конец)
- rows=20000 — ожидаемое количество строк
- width=100 — средний размер строки в байтах
- Filter — фильтрация после чтения
```

### EXPLAIN ANALYZE — реальное выполнение

```sql
EXPLAIN ANALYZE
SELECT * FROM employees WHERE email = 'user50000@company.com';

-- Результат:
Seq Scan on employees  (cost=0.00..2834.00 rows=1 width=100) 
                       (actual time=15.234..30.456 rows=1 loops=1)
  Filter: ((email)::text = 'user50000@company.com'::text)
  Rows Removed by Filter: 99999
Planning Time: 0.123 ms
Execution Time: 30.478 ms
```

**Важные метрики:**
- `cost` — оценка стоимости
- `actual time` — реальное время выполнения (мс)
- `rows` — ожидаемое vs реальное количество строк
- `Planning Time` — время планирования
- `Execution Time` — время выполнения

### Типы сканирования

| Тип | Описание | Скорость |
|-----|----------|----------|
| **Seq Scan** | Последовательное чтение всей таблицы | Медленно |
| **Index Scan** | Чтение через индекс | Быстро |
| **Index Only Scan** | Только из индекса (без таблицы) | Очень быстро |
| **Bitmap Index Scan** | Для множества условий | Средне |

### EXPLAIN опции

```sql
-- Базовый план
EXPLAIN SELECT ...;

-- С реальным выполнением
EXPLAIN ANALYZE SELECT ...;

-- С буферами (использование памяти)
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;

-- Полный формат (JSON, YAML, XML)
EXPLAIN (FORMAT JSON) SELECT ...;

-- Все опции сразу
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, COSTS, TIMING) SELECT ...;
```

---

## B-Tree индексы (по умолчанию)

### Создание B-Tree индекса

**B-Tree** — стандартный тип индекса, подходит для большинства случаев.

```sql
-- Создать индекс на один столбец
CREATE INDEX idx_employees_department ON employees(department);

-- Проверить использование индекса
EXPLAIN ANALYZE
SELECT * FROM employees WHERE department = 'IT';

-- Теперь видим Index Scan вместо Seq Scan!
Index Scan using idx_employees_department on employees  
  (cost=0.29..1234.56 rows=20000 width=100) 
  (actual time=0.045..5.234 rows=20000 loops=1)
  Index Cond: ((department)::text = 'IT'::text)
Execution Time: 7.123 ms  -- Было 30+ мс!
```

### Составные (композитные) индексы

Индекс на несколько столбцов:

```sql
-- Индекс на department + position
CREATE INDEX idx_dept_position ON employees(department, position);

-- ✅ Использует индекс (фильтр по обоим полям)
EXPLAIN ANALYZE
SELECT * FROM employees 
WHERE department = 'IT' AND position = 'Senior';

-- ✅ Использует индекс (фильтр по первому полю)
SELECT * FROM employees WHERE department = 'IT';

-- ❌ НЕ использует индекс (фильтр только по второму полю)
SELECT * FROM employees WHERE position = 'Senior';
```

**Правило:** Порядок столбцов важен! Индекс (A, B) работает для:
- `WHERE A = ... AND B = ...` ✅
- `WHERE A = ...` ✅
- `WHERE B = ...` ❌

### Индекс с сортировкой

```sql
-- Индекс с порядком сортировки
CREATE INDEX idx_salary_desc ON employees(salary DESC);

-- Быстрая сортировка
EXPLAIN ANALYZE
SELECT * FROM employees ORDER BY salary DESC LIMIT 10;
-- Index Scan (использует индекс для сортировки!)
```

### Частичные индексы

Индекс только для части данных:

```sql
-- Индекс только для активных сотрудников
CREATE INDEX idx_active_employees ON employees(department)
WHERE is_active = TRUE;

-- Меньше размер → быстрее работа
SELECT pg_size_pretty(pg_relation_size('idx_active_employees'));

-- ✅ Использует индекс
SELECT * FROM employees 
WHERE department = 'IT' AND is_active = TRUE;

-- ❌ НЕ использует (is_active = FALSE)
SELECT * FROM employees 
WHERE department = 'IT' AND is_active = FALSE;
```

### Индексы выражений

Индекс на результат функции:

```sql
-- Индекс на нижний регистр email
CREATE INDEX idx_email_lower ON employees(LOWER(email));

-- Теперь быстро работает
SELECT * FROM employees WHERE LOWER(email) = 'user50000@company.com';

-- Индекс на год найма
CREATE INDEX idx_hire_year ON employees(EXTRACT(YEAR FROM hire_date));

SELECT * FROM employees WHERE EXTRACT(YEAR FROM hire_date) = 2023;
```

### UNIQUE индексы

```sql
-- Уникальный индекс (также обеспечивает уникальность)
CREATE UNIQUE INDEX idx_email_unique ON employees(email);

-- Попытка вставить дубликат
INSERT INTO employees (email) VALUES ('user1@company.com');
-- ERROR: duplicate key value violates unique constraint
```

---

## Специализированные индексы

### GIN индексы — для массивов, JSON, полнотекстового поиска

```sql
-- Создадим таблицу с массивами и JSON
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    tags TEXT[],
    specs JSONB
);

INSERT INTO products (name, tags, specs)
SELECT 
    'Product ' || i,
    ARRAY['tag' || (i % 10), 'category' || (i % 5)],
    jsonb_build_object(
        'price', 1000 + (random() * 9000)::INT,
        'rating', (random() * 5)::NUMERIC(2,1)
    )
FROM generate_series(1, 50000) i;

-- GIN индекс для массивов
CREATE INDEX idx_products_tags ON products USING GIN(tags);

-- Быстрый поиск в массиве
EXPLAIN ANALYZE
SELECT * FROM products WHERE tags @> ARRAY['tag5'];
-- Bitmap Index Scan using idx_products_tags

-- GIN индекс для JSONB
CREATE INDEX idx_products_specs ON products USING GIN(specs);

-- Быстрый поиск в JSON
EXPLAIN ANALYZE
SELECT * FROM products WHERE specs @> '{"rating": 4.5}';
```

### GiST индексы — для геометрии и диапазонов

```sql
-- Для геометрических данных (требует расширение PostGIS)
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    coordinates GEOGRAPHY(POINT)
);

CREATE INDEX idx_locations_geo ON locations USING GIST(coordinates);

-- Для диапазонов дат
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    room_id INTEGER,
    date_range DATERANGE
);

CREATE INDEX idx_bookings_range ON bookings USING GIST(date_range);

-- Поиск пересекающихся периодов
SELECT * FROM bookings 
WHERE date_range && '[2024-06-01,2024-06-10)'::DATERANGE;
```

### Hash индексы — для точного равенства

```sql
-- Hash индекс (только для =, не для <, >, LIKE)
CREATE INDEX idx_employee_id_hash ON employees USING HASH(id);

-- Работает только для точного совпадения
SELECT * FROM employees WHERE id = 12345;

-- НЕ работает для диапазонов
SELECT * FROM employees WHERE id > 10000;  -- Не использует hash индекс
```

**Когда использовать Hash:**
- Только поиск по равенству (=)
- Большие таблицы
- В современных версиях PostgreSQL B-Tree обычно лучше

### BRIN индексы — для очень больших таблиц

```sql
-- BRIN — Block Range Index
-- Подходит для больших таблиц с естественной сортировкой

CREATE INDEX idx_hire_date_brin ON employees USING BRIN(hire_date);

-- Очень маленький размер
SELECT pg_size_pretty(pg_relation_size('idx_hire_date_brin'));
-- ~100 KB вместо ~5 MB для B-Tree

-- Хорош для диапазонов в отсортированных данных
SELECT * FROM employees 
WHERE hire_date BETWEEN '2023-01-01' AND '2023-12-31';
```

---

## Управление индексами

### Просмотр индексов

```sql
-- Все индексы таблицы
\d employees

-- Или через SQL
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'employees';

-- Размеры индексов
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE tablename = 'employees'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Неиспользуемые индексы
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
    AND indexrelid NOT IN (
        SELECT conindid FROM pg_constraint
    )
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Удаление индексов

```sql
-- Удалить индекс
DROP INDEX idx_employees_department;

-- Удалить, если существует
DROP INDEX IF EXISTS idx_employees_department;

-- Удалить конкурентно (без блокировки таблицы)
DROP INDEX CONCURRENTLY idx_employees_department;
```

### Создание индексов без блокировки

```sql
-- Обычное создание блокирует таблицу
CREATE INDEX idx_salary ON employees(salary);
-- Блокирует INSERT/UPDATE/DELETE!

-- Конкурентное создание (не блокирует)
CREATE INDEX CONCURRENTLY idx_salary ON employees(salary);
-- Можно использовать для больших таблиц в продакшене
```

### Пересоздание индексов

```sql
-- Индексы могут "раздуваться" со временем
-- Пересоздать индекс
REINDEX INDEX idx_employees_department;

-- Пересоздать все индексы таблицы
REINDEX TABLE employees;

-- Пересоздать конкурентно (PostgreSQL 12+)
REINDEX INDEX CONCURRENTLY idx_employees_department;
```

### ANALYZE — обновление статистики

```sql
-- PostgreSQL использует статистику для планирования
-- Обновить статистику таблицы
ANALYZE employees;

-- Автоматический ANALYZE (обычно настроен по умолчанию)
-- Срабатывает после значительных изменений

-- Посмотреть статистику
SELECT 
    schemaname,
    tablename,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'employees';
```

---

## Оптимизация запросов

### Проблема N+1 запросов

```sql
-- ❌ ПЛОХО: N+1 запрос
-- Сначала выбираем отделы
SELECT id, name FROM departments;

-- Потом для каждого отдела (N запросов!)
SELECT COUNT(*) FROM employees WHERE department_id = ?;
-- 10 отделов = 1 + 10 = 11 запросов

-- ✅ ХОРОШО: один запрос с JOIN
SELECT 
    d.name,
    COUNT(e.id) AS employee_count
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name;
-- Всего 1 запрос!
```

### Избегайте SELECT *

```sql
-- ❌ ПЛОХО: выбирает все столбцы
SELECT * FROM employees WHERE department = 'IT';

-- ✅ ХОРОШО: только нужные столбцы
SELECT id, first_name, last_name, email
FROM employees 
WHERE department = 'IT';

-- Преимущества:
-- 1. Меньше данных передается
-- 2. Может использовать Index Only Scan
-- 3. Явно видно, что используется
```

### Index Only Scan

```sql
-- Создать индекс с дополнительными столбцами
CREATE INDEX idx_dept_with_names ON employees(department)
INCLUDE (first_name, last_name);

-- Index Only Scan (не обращается к таблице!)
EXPLAIN ANALYZE
SELECT department, first_name, last_name
FROM employees
WHERE department = 'IT';
-- Index Only Scan using idx_dept_with_names
```

### Использование LIMIT

```sql
-- ❌ ПЛОХО: читает всё, сортирует, берет 10
SELECT * FROM employees ORDER BY salary DESC;

-- ✅ ХОРОШО: останавливается после 10
SELECT * FROM employees ORDER BY salary DESC LIMIT 10;
```

### Проблемы с OR

```sql
-- ❌ МОЖЕТ быть медленно
SELECT * FROM employees 
WHERE department = 'IT' OR department = 'Sales';

-- ✅ ЛУЧШЕ: использует индекс эффективнее
SELECT * FROM employees 
WHERE department IN ('IT', 'Sales');

-- ✅ ИЛИ: UNION для разных условий
SELECT * FROM employees WHERE department = 'IT'
UNION ALL
SELECT * FROM employees WHERE department = 'Sales';
```

### Проблемы с LIKE

```sql
-- ❌ НЕ использует индекс (% в начале)
SELECT * FROM employees WHERE email LIKE '%@company.com';

-- ✅ Использует индекс
SELECT * FROM employees WHERE email LIKE 'user123%';

-- Для поиска подстрок используйте GIN + pg_trgm
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_email_trgm ON employees USING GIN(email gin_trgm_ops);

-- Теперь быстро работает
SELECT * FROM employees WHERE email LIKE '%@company.com';
```

### Избегайте функций в WHERE

```sql
-- ❌ ПЛОХО: функция на столбце (не использует индекс)
SELECT * FROM employees WHERE EXTRACT(YEAR FROM hire_date) = 2023;

-- ✅ ХОРОШО: диапазон (использует индекс)
SELECT * FROM employees 
WHERE hire_date >= '2023-01-01' AND hire_date < '2024-01-01';

-- ИЛИ: создать индекс на выражение
CREATE INDEX idx_hire_year ON employees(EXTRACT(YEAR FROM hire_date));
```

---

## Мониторинг производительности

### Медленные запросы

```sql
-- Включить логирование медленных запросов
-- В postgresql.conf:
-- log_min_duration_statement = 1000  # Логировать запросы >1 сек

-- Или в сессии:
SET log_min_duration_statement = 1000;

-- Посмотреть самые медленные запросы (требует pg_stat_statements)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Статистика таблиц

```sql
-- Статистика использования таблиц
SELECT 
    schemaname,
    tablename,
    seq_scan,           -- Последовательных сканирований
    seq_tup_read,       -- Прочитано строк seq scan
    idx_scan,           -- Index scan'ов
    idx_tup_fetch,      -- Прочитано строк index scan
    n_tup_ins,          -- INSERT'ов
    n_tup_upd,          -- UPDATE'ов
    n_tup_del           -- DELETE'ов
FROM pg_stat_user_tables
WHERE tablename = 'employees';

-- Если seq_scan большой → возможно нужны индексы
```

### Статистика индексов

```sql
-- Использование индексов
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,           -- Сколько раз использовался
    idx_tup_read,       -- Строк прочитано
    idx_tup_fetch       -- Строк возвращено
FROM pg_stat_user_indexes
WHERE tablename = 'employees'
ORDER BY idx_scan DESC;

-- Если idx_scan = 0 → индекс не используется, можно удалить
```

### Блокировки

```sql
-- Текущие блокировки
SELECT 
    pid,
    usename,
    query,
    state,
    wait_event_type,
    wait_event
FROM pg_stat_activity
WHERE state != 'idle';

-- Убить долгий запрос
SELECT pg_terminate_backend(pid);
```

### Размеры таблиц и индексов

```sql
-- Самые большие таблицы
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - 
                   pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Раздутие (bloat) таблицы
-- Требует pgstattuple расширение
CREATE EXTENSION IF NOT EXISTS pgstattuple;

SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS size,
    round(100 * (pg_relation_size(schemaname||'.'||tablename)::NUMERIC / 
          NULLIF(pg_total_relation_size(schemaname||'.'||tablename), 0)), 2) AS table_percent
FROM pg_tables
WHERE schemaname = 'public';
```

---

## Практическое задание

### Задание 1: Оптимизация реального приложения (обязательно)

```sql
CREATE DATABASE performance_practice;
\c performance_practice

-- Создаем схему e-commerce
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100),
    name VARCHAR(100),
    city VARCHAR(50),
    registered_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    category VARCHAR(50),
    price DECIMAL(10, 2),
    stock INTEGER,
    tags TEXT[]
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    order_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20),
    total DECIMAL(10, 2)
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price DECIMAL(10, 2)
);

-- Генерация данных
INSERT INTO customers (email, name, city)
SELECT 
    'customer' || i || '@example.com',
    'Customer ' || i,
    (ARRAY['Москва', 'СПб', 'Казань', 'Новосибирск'])[1 + (i % 4)]
FROM generate_series(1, 10000) i;

INSERT INTO products (name, category, price, stock, tags)
SELECT 
    'Product ' || i,
    (ARRAY['Electronics', 'Clothing', 'Books', 'Home'])[1 + (i % 4)],
    10 + (random() * 990)::DECIMAL(10,2),
    (random() * 1000)::INT,
    ARRAY['tag' || (i % 10), 'tag' || (i % 20)]
FROM generate_series(1, 5000) i;

INSERT INTO orders (customer_id, order_date, status, total)
SELECT 
    1 + (random() * 9999)::INT,
    NOW() - (random() * 365)::INT * INTERVAL '1 day',
    (ARRAY['pending', 'paid', 'shipped', 'delivered'])[1 + (random() * 3)::INT],
    100 + (random() * 9900)::DECIMAL(10,2)
FROM generate_series(1, 50000) i;

INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT 
    1 + (random() * 49999)::INT,
    1 + (random() * 4999)::INT,
    1 + (random() * 5)::INT,
    10 + (random() * 990)::DECIMAL(10,2)
FROM generate_series(1, 150000) i;

ANALYZE;
```

**Задание: Оптимизировать запросы**

**1. Медленный запрос без индексов:**
```sql
-- Измерить время
\timing on

-- Запрос 1: Заказы клиента
EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_id = 5000;
-- Сколько времени? Какой plan?

-- Запрос 2: Товары категории
EXPLAIN ANALYZE
SELECT * FROM products WHERE category = 'Electronics';

-- Запрос 3: Заказы за период
EXPLAIN ANALYZE
SELECT * FROM orders 
WHERE order_date BETWEEN '2023-01-01' AND '2023-12-31';
```

**2. Создать правильные индексы:**
```sql
-- Индексы для внешних ключей
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Индексы для фильтрации
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);

-- Составной индекс
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date DESC);

-- GIN для массивов
CREATE INDEX idx_products_tags ON products USING GIN(tags);

-- Проверить улучшение
EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_id = 5000;
-- Теперь должно быть быстрее!
```

**3. Оптимизировать сложные запросы:**
```sql
-- До оптимизации
EXPLAIN ANALYZE
SELECT 
    c.name,
    COUNT(o.id) AS order_count,
    SUM(o.total) AS total_spent
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE c.city = 'Москва'
GROUP BY c.id, c.name
HAVING COUNT(o.id) > 5
ORDER BY total_spent DESC;

-- Создать индексы
CREATE INDEX idx_customers_city ON customers(city);

-- После оптимизации (проверить разницу)
EXPLAIN ANALYZE
SELECT 
    c.name,
    COUNT(o.id) AS order_count,
    SUM(o.total) AS total_spent
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE c.city = 'Москва'
GROUP BY c.id, c.name
HAVING COUNT(o.id) > 5
ORDER BY total_spent DESC;
```

**4. Найти неиспользуемые индексы:**
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE idx_scan < 10  -- Использовался меньше 10 раз
ORDER BY pg_relation_size(indexrelid) DESC;

-- Удалить неиспользуемые (если уверены!)
-- DROP INDEX idx_имя_индекса;
```

---

### Задание 2: Сравнение типов индексов (обязательно)

```sql
-- Создать тестовую таблицу
CREATE TABLE index_test (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100),
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Заполнить данными
INSERT INTO index_test (email, tags, metadata)
SELECT 
    'user' || i || '@example.com',
    ARRAY['tag' || (i % 100), 'category' || (i % 50)],
    jsonb_build_object(
        'score', (random() * 1000)::INT,
        'level', (random() * 10)::INT
    )
FROM generate_series(1, 100000) i;

ANALYZE index_test;

-- Тест 1: B-Tree индекс
CREATE INDEX idx_btree_email ON index_test(email);

EXPLAIN ANALYZE
SELECT * FROM index_test WHERE email = 'user50000@example.com';
-- Запишите время: _____ ms

-- Тест 2: Hash индекс
DROP INDEX idx_btree_email;
CREATE INDEX idx_hash_email ON index_test USING HASH(email);

EXPLAIN ANALYZE
SELECT * FROM index_test WHERE email = 'user50000@example.com';
-- Запишите время: _____ ms

-- Тест 3: GIN индекс для массивов
CREATE INDEX idx_gin_tags ON index_test USING GIN(tags);

EXPLAIN ANALYZE
SELECT * FROM index_test WHERE tags @> ARRAY['tag50'];
-- Запишите время: _____ ms

-- Без индекса для сравнения
DROP INDEX idx_gin_tags;

EXPLAIN ANALYZE
SELECT * FROM index_test WHERE tags @> ARRAY['tag50'];
-- Запишите время: _____ ms (должно быть намного медленнее)

-- Тест 4: GIN индекс для JSONB
CREATE INDEX idx_gin_metadata ON index_test USING GIN(metadata);

EXPLAIN ANALYZE
SELECT * FROM index_test WHERE metadata @> '{"level": 5}';
-- Запишите время с индексом: _____ ms

-- Тест 5: Индекс выражения
CREATE INDEX idx_email_lower ON index_test(LOWER(email));

EXPLAIN ANALYZE
SELECT * FROM index_test WHERE LOWER(email) = 'user50000@example.com';
-- Использует индекс!

-- Сравните размеры индексов
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE tablename = 'index_test';
```

---

### Задание 3: Оптимизация медленных запросов (дополнительно)

Найдите и оптимизируйте эти проблемные запросы:

```sql
-- Проблема 1: SELECT *
-- ❌ МЕДЛЕННО
EXPLAIN ANALYZE
SELECT * 
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.status = 'delivered';

-- ✅ Оптимизированная версия
EXPLAIN ANALYZE
SELECT o.id, o.customer_id, o.order_date, o.total
FROM orders o
WHERE o.status = 'delivered'
  AND EXISTS (SELECT 1 FROM order_items WHERE order_id = o.id);

-- Проблема 2: Функция в WHERE
-- ❌ МЕДЛЕННО (не использует индекс)
EXPLAIN ANALYZE
SELECT * FROM orders 
WHERE EXTRACT(YEAR FROM order_date) = 2023;

-- ✅ Оптимизированная версия
EXPLAIN ANALYZE
SELECT * FROM orders 
WHERE order_date >= '2023-01-01' 
  AND order_date < '2024-01-01';

-- Проблема 3: Неэффективный JOIN
-- ❌ МЕДЛЕННО
EXPLAIN ANALYZE
SELECT c.name, 
       (SELECT COUNT(*) FROM orders WHERE customer_id = c.id) AS order_count
FROM customers c
WHERE c.city = 'Москва';

-- ✅ Оптимизированная версия
EXPLAIN ANALYZE
SELECT c.name, COUNT(o.id) AS order_count
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE c.city = 'Москва'
GROUP BY c.id, c.name;

-- Проблема 4: LIKE с % в начале
-- ❌ МЕДЛЕННО
EXPLAIN ANALYZE
SELECT * FROM customers WHERE email LIKE '%@gmail.com';

-- ✅ Решение: pg_trgm для подстрок
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_customers_email_trgm ON customers USING GIN(email gin_trgm_ops);

EXPLAIN ANALYZE
SELECT * FROM customers WHERE email LIKE '%@gmail.com';
-- Теперь быстрее!

-- Проблема 5: Большой OFFSET
-- ❌ МЕДЛЕННО (читает все пропущенные строки)
EXPLAIN ANALYZE
SELECT * FROM orders ORDER BY id LIMIT 10 OFFSET 40000;

-- ✅ Решение: пагинация через WHERE
EXPLAIN ANALYZE
SELECT * FROM orders 
WHERE id > 40000  -- ID последней записи предыдущей страницы
ORDER BY id 
LIMIT 10;
```

---

## Контрольные вопросы

Проверьте себя:

1. Что такое индекс и как он ускоряет запросы?
2. Когда индексы НЕ помогают?
3. Что показывает EXPLAIN ANALYZE?
4. В чем разница между Seq Scan и Index Scan?
5. Что такое составной индекс и как порядок столбцов влияет на его использование?
6. Для чего используются GIN индексы?
7. В чем разница между B-Tree и Hash индексами?
8. Что такое частичный индекс?
9. Как найти неиспользуемые индексы?
10. Почему LIKE '%text%' не использует обычный индекс?
11. Что такое Index Only Scan?
12. Как создать индекс без блокировки таблицы?

<details>
<summary>Ответы</summary>

1. Индекс — структура данных для быстрого поиска. Работает как оглавление в книге.
2. Маленькие таблицы, запросы возвращающие много данных, часто обновляемые столбцы.
3. План выполнения запроса: как PostgreSQL будет его выполнять, время, количество строк.
4. Seq Scan читает всю таблицу последовательно, Index Scan использует индекс для быстрого поиска.
5. Индекс на несколько столбцов. Порядок важен: (A,B) работает для WHERE A и WHERE A,B, но не для WHERE B.
6. Для массивов, JSON, полнотекстового поиска — данных со сложной структурой.
7. B-Tree для диапазонов и сортировки, Hash только для точного равенства (=).
8. Индекс только для части данных (WHERE условие при создании), меньше размер.
9. SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0
10. % в начале требует сканирования всех значений. Нужен GIN + pg_trgm.
11. Чтение данных только из индекса, без обращения к таблице (самое быстрое).
12. CREATE INDEX CONCURRENTLY (не блокирует INSERT/UPDATE/DELETE).
</details>

---

## Типичные ошибки

### Ошибка 1: Слишком много индексов

```sql
-- ❌ ПЛОХО: индекс на каждый столбец
CREATE INDEX idx_col1 ON table1(col1);
CREATE INDEX idx_col2 ON table1(col2);
CREATE INDEX idx_col3 ON table1(col3);
CREATE INDEX idx_col4 ON table1(col4);
-- Замедляет INSERT/UPDATE/DELETE!

-- ✅ ХОРОШО: только нужные индексы
CREATE INDEX idx_frequently_queried ON table1(col1, col2);
-- Один составной индекс вместо нескольких
```

### Ошибка 2: Неправильный порядок в составном индексе

```sql
-- ❌ ПЛОХО
CREATE INDEX idx_wrong_order ON orders(status, customer_id);

-- Запрос чаще фильтрует по customer_id
SELECT * FROM orders WHERE customer_id = 123;
-- Индекс не используется эффективно!

-- ✅ ПРАВИЛЬНО
CREATE INDEX idx_correct_order ON orders(customer_id, status);
-- Более избирательный столбец первым
```

### Ошибка 3: Забыли ANALYZE после больших изменений

```sql
-- Загрузили много данных
INSERT INTO table SELECT ... FROM ... -- 1M строк

-- PostgreSQL не знает о новых данных!
SELECT * FROM table WHERE ...;  -- Может использовать неоптимальный план

-- ✅ ПРАВИЛЬНО: обновить статистику
ANALYZE table;
-- Теперь оптимизатор имеет актуальную информацию
```

### Ошибка 4: Индекс на low-cardinality столбцы

```sql
-- ❌ БЕСПОЛЕЗНО: только 2 значения (TRUE/FALSE)
CREATE INDEX idx_is_active ON users(is_active);
-- 50% TRUE, 50% FALSE → индекс не помогает

-- ✅ ЛУЧШЕ: частичный индекс
CREATE INDEX idx_inactive_users ON users(id) WHERE is_active = FALSE;
-- Только для редких случаев (10% FALSE)
```

### Ошибка 5: Не используют EXPLAIN

```sql
-- ❌ ПЛОХО: создали индекс и надеются, что он работает
CREATE INDEX idx_something ON table(column);

-- ✅ ПРАВИЛЬНО: проверить использование
EXPLAIN ANALYZE SELECT * FROM table WHERE column = 'value';
-- Убедиться, что индекс действительно используется!
```

---

## Лучшие практики

### 1. Индексируйте внешние ключи

```sql
-- ✅ ВСЕГДА создавайте индексы на FK
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

### 2. Используйте INCLUDE для covering индексов

```sql
-- ✅ Добавить часто выбираемые столбцы в индекс
CREATE INDEX idx_orders_customer_include 
ON orders(customer_id) 
INCLUDE (order_date, total, status);

-- Index Only Scan (очень быстро!)
SELECT customer_id, order_date, total, status
FROM orders
WHERE customer_id = 123;
```

### 3. Мониторьте размер индексов

```sql
-- Регулярно проверяйте размеры
SELECT 
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE pg_relation_size(indexrelid) > 100000000  -- >100MB
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 4. Удаляйте дубликаты индексов

```sql
-- Найти дублирующиеся индексы
SELECT 
    a.tablename,
    a.indexname AS index1,
    b.indexname AS index2
FROM pg_indexes a
JOIN pg_indexes b 
    ON a.tablename = b.tablename 
    AND a.indexdef = b.indexdef
    AND a.indexname < b.indexname
WHERE a.schemaname = 'public';
```

### 5. Используйте частичные индексы для подмножеств

```sql
-- ✅ Для часто используемых условий
CREATE INDEX idx_recent_orders 
ON orders(customer_id, order_date)
WHERE order_date > '2023-01-01';

-- Меньше размер, быстрее обслуживание
```

### 6. Регулярное обслуживание

```sql
-- Автоматически (настроено по умолчанию)
-- autovacuum следит за таблицами

-- Ручное обслуживание (при необходимости)
VACUUM ANALYZE table_name;

-- Полная очистка (блокирует таблицу)
VACUUM FULL table_name;

-- Пересоздание индексов (при раздутии)
REINDEX TABLE table_name;
```

---

## Чек-лист производительности

### Перед запуском в продакшен

- [ ] Все FK имеют индексы
- [ ] Часто используемые WHERE условия проиндексированы
- [ ] Проверили EXPLAIN ANALYZE для критичных запросов
- [ ] Нет неиспользуемых индексов
- [ ] Настроен autovacuum
- [ ] Включено логирование медленных запросов
- [ ] Мониторинг pg_stat_statements
- [ ] Резервные копии настроены

### Регулярные проверки

- [ ] Проверять медленные запросы (еженедельно)
- [ ] Искать неиспользуемые индексы (ежемесячно)
- [ ] Проверять размеры таблиц и индексов (ежемесячно)
- [ ] Обновлять ANALYZE для больших изменений
- [ ] Проверять блокировки и долгие транзакции

---

## Полезные запросы для мониторинга

```sql
-- 1. Топ-10 самых больших таблиц
SELECT 
    schemaname || '.' || tablename AS table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- 2. Неиспользуемые индексы (кандидаты на удаление)
SELECT 
    schemaname || '.' || tablename AS table_name,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan < 50  -- Использовался меньше 50 раз
    AND schemaname NOT IN ('pg_catalog')
ORDER BY pg_relation_size(indexrelid) DESC;

-- 3. Индексы с низкой эффективностью
SELECT 
    schemaname || '.' || tablename AS table_name,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_tup_read > 0 
        THEN round(100.0 * idx_tup_fetch / idx_tup_read, 2)
        ELSE 0
    END AS fetch_ratio
FROM pg_stat_user_indexes
WHERE idx_scan > 0
ORDER BY fetch_ratio;

-- 4. Таблицы, требующие VACUUM
SELECT 
    schemaname || '.' || tablename AS table_name,
    n_dead_tup,
    n_live_tup,
    round(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_ratio,
    last_autovacuum,
    last_vacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- 5. Текущая активность
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    query_start,
    NOW() - query_start AS duration,
    query
FROM pg_stat_activity
WHERE state != 'idle'
    AND query NOT LIKE '%pg_stat_activity%'
ORDER BY query_start;
```
