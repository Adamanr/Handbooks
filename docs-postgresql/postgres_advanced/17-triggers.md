---
id: module-17-triggers
title: "Триггеры и правила"
sidebar_label: "Триггеры и правила"
sidebar_position: 17
description: "Полное руководство по триггерам и правилам в PostgreSQL"
keywords: [postgresql, triggers, rules]
---

# Триггеры и правила (Rules): автоматизация логики БД

## Введение

Триггеры и правила — это механизмы PostgreSQL для автоматического выполнения кода в ответ на события базы данных. Они позволяют вынести повторяющуюся логику прямо в БД, гарантируя её исполнение независимо от того, какое приложение работает с данными.

:::tip Ключевое отличие
**Триггер** выполняется *после* того как строка найдена/изменена — он работает на уровне строк или операторов.  
**Правило (Rule)** переписывает *сам SQL-запрос* до его выполнения — это механизм реwriter'а, а не executor'а.
:::

## Подготовка схемы

```sql
-- Полная схема для примеров урока
CREATE SCHEMA IF NOT EXISTS shop;
SET search_path TO shop;

-- Таблица продуктов
CREATE TABLE products (
    product_id   SERIAL PRIMARY KEY,
    sku          VARCHAR(50)    UNIQUE NOT NULL,
    name         VARCHAR(255)   NOT NULL,
    price        NUMERIC(10,2)  NOT NULL CHECK (price >= 0),
    stock        INTEGER        NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active    BOOLEAN        NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Таблица клиентов
CREATE TABLE customers (
    customer_id  SERIAL PRIMARY KEY,
    email        VARCHAR(255) UNIQUE NOT NULL,
    full_name    VARCHAR(255) NOT NULL,
    balance      NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Таблица заказов
CREATE TABLE orders (
    order_id     SERIAL PRIMARY KEY,
    customer_id  INTEGER NOT NULL REFERENCES customers(customer_id),
    status       VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
    total        NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Таблица позиций заказа
CREATE TABLE order_items (
    item_id     SERIAL PRIMARY KEY,
    order_id    INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id  INTEGER NOT NULL REFERENCES products(product_id),
    quantity    INTEGER NOT NULL CHECK (quantity > 0),
    unit_price  NUMERIC(10,2) NOT NULL
);

-- Таблица аудита
CREATE TABLE audit_log (
    log_id       BIGSERIAL PRIMARY KEY,
    table_name   TEXT         NOT NULL,
    operation    TEXT         NOT NULL,   -- INSERT / UPDATE / DELETE
    row_id       BIGINT,
    old_data     JSONB,
    new_data     JSONB,
    changed_by   TEXT         NOT NULL DEFAULT current_user,
    changed_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Таблица истории цен
CREATE TABLE price_history (
    history_id   BIGSERIAL PRIMARY KEY,
    product_id   INTEGER NOT NULL REFERENCES products(product_id),
    old_price    NUMERIC(10,2),
    new_price    NUMERIC(10,2),
    changed_by   TEXT NOT NULL DEFAULT current_user,
    changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Тестовые данные
INSERT INTO customers (email, full_name, balance) VALUES
    ('alice@example.com', 'Alice Smith',  5000),
    ('bob@example.com',   'Bob Johnson',  2000),
    ('carol@example.com', 'Carol White',  500);

INSERT INTO products (sku, name, price, stock) VALUES
    ('LAPTOP-01', 'Laptop Pro 15',   1299.99, 50),
    ('PHONE-01',  'Smartphone X',     899.99, 120),
    ('DESK-01',   'Standing Desk',    399.99, 30),
    ('CHAIR-01',  'Ergonomic Chair',  249.99, 45);
```

---

## Часть I: Триггеры

### Типы триггеров

PostgreSQL поддерживает несколько измерений классификации триггеров:

| Измерение | Значения | Описание |
|-----------|----------|----------|
| **Момент срабатывания** | `BEFORE` / `AFTER` / `INSTEAD OF` | До, после, или вместо события |
| **Событие** | `INSERT` / `UPDATE` / `DELETE` / `TRUNCATE` | Какая DML-операция |
| **Уровень** | `FOR EACH ROW` / `FOR EACH STATEMENT` | На каждую строку или на весь оператор |
| **Тип объекта** | таблица / представление | На что навешан триггер |

### Структура триггерной функции

Любой триггер состоит из двух частей:

1. **Триггерная функция** — PL/pgSQL-функция, возвращающая `TRIGGER`
2. **Определение триггера** — привязывает функцию к таблице и событию

```sql
-- Шаблон триггерной функции
CREATE OR REPLACE FUNCTION trigger_template()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Специальные переменные, доступные в теле:
    -- TG_NAME       — имя триггера
    -- TG_OP         — операция: 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'
    -- TG_TABLE_NAME — имя таблицы
    -- TG_TABLE_SCHEMA — схема таблицы
    -- TG_WHEN       — 'BEFORE' или 'AFTER'
    -- TG_LEVEL      — 'ROW' или 'STATEMENT'
    -- TG_NARGS      — количество аргументов триггера
    -- TG_ARGV[]     — массив аргументов

    -- NEW — новая строка (для INSERT и UPDATE)
    -- OLD — старая строка (для UPDATE и DELETE)

    -- BEFORE ROW триггер должен вернуть:
    --   NEW    — продолжить с (возможно изменённой) строкой
    --   OLD    — оставить строку без изменений
    --   NULL   — отменить операцию для этой строки

    -- AFTER и STATEMENT триггеры игнорируют возвращаемое значение
    RETURN NEW;
END;
$$;
```

---

## BEFORE триггеры

### Пример 1: Автоматическое обновление `updated_at`

Самый распространённый паттерн — одна универсальная функция для всех таблиц.

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

-- Применяем к таблице products
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Применяем к таблице orders
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Проверка
UPDATE products SET price = 1199.99 WHERE product_id = 1;
SELECT product_id, price, updated_at FROM products WHERE product_id = 1;
-- updated_at обновился автоматически!
```

### Пример 2: Нормализация данных перед записью

```sql
CREATE OR REPLACE FUNCTION normalize_customer_data()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Приводим email к нижнему регистру
    NEW.email := LOWER(TRIM(NEW.email));

    -- Убираем лишние пробелы из имени, каждое слово с заглавной буквы
    NEW.full_name := INITCAP(TRIM(REGEXP_REPLACE(NEW.full_name, '\s+', ' ', 'g')));

    -- Телефон — только цифры и +
    -- (если бы было поле phone)

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_customers_normalize
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION normalize_customer_data();

-- Тест
INSERT INTO customers (email, full_name, balance)
VALUES ('  DAVE@EXAMPLE.COM  ', '  dave   mcallister  ', 100);

SELECT email, full_name FROM customers WHERE email = 'dave@example.com';
-- dave@example.com | Dave Mcallister
```

### Пример 3: Защита от недопустимых изменений

```sql
-- Запрет понижения цены более чем на 50%
CREATE OR REPLACE FUNCTION guard_price_drop()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_drop_pct NUMERIC;
BEGIN
    -- Срабатываем только при изменении цены
    IF OLD.price = NEW.price THEN
        RETURN NEW;
    END IF;

    -- Считаем процент снижения
    v_drop_pct := (OLD.price - NEW.price) / OLD.price * 100;

    IF v_drop_pct > 50 THEN
        RAISE EXCEPTION
            'Price drop of %.1f%% exceeds maximum allowed 50%% '
            '(product_id=%, old=%, new=%)',
            v_drop_pct, OLD.product_id, OLD.price, NEW.price
            USING ERRCODE = 'P0001';
    END IF;

    -- Предупреждение при снижении более чем на 20%
    IF v_drop_pct > 20 THEN
        RAISE WARNING 'Large price drop (%.1f%%) on product %',
            v_drop_pct, OLD.sku;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_products_guard_price
    BEFORE UPDATE OF price ON products
    FOR EACH ROW
    EXECUTE FUNCTION guard_price_drop();

-- Тест
UPDATE products SET price = 999.99 WHERE product_id = 1;  -- OK
UPDATE products SET price = 100.00 WHERE product_id = 1;  -- ERROR!
```

### Пример 4: Генерация составных полей

```sql
-- Автогенерация order_number
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(30) UNIQUE;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_seq BIGINT;
BEGIN
    -- Получаем следующее значение внутренней последовательности
    SELECT nextval('orders_order_id_seq') INTO v_seq;

    NEW.order_number := 'ORD-'
        || TO_CHAR(NOW(), 'YYYYMMDD')
        || '-'
        || LPAD(v_seq::TEXT, 7, '0');

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orders_generate_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();

INSERT INTO orders (customer_id, total) VALUES (1, 0);
SELECT order_id, order_number FROM orders ORDER BY order_id DESC LIMIT 1;
-- ORD-20240315-0000001
```

---

## AFTER триггеры

### Пример 5: Аудит изменений

```sql
-- Универсальный аудит-триггер для любой таблицы
CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_row_id  BIGINT;
    v_old     JSONB;
    v_new     JSONB;
BEGIN
    -- Для INSERT/UPDATE берём id из NEW, для DELETE — из OLD
    CASE TG_OP
        WHEN 'INSERT' THEN
            v_row_id := NEW.product_id;  -- адаптировать под таблицу
            v_new    := to_jsonb(NEW);
            v_old    := NULL;
        WHEN 'UPDATE' THEN
            v_row_id := NEW.product_id;
            v_old    := to_jsonb(OLD);
            v_new    := to_jsonb(NEW);
        WHEN 'DELETE' THEN
            v_row_id := OLD.product_id;
            v_old    := to_jsonb(OLD);
            v_new    := NULL;
    END CASE;

    INSERT INTO audit_log (table_name, operation, row_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, v_row_id, v_old, v_new);

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

CREATE TRIGGER trg_products_audit
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION audit_changes();

-- Тест
UPDATE products SET price = 1350.00 WHERE product_id = 1;
DELETE FROM products WHERE product_id = 4;

SELECT operation, row_id, old_data->>'price' AS old_price,
       new_data->>'price' AS new_price, changed_at
FROM audit_log
ORDER BY log_id DESC LIMIT 5;
```

### Пример 6: Универсальный аудит через TG_ARGV

Сделаем функцию по-настоящему универсальной — указываем имя поля PK через аргумент.

```sql
CREATE OR REPLACE FUNCTION generic_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_pk_field TEXT    := TG_ARGV[0];  -- имя PK-колонки передаём аргументом
    v_pk_value BIGINT;
    v_old      JSONB;
    v_new      JSONB;
BEGIN
    IF TG_OP = 'DELETE' THEN
        EXECUTE format('SELECT ($1).%I', v_pk_field)
            INTO v_pk_value USING OLD;
        v_old := to_jsonb(OLD);
        v_new := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        EXECUTE format('SELECT ($1).%I', v_pk_field)
            INTO v_pk_value USING NEW;
        v_old := NULL;
        v_new := to_jsonb(NEW);
    ELSE  -- UPDATE
        EXECUTE format('SELECT ($1).%I', v_pk_field)
            INTO v_pk_value USING NEW;
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
    END IF;

    INSERT INTO audit_log (table_name, operation, row_id, old_data, new_data)
    VALUES (TG_TABLE_NAME, TG_OP, v_pk_value, v_old, v_new);

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Применяем к нескольким таблицам с разными PK
CREATE TRIGGER trg_customers_audit
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION generic_audit('customer_id');

CREATE TRIGGER trg_orders_audit
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generic_audit('order_id');
```

### Пример 7: История цен

```sql
CREATE OR REPLACE FUNCTION track_price_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Записываем только реальные изменения цены
    IF OLD.price IS DISTINCT FROM NEW.price THEN
        INSERT INTO price_history (product_id, old_price, new_price)
        VALUES (NEW.product_id, OLD.price, NEW.price);
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_products_price_history
    AFTER UPDATE OF price ON products
    FOR EACH ROW
    EXECUTE FUNCTION track_price_changes();

-- Тест
UPDATE products SET price = 1199.99 WHERE product_id = 1;
UPDATE products SET price = 1099.99 WHERE product_id = 1;
UPDATE products SET stock = 45      WHERE product_id = 1; -- НЕ попадёт в историю

SELECT * FROM price_history ORDER BY changed_at;
```

### Пример 8: Пересчёт итогов заказа

```sql
-- При добавлении/изменении/удалении позиции пересчитываем total в orders
CREATE OR REPLACE FUNCTION recalculate_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id  INTEGER;
    v_new_total NUMERIC(12,2);
BEGIN
    -- Определяем order_id
    v_order_id := COALESCE(NEW.order_id, OLD.order_id);

    SELECT COALESCE(SUM(quantity * unit_price), 0)
    INTO   v_new_total
    FROM   order_items
    WHERE  order_id = v_order_id;

    UPDATE orders
    SET    total = v_new_total
    WHERE  order_id = v_order_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_order_items_recalc_total
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_order_total();

-- Тест
INSERT INTO orders (customer_id) VALUES (1) RETURNING order_id;
-- Предположим, получили order_id = 1

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (1, 1, 2, 1299.99);  -- total = 2599.98

INSERT INTO order_items (order_id, product_id, quantity, unit_price)
VALUES (1, 2, 1, 899.99);   -- total = 3499.97

SELECT order_id, total FROM orders WHERE order_id = 1;
-- total автоматически обновился!
```

### Пример 9: Контроль остатков склада

```sql
CREATE OR REPLACE FUNCTION manage_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_stock INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Резервируем товар при добавлении позиции
        SELECT stock INTO v_current_stock
        FROM products
        WHERE product_id = NEW.product_id
        FOR UPDATE; -- блокируем строку

        IF v_current_stock < NEW.quantity THEN
            RAISE EXCEPTION
                'Insufficient stock for product_id=%. Available: %, Requested: %',
                NEW.product_id, v_current_stock, NEW.quantity
                USING ERRCODE = 'P0002';
        END IF;

        UPDATE products
        SET stock = stock - NEW.quantity
        WHERE product_id = NEW.product_id;

    ELSIF TG_OP = 'DELETE' THEN
        -- Возвращаем товар при удалении позиции
        UPDATE products
        SET stock = stock + OLD.quantity
        WHERE product_id = OLD.product_id;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Пересчитываем разницу
        IF OLD.quantity != NEW.quantity OR OLD.product_id != NEW.product_id THEN
            -- Возвращаем старое количество
            UPDATE products
            SET stock = stock + OLD.quantity
            WHERE product_id = OLD.product_id;

            -- Резервируем новое
            SELECT stock INTO v_current_stock
            FROM products
            WHERE product_id = NEW.product_id FOR UPDATE;

            IF v_current_stock < NEW.quantity THEN
                RAISE EXCEPTION
                    'Insufficient stock for product_id=%', NEW.product_id;
            END IF;

            UPDATE products
            SET stock = stock - NEW.quantity
            WHERE product_id = NEW.product_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_order_items_inventory
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION manage_inventory();
```

---

## INSTEAD OF триггеры (на представлениях)

INSTEAD OF — единственный способ сделать представление обновляемым.

### Пример 10: Обновляемое представление

```sql
-- Представление с данными из нескольких таблиц
CREATE VIEW order_summary AS
SELECT
    o.order_id,
    o.order_number,
    o.status,
    o.total,
    c.customer_id,
    c.full_name     AS customer_name,
    c.email         AS customer_email,
    o.created_at
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id;

-- Без INSTEAD OF это представление нельзя обновить
-- UPDATE order_summary SET status = 'confirmed' WHERE order_id = 1;
-- ERROR: cannot update a view

-- Создаём INSTEAD OF триггер
CREATE OR REPLACE FUNCTION order_summary_instead_of()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Обновляем только допустимые поля
        UPDATE orders
        SET status     = COALESCE(NEW.status, OLD.status),
            updated_at = NOW()
        WHERE order_id = OLD.order_id;

        -- Если изменили имя клиента — обновляем customers тоже
        IF NEW.customer_name IS DISTINCT FROM OLD.customer_name THEN
            UPDATE customers
            SET full_name = NEW.customer_name
            WHERE customer_id = OLD.customer_id;
        END IF;

        RETURN NEW;

    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO orders (customer_id, status)
        VALUES (NEW.customer_id, COALESCE(NEW.status, 'pending'));
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        -- Отмена заказа вместо физического удаления
        UPDATE orders SET status = 'cancelled' WHERE order_id = OLD.order_id;
        RETURN OLD;
    END IF;
END;
$$;

CREATE TRIGGER trg_order_summary_dml
    INSTEAD OF INSERT OR UPDATE OR DELETE ON order_summary
    FOR EACH ROW
    EXECUTE FUNCTION order_summary_instead_of();

-- Теперь можно обновлять представление!
UPDATE order_summary SET status = 'confirmed' WHERE order_id = 1;
DELETE FROM order_summary WHERE order_id = 2; -- отменяет, не удаляет
```

---

## FOR EACH STATEMENT триггеры

Statement-триггеры срабатывают один раз на весь оператор, а не на каждую строку.

### Пример 11: Логирование массовых операций

```sql
CREATE TABLE bulk_operation_log (
    log_id      BIGSERIAL PRIMARY KEY,
    table_name  TEXT,
    operation   TEXT,
    row_count   BIGINT,
    executed_by TEXT DEFAULT current_user,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION log_bulk_operation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO bulk_operation_log (table_name, operation, row_count)
    VALUES (TG_TABLE_NAME, TG_OP, NULL);
    -- row_count недоступен в statement-триггере напрямую
    RETURN NULL; -- Statement-триггер всегда возвращает NULL
END;
$$;

CREATE TRIGGER trg_products_bulk_log
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH STATEMENT
    EXECUTE FUNCTION log_bulk_operation();

-- Срабатывает один раз на весь UPDATE, не на каждую строку
UPDATE products SET price = price * 1.05;
SELECT * FROM bulk_operation_log;
```

### Пример 12: Запрет TRUNCATE

```sql
CREATE OR REPLACE FUNCTION prevent_truncate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION
        'TRUNCATE on table "%" is not allowed. Use DELETE with conditions.',
        TG_TABLE_NAME
        USING ERRCODE = 'P0003',
              HINT    = 'Use: DELETE FROM ' || TG_TABLE_NAME;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_orders_no_truncate
    BEFORE TRUNCATE ON orders
    FOR EACH STATEMENT
    EXECUTE FUNCTION prevent_truncate();

-- TRUNCATE orders; -- ERROR!
```

---

## Условные триггеры (WHEN)

Clause `WHEN` позволяет запускать триггер только при определённых условиях — без лишних вызовов.

```sql
-- Только если цена реально изменилась И стала выше
CREATE OR REPLACE FUNCTION notify_price_increase()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE NOTICE '[PRICE UP] % (id=%): % → %',
        NEW.name, NEW.product_id, OLD.price, NEW.price;
    -- В реальном проекте здесь: pg_notify, вставка в очередь и т.д.
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_products_price_up
    AFTER UPDATE ON products
    FOR EACH ROW
    WHEN (NEW.price > OLD.price)             -- только повышение
    EXECUTE FUNCTION notify_price_increase();

-- Ещё один: логируем только критичное снижение остатка
CREATE OR REPLACE FUNCTION alert_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE WARNING 'LOW STOCK ALERT: product "%" (id=%) — only % units left!',
        NEW.name, NEW.product_id, NEW.stock;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_products_low_stock
    AFTER UPDATE ON products
    FOR EACH ROW
    WHEN (NEW.stock < 10 AND OLD.stock >= 10)  -- только при пересечении порога
    EXECUTE FUNCTION alert_low_stock();
```

---

## Порядок выполнения триггеров

Когда на таблицу навешано несколько триггеров одного типа, они выполняются в алфавитном порядке имён.

```sql
-- trg_a_first  → выполнится первым
-- trg_b_second → выполнится вторым
-- trg_z_last   → выполнится последним

-- Демонстрация порядка
CREATE OR REPLACE FUNCTION demo_order_1()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE NOTICE 'Step 1: normalize'; RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION demo_order_2()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE NOTICE 'Step 2: validate'; RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION demo_order_3()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE NOTICE 'Step 3: compute'; RETURN NEW; END;
$$;

CREATE TRIGGER trg_a_normalize BEFORE INSERT ON products
    FOR EACH ROW EXECUTE FUNCTION demo_order_1();

CREATE TRIGGER trg_b_validate  BEFORE INSERT ON products
    FOR EACH ROW EXECUTE FUNCTION demo_order_2();

CREATE TRIGGER trg_z_compute   BEFORE INSERT ON products
    FOR EACH ROW EXECUTE FUNCTION demo_order_3();

-- INSERT INTO products ...
-- NOTICE: Step 1: normalize
-- NOTICE: Step 2: validate
-- NOTICE: Step 3: compute
```

---

## Деактивация и управление триггерами

```sql
-- Отключить триггер (только для суперпользователя или владельца таблицы)
ALTER TABLE products DISABLE TRIGGER trg_products_audit;

-- Включить обратно
ALTER TABLE products ENABLE TRIGGER trg_products_audit;

-- Отключить ВСЕ триггеры таблицы (осторожно!)
ALTER TABLE products DISABLE TRIGGER ALL;
ALTER TABLE products ENABLE  TRIGGER ALL;

-- Переименование
ALTER TRIGGER trg_products_audit ON products
    RENAME TO trg_products_full_audit;

-- Удаление
DROP TRIGGER IF EXISTS trg_products_full_audit ON products;

-- Просмотр всех триггеров
SELECT
    t.trigger_name,
    t.event_manipulation  AS event,
    t.action_timing       AS timing,
    t.action_orientation  AS level,
    t.action_condition    AS "when",
    t.event_object_table  AS table_name
FROM information_schema.triggers t
WHERE t.trigger_schema = 'shop'
ORDER BY t.event_object_table, t.trigger_name;

-- Просмотр тела триггерных функций
SELECT
    p.proname             AS func_name,
    pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'shop'
  AND p.prorettype = 'trigger'::regtype;
```

---

## Часть II: Правила (Rules)

### Что такое Rules?

Правила (Rules) — механизм **query rewriter** в PostgreSQL. В отличие от триггеров, правила переписывают AST запроса ещё до этапа планирования. Это позволяет реализовывать сложные маршруты данных, но требует осторожности: в большинстве случаев триггеры предпочтительнее.

```
SQL-запрос
     ↓
  Parser (AST)
     ↓
  Rule System ← Здесь работают Rules
     ↓
  Planner / Optimizer
     ↓
  Executor ← Здесь работают Triggers
```

### Синтаксис правил

```sql
CREATE [OR REPLACE] RULE имя AS
    ON { SELECT | INSERT | UPDATE | DELETE }
    TO таблица_или_вью
    [WHERE условие]
    DO [ALSO | INSTEAD]
    { NOTHING | команда | (команды) };
```

- **DO ALSO** — выполнить *дополнительно* к исходному запросу
- **DO INSTEAD** — выполнить *вместо* исходного запроса
- **DO NOTHING** — подавить исходный запрос (при условии)

### Правила на представлениях

Именно так PostgreSQL реализует стандартные обновляемые представления — через автоматически созданные правила `_RETURN`, `_INSERT`, `_UPDATE`, `_DELETE`.

```sql
-- Смотрим правила, которые PostgreSQL создал сам для простого view
CREATE VIEW active_products AS
SELECT * FROM products WHERE is_active = true;

SELECT rulename, ev_type, is_instead, ev_qual
FROM pg_rewrite
WHERE ev_class = 'active_products'::regclass;
-- PostgreSQL создал правило _RETURN для SELECT

-- Для UPDATE-able view PostgreSQL 9.3+ создаёт правила автоматически,
-- если представление простое. Для сложных — нужен INSTEAD OF триггер или Rule.

-- Ручное правило для INSERT в представление
CREATE RULE active_products_insert AS
    ON INSERT TO active_products
    DO INSTEAD
    INSERT INTO products (sku, name, price, stock, is_active)
    VALUES (NEW.sku, NEW.name, NEW.price, NEW.stock, true);

-- Правило для UPDATE — только по active записям
CREATE RULE active_products_update AS
    ON UPDATE TO active_products
    DO INSTEAD
    UPDATE products
    SET  sku       = NEW.sku,
         name      = NEW.name,
         price     = NEW.price,
         stock     = NEW.stock
    WHERE product_id = OLD.product_id
      AND is_active  = true;

-- Правило для DELETE — мягкое удаление
CREATE RULE active_products_delete AS
    ON DELETE TO active_products
    DO INSTEAD
    UPDATE products
    SET is_active = false
    WHERE product_id = OLD.product_id;

-- Теперь можно работать с представлением
INSERT INTO active_products (sku, name, price, stock)
VALUES ('MONITOR-01', '4K Monitor', 599.99, 20);

DELETE FROM active_products WHERE sku = 'CHAIR-01';
-- Реально выполнится: UPDATE products SET is_active = false WHERE ...
```

### DO ALSO: дополнительные действия

```sql
-- Создаём таблицу для зеркалирования
CREATE TABLE deleted_products_archive AS SELECT * FROM products LIMIT 0;
ALTER TABLE deleted_products_archive
    ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NOW();

-- При DELETE из products — архивируем запись
CREATE RULE archive_deleted_products AS
    ON DELETE TO products
    DO ALSO
    INSERT INTO deleted_products_archive
    SELECT OLD.*, NOW();

-- Тест
DELETE FROM products WHERE sku = 'DESK-01';
-- products: строка удалена
-- deleted_products_archive: строка добавлена
SELECT * FROM deleted_products_archive;
```

### DO NOTHING: подавление запросов по условию

```sql
-- Запрет UPDATE на archived записи
CREATE TABLE articles (
    article_id  SERIAL PRIMARY KEY,
    title       TEXT,
    content     TEXT,
    is_archived BOOLEAN DEFAULT false,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO articles (title, content) VALUES
    ('First Post', 'Content...'),
    ('Old Post',   'Old content...');

UPDATE articles SET is_archived = true WHERE article_id = 2;

-- Правило: молча игнорируем UPDATE на заархивированных статьях
CREATE RULE no_update_archived AS
    ON UPDATE TO articles
    WHERE (OLD.is_archived = true)
    DO INSTEAD NOTHING;

-- Тест
UPDATE articles SET title = 'Changed' WHERE article_id = 2;
-- 0 rows affected — тихо проигнорировано!

UPDATE articles SET title = 'Changed' WHERE article_id = 1;
-- 1 row affected — обычная статья обновилась
```

### Правила vs Триггеры: сравнение

```sql
-- Одна задача — два подхода

-- Задача: логировать DELETE из таблицы orders

-- === Подход 1: Правило ===
CREATE TABLE orders_delete_log (
    log_id      BIGSERIAL PRIMARY KEY,
    order_id    INTEGER,
    deleted_at  TIMESTAMPTZ DEFAULT NOW(),
    deleted_by  TEXT DEFAULT current_user
);

CREATE RULE log_order_delete_rule AS
    ON DELETE TO orders
    DO ALSO
    INSERT INTO orders_delete_log (order_id)
    VALUES (OLD.order_id);

-- === Подход 2: Триггер ===
CREATE OR REPLACE FUNCTION log_order_delete_trigger_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO orders_delete_log (order_id) VALUES (OLD.order_id);
    RETURN OLD;
END;
$$;

CREATE TRIGGER log_order_delete_trigger
    AFTER DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_order_delete_trigger_fn();

-- Важные отличия:
-- Rules: одно правило на весь DELETE-запрос (даже если удаляется 1000 строк)
-- Triggers: вызов функции для КАЖДОЙ удалённой строки
--
-- Rules: трудно отлаживать, неожиданное поведение при сложных запросах
-- Triggers: предсказуемое поведение, полная поддержка PL/pgSQL
--
-- Вывод: в современном PostgreSQL предпочитайте триггеры!
```

---

## Практический пример: Полная система аудита

Соберём всё воедино — универсальная, расширяемая система аудита.

```sql
-- Расширенная таблица аудита
CREATE TABLE audit_trail (
    id          BIGSERIAL PRIMARY KEY,
    event_time  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    schema_name TEXT         NOT NULL,
    table_name  TEXT         NOT NULL,
    operation   TEXT         NOT NULL,
    row_id      TEXT,                        -- текстовый PK (любой тип)
    username    TEXT         NOT NULL DEFAULT current_user,
    app_user    TEXT,                        -- SET LOCAL app.current_user = '...'
    client_ip   INET,
    changed_fields TEXT[],                   -- только изменённые поля
    old_values  JSONB,
    new_values  JSONB,
    query       TEXT                         -- фактический SQL
);

CREATE INDEX idx_audit_trail_table   ON audit_trail(table_name, event_time);
CREATE INDEX idx_audit_trail_row_id  ON audit_trail(table_name, row_id);
CREATE INDEX idx_audit_trail_user    ON audit_trail(username);

-- Функция аудита
CREATE OR REPLACE FUNCTION audit_trail_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- выполняется с правами создателя, не вызывающего
AS $$
DECLARE
    v_old         JSONB;
    v_new         JSONB;
    v_changed     TEXT[] := '{}';
    v_key         TEXT;
    v_pk_field    TEXT   := TG_ARGV[0];
    v_pk_value    TEXT;
    v_app_user    TEXT;
    v_client_ip   INET;
BEGIN
    -- Получаем application-level пользователя (если установлен)
    BEGIN
        v_app_user := current_setting('app.current_user');
    EXCEPTION WHEN OTHERS THEN
        v_app_user := NULL;
    END;

    -- IP клиента (если установлен через GUC)
    BEGIN
        v_client_ip := current_setting('app.client_ip')::INET;
    EXCEPTION WHEN OTHERS THEN
        v_client_ip := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        v_new := to_jsonb(NEW);
        v_old := NULL;
        EXECUTE format('SELECT ($1).%I::TEXT', v_pk_field)
            INTO v_pk_value USING NEW;

    ELSIF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD);
        v_new := NULL;
        EXECUTE format('SELECT ($1).%I::TEXT', v_pk_field)
            INTO v_pk_value USING OLD;

    ELSE -- UPDATE
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);
        EXECUTE format('SELECT ($1).%I::TEXT', v_pk_field)
            INTO v_pk_value USING NEW;

        -- Определяем только изменённые поля
        FOR v_key IN SELECT jsonb_object_keys(v_new) LOOP
            IF (v_old->v_key) IS DISTINCT FROM (v_new->v_key) THEN
                v_changed := v_changed || v_key;
            END IF;
        END LOOP;

        -- Если ничего не изменилось — пропускаем
        IF array_length(v_changed, 1) IS NULL THEN
            RETURN NEW;
        END IF;
    END IF;

    INSERT INTO audit_trail (
        schema_name, table_name, operation, row_id,
        app_user, client_ip, changed_fields,
        old_values, new_values, query
    ) VALUES (
        TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, v_pk_value,
        v_app_user, v_client_ip, v_changed,
        v_old, v_new, current_query()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Подключаем к таблицам
CREATE TRIGGER trg_products_trail
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION audit_trail_fn('product_id');

CREATE TRIGGER trg_orders_trail
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION audit_trail_fn('order_id');

CREATE TRIGGER trg_customers_trail
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION audit_trail_fn('customer_id');

-- Использование с application-level пользователем
SET LOCAL app.current_user = 'john.doe';
SET LOCAL app.client_ip    = '192.168.1.100';

UPDATE products SET price = 1399.99 WHERE product_id = 1;

-- Анализ аудита
SELECT
    event_time,
    operation,
    row_id,
    changed_fields,
    old_values->>'price' AS old_price,
    new_values->>'price' AS new_price,
    app_user
FROM audit_trail
WHERE table_name = 'products'
ORDER BY event_time DESC;
```

---

## Практический пример: Soft Delete через триггер

```sql
-- Мягкое удаление: DELETE превращается в UPDATE
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE OR REPLACE FUNCTION soft_delete_products()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Вместо DELETE — помечаем строку как удалённую
    UPDATE products
    SET deleted_at = NOW(),
        deleted_by = current_user,
        is_active  = false
    WHERE product_id = OLD.product_id
      AND deleted_at IS NULL;

    RETURN NULL; -- предотвращаем реальное DELETE
END;
$$;

CREATE TRIGGER trg_products_soft_delete
    BEFORE DELETE ON products
    FOR EACH ROW
    WHEN (OLD.deleted_at IS NULL)  -- только если ещё не удалён
    EXECUTE FUNCTION soft_delete_products();

-- Представление без "удалённых" строк
CREATE OR REPLACE VIEW products_live AS
SELECT * FROM products WHERE deleted_at IS NULL;

-- Тест
DELETE FROM products WHERE sku = 'PHONE-01';
-- Реального DELETE не произошло!

SELECT product_id, sku, is_active, deleted_at, deleted_by
FROM products WHERE sku = 'PHONE-01';
-- is_active=false, deleted_at установлен

SELECT sku FROM products_live WHERE sku = 'PHONE-01';
-- Пустой результат — "удалённый" товар не виден
```

---

## Лучшие практики

### Именование триггеров

```sql
-- Рекомендуемый формат:
-- trg_{таблица}_{событие/назначение}
-- trg_{таблица}_{timing}_{событие}_{назначение}

-- Хорошие примеры:
trg_products_updated_at
trg_orders_audit
trg_order_items_recalc_total
trg_products_before_insert_normalize
trg_customers_after_update_trail

-- Плохие примеры:
trigger1
my_trigger
update_trigger
```

### Чек-лист при написании триггера

```sql
-- ✅ 1. Возвращайте правильное значение
-- BEFORE ROW:  RETURN NEW (или NULL чтобы отменить)
-- AFTER ROW:   RETURN NEW или RETURN OLD (оба игнорируются)
-- STATEMENT:   RETURN NULL (всегда)
-- INSTEAD OF:  RETURN NEW (или OLD для DELETE)

-- ✅ 2. Проверяйте TG_OP при многособытийных триггерах
IF TG_OP = 'DELETE' THEN
    RETURN OLD;
ELSE
    RETURN NEW;
END IF;

-- ✅ 3. Избегайте рекурсии
-- Если триггер обновляет ту же таблицу — убедитесь,
-- что UPDATE не вызовет тот же триггер снова
-- Используйте условие WHEN или флаг-переменную

-- ✅ 4. Оборачивайте потенциально опасные операции в BEGIN/EXCEPTION
BEGIN
    -- рискованный код
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Trigger % error: %', TG_NAME, SQLERRM;
    RETURN COALESCE(NEW, OLD);  -- не ломаем основную операцию
END;

-- ✅ 5. Для AFTER-триггеров на больших таблицах
-- Убедитесь в наличии индексов для таблиц, в которые пишет триггер

-- ✅ 6. Документируйте триггеры
COMMENT ON TRIGGER trg_products_audit ON products
IS 'Records all DML changes to audit_trail table. Arg[0]: PK column name.';
```

### Диагностика производительности триггеров

```sql
-- Находим "дорогие" триггерные функции
SELECT
    p.proname           AS function_name,
    t.tgname            AS trigger_name,
    c.relname           AS table_name,
    calls,
    total_time,
    mean_exec_time,
    self_time
FROM pg_stat_user_functions f
JOIN pg_proc p ON f.funcid = p.oid
JOIN pg_trigger t ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE p.prorettype = 'trigger'::regtype
ORDER BY total_time DESC;

-- pg_stat_user_functions требует track_functions = 'all' в postgresql.conf
```

---

## Заключение

Триггеры и правила — мощный инструмент автоматизации логики PostgreSQL. Ключевые выводы:

1. **Триггеры** — предпочтительный инструмент для большинства задач
2. **BEFORE** — изменять/валидировать данные перед записью
3. **AFTER** — реагировать на изменения (аудит, пересчёт, уведомления)
4. **INSTEAD OF** — делать представления обновляемыми
5. **WHEN** — условие срабатывания без вызова функции
6. **FOR EACH STATEMENT** — операции, не требующие доступа к строкам
7. **Rules** — в основном для нестандартных маршрутов данных в представлениях; в большинстве случаев триггеры лучше
8. **Порядок** — алфавитный по имени триггера, проектируйте имена осознанно
9. **Производительность** — минимизируйте работу в теле триггера

:::tip Золотое правило
Триггер — это контракт между таблицей и БД. Если бизнес-правило должно выполняться **всегда** независимо от источника изменений — оно принадлежит триггеру.
:::

## Дополнительные ресурсы

- [PostgreSQL: CREATE TRIGGER](https://www.postgresql.org/docs/current/sql-createtrigger.html)
- [PostgreSQL: Trigger Functions](https://www.postgresql.org/docs/current/plpgsql-trigger.html)
- [PostgreSQL: Rules](https://www.postgresql.org/docs/current/rules.html)
- [PostgreSQL: Overview of Trigger Behaviour](https://www.postgresql.org/docs/current/trigger-definition.html)
