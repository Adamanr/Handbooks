---
sidebar_position: 12
description: "В этом уроке мы изучим работу с пакетами, модулями и организацией проекта."
---

# Пакеты, модули и организация проекта

Привет! Двеннадцатый урок — про то, как писать **настоящий, профессиональный** код на Go. До этого мы уже изучали в первом уроке структуру проекта и в этом уроке мы это закрепим и научимся структурировать большие проекты, использовать пакеты, управлять зависимостями и следовать лучшим практикам.

Это то, что отличает хобби-проект от production-ready приложения.

## Пакеты

Пакет — это папка с Go-файлами, имеющими одинаковое объявление `package`.

### Правила экспорта

- **Заглавная буква** → экспортируется (доступна извне пакета)
- **строчная буква** → приватная (только внутри пакета)

```go
// pkg/mathutils/add.go
package mathutils

func Add(a, b int) int { // экспортируется
    return a + b
}

func secretHelper(x int) int { // приватная
    return x * 2
}
```

```go
// main.go
import "myproject/pkg/mathutils"

func main() {
    mathutils.Add(3, 4)        // OK
    // mathutils.secretHelper(5) // ошибка компиляции
}
```

### `internal` — приватные пакеты

Папка `internal/` — код, который **нельзя** импортировать извне модуля.

```
myproject/
├── internal/
│   └── database/     // только мой проект может импортировать
└── pkg/
    └── api/          // можно импортировать извне
```

### `init()` — автоматическая инициализация

Функция `init()` вызывается автоматически при импорте пакета (можно несколько).

```go
// internal/config/config.go
package config

import "log"

var AppConfig Config

func init() {
    slog.Info("Конфигурация инициализируется...")
    // загрузка из env, файла и т.д.
}
```

## Модули (go.mod)

**Модули** — это способ организовать код проекта и его зависимости (внешние пакеты), чтобы всё было удобно, предсказуемо и повторяемо. С Go 1.11 появился файл `go.mod`, в котором ты указываешь название модуля (например, `example.com/myapp`) и версии нужных библиотек (`require github.com/gin-gonic/gin v1.9.1`). 

Благодаря модулям Go сам скачивает нужные пакеты, проверяет их версии, решает конфликты и гарантирует, что твой проект соберётся одинаково на любом компьютере. Они нужны, чтобы не было "хаоса зависимостей", легко делиться кодом, обновлять библиотеки и избежать ситуации, когда у одного разработчика код работает, а у другого — нет из-за разных версий пакетов. 

> <br />  Модули — это "паспорт" твоего проекта, который управляет зависимостями и делает разработку надёжной и простой. 

### Инициализация модуля

```bash
go mod init github.com/ваш-ник/myproject
```

Создаст `go.mod`:

```mod
module github.com/ваш-ник/myproject

go 1.23
```

### Добавление зависимостей

```bash
go get github.com/gin-gonic/gin@latest
go get github.com/lib/pq
go get github.com/joho/godotenv
```

`go.mod` обновится, появится `go.sum` с хешами.

### Полезные команды

```bash
go mod tidy          # удалить неиспользуемые, добавить недостающие
go mod vendor        # скопировать зависимости в vendor/ (для старых систем)
go list -m all       # список всех зависимостей
go mod why pkg       # зачем нужен этот пакет
```

## Рекомендуемая структура проекта

```text
myproject/
├── go.mod
├── go.sum
├── cmd/                     # Точки входа (исполняемые программы)
│   └── server/
│       └── main.go          # HTTP-сервер
├── internal/                # Приватный код (не импортируется извне)
│   ├── config/              # Загрузка конфигурации
│   ├── database/            # Подключение к БД, репозитории
│   ├── api/                 # HTTP-обработчики, маршруты
│   ├── service/             # Бизнес-логика
│   └── models/              # Структуры данных
├── pkg/                     # Публичные пакеты (можно переиспользовать)
│   └── logger/              # Кастомный логгер
├── scripts/                 # Скрипты (миграции, генерация)
├── configs/                 # config.json, .env.example
├── migrations/              # SQL-миграции
├── test/                    # Интеграционные тесты
├── Dockerfile
├── docker-compose.yml
└── README.md
```

### Пример: слой конфигурации

```go
// internal/config/config.go
package config

import (
    "encoding/json"
    "os"
    "sync"
)

type Config struct {
    Server struct {
        Port int    `json:"port"`
        Host string `json:"host"`
    } `json:"server"`
    Database struct {
        DSN string `json:"dsn"`
    } `json:"database"`
}

var (
    instance *Config
    once     sync.Once
)

func Load(path string) error {
    var err error
    once.Do(func() {
        data, readErr := os.ReadFile(path)
        if readErr != nil {
            err = readErr
            return
        }

        instance = &Config{}
        err = json.Unmarshal(data, instance)
    })
    return err
}

func Get() *Config {
    if instance == nil {
        panic("конфигурация не загружена!")
    }
    return instance
}
```

### Пример: слой базы данных

```go
// internal/database/database.go
package database

import (
    "database/sql"
    "sync"

    _ "github.com/lib/pq"
)

var (
    db   *sql.DB
    once sync.Once
)

func Connect(dsn string) error {
    var err error
    once.Do(func() {
        db, err = sql.Open("postgres", dsn)
        if err != nil {
            return
        }
        err = db.Ping()
    })
    return err
}

func GetDB() *sql.DB {
    return db
}
```

### Пример: HTTP-сервер (cmd/server/main.go)

```go
// cmd/server/main.go
package main

import (
    "log"
    "net/http"

    "github.com/gin-gonic/gin"
    "myproject/internal/api"
    "myproject/internal/config"
    "myproject/internal/database"
)

func main() {
    if err := config.Load("configs/config.json"); err != nil {
        log.Fatal(err)
    }

    if err := database.Connect(config.Get().Database.DSN); err != nil {
        log.Fatal(err)
    }

    r := gin.Default()
    api.RegisterRoutes(r)

    slog.Info("Сервер запущен", "адрес", config.Get().Server.Port)
    log.Fatal(http.ListenAndServe(":8080", r))
}
```

## Лучшие практики

1. **Именование пакетов** — короткие, в нижнем регистре, без `utils`, `helpers`, `manager`
   - Хорошо: `config`, `database`, `api`, `service`
   - Плохо: `myutils`, `userManager`

2. **Экспортируйте осознанно** — только то, что действительно нужно снаружи

3. **Документируйте экспортируемые сущности**

   ```go
   // Add складывает два числа и возвращает результат.
   // Пример: Add(2, 3) => 5
   func Add(a, b int) int {
       return a + b
   }
   ```

4. **Используйте `internal/`** для кода, который не должен утекать наружу

5. **Разделяйте слои**:
   - `api` — HTTP, валидация запросов
   - `service` — бизнес-логика
   - `database` — работа с БД
   - `models` — структуры данных

### Примерная структура проекта в итоге
```
myapi/
├── cmd
│   ├── main.go
├── internal
│   ├── config
│   │   ├── config.go
│   │   └── config.go.mod
│   ├── users
│   │   ├── users.go
│   │   └── users.go.mod
├── go.mod
├── go.sum
├── .env
```
