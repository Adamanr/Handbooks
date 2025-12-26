---
sidebar_position: 10
---

# Пакеты и Модули в Go

## Введение в модульную архитектуру

Go предоставляет мощную систему модулей и пакетов для организации кода. Понимание этой системы критически важно для профессиональной разработки.

## Пакеты (Packages)

### Основы пакетов

Пакет - это способ группировки связанного кода. Каждый файл Go начинается с объявления пакета.

```go
// Файл: mathutils/basic.go
package mathutils

import "math"

// Экспортируемая функция (начинается с заглавной буквы)
func Add(a, b int) int {
    return a + b
}

// Неэкспортируемая функция (начинается со строчной буквы)
func multiply(a, b int) int {
    return a * b
}

// Экспортируемая константа
const Pi = math.Pi

// Неэкспортируемая константа
const internalValue = 42
```

```go
// Файл: main.go
package main

import (
    "fmt"
    "mathutils" // Импорт локального пакета
)

func main() {
    result := mathutils.Add(5, 3)
    fmt.Printf("5 + 3 = %d\n", result)
    
    // mathutils.multiply(5, 3) // Ошибка: функция неэкспортируемая
    fmt.Printf("Pi = %.2f\n", mathutils.Pi)
}
```

### Структура пакета

```
myproject/
├── go.mod
├── main.go
├── internal/
│   ├── database/
│   │   ├── connection.go
│   │   └── models/
│   │       └── user.go
│   └── utils/
│       └── helpers.go
├── pkg/
│   ├── mathutils/
│   │   ├── basic.go
│   │   └── advanced.go
│   └── stringutils/
│       └── processing.go
└── cmd/
    └── server/
        └── main.go
```

### Инициализация пакетов

```go
// Файл: database/init.go
package database

import "log"

// init() вызывается автоматически при импорте пакета
func init() {
    log.Println("Database package initialized")
}

// Может быть несколько init() функций в разных файлах
func init() {
    // Дополнительная инициализация
    setupConnections()
}

var dbConnection *Connection

func setupConnections() {
    // Настройка соединений с БД
    dbConnection = &Connection{}
    log.Println("Database connections established")
}
```

### Практические примеры пакетов

#### 1. Пакет для работы с конфигурацией

```go
// Файл: config/config.go
package config

import (
    "encoding/json"
    "fmt"
    "os"
    "sync"
)

type Config struct {
    Database DatabaseConfig `json:"database"`
    Server   ServerConfig   `json:"server"`
    Logging  LoggingConfig  `json:"logging"`
}

type DatabaseConfig struct {
    Host     string `json:"host"`
    Port     int    `json:"port"`
    User     string `json:"user"`
    Password string `json:"password"`
    Name     string `json:"name"`
}

type ServerConfig struct {
    Port         int    `json:"port"`
    Host         string `json:"host"`
    ReadTimeout  int    `json:"read_timeout"`
    WriteTimeout int    `json:"write_timeout"`
}

type LoggingConfig struct {
    Level  string `json:"level"`
    Format string `json:"format"`
}

var (
    config *Config
    once   sync.Once
)

// Load загружает конфигурацию из файла
func Load(filename string) error {
    var err error
    
    once.Do(func() {
        data, readErr := os.ReadFile(filename)
        if readErr != nil {
            err = fmt.Errorf("ошибка чтения конфигурации: %w", readErr)
            return
        }
        
        config = &Config{}
        if unmarshalErr := json.Unmarshal(data, config); unmarshalErr != nil {
            err = fmt.Errorf("ошибка парсинга конфигурации: %w", unmarshalErr)
            return
        }
        
        // Валидация конфигурации
        if validateErr := config.validate(); validateErr != nil {
            err = fmt.Errorf("невалидная конфигурация: %w", validateErr)
            return
        }
    })
    
    return err
}

// Get возвращает текущую конфигурацию
func Get() *Config {
    if config == nil {
        panic("конфигурация не загружена. Сначала вызовите config.Load()")
    }
    return config
}

// validate проверяет корректность конфигурации
func (c *Config) validate() error {
    if c.Database.Host == "" {
        return fmt.Errorf("не указан хост базы данных")
    }
    if c.Database.Port <= 0 || c.Database.Port > 65535 {
        return fmt.Errorf("некорректный порт базы данных: %d", c.Database.Port)
    }
    if c.Server.Port <= 0 || c.Server.Port > 65535 {
        return fmt.Errorf("некорректный порт сервера: %d", c.Server.Port)
    }
    return nil
}

// IsDevelopment проверяет, запущено ли приложение в режиме разработки
func (c *Config) IsDevelopment() bool {
    return os.Getenv("ENV") == "development" || os.Getenv("ENV") == "dev"
}
```

```go
// Файл: cmd/server/main.go
package main

import (
    "fmt"
    "log"
    "os"
    
    "myproject/config"
)

func main() {
    // Загружаем конфигурацию
    configFile := "config.json"
    if envConfig := os.Getenv("CONFIG_FILE"); envConfig != "" {
        configFile = envConfig
    }
    
    if err := config.Load(configFile); err != nil {
        log.Fatalf("Ошибка загрузки конфигурации: %v", err)
    }
    
    cfg := config.Get()
    
    log.Printf("Запуск сервера на %s:%d", cfg.Server.Host, cfg.Server.Port)
    
    if cfg.IsDevelopment() {
        log.Println("Режим разработки")
    }
    
    // Запуск сервера...
    fmt.Printf("Сервер запущен с конфигурацией: %+v\n", cfg)
}
```

#### 2. Пакет для работы с базой данных

```go
// Файл: internal/database/connection.go
package database

import (
    "database/sql"
    "fmt"
    "sync"
    
    _ "github.com/lib/pq" // Драйвер PostgreSQL
)

type Connection struct {
    db *sql.DB
}

var (
    conn     *Connection
    connOnce sync.Once
    err      error
)

// NewConnection создает новое соединение с базой данных
func NewConnection(dsn string) (*Connection, error) {
    connOnce.Do(func() {
        conn = &Connection{}
        conn.db, err = sql.Open("postgres", dsn)
        if err != nil {
            err = fmt.Errorf("ошибка подключения к БД: %w", err)
            return
        }
        
        // Проверяем соединение
        if pingErr := conn.db.Ping(); pingErr != nil {
            err = fmt.Errorf("ошибка проверки соединения с БД: %w", pingErr)
            return
        }
        
        // Настраиваем пул соединений
        conn.db.SetMaxOpenConns(25)
        conn.db.SetMaxIdleConns(25)
    })
    
    return conn, err
}

// Get возвращает единственный экземпляр соединения
func Get() *Connection {
    if conn == nil {
        panic("соединение с БД не инициализировано")
    }
    return conn
}

// Query выполняет запрос к базе данных
func (c *Connection) Query(query string, args ...interface{}) (*sql.Rows, error) {
    return c.db.Query(query, args...)
}

// QueryRow выполняет запрос, возвращающий одну строку
func (c *Connection) QueryRow(query string, args ...interface{}) *sql.Row {
    return c.db.QueryRow(query, args...)
}

// Exec выполняет запрос без возврата результата
func (c *Connection) Exec(query string, args ...interface{}) (sql.Result, error) {
    return c.db.Exec(query, args...)
}

// Close закрывает соединение с базой данных
func (c *Connection) Close() error {
    return c.db.Close()
}
```

```go
// Файл: internal/database/models/user.go
package models

import (
    "time"
)

// User представляет пользователя в базе данных
type User struct {
    ID        int       `json:"id"`
    Username  string    `json:"username"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

// UserRepository предоставляет методы для работы с пользователями
type UserRepository struct {
    db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
    return &UserRepository{db: db}
}

// Create создает нового пользователя
func (r *UserRepository) Create(user *User) error {
    query := `
        INSERT INTO users (username, email, created_at, updated_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    `
    
    err := r.db.QueryRow(query, user.Username, user.Email, time.Now(), time.Now()).Scan(&user.ID)
    if err != nil {
        return fmt.Errorf("ошибка создания пользователя: %w", err)
    }
    
    return nil
}

// FindByID находит пользователя по ID
func (r *UserRepository) FindByID(id int) (*User, error) {
    user := &User{}
    
    query := `
        SELECT id, username, email, created_at, updated_at
        FROM users
        WHERE id = $1
    `
    
    err := r.db.QueryRow(query, id).Scan(
        &user.ID,
        &user.Username,
        &user.Email,
        &user.CreatedAt,
        &user.UpdatedAt,
    )
    
    if err != nil {
        return nil, fmt.Errorf("ошибка поиска пользователя: %w", err)
    }
    
    return user, nil
}

// FindAll находит всех пользователей
func (r *UserRepository) FindAll(limit, offset int) ([]*User, error) {
    query := `
        SELECT id, username, email, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
    `
    
    rows, err := r.db.Query(query, limit, offset)
    if err != nil {
        return nil, fmt.Errorf("ошибка получения пользователей: %w", err)
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
            return nil, fmt.Errorf("ошибка сканирования пользователя: %w", err)
        }
        users = append(users, user)
    }
    
    return users, nil
}

// Update обновляет пользователя
func (r *UserRepository) Update(user *User) error {
    query := `
        UPDATE users
        SET username = $1, email = $2, updated_at = $3
        WHERE id = $4
    `
    
    _, err := r.db.Exec(query, user.Username, user.Email, time.Now(), user.ID)
    if err != nil {
        return fmt.Errorf("ошибка обновления пользователя: %w", err)
    }
    
    return nil
}

// Delete удаляет пользователя
func (r *UserRepository) Delete(id int) error {
    query := "DELETE FROM users WHERE id = $1"
    
    _, err := r.db.Exec(query, id)
    if err != nil {
        return fmt.Errorf("ошибка удаления пользователя: %w", err)
    }
    
    return nil
}
```

## Модули Go

### Инициализация модуля

```bash
# Создание нового модуля
go mod init github.com/username/myproject

# Добавление зависимостей
go get github.com/gin-gonic/gin@latest
go get github.com/lib/pq
go get github.com/joho/godotenv
```

### go.mod файл

```go
// go.mod
module github.com/username/myproject

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/lib/pq v1.10.9
    github.com/joho/godotenv v1.5.1
)

require (
    github.com/bytedance/sonic v1.9.1 // indirect
    github.com/chenzhuoyu/base64x v0.0.0-20221115062448-fe3a3abad311 // indirect
    github.com/gabriel-vasile/mimetype v1.4.2 // indirect
    github.com/gin-contrib/sse v0.1.0 // indirect
    github.com/go-playground/locales v0.14.1 // indirect
    github.com/go-playground/universal-translator v0.18.1 // indirect
    github.com/go-playground/validator/v10 v10.14.0 // indirect
    github.com/goccy/go-json v0.10.2 // indirect
    github.com/json-iterator/go v1.1.12 // indirect
    github.com/klauspost/cpuid/v2 v2.2.4 // indirect
    github.com/leodido/go-urn v1.2.4 // indirect
    github.com/mattn/go-isatty v0.0.19 // indirect
    github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
    github.com/modern-go/reflect2 v1.0.2 // indirect
    github.com/pelletier/go-toml/v2 v2.0.8 // indirect
    github.com/twitchyliquid64/golang-asm v0.15.1 // indirect
    github.com/ugorji/go/codec v1.2.11 // indirect
    golang.org/x/arch v0.3.0 // indirect
    golang.org/x/crypto v0.9.0 // indirect
    golang.org/x/net v0.10.0 // indirect
    golang.org/x/sys v0.8.0 // indirect
    golang.org/x/text v0.9.0 // indirect
    google.golang.org/protobuf v1.30.0 // indirect
    gopkg.in/yaml.v3 v3.0.1 // indirect
)
```

### Управление зависимостями

```bash
# Обновление всех зависимостей
go mod tidy

# Добавление конкретной версии пакета
go get github.com/gin-gonic/gin@v1.8.1

# Удаление неиспользуемых зависимостей
go mod tidy

# Вендоринг зависимостей (копирование в проект)
go mod vendor

# Проверка уязвимостей
go list -json -m all | nancy sleuth

# Просмотр дерева зависимостей
go mod graph
```

### Версионирование

Семантическое версионирование в Go:

```go
// go.mod с конкретными версиями
module github.com/username/myproject

go 1.21

require (
    github.com/gin-gonic/gin v1.9.1
    github.com/lib/pq v1.10.9
    github.com/joho/godotenv v1.5.1
)

// Замещение зависимостей (для локальной разработки)
replace github.com/username/local-package => ../local-package

// Исключение определенных версий
exclude github.com/some-package v1.2.3
```

## Практическая архитектура проекта

### Полная структура проекта

```
myproject/
├── go.mod                          # Основной модуль
├── go.sum                          # Хеши зависимостей
├── Makefile                        # Сборка и команды
├── Dockerfile                      # Контейнеризация
├── docker-compose.yml              # Мультиконтейнерная разработка
├── .env.example                    # Пример переменных окружения
├── .gitignore                      # Игнорируемые файлы
├── README.md                       # Документация
├── cmd/                            # Точки входа приложений
│   ├── server/                     # HTTP сервер
│   │   └── main.go
│   └── worker/                     # Фоновый воркер
│       └── main.go
├── internal/                       # Приватный код (не импортируется извне)
│   ├── api/                        # HTTP обработчики
│   │   ├── handlers/               # Обработчики запросов
│   │   ├── middleware/             # Промежуточное ПО
│   │   └── routes/                 # Маршрутизация
│   ├── config/                     # Конфигурация
│   ├── database/                   # Работа с БД
│   │   ├── models/                 # Модели данных
│   │   ├── migrations/             # Миграции БД
│   │   └── repository/             # Репозитории
│   ├── service/                    # Бизнес-логика
│   ├── utils/                      # Вспомогательные функции
│   └── types/                      # Общие типы
├── pkg/                            # Публичный код (может импортироваться)
│   ├── logger/                     # Логирование
│   ├── validator/                  # Валидация данных
│   └── crypto/                     # Криптографические функции
├── test/                           # Интеграционные тесты
├── scripts/                        # Скрипты сборки и развертывания
├── migrations/                     # SQL миграции
├── configs/                        # Конфигурационные файлы
└── docs/                           # Документация API
```

### Основной файл приложения

```go
// Файл: cmd/server/main.go
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
    
    "github.com/gin-gonic/gin"
    
    "myproject/internal/api/handlers"
    "myproject/internal/config"
    "myproject/internal/database"
    "myproject/internal/service"
)

func main() {
    // Загружаем конфигурацию
    if err := config.Load("config.json"); err != nil {
        log.Fatalf("Ошибка загрузки конфигурации: %v", err)
    }
    
    cfg := config.Get()
    
    // Инициализируем базу данных
    db, err := database.NewConnection(cfg.Database.GetDSN())
    if err != nil {
        log.Fatalf("Ошибка подключения к БД: %v", err)
    }
    defer db.Close()
    
    // Инициализируем сервисы
    userService := service.NewUserService(database.NewUserRepository(db))
    
    // Создаем HTTP сервер
    router := gin.New()
    router.Use(gin.Logger())
    router.Use(gin.Recovery())
    
    // Регистрируем маршруты
    handlers.RegisterRoutes(router, userService)
    
    // Настраиваем HTTP сервер
    srv := &http.Server{
        Addr:    cfg.Server.GetAddr(),
        Handler: router,
    }
    
    // Запускаем сервер в горутине
    go func() {
        log.Printf("Запуск HTTP сервера на %s", srv.Addr)
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Ошибка запуска сервера: %v", err)
        }
    }()
    
    // Ожидаем сигнала для корректного завершения
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    
    log.Println("Завершение работы сервера...")
    
    // Корректно закрываем сервер
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    if err := srv.Shutdown(ctx); err != nil {
        log.Fatalf("Ошибка завершения работы сервера: %v", err)
    }
    
    log.Println("Сервер остановлен")
}
```

### Обработчики API

```go
// Файл: internal/api/handlers/user.go
package handlers

import (
    "net/http"
    "strconv"
    
    "github.com/gin-gonic/gin"
    
    "myproject/internal/types"
    "myproject/internal/service"
)

type UserHandler struct {
    userService *service.UserService
}

func NewUserHandler(userService *service.UserService) *UserHandler {
    return &UserHandler{userService: userService}
}

// CreateUser создает нового пользователя
func (h *UserHandler) CreateUser(c *gin.Context) {
    var req types.CreateUserRequest
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, types.ErrorResponse{
            Error: "неверный формат данных",
            Details: err.Error(),
        })
        return
    }
    
    // Валидация
    if err := h.validateCreateRequest(&req); err != nil {
        c.JSON(http.StatusBadRequest, types.ErrorResponse{
            Error: "ошибка валидации",
            Details: err.Error(),
        })
        return
    }
    
    user, err := h.userService.CreateUser(c.Request.Context(), &req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, types.ErrorResponse{
            Error: "ошибка создания пользователя",
            Details: err.Error(),
        })
        return
    }
    
    c.JSON(http.StatusCreated, types.UserResponse{
        User: user,
    })
}

// GetUser возвращает пользователя по ID
func (h *UserHandler) GetUser(c *gin.Context) {
    userID, err := strconv.Atoi(c.Param("id"))
    if err != nil {
        c.JSON(http.StatusBadRequest, types.ErrorResponse{
            Error: "неверный ID пользователя",
        })
        return
    }
    
    user, err := h.userService.GetUser(c.Request.Context(), userID)
    if err != nil {
        c.JSON(http.StatusNotFound, types.ErrorResponse{
            Error: "пользователь не найден",
        })
        return
    }
    
    c.JSON(http.StatusOK, types.UserResponse{
        User: user,
    })
}

// ListUsers возвращает список пользователей
func (h *UserHandler) ListUsers(c *gin.Context) {
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
    offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
    
    users, err := h.userService.ListUsers(c.Request.Context(), limit, offset)
    if err != nil {
        c.JSON(http.StatusInternalServerError, types.ErrorResponse{
            Error: "ошибка получения списка пользователей",
            Details: err.Error(),
        })
        return
    }
    
    c.JSON(http.StatusOK, types.UsersResponse{
        Users: users,
        Limit: limit,
        Offset: offset,
    })
}

func (h *UserHandler) validateCreateRequest(req *types.CreateUserRequest) error {
    if req.Username == "" {
        return fmt.Errorf("имя пользователя обязательно")
    }
    if len(req.Username) < 3 {
        return fmt.Errorf("имя пользователя должно содержать минимум 3 символа")
    }
    if req.Email == "" {
        return fmt.Errorf("email обязателен")
    }
    // Дополнительная валидация...
    return nil
}
```

```go
// Файл: internal/api/handlers/routes.go
package handlers

import (
    "github.com/gin-gonic/gin"
    
    "myproject/internal/service"
)

func RegisterRoutes(router *gin.Engine, userService *service.UserService) {
    // Создаем обработчики
    userHandler := NewUserHandler(userService)
    
    // Группа API v1
    v1 := router.Group("/api/v1")
    {
        users := v1.Group("/users")
        {
            users.POST("", userHandler.CreateUser)
            users.GET("", userHandler.ListUsers)
            users.GET(":id", userHandler.GetUser)
        }
    }
    
    // Группа для health check
    health := router.Group("/health")
    {
        health.GET("", func(c *gin.Context) {
            c.JSON(200, gin.H{
                "status": "ok",
            })
        })
    }
}
```

### Бизнес-логика

```go
// Файл: internal/service/user.go
package service

import (
    "context"
    "time"
    
    "myproject/internal/database/models"
    "myproject/internal/types"
)

type UserService struct {
    userRepo *models.UserRepository
}

func NewUserService(userRepo *models.UserRepository) *UserService {
    return &UserService{userRepo: userRepo}
}

func (s *UserService) CreateUser(ctx context.Context, req *types.CreateUserRequest) (*types.User, error) {
    // Проверяем уникальность username
    existingUser, err := s.userRepo.FindByUsername(req.Username)
    if err == nil {
        return nil, fmt.Errorf("пользователь с именем %s уже существует", req.Username)
    }
    
    // Создаем пользователя
    user := &models.User{
        Username: req.Username,
        Email:    req.Email,
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }
    
    if err := s.userRepo.Create(user); err != nil {
        return nil, fmt.Errorf("ошибка создания пользователя: %w", err)
    }
    
    return &types.User{
        ID:        user.ID,
        Username:  user.Username,
        Email:     user.Email,
        CreatedAt: user.CreatedAt,
        UpdatedAt: user.UpdatedAt,
    }, nil
}

func (s *UserService) GetUser(ctx context.Context, id int) (*types.User, error) {
    user, err := s.userRepo.FindByID(id)
    if err != nil {
        return nil, fmt.Errorf("пользователь не найден: %w", err)
    }
    
    return &types.User{
        ID:        user.ID,
        Username:  user.Username,
        Email:     user.Email,
        CreatedAt: user.CreatedAt,
        UpdatedAt: user.UpdatedAt,
    }, nil
}

func (s *UserService) ListUsers(ctx context.Context, limit, offset int) ([]*types.User, error) {
    users, err := s.userRepo.FindAll(limit, offset)
    if err != nil {
        return nil, fmt.Errorf("ошибка получения пользователей: %w", err)
    }
    
    var result []*types.User
    for _, user := range users {
        result = append(result, &types.User{
            ID:        user.ID,
            Username:  user.Username,
            Email:     user.Email,
            CreatedAt: user.CreatedAt,
            UpdatedAt: user.UpdatedAt,
        })
    }
    
    return result, nil
}
```

### Типы и DTO

```go
// Файл: internal/types/user.go
package types

import "time"

type User struct {
    ID        int       `json:"id"`
    Username  string    `json:"username"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

type CreateUserRequest struct {
    Username string `json:"username" binding:"required,min=3,max=50"`
    Email    string `json:"email" binding:"required,email"`
}

type UserResponse struct {
    User *User `json:"user"`
}

type UsersResponse struct {
    Users []*User `json:"users"`
    Limit int     `json:"limit"`
    Offset int    `json:"offset"`
}

type ErrorResponse struct {
    Error   string `json:"error"`
    Details string `json:"details,omitempty"`
}
```

## Лучшие практики

### 1. Структура проекта

- Используйте `cmd/` для точек входа
- Размещайте приватный код в `internal/`
- Публичный код в `pkg/`
- Отделяйте API, бизнес-логику и доступ к данным

### 2. Именование пакетов

```go
// Хорошо
package user          // Существительное
package auth          // Короткое и понятное
package http          // Общепринятое сокращение

// Плохо
package userManager   // Глагол + существительное
package myUtils       // Неспецифично
package helpers       // Слишком общее
```

### 3. Экспорт функций

```go
// Хорошо: экспортируемые функции документированы
// Sum возвращает сумму двух чисел
func Sum(a, b int) int {
    return a + b
}

// Плохо: неочевидное назначение
func calculate(a, b int) int {
    return a + b
}
```

### 4. Обработка ошибок в пакетах

```go
// Пакет возвращает типизированные ошибки
type Error struct {
    Code    string
    Message string
    Err     error
}

func (e Error) Error() string {
    return fmt.Sprintf("%s: %v", e.Message, e.Err)
}

// Константы ошибок
var (
    ErrUserNotFound = Error{
        Code:    "USER_NOT_FOUND",
        Message: "пользователь не найден",
    }
    
    ErrInvalidCredentials = Error{
        Code:    "INVALID_CREDENTIALS",
        Message: "неверные учетные данные",
    }
)
```

### 5. Конфигурация пакетов

```go
// Пакет предоставляет настройки через опции
type Option func(*Config)

type Config struct {
    Timeout time.Duration
    Retry   int
}

func WithTimeout(timeout time.Duration) Option {
    return func(c *Config) {
        c.Timeout = timeout
    }
}

func WithRetry(retry int) Option {
    return func(c *Config) {
        c.Retry = retry
    }
}

// Использование
client := NewClient(
    WithTimeout(30*time.Second),
    WithRetry(3),
)
```

## Упражнения

1. Создайте пакет для работы с Redis, включая подключение, основные операции и пулинг соединений
2. Реализуйте пакет для валидации данных с поддержкой пользовательских правил
3. Создайте модульную структуру для микросервиса с разделением на слои API, сервисы и репозитории
4. Реализуйте систему плагинов с динамической загрузкой
5. Создайте пакет для работы с очередями сообщений (RabbitMQ/Kafka)

В следующем уроке мы изучим тестирование в Go.