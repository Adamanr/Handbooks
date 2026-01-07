---
sidebar_position: 8
description: "В этом уроке мы изучим обработку ошибок и паники."
---

# Обработка ошибок и паники

Привет! Восьмой урок — один из важных для написания надёжного кода!

В Go ошибки — это не исключения, как в других языках, а обычные значения. Это делает код предсказуемым и заставляет разработчика явно обрабатывать проблемы. Ранее в некоторых примерах вы уже могли видеть работу с ошибками и их обработку, в этом уроке мы изучим более подробно суть ошибок, как с ними работать и о чём я говорю, когда говорю об ошибках. 

Главная философия Go: **ошибки — это нормально, их нужно проверять**.

## Ошибки как значения

В Go ошибка — это просто обычный интерфейс `error` с одним методом `Error() string`, который возвращает текст ошибки. 

Чтобы создать ошибку, обычно используют `errors.New("что-то пошло не так")` или `fmt.Errorf("возраст %d слишком мал", age)` — это возвращает значение типа `error`. Функции, которые могут ошибиться, возвращают ошибку последним значением: `value, err := someFunc(); if err != nil { fmt.Println("Ошибка:", err) }` — это главный паттерн в Go. Если всё ок, возвращают `nil` (ошибки нет). 

Ошибки в Go — не исключения, как в других языках, а обычные значения, которые ты явно проверяешь: просто, предсказуемо и без неожиданных «падений» программы.

```go
type error interface {
    Error() string
}
```

Любой тип с методом `Error() string` — это ошибка.

Функции, которые могут завершиться неудачей, возвращают ошибку последним значением:

```go
result, err := someFunction()
if err != nil {
    // обрабатываем ошибку
}
```

`nil` означает "всё хорошо".

### Создание ошибок

```go
import (
    "errors"
    "fmt"
    "os"
)

// Простая ошибка
err := errors.New("что-то пошло не так")

// С форматированием
err = fmt.Errorf("не удалось открыть файл %s: %w", filename, originalErr) // %w для обёртывания

// Проверка конкретной ошибки (например, файл не существует)
if errors.Is(err, os.ErrNotExist) {
    fmt.Println("Файл точно не найден")
}

// Проверка типа ошибки (например, ошибка сети)
var netErr *os.PathError
if errors.As(err, &netErr) {
    fmt.Println("Это ошибка пути:", netErr.Path)
}

// Проверка типа ошибки (Go 1.26+)
if target, ok := errors.AsType[*os.PathError](err); ok {
    fmt.Println("application error:", target)
}

// Объединение нескольких ошибок (Go 1.20+)
err1 := errors.New("первая проблема")
err2 := errors.New("вторая проблема")
combined := errors.Join(err1, err2) // возвращает одну ошибку с обеими внутри
if combined != nil {
    fmt.Println(combined) // выведет обе через \n
}
```

### Пример функции с ошибкой

```go
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("деление на ноль недопустимо")
    }
    
    return a / b, nil
}

func main() {
    result, err := divide(10, 0)
    if err != nil {
        fmt.Printf("Ошибка: %v\n", err) // Ошибка: деление на ноль недопустимо
        return
    }
    
    fmt.Printf("Результат: %.2f\n", result)
}
```

## Проверка и обертывание ошибок

### `errors.Is` — проверка конкретной ошибки

```go
import "errors"
import "os"

file, err := os.Open("config.json")
if err != nil {
    if errors.Is(err, os.ErrNotExist) {
        fmt.Println("Файл не найден — используем настройки по умолчанию")
    } else if errors.Is(err, os.ErrPermission) {
        fmt.Println("Нет прав доступа к файлу")
    } else {
        fmt.Println("Неизвестная ошибка:", err)
    }
}
```

### `errors.As` / `errors.AsType` — извлечение ошибки определённого типа

```go
var pathErr *os.PathError
if errors.As(err, &pathErr) {
    fmt.Printf("Проблема с путём: %s\n", pathErr.Path)
}

// Проверка типа ошибки (Go 1.26+)
if target, ok := errors.AsType[*os.PathError](err); ok {
	fmt.Printf("Проблема с путём: %s\n", pathErr.Path)
}
```

### Обертывание с `%w`

```go
func readConfig() ([]byte, error) {
    data, err := os.ReadFile("config.json")
    if err != nil {
        return nil, fmt.Errorf("не удалось прочитать конфиг: %w", err)
    }
    return data, nil
}

// Где-то выше
data, err := readConfig()
if err != nil {
    fmt.Println(err) // не удалось прочитать конфиг: open config.json: no such file or directory

    if errors.Is(err, os.ErrNotExist) {
        fmt.Println("Файл конфигурации отсутствует")
    }
}
```

## Собственные типы ошибок

Любой тип, у которого есть метод `Error() string`, автоматически становится ошибкой. Это позволяет создавать **свои собственные типы ошибок** с дополнительной информацией — гораздо удобнее, чем просто строки.

### Зачем нужны кастомные ошибки?
1. **Больше контекста** — можно добавить поля: какое поле не прошло валидацию, код ошибки, стек и т.д.
2. **Проверка типа ошибки** — вызывающий код может понять, какая именно ошибка произошла (через type assertion или type switch).
3. **Группировка ошибок** — несколько ошибок валидации можно собрать в одну.
4. **Лучшая обработка** — можно реагировать по-разному на разные типы ошибок.

### Пример
```go
type ValidationError struct {
    Field   string
    Message string
}

func (e ValidationError) Error() string {
    return fmt.Sprintf("поле %s: %s", e.Field, e.Message)
}

func validateName(name string) error {
    if len(name) < 2 {
        return ValidationError{Field: "name", Message: "слишком короткое"}
    }
    return nil
}
```

- `ValidationError` — структура с данными об ошибке валидации.
- Метод `Error()` делает её ошибкой (реализует интерфейс `error`).
- Теперь можно возвращать богатую ошибку:
  ```go
  return ValidationError{Field: "name", Message: "слишком короткое"}
  ```

### Как использовать на практике

```go
func validateUser(name, email string) error {
    if len(name) < 2 {
        return ValidationError{Field: "name", Message: "слишком короткое"}
    }
    if !strings.Contains(email, "@") {
        return ValidationError{Field: "email", Message: "некорректный формат"}
    }
    return nil
}

func main() {
    err := validateUser("A", "bad")
    if err != nil {
        // Обычный вывод
        fmt.Println("Ошибка:", err)  
        // → Ошибка: поле name: слишком короткое

        // Проверка типа ошибки
        if valErr, ok := err.(ValidationError); ok {
            fmt.Printf("Валидация не прошла для поля %s: %s\n", valErr.Field, valErr.Message)
            // → Валидация не прошла для поля name: слишком короткое
        }
    }
}
```

## Агрегация ошибок

Когда нужно собрать несколько ошибок:

```go
import "errors"

func validateUser(user User) error {
    var errs []error

    if user.Name == "" {
        errs = append(errs, errors.New("имя обязательно"))
    }
    if !strings.Contains(user.Email, "@") {
        errs = append(errs, errors.New("неверный email"))
    }
    if user.Age < 18 {
        errs = append(errs, errors.New("возраст должен быть >= 18"))
    }

    if len(errs) > 0 {
        return errors.Join(errs...) // одна ошибка, содержащая все
    }
    return nil
}
```

Вывод при ошибке:
```
имя обязательно
неверный email
возраст должен быть >= 18
```

## Паники (panic) и восстановление (recover)

**Паника (panic)** — это встроенный механизм Go для обработки критических, неустранимых ошибок во время выполнения программы.

Когда происходит паника, программа прерывает нормальное выполнение и начинает "разматывать" стек вызовов (unwind stack), вызывая отложенные функции (defer), пока не завершится с ошибкой. ***(Простыми словами: Программа начинает завершаться и ждет, пока не завершатся дочерние процессы, после чего и сама завершится с ошибкой)***

> Паника — это аналог исключений (exceptions) в других языках, но в Go она используется редко и осознанно.

```go
func main() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Printf("Перехвачена паника: %v\n", r)
            // Можно логировать и продолжить работу
        }
    }()

    panic("критическая ошибка: база данных недоступна")
}
```

**Никогда не делайте так:**

```go
func divide(a, b float64) float64 {
    if b == 0 {
        panic("деление на ноль") // Плохо!
    }
    return a / b
}
```

**Правильно:**

```go
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("деление на ноль")
    }
    return a / b, nil
}
```

## Лучшие практики

1. **Всегда проверяйте ошибки**  
   Не игнорируйте их без причины.

   ```go
   data, _ := os.ReadFile("file.txt") // Плохо!
   ```

2. **Делайте ошибки информативными**  
   Добавляйте контекст.

   ```go
   return fmt.Errorf("ошибка подключения к БД %s: %w", dbURL, err)
   ```

3. **Обрабатывайте на нужном уровне**  
   Низкоуровневые функции возвращают ошибку, высокоуровневые — решают, что делать (логировать, fallback, завершить программу).

4. **Используйте `defer` для cleanup**  
   Даже при ошибке ресурсы освободятся.

   ```go
   file, err := os.Open("file.txt")
   if err != nil { ... }
   defer file.Close()
   ```

## Логирование 

**Логирование** — это запись событий программы (что произошло, когда, с какими данными). В контексте обработки ошибок оно критически важно, потому что ошибки — это не только "что-то сломалось для пользователя", но и сигнал для разработчика/админа, что нужно разобраться. 

### log -> slog

Начиная с Go 1.21 (2023 год), в стандартной библиотеке появился новый пакет для структурированного логирования — **`log/slog`**. Он пришёл на смену устаревшему `log` и стал **рекомендуемым способом** логирования в новых проектах.

`slog` (structured log) позволяет выводить логи не просто текстом, а **структурированными данными** (ключ-значение), которые легко парсятся машинами (JSON, Logstash, Loki, Datadog и т.д.), но при этом остаются читаемыми для человека.

### Зачем нужен slog вместо старого log?

| Старый `log`                          | Новый `slog`                                      |
|---------------------------------------|---------------------------------------------------|
| Только текст                          | Структурированные записи (ключ → значение)        |
| Нет уровней (кроме фатала)            | Уровни: Debug, Info, Warn, Error                  |
| Нет контекста                         | Поддержка атрибутов и групп                       |
| Трудно парсить                        | Идеален для систем мониторинга и алертинга        |
| Устарел                               | **Официально рекомендован** с Go 1.21             |

### Основные понятия

- **Logger** — объект, через который пишем логи.
- **Handler** — определяет, куда и в каком формате выводить логи (в консоль, файл, JSON и т.д.).
- **Уровень** — Debug, Info, Warn, Error.
- **Атрибуты** — ключ-значение, добавляемые к записи (например, `user_id=123`).

### Простой пример

```go
package main

import (
    "log/slog"
    "os"
)

func main() {
    // Создаём логгер с выводом в консоль в читаемом виде
    logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

    logger.Info("Приложение запущено")
    logger.Warn("Предупреждение: мало памяти", "free_mb", 50)
    logger.Error("Критическая ошибка!", "err", "connection refused")

    // С атрибутами
    logger.Info("Пользователь вошёл",
        "user_id", 42,
        "ip", "192.168.1.10",
        "duration_ms", 125,
    )
}
```

Вывод (в текстовом формате):
```
time=2025-12-27T15:30:45.123+03:00 level=INFO msg="Приложение запущено"
time=2025-12-27T15:30:45.124+03:00 level=WARN msg="Предупреждение: мало памяти" free_mb=50
time=2025-12-27T15:30:45.125+03:00 level=ERROR msg="Критическая ошибка!" err="connection refused"
time=2025-12-27T15:30:45.126+03:00 level=INFO msg="Пользователь вошёл" user_id=42 ip=192.168.1.10 duration_ms=125
```

### JSON-формат — для продакшена

```go
logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

logger.Info("Запрос обработан",
    "method", "GET",
    "path", "/api/users",
    "status", 200,
    "duration_ms", 34,
)
```

Вывод:
```json
{"time":"2025-12-27T15:30:45.123+03:00","level":"INFO","msg":"Запрос обработан","method":"GET","path":"/api/users","status":200,"duration_ms":34}
```

Идеально для систем мониторинга!

### Уровни логирования и настройка

```go
opts := &slog.HandlerOptions{
    Level: slog.LevelDebug, // можно менять динамически
}
logger := slog.New(slog.NewTextHandler(os.Stdout, opts))

logger.Debug("Отладочная информация", "detail", "очень много данных")
logger.Info("Обычное событие")
logger.Warn("Что-то подозрительное")
logger.Error("Ошибка!")
```

### Контекст и группы

```go
logger := logger.With("request_id", "abc123", "user_id", 42)

logger.Info("Обработка запроса")
logger.Error("Ошибка в обработчике", "stage", "validation")
```

Вывод:
```
msg="Обработка запроса" request_id=abc123 user_id=42
msg="Ошибка в обработчике" request_id=abc123 user_id=42 stage=validation
```

### Глобальный логгер (удобно в большом проекте)

```go
func init() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelInfo,
    }))
    slog.SetDefault(logger)
}

func main() {
    slog.Info("Глобальный логгер работает!")
}
```

Теперь в любом файле просто:
```go
slog.Info("Что-то произошло", "key", value)
```

## Пример: надёжная функция чтения конфига

```go
func loadConfig(path string) (Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        if errors.Is(err, os.ErrNotExist) {
            slog.Error("Конфиг не найден — используем значения по умолчанию")
            return DefaultConfig(), nil
        }
        return Config{}, fmt.Errorf("не удалось прочитать файл %s: %w", path, err)
    }

    var cfg Config
    if err := json.Unmarshal(data, &cfg); err != nil {
        return Config{}, fmt.Errorf("неверный формат JSON в %s: %w", path, err)
    }

    return cfg, nil
}

func main() {
    cfg, err := loadConfig("config.json")
    if err != nil {
        log.Fatalf("Критическая ошибка загрузки конфигурации: %v", err)
    }

    slog.Info("Конфиг загружен: %+v\n", cfg)
}
```
