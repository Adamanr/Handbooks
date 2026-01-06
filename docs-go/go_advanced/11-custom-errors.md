---
sidebar_position: 11
title: Кастомные ошибки
---

# Кастомные ошибки в Go

## Базовые ошибки

```go
package main

import (
    "errors"
    "fmt"
)

func main() {
    // Простейшая ошибка
    err := errors.New("something went wrong")
    fmt.Println(err)
    
    // С форматированием
    err = fmt.Errorf("user %d not found", 42)
    fmt.Println(err)
}
```

## Типы ошибок

```go
package main

import (
    "errors"
    "fmt"
)

// 1. Ошибка как значение
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// 2. Ошибка с кодом
type StatusError struct {
    Code    int
    Message string
}

func (e *StatusError) Error() string {
    return fmt.Sprintf("status %d: %s", e.Code, e.Message)
}

// 3. Ошибка с контекстом
type APIError struct {
    Endpoint string
    Status   int
    Err      error
}

func (e *APIError) Error() string {
    if e.Err != nil {
        return fmt.Sprintf("%s: %v", e.Endpoint, e.Err)
    }
    return fmt.Sprintf("%s: status %d", e.Endpoint, e.Status)
}

// 4. Оборачивание ошибок
func (e *APIError) Unwrap() error {
    return e.Err
}

func main() {
    // Использование
    err := &ValidationError{Field: "email", Message: "invalid format"}
    fmt.Println(err) // email: invalid format
    
    err2 := &StatusError{Code: 404, Message: "not found"}
    fmt.Println(err2) // status 404: not found
    
    err3 := &APIError{
        Endpoint: "/api/users",
        Status:   500,
        Err:      errors.New("database connection failed"),
    }
    fmt.Println(err3) // /api/users: database connection failed
}
```

## Sentinel Errors

```go
package main

import (
    "errors"
    "fmt"
)

// Sentinel errors — предопределённые ошибки для проверки
var (
    ErrNotFound          = errors.New("not found")
    ErrAlreadyExists     = errors.New("already exists")
    ErrPermissionDenied  = errors.New("permission denied")
    ErrInvalidInput      = errors.New("invalid input")
    ErrConnectionFailed  = errors.New("connection failed")
    ErrTimeout           = errors.New("timeout")
)

func findUser(id int) error {
    if id == 0 {
        return ErrNotFound
    }
    if id < 0 {
        return ErrPermissionDenied
    }
    return nil
}

func main() {
    err := findUser(0)
    
    // Проверка на конкретную ошибку
    if errors.Is(err, ErrNotFound) {
        fmt.Println("User not found!")
    }
    
    // Оборачивание с добавлением контекста
    if err != nil {
        fmt.Errorf("failed to find user: %w", err)
    }
}
```

## Оборачивание ошибок (error wrapping)

```go
package main

import (
    "errors"
    "fmt"
)

func level3() error {
    return errors.New("root error")
}

func level2() error {
    err := level3()
    return fmt.Errorf("level 2: %w", err)
}

func level1() error {
    err := level2()
    return fmt.Errorf("level 1: %w", err)
}

func main() {
    err := level1()
    
    // Выводим всю цепочку
    fmt.Println("Full chain:")
    for {
        fmt.Println("-", err)
        if errors.Unwrap(err) == nil {
            break
        }
        err = errors.Unwrap(err)
    }
    
    // errors.Is проходит по всей цепочке
    if errors.Is(err, errors.New("root error")) {
        fmt.Println("Found root error!")
    }
}
```

## Паттерны создания ошибок

### 1. Фабричные функции

```go
package main

import (
    "fmt"
)

type AppError struct {
    Code    string
    Message string
    Cause   error
}

func (e *AppError) Error() string {
    if e.Cause != nil {
        return fmt.Sprintf("%s: %s: %v", e.Code, e.Message, e.Cause)
    }
    return fmt.Sprintf("%s: %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
    return e.Cause
}

// Фабрики
func NewNotFoundError(resource, id string) *AppError {
    return &AppError{
        Code:    "NOT_FOUND",
        Message: fmt.Sprintf("%s %s not found", resource, id),
    }
}

func NewValidationError(field, msg string) *AppError {
    return &AppError{
        Code:    "VALIDATION_ERROR",
        Message: fmt.Sprintf("%s: %s", field, msg),
    }
}

func NewInternalError(msg string, cause error) *AppError {
    return &AppError{
        Code:    "INTERNAL_ERROR",
        Message: msg,
        Cause:   cause,
    }
}

func main() {
    err := NewNotFoundError("user", "123")
    fmt.Println(err) // NOT_FOUND: user 123 not found
}
```

### 2. Ошибки с данными

```go
package main

import (
    "errors"
    "fmt"
)

type FieldError struct {
    Field string
    Value interface{}
    Msg   string
}

func (f FieldError) Error() string {
    return fmt.Sprintf("field %q: %v - %s", f.Field, f.Value, f.Msg)
}

func validateEmail(email string) error {
    if email == "" {
        return FieldError{Field: "email", Value: email, Msg: "required"}
    }
    if len(email) < 5 {
        return FieldError{Field: "email", Value: email, Msg: "too short"}
    }
    return nil
}

func main() {
    err := validateEmail("")
    if err != nil {
        fmt.Println(err)
        // Можно привести к типу для доступа к полям
        if fe, ok := err.(FieldError); ok {
            fmt.Printf("Field: %s, Value: %v\n", fe.Field, fe.Value)
        }
    }
}
```

### 3. Ошибки с кодами HTTP

```go
package main

import (
    "errors"
    "fmt"
    "net/http"
)

type HTTPError struct {
    Code    int
    Message string
}

func (e *HTTPError) Error() string {
    return e.Message
}

// Интерфейс для проверки статуса
type Coder interface {
    Code() int
}

func (e *HTTPError) Code() int {
    return e.Code
}

func NotFound(msg string) *HTTPError {
    return &HTTPError{Code: http.StatusNotFound, Message: msg}
}

func BadRequest(msg string) *HTTPError {
    return &HTTPError{Code: http.StatusBadRequest, Message: msg}
}

func Internal(msg string) *HTTPError {
    return &HTTPError{Code: http.StatusInternalServerError, Message: msg}
}

func main() {
    err := NotFound("user not found")
    fmt.Println(err)        // user not found
    fmt.Println(err.Code()) // 404
    
    // Проверка через errors.Is
    var coder Coder
    if errors.As(err, &coder) {
        fmt.Printf("HTTP status: %d\n", coder.Code())
    }
}
```

## Обработка ошибок в коде

```go
package main

import (
    "errors"
    "fmt"
)

func divide(a, (float64, b float64) error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

func processData(data []int) error {
    if len(data) == 0 {
        return errors.New("empty data")
    }
    return nil
}

// Агрегация ошибок
func processAll(items []int) error {
    var errs []error
    
    for i, item := range items {
        if item < 0 {
            errs = append(errs, fmt.Errorf("item %d: negative value %d", i, item))
        }
    }
    
    if len(errs) > 0 {
        return errors.Join(errs...)
    }
    return nil
}

func main() {
    // Простая обработка
    result, err := divide(10, 0)
    if err != nil {
        fmt.Println("Error:", err)
        return
    }
    fmt.Println(result)
    
    // Множественные ошибки (Go 1.20+)
    err = processAll([]int{1, -2, 3, -4})
    if err != nil {
        fmt.Println("Errors:", err)
    }
}
```

## Библиотеки для ошибок

### 1. `pkg/errors`

```go
// Устаревший стиль, теперь есть встроенный
// errors.Wrap, errors.WithMessage, errors.WithStack
```

### 2. Go 1.20+ — стандартный error grouping

```go
package main

import (
    "errors"
    "fmt"
)

func main() {
    err1 := errors.New("error 1")
    err2 := errors.New("error 2")
    err3 := errors.New("error 3")
    
    // Объединение ошибок
    combined := errors.Join(err1, err2, err3)
    
    fmt.Println(combined)
    
    // Проверка на конкретную ошибку
    if errors.Is(combined, err1) {
        fmt.Println("Contains err1")
    }
    
    // Получение всех ошибок
    for _, e := range []error{err1, err2, err3} {
        if errors.Is(combined, e) {
            fmt.Println("Found:", e)
        }
    }
}
```

## Лучшие практики

### ✅ Делайте:

```go
// 1. Используйте sentinel errors для предсказуемых сценариев
var ErrNotFound = errors.New("not found")

// 2. Оборачивайте ошибки с %w
if err != nil {
    return fmt.Errorf("failed to load config: %w", err)
}

// 3. Используйте errors.Is и errors.As для проверки
if errors.Is(err, ErrNotFound) {
    // обработка
}

// 4. Создавайте понятные сообщения
return fmt.Errorf("user %d: %w", userID, err)

// 5. Сохраняйте стектрейс (через библиотеку или Go 1.20+)
// errors.Join сохраняет контекст
```

### ❌ Не делайте:

```go
// 1. Не используйте строки для проверки
if err.Error() == "not found" {  // ❌

// 2. Не теряйте исходную ошибку
return errors.New(err.Error())  // ❌

// 3. Не используйте panic для обычных ошибок
if err != nil {
    panic(err)  // ❌
}

// 4. Не скрывайте ошибки
_ = someFunc()  // ❌
```
