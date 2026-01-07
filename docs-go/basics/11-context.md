---
sidebar_position: 11
title: Context
---

# Введение

**Context** — это одна из самых важных и мощных идей в Go. Он помогает твоему коду быть умным и вежливым: вовремя останавливаться, когда результат уже не нужен, не ждать вечно и передавать важную информацию (например, ID запроса или данные пользователя) через длинную цепочку функций.

## Зачем вообще нужен context?

Представь ситуацию:
- Пользователь нажал кнопку в браузере → твой сервер получил HTTP-запрос.
- Ты начинаешь делать кучу работы: читаешь базу данных, зовёшь другой сервис, обрабатываешь файл.
- А пользователь вдруг закрыл вкладку или ушёл со страницы.

Без context твои горутины продолжат работать зря: тратить процессор, память, сеть. Это называется **утечка горутин** — одна из самых неприятных проблем в Go.

**Context решает три главные задачи:**

1. **Отмена операций** — сказать всем: "Стоп! Клиент ушёл, результат не нужен".
2. **Таймауты и дедлайны** — не ждать ответа от базы или внешнего API вечно.
3. **Передача данных запроса** — пронести через все функции ID запроса, пользователя, токен или trace_id для логов и трассировки.

Это особенно важно в веб-сервисах и микросервисах, где один запрос может запускать десятки операций.

## Интерфейс context — что внутри?

Context — это интерфейс с четырьмя простыми методами:

```go
type Context interface {
    Deadline() (deadline time.Time, ok bool) // Когда контекст "умрёт"?
    Done() <-chan struct{}                  // Канал, который закроется при отмене
    Err() error                             // Почему отменили? (Canceled или DeadlineExceeded)
    Value(key any) any                      // Достать данные по ключу
}
```

Ты никогда не создаёшь свой context с нуля — только используешь функции из пакета `context`.

## Виды контекстов

В пакете `context` есть несколько основных функций для создания контекстов. Каждая решает свою типичную задачу. Давай разберём по одной — зачем именно она нужна и в каких ситуациях её используют.

### context.Background() и context.TODO()

**Зачем нужны?**  

Это «корневые» контексты — точки старта. Они **никогда не отменяются** и не имеют дедлайна.

- `context.Background()` — используй в `main()`, при запуске сервера, в тестах или когда создаёшь самый первый контекст в программе. Это чистый «фоновый» контекст без всяких ограничений.
- `context.TODO()` — тоже корневой, но с намёком: «я пока не знаю, какой контекст тут нужен, потом поправлю». Используй как временную заглушку, чтобы код компилировался, а потом замени на правильный.

```go
ctx := context.Background()  // Для main(), запуска сервера, тестов — "корень" всего
ctx := context.TODO()        // Когда пока не знаешь, какой контекст нужен (плейсхолдер)
```

**Пример ситуации:**  

Ты запускаешь HTTP-сервер — начинаешь с `context.Background()`, а потом от него создаёшь контексты для каждого запроса.

### context.WithCancel(parent)

**Зачем нужен?**  

Тебе нужно **вручную** остановить какую-то операцию или группу операций в любой момент.

Типичные случаи:
- Пользователь нажал «Отмена» в интерфейсе.
- Ты получил первый результат из нескольких параллельных поисков и хочешь остановить остальные.

```go
ctx, cancel := context.WithCancel(context.Background())
defer cancel()  // ОБЯЗАТЕЛЬНО! Освобождает ресурсы

// Где-то позже, когда нужно остановить:
cancel()  // Все, кто слушает ctx.Done(), получат сигнал
```

**Ключевое:**  

Ты получаешь функцию `cancel()`, вызываешь её — и все дочерние контексты получают сигнал отмены.

### context.WithTimeout(parent, duration)  

**Зачем нужен?**  

Ты хочешь, чтобы операция **автоматически остановилась** через определённое время (например, 5 секунд).

Самые частые ситуации:
- Запрос к внешнему API — не ждать дольше 2–3 секунд.
- Чтение из базы — максимум 5 секунд.
- Обработка одного HTTP-запроса — общий таймаут 30 секунд.

Через заданное время контекст отменяется сам, и ты получаешь ошибку `context.DeadlineExceeded`.

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

// Через 5 секунд контекст автоматически отменится
```

### context.WithDeadline(parent, deadline)

**Зачем нужен?**  

Похож на WithTimeout, но ты указываешь **конкретное время** в будущем, к которому операция должна завершиться.

**Когда удобно:**

- У тебя уже есть абсолютный дедлайн (например, из родительского запроса), и ты хочешь передать его дальше.
- Нужно синхронизировать несколько операций по одному моменту времени.

На практике чаще используют `WithTimeout`, потому что относительное время проще считать.

```go
deadline := time.Now().Add(10 * time.Second)
ctx, cancel := context.WithDeadline(context.Background(), deadline)
defer cancel()
```

### context.WithValue(parent, key, value)

**Зачем нужен?** 

Чтобы **передать данные**, связанные с текущим запросом или операцией, через цепочку вызовов (request_id, user_id, trace_id, токен и т.п.).

Важно: используй **только** для данных, которые относятся именно к этому запросу/операции (request-scoped). Не кладёшь туда конфиг, базу данных или логгер — их передавай явно через параметры.

```go
ctx = context.WithValue(ctx, "request_id", "abc123")
value := ctx.Value("request_id") // "abc123"
```

#### Краткий вывод: когда что выбирать

| Функция                | Когда использовать                                                                 |
|-----------------------|------------------------------------------------------------------------------------|
| `Background()` / `TODO()` | Начало программы, тесты, заглушка                                                   |
| `WithCancel`          | Нужно вручную остановить работу (по событию, по первому результату, shutdown)     |
| `WithTimeout`         | Операция не должна длиться дольше N секунд (самый частый случай)                   |
| `WithDeadline`        | Есть точное время, к которому всё должно закончиться                                |
| `WithValue`           | Передать ID запроса, пользователя или другие метаданные через много функций        |

Все они создаются **на основе родительского** контекста, поэтому отмена или дедлайн родителя автоматически распространяется на детей. Это и есть сила context — одна отмена или таймаут управляет целым деревом операций.

## Как работает отмена — главный паттерн

Самый важный паттерн — слушать `ctx.Done()` через `select`:

```go
func worker(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():  // Контекст отменён или таймаут
            fmt.Println("Остановился по причине:", ctx.Err())
            return
        default:
            fmt.Println("Работаю...")
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()

    go worker(ctx)

    time.Sleep(5 * time.Second) // Ждём, чтобы увидеть отмену
}
```

Вывод:
```
Работаю...
Работаю...
Работаю...
Работаю...
Остановился по причине: context deadline exceeded
```

Это основа всего — проверяй `ctx.Done()` в циклах, долгих операциях и горутинах.

## Передаём context в функции правильно

**Золотое правило Go:**
- Context всегда **первым** параметром.
- Назови его `ctx`.

```go
func fetchData(ctx context.Context, url string) ([]byte, error) {
    // Проверяем отмену сразу
    select {
    case <-ctx.Done():
        return nil, ctx.Err()
    default:
    }

    // Делаем работу...
    return []byte("данные"), nil
}
```

Вызов:
```go
ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
defer cancel()

data, err := fetchData(ctx, "https://example.com")
if err != nil {
    fmt.Println("Ошибка или отмена:", err)
}
```

## Каскадная отмена — магия наследования

```go
func main() {
    parentCtx, parentCancel := context.WithCancel(context.Background())
    defer parentCancel()

    child1, _ := context.WithCancel(parentCtx)
    child2, _ := context.WithTimeout(parentCtx, 10*time.Second)

    go worker(child1, "Ребёнок 1")
    go worker(child2, "Ребёнок 2")

    time.Sleep(1 * time.Second)
    fmt.Println("Отменяем родителя...")
    parentCancel()  // Оба ребёнка тоже отменятся!

    time.Sleep(1 * time.Second)
}

func worker(ctx context.Context, name string) {
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("%s остановлен: %v\n", name, ctx.Err())
            return
        default:
            fmt.Printf("%s работает...\n", name)
            time.Sleep(300 * time.Millisecond)
        }
    }
}
```

Отмена родителя автоматически отменяет всех детей — очень удобно!

## Таймауты и дедлайны — не ждать вечно

WithTimeout и WithDeadline почти одинаковы:
- `WithTimeout` — относительное время (через сколько секунд).
- `WithDeadline` — абсолютное время (к какому моменту).

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

// Или
deadline := time.Now().Add(5 * time.Second)
ctx, cancel = context.WithDeadline(context.Background(), deadline)
defer cancel()
```

В реальности часто комбинируют с родительским контекстом:

```go
func callService(parentCtx context.Context) error {
    // Берём минимум из родительского дедлайна и своего таймаута
    ctx, cancel := context.WithTimeout(parentCtx, 2*time.Second)
    defer cancel()

    return externalAPI(ctx)
}
```

## Context Value — передаём данные запроса

Используй **только** для данных, связанных с запросом (request-scoped):
- request_id
- user_id / пользователь
- trace_id
- токен авторизации

**Пример с безопасными ключами** (чтобы не было коллизий):

```go
type ctxKey string

const (
    requestIDKey ctxKey = "request_id"
    userKey      ctxKey = "user"
)

func WithRequestID(ctx context.Context, id string) context.Context {
    return context.WithValue(ctx, requestIDKey, id)
}

func GetRequestID(ctx context.Context) string {
    if id := ctx.Value(requestIDKey); id != nil {
        return id.(string)
    }
    return ""
}

// Лучше — отдельный пакет с хелперами
type User struct {
    ID   int
    Name string
}

func WithUser(ctx context.Context, u *User) context.Context {
    return context.WithValue(ctx, userKey, u)
}

func GetUser(ctx context.Context) (*User, bool) {
    u, ok := ctx.Value(userKey).(*User)
    return u, ok
}
```

**Чего НЕ делать:**
- Не кладите в Value базу данных, конфиг, логгер — передавайте явно через параметры!

## Context в HTTP-серверах

В `net/http` контекст уже встроен!

```go
func handler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()  // Автоматически отменяется, если клиент отключился

    data, err := slowOperation(ctx)
    if err != nil {
        if errors.Is(err, context.Canceled) {
            // Клиент ушёл — ничего не отвечаем
            return
        }
        http.Error(w, "Ошибка", 500)
        return
    }

    fmt.Fprint(w, data)
}
```

Добавляем свой таймаут:

```go
ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
defer cancel()
r = r.WithContext(ctx)  // Важно! Обновляем запрос
```

## Предотвращаем утечки горутин

```go
// ✅ Правильно — слушаем контекст
func goodWorker(ctx context.Context, result chan<- string) {
    // Долгая работа
    for i := 0; i < 1000000; i++ {
        select {
        case <-ctx.Done():
            return
        default:
            // работаем
        }
    }
    result <- "готово"
}

// ❌ Плохо — горутина может висеть вечно
func badWorker(result chan<- string) {
    // Если никто не читает из result — заблокируется навсегда
    result <- expensiveWork()
}
```

## Параллельные операции с errgroup

Библиотека `golang.org/x/sync/errgroup` — лучший друг context:

```go
import "golang.org/x/sync/errgroup"

func fetchAll(ctx context.Context, urls []string) (map[string][]byte, error) {
    g, ctx := errgroup.WithContext(ctx)
    results := make(map[string][]byte)
    mu := sync.Mutex{}

    for _, url := range urls {
        url := url  // Важно для замыкания
        g.Go(func() error {
            data, err := fetchURL(ctx, url)
            if err != nil {
                return err  // Отменит весь контекст
            }
            mu.Lock()
            results[url] = data
            mu.Unlock()
            return nil
        })
    }

    if err := g.Wait(); err != nil {
        return nil, err
    }
    return results, nil
}
```

## Graceful shutdown сервера

**Graceful shutdown *(красивое завершение)*** — это когда при получении сигнала остановки (например, Ctrl+C или сигнал от Kubernetes) сервер не выключается мгновенно, а сначала **перестаёт принимать новые запросы**, **даёт время текущим запросам завершиться** (с таймаутом, например 30 секунд), а потом аккуратно закрывает все соединения и ресурсы (база данных, файлы, горутины). Это нужно, чтобы пользователи не видели внезапных ошибок "соединение разорвано", запросы не обрывались на полпути (особенно важные, как оплата или сохранение данных), и сервер завершал работу предсказуемо и безопасно. 

Без graceful shutdown при перезапуске или деплое часть пользователей могла бы потерять данные или получить ошибку, а с ним — всё завершается культурно и надёжно. 

> <br /> Graceful shutdown — это как вежливо закрыть ресторан: сначала не пускаешь новых гостей, даёшь доесть текущим, а потом выключаешь свет. 

```go
func runServer() {
    srv := &http.Server{Addr: ":8080", Handler: mux}

    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatal(err)
        }
    }()

    // Ждём сигнал завершения
    sig := make(chan os.Signal, 1)
    signal.Notify(sig, os.Interrupt, syscall.SIGTERM)
    <-sig

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil {
        log.Printf("Shutdown error: %v", err)
    }
    log.Println("Сервер остановлен красиво")
}
```

## Лучшие практики — чек-лист

1. Context — первым параметром, именем `ctx`.
2. Всегда `defer cancel()`.
3. Не храни context в структурах.
4. Проверяй `ctx.Done()` в циклах и блокирующих операциях.
5. Value — только для request-scoped данных.
6. В горутинах — всегда передавай context.
7. Используй `errgroup` для параллельных задач.
