---
sidebar_position: 13
description: "В этом уроке мы научимся писать свои серверные приложения на Go с использованием стандартной библиотеки `net/http` и популярного фреймворка **Gin**."
prefix: "🎧"
---

# Веб-разработка и REST API

Поздравляю — вы дошли до финального урока! Теперь мы соберём всё изученное и создадим **настоящее веб-приложение**: REST API.

Go идеален для backend-сервисов: быстрый, надёжный, с отличной стандартной библиотекой. Мы начнём со встроенного `net/http`, а потом посмотрим на популярный фреймворк **Gin** — самый распространённый выбор в production.

Готовы? Открываем редактор и пишем сервер!

## Стандартная библиотека `net/http`

Go имеет мощный HTTP-сервер "из коробки". Никаких зависимостей не нужно.

## Другие фреймворки

- [**Echo**](https://echo.labstack.com) — минималистичный, очень быстрый
- [**Fiber**](https://gofiber.io) — вдохновлён Express.js, максимальная производительность
- [**Chi**](https://go-chi.io/#/) — лёгкий роутер, часто используется с net/http
- [**GoFr**](https://gofr.dev) — фреймворк ориентированный на ускоренную разработку микросервисов 


## Работа с `net/http`

### Простой сервер

```go
package main

import (
    "fmt"
    "log"
    "net/http"
)

func main() {
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprint(w, "Привет, мир! 🚀")
    })

    http.HandleFunc("/api/hello", func(w http.ResponseWriter, r *http.Request) {
        name := r.URL.Query().Get("name")
        if name == "" {
            name = "Гость"
        }
        fmt.Fprintf(w, "Привет, %s!", name)
    })

    slog.Info("Сервер запущен на http://localhost:8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

### JSON-ответы

```go
type User struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
}

func usersHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")

    users := []User{
        {ID: 1, Name: "Алиса"},
        {ID: 2, Name: "Боб"},
    }

    json.NewEncoder(w).Encode(users)
}
```

### Middleware

```go
func logging(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        slog.Info("logging", "Method", r.Method,  "URL Path",  r.URL.Path)
        next(w, r)
    }
}

// Использование
http.HandleFunc("/api/users", logging(usersHandler))
```

## Gin — самый популярный фреймворк

Gin быстрый, удобный и имеет всё необходимое: роутинг, middleware, валидацию.

Установка:
```bash
go get github.com/gin-gonic/gin
```

### Базовый сервер на Gin

```go
package main

import (
    "net/http"

    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default() // Logger + Recovery

    // Главная страница (корневой маршрут)
    r.GET("/", func(c *gin.Context) {
        // Обработчик запроса по адресу http://localhost:8080/

        // Возвращаем JSON-ответ с кодом 200 OK
        // gin.H — это удобный синоним для map[string]interface{}
        c.JSON(http.StatusOK, gin.H{
            "message": "Привет из Gin!",
        })
        // Альтернатива: c.String(http.StatusOK, "Привет из Gin!")
    })

    // Динамический маршрут с параметром
    r.GET("/users/:id", func(c *gin.Context) {
        // Этот маршрут сработает, например, на:
        // GET /users/123
        // GET /users/abc

        // Извлекаем значение параметра :id из URL
        // c.Param("id") возвращает строку, переданную вместо :id
        id := c.Param("id")

        // Возвращаем JSON с полученным id
        c.JSON(http.StatusOK, gin.H{
            "user_id": id, // просто эхо-параметр обратно клиенту
        })
        // Пример ответа: {"user_id":"123"}
    })

    // Создание нового пользователя через POST-запрос
    r.POST("/users", func(c *gin.Context) {
        // Этот маршрут обрабатывает POST http://localhost:8080/users

        // Создаём анонимную структуру для приёма данных из JSON-тела запроса
        // Теги `json:"..."` указывают, как поля называются в JSON
        // Теги `binding:"..."` — правила валидации Gin
        var user struct {
            Name  string `json:"name" binding:"required"`          // имя обязательно
            Email string `json:"email" binding:"required,email"`   // email обязателен и должен быть валидным
        }

        // Привязываем (парсим) тело JSON-запроса к нашей структуре
        // Если JSON некорректен или валидация не прошла — err будет не nil
        if err := c.ShouldBindJSON(&user); err != nil {
            // Возвращаем ошибку 400 Bad Request с текстом ошибки валидации
            c.JSON(http.StatusBadRequest, gin.H{
                "error": err.Error(),
            })
            return // важно выйти из функции, чтобы не продолжать обработку
        }

        // Если дошли сюда — все проверки прошли успешно

        // Возвращаем код 201 Created и информацию о созданном пользователе
        c.JSON(http.StatusCreated, gin.H{
            "message": "Пользователь создан", // сообщение об успехе
            "user":    user,                  // эхо полученных данных (в реальном проекте здесь был бы ID из БД)
        })
        // Пример ответа:
        // {
        //   "message": "Пользователь создан",
        //   "user": {
        //     "name": "Иван",
        //     "email": "ivan@example.com"
        //   }
        // }
    })

    r.Run(":8080")
}
```

## Группы маршрутов и middleware

### Что такое группы маршрутов 

**Группы маршрутов** (`r.Group(...)`) — это способ **организовать маршруты** в Gin по общим префиксам URL и **применить к ним общие middleware** одним махом.

### Зачем нужны группы?

1. **Организация кода**  
   Логически группируем маршруты:  
   - `/api/v1/users`, `/api/v1/posts` — публичное API  
   - `/api/v1/admin/...` — только для админов  
   - `/api/v1/auth/...` — авторизация

2. **Удобное применение middleware**  
   - Авторизация для всего API.  
   - Логирование, CORS, rate limiting — один раз на группу, а не на каждый маршрут.

3. **Версионирование API**  
   Легко сделать `/api/v2` рядом с `/api/v1`, не меняя код внутри обработчиков.

4. **Иерархия и вложенность**  
   Middleware "наследуется" от родительских групп — удобно для сложных прав доступа.

### Пример
```go
v1 := r.Group("/api/v1")
v1.Use(authMiddleware())  // всё API требует авторизации

{
    v1.GET("/profile", getProfile)

    users := v1.Group("/users")
    users.GET("", listUsers)
    users.POST("", createUser)

    admin := v1.Group("/admin")
    admin.Use(adminOnly())
    {
        admin.GET("/stats", getStats)
        admin.DELETE("/users/:id", deleteUser)
    }
}
```

## Graceful shutdown

### Что такое Graceful Shutdown?

**Graceful Shutdown** (грациозное завершение) — это **аккуратная остановка сервера**, при которой он:
- Перестаёт принимать **новые** запросы.
- Дожидается завершения **всех текущих** запросов (или до таймаута).
- Только потом полностью закрывается.

Без graceful shutdown при нажатии Ctrl+C или получении сигнала от системы (например, от Docker/Kubernetes) сервер просто **убивается сразу** — текущие запросы обрываются, пользователи видят ошибки, данные могут не сохраниться.

#### Зачем это нужно?
1. **Не терять запросы** — клиенты получают нормальный ответ, а не таймаут или ошибку соединения.
2. **Сохранять данные** — если запрос пишет в БД, логгер или кэш — он успевает завершиться.
3. **Хорошо вести себя в продакшене** — Kubernetes, Docker, systemd ожидают, что приложение корректно завершится по сигналу.
4. **Удобно при деплое** — новый экземпляр приложения запускается, старый аккуратно завершает работу (zero-downtime deploy).

### Пример

```go
srv := &http.Server{
    Addr:    ":8080",
    Handler: r,  // твой роутер (mux, gin и т.д.)
}

// Запускаем сервер в отдельной горутине
go func() {
    if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
        log.Fatal(err)  // ошибка, кроме нормального закрытия
    }
}()

// Ловим сигналы завершения (Ctrl+C, kill, SIGTERM от Docker/K8s)
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit  // ждём сигнала

// Даём серверу время на завершение текущих запросов (максимум 10 секунд)
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

if err := srv.Shutdown(ctx); err != nil {
    log.Fatal("Server forced to shutdown:", err)
}

slog.Info("Сервер gracefully остановлен")
```

#### Пошагово:
1. Сервер запускается в горутине — `main` может продолжать работать.
2. Программа ждёт сигнал завершения (Ctrl+C или SIGTERM).
3. При получении сигнала:
   - Создаётся контекст с таймаутом (обычно 5–30 секунд).
   - Вызывается `srv.Shutdown(ctx)`:
     - Сервер перестаёт принимать новые соединения.
     - Ждёт, пока все текущие обработчики завершатся.
     - Если не успели за таймаут — принудительно закрывает.
4. После этого приложение завершается чисто.

#### Что происходит с запросами
- **Новые** — сразу получают ошибку соединения (клиент увидит "connection refused").
- **Текущие** — продолжают выполняться до конца (или до таймаута).

#### Рекомендации
- Таймаут — 5–30 секунд (в зависимости от того, сколько могут длиться запросы).
- Добавь логи: "Получен сигнал завершения", "Сервер остановлен".
- Если используешь Gin, Echo, Fiber — у них есть встроенные методы graceful shutdown, но принцип тот же.




Для большинства проектов **Gin** — лучший баланс удобства и скорости.

## Лучшие практики

1. **Разделяйте слои**: handlers → service → repository
2. **Валидируйте входные данные** (Gin binding + validator)
3. **Обрабатывайте ошибки** красиво (единый формат)
4. **Используйте middleware** для логирования, аутентификации, CORS
5. **Graceful shutdown** обязателен в production
6. **Логируйте** всё важное
7. **Тестируйте** API (httptest)

## Тестирование HTTP обработчиков

```go
// Файл: handlers.go
package api

import (
    "encoding/json"
    "net/http"
    "strconv"
)

type UserHandler struct {
    service UserService
}

func (h *UserHandler) GetUser(w http.ResponseWriter, r *http.Request) {
    idStr := r.URL.Query().Get("id")
    id, err := strconv.Atoi(idStr)
    if err != nil {
        http.Error(w, "некорректный ID", http.StatusBadRequest)
        return
    }
    
    user, err := h.service.GetUser(r.Context(), id)
    if err != nil {
        http.Error(w, err.Error(), http.StatusNotFound)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}

func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Username string `json:"username"`
        Email    string `json:"email"`
    }
    
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "неверный формат данных", http.StatusBadRequest)
        return
    }
    
    user, err := h.service.CreateUser(r.Context(), req.Username, req.Email)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(user)
}
```

```go
// Файл: handlers_test.go
package api

import (
    "bytes"
    "context"
    "encoding/json"
    "errors"
    "net/http"
    "net/http/httptest"
    "testing"
)

type MockUserService struct {
    GetUserFunc    func(ctx context.Context, id int) (*User, error)
    CreateUserFunc func(ctx context.Context, username, email string) (*User, error)
}

func (m *MockUserService) GetUser(ctx context.Context, id int) (*User, error) {
    if m.GetUserFunc != nil {
        return m.GetUserFunc(ctx, id)
    }
    return nil, errors.New("не реализовано")
}

func (m *MockUserService) CreateUser(ctx context.Context, username, email string) (*User, error) {
    if m.CreateUserFunc != nil {
        return m.CreateUserFunc(ctx, username, email)
    }
    return nil, errors.New("не реализовано")
}

func TestGetUser(t *testing.T) {
    tests := []struct {
        name           string
        queryID        string
        mockFunc       func(ctx context.Context, id int) (*User, error)
        expectedStatus int
        expectedBody   string
    }{
        {
            name:    "успешное получение пользователя",
            queryID: "1",
            mockFunc: func(ctx context.Context, id int) (*User, error) {
                return &User{ID: 1, Username: "john", Email: "john@example.com"}, nil
            },
            expectedStatus: http.StatusOK,
        },
        {
            name:    "некорректный ID",
            queryID: "abc",
            mockFunc: nil,
            expectedStatus: http.StatusBadRequest,
        },
        {
            name:    "пользователь не найден",
            queryID: "999",
            mockFunc: func(ctx context.Context, id int) (*User, error) {
                return nil, errors.New("пользователь не найден")
            },
            expectedStatus: http.StatusNotFound,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Создаем мок сервиса
            mockService := &MockUserService{
                GetUserFunc: tt.mockFunc,
            }
            
            // Создаем обработчик
            handler := &UserHandler{service: mockService}
            
            // Создаем тестовый запрос
            req := httptest.NewRequest(http.MethodGet, "/user?id="+tt.queryID, nil)
            
            // Создаем ResponseRecorder для записи ответа
            rr := httptest.NewRecorder()
            
            // Вызываем обработчик
            handler.GetUser(rr, req)
            
            // Проверяем статус код
            if rr.Code != tt.expectedStatus {
                t.Errorf("статус код = %d; ожидается %d", rr.Code, tt.expectedStatus)
            }
            
            // Проверяем тело ответа для успешных запросов
            if tt.expectedStatus == http.StatusOK {
                var user User
                if err := json.NewDecoder(rr.Body).Decode(&user); err != nil {
                    t.Errorf("ошибка декодирования ответа: %v", err)
                }
                
                if user.Username != "john" {
                    t.Errorf("username = %s; ожидается john", user.Username)
                }
            }
        })
    }
}

func TestCreateUser(t *testing.T) {
    tests := []struct {
        name           string
        requestBody    interface{}
        mockFunc       func(ctx context.Context, username, email string) (*User, error)
        expectedStatus int
    }{
        {
            name: "успешное создание",
            requestBody: map[string]string{
                "username": "john",
                "email":    "john@example.com",
            },
            mockFunc: func(ctx context.Context, username, email string) (*User, error) {
                return &User{ID: 1, Username: username, Email: email}, nil
            },
            expectedStatus: http.StatusCreated,
        },
        {
            name:           "некорректный JSON",
            requestBody:    "invalid json",
            mockFunc:       nil,
            expectedStatus: http.StatusBadRequest,
        },
        {
            name: "ошибка сервиса",
            requestBody: map[string]string{
                "username": "",
                "email":    "john@example.com",
            },
            mockFunc: func(ctx context.Context, username, email string) (*User, error) {
                return nil, errors.New("username обязателен")
            },
            expectedStatus: http.StatusBadRequest,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            mockService := &MockUserService{
                CreateUserFunc: tt.mockFunc,
            }
            
            handler := &UserHandler{service: mockService}
            
            // Подготовка тела запроса
            var body bytes.Buffer
            json.NewEncoder(&body).Encode(tt.requestBody)
            
            req := httptest.NewRequest(http.MethodPost, "/user", &body)
            req.Header.Set("Content-Type", "application/json")
            
            rr := httptest.NewRecorder()
            
            handler.CreateUser(rr, req)
            
            if rr.Code != tt.expectedStatus {
                t.Errorf("статус код = %d; ожидается %d", rr.Code, tt.expectedStatus)
            }
        })
    }
}
```

## Финальный проект

Это **кульминация всего курса** — ты соберёшь всё, что изучал: переменные, структуры, слайсы, функции, методы, маршруты Gin, JSON, обработку ошибок и даже немного валидации.  

Проект будет простым, но полностью рабочим REST API для задач (TODO-лист), который можно тестировать через `curl` или [Postman](https://www.postman.com) / [ApiDog](https://apidog.com).

### Требования к проекту

Используй **Gin** (`go get github.com/gin-gonic/gin`).  
Всё в одном файле `main.go` (для простоты), но с чистой структурой.

Реализуй следующие эндпоинты:

| Метод   | Путь              | Описание                              | Тело запроса / ответ                          |
|---------|-------------------|---------------------------------------|-----------------------------------------------|
| POST    | `/tasks`          | Создать новую задачу                  | JSON → `{ "title": "string", "done": bool }`  |
| GET     | `/tasks`          | Получить список всех задач            | JSON-массив задач                             |
| GET     | `/tasks/:id`      | Получить задачу по ID                 | JSON одной задачи или 404                     |
| PUT     | `/tasks/:id`      | Обновить задачу (title и/или done)    | JSON → частичное обновление                   |
| DELETE  | `/tasks/:id`      | Удалить задачу                        | 204 No Content или 404                        |

### Структура данных
```go
type Task struct {
    ID    int    `json:"id"`
    Title string `json:"title" binding:"required"`
    Done  bool   `json:"done"`
}
```

Храни задачи в памяти — в глобальном слайсе `[]Task` и переменной-счётчике ID.

### Дополнительно для крутости (обязательно!)
1. **Валидация** через `binding:"required"` — если title пустой → 400 Bad Request.
2. **Красивые сообщения об ошибках**.
3. **Автоинкремент ID**.
4. **При старте сервера** — красивый баннер:
   ```
   🚀 TODO API запущен!
   📡 Доступен по адресу: http://localhost:8080
   Попробуй: curl -X POST http://localhost:8080/tasks -H "Content-Type: application/json" -d '{"title":"Выучить Go"}'
   ```

### Пример готового вывода при тестах
```bash
$ curl http://localhost:8080/tasks
[]
$ curl -X POST http://localhost:8080/tasks -d '{"title":"Изучить Go"}' -H "Content-Type: application/json"
{"id":1,"title":"Изучить Go","done":false}

$ curl http://localhost:8080/tasks
[{"id":1,"title":"Изучить Go","done":false}]

$ curl -X PUT http://localhost:8080/tasks/1 -d '{"done":true}' -H "Content-Type: application/json"
{"id":1,"title":"Изучить Go","done":true}
```

### Файл `main.go`

Вот пример базового содержимого файла `main.go`, к которому потребуется самостоятельно подключить необходимые функции, маршруты, взаимодействие с базой данных и прочие компоненты вашего проекта.

```go
package main

import (
    "net/http"
    "strconv"
    "sync"

    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()

    // Красивый стартовый баннер
    r.GET("/", func(c *gin.Context) {
        c.String(http.StatusOK,
            "🚀 TODO API запущен!\n"+
                "📡 Доступен по адресу: http://localhost:8080\n\n"+
                "Примеры команд:\n"+
                "  curl -X POST /tasks -d '{\"title\":\"Новая задача\"}' -H 'Content-Type: application/json'\n"+
                "  curl /tasks\n")
    })

    // === Маршруты ===
    r.POST("/tasks", createTask)
    r.GET("/tasks", listTasks)
    r.GET("/tasks/:id", getTask)
    r.PUT("/tasks/:id", updateTask)
    r.DELETE("/tasks/:id", deleteTask)

    r.Run(":8080") // порт 8080
}

// createTask, listTasks, getTask, updateTask, deleteTask — реализуй сам!
// Используй mu.Lock()/Unlock() для безопасности
// Не забудь проверку существования ID и валидацию
```
