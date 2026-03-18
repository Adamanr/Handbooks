---
id: module-19-json
title: "Работа с JSON и JSONB: NoSQL возможности PostgreSQL"
sidebar_label: "JSON и JSONB"
sidebar_position: 19
description: "Полное руководство по работе с JSON и JSONB в PostgreSQL"
keywords: [postgresql, json, jsonb]
---

# Работа с JSON и JSONB: NoSQL возможности PostgreSQL

## Введение

PostgreSQL поддерживает два типа данных для работы с JSON: `json` и `jsonb`. Это позволяет PostgreSQL сочетать мощь реляционной модели с гибкостью документоориентированных баз данных, предоставляя лучшее из обоих миров.

:::tip Ключевое отличие
**JSON** хранит текст "как есть", медленнее обрабатывается, сохраняет порядок ключей и пробелы  
**JSONB** хранит в бинарном формате, быстрее обрабатывается, поддерживает индексы, но не сохраняет порядок ключей
:::

## JSON vs JSONB: детальное сравнение

| Характеристика | JSON | JSONB |
|----------------|------|-------|
| Формат хранения | Текстовый (точная копия ввода) | Бинарный (decomposed) |
| Скорость записи | Быстрее | Медленнее (требует парсинг) |
| Скорость чтения | Медленнее (парсится каждый раз) | Быстрее (уже распарсен) |
| Размер на диске | Обычно меньше | Обычно больше |
| Сохранение порядка ключей | Да | Нет (сортирует по алфавиту) |
| Сохранение пробелов | Да | Нет |
| Дубликаты ключей | Сохраняет все | Оставляет последний |
| Индексы | Нет | Да (GIN, GiST) |
| Операторы сравнения | Ограничены | Полный набор |
| Рекомендация | Редко используется | **Используйте JSONB** |

### Демонстрация различий

```sql
-- Создание тестовой таблицы
CREATE TABLE json_comparison (
    id SERIAL PRIMARY KEY,
    data_json JSON,
    data_jsonb JSONB
);

-- Вставка с дубликатами ключей и пробелами
INSERT INTO json_comparison (data_json, data_jsonb)
VALUES (
    '{"name": "Alice", "age": 30, "name": "Bob"}',
    '{"name": "Alice", "age": 30, "name": "Bob"}'
);

-- JSON сохраняет все дубликаты
SELECT data_json FROM json_comparison;
-- {"name": "Alice", "age": 30, "name": "Bob"}

-- JSONB оставляет только последнее значение
SELECT data_jsonb FROM json_comparison;
-- {"age": 30, "name": "Bob"}  -- обратите внимание на порядок ключей!

-- Вставка с разным форматированием
INSERT INTO json_comparison (data_json, data_jsonb)
VALUES (
    '{"city":    "New York",   "country":  "USA"}',
    '{"city":    "New York",   "country":  "USA"}'
);

-- JSON сохраняет пробелы
SELECT data_json FROM json_comparison WHERE id = 2;
-- {"city":    "New York",   "country":  "USA"}

-- JSONB нормализует
SELECT data_jsonb FROM json_comparison WHERE id = 2;
-- {"city": "New York", "country": "USA"}
```

:::info Рекомендация
В 99% случаев используйте **JSONB**. Используйте JSON только если критически важно сохранить точный формат или порядок ключей (например, для логирования или аудита).
:::

---

## Создание и вставка JSON данных

### Базовое создание таблицы

```sql
-- Схема для примеров
CREATE SCHEMA IF NOT EXISTS app;
SET search_path TO app;

-- Таблица пользователей с профилем в JSONB
CREATE TABLE users (
    user_id       SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    profile       JSONB NOT NULL,
    settings      JSONB DEFAULT '{}',
    metadata      JSONB,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица продуктов с атрибутами в JSONB
CREATE TABLE products (
    product_id    SERIAL PRIMARY KEY,
    sku           VARCHAR(50) UNIQUE NOT NULL,
    name          VARCHAR(255) NOT NULL,
    attributes    JSONB NOT NULL,  -- динамические атрибуты
    pricing       JSONB,            -- история цен
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица событий (event sourcing)
CREATE TABLE events (
    event_id      BIGSERIAL PRIMARY KEY,
    event_type    VARCHAR(100) NOT NULL,
    payload       JSONB NOT NULL,
    metadata      JSONB,
    occurred_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### Вставка JSONB данных

```sql
-- Простая вставка
INSERT INTO users (email, profile)
VALUES (
    'alice@example.com',
    '{"firstName": "Alice", "lastName": "Johnson", "age": 30}'
);

-- Вставка с вложенными объектами
INSERT INTO users (email, profile, settings)
VALUES (
    'bob@example.com',
    '{
        "firstName": "Bob",
        "lastName": "Smith",
        "age": 25,
        "address": {
            "street": "123 Main St",
            "city": "New York",
            "country": "USA",
            "coordinates": {
                "lat": 40.7128,
                "lng": -74.0060
            }
        },
        "phones": [
            {"type": "home", "number": "+1-555-0123"},
            {"type": "work", "number": "+1-555-0124"}
        ]
    }',
    '{
        "theme": "dark",
        "notifications": {
            "email": true,
            "push": false,
            "sms": true
        },
        "language": "en"
    }'
);

-- Вставка массива объектов
INSERT INTO products (sku, name, attributes)
VALUES (
    'LAPTOP-001',
    'Professional Laptop',
    '{
        "specs": {
            "cpu": "Intel i7-12700H",
            "ram": "16GB DDR5",
            "storage": "512GB NVMe SSD",
            "display": "15.6\" FHD IPS"
        },
        "colors": ["Space Gray", "Silver"],
        "features": ["Backlit Keyboard", "Fingerprint Reader", "Thunderbolt 4"],
        "warranty": {
            "years": 2,
            "type": "Premium"
        }
    }'
);

-- Использование функций для создания JSONB
INSERT INTO users (email, profile)
VALUES (
    'carol@example.com',
    jsonb_build_object(
        'firstName', 'Carol',
        'lastName', 'Williams',
        'age', 28,
        'hobbies', jsonb_build_array('reading', 'hiking', 'photography')
    )
);

-- Конструирование JSONB из таблицы
CREATE TEMP TABLE temp_user_data (
    first_name TEXT,
    last_name TEXT,
    age INTEGER
);

INSERT INTO temp_user_data VALUES ('Dave', 'Brown', 35);

INSERT INTO users (email, profile)
SELECT 
    'dave@example.com',
    row_to_json(t)::jsonb
FROM temp_user_data t;
```

---

## Извлечение данных из JSON

### Операторы доступа

PostgreSQL предоставляет множество операторов для работы с JSONB:

```sql
-- Подготовка тестовых данных
INSERT INTO users (email, profile, settings) VALUES
    ('test@example.com', 
     '{"firstName": "Test", "age": 40, "tags": ["vip", "premium"]}',
     '{"theme": "light", "notifications": {"email": true}}');

-- -> извлекает значение как JSONB
SELECT profile -> 'firstName' FROM users WHERE email = 'alice@example.com';
-- "Alice"  (с кавычками, тип JSONB)

-- ->> извлекает значение как TEXT
SELECT profile ->> 'firstName' FROM users WHERE email = 'alice@example.com';
-- Alice  (без кавычек, тип TEXT)

-- Доступ к вложенным объектам
SELECT profile -> 'address' -> 'city' FROM users WHERE email = 'bob@example.com';
-- "New York"

SELECT profile -> 'address' ->> 'city' FROM users WHERE email = 'bob@example.com';
-- New York

-- #> и #>> для путей (массив ключей)
SELECT profile #> '{address, city}' FROM users WHERE email = 'bob@example.com';
-- "New York"

SELECT profile #>> '{address, city}' FROM users WHERE email = 'bob@example.com';
-- New York

-- Доступ к элементам массива (индексация с 0)
SELECT profile -> 'phones' -> 0 FROM users WHERE email = 'bob@example.com';
-- {"type": "home", "number": "+1-555-0123"}

SELECT profile -> 'phones' -> 0 ->> 'number' FROM users WHERE email = 'bob@example.com';
-- +1-555-0123

-- Путь через массив
SELECT profile #>> '{phones, 0, number}' FROM users WHERE email = 'bob@example.com';
-- +1-555-0123
```

### Функции извлечения

```sql
-- jsonb_extract_path() - аналог #>
SELECT jsonb_extract_path(profile, 'address', 'city') 
FROM users WHERE email = 'bob@example.com';

-- jsonb_extract_path_text() - аналог #>>
SELECT jsonb_extract_path_text(profile, 'address', 'city')
FROM users WHERE email = 'bob@example.com';

-- jsonb_array_elements() - развернуть массив в строки
SELECT jsonb_array_elements(profile -> 'phones')
FROM users WHERE email = 'bob@example.com';
/*
           jsonb_array_elements
---------------------------------------
 {"type": "home", "number": "+1-555-0123"}
 {"type": "work", "number": "+1-555-0124"}
*/

-- jsonb_array_elements_text() - как TEXT
SELECT jsonb_array_elements_text(profile -> 'tags')
FROM users WHERE email = 'test@example.com';
/*
 jsonb_array_elements_text
---------------------------
 vip
 premium
*/

-- jsonb_each() - развернуть объект в пары ключ-значение
SELECT * FROM jsonb_each(profile)
WHERE email = 'alice@example.com';
/*
    key     |   value
------------+-----------
 age        | 30
 firstName  | "Alice"
 lastName   | "Johnson"
*/

-- jsonb_each_text() - значения как TEXT
SELECT * FROM jsonb_each_text(profile)
WHERE email = 'alice@example.com';

-- jsonb_object_keys() - только ключи
SELECT jsonb_object_keys(profile)
FROM users WHERE email = 'alice@example.com';
/*
 jsonb_object_keys
-------------------
 age
 firstName
 lastName
*/
```

---

## Запросы и фильтрация

### Операторы сравнения и проверки

```sql
-- Проверка существования ключа (?)
SELECT * FROM users WHERE profile ? 'age';
-- Вернёт пользователей, у которых есть ключ 'age'

-- Проверка существования любого из ключей (?|)
SELECT * FROM users WHERE profile ?| array['age', 'birthday'];
-- Вернёт пользователей, у которых есть 'age' ИЛИ 'birthday'

-- Проверка существования всех ключей (?&)
SELECT * FROM users WHERE profile ?& array['firstName', 'lastName', 'age'];
-- Вернёт пользователей, у которых есть ВСЕ три ключа

-- Проверка содержания (@>)
SELECT * FROM users WHERE profile @> '{"firstName": "Alice"}';
-- Вернёт пользователей, у которых firstName = Alice

SELECT * FROM users WHERE profile @> '{"age": 30}';
-- Вернёт пользователей с возрастом 30

-- Вложенное содержание
SELECT * FROM users 
WHERE profile @> '{"address": {"city": "New York"}}';

-- Проверка "содержится в" (<@)
SELECT * FROM users 
WHERE '{"firstName": "Alice"}' <@ profile;
-- То же что и @>, но в обратном порядке

-- Сравнение JSONB значений
SELECT * FROM users WHERE profile ->> 'age' = '30';
-- Как TEXT (обратите внимание на кавычки)

SELECT * FROM users WHERE (profile ->> 'age')::INTEGER = 30;
-- Как INTEGER (правильно для чисел)

SELECT * FROM users WHERE (profile ->> 'age')::INTEGER > 25;
-- Численное сравнение
```

### Комплексные запросы

```sql
-- Поиск в массиве
SELECT email, profile -> 'tags' AS tags
FROM users
WHERE profile -> 'tags' @> '["vip"]';
-- Пользователи с тегом "vip"

-- Поиск по вложенным данным
SELECT email, 
       profile #>> '{address, city}' AS city,
       profile #>> '{address, country}' AS country
FROM users
WHERE profile @> '{"address": {"country": "USA"}}';

-- Использование jsonb_array_elements для поиска в массивах
SELECT DISTINCT u.email, phone.value ->> 'number' AS phone_number
FROM users u,
     jsonb_array_elements(u.profile -> 'phones') AS phone
WHERE phone.value ->> 'type' = 'work';

-- Агрегация по JSONB полям
SELECT 
    profile ->> 'address' ->> 'country' AS country,
    COUNT(*) AS user_count,
    AVG((profile ->> 'age')::INTEGER) AS avg_age
FROM users
WHERE profile ? 'age' AND profile ? 'address'
GROUP BY profile ->> 'address' ->> 'country';

-- Полнотекстовый поиск в JSONB
-- Сначала преобразуем JSONB в TEXT, затем в tsvector
SELECT email, profile
FROM users
WHERE to_tsvector('english', profile::text) @@ to_tsquery('english', 'New & York');
```

---

## Модификация JSONB данных

### Обновление значений

```sql
-- jsonb_set() - обновление/добавление ключа
UPDATE users
SET profile = jsonb_set(
    profile,
    '{age}',
    '35',
    true  -- create_if_missing
)
WHERE email = 'alice@example.com';

-- Обновление вложенного значения
UPDATE users
SET profile = jsonb_set(
    profile,
    '{address, city}',
    '"Los Angeles"'
)
WHERE email = 'bob@example.com';

-- Обновление элемента массива
UPDATE users
SET profile = jsonb_set(
    profile,
    '{phones, 0, number}',
    '"+1-555-9999"'
)
WHERE email = 'bob@example.com';

-- Множественные обновления (вложенные jsonb_set)
UPDATE users
SET profile = jsonb_set(
    jsonb_set(
        profile,
        '{firstName}',
        '"Robert"'
    ),
    '{age}',
    '26'
)
WHERE email = 'bob@example.com';
```

### Добавление данных

```sql
-- Оператор || (конкатенация) для слияния объектов
UPDATE users
SET profile = profile || '{"verified": true, "vip": false}'
WHERE email = 'alice@example.com';

-- jsonb_insert() - вставка в массив
UPDATE users
SET profile = jsonb_insert(
    profile,
    '{phones, 1}',  -- позиция вставки
    '{"type": "mobile", "number": "+1-555-7777"}',
    true  -- insert_after = true (после индекса 1)
)
WHERE email = 'bob@example.com';

-- Добавление элемента в массив (append)
UPDATE users
SET profile = jsonb_set(
    profile,
    '{tags}',
    (profile -> 'tags') || '["new_tag"]'
)
WHERE email = 'test@example.com';
```

### Удаление данных

```sql
-- Оператор - для удаления ключа
UPDATE users
SET profile = profile - 'age'
WHERE email = 'alice@example.com';

-- Удаление нескольких ключей
UPDATE users
SET profile = profile - '{age, verified}'::text[]
WHERE email = 'alice@example.com';

-- Удаление элемента массива по индексу
UPDATE users
SET profile = profile #- '{phones, 0}'
WHERE email = 'bob@example.com';

-- Удаление вложенного ключа
UPDATE users
SET profile = profile #- '{address, coordinates}'
WHERE email = 'bob@example.com';

-- jsonb_strip_nulls() - удаление всех null значений
UPDATE users
SET profile = jsonb_strip_nulls(profile);
```

---

## Индексирование JSONB

Индексы критически важны для производительности JSONB запросов.

### GIN индексы

```sql
-- Стандартный GIN индекс (поддерживает @>, ?, ?&, ?|)
CREATE INDEX idx_users_profile_gin ON users USING gin(profile);

-- Теперь быстрые запросы:
EXPLAIN ANALYZE
SELECT * FROM users WHERE profile @> '{"firstName": "Alice"}';
-- Index Scan using idx_users_profile_gin

-- GIN индекс на конкретный путь
CREATE INDEX idx_users_address_gin 
ON users USING gin((profile -> 'address'));

EXPLAIN ANALYZE
SELECT * FROM users 
WHERE profile -> 'address' @> '{"city": "New York"}';
-- Index Scan using idx_users_address_gin

-- GIN индекс с jsonb_path_ops (более компактный, быстрее @>)
CREATE INDEX idx_users_profile_path_ops 
ON users USING gin(profile jsonb_path_ops);

-- Поддерживает только @>, но работает быстрее и занимает меньше места
-- НЕ поддерживает ?, ?&, ?|
```

### B-tree индексы на извлечённые значения

```sql
-- B-tree индекс на конкретное поле
CREATE INDEX idx_users_age 
ON users ((profile ->> 'age')::INTEGER);

-- Быстрый поиск по возрасту
EXPLAIN ANALYZE
SELECT * FROM users 
WHERE (profile ->> 'age')::INTEGER > 25;
-- Index Scan using idx_users_age

-- B-tree индекс на вложенное поле
CREATE INDEX idx_users_city 
ON users ((profile #>> '{address, city}'));

EXPLAIN ANALYZE
SELECT * FROM users 
WHERE profile #>> '{address, city}' = 'New York';
-- Index Scan using idx_users_city
```

### Полнотекстовый поиск

```sql
-- GIN индекс для полнотекстового поиска
CREATE INDEX idx_users_profile_fts 
ON users USING gin(to_tsvector('english', profile::text));

-- Быстрый полнотекстовый поиск
EXPLAIN ANALYZE
SELECT * FROM users
WHERE to_tsvector('english', profile::text) @@ to_tsquery('english', 'Alice');
-- Bitmap Index Scan on idx_users_profile_fts

-- Индекс на конкретное поле для FTS
CREATE INDEX idx_products_attrs_fts
ON products USING gin(to_tsvector('english', 
    COALESCE(attributes ->> 'description', '')));
```

### Частичные индексы

```sql
-- Индекс только для VIP пользователей
CREATE INDEX idx_users_vip_profile 
ON users USING gin(profile)
WHERE profile @> '{"vip": true}';

-- Индекс только для пользователей с адресом
CREATE INDEX idx_users_with_address 
ON users USING gin((profile -> 'address'))
WHERE profile ? 'address';
```

---

## Валидация и ограничения

### CHECK ограничения

```sql
-- Проверка обязательных полей
ALTER TABLE users
ADD CONSTRAINT chk_profile_required_fields
CHECK (
    profile ? 'firstName' AND
    profile ? 'lastName'
);

-- Проверка типов
ALTER TABLE users
ADD CONSTRAINT chk_profile_age_valid
CHECK (
    jsonb_typeof(profile -> 'age') = 'number' AND
    (profile ->> 'age')::INTEGER BETWEEN 0 AND 150
);

-- Проверка формата email
ALTER TABLE users
ADD CONSTRAINT chk_profile_email_format
CHECK (
    NOT (profile ? 'contactEmail') OR
    (profile ->> 'contactEmail') ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
);

-- Проверка вложенной структуры
ALTER TABLE products
ADD CONSTRAINT chk_attributes_pricing
CHECK (
    NOT (attributes ? 'pricing') OR (
        attributes -> 'pricing' ? 'amount' AND
        (attributes #>> '{pricing, amount}')::NUMERIC >= 0
    )
);
```

### Триггеры для валидации

```sql
-- Сложная валидация через триггер
CREATE OR REPLACE FUNCTION validate_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Проверка обязательных полей
    IF NOT (NEW.profile ? 'firstName' AND NEW.profile ? 'lastName') THEN
        RAISE EXCEPTION 'Profile must contain firstName and lastName';
    END IF;
    
    -- Проверка формата телефонов
    IF NEW.profile ? 'phones' THEN
        IF jsonb_typeof(NEW.profile -> 'phones') != 'array' THEN
            RAISE EXCEPTION 'phones must be an array';
        END IF;
        
        -- Проверка каждого телефона
        IF EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(NEW.profile -> 'phones') AS phone
            WHERE NOT (phone ? 'type' AND phone ? 'number')
        ) THEN
            RAISE EXCEPTION 'Each phone must have type and number';
        END IF;
    END IF;
    
    -- Нормализация: удаление пустых значений
    NEW.profile := jsonb_strip_nulls(NEW.profile);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_user_profile
    BEFORE INSERT OR UPDATE OF profile ON users
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_profile();
```

### JSON Schema валидация (расширение)

```sql
-- Установка расширения (если доступно)
-- CREATE EXTENSION IF NOT EXISTS jsonschema;

-- Пример JSON Schema
CREATE TABLE user_schemas (
    schema_id SERIAL PRIMARY KEY,
    schema_name VARCHAR(100),
    schema JSONB
);

INSERT INTO user_schemas (schema_name, schema) VALUES
('user_profile_schema', '{
    "type": "object",
    "required": ["firstName", "lastName"],
    "properties": {
        "firstName": {"type": "string", "minLength": 1},
        "lastName": {"type": "string", "minLength": 1},
        "age": {"type": "integer", "minimum": 0, "maximum": 150},
        "email": {"type": "string", "format": "email"},
        "phones": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["type", "number"],
                "properties": {
                    "type": {"type": "string", "enum": ["home", "work", "mobile"]},
                    "number": {"type": "string"}
                }
            }
        }
    }
}');

-- Валидация через функцию
CREATE OR REPLACE FUNCTION validate_against_schema(
    data JSONB,
    schema JSONB
) RETURNS BOOLEAN AS $$
    -- Реализация валидации JSON Schema
    -- В production используйте готовое расширение
$$ LANGUAGE plpgsql;
```

---

## Практические примеры

### Пример 1: Система настроек пользователя

```sql
CREATE TABLE user_settings (
    user_id INTEGER PRIMARY KEY,
    preferences JSONB NOT NULL DEFAULT '{}'::JSONB
);

-- Вставка настроек по умолчанию
INSERT INTO user_settings (user_id, preferences) VALUES
(1, '{
    "theme": "dark",
    "language": "en",
    "notifications": {
        "email": true,
        "push": false,
        "sms": true,
        "frequency": "daily"
    },
    "privacy": {
        "profileVisible": true,
        "showEmail": false,
        "showPhone": false
    },
    "ui": {
        "sidebarCollapsed": false,
        "itemsPerPage": 25,
        "dateFormat": "MM/DD/YYYY"
    }
}');

-- Обновление отдельной настройки
UPDATE user_settings
SET preferences = jsonb_set(preferences, '{theme}', '"light"')
WHERE user_id = 1;

-- Обновление вложенной настройки
UPDATE user_settings
SET preferences = jsonb_set(
    preferences,
    '{notifications, email}',
    'false'
)
WHERE user_id = 1;

-- Получение конкретной настройки
SELECT preferences #>> '{notifications, frequency}' AS notification_frequency
FROM user_settings
WHERE user_id = 1;

-- Слияние настроек (patch)
UPDATE user_settings
SET preferences = preferences || '{
    "theme": "auto",
    "notifications": {
        "push": true
    }
}'::JSONB
WHERE user_id = 1;
-- Обновит theme на "auto" и notifications.push на true,
-- остальные notifications останутся без изменений
```

### Пример 2: Каталог продуктов с динамическими атрибутами

```sql
CREATE TABLE catalog_products (
    product_id SERIAL PRIMARY KEY,
    category VARCHAR(100),
    attributes JSONB NOT NULL
);

CREATE INDEX idx_catalog_attrs_gin ON catalog_products USING gin(attributes);
CREATE INDEX idx_catalog_category ON catalog_products(category);

-- Электроника
INSERT INTO catalog_products (category, attributes) VALUES
('laptop', '{
    "brand": "Dell",
    "model": "XPS 15",
    "specs": {
        "cpu": "Intel i7-12700H",
        "ram": "16GB",
        "storage": "512GB SSD",
        "display": "15.6\" OLED 4K"
    },
    "price": 1899.99,
    "stock": 15,
    "colors": ["Silver", "Black"],
    "features": ["Backlit Keyboard", "Fingerprint Reader", "Thunderbolt 4"]
}');

-- Одежда
INSERT INTO catalog_products (category, attributes) VALUES
('shirt', '{
    "brand": "Nike",
    "model": "Dri-FIT",
    "specs": {
        "material": "100% Polyester",
        "fit": "Athletic"
    },
    "price": 49.99,
    "stock": 120,
    "sizes": ["S", "M", "L", "XL"],
    "colors": ["Red", "Blue", "Black", "White"]
}');

-- Поиск ноутбуков с конкретными характеристиками
SELECT 
    attributes ->> 'brand' AS brand,
    attributes ->> 'model' AS model,
    attributes #>> '{specs, ram}' AS ram,
    attributes -> 'price' AS price
FROM catalog_products
WHERE category = 'laptop'
  AND attributes @> '{"specs": {"ram": "16GB"}}'
  AND (attributes ->> 'price')::NUMERIC < 2000;

-- Поиск товаров с определённым цветом
SELECT 
    category,
    attributes ->> 'brand' AS brand,
    attributes ->> 'model' AS model
FROM catalog_products
WHERE attributes -> 'colors' @> '["Black"]';

-- Агрегация: средняя цена по категориям
SELECT 
    category,
    COUNT(*) AS product_count,
    AVG((attributes ->> 'price')::NUMERIC) AS avg_price,
    MIN((attributes ->> 'price')::NUMERIC) AS min_price,
    MAX((attributes ->> 'price')::NUMERIC) AS max_price
FROM catalog_products
GROUP BY category;

-- Обновление цены с историей
UPDATE catalog_products
SET attributes = jsonb_set(
    attributes,
    '{priceHistory}',
    COALESCE(attributes -> 'priceHistory', '[]'::JSONB) ||
    jsonb_build_array(jsonb_build_object(
        'price', attributes -> 'price',
        'date', to_jsonb(NOW())
    ))
)
WHERE product_id = 1;

UPDATE catalog_products
SET attributes = jsonb_set(attributes, '{price}', '1799.99')
WHERE product_id = 1;
```

### Пример 3: Event Sourcing

```sql
CREATE TABLE domain_events (
    event_id BIGSERIAL PRIMARY KEY,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_version INTEGER NOT NULL,
    event_data JSONB NOT NULL,
    metadata JSONB,
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_aggregate ON domain_events(aggregate_type, aggregate_id);
CREATE INDEX idx_events_type ON domain_events(event_type);
CREATE INDEX idx_events_data_gin ON domain_events USING gin(event_data);

-- Событие создания заказа
INSERT INTO domain_events (aggregate_type, aggregate_id, event_type, event_version, event_data, metadata)
VALUES (
    'Order',
    'a1b2c3d4-5678-90ab-cdef-1234567890ab',
    'OrderCreated',
    1,
    '{
        "orderId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
        "customerId": "customer-123",
        "items": [
            {"productId": "prod-001", "quantity": 2, "price": 29.99},
            {"productId": "prod-002", "quantity": 1, "price": 49.99}
        ],
        "total": 109.97
    }',
    '{
        "userId": "user-456",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0..."
    }'
);

-- Событие добавления товара
INSERT INTO domain_events (aggregate_type, aggregate_id, event_type, event_version, event_data)
VALUES (
    'Order',
    'a1b2c3d4-5678-90ab-cdef-1234567890ab',
    'ItemAdded',
    2,
    '{
        "productId": "prod-003",
        "quantity": 1,
        "price": 19.99
    }'
);

-- Воспроизведение состояния заказа
SELECT 
    event_type,
    event_version,
    event_data,
    occurred_at
FROM domain_events
WHERE aggregate_type = 'Order'
  AND aggregate_id = 'a1b2c3d4-5678-90ab-cdef-1234567890ab'
ORDER BY event_version;

-- Проекция: текущее состояние заказа
CREATE MATERIALIZED VIEW order_current_state AS
WITH ordered_events AS (
    SELECT 
        aggregate_id,
        event_type,
        event_data,
        event_version,
        occurred_at,
        ROW_NUMBER() OVER (PARTITION BY aggregate_id ORDER BY event_version) AS rn
    FROM domain_events
    WHERE aggregate_type = 'Order'
)
SELECT 
    aggregate_id AS order_id,
    jsonb_agg(
        jsonb_build_object(
            'eventType', event_type,
            'data', event_data,
            'version', event_version
        ) ORDER BY event_version
    ) AS events,
    MAX(occurred_at) AS last_modified
FROM ordered_events
GROUP BY aggregate_id;

CREATE UNIQUE INDEX idx_order_state_id ON order_current_state(order_id);
```

### Пример 4: Логирование и аудит

```sql
CREATE TABLE audit_log (
    log_id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    row_id BIGINT,
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT DEFAULT current_user,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_table_time ON audit_log(table_name, changed_at);
CREATE INDEX idx_audit_row ON audit_log(table_name, row_id);
CREATE INDEX idx_audit_data_gin ON audit_log USING gin(new_data);

-- Триггерная функция для автоматического аудита
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, operation, row_id, old_data)
        VALUES (TG_TABLE_NAME, TG_OP, OLD.user_id, to_jsonb(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, operation, row_id, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.user_id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, operation, row_id, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.user_id, to_jsonb(NEW));
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Поиск изменений конкретного поля
SELECT 
    changed_at,
    old_data ->> 'email' AS old_email,
    new_data ->> 'email' AS new_email
FROM audit_log
WHERE table_name = 'users'
  AND row_id = 1
  AND old_data ->> 'email' IS DISTINCT FROM new_data ->> 'email';

-- Кто менял определённое поле
SELECT DISTINCT changed_by
FROM audit_log
WHERE table_name = 'users'
  AND jsonb_typeof(new_data -> 'profile' -> 'vip') IS NOT NULL;
```

---

## Производительность и оптимизация

### Сравнение производительности

```sql
-- Тест: миллион записей
CREATE TABLE json_perf_test (
    id SERIAL PRIMARY KEY,
    data JSONB
);

-- Генерация тестовых данных
INSERT INTO json_perf_test (data)
SELECT jsonb_build_object(
    'userId', i,
    'name', 'User ' || i,
    'age', 20 + (random() * 50)::INTEGER,
    'city', CASE (random() * 5)::INTEGER
        WHEN 0 THEN 'New York'
        WHEN 1 THEN 'London'
        WHEN 2 THEN 'Tokyo'
        WHEN 3 THEN 'Paris'
        ELSE 'Sydney'
    END,
    'active', random() > 0.3,
    'tags', jsonb_build_array(
        'tag' || (random() * 10)::INTEGER,
        'tag' || (random() * 10)::INTEGER
    )
)
FROM generate_series(1, 1000000) i;

-- БЕЗ индекса
EXPLAIN ANALYZE
SELECT * FROM json_perf_test WHERE data @> '{"city": "Tokyo"}';
-- Seq Scan ... Execution Time: ~2000ms

-- С GIN индексом
CREATE INDEX idx_perf_data_gin ON json_perf_test USING gin(data);
ANALYZE json_perf_test;

EXPLAIN ANALYZE
SELECT * FROM json_perf_test WHERE data @> '{"city": "Tokyo"}';
-- Bitmap Index Scan ... Execution Time: ~50ms (в 40 раз быстрее!)

-- Индекс на конкретное поле
CREATE INDEX idx_perf_city ON json_perf_test ((data ->> 'city'));

EXPLAIN ANALYZE
SELECT * FROM json_perf_test WHERE data ->> 'city' = 'Tokyo';
-- Index Scan ... Execution Time: ~20ms (в 2.5 раза быстрее GIN!)
```

### Best Practices для производительности

```sql
-- ❌ ПЛОХО: извлечение как TEXT и конвертация
SELECT * FROM users WHERE (profile ->> 'age')::INTEGER > 30;

-- ✅ ХОРОШО: B-tree индекс на числовое поле
CREATE INDEX idx_users_age_int ON users (((profile ->> 'age')::INTEGER));
SELECT * FROM users WHERE (profile ->> 'age')::INTEGER > 30;

-- ❌ ПЛОХО: OR на разных JSONB условиях
SELECT * FROM users 
WHERE profile @> '{"vip": true}' OR profile @> '{"premium": true}';

-- ✅ ХОРОШО: объединённое условие
SELECT * FROM users 
WHERE profile ?| array['vip', 'premium'];

-- ❌ ПЛОХО: множественные jsonb_set
UPDATE users
SET profile = jsonb_set(
    jsonb_set(
        jsonb_set(profile, '{a}', '"1"'),
        '{b}', '"2"'
    ),
    '{c}', '"3"'
);

-- ✅ ХОРОШО: конкатенация
UPDATE users
SET profile = profile || '{"a": "1", "b": "2", "c": "3"}';

-- ❌ ПЛОХО: SELECT * когда нужно одно поле
SELECT * FROM users WHERE profile @> '{"city": "Tokyo"}';

-- ✅ ХОРОШО: SELECT только нужных полей
SELECT user_id, profile ->> 'city' AS city 
FROM users WHERE profile @> '{"city": "Tokyo"}';
```

---

## Миграция из MongoDB

```sql
-- MongoDB document:
-- {
--   "_id": ObjectId("507f1f77bcf86cd799439011"),
--   "name": "John Doe",
--   "email": "john@example.com",
--   "age": 30,
--   "address": {
--     "street": "123 Main St",
--     "city": "New York"
--   },
--   "tags": ["developer", "nodejs"],
--   "createdAt": ISODate("2024-01-15T10:30:00Z")
-- }

-- PostgreSQL эквивалент:
CREATE TABLE mongo_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO mongo_users (document) VALUES
('{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "address": {
        "street": "123 Main St",
        "city": "New York"
    },
    "tags": ["developer", "nodejs"]
}');

-- MongoDB: db.users.find({age: {$gt: 25}})
SELECT * FROM mongo_users WHERE (document ->> 'age')::INTEGER > 25;

-- MongoDB: db.users.find({"address.city": "New York"})
SELECT * FROM mongo_users WHERE document @> '{"address": {"city": "New York"}}';

-- MongoDB: db.users.find({tags: "nodejs"})
SELECT * FROM mongo_users WHERE document -> 'tags' @> '["nodejs"]';

-- MongoDB: db.users.updateOne({email: "john@example.com"}, {$set: {age: 31}})
UPDATE mongo_users
SET document = jsonb_set(document, '{age}', '31')
WHERE document ->> 'email' = 'john@example.com';

-- MongoDB: db.users.aggregate([{$group: {_id: "$address.city", count: {$sum: 1}}}])
SELECT 
    document #>> '{address, city}' AS city,
    COUNT(*) AS count
FROM mongo_users
GROUP BY document #>> '{address, city}';
```

---

## Заключение

JSONB в PostgreSQL предоставляет мощные NoSQL возможности без потери преимуществ реляционной модели:

1. **Используйте JSONB**, а не JSON (за редким исключением)
2. **Создавайте GIN индексы** для частых запросов с @>, ?, ?&, ?|
3. **Создавайте B-tree индексы** на извлечённые поля для точных поисков
4. **Валидируйте данные** через CHECK ограничения и триггеры
5. **Нормализуйте при необходимости** — не храните всё в JSONB
6. **Мониторьте производительность** — EXPLAIN ANALYZE ваш друг

:::tip Когда использовать JSONB
- Динамические/гибкие схемы данных
- Атрибуты продуктов, настройки пользователей
- Логи, события, метаданные
- Прототипирование (потом можно нормализовать)
- Интеграция с внешними API

Когда НЕ использовать:
- Данные с чёткой структурой (используйте колонки)
- Часто обновляемые поля (медленнее чем колонки)
- Данные требующие строгой типизации
:::

## Дополнительные ресурсы

- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)
- [JSONB Indexing](https://www.postgresql.org/docs/current/datatype-json.html#JSON-INDEXING)
- [JSON Types](https://www.postgresql.org/docs/current/datatype-json.html)
