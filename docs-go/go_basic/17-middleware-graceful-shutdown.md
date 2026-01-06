---
sidebar_position: 17
title: Middleware и Graceful Shutdown
---

# Middleware и Graceful Shutdown

## Middleware в Go

Middleware — это функции, которые обрабатывают HTTP-запросы до или после основного обработчика.

## Базовый Middleware

```go
package main

import (
    "fmt"
    "log"
    "net/http"
    "time"
)

// Middleware логирования
func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        
        // Логируем входящий запрос
        log.Printf("Started %s %s", r.Method, r.URL.Path)
        
        // Вызываем следующий handler
        next.ServeHTTP(w, r)
        
        // Логируем время выполнения
        duration := time.Since(start)
        log.Printf("Completed %s %s in %v", r.Method, r.URL.Path, duration)
    })
}

// Middleware для добавления заголовков
func headersMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("X-Content-Type-Options", "nosniff")
        w.Header().Set("X-Frame-Options", "DENY")
        w.Header().Set("X-XSS-Protection", "1; mode=block")
        
        next.ServeHTTP(w, r)
    })
}

// Middleware для восстановления после паник
func recoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("Panic recovered: %v", err)
                http.Error(w, "Internal Server Error", http.StatusInternalServerError)
            }
        }()
        
        next.ServeHTTP(w, r)
    })
}

func main() {
    mux := http.NewServeMux()
    
    // Основной обработчик
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Hello, World!"))
    })
    
    // Применяем middleware (в обратном порядке!)
    handler := loggingMiddleware(mux)
    handler = headersMiddleware(handler)
    handler = recoveryMiddleware(handler)
    
    log.Println("Server starting on :8080")
    log.Fatal(http.ListenAndServe(":8080", handler))
}
```

## Middleware с использованием chi

```go
package main

import (
    "context"
    "log"
    "net/http"
    "time"
    
    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
)

func main() {
    r := chi.NewRouter()
    
    // Встроенные middleware от chi
    r.Use(middleware.Logger)           // Логирование
    r.Use(middleware.Recoverer)        // Восстановление после паник
    r.Use(middleware.RequestID)        // Добавляет X-Request-ID
    r.Use(middleware.RealIP)           // Реальный IP клиента
    r.Use(middleware.Timeout(30 * time.Second)) // Тайм-аут
    
    r.Get("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Hello!"))
    })
    
    // Middleware для конкретного маршрута
    r.Get("/admin", adminOnly, func(w http.ResponseWriter, r *http.Request) {
        w.Write([]ged to admin panel")
    })
    
    log.Fatal(http.ListenAndServe(":8080", r))
}

func adminOnly(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Проверка прав доступа
        isAdmin := true // Ваша логика проверки
        
        if !isAdmin {
            http.Error(w, "Forbidden", http.StatusForbidden)
            return
        }
        
        next.ServeHTTP(w, r)
    })
}
```

## Graceful Shutdown

Graceful shutdown — это корректное завершение работы сервера с ожиданием завершения активных запросов.

### Простой Graceful Shutdown

```go
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func main() {
    server := &http.Server{
        Addr: ":8080",
        // ReadTimeout:  10 * time.Second,
        // WriteTimeout: 10 * time.Second,
    }
    
    // Запускаем сервер в горутине
    go func() {
        log.Println("Server starting on :8080")
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Server error: %v", err)
        }
    }()
    
    // Канал для ожидания сигналов OS
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    
    log.Println("Shutting down server...")
    
    // Создаём контекст с тайм-аутом 30 секунд
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    
    // Корректно останавливаем сервер
    if err := server.Shutdown(ctx); err != nil {
        log.Printf("Server forced to shutdown: %v", err)
    }
    
    log.Println("Server stopped")
}
```

### Graceful Shutdown с ожиданием активных запросов

```go
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "sync"
    "syscall"
    "time"
)

type Server struct {
    httpServer *http.Server
    wg         sync.WaitGroup
}

func NewServer() *Server {
    return &Server{
        httpServer: &http.Server{
            Addr: ":8080",
        },
    }
}

func (s *Server) Handle(pattern string, handler http.Handler) {
    s.httpServer.Handler = handler
}

func (s *Server) Start() {
    s.wg.Add(1)
    go func() {
        defer s.wg.Done()
        log.Println("Server starting on :8080")
        if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Printf("Server error: %v", err)
        }
    }()
}

func (s *Server) Shutdown(timeout time.Duration) error {
    // Сигнализируем о завершении
    ctx, cancel := context.WithTimeout(context.Background(), timeout)
    defer cancel()
    
    log.Println("Shutting down server...")
    
    // Останавливаем HTTP сервер
    if err := s.httpServer.Shutdown(ctx); err != nil {
        return err
    }
    
    // Ждём завершения горутины сервера
    s.wg.Wait()
    
    log.Println("Server stopped gracefully")
    return nil
}

func main() {
    server := NewServer()
    
    server.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        time.Sleep(5 * time.Second) // Имитация долгой обработки
        w.Write([]byte("Done!"))
    }))
    
    server.Start()
    
    // Ожидаем сигнала
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    
    // Graceful shutdown с тайм-аутом 60 секунд
    if err := server.Shutdown(60 * time.Second); err != nil {
        log.Printf("Shutdown error: %v", err)
    }
}
```

### Graceful Shutdown с HTTP/2

```go
package main

import (
    "context"
    "crypto/tls"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func main() {
    // Настройки TLS для HTTP/2
    server := &http.Server{
        Addr: ":https",
        TLSConfig: &tls.Config{
            NextProtos: []string{"h2", "http/1.1"},
        },
    }
    
    mux := http.NewServeMux()
    mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        w.Write([]byte("Hello with HTTP/2!"))
    })
    server.Handler = mux
    
    // Запуск в горутине
    go func() {
        // certFile и keyFile должны быть настоящими сертификатами
        // if err := server.ListenAndServeTLS("server.crt", "server.key"); err != nil {
        //     log.Printf("Server error: %v", err)
        // }
    }()
    
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    
    log.Println("Shutting down...")
    if err := server.Shutdown(ctx); err != nil {
        log.Printf("Shutdown error: %v", err)
    }
}
```

## Полный пример: production-ready сервер

```go
package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func main() {
    // Конфигурация
    addr := ":8080"
    readTimeout := 10 * time.Second
    writeTimeout := 10 * time.Second
    idleTimeout := 120 * time.Second
    shutdownTimeout := 30 * time.Second
    
    // Создаём mux
    mux := http.NewServeMux()
    
    // Добавляем middleware
    mux.Use(LoggingMiddleware)
    mux.Use(RecoveryMiddleware)
    
    // Регистрируем handlers
    mux.HandleFunc("GET /health", healthHandler)
    mux.HandleFunc("GET /api/users", usersHandler)
    mux.HandleFunc("POST /api/users", createUserHandler)
    
    // Создаём сервер
    server := &http.Server{
        Addr:         addr,
        Handler:      mux,
        ReadTimeout:  readTimeout,
        WriteTimeout: writeTimeout,
        IdleTimeout:  idleTimeout,
    }
    
    // Запускаем в горутине
    go func() {
        log.Printf("Server starting on %s", addr)
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Server failed: %v", err)
        }
    }()
    
    // Ожидаем сигнала shutdown
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    
    log.Println("Received shutdown signal...")
    
    // Graceful shutdown
    ctx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
    defer cancel()
    
    if err := server.Shutdown(ctx); err != nil {
        log.Printf("Server shutdown error: %v", err)
    }
    
    log.Println("Server stopped")
}

// Middleware логирования
func LoggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
    })
}

// Middleware восстановления
func RecoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                log.Printf("Panic: %v", err)
                http.Error(w, "Internal Server Error", http.StatusInternalServerError)
            }
        }()
        next.ServeHTTP(w, r)
    })
}

// Handlers
func healthHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("OK"))
}

func usersHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte("[]"))
}

func createUserHandler(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusCreated)
    fmt.Fprint(w, `{"id": 1}`)
}
```

## Итоги

| Компонент | Назначение |
|-----------|------------|
| Middleware | Обработка запросов до/после handler'а |
| Recovery | Восстановление после паник |
| Logging | Логирование запросов |
| Graceful Shutdown | Корректное завершение с ожиданием запросов |
| Context timeout | Ограничение времени на shutdown |
