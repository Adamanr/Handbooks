---
sidebar_position: 13
description: "В этом уроке мы научимся работать с базами данных PostgreSQL в Go с использованием пакета pgx."
---

# Работа с базами данных: pgx и pgxpool

Добро пожаловать в урок про работу с PostgreSQL в Go! Мы сосредоточимся на **pgx** — современном, быстром и типобезопасном драйвере, который стал стандартом де-факто в Go-сообществе.

**Почему pgx, а не `database/sql` + `lib/pq`?**
- Выше производительность (нативный протокол PostgreSQL)
- Лучшая поддержка типов (arrays, JSONB, hstore, uuid и др.)
- Отличная интеграция с контекстами и пулами
- Активно развивается (в отличие от устаревшего `lib/pq`)

Установка:
```bash
go get github.com/jackc/pgx/v5
go get github.com/jackc/pgx/v5/pgxpool
```

## Работа с PostgreSQL

### Простое подключение (pgx.Conn)

```go
package main

import (
    "context"
    "fmt"
    "log"
    "time"

    "github.com/jackc/pgx/v5"
)

func main() {
    ctx := context.Background()

    // Строка подключения, где user - имя пользователя, password - пароль, dbname - имя базы данных, localhost - адрес сервера, 5432 - порт (Если у вас другие данные, то замените их на свои)
    connStr := "postgres://user:password@localhost:5432/dbname?sslmode=disable"

    // Создание подключения
    conn, err := pgx.Connect(ctx, connStr)
    if err != nil {
        log.Fatal("Не удалось подключиться:", err)
    }
    defer conn.Close(ctx) 	// Отложенное закрытие подключения

    // Проверка соединения
    if err := conn.Ping(ctx); err != nil {
        log.Fatal("Ping failed:", err)
    }

    fmt.Println("Успешно подключено к PostgreSQL!")
}
```

## Пул соединений (pgxpool)

### Что такое пул соединений

**Пул соединений** (connection pool) — это **кэш готовых подключений к базе данных**, который приложение держит открытыми, чтобы быстро их использовать вместо того, чтобы каждый раз создавать новое соединение с нуля.

### Почему это важно?
Подключение к базе данных (например, PostgreSQL) — **дорогая операция**:
- TCP-handshake (рукопожатие).
- Аутентификация (логин/пароль).
- Настройка сессии.
Это занимает десятки-сотни миллисекунд.

Если в веб-приложении каждый HTTP-запрос будет открывать новое соединение к БД — сервер быстро "захлебнётся", особенно под нагрузкой (сотни запросов в секунду).

### Как работает пул соединений?
Представь ящик с готовыми ключами от базы данных:

1. При старте приложения пул создаёт несколько (например, 5–25) открытых соединений и держит их в резерве.
2. Когда твоему коду нужно выполнить SQL-запрос:
   - Он **берёт одно свободное соединение** из пула (очень быстро).
   - Выполняет запрос.
   - **Возвращает соединение обратно** в пул (не закрывает его!).
3. Другое место в коде может сразу взять это же соединение.
4. Пул сам следит за здоровьем соединений:
   - Периодически проверяет (health check), живы ли они.
   - Закрывает старые/плохие и создаёт новые.
   - Не даёт создать слишком много (чтобы не перегрузить БД).

### Классическая настройка пула для веб-сервиса
```go
config.MaxConns = 25        // максимум 25 одновременных соединений
config.MinConns = 5         // минимум 5 всегда держим открытыми
config.MaxConnLifetime = time.Hour     // соединение живёт не дольше часа
config.MaxConnIdleTime = 30 * time.Minute // если не использовалось 30 мин — закрыть
config.HealthCheckPeriod = 1 * time.Minute // проверять здоровье каждую минуту
```

### Зачем нужен пул соединений?
1. **Скорость**  
   Запрос к БД начинается почти мгновенно — не нужно ждать установку соединения.

2. **Экономия ресурсов**  
   Не создаём тысячи соединений — БД не падает от перегрузки.

3. **Стабильность под нагрузкой**  
   При 1000 одновременных пользователей пул ограничит реальные соединения до 25–50, остальные запросы встанут в очередь, а не упадут.

4. **Автоматическое восстановление**  
   Если соединение "зависло" или разорвалось — пул его закроет и создаст новое.

### Что будет БЕЗ пула?
```go
// Плохо — каждое обращение создаёт новое соединение
conn, err := pgx.Connect(ctx, connStr)
defer conn.Close()  // закрываем сразу
```
Под нагрузкой:
- БД получает сотни новых подключений в секунду.
- Исчерпываются ресурсы сервера БД.
- Приложение тормозит или падает.


### Пример

```go
package database

import (
    "context"
    "log"
    "time"

    "github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func InitPool(connStr string) error {
    ctx := context.Background()

    config, err := pgxpool.ParseConfig(connStr)
    if err != nil {
        return err
    }

    // Настройка пула
    config.MaxConns = 25
    config.MinConns = 5
    config.MaxConnLifetime = time.Hour
    config.MaxConnIdleTime = 30 * time.Minute
    config.HealthCheckPeriod = 1 * time.Minute

    // Создание пула
    pool, err := pgxpool.NewWithConfig(ctx, config)
    if err != nil {
        return err
    }

    // Проверка подключения
    if err := pool.Ping(ctx); err != nil {
        return err
    }

    Pool = pool
    slog.Info("Пул соединений с PostgreSQL инициализирован")
    return nil
}

func Close() {
    if Pool != nil {
        Pool.Close()
    }
}
```

## Модели и базовые операции

```go
// models/user.go
package models

import (
    "context"
    "time"

    "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgxpool"
)

type User struct {
    ID        int       `json:"id"`
    Username  string    `json:"username"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type UserRepository struct {
    pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
    return &UserRepository{pool: pool}
}
```

Этот код — **начало слоя работы с пользователями** в типичном Go-приложении с PostgreSQL. Он определяет, **как выглядит пользователь** и **как с ним работать через базу данных**.

#### Разберём по частям:

#### 1. Пакет `models`
Файл находится в папке `models/`, и пакет называется `models`.  
Это стандартное место в Go-проектах для хранения **структур данных** (моделей), которые соответствуют таблицам в базе данных или объектам в API.

#### 2. Структура `User`
```go
type User struct {
    ID        int       `json:"id"`
    Username  string    `json:"username"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
```
Это **модель пользователя** — простое описание того, какие данные у пользователя есть.

- `ID` — уникальный идентификатор (обычно автоинкремент в БД).
- `Username` и `Email` — основные поля.
- `CreatedAt` и `UpdatedAt` — timestamps: когда пользователь создан и когда последний раз обновлён (очень распространённая практика).

Теги ``json:"..."`` нужны для:
- Автоматической сериализации в JSON (например, при возврате из API).
- Поле в Go называется `CreatedAt`, а в JSON будет `created_at` (snake_case — стандарт для JSON).

#### 3. Структура `UserRepository`
```go
type UserRepository struct {
    pool *pgxpool.Pool
}
```
Это **репозиторий** — объект, который отвечает за все операции с пользователями в базе данных (создать, прочитать, обновить, удалить — CRUD).

- Он хранит внутри указатель на **пул соединений** (`*pgxpool.Pool`), который мы видели раньше.
- Благодаря пулу репозиторий может безопасно и быстро брать соединение для каждого запроса.

#### 4. Функция `NewUserRepository`
```go
func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
    return &UserRepository{pool: pool}
}
```
Это **конструктор** — стандартный способ создать репозиторий.

Пример использования где-то в `main.go` или в инициализации приложения:
```go
repo := models.NewUserRepository(database.Pool)  // Pool — глобальный пул из предыдущего урока
```

#### Что будет дальше?
В следующих файлах (например, `user_repository.go`) ты добавишь методы к `UserRepository`:
```go
func (r *UserRepository) Create(ctx context.Context, user *models.User) error { ... }
func (r *UserRepository) GetByID(ctx context.Context, id int) (*models.User, error) { ... }
```
и т.д. — они будут выполнять реальные SQL-запросы через пул.


### Выборка одной строки

```go
func (r *UserRepository) GetByID(ctx context.Context, id int) (*User, error) {
    query := `
        SELECT id, username, email, created_at, updated_at
        FROM users
        WHERE id = $1
    `

    user := &User{}
    err := r.pool.QueryRow(ctx, query, id).Scan(
        &user.ID,
        &user.Username,
        &user.Email,
        &user.CreatedAt,
        &user.UpdatedAt,
    )
    if err == pgx.ErrNoRows {
        return nil, fmt.Errorf("пользователь не найден")
    }
    if err != nil {
        return nil, err
    }

    return user, nil
}
```

### Выборка нескольких строк

```go
func (r *UserRepository) List(ctx context.Context, limit, offset int) ([]*User, error) {
    query := `
        SELECT id, username, email, created_at, updated_at
        FROM users
        ORDER BY id
        LIMIT $1 OFFSET $2
    `

    rows, err := r.pool.Query(ctx, query, limit, offset)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var users []*User
    for rows.Next() {
        user := &User{}
        err := rows.Scan(
            &user.ID,
            &user.Username,
            &user.Email,
            &user.CreatedAt,
            &user.UpdatedAt,
        )
        if err != nil {
            return nil, err
        }
        users = append(users, user)
    }

    if err := rows.Err(); err != nil {
        return nil, err
    }

    return users, nil
}
```

### Вставка данных

```go
func (r *UserRepository) Create(ctx context.Context, username, email string) (*User, error) {
    query := `
        INSERT INTO users (username, email, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING id, username, email, created_at, updated_at
    `

    user := &User{}
    err := r.pool.QueryRow(ctx, query, username, email).Scan(
        &user.ID,
        &user.Username,
        &user.Email,
        &user.CreatedAt,
        &user.UpdatedAt,
    )
    if err != nil {
        return nil, err
    }

    return user, nil
}
```

### Обновление и удаление

```go
func (r *UserRepository) Update(ctx context.Context, user *User) error {
    query := `
        UPDATE users
        SET username = $1, email = $2, updated_at = NOW()
        WHERE id = $3
    `

    result, err := r.pool.Exec(ctx, query, user.Username, user.Email, user.ID)
    if err != nil {
        return err
    }

    if result.RowsAffected() == 0 {
        return fmt.Errorf("пользователь не найден")
    }

    return nil
}

func (r *UserRepository) Delete(ctx context.Context, id int) error {
    query := `DELETE FROM users WHERE id = $1`

    result, err := r.pool.Exec(ctx, query, id)
    if err != nil {
        return err
    }

    if result.RowsAffected() == 0 {
        return fmt.Errorf("пользователь не найден")
    }

    return nil
}
```

## Транзакции

### Что такое транзакции в базе данных и зачем они нужны?

**Транзакция** — это **группа SQL-операций**, которые выполняются как **единое целое**: либо **все** успешно завершаются (commit), либо **ни одна** не применяется (rollback). Это гарантирует, что база данных всегда остаётся в **согласованном (консистентном)** состоянии, даже если что-то пошло не так.

> <br /> Классический пример — **перевод денег между счетами**.  

Нельзя допустить ситуацию, когда:
- Деньги списались с одного счёта,
- А на второй не зачислились (из-за ошибки, сбоя сервера, отключения электричества и т.д.).

Без транзакции это могло бы привести к потере денег.  

> <br /> С транзакцией — либо перевод полностью прошёл, либо вообще не произошёл.

#### Свойства транзакций (ACID)
1. **Atomicity (Атомарность)** — всё или ничего.
2. **Consistency (Согласованность)** — база переходит из одного корректного состояния в другое.
3. **Isolation (Изоляция)** — параллельные транзакции не мешают друг другу.
4. **Durability (Долговечность)** — после commit изменения сохранены навсегда, даже при падении сервера.

#### Как работает транзакция 

```go
func (r *UserRepository) TransferMoney(ctx context.Context, fromID, toID int, amount float64) error {
    tx, err := r.pool.Begin(ctx)  // 1. Начинаем транзакцию
    if err != nil {
        return err
    }
    defer tx.Rollback(ctx)        // 2. Гарантированный откат, если не будет Commit

    // 3. Первая операция: списываем деньги
    _, err = tx.Exec(ctx, "UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1", amount, fromID)
    if err != nil {
        return err  // ← если ошибка — выходим, defer вызовет Rollback автоматически
    }

    // 4. Вторая операция: зачисляем деньги
    _, err = tx.Exec(ctx, "UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, toID)
    if err != nil {
        return err  // ← снова, при ошибке всё откатится
    }

    return tx.Commit(ctx)         // 5. Всё хорошо — фиксируем изменения
}
```

#### Пошагово, что происходит:
1. `r.pool.Begin(ctx)` — берём соединение из пула и начинаем транзакцию.
2. `defer tx.Rollback(ctx)` — **очень важная строчка**!  
   Гарантирует, что если функция завершится с ошибкой (или паникой), все изменения будут отменены.
3. Выполняем два UPDATE внутри одной транзакции.
4. Если хоть одна операция вернула ошибку — функция возвращает ошибку → `defer` срабатывает → `Rollback` → деньги остаются на месте.
5. Если обе операции прошли успешно — вызываем `Commit` → изменения сохраняются навсегда.

#### Почему `defer tx.Rollback()` безопасно ставить сразу?
Потому что:
- `Rollback` — идемпотентная операция (можно вызвать несколько раз — ничего страшного).
- Если уже был `Commit`, то `Rollback` просто вернёт ошибку, которую можно игнорировать (или проверить).
В pgx это безопасно — после успешного Commit последующий Rollback не сломает ничего.

#### Когда использовать транзакции
- Перевод денег, заказ товаров (списать со склада + создать заказ).
- Регистрация пользователя + отправка email (хотя email лучше вне транзакции).
- Любые операции, где несколько таблиц должны измениться согласованно.

#### Когда НЕ нужны
- Простой SELECT или один INSERT/UPDATE, который не влияет на другие данные.


### Пример

```go
func (r *UserRepository) TransferMoney(ctx context.Context, fromID, toID int, amount float64) error {
    tx, err := r.pool.Begin(ctx)
    if err != nil {
        return err
    }
    defer tx.Rollback(ctx) // безопасно после Commit

    // Списание
    _, err = tx.Exec(ctx,
        "UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1",
        amount, fromID,
    )
    if err != nil {
        return err
    }

    // Зачисление
    _, err = tx.Exec(ctx,
        "UPDATE accounts SET balance = balance + $1 WHERE id = $2",
        amount, toID,
    )
    if err != nil {
        return err
    }

    return tx.Commit(ctx)
}
```

## Работа с JSONB, массивами и другими типами PostgreSQL

```go
type UserProfile struct {
    ID      int                    `json:"id"`
    UserID  int                    `json:"user_id"`
    Settings map[string]interface{} `json:"settings"` // JSONB
    Tags    []string               `json:"tags"`     // text[]
    Location *string               `json:"location"` // nullable
}

// Сохранение профиля с JSONB
func (r *UserRepository) SaveProfile(ctx context.Context, profile *UserProfile) error {
    query := `
        INSERT INTO user_profiles (user_id, settings, tags, location)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id) DO UPDATE
        SET settings = EXCLUDED.settings,
            tags = EXCLUDED.tags,
            location = EXCLUDED.location
    `

    _, err := r.pool.Exec(ctx, query,
        profile.UserID,
        profile.Settings, // pgx автоматически сериализует map в JSONB
        profile.Tags,    // []string → text[]
        profile.Location,
    )
    return err
}
```

## Batch-операции (пакетная вставка)

### Что такое batch-операции и зачем они нужны

**Batch-операции** — это способ отправить **несколько SQL-запросов за один раз** на сервер базы данных, вместо того чтобы отправлять их по одному.

#### Зачем это нужно?
Если вставлять пользователей по одному:
```go
for _, user := range users {
    r.pool.Exec(ctx, query, user.Username, user.Email)  // отдельный запрос каждый раз
}
```
То для 1000 пользователей будет **1000 отдельных запросов** к БД.

Каждый запрос — это:
- Сетевая задержка (round-trip).
- Парсинг SQL на сервере.
- Планирование выполнения.
- Отправка ответа обратно.

Это **медленно** (особенно при большом количестве записей) и создаёт лишнюю нагрузку на БД.

Batch решает это: все запросы отправляются **одним пакетом** → сервер обрабатывает их эффективнее → **в разы быстрее**.

#### Пример работы с Batch

```go
func (r *UserRepository) CreateBatch(ctx context.Context, users []User) error {
    batch := &pgx.Batch{}  // 1. Создаём пустой batch

    query := `INSERT INTO users (username, email, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())`

    for _, user := range users {
        batch.Queue(query, user.Username, user.Email)  // 2. Добавляем запрос в очередь
    }

    br := r.pool.SendBatch(ctx, batch)  // 3. Отправляем весь batch на сервер
    defer br.Close()                    // закрываем в конце

    for range users {                   // 4. Получаем результаты по порядку
        _, err := br.Exec()
        if err != nil {
            return err  // если ошибка в одном — прерываем
        }
    }

    return nil
}
```

#### Пошагово:
1. **Создаём batch** — это как корзина для запросов.
2. **Queue** — добавляем в корзину один и тот же INSERT, но с разными параметрами (для каждого пользователя).
3. **SendBatch** — отправляем всю корзину одним сетевым пакетом на сервер PostgreSQL.
4. **Цикл br.Exec()** — последовательно читаем результаты выполнения каждого запроса из batch (важно в том же порядке!).

#### Преимущества batch-вставки
- **Скорость**: вставка 1000 записей может ускориться в 5–20 раз.
- **Меньше нагрузки** на сеть и БД.
- **Меньше overhead** на парсинг и планирование запросов.

#### Когда использовать
- Импорт большого количества данных (пользователи, логи, заказы).
- Миграции.
- Загрузка данных из файла/очереди.
- Любые массовые INSERT/UPDATE.

#### Альтернативы
- **COPY** — ещё быстрее для миллионов строк (специальная команда PostgreSQL для bulk-загрузки).
- **Множественный INSERT**: `INSERT INTO users VALUES (1,...), (2,...), (3,...)` — тоже быстро, но сложнее строить строку вручную.
- Batch — золотая середина: просто, безопасно (с параметрами), быстро.

#### Важные моменты
- Порядок важен: запросы выполняются и читаются в той же последовательности, в которой добавлялись.
- Если один запрос в batch упал — вся операция прерывается (нет автоматического rollback, как в транзакции — если нужно, оберни batch в транзакцию).
- Batch не заменяет транзакцию: если нужна атомарность — используй и то, и другое.

## CopyFrom — сверхбыстрая загрузка данных

### Что такое CopyFrom и зачем он нужен

**`CopyFrom`** — это **сверхбыстрая команда PostgreSQL** под названием **COPY**, которую pgx позволяет использовать напрямую из Go. Она предназначена для **мгновенной загрузки огромного количества строк** (тысяч, десятков тысяч, миллионов) в таблицу базы данных.

Это **самый быстрый способ** вставить много данных в PostgreSQL — в десятки и сотни раз быстрее, чем обычные INSERT или даже batch-вставка.

#### Почему COPY так быстрый?
Обычный INSERT (даже batch):
- Каждый запрос парсится, планируется, проверяется ограничения.
- Отправляется ответ клиенту.

COPY:
- Работает в **специальном бинарном или текстовом режиме**.
- Отправляет данные **потоком** напрямую в таблицу.
- Пропускает большую часть overhead (парсинг, планирование, логирование для каждой строки).
- Обходит многие проверки на лету (но всё равно применяет их в конце).

Результат: загрузка миллионов строк за секунды вместо минут.

#### Как работает код в твоём примере

```go
func (r *UserRepository) CopyUsers(ctx context.Context, users []User) (int64, error) {
    // 1. Подготавливаем данные в виде "строк" для COPY
    rows := make([][]interface{}, len(users))
    for i, user := range users {
        rows[i] = []interface{}{user.Username, user.Email}  // только те поля, которые вставляем
    }

    // 2. Вызываем CopyFrom
    count, err := r.pool.CopyFrom(
        ctx,
        pgx.Identifier{"users"},              // таблица: users
        []string{"username", "email"},        // столбцы, в которые вставляем
        pgx.CopyFromRows(rows),               // источник данных — наш слайс rows
    )
    return count, err  // count — сколько строк успешно загружено
}
```

#### Пошагово:
1. **Подготавливаем данные** как двумерный слайс `[][]interface{}` — каждая внутренняя строка соответствует одной записи в таблице, в том же порядке, что и столбцы.
2. **CopyFrom**:
   - Указываем таблицу (`users`).
   - Указываем столбцы (можно не все, только нужные).
   - Источник — `CopyFromRows(rows)` — pgx сам преобразует это в поток для COPY.
3. PostgreSQL получает данные потоком и вставляет их максимально быстро.
4. Возвращается количество успешно вставленных строк.

#### Когда использовать CopyFrom
- Импорт большого CSV/JSON файла.
- Миграции данных.
- Загрузка логов, метрик, событий.
- Инициализация тестовыми данными.
- Любая массовая вставка > 1000 строк.

#### Сравнение скорости (примерно)
| Количество строк | Обычный INSERT | Batch (pgx.Batch) | CopyFrom |
|------------------|----------------|-------------------|----------|
| 1 000            | 200–500 мс     | 50–150 мс         | 10–30 мс |
| 10 000           | 2–5 сек        | 300–800 мс        | 50–150 мс |
| 100 000          | 20–60 сек      | 3–8 сек           | 300–800 мс |
| 1 000 000        | минуты         | десятки секунд    | 3–10 сек |

#### Важные особенности
- **Нет возврата ID** (например, автоинкрементных) для каждой строки — если нужны ID, лучше использовать INSERT с RETURNING или другой подход.
- Если хотя бы одна строка нарушает ограничение (unique, not null и т.д.) — **вся операция падает**.
- Лучше использовать внутри транзакции, если нужна атомарность.
- Идеально комбинировать с чтением из файла (pgx поддерживает CopyFrom из io.Reader).

## Миграции 

Миграции — это система контроля версий для структуры вашей базы данных. Так же, как Git позволяет отслеживать изменения в коде, миграции позволяют отслеживать, применять и откатывать изменения в схеме БД (таблицы, столбцы, индексы, связи и т.д.).

#### Основная идея

Вместо того чтобы вручную писать SQL-скрипты (CREATE TABLE, ALTER TABLE) и надеяться, что все в команде и на серверах выполнят их в правильном порядке, вы описываете каждое изменение в виде отдельного файла-миграции. Специальные инструменты применяют эти файлы в строгой последовательности.

### Goose

**Goose** — популярный инструмент от [**pressly/goose**](https://github.com/pressly/goose) для управления миграциями базы данных в Go. Он поддерживает SQL-миграции (самый распространённый вариант), миграции на Go (для сложной логики) и работает с PostgreSQL, MySQL, SQLite и другими БД.

#### Установка
```bash
go install github.com/pressly/goose/v3/cmd/goose@latest
```

Это установит бинарник `goose` в ваш `$GOPATH/bin` (убедитесь, что он в PATH).

#### Создание миграции
Создайте папку для миграций (обычно `migrations/`) и выполните:
```bash
goose create create_users_table sql
```

Это создаст два файла с timestamp в имени:
- `20231226123456_create_users_table.up.sql` — для применения миграции (up)
- `20231226123456_create_users_table.down.sql` — для отката (down)

#### Пример миграции для таблицы users
```sql
-- migrations/20231226123456_create_users_table.up.sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

```sql
-- migrations/20231226123456_create_users_table.down.sql
DROP TABLE IF EXISTS users;
```

#### Основные команды Goose
(Выполняются из папки с миграциями или с флагом `-dir migrations`)

- **Применить все новые миграции**  
  ```bash
  goose postgres "user=postgres dbname=mydb sslmode=disable" up
  ```

- **Применить одну миграцию**  
  ```bash
  goose postgres "..." up-by-one
  ```

- **Откатить последнюю миграцию**  
  ```bash
  goose postgres "..." down
  ```

- **Проверить статус миграций**  
  ```bash
  goose postgres "..." status
  ```

- **Показать текущую версию БД**  
  ```bash
  goose postgres "..." version
  ```

#### Интеграция в приложение (автоматическое применение при старте)
В `main.go` или при инициализации БД:
```go
import (
    "database/sql"
    _ "github.com/jackc/pgx/v5/stdlib" // драйвер pgx для database/sql
    "github.com/pressly/goose/v3"
)

db, err := sql.Open("pgx", connStr)
if err != nil { ... }

if err := goose.Up(db, "migrations"); err != nil {
    log.Fatal(err)
}
```

Goose автоматически применит все новые миграции при запуске приложения.

#### Плюсы Goose
- Простой и понятный формат (up/down SQL-файлы).
- Поддержка Go-миграций для сложных случаев.
- Хорошая интеграция в код (можно запускать из приложения).
- Отслеживает историю всех применённых миграций в таблице `goose_db_version`.

## Лучшие практики с pgx

1. **Всегда используйте `pgxpool`** в приложениях
2. **Передавайте `context.Context`** во все запросы
3. **Используйте `defer tx.Rollback()`** — безопасно
4. **Обрабатывайте `pgx.ErrNoRows`**
5. **Используйте batch/CopyFrom** для массовых операций
6. **Настройте пул** под нагрузку
7. **Используйте теги `pgxrow`** для автоматического маппинга
