---
sidebar_position: 12
description: "В этой главе мы изучим основные команды SQL и типы данных"
---

# Итоговый проект

Поздравляем! Вы достигли финальной части курса по PostgreSQL. Эта неделя посвящена применению всех полученных знаний на практике. Мы изучим транзакции, научимся создавать резервные копии баз данных, а затем вы создадите собственный полноценный проект.

## Транзакции в PostgreSQL

Транзакция — это последовательность операций с базой данных, которая выполняется как единое целое. Либо все операции завершаются успешно, либо ни одна из них не применяется.

### Основные команды транзакций

**BEGIN** — начало транзакции
**COMMIT** — подтверждение изменений
**ROLLBACK** — отмена всех изменений в транзакции

### Практические примеры

**Пример 1: Перевод денег между счетами**

```sql
-- Начинаем транзакцию
BEGIN;

-- Снимаем деньги с одного счета
UPDATE accounts 
SET balance = balance - 1000 
WHERE account_id = 1;

-- Добавляем деньги на другой счет
UPDATE accounts 
SET balance = balance + 1000 
WHERE account_id = 2;

-- Проверяем результат
SELECT account_id, balance FROM accounts WHERE account_id IN (1, 2);

-- Если все верно, подтверждаем
COMMIT;

-- Если что-то не так, можно откатить изменения
-- ROLLBACK;
```

**Пример 2: Создание заказа с товарами**

```sql
BEGIN;

-- Создаем новый заказ
INSERT INTO orders (customer_id, order_date, total_amount)
VALUES (5, CURRENT_DATE, 0)
RETURNING order_id;

-- Предположим, получили order_id = 100

-- Добавляем товары в заказ
INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES 
    (100, 10, 2, 500),
    (100, 15, 1, 1500);

-- Обновляем общую сумму заказа
UPDATE orders 
SET total_amount = (
    SELECT SUM(quantity * price) 
    FROM order_items 
    WHERE order_id = 100
)
WHERE order_id = 100;

-- Уменьшаем количество товара на складе
UPDATE products 
SET stock_quantity = stock_quantity - 2 
WHERE product_id = 10;

UPDATE products 
SET stock_quantity = stock_quantity - 1 
WHERE product_id = 15;

COMMIT;
```

### Уровни изоляции транзакций

PostgreSQL поддерживает четыре уровня изоляции:

```sql
-- READ UNCOMMITTED (в PostgreSQL работает как READ COMMITTED)
BEGIN TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

-- READ COMMITTED (по умолчанию)
BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- REPEATABLE READ
BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- SERIALIZABLE
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

PostgreSQL поддерживает четыре стандартных уровня изоляции транзакций, определённых в SQL-стандарте: **Read Uncommitted**, **Read Committed**, **Repeatable Read** и **Serializable**. Однако из-за архитектуры многоверсионного управления конкурентным доступом (MVCC) внутренне реализованы только три уровня. В частности, **Read Uncommitted** ведёт себя точно как **Read Committed** — "грязное" чтение (dirty read) невозможно на любом уровне.

Уровни определяются через аномалии (нежелательные явления), которые они предотвращают или допускают:

- **Грязное чтение (Dirty Read)**: Чтение незафиксированных изменений другой транзакции.
- **Неповторяемое чтение (Nonrepeatable Read)**: Повторный SELECT в одной транзакции видит разные данные из-за коммита другой транзакции.
- **Фантомное чтение (Phantom Read)**: Повторный запрос видит новые строки, вставленные и зафиксированные другой транзакцией.
- **Аномалия сериализации (Serialization Anomaly)**: Результат параллельных транзакций не соответствует никакому последовательному выполнению.

#### Таблица аномалий в PostgreSQL

| Уровень изоляции     | Грязное чтение | Неповторяемое чтение | Фантомное чтение          | Аномалия сериализации |
|----------------------|----------------|----------------------|---------------------------|-----------------------|
| Read Uncommitted    | Невозможно (эквивалент Read Committed) | Возможно            | Возможно                 | Возможно             |
| Read Committed      | Невозможно    | Возможно            | Возможно                 | Возможно             |
| Repeatable Read     | Невозможно    | Невозможно          | Невозможно (строже стандарта) | Возможно             |
| Serializable        | Невозможно    | Невозможно          | Невозможно               | Невозможно           |

> **Read Committed** — уровень по умолчанию в PostgreSQL.

#### Подробное описание уровней

1. **Read Committed** (Чтение зафиксированных данных)  
   Каждый запрос SELECT видит снимок базы на момент начала **запроса** (не транзакции).  
   - Видит только зафиксированные данные.  
   - Не видит незафиксированные изменения или изменения, зафиксированные во время выполнения запроса.  
   - Возможны неповторяемое и фантомное чтение (разные SELECT в одной транзакции могут видеть разные данные).  
   - Подходит для большинства приложений: баланс между производительностью и согласованностью.

2. **Repeatable Read** (Повторяемое чтение)  
   Транзакция видит снимок базы на момент начала **первого запроса** в транзакции.  
   - Все SELECT в транзакции видят одинаковые данные (нет неповторяемого чтения).  
   - В PostgreSQL также предотвращает фантомное чтение (строже SQL-стандарта).  
   - Если другая транзакция обновит прочитанные строки, текущая транзакция откатывается с ошибкой сериализации. Приложение должно повторить транзакцию.

3. **Serializable** (Сериализуемость)  
   Самый строгий уровень: гарантирует, что результат параллельных транзакций эквивалентен их последовательному выполнению.  
   - Предотвращает все аномалии, включая аномалии сериализации (например, write skew).  
   - Реализован через Serializable Snapshot Isolation (SSI) с предикатными блокировками (SIReadLock).  
   - При обнаружении конфликта одна из транзакций откатывается с ошибкой "could not serialize access...". Приложение **обязано** обрабатывать такие ошибки и повторять транзакцию.  
   - Рекомендуется только для сложных случаев, где нужна строгая согласованность, так как может снижать производительность.

Уровень нельзя изменить после первого запроса или модификации данных в транзакции.

PostgreSQL предоставляет более строгие гарантии, чем требует стандарт SQL, особенно на уровнях Repeatable Read и Serializable. Для большинства приложений достаточно Read Committed. Serializable уровни используйте осторожно, с обработкой ошибок сериализации.

### Savepoints (точки сохранения)

Позволяют откатить часть транзакции без отмены всей транзакции:

```sql
BEGIN;

INSERT INTO logs (message) VALUES ('Начало обработки');

SAVEPOINT before_update;

UPDATE products SET price = price * 1.1;

-- Если что-то пошло не так, откатываем только UPDATE
ROLLBACK TO SAVEPOINT before_update;

-- Но INSERT остается
INSERT INTO logs (message) VALUES ('Обновление отменено');

COMMIT;
```

## Резервное копирование и восстановление

Резервное копирование критически важно для защиты данных. PostgreSQL предоставляет мощные инструменты для создания и восстановления резервных копий.

### pg_dump — создание резервной копии

**Основной синтаксис:**

```bash
pg_dump -U username -d database_name > backup.sql
```

**Примеры использования:**

```bash
# Простая текстовая копия
pg_dump -U postgres -d mystore > mystore_backup.sql

# Копия в пользовательском формате (сжатая, быстрее восстанавливается)
pg_dump -U postgres -d mystore -F c -f mystore_backup.dump

# Копия только структуры (без данных)
pg_dump -U postgres -d mystore --schema-only > schema_only.sql

# Копия только данных (без структуры)
pg_dump -U postgres -d mystore --data-only > data_only.sql

# Копия конкретной таблицы
pg_dump -U postgres -d mystore -t products > products_backup.sql

# Копия с указанием хоста и порта
pg_dump -h localhost -p 5432 -U postgres -d mystore > backup.sql
```

### pg_dumpall — копия всех баз данных

```bash
# Копия всех баз данных на сервере
pg_dumpall -U postgres > all_databases_backup.sql

# Только глобальные объекты (роли, табличные пространства)
pg_dumpall -U postgres --globals-only > globals.sql
```

### pg_restore — восстановление из резервной копии

**Для текстовых файлов (SQL):**

```bash
# Восстановление из SQL файла
psql -U postgres -d mystore < mystore_backup.sql

# Создание новой БД и восстановление
createdb -U postgres mystore_restored
psql -U postgres -d mystore_restored < mystore_backup.sql
```

**Для бинарных файлов (custom format):**

```bash
# Восстановление из custom format
pg_restore -U postgres -d mystore mystore_backup.dump

# Восстановление с очисткой существующих объектов
pg_restore -U postgres -d mystore --clean mystore_backup.dump

# Восстановление только конкретной таблицы
pg_restore -U postgres -d mystore -t products mystore_backup.dump

# Создание новой БД и восстановление
createdb -U postgres mystore_restored
pg_restore -U postgres -d mystore_restored mystore_backup.dump
```

### Автоматизация резервного копирования

**Bash скрипт для ежедневного бэкапа:**

```bash
#!/bin/bash

# Параметры
DB_NAME="mystore"
DB_USER="postgres"
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_$DATE.dump"

# Создаем директорию, если её нет
mkdir -p $BACKUP_DIR

# Создаем резервную копию
pg_dump -U $DB_USER -d $DB_NAME -F c -f $BACKUP_FILE

# Удаляем бэкапы старше 7 дней
find $BACKUP_DIR -name "*.dump" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

## Итоговый проект: Варианты систем

Выберите одну из предложенных систем и создайте для неё полноценную базу данных:

### Вариант 1: Библиотека

**Основные сущности:**
- Книги
- Авторы
- Издательства
- Читатели
- Выдачи книг
- Бронирования
- Жанры
- Штрафы за просрочку

### Вариант 2: Клиника

**Основные сущности:**
- Пациенты
- Врачи
- Специализации врачей
- Приёмы (записи на прием)
- Диагнозы
- Назначения и лечение
- Медицинские карты
- Расписание врачей

### Вариант 3: Образовательная платформа

**Основные сущности:**
- Студенты
- Преподаватели
- Курсы
- Уроки/модули
- Задания
- Сдачи заданий
- Оценки
- Прогресс студентов

### Вариант 4: Система управления проектами

**Основные сущности:**
- Пользователи
- Проекты
- Задачи
- Комментарии к задачам
- Теги/метки
- Файлы и документы
- История изменений
- Время работы над задачами

## Требования к итоговому проекту

Ваш проект должен включать:

### Структура базы данных

- Минимум 6-8 связанных таблиц
- Правильно определенные первичные ключи
- Внешние ключи для связей между таблицами
- Подходящие типы данных для каждого поля
- Ограничения (CHECK, UNIQUE, NOT NULL)

### Индексы

- Индексы на внешних ключах
- Индексы на часто используемых полях для поиска
- Составные индексы где это необходимо
- Комментарии, объясняющие необходимость индексов

### Представления (Views)

- Минимум 2-3 представления для упрощения часто используемых запросов
- Представления с агрегацией данных

### Функции и триггеры

- Минимум 1-2 пользовательские функции
- Минимум 1-2 триггера для автоматизации

### Тестовые данные

- Минимум 10-20 записей в основных таблицах
- Связанные данные, имитирующие реальную работу системы

### Сложные запросы

Минимум 5 запросов, демонстрирующих:
- JOIN нескольких таблиц
- Подзапросы
- Агрегатные функции с GROUP BY
- Оконные функции
- CTE (WITH)

### Транзакции

- Примеры критических операций в транзакциях
- Демонстрация ROLLBACK при ошибке

### Резервное копирование

- Скрипт для создания резервной копии
- Инструкция по восстановлению

## Пример структуры проекта: Интернет-магазин

Давайте разработаем полноценный пример для интернет-магазина:

### Создание структуры базы данных

```sql
-- Создание базы данных
CREATE DATABASE online_store;

-- Подключаемся к базе
\c online_store

-- Таблица категорий товаров
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    parent_category_id INTEGER REFERENCES categories(category_id),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица производителей
CREATE TABLE manufacturers (
    manufacturer_id SERIAL PRIMARY KEY,
    manufacturer_name VARCHAR(100) NOT NULL UNIQUE,
    country VARCHAR(50),
    website VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица товаров
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(category_id),
    manufacturer_id INTEGER REFERENCES manufacturers(manufacturer_id),
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица клиентов
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Таблица адресов доставки
CREATE TABLE delivery_addresses (
    address_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    address_name VARCHAR(50),
    country VARCHAR(50) NOT NULL,
    city VARCHAR(100) NOT NULL,
    street VARCHAR(200) NOT NULL,
    building VARCHAR(20) NOT NULL,
    apartment VARCHAR(20),
    postal_code VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заказов
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
    address_id INTEGER REFERENCES delivery_addresses(address_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'unpaid'
        CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    notes TEXT
);

-- Таблица товаров в заказе
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(product_id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * price_at_purchase) STORED
);

-- Таблица отзывов
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    UNIQUE(product_id, customer_id)
);

-- Таблица истории цен
CREATE TABLE price_history (
    history_id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    old_price NUMERIC(10, 2),
    new_price NUMERIC(10, 2) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Создание индексов

```sql
-- Индексы для внешних ключей
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_manufacturer ON products(manufacturer_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);

-- Индексы для поиска и фильтрации
CREATE INDEX idx_products_name ON products(product_name);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_customers_email ON customers(email);

-- Составной индекс для активных товаров в категории
CREATE INDEX idx_products_category_active ON products(category_id, is_active) 
WHERE is_active = TRUE;
```

### Создание представлений

```sql
-- Представление: Товары с информацией о категории и производителе
CREATE VIEW v_products_full AS
SELECT 
    p.product_id,
    p.product_name,
    p.price,
    p.stock_quantity,
    c.category_name,
    m.manufacturer_name,
    m.country AS manufacturer_country,
    COALESCE(AVG(r.rating), 0) AS average_rating,
    COUNT(r.review_id) AS review_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.category_id
LEFT JOIN manufacturers m ON p.manufacturer_id = m.manufacturer_id
LEFT JOIN reviews r ON p.product_id = r.product_id
WHERE p.is_active = TRUE
GROUP BY p.product_id, p.product_name, p.price, p.stock_quantity, 
         c.category_name, m.manufacturer_name, m.country;

-- Представление: Детали заказов
CREATE VIEW v_order_details AS
SELECT 
    o.order_id,
    o.order_date,
    o.status,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.email AS customer_email,
    COUNT(oi.order_item_id) AS items_count,
    o.total_amount,
    o.payment_status
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id, o.order_date, o.status, c.first_name, c.last_name, 
         c.email, o.total_amount, o.payment_status;

-- Представление: Статистика по клиентам
CREATE VIEW v_customer_statistics AS
SELECT 
    c.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.email,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(o.total_amount), 0) AS total_spent,
    COALESCE(AVG(o.total_amount), 0) AS average_order_value,
    MAX(o.order_date) AS last_order_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id, c.first_name, c.last_name, c.email;
```

### Создание функций

```sql
-- Функция: Проверка наличия товара на складе
CREATE OR REPLACE FUNCTION check_product_availability(
    p_product_id INTEGER,
    p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_stock INTEGER;
BEGIN
    SELECT stock_quantity INTO v_stock
    FROM products
    WHERE product_id = p_product_id AND is_active = TRUE;
    
    RETURN v_stock >= p_quantity;
END;
$$ LANGUAGE plpgsql;

-- Функция: Расчет скидки на основе истории покупок клиента
CREATE OR REPLACE FUNCTION calculate_customer_discount(
    p_customer_id INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
    v_total_spent NUMERIC;
    v_discount NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_spent
    FROM orders
    WHERE customer_id = p_customer_id 
    AND payment_status = 'paid';
    
    IF v_total_spent >= 10000 THEN
        v_discount := 15;
    ELSIF v_total_spent >= 5000 THEN
        v_discount := 10;
    ELSIF v_total_spent >= 1000 THEN
        v_discount := 5;
    END IF;
    
    RETURN v_discount;
END;
$$ LANGUAGE plpgsql;

-- Функция: Получение топ продуктов по продажам
CREATE OR REPLACE FUNCTION get_top_selling_products(
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    product_id INTEGER,
    product_name VARCHAR,
    total_sold BIGINT,
    revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.product_id,
        p.product_name,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.subtotal) AS revenue
    FROM products p
    JOIN order_items oi ON p.product_id = oi.product_id
    JOIN orders o ON oi.order_id = o.order_id
    WHERE o.status = 'delivered'
    GROUP BY p.product_id, p.product_name
    ORDER BY total_sold DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

### Создание триггеров

```sql
-- Триггер: Обновление updated_at при изменении товара
CREATE OR REPLACE FUNCTION update_product_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_product_timestamp
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_product_timestamp();

-- Триггер: Сохранение истории цен при изменении цены товара
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.price IS DISTINCT FROM NEW.price THEN
        INSERT INTO price_history (product_id, old_price, new_price)
        VALUES (NEW.product_id, OLD.price, NEW.price);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_price_change
AFTER UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION log_price_change();

-- Триггер: Обновление общей суммы заказа
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders
    SET total_amount = (
        SELECT COALESCE(SUM(subtotal), 0)
        FROM order_items
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    )
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_order_total_insert
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

CREATE TRIGGER trg_update_order_total_update
AFTER UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

CREATE TRIGGER trg_update_order_total_delete
AFTER DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

-- Триггер: Уменьшение количества товара на складе при оформлении заказа
CREATE OR REPLACE FUNCTION decrease_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE product_id = NEW.product_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product % not found', NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrease_stock
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION decrease_stock_on_order();
```

### Заполнение тестовыми данными

```sql
-- Добавление категорий
INSERT INTO categories (category_name, description) VALUES
('Электроника', 'Электронные устройства и гаджеты'),
('Компьютеры', 'Компьютеры и комплектующие'),
('Смартфоны', 'Мобильные телефоны и аксессуары'),
('Бытовая техника', 'Техника для дома'),
('Одежда', 'Одежда и обувь');

-- Добавление производителей
INSERT INTO manufacturers (manufacturer_name, country, website) VALUES
('Apple', 'США', 'https://www.apple.com'),
('Samsung', 'Южная Корея', 'https://www.samsung.com'),
('Sony', 'Япония', 'https://www.sony.com'),
('LG', 'Южная Корея', 'https://www.lg.com'),
('Dell', 'США', 'https://www.dell.com');

-- Добавление товаров
INSERT INTO products (product_name, category_id, manufacturer_id, description, price, stock_quantity) VALUES
('iPhone 15 Pro', 3, 1, 'Флагманский смартфон Apple', 89990.00, 50),
('MacBook Pro 16', 2, 1, 'Ноутбук для профессионалов', 249990.00, 20),
('Samsung Galaxy S24', 3, 2, 'Топовый смартфон Samsung', 79990.00, 45),
('Sony PlayStation 5', 1, 3, 'Игровая консоль нового поколения', 54990.00, 30),
('LG OLED TV 55"', 4, 4, 'OLED телевизор 55 дюймов', 119990.00, 15),
('Dell XPS 15', 2, 5, 'Мощный ультрабук', 149990.00, 25),
('AirPods Pro', 1, 1, 'Беспроводные наушники с шумоподавлением', 24990.00, 100),
('Samsung Galaxy Watch', 1, 2, 'Умные часы', 29990.00, 60);

-- Добавление клиентов
INSERT INTO customers (email, password_hash, first_name, last_name, phone, date_of_birth) VALUES
('ivan.petrov@example.com', 'hash1', 'Иван', 'Петров', '+79161234567', '1990-05-15'),
('maria.sidorova@example.com', 'hash2', 'Мария', 'Сидорова', '+79167654321', '1985-08-22'),
('alex.ivanov@example.com', 'hash3', 'Александр', 'Иванов', '+79169876543', '1992-03-10'),
('elena.kozlova@example.com', 'hash4', 'Елена', 'Козлова', '+79165432109', '1988-11-30');

-- Добавление адресов
INSERT INTO delivery_addresses (customer_id, address_name, country, city, street, building, apartment, postal_code, is_default) VALUES
(1, 'Дом', 'Россия', 'Москва', 'Тверская', '10', '25', '125009', TRUE),
(2, 'Работа', 'Россия', 'Санкт-Петербург', 'Невский проспект', '20', '15', '191025', TRUE),
(3, 'Дом', 'Россия', 'Москва', 'Арбат', '5', '8', '119019', TRUE),
(4, 'Дом', 'Россия', 'Екатеринбург', 'Ленина', '30', '42', '620014', TRUE);

-- Добавление заказов с транзакциями
BEGIN;

-- Заказ 1
INSERT INTO orders (customer_id, address_id, status, payment_method, payment_status) 
VALUES (1, 1, 'delivered', 'card', 'paid');

INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
(1, 1, 1, 89990.00),
(1, 7, 1, 24990.00);

-- Заказ 2
INSERT INTO orders (customer_id, address_id, status, payment_method, payment_status) 
VALUES (2, 2, 'processing', 'card', 'paid');

INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
(2, 5, 1, 119990.00);

-- Заказ 3
INSERT INTO orders (customer_id, address_id, status, payment_method, payment_status) 
VALUES (3, 3, 'delivered', 'cash', 'paid');

INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
(3, 4, 1, 54990.00),
(3, 8, 1, 29990.00);

COMMIT;

-- Добавление отзывов
INSERT INTO reviews (product_id, customer_id, rating, review_text, is_verified_purchase) VALUES
(1, 1, 5, 'Отличный телефон, камера супер!', TRUE),
(4, 3, 5, 'Лучшая консоль! Графика невероятная', TRUE),
(5, 2, 4, 'Хороший телевизор, но дорогой', TRUE),
(7, 1, 5, 'Удобные наушники, отличное шумоподавление', TRUE);
```

### Примеры сложных запросов

```sql
-- Запрос 1: Топ-5 клиентов по сумме покупок с деталями
SELECT 
    c.customer_id,
    c.first_name || ' ' || c.last_name AS customer_name,
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(o.total_amount) AS total_spent,
    AVG(o.total_amount) AS avg_order_value,
    MAX(o.order_date) AS last_purchase_date,
    calculate_customer_discount(c.customer_id) AS discount_percent
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.payment_status = 'paid'
GROUP BY c.customer_id, c.first_name, c.last_name
ORDER BY total_spent DESC
LIMIT 5
