---
sidebar_position: 2
description: "Практические задания по типам данных PostgreSQL: числовые, строковые, временные, boolean, uuid, jsonb, массивы."
---

# Практика: Типы данных 

import { RandomVariantButton, TaskWithVariants } from "../../src/components/practicModules/practic";

Практические задания по выбору и использованию типов данных в PostgreSQL.  
Темы: numeric/integer/float, serial, varchar/text, date/timestamp/timestamptz/interval, boolean, uuid, jsonb, массивы.

## Задание 1: Числовые типы — товары и счётчики
<TaskWithVariants
  title="Задание 1: Таблица товаров"
  description="Создайте таблицу товаров с разными числовыми типами."
  variants={[
    <><p>Магазин электроники</p><p>quantity SMALLINT, views INTEGER, revenue BIGINT</p></>,
    <><p>Интернет-магазин одежды</p><p>stock SMALLINT, likes INTEGER, total_sold BIGINT</p></>,
    <><p>Книжный магазин</p><p>pages SMALLINT, rating INTEGER, isbn BIGINT</p></>,
    <><p>Продуктовый магазин</p><p>weight_grams INTEGER, pieces SMALLINT, turnover BIGINT</p></>,
  ]}
>
  <details>
      <summary>Требования</summary>
      <ul>
        <li><code>id SERIAL PRIMARY KEY</code></li>
        <li><code>name VARCHAR(150) NOT NULL</code></li>
        <li>Поле количества → <code>SMALLINT NOT NULL DEFAULT 0</code></li>
        <li>Поле просмотров/лайков → <code>INTEGER DEFAULT 0</code></li>
        <li>Поле больших сумм/счётчиков → <code>BIGINT DEFAULT 0</code></li>
        <li>Вставьте 2–3 строки и попробуйте вставить значение вне диапазона SMALLINT</li>
      </ul>
  </details>
  <details><summary>💡 Подсказка</summary><p>SMALLINT → до ~32 тыс., INTEGER → стандарт, BIGINT → миллиарды и выше</p></details>
</TaskWithVariants>

## Задание 2: Точные деньги — NUMERIC vs MONEY
<TaskWithVariants
  title="Задание 2: Финансовые операции"
  description="Сравните NUMERIC и MONEY для хранения цен."
  variants={[
    <><p>Цены в рублях (RUB)</p></>,
    <><p>Цены в евро (EUR)</p></>,
    <><p>Микс валют — только NUMERIC</p></>,
  ]}
>
  <details>
      <summary> Требования </summary>
      <p>Создайте таблицу <code>prices</code> двумя способами:</p>
      <li>Вариант A: <code>price NUMERIC(12,2)</code></li>
      <li>Вариант B: <code>price MONEY</code></li>
      <li>Вставьте значения: 1499.99, 0.1, 1234567.89</li>
      <li>Выполните <code>SELECT price * 1.2</code> — сравните результат</li>
  </details>
</TaskWithVariants>

## Задание 3: Строки — CHAR vs VARCHAR vs TEXT
<TaskWithVariants
  title="Задание 3: Каталог товаров"
  description="Сравните поведение CHAR, VARCHAR и TEXT."
  variants={[
    <><p>Коды товаров фиксированной длины</p></>,
    <><p>Названия и описания разной длины</p></>,
    <><p>Артикулы + длинные описания</p></>,
  ]}
>
  <details>
      <summary> Требования </summary>
      <ul>
        <li><code>code CHAR(8)</code></li>
        <li><code>short_name VARCHAR(60)</code></li>
        <li><code>description TEXT</code></li>
        <li>Вставьте строки разной длины</li>
        <li>Сравните <code>LENGTH(code)</code> и <code>CHAR_LENGTH(code)</code></li>
      </ul>
  </details>
  <details><summary>💡 Подсказка</summary><p>CHAR дополняет пробелами, VARCHAR и TEXT — нет</p></details>
</TaskWithVariants>

## Задание 4: Даты и время — события и логи
<TaskWithVariants
  title="Задание 4: События и метки времени"
  description="Работа с DATE, TIMESTAMP, TIMESTAMPTZ."
  variants={[
    <><p>Календарь мероприятий</p></>,
    <><p>Логи действий пользователей</p></>,
    <><p>История заказов</p></>,
  ]}
>
  <details>
      <summary>Требования</summary>
      <ul>
        <li><code>event_date DATE</code></li>
        <li><code>created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP</code></li>
        <li><code>created_at_tz TIMESTAMPTZ DEFAULT NOW()</code></li>
        <li>Вставьте несколько записей</li>
        <li>Выполните: <code>NOW() - created_at</code>, <code>created_at AT TIME ZONE 'Europe/Moscow'</code></li>
      </ul>
  </details>
  
</TaskWithVariants>

## Задание 5: Интервалы — сроки и напоминания
<TaskWithVariants
  title="Задание 5: Задачи и дедлайны"
  description="Использование INTERVAL для расчётов."
  variants={[
    <><p>Напоминания о задачах</p></>,
    <><p>Сроки доставки</p></>,
    <><p>Подписки и периоды</p></>,
  ]}
>
 <details>
     <summary>Требования</summary>
     <ul>
       <li><code>due_date TIMESTAMPTZ</code></li>
       <li><code>remind_before INTERVAL DEFAULT INTERVAL '1 day'</code></li>
       <li>Вставьте задачу на завтра + 3 дня</li>
       <li>Вычислите: <code>due_date - remind_before</code>, <code>due_date - NOW()</code></li>
       <li>Попробуйте: <code>NOW() + INTERVAL '2 weeks 3 days'</code></li>
     </ul>
 </details>
</TaskWithVariants>

## Задание 6: BOOLEAN — флаги активности
<TaskWithVariants
  title="Задание 6: Активные/избранные товары"
  description="Работа с логическим типом."
  variants={[
    <><p>Товары: активен / в наличии</p></>,
    <><p>Пользователи: подтверждён / админ</p></>,
    <><p>Заказы: оплачен / отменён</p></>,
  ]}
>
  <details>
      <summary>Требования</summary>
      <ul>
        <li><code>is_active BOOLEAN DEFAULT TRUE</code></li>
        <li><code>in_stock BOOLEAN</code></li>
        <li><code>is_featured BOOLEAN DEFAULT FALSE</code></li>
        <li>Вставьте значения разными способами: true, 't', 'yes', '1', 'y'</li>
        <li>Выберите: <code>WHERE is_active</code> и <code>WHERE NOT is_featured</code></li>
      </ul>
  </details>
</TaskWithVariants>

## Задание 7: UUID — безопасные идентификаторы
<TaskWithVariants
  title="Задание 7: Пользователи с UUID"
  description="Использование UUID вместо SERIAL."
  variants={[
    <><p>Регистрация пользователей</p></>,
    <><p>API-токены</p></>,
    <><p>Распределённая система заказов</p></>,
  ]}
>
  <details>
      <summary>Требования</summary>
      <ul>
        <li><code>CREATE EXTENSION IF NOT EXISTS "uuid-ossp";</code></li>
        <li><code>id UUID PRIMARY KEY DEFAULT uuid_generate_v4()</code></li>
        <li>Вставьте 2–3 записи без указания id</li>
        <li>Сгенерируйте вручную: <code>SELECT uuid_generate_v4();</code></li>
      </ul>
  </details>

</TaskWithVariants>

## Задание 8: JSONB — характеристики товаров
<TaskWithVariants
  title="Задание 8: Гибкие атрибуты"
  description="Хранение характеристик в JSONB."
  variants={[
    <><p>Электроника: процессор, RAM, SSD</p></>,
    <><p>Одежда: размеры, цвета, материал</p></>,
    <><p>Книги: авторы, жанры, год</p></>,
  ]}
>
  <details>
      <summary>Требования</summary>
      <ul>
        <li><code>attributes JSONB</code></li>
        <li>Вставьте 2–3 товара с разными наборами характеристик</li>
        <li>Выберите: <code>attributes->>'ram'</code>, <code>attributes->'colors'</code></li>
        <li>Найдите товары где <code>attributes ? 'cpu'</code></li>
        <li>Добавьте поле: <code>`UPDATE ... SET attributes = attributes || '{"warranty":"2 years"}'`</code></li>
      </ul>
  </details>
</TaskWithVariants>

## Задание 9: Массивы — теги и рейтинги
<TaskWithVariants
  title="Задание 9: Теги и оценки"
  description="Хранение массивов в столбцах."
  variants={[
    <><p>Теги статей</p></>,
    <><p>Оценки пользователей</p></>,
    <><p>Доступные цвета товара</p></>,
  ]}
>
  <details>
      <summary>Требования</summary>
      <ul>
        <li><code>tags TEXT[]</code> или <code>ratings INTEGER[]</code></li>
        <li>Вставьте: <code>ARRAY['sql','database','performance']</code></li>
        <li>Получите первый элемент: <code>tags[1]</code></li>
        <li>Найдите где есть тег: <code>WHERE 'performance' = ANY(tags)</code></li>
        <li>Добавьте тег: <code>array_append(tags, 'tutorial')</code></li>
      </ul>
  </details>
  
</TaskWithVariants>

## Задание 10: Комбинированное — мини-каталог
<TaskWithVariants
  title="Задание 10: Полная таблица товаров"
  description="Объедините несколько типов данных."
  variants={[
    <><p>Товары электроники</p></>,
    <><p>Товары одежды</p></>,
    <><p>Книги в магазине</p></>,
  ]}
>
   <details>
       <summary>Требования</summary>
       <ul>
         <li><code>id SERIAL PRIMARY KEY</code></li>
         <li><code>sku CHAR(10)</code></li>
         <li><code>name VARCHAR(120) NOT NULL</code></li>
         <li><code>price NUMERIC(10,2) NOT NULL</code></li>
         <li><code>stock SMALLINT DEFAULT 0</code></li>
         <li><code>created_at TIMESTAMPTZ DEFAULT NOW()</code></li>
         <li><code>is_active BOOLEAN DEFAULT TRUE</code></li>
         <li><code>tags TEXT[]</code></li>
         <li><code>attributes JSONB</code></li>
         <li>Вставьте 3–4 товара</li>
         <li>Напишите 2–3 SELECT с разными операторами</li>
       </ul>
   </details>
</TaskWithVariants>

## Дополнительные материалы
После выполнения заданий:
- Сравните размер таблиц с разными типами (pg_column_size, pg_table_size)
- Попробуйте вставить некорректные значения и изучите сообщения об ошибках
- Поэкспериментируйте с функциями строк, дат и JSONB

:::tip Совет
Ошибки приведения типов и переполнения — ваши лучшие учителя. Читайте их внимательно!
:::
