---
sidebar_position: 3
title: "SQL основы"
description: "В этой главе мы рассмотрим основы SQL, включая операции определения данных (DDL) и манипулирования данными (DML), создание таблиц и установку связей между ними."
---

# SQL основы: DDL и DML операции, создание таблиц и связей

## Введение

**SQL *(Structured Query Language)*** — язык структурированных запросов для работы с реляционными базами данных. В этом уроке мы подробно изучим основы SQL в контексте PostgreSQL, разберем операции определения данных (DDL) и манипулирования данными (DML), научимся создавать таблицы и устанавливать связи между ними.

## Категории SQL команд

SQL команды делятся на несколько категорий:

| Категория | Описание | Основные команды |
|-----------|----------|------------------|
| **DDL** (Data Definition Language) | Определение структуры данных | CREATE, ALTER, DROP, TRUNCATE |
| **DML** (Data Manipulation Language) | Манипулирование данными | SELECT, INSERT, UPDATE, DELETE |
| **DCL** (Data Control Language) | Управление доступом | GRANT, REVOKE |
| **TCL** (Transaction Control Language) | Управление транзакциями | BEGIN, COMMIT, ROLLBACK, SAVEPOINT |

В этом уроке мы сосредоточимся на **DDL** и **DML**.

## DDL: Язык определения данных

### CREATE⠀DATABASE — Создание базы данных

```sql
-- Простое создание базы данных
CREATE DATABASE mydb;

-- С указанием владельца
CREATE DATABASE mydb OWNER myuser;

-- С полными параметрами
CREATE DATABASE sales_db
    WITH 
    OWNER = sales_admin         -- OWNER: Это владелец базы данных
    ENCODING = 'UTF8'           -- ENCODING: Кодировка базы данных
    LC_COLLATE = 'ru_RU.UTF-8'  -- LC_COLLATE: Способ сортировки и сравнения строк
    LC_CTYPE = 'ru_RU.UTF-8'    -- LC_CTYPE: Определение типа символов
    TABLESPACE = pg_default     -- TABLESPACE: Определение места хранения файлов базы данных
    CONNECTION LIMIT = 100      -- CONNECTION LIMIT: Максимальное количество подключений к базе данных
    IS_TEMPLATE = False;        -- IS_TEMPLATE: Флаг, указывающий, является ли база данных шаблоном

-- С комментарием
COMMENT ON DATABASE sales_db IS 'База данных отдела продаж';

-- Проверка создания
\l  -- или
SELECT datname FROM pg_database WHERE datname = 'sales_db';
```

:::tip Кодировка
Всегда используйте UTF8 кодировку для поддержки международных символов. Это стандарт де-факто для современных приложений.
:::

### CREATE⠀TABLE — Создание таблиц

#### Базовый синтаксис

```sql
CREATE TABLE table_name (
    column1 datatype [constraint],
    column2 datatype [constraint],
    ...
    [table_constraint]
);
```

#### Простой пример

```sql
-- Создание таблицы пользователей
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Просмотр структуры
\d users
```

#### Типы данных в деталях

```sql
-- Числовые типы
CREATE TABLE numeric_examples (
    -- Целые числа
    tiny_int SMALLINT,              -- -32768 до 32767
    normal_int INTEGER,             -- -2147483648 до 2147483647
    big_int BIGINT,                 -- очень большие числа
    
    -- Автоинкремент
    id SERIAL,                      -- INTEGER с auto-increment
    big_id BIGSERIAL,               -- BIGINT с auto-increment
    
    -- Десятичные
    price NUMERIC(10, 2),           -- точные вычисления (10 цифр, 2 после запятой)
    percentage NUMERIC(5, 2),       -- 999.99
    
    -- Плавающая точка
    scientific REAL,                -- 6 знаков точности
    precise DOUBLE PRECISION,       -- 15 знаков точности
    
    -- Денежный тип
    amount MONEY                    -- зависит от локали
);

-- Строковые типы
CREATE TABLE string_examples (
    fixed_length CHAR(10),          -- точно 10 символов
    var_length VARCHAR(100),        -- до 100 символов
    unlimited TEXT,                 -- без ограничений
    
    -- Специальные строковые типы
    name NAME,                      -- имена объектов БД (63 символа)
    
    -- Бинарные данные
    binary_data BYTEA               -- бинарные данные
);

-- Временные типы
CREATE TABLE datetime_examples (
    -- Дата и время
    date_only DATE,                             -- только дата
    time_only TIME,                             -- только время
    time_with_tz TIME WITH TIME ZONE,           -- время с часовым поясом
    
    timestamp_val TIMESTAMP,                    -- дата и время
    timestamp_tz TIMESTAMPTZ,                   -- с часовым поясом (рекомендуется)
    
    -- Интервалы
    duration INTERVAL                           -- временной интервал
);

-- Логические типы
CREATE TABLE boolean_examples (
    is_active BOOLEAN,              -- TRUE/FALSE/NULL
    flag BOOL                       -- алиас для BOOLEAN
);

-- Специальные типы
CREATE TABLE special_types (
    -- UUID
    unique_id UUID DEFAULT gen_random_uuid(),
    
    -- JSON
    metadata JSON,                  -- JSON (текст)
    settings JSONB,                 -- JSON Binary (индексируемый)
    
    -- Массивы
    tags TEXT[],                    -- массив строк
    numbers INTEGER[],              -- массив чисел
    matrix INTEGER[][],             -- многомерный массив
    
    -- Диапазоны
    age_range INT4RANGE,            -- диапазон целых чисел
    price_range NUMRANGE,           -- диапазон NUMERIC
    date_range DATERANGE,           -- диапазон дат
    
    -- Геометрические типы
    location POINT,                 -- точка (x, y)
    area BOX,                       -- прямоугольник
    path_data PATH,                 -- путь
    
    -- Сетевые адреса
    ip_address INET,                -- IPv4 или IPv6
    mac_address MACADDR,            -- MAC адрес
    
    -- XML
    xml_data XML                    -- XML документ
);
```

#### Ограничения (Constraints)

**Constraints** — это правила, которые ограничивают, какие данные можно записывать в таблицу, чтобы обеспечить целостность и корректность данных.

```sql
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    
    -- NOT NULL — обязательное поле
    name VARCHAR(200) NOT NULL,
    
    -- UNIQUE — уникальное значение
    sku VARCHAR(50) NOT NULL UNIQUE,
    
    -- CHECK — проверка условия
    price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    discount_price NUMERIC(10, 2) CHECK (discount_price IS NULL OR discount_price < price),
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    
    -- DEFAULT — значение по умолчанию
    status VARCHAR(20) DEFAULT 'active',
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Множественные проверки
    weight NUMERIC(10, 2),
    CHECK (weight > 0 AND weight < 1000),
    
    -- Именованные ограничения
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'discontinued')),
    CONSTRAINT price_logic CHECK (discount_price IS NULL OR discount_price >= price * 0.5)
);

-- Добавление ограничения после создания таблицы
ALTER TABLE products
ADD CONSTRAINT unique_name UNIQUE (name);

-- Удаление ограничения
ALTER TABLE products
DROP CONSTRAINT unique_name;
```

#### Где лучше делать ограничения

**Лучший подход:** **И в приложении, и в базе данных**, но с чётким разделением ответственности.

| Что проверять                  | Где лучше делать                  | Почему именно там                              | Важность |
|-------------------------------|------------------------------------|--------------------------------------------------|----------|
| NOT NULL                      | Только в базе                     | Защищает от прямых INSERT/UPDATE, скриптов, админ-доступа | ★★★★★    |
| PRIMARY KEY / UNIQUE          | Только в базе                     | Гарантия уникальности даже при массовой загрузке | ★★★★★    |
| FOREIGN KEY                   | Только в базе                     | Самая надёжная защита ссылочной целостности      | ★★★★★    |
| Простые бизнес-правила        | И в базе, и в приложении          | База — последняя линия обороны, приложение — быстрый UX | ★★★★     |
| Сложная бизнес-логика         | В основном в приложении           | Много таблиц, внешние системы, права доступа     | ★★★      |
| Формат email, телефон, ИНН    | В приложении + лёгкий CHECK в базе| Хороший UX + минимальная защита                  | ★★★      |
| Мягкие/рекомендательные правила| Только в приложении               | Не должны блокировать сохранение в принципе      | ★★       |
| Проверки, зависящие от времени/курса/погоды | Только приложение              | База не должна этого знать                       | ★        |

:::info
**UX *(User Experience)*** - Пользовательский опыт, который пользователь ощущает при использовании продукта или сервиса.
:::

**Практическое правило 80/20:**

- Всё, что **обязательно должно быть всегда верно** → **база** (NOT NULL, PK, FK, UNIQUE, простые CHECK)
- Всё, что важно **для пользователя и бизнес-процесса** → **приложение** (в первую очередь) + желательно дублирующий лёгкий CHECK в базе
- Всё остальное (форматирование, рекомендации, сложные правила) → только приложение

:::warning Важно 
В современных приложениях большинство проверок (особенно бизнес-правил) лучше делать в первую очередь на уровне приложения, потому что это даёт мгновенную обратную связь пользователю (50–400 мс вместо 1–3 секунд), позволяет показывать понятные и дружелюбные сообщения об ошибках вместо технических «constraint violation», легко реализует сложную логику с учётом контекста (роль, регион, время, внешние сервисы), быстро меняется без миграций базы, хорошо тестируется и масштабируется, а база при этом остаётся последней нерушимой линией обороны — там должны жить только самые критические и простые ограничения (NOT NULL, PK, FK, UNIQUE и базовые CHECK), чтобы гарантировать целостность данных даже при прямом доступе к БД, массовой загрузке или баге в приложении!
:::

### Первичные ключи (Primary Keys)

**PRIMARY KEY *(Первичный ключ)*** — это один или несколько столбцов в таблице, которые уникально идентифицируют каждую строку (обязательно уникальны и не могут быть NULL), обычно это id с типом SERIAL/BIGSERIAL; он служит главным способом ссылаться на конкретную запись и ускоряет поиск по ней.

```sql
-- Простой первичный ключ
CREATE TABLE departments (
    dept_id SERIAL PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL
);

-- Именованный первичный ключ
CREATE TABLE employees (
    emp_id INTEGER,
    emp_name VARCHAR(100),
    CONSTRAINT pk_employees PRIMARY KEY (emp_id)
);

-- Составной первичный ключ
CREATE TABLE course_enrollments (
    student_id INTEGER,
    course_id INTEGER,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY (student_id, course_id)
);

-- Первичный ключ на основе UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Внешние ключи (Foreign Keys)

**FOREIGN KEY *(Внешний ключ)*** — это столбец (или набор столбцов) в одной таблице, который ссылается на первичный ключ другой таблицы, создавая связь между ними и гарантируя ссылочную целостность: вы не сможете добавить запись с несуществующим значением внешнего ключа, а при удалении/изменении родительской записи можно настроить каскадные действия (например, CASCADE, SET NULL или RESTRICT), чтобы зависимые данные не остались «висящими» в воздухе.


```sql
-- Создание таблиц с внешними ключами
CREATE TABLE authors (
    author_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bio TEXT,
    birth_date DATE
);

CREATE TABLE books (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author_id INTEGER NOT NULL,
    isbn VARCHAR(13) UNIQUE,
    published_year INTEGER,
    
    -- Внешний ключ
    FOREIGN KEY (author_id) REFERENCES authors(author_id)
);

-- С именованным ограничением и каскадными операциями
CREATE TABLE book_reviews (
    review_id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL,
    reviewer_name VARCHAR(100),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_book
        FOREIGN KEY (book_id) 
        REFERENCES books(book_id)
        ON DELETE CASCADE           -- При удалении книги удалить отзывы
        ON UPDATE CASCADE           -- При обновлении ID книги обновить здесь
);

-- Варианты действий при удалении/обновлении
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    product_id INTEGER,
    
    -- NO ACTION (по умолчанию) - запретить удаление/обновление
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE NO ACTION,
    
    -- RESTRICT - то же что NO ACTION (проверка сразу)
    FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON DELETE RESTRICT,
    
    -- CASCADE - каскадное удаление/обновление
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        ON DELETE CASCADE,
    
    -- SET NULL - установить NULL
    FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON DELETE SET NULL,
    
    -- SET DEFAULT - установить значение по умолчанию
    FOREIGN KEY (product_id) REFERENCES products(product_id)
        ON DELETE SET DEFAULT
);
```

:::info
**Каскадные операции *(CASCADE)*** — это автоматические действия, которые база данных выполняет с зависимыми записями при изменении или удалении записи в родительской таблице.1
:::

#### Пример связей один-ко-многим

```sql
-- Один автор -> много книг
CREATE TABLE authors (
    author_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE books (
    book_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author_id INTEGER REFERENCES authors(author_id) ON DELETE CASCADE
);

-- Вставка данных
INSERT INTO authors (name) VALUES ('Лев Толстой');
INSERT INTO books (title, author_id) VALUES ('Война и мир', 1);
INSERT INTO books (title, author_id) VALUES ('Анна Каренина', 1);

-- Попытка вставить книгу с несуществующим автором
INSERT INTO books (title, author_id) VALUES ('Книга', 999);
-- ERROR: insert or update on table "books" violates foreign key constraint
```

#### Пример связей многие-ко-многим

```sql
-- Студенты и курсы (многие-ко-многим)
CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE
);

CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL,
    credits INTEGER
);

-- Связующая таблица (junction table)
CREATE TABLE student_courses (
    student_id INTEGER REFERENCES students(student_id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(course_id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    grade VARCHAR(2),
    PRIMARY KEY (student_id, course_id)
);

-- Вставка данных
INSERT INTO students (name, email) VALUES ('Иван Петров', 'ivan@example.com');
INSERT INTO students (name, email) VALUES ('Мария Сидорова', 'maria@example.com');

INSERT INTO courses (course_name, credits) VALUES ('Базы данных', 3);
INSERT INTO courses (course_name, credits) VALUES ('Программирование', 4);

INSERT INTO student_courses (student_id, course_id, grade) VALUES (1, 1, 'A');
INSERT INTO student_courses (student_id, course_id, grade) VALUES (1, 2, 'B');
INSERT INTO student_courses (student_id, course_id, grade) VALUES (2, 1, 'A');

-- Запрос: какие курсы посещает студент
SELECT c.course_name, sc.grade
FROM student_courses sc
JOIN courses c ON sc.course_id = c.course_id
WHERE sc.student_id = 1;

-- Запрос: какие студенты на курсе
SELECT s.name, sc.grade
FROM student_courses sc
JOIN students s ON sc.student_id = s.student_id
WHERE sc.course_id = 1;
```

### ALTER⠀TABLE — Изменение структуры таблицы

```sql
-- Добавление колонки
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN age INTEGER CHECK (age >= 0);

-- Добавление колонки со значением по умолчанию
ALTER TABLE users ADD COLUMN country VARCHAR(50) DEFAULT 'Russia';

-- Удаление колонки
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users DROP COLUMN phone CASCADE;  -- Удалить даже если есть зависимости

-- Переименование колонки
ALTER TABLE users RENAME COLUMN age TO user_age;

-- Изменение типа данных
ALTER TABLE users ALTER COLUMN username TYPE VARCHAR(100);

-- Изменение типа с преобразованием
ALTER TABLE users ALTER COLUMN user_age TYPE VARCHAR(10) USING user_age::VARCHAR;

-- Установка NOT NULL
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- Удаление NOT NULL
ALTER TABLE users ALTER COLUMN first_name DROP NOT NULL;

-- Установка значения по умолчанию
ALTER TABLE users ALTER COLUMN is_active SET DEFAULT TRUE;

-- Удаление значения по умолчанию
ALTER TABLE users ALTER COLUMN is_active DROP DEFAULT;

-- Добавление ограничения
ALTER TABLE users ADD CONSTRAINT check_username_length 
    CHECK (LENGTH(username) >= 3);

-- Удаление ограничения
ALTER TABLE users DROP CONSTRAINT check_username_length;

-- Переименование таблицы
ALTER TABLE users RENAME TO app_users;

-- Изменение владельца таблицы
ALTER TABLE app_users OWNER TO new_owner;

-- Изменение схемы таблицы
ALTER TABLE app_users SET SCHEMA new_schema;
```

#### Пример полной модификации таблицы

```sql
-- Исходная таблица
CREATE TABLE old_products (
    id INTEGER,
    name TEXT,
    price INTEGER
);

-- Множественные изменения
ALTER TABLE old_products
    RENAME TO products;

ALTER TABLE products
    ALTER COLUMN id TYPE BIGINT,
    ALTER COLUMN id SET NOT NULL,
    ADD PRIMARY KEY (id);

ALTER TABLE products
    ALTER COLUMN name TYPE VARCHAR(200),
    ALTER COLUMN name SET NOT NULL;

ALTER TABLE products
    ALTER COLUMN price TYPE NUMERIC(10, 2),
    ALTER COLUMN price SET NOT NULL,
    ADD CONSTRAINT check_price CHECK (price > 0);

ALTER TABLE products
    ADD COLUMN sku VARCHAR(50) UNIQUE,
    ADD COLUMN stock INTEGER DEFAULT 0,
    ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
```

### DROP — Удаление объектов

```sql
-- Удаление таблицы
DROP TABLE products;

-- С проверкой существования
DROP TABLE IF EXISTS products;

-- Каскадное удаление (удалит все зависимые объекты)
DROP TABLE products CASCADE;

-- Удаление нескольких таблиц
DROP TABLE products, orders, customers;

-- Удаление базы данных
DROP DATABASE IF EXISTS old_db;

-- Принудительное удаление БД с активными подключениями
DROP DATABASE old_db WITH (FORCE);
```

### TRUNCATE — Очистка таблицы

```sql
-- Удалить все данные из таблицы (быстрее, чем DELETE)
TRUNCATE TABLE logs;

-- С перезапуском SERIAL последовательности
TRUNCATE TABLE logs RESTART IDENTITY;

-- Каскадная очистка (очистить связанные таблицы)
TRUNCATE TABLE orders CASCADE;

-- Очистка нескольких таблиц
TRUNCATE TABLE logs, sessions, temp_data;
```

:::warning TRUNCATE vs DELETE
`TRUNCATE` быстрее, чем `DELETE`, но:
- Не может использовать WHERE
- Не срабатывают триггеры FOR EACH ROW
- Нельзя откатить в некоторых случаях
- Блокирует всю таблицу
:::

### CREATE⠀INDEX — Создание индексов

**Индексы** — это структуры данных, которые значительно ускоряют поиск (SELECT), сортировку, соединения (JOIN) и проверки уникальности, но при этом замедляют операции записи (INSERT/UPDATE/DELETE) и занимают дополнительное место на диске.

#### Основные виды индексов в PostgreSQL

| Тип индекса          | Структура данных      | Подходит для каких условий                          | Ускоряет                          | Поддерживает ORDER BY | Уникальность | Размер на диске | Самый частый случай использования          |
|----------------------|-----------------------|-----------------------------------------------------|-----------------------------------|-----------------------|--------------|------------------|--------------------------------------------|
| **B-tree**           | B-дерево             | &gt;, &lt;, ≥, ≤, =, BETWEEN, IN, IS NULL                | Обычные запросы, диапазоны        | Да                    | Да           | Средний          | 90%+ всех индексов в реальных проектах     |
| **GiST**             | R-дерево / обобщённое| Геометрия, полнотекстовый поиск, массивы, диапазоны| Сложные пространственные условия  | Частично              | Нет          | Большой          | PostGIS, поиск по массивам, tstzrange      |
| **GIN**              | Инвертированный список| Массивы, JSONB, полнотекст (tsvector), hstore       | @&gt;, &lt;@, &&, ?|, ?&, EXISTS         | Нет                   | Нет          | Очень большой    | JSONB, массивы, полнотекстовый поиск       |
| **BRIN**             | Блочный диапазон     | Очень большие таблицы + данные физически отсортированы | Диапазонные запросы на больших таблицах | Да (если порядок физический) | Нет     | Очень маленький  | Логи, таймсерии, большие append-only таблицы |
| **Hash**             | Хеш-таблица          | Только строгое равенство (=)                        | Только = (редко быстрее B-tree)   | Нет                   | Да           | Средний          | Почти никогда не используют в 2024–2026    |
| **SP-GiST**          | Пространственно-разделённое | Неравномерные геоданные, кластеризованные точки   | Геометрия с неравномерным распределением | Частично         | Нет          | Средний–большой  | Специфические задачи PostGIS               |
| **Bloom**            | Фильтр Блума         | Множество столбцов с равенством (очень много полей) | Много условий AND в WHERE          | Нет                   | Нет          | Маленький        | Редко, для очень широких фильтров          |

```sql
-- Простой индекс
CREATE INDEX idx_users_email ON users(email);

-- Уникальный индекс
CREATE UNIQUE INDEX idx_users_username ON users(username);

-- Составной индекс
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);

-- Частичный индекс (только для активных пользователей)
CREATE INDEX idx_active_users ON users(email) WHERE is_active = TRUE;

-- Индекс с сортировкой
CREATE INDEX idx_products_price_desc ON products(price DESC);

-- Функциональный индекс
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- Индекс для полнотекстового поиска
CREATE INDEX idx_products_search ON products USING GIN(to_tsvector('russian', name));

-- Различные типы индексов
CREATE INDEX idx_btree ON users USING BTREE (username);        -- По умолчанию
CREATE INDEX idx_hash ON users USING HASH (email);             -- Только для =
CREATE INDEX idx_gin ON products USING GIN (tags);             -- Для массивов, JSON
CREATE INDEX idx_gist ON locations USING GIST (coordinates);   -- Для геометрии
CREATE INDEX idx_brin ON logs USING BRIN (created_at);         -- Для больших последовательных данных

-- Конкурентное создание индекса (не блокирует таблицу)
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status);

-- Удаление индекса
DROP INDEX idx_users_email;
DROP INDEX CONCURRENTLY idx_orders_status;
```

:::info Краткое правило выбора
Если не знаешь какой индекс нужен → делай обычный B-tree <br />
Если таблица огромная и данные идут по времени → подумай про BRIN <br />
Если работаешь с массивами/JSONB/полнотекстовым поиском → GIN <br />
Если геометрия → GiST <br />
Если нужно очень быстро и данные физически отсортированы → BRIN
:::

## DML: Язык манипулирования данными

### INSERT — Вставка данных

#### Базовый синтаксис

```sql
-- Вставка одной строки
INSERT INTO users (username, email, first_name, last_name)
VALUES ('john_doe', 'john@example.com', 'John', 'Doe');

-- Вставка с автоматическим ID
INSERT INTO users (username, email)
VALUES ('jane_smith', 'jane@example.com');

-- Вставка нескольких строк
INSERT INTO users (username, email, first_name, last_name) VALUES
    ('alice', 'alice@example.com', 'Alice', 'Brown'),
    ('bob', 'bob@example.com', 'Bob', 'Wilson'),
    ('charlie', 'charlie@example.com', 'Charlie', 'Davis');

-- Вставка всех колонок (не рекомендуется)
INSERT INTO users VALUES 
    (DEFAULT, 'david', 'david@example.com', 'hash', 'David', 'Miller', TRUE, NOW(), NOW());
```

#### Вставка с подзапросом

```sql
-- Копирование данных из другой таблицы
INSERT INTO active_users (user_id, username, email)
SELECT user_id, username, email 
FROM users 
WHERE is_active = TRUE;

-- Вставка результатов вычислений
INSERT INTO user_statistics (user_id, total_orders, last_order_date)
SELECT 
    customer_id,
    COUNT(*),
    MAX(order_date)
FROM orders
GROUP BY customer_id;
```

#### RETURNING — Возврат вставленных данных

```sql
-- Вернуть ID вставленной записи
INSERT INTO products (name, price)
VALUES ('Новый товар', 1999.99)
RETURNING product_id;

-- Вернуть все данные вставленной записи
INSERT INTO users (username, email)
VALUES ('new_user', 'new@example.com')
RETURNING *;

-- Вернуть вычисленные значения
INSERT INTO orders (customer_id, total_amount)
VALUES (1, 5000.00)
RETURNING order_id, total_amount * 1.2 AS with_tax, created_at;

-- Множественная вставка с RETURNING
INSERT INTO products (name, price) VALUES
    ('Товар 1', 100),
    ('Товар 2', 200),
    ('Товар 3', 300)
RETURNING product_id, name, price;
```

#### ON CONFLICT — Обработка конфликтов (UPSERT)

```sql
-- Игнорировать конфликт
INSERT INTO users (username, email)
VALUES ('existing_user', 'existing@example.com')
ON CONFLICT (username) DO NOTHING;

-- Обновить при конфликте
INSERT INTO products (sku, name, price)
VALUES ('SKU123', 'Product', 100.00)
ON CONFLICT (sku) 
DO UPDATE SET 
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    updated_at = NOW();

-- Условное обновление
INSERT INTO inventory (product_id, quantity)
VALUES (1, 100)
ON CONFLICT (product_id)
DO UPDATE SET 
    quantity = inventory.quantity + EXCLUDED.quantity
WHERE inventory.quantity < 1000;

-- С RETURNING
INSERT INTO settings (key, value)
VALUES ('theme', 'dark')
ON CONFLICT (key)
DO UPDATE SET value = EXCLUDED.value
RETURNING *;
```

### SELECT — Выборка данных

#### Базовая выборка

```sql
-- Выбрать все столбцы
SELECT * FROM users;

-- Выбрать конкретные столбцы
SELECT user_id, username, email FROM users;

-- С алиасами
SELECT 
    user_id AS id,
    username AS login,
    email AS "E-mail"  -- Кавычки для сохранения регистра
FROM users;

-- DISTINCT — уникальные значения
SELECT DISTINCT country FROM users;

-- DISTINCT ON — первая строка для каждого значения
SELECT DISTINCT ON (country) country, city, username
FROM users
ORDER BY country, created_at DESC;
```

#### WHERE — Фильтрация

```sql
-- Простые условия
SELECT * FROM products WHERE price > 1000;
SELECT * FROM users WHERE is_active = TRUE;
SELECT * FROM products WHERE category = 'Electronics';

-- Логические операторы
SELECT * FROM products 
WHERE price > 1000 AND stock_quantity > 0;

SELECT * FROM users 
WHERE country = 'Russia' OR country = 'Belarus';

SELECT * FROM products 
WHERE NOT (price < 100 OR stock_quantity = 0);

-- Операторы сравнения
SELECT * FROM products WHERE price >= 1000 AND price <= 5000;
SELECT * FROM products WHERE price BETWEEN 1000 AND 5000;  -- То же самое

SELECT * FROM users WHERE country IN ('Russia', 'Belarus', 'Kazakhstan');
SELECT * FROM users WHERE username LIKE 'john%';  -- Начинается с 'john'
SELECT * FROM users WHERE email LIKE '%@gmail.com';  -- Заканчивается на '@gmail.com'
SELECT * FROM users WHERE username LIKE 'j_hn';  -- _ = один символ

-- ILIKE — регистронезависимый LIKE
SELECT * FROM users WHERE email ILIKE '%GMAIL.COM';

-- IS NULL / IS NOT NULL
SELECT * FROM users WHERE phone IS NULL;
SELECT * FROM products WHERE discount_price IS NOT NULL;

-- Регулярные выражения
SELECT * FROM users WHERE email ~ '^[a-z]+@gmail\.com$';
SELECT * FROM users WHERE email ~* 'GMAIL';  -- регистронезависимый

-- Работа с датами
SELECT * FROM orders WHERE order_date = '2024-01-08';
SELECT * FROM orders WHERE order_date >= '2024-01-01' AND order_date < '2024-02-01';
SELECT * FROM orders WHERE created_at > NOW() - INTERVAL '7 days';
```

#### ORDER BY — Сортировка

```sql
-- Сортировка по возрастанию
SELECT * FROM products ORDER BY price;
SELECT * FROM products ORDER BY price ASC;  -- Явно

-- Сортировка по убыванию
SELECT * FROM products ORDER BY price DESC;

-- Множественная сортировка
SELECT * FROM products 
ORDER BY category ASC, price DESC;

-- Сортировка с NULL
SELECT * FROM products ORDER BY discount_price NULLS FIRST;
SELECT * FROM products ORDER BY discount_price NULLS LAST;

-- Сортировка по вычисляемому полю
SELECT 
    name,
    price,
    stock_quantity,
    price * stock_quantity AS total_value
FROM products
ORDER BY total_value DESC;

-- Сортировка по позиции колонки
SELECT name, price FROM products ORDER BY 2 DESC;  -- По price (2-я колонка)
```

#### LIMIT и OFFSET — Пагинация

**Пагинация *(pagination)*** — это способ разделения большого количества данных (списка записей, постов, товаров, результатов поиска и т.д.) на небольшие страницы фиксированного размера (например, по 10, 20 или 50 элементов на страницу), чтобы не загружать пользователю сразу весь огромный объём данных, ускорить отображение, снизить нагрузку на сервер и базу данных и сделать навигацию удобной — пользователь переключается между страницами с помощью номеров (1, 2, 3…), кнопок «Дальше»/«Назад» или бесконечной прокрутки (infinite scroll), при этом сервер возвращает только нужный кусок данных, обычно используя параметры `LIMIT` (количество элементов) и `OFFSET` (смещение от начала) или более эффективные методы вроде cursor-based pagination (по последнему ID или токену).

```sql
-- Первые 10 записей
SELECT * FROM products LIMIT 10;

-- Записи с 11 по 20
SELECT * FROM products LIMIT 10 OFFSET 10;

-- Пагинация (страница 3, по 20 записей)
SELECT * FROM products 
ORDER BY product_id
LIMIT 20 OFFSET 40;  -- (страница - 1) * размер_страницы

-- С ORDER BY для консистентности
SELECT * FROM products
ORDER BY created_at DESC
LIMIT 10;
```

#### Агрегатные функции

**Агрегатные функции** — это специальные функции, которые выполняют вычисление над набором строк и возвращают одно единственное значение: 
- `SUM()` суммирует все значения в столбце
- `COUNT()` считает количество строк (или не-NULL значений)
- `AVG()` вычисляет среднее арифметическое
- `MAX()` и `MIN()` находят максимальное и минимальное значение
- `STRING_AGG()` для объединения строк в одну с разделителем, `ARRAY_AGG()` для сбора значений в массив и другие

Они обычно используются вместе с `GROUP BY`, чтобы посчитать итоги по каждой группе (например, сумму продаж по каждому клиенту), либо без `GROUP BY` — для получения общего итога по всей таблице. При этом агрегатные функции игнорируют **NULL**-значения (кроме `COUNT(*)`) и работают только после фильтрации `WHERE`, но до сортировки `ORDER BY`.

```sql
-- COUNT — подсчет
SELECT COUNT(*) FROM users;
SELECT COUNT(phone) FROM users;  -- Только NOT NULL
SELECT COUNT(DISTINCT country) FROM users;

-- SUM — сумма
SELECT SUM(price) FROM products;
SELECT SUM(quantity * price) FROM order_items;

-- AVG — среднее
SELECT AVG(price) FROM products;
SELECT AVG(rating) FROM reviews;

-- MIN / MAX — минимум/максимум
SELECT MIN(price), MAX(price) FROM products;

-- Несколько агрегатов
SELECT 
    COUNT(*) AS total_products,
    SUM(stock_quantity) AS total_stock,
    AVG(price) AS avg_price,
    MIN(price) AS min_price,
    MAX(price) AS max_price
FROM products;
```

#### GROUP BY — Группировка

**GROUP BY** — это оператор, который группирует строки таблицы по одинаковым значениям в одном или нескольких столбцах, позволяя применять к каждой такой группе агрегатные функции (SUM, COUNT, AVG, MAX, MIN и т.д.) и получать по одной итоговой строке на каждую уникальную комбинацию значений в группирующих столбцах; например, `SELECT city, COUNT(*) FROM users GROUP BY city` покажет количество пользователей в каждом городе, при этом все неагрегированные столбцы в `SELECT` должны либо входить в `GROUP BY`, либо быть внутри агрегатной функции, иначе запрос выдаст ошибку — это ключевое правило, которое обеспечивает корректность результата.

```sql
-- Количество пользователей по странам
SELECT country, COUNT(*) AS user_count
FROM users
GROUP BY country
ORDER BY user_count DESC;

-- Средняя цена по категориям
SELECT 
    category,
    AVG(price) AS avg_price,
    COUNT(*) AS product_count
FROM products
GROUP BY category;

-- Группировка по нескольким колонкам
SELECT 
    category,
    EXTRACT(YEAR FROM created_at) AS year,
    COUNT(*) AS count
FROM products
GROUP BY category, EXTRACT(YEAR FROM created_at)
ORDER BY category, year;

-- С вычисляемым полем
SELECT 
    DATE_TRUNC('month', created_at) AS month,
    COUNT(*) AS orders_count,
    SUM(total_amount) AS total_revenue
FROM orders
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;
```

#### HAVING — Фильтрация после группировки

**HAVING** — это аналог `WHERE`, но применяется уже **после** группировки (`GROUP BY`) и вычисления агрегатных функций; он фильтрует не отдельные строки, а целые группы, позволяя оставить только те группы, которые удовлетворяют условию по результатам агрегации — например, `SELECT city, COUNT(*) FROM users GROUP BY city HAVING COUNT(*) > 100` покажет только города, в которых больше 100 пользователей; основное правило: `WHERE` фильтрует строки **до** группировки и не может использовать агрегатные функции, а `HAVING` фильтрует **группы после** группировки и именно для этого предназначен, поэтому условия с `COUNT`, `SUM`, `AVG` и т.п. пишутся именно в `HAVING`.

```sql
-- Категории с более чем 10 товарами
SELECT category, COUNT(*) AS count
FROM products
GROUP BY category
HAVING COUNT(*) > 10;

-- Клиенты с суммой заказов > 10000
SELECT 
    customer_id,
    SUM(total_amount) AS total_spent
FROM orders
GROUP BY customer_id
HAVING SUM(total_amount) > 10000
ORDER BY total_spent DESC;

-- WHERE и HAVING вместе
SELECT 
    category,
    AVG(price) AS avg_price
FROM products
WHERE is_active = TRUE  -- Фильтр ДО группировки
GROUP BY category
HAVING AVG(price) > 1000  -- Фильтр ПОСЛЕ группировки
ORDER BY avg_price DESC;
```

### UPDATE — Обновление данных

```sql
-- Обновление одного поля
UPDATE users 
SET email = 'newemail@example.com'
WHERE user_id = 1;

-- Обновление нескольких полей
UPDATE products 
SET 
    price = 1999.99,
    stock_quantity = 100,
    updated_at = NOW()
WHERE product_id = 5;

-- Обновление всех записей (осторожно!)
UPDATE products 
SET is_active = TRUE;

-- Обновление с вычислением
UPDATE products 
SET price = price * 1.1  -- Увеличить цену на 10%
WHERE category = 'Electronics';

-- Обновление с подзапросом
UPDATE orders 
SET customer_name = (
    SELECT name FROM customers WHERE customers.id = orders.customer_id
)
WHERE customer_name IS NULL;

-- Обновление на основе JOIN (PostgreSQL синтакс
-- Обновление на основе JOIN (PostgreSQL синтаксис)
UPDATE orders o
SET total_amount = oi.sum_amount
FROM (
    SELECT order_id, SUM(quantity * price) AS sum_amount
    FROM order_items
    GROUP BY order_id
) oi
WHERE o.order_id = oi.order_id;

-- UPDATE с RETURNING
UPDATE products 
SET price = price * 0.9
WHERE category = 'Clearance'
RETURNING product_id, name, price AS new_price;

-- Условное обновление
UPDATE users
SET 
    status = CASE 
        WHEN last_login < NOW() - INTERVAL '1 year' THEN 'inactive'
        WHEN last_login < NOW() - INTERVAL '30 days' THEN 'dormant'
        ELSE 'active'
    END
WHERE status != 'deleted';
```

:::warning Важно
Всегда используйте `WHERE` при `UPDATE!` Без `WHERE` обновятся ВСЕ записи в таблице. Рекомендуется сначала выполнить `SELECT` с тем же `WHERE`, чтобы проверить, какие записи будут затронуты.
:::

### DELETE — Удаление данных

```sql
-- Удаление одной записи
DELETE FROM users WHERE user_id = 1;

-- Удаление по условию
DELETE FROM logs WHERE created_at < NOW() - INTERVAL '30 days';

-- Удаление всех записей (осторожно!)
DELETE FROM temp_table;

-- Удаление с подзапросом
DELETE FROM orders 
WHERE customer_id IN (
    SELECT customer_id FROM customers WHERE status = 'deleted'
);

-- Удаление с JOIN
DELETE FROM order_items
USING orders
WHERE order_items.order_id = orders.order_id
  AND orders.status = 'cancelled';

-- DELETE с RETURNING
DELETE FROM sessions 
WHERE expires_at < NOW()
RETURNING session_id, user_id;

-- Удаление дубликатов (оставить только одну запись)
DELETE FROM products p1
USING products p2
WHERE p1.sku = p2.sku 
  AND p1.product_id > p2.product_id;
```

:::danger Осторожно
`DELETE` без `WHERE` удалит ВСЕ записи! Рекомендации:
1. Всегда используйте WHERE
2. Сначала выполните SELECT с тем же WHERE
3. Используйте транзакции для критичных удалений
4. Рассмотрите "мягкое удаление" (флаг is_deleted вместо физического удаления)
:::

#### Сравнение DELETE и TRUNCATE

**DELETE** vs **TRUNCATE** — это совершенно разные по сути операции, хотя на первый взгляд кажутся похожими.

| Параметр                     | **DELETE**                                      | **TRUNCATE**                                      | Победитель по скорости |
|------------------------------|--------------------------------------------------|----------------------------------------------------|--------------------------|
| Что удаляет                  | Любые строки (с WHERE или без)                   | Только **все** строки в таблице                    | —                        |
| Тип команды                  | DML                                              | DDL                                                | —                        |
| Скорость (миллионы строк)    | Медленно (удаляет по одной строке)               | Очень быстро (меняет метаданные файла)             | **TRUNCATE** ★★★★★      |
| Возврат места на диске       | Не сразу (нужен VACUUM)                          | Сразу                                              | **TRUNCATE**             |
| Триггеры ON DELETE           | Срабатывают                                      | **Не** срабатывают                                 | —                        |
| Проверка FOREIGN KEY         | Проверяет каждую строку                          | **Не** проверяет по одной строке                   | **TRUNCATE** быстрее     |
| FOREIGN KEY на таблицу       | Работает всегда                                  | Запрещено, если есть ссылки (кроме CASCADE)        | **DELETE**               |
| Можно откатить (rollback)    | Да                                               | Да (в PostgreSQL — в отличие от многих других СУБД)| Оба                      |
| Логирование транзакции       | Полное (каждая строка)                           | Минимальное                                        | **TRUNCATE**             |
| Блокировка                   | RowShareLock → RowExclusiveLock                  | **AccessExclusiveLock** (очень жёсткая)            | **DELETE** мягче         |
| Сброс последовательностей    | Нет                                              | Можно (RESTART IDENTITY)                           | —                        |
| WHERE-условие                | Да                                               | **Нет**                                            | **DELETE**               |

#### Когда что использовать 

| Ситуация                                              | Что лучше использовать              | Почему                                                                 |
|-------------------------------------------------------|--------------------------------------|------------------------------------------------------------------------|
| Нужно удалить **все** строки и таблица не большая    | **TRUNCATE** (или DELETE — почти без разницы) | —                                                                      |
| Миллионы/миллиарды строк, нужно быстро очистить      | **TRUNCATE**                         | Разница может быть в десятки-сотни раз                                 |
| Есть **FOREIGN KEY**, ссылающиеся на таблицу          | **DELETE** или **TRUNCATE ... CASCADE** | TRUNCATE без CASCADE просто не сработает                               |
| Важны триггеры (логирование, аудит, обновление счётчиков) | **DELETE**                     | TRUNCATE их игнорирует                                                 |
| Таблица активно используется другими сессиями         | **DELETE**                           | TRUNCATE требует эксклюзивной блокировки → долгий простой             |
| Нужно очистить + сбросить автоинкремент (id)          | **TRUNCATE ... RESTART IDENTITY**    | Удобно и быстро                                                        |
| Удаляем только часть строк (фильтр)                   | Только **DELETE**                    | TRUNCATE не умеет                                                      |
| Регулярная очистка временных/кеш-таблиц               | **TRUNCATE**                         | Самый быстрый и чистый способ                                          |
| Работаем в продакшене и боимся блокировки             | **DELETE** (часто порциями)          | Безопаснее для живой системы                                           |

**Короткое практическое правило:**

```text
Хочу быстро и полностью очистить таблицу
   и мне не важны триггеры
   и нет чужих FK или я готов использовать CASCADE
   и могу позволить себе AccessExclusiveLock
          ↓
       TRUNCATE

Всё остальное → DELETE
```

:::info Самый частый выбор в современных проектах  
`TRUNCATE` — для тестовых/временных/кеш-таблиц и полных очисток таблиц  
`DELETE` — почти всегда в продакшене, особенно если есть хоть какие-то связи или важны триггеры.
:::

### JOIN — Объединение таблиц

**JOIN** — это операция, которая позволяет объединять данные из двух или более таблиц на основе общего условия (обычно по значениям ключей), чтобы получить результат, содержащий столбцы из разных таблиц в одной строке. 

:::info
`JOIN` — это основа реляционных баз данных, именно благодаря ему мы можем связывать, например, заказы с пользователями, товары с категориями или комментарии с постами, и писать запросы вроде `SELECT u.name, o.amount FROM users u JOIN orders o ON u.id = o.user_id`
:::

### INNER JOIN — Внутреннее объединение

**INNER JOIN *(просто JOIN без уточнения)*** — это самый распространённый и «строгий» вид соединения: он возвращает только те строки, где есть совпадение по условию соединения в обеих таблицах. Если в одной из таблиц нет соответствующей записи — такая строка вообще не попадёт в результат. 

:::info Пример
`SELECT u.name, o.amount FROM users u INNER JOIN orders o ON u.id = o.user_id` — покажет только тех пользователей, у которых есть хотя бы один заказ. Это дефолтный и самый понятный JOIN, когда вам нужны только «полные» пары данных.
:::

```sql
-- Базовый INNER JOIN
SELECT 
    users.username,
    orders.order_id,
    orders.total_amount
FROM users
INNER JOIN orders ON users.user_id = orders.customer_id;

-- С алиасами (рекомендуется)
SELECT 
    u.username,
    o.order_id,
    o.total_amount
FROM users u
INNER JOIN orders o ON u.user_id = o.customer_id;

-- Множественные JOIN
SELECT 
    c.name AS customer_name,
    o.order_id,
    p.name AS product_name,
    oi.quantity,
    oi.price
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
INNER JOIN order_items oi ON o.order_id = oi.order_id
INNER JOIN products p ON oi.product_id = p.product_id
WHERE o.order_date >= '2024-01-01';

-- JOIN с группировкой
SELECT 
    c.name,
    COUNT(o.order_id) AS order_count,
    SUM(o.total_amount) AS total_spent
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.name
HAVING COUNT(o.order_id) > 5
ORDER BY total_spent DESC;
```

### LEFT JOIN — Левое внешнее объединение

**LEFT JOIN *(или LEFT OUTER JOIN)*** — возвращает все строки из левой таблицы (той, что указана первой) и соответствующие строки из правой таблицы. Если в правой таблице нет совпадения — в соответствующих столбцах будут **NULL**. 

:::info Пример
Очень полезен, когда нужно увидеть всех пользователей даже без заказов: `SELECT u.name, o.amount FROM users u LEFT JOIN orders o ON u.id = o.user_id` — все пользователи будут в результате, а у тех, кто ничего не заказывал, amount будет **NULL**.
:::

```sql
-- Все пользователи и их заказы (даже если заказов нет)
SELECT 
    u.username,
    o.order_id,
    o.total_amount
FROM users u
LEFT JOIN orders o ON u.user_id = o.customer_id;

-- Найти пользователей без заказов
SELECT 
    u.username,
    u.email
FROM users u
LEFT JOIN orders o ON u.user_id = o.customer_id
WHERE o.order_id IS NULL;

-- Подсчет заказов для каждого пользователя (включая 0)
SELECT 
    u.username,
    COUNT(o.order_id) AS order_count,
    COALESCE(SUM(o.total_amount), 0) AS total_spent
FROM users u
LEFT JOIN orders o ON u.user_id = o.customer_id
GROUP BY u.user_id, u.username
ORDER BY order_count DESC;
```

### RIGHT JOIN — Правое внешнее объединение

**RIGHT JOIN *(или RIGHT OUTER JOIN)*** — зеркальная противоположность `LEFT JOIN`: возвращает все строки из правой таблицы и соответствующие из левой. Если в левой таблице нет пары — в левых столбцах будут NULL. На практике используется гораздо реже `LEFT JOIN`, потому что почти всегда можно просто поменять таблицы местами и написать `LEFT JOIN`. 

:::info Пример
`SELECT u.name, o.amount FROM users u RIGHT JOIN orders o ON u.id = o.user_id` — покажет все заказы, даже если пользователь был удалён (тогда name будет NULL).
:::

```sql
-- Все заказы и информация о клиентах (даже если клиент удален)
SELECT 
    o.order_id,
    o.total_amount,
    c.name AS customer_name
FROM customers c
RIGHT JOIN orders o ON c.customer_id = o.customer_id;

-- Эквивалентно LEFT JOIN с обратным порядком
SELECT 
    o.order_id,
    o.total_amount,
    c.name AS customer_name
FROM orders o
LEFT JOIN customers c ON c.customer_id = o.customer_id;
```

### FULL OUTER JOIN — Полное внешнее объединение

**FULL JOIN *(или FULL OUTER JOIN)*** — самый «щедрый» вид: возвращает все строки из обеих таблиц. Где есть совпадение — данные соединяются, где совпадения нет — в недостающих столбцах ставятся NULL. Получается полный набор: пользователи без заказов + заказы без пользователей + обычные пары. 

:::info Пример
`SELECT u.name, o.amount FROM users u FULL JOIN orders o ON u.id = o.user_id.`. Используется редко, в основном для поиска расхождений, сверки данных или отчётов «что есть в одной таблице, но нет в другой».
:::

```sql
-- Все пользователи и все заказы
SELECT 
    u.username,
    o.order_id,
    o.total_amount
FROM users u
FULL OUTER JOIN orders o ON u.user_id = o.customer_id;

-- Найти несоответствия (пользователи без заказов или заказы без пользователей)
SELECT 
    u.username,
    o.order_id
FROM users u
FULL OUTER JOIN orders o ON u.user_id = o.customer_id
WHERE u.user_id IS NULL OR o.order_id IS NULL;
```

### CROSS JOIN — Декартово произведение

**CROSS JOIN** — это декартово произведение: соединяет каждую строку левой таблицы с каждой строкой правой таблицы, без всякого условия `ON`. Если в users 100 строк, а в `products 50` — результат будет 5000 строк. Очень опасен на больших таблицах (может «убить» сервер). Применяется редко: для генерации всех возможных комбинаций (например, тестовые данные, матрицы, пары «каждый с каждым»). 

:::info Пример
`FROM table1 CROSS JOIN table2` или даже `FROM table1, table2` (старый синтаксис).
:::

```sql
-- Все комбинации размеров и цветов
SELECT 
    s.size_name,
    c.color_name
FROM sizes s
CROSS JOIN colors c;

-- С условием (как INNER JOIN без ON)
SELECT 
    p.name AS product,
    s.name AS store
FROM products p
CROSS JOIN stores s
WHERE p.category = 'Books';
```

### SELF JOIN — Самообъединение

```sql
-- Таблица сотрудников с менеджерами
CREATE TABLE employees (
    emp_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    manager_id INTEGER REFERENCES employees(emp_id)
);

-- Найти сотрудников и их менеджеров
SELECT 
    e.name AS employee,
    m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.emp_id;

-- Найти пары сотрудников из одного города
SELECT 
    e1.name AS employee1,
    e2.name AS employee2,
    e1.city
FROM employees e1
INNER JOIN employees e2 ON e1.city = e2.city
WHERE e1.emp_id < e2.emp_id  -- Избежать дубликатов
ORDER BY e1.city;
```

## Подзапросы

### Скалярные подзапросы

```sql
-- Подзапрос возвращает одно значение
SELECT 
    name,
    price,
    (SELECT AVG(price) FROM products) AS avg_price,
    price - (SELECT AVG(price) FROM products) AS diff_from_avg
FROM products
WHERE price > (SELECT AVG(price) FROM products);

-- В WHERE
SELECT name, price
FROM products
WHERE price > (
    SELECT AVG(price) FROM products WHERE category = 'Electronics'
);
```

### Табличные подзапросы

```sql
-- В FROM (производная таблица)
SELECT 
    category,
    avg_price,
    product_count
FROM (
    SELECT 
        category,
        AVG(price) AS avg_price,
        COUNT(*) AS product_count
    FROM products
    GROUP BY category
) AS category_stats
WHERE product_count > 10
ORDER BY avg_price DESC;

-- Подзапрос с JOIN
SELECT 
    p.name,
    p.price,
    cat.avg_price
FROM products p
JOIN (
    SELECT 
        category,
        AVG(price) AS avg_price
    FROM products
    GROUP BY category
) cat ON p.category = cat.category
WHERE p.price > cat.avg_price;
```

### IN и NOT IN

```sql
-- Клиенты, сделавшие заказы
SELECT name, email
FROM customers
WHERE customer_id IN (
    SELECT DISTINCT customer_id FROM orders
);

-- Продукты, которые никогда не заказывали
SELECT name, sku
FROM products
WHERE product_id NOT IN (
    SELECT product_id FROM order_items WHERE product_id IS NOT NULL
);

-- Альтернатива через LEFT JOIN (часто быстрее)
SELECT p.name, p.sku
FROM products p
LEFT JOIN order_items oi ON p.product_id = oi.product_id
WHERE oi.product_id IS NULL;
```

### EXISTS и NOT EXISTS

```sql
-- Клиенты, у которых есть заказы
SELECT name, email
FROM customers c
WHERE EXISTS (
    SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id
);

-- Продукты без отзывов
SELECT name
FROM products p
WHERE NOT EXISTS (
    SELECT 1 FROM reviews r WHERE r.product_id = p.product_id
);

-- EXISTS обычно быстрее IN для больших наборов данных
-- Особенно если подзапрос возвращает много строк
```

### ANY и ALL

```sql
-- Продукты дороже ЛЮБОГО продукта в категории 'Books'
SELECT name, price
FROM products
WHERE price > ANY (
    SELECT price FROM products WHERE category = 'Books'
);

-- Продукты дороже ВСЕХ продуктов в категории 'Books'
SELECT name, price
FROM products
WHERE price > ALL (
    SELECT price FROM products WHERE category = 'Books'
);

-- = ANY эквивалентно IN
SELECT name FROM products
WHERE category = ANY (ARRAY['Electronics', 'Books', 'Clothing']);
```

## Операторы работы с множествами

### UNION — Объединение

```sql
-- Объединение результатов (без дубликатов)
SELECT name, 'customer' AS type FROM customers
UNION
SELECT name, 'supplier' AS type FROM suppliers;

-- UNION ALL — с дубликатами (быстрее)
SELECT email FROM users
UNION ALL
SELECT email FROM subscribers;

-- Объединение с сортировкой
(SELECT name, created_at FROM products WHERE category = 'New')
UNION
(SELECT name, created_at FROM products WHERE is_featured = TRUE)
ORDER BY created_at DESC
LIMIT 10;
```

### INTERSECT — Пересечение

```sql
-- Клиенты, которые также являются поставщиками
SELECT email FROM customers
INTERSECT
SELECT email FROM suppliers;

-- С дополнительной фильтрацией
SELECT email FROM users WHERE country = 'Russia'
INTERSECT
SELECT email FROM orders WHERE total_amount > 10000;
```

### EXCEPT — Разность

```sql
-- Все пользователи, кроме тех, кто сделал заказы
SELECT user_id, email FROM users
EXCEPT
SELECT customer_id, email FROM customers WHERE customer_id IN (SELECT customer_id FROM orders);

-- Продукты без продаж в 2024 году
SELECT product_id FROM products
EXCEPT
SELECT DISTINCT product_id FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
WHERE EXTRACT(YEAR FROM o.order_date) = 2024;
```

## Дополнительные возможности SELECT

### CASE — Условные выражения

```sql
-- Простой CASE
SELECT 
    name,
    price,
    CASE 
        WHEN price < 1000 THEN 'Дешевый'
        WHEN price < 5000 THEN 'Средний'
        ELSE 'Дорогой'
    END AS price_category
FROM products;

-- CASE в агрегации
SELECT 
    category,
    COUNT(*) AS total,
    COUNT(CASE WHEN price > 1000 THEN 1 END) AS expensive_count,
    COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) AS out_of_stock_count
FROM products
GROUP BY category;

-- Условное обновление
UPDATE products
SET discount = CASE
    WHEN price > 10000 THEN 0.15
    WHEN price > 5000 THEN 0.10
    WHEN price > 1000 THEN 0.05
    ELSE 0
END;

-- CASE в ORDER BY
SELECT name, priority
FROM tasks
ORDER BY 
    CASE priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
    END;
```

### COALESCE — Значение по умолчанию

```sql
-- Вернуть первое NOT NULL значение
SELECT 
    name,
    COALESCE(phone, mobile, 'No contact') AS contact
FROM users;

-- С вычислениями
SELECT 
    name,
    COALESCE(discount_price, price) AS final_price,
    COALESCE(discount_price, price) * quantity AS total
FROM order_items;

-- Замена NULL в агрегации
SELECT 
    category,
    COALESCE(SUM(stock_quantity), 0) AS total_stock
FROM products
GROUP BY category;
```

### NULLIF — Преобразование в NULL

```sql
-- NULLIF возвращает NULL, если значения равны
SELECT 
    name,
    NULLIF(discount_price, 0) AS discount  -- NULL если discount_price = 0
FROM products;

-- Избежание деления на ноль
SELECT 
    product_id,
    total_sales,
    returns,
    returns / NULLIF(total_sales, 0) * 100 AS return_rate
FROM product_stats;
```

### Функции работы со строками

```sql
-- Конкатенация
SELECT 
    first_name || ' ' || last_name AS full_name,
    CONCAT(first_name, ' ', last_name) AS full_name2,
    CONCAT_WS(' ', first_name, middle_name, last_name) AS full_name3  -- С разделителем
FROM users;

-- Изменение регистра
SELECT 
    UPPER(name) AS uppercase,
    LOWER(name) AS lowercase,
    INITCAP(name) AS titlecase
FROM products;

-- Обрезка и замена
SELECT 
    TRIM('  text  ') AS trimmed,
    LTRIM('  text') AS left_trimmed,
    RTRIM('text  ') AS right_trimmed,
    REPLACE('hello world', 'world', 'PostgreSQL') AS replaced;

-- Подстроки
SELECT 
    SUBSTRING(description FROM 1 FOR 100) AS short_desc,
    LEFT(title, 50) AS short_title,
    RIGHT(code, 4) AS last_four;

-- Длина
SELECT 
    LENGTH(description) AS char_count,
    OCTET_LENGTH(description) AS byte_count;

-- Поиск
SELECT 
    POSITION('SQL' IN 'PostgreSQL') AS position,
    STRPOS('PostgreSQL', 'SQL') AS strpos;
```

### Функции работы с датами

```sql
-- Текущие дата и время
SELECT 
    CURRENT_DATE AS today,
    CURRENT_TIME AS now_time,
    CURRENT_TIMESTAMP AS now_timestamp,
    NOW() AS now_func,
    CLOCK_TIMESTAMP() AS precise_now;  -- Меняется в пределах одной транзакции

-- Извлечение компонентов
SELECT 
    EXTRACT(YEAR FROM created_at) AS year,
    EXTRACT(MONTH FROM created_at) AS month,
    EXTRACT(DAY FROM created_at) AS day,
    EXTRACT(HOUR FROM created_at) AS hour,
    EXTRACT(DOW FROM created_at) AS day_of_week,  -- 0=вс, 1=пн
    EXTRACT(EPOCH FROM created_at) AS unix_timestamp
FROM orders;

-- Арифметика с датами
SELECT 
    order_date,
    order_date + INTERVAL '7 days' AS week_later,
    order_date - INTERVAL '1 month' AS month_ago,
    NOW() - order_date AS time_since_order,
    AGE(NOW(), order_date) AS age
FROM orders;

-- Округление дат
SELECT 
    DATE_TRUNC('hour', created_at) AS hour_start,
    DATE_TRUNC('day', created_at) AS day_start,
    DATE_TRUNC('month', created_at) AS month_start,
    DATE_TRUNC('year', created_at) AS year_start
FROM logs;

-- Форматирование
SELECT 
    TO_CHAR(created_at, 'DD.MM.YYYY HH24:MI:SS') AS formatted,
    TO_CHAR(created_at, 'Day, DD Month YYYY') AS verbose,
    TO_CHAR(amount, 'L999,999.99') AS money_format  -- L = символ валюты
FROM orders;
```

### Математические функции

```sql
SELECT 
    ABS(-5) AS absolute,
    CEIL(4.3) AS ceiling,
    FLOOR(4.8) AS floor,
    ROUND(4.567, 2) AS rounded,
    TRUNC(4.567, 1) AS truncated,
    MOD(10, 3) AS modulo,
    POWER(2, 10) AS power,
    SQRT(16) AS square_root,
    RANDOM() AS random_0_to_1;

-- Использование в запросах
SELECT 
    product_id,
    price,
    ROUND(price * 0.85, 2) AS discounted_price,
    CEIL(price / 100) * 100 AS rounded_to_hundred
FROM products;
```


## Транзакции

### Основы транзакций

```sql
-- Начало транзакции
BEGIN;  -- или START TRANSACTION;

-- Выполнение операций
UPDATE accounts SET balance = balance - 1000 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 1000 WHERE account_id = 2;

-- Фиксация изменений
COMMIT;

-- Или откат изменений
ROLLBACK;
```

### Точки сохранения (Savepoints)

```sql
BEGIN;

INSERT INTO orders (customer_id, total_amount) 
VALUES (1, 5000);

SAVEPOINT before_items;

INSERT INTO order_items (order_id, product_id, quantity)
VALUES (1, 100, 5);

-- Ошибка! Откатываем только order_items
ROLLBACK TO before_items;

-- Добавляем корректные данные
INSERT INTO order_items (order_id, product_id, quantity)
VALUES (1, 101, 3);

COMMIT;
```

### Уровни изоляции

```sql
-- Установка уровня изоляции для транзакции
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;
-- или
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Уровни изоляции в PostgreSQL:
-- READ UNCOMMITTED (как READ COMMITTED в PostgreSQL)
-- READ COMMITTED (по умолчанию)
-- REPEATABLE READ
-- SERIALIZABLE

-- Пример с REPEATABLE READ
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM accounts WHERE account_id = 1;  -- Видит 1000
-- Другая транзакция изменяет balance на 2000
SELECT balance FROM accounts WHERE account_id = 1;  -- Все еще видит 1000!
COMMIT;
```

## Практические примеры

### Создание системы блога

```sql
-- База данных
CREATE DATABASE blog_system;
\c blog_system

-- Пользователи
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Категории
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Посты
CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    author_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    views_count INTEGER DEFAULT 0 CHECK (views_count >= 0),
    is_featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Теги
CREATE TABLE tags (
    tag_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL
);

-- Связь посты-теги (многие-ко-многим)
CREATE TABLE post_tags (
    post_id INTEGER REFERENCES posts(post_id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Комментарии
CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    parent_id INTEGER REFERENCES comments(comment_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Лайки
CREATE TABLE post_likes (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(post_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- Индексы для производительности
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published ON posts(published_at);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_author ON comments(author_id);

-- Тестовые данные
INSERT INTO users (username, email, password_hash, full_name, is_admin) VALUES
    ('admin', 'admin@blog.com', 'hash1', 'Администратор', TRUE),
    ('john_doe', 'john@example.com', 'hash2', 'Джон Доу', FALSE),
    ('jane_smith', 'jane@example.com', 'hash3', 'Джейн Смит', FALSE);

INSERT INTO categories (name, slug, description) VALUES
    ('Технологии', 'tech', 'Статьи о технологиях'),
    ('Программирование', 'programming', 'Уроки программирования'),
    ('Базы данных', 'databases', 'Всё о базах данных');

INSERT INTO tags (name, slug) VALUES
    ('PostgreSQL', 'postgresql'),
    ('SQL', 'sql'),
    ('Tutorial', 'tutorial'),
    ('Best Practices', 'best-practices');

INSERT INTO posts (author_id, category_id, title, slug, content, status, published_at) VALUES
    (1, 3, 'Введение в PostgreSQL', 'intro-to-postgresql', 'Подробное введение...', 'published', NOW()),
    (2, 2, 'SQL для начинающих', 'sql-for-beginners', 'Основы SQL...', 'published', NOW() - INTERVAL '1 day'),
    (2, 3, 'Оптимизация запросов', 'query-optimization', 'Как оптимизировать...', 'draft', NULL);

-- Связи постов и тегов
INSERT INTO post_tags (post_id, tag_id) VALUES
    (1, 1), (1, 3),
    (2, 2), (2, 3);

-- Комментарии
INSERT INTO comments (post_id, author_id, content, is_approved) VALUES
    (1, 2, 'Отличная статья!', TRUE),
    (1, 3, 'Спасибо за информацию', TRUE),
    (1, 3, 'Хотелось бы больше примеров', TRUE);

-- Лайки
INSERT INTO post_likes (user_id, post_id) VALUES
    (2, 1),
    (3, 1),
    (3, 2);
```

### Полезные запросы для блога

```sql
-- Все опубликованные посты с информацией об авторе и категории
SELECT 
    p.post_id,
    p.title,
    p.slug,
    p.excerpt,
    p.published_at,
    p.views_count,
    u.full_name AS author,
    u.username AS author_username,
    c.name AS category,
    COUNT(DISTINCT pl.user_id) AS likes_count,
    COUNT(DISTINCT cm.comment_id) AS comments_count
FROM posts p
JOIN users u ON p.author_id = u.user_id
LEFT JOIN categories c ON p.category_id = c.category_id
LEFT JOIN post_likes pl ON p.post_id = pl.post_id
LEFT JOIN comments cm ON p.post_id = cm.comment_id AND cm.is_approved = TRUE
WHERE p.status = 'published'
GROUP BY p.post_id, u.full_name, u.username, c.name
ORDER BY p.published_at DESC;

-- Пост с тегами
SELECT 
    p.title,
    STRING_AGG(t.name, ', ') AS tags
FROM posts p
LEFT JOIN post_tags pt ON p.post_id = pt.post_id
LEFT JOIN tags t ON pt.tag_id = t.tag_id
WHERE p.post_id = 1
GROUP BY p.post_id, p.title;

-- Популярные теги
SELECT 
    t.name,
    t.slug,
    COUNT(pt.post_id) AS post_count
FROM tags t
JOIN post_tags pt ON t.tag_id = pt.tag_id
JOIN posts p ON pt.post_id = p.post_id
WHERE p.status = 'published'
GROUP BY t.tag_id, t.name, t.slug
ORDER BY post_count DESC
LIMIT 10;

-- Комментарии с вложенностью
SELECT 
    c.comment_id,
    c.content,
    c.created_at,
    COALESCE(u.full_name, 'Гость') AS author,
    c.parent_id,
    p.title AS post_title
FROM comments c
LEFT JOIN users u ON c.author_id = u.user_id
JOIN posts p ON c.post_id = p.post_id
WHERE c.is_approved = TRUE
ORDER BY c.created_at DESC;

-- Топ авторов по количеству постов и лайков
SELECT 
    u.username,
    u.full_name,
    COUNT(DISTINCT p.post_id) AS posts_count,
    COUNT(DISTINCT pl.user_id) AS total_likes,
    SUM(p.views_count) AS total_views
FROM users u
LEFT JOIN posts p ON u.user_id = p.author_id AND p.status = 'published'
LEFT JOIN post_likes pl ON p.post_id = pl.post_id
GROUP BY u.user_id, u.username, u.full_name
HAVING COUNT(DISTINCT p.post_id) > 0
ORDER BY posts_count DESC, total_likes DESC
LIMIT 10;
```

## Лучшие практики

### Именование

```sql
-- ✅ Хорошее именование
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    created_at TIMESTAMPTZ
);

-- ❌ Плохое именование
CREATE TABLE tbl_usr (
    ID INT,
    usrnm VARCHAR(50),
    dt DATE
);

-- Правила:
-- - Используйте snake_case для таблиц и колонок
-- - Таблицы в множественном числе (users, orders)
-- - Колонки в единственном числе (user_id, name)
-- - Префикс id для первичных ключей (user_id, product_id)
-- - Суффикс _at для временных меток (created_at, updated_at)
-- - Суффикс _count для счетчиков (views_count, items_count)
-- - Префикс is_ для булевых (is_active, is_admin)
```

### Индексы

```sql
-- ✅ Создавайте индексы на:
-- - Первичные ключи (автоматически)
-- - Внешние ключи
CREATE INDEX idx_orders_customer ON orders(customer_id);

-- - Колонки в WHERE часто
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = TRUE;

-- - Колонки в ORDER BY
CREATE INDEX idx_posts_published ON posts(published_at DESC);

-- - Колонки в GROUP BY
CREATE INDEX idx_orders_status ON orders(status);

-- ❌ Не создавайте индексы на:
-- - Маленькие таблицы (< 1000 строк)
-- - Колонки с низкой селективностью (пол, булевы с равным распределением)
-- - Колонки, которые часто обновляются

-- Проверяйте использование индексов
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Производительность запросов

```sql
-- ✅ Используйте EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM orders 
WHERE customer_id = 100 
  AND order_date > '2024-01-01';

-- ✅ Выбирайте только нужные колонки
SELECT user_id, username FROM users;  -- Хорошо
SELECT * FROM users;                  -- Плохо (если не нужны все колонки)

-- ✅ Используйте LIMIT для больших выборок
SELECT * FROM logs 
ORDER BY created_at DESC 
LIMIT 100;

-- ✅ Избегайте SELECT DISTINCT если возможно
-- Вместо:
SELECT DISTINCT customer_id FROM orders;
-- Используйте:
SELECT customer_id FROM orders GROUP BY customer_id;

-- ✅ Используйте EXISTS вместо IN для больших подзапросов
-- Медленно:
SELECT * FROM customers 
WHERE customer_id IN (SELECT customer_id FROM orders);

-- Быстрее:
SELECT * FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);

-- ✅ Избегайте функций на индексированных колонках в WHERE
-- Плохо (не использует индекс):
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';

-- Хорошо (использует индекс):
SELECT * FROM users WHERE email = 'test@example.com';
-- Или создайте функциональный индекс:
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
```

### Безопасность

```sql
-- ✅ Используйте параметризованные запросы (подготовленные выражения)
-- В приложении (пример на Python):
-- cursor.execute("SELECT * FROM users WHERE username = %s", (username,))

-- ❌ НЕ используйте конкатенацию строк
-- query = "SELECT * FROM users WHERE username = '" + username + "'"  -- SQL injection!

-- ✅ Используйте минимальные привилегии
CREATE ROLE app_user WITH LOGIN PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE mydb TO app_user;
GRANT SELECT, INSERT, UPDATE ON TABLE orders TO app_user;
-- Не давайте DELETE или DROP без необходимости

-- ✅ Шифруйте чувствительные данные
CREATE EXTENSION pgcrypto;

INSERT INTO users (username, password_hash)
VALUES ('user', crypt('password', gen_salt('bf')));

-- Проверка пароля
SELECT * FROM users 
WHERE username = 'user' 
  AND password_hash = crypt('password', password_hash);
```

### Типы данных

```sql
-- ✅ Выбирайте правильные типы данных
CREATE TABLE good_types (
    -- Денежные суммы
    price NUMERIC(10, 2),              -- ✅ Точные вычисления
    -- price REAL,                     -- ❌ Ошибки округления
    
    -- Булевы значения
    is_active BOOLEAN,                 -- ✅ TRUE/FALSE
    -- is_active CHAR(1),              -- ❌ Нерациональное использование
    
    -- Даты с часовым поясом
    created_at TIMESTAMPTZ,            -- ✅ С часовым поясом
    -- created_at TIMESTAMP,           -- ❌ Без часового пояса
    
    -- Текст переменной длины
    description TEXT,                  -- ✅ Без ограничений
    -- description VARCHAR(1000),      -- ❌ Произвольное ограничение
    
    -- Email (с валидацией)
    email VARCHAR(100) CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
```

### Нормализация

```sql
-- ✅ Нормализованная структура (3NF)
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100)
);

CREATE TABLE addresses (
    address_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    street VARCHAR(200),
    city VARCHAR(100),
    country VARCHAR(50)
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    order_date DATE
);

-- ❌ Денормализованная (дублирование данных)
CREATE TABLE orders_bad (
    order_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100),    -- Дублируется
    customer_email VARCHAR(100),   -- Дублируется
    customer_city VARCHAR(100),    -- Дублируется
    order_date DATE
);

-- Но иногда денормализация оправдана для производительности:
CREATE TABLE order_summary (
    order_id INTEGER PRIMARY KEY,
    customer_name VARCHAR(100),    -- Кэш для быстрого доступа
    total_amount NUMERIC(10, 2),
    items_count INTEGER
);
```

### Полезные ресурсы:

**Практика SQL:**
- https://pgexercises.com/ — интерактивные упражнения
- https://sqlzoo.net/ — обучение SQL с примерами
- https://www.hackerrank.com/domains/sql — задачи SQL

**Документация:**
- https://www.postgresql.org/docs/current/sql.html
- https://www.postgresql.org/docs/current/tutorial.html

**Инструменты:**
- https://explain.depesz.com/ — визуализация EXPLAIN
- https://www.db-fiddle.com/ — онлайн SQL песочница

## Контрольные вопросы

1. В чем разница между DDL и DML?
2. Какие каскадные операции доступны для внешних ключей?
3. Когда использовать TRUNCATE вместо DELETE?
4. В чем разница между INNER JOIN и LEFT JOIN?
5. Что такое MVCC и как это влияет на UPDATE?
6. Когда использовать EXISTS вместо IN?
7. Какие уровни изоляции транзакций существуют в PostgreSQL?
8. В чем разница между UNION и UNION ALL?
9. Как работает ON CONFLICT в INSERT?
10. Зачем нужны индексы и когда их не следует создавать?# SQL основы: DDL и DML операции, создание таблиц и связей
