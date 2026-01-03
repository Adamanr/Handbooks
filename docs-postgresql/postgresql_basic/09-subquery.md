---
sidebar_position: 9
description: "В этой главе мы рассмотрим основы PostgreSQL, включая установку, настройку и базовые команды."
---

# Подзапросы и представления

## Типы подзапросов

### Что такое подзапрос?

**Подзапрос (subquery)** — это SELECT внутри другого SQL-запроса. Подзапросы позволяют разбивать сложные задачи на простые части.

### Классификация подзапросов

**По расположению:**
- В WHERE
- В SELECT
- В FROM (производные таблицы)
- В HAVING
- В JOIN

**По результату:**
- **Скалярный** — возвращает одно значение (одна строка, один столбец)
- **Строчный** — возвращает одну строку (несколько столбцов)
- **Табличный** — возвращает таблицу (много строк и столбцов)

**По зависимости:**
- **Независимый** — выполняется один раз
- **Коррелированный** — выполняется для каждой строки внешнего запроса

### Подготовка данных

```sql
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50),
    position VARCHAR(50),
    salary DECIMAL(10, 2),
    manager_id INTEGER,
    hire_date DATE
);

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    location VARCHAR(50),
    budget DECIMAL(12, 2)
);

INSERT INTO departments (name, location, budget) VALUES 
    ('IT', 'Москва', 5000000),
    ('HR', 'Москва', 1500000),
    ('Sales', 'Санкт-Петербург', 3000000),
    ('Marketing', 'Москва', 2000000);

INSERT INTO employees (name, department, position, salary, manager_id, hire_date) VALUES 
    ('Иван Петров', 'IT', 'CTO', 250000, NULL, '2020-01-15'),
    ('Анна Сидорова', 'IT', 'Senior Developer', 180000, 1, '2020-06-01'),
    ('Сергей Иванов', 'IT', 'Developer', 120000, 2, '2021-03-10'),
    ('Мария Кузнецова', 'IT', 'Junior Developer', 80000, 2, '2022-01-20'),
    ('Алексей Смирнов', 'HR', 'HR Director', 150000, NULL, '2019-05-01'),
    ('Елена Новикова', 'HR', 'HR Manager', 100000, 5, '2020-02-15'),
    ('Дмитрий Волков', 'Sales', 'Sales Director', 200000, NULL, '2019-08-01'),
    ('Ольга Морозова', 'Sales', 'Sales Manager', 130000, 7, '2020-09-01'),
    ('Павел Соколов', 'Sales', 'Sales Representative', 90000, 8, '2021-11-15'),
    ('Наталья Попова', 'Marketing', 'Marketing Director', 170000, NULL, '2020-03-01');
```

---

## Урок 2: Скалярные подзапросы

### Подзапрос возвращает одно значение

**Скалярный подзапрос** возвращает ровно одну строку и один столбец.

### Примеры в WHERE

**Пример 1: Сотрудники с зарплатой выше средней**

```sql
SELECT 
    name,
    department,
    salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees)
ORDER BY salary DESC;
```

**Результат:**
```
      name        | department |  salary
------------------+------------+----------
 Иван Петров     | IT         | 250000.00
 Дмитрий Волков  | Sales      | 200000.00
 Анна Сидорова   | IT         | 180000.00
 Наталья Попова  | Marketing  | 170000.00
 Алексей Смирнов | HR         | 150000.00
 Ольга Морозова  | Sales      | 130000.00
```

**Пример 2: Сотрудники с зарплатой выше максимальной в HR**

```sql
SELECT 
    name,
    department,
    salary
FROM employees
WHERE salary > (
    SELECT MAX(salary) 
    FROM employees 
    WHERE department = 'HR'
);
```

**Пример 3: Последний нанятый сотрудник**

```sql
SELECT 
    name,
    hire_date
FROM employees
WHERE hire_date = (SELECT MAX(hire_date) FROM employees);
```

### Примеры в SELECT

**Пример 4: Показать зарплату и среднюю зарплату**

```sql
SELECT 
    name,
    salary,
    (SELECT AVG(salary) FROM employees) AS avg_salary,
    salary - (SELECT AVG(salary) FROM employees) AS diff_from_avg
FROM employees
ORDER BY salary DESC;
```

**Результат:**
```
      name        |  salary   | avg_salary | diff_from_avg
------------------+-----------+------------+---------------
 Иван Петров     | 250000.00 | 147000.00  |   103000.00
 Дмитрий Волков  | 200000.00 | 147000.00  |    53000.00
 ...
```

**Пример 5: Процент от общей зарплатной массы**

```sql
SELECT 
    department,
    SUM(salary) AS dept_salary,
    (SELECT SUM(salary) FROM employees) AS total_salary,
    ROUND(
        SUM(salary) * 100.0 / (SELECT SUM(salary) FROM employees),
        2
    ) AS percentage
FROM employees
GROUP BY department
ORDER BY dept_salary DESC;
```

### Осторожно: подзапрос должен вернуть одно значение!

```sql
-- ❌ ОШИБКА: подзапрос вернул больше одной строки
SELECT name, salary
FROM employees
WHERE salary > (SELECT salary FROM employees WHERE department = 'IT');
-- ERROR: more than one row returned by a subquery

-- ✅ ПРАВИЛЬНО: использовать агрегатную функцию
SELECT name, salary
FROM employees
WHERE salary > (SELECT MAX(salary) FROM employees WHERE department = 'IT');

-- ✅ ИЛИ: использовать IN/ANY/ALL
SELECT name, salary
FROM employees
WHERE salary > ALL (SELECT salary FROM employees WHERE department = 'IT');
```

---

## Табличные подзапросы

### Подзапрос возвращает таблицу

**Табличный подзапрос** возвращает несколько строк и/или столбцов.

### IN — проверка на вхождение

```sql
-- Сотрудники из отделов с бюджетом больше 2M
SELECT 
    name,
    department,
    salary
FROM employees
WHERE department IN (
    SELECT name 
    FROM departments 
    WHERE budget > 2000000
);
```

**Результат:**
```
      name       | department |  salary
-----------------+------------+----------
 Иван Петров    | IT         | 250000.00
 Анна Сидорова  | IT         | 180000.00
 Сергей Иванов  | IT         | 120000.00
 ...
```

### NOT IN — исключение

```sql
-- Сотрудники НЕ из IT и Sales
SELECT 
    name,
    department
FROM employees
WHERE department NOT IN ('IT', 'Sales');
```

### ANY и ALL

**ANY** — хотя бы одно условие истинно:

```sql
-- Сотрудники с зарплатой больше ЛЮБОЙ зарплаты в HR
SELECT 
    name,
    department,
    salary
FROM employees
WHERE salary > ANY (
    SELECT salary FROM employees WHERE department = 'HR'
);
-- Эквивалентно: WHERE salary > MIN(зарплаты HR)
```

**ALL** — все условия истинны:

```sql
-- Сотрудники с зарплатой больше ВСЕХ зарплат в HR
SELECT 
    name,
    department,
    salary
FROM employees
WHERE salary > ALL (
    SELECT salary FROM employees WHERE department = 'HR'
);
-- Эквивалентно: WHERE salary > MAX(зарплаты HR)
```

### EXISTS — проверка существования

```sql
-- Отделы, в которых есть сотрудники
SELECT 
    d.name,
    d.location
FROM departments d
WHERE EXISTS (
    SELECT 1 
    FROM employees e 
    WHERE e.department = d.name
);
```

**NOT EXISTS** — проверка отсутствия:

```sql
-- Отделы БЕЗ сотрудников
SELECT 
    d.name,
    d.location
FROM departments d
WHERE NOT EXISTS (
    SELECT 1 
    FROM employees e 
    WHERE e.department = d.name
);
```

**EXISTS vs IN:**
- **EXISTS** обычно быстрее для больших таблиц
- **EXISTS** работает с коррелированными подзапросами
- **IN** проще для списков значений

---

## Коррелированные подзапросы

### Подзапрос зависит от внешнего запроса

**Коррелированный подзапрос** ссылается на столбцы внешнего запроса и выполняется для каждой строки.

### Примеры коррелированных подзапросов

**Пример 1: Сотрудники с зарплатой выше средней в своем отделе**

```sql
SELECT 
    e1.name,
    e1.department,
    e1.salary,
    (
        SELECT AVG(e2.salary) 
        FROM employees e2 
        WHERE e2.department = e1.department
    ) AS dept_avg_salary
FROM employees e1
WHERE e1.salary > (
    SELECT AVG(e2.salary) 
    FROM employees e2 
    WHERE e2.department = e1.department
)
ORDER BY e1.department, e1.salary DESC;
```

**Пример 2: Топ-2 самых высокооплачиваемых в каждом отделе**

```sql
SELECT 
    name,
    department,
    salary
FROM employees e1
WHERE (
    SELECT COUNT(*) 
    FROM employees e2 
    WHERE e2.department = e1.department 
      AND e2.salary > e1.salary
) < 2
ORDER BY department, salary DESC;
```

**Пример 3: Сотрудники и количество их подчиненных**

```sql
SELECT 
    e1.name,
    e1.position,
    (
        SELECT COUNT(*) 
        FROM employees e2 
        WHERE e2.manager_id = e1.id
    ) AS subordinates_count
FROM employees e1
ORDER BY subordinates_count DESC;
```

**Результат:**
```
       name        |      position      | subordinates_count
-------------------+--------------------+--------------------
 Анна Сидорова     | Senior Developer   |                  2
 Ольга Морозова    | Sales Manager      |                  1
 Елена Новикова    | HR Manager         |                  0
 ...
```

**Пример 4: Разница с максимальной зарплатой в отделе**

```sql
SELECT 
    name,
    department,
    salary,
    (
        SELECT MAX(salary) 
        FROM employees e2 
        WHERE e2.department = e1.department
    ) - salary AS salary_gap
FROM employees e1
ORDER BY department, salary_gap;
```

---

## CTE (Common Table Expressions)

### Что такое CTE?

**CTE** — это временный именованный результат запроса, который можно использовать в основном запросе. Также называется **WITH-запрос**.

**Преимущества CTE:**
- ✅ Читабельность — разбивает сложный запрос на части
- ✅ Переиспользование — можно ссылаться несколько раз
- ✅ Рекурсия — поддержка рекурсивных запросов

### Синтаксис CTE

```sql
WITH cte_name AS (
    SELECT ...
)
SELECT ...
FROM cte_name;
```

### Простые примеры CTE

**Пример 1: Статистика по отделам**

```sql
WITH dept_stats AS (
    SELECT 
        department,
        COUNT(*) AS emp_count,
        AVG(salary) AS avg_salary,
        MAX(salary) AS max_salary,
        MIN(salary) AS min_salary
    FROM employees
    GROUP BY department
)
SELECT 
    department,
    emp_count,
    ROUND(avg_salary, 2) AS avg_salary,
    max_salary - min_salary AS salary_range
FROM dept_stats
WHERE emp_count > 2
ORDER BY avg_salary DESC;
```

**Пример 2: Множественные CTE**

```sql
WITH 
-- CTE 1: Средняя зарплата по отделам
dept_avg AS (
    SELECT 
        department,
        AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department
),
-- CTE 2: Сотрудники с зарплатой выше средней в отделе
high_earners AS (
    SELECT 
        e.name,
        e.department,
        e.salary,
        d.avg_salary
    FROM employees e
    JOIN dept_avg d ON e.department = d.department
    WHERE e.salary > d.avg_salary
)
-- Основной запрос
SELECT 
    department,
    COUNT(*) AS high_earners_count,
    AVG(salary) AS avg_high_earner_salary
FROM high_earners
GROUP BY department
ORDER BY high_earners_count DESC;
```

**Пример 3: CTE в CTE (вложенность)**

```sql
WITH 
-- Первый уровень: подсчет по отделам
dept_counts AS (
    SELECT 
        department,
        COUNT(*) AS emp_count
    FROM employees
    GROUP BY department
),
-- Второй уровень: используем первый CTE
large_departments AS (
    SELECT department
    FROM dept_counts
    WHERE emp_count >= 3
)
-- Основной запрос
SELECT 
    e.name,
    e.department,
    e.salary
FROM employees e
WHERE e.department IN (SELECT department FROM large_departments)
ORDER BY e.department, e.salary DESC;
```

### CTE vs подзапросы

```sql
-- С подзапросами (сложнее читать)
SELECT 
    name,
    salary,
    salary - (SELECT AVG(salary) FROM employees) AS diff
FROM employees
WHERE department IN (
    SELECT name FROM departments WHERE budget > 2000000
)
AND salary > (SELECT AVG(salary) FROM employees);

-- С CTE (проще читать)
WITH 
avg_salary AS (
    SELECT AVG(salary) AS value FROM employees
),
rich_departments AS (
    SELECT name FROM departments WHERE budget > 2000000
)
SELECT 
    name,
    salary,
    salary - (SELECT value FROM avg_salary) AS diff
FROM employees
WHERE department IN (SELECT name FROM rich_departments)
  AND salary > (SELECT value FROM avg_salary);
```

---

## Рекурсивные CTE

### Что такое рекурсивный CTE?

**Рекурсивный CTE** — это CTE, который ссылается на сам себя. Используется для иерархических данных.

### Структура рекурсивного CTE

```sql
WITH RECURSIVE cte_name AS (
    -- Базовый случай (anchor)
    SELECT ...
    
    UNION [ALL]
    
    -- Рекурсивный случай
    SELECT ...
    FROM cte_name
    WHERE условие_остановки
)
SELECT * FROM cte_name;
```

### Пример: Иерархия сотрудников

```sql
-- Все подчиненные конкретного менеджера (рекурсивно)
WITH RECURSIVE subordinates AS (
    -- Базовый случай: начальный менеджер
    SELECT 
        id,
        name,
        position,
        manager_id,
        1 AS level
    FROM employees
    WHERE id = 1  -- Иван Петров (CTO)
    
    UNION ALL
    
    -- Рекурсивный случай: подчиненные
    SELECT 
        e.id,
        e.name,
        e.position,
        e.manager_id,
        s.level + 1
    FROM employees e
    JOIN subordinates s ON e.manager_id = s.id
)
SELECT 
    REPEAT('  ', level - 1) || name AS hierarchy,
    position,
    level
FROM subordinates
ORDER BY level, name;
```

**Результат:**
```
       hierarchy        |      position      | level
------------------------+--------------------+-------
 Иван Петров           | CTO                |     1
   Анна Сидорова       | Senior Developer   |     2
     Мария Кузнецова   | Junior Developer   |     3
     Сергей Иванов     | Developer          |     3
```

### Пример: Генерация последовательности

```sql
-- Генерация чисел от 1 до 10
WITH RECURSIVE numbers AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1
    FROM numbers
    WHERE n < 10
)
SELECT n FROM numbers;
```

### Пример: Путь в иерархии

```sql
-- Путь от сотрудника до топ-менеджера
WITH RECURSIVE hierarchy AS (
    -- Начинаем с конкретного сотрудника
    SELECT 
        id,
        name,
        manager_id,
        name::TEXT AS path
    FROM employees
    WHERE id = 4  -- Мария Кузнецова
    
    UNION ALL
    
    -- Идем вверх по иерархии
    SELECT 
        e.id,
        e.name,
        e.manager_id,
        e.name || ' <- ' || h.path
    FROM employees e
    JOIN hierarchy h ON e.id = h.manager_id
)
SELECT path FROM hierarchy WHERE manager_id IS NULL;
```

**Результат:**
```
                    path
-------------------------------------------------
 Иван Петров <- Анна Сидорова <- Мария Кузнецова
```

---

## Представления (Views)

### Что такое представление?

**Представление (View)** — это сохраненный SQL-запрос, который работает как виртуальная таблица.

**Преимущества:**
- ✅ Упрощает сложные запросы
- ✅ Скрывает сложность от пользователей
- ✅ Обеспечивает безопасность (ограничивает доступ)
- ✅ Переиспользование логики

### Создание представлений

**Синтаксис:**

```sql
CREATE VIEW view_name AS
SELECT ...;
```

**Пример 1: Статистика по отделам**

```sql
CREATE VIEW department_stats AS
SELECT 
    department,
    COUNT(*) AS employee_count,
    ROUND(AVG(salary), 2) AS avg_salary,
    MAX(salary) AS max_salary,
    MIN(salary) AS min_salary,
    SUM(salary) AS total_salary
FROM employees
GROUP BY department;

-- Использование представления
SELECT * FROM department_stats
WHERE employee_count > 2
ORDER BY avg_salary DESC;
```

**Пример 2: Высокооплачиваемые сотрудники**

```sql
CREATE VIEW high_earners AS
SELECT 
    e.name,
    e.department,
    e.position,
    e.salary,
    (SELECT AVG(salary) FROM employees) AS company_avg,
    e.salary - (SELECT AVG(salary) FROM employees) AS diff_from_avg
FROM employees e
WHERE e.salary > (SELECT AVG(salary) FROM employees);

-- Использование
SELECT * FROM high_earners
WHERE department = 'IT'
ORDER BY salary DESC;
```

**Пример 3: Менеджеры с подчиненными**

```sql
CREATE VIEW managers_with_teams AS
SELECT 
    m.id,
    m.name AS manager_name,
    m.department,
    COUNT(e.id) AS team_size,
    ROUND(AVG(e.salary), 2) AS avg_team_salary
FROM employees m
LEFT JOIN employees e ON e.manager_id = m.id
GROUP BY m.id, m.name, m.department
HAVING COUNT(e.id) > 0;

-- Использование
SELECT * FROM managers_with_teams
ORDER BY team_size DESC;
```

### Обновление через представления

```sql
-- Простое представление можно обновлять
CREATE VIEW it_employees AS
SELECT id, name, salary
FROM employees
WHERE department = 'IT';

-- ✅ Можно обновить
UPDATE it_employees 
SET salary = salary * 1.1 
WHERE name = 'Сергей Иванов';

-- ✅ Можно вставить (если все NOT NULL поля есть)
INSERT INTO it_employees (name, salary)
VALUES ('Новый сотрудник', 100000);
```

**Ограничения для обновляемых представлений:**
- Без JOIN, UNION, GROUP BY, DISTINCT
- Без агрегатных функций
- Без подзапросов в SELECT

```sql
-- ❌ Нельзя обновить (есть GROUP BY)
CREATE VIEW dept_summary AS
SELECT department, COUNT(*) AS cnt
FROM employees
GROUP BY department;

UPDATE dept_summary SET cnt = 10;  -- ОШИБКА
```

### Управление представлениями

```sql
-- Изменить представление
CREATE OR REPLACE VIEW department_stats AS
SELECT 
    department,
    COUNT(*) AS employee_count,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY department;

-- Удалить представление
DROP VIEW department_stats;

-- Удалить, если существует
DROP VIEW IF EXISTS department_stats;

-- Просмотреть определение представления
\d+ department_stats  -- в psql

-- Или через SQL
SELECT definition 
FROM pg_views 
WHERE viewname = 'department_stats';
```

---

## Материализованные представления

### Что такое материализованное представление?

**Материализованное представление (Materialized View)** — это представление, которое физически хранит результат запроса.

**Отличия от обычного представления:**

| | View | Materialized View |
|---|------|-------------------|
| Хранение | Только запрос | Запрос + данные |
| Скорость | Выполняется каждый раз | Быстрый доступ |
| Актуальность | Всегда актуальны | Нужно обновлять |
| Использование | Простые запросы | Тяжелые вычисления |

### Создание материализованных представлений

```sql
CREATE MATERIALIZED VIEW mv_department_stats AS
SELECT 
    department,
    COUNT(*) AS employee_count,
    ROUND(AVG(salary), 2) AS avg_salary,
    MAX(salary) AS max_salary,
    SUM(salary) AS total_payroll
FROM employees
GROUP BY department;

-- Создать индекс для быстрого поиска
CREATE INDEX ON mv_department_stats(department);

-- Использование (очень быстро!)
SELECT * FROM mv_department_stats
WHERE employee_count > 3;
```

### Обновление материализованных представлений

```sql
-- Полное обновление
REFRESH MATERIALIZED VIEW mv_department_stats;

-- Конкурентное обновление (не блокирует чтение)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_department_stats;
-- Требует UNIQUE индекс!
```

### Когда использовать материализованные представления

**Используйте когда:**
- ✅ Запрос очень тяжелый (секунды/минуты)
- ✅ Данные обновляются редко
- ✅ Можно терпеть устаревшие данные
- ✅ Много одинаковых запросов

**Пример: Дашборд компании**

```sql
CREATE MATERIALIZED VIEW dashboard_metrics AS
WITH 
monthly_revenue AS (
    SELECT 
        DATE_TRUNC('month', order_date) AS month,
        SUM(total) AS revenue
    FROM orders
    WHERE status = 'completed'
    GROUP BY DATE_TRUNC('month', order_date)
),
department_costs AS (
    SELECT 
        department,
        SUM(salary) AS monthly_cost
    FROM employees
    GROUP BY department
)
SELECT 
    (SELECT COUNT(*) FROM employees) AS total_employees,
    (SELECT SUM(salary) FROM employees) AS total_payroll,
    (SELECT revenue FROM monthly_revenue ORDER BY month DESC LIMIT 1) AS last_month_revenue,
    (SELECT JSON_AGG(JSON_BUILD_OBJECT('dept', department, 'cost', monthly_cost)) FROM department_costs) AS dept_breakdown;

-- Обновлять раз в час через cron
-- 0 * * * * psql -c "REFRESH MATERIALIZED VIEW dashboard_metrics;"
```

---

## Практическое задание

### Задание 1: Аналитическая система HR (обязательно)

Создайте систему аналитики с использованием подзапросов, CTE и представлений:

```sql
CREATE DATABASE hr_analytics;
\c hr_analytics

-- (Используем таблицы employees и departments из начала урока)

-- 1. Создайте представление для senior-сотрудников
CREATE VIEW senior_employees AS
SELECT 
    e.name,
    e.department,
    e.position,
    e.salary,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)) AS years_in_company
FROM employees e
WHERE EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)) >= 3;

-- 2. Создайте CTE для анализа зарплат по квартилям
WITH salary_quartiles AS (
    SELECT 
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY salary) AS q1,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY salary) AS median,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY salary) AS q3
    FROM employees
)
SELECT 
    e.name,
    e.salary,
    CASE 
        WHEN e.salary <= sq.q1 THEN 'Low'
        WHEN e.salary <= sq.median THEN 'Below Average'
        WHEN e.salary <= sq.q3 THEN 'Above Average'
        ELSE 'High'
    END AS salary_bracket
FROM employees e, salary_quartiles sq
ORDER BY e.salary;

-- 3. Создайте материализованное представление для отчета
CREATE MATERIALIZED VIEW mv_hr_report AS
WITH 
dept_stats AS (
    SELECT 
        department,
        COUNT(*) AS headcount,
        AVG(salary) AS avg_salary,
        MIN(salary) AS min_salary,
        MAX(salary) AS max_salary
    FROM employees
    GROUP BY department
),
dept_seniority AS (
    SELECT 
        department,
        AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date))) AS avg_years
    FROM employees
    GROUP BY department
)
SELECT 
    ds.department,
    ds.headcount,
    ROUND(ds.avg_salary, 2) AS avg_salary,
    ds.max_salary - ds.min_salary AS salary_range,
    ROUND(dsen.avg_years, 1) AS avg_seniority_years,
    d.budget,
    ROUND((ds.headcount * ds.avg_salary * 12) / d.budget * 100, 2) AS payroll_to_budget_percent
FROM dept_stats ds
JOIN dept_seniority dsen ON ds.department = dsen.department
JOIN departments d ON ds.department = d.name;

CREATE INDEX ON mv_hr_report(department);
```

**Задания по запросам:**

**1. Найти сотрудников, получающих больше своего менеджера:**
```sql
SELECT 
    e.name AS employee,
    e.salary AS emp_salary,
    m.name AS manager,
    m.salary AS mgr_salary,
    e.salary - m.salary AS difference
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;
```

**2. Топ-3 сотрудника по зарплате в каждом отделе (CTE):**
```sql
WITH ranked_employees AS (
    SELECT 
        name,
        department,
        salary,
        ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS rank
    FROM employees
)
SELECT 
    department,
    name,
    salary,
    rank
FROM ranked_employees
WHERE rank <= 3
ORDER BY department, rank;
```

**3. Отделы с зарплатным фондом выше среднего:**
```sql
WITH dept_payroll AS (
    SELECT 
        department,
        SUM(salary) AS total_payroll
    FROM employees
    GROUP BY department
)
SELECT 
    department,
    total_payroll,
    (SELECT AVG(total_payroll) FROM dept_payroll) AS avg_payroll
FROM dept_payroll
WHERE total_payroll > (SELECT AVG(total_payroll) FROM dept_payroll)
ORDER BY total_payroll DESC;
```

**4. Рекурсивный запрос: полная иерархия компании:**
```sql
WITH RECURSIVE org_hierarchy AS (
    -- Топ-менеджеры (без руководителя)
    SELECT 
        id,
        name,
        position,
        salary,
        manager_id,
        name AS path,
        0 AS level
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Подчиненные
    SELECT 
        e.id,
        e.name,
        e.position,
        e.salary,
        e.manager_id,
        oh.path || ' -> ' || e.name,
        oh.level + 1
    FROM employees e
    JOIN org_hierarchy oh ON e.manager_id = oh.id
)
SELECT 
    REPEAT('  ', level) || name AS org_chart,
    position,
    salary,
    level
FROM org_hierarchy
ORDER BY path;
```

**5. Коррелированный подзапрос: разница с средней зарплатой в отделе:**
```sql
SELECT 
    e1.name,
    e1.department,
    e1.salary,
    (
        SELECT ROUND(AVG(e2.salary), 2)
        FROM employees e2
        WHERE e2.department = e1.department
    ) AS dept_avg,
    e1.salary - (
        SELECT AVG(e2.salary)
        FROM employees e2
        WHERE e2.department = e1.department
    ) AS diff_from_dept_avg
FROM employees e1
ORDER BY e1.department, e1.salary DESC;
```

---

### Задание 2: Система рекомендаций (дополнительно)

Создайте систему карьерных рекомендаций:

```sql
-- 1. Кандидаты на повышение (в компании >2 лет, зарплата в верхних 25%)
CREATE VIEW promotion_candidates AS
WITH salary_quartiles AS (
    SELECT 
        department,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY salary) AS q3
    FROM employees
    GROUP BY department
)
SELECT 
    e.name,
    e.department,
    e.position,
    e.salary,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)) AS years,
    sq.q3 AS dept_q3_salary
FROM employees e
JOIN salary_quartiles sq ON e.department = sq.department
WHERE e.salary >= sq.q3
  AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)) >= 2
ORDER BY years DESC, e.salary DESC;

-- 2. Сотрудники с риском увольнения (низкая зарплата + долго в компании)
CREATE VIEW retention_risk AS
SELECT 
    e.name,
    e.department,
    e.salary,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)) AS years,
    (
        SELECT AVG(salary)
        FROM employees e2
        WHERE e2.department = e.department
    ) AS dept_avg_salary,
    e.salary / (
        SELECT AVG(salary)
        FROM employees e2
        WHERE e2.department = e.department
    ) * 100 AS salary_percent_of_avg
FROM employees e
WHERE e.salary < (
    SELECT AVG(salary)
    FROM employees e2
    WHERE e2.department = e.department
) * 0.9  -- Зарплата ниже 90% средней
  AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.hire_date)) >= 3
ORDER BY salary_percent_of_avg;

-- 3. Бюджет на повышение зарплат (довести всех до среднего уровня)
WITH salary_gaps AS (
    SELECT 
        e.name,
        e.department,
        e.salary AS current_salary,
        (
            SELECT AVG(salary)
            FROM employees e2
            WHERE e2.department = e.department
        ) AS dept_avg,
        GREATEST(
            (
                SELECT AVG(salary)
                FROM employees e2
                WHERE e2.department = e.department
            ) - e.salary,
            0
        ) AS needed_raise
    FROM employees e
)
SELECT 
    department,
    COUNT(*) AS employees_need_raise,
    SUM(needed_raise) AS total_raise_budget,
    ROUND(AVG(needed_raise), 2) AS avg_raise_per_person
FROM salary_gaps
WHERE needed_raise > 0
GROUP BY department
ORDER BY total_raise_budget DESC;
```

---

### Задание 3: Создайте свою аналитическую систему (творческое)

Выберите предметную область и создайте:
1. 3+ сложных подзапроса (коррелированных и независимых)
2. 2+ CTE с несколькими уровнями
3. 1 рекурсивный CTE
4. 3+ представления (Views)
5. 1 материализованное представление

**Варианты предметных областей:**
- Образование (студенты, курсы, оценки)
- E-commerce (товары, заказы, отзывы)
- Соцсеть (пользователи, посты, подписки)
- Библиотека (книги, авторы, выдачи)

---

## Контрольные вопросы

Проверьте себя:

1. Что такое скалярный подзапрос?
2. В чем разница между ANY и ALL?
3. Когда использовать EXISTS вместо IN?
4. Что такое коррелированный подзапрос?
5. Зачем нужны CTE (WITH-запросы)?
6. Как работает рекурсивный CTE?
7. В чем разница между View и Materialized View?
8. Можно ли обновлять данные через представление?
9. Когда использовать материализованное представление?
10. Как обновить материализованное представление?
11. В чем преимущество CTE перед подзапросами?
12. Что такое REFRESH MATERIALIZED VIEW CONCURRENTLY?

<details>
<summary>Ответы</summary>

1. Подзапрос, возвращающий одно значение (1 строка, 1 столбец).
2. ANY — хотя бы одно истинно (MIN), ALL — все истинны (MAX).
3. EXISTS быстрее для больших таблиц и работает с коррелированными подзапросами.
4. Подзапрос, который ссылается на внешний запрос и выполняется для каждой строки.
5. Для читабельности, переиспользования и структурирования сложных запросов.
6. Содержит базовый и рекурсивный случаи, вызывает сам себя до условия остановки.
7. View — сохраненный запрос, MV — запрос + физические данные.
8. Да, если представление простое (без JOIN, GROUP BY, агрегатов).
9. Когда запрос тяжелый, данные обновляются редко, много одинаковых запросов.
10. REFRESH MATERIALIZED VIEW view_name;
11. Читабельность, переиспользование, возможность рекурсии.
12. Обновление без блокировки чтения (требует UNIQUE индекс).
</details>

---

## Типичные ошибки и их решения

### Ошибка 1: Подзапрос вернул больше одного значения

```sql
-- ❌ ОШИБКА
SELECT name, salary
FROM employees
WHERE salary > (SELECT salary FROM employees WHERE department = 'IT');
-- ERROR: more than one row returned

-- ✅ РЕШЕНИЕ 1: использовать агрегатную функцию
WHERE salary > (SELECT MAX(salary) FROM employees WHERE department = 'IT');

-- ✅ РЕШЕНИЕ 2: использовать ALL/ANY
WHERE salary > ALL (SELECT salary FROM employees WHERE department = 'IT');
```

### Ошибка 2: Забыли RECURSIVE в рекурсивном CTE

```sql
-- ❌ ОШИБКА
WITH org_tree AS (
    SELECT id, name, manager_id FROM employees WHERE manager_id IS NULL
    UNION ALL
    SELECT e.id, e.name, e.manager_id 
    FROM employees e 
    JOIN org_tree ON e.manager_id = org_tree.id
)
SELECT * FROM org_tree;
-- ERROR

-- ✅ ПРАВИЛЬНО: добавить RECURSIVE
WITH RECURSIVE org_tree AS (
    ...
)
```

### Ошибка 3: Обновление сложного представления

```sql
-- ❌ ОШИБКА: нельзя обновить (есть GROUP BY)
CREATE VIEW dept_summary AS
SELECT department, COUNT(*) AS cnt, AVG(salary) AS avg
FROM employees
GROUP BY department;

UPDATE dept_summary SET cnt = 10 WHERE department = 'IT';
-- ERROR: cannot update view with aggregates

-- ✅ РЕШЕНИЕ: обновлять базовую таблицу или создать INSTEAD OF триггер
```

### Ошибка 4: REFRESH без индекса в CONCURRENTLY

```sql
-- ❌ ОШИБКА
CREATE MATERIALIZED VIEW mv_stats AS SELECT ...;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats;
-- ERROR: CONCURRENTLY requires a unique index

-- ✅ РЕШЕНИЕ: создать уникальный индекс
CREATE UNIQUE INDEX ON mv_stats (id);
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stats;
```

### Ошибка 5: Бесконечная рекурсия

```sql
-- ❌ ОПАСНО: может зациклиться
WITH RECURSIVE infinite AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 FROM infinite  -- Нет условия остановки!
)
SELECT * FROM infinite;

-- ✅ ПРАВИЛЬНО: добавить условие остановки
WITH RECURSIVE numbers AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 FROM numbers WHERE n < 100  -- Условие!
)
SELECT * FROM numbers;
```

---

## Шпаргалка

```sql
-- ПОДЗАПРОСЫ
-- В WHERE
WHERE column > (SELECT AVG(column) FROM table)
WHERE column IN (SELECT column FROM table)
WHERE EXISTS (SELECT 1 FROM table WHERE ...)

-- В SELECT
SELECT column, (SELECT MAX(x) FROM table2) AS max_x

-- В FROM
FROM (SELECT ... FROM table) AS subquery

-- Операторы
ANY, ALL, IN, NOT IN, EXISTS, NOT EXISTS

-- CTE (WITH)
WITH cte_name AS (
    SELECT ...
)
SELECT * FROM cte_name;

-- Множественные CTE
WITH 
cte1 AS (SELECT ...),
cte2 AS (SELECT ... FROM cte1)
SELECT * FROM cte2;

-- Рекурсивный CTE
WITH RECURSIVE cte AS (
    SELECT ... -- базовый случай
    UNION ALL
    SELECT ... FROM cte WHERE ... -- рекурсия
)
SELECT * FROM cte;

-- ПРЕДСТАВЛЕНИЯ
CREATE VIEW view_name AS SELECT ...;
CREATE OR REPLACE VIEW view_name AS SELECT ...;
DROP VIEW view_name;

-- Материализованные представления
CREATE MATERIALIZED VIEW mv_name AS SELECT ...;
REFRESH MATERIALIZED VIEW mv_name;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_name;
DROP MATERIALIZED VIEW mv_name;
```

---

## Лучшие практики

### 1. Используйте CTE для читабельности

```sql
-- ✅ ХОРОШО: с CTE
WITH 
high_earners AS (
    SELECT * FROM employees WHERE salary > 150000
),
departments_list AS (
    SELECT name FROM departments WHERE budget > 2000000
)
SELECT * FROM high_earners
WHERE department IN (SELECT name FROM departments_list);

-- ❌ ПЛОХО: вложенные подзапросы
SELECT * FROM employees
WHERE salary > 150000
  AND department IN (
    SELECT name FROM departments WHERE budget > 2000000
  );
```

### 2. Давайте понятные имена CTE

```sql
-- ✅ ХОРОШО
WITH 
monthly_revenue AS (...),
active_customers AS (...),
high_value_orders AS (...)

-- ❌ ПЛОХО
WITH 
cte1 AS (...),
temp AS (...),
data AS (...)
```

### 3. Документируйте сложные запросы

```sql
-- Анализ оттока клиентов:
-- 1. Находим клиентов без заказов последние 90 дней
-- 2. Считаем их предыдущую активность
-- 3. Классифицируем риск оттока
WITH inactive_customers AS (
    -- Клиенты без недавних заказов
    SELECT ...
),
previous_activity AS (
    -- Их активность до того
    SELECT ...
)
SELECT ...
```

### 4. Используйте EXPLAIN для оптимизации

```sql
-- Проверить план выполнения
EXPLAIN ANALYZE
WITH dept_stats AS (...)
SELECT * FROM dept_stats;
```

### 5. Индексируйте материализованные представления

```sql
CREATE MATERIALIZED VIEW mv_data AS SELECT ...;

-- Создать индексы для быстрого доступа
CREATE INDEX ON mv_data(department);
CREATE INDEX ON mv_data(date);
```

### 6. Обновляйте MV регулярно

```sql
-- В cron каждый час
0 * * * * psql -d mydb -c "REFRESH MATERIALIZED VIEW mv_stats;"

-- Или через pg_cron расширение
SELECT cron.schedule('refresh-stats', '0 * * * *', 
  'REFRESH MATERIALIZED VIEW mv_stats;');
```

---

## Производительность

### Подзапросы vs JOIN

```sql
-- Подзапрос (может быть медленнее)
SELECT *
FROM employees
WHERE department IN (
    SELECT name FROM departments WHERE budget > 2000000
);

-- JOIN (обычно быстрее)
SELECT DISTINCT e.*
FROM employees e
JOIN departments d ON e.department = d.name
WHERE d.budget > 2000000;

-- Используйте EXPLAIN для сравнения!
```

### EXISTS vs IN

```sql
-- EXISTS (быстрее для больших таблиц)
SELECT *
FROM departments d
WHERE EXISTS (
    SELECT 1 FROM employees e WHERE e.department = d.name
);

-- IN (проще, но может быть медленнее)
SELECT *
FROM departments
WHERE name IN (SELECT DISTINCT department FROM employees);
```

### Материализация vs пересчет

```sql
-- Если запрос выполняется часто и тяжелый:
CREATE MATERIALIZED VIEW mv_heavy_query AS
SELECT ...;  -- Сложные вычисления

-- Обновлять периодически
REFRESH MATERIALIZED VIEW mv_heavy_query;

-- Быстрый доступ
SELECT * FROM mv_heavy_query WHERE ...;
```

---

## Полезные ресурсы

**Документация:**
- https://www.postgresql.org/docs/current/queries-with.html (CTE)
- https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-SUBQUERIES
- https://www.postgresql.org/docs/current/sql-createview.html
- https://www.postgresql.org/docs/current/rules-materializedviews.html

**Практика:**
- PostgreSQL Exercises (subqueries section)
- Use The Index, Luke (performance)
