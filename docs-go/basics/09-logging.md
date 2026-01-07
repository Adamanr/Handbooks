---
sidebar_position: 9
description: "В этом уроке мы изучим логгирование в Go."
---

# Логгирование

![Gofer Logger](/img/gofer_logging.jpg)

## Введение

Логи — это не просто `fmt.Println("что-то произошло")`. Это критически важный инструмент для понимания поведения системы в production, отладки проблем, которые невозможно воспроизвести локально, и анализа производительности. Плохое логгирование может утопить вас в шуме или оставить без информации в критический момент. Хорошее логгирование — это баланс между детальностью и читаемостью, производительностью и полнотой.

В этом уроке мы пройдём от базового `log` пакета до production-ready решений с структурированным логгированием, контекстом, уровнями и интеграцией с системами мониторинга.

## Встроенный пакет log и его ограничения

**Стандартный пакет `log` в Go** — это самый простой и встроенный способ вести логирование. Он появился ещё в первой версии языка и до сих пор остаётся в стандартной библиотеке, потому что он лёгкий, надёжный и не требует никаких зависимостей.

### Основные особенности пакета `log`

- Выводит сообщения в `os.Stderr` (по умолчанию) или в любой `io.Writer`.
- Каждое сообщение автоматически получает **временную метку** (timestamp) и **префикс** (по умолчанию пустой).
- Есть три уровня: `Print*` (обычное), `Fatal*` (вывод + os.Exit(1)), `Panic*` (вывод + panic()).
- Не поддерживает уровни логирования (info/warn/error) в современном смысле — всё идёт в один поток.
- Очень маленький и быстрый — идеален для минималистичных CLI-утилит, скриптов или когда не хочется тянуть slog.

### Основные функции

```go
import "log"

log.Println("Сервер запущен на 8080")           // 2026/01/07 14:35:22 Сервер запущен на 8080
log.Printf("Пользователь %s вошёл", username)   // с форматированием
log.Fatal("Критическая ошибка!")                // выведет текст + os.Exit(1)
log.Panic("Что-то очень сломалось")             // выведет текст + вызовет panic
```

### Полезные настройки

```go
// Изменить префикс (по умолчанию пустой)
log.SetPrefix("[APP] ")

// Убрать дату/время/микросекунды
log.SetFlags(0)                          // только сообщение
log.SetFlags(log.LstdFlags | log.Lshortfile) // дата + время + короткое имя файла:строка

// Поменять куда писать (файл, буфер, /dev/null и т.д.)
file, _ := os.OpenFile("app.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
log.SetOutput(file)
```

### Классический паттерн для CLI-утилит

```go
package main

import (
    "flag"
    "log"
    "os"
)

func main() {
    debug := flag.Bool("debug", false, "включить отладку")
    flag.Parse()

    if *debug {
        log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
        log.SetPrefix("[DEBUG] ")
    }

    log.Println("Запуск приложения")
    // ...
}
```

### Когда использовать `log` в 2026 году?

- **Да**:
  - Простые CLI-утилиты, скрипты, тестовые проекты.
  - Когда не хочешь добавлять внешние зависимости.
  - Когда достаточно одного потока логов без уровней.

- **Нет** (лучше slog или zap/zerolog):
  - Веб-сервисы, микросервисы, продакшен.
  - Нужны уровни (Debug/Info/Warn/Error).
  - Структурированные логи (JSON).
  - Контекст (request ID, user ID).
  - Высокая нагрузка (нужна максимальная скорость).

### Базовое использование

```go
package main

import (
    "log"
    "os"
)

func main() {
    // Простейшее логгирование
    log.Println("Application started")
    
    // С префиксом и флагами
    log.SetPrefix("[MyApp] ")
    log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
    log.Println("This includes timestamp and file location")
    
    // Логгирование с Fatal (вызывает os.Exit(1))
    if err := connectToDatabase(); err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    
    // Логгирование с Panic (вызывает panic)
    if err := initCriticalComponent(); err != nil {
        log.Panic("Critical component failed:", err)
    }
}
```

**Доступные флаги:**
- `log.Ldate` - дата (2009/01/23)
- `log.Ltime` - время (01:23:23)
- `log.Lmicroseconds` - микросекунды
- `log.Llongfile` - полный путь к файлу и строка
- `log.Lshortfile` - только имя файла и строка
- `log.LUTC` - использовать UTC вместо локального времени
- `log.Lmsgprefix` - переместить префикс перед сообщением

### Кастомный logger

```go
func setupLogger() *log.Logger {
    file, err := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
    if err != nil {
        log.Fatal("Failed to open log file:", err)
    }
    
    // Логгер, который пишет и в файл, и в stdout
    multiWriter := io.MultiWriter(os.Stdout, file)
    
    return log.New(multiWriter, "[MyApp] ", log.Ldate|log.Ltime|log.Lshortfile)
}

func main() {
    logger := setupLogger()
    logger.Println("Using custom logger")
}
```

## Структурированное логгирование с slog

С Go 1.21 (август 2023) в стандартной библиотеке появился **log/slog** — официальный, быстрый и гибкий пакет для структурированного логирования. Это не просто замена старому `log`, а настоящий современный инструмент, который сразу стал рекомендованным способом вести логи в новых проектах.

> <br /> В дальнейшем мы будем использовать `slog` в уроках и примерах. По этому, особенно с ним ознакомьтесь и его основными особенностями.

### Основные особенности пакета `slog`

- **Структурированные логи** — каждое сообщение с атрибутами (ключ-значение), которые легко парсятся (JSON, текст).
- **Уровни логирования**: Debug, Info, Warn, Error — можно включать/выключать по окружению.
- **Встроен в stdlib** — никаких внешних зависимостей.
- **Быстрый** — почти на уровне zap/zerolog в типичных сценариях.
- **Гибкий** — легко добавить свой Handler (куда писать логи) или формат.

### Основные понятия

- **Logger** — основной объект, через который пишешь логи.
- **Handler** — отвечает за формат и куда писать (консоль, файл, JSON, текст).
- **Level** — уровень сообщения (Debug(-4), Info(0), Warn(4), Error(8)).

#### Простой старт

```go
package main

import (
    "log/slog"
    "os"
)

func main() {
	// Текстовый вывод для разработки
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger) // делаем его глобальным
	
	slog.Info("Сервер запущен", "port", 8080)
	slog.Warn("Много запросов", "ip", "192.168.1.1", "count", 150)
	slog.Error("Ошибка подключения", "db", "postgres", "err", fmt.Errorf("Oshibka"))	
}
```

Вывод (TextHandler):
```
time=2009-11-10T23:00:00.000Z level=INFO msg="Сервер запущен" port=8080
time=2009-11-10T23:00:00.000Z level=WARN msg="Много запросов" ip=192.168.1.1 count=150
time=2009-11-10T23:00:00.000Z level=ERROR msg="Ошибка подключения" db=postgres err=Oshibka
```

Для продакшена — JSON:

```go
logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
// {"time":"2026-01-07T15:30:45Z","level":"INFO","msg":"Сервер запущен","port":8080}
```

### Настройка уровня по окружению

```go
var level slog.Level

if os.Getenv("ENV") == "development" {
    level = slog.LevelDebug
} else {
    level = slog.LevelInfo
}

opts := &slog.HandlerOptions{
    Level: level,
}

logger := slog.New(slog.NewJSONHandler(os.Stdout, opts))
slog.SetDefault(logger)

slog.Debug("Это видно только в dev-режиме", "detail", 42)
```

### Добавление общего контекста

```go
// Во всех сообщениях будут поля app и version
logger := slog.Default().With("app", "my-service", "version", "1.2.0")

logger.Info("Обработка запроса", "request_id", "abc123")

err := fmt.Errorf("Ошибка ошибок!")
logger.Error("Ошибка", "request_id", "abc123", "err", err)

// 2009/11/10 23:00:00 INFO Обработка запроса app=my-service version=1.2.0 request_id=abc123
// 2009/11/10 23:00:00 ERROR Ошибка app=my-service version=1.2.0 request_id=abc123 err="Ошибка ошибок!"
```

### Когда использовать slog

- Новый проект на Go 1.21+ → сразу slog.
- Нужны структурированные логи (JSON для Loki/ELK/Datadog).
- Хочешь остаться в stdlib, но иметь уровни и атрибуты.
- Производительность важна, но не критично (для ультра-нагрузки — zap/zerolog).

## rs/zerolog: Когда каждая миллисекунда на счету
   
Если тебе нужна **максимальная производительность** логирования (миллионы сообщений в секунду), минимум аллокаций и чистый JSON на выходе — добро пожаловать в мир **rs/zerolog**. Это один из самых популярных внешних логгеров в Go-экосистеме.

### Основные особенности пакета `rs/zerolog`

- **Скорость**: в бенчмарках часто обходит даже zap
- **Только JSON** — никаких текстовых форматов, только структурированный вывод (идеально для Loki, ELK, Datadog).
- **Минимализм**: не имеет "уровня" как состояния логгера, только методы `Debug()`, `Info()`, `Warn()`, `Err()`, `Fatal()`, `Panic()`.
- **Глобальный или контекстный логгер** — легко добавить поля (context).
- **Ноль аллокаций при отключенном уровне** — если уровень Debug выключен, вызов `log.Debug()` почти ничего не стоит.

### Установка

```bash
go get -u github.com/rs/zerolog/log
```

### Простой старт

```go
package main

import (
    "os"
    "github.com/rs/zerolog"
)

func main() {
    // Глобальный логгер с pretty-print для разработки
    zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
    log := zerolog.New(os.Stdout).With().Timestamp().Logger()

    log.Info().
        Str("user", "alice").
        Int("age", 25).
        Msg("Пользователь зарегистрирован")

    log.Warn().
        Str("ip", "123.45.67.89").
        Msg("Подозрительная активность")

    log.Error().
        Err(someErr).
        Msg("Не удалось подключиться")
}
```

Вывод (по умолчанию pretty в терминале):
```json
{"level":"info","time":1640995200,"user":"alice","age":25,"message":"Пользователь зарегистрирован"}
{"level":"warn","time":1640995201,"ip":"123.45.67.89","message":"Подозрительная активность"}
```

Для продакшена — чистый JSON:

```go
log := zerolog.New(os.Stdout).With().Timestamp().Logger()
zerolog.SetGlobalLevel(zerolog.InfoLevel) // отключаем Debug
```

### Уровни и настройка

```go
zerolog.SetGlobalLevel(zerolog.DebugLevel) // всё
zerolog.SetGlobalLevel(zerolog.InfoLevel)  // по умолчанию
zerolog.SetGlobalLevel(zerolog.WarnLevel)
zerolog.SetGlobalLevel(zerolog.ErrorLevel)
zerolog.SetGlobalLevel(zerolog.Disabled)   // выключаем логи полностью
```

### Контекст и подлоггеры

```go
logger := zerolog.New(os.Stdout).With().
    Str("app", "my-service").
    Str("version", "1.2.0").
    Logger()

ctxLog := logger.With().
    Str("request_id", "abc123").
    Logger()

ctxLog.Info().Msg("Обработка запроса")
ctxLog.Error().Err(err).Msg("Ошибка в обработчике")
```

### Логирование в HTTP-серверах

```go
func handler(w http.ResponseWriter, r *http.Request) {
    requestID := generateID()
    log := zerolog.New(os.Stdout).With().
        Str("request_id", requestID).
        Str("method", r.Method).
        Str("path", r.URL.Path).
        Logger()

    log.Info().Msg("Запрос получен")
    // обработка
    log.Info().Int("status", 200).Msg("Ответ отправлен")
}
```

### Полезные фичи

- `log.Log()` — если не знаешь уровень заранее.
- `zerolog.MultiLevelWriter()` — писать в файл + консоль одновременно.
- Интеграция с `context`: пакет `zerolog/context`.
- Хуки для отправки критических ошибок в Sentry/Slack.

### Когда выбирать zerolog

- **Да**:
  - Высоконагруженные сервисы (микросервисы, API с тысячами RPS).
  - Только JSON-логи в продакшене.
  - Нужно минимум аллокаций и максимум скорости.
  - Хочешь контроль над каждым байтом в логе.

- **Нет** (лучше slog):
  - Хочешь остаться в stdlib (slog).
  - Нужен текстовый вывод для разработки .
  - Очень много настроек и плагинов.

## go.uber.org/zap: Логгер для высоконагруженных систем

**zap** — один из самых популярных и уважаемых внешних логгеров в мире Go. Его создала команда Uber в 2016 году, чтобы решить проблему медленного логирования в их огромных сервисах. С тех пор zap стал золотым стандартом для приложений, где важны **производительность**, **надёжность** и **гибкость**.

### Основные особенности пакета `zap`

- **Очень быстрый** — один из лидеров бенчмарков (на уровне или чуть позади zerolog).
- **Два режима**: 
  - `SugaredLogger` — удобный, с `Printf`-стилем (для быстрого старта).
  - `Logger` — максимально быстрый, без рефлексии (для продакшена).
- **Структурированные логи** (JSON по умолчанию).
- **Много настроек**: уровни, сэмплинг, хуки, вывод в несколько мест.
- **Большая экосистема**: интеграции с Sentry, Loki, rotating files и т.д.

### Установка

```bash
go get -u go.uber.org/zap
```

### SugaredLogger — удобно и читаемо (для разработки)

```go
package main

import "go.uber.org/zap"

func main() {
    // Готовый логгер для продакшена с JSON
    logger, _ := zap.NewProduction()
    defer logger.Sync() // важно! flush буфера

    sugar := logger.Sugar()

    sugar.Infow("Пользователь зарегистрирован",
        "user", "alice",
        "age", 25,
    )
    sugar.Infof("Запрос с IP %s, путь %s", ip, path)

    sugar.Errorw("Ошибка подключения",
        "db", "postgres",
        "err", err,
    )
}
```

### Несахарный Logger — максимальная скорость (для продакшена)

```go
logger, _ := zap.NewProduction()
defer logger.Sync()

logger.Info("Запрос получен",
    zap.String("method", r.Method),
    zap.String("path", r.URL.Path),
    zap.Duration("latency", time.Since(start)),
    zap.Int("status", 200),
)

logger.Error("Не удалось обработать",
    zap.Error(err),
    zap.String("request_id", id),
)
```

### Готовые конфиги

- `zap.NewProduction()` — JSON, Info+, ротация не нужна (пишет в stderr).
- `zap.NewDevelopment()` — цветной человекочитаемый вывод, Debug+.
- `zap.NewExample()` — для тестов.

### Настройка уровня и контекста

```go
// Кастомный уровень (например, по env)
config := zap.NewProductionConfig()
if os.Getenv("ENV") == "dev" {
    config.Level = zap.NewAtomicLevelAt(zap.DebugLevel)
}
logger, _ := config.Build()

// Добавление общего контекста
logger = logger.With(
    zap.String("app", "my-service"),
    zap.String("version", "1.3.0"),
)
```

### Полезные фичи

- **Сэмплинг**: ограничивает частые одинаковые логи (чтобы не заспамить).
- **Хуки**: вызывают функцию при определённом уровне (например, отправка в Slack при Error).
- **Fields**: готовые поля вроде `zap.Error(err)`, `zap.Duration("lat", d)`, `zap.Int("count", n)`.

### Когда выбирать zap

- **Да**:
  - Высокая нагрузка, но нужна гибкость и читаемость в dev.
  - Хочешь и быстрый JSON в проде, и pretty-print в разработке.
  - Нужны сложные конфиги, сэмплинг, хуки.
  - Большой проект с интеграциями.

- **Нет** (лучше другие):
  - Максимальный перформанс и минимум аллокаций → zerolog.
  - Хочешь остаться в stdlib → slog.
