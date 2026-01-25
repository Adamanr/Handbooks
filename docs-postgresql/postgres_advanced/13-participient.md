---
id: module-13-participient
title: "Партиционирование таблиц: виды, применение, преимущества"
sidebar_label: "Партиционирование таблиц"
sidebar_position: 13
description: "Полное руководство по партиционированию таблиц в PostgreSQL"
keywords: [postgresql, partitioning, database, performance, scalability]
---

# Партиционирование таблиц: виды, применение, преимущества

## Введение

**Партиционирование (partitioning)** — это техника разделения больших таблиц на более мелкие физические части (партиции), при этом логически таблица остается единой. Это один из самых эффективных способов улучшить производительность при работе с огромными объемами данных.

:::tip Когда нужно партиционирование?
Партиционирование особенно полезно для таблиц размером более 100 ГБ, где запросы обращаются только к части данных (например, последние 30 дней из таблицы логов за 5 лет).
:::

## Зачем нужно партиционирование?

### Основные преимущества

**1. Улучшение производительности запросов**
- PostgreSQL сканирует только нужные партиции (partition pruning)
- Уменьшается объем данных для обработки
- Индексы становятся меньше и эффективнее

**2. Упрощение обслуживания**
- Быстрое удаление старых данных (DROP/DETACH партиции вместо DELETE)
- VACUUM и ANALYZE работают быстрее на маленьких партициях
- Можно делать REINDEX по частям

**3. Масштабируемость**
- Партиции можно размещать на разных табличных пространствах
- Возможность архивирования старых партиций на медленные диски
- Лучшее распределение I/O операций

**4. Гибкость управления данными**
- Разные настройки для разных партиций
- Выборочное резервное копирование
- Упрощенная миграция данных

### Когда НЕ нужно партиционирование?

- Таблица меньше 10-20 ГБ
- Нет естественного ключа для партиционирования
- Запросы обращаются ко всем данным сразу
- Частые UPDATE, которые изменяют ключ партиционирования

## Типы партиционирования в PostgreSQL

PostgreSQL поддерживает три основных метода партиционирования:

1. **Range Partitioning** (по диапазонам)
2. **List Partitioning** (по списку значений)
3. **Hash Partitioning** (по хешу)

Также доступно **многоуровневое партиционирование** (комбинация методов).

## Range Partitioning (По диапазонам)

### Концепция

**Range partitioning** разделяет данные на основе диапазонов значений. Это самый популярный метод для данных с временными метками или последовательными числовыми значениями.

### Базовый пример: логи по датам

```sql
-- Создание главной партиционированной таблицы
CREATE TABLE logs (
    id BIGSERIAL,
    log_time TIMESTAMP NOT NULL,
    level VARCHAR(10),
    message TEXT,
    user_id INTEGER,
    ip_address INET
) PARTITION BY RANGE (log_time);

-- Создание партиций для каждого месяца
CREATE TABLE logs_2024_01 PARTITION OF logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE logs_2024_02 PARTITION OF logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

CREATE TABLE logs_2024_03 PARTITION OF logs
    FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

CREATE TABLE logs_2024_04 PARTITION OF logs
    FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');

-- Партиция по умолчанию для данных вне диапазонов
CREATE TABLE logs_default PARTITION OF logs DEFAULT;

-- Создание индексов на партициях
CREATE INDEX idx_logs_2024_01_time ON logs_2024_01(log_time);
CREATE INDEX idx_logs_2024_02_time ON logs_2024_02(log_time);
CREATE INDEX idx_logs_2024_03_time ON logs_2024_03(log_time);
CREATE INDEX idx_logs_2024_04_time ON logs_2024_04(log_time);

-- Или создание индекса на главной таблице (автоматически создаст на всех партициях)
CREATE INDEX idx_logs_user_id ON logs(user_id);
```

### Вставка данных

```sql
-- Вставка автоматически попадает в нужную партицию
INSERT INTO logs (log_time, level, message, user_id, ip_address)
VALUES 
    ('2024-01-15 10:30:00', 'INFO', 'User logged in', 12345, '192.168.1.1'),
    ('2024-02-20 14:45:00', 'ERROR', 'Connection timeout', 67890, '10.0.0.5'),
    ('2024-03-10 09:15:00', 'WARNING', 'High memory usage', 11111, '172.16.0.10');

-- Массовая вставка
INSERT INTO logs (log_time, level, message, user_id)
SELECT 
    TIMESTAMP '2024-01-01' + (random() * interval '120 days'),
    CASE (random() * 3)::INTEGER
        WHEN 0 THEN 'INFO'
        WHEN 1 THEN 'WARNING'
        ELSE 'ERROR'
    END,
    'Sample log message ' || generate_series,
    (random() * 100000)::INTEGER
FROM generate_series(1, 1000000);
```

### Запросы к партиционированной таблице

```sql
-- PostgreSQL автоматически выбирает нужную партицию (partition pruning)
EXPLAIN ANALYZE
SELECT * FROM logs 
WHERE log_time >= '2024-02-01' AND log_time < '2024-03-01';

-- Результат покажет, что сканируется только logs_2024_02
/*
Seq Scan on logs_2024_02 logs  (cost=0.00..234.56 rows=1234 width=89)
  Filter: ((log_time >= '2024-02-01'::timestamp) AND 
           (log_time < '2024-03-01'::timestamp))
*/

-- Запрос с несколькими партициями
EXPLAIN ANALYZE
SELECT level, COUNT(*) 
FROM logs 
WHERE log_time >= '2024-01-15' AND log_time < '2024-03-15'
GROUP BY level;

-- Сканируются только logs_2024_01, logs_2024_02, logs_2024_03
```

:::info Partition Pruning
**PostgreSQL** автоматически исключает партиции, которые не содержат нужных данных. Это называется "partition pruning" и значительно ускоряет запросы.
:::

### Управление партициями

```sql
-- Просмотр всех партиций таблицы
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE 'logs_%'
ORDER BY tablename;

-- Добавление новой партиции для следующего месяца
CREATE TABLE logs_2024_05 PARTITION OF logs
    FOR VALUES FROM ('2024-05-01') TO ('2024-06-01');

-- Отсоединение партиции (данные остаются, но становятся отдельной таблицей)
ALTER TABLE logs DETACH PARTITION logs_2024_01;

-- Теперь logs_2024_01 - обычная таблица, можно архивировать или удалить
-- Архивирование
CREATE TABLE logs_archive_2024_01 AS SELECT * FROM logs_2024_01;
DROP TABLE logs_2024_01;

-- Или экспорт в файл
COPY logs_2024_01 TO '/path/to/archive/logs_2024_01.csv' WITH CSV HEADER;

-- Присоединение существующей таблицы как партиции
ALTER TABLE logs ATTACH PARTITION logs_2024_01
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Удаление партиции (БЫСТРО - без DELETE)
DROP TABLE logs_2024_01;
```

### Автоматическое создание партиций

```sql
-- Функция для автоматического создания партиций
CREATE OR REPLACE FUNCTION create_monthly_partitions(
    table_name TEXT,
    start_date DATE,
    end_date DATE
)
RETURNS void AS $$
DECLARE
    partition_date DATE;
    partition_name TEXT;
    start_range DATE;
    end_range DATE;
BEGIN
    partition_date := DATE_TRUNC('month', start_date);
    
    WHILE partition_date < end_date LOOP
        start_range := partition_date;
        end_range := partition_date + interval '1 month';
        partition_name := table_name || '_' || TO_CHAR(partition_date, 'YYYY_MM');
        
        -- Проверка существования партиции
        IF NOT EXISTS (
            SELECT 1 FROM pg_class WHERE relname = partition_name
        ) THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
                partition_name,
                table_name,
                start_range,
                end_range
            );
            
            RAISE NOTICE 'Created partition %', partition_name;
        END IF;
        
        partition_date := partition_date + interval '1 month';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Создание партиций на год вперед
SELECT create_monthly_partitions('logs', '2024-01-01', '2025-01-01');

-- Автоматизация с помощью pg_cron или внешнего планировщика
-- Каждый месяц создавать партиции на 3 месяца вперед
```

### Range партиционирование по числовым значениям

```sql
-- Партиционирование заказов по сумме
CREATE TABLE orders (
    id BIGSERIAL,
    customer_id INTEGER,
    order_date TIMESTAMP,
    total_amount NUMERIC(12, 2),
    status VARCHAR(20)
) PARTITION BY RANGE (total_amount);

-- Малые заказы (до $100)
CREATE TABLE orders_small PARTITION OF orders
    FOR VALUES FROM (0) TO (100);

-- Средние заказы ($100 - $1000)
CREATE TABLE orders_medium PARTITION OF orders
    FOR VALUES FROM (100) TO (1000);

-- Большие заказы ($1000 - $10000)
CREATE TABLE orders_large PARTITION OF orders
    FOR VALUES FROM (1000) TO (10000);

-- VIP заказы (более $10000)
CREATE TABLE orders_vip PARTITION OF orders
    FOR VALUES FROM (10000) TO (MAXVALUE);

-- Запрос использует только нужную партицию
EXPLAIN SELECT * FROM orders WHERE total_amount BETWEEN 500 AND 800;
-- Сканируется только orders_medium
```

## List Partitioning (По списку значений)

### Концепция

**List partitioning** разделяет данные на основе списка дискретных значений. Идеально для категориальных данных.

### Пример: клиенты по регионам

```sql
-- Создание партиционированной таблицы
CREATE TABLE customers (
    id SERIAL,
    name VARCHAR(100),
    email VARCHAR(100),
    country VARCHAR(50),
    registration_date TIMESTAMP,
    is_active BOOLEAN
) PARTITION BY LIST (country);

-- Партиция для Северной Америки
CREATE TABLE customers_north_america PARTITION OF customers
    FOR VALUES IN ('USA', 'Canada', 'Mexico');

-- Партиция для Европы
CREATE TABLE customers_europe PARTITION OF customers
    FOR VALUES IN ('UK', 'Germany', 'France', 'Spain', 'Italy');

-- Партиция для Азии
CREATE TABLE customers_asia PARTITION OF customers
    FOR VALUES IN ('China', 'Japan', 'India', 'South Korea', 'Singapore');

-- Партиция для остального мира
CREATE TABLE customers_other PARTITION OF customers DEFAULT;

-- Вставка данных
INSERT INTO customers (name, email, country, registration_date, is_active)
VALUES 
    ('John Doe', 'john@example.com', 'USA', NOW(), true),
    ('Marie Dubois', 'marie@example.fr', 'France', NOW(), true),
    ('Yuki Tanaka', 'yuki@example.jp', 'Japan', NOW(), true),
    ('Carlos Silva', 'carlos@example.br', 'Brazil', NOW(), true);

-- Запрос к конкретной партиции
EXPLAIN SELECT * FROM customers WHERE country = 'USA';
-- Сканируется только customers_north_america

-- Запрос ко многим партициям
EXPLAIN SELECT * FROM customers WHERE country IN ('USA', 'China');
-- Сканируются customers_north_america и customers_asia
```

### Пример: заказы по статусу

```sql
CREATE TABLE orders_by_status (
    id BIGSERIAL,
    customer_id INTEGER,
    order_date TIMESTAMP,
    total_amount NUMERIC(12, 2),
    status VARCHAR(20)
) PARTITION BY LIST (status);

-- Активные статусы
CREATE TABLE orders_active PARTITION OF orders_by_status
    FOR VALUES IN ('pending', 'processing', 'payment_pending');

-- Статусы доставки
CREATE TABLE orders_shipping PARTITION OF orders_by_status
    FOR VALUES IN ('shipped', 'in_transit', 'out_for_delivery');

-- Завершенные
CREATE TABLE orders_completed PARTITION OF orders_by_status
    FOR VALUES IN ('delivered', 'completed');

-- Проблемные
CREATE TABLE orders_issues PARTITION OF orders_by_status
    FOR VALUES IN ('cancelled', 'refunded', 'failed');

-- Быстрое удаление всех отмененных заказов
TRUNCATE orders_issues;
```

## Hash Partitioning (По хешу)

### Концепция

**Hash partitioning** равномерно распределяет данные по партициям на основе хеш-функции. Используется когда нет естественного ключа для партиционирования, но нужно распределить нагрузку.

### Пример: пользователи по хешу ID

```sql
-- Создание партиционированной таблицы
CREATE TABLE users (
    id SERIAL,
    username VARCHAR(50),
    email VARCHAR(100),
    created_at TIMESTAMP,
    last_login TIMESTAMP
) PARTITION BY HASH (id);

-- Создание 4 партиций для равномерного распределения
CREATE TABLE users_h0 PARTITION OF users
    FOR VALUES WITH (MODULUS 4, REMAINDER 0);

CREATE TABLE users_h1 PARTITION OF users
    FOR VALUES WITH (MODULUS 4, REMAINDER 1);

CREATE TABLE users_h2 PARTITION OF users
    FOR VALUES WITH (MODULUS 4, REMAINDER 2);

CREATE TABLE users_h3 PARTITION OF users
    FOR VALUES WITH (MODULUS 4, REMAINDER 3);

-- Вставка данных равномерно распределяется
INSERT INTO users (username, email, created_at)
SELECT 
    'user' || i,
    'user' || i || '@example.com',
    NOW() - (random() * interval '365 days')
FROM generate_series(1, 100000) i;

-- Проверка распределения
SELECT 
    tableoid::regclass AS partition_name,
    COUNT(*) as row_count
FROM users
GROUP BY tableoid
ORDER BY partition_name;

/*
 partition_name | row_count 
----------------+-----------
 users_h0       |     25043
 users_h1       |     24989
 users_h2       |     24967
 users_h3       |     25001
*/
```

### Когда использовать Hash партиционирование

**Преимущества:**
- Равномерное распределение данных
- Хорошо для параллельной обработки
- Нет "горячих" партиций

**Недостатки:**
- Нельзя удалить отдельную партицию с данными
- Partition pruning не работает для большинства запросов
- Сложнее добавлять/удалять партиции

```sql
-- Hash партиционирование полезно для балансировки нагрузки
-- Пример: сессии пользователей
CREATE TABLE user_sessions (
    session_id UUID PRIMARY KEY,
    user_id INTEGER,
    created_at TIMESTAMP,
    expires_at TIMESTAMP,
    data JSONB
) PARTITION BY HASH (session_id);

-- 8 партиций для параллельной обработки
CREATE TABLE user_sessions_h0 PARTITION OF user_sessions
    FOR VALUES WITH (MODULUS 8, REMAINDER 0);
-- ... создать h1 через h7

-- Запросы распределяются по партициям
-- Хорошо для высоконагруженных систем с множеством параллельных операций
```

## Многоуровневое партиционирование

### Концепция

**Многоуровневое (sub-partitioning)** — это партиционирование партиций. Комбинирует разные методы для максимальной гибкости.

### Пример: логи по дате и уровню

```sql
-- Первый уровень: партиционирование по дате (RANGE)
CREATE TABLE application_logs (
    id BIGSERIAL,
    log_time TIMESTAMP NOT NULL,
    level VARCHAR(10) NOT NULL,
    application VARCHAR(50),
    message TEXT,
    metadata JSONB
) PARTITION BY RANGE (log_time);

-- Создание месячных партиций
CREATE TABLE logs_2024_01 PARTITION OF application_logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01')
    PARTITION BY LIST (level);  -- Второй уровень: по уровню логирования

-- Суб-партиции для января 2024
CREATE TABLE logs_2024_01_info PARTITION OF logs_2024_01
    FOR VALUES IN ('INFO', 'DEBUG');

CREATE TABLE logs_2024_01_warning PARTITION OF logs_2024_01
    FOR VALUES IN ('WARNING');

CREATE TABLE logs_2024_01_error PARTITION OF logs_2024_01
    FOR VALUES IN ('ERROR', 'CRITICAL');

-- То же для февраля
CREATE TABLE logs_2024_02 PARTITION OF application_logs
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01')
    PARTITION BY LIST (level);

CREATE TABLE logs_2024_02_info PARTITION OF logs_2024_02
    FOR VALUES IN ('INFO', 'DEBUG');

CREATE TABLE logs_2024_02_warning PARTITION OF logs_2024_02
    FOR VALUES IN ('WARNING');

CREATE TABLE logs_2024_02_error PARTITION OF logs_2024_02
    FOR VALUES IN ('ERROR', 'CRITICAL');

-- Вставка данных
INSERT INTO application_logs (log_time, level, application, message)
VALUES 
    ('2024-01-15 10:30:00', 'INFO', 'WebApp', 'User login'),
    ('2024-01-20 14:45:00', 'ERROR', 'API', 'Database connection failed'),
    ('2024-02-10 09:15:00', 'WARNING', 'Worker', 'High memory usage');

-- Эффективные запросы используют оба уровня партиционирования
EXPLAIN SELECT * FROM application_logs
WHERE log_time >= '2024-01-01' AND log_time < '2024-02-01'
    AND level = 'ERROR';
-- Сканируется ТОЛЬКО logs_2024_01_error!
```

### Пример: продажи по региону и дате

```sql
-- Первый уровень: по региону (LIST)
CREATE TABLE sales (
    id BIGSERIAL,
    sale_date DATE NOT NULL,
    region VARCHAR(50) NOT NULL,
    product_id INTEGER,
    amount NUMERIC(12, 2),
    customer_id INTEGER
) PARTITION BY LIST (region);

-- Региональные партиции
CREATE TABLE sales_north_america PARTITION OF sales
    FOR VALUES IN ('USA', 'Canada', 'Mexico')
    PARTITION BY RANGE (sale_date);  -- Второй уровень: по дате

CREATE TABLE sales_europe PARTITION OF sales
    FOR VALUES IN ('UK', 'Germany', 'France')
    PARTITION BY RANGE (sale_date);

-- Суб-партиции для Северной Америки
CREATE TABLE sales_north_america_2024_q1 PARTITION OF sales_north_america
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE sales_north_america_2024_q2 PARTITION OF sales_north_america
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Суб-партиции для Европы
CREATE TABLE sales_europe_2024_q1 PARTITION OF sales_europe
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE sales_europe_2024_q2 PARTITION OF sales_europe
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Запрос к конкретной суб-партиции
EXPLAIN SELECT SUM(amount) FROM sales
WHERE region = 'USA' 
    AND sale_date >= '2024-01-01' 
    AND sale_date < '2024-04-01';
-- Сканируется ТОЛЬКО sales_north_america_2024_q1
```

### Трехуровневое партиционирование

```sql
-- Уровень 1: по году (RANGE)
-- Уровень 2: по региону (LIST)  
-- Уровень 3: по месяцу (RANGE)

CREATE TABLE events (
    id BIGSERIAL,
    event_time TIMESTAMP NOT NULL,
    region VARCHAR(50) NOT NULL,
    event_type VARCHAR(50),
    data JSONB
) PARTITION BY RANGE (event_time);

-- Партиция для 2024 года
CREATE TABLE events_2024 PARTITION OF events
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01')
    PARTITION BY LIST (region);

-- Региональные суб-партиции 2024
CREATE TABLE events_2024_usa PARTITION OF events_2024
    FOR VALUES IN ('USA')
    PARTITION BY RANGE (event_time);

-- Месячные суб-суб-партиции для USA 2024
CREATE TABLE events_2024_usa_01 PARTITION OF events_2024_usa
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE events_2024_usa_02 PARTITION OF events_2024_usa
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Очень точное сканирование
EXPLAIN SELECT * FROM events
WHERE event_time >= '2024-01-15'
    AND event_time < '2024-01-20'
    AND region = 'USA';
-- Сканируется ТОЛЬКО events_2024_usa_01
```

## Практические сценарии применения

### Сценарий 1: Таблица логов с ротацией

```sql
-- Требование: хранить логи 90 дней, ежедневная ротация
CREATE TABLE system_logs (
    id BIGSERIAL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(20),
    source VARCHAR(100),
    message TEXT,
    metadata JSONB
) PARTITION BY RANGE (created_at);

-- Функция создания ежедневных партиций
CREATE OR REPLACE FUNCTION create_daily_log_partitions()
RETURNS void AS $$
DECLARE
    partition_date DATE;
    partition_name TEXT;
    start_date TIMESTAMP;
    end_date TIMESTAMP;
BEGIN
    -- Создаем партиции на 7 дней вперед
    FOR i IN 0..6 LOOP
        partition_date := CURRENT_DATE + i;
        partition_name := 'system_logs_' || TO_CHAR(partition_date, 'YYYY_MM_DD');
        start_date := partition_date::TIMESTAMP;
        end_date := (partition_date + 1)::TIMESTAMP;
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_class WHERE relname = partition_name
        ) THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF system_logs FOR VALUES FROM (%L) TO (%L)',
                partition_name, start_date, end_date
            );
            
            -- Создание индексов на новой партиции
            EXECUTE format(
                'CREATE INDEX idx_%I_severity ON %I(severity)',
                partition_name, partition_name
            );
            
            RAISE NOTICE 'Created partition %', partition_name;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Функция удаления старых партиций
CREATE OR REPLACE FUNCTION drop_old_log_partitions(retention_days INTEGER)
RETURNS void AS $$
DECLARE
    partition_record RECORD;
    partition_date DATE;
    cutoff_date DATE;
BEGIN
    cutoff_date := CURRENT_DATE - retention_days;
    
    FOR partition_record IN
        SELECT tablename 
        FROM pg_tables 
        WHERE tablename LIKE 'system_logs_%'
            AND tablename != 'system_logs'
    LOOP
        -- Извлекаем дату из имени партиции
        partition_date := TO_DATE(
            regexp_replace(partition_record.tablename, 'system_logs_', ''),
            'YYYY_MM_DD'
        );
        
        IF partition_date < cutoff_date THEN
            EXECUTE format('DROP TABLE %I', partition_record.tablename);
            RAISE NOTICE 'Dropped old partition %', partition_record.tablename;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Настройка автоматического обслуживания (например, через pg_cron)
-- Каждый день в 00:01
SELECT cron.schedule('create-log-partitions', '1 0 * * *', 
    'SELECT create_daily_log_partitions()');

-- Каждый день в 00:30 удалять партиции старше 90 дней
SELECT cron.schedule('cleanup-old-logs', '30 0 * * *',
    'SELECT drop_old_log_partitions(90)');
```

### Сценарий 2: Таблица метрик с высокой нагрузкой

```sql
-- Требование: миллионы записей в день, запросы в основном за последние часы
CREATE TABLE metrics (
    id BIGSERIAL,
    metric_time TIMESTAMP NOT NULL,
    metric_name VARCHAR(100),
    value NUMERIC,
    tags JSONB,
    source VARCHAR(50)
) PARTITION BY RANGE (metric_time);

-- Почасовые партиции для недавних данных (горячие данные)
-- Последние 24 часа - почасовые партиции для быстрого доступа
CREATE TABLE metrics_recent PARTITION OF metrics
    FOR VALUES FROM (CURRENT_TIMESTAMP - interval '24 hours') TO (MAXVALUE)
    PARTITION BY RANGE (metric_time);

-- Автоматическое создание почасовых партиций
CREATE OR REPLACE FUNCTION create_hourly_metric_partitions()
RETURNS void AS $$
DECLARE
    partition_hour TIMESTAMP;
    partition_name TEXT;
    start_time TIMESTAMP;
    end_time TIMESTAMP;
BEGIN
    FOR i IN 0..48 LOOP  -- 48 часов вперед
        partition_hour := DATE_TRUNC('hour', CURRENT_TIMESTAMP) + (i || ' hours')::INTERVAL;
        partition_name := 'metrics_' || TO_CHAR(partition_hour, 'YYYY_MM_DD_HH24');
        start_time := partition_hour;
        end_time := partition_hour + interval '1 hour';
        
        IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = partition_name) THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF metrics_recent FOR VALUES FROM (%L) TO (%L)',
                partition_name, start_time, end_time
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Архивные данные - дневные партиции
CREATE TABLE metrics_2024_01_01 PARTITION OF metrics
    FOR VALUES FROM ('2024-01-01') TO ('2024-01-02');
-- ... и т.д.

-- Консолидация старых почасовых партиций в дневные
CREATE OR REPLACE FUNCTION consolidate_metric_partitions()
RETURNS void AS $$
DECLARE
    consolidation_date DATE;
BEGIN
    consolidation_date := CURRENT_DATE - 2;  -- Консолидируем позавчерашние данные
    
    -- Создание дневной партиции для архива
    EXECUTE format(
        'CREATE TABLE IF NOT EXISTS metrics_%s PARTITION OF metrics FOR VALUES FROM (%L) TO (%L)',
        TO_CHAR(consolidation_date, 'YYYY_MM_DD'),
        consolidation_date::TIMESTAMP,
        (consolidation_date + 1)::TIMESTAMP
    );
    
    -- Перенос данных из почасовых партиций
    -- и удаление старых почасовых партиций
    -- (код упрощен для примера)
END;
$$ LANGUAGE plpgsql;
```

### Сценарий 3: Многотенантное приложение (SaaS)

```sql
-- Требование: изоляция данных клиентов, разные размеры клиентов
CREATE TABLE tenant_data (
    id BIGSERIAL,
    tenant_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    data_type VARCHAR(50),
    content JSONB
) PARTITION BY LIST (tenant_id);

-- VIP клиенты получают собственные партиции
CREATE TABLE tenant_data_1001 PARTITION OF tenant_data
    FOR VALUES IN (1001);  -- VIP клиент #1001

CREATE TABLE tenant_data_1002 PARTITION OF tenant_data
    FOR VALUES IN (1002);  -- VIP клиент #1002

-- Средние клиенты группируются
CREATE TABLE tenant_data_medium PARTITION OF tenant_data
    FOR VALUES IN (2001, 2002, 2003, 2004, 2005);

-- Малые клиенты в общей партиции
CREATE TABLE tenant_data_small PARTITION OF tenant_data
    DEFAULT;  -- Все остальные tenant_id

-- Функция для создания партиции для нового VIP клиента
CREATE OR REPLACE FUNCTION create_vip_tenant_partition(new_tenant_id INTEGER)
RETURNS void AS $
DECLARE
    partition_name TEXT;
BEGIN
    partition_name := 'tenant_data_' || new_tenant_id;
    
    -- Отсоединяем клиента из общей партиции если он там был
    EXECUTE format(
        'CREATE TABLE %I (LIKE tenant_data INCLUDING ALL)',
        partition_name || '_temp'
    );
    
    EXECUTE format(
        'INSERT INTO %I SELECT * FROM tenant_data WHERE tenant_id = %L',
        partition_name || '_temp',
        new_tenant_id
    );
    
    EXECUTE format(
        'DELETE FROM tenant_data WHERE tenant_id = %L',
        new_tenant_id
    );
    
    -- Присоединяем как новую партицию
    EXECUTE format(
        'ALTER TABLE tenant_data ATTACH PARTITION %I FOR VALUES IN (%L)',
        partition_name || '_temp',
        new_tenant_id
    );
    
    EXECUTE format(
        'ALTER TABLE %I RENAME TO %I',
        partition_name || '_temp',
        partition_name
    );
    
    RAISE NOTICE 'Created VIP partition for tenant %', new_tenant_id;
END;
$ LANGUAGE plpgsql;

-- Использование
SELECT create_vip_tenant_partition(1003);
```

### Сценарий 4: Временные ряды с агрегацией

```sql
-- Требование: детальные данные за неделю, агрегаты за месяцы
CREATE TABLE sensor_readings (
    id BIGSERIAL,
    reading_time TIMESTAMP NOT NULL,
    sensor_id INTEGER NOT NULL,
    temperature NUMERIC(5, 2),
    humidity NUMERIC(5, 2),
    pressure NUMERIC(7, 2)
) PARTITION BY RANGE (reading_time);

-- Детальные данные за последние 7 дней (по дням)
CREATE TABLE sensor_readings_2024_01_20 PARTITION OF sensor_readings
    FOR VALUES FROM ('2024-01-20') TO ('2024-01-21');

CREATE TABLE sensor_readings_2024_01_21 PARTITION OF sensor_readings
    FOR VALUES FROM ('2024-01-21') TO ('2024-01-22');
-- ... остальные дни

-- Агрегированные данные за старые периоды
CREATE TABLE sensor_readings_hourly_2024_01 (
    reading_hour TIMESTAMP NOT NULL,
    sensor_id INTEGER NOT NULL,
    avg_temperature NUMERIC(5, 2),
    avg_humidity NUMERIC(5, 2),
    avg_pressure NUMERIC(7, 2),
    min_temperature NUMERIC(5, 2),
    max_temperature NUMERIC(5, 2),
    reading_count INTEGER,
    PRIMARY KEY (reading_hour, sensor_id)
) PARTITION BY RANGE (reading_hour);

-- Процедура агрегации старых данных
CREATE OR REPLACE FUNCTION aggregate_old_sensor_data()
RETURNS void AS $
DECLARE
    aggregation_date DATE;
    partition_name TEXT;
BEGIN
    aggregation_date := CURRENT_DATE - 8;  -- Агрегируем 8-дневные данные
    partition_name := 'sensor_readings_' || TO_CHAR(aggregation_date, 'YYYY_MM_DD');
    
    -- Создание часовых агрегатов
    EXECUTE format(
        'INSERT INTO sensor_readings_hourly_2024_01 
         SELECT 
             DATE_TRUNC(''hour'', reading_time) as reading_hour,
             sensor_id,
             AVG(temperature) as avg_temperature,
             AVG(humidity) as avg_humidity,
             AVG(pressure) as avg_pressure,
             MIN(temperature) as min_temperature,
             MAX(temperature) as max_temperature,
             COUNT(*) as reading_count
         FROM %I
         GROUP BY DATE_TRUNC(''hour'', reading_time), sensor_id
         ON CONFLICT (reading_hour, sensor_id) DO NOTHING',
        partition_name
    );
    
    -- Удаление детальных данных
    EXECUTE format('DROP TABLE IF EXISTS %I', partition_name);
    
    RAISE NOTICE 'Aggregated and dropped partition %', partition_name;
END;
$ LANGUAGE plpgsql;
```

## Производительность и оптимизация

### Partition Pruning

```sql
-- Демонстрация partition pruning
CREATE TABLE orders_demo (
    id BIGSERIAL,
    order_date DATE NOT NULL,
    customer_id INTEGER,
    total_amount NUMERIC(12, 2)
) PARTITION BY RANGE (order_date);

-- Создание партиций
CREATE TABLE orders_2024_q1 PARTITION OF orders_demo
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
CREATE TABLE orders_2024_q2 PARTITION OF orders_demo
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');
CREATE TABLE orders_2024_q3 PARTITION OF orders_demo
    FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');
CREATE TABLE orders_2024_q4 PARTITION OF orders_demo
    FOR VALUES FROM ('2024-10-01') TO ('2025-01-01');

-- Partition pruning работает
EXPLAIN SELECT * FROM orders_demo
WHERE order_date >= '2024-04-01' AND order_date < '2024-07-01';
-- Сканируется только orders_2024_q2

-- Partition pruning НЕ работает (функция на колонке)
EXPLAIN SELECT * FROM orders_demo
WHERE EXTRACT(QUARTER FROM order_date) = 2;
-- Сканируются ВСЕ партиции!

-- Решение: используйте диапазоны вместо функций
EXPLAIN SELECT * FROM orders_demo
WHERE order_date >= '2024-04-01' AND order_date < '2024-07-01';
```

:::warning Важно для Partition Pruning
Чтобы partition pruning работал эффективно:
- Используйте прямые сравнения с ключом партиционирования
- Избегайте функций на колонке партиционирования
- Используйте константы или параметры, известные на этапе планирования
:::

### Constraint Exclusion

```sql
-- Включение constraint exclusion (обычно включено по умолчанию)
SHOW constraint_exclusion;
-- Должно быть 'partition' или 'on'

SET constraint_exclusion = partition;

-- Constraint exclusion использует ограничения CHECK для исключения партиций
-- PostgreSQL 10+ использует встроенный partition pruning (быстрее)

-- Пример с явными ограничениями (старый метод)
CREATE TABLE orders_manual_2024_01 (
    CHECK (order_date >= '2024-01-01' AND order_date < '2024-02-01')
) INHERITS (orders_manual);

CREATE TABLE orders_manual_2024_02 (
    CHECK (order_date >= '2024-02-01' AND order_date < '2024-03-01')
) INHERITS (orders_manual);
```

### Индексы на партиционированных таблицах

```sql
-- Локальные индексы (на каждой партиции отдельно)
CREATE INDEX idx_orders_2024_q1_customer ON orders_2024_q1(customer_id);
CREATE INDEX idx_orders_2024_q2_customer ON orders_2024_q2(customer_id);

-- Глобальный индекс (PostgreSQL 11+)
-- Автоматически создает индексы на всех партициях
CREATE INDEX idx_orders_customer ON orders_demo(customer_id);

-- Это создаст:
-- - idx_orders_customer на главной таблице
-- - idx_orders_2024_q1_customer_idx на orders_2024_q1
-- - idx_orders_2024_q2_customer_idx на orders_2024_q2
-- - и т.д.

-- Просмотр индексов
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename LIKE 'orders_%'
ORDER BY tablename, indexname;

-- Уникальные индексы и PRIMARY KEY
-- Должны включать ключ партиционирования!
CREATE TABLE partitioned_users (
    id SERIAL,
    email VARCHAR(100),
    created_at DATE,
    PRIMARY KEY (id, created_at)  -- Включает ключ партиционирования
) PARTITION BY RANGE (created_at);

-- Это НЕ работает (нет created_at в PRIMARY KEY):
-- PRIMARY KEY (id)  -- ОШИБКА!
```

### Параллельное сканирование партиций

```sql
-- PostgreSQL может сканировать партиции параллельно
SET max_parallel_workers_per_gather = 4;

EXPLAIN (ANALYZE, BUFFERS)
SELECT customer_id, SUM(total_amount)
FROM orders_demo
GROUP BY customer_id;

-- План может показать:
-- Finalize GroupAggregate
--   -> Gather Merge
--        Workers Planned: 4
--        -> Partial GroupAggregate
--             -> Parallel Append
--                  -> Parallel Seq Scan on orders_2024_q1
--                  -> Parallel Seq Scan on orders_2024_q2
--                  -> Parallel Seq Scan on orders_2024_q3
--                  -> Parallel Seq Scan on orders_2024_q4
```

## Миграция на партиционированные таблицы

### Миграция существующей таблицы

```sql
-- Исходная таблица
CREATE TABLE orders_old (
    id BIGSERIAL PRIMARY KEY,
    order_date DATE NOT NULL,
    customer_id INTEGER,
    total_amount NUMERIC(12, 2),
    status VARCHAR(20)
);

-- Предположим, в ней уже миллионы записей

-- Шаг 1: Создать новую партиционированную таблицу
CREATE TABLE orders_new (
    id BIGINT,
    order_date DATE NOT NULL,
    customer_id INTEGER,
    total_amount NUMERIC(12, 2),
    status VARCHAR(20)
) PARTITION BY RANGE (order_date);

-- Шаг 2: Создать партиции
CREATE TABLE orders_new_2023 PARTITION OF orders_new
    FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

CREATE TABLE orders_new_2024_q1 PARTITION OF orders_new
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE orders_new_2024_q2 PARTITION OF orders_new
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- ... остальные партиции

-- Шаг 3: Миграция данных по частям (чтобы не блокировать таблицу надолго)
DO $
DECLARE
    batch_size INTEGER := 100000;
    min_id BIGINT;
    max_id BIGINT;
    current_id BIGINT := 0;
BEGIN
    SELECT MIN(id), MAX(id) INTO min_id, max_id FROM orders_old;
    
    WHILE current_id < max_id LOOP
        INSERT INTO orders_new
        SELECT * FROM orders_old
        WHERE id > current_id AND id <= current_id + batch_size;
        
        current_id := current_id + batch_size;
        
        RAISE NOTICE 'Migrated up to ID: %', current_id;
        COMMIT;
    END LOOP;
END $;

-- Шаг 4: Создать индексы и ограничения
CREATE INDEX idx_orders_new_customer ON orders_new(customer_id);
CREATE INDEX idx_orders_new_status ON orders_new(status);
ALTER TABLE orders_new ADD PRIMARY KEY (id, order_date);

-- Шаг 5: Переключение (в транзакции)
BEGIN;
    ALTER TABLE orders_old RENAME TO orders_backup;
    ALTER TABLE orders_new RENAME TO orders;
    -- Обновить зависимые объекты (views, функции)
COMMIT;

-- Шаг 6: Проверка и очистка
-- Проверить, что всё работает
-- Удалить старую таблицу когда уверены
-- DROP TABLE orders_backup;
```

### Миграция с минимальным downtime

```sql
-- Стратегия с использованием логической репликации (PostgreSQL 10+)

-- Шаг 1: Создать партиционированную таблицу
CREATE TABLE orders_partitioned (
    id BIGINT,
    order_date DATE NOT NULL,
    customer_id INTEGER,
    total_amount NUMERIC(12, 2),
    status VARCHAR(20),
    PRIMARY KEY (id, order_date)
) PARTITION BY RANGE (order_date);

-- Создать партиции...

-- Шаг 2: Настроить логическую репликацию
-- На источнике:
CREATE PUBLICATION orders_pub FOR TABLE orders_old;

-- На приемнике (может быть та же БД):
CREATE SUBSCRIPTION orders_sub
CONNECTION 'dbname=mydb'
PUBLICATION orders_pub;

-- Шаг 3: Начальная загрузка
INSERT INTO orders_partitioned SELECT * FROM orders_old;

-- Шаг 4: Логическая репликация синхронизирует изменения

-- Шаг 5: Переключение в момент минимальной нагрузки
BEGIN;
    -- Остановить приложение или переключить в read-only
    DROP SUBSCRIPTION orders_sub;
    ALTER TABLE orders_old RENAME TO orders_backup;
    ALTER TABLE orders_partitioned RENAME TO orders;
    -- Обновить представления, функции
    -- Перезапустить приложение
COMMIT;
```

### Альтернативный метод: ATTACH PARTITION

```sql
-- Этот метод работает без копирования данных!

-- Шаг 1: Создать главную партиционированную таблицу
CREATE TABLE orders_main (
    id BIGINT,
    order_date DATE NOT NULL,
    customer_id INTEGER,
    total_amount NUMERIC(12, 2)
) PARTITION BY RANGE (order_date);

-- Шаг 2: Существующую таблицу можно присоединить как партицию
-- Но сначала нужно добавить CHECK constraint
ALTER TABLE orders_old 
ADD CONSTRAINT orders_old_date_check 
CHECK (order_date >= '2024-01-01' AND order_date < '2024-04-01');

-- Шаг 3: Присоединить как партицию (быстро!)
ALTER TABLE orders_main 
ATTACH PARTITION orders_old 
FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

-- Теперь orders_old является партицией orders_main
-- Данные не копировались!
```

## Мониторинг и обслуживание

### Мониторинг партиций

```sql
-- Размеры партиций
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE tablename LIKE 'orders_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Количество строк в партициях
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count,
    n_dead_tup as dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze
FROM pg_stat_user_tables
WHERE tablename LIKE 'orders_%'
ORDER BY tablename;

-- Информация о партиционировании
SELECT
    pt.schemaname,
    pt.tablename as parent_table,
    c.relname as partition_name,
    pg_get_expr(c.relpartbound, c.oid) as partition_bounds
FROM pg_partitioned_table pt
JOIN pg_class pc ON pt.partrelid = pc.oid
JOIN pg_inherits i ON i.inhparent = pc.oid
JOIN pg_class c ON i.inhrelid = c.oid
ORDER BY pt.tablename, c.relname;

-- Проверка несуществующих партиций для будущих данных
SELECT 
    generate_series(
        DATE_TRUNC('month', CURRENT_DATE),
        DATE_TRUNC('month', CURRENT_DATE + interval '6 months'),
        interval '1 month'
    ) as month,
    EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'logs_' || TO_CHAR(generate_series, 'YYYY_MM')
    ) as partition_exists;
```

### VACUUM и ANALYZE на партициях

```sql
-- VACUUM каждой партиции отдельно
VACUUM ANALYZE orders_2024_q1;
VACUUM ANALYZE orders_2024_q2;

-- Или всей партиционированной таблицы (обрабатывает все партиции)
VACUUM ANALYZE orders_demo;

-- Автоматическая настройка autovacuum для конкретной партиции
ALTER TABLE orders_2024_q1 SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02,
    autovacuum_vacuum_cost_delay = 10
);

-- Для "горячих" партиций можно увеличить частоту autovacuum
ALTER TABLE orders_2024_q4 SET (
    autovacuum_vacuum_scale_factor = 0.01,  -- Чаще vacuum
    autovacuum_analyze_scale_factor = 0.01   -- Чаще analyze
);

-- Для "холодных" архивных партиций можно отключить autovacuum
ALTER TABLE orders_2023 SET (
    autovacuum_enabled = false
);
```

### Проверка эффективности партиционирования

```sql
-- Сравнение производительности с и без partition pruning

-- С partition pruning (быстро)
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*), SUM(total_amount)
FROM orders_demo
WHERE order_date >= '2024-04-01' AND order_date < '2024-07-01';

-- Без partition pruning (медленно)
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*), SUM(total_amount)
FROM orders_demo
WHERE EXTRACT(QUARTER FROM order_date) = 2;

-- Сравнение с непартиционированной таблицей
-- Создаем копию без партиционирования
CREATE TABLE orders_regular AS SELECT * FROM orders_demo;
CREATE INDEX idx_orders_regular_date ON orders_regular(order_date);

EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*), SUM(total_amount)
FROM orders_regular
WHERE order_date >= '2024-04-01' AND order_date < '2024-07-01';

-- Сравните execution time и buffers
```

## Лучшие практики

### Выбор ключа партиционирования

```sql
-- ✅ ХОРОШО: Временные метки (естественная ротация)
PARTITION BY RANGE (created_at)

-- ✅ ХОРОШО: Географические регионы (изоляция данных)
PARTITION BY LIST (country_code)

-- ✅ ХОРОШО: Категории с известным распределением
PARTITION BY LIST (product_category)

-- ❌ ПЛОХО: Колонка, которая часто обновляется
-- (UPDATE может переместить строку в другую партицию)
PARTITION BY RANGE (status)  -- Статус часто меняется!

-- ❌ ПЛОХО: Колонка с плохим распределением
PARTITION BY LIST (is_active)  -- Только 2 значения!

-- ❌ ПЛОХО: Слишком много партиций
-- 365 партиций для ежедневных данных за год - это перебор для малой таблицы
```

### Размер партиций

```sql
-- Рекомендации по размеру партиций:
-- - Не слишком маленькие: < 1 GB бессмысленно
-- - Не слишком большие: > 100 GB сложно обслуживать
-- - Оптимально: 10-50 GB на партицию

-- Пример: таблица растет на 10 GB в месяц
-- ✅ ХОРОШО: месячные партиции (10 GB каждая)
PARTITION BY RANGE (order_date);
CREATE TABLE orders_2024_01 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Пример: таблица растет на 1 GB в день
-- ✅ ХОРОШО: недельные или месячные партиции
-- ❌ ПЛОХО: ежедневные партиции (слишком много таблиц)

-- Пример: таблица растет на 100 GB в месяц
-- ✅ ХОРОШО: недельные партиции (25 GB каждая)
CREATE TABLE logs_2024_w01 PARTITION OF logs
    FOR VALUES FROM ('2024-01-01') TO ('2024-01-08');
```

### Именование партиций

```sql
-- ✅ ХОРОШО: Понятное, консистентное именование
logs_2024_01          -- Месячная партиция
logs_2024_01_15       -- Дневная партиция
logs_2024_w03         -- Недельная партиция
logs_2024_q1          -- Квартальная партиция
customers_usa         -- По региону
customers_vip_001     -- По группе клиентов

-- ❌ ПЛОХО: Непонятное именование
logs_p1, logs_p2, logs_p3
logs_part_old, logs_part_new
```

### Стратегия для разных типов данных

```sql
-- Транзакционные данные (заказы, платежи)
-- Range по дате, месячные партиции
CREATE TABLE transactions (...)
PARTITION BY RANGE (transaction_date);

-- Логи и события
-- Range по времени, дневные/недельные партиции с автоудалением
CREATE TABLE event_logs (...)
PARTITION BY RANGE (event_time);

-- Пользовательские данные
-- Hash для равномерного распределения нагрузки
CREATE TABLE users (...)
PARTITION BY HASH (user_id);

-- Географически распределенные данные
-- List по региону для изоляции
CREATE TABLE customer_data (...)
PARTITION BY LIST (region);

-- Многотенантные данные (SaaS)
-- List по tenant_id, крупные клиенты отдельно
CREATE TABLE tenant_records (...)
PARTITION BY LIST (tenant_id);

-- Аналитические данные
-- Range по времени + агрегация старых данных
CREATE TABLE metrics (...)
PARTITION BY RANGE (metric_time);
```

### Обработка DEFAULT партиций

```sql
-- DEFAULT партиция полезна, но использовать осторожно
CREATE TABLE orders (...)
PARTITION BY RANGE (order_date);

-- Создаем известные партиции
CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

-- DEFAULT для неожиданных данных
CREATE TABLE orders_default PARTITION OF orders DEFAULT;

-- Мониторинг DEFAULT партиции
SELECT COUNT(*) as unexpected_rows
FROM orders_default;

-- Если данные попадают в DEFAULT - создать нужную партицию
CREATE TABLE orders_2024_q2 PARTITION OF orders
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

-- Переместить данные из DEFAULT
BEGIN;
-- Отсоединить DEFAULT
ALTER TABLE orders DETACH PARTITION orders_default;

-- Переместить данные
INSERT INTO orders SELECT * FROM orders_default
WHERE order_date >= '2024-04-01' AND order_date < '2024-07-01';

DELETE FROM orders_default
WHERE order_date >= '2024-04-01' AND order_date < '2024-07-01';

-- Присоединить обратно
ALTER TABLE orders ATTACH PARTITION orders_default DEFAULT;
COMMIT;
```

## Ограничения и подводные камни

### Ограничения PostgreSQL

```sql
-- 1. PRIMARY KEY и UNIQUE должны включать ключ партиционирования
CREATE TABLE orders (
    id SERIAL,
    order_date DATE,
    customer_id INTEGER,
    -- ✅ РАБОТАЕТ
    PRIMARY KEY (id, order_date)
) PARTITION BY RANGE (order_date);

CREATE TABLE orders_bad (
    id SERIAL,
    order_date DATE,
    -- ❌ НЕ РАБОТАЕТ - нет order_date в PRIMARY KEY
    PRIMARY KEY (id)
) PARTITION BY RANGE (order_date);
-- ERROR: unique constraint must include all partitioning columns

-- 2. FOREIGN KEY из партиционированной таблицы - OK
-- FOREIGN KEY в партиционированную таблицу - ограничения
CREATE TABLE order_items (
    order_id BIGINT,
    -- ✅ РАБОТАЕТ (PostgreSQL 11+)
    FOREIGN KEY (order_id, order_date) REFERENCES orders(id, order_date)
) PARTITION BY RANGE (order_date);

-- 3. UPDATE может переместить строку в другую партицию (медленно!)
UPDATE orders SET order_date = '2024-07-01'
WHERE id = 12345 AND order_date = '2024-03-15';
-- Строка переместится из orders_2024_q1 в orders_2024_q3
-- Это DELETE + INSERT, может быть медленно

-- 4. Нельзя создать GLOBAL индекс (есть только локальные)
-- Индекс создается на каждой партиции отдельно
```

### Производительность при вставке

```sql
-- Вставка в партиционированную таблицу чуть медленнее
-- PostgreSQL должен определить партицию для каждой строки

-- Оптимизация: используйте COPY вместо множественных INSERT
COPY orders FROM '/path/to/data.csv' WITH CSV;

-- Или bulk INSERT
INSERT INTO orders 
SELECT * FROM external_table;

-- Избегайте:
INSERT INTO orders VALUES (...);
INSERT INTO orders VALUES (...);
-- ... тысячи отдельных INSERT
```

### Bloat в DEFAULT партициях

```sql
-- DEFAULT партиция может стать узким местом
CREATE TABLE logs (...) PARTITION BY RANGE (log_time);
CREATE TABLE logs_default PARTITION OF logs DEFAULT;

-- Если регулярно не создавать партиции,
-- все новые данные попадут в DEFAULT
-- DEFAULT партиция станет огромной!

-- Решение: автоматизация создания партиций
-- Или использование расширения pg_partman
CREATE EXTENSION pg_partman;

SELECT partman.create_parent(
    p_parent_table => 'public.logs',
    p_control => 'log_time',
    p_type => 'native',
    p_interval => '1 day',
    p_premake => 7
);
```

## Инструменты и расширения

### pg_partman

```sql
-- Установка расширения для автоматизации партиционирования
CREATE EXTENSION pg_partman;

-- Создание партиционированной таблицы с автоматизацией
SELECT partman.create_parent(
    p_parent_table => 'public.logs',
    p_control => 'created_at',
    p_type => 'native',           -- Нативное партиционирование (PG 10+)
    p_interval => '1 day',         -- Дневные партиции
    p_premake => 7,                -- Создавать партиции на 7 дней вперед
    p_start_partition => '2024-01-01'
);

-- Автоматическое обслуживание (запускать по расписанию)
SELECT partman.run_maintenance();

-- Настройка retention (хранить 90 дней)
UPDATE partman.part_config
SET retention = '90 days',
    retention_keep_table = false   -- Удалять старые партиции
WHERE parent_table = 'public.logs';

-- Ручное создание недостающих партиций
SELECT partman.create_partition_time(
    'public.logs',
    ARRAY['2024-06-01', '2024-06-02', '2024-06-03']
);
```

### Мониторинг с pg_stat_statements

```sql
-- Анализ самых медленных запросов к партициям
CREATE EXTENSION pg_stat_statements;

SELECT 
    query,
    calls,
    mean_exec_time,
    max_exec_time,
    total_exec_time
FROM pg_stat_statements
WHERE query LIKE '%orders%'
ORDER BY mean_exec_time DESC
LIMIT 20;
```
