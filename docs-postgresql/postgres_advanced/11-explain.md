---
id: module-11-explain
title: "Анализ производительности: EXPLAIN, EXPLAIN ANALYZE, статистика"
sidebar_label: "Анализ производительности"
sidebar_position: 11
description: "Полное руководство по анализу производительности"
keywords: [postgresql, explain, analyze, statistics]
---

# Анализ производительности: EXPLAIN, EXPLAIN ANALYZE, статистика

## Введение

Оптимизация производительности баз данных начинается с понимания того, как именно PostgreSQL выполняет ваши запросы. В этом уроке мы подробно разберем инструменты анализа производительности: команды `EXPLAIN` и `EXPLAIN ANALYZE`, систему статистики PostgreSQL, а также научимся читать и интерпретировать планы выполнения запросов.

:::tip Зачем нужен анализ производительности?
Даже хорошо спроектированная база данных может работать медленно из-за неоптимальных запросов. `EXPLAIN` позволяет увидеть, как PostgreSQL планирует выполнить запрос, а `EXPLAIN ANALYZE` показывает фактическое время выполнения каждой операции.
:::

## Подготовка тестовой базы данных

Перед тем как начать изучение инструментов анализа, создадим тестовую базу данных с достаточным количеством данных для реалистичных примеров.

```sql
-- Создание таблиц для тестирования
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    country VARCHAR(50)
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(10, 2),
    status VARCHAR(20),
    shipping_country VARCHAR(50)
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER,
    quantity INTEGER,
    price NUMERIC(10, 2)
);

-- Заполнение таблиц тестовыми данными
INSERT INTO users (username, email, first_name, last_name, country, is_active)
SELECT 
    'user' || i,
    'user' || i || '@example.com',
    'FirstName' || i,
    'LastName' || i,
    CASE (i % 5)
        WHEN 0 THEN 'Russia'
        WHEN 1 THEN 'USA'
        WHEN 2 THEN 'Germany'
        WHEN 3 THEN 'France'
        ELSE 'UK'
    END,
    random() > 0.1
FROM generate_series(1, 100000) AS i;

INSERT INTO orders (user_id, order_date, total_amount, status, shipping_country)
SELECT 
    (random() * 99999 + 1)::INTEGER,
    CURRENT_TIMESTAMP - (random() * interval '365 days'),
    (random() * 1000)::NUMERIC(10, 2),
    CASE (random() * 4)::INTEGER
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'processing'
        WHEN 2 THEN 'shipped'
        ELSE 'delivered'
    END,
    CASE (random() * 4)::INTEGER
        WHEN 0 THEN 'Russia'
        WHEN 1 THEN 'USA'
        WHEN 2 THEN 'Germany'
        ELSE 'France'
    END
FROM generate_series(1, 500000);

INSERT INTO order_items (order_id, product_id, quantity, price)
SELECT 
    (random() * 499999 + 1)::INTEGER,
    (random() * 10000 + 1)::INTEGER,
    (random() * 10 + 1)::INTEGER,
    (random() * 500)::NUMERIC(10, 2)
FROM generate_series(1, 1000000);

-- Создание индексов
CREATE INDEX idx_users_country ON users(country);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Обновление статистики
ANALYZE users;
ANALYZE orders;
ANALYZE order_items;
```

## Команда EXPLAIN

### Что такое EXPLAIN?

**EXPLAIN** — это команда, которая показывает план выполнения запроса, созданный планировщиком PostgreSQL, без фактического выполнения запроса. Это позволяет быстро оценить стратегию выполнения запроса.

### Базовый синтаксис

```sql
EXPLAIN запрос;
```

### Первый пример

```sql
EXPLAIN SELECT * FROM users WHERE country = 'Russia';
```

Результат:
```
Bitmap Heap Scan on users  (cost=234.56..4567.89 rows=20000 width=123)
  Recheck Cond: ((country)::text = 'Russia'::text)
  ->  Bitmap Index Scan on idx_users_country  (cost=0.00..229.56 rows=20000 width=0)
        Index Cond: ((country)::text = 'Russia'::text)
```

### Понимание базового плана

Каждая строка плана содержит:

1. **Тип узла** — операция, которую выполняет PostgreSQL
2. **cost=X..Y** — оценочная стоимость:
   - Первое число (X) — стоимость запуска
   - Второе число (Y) — общая стоимость
3. **rows=N** — оценочное количество возвращаемых строк
4. **width=N** — средний размер строки в байтах

:::info Что такое "стоимость"?
Стоимость (cost) — это безразмерная величина, используемая планировщиком для сравнения планов. Она не соответствует времени выполнения напрямую, но более высокая стоимость обычно означает более медленное выполнение.
:::

### Параметры EXPLAIN

PostgreSQL поддерживает несколько параметров для более детального анализа:

```sql
EXPLAIN (
    ANALYZE [boolean],      -- Выполнить запрос и показать фактическое время
    VERBOSE [boolean],      -- Показать дополнительную информацию
    COSTS [boolean],        -- Показать оценки стоимости (по умолчанию true)
    BUFFERS [boolean],      -- Показать использование буферов
    TIMING [boolean],       -- Показать фактическое время для каждого узла
    SUMMARY [boolean],      -- Показать итоговую информацию
    FORMAT [TEXT|XML|JSON|YAML]  -- Формат вывода
) запрос;
```

### Примеры использования параметров

```sql
-- Подробный вывод
EXPLAIN (VERBOSE) 
SELECT username, email 
FROM users 
WHERE country = 'Russia';

-- Результат включает информацию о колонках:
-- Output: username, email
-- Filter: ((country)::text = 'Russia'::text)

-- Вывод в JSON формате
EXPLAIN (FORMAT JSON) 
SELECT * FROM users WHERE id = 12345;

-- Результат:
-- [
--   {
--     "Plan": {
--       "Node Type": "Index Scan",
--       "Startup Cost": 0.42,
--       "Total Cost": 8.44,
--       ...
--     }
--   }
-- ]

-- Все параметры вместе
EXPLAIN (ANALYZE, VERBOSE, BUFFERS, TIMING) 
SELECT u.username, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.is_active = true
GROUP BY u.id, u.username;
```

## EXPLAIN ANALYZE

### Что такое EXPLAIN ANALYZE?

`EXPLAIN ANALYZE` не только строит план выполнения, но и **фактически выполняет запрос**, измеряя реальное время выполнения каждой операции. Это самый важный инструмент для анализа производительности.

:::warning Важно!
`EXPLAIN ANALYZE` выполняет запрос полностью, включая все операции `INSERT`, `UPDATE`, `DELETE`. Используйте транзакции с ROLLBACK для тестирования изменяющих данные запросов.
:::

### Базовое использование

```sql
EXPLAIN ANALYZE 
SELECT * FROM users WHERE country = 'Russia';
```

Результат:
```
Bitmap Heap Scan on users  (cost=234.56..4567.89 rows=20000 width=123) 
                           (actual time=5.234..45.678 rows=20000 loops=1)
  Recheck Cond: ((country)::text = 'Russia'::text)
  Heap Blocks: exact=1234
  ->  Bitmap Index Scan on idx_users_country  (cost=0.00..229.56 rows=20000 width=0) 
                                              (actual time=3.456..3.456 rows=20000 loops=1)
        Index Cond: ((country)::text = 'Russia'::text)
Planning Time: 0.234 ms
Execution Time: 47.890 ms
```

### Интерпретация результатов EXPLAIN ANALYZE

Каждый узел теперь содержит дополнительную информацию:

1. **actual time=X..Y** — фактическое время в миллисекундах:
   - X — время до получения первой строки
   - Y — время получения всех строк
2. **rows=N** — фактическое количество возвращенных строк
3. **loops=N** — сколько раз выполнялся этот узел

В конце плана:
- **Planning Time** — время на построение плана
- **Execution Time** — общее время выполнения

### Сравнение оценок и фактических значений

```sql
EXPLAIN ANALYZE 
SELECT * FROM orders 
WHERE status = 'delivered' AND total_amount > 500;
```

Обратите внимание на разницу между оценочными (rows=...) и фактическими (actual rows=...) значениями:

```
Seq Scan on orders  (cost=0.00..12345.00 rows=5000 width=50) 
                    (actual time=0.123..234.567 rows=45678 loops=1)
  Filter: (((status)::text = 'delivered'::text) AND (total_amount > 500))
  Rows Removed by Filter: 454322
```

Здесь планировщик ожидал 5000 строк, но фактически получил 45678 — значительная разница!

:::danger Устаревшая статистика
Большая разница между оценками и фактическими значениями часто указывает на устаревшую статистику. Запустите `ANALYZE` для обновления статистики таблицы.
:::

## Типы узлов плана выполнения

### Сканирование таблиц

#### Sequential Scan (Seq Scan)

Последовательное чтение всех строк таблицы.

```sql
EXPLAIN ANALYZE 
SELECT * FROM users;
```

```
Seq Scan on users  (cost=0.00..2345.00 rows=100000 width=123)
                   (actual time=0.010..45.678 rows=100000 loops=1)
```

**Когда используется:**
- Таблица маленькая
- Нужно прочитать большую часть таблицы
- Нет подходящего индекса
- Планировщик считает Seq Scan быстрее

#### Index Scan

Чтение данных через индекс с обращением к таблице.

```sql
EXPLAIN ANALYZE 
SELECT * FROM users WHERE id = 12345;
```

```
Index Scan using users_pkey on users  (cost=0.42..8.44 rows=1 width=123)
                                      (actual time=0.023..0.024 rows=1 loops=1)
  Index Cond: (id = 12345)
```

**Когда используется:**
- Нужно вернуть небольшое количество строк
- Есть подходящий индекс
- Индекс покрывает условие WHERE

#### Index Only Scan

Чтение данных только из индекса, без обращения к таблице.

```sql
-- Создадим индекс, покрывающий запрос
CREATE INDEX idx_users_country_username ON users(country, username);

EXPLAIN ANALYZE 
SELECT country, username FROM users WHERE country = 'Russia';
```

```
Index Only Scan using idx_users_country_username on users  
    (cost=0.42..1234.56 rows=20000 width=18)
    (actual time=0.045..12.345 rows=20000 loops=1)
  Index Cond: (country = 'Russia'::text)
  Heap Fetches: 0
```

**Heap Fetches: 0** означает, что все данные были получены из индекса без обращения к таблице.

:::tip Index Only Scan
Для эффективной работы Index Only Scan таблица должна быть регулярно очищена с помощью VACUUM. Иначе PostgreSQL будет обращаться к таблице для проверки видимости строк.
:::

#### Bitmap Index Scan и Bitmap Heap Scan

Двухэтапный процесс: сначала создается битовая карта в индексе, затем читается таблица.

```sql
EXPLAIN ANALYZE 
SELECT * FROM users WHERE country = 'Russia';
```

```
Bitmap Heap Scan on users  (cost=234.56..4567.89 rows=20000 width=123)
                           (actual time=5.234..45.678 rows=20000 loops=1)
  Recheck Cond: (country = 'Russia'::text)
  Heap Blocks: exact=1234
  ->  Bitmap Index Scan on idx_users_country  
          (cost=0.00..229.56 rows=20000 width=0)
          (actual time=3.456..3.456 rows=20000 loops=1)
        Index Cond: (country = 'Russia'::text)
```

**Когда используется:**
- Нужно вернуть среднее количество строк
- Данные физически разбросаны по таблице
- Используется несколько индексов с операторами OR

### Операции соединения (JOIN)

#### Nested Loop Join

Вложенные циклы — для каждой строки первой таблицы сканируется вторая.

```sql
EXPLAIN ANALYZE 
SELECT u.username, o.total_amount
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.id < 100;
```

```
Nested Loop  (cost=0.85..234.56 rows=123 width=50)
             (actual time=0.045..2.345 rows=123 loops=1)
  ->  Index Scan using users_pkey on users u  
          (cost=0.42..45.67 rows=99 width=18)
          (actual time=0.012..0.234 rows=99 loops=1)
        Index Cond: (id < 100)
  ->  Index Scan using idx_orders_user_id on orders o  
          (cost=0.43..1.89 rows=2 width=36)
          (actual time=0.010..0.020 rows=1 loops=99)
        Index Cond: (user_id = u.id)
```

**Когда используется:**
- Одна из таблиц очень маленькая
- Есть эффективный индекс для соединения
- Ожидается мало строк

#### Hash Join

Строится хеш-таблица для одной таблицы, затем проверяется другая.

```sql
EXPLAIN ANALYZE 
SELECT u.username, o.total_amount
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.country = 'Russia';
```

```
Hash Join  (cost=5678.90..23456.78 rows=50000 width=50)
           (actual time=45.678..234.567 rows=50000 loops=1)
  Hash Cond: (o.user_id = u.id)
  ->  Seq Scan on orders o  (cost=0.00..12345.00 rows=500000 width=36)
                            (actual time=0.010..89.012 rows=500000 loops=1)
  ->  Hash  (cost=4567.89..4567.89 rows=20000 width=18)
            (actual time=34.567..34.567 rows=20000 loops=1)
        Buckets: 32768  Batches: 1  Memory Usage: 1234kB
        ->  Bitmap Heap Scan on users u  
                (cost=234.56..4567.89 rows=20000 width=18)
                (actual time=5.234..28.901 rows=20000 loops=1)
              Recheck Cond: (country = 'Russia'::text)
              ->  Bitmap Index Scan on idx_users_country  
                      (cost=0.00..229.56 rows=20000 width=0)
                      (actual time=3.456..3.456 rows=20000 loops=1)
```

**Когда используется:**
- Обе таблицы среднего или большого размера
- Нет подходящего индекса
- Ожидается много строк

#### Merge Join

Обе таблицы сортируются, затем объединяются.

```sql
-- Создадим индексы для демонстрации
CREATE INDEX idx_users_id_sorted ON users(id);
CREATE INDEX idx_orders_user_id_sorted ON orders(user_id);

EXPLAIN ANALYZE 
SELECT u.username, o.total_amount
FROM users u
JOIN orders o ON u.id = o.user_id
ORDER BY u.id;
```

```
Merge Join  (cost=123.45..23456.78 rows=500000 width=50)
            (actual time=0.234..567.890 rows=500000 loops=1)
  Merge Cond: (u.id = o.user_id)
  ->  Index Scan using users_pkey on users u  
          (cost=0.42..3456.78 rows=100000 width=18)
          (actual time=0.012..45.678 rows=100000 loops=1)
  ->  Index Scan using idx_orders_user_id on orders o  
          (cost=0.43..18901.23 rows=500000 width=36)
          (actual time=0.015..234.567 rows=500000 loops=1)
```

**Когда используется:**
- Данные уже отсортированы или есть подходящие индексы
- Нужен результат в отсортированном виде
- Обе таблицы большие

### Агрегация и сортировка

#### Sort

Сортировка результатов.

```sql
EXPLAIN ANALYZE 
SELECT * FROM users ORDER BY created_at DESC LIMIT 100;
```

```
Limit  (cost=4567.89..4567.92 rows=100 width=123)
       (actual time=45.678..45.689 rows=100 loops=1)
  ->  Sort  (cost=4567.89..4817.89 rows=100000 width=123)
            (actual time=45.677..45.682 rows=100 loops=1)
        Sort Key: created_at DESC
        Sort Method: top-N heapsort  Memory: 234kB
        ->  Seq Scan on users  (cost=0.00..2345.00 rows=100000 width=123)
                               (actual time=0.010..23.456 rows=100000 loops=1)
```

**Sort Method** может быть:
- **quicksort** — данные помещаются в память
- **external merge** — данные не помещаются, используется диск
- **top-N heapsort** — оптимизация для LIMIT

#### Aggregate

Агрегатные функции (COUNT, SUM, AVG, MAX, MIN).

```sql
EXPLAIN ANALYZE 
SELECT country, COUNT(*) 
FROM users 
GROUP BY country;
```

```
HashAggregate  (cost=2595.00..2595.05 rows=5 width=18)
               (actual time=67.890..67.892 rows=5 loops=1)
  Group Key: country
  Batches: 1  Memory Usage: 24kB
  ->  Seq Scan on users  (cost=0.00..2345.00 rows=100000 width=10)
                         (actual time=0.010..23.456 rows=100000 loops=1)
```

#### GroupAggregate vs HashAggregate

```sql
-- HashAggregate (данные в памяти)
EXPLAIN ANALYZE 
SELECT country, COUNT(*) 
FROM users 
GROUP BY country;

-- GroupAggregate (требует сортировки)
SET enable_hashagg = off;  -- Временно отключаем HashAggregate

EXPLAIN ANALYZE 
SELECT country, COUNT(*) 
FROM users 
GROUP BY country;

SET enable_hashagg = on;  -- Включаем обратно
```

```
GroupAggregate  (cost=12345.67..12595.72 rows=5 width=18)
                (actual time=89.012..123.456 rows=5 loops=1)
  Group Key: country
  ->  Sort  (cost=12345.67..12595.67 rows=100000 width=10)
            (actual time=89.010..101.234 rows=100000 loops=1)
        Sort Key: country
        Sort Method: external merge  Disk: 2048kB
        ->  Seq Scan on users  (cost=0.00..2345.00 rows=100000 width=10)
                               (actual time=0.010..23.456 rows=100000 loops=1)
```

## EXPLAIN с параметром BUFFERS

Параметр BUFFERS показывает детальную информацию об использовании кеша и операциях ввода-вывода.

```sql
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM users WHERE country = 'Russia';
```

```
Bitmap Heap Scan on users  (cost=234.56..4567.89 rows=20000 width=123)
                           (actual time=5.234..45.678 rows=20000 loops=1)
  Recheck Cond: (country = 'Russia'::text)
  Heap Blocks: exact=1234
  Buffers: shared hit=1456 read=123
  ->  Bitmap Index Scan on idx_users_country  
          (cost=0.00..229.56 rows=20000 width=0)
          (actual time=3.456..3.456 rows=20000 loops=1)
        Index Cond: (country = 'Russia'::text)
        Buffers: shared hit=222
```

### Интерпретация BUFFERS

- **shared hit=N** — блоки найдены в shared_buffers (кеше PostgreSQL)
- **shared read=N** — блоки прочитаны с диска
- **shared dirtied=N** — блоки изменены
- **shared written=N** — блоки записаны на диск
- **temp read=N** — временные блоки прочитаны
- **temp written=N** — временные блоки записаны

:::tip Оптимизация по BUFFERS
Высокое значение "shared read" означает много операций чтения с диска. Это может указывать на недостаточный размер кеша или необходимость оптимизации запроса.
:::

### Примеры анализа BUFFERS

```sql
-- Запрос, который использует только кеш (хорошо)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM users WHERE id = 12345;
-- Buffers: shared hit=4

-- Запрос, который читает с диска (плохо, если повторяется)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM orders;
-- Buffers: shared hit=1234 read=5678

-- Запрос, использующий временные файлы (очень плохо)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM users ORDER BY created_at;
-- Buffers: shared hit=2345
-- Sort Method: external merge  Disk: 102400kB
-- Buffers: temp read=12800 written=12800
```

## Статистика PostgreSQL

### Система статистики

PostgreSQL собирает статистику о распределении данных в таблицах для построения оптимальных планов выполнения.

#### Просмотр статистики таблицы

```sql
-- Базовая статистика таблицы
SELECT 
    schemaname,
    tablename,
    n_live_tup,      -- Количество живых строк
    n_dead_tup,      -- Количество мертвых строк
    n_mod_since_analyze,  -- Изменений с последнего ANALYZE
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'users';
```

#### Детальная статистика колонок

```sql
SELECT 
    tablename,
    attname,          -- Имя колонки
    null_frac,        -- Доля NULL значений
    avg_width,        -- Средний размер значения
    n_distinct,       -- Количество уникальных значений
    correlation       -- Корреляция с физическим порядком
FROM pg_stats
WHERE tablename = 'users'
ORDER BY attname;
```

:::info Корреляция
Значение correlation от -1 до 1 показывает, насколько порядок значений в колонке соответствует физическому порядку строк на диске. Значения близкие к 1 или -1 означают хорошую корреляцию, что делает индексное сканирование более эффективным.
:::

#### Самые частые значения (MCV)

```sql
SELECT 
    tablename,
    attname,
    most_common_vals,      -- Самые частые значения
    most_common_freqs      -- Частоты этих значений
FROM pg_stats
WHERE tablename = 'users' 
    AND attname = 'country';
```

### Команда ANALYZE

ANALYZE обновляет статистику таблицы, собирая информацию о распределении данных.

```sql
-- Анализ всех таблиц в базе данных
ANALYZE;

-- Анализ конкретной таблицы
ANALYZE users;

-- Анализ конкретных колонок
ANALYZE users (country, created_at);

-- Анализ с verbose выводом
ANALYZE VERBOSE users;
```

#### Когда запускать ANALYZE

- После массовой загрузки данных
- После значительных изменений в таблице
- Когда планы выполнения неоптимальны
- Когда автоматический ANALYZE не справляется

#### Настройка автоматического ANALYZE

```sql
-- Просмотр настроек autovacuum для таблицы
SELECT 
    relname,
    reloptions
FROM pg_class
WHERE relname = 'users';

-- Настройка порога для autovacuum ANALYZE
ALTER TABLE users SET (
    autovacuum_analyze_scale_factor = 0.05,  -- 5% изменений
    autovacuum_analyze_threshold = 50         -- Минимум 50 строк
);

-- Отключение autovacuum для таблицы (не рекомендуется!)
ALTER TABLE users SET (
    autovacuum_enabled = false
);
```

### Статистика использования индексов

```sql
-- Общая статистика использования индексов
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,              -- Количество сканирований индекса
    idx_tup_read,          -- Строк прочитано индексом
    idx_tup_fetch,         -- Строк получено из таблицы
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Неиспользуемые индексы
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan = 0
    AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Эффективность индексов
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    CASE 
        WHEN idx_tup_read > 0 
        THEN round((idx_tup_fetch::numeric / idx_tup_read * 100), 2)
        ELSE 0 
    END as fetch_percentage
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND idx_scan > 0
ORDER BY idx_scan DESC;
```
