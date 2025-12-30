---
sidebar_position: 7
description: "В этой главе мы изучим ключи и связи в PostgreSQL."
---

# Constraints - правила для данных

## Что такое Constraints и зачем они нужны

### Проблема без ограничений

Представьте таблицу без правил:

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    price DECIMAL(10, 2),
    stock_quantity INTEGER,
    email VARCHAR(100)
);

-- Можно вставить что угодно:
INSERT INTO products (name, price, stock_quantity, email) VALUES 
    (NULL, -1000, -50, 'invalid-email'),      -- Нет имени, отрицательные значения
    ('', 0, 999999, 'user@'),                 -- Пустое имя, неправильный email
    ('Товар', 99999999.99, NULL, NULL);       -- Огромная цена, NULL в количестве
```

**Проблемы:**
- ❌ Нет имени товара
- ❌ Отрицательная цена
- ❌ Отрицательное количество
- ❌ Неправильный формат email
- ❌ Данные бесполезны и некорректны

### Решение: Constraints (ограничения)

**Constraints** — это правила, которые обеспечивают корректность данных на уровне базы данных.

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL CHECK (LENGTH(name) > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    email VARCHAR(100) CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Теперь неправильные данные не пройдут:
INSERT INTO products (name, price, stock_quantity, email) 
VALUES (NULL, -1000, -50, 'invalid');
-- ERROR: null value in column "name" violates not-null constraint
```

### Преимущества Constraints

1. **Защита данных** — невозможно вставить некорректные данные
2. **Централизация правил** — правила в одном месте (не в коде приложения)
3. **Документирование** — структура показывает, какие правила действуют
4. **Производительность** — БД может оптимизировать запросы, зная правила
5. **Надежность** — работает даже если приложение содержит ошибки

### Типы Constraints в PostgreSQL

| Constraint | Описание | Пример |
|-----------|----------|--------|
| **NOT NULL** | Поле обязательно | `name VARCHAR(100) NOT NULL` |
| **UNIQUE** | Значения уникальны | `email VARCHAR(100) UNIQUE` |
| **PRIMARY KEY** | Первичный ключ (UNIQUE + NOT NULL) | `id SERIAL PRIMARY KEY` |
| **FOREIGN KEY** | Внешний ключ (связь с другой таблицей) | `user_id INTEGER REFERENCES users(id)` |
| **CHECK** | Проверка условия | `age INTEGER CHECK (age >= 18)` |
| **DEFAULT** | Значение по умолчанию | `status VARCHAR(20) DEFAULT 'active'` |
| **EXCLUDE** | Исключающее ограничение (редко) | Для диапазонов и геометрии |

---

## NOT NULL - обязательные поля

### Что делает NOT NULL?

**NOT NULL** запрещает NULL значения в столбце. Поле ДОЛЖНО быть заполнено.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,     -- Обязательно
    email VARCHAR(100) NOT NULL,       -- Обязательно
    phone VARCHAR(20),                 -- Необязательно (может быть NULL)
    bio TEXT                           -- Необязательно
);
```

### Примеры использования NOT NULL

**Пример 1: Базовое использование**

```sql
-- ✅ Работает - все обязательные поля заполнены
INSERT INTO users (username, email) 
VALUES ('alice', 'alice@example.com');

-- ❌ Ошибка - нет username
INSERT INTO users (email) 
VALUES ('bob@example.com');
-- ERROR: null value in column "username" violates not-null constraint

-- ✅ Работает - phone может быть NULL
INSERT INTO users (username, email, phone) 
VALUES ('charlie', 'charlie@example.com', NULL);
```

**Пример 2: NOT NULL с DEFAULT**

```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',  -- Обязательно, но есть значение по умолчанию
    published_at TIMESTAMP
);

-- Можно не указывать status - он автоматически будет 'draft'
INSERT INTO posts (title, content) 
VALUES ('Новый пост', 'Содержание...');
```

### Когда использовать NOT NULL?

**Используйте NOT NULL когда:**
- ✅ Данные критически важны (имя пользователя, email)
- ✅ Поле необходимо для бизнес-логики (цена товара)
- ✅ Связь обязательна (каждый заказ должен иметь пользователя)

**НЕ используйте NOT NULL когда:**
- ❌ Данные опциональны (телефон, второй адрес)
- ❌ Данные могут появиться позже (дата окончания подписки)
- ❌ Поле используется редко (примечания)

### Добавление NOT NULL к существующему столбцу

```sql
-- Проверим, есть ли NULL значения
SELECT COUNT(*) FROM users WHERE phone IS NULL;

-- Если NULL значений нет, можно добавить NOT NULL
ALTER TABLE users 
ALTER COLUMN phone SET NOT NULL;

-- Если есть NULL, сначала заполните их
UPDATE users SET phone = 'N/A' WHERE phone IS NULL;
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;

-- Удаление NOT NULL
ALTER TABLE users 
ALTER COLUMN phone DROP NOT NULL;
```

---

## UNIQUE - уникальность значений

### Что делает UNIQUE?

**UNIQUE** гарантирует, что все значения в столбце (или комбинации столбцов) уникальны.

**Важно:** NULL считается уникальным! Можно иметь несколько NULL значений в UNIQUE столбце.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,  -- Уникальный и обязательный
    email VARCHAR(100) UNIQUE NOT NULL,     -- Уникальный и обязательный
    phone VARCHAR(20) UNIQUE                -- Уникальный, но может быть NULL
);
```

### Примеры UNIQUE

**Пример 1: Простой UNIQUE**

```sql
-- ✅ Работает
INSERT INTO users (username, email, phone) 
VALUES ('alice', 'alice@example.com', '+79001111111');

-- ❌ Ошибка - username уже существует
INSERT INTO users (username, email, phone) 
VALUES ('alice', 'other@example.com', '+79002222222');
-- ERROR: duplicate key value violates unique constraint "users_username_key"

-- ✅ Работает - NULL в phone допускается многократно
INSERT INTO users (username, email) 
VALUES ('bob', 'bob@example.com');
INSERT INTO users (username, email) 
VALUES ('charlie', 'charlie@example.com');
-- Оба имеют phone = NULL, это ОК!
```

**Пример 2: Составной UNIQUE (уникальная комбинация)**

```sql
CREATE TABLE product_warehouses (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    warehouse_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    UNIQUE(product_id, warehouse_id)  -- Комбинация должна быть уникальной
);

-- ✅ Работает - продукт 1 на складе 1
INSERT INTO product_warehouses (product_id, warehouse_id, quantity) 
VALUES (1, 1, 100);

-- ✅ Работает - продукт 1 на складе 2 (другой склад)
INSERT INTO product_warehouses (product_id, warehouse_id, quantity) 
VALUES (1, 2, 50);

-- ✅ Работает - продукт 2 на складе 1 (другой продукт)
INSERT INTO product_warehouses (product_id, warehouse_id, quantity) 
VALUES (2, 1, 75);

-- ❌ Ошибка - продукт 1 уже есть на складе 1
INSERT INTO product_warehouses (product_id, warehouse_id, quantity) 
VALUES (1, 1, 200);
-- ERROR: duplicate key value violates unique constraint
```

### Разница между UNIQUE и PRIMARY KEY

| | UNIQUE | PRIMARY KEY |
|---|--------|-------------|
| Уникальность | ✅ Да | ✅ Да |
| NULL значения | ✅ Разрешены (много NULL) | ❌ Запрещены |
| Количество | Много в таблице | Один в таблице |
| Индекс | Создается автоматически | Создается автоматически |

```sql
CREATE TABLE example (
    id SERIAL PRIMARY KEY,        -- Только один PRIMARY KEY
    email VARCHAR(100) UNIQUE,    -- Может быть много UNIQUE
    username VARCHAR(50) UNIQUE,
    phone VARCHAR(20) UNIQUE
);
```

### Работа с UNIQUE constraints

**Добавление UNIQUE к существующему столбцу:**

```sql
-- Проверить дубликаты
SELECT email, COUNT(*) 
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Если дубликатов нет, добавить UNIQUE
ALTER TABLE users 
ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Удаление UNIQUE
ALTER TABLE users 
DROP CONSTRAINT users_email_unique;
```

**Именованные UNIQUE constraints:**

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50),
    barcode VARCHAR(50),
    CONSTRAINT products_sku_unique UNIQUE (sku),
    CONSTRAINT products_barcode_unique UNIQUE (barcode)
);

-- Легко идентифицировать и удалять
ALTER TABLE products DROP CONSTRAINT products_sku_unique;
```

---

## CHECK - проверка условий

### Что делает CHECK?

**CHECK** проверяет, что значение удовлетворяет условию. Если условие ложно — вставка/обновление отклоняется.

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) CHECK (price > 0),              -- Цена положительная
    discount_percent INTEGER CHECK (discount_percent BETWEEN 0 AND 100),
    stock_quantity INTEGER CHECK (stock_quantity >= 0),  -- Количество неотрицательное
    rating DECIMAL(2, 1) CHECK (rating BETWEEN 0 AND 5)  -- Рейтинг от 0 до 5
);
```

### Примеры CHECK

**Пример 1: Простые условия**

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    age INTEGER CHECK (age >= 18 AND age <= 120),  -- Возраст от 18 до 120
    email VARCHAR(100) CHECK (email LIKE '%@%')     -- Email должен содержать @
);

-- ✅ Работает
INSERT INTO users (username, age, email) 
VALUES ('alice', 25, 'alice@example.com');

-- ❌ Ошибка - возраст меньше 18
INSERT INTO users (username, age, email) 
VALUES ('bob', 15, 'bob@example.com');
-- ERROR: new row violates check constraint "users_age_check"

-- ❌ Ошибка - нет @ в email
INSERT INTO users (username, age, email) 
VALUES ('charlie', 30, 'invalid-email');
-- ERROR: new row violates check constraint "users_email_check"
```

**Пример 2: CHECK с несколькими столбцами**

```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CHECK (end_date >= start_date)  -- Конец не раньше начала
);

-- ✅ Работает
INSERT INTO events (name, start_date, end_date) 
VALUES ('Конференция', '2024-06-01', '2024-06-03');

-- ❌ Ошибка - конец раньше начала
INSERT INTO events (name, start_date, end_date) 
VALUES ('Встреча', '2024-06-10', '2024-06-05');
-- ERROR: new row violates check constraint
```

**Пример 3: CHECK с регулярными выражениями**

```sql
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) CHECK (phone ~ '^\+?[0-9\s\-\(\)]{10,20}$'),  -- Формат телефона
    email VARCHAR(100) CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'), -- Email
    postal_code VARCHAR(10) CHECK (postal_code ~ '^\d{6}$')  -- 6 цифр
);

-- ✅ Работает
INSERT INTO contacts (name, phone, email, postal_code) 
VALUES ('Иван', '+7 900 123 45 67', 'ivan@example.com', '123456');

-- ❌ Ошибка - неправильный формат телефона
INSERT INTO contacts (name, phone) 
VALUES ('Мария', 'invalid-phone');
```

**Пример 4: Именованные CHECK constraints**

```sql
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INTEGER,
    salary DECIMAL(10, 2),
    department VARCHAR(50),
    CONSTRAINT employees_age_valid CHECK (age >= 18 AND age <= 100),
    CONSTRAINT employees_salary_positive CHECK (salary > 0),
    CONSTRAINT employees_department_valid 
        CHECK (department IN ('IT', 'HR', 'Sales', 'Marketing'))
);

-- Легко идентифицировать ошибку по имени constraint
INSERT INTO employees (name, age, salary, department) 
VALUES ('Анна', 25, 50000, 'Finance');
-- ERROR: new row violates check constraint "employees_department_valid"
```

### Сложные CHECK conditions

**Пример: Скидка только для дорогих товаров**

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    CHECK (
        discount_amount = 0 OR 
        (price >= 1000 AND discount_amount <= price * 0.5)
    )  -- Скидка только если цена >= 1000 и скидка <= 50%
);

-- ✅ Работает - нет скидки
INSERT INTO products (name, price, discount_amount) 
VALUES ('Дешевый товар', 500, 0);

-- ✅ Работает - есть скидка на дорогой товар
INSERT INTO products (name, price, discount_amount) 
VALUES ('Дорогой товар', 2000, 500);

-- ❌ Ошибка - скидка на дешевый товар
INSERT INTO products (name, price, discount_amount) 
VALUES ('Дешевый со скидкой', 800, 100);
```

### Работа с CHECK constraints

**Добавление CHECK к существующему столбцу:**

```sql
-- Проверить, что все данные удовлетворяют условию
SELECT * FROM products WHERE price <= 0;

-- Если все ОК, добавить CHECK
ALTER TABLE products 
ADD CONSTRAINT products_price_positive CHECK (price > 0);

-- Удаление CHECK
ALTER TABLE products 
DROP CONSTRAINT products_price_positive;
```

**Отключение проверки (осторожно!):**

```sql
-- Временно отключить проверку
ALTER TABLE products 
DISABLE CONSTRAINT products_price_positive;

-- Включить обратно
ALTER TABLE products 
ENABLE CONSTRAINT products_price_positive;
```

---

## DEFAULT - значения по умолчанию

### Что делает DEFAULT?

**DEFAULT** устанавливает значение, которое используется, если значение не указано при вставке.

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_completed BOOLEAN DEFAULT FALSE
);
```

### Примеры DEFAULT

**Пример 1: Простые значения по умолчанию**

```sql
-- Можно не указывать status, priority, created_at, is_completed
INSERT INTO tasks (title) 
VALUES ('Изучить PostgreSQL');

-- Они заполнятся автоматически
SELECT * FROM tasks;
-- title: "Изучить PostgreSQL"
-- status: "pending"
-- priority: 3
-- created_at: 2024-01-15 10:30:00
-- is_completed: false
```

**Пример 2: DEFAULT с функциями**

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activation_code UUID DEFAULT gen_random_uuid(),
    account_number VARCHAR(20) DEFAULT 'ACC-' || LPAD(nextval('account_seq')::TEXT, 10, '0')
);

-- Создаем последовательность для номеров счетов
CREATE SEQUENCE account_seq START 1;

INSERT INTO users (username, email) 
VALUES ('alice', 'alice@example.com');

-- created_at = текущее время
-- activation_code = случайный UUID
-- account_number = ACC-0000000001
```

**Пример 3: DEFAULT для расчетных значений**

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(4, 2) DEFAULT 0.20,  -- НДС 20%
    tax_amount DECIMAL(10, 2) GENERATED ALWAYS AS (subtotal * tax_rate) STORED,
    total DECIMAL(10, 2) GENERATED ALWAYS AS (subtotal + subtotal * tax_rate) STORED
);

INSERT INTO orders (subtotal) VALUES (10000);

SELECT * FROM orders;
-- subtotal: 10000.00
-- tax_rate: 0.20
-- tax_amount: 2000.00
-- total: 12000.00
```

**Пример 4: DEFAULT с условиями**

```sql
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    plan VARCHAR(20) NOT NULL,
    starts_at DATE DEFAULT CURRENT_DATE,
    expires_at DATE DEFAULT CURRENT_DATE + INTERVAL '30 days',
    auto_renew BOOLEAN DEFAULT TRUE
);

INSERT INTO subscriptions (user_id, plan) 
VALUES (1, 'premium');

-- starts_at = сегодня
-- expires_at = через 30 дней
-- auto_renew = true
```

### Разница между DEFAULT и NOT NULL

```sql
CREATE TABLE example (
    -- Обязательное поле без значения по умолчанию
    required_field VARCHAR(50) NOT NULL,
    
    -- Необязательное поле со значением по умолчанию
    optional_with_default VARCHAR(50) DEFAULT 'N/A',
    
    -- Обязательное поле со значением по умолчанию
    required_with_default VARCHAR(50) NOT NULL DEFAULT 'active',
    
    -- Необязательное поле без значения по умолчанию
    optional_field VARCHAR(50)
);

-- ✅ Работает
INSERT INTO example (required_field) 
VALUES ('test');
-- required_field = 'test'
-- optional_with_default = 'N/A' (DEFAULT)
-- required_with_default = 'active' (DEFAULT)
-- optional_field = NULL

-- ❌ Ошибка - нет required_field
INSERT INTO example (optional_field) 
VALUES ('value');
```

### Работа с DEFAULT

**Добавление DEFAULT к существующему столбцу:**

```sql
-- Добавить DEFAULT
ALTER TABLE tasks 
ALTER COLUMN priority SET DEFAULT 5;

-- Удалить DEFAULT
ALTER TABLE tasks 
ALTER COLUMN priority DROP DEFAULT;

-- Изменить DEFAULT
ALTER TABLE tasks 
ALTER COLUMN status SET DEFAULT 'new';
```

**Явное использование DEFAULT:**

```sql
-- Явно использовать значение по умолчанию
INSERT INTO tasks (title, status) 
VALUES ('Задача', DEFAULT);

-- Или просто не указывать столбец
INSERT INTO tasks (title) 
VALUES ('Задача');
```

---

## Составные и именованные constraints

### Именование constraints

**Зачем давать имена constraints:**
- ✅ Легче понять ошибку
- ✅ Легче удалить или изменить
- ✅ Документирование структуры

**Синтаксис:**

```sql
CREATE TABLE table_name (
    column type CONSTRAINT constraint_name CONSTRAINT_TYPE,
    ...
    CONSTRAINT constraint_name CONSTRAINT_TYPE
);
```

### Примеры именованных constraints

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) CONSTRAINT products_name_not_empty 
        NOT NULL CHECK (LENGTH(name) > 0),
    sku VARCHAR(50) CONSTRAINT products_sku_unique UNIQUE,
    price DECIMAL(10, 2) CONSTRAINT products_price_positive 
        CHECK (price > 0),
    discount_percent INTEGER CONSTRAINT products_discount_valid 
        CHECK (discount_percent BETWEEN 0 AND 100),
    category_id INTEGER CONSTRAINT products_category_fk 
        REFERENCES categories(id)
);
```

**Альтернативный синтаксис (в конце таблицы):**

```sql
CREATE TABLE products (
    id SERIAL,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50),
    price DECIMAL(10, 2),
    discount_percent INTEGER,
    category_id INTEGER,
    
    CONSTRAINT products_pk PRIMARY KEY (id),
    CONSTRAINT products_name_length CHECK (LENGTH(name) > 0),
    CONSTRAINT products_sku_unique UNIQUE (sku),
    CONSTRAINT products_price_positive CHECK (price > 0),
    CONSTRAINT products_discount_range CHECK (discount_percent BETWEEN 0 AND 100),
    CONSTRAINT products_category_fk FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### Составные constraints

**UNIQUE на несколько столбцов:**

```sql
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    semester VARCHAR(20) NOT NULL,
    grade VARCHAR(2),
    
    -- Студент может записаться на курс только один раз в семестр
    CONSTRAINT enrollments_unique UNIQUE (student_id, course_id, semester)
);

-- ✅ Работает
INSERT INTO enrollments (student_id, course_id, semester) 
VALUES (1, 101, '2024-Spring');

-- ✅ Работает - тот же курс, но другой семестр
INSERT INTO enrollments (student_id, course_id, semester) 
VALUES (1, 101, '2024-Fall');

-- ❌ Ошибка - дубликат
INSERT INTO enrollments (student_id, course_id, semester) 
VALUES (1, 101, '2024-Spring');
```

**CHECK на несколько столбцов:**

```sql
CREATE TABLE discounts (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    discount_type VARCHAR(20) NOT NULL,  -- 'percent' или 'fixed'
    discount_value DECIMAL(10, 2) NOT NULL,
    
    CONSTRAINT discounts_value_valid CHECK (
        (discount_type = 'percent' AND discount_value BETWEEN 1 AND 100) OR
        (discount_type = 'fixed' AND discount_value > 0)
    )
);

-- ✅ Работает - процентная скидка
INSERT INTO discounts (code, discount_type, discount_value) 
VALUES ('SAVE10', 'percent', 10);

-- ✅ Работает - фиксированная скидка
INSERT INTO discounts (code, discount_type, discount_value) 
VALUES ('SAVE500', 'fixed', 500);

-- ❌ Ошибка - процент больше 100
INSERT INTO discounts (code, discount_type, discount_value) 
VALUES ('INVALID', 'percent', 150);
```

### Просмотр существующих constraints

```sql
-- Все constraints таблицы
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'products'::regclass;

-- Или через information_schema
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'products';

-- В psql
\d products
```

---

## Управление constraints

### Добавление constraints к существующей таблице

```sql
-- NOT NULL
ALTER TABLE products 
ALTER COLUMN name SET NOT NULL;

-- UNIQUE
ALTER TABLE products 
ADD CONSTRAINT products_sku_unique UNIQUE (sku);

-- CHECK
ALTER TABLE products 
ADD CONSTRAINT products_price_positive CHECK (price > 0);

-- DEFAULT
ALTER TABLE products 
ALTER COLUMN status SET DEFAULT 'active';

-- FOREIGN KEY
ALTER TABLE products 
ADD CONSTRAINT products_category_fk 
    FOREIGN KEY (category_id) 
    REFERENCES categories(id);
```

### Удаление constraints

```sql
-- Удаление именованного constraint
ALTER TABLE products 
DROP CONSTRAINT products_price_positive;

-- NOT NULL удаляется особым образом
ALTER TABLE products 
ALTER COLUMN name DROP NOT NULL;

-- DEFAULT тоже особый способ
ALTER TABLE products 
ALTER COLUMN status DROP DEFAULT;

-- Удаление с каскадом (если другие объекты зависят от constraint)
ALTER TABLE products 
DROP CONSTRAINT products_category_fk CASCADE;
```

### Изменение constraints

```sql
-- Constraints нельзя изменить напрямую, нужно удалить и создать заново

-- Удалить старый CHECK
ALTER TABLE products 
DROP CONSTRAINT products_price_positive;

-- Создать новый CHECK
ALTER TABLE products 
ADD CONSTRAINT products_price_positive CHECK (price >= 0);
```

### Отключение и включение constraints

```sql
-- Временно отключить проверку (для массовой загрузки данных)
ALTER TABLE products 
DISABLE CONSTRAINT products_price_positive;

-- Вставить данные...

-- Включить обратно (проверит существующие данные)
ALTER TABLE products 
ENABLE CONSTRAINT products_price_positive;

-- Включить БЕЗ проверки существующих данных (опасно!)
ALTER TABLE products 
ENABLE NO VALIDATE CONSTRAINT products_price_positive;
```

---

## Практическое задание

### Задание 1: Система бронирования отелей (обязательно)

Создайте базу данных с правильными constraints:

```sql
CREATE DATABASE hotel_booking;
\c hotel_booking

-- Отели
CREATE TABLE hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) CONSTRAINT hotels_name_required NOT NULL 
        CHECK (LENGTH(name) >= 3),
    address TEXT CONSTRAINT hotels_address_required NOT NULL,
    stars INTEGER CONSTRAINT hotels_stars_valid 
        CHECK (stars BETWEEN 1 AND 5),
    email VARCHAR(100) CONSTRAINT hotels_email_valid 
        CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Номера
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER CONSTRAINT rooms_hotel_fk 
        REFERENCES hotels(id) ON DELETE CASCADE,
    room_number VARCHAR(10) NOT NULL,
    room_type VARCHAR(50) CONSTRAINT rooms_type_valid 
        CHECK (room_type IN ('standard', 'deluxe', 'suite')),
    capacity INTEGER CONSTRAINT rooms_capacity_valid 
        CHECK (capacity BETWEEN 1 AND 10),
    price_per_night DECIMAL(10, 2) CONSTRAINT rooms_price_positive 
        CHECK (price_per_night > 0),
    is_available BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT rooms_unique UNIQUE (hotel_id, room_number)
);

-- Гости
CREATE TABLE guests (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL CHECK (LENGTH(first_name) > 0),
    last_name VARCHAR(50) NOT NULL CHECK (LENGTH(last_name) > 0),
    email VARCHAR(100) UNIQUE NOT NULL 
        CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}),
    phone VARCHAR(20) NOT NULL,
    passport_number VARCHAR(20) UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL 
        CHECK (date_of_birth < CURRENT_DATE AND 
               date_of_birth > CURRENT_DATE - INTERVAL '150 years'),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Бронирования
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES rooms(id),
    guest_id INTEGER NOT NULL REFERENCES guests(id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    num_guests INTEGER NOT NULL CHECK (num_guests > 0),
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Бизнес-правила
    CONSTRAINT bookings_dates_valid CHECK (check_out_date > check_in_date),
    CONSTRAINT bookings_dates_future CHECK (check_in_date >= CURRENT_DATE),
    CONSTRAINT bookings_duration_reasonable CHECK (
        check_out_date - check_in_date <= 365
    )
);

-- Платежи
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL 
        CHECK (payment_method IN ('cash', 'card', 'bank_transfer')),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- Отзывы
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT CHECK (LENGTH(comment) <= 1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Заполнение данными:**

```sql
-- Отели
INSERT INTO hotels (name, address, stars, email, phone) VALUES 
    ('Grand Hotel', '123 Main St, Moscow', 5, 'grand@hotel.com', '+74951234567'),
    ('City Inn', '456 Center Ave, Moscow', 3, 'city@inn.com', '+74957654321'),
    ('Beach Resort', '789 Sea Blvd, Sochi', 4, 'beach@resort.com', '+78612345678');

-- Номера
INSERT INTO rooms (hotel_id, room_number, room_type, capacity, price_per_night) VALUES 
    (1, '101', 'standard', 2, 5000),
    (1, '102', 'deluxe', 2, 8000),
    (1, '201', 'suite', 4, 15000),
    (2, '1', 'standard', 2, 3000),
    (2, '2', 'standard', 2, 3000),
    (3, 'A1', 'deluxe', 3, 6000),
    (3, 'A2', 'suite', 4, 10000);

-- Гости
INSERT INTO guests (first_name, last_name, email, phone, passport_number, date_of_birth) VALUES 
    ('Иван', 'Петров', 'ivan@example.com', '+79001111111', '1234567890', '1990-05-15'),
    ('Мария', 'Сидорова', 'maria@example.com', '+79002222222', '0987654321', '1985-08-20'),
    ('Алексей', 'Смирнов', 'alex@example.com', '+79003333333', '1122334455', '1995-12-10');

-- Бронирования
INSERT INTO bookings (room_id, guest_id, check_in_date, check_out_date, num_guests, total_price, status) VALUES 
    (1, 1, CURRENT_DATE + 5, CURRENT_DATE + 8, 2, 15000, 'confirmed'),
    (3, 2, CURRENT_DATE + 10, CURRENT_DATE + 13, 4, 45000, 'confirmed'),
    (4, 3, CURRENT_DATE + 2, CURRENT_DATE + 4, 2, 6000, 'pending');

-- Платежи
INSERT INTO payments (booking_id, amount, payment_method, status) VALUES 
    (1, 15000, 'card', 'completed'),
    (2, 45000, 'bank_transfer', 'completed');

-- Отзывы
INSERT INTO reviews (booking_id, rating, comment) VALUES 
    (1, 5, 'Отличный отель! Всё понравилось.');
```

**Задания:**

**1. Попробуйте нарушить constraints:**

```sql
-- Попробуйте вставить отель без имени
INSERT INTO hotels (address, stars) VALUES ('Test', 5);

-- Попробуйте вставить номер с отрицательной ценой
INSERT INTO rooms (hotel_id, room_number, room_type, capacity, price_per_night)
VALUES (1, '103', 'standard', 2, -1000);

-- Попробуйте создать бронирование с датой выезда раньше заезда
INSERT INTO bookings (room_id, guest_id, check_in_date, check_out_date, num_guests, total_price)
VALUES (1, 1, '2024-06-10', '2024-06-05', 2, 5000);

-- Попробуйте создать гостя с неправильным email
INSERT INTO guests (first_name, last_name, email, phone, passport_number, date_of_birth)
VALUES ('Тест', 'Тестов', 'invalid-email', '+79999999999', '9999999999', '2000-01-01');

-- Попробуйте дублировать номер паспорта
INSERT INTO guests (first_name, last_name, email, phone, passport_number, date_of_birth)
VALUES ('Другой', 'Человек', 'other@example.com', '+79888888888', '1234567890', '1992-03-15');
```

**2. Напишите запросы:**

```sql
-- Все доступные номера отеля
SELECT h.name AS hotel, r.room_number, r.room_type, r.price_per_night
FROM rooms r
JOIN hotels h ON r.hotel_id = h.id
WHERE r.is_available = TRUE
ORDER BY h.name, r.price_per_night;

-- Бронирования с проверкой дат
SELECT 
    g.first_name || ' ' || g.last_name AS guest,
    h.name AS hotel,
    r.room_number,
    b.check_in_date,
    b.check_out_date,
    b.check_out_date - b.check_in_date AS nights,
    b.total_price
FROM bookings b
JOIN guests g ON b.guest_id = g.id
JOIN rooms r ON b.room_id = r.id
JOIN hotels h ON r.hotel_id = h.id
WHERE b.status = 'confirmed'
ORDER BY b.check_in_date;

-- Отели со средним рейтингом
SELECT 
    h.name,
    ROUND(AVG(rv.rating), 2) AS avg_rating,
    COUNT(rv.id) AS reviews_count
FROM hotels h
JOIN rooms r ON h.id = r.hotel_id
JOIN bookings b ON r.id = b.room_id
LEFT JOIN reviews rv ON b.id = rv.booking_id
GROUP BY h.id, h.name
HAVING COUNT(rv.id) > 0
ORDER BY avg_rating DESC;
```

---

### Задание 2: Добавьте дополнительные constraints (обязательно)

**1. Проверка вместимости:**

```sql
-- Количество гостей не должно превышать вместимость номера
ALTER TABLE bookings
ADD CONSTRAINT bookings_capacity_check CHECK (
    num_guests <= (SELECT capacity FROM rooms WHERE id = room_id)
);
-- Примечание: этот CHECK не сработает, т.к. нельзя использовать подзапросы в CHECK
-- Для этого нужен TRIGGER (изучим позже)
```

**2. Проверка полной оплаты:**

```sql
-- Создать представление для проверки
CREATE VIEW booking_payment_status AS
SELECT 
    b.id AS booking_id,
    b.total_price,
    COALESCE(SUM(p.amount), 0) AS paid_amount,
    b.total_price - COALESCE(SUM(p.amount), 0) AS remaining
FROM bookings b
LEFT JOIN payments p ON b.id = p.booking_id AND p.status = 'completed'
GROUP BY b.id, b.total_price;
```

**3. Предотвращение двойного бронирования:**

```sql
-- EXCLUDE constraint (продвинутый уровень)
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
ADD CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    room_id WITH =,
    daterange(check_in_date, check_out_date, '[]') WITH &&
)
WHERE (status != 'cancelled');

-- Теперь нельзя создать пересекающиеся бронирования
```

---

### Задание 3: Исправление данных с нарушениями (дополнительно)

Представьте, что вы получили таблицу с некорректными данными:

```sql
CREATE TABLE bad_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    price DECIMAL(10, 2),
    stock INT,
    email VARCHAR(100)
);

INSERT INTO bad_products (name, price, stock, email) VALUES 
    ('', 100, 5, 'valid@email.com'),           -- Пустое имя
    ('Product A', -50, 10, 'test@test.com'),   -- Отрицательная цена
    ('Product B', 100, -5, 'test@test.com'),   -- Отрицательный stock, дубликат email
    ('Product C', 200, 3, 'invalid'),          -- Неправильный email
    (NULL, 150, 0, NULL);                      -- NULL значения

-- Ваша задача: очистить данные и добавить constraints

-- Шаг 1: Исправить пустые имена
UPDATE bad_products SET name = 'Unknown Product' WHERE name = '' OR name IS NULL;

-- Шаг 2: Исправить отрицательные цены
UPDATE bad_products SET price = ABS(price) WHERE price < 0;

-- Шаг 3: Исправить отрицательный stock
UPDATE bad_products SET stock = 0 WHERE stock < 0;

-- Шаг 4: Исправить неправильные email
UPDATE bad_products SET email = NULL WHERE email !~ '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,};

-- Шаг 5: Теперь можно добавить constraints
ALTER TABLE bad_products ALTER COLUMN name SET NOT NULL;
ALTER TABLE bad_products ADD CHECK (LENGTH(name) > 0);
ALTER TABLE bad_products ADD CHECK (price > 0);
ALTER TABLE bad_products ADD CHECK (stock >= 0);
ALTER TABLE bad_products ADD CHECK (email IS NULL OR email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,});
```

---

## Контрольные вопросы

Проверьте себя:

1. Что такое constraints и зачем они нужны?
2. В чем разница между NOT NULL и DEFAULT?
3. Может ли UNIQUE столбец содержать NULL?
4. Сколько PRIMARY KEY может быть в таблице?
5. Что проверяет CHECK constraint?
6. Можно ли использовать подзапросы в CHECK?
7. Как добавить NOT NULL к существующему столбцу?
8. Зачем давать имена constraints?
9. Что такое составной UNIQUE constraint?
10. Можно ли временно отключить constraint?
11. В чем разница между UNIQUE и PRIMARY KEY?
12. Как посмотреть все constraints таблицы?

<details>
<summary>Ответы</summary>

1. Constraints — правила для обеспечения корректности данных на уровне БД.
2. NOT NULL требует значение, DEFAULT предоставляет значение если не указано.
3. Да, UNIQUE разрешает несколько NULL (NULL считается уникальным).
4. Только один PRIMARY KEY на таблицу.
5. CHECK проверяет, что значение удовлетворяет условию.
6. Нет, подзапросы в CHECK не поддерживаются (нужны триггеры).
7. ALTER TABLE table ALTER COLUMN column SET NOT NULL.
8. Для легкой идентификации, удаления и документирования.
9. UNIQUE на комбинацию нескольких столбцов.
10. Да, через DISABLE/ENABLE CONSTRAINT (осторожно!).
11. UNIQUE может быть много и разрешает NULL, PRIMARY KEY один и NOT NULL.
12. \d table_name в psql или запрос к pg_constraint.
</details>

---

## Типичные ошибки и их решения

### Ошибка 1: Добавление NOT NULL к столбцу с NULL

```sql
-- ❌ ОШИБКА: есть NULL значения
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
-- ERROR: column "phone" contains null values

-- ✅ РЕШЕНИЕ: сначала заполнить NULL
UPDATE users SET phone = 'N/A' WHERE phone IS NULL;
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
```

### Ошибка 2: Добавление UNIQUE к столбцу с дубликатами

```sql
-- ❌ ОШИБКА: есть дубликаты
ALTER TABLE products ADD UNIQUE (sku);
-- ERROR: could not create unique index

-- ✅ РЕШЕНИЕ: найти и исправить дубликаты
SELECT sku, COUNT(*) 
FROM products 
GROUP BY sku 
HAVING COUNT(*) > 1;

-- Исправить дубликаты (например, добавить суффикс)
UPDATE products 
SET sku = sku || '-' || id 
WHERE sku IN (SELECT sku FROM products GROUP BY sku HAVING COUNT(*) > 1);

-- Теперь можно добавить UNIQUE
ALTER TABLE products ADD UNIQUE (sku);
```

### Ошибка 3: Слишком строгий CHECK

```sql
-- ❌ ПЛОХО: слишком строгое условие
CREATE TABLE users (
    age INTEGER CHECK (age = 18)  -- Только 18 лет!
);

-- ✅ ХОРОШО: разумное условие
CREATE TABLE users (
    age INTEGER CHECK (age >= 18 AND age <= 150)
);
```

### Ошибка 4: CHECK с подзапросом

```sql
-- ❌ НЕ РАБОТАЕТ: подзапросы не поддерживаются
CREATE TABLE orders (
    product_id INTEGER,
    quantity INTEGER CHECK (
        quantity <= (SELECT stock FROM products WHERE id = product_id)
    )
);

-- ✅ РЕШЕНИЕ: использовать триггер (тема следующих недель)
-- Или проверять в приложении
```

### Ошибка 5: Забыли про NULL в UNIQUE

```sql
CREATE TABLE users (
    email VARCHAR(100) UNIQUE  -- NULL разрешен!
);

-- Можно вставить много NULL
INSERT INTO users (email) VALUES (NULL), (NULL), (NULL);
-- ✅ Работает!

-- Если NULL нежелателен:
CREATE TABLE users (
    email VARCHAR(100) UNIQUE NOT NULL
);
```

---

## Шпаргалка по Constraints

```sql
-- NOT NULL
column_name TYPE NOT NULL

-- UNIQUE
column_name TYPE UNIQUE
UNIQUE(column1, column2)  -- Составной

-- PRIMARY KEY
column_name SERIAL PRIMARY KEY
PRIMARY KEY(column1, column2)  -- Составной

-- FOREIGN KEY
column_name TYPE REFERENCES other_table(column)
FOREIGN KEY (column) REFERENCES other_table(column)

-- CHECK
column_name TYPE CHECK (condition)
CHECK (condition with multiple columns)

-- DEFAULT
column_name TYPE DEFAULT value
column_name TYPE DEFAULT function()

-- Именованные constraints
CONSTRAINT constraint_name TYPE

-- Добавление к существующей таблице
ALTER TABLE table ADD CONSTRAINT name TYPE;
ALTER TABLE table ALTER COLUMN col SET NOT NULL;
ALTER TABLE table ALTER COLUMN col SET DEFAULT value;

-- Удаление
ALTER TABLE table DROP CONSTRAINT name;
ALTER TABLE table ALTER COLUMN col DROP NOT NULL;
ALTER TABLE table ALTER COLUMN col DROP DEFAULT;

-- Управление
ALTER TABLE table DISABLE CONSTRAINT name;
ALTER TABLE table ENABLE CONSTRAINT name;
```

---

## Лучшие практики

### 1. Всегда используйте NOT NULL для важных полей

```sql
-- ✅ ХОРОШО
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL
);

-- ❌ ПЛОХО (критичные поля могут быть NULL)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100)
);
```

### 2. Давайте понятные имена constraints

```sql
-- ✅ ХОРОШО
CONSTRAINT users_email_unique UNIQUE (email)
CONSTRAINT orders_total_positive CHECK (total > 0)
CONSTRAINT products_category_fk FOREIGN KEY (category_id) REFERENCES categories(id)

-- ❌ ПЛОХО
CONSTRAINT c1 UNIQUE (email)
CONSTRAINT chk CHECK (total > 0)
```

### 3. Используйте CHECK для бизнес-правил

```sql
CREATE TABLE products (
    price DECIMAL(10, 2) CHECK (price > 0),
    discount_price DECIMAL(10, 2),
    CHECK (discount_price IS NULL OR discount_price < price)
);
```

### 4. Комбинируйте constraints для надежности

```sql
CREATE TABLE users (
    email VARCHAR(100) NOT NULL UNIQUE 
        CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})
);
```

### 5. Документируйте сложные constraints

```sql
CREATE TABLE bookings (
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    -- Дата выезда должна быть позже даты заезда
    CONSTRAINT bookings_dates_valid CHECK (check_out > check_in),
    -- Бронирование не может быть длиннее года
    CONSTRAINT bookings_duration CHECK (check_out - check_in <= 365)
);
```

---

## Полезные ресурсы

**Документация:**
- https://www.postgresql.org/docs/current/ddl-constraints.html
- https://www.postgresql.org/docs/current/sql-altertable.html

**Инструменты:**
- pgAdmin — визуальный просмотр constraints
- DBeaver — редактирование constraints через GUI

**Практика:**
- Попробуйте спроектировать БД с максимальным количеством constraints
- Изучите схемы популярных приложений
