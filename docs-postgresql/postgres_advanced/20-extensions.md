---
id: module-20-extension
title: "Расширения PostgreSQL: PostGIS, pg_stat_statements, pgcrypto"
sidebar_label: "Расширения PostgreSQL"
sidebar_position: 20
description: "Расширения PostgreSQL: PostGIS, pg_stat_statements, pgcrypto"
keywords: [postgresql, extensions, postgis, pgs_stat_statements, pgcrypto]
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Расширения PostgreSQL: PostGIS, pg_stat_statements, pgcrypto

:::info Цели урока
После прохождения этого урока вы будете уметь:
- Понимать архитектуру расширений PostgreSQL и управлять ими
- Работать с геопространственными данными через **PostGIS**
- Анализировать производительность запросов с помощью **pg_stat_statements**
- Реализовывать криптографические операции через **pgcrypto**
- Применять расширения в реальных проектах
:::

---

## 1. Введение: система расширений PostgreSQL

PostgreSQL — одна из немногих СУБД, которая была спроектирована с фундаментальной поддержкой расширяемости. Расширения (extensions) позволяют добавлять новые типы данных, функции, операторы, индексы и даже языки программирования без модификации ядра СУБД.

### 1.1. Что такое расширение?

Расширение — это пакет SQL-объектов (функций, типов, операторов, таблиц), объединённых под одним именем и версией. Расширение может включать скомпилированные C-библиотеки, SQL-скрипты миграций и метаданные.

### 1.2. Управление расширениями

Базовые команды для работы с расширениями:

```sql
-- Просмотр всех доступных расширений в системе
SELECT * FROM pg_available_extensions ORDER BY name;

-- Просмотр установленных расширений в текущей базе
SELECT * FROM pg_extension;

-- Более подробная информация
SELECT
    e.extname        AS "Расширение",
    e.extversion     AS "Версия",
    n.nspname        AS "Схема",
    e.extrelocatable AS "Перемещаемое"
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
ORDER BY e.extname;

-- Установка расширения
CREATE EXTENSION IF NOT EXISTS имя_расширения;

-- Обновление расширения до последней версии
ALTER EXTENSION имя_расширения UPDATE;

-- Обновление до конкретной версии
ALTER EXTENSION имя_расширения UPDATE TO '2.0';

-- Удаление расширения
DROP EXTENSION IF EXISTS имя_расширения CASCADE;
```

### 1.3. Где хранятся файлы расширений?

Каждое расширение состоит из нескольких файлов:

| Файл | Описание |
|---|---|
| `имя.control` | Метаданные: версия по умолчанию, схема, зависимости |
| `имя--версия.sql` | SQL-скрипт установки указанной версии |
| `имя--старая--новая.sql` | Скрипт миграции между версиями |
| `имя.so` / `имя.dll` | Скомпилированная разделяемая библиотека (если есть) |

Расположение файлов можно узнать так:

```sql
SHOW shared_preload_libraries;  -- библиотеки, загружаемые при старте
```

```bash
pg_config --sharedir    # каталог share — здесь лежат .control и .sql
pg_config --pkglibdir   # каталог lib — здесь лежат .so файлы
```

---

## 2. PostGIS — работа с геопространственными данными

### 2.1. Что такое PostGIS?

**PostGIS** — расширение, превращающее PostgreSQL в полноценную геопространственную СУБД. Оно добавляет поддержку географических объектов (точки, линии, полигоны), пространственных индексов и сотен функций для анализа и обработки геоданных.

PostGIS реализует стандарты **OGC Simple Features** и **SQL/MM Spatial**, что делает его совместимым с большинством ГИС-инструментов (QGIS, ArcGIS, Mapbox, Leaflet и т.д.).

:::tip Где используется PostGIS?
- Службы доставки и логистики (расчёт маршрутов, зоны доставки)
- Сервисы такси и каршеринга (поиск ближайших машин)
- Геоаналитика и BI (визуализация данных на карте)
- Кадастровые системы (хранение границ участков)
- Экологический мониторинг (отслеживание зон загрязнения)
- Телекоммуникации (зоны покрытия базовых станций)
:::

### 2.2. Установка PostGIS

<Tabs>
<TabItem value="ubuntu" label="Ubuntu / Debian">

```bash
# Установка PostGIS для PostgreSQL 16
sudo apt update
sudo apt install postgresql-16-postgis-3 postgresql-16-postgis-3-scripts

# Подключение к базе данных и активация расширения
sudo -u postgres psql -d mydb

# Внутри psql:
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;      -- топология
CREATE EXTENSION IF NOT EXISTS postgis_raster;        -- растровые данные
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;         -- для postgis_tiger_geocoder
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder; -- геокодирование (US)
```

</TabItem>
<TabItem value="macos" label="macOS (Homebrew)">

```bash
brew install postgis

# Подключение и активация
psql -d mydb
CREATE EXTENSION IF NOT EXISTS postgis;
```

</TabItem>
<TabItem value="docker" label="Docker">

```bash
# Официальный образ PostGIS
docker run -d \
  --name postgis-db \
  -e POSTGRES_PASSWORD=secret \
  -e POSTGRES_DB=geodata \
  -p 5432:5432 \
  postgis/postgis:16-3.4

# Подключение
docker exec -it postgis-db psql -U postgres -d geodata
CREATE EXTENSION IF NOT EXISTS postgis;
```

</TabItem>
</Tabs>

Проверка установки:

```sql
SELECT PostGIS_Full_Version();
-- Пример вывода:
-- POSTGIS="3.4.0" [EXTENSION] PGSQL="160"
--   GEOS="3.12.0-CAPI-1.18.0"
--   PROJ="9.3.0" GDAL="GDAL 3.8.0"
--   LIBXML="2.9.14" LIBJSON="0.17"
--   TOPOLOGY RASTER
```

### 2.3. Основные типы данных

PostGIS вводит два ключевых типа данных:

| Тип | Описание | Когда использовать |
|---|---|---|
| `geometry` | Плоские координаты (декартова система). Расстояния — в единицах SRID (обычно метры или градусы). | Локальные проекции, небольшие территории, архитектурные планы |
| `geography` | Сферические координаты (широта/долгота на эллипсоиде WGS 84). Расстояния — всегда в метрах. | Глобальные приложения, расчёт расстояний на поверхности Земли |

**SRID** (Spatial Reference Identifier) — числовой идентификатор системы координат. Самые распространённые:

| SRID | Название | Описание |
|---|---|---|
| `4326` | WGS 84 | GPS-координаты (широта/долгота). Стандарт де-факто |
| `3857` | Web Mercator | Проекция для веб-карт (Google Maps, OpenStreetMap) |
| `32637` | UTM zone 37N | Метрическая проекция для Москвы и окрестностей |

### 2.4. Создание таблиц с геоданными

```sql
-- Таблица городов с точечной геометрией
CREATE TABLE cities (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    country     VARCHAR(100) NOT NULL,
    population  INTEGER,
    location    geometry(Point, 4326) NOT NULL
);

-- Таблица рек с линейной геометрией
CREATE TABLE rivers (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    length_km   NUMERIC(10, 2),
    course      geometry(LineString, 4326) NOT NULL
);

-- Таблица регионов с полигональной геометрией
CREATE TABLE regions (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    area_km2    NUMERIC(12, 2),
    boundary    geometry(Polygon, 4326) NOT NULL
);

-- Таблица зон доставки с geography
CREATE TABLE delivery_zones (
    id          SERIAL PRIMARY KEY,
    zone_name   VARCHAR(100) NOT NULL,
    center      geography(Point, 4326) NOT NULL,
    radius_m    INTEGER NOT NULL,
    boundary    geography(Polygon, 4326)
);
```

### 2.5. Вставка геоданных

Существует несколько способов создания геометрических объектов:

```sql
-- Способ 1: Well-Known Text (WKT) — самый читаемый
INSERT INTO cities (name, country, population, location) VALUES
    ('Москва',         'Россия', 12600000, ST_SetSRID(ST_MakePoint(37.6173, 55.7558), 4326)),
    ('Санкт-Петербург','Россия',  5400000, ST_GeomFromText('POINT(30.3141 59.9386)', 4326)),
    ('Казань',         'Россия',  1200000, ST_SetSRID(ST_MakePoint(49.1221, 55.7879), 4326)),
    ('Новосибирск',    'Россия',  1600000, ST_SetSRID(ST_MakePoint(82.9346, 55.0084), 4326)),
    ('Токио',          'Япония', 13960000, ST_SetSRID(ST_MakePoint(139.6917, 35.6895), 4326)),
    ('Берлин',         'Германия', 3600000, ST_SetSRID(ST_MakePoint(13.4050, 52.5200), 4326));

-- Способ 2: GeoJSON — удобен для веб-приложений
INSERT INTO cities (name, country, population, location) VALUES
    ('Лондон', 'Великобритания', 8900000,
     ST_GeomFromGeoJSON('{"type":"Point","coordinates":[-0.1278, 51.5074]}'));

-- Вставка линии (река)
INSERT INTO rivers (name, length_km, course) VALUES
    ('Нева', 74,
     ST_GeomFromText(
         'LINESTRING(30.0485 59.9536, 30.1923 59.9408, 30.3141 59.9386, 30.4396 59.9462)',
         4326
     ));

-- Вставка полигона (упрощённая граница)
INSERT INTO regions (name, area_km2, boundary) VALUES
    ('Центральный район',  150.5,
     ST_GeomFromText(
         'POLYGON((30.30 59.93, 30.35 59.93, 30.35 59.95, 30.30 59.95, 30.30 59.93))',
         4326
     ));
```

:::caution Важно: порядок координат
В PostGIS (стандарт WKT) порядок: **долгота (X), широта (Y)** — то есть `POINT(37.6173 55.7558)` означает 37° в.д., 55° с.ш. (Москва). Это противоположно привычному GPS-порядку «широта, долгота».
:::

### 2.6. Пространственные индексы

Без индекса пространственные запросы будут выполнять полное сканирование таблицы. PostGIS использует **GiST** (Generalized Search Tree) — специальный тип индекса для многомерных данных:

```sql
-- Создание пространственного индекса
CREATE INDEX idx_cities_location   ON cities   USING GIST (location);
CREATE INDEX idx_rivers_course     ON rivers   USING GIST (course);
CREATE INDEX idx_regions_boundary  ON regions  USING GIST (boundary);

-- Для типа geography
CREATE INDEX idx_delivery_center   ON delivery_zones USING GIST (center);

-- Проверка использования индекса
EXPLAIN ANALYZE
SELECT name FROM cities
WHERE ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(37.6173, 55.7558), 4326),
    1  -- 1 градус (для geometry)
);
```

### 2.7. Основные пространственные функции

#### Измерения

```sql
-- Расстояние между городами (geometry → в градусах!)
SELECT
    a.name AS city_a,
    b.name AS city_b,
    ST_Distance(a.location, b.location) AS distance_deg
FROM cities a, cities b
WHERE a.name = 'Москва' AND b.name = 'Санкт-Петербург';

-- Расстояние в МЕТРАХ через geography (точно, учитывает кривизну Земли)
SELECT
    a.name AS city_a,
    b.name AS city_b,
    ST_Distance(
        a.location::geography,
        b.location::geography
    ) AS distance_meters,
    ROUND(ST_Distance(
        a.location::geography,
        b.location::geography
    ) / 1000, 1) AS distance_km
FROM cities a, cities b
WHERE a.name = 'Москва' AND b.name = 'Санкт-Петербург';
-- Результат: ~634.4 км

-- Длина линии
SELECT
    name,
    ST_Length(course::geography) / 1000 AS length_km
FROM rivers;

-- Площадь полигона
SELECT
    name,
    ST_Area(boundary::geography) / 1000000 AS area_km2
FROM regions;

-- Периметр полигона
SELECT
    name,
    ST_Perimeter(boundary::geography) / 1000 AS perimeter_km
FROM regions;
```

#### Поиск ближайших объектов

```sql
-- Найти 5 ближайших городов к заданной точке
SELECT
    name,
    population,
    ROUND(
        ST_Distance(
            location::geography,
            ST_SetSRID(ST_MakePoint(37.6173, 55.7558), 4326)::geography
        ) / 1000, 1
    ) AS distance_km
FROM cities
ORDER BY location <-> ST_SetSRID(ST_MakePoint(37.6173, 55.7558), 4326)
LIMIT 5;

-- Оператор <-> использует KNN-индекс и работает очень быстро
-- Он возвращает приблизительное расстояние для сортировки,
-- а точное расстояние считается через ST_Distance
```

#### Пространственные отношения

```sql
-- Города внутри определённого региона
SELECT c.name
FROM cities c
JOIN regions r ON ST_Within(c.location, r.boundary)
WHERE r.name = 'Центральный район';

-- Пересечение двух полигонов
SELECT ST_Intersects(a.boundary, b.boundary) AS do_intersect
FROM regions a, regions b
WHERE a.name = 'Район А' AND b.name = 'Район Б';

-- Города в радиусе 500 км от Москвы
SELECT
    name,
    ROUND(ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint(37.6173, 55.7558), 4326)::geography
    ) / 1000) AS km
FROM cities
WHERE ST_DWithin(
    location::geography,
    ST_SetSRID(ST_MakePoint(37.6173, 55.7558), 4326)::geography,
    500000  -- 500 000 метров = 500 км
)
AND name != 'Москва'
ORDER BY km;
```

#### Геометрические операции

```sql
-- Буферная зона 10 км вокруг точки (зона доставки)
SELECT ST_Buffer(
    ST_SetSRID(ST_MakePoint(37.6173, 55.7558), 4326)::geography,
    10000  -- 10 км в метрах
) AS delivery_zone;

-- Объединение нескольких полигонов
SELECT ST_Union(boundary) AS merged
FROM regions
WHERE name IN ('Район А', 'Район Б');

-- Центроид (географический центр) полигона
SELECT
    name,
    ST_AsText(ST_Centroid(boundary)) AS center
FROM regions;

-- Разница полигонов (вырезание)
SELECT ST_Difference(a.boundary, b.boundary)
FROM regions a, regions b
WHERE a.name = 'Большой район' AND b.name = 'Малый район';

-- Пересечение полигонов (общая площадь)
SELECT ST_Intersection(a.boundary, b.boundary)
FROM regions a, regions b
WHERE a.name = 'Район А' AND b.name = 'Район Б';
```

### 2.8. Форматы вывода

```sql
-- Well-Known Text (WKT) — для отладки
SELECT ST_AsText(location) FROM cities WHERE name = 'Москва';
-- POINT(37.6173 55.7558)

-- GeoJSON — для веб-приложений (Leaflet, Mapbox)
SELECT ST_AsGeoJSON(location) FROM cities WHERE name = 'Москва';
-- {"type":"Point","coordinates":[37.6173,55.7558]}

-- GeoJSON для всей таблицы (FeatureCollection)
SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(
        json_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(location)::json,
            'properties', json_build_object(
                'name', name,
                'population', population
            )
        )
    )
) AS geojson
FROM cities;

-- KML (для Google Earth)
SELECT ST_AsKML(location) FROM cities WHERE name = 'Москва';

-- SVG (для вставки в веб-страницы)
SELECT ST_AsSVG(location) FROM cities WHERE name = 'Москва';
```

### 2.9. Практический пример: система поиска кафе поблизости

```sql
-- Создаём таблицу кафе
CREATE TABLE cafes (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    category    VARCHAR(50),     -- кофейня, ресторан, бар и т.д.
    rating      NUMERIC(2,1),
    price_level INTEGER CHECK (price_level BETWEEN 1 AND 4),
    location    geography(Point, 4326) NOT NULL,
    address     TEXT,
    open_hours  TSRANGE          -- часы работы
);

CREATE INDEX idx_cafes_location ON cafes USING GIST (location);
CREATE INDEX idx_cafes_category ON cafes (category);

-- Наполнение тестовыми данными
INSERT INTO cafes (name, category, rating, price_level, location, address) VALUES
    ('Coffee Bean',   'кофейня',   4.5, 2, ST_MakePoint(37.6056, 55.7522)::geography, 'ул. Арбат, 10'),
    ('Му-Му',         'ресторан',  4.0, 1, ST_MakePoint(37.6100, 55.7560)::geography, 'ул. Тверская, 24'),
    ('Пушкинъ',       'ресторан',  4.8, 4, ST_MakePoint(37.6040, 55.7650)::geography, 'Тверской б-р, 26А'),
    ('Starbucks',     'кофейня',   3.9, 2, ST_MakePoint(37.6190, 55.7530)::geography, 'Маросейка, 6/8'),
    ('Хинкальная',    'ресторан',  4.2, 2, ST_MakePoint(37.6250, 55.7590)::geography, 'Покровка, 15'),
    ('Bar Noor',      'бар',       4.6, 3, ST_MakePoint(37.6120, 55.7510)::geography, 'Б. Никитская, 12');

-- ============================================
-- Запрос: найти ближайшие кофейни в радиусе 1 км
-- от моего текущего местоположения
-- ============================================
WITH my_location AS (
    SELECT ST_MakePoint(37.6100, 55.7540)::geography AS point
)
SELECT
    c.name,
    c.rating,
    c.price_level,
    c.address,
    ROUND(ST_Distance(c.location, ml.point)::numeric) AS distance_m
FROM cafes c, my_location ml
WHERE c.category = 'кофейня'
  AND ST_DWithin(c.location, ml.point, 1000)  -- 1000 метров
ORDER BY ST_Distance(c.location, ml.point)
LIMIT 10;

-- ============================================
-- Запрос: все заведения с рейтингом >= 4.0,
-- отсортированные по расстоянию,
-- с кластеризацией по категориям
-- ============================================
WITH my_location AS (
    SELECT ST_MakePoint(37.6100, 55.7540)::geography AS point
)
SELECT
    c.category,
    c.name,
    c.rating,
    ROUND(ST_Distance(c.location, ml.point)::numeric) AS dist_m
FROM cafes c, my_location ml
WHERE c.rating >= 4.0
  AND ST_DWithin(c.location, ml.point, 2000)
ORDER BY c.category, ST_Distance(c.location, ml.point);
```

---

## 3. pg_stat_statements — мониторинг производительности

### 3.1. Что такое pg_stat_statements?

**pg_stat_statements** — расширение, которое собирает статистику выполнения всех SQL-запросов в базе данных. Оно нормализует запросы (заменяет литералы на параметры `$1`, `$2`...) и агрегирует их по шаблону, позволяя выявлять самые «тяжёлые» и частые запросы.

Это **главный инструмент DBA** для оптимизации производительности PostgreSQL.

:::tip Зачем нужен pg_stat_statements?
- Найти самые медленные запросы
- Определить запросы, создающие наибольшую нагрузку на CPU и I/O
- Выявить запросы, которые читают слишком много данных
- Отслеживать динамику производительности после изменений
- Планировать индексы на основе реальных паттернов использования
:::

### 3.2. Установка и настройка

**Шаг 1.** Настройка `postgresql.conf`:

```ini
# Добавить pg_stat_statements в список предзагружаемых библиотек
# ВНИМАНИЕ: изменение этого параметра требует перезапуска PostgreSQL!
shared_preload_libraries = 'pg_stat_statements'

# Дополнительные параметры (опционально)
pg_stat_statements.max = 10000          # максимум отслеживаемых запросов
pg_stat_statements.track = all          # top | all | none
pg_stat_statements.track_utility = on   # отслеживать служебные команды (CREATE, ALTER)
pg_stat_statements.track_planning = on  # отслеживать время планирования (PG 13+)
pg_stat_statements.save = on            # сохранять статистику при перезапуске
```

**Шаг 2.** Перезапуск PostgreSQL:

```bash
sudo systemctl restart postgresql
```

**Шаг 3.** Создание расширения:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

Проверка:

```sql
SELECT * FROM pg_stat_statements LIMIT 1;
```

### 3.3. Структура представления pg_stat_statements

Расширение создаёт представление (view) с множеством полезных столбцов:

| Столбец | Описание |
|---|---|
| `userid` | OID пользователя, выполняющего запрос |
| `dbid` | OID базы данных |
| `queryid` | Хеш нормализованного запроса |
| `query` | Текст нормализованного запроса |
| `calls` | Количество вызовов |
| `total_exec_time` | Суммарное время выполнения (мс) |
| `mean_exec_time` | Среднее время выполнения (мс) |
| `min_exec_time` / `max_exec_time` | Мин/макс время |
| `stddev_exec_time` | Стандартное отклонение |
| `rows` | Общее количество возвращённых/затронутых строк |
| `shared_blks_hit` | Попадания в буферный кеш (shared buffers) |
| `shared_blks_read` | Чтения из диска |
| `shared_blks_written` | Записи на диск |
| `temp_blks_read` / `temp_blks_written` | Использование временных файлов |
| `blk_read_time` / `blk_write_time` | Время I/O (если `track_io_timing = on`) |
| `wal_records` / `wal_bytes` | WAL-активность (PG 13+) |
| `total_plan_time` / `mean_plan_time` | Время планирования (PG 13+) |

### 3.4. Ключевые аналитические запросы

#### Топ-10 самых «тяжёлых» запросов по суммарному времени

```sql
SELECT
    queryid,
    LEFT(query, 80) AS short_query,
    calls,
    ROUND(total_exec_time::numeric, 2)          AS total_ms,
    ROUND(mean_exec_time::numeric, 2)           AS avg_ms,
    ROUND(max_exec_time::numeric, 2)            AS max_ms,
    ROUND(stddev_exec_time::numeric, 2)         AS stddev_ms,
    rows,
    ROUND(
        100.0 * total_exec_time /
        NULLIF(SUM(total_exec_time) OVER(), 0), 2
    ) AS pct_total_time
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
ORDER BY total_exec_time DESC
LIMIT 10;
```

#### Топ-10 самых частых запросов

```sql
SELECT
    queryid,
    LEFT(query, 80)                    AS short_query,
    calls,
    ROUND(mean_exec_time::numeric, 2)  AS avg_ms,
    rows / NULLIF(calls, 0)            AS avg_rows
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
ORDER BY calls DESC
LIMIT 10;
```

#### Запросы с наихудшим соотношением кеш-попаданий (I/O-проблемы)

```sql
SELECT
    queryid,
    LEFT(query, 80) AS short_query,
    calls,
    shared_blks_hit,
    shared_blks_read,
    ROUND(
        100.0 * shared_blks_hit /
        NULLIF(shared_blks_hit + shared_blks_read, 0), 2
    ) AS cache_hit_pct,
    ROUND(total_exec_time::numeric, 2) AS total_ms
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
  AND (shared_blks_hit + shared_blks_read) > 100  -- исключить редкие запросы
ORDER BY cache_hit_pct ASC
LIMIT 10;
```

:::caution Целевые значения cache_hit_pct
Для нормально работающей базы данных `cache_hit_pct` должен быть **> 95%**. Если значение ниже — нужно увеличить `shared_buffers` или оптимизировать запрос.
:::

#### Запросы, создающие временные файлы

Временные файлы на диске — признак того, что `work_mem` недостаточен для сортировки или хеш-соединения:

```sql
SELECT
    queryid,
    LEFT(query, 80) AS short_query,
    calls,
    temp_blks_read + temp_blks_written AS temp_blks_total,
    ROUND(mean_exec_time::numeric, 2) AS avg_ms
FROM pg_stat_statements
WHERE temp_blks_read + temp_blks_written > 0
ORDER BY temp_blks_total DESC
LIMIT 10;
```

#### Запросы с наибольшей WAL-активностью

```sql
SELECT
    queryid,
    LEFT(query, 80) AS short_query,
    calls,
    wal_records,
    pg_size_pretty(wal_bytes) AS wal_size,
    ROUND(mean_exec_time::numeric, 2) AS avg_ms
FROM pg_stat_statements
WHERE wal_records > 0
ORDER BY wal_bytes DESC
LIMIT 10;
```

### 3.5. Сброс статистики

```sql
-- Полный сброс всей статистики
SELECT pg_stat_statements_reset();

-- Сброс для конкретного пользователя (PG 14+)
SELECT pg_stat_statements_reset(
    userid => (SELECT oid FROM pg_roles WHERE rolname = 'app_user'),
    dbid   => 0,       -- 0 = все базы
    queryid => 0        -- 0 = все запросы
);
```

:::tip Рекомендация по сбросу
Сбрасывайте статистику после крупных изменений (деплой, добавление индексов, обновление PostgreSQL), чтобы иметь чистую картину «до» и «после».
:::

### 3.6. Практический пример: поиск и оптимизация проблемного запроса

Полный цикл работы с pg_stat_statements:

```sql
-- Шаг 1: Создадим тестовую таблицу с большим объёмом данных
CREATE TABLE orders (
    id          SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    product_id  INTEGER NOT NULL,
    amount      NUMERIC(10, 2) NOT NULL,
    status      VARCHAR(20) DEFAULT 'pending',
    created_at  TIMESTAMP DEFAULT now()
);

-- Генерируем 1 000 000 строк
INSERT INTO orders (customer_id, product_id, amount, status, created_at)
SELECT
    (random() * 10000)::int,
    (random() * 500)::int,
    (random() * 1000)::numeric(10,2),
    (ARRAY['pending','confirmed','shipped','delivered','cancelled'])[floor(random()*5+1)],
    now() - (random() * interval '365 days')
FROM generate_series(1, 1000000);

-- Обновляем статистику
ANALYZE orders;

-- Шаг 2: Сбрасываем pg_stat_statements
SELECT pg_stat_statements_reset();

-- Шаг 3: Выполняем разные запросы (имитация реальной нагрузки)
-- Запрос A: поиск заказов конкретного клиента
SELECT * FROM orders WHERE customer_id = 42 ORDER BY created_at DESC;
SELECT * FROM orders WHERE customer_id = 100 ORDER BY created_at DESC;
SELECT * FROM orders WHERE customer_id = 555 ORDER BY created_at DESC;

-- Запрос B: агрегация по статусу за период
SELECT status, count(*), sum(amount)
FROM orders
WHERE created_at >= now() - interval '30 days'
GROUP BY status;

-- Запрос C: тяжёлый отчёт
SELECT
    customer_id,
    count(*) AS order_count,
    sum(amount) AS total_amount,
    avg(amount) AS avg_amount
FROM orders
WHERE status = 'delivered'
GROUP BY customer_id
HAVING count(*) > 5
ORDER BY total_amount DESC
LIMIT 100;

-- Шаг 4: Анализ — что нужно оптимизировать?
SELECT
    queryid,
    LEFT(query, 100) AS query_preview,
    calls,
    ROUND(total_exec_time::numeric, 2) AS total_ms,
    ROUND(mean_exec_time::numeric, 2) AS avg_ms,
    rows,
    shared_blks_read
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
  AND query NOT LIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC
LIMIT 5;

-- Шаг 5: Создаём индексы на основе данных
CREATE INDEX idx_orders_customer   ON orders (customer_id, created_at DESC);
CREATE INDEX idx_orders_status     ON orders (status) WHERE status = 'delivered';
CREATE INDEX idx_orders_created_at ON orders (created_at);

-- Шаг 6: Сбрасываем и перепроверяем
SELECT pg_stat_statements_reset();

-- Повторяем запросы и сравниваем avg_ms
```

### 3.7. Автоматический мониторинг

Пример создания представления для удобного мониторинга:

```sql
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT
    queryid,
    LEFT(query, 120)                            AS query_text,
    calls,
    ROUND(total_exec_time::numeric, 2)          AS total_time_ms,
    ROUND(mean_exec_time::numeric, 2)           AS avg_time_ms,
    ROUND(max_exec_time::numeric, 2)            AS max_time_ms,
    rows,
    ROUND(
        100.0 * shared_blks_hit /
        NULLIF(shared_blks_hit + shared_blks_read, 0), 2
    )                                           AS cache_hit_pct,
    ROUND(
        100.0 * total_exec_time /
        NULLIF(SUM(total_exec_time) OVER(), 0), 2
    )                                           AS pct_of_total
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
ORDER BY total_exec_time DESC;

-- Использование:
SELECT * FROM v_slow_queries LIMIT 20;
```

---

## 4. pgcrypto — криптография в базе данных

### 4.1. Что такое pgcrypto?

**pgcrypto** — расширение, предоставляющее криптографические функции прямо внутри PostgreSQL. Оно позволяет хешировать данные, шифровать/дешифровать, генерировать случайные значения и работать с PGP — всё на уровне SQL-запросов.

:::warning Когда НЕ стоит использовать pgcrypto
Шифрование на уровне СУБД имеет свои ограничения:

- Ключи шифрования передаются в SQL-запросах и могут попасть в логи
- Администратор БД видит открытые данные в момент их обработки
- Отключить `log_statement` и `auto_explain` для чувствительных запросов не всегда возможно

Для максимальной безопасности шифруйте данные **на уровне приложения** (application-level encryption) и храните ключи в **secrets manager** (Vault, AWS KMS и т.д.). pgcrypto идеально подходит для хеширования паролей, генерации UUID и задач, где ключ шифрования не критичен.
:::

### 4.2. Установка

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Проверка: список доступных функций
SELECT proname FROM pg_proc
WHERE proname LIKE 'crypt%' OR proname LIKE 'pgp_%' OR proname LIKE 'gen_%'
ORDER BY proname;
```

### 4.3. Генерация случайных данных

```sql
-- Случайные байты (возвращает bytea)
SELECT gen_random_bytes(16);  -- 16 байт = 128 бит
SELECT gen_random_bytes(32);  -- 32 байта = 256 бит

-- UUID v4 (случайный)
SELECT gen_random_uuid();
-- Пример: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11

-- Можно использовать как первичный ключ
CREATE TABLE sessions (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    INTEGER NOT NULL,
    token      TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    expires_at TIMESTAMP NOT NULL
);

-- При вставке UUID генерируется автоматически
INSERT INTO sessions (user_id, token, expires_at)
VALUES (42, 'abc123', now() + interval '24 hours')
RETURNING id;

-- Случайная hex-строка
SELECT encode(gen_random_bytes(32), 'hex') AS random_hex;
-- Пример: 4f8a3c...  (64 символа)

-- Случайная base64 строка
SELECT encode(gen_random_bytes(32), 'base64') AS random_b64;
```

### 4.4. Хеширование данных

#### Функция digest() — общее хеширование

```sql
-- MD5 (только для совместимости, НЕ использовать для паролей!)
SELECT encode(digest('Hello, World!', 'md5'), 'hex');
-- 65a8e27d8879283831b664bd8b7f0ad4

-- SHA-256 (рекомендуемый)
SELECT encode(digest('Hello, World!', 'sha256'), 'hex');
-- dffd6021bb2bd5b0af676290809ec3a5...

-- SHA-512
SELECT encode(digest('Hello, World!', 'sha512'), 'hex');

-- Поддерживаемые алгоритмы: md5, sha1, sha224, sha256, sha384, sha512
```

#### HMAC — хеширование с ключом

```sql
-- HMAC-SHA256 (для подписи данных, проверки целостности)
SELECT encode(
    hmac('данные для подписи', 'секретный_ключ', 'sha256'),
    'hex'
) AS signature;

-- Практическое применение: подписывание URL
-- Сервер генерирует подписанную ссылку:
SELECT
    '/api/download?file=report.pdf&expires=1700000000&sig=' ||
    encode(
        hmac(
            '/api/download?file=report.pdf&expires=1700000000',
            'my_app_secret',
            'sha256'
        ),
        'hex'
    ) AS signed_url;
```

### 4.5. Хеширование паролей (bcrypt)

Функции `crypt()` и `gen_salt()` — основной способ безопасного хранения паролей:

```sql
-- Создаём таблицу пользователей
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    created_at    TIMESTAMP DEFAULT now()
);

-- ==============================
-- Регистрация нового пользователя
-- ==============================
INSERT INTO users (username, password_hash, email) VALUES
    ('alice', crypt('SuperSecret123!', gen_salt('bf', 12)), 'alice@example.com');

-- gen_salt('bf', 12) создаёт bcrypt-соль с cost factor = 12
-- 'bf' = Blowfish (bcrypt).
-- Cost factor определяет количество итераций: 2^12 = 4096 раундов
-- Чем выше — тем медленнее (и безопаснее), рекомендуемый диапазон: 10-14

-- Поддерживаемые алгоритмы gen_salt:
--   'bf'  = bcrypt (РЕКОМЕНДУЕТСЯ)
--   'md5' = MD5-crypt (НЕ рекомендуется)
--   'des' = DES-crypt (УСТАРЕЛ, НЕ использовать)

-- ==============================
-- Аутентификация (проверка пароля)
-- ==============================
SELECT
    id,
    username,
    email,
    (password_hash = crypt('SuperSecret123!', password_hash)) AS auth_ok
FROM users
WHERE username = 'alice';
-- auth_ok = true  →  пароль верный

-- Проверка с неверным паролем
SELECT
    (password_hash = crypt('WrongPassword', password_hash)) AS auth_ok
FROM users
WHERE username = 'alice';
-- auth_ok = false  →  пароль неверный

-- ==============================
-- Функция аутентификации
-- ==============================
CREATE OR REPLACE FUNCTION authenticate_user(
    p_username VARCHAR,
    p_password VARCHAR
)
RETURNS TABLE (user_id INTEGER, user_email VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT id, email::VARCHAR
    FROM users
    WHERE username = p_username
      AND password_hash = crypt(p_password, password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Использование
SELECT * FROM authenticate_user('alice', 'SuperSecret123!');

-- ==============================
-- Смена пароля
-- ==============================
UPDATE users
SET password_hash = crypt('NewPassword456!', gen_salt('bf', 12))
WHERE username = 'alice';
```

### 4.6. Симметричное шифрование (AES)

Для шифрования данных, которые нужно потом расшифровать:

```sql
-- ==============================
-- Шифрование с помощью PGP (симметричное)
-- ==============================

-- Шифрование текста
SELECT pgp_sym_encrypt(
    'Конфиденциальная информация: номер карты 4111-1111-1111-1111',
    'my_encryption_key'
) AS encrypted_data;
-- Результат: bytea (бинарные данные PGP-сообщения)

-- Расшифровка
SELECT pgp_sym_decrypt(
    pgp_sym_encrypt(
        'Конфиденциальная информация: номер карты 4111-1111-1111-1111',
        'my_encryption_key'
    ),
    'my_encryption_key'
) AS decrypted_text;

-- С указанием алгоритма и параметров
SELECT pgp_sym_encrypt(
    'Секретные данные',
    'my_key',
    'cipher-algo=aes256, compress-algo=2'
) AS encrypted;
-- Доступные cipher-algo: bf (Blowfish), aes128, aes192, aes256, 3des
-- compress-algo: 0=без сжатия, 1=ZIP, 2=ZLIB
```

#### Практический пример: таблица с зашифрованными данными

```sql
-- Таблица с персональными данными пациентов
CREATE TABLE patients (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(200) NOT NULL,  -- открытые данные
    date_of_birth   DATE NOT NULL,          -- открытые данные

    -- Зашифрованные поля
    diagnosis       BYTEA,                  -- медицинский диагноз
    insurance_num   BYTEA,                  -- номер страховки
    notes           BYTEA,                  -- заметки врача

    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

-- Вставка с шифрованием
INSERT INTO patients (full_name, date_of_birth, diagnosis, insurance_num, notes)
VALUES (
    'Иванов Иван Иванович',
    '1985-06-15',
    pgp_sym_encrypt('J06.9 — Острая инфекция верхних дыхательных путей', 'clinic_secret_key'),
    pgp_sym_encrypt('7702-1234567', 'clinic_secret_key'),
    pgp_sym_encrypt('Назначен курс антибиотиков на 7 дней', 'clinic_secret_key')
);

-- Чтение с расшифровкой
SELECT
    full_name,
    date_of_birth,
    pgp_sym_decrypt(diagnosis, 'clinic_secret_key')    AS diagnosis,
    pgp_sym_decrypt(insurance_num, 'clinic_secret_key') AS insurance_num,
    pgp_sym_decrypt(notes, 'clinic_secret_key')         AS notes
FROM patients
WHERE full_name = 'Иванов Иван Иванович';

-- Поиск по зашифрованным данным (МЕДЛЕННО — нужно расшифровывать все строки)
SELECT full_name, pgp_sym_decrypt(diagnosis, 'clinic_secret_key') AS diagnosis
FROM patients
WHERE pgp_sym_decrypt(diagnosis, 'clinic_secret_key') LIKE '%J06%';
```

:::caution Индексация зашифрованных данных
Зашифрованные столбцы **нельзя индексировать** для поиска, так как каждое значение уникально (из-за случайного вектора инициализации). Если нужен поиск, используйте отдельный хеш-столбец (например, `sha256` от исходного значения) в качестве «слепого индекса» (blind index).
:::

### 4.7. Асимметричное шифрование (PGP)

pgcrypto поддерживает шифрование с открытым/закрытым ключом:

```sql
-- ==============================
-- Шаг 1: Генерация ключей (вне PostgreSQL)
-- ==============================
-- В терминале:
-- gpg --gen-key
-- gpg --export -a "user@example.com" > public.key
-- gpg --export-secret-key -a "user@example.com" > private.key

-- ==============================
-- Шаг 2: Использование в PostgreSQL
-- ==============================

-- Чтение ключей из файлов (в реальности — из Vault/KMS)
-- Для примера используем переменные:

-- Шифрование открытым ключом
SELECT pgp_pub_encrypt(
    'Совершенно секретные данные',
    dearmor(pg_read_file('/path/to/public.key'))
) AS encrypted;

-- Расшифровка закрытым ключом
SELECT pgp_pub_decrypt(
    encrypted_data_column,
    dearmor(pg_read_file('/path/to/private.key')),
    'passphrase_for_private_key'  -- если ключ защищён паролем
) AS decrypted
FROM secret_table;
```

### 4.8. Низкоуровневое шифрование (encrypt/decrypt)

Для случаев, когда нужен прямой контроль над алгоритмом:

```sql
-- AES-128 в режиме CBC
SELECT encrypt(
    'Секретные данные'::bytea,
    'ключ_16_байтов!'::bytea,   -- ключ должен быть 16 байт для AES-128
    'aes-cbc/pad:pkcs'           -- алгоритм/режим/паддинг
) AS encrypted;

-- Расшифровка
SELECT convert_from(
    decrypt(
        encrypted_column,
        'ключ_16_байтов!'::bytea,
        'aes-cbc/pad:pkcs'
    ),
    'UTF8'
) AS plaintext;

-- Поддерживаемые алгоритмы: aes, bf (Blowfish), 3des
-- Режимы: cbc, ecb (не рекомендуется)
-- Паддинг: pkcs, none
```

### 4.9. Практический пример: безопасное хранилище секретов

```sql
-- Система хранения секретов (API-ключей, токенов)
CREATE TABLE secrets_vault (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    encrypted_value BYTEA NOT NULL,
    value_hash      TEXT NOT NULL,        -- SHA-256 хеш для быстрого поиска
    created_by      VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now(),
    expires_at      TIMESTAMP             -- опциональный TTL
);

-- Функция для добавления секрета
CREATE OR REPLACE FUNCTION vault_store_secret(
    p_name        VARCHAR,
    p_value       TEXT,
    p_description TEXT,
    p_created_by  VARCHAR,
    p_master_key  TEXT,
    p_expires_at  TIMESTAMP DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_id INTEGER;
BEGIN
    INSERT INTO secrets_vault (name, description, encrypted_value, value_hash, created_by, expires_at)
    VALUES (
        p_name,
        p_description,
        pgp_sym_encrypt(p_value, p_master_key, 'cipher-algo=aes256'),
        encode(digest(p_value, 'sha256'), 'hex'),
        p_created_by,
        p_expires_at
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Функция для получения секрета
CREATE OR REPLACE FUNCTION vault_get_secret(
    p_name       VARCHAR,
    p_master_key TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_result TEXT;
BEGIN
    SELECT pgp_sym_decrypt(encrypted_value, p_master_key)
    INTO v_result
    FROM secrets_vault
    WHERE name = p_name
      AND (expires_at IS NULL OR expires_at > now());

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'Secret "%" not found or expired', p_name;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для ротации мастер-ключа
CREATE OR REPLACE FUNCTION vault_rotate_master_key(
    p_old_key TEXT,
    p_new_key TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_row   RECORD;
BEGIN
    FOR v_row IN SELECT id, encrypted_value FROM secrets_vault
    LOOP
        UPDATE secrets_vault
        SET encrypted_value = pgp_sym_encrypt(
                pgp_sym_decrypt(v_row.encrypted_value, p_old_key),
                p_new_key,
                'cipher-algo=aes256'
            ),
            updated_at = now()
        WHERE id = v_row.id;
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ==============================
-- Использование
-- ==============================

-- Сохраняем секрет
SELECT vault_store_secret(
    'stripe_api_key',
    'sk_live_51HG7d2CJaYb...',
    'Stripe production API key',
    'admin',
    'vault_master_password_2024!'
);

-- Читаем секрет
SELECT vault_get_secret('stripe_api_key', 'vault_master_password_2024!');

-- Ротация мастер-ключа
SELECT vault_rotate_master_key(
    'vault_master_password_2024!',
    'vault_new_master_password_2025!'
);
```

---

## 5. Комбинирование расширений

В реальных проектах расширения часто работают вместе. Вот пример, объединяющий все три:

```sql
-- Активируем все расширения
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- Система отслеживания курьеров с шифрованием
-- персональных данных
-- ============================================

CREATE TABLE couriers (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_sign          VARCHAR(50) NOT NULL,     -- позывной (открыт)
    encrypted_name     BYTEA NOT NULL,           -- ФИО (зашифровано)
    encrypted_phone    BYTEA NOT NULL,           -- телефон (зашифрован)
    current_location   geography(Point, 4326),   -- текущая геолокация
    status             VARCHAR(20) DEFAULT 'offline',
    last_updated       TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_couriers_location ON couriers USING GIST (current_location);
CREATE INDEX idx_couriers_status ON couriers (status);

-- Регистрация курьера
INSERT INTO couriers (call_sign, encrypted_name, encrypted_phone, current_location, status)
VALUES (
    'FALCON-7',
    pgp_sym_encrypt('Петров Алексей Сергеевич', 'courier_encryption_key'),
    pgp_sym_encrypt('+7-999-123-4567', 'courier_encryption_key'),
    ST_MakePoint(37.6200, 55.7539)::geography,
    'active'
);

-- Найти 3 ближайших активных курьеров к адресу доставки
WITH delivery_point AS (
    SELECT ST_MakePoint(37.6350, 55.7610)::geography AS location
)
SELECT
    c.call_sign,
    c.status,
    ROUND(ST_Distance(c.current_location, dp.location)::numeric) AS distance_m,
    -- Расшифровка только для диспетчера (через SECURITY DEFINER функцию)
    pgp_sym_decrypt(c.encrypted_phone, 'courier_encryption_key') AS phone
FROM couriers c, delivery_point dp
WHERE c.status = 'active'
  AND ST_DWithin(c.current_location, dp.location, 5000)  -- в радиусе 5 км
ORDER BY ST_Distance(c.current_location, dp.location)
LIMIT 3;

-- После выполнения запроса проверяем его в pg_stat_statements:
SELECT
    LEFT(query, 100) AS q,
    calls,
    ROUND(mean_exec_time::numeric, 2) AS avg_ms
FROM pg_stat_statements
WHERE query LIKE '%couriers%'
  AND query NOT LIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC;
```

---

## 6. Сводная таблица расширений

| Характеристика | PostGIS | pg_stat_statements | pgcrypto |
|---|---|---|---|
| **Назначение** | Геопространственные данные | Мониторинг производительности | Криптография |
| **Тип** | Типы данных + функции | Статистический коллектор | Функции |
| **Предзагрузка** | Не требуется | `shared_preload_libraries` | Не требуется |
| **Перезапуск** | Нет | Да (для настройки) | Нет |
| **Ключевые функции** | `ST_Distance`, `ST_Within`, `ST_Buffer` | `pg_stat_statements` view | `crypt`, `pgp_sym_encrypt`, `digest` |
| **Индексы** | GiST, SP-GiST | — | — |
| **Зависимости** | GEOS, PROJ, GDAL | — | OpenSSL |
| **Типичная роль** | Бэкенд-разработчик, GIS-специалист | DBA, DevOps | Бэкенд-разработчик, Security |

---

## 7. Упражнения для самопроверки

### Задание 1: PostGIS — зоны доставки

Создайте систему зон доставки для пиццерии:

1. Создайте таблицу `pizzerias` с колонками: `id`, `name`, `location` (geography).
2. Создайте таблицу `delivery_orders` с колонками: `id`, `pizzeria_id`, `customer_location` (geography), `customer_name`, `order_total`.
3. Заполните данные: 3 пиццерии в разных районах, 10 заказов.
4. Напишите запрос: для каждого заказа определите ближайшую пиццерию.
5. Напишите запрос: выведите все заказы в радиусе 3 км от каждой пиццерии.
6. Создайте GeoJSON с расположением всех пиццерий.

### Задание 2: pg_stat_statements — аудит производительности

1. Создайте таблицу `products` (1 000 000 строк) с полями: `id`, `name`, `category`, `price`, `stock`, `created_at`.
2. Выполните 10 различных запросов: фильтрация, агрегация, JOIN, сортировка.
3. С помощью pg_stat_statements найдите 3 самых медленных запроса.
4. Создайте индексы для их оптимизации.
5. Сбросьте статистику, повторите запросы и сравните результаты.

### Задание 3: pgcrypto — система аутентификации

1. Создайте таблицу `app_users` с хешированными паролями (bcrypt, cost = 12).
2. Напишите функцию `register_user(username, password, email)`.
3. Напишите функцию `login_user(username, password)` — возвращает данные пользователя или NULL.
4. Напишите функцию `change_password(username, old_password, new_password)`.
5. Создайте таблицу `user_secrets` с зашифрованными данными (PGP symmetric) и напишите функции для чтения/записи.

### Задание 4: комбинированное (все три расширения)

Создайте прототип сервиса аренды самокатов:

1. Таблица `scooters`: id (UUID), model, location (geography), battery_level, status.
2. Таблица `rides`: зашифрованные данные пользователя, маршрут (LineString), стоимость.
3. Реализуйте поиск свободных самокатов в радиусе N метров.
4. Реализуйте расчёт стоимости поездки по длине маршрута.
5. Проанализируйте производительность запросов через pg_stat_statements.

---

## 8. Полезные ресурсы

**PostGIS:**
- [Официальная документация PostGIS](https://postgis.net/documentation/)
- [Introduction to PostGIS](https://postgis.net/workshops/postgis-intro/) — интерактивный учебник
- [PostGIS Reference](https://postgis.net/docs/reference.html) — справочник всех функций

**pg_stat_statements:**
- [PostgreSQL Docs: pg_stat_statements](https://www.postgresql.org/docs/current/pgstatstatements.html)
- [Мониторинг с pg_stat_statements — PostgresPro](https://postgrespro.ru/docs/postgresql/current/pgstatstatements)

**pgcrypto:**
- [PostgreSQL Docs: pgcrypto](https://www.postgresql.org/docs/current/pgcrypto.html)
- [Шифрование данных в PostgreSQL](https://postgrespro.ru/docs/postgresql/current/pgcrypto)

**Общее:**
- [Каталог расширений PostgreSQL (PGXN)](https://pgxn.org/)
- [Awesome Postgres Extensions](https://github.com/dhamaniasad/awesome-postgres)

---

:::tip Итоги урока
Вы изучили три ключевых расширения PostgreSQL:

- **PostGIS** позволяет хранить и анализировать геопространственные данные, выполнять поиск ближайших объектов, рассчитывать расстояния и площади, работать с буферными зонами и экспортировать данные в GeoJSON.
- **pg_stat_statements** собирает статистику всех SQL-запросов и помогает находить «узкие места» производительности — медленные запросы, плохой cache hit rate, избыточное использование временных файлов.
- **pgcrypto** обеспечивает криптографические операции: безопасное хеширование паролей через bcrypt, симметричное и асимметричное шифрование, генерацию UUID и случайных данных.

Эти расширения — лишь малая часть экосистемы PostgreSQL, которая насчитывает сотни расширений для самых разных задач.
:::
