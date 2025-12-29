---
sidebar_position: 5
description: "В этой главе мы изучим ключи и связи в PostgreSQL."
---


# Ключи и связи

## Первичные ключи (Primary Key)

### Что такое первичный ключ?

**Первичный ключ (Primary Key, PK)** — это столбец (или комбинация столбцов), который уникально идентифицирует каждую строку в таблице.

**Аналогия:** Как паспортный номер для человека — он уникален и идентифицирует конкретного человека.

### Правила первичного ключа

1. **Уникальность** — значения не должны повторяться
2. **NOT NULL** — не может быть пустым
3. **Неизменность** — лучше не изменять после создания
4. **Один на таблицу** — может быть только один первичный ключ

### Создание первичного ключа

**Вариант 1: SERIAL (автоинкремент)**

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL
);

-- SERIAL автоматически генерирует последовательность: 1, 2, 3, 4...
```

**При вставке:**
```sql
INSERT INTO users (username, email)
VALUES ('alice', 'alice@example.com');
-- id будет автоматически = 1

INSERT INTO users (username, email)
VALUES ('bob', 'bob@example.com');
-- id будет автоматически = 2
```

**Вариант 2: UUID (универсальный уникальный идентификатор)**

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- UUID выглядит так: 550e8400-e29b-41d4-a716-446655440000
```

**Преимущества UUID:**
- Глобально уникальны (можно использовать в распределенных системах)
- Сложнее предсказать следующий ID (безопаснее)

**Недостатки UUID:**
- Занимают больше места (16 байт vs 4 байта для INTEGER)
- Сложнее читать и отлаживать

**Вариант 3: Натуральный ключ (существующее поле)**

```sql
CREATE TABLE countries (
    code CHAR(2) PRIMARY KEY,  -- 'US', 'RU', 'DE'
    name VARCHAR(100) NOT NULL
);

INSERT INTO countries (code, name)
VALUES ('RU', 'Россия'), ('US', 'США'), ('DE', 'Германия');
```

**Когда использовать:**
- Когда есть естественно уникальное поле (код страны, ISBN книги)
- Значение не будет изменяться

### Составной первичный ключ

Первичный ключ может состоять из нескольких столбцов:

```sql
CREATE TABLE student_courses (
    student_id INTEGER,
    course_id INTEGER,
    enrolled_at DATE DEFAULT CURRENT_DATE,
    PRIMARY KEY (student_id, course_id)
);

-- Один студент может быть записан на один курс только один раз
-- Но может быть на разных курсах

INSERT INTO student_courses (student_id, course_id)
VALUES (1, 101), (1, 102), (2, 101);

-- ❌ Ошибка - дубликат:
INSERT INTO student_courses (student_id, course_id)
VALUES (1, 101);
```

### Проверка первичных ключей

```sql
-- Посмотреть структуру таблицы
\d users

-- Или через SQL запрос
SELECT 
    tc.table_name, 
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_name = 'users';
```

---

## Внешние ключи (Foreign Key)

### Что такое внешний ключ?

**Внешний ключ (Foreign Key, FK)** — это столбец, который ссылается на первичный ключ другой таблицы, создавая связь между таблицами.

**Аналогия:** Как ссылка в тексте на источник в библиографии — она указывает на конкретную книгу.

### Зачем нужны внешние ключи?

1. **Целостность данных** — нельзя создать связь с несуществующей записью
2. **Защита от удаления** — нельзя удалить запись, на которую есть ссылки
3. **Документирование** — явно показывает связи в структуре БД

### Создание внешнего ключа

**Базовый пример:**

```sql
-- Главная таблица (родитель)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- Зависимая таблица (потомок)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category_id INTEGER REFERENCES categories(id)  -- Внешний ключ
);
```

**Добавим данные:**

```sql
-- Сначала категории
INSERT INTO categories (name) 
VALUES ('Электроника'), ('Мебель'), ('Одежда');

-- Теперь товары
INSERT INTO products (name, price, category_id)
VALUES 
    ('iPhone 15', 89990, 1),    -- 1 = Электроника
    ('Диван', 45000, 2),        -- 2 = Мебель
    ('Футболка', 1500, 3);      -- 3 = Одежда

-- ❌ Ошибка - категории с id=99 не существует:
INSERT INTO products (name, price, category_id)
VALUES ('Товар', 1000, 99);
-- ERROR: insert or update on table "products" violates foreign key constraint
```

### Синтаксис внешнего ключа

**Вариант 1: Inline определение**

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id)
);
```

**Вариант 2: Именованное ограничение**

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER,
    CONSTRAINT fk_products_category 
        FOREIGN KEY (category_id) 
        REFERENCES categories(id)
);
```

**Вариант 3: Добавление FK к существующей таблице**

```sql
ALTER TABLE products
ADD CONSTRAINT fk_products_category
    FOREIGN KEY (category_id)
    REFERENCES categories(id);
```

### NULL в внешних ключах

Внешний ключ может быть NULL (если не указан NOT NULL):

```sql
-- Товар БЕЗ категории (category_id = NULL)
INSERT INTO products (name, price, category_id)
VALUES ('Без категории', 100, NULL);  -- ✅ Разрешено

-- Запретить NULL
ALTER TABLE products
ALTER COLUMN category_id SET NOT NULL;
```

---

## Типы связей между таблицами

### Связь "Один ко многим" (One-to-Many)

**Самый распространенный тип связи.**

**Пример:** Одна категория → много товаров

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    category_id INTEGER REFERENCES categories(id)
);
```

**Диаграмма:**
```
categories          products
-----------         ---------
id (PK)      1───┬──→ id (PK)
name             │    name
                 │    category_id (FK)
                 ├──→ 
                 ├──→ 
                 └──→ 
```

**Реальные примеры:**
- Автор → Книги (один автор написал много книг)
- Клиент → Заказы (один клиент сделал много заказов)
- Компания → Сотрудники (в одной компании много сотрудников)

**Пример с данными:**

```sql
-- Создаем авторов
CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author_id INTEGER REFERENCES authors(id)
);

-- Добавляем данные
INSERT INTO authors (name) VALUES ('Лев Толстой'), ('Фёдор Достоевский');

INSERT INTO books (title, author_id) VALUES 
    ('Война и мир', 1),
    ('Анна Каренина', 1),
    ('Воскресение', 1),
    ('Преступление и наказание', 2),
    ('Идиот', 2),
    ('Братья Карамазовы', 2);

-- Один автор (Толстой, id=1) связан с тремя книгами
```

### Связь "Один к одному" (One-to-One)

**Редкий тип связи** — один к одному с обеих сторон.

**Пример:** Пользователь → Профиль

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL
);

CREATE TABLE user_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    bio TEXT,
    avatar_url VARCHAR(255),
    birth_date DATE
);
```

**Важно:** PRIMARY KEY на user_id гарантирует, что у одного пользователя только один профиль!

**Пример с данными:**

```sql
INSERT INTO users (username, email)
VALUES ('alice', 'alice@example.com');  -- id = 1

INSERT INTO user_profiles (user_id, bio, birth_date)
VALUES (1, 'Software developer', '1990-05-15');

-- ❌ Ошибка - у user_id=1 уже есть профиль:
INSERT INTO user_profiles (user_id, bio)
VALUES (1, 'Another bio');
```

**Когда использовать:**
- Разделение редко используемых данных (оптимизация)
- Разные уровни доступа (публичные данные vs приватные)
- Расширение существующей таблицы

### Связь "Многие ко многим" (Many-to-Many)

**Требует промежуточную таблицу!**

**Пример:** Студенты ↔ Курсы (студент может посещать много курсов, курс могут посещать много студентов)

```sql
-- Таблица студентов
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);

-- Таблица курсов
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    credits INTEGER NOT NULL
);

-- Промежуточная таблица (связующая, junction table)
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    course_id INTEGER REFERENCES courses(id),
    enrolled_at DATE DEFAULT CURRENT_DATE,
    grade VARCHAR(2),
    UNIQUE(student_id, course_id)  -- Студент не может записаться на курс дважды
);
```

**Диаграмма:**
```
students            enrollments              courses
---------           ------------             --------
id (PK)      ────→  student_id (FK)          id (PK)
name                course_id (FK)    ←────  name
email               enrolled_at              credits
                    grade
```

**Пример с данными:**

```sql
-- Студенты
INSERT INTO students (name, email) VALUES 
    ('Алиса', 'alice@university.edu'),
    ('Боб', 'bob@university.edu'),
    ('Чарли', 'charlie@university.edu');

-- Курсы
INSERT INTO courses (name, credits) VALUES 
    ('Базы данных', 4),
    ('Алгоритмы', 5),
    ('Веб-разработка', 3);

-- Записи на курсы
INSERT INTO enrollments (student_id, course_id, grade) VALUES 
    (1, 1, 'A'),   -- Алиса на "Базы данных"
    (1, 2, 'B'),   -- Алиса на "Алгоритмы"
    (2, 1, 'A'),   -- Боб на "Базы данных"
    (2, 3, 'B+'),  -- Боб на "Веб-разработка"
    (3, 2, 'C');   -- Чарли на "Алгоритмы"

-- Алиса посещает 2 курса
-- Курс "Базы данных" посещают 2 студента
```

**Другие примеры:**
- Актеры ↔ Фильмы
- Теги ↔ Статьи
- Продукты ↔ Заказы
- Пользователи ↔ Роли

---

## Каскадные операции

### ON DELETE и ON UPDATE

При создании внешнего ключа можно указать, что делать при удалении/изменении главной записи.

### ON DELETE опции

**1. CASCADE — каскадное удаление**

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total DECIMAL(10, 2)
);

-- Если удалить пользователя, все его заказы тоже удалятся
DELETE FROM users WHERE id = 1;
-- Удалятся все заказы с user_id = 1
```

**2. SET NULL — установить NULL**

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
);

-- Если удалить категорию, товары останутся, но category_id = NULL
DELETE FROM categories WHERE id = 5;
-- У товаров с category_id = 5 теперь category_id = NULL
```

**3. RESTRICT — запретить удаление (по умолчанию)**

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT
);

-- Попытка удалить категорию с товарами вызовет ошибку
DELETE FROM categories WHERE id = 1;
-- ERROR: update or delete on table "categories" violates foreign key constraint
```

**4. NO ACTION — то же, что RESTRICT (по умолчанию)**

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE NO ACTION
);
```

**5. SET DEFAULT — установить значение по умолчанию**

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER DEFAULT 1 REFERENCES categories(id) ON DELETE SET DEFAULT
);

-- При удалении категории, category_id станет 1
```

### ON UPDATE опции

Аналогично ON DELETE, но срабатывает при изменении первичного ключа:

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) 
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Если изменить id категории, он обновится и в products
UPDATE categories SET id = 100 WHERE id = 1;
-- У всех товаров category_id = 1 станет category_id = 100
```

**Примечание:** Изменение первичных ключей — плохая практика! Обычно используют ON UPDATE CASCADE только для таблиц с натуральными ключами.

### Сравнение стратегий удаления

| Стратегия | Поведение | Когда использовать |
|-----------|-----------|-------------------|
| CASCADE | Удаляет связанные записи | Зависимые данные (заказы пользователя) |
| SET NULL | Устанавливает NULL | Необязательная связь (категория товара) |
| RESTRICT | Запрещает удаление | Важные связи (нельзя удалить пока есть ссылки) |
| NO ACTION | То же что RESTRICT | По умолчанию |
| SET DEFAULT | Устанавливает значение по умолчанию | Редко используется |

### Практический пример

```sql
-- Создадим систему блога
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавим данные
INSERT INTO users (username) VALUES ('alice'), ('bob');
INSERT INTO posts (title, content, author_id) VALUES 
    ('Первый пост', 'Содержание...', 1);
INSERT INTO comments (post_id, user_id, content) VALUES 
    (1, 2, 'Отличный пост!');

-- Удалим пост
DELETE FROM posts WHERE id = 1;
-- Комментарии к посту тоже удалятся (CASCADE)

-- Удалим пользователя bob
DELETE FROM users WHERE id = 2;
-- Комментарии bob останутся, но user_id = NULL (SET NULL)
```

---

## Ограничения целостности

### UNIQUE — уникальность значений

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,  -- username должен быть уникальным
    email VARCHAR(100) UNIQUE NOT NULL     -- email тоже уникален
);

-- ✅ Работает
INSERT INTO users (username, email) VALUES ('alice', 'alice@example.com');

-- ❌ Ошибка - username уже существует
INSERT INTO users (username, email) VALUES ('alice', 'other@example.com');
```

**Составное UNIQUE ограничение:**

```sql
CREATE TABLE product_warehouses (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    warehouse_id INTEGER,
    quantity INTEGER,
    UNIQUE(product_id, warehouse_id)  -- Комбинация должна быть уникальной
);

-- ✅ Разрешено: продукт 1 на складе 1
INSERT INTO product_warehouses (product_id, warehouse_id, quantity)
VALUES (1, 1, 100);

-- ✅ Разрешено: продукт 1 на складе 2
INSERT INTO product_warehouses (product_id, warehouse_id, quantity)
VALUES (1, 2, 50);

-- ❌ Ошибка - продукт 1 уже есть на складе 1
INSERT INTO product_warehouses (product_id, warehouse_id, quantity)
VALUES (1, 1, 200);
```

### CHECK — проверка условий

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) CHECK (price > 0),  -- Цена должна быть положительной
    discount_percent INTEGER CHECK (discount_percent BETWEEN 0 AND 100),
    stock_quantity INTEGER CHECK (stock_quantity >= 0)
);

-- ❌ Ошибка - отрицательная цена
INSERT INTO products (name, price, discount_percent, stock_quantity)
VALUES ('Товар', -100, 10, 5);

-- ❌ Ошибка - скидка больше 100%
INSERT INTO products (name, price, discount_percent, stock_quantity)
VALUES ('Товар', 1000, 150, 5);
```

**Именованные CHECK ограничения:**

```sql
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INTEGER,
    salary DECIMAL(10, 2),
    CONSTRAINT check_age CHECK (age >= 18 AND age <= 100),
    CONSTRAINT check_salary CHECK (salary > 0)
);
```

**CHECK с несколькими столбцами:**

```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    start_date DATE,
    end_date DATE,
    CHECK (end_date >= start_date)  -- Конец не раньше начала
);
```

### NOT NULL — обязательное поле

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,           -- Обязательно
    order_date DATE NOT NULL,           -- Обязательно
    shipping_address TEXT,              -- Необязательно (может быть NULL)
    total DECIMAL(10, 2) NOT NULL       -- Обязательно
);
```

### DEFAULT — значение по умолчанию

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- По умолчанию 'pending'
    priority INTEGER DEFAULT 3,            -- По умолчанию 3
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_completed BOOLEAN DEFAULT FALSE
);

-- Можно не указывать status, priority, created_at, is_completed
INSERT INTO tasks (title)
VALUES ('Изучить PostgreSQL');

-- Они заполнятся автоматически:
-- status = 'pending', priority = 3, created_at = текущее время, is_completed = false
```

---

## Проектирование структуры БД

### Процесс проектирования

**Шаг 1: Определить сущности**

Какие объекты нужно хранить?
- Пользователи
- Продукты
- Заказы
- Категории

**Шаг 2: Определить атрибуты**

Какие данные о каждой сущности?
- Пользователь: имя, email, пароль, дата регистрации
- Продукт: название, цена, описание, количество

**Шаг 3: Определить связи**

Как сущности связаны друг с другом?
- Пользователь → Заказы (один ко многим)
- Заказ ↔ Продукты (многие ко многим)
- Категория → Продукты (один ко многим)

**Шаг 4: Определить ограничения**

Какие правила должны соблюдаться?
- Email уникален
- Цена > 0
- Количество >= 0

### Пример: Интернет-магазин

```sql
-- 1. Пользователи
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. Категории товаров
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- 3. Товары
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. Заказы
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Товары в заказе (связь многие-ко-многим)
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),  -- Цена на момент заказа
    UNIQUE(order_id, product_id)  -- Один товар в заказе только один раз
);

-- 6. Адреса доставки
CREATE TABLE shipping_addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_line1 VARCHAR(200) NOT NULL,
    address_line2 VARCHAR(200),
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE
);
```

### Диаграмма связей

```
users (1) ──────── (M) orders
  │                    │
  │                    │
  └─ (1) ──────── (M) shipping_addresses
                       
orders (M) ──────── (M) products
         \         /
          order_items
          
categories (1) ──── (M) products
```

### Лучшие практики проектирования

**1. Именование:**
- Таблицы: множественное число (`users`, `products`)
- Столбцы: единственное число (`user_id`, `name`)
- Внешние ключи: `<таблица>_id` (`user_id`, `category_id`)

**2. Первичные ключи:**
- Всегда используйте SERIAL или UUID
- Называйте `id` (просто и понятно)

**3. Временные метки:**
```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**4. Мягкое удаление:**
```sql
deleted_at TIMESTAMP,
is_active BOOLEAN DEFAULT TRUE
```

**5. Версионирование:**
```sql
version INTEGER DEFAULT 1
```

---

## Практическое задание

### Задание 1: Система управления библиотекой (обязательно)

Спроектируйте и реализуйте базу данных библиотеки со следующими требованиями:

**Сущности:**
1. Читатели (readers)
2. Книги (books)
3. Авторы (authors)
4. Жанры (genres)
5. Выдачи книг (loans)

**Требования:**
- У книги может быть несколько авторов
- У книги может быть несколько жанров
- Читатель может взять несколько книг
- Книга может быть в нескольких экземплярах
- Отслеживать даты выдачи и возврата

**Решение:**

```sql
CREATE DATABASE library_system;
\c library_system

-- 1. Читатели
CREATE TABLE readers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    registered_at DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. Авторы
CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    birth_year INTEGER,
    country VARCHAR(50),
    biography TEXT
);

-- 3. Жанры
CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

-- 4. Книги
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    publisher VARCHAR(100),
    publish_year INTEGER,
    pages INTEGER CHECK (pages > 0),
    total_copies INTEGER NOT NULL DEFAULT 1 CHECK (total_copies > 0),
    available_copies INTEGER NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
    CHECK (available_copies <= total_copies)
);

-- 5. Связь книги-авторы (многие-ко-многим)
CREATE TABLE book_authors (
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES authors(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, author_id)
);

-- 6. Связь книги-жанры (многие-ко-многим)
CREATE TABLE book_genres (
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, genre_id)
);

-- 7. Выдачи книг
CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    reader_id INTEGER NOT NULL REFERENCES readers(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id),
    loan_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'returned', 'overdue', 'lost')),
    CHECK (due_date > loan_date),
    CHECK (return_date IS NULL OR return_date >= loan_date)
);

-- Индексы для улучшения производительности
CREATE INDEX idx_loans_reader ON loans(reader_id);
CREATE INDEX idx_loans_book ON loans(book_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_books_isbn ON books(isbn);
```

**Заполнение данными:**

```sql
-- Жанры
INSERT INTO genres (name, description) VALUES 
    ('Роман', 'Эпическое повествование'),
    ('Детектив', 'Криминальные истории'),
    ('Фантастика', 'Научная фантастика'),
    ('Классика', 'Классическая литература');

-- Авторы
INSERT INTO authors (first_name, last_name, birth_year, country) VALUES 
    ('Лев', 'Толстой', 1828, 'Россия'),
    ('Фёдор', 'Достоевский', 1821, 'Россия'),
    ('Артур', 'Конан Дойл', 1859, 'Великобритания'),
    ('Агата', 'Кристи', 1890, 'Великобритания'),
    ('Айзек', 'Азимов', 1920, 'США');

-- Книги
INSERT INTO books (title, isbn, publisher, publish_year, pages, total_copies, available_copies) VALUES 
    ('Война и мир', '978-5-17-001', 'АСТ', 1869, 1274, 5, 5),
    ('Преступление и наказание', '978-5-17-002', 'АСТ', 1866, 671, 3, 3),
    ('Приключения Шерлока Холмса', '978-5-17-003', 'Эксмо', 1892, 307, 4, 4),
    ('Убийство в Восточном экспрессе', '978-5-17-004', 'Эксмо', 1934, 256, 2, 2),
    ('Основание', '978-5-17-005', 'АСТ', 1951, 296, 3, 3);

-- Связи книга-автор
INSERT INTO book_authors (book_id, author_id) VALUES 
    (1, 1), -- Война и мир - Толстой
    (2, 2), -- Преступление и наказание - Достоевский
    (3, 3), -- Шерлок Холмс - Конан Дойл
    (4, 4), -- Убийство в экспрессе - Кристи
    (5, 5); -- Основание - Азимов

-- Связи книга-жанр
INSERT INTO book_genres (book_id, genre_id) VALUES 
    (1, 1), (1, 4), -- Война и мир - Роман, Классика
    (2, 1), (2, 4), -- Преступление - Роман, Классика
    (3, 2),         -- Шерлок - Детектив
    (4, 2),         -- Убийство - Детектив
    (5, 3);         -- Основание - Фантастика

-- Читатели
INSERT INTO readers (first_name, last_name, email, phone) VALUES 
    ('Иван', 'Петров', 'ivan@example.com', '+79001111111'),
    ('Мария', 'Сидорова', 'maria@example.com', '+79002222222'),
    ('Алексей', 'Смирнов', 'alex@example.com', '+79003333333');

-- Выдачи книг
INSERT INTO loans (reader_id, book_id, loan_date, due_date) VALUES 
    (1, 1, CURRENT_DATE - 5, CURRENT_DATE + 9),
    (1, 3, CURRENT_DATE - 3, CURRENT_DATE + 11),
    (2, 2, CURRENT_DATE - 10, CURRENT_DATE + 4);

-- Обновить количество доступных копий
UPDATE books SET available_copies = available_copies - 1 WHERE id IN (1, 2, 3);
```

---

### Задание 2: Запросы с использованием связей (обязательно)

Напишите следующие запросы:

**1. Список всех книг с их авторами:**
```sql
SELECT 
    b.title,
    b.isbn,
    a.first_name || ' ' || a.last_name AS author_name
FROM books b
JOIN book_authors ba ON b.id = ba.book_id
JOIN authors a ON ba.author_id = a.id
ORDER BY b.title;
```

**2. Книги с их жанрами:**
```sql
SELECT 
    b.title,
    STRING_AGG(g.name, ', ') AS genres
FROM books b
JOIN book_genres bg ON b.id = bg.book_id
JOIN genres g ON bg.genre_id = g.id
GROUP BY b.id, b.title
ORDER BY b.title;
```

**3. Активные выдачи (кто какую книгу взял):**
```sql
SELECT 
    r.first_name || ' ' || r.last_name AS reader_name,
    b.title AS book_title,
    l.loan_date,
    l.due_date,
    CURRENT_DATE - l.due_date AS days_overdue
FROM loans l
JOIN readers r ON l.reader_id = r.id
JOIN books b ON l.book_id = b.id
WHERE l.status = 'active'
ORDER BY l.due_date;
```

**4. Просроченные книги:**
```sql
SELECT 
    r.first_name || ' ' || r.last_name AS reader_name,
    r.email,
    b.title,
    l.due_date,
    CURRENT_DATE - l.due_date AS days_overdue
FROM loans l
JOIN readers r ON l.reader_id = r.id
JOIN books b ON l.book_id = b.id
WHERE l.status = 'active' AND l.due_date < CURRENT_DATE
ORDER BY days_overdue DESC;
```

**5. Самые популярные книги:**
```sql
SELECT 
    b.title,
    COUNT(l.id) AS times_borrowed
FROM books b
LEFT JOIN loans l ON b.id = l.book_id
GROUP BY b.id, b.title
ORDER BY times_borrowed DESC
LIMIT 5;
```

**6. Читатели, которые никогда не брали книги:**
```sql
SELECT 
    first_name || ' ' || last_name AS reader_name,
    email
FROM readers
WHERE id NOT IN (SELECT DISTINCT reader_id FROM loans);
```

**7. Доступные книги по жанрам:**
```sql
SELECT 
    g.name AS genre,
    b.title,
    b.available_copies
FROM books b
JOIN book_genres bg ON b.id = bg.book_id
JOIN genres g ON bg.genre_id = g.id
WHERE b.available_copies > 0
ORDER BY g.name, b.title;
```

---

### Задание 3: Операции с каскадным удалением (обязательно)

Протестируйте каскадные операции:

**1. Создать тестового читателя с заказами:**
```sql
INSERT INTO readers (first_name, last_name, email)
VALUES ('Тест', 'Тестов', 'test@test.com')
RETURNING id;  -- Допустим, id = 4

INSERT INTO loans (reader_id, book_id, due_date)
VALUES (4, 5, CURRENT_DATE + 14);
```

**2. Удалить читателя (каскадно удалятся его выдачи):**
```sql
-- Проверить выдачи до удаления
SELECT * FROM loans WHERE reader_id = 4;

-- Удалить читателя
DELETE FROM readers WHERE id = 4;

-- Проверить выдачи после удаления (их не будет)
SELECT * FROM loans WHERE reader_id = 4;
```

**3. Удалить книгу (проверить ограничения):**
```sql
-- Попробовать удалить книгу, которая сейчас у читателя
DELETE FROM books WHERE id = 1;
-- Ошибка, если есть активные выдачи (зависит от настроек FK)

-- Удалить книгу без активных выдач
DELETE FROM books WHERE id = 5;
-- Успешно, и удалятся связи в book_authors и book_genres (CASCADE)
```

---

### Задание 4: Создать собственную систему (творческое)

Спроектируйте базу данных для одной из систем:

**Вариант A: Социальная сеть**
- Пользователи
- Посты
- Комментарии
- Лайки
- Друзья (подписки)
- Группы/сообщества

**Вариант B: Система курсов (онлайн-обучение)**
- Студенты
- Преподаватели
- Курсы
- Уроки
- Задания
- Оценки

**Вариант C: Ресторан (система заказов)**
- Клиенты
- Блюда
- Категории блюд
- Заказы
- Позиции заказа
- Столики
- Бронирования

**Требования к проекту:**
- Минимум 5 таблиц
- Хотя бы одна связь один-ко-многим
- Хотя бы одна связь многие-ко-многим
- Использовать все типы ограничений (PK, FK, UNIQUE, CHECK, NOT NULL, DEFAULT)
- Использовать каскадные операции
- Написать 10 запросов для работы с системой

---

## Контрольные вопросы

Проверьте себя:

1. Что такое первичный ключ и какие у него требования?
2. В чем разница между SERIAL и UUID для первичных ключей?
3. Что такое внешний ключ и зачем он нужен?
4. Объясните разницу между CASCADE, SET NULL и RESTRICT при удалении.
5. Какие три основных типа связей между таблицами?
6. Как реализовать связь многие-ко-многим?
7. Чем отличается UNIQUE от PRIMARY KEY?
8. Для чего используется CHECK ограничение?
9. Может ли внешний ключ быть NULL?
10. Что такое составной первичный ключ?
11. В чем разница между ON DELETE и ON UPDATE?
12. Почему важно использовать ограничения целостности?

<details>
<summary>Ответы</summary>

1. Первичный ключ уникально идентифицирует строку. Требования: уникальность, NOT NULL, один на таблицу.
2. SERIAL — последовательные числа (1,2,3...), UUID — глобально уникальные идентификаторы.
3. Внешний ключ создает связь с другой таблицей, обеспечивает целостность данных.
4. CASCADE удаляет связанные записи, SET NULL устанавливает NULL, RESTRICT запрещает удаление.
5. Один-к-одному, один-ко-многим, многие-ко-многим.
6. Через промежуточную (связующую) таблицу с двумя внешними ключами.
7. UNIQUE может быть несколько в таблице и может быть NULL, PRIMARY KEY только один и NOT NULL.
8. Для проверки условий (цена > 0, возраст >= 18).
9. Да, если не указан NOT NULL.
10. Первичный ключ из нескольких столбцов (например, student_id + course_id).
11. ON DELETE срабатывает при удалении, ON UPDATE — при изменении первичного ключа.
12. Они защищают данные от ошибок, обеспечивают корректность и согласованность.
</details>

---

## Типичные ошибки и их решения

### Ошибка 1: Попытка создать FK на несуществующую таблицу

```sql
-- ❌ ОШИБКА: таблица categories еще не существует
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id)
);

-- ✅ ПРАВИЛЬНО: сначала создать categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id)
);
```

### Ошибка 2: Нарушение ограничения FK при вставке

```sql
-- ❌ ОШИБКА: категории с id=99 не существует
INSERT INTO products (name, category_id)
VALUES ('Товар', 99);

-- ✅ ПРАВИЛЬНО: сначала проверить или создать категорию
INSERT INTO categories (name) VALUES ('Новая категория') RETURNING id;
-- Допустим, получили id = 1

INSERT INTO products (name, category_id)
VALUES ('Товар', 1);
```

### Ошибка 3: Попытка удалить запись с зависимостями (RESTRICT)

```sql
-- ❌ ОШИБКА: есть товары с category_id = 1
DELETE FROM categories WHERE id = 1;

-- ✅ РЕШЕНИЕ 1: сначала удалить все товары
DELETE FROM products WHERE category_id = 1;
DELETE FROM categories WHERE id = 1;

-- ✅ РЕШЕНИЕ 2: использовать CASCADE при создании FK
ALTER TABLE products
DROP CONSTRAINT products_category_id_fkey,
ADD CONSTRAINT products_category_id_fkey
    FOREIGN KEY (category_id)
    REFERENCES categories(id)
    ON DELETE CASCADE;

-- Теперь можно удалять категорию (товары удалятся автоматически)
DELETE FROM categories WHERE id = 1;
```

### Ошибка 4: Забыли про промежуточную таблицу для многие-ко-многим

```sql
-- ❌ НЕПРАВИЛЬНО: пытаемся хранить несколько значений
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    course_ids INTEGER[]  -- Массив - плохая практика для связей!
);

-- ✅ ПРАВИЛЬНО: промежуточная таблица
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE enrollments (
    student_id INTEGER REFERENCES students(id),
    course_id INTEGER REFERENCES courses(id),
    PRIMARY KEY (student_id, course_id)
);
```

### Ошибка 5: Циклические зависимости

```sql
-- ❌ ПРОБЛЕМА: таблицы ссылаются друг на друга
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    manager_id INTEGER REFERENCES employees(id)  -- employees еще не существует!
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    department_id INTEGER REFERENCES departments(id)
);

-- ✅ РЕШЕНИЕ: создать таблицы без FK, потом добавить
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    department_id INTEGER
);

-- Теперь добавить FK
ALTER TABLE employees
ADD CONSTRAINT fk_employee_department
    FOREIGN KEY (department_id)
    REFERENCES departments(id);

ALTER TABLE departments
ADD CONSTRAINT fk_department_manager
    FOREIGN KEY (manager_id)
    REFERENCES employees(id);
```

---

## Шпаргалка по ключам и связям

```sql
-- ПЕРВИЧНЫЙ КЛЮЧ
id SERIAL PRIMARY KEY
id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
PRIMARY KEY (column1, column2)  -- Составной

-- ВНЕШНИЙ КЛЮЧ
column_id INTEGER REFERENCES other_table(id)
column_id INTEGER REFERENCES other_table(id) ON DELETE CASCADE
column_id INTEGER REFERENCES other_table(id) ON DELETE SET NULL
column_id INTEGER REFERENCES other_table(id) ON DELETE RESTRICT

-- ОГРАНИЧЕНИЯ
UNIQUE
NOT NULL
CHECK (condition)
DEFAULT value

-- СВЯЗЬ ОДИН-КО-МНОГИМ
CREATE TABLE parent (id SERIAL PRIMARY KEY);
CREATE TABLE child (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES parent(id)
);

-- СВЯЗЬ МНОГИЕ-КО-МНОГИМ
CREATE TABLE table1 (id SERIAL PRIMARY KEY);
CREATE TABLE table2 (id SERIAL PRIMARY KEY);
CREATE TABLE junction (
    table1_id INTEGER REFERENCES table1(id),
    table2_id INTEGER REFERENCES table2(id),
    PRIMARY KEY (table1_id, table2_id)
);

-- СВЯЗЬ ОДИН-К-ОДНОМУ
CREATE TABLE main_table (id SERIAL PRIMARY KEY);
CREATE TABLE extension (
    main_id INTEGER PRIMARY KEY REFERENCES main_table(id)
);
```

---

## Диаграммы связей (ERD нотация)

### Обозначения:

```
(1) ────── (M)   =  один-ко-многим
(M) ────── (M)   =  многие-ко-многим (через промежуточную таблицу)
(1) ────── (1)   =  один-к-одному

PK = Primary Key
FK = Foreign Key
```

### Пример: Блог

```
users                posts               comments
------               ------              ---------
id (PK)        1─┬──→ id (PK)       1─┬──→ id (PK)
username         │    title           │    content
email            │    content         │    user_id (FK)
                 │    author_id (FK)──┘    post_id (FK)
                 │
                 └──→ (несколько постов одного автора)
```

---

## Лучшие практики

### 1. Всегда используйте первичные ключи
```sql
-- ✅ ХОРОШО
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    ...
);

-- ❌ ПЛОХО (таблица без PK)
CREATE TABLE users (
    username VARCHAR(50),
    email VARCHAR(100)
);
```

### 2. Называйте внешние ключи понятно
```sql
-- ✅ ХОРОШО
user_id, category_id, author_id

-- ❌ ПЛОХО
uid, cat_id, auth
```

### 3. Используйте каскадные операции осознанно
```sql
-- Для зависимых данных (заказы пользователя)
ON DELETE CASCADE

-- Для необязательных связей (категория товара)
ON DELETE SET NULL

-- Для важных данных (нельзя удалить пока есть ссылки)
ON DELETE RESTRICT
```

### 4. Добавляйте индексы на внешние ключи
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id)
);

-- Индекс ускорит JOIN и поиск
CREATE INDEX idx_products_category ON products(category_id);
```

### 5. Документируйте связи
```sql
-- Добавляйте комментарии к сложным связям
COMMENT ON COLUMN products.category_id IS 'Ссылка на categories.id';
COMMENT ON TABLE order_items IS 'Промежуточная таблица для связи orders и products';
```

---

## Полезные ресурсы

**Инструменты для проектирования:**
- dbdiagram.io — онлайн конструктор ERD диаграмм
- draw.io — универсальный инструмент для диаграмм
- pgAdmin — встроенный просмотр ERD

**Документация:**
- https://www.postgresql.org/docs/current/ddl-constraints.html
- https://www.postgresql.org/docs/current/tutorial-fk.html
