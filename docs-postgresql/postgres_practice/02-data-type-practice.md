---
sidebar_position: 2
description: "Практика по типам данных PostgreSQL: числовые, строковые, временные, boolean, uuid, jsonb, массивы"
---

import { RandomVariantButton, TaskWithVariants, CodeBlockPostgres } from "../../src/components/practicModules/practic";

# Практика: Типы данных в PostgreSQL

<CodeBlockPostgres />

## Задание 1 — Числовые типы: счётчики и точные суммы

<TaskWithVariants
  taskId="types-1-numeric"
  title="Задание 1: Числовые типы — счётчики и деньги"
  difficulty={["Лёгкий","Лёгкий","Лёгкий","Лёгкий","Лёгкий","Лёгкий","Средний","Средний","Средний","Средний","Средний","Средний"]}
  estimatedTime="10-15 минут"
  description="Создай таблицу с разными числовыми типами и протестируй диапазоны."
  variants={[
    "Магазин электроники: количество, просмотры, выручка",
    "Блог: просмотры, лайки, комментарии",
    "Склад: остаток, вес, общая стоимость",
    "Фитнес-клуб: абонементы, посещения, доход",
    "Библиотека: количество книг, страниц, ISBN",
    "Онлайн-курсы: студентов, уроков, заработок",
    "Кафе: порций, калорий, выручка",
    "Автосалон: машины в наличии, пробег, цена",
    "Игровой сервер: игроков онлайн, очков, донат",
    "Медицинская картотека: пациентов, визитов, стоимость",
    "Кинотеатр: билетов продано, залов, сборы",
    "Музыкальный сервис: треков, прослушиваний, доход",
  ]}
>
  **Пример полей:**
  - `id SERIAL PRIMARY KEY`
  - `name VARCHAR(100) NOT NULL`
  - `quantity SMALLINT DEFAULT 0 CHECK (quantity >= 0)`
  - `views_count INTEGER DEFAULT 0`
  - `total_revenue BIGINT DEFAULT 0` (или `NUMERIC(15,2)`)

  **Требования:**
  - Вставь 3–4 записи
  - Попробуй вставить >32767 в SMALLINT → посмотри ошибку

  Пример:
  ```sql
  INSERT INTO products (name, quantity, views_count, total_revenue)
  VALUES ('Ноутбук', 150, 4500, 124500000);
  ```
</TaskWithVariants>

## Задание 2 — Точные деньги: NUMERIC vs MONEY

<TaskWithVariants
  taskId="types-2-money"
  title="Задание 2: Точные суммы — NUMERIC и MONEY"
  difficulty={["Лёгкий","Лёгкий","Лёгкий","Лёгкий","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний"]}
  estimatedTime="10-15 минут"
  description="Сравни NUMERIC и MONEY на примерах цен."
  variants={[
    "Цены в рублях (RUB)",
    "Цены в евро (EUR)",
    "Цены в долларах (USD)",
    "Микс валют — только NUMERIC",
    "Цены с налогом (20%)",
    "Цены со скидкой (до 2 знаков)",
    "Мелкие суммы (копейки)",
    "Большие суммы (миллионы)",
    "Цены с 4 знаками после запятой (для крипты)",
    "Продукты питания (граммы и рубли)",
    "Аренда помещений (тысячи в месяц)",
    "Билеты на мероприятия",
  ]}
>
  **Требования:**
  - Создай две таблицы: `prices_numeric` и `prices_money`
  - В обе: `id SERIAL PK, item VARCHAR(100), price NUMERIC(12,4)` / `price MONEY`
  - Вставь: 1499.99, 0.1, 1234567.89, 0.3333
  - Выполни: `SELECT price * 1.2` → сравни точность
  - Сделай вывод: почему NUMERIC лучше для денег

  Пример:
  ```sql
  SELECT price * 1.2 FROM prices_numeric;  -- точный результат
  SELECT price * 1.2 FROM prices_money;    -- может быть округление
  ```
</TaskWithVariants>

## Задание 3 — Строки: CHAR vs VARCHAR vs TEXT

<TaskWithVariants
  taskId="types-3-strings"
  title="Задание 3: Строки разной длины"
  difficulty={["Лёгкий","Лёгкий","Лёгкий","Лёгкий","Лёгкий","Средний","Средний","Средний","Средний","Средний","Средний","Средний"]}
  estimatedTime="10-15 минут"
  description="Сравни поведение CHAR, VARCHAR и TEXT."
  variants={[
    "Коды товаров фиксированной длины",
    "Артикулы и названия",
    "Описания и комментарии",
    "Короткие слоганы и длинные тексты",
    "Штрих-коды и характеристики",
    "Логин и био пользователя",
    "Названия файлов и содержимое",
    "Коды стран и полные адреса",
    "Хэштеги и посты",
    "Серийные номера и заметки",
    "Модели и спецификации",
    "Коды валют и описания",
  ]}
>
  **Пример полей:**
  - `code CHAR(10)`
  - `short_name VARCHAR(80)`
  - `description TEXT`
  
  **Требования:**
  - Вставь строки разной длины
  - Сравни `LENGTH(code)`, `CHAR_LENGTH(code)`, `OCTET_LENGTH(code)`
  - Покажи разницу в поведении CHAR (дополнение пробелами)

  Пример:
  ```sql
  INSERT INTO items (code, short_name, description)
  VALUES ('ABC123    ', 'Ноутбук', 'Длинное описание...');
  SELECT code, LENGTH(code), CHAR_LENGTH(code) FROM items;
  ```
</TaskWithVariants>

## Задание 4 — Даты и время: события и логи

<TaskWithVariants
  taskId="types-4-datetime"
  title="Задание 4: Даты, время и метки"
  difficulty={["Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний"]}
  estimatedTime="15-20 минут"
  description="Работа с DATE, TIME, TIMESTAMP, TIMESTAMPTZ."
  variants={[
    "Календарь мероприятий",
    "Логи входа пользователей",
    "История заказов",
    "Расписание уроков",
    "Даты публикаций статей",
    "Время начала трансляций",
    "Сроки доставки",
    "Даты рождения и регистрации",
    "Временные метки задач",
    "История изменений цен",
    "Даты бронирований",
    "Время создания постов",
  ]}
>
  **Пример полей:**
  - `event_date DATE`
  - `start_time TIME`
  - `created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
  - `logged_at TIMESTAMPTZ DEFAULT NOW()`
  
  **Требования:**
  - Вставь 3–4 записи
  - Выполни:
    - `NOW() - created_at`
    - `logged_at AT TIME ZONE 'Europe/Moscow'`
    - `DATE_TRUNC('day', logged_at)`

  Пример:
  ```sql
  SELECT logged_at, logged_at AT TIME ZONE 'UTC' FROM logs;
  ```
</TaskWithVariants>

## Задание 5 — INTERVAL: сроки и дедлайны

<TaskWithVariants
  taskId="types-5-interval"
  title="Задание 5: Интервалы и напоминания"
  difficulty={["Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний"]}
  estimatedTime="15-20 минут"
  description="Используй INTERVAL для расчётов сроков."
  variants={[
    "Напоминания о задачах",
    "Сроки доставки заказов",
    "Периоды подписки",
    "Дедлайны проектов",
    "Сроки гарантии товаров",
    "Время действия промокодов",
    "Периодичность отчётов",
    "Сроки оплаты счетов",
    "Время хранения логов",
    "Период действия сертификатов",
    "Сроки возврата товаров",
    "Время действия акций",
  ]}
>
  **Пример полей:**
  - `due_date TIMESTAMPTZ`
  - `remind_before INTERVAL DEFAULT INTERVAL '3 days'`
  - `duration INTERVAL`
  
  **Требования:**
  - Вставь 3 записи
  - Вычисли:
    - `due_date - remind_before`
    - `NOW() + INTERVAL '2 weeks 3 days'`
    - `AGE(due_date)`

  Пример:
  ```sql
  SELECT due_date, due_date - remind_before AS remind_at FROM tasks;
  ```
</TaskWithVariants>

## Задание 6 — BOOLEAN и UUID: флаги и безопасные ID

<TaskWithVariants
  taskId="types-6-bool-uuid"
  title="Задание 6: Флаги и UUID"
  difficulty={["Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний"]}
  estimatedTime="15-20 минут"
  description="Комбинируй BOOLEAN и UUID."
  variants={[
    "Пользователи: активен/админ + UUID",
    "Товары: в наличии/акция + UUID",
    "Задачи: завершена/приоритет + UUID",
    "Заказы: оплачен/отменён + UUID",
    "Посты: опубликован/закреплён + UUID",
    "События: прошло/будет + UUID",
    "Аккаунты: подтверждён/заблокирован + UUID",
    "Роли: активна/системная + UUID",
    "Сессии: жива/истекла + UUID",
    "Промокоды: активен/использован + UUID",
    "Отзывы: одобрен/спам + UUID",
    "Подписки: активна/отменена + UUID",
  ]}
>
  **Пример полей:**
  - `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
  - `is_active BOOLEAN DEFAULT TRUE`
  - `is_admin / is_featured BOOLEAN DEFAULT FALSE`

  **Требования:**
  - `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
  - Вставь 3–4 записи без указания id
  - Сгенерируй UUID вручную: `SELECT uuid_generate_v4();`

  Пример:
  ```sql
  INSERT INTO users (username, is_active) VALUES ('andrey', TRUE);
  ```
</TaskWithVariants>

## Задание 7 — JSONB: гибкие характеристики

<TaskWithVariants
  taskId="types-7-jsonb"
  title="Задание 7: Характеристики в JSONB"
  difficulty={["Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний"]}
  estimatedTime="20-25 минут"
  description="Храни разные свойства товаров в JSONB."
  variants={[
    "Электроника: cpu, ram, ssd",
    "Одежда: sizes, colors, material",
    "Книги: authors, genres, pages",
    "Автомобили: engine, year, mileage",
    "Мебель: dimensions, material, color",
    "Косметика: volume, ingredients",
    "Игрушки: age_range, material",
    "Продукты: weight, expiration_date",
    "Спортивные товары: size, weight",
    "Подарки: occasion, wrap_type",
    "Канцелярия: color, quantity",
    "Зоотовары: pet_type, weight",
  ]}
>
  **Пример полей:**
  - `attributes JSONB`
  
  **Требования:**  
  - Вставь 3–4 товара с разными наборами ключей
  - Выполни:
    - `attributes->>'ram'`
    - `attributes ? 'cpu'`
    - `UPDATE ... SET attributes = attributes || '{"warranty":"2 years"}'`
    - `attributes->'sizes'->0` (первый размер)

  Пример:
  ```sql
  INSERT INTO products (name, attributes)
  VALUES ('Ноутбук', '{"brand":"Dell", "ram":16, "ssd":512}');
  ```
</TaskWithVariants>

## Задание 8 — Массивы: теги, рейтинги, цвета

<TaskWithVariants
  taskId="types-8-arrays"
  title="Задание 8: Массивы в столбцах"
  difficulty={["Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний","Средний"]}
  estimatedTime="15-20 минут"
  description="Храни списки в массивах."
  variants={[
    "Теги статей",
    "Оценки пользователей",
    "Цвета товара",
    "Размеры одежды",
    "Ингредиенты блюда",
    "Жанры фильма",
    "Доступные языки",
    "Социальные сети профиля",
    "Дни доставки",
    "Возрастные ограничения",
    "Материалы изделия",
    "Дополнительные опции",
  ]}
>
  **Примеры полей:**
  - `tags TEXT[]`
  - `ratings INTEGER[]`
  - `colors VARCHAR(50)[]`

  **Требования:**  
  - Выполни:
    - `tags[1]`
    - `'performance' = ANY(tags)`
    - `array_append(tags, 'advanced')`
    - `array_length(tags, 1)`

  Пример:
  ```sql
  INSERT INTO articles (title, tags)
  VALUES ('PostgreSQL', ARRAY['sql','database','performance']);
  ```
</TaskWithVariants>

## Задание 9 — Комбинированное: полная таблица товаров

<TaskWithVariants
  taskId="types-9-full-product"
  title="Задание 9: Полная таблица товаров (итоговое)"
  difficulty={["Сложный","Сложный","Сложный","Сложный","Сложный","Сложный","Сложный","Сложный","Сложный","Сложный","Сложный","Сложный"]}
  estimatedTime="25-35 минут"
  description="Объедини разные типы в одной таблице."
  variants={[
    "Электроника",
    "Одежда",
    "Книги",
    "Мебель",
    "Косметика",
    "Зоотовары",
    "Спортивные товары",
    "Продукты",
    "Игрушки",
    "Подарки",
    "Канцелярия",
    "Автотовары",
  ]}
>
  **Примеры полей:**
  - `id SERIAL PRIMARY KEY`
  - `sku CHAR(12)`
  - `name VARCHAR(150) NOT NULL`
  - `price NUMERIC(12,2) CHECK (price > 0)`
  - `stock SMALLINT DEFAULT 0 CHECK (stock >= 0)`
  - `created_at TIMESTAMPTZ DEFAULT NOW()`
  - `is_active BOOLEAN DEFAULT TRUE`
  - `tags TEXT[]`
  - `attributes JSONB`
  
  **Требования:**  
  - Вставь 4–5 товаров
  - Покажи 2–3 SELECT с разными типами

  Пример:
  ```sql
  INSERT INTO products (name, price, tags, attributes)
  VALUES ('Смартфон', 49990.00, ARRAY['новинка','акция'], '{"ram":8, "storage":256}');
  ```
</TaskWithVariants>

:::tip
Ошибки переполнения, приведения типов и нарушения CHECK — твои лучшие друзья.  
Читай их внимательно — они всегда объясняют, что именно пошло не так.
:::
