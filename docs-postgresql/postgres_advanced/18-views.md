---
id: module-18-views
title: "Представления (Views) и материализованные представления в PostgreSQL"
sidebar_label: "Представления (Views) и материализованные представления"
sidebar_position: 18
description: "Полное руководство по представлениям и материализованным представлениям в PostgreSQL"
keywords: [postgresql, views, materialized views]
---

# Представления (Views) и материализованные представления в PostgreSQL

## Введение

Представления (Views) — это виртуальные таблицы, определяемые SQL-запросом. Они не хранят данные физически, а каждый раз при обращении выполняют свой запрос заново. Материализованные представления (Materialized Views) физически сохраняют результат запроса, что значительно ускоряет доступ к сложным агрегатам, но требует периодического обновления.

:::tip Основная идея
**View** = сохранённый запрос, данные виртуальные  
**Materialized View** = сохранённый результат запроса, данные реальные
:::

## Подготовка схемы базы данных

Создадим реалистичную схему для e-commerce приложения.

```sql
-- Очистка и создание схемы
DROP SCHEMA IF EXISTS store CASCADE;
CREATE SCHEMA store;
SET search_path TO store;

-- Таблица категорий
CREATE TABLE categories (
    category_id   SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    parent_id     INTEGER REFERENCES categories(category_id),
    description   TEXT
);

-- Таблица продуктов
CREATE TABLE products (
    product_id    SERIAL PRIMARY KEY,
    sku           VARCHAR(50) UNIQUE NOT NULL,
    name          VARCHAR(255) NOT NULL,
    category_id   INTEGER REFERENCES categories(category_id),
    price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    cost          NUMERIC(10,2) NOT NULL CHECK (cost >= 0),
    stock         INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    rating        NUMERIC(3,2) CHECK (rating >= 0 AND rating <= 5),
    review_count  INTEGER DEFAULT 0,
    is_active     BOOLEAN DEFAULT true,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица клиентов
CREATE TABLE customers (
    customer_id   SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    first_name    VARCHAR(100),
    last_name     VARCHAR(100),
    country       VARCHAR(50),
    city          VARCHAR(100),
    total_spent   NUMERIC(12,2) DEFAULT 0,
    order_count   INTEGER DEFAULT 0,
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    last_order_at TIMESTAMPTZ
);

-- Таблица заказов
CREATE TABLE orders (
    order_id      SERIAL PRIMARY KEY,
    customer_id   INTEGER NOT NULL REFERENCES customers(customer_id),
    order_number  VARCHAR(50) UNIQUE NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
    subtotal      NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax           NUMERIC(12,2) NOT NULL DEFAULT 0,
    shipping      NUMERIC(12,2) NOT NULL DEFAULT 0,
    total         NUMERIC(12,2) NOT NULL DEFAULT 0,
    order_date    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    shipped_date  TIMESTAMPTZ,
    delivered_date TIMESTAMPTZ
);

-- Таблица позиций заказа
CREATE TABLE order_items (
    item_id       SERIAL PRIMARY KEY,
    order_id      INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id    INTEGER NOT NULL REFERENCES products(product_id),
    quantity      INTEGER NOT NULL CHECK (quantity > 0),
    unit_price    NUMERIC(10,2) NOT NULL,
    discount      NUMERIC(10,2) DEFAULT 0,
    line_total    NUMERIC(12,2) NOT NULL
);

-- Таблица отзывов
CREATE TABLE reviews (
    review_id     SERIAL PRIMARY KEY,
    product_id    INTEGER NOT NULL REFERENCES products(product_id),
    customer_id   INTEGER NOT NULL REFERENCES customers(customer_id),
    rating        INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title         VARCHAR(200),
    review_text   TEXT,
    helpful_count INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);

-- Тестовые данные
INSERT INTO categories (category_name, description) VALUES
    ('Electronics', 'Electronic devices and accessories'),
    ('Computers', 'Laptops, desktops, and peripherals'),
    ('Phones', 'Smartphones and accessories'),
    ('Home & Garden', 'Furniture and home decor'),
    ('Books', 'Physical and digital books');

INSERT INTO products (sku, name, category_id, price, cost, stock, rating, review_count) VALUES
    ('LAPTOP-001', 'Professional Laptop 15"', 2, 1299.99, 800, 45, 4.5, 120),
    ('PHONE-001', 'Smartphone X Pro', 3, 899.99, 500, 200, 4.3, 350),
    ('DESK-001', 'Standing Desk Electric', 4, 599.99, 300, 30, 4.7, 85),
    ('CHAIR-001', 'Ergonomic Office Chair', 4, 399.99, 200, 60, 4.6, 150),
    ('BOOK-001', 'PostgreSQL Internals', 5, 49.99, 15, 500, 4.9, 75);

INSERT INTO customers (email, first_name, last_name, country, city) VALUES
    ('alice@example.com', 'Alice', 'Johnson', 'USA', 'New York'),
    ('bob@example.com', 'Bob', 'Smith', 'UK', 'London'),
    ('carol@example.com', 'Carol', 'Williams', 'Canada', 'Toronto'),
    ('dave@example.com', 'Dave', 'Brown', 'Australia', 'Sydney');

INSERT INTO orders (customer_id, order_number, status, subtotal, discount, tax, shipping, total, order_date) VALUES
    (1, 'ORD-2024-001', 'delivered', 1299.99, 50, 125, 15, 1389.99, NOW() - INTERVAL '30 days'),
    (1, 'ORD-2024-002', 'delivered', 899.99, 0, 85, 10, 994.99, NOW() - INTERVAL '15 days'),
    (2, 'ORD-2024-003', 'shipped', 599.99, 20, 58, 20, 657.99, NOW() - INTERVAL '5 days'),
    (3, 'ORD-2024-004', 'processing', 399.99, 0, 40, 15, 454.99, NOW() - INTERVAL '2 days'),
    (4, 'ORD-2024-005', 'pending', 49.99, 0, 5, 5, 59.99, NOW() - INTERVAL '1 day');

INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount, line_total) VALUES
    (1, 1, 1, 1299.99, 50, 1249.99),
    (2, 2, 1, 899.99, 0, 899.99),
    (3, 3, 1, 599.99, 20, 579.99),
    (4, 4, 1, 399.99, 0, 399.99),
    (5, 5, 1, 49.99, 0, 49.99);

INSERT INTO reviews (product_id, customer_id, rating, title, review_text, helpful_count) VALUES
    (1, 1, 5, 'Excellent laptop!', 'Fast, reliable, great for development work.', 15),
    (2, 1, 4, 'Good phone', 'Battery life could be better, but overall solid.', 8),
    (3, 2, 5, 'Perfect desk', 'Easy to assemble, very stable.', 12),
    (4, 3, 5, 'Best chair ever', 'My back pain is gone after using this.', 20),
    (5, 4, 5, 'Must read for DBAs', 'Deep dive into PostgreSQL architecture.', 25);
```

---

## Часть I: Обычные представления (Views)

### Создание простого представления

```sql
-- Простое представление: активные продукты с их категориями
CREATE VIEW active_products AS
SELECT 
    p.product_id,
    p.sku,
    p.name AS product_name,
    c.category_name,
    p.price,
    p.stock,
    p.rating
FROM products p
JOIN categories c ON p.category_id = c.category_id
WHERE p.is_active = true;

-- Использование представления
SELECT * FROM active_products WHERE stock < 50;

SELECT category_name, COUNT(*), AVG(price) AS avg_price
FROM active_products
GROUP BY category_name;
```

### Зачем нужны представления?

**1. Упрощение сложных запросов**

```sql
-- Вместо того чтобы каждый раз писать сложный JOIN...
SELECT 
    o.order_number,
    c.first_name || ' ' || c.last_name AS customer_name,
    o.total,
    o.status,
    COUNT(oi.item_id) AS items_count
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id, c.first_name, c.last_name;

-- Создаём представление один раз
CREATE VIEW order_summary AS
SELECT 
    o.order_id,
    o.order_number,
    c.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.email,
    o.total,
    o.status,
    o.order_date,
    COUNT(oi.item_id) AS items_count
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id, c.customer_id, c.first_name, c.last_name, c.email;

-- Используем многократно
SELECT * FROM order_summary WHERE status = 'delivered';
SELECT * FROM order_summary WHERE customer_id = 1;
```

**2. Безопасность и контроль доступа**

```sql
-- Представление скрывает чувствительные данные
CREATE VIEW customer_public_info AS
SELECT 
    customer_id,
    first_name,
    last_name,
    country,
    city,
    order_count
FROM customers;
-- email и другие приватные поля скрыты

-- Даём доступ пользователям только к представлению
GRANT SELECT ON customer_public_info TO public_user;
-- но НЕ даём доступ к таблице customers
```

**3. Абстракция схемы**

```sql
-- Приложение работает с представлением, а не с таблицей
-- Если меняется структура таблицы, переписываем только представление

-- Старая структура: one table
CREATE TABLE old_orders (
    id SERIAL,
    customer_email VARCHAR(255),
    amount NUMERIC,
    ...
);

-- Новая структура: normalized tables
CREATE TABLE new_orders (
    order_id SERIAL,
    customer_id INTEGER,
    total NUMERIC,
    ...
);

-- Представление сохраняет совместимость со старым API
CREATE VIEW old_orders AS
SELECT 
    o.order_id AS id,
    c.email AS customer_email,
    o.total AS amount
FROM new_orders o
JOIN customers c ON o.customer_id = c.customer_id;
```

**4. Логические подмножества данных**

```sql
-- Представления для разных регионов
CREATE VIEW orders_usa AS
SELECT o.* FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE c.country = 'USA';

CREATE VIEW orders_europe AS
SELECT o.* FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE c.country IN ('UK', 'Germany', 'France');

-- Представления по статусу
CREATE VIEW pending_orders AS
SELECT * FROM orders WHERE status = 'pending';

CREATE VIEW completed_orders AS
SELECT * FROM orders WHERE status IN ('delivered', 'shipped');
```

### Представления с вычисляемыми колонками

```sql
-- Представление с расчётами
CREATE VIEW product_profitability AS
SELECT 
    p.product_id,
    p.sku,
    p.name,
    p.price,
    p.cost,
    p.price - p.cost AS profit_per_unit,
    ROUND((p.price - p.cost) / p.price * 100, 2) AS profit_margin_pct,
    p.stock * p.price AS inventory_value,
    p.stock * (p.price - p.cost) AS potential_profit
FROM products p
WHERE p.is_active = true;

SELECT * FROM product_profitability 
WHERE profit_margin_pct > 50
ORDER BY potential_profit DESC;
```

### Вложенные представления

```sql
-- Представление 1: базовая статистика продуктов
CREATE VIEW product_stats AS
SELECT 
    p.product_id,
    p.name,
    p.category_id,
    COUNT(DISTINCT oi.order_id) AS times_ordered,
    COALESCE(SUM(oi.quantity), 0) AS units_sold,
    COALESCE(SUM(oi.line_total), 0) AS revenue
FROM products p
LEFT JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY p.product_id, p.name, p.category_id;

-- Представление 2: топ-продукты по категориям (использует product_stats)
CREATE VIEW top_products_by_category AS
SELECT 
    c.category_name,
    ps.name AS product_name,
    ps.revenue,
    ps.units_sold,
    RANK() OVER (PARTITION BY c.category_id ORDER BY ps.revenue DESC) AS rank_in_category
FROM product_stats ps
JOIN categories c ON ps.category_id = c.category_id
WHERE ps.revenue > 0
ORDER BY c.category_name, rank_in_category;

-- Использование
SELECT * FROM top_products_by_category WHERE rank_in_category <= 3;
```

### OR REPLACE: изменение представлений

```sql
-- Создание
CREATE VIEW customer_orders AS
SELECT 
    c.customer_id,
    c.email,
    COUNT(o.order_id) AS order_count
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.email;

-- Модификация: добавляем total_spent
CREATE OR REPLACE VIEW customer_orders AS
SELECT 
    c.customer_id,
    c.email,
    COUNT(o.order_id) AS order_count,
    COALESCE(SUM(o.total), 0) AS total_spent
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.email;

-- OR REPLACE работает только если структура совместима
-- (можно добавлять колонки в конец, но нельзя менять тип существующих)
```

---

## Обновляемые представления

### Автоматически обновляемые представления

PostgreSQL автоматически делает представление обновляемым, если оно:
- Имеет только одну таблицу в FROM
- Не содержит GROUP BY, HAVING, DISTINCT, LIMIT, OFFSET
- Не содержит агрегатных функций или оконных функций
- Не содержит UNION, INTERSECT, EXCEPT

```sql
-- Простое обновляемое представление
CREATE VIEW active_electronics AS
SELECT product_id, sku, name, price, stock
FROM products
WHERE category_id = 1 AND is_active = true;

-- Можно INSERT
INSERT INTO active_electronics (sku, name, price, stock)
VALUES ('MOUSE-001', 'Wireless Mouse', 29.99, 100);
-- Автоматически добавит category_id=1, is_active=true

-- Можно UPDATE
UPDATE active_electronics SET price = 24.99 WHERE sku = 'MOUSE-001';

-- Можно DELETE
DELETE FROM active_electronics WHERE sku = 'MOUSE-001';

-- Проверка: запись в базовой таблице
SELECT * FROM products WHERE sku = 'MOUSE-001';
```

### WITH CHECK OPTION

Предотвращает INSERT/UPDATE, которые сделают строку невидимой в представлении.

```sql
-- Представление для дорогих продуктов
CREATE VIEW expensive_products AS
SELECT product_id, sku, name, price, stock
FROM products
WHERE price >= 500;

-- Без CHECK OPTION: можно сделать некорректное обновление
UPDATE expensive_products SET price = 100 WHERE product_id = 1;
-- Запись исчезает из представления, но обновление прошло!

-- С CHECK OPTION: защита от таких обновлений
CREATE OR REPLACE VIEW expensive_products AS
SELECT product_id, sku, name, price, stock
FROM products
WHERE price >= 500
WITH CHECK OPTION;

-- Теперь это вызовет ошибку:
UPDATE expensive_products SET price = 100 WHERE product_id = 1;
-- ERROR: new row violates check option for view "expensive_products"

-- LOCAL vs CASCADED
CREATE VIEW very_expensive AS
SELECT * FROM expensive_products
WHERE price >= 1000
WITH LOCAL CHECK OPTION;
-- LOCAL: проверяет только условие этого представления (price >= 1000)
-- CASCADED (default): проверяет условия всех представлений в цепочке
```

### Необновляемые представления: INSTEAD OF триггеры

Для сложных представлений (с JOIN, GROUP BY и т.д.) нужны триггеры.

```sql
-- Сложное представление (не обновляется автоматически)
CREATE VIEW product_with_category AS
SELECT 
    p.product_id,
    p.sku,
    p.name,
    p.price,
    c.category_id,
    c.category_name
FROM products p
JOIN categories c ON p.category_id = c.category_id;

-- UPDATE product_with_category SET price = 999 WHERE product_id = 1;
-- ERROR: cannot update view

-- Создаём INSTEAD OF триггер
CREATE OR REPLACE FUNCTION product_with_category_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем таблицу products
    UPDATE products
    SET sku   = NEW.sku,
        name  = NEW.name,
        price = NEW.price
    WHERE product_id = OLD.product_id;
    
    -- Если изменилась категория
    IF NEW.category_id IS DISTINCT FROM OLD.category_id THEN
        UPDATE products
        SET category_id = NEW.category_id
        WHERE product_id = OLD.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_product_with_category_update
    INSTEAD OF UPDATE ON product_with_category
    FOR EACH ROW
    EXECUTE FUNCTION product_with_category_update();

-- Теперь обновление работает
UPDATE product_with_category SET price = 999.99 WHERE product_id = 1;
```

---

## Часть II: Материализованные представления

### Что такое Materialized View?

Материализованные представления физически хранят результат запроса на диске.

| Характеристика | VIEW | MATERIALIZED VIEW |
|----------------|------|-------------------|
| Хранение данных | Нет (виртуальная таблица) | Да (физическая таблица) |
| Скорость SELECT | Медленно (выполняет запрос каждый раз) | Быстро (читает готовые данные) |
| Актуальность данных | Всегда актуальные | Требует REFRESH |
| Индексы | Нельзя | Можно создавать |
| Использование | Простые запросы, абстракция | Тяжёлые агрегации, аналитика |

### Создание материализованного представления

```sql
-- Тяжёлый аналитический запрос
CREATE MATERIALIZED VIEW sales_by_category AS
SELECT 
    c.category_name,
    COUNT(DISTINCT oi.order_id) AS total_orders,
    SUM(oi.quantity) AS units_sold,
    SUM(oi.line_total) AS revenue,
    AVG(oi.unit_price) AS avg_unit_price,
    MIN(oi.unit_price) AS min_price,
    MAX(oi.unit_price) AS max_price
FROM categories c
JOIN products p ON c.category_id = p.category_id
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.status IN ('delivered', 'shipped')
GROUP BY c.category_id, c.category_name;

-- Быстрый SELECT (данные уже посчитаны)
SELECT * FROM sales_by_category ORDER BY revenue DESC;

-- Сравним производительность
EXPLAIN ANALYZE
SELECT 
    c.category_name,
    COUNT(DISTINCT oi.order_id) AS total_orders,
    SUM(oi.quantity) AS units_sold,
    SUM(oi.line_total) AS revenue
FROM categories c
JOIN products p ON c.category_id = p.category_id
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.status IN ('delivered', 'shipped')
GROUP BY c.category_id, c.category_name;
-- Execution Time: 15.234 ms

EXPLAIN ANALYZE
SELECT * FROM sales_by_category;
-- Execution Time: 0.123 ms (в 100+ раз быстрее!)
```

### Обновление материализованных представлений

```sql
-- Полное обновление (блокирует чтение)
REFRESH MATERIALIZED VIEW sales_by_category;

-- Обновление с конкурентным доступом (PostgreSQL 9.4+)
-- Требует уникальный индекс
CREATE UNIQUE INDEX idx_sales_category_name ON sales_by_category(category_name);

-- Теперь можно обновлять без блокировки чтения
REFRESH MATERIALIZED VIEW CONCURRENTLY sales_by_category;

-- Во время REFRESH CONCURRENTLY пользователи могут читать старые данные
-- После завершения — атомарно переключается на новые
```

### Индексы на материализованных представлениях

```sql
CREATE MATERIALIZED VIEW customer_lifetime_value AS
SELECT 
    c.customer_id,
    c.email,
    c.first_name || ' ' || c.last_name AS full_name,
    c.country,
    COUNT(o.order_id) AS total_orders,
    SUM(o.total) AS lifetime_value,
    AVG(o.total) AS avg_order_value,
    MAX(o.order_date) AS last_order_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.email, c.first_name, c.last_name, c.country;

-- Создание индексов для быстрого поиска
CREATE INDEX idx_clv_customer_id ON customer_lifetime_value(customer_id);
CREATE INDEX idx_clv_country ON customer_lifetime_value(country);
CREATE INDEX idx_clv_lifetime_value ON customer_lifetime_value(lifetime_value DESC);

-- Уникальный индекс для REFRESH CONCURRENTLY
CREATE UNIQUE INDEX idx_clv_email ON customer_lifetime_value(email);

-- Теперь запросы очень быстрые
SELECT * FROM customer_lifetime_value WHERE country = 'USA' ORDER BY lifetime_value DESC;
EXPLAIN ANALYZE
SELECT * FROM customer_lifetime_value WHERE customer_id = 1;
-- Index Scan using idx_clv_customer_id
```

### WITH DATA vs WITH NO DATA

```sql
-- Создание БЕЗ данных (пустая таблица)
CREATE MATERIALIZED VIEW product_inventory WITH NO DATA AS
SELECT 
    p.product_id,
    p.sku,
    p.name,
    p.stock,
    p.stock * p.price AS inventory_value
FROM products p;

-- SELECT * FROM product_inventory;
-- ERROR: materialized view has not been populated

-- Первичное заполнение
REFRESH MATERIALIZED VIEW product_inventory;

-- Теперь работает
SELECT * FROM product_inventory;

-- Создание С данными (по умолчанию)
CREATE MATERIALIZED VIEW product_inventory_2 AS
SELECT 
    p.product_id,
    p.sku,
    p.name,
    p.stock
FROM products p;
-- Данные созданы сразу
```

### Зависимости между представлениями

```sql
-- MV зависит от обычного View
CREATE VIEW recent_orders AS
SELECT * FROM orders WHERE order_date > NOW() - INTERVAL '30 days';

CREATE MATERIALIZED VIEW recent_orders_summary AS
SELECT 
    DATE(order_date) AS order_day,
    COUNT(*) AS orders_count,
    SUM(total) AS daily_revenue
FROM recent_orders
GROUP BY DATE(order_date);

-- Нельзя удалить recent_orders без CASCADE
-- DROP VIEW recent_orders;
-- ERROR: cannot drop view recent_orders because other objects depend on it

DROP VIEW recent_orders CASCADE;
-- NOTICE: drop cascades to materialized view recent_orders_summary
```

---

## Практические примеры

### Пример 1: Dashboard метрики в реальном времени (View)

```sql
-- View для live-dashboard (всегда актуальные данные)
CREATE VIEW dashboard_metrics AS
SELECT 
    -- Заказы
    (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pending_orders,
    (SELECT COUNT(*) FROM orders WHERE status = 'processing') AS processing_orders,
    (SELECT COUNT(*) FROM orders 
     WHERE order_date > NOW() - INTERVAL '24 hours') AS orders_last_24h,
    
    -- Выручка
    (SELECT COALESCE(SUM(total), 0) FROM orders 
     WHERE status = 'delivered' 
       AND order_date > NOW() - INTERVAL '30 days') AS revenue_30d,
    (SELECT COALESCE(SUM(total), 0) FROM orders 
     WHERE status = 'delivered' 
       AND DATE(order_date) = CURRENT_DATE) AS revenue_today,
    
    -- Продукты
    (SELECT COUNT(*) FROM products WHERE stock < 10) AS low_stock_count,
    (SELECT COUNT(*) FROM products WHERE is_active = true) AS active_products,
    
    -- Клиенты
    (SELECT COUNT(*) FROM customers 
     WHERE registered_at > NOW() - INTERVAL '7 days') AS new_customers_7d;

-- Использование
SELECT * FROM dashboard_metrics;
-- Всегда свежие данные, но выполняет 8 подзапросов каждый раз
```

### Пример 2: Отчёты (Materialized View)

```sql
-- Тяжёлый отчёт по продажам (обновляется раз в час)
CREATE MATERIALIZED VIEW hourly_sales_report AS
SELECT 
    DATE_TRUNC('hour', o.order_date) AS hour,
    COUNT(DISTINCT o.order_id) AS orders,
    COUNT(DISTINCT o.customer_id) AS unique_customers,
    SUM(o.total) AS revenue,
    AVG(o.total) AS avg_order_value,
    SUM(oi.quantity) AS units_sold,
    COUNT(DISTINCT oi.product_id) AS unique_products_sold
FROM orders o
JOIN order_items oi ON o.order_id = oi.order_id
WHERE o.status IN ('delivered', 'shipped')
  AND o.order_date > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', o.order_date)
ORDER BY hour DESC;

CREATE UNIQUE INDEX idx_hourly_sales_hour ON hourly_sales_report(hour);

-- Автоматическое обновление через pg_cron или внешний scheduler
-- CREATE EXTENSION pg_cron;
-- SELECT cron.schedule('refresh-hourly-sales', '0 * * * *',
--     'REFRESH MATERIALIZED VIEW CONCURRENTLY hourly_sales_report');

-- Быстрый доступ к отчёту
SELECT * FROM hourly_sales_report ORDER BY hour DESC LIMIT 24;
```

### Пример 3: Поиск и фильтрация (MV с полнотекстовым поиском)

```sql
-- Материализованное представление для поиска продуктов
CREATE MATERIALIZED VIEW product_search AS
SELECT 
    p.product_id,
    p.sku,
    p.name,
    p.price,
    p.rating,
    p.review_count,
    c.category_name,
    to_tsvector('english', 
        COALESCE(p.name, '') || ' ' || 
        COALESCE(c.category_name, '')
    ) AS search_vector
FROM products p
JOIN categories c ON p.category_id = c.category_id
WHERE p.is_active = true;

-- Индексы для поиска
CREATE INDEX idx_product_search_vector ON product_search USING gin(search_vector);
CREATE INDEX idx_product_search_category ON product_search(category_name);
CREATE INDEX idx_product_search_price ON product_search(price);
CREATE UNIQUE INDEX idx_product_search_id ON product_search(product_id);

-- Быстрый полнотекстовый поиск
SELECT product_id, name, price, rating
FROM product_search
WHERE search_vector @@ to_tsquery('english', 'laptop & professional')
ORDER BY rating DESC;

-- Комбинированный поиск и фильтры
SELECT *
FROM product_search
WHERE search_vector @@ to_tsquery('english', 'chair')
  AND price BETWEEN 200 AND 500
  AND rating >= 4.0
ORDER BY rating DESC, review_count DESC;

-- Обновление после изменений в products
REFRESH MATERIALIZED VIEW CONCURRENTLY product_search;
```

### Пример 4: Агрегация по времени (MV для временных рядов)

```sql
-- Дневная статистика (пересчитывается раз в день)
CREATE MATERIALIZED VIEW daily_metrics AS
SELECT 
    DATE(order_date) AS date,
    COUNT(DISTINCT order_id) AS orders,
    COUNT(DISTINCT customer_id) AS customers,
    SUM(total) AS revenue,
    AVG(total) AS avg_order_value,
    
    -- Moving averages
    AVG(SUM(total)) OVER (
        ORDER BY DATE(order_date)
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS revenue_7day_ma,
    
    AVG(COUNT(DISTINCT order_id)) OVER (
        ORDER BY DATE(order_date)
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS orders_7day_ma
FROM orders
WHERE status IN ('delivered', 'shipped')
GROUP BY DATE(order_date)
ORDER BY date;

CREATE UNIQUE INDEX idx_daily_metrics_date ON daily_metrics(date);

-- Визуализация трендов
SELECT 
    date,
    revenue,
    revenue_7day_ma,
    ROUND((revenue - revenue_7day_ma) / revenue_7day_ma * 100, 2) AS vs_7day_avg_pct
FROM daily_metrics
WHERE date > CURRENT_DATE - INTERVAL '30 days'
ORDER BY date;
```

### Пример 5: Рекомендательная система (MV для персонализации)

```sql
-- Похожие продукты на основе совместных покупок
CREATE MATERIALIZED VIEW product_associations AS
WITH product_pairs AS (
    SELECT 
        oi1.product_id AS product_a,
        oi2.product_id AS product_b,
        COUNT(DISTINCT oi1.order_id) AS times_bought_together
    FROM order_items oi1
    JOIN order_items oi2 
        ON oi1.order_id = oi2.order_id 
        AND oi1.product_id < oi2.product_id
    GROUP BY oi1.product_id, oi2.product_id
    HAVING COUNT(DISTINCT oi1.order_id) >= 2
)
SELECT 
    pp.product_a,
    p_a.name AS product_a_name,
    pp.product_b,
    p_b.name AS product_b_name,
    pp.times_bought_together,
    ROUND(
        pp.times_bought_together::NUMERIC / 
        NULLIF((SELECT COUNT(DISTINCT order_id) 
                FROM order_items 
                WHERE product_id = pp.product_a), 0) * 100, 
        2
    ) AS association_strength_pct
FROM product_pairs pp
JOIN products p_a ON pp.product_a = p_a.product_id
JOIN products p_b ON pp.product_b = p_b.product_id
ORDER BY pp.times_bought_together DESC;

CREATE INDEX idx_product_assoc_a ON product_associations(product_a);
CREATE INDEX idx_product_assoc_b ON product_associations(product_b);

-- Рекомендации для продукта
SELECT 
    product_b AS recommended_product_id,
    product_b_name AS recommended_product,
    times_bought_together,
    association_strength_pct
FROM product_associations
WHERE product_a = 1  -- для конкретного продукта
ORDER BY times_bought_together DESC
LIMIT 5;
```

---

## Производительность и оптимизация

### Когда использовать VIEW

✅ **Используйте обычный VIEW когда:**
- Данные должны быть всегда актуальными
- Запрос простой и выполняется быстро
- Нужна абстракция или безопасность
- Данные часто изменяются
- Объём данных небольшой

### Когда использовать MATERIALIZED VIEW

✅ **Используйте MATERIALIZED VIEW когда:**
- Запрос сложный и медленный (JOIN многих таблиц, агрегации)
- Данные можно обновлять периодически (не требуется real-time)
- Запрос выполняется часто, а данные меняются редко
- Нужны индексы на результате запроса
- Объём данных большой

### Стратегии обновления MV

```sql
-- 1. Полное обновление по расписанию
-- Простой cron job или pg_cron
REFRESH MATERIALIZED VIEW sales_by_category;

-- 2. Конкурентное обновление (без блокировки)
REFRESH MATERIALIZED VIEW CONCURRENTLY sales_by_category;

-- 3. Частичное обновление (только новые данные)
-- Используйте VIEW вместо MV для "горячих" данных
CREATE VIEW recent_sales AS
SELECT * FROM orders WHERE order_date > NOW() - INTERVAL '1 day';

CREATE MATERIALIZED VIEW historical_sales AS
SELECT * FROM orders WHERE order_date <= NOW() - INTERVAL '1 day';

CREATE VIEW all_sales AS
SELECT * FROM historical_sales
UNION ALL
SELECT * FROM recent_sales;

-- 4. Инкрементальное обновление (DIY)
-- Храним метку времени последнего обновления
CREATE TABLE mv_refresh_log (
    mv_name TEXT PRIMARY KEY,
    last_refresh TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION incremental_refresh_sales()
RETURNS VOID AS $$
DECLARE
    v_last_refresh TIMESTAMPTZ;
BEGIN
    SELECT last_refresh INTO v_last_refresh
    FROM mv_refresh_log
    WHERE mv_name = 'sales_by_category';
    
    -- Удаляем изменённые строки
    DELETE FROM sales_by_category
    WHERE category_name IN (
        SELECT DISTINCT c.category_name
        FROM categories c
        JOIN products p ON c.category_id = p.category_id
        JOIN order_items oi ON p.product_id = oi.product_id
        JOIN orders o ON oi.order_id = o.order_id
        WHERE o.updated_at > v_last_refresh
    );
    
    -- Вставляем пересчитанные строки
    INSERT INTO sales_by_category
    SELECT 
        c.category_name,
        COUNT(DISTINCT oi.order_id),
        SUM(oi.quantity),
        SUM(oi.line_total)
    FROM categories c
    JOIN products p ON c.category_id = p.category_id
    JOIN order_items oi ON p.product_id = oi.product_id
    WHERE category_name IN (
        SELECT DISTINCT c2.category_name
        FROM orders o
        JOIN order_items oi2 ON o.order_id = oi2.order_id
        JOIN products p2 ON oi2.product_id = p2.product_id
        JOIN categories c2 ON p2.category_id = c2.category_id
        WHERE o.updated_at > v_last_refresh
    )
    GROUP BY c.category_id, c.category_name;
    
    UPDATE mv_refresh_log
    SET last_refresh = NOW()
    WHERE mv_name = 'sales_by_category';
END;
$$ LANGUAGE plpgsql;
```

### Мониторинг производительности

```sql
-- Просмотр всех представлений
SELECT 
    schemaname,
    viewname AS name,
    'VIEW' AS type,
    pg_size_pretty(pg_relation_size(schemaname||'.'||viewname)) AS size
FROM pg_views
WHERE schemaname = 'store'
UNION ALL
SELECT 
    schemaname,
    matviewname AS name,
    'MATERIALIZED VIEW' AS type,
    pg_size_pretty(pg_relation_size(schemaname||'.'||matviewname)) AS size
FROM pg_matviews
WHERE schemaname = 'store'
ORDER BY type, name;

-- Размер MV с индексами
SELECT 
    schemaname,
    matviewname,
    pg_size_pretty(pg_relation_size(schemaname||'.'||matviewname)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||matviewname)) AS indexes_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) AS total_size
FROM pg_matviews
WHERE schemaname = 'store';

-- Последнее обновление MV
SELECT 
    schemaname,
    matviewname,
    ispopulated AS has_data
FROM pg_matviews
WHERE schemaname = 'store';
-- Нет встроенной информации о времени последнего REFRESH
-- Нужно логировать самостоятельно
```

---

## Рекурсивные представления (WITH RECURSIVE)

```sql
-- Иерархия категорий
INSERT INTO categories (category_name, parent_id) VALUES
    ('Laptops', 2),      -- parent: Computers
    ('Gaming Laptops', 6),
    ('Business Laptops', 6);

-- Рекурсивное представление: полный путь категории
CREATE VIEW category_hierarchy AS
WITH RECURSIVE category_tree AS (
    -- Базовый случай: корневые категории
    SELECT 
        category_id,
        category_name,
        parent_id,
        category_name AS full_path,
        0 AS level
    FROM categories
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Рекурсивный случай: дочерние категории
    SELECT 
        c.category_id,
        c.category_name,
        c.parent_id,
        ct.full_path || ' > ' || c.category_name AS full_path,
        ct.level + 1 AS level
    FROM categories c
    JOIN category_tree ct ON c.parent_id = ct.category_id
)
SELECT * FROM category_tree ORDER BY full_path;

SELECT * FROM category_hierarchy;
/*
category_id | category_name     | parent_id | full_path                                  | level
------------|-------------------|-----------|--------------------------------------------+------
1           | Electronics       | NULL      | Electronics                                | 0
2           | Computers         | 1         | Electronics > Computers                    | 1
6           | Laptops           | 2         | Electronics > Computers > Laptops          | 2
7           | Gaming Laptops    | 6         | Electronics > ... > Laptops > Gaming...    | 3
*/

-- Все потомки категории
CREATE FUNCTION get_category_descendants(parent_cat_id INTEGER)
RETURNS TABLE(category_id INTEGER, category_name TEXT, level INTEGER) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE descendants AS (
        SELECT c.category_id, c.category_name, 0 AS level
        FROM categories c
        WHERE c.category_id = parent_cat_id
        
        UNION ALL
        
        SELECT c.category_id, c.category_name, d.level + 1
        FROM categories c
        JOIN descendants d ON c.parent_id = d.category_id
    )
    SELECT * FROM descendants;
END;
$$ LANGUAGE plpgsql;

SELECT * FROM get_category_descendants(1);  -- все потомки "Electronics"
```

---

## Управление представлениями

```sql
-- Удаление VIEW
DROP VIEW IF EXISTS active_products;

-- Удаление с каскадом (удалит зависимые объекты)
DROP VIEW active_products CASCADE;

-- Удаление MATERIALIZED VIEW
DROP MATERIALIZED VIEW IF EXISTS sales_by_category;

-- Переименование
ALTER VIEW customer_orders RENAME TO customer_order_summary;
ALTER MATERIALIZED VIEW sales_by_category RENAME TO category_sales_stats;

-- Изменение владельца
ALTER VIEW customer_orders OWNER TO new_owner;

-- Изменение схемы
ALTER VIEW customer_orders SET SCHEMA analytics;

-- Комментарии
COMMENT ON VIEW active_products IS 
    'Shows only active products with category information';

COMMENT ON MATERIALIZED VIEW sales_by_category IS
    'Aggregated sales statistics by category. Refreshed hourly.';

-- Просмотр определения VIEW
SELECT pg_get_viewdef('active_products'::regclass, true);

-- Список всех зависимостей
SELECT 
    dependent_ns.nspname AS dependent_schema,
    dependent_view.relname AS dependent_view,
    source_ns.nspname AS source_schema,
    source_table.relname AS source_table
FROM pg_depend 
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
JOIN pg_class AS dependent_view ON pg_rewrite.ev_class = dependent_view.oid 
JOIN pg_class AS source_table ON pg_depend.refobjid = source_table.oid 
JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
JOIN pg_namespace source_ns ON source_ns.oid = source_table.relnamespace
WHERE source_table.relname = 'products'
  AND source_ns.nspname = 'store';
```

---

## Лучшие практики

### Именование

```sql
-- Рекомендуемые соглашения:
-- view:              v_название или просто название
-- materialized view: mv_название

-- Хорошие примеры:
v_active_products
customer_summary           -- очевидно, что это view
mv_daily_sales_report
mv_product_search_index

-- Плохие примеры:
view1
my_view
temp_table  -- может быть спутано с TEMP TABLE
```

### Документирование

```sql
-- Всегда добавляйте комментарии к сложным представлениям
COMMENT ON MATERIALIZED VIEW sales_by_category IS
    'Sales statistics aggregated by product category.
     Data source: orders (status IN delivered/shipped) + order_items + products.
     Refresh: CONCURRENTLY every hour via cron.
     Dependencies: Requires unique index on category_name.
     Performance: ~2s to refresh, <1ms to query.';

COMMENT ON VIEW customer_lifetime_value_view IS
    'Customer LTV calculation based on all completed orders.
     Always reflects current data (not materialized).
     Use for real-time dashboards where accuracy is critical.';
```

### Проектирование MV

```sql
-- ✅ DO: Создавайте уникальные индексы для REFRESH CONCURRENTLY
CREATE UNIQUE INDEX idx_mv_primary_key ON my_mv(id);

-- ✅ DO: Добавляйте timestamp последнего обновления
CREATE MATERIALIZED VIEW mv_with_timestamp AS
SELECT 
    *,
    NOW() AS refreshed_at
FROM source_data;

-- ✅ DO: Используйте WITH NO DATA для больших MV
-- Позволяет создать структуру быстро, заполнить позже
CREATE MATERIALIZED VIEW huge_report WITH NO DATA AS
SELECT ... -- complex query
FROM ...;
-- Заполняем в off-peak время
REFRESH MATERIALIZED VIEW huge_report;

-- ❌ DON'T: Не создавайте MV на быстро меняющихся данных
-- Плохо: MV на таблице логов с миллионами вставок в минуту
-- Хорошо: Обычный VIEW или партиционирование

-- ❌ DON'T: Не забывайте про VACUUM
-- MV — это обычная таблица, применяются те же правила обслуживания
VACUUM ANALYZE sales_by_category;
```

---

## Заключение

Представления и материализованные представления — мощные инструменты для организации данных в PostgreSQL:

1. **VIEW** — виртуальная таблица для упрощения запросов и абстракции
2. **MATERIALIZED VIEW** — физическое хранение результата для производительности
3. **Обновляемые VIEW** — WITH CHECK OPTION, INSTEAD OF триггеры
4. **Индексы на MV** — для максимальной производительности
5. **REFRESH стратегии** — CONCURRENTLY для production, батчи для больших объёмов
6. **Рекурсивные VIEW** — для иерархических данных

:::tip Золотое правило
Используйте VIEW для абстракции и упрощения, MATERIALIZED VIEW — для производительности сложных агрегаций. Всегда измеряйте производительность перед и после материализации.
:::

## Дополнительные ресурсы

- [PostgreSQL: CREATE VIEW](https://www.postgresql.org/docs/current/sql-createview.html)
- [PostgreSQL: CREATE MATERIALIZED VIEW](https://www.postgresql.org/docs/current/sql-creatematerializedview.html)
- [PostgreSQL: Rules and Views](https://www.postgresql.org/docs/current/rules-views.html)
- [PostgreSQL: Updatable Views](https://www.postgresql.org/docs/current/sql-createview.html#SQL-CREATEVIEW-UPDATABLE-VIEWS)
