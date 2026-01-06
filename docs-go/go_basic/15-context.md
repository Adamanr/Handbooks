---
sidebar_position: 15
title: Context
---

# Context в Go

`context.Context` — это стандартный способ передачи данных, отмены и тайм-аутов между горутинами.

## Зачем нужен Context?

1. **Отмена** — отмена запроса при закрытии соединения
2. **Тайм-аут** — ограничение времени выполнения
3. **Данные** — передача request-scoped данных (например, user ID)
4. **Отмена по сигналу** — реагирование на shutdown

## Создание Context

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func main() {
    // Пустой контекст — основа всех остальных
    ctx := context.Background()
    fmt.Println(ctx)
    
    // Контекст с отменой
    ctx, cancel := context.WithCancel(ctx)
    defer cancel()
    
    // Контекст с тайм-аутом (2 секунды)
    ctx, cancel = context.WithTimeout(ctx, 2*time.Second)
    defer cancel()
    
    // Контекст с дедлайном
    deadline := time.Now().Add(5 * time.Second)
    ctx, cancel = context.WithDeadline(ctx, deadline)
    defer cancel()
}
```

## Отмена контекста

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func work(ctx context.Context, id int) {
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("Worker %d остановлен\n", id)
            return
        default:
            fmt.Printf("Worker %d работает...\n", id)
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    
    // Запускаем 3 воркера
    for i := 1; i <= 3; i++ {
        go work(ctx, i)
    }
    
    // Даём поработать секунду
    time.Sleep(1 * time.Second)
    
    // Отменяем контекст — все воркеры остановятся
    fmt.Println("Отменяем контекст...")
    cancel()
    
    // Ждём завершения
    time.Sleep(500 * time.Millisecond)
}
```

## Тайм-ауты

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func fetchData(ctx context.Context, url string) (string, error) {
    // Имитация долгого запроса
    select {
    case <-time.After(3 * time.Second):
        return "Data from " + url, nil
    case <-ctx.Done():
        return "", ctx.Err()
    }
}

func main() {
    // Тайм-аут 2 секунды
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()
    
    data, err := fetchData(ctx, "https://api.example.com")
    if err != nil {
        fmt.Println("Ошибка:", err) // context deadline exceeded
        return
    }
    fmt.Println(data)
}
```

## Передача данных через Context

```go
package main

import (
    "context"
    "fmt"
)

type contextKey string

const (
    UserIDKey    contextKey = "user_id"
    RequestIDKey contextKey = "request_id"
)

func main() {
    ctx := context.Background()
    
    // Добавляем данные в контекст
    ctx = context.WithValue(ctx, UserIDKey, 12345)
    ctx = context.WithValue(ctx, RequestIDKey, "req-abc-123")
    
    // Получаем данные
    userID := ctx.Value(UserIDKey)
    requestID := ctx.Value(RequestIDKey)
    
    fmt.Println("User ID:", userID)     // 12345
    fmt.Println("Request ID:", requestID) // req-abc-123
}

// Функция, которая читает из контекста
func getUserID(ctx context.Context) int {
    if userID, ok := ctx.Value(UserIDKey).(int); ok {
        return userID
    }
    return 0
}
```

## Context в HTTP сервере

```go
package main

import (
    "context"
    "fmt"
    "net/http"
    "time"
)

func withTimeout(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Создаём контекст с тайм-аутом 5 секунд
        ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
        defer cancel()
        
        // Заменяем контекст в запросе
        r = r.WithContext(ctx)
        
        // Канал для сигнала о завершении
        done := make(chan struct{})
        
        go func() {
            next.ServeHTTP(w, r)
            close(done)
        }()
        
        // Ждём либо завершения обработки, либо тайм-аута
        select {
        case <-done:
            // Запрос обработан
        case <-ctx.Done():
            http.Error(w, "Request timeout", http.StatusGatewayTimeout)
        }
    })
}

func handler(w http.ResponseWriter, r *http.Request) {
    // Можно использовать r.Context() для отмены
    select {
    case <-time.After(3 * time.Second):
        w.Write([]byte("Done!"))
    case <-r.Context().Done():
        fmt.Println("Client disconnected")
    }
}

func main() {
    http.HandleFunc("/slow", handler)
    http.ListenAndServe(":8080", nil)
}
```

## Лучшие практики

### ✅ Делайте:

```go
// 1. Передавайте контекст первым параметром
func DoSomething(ctx context.Context, args ...) error { ... }

// 2. Проверяйте ctx.Done() в длинных операциях
for {
    select {
    case <-ctx.Done():
        return ctx.Err()
    case <-workChan:
        // работа
    }
}

// 3. Используйте request-scoped контекст
func (r *Request) Process(ctx context.Context) { ... }
```

### ❌ Не делайте:

```go
// 1. Не храните контекст в структуре
type Service struct {
    ctx context.Context  // ❌
}

// 2. Не передавайте nil контекст
func Bad(ctx context.Context) {  // ctx может быть nil!
    select {
    case <-ctx.Done()  // panic!
    }
}

// 3. Не игнорируйте ошибку ctx.Done()
```

## Типичные паттерны

### Graceful shutdown

```go
package main

import (
    "context"
    "fmt"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func main() {
    srv := &http.Server{Addr: ":8080"}
    
    // Канал для graceful shutdown
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    // Запускаем сервер в горутине
    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            fmt.Println("Server error:", err)
        }
    }()
    
    // Ждём сигнала shutdown
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    
    fmt.Println("Shutting down server...")
    
    // Корректно завершаем сервер
    if err := srv.Shutdown(ctx); err != nil {
        fmt.Println("Server forced to shutdown:", err)
    }
    
    fmt.Println("Server stopped")
}
```

### Паттерн withValue для request ID

```go
package main

import (
    "context"
    "fmt"
    "net/http"
)

func requestIDKey() interface{} { return "request_id" }

func middleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Генерируем или получаем request ID
        reqID := r.Header.Get("X-Request-ID")
        if reqID == "" {
            reqID = fmt.Sprintf("%d", time.Now().UnixNano())
        }
        
        // Добавляем в контекст
        ctx := context.WithValue(r.Context(), requestIDKey(), reqID)
        
        // Передаём в заголовке ответа
        w.Header().Set("X-Request-ID", reqID)
        
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

func handler(w http.ResponseWriter, r *http.Request) {
    reqID := r.Context().Value(requestIDKey())
    fmt.Fprintf(w, "Request ID: %s", reqID)
}

func main() {
    http.Handle("/", middleware(http.HandlerFunc(handler)))
    http.ListenAndServe(":8080", nil)
}
```

## Итоги

| Функция | Описание |
|---------|----------|
| `context.Background()` | Пустой корневой контекст |
| `context.WithCancel()` | Контекст с ручной отменой |
| `context.WithTimeout()` | Контекст с тайм-аутом |
| `context.WithDeadline()` | Контекст с дедлайном |
| `context.WithValue()` | Контекст с данными |
| `ctx.Done()` | Канал, сигнализирующий об отмене |
| `ctx.Err()` | Ошибка отмены (если есть) |
| `ctx.Value(key)` | Получение данных из контекста |
