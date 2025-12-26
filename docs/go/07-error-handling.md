---
sidebar_position: 7
---

# Обработка ошибок в Go

## Что такое ошибки в Go?

В Go ошибки являются обычными значениями, а не исключениями. Тип `error` — это встроенный интерфейс, определенный следующим образом:

```go
type error interface {
    Error() string
}
```

Любой тип, который реализует метод `Error() string`, может использоваться как ошибка.

## Создание ошибок

### Использование errors.New()

Простейший способ создать ошибку — использовать функцию `errors.New()`:

```go
package main

import (
    "errors"
    "fmt"
)

func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, errors.New("деление на ноль")
    }
    return a / b, nil
}

func main() {
    result, err := divide(10, 0)
    if err != nil {
        fmt.Printf("Ошибка: %v\n", err)
        return
    }
    fmt.Printf("Результат: %.2f\n", result)
}
```

### Создание ошибок с помощью fmt.Errorf()

Для создания ошибок с форматированным сообщением используйте `fmt.Errorf()`:

```go
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("деление %f на ноль", a)
    }
    return a / b, nil
}

func validateAge(age int) error {
    if age < 0 {
        return fmt.Errorf("возраст не может быть отрицательным: %d", age)
    }
    if age > 150 {
        return fmt.Errorf("возраст не может превышать 150 лет: %d", age)
    }
    return nil
}
```

### Создание структурированных ошибок

Для более сложных случаев можно создать собственные типы ошибок:

```go
type ValidationError struct {
    Field   string
    Value   interface{}
    Message string
}

func (e ValidationError) Error() string {
    return fmt.Sprintf("ошибка валидации поля '%s': %s (значение: %v)", 
        e.Field, e.Message, e.Value)
}

func validateUser(user User) error {
    if user.Name == "" {
        return ValidationError{
            Field:   "Name",
            Value:   user.Name,
            Message: "имя не может быть пустым",
        }
    }
    if user.Email == "" {
        return ValidationError{
            Field:   "Email", 
            Value:   user.Email,
            Message: "email не может быть пустым",
        }
    }
    return nil
}
```

## Обработка ошибок

### Базовая обработка ошибок

```go
func readFile(filename string) ([]byte, error) {
    data, err := os.ReadFile(filename)
    if err != nil {
        return nil, fmt.Errorf("ошибка при чтении файла %s: %v", filename, err)
    }
    return data, nil
}

func main() {
    data, err := readFile("config.json")
    if err != nil {
        log.Fatalf("Не удалось прочитать конфигурацию: %v", err)
    }
    fmt.Println("Файл прочитан успешно:", len(data), "байт")
}
```

### Проверка конкретных ошибок

```go
import (
    "errors"
    "os"
)

func processFile(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        // Проверяем конкретный тип ошибки
        if errors.Is(err, os.ErrNotExist) {
            return fmt.Errorf("файл %s не существует", filename)
        }
        if errors.Is(err, os.ErrPermission) {
            return fmt.Errorf("нет прав доступа к файлу %s", filename)
        }
        return fmt.Errorf("неожиданная ошибка при открытии файла %s: %v", filename, err)
    }
    defer file.Close()
    
    // Обработка файла...
    return nil
}
```

### Обертывание ошибок

Go 1.13+ поддерживает "обертывание" ошибок с помощью `%w`:

```go
func processData(data []byte) error {
    var result int
    
    _, err := fmt.Sscanf(string(data), "%d", &result)
    if err != nil {
        // Обертываем исходную ошибку
        return fmt.Errorf("не удалось распарсить данные: %w", err)
    }
    
    if result < 0 {
        return fmt.Errorf("результат не может быть отрицательным: %d: %w", 
            result, err)
    }
    
    return nil
}

// Проверка обернутых ошибок
func main() {
    data := []byte("invalid")
    err := processData(data)
    
    if err != nil {
        fmt.Printf("Ошибка: %v\n", err)
        
        // Проверяем исходную ошибку
        var parseErr error
        if errors.As(err, &parseErr) {
            fmt.Printf("Исходная ошибка парсинга: %v\n", parseErr)
        }
    }
}
```

### Ошибки как значения

В Go принято возвращать ошибки как последнее значение:

```go
func calculate(a, b float64, operation string) (float64, error) {
    switch operation {
    case "+":
        return a + b, nil
    case "-":
        return a - b, nil
    case "*":
        return a * b, nil
    case "/":
        if b == 0 {
            return 0, fmt.Errorf("деление на ноль")
        }
        return a / b, nil
    default:
        return 0, fmt.Errorf("неизвестная операция: %s", operation)
    }
}

func main() {
    result, err := calculate(10, 5, "+")
    if err != nil {
        fmt.Printf("Ошибка вычисления: %v\n", err)
        return
    }
    fmt.Printf("Результат: %.2f\n", result)
}
```

## Паттерны обработки ошибок

### Игнорирование ошибок

Иногда ошибки можно игнорировать, но это должно быть осознанное решение:

```go
// Плохо: ошибка игнорируется без причины
data, _ := os.ReadFile("config.json") // НЕ ДЕЛАЙТЕ ТАК!

// Хорошо: ошибка явно игнорируется с комментарием
data, err := os.ReadFile("config.json")
if err != nil {
    data = []byte("{}") // используем значения по умолчанию
}
```

### Обработка ошибок в циклах

```go
func processFiles(filenames []string) error {
    for _, filename := range filenames {
        if err := processFile(filename); err != nil {
            // Логируем ошибку, но продолжаем обработку других файлов
            log.Printf("Ошибка обработки файла %s: %v", filename, err)
            continue
        }
        fmt.Printf("Файл %s обработан успешно\n", filename)
    }
    return nil
}
```

### Агрегация ошибок

Для сбора нескольких ошибок используйте `errors.Join()`:

```go
func validateUser(user User) error {
    var errs []error
    
    if user.Name == "" {
        errs = append(errs, errors.New("имя не может быть пустым"))
    }
    
    if user.Email == "" {
        errs = append(errs, errors.New("email не может быть пустым"))
    }
    
    if user.Age < 0 {
        errs = append(errs, errors.New("возраст не может быть отрицательным"))
    }
    
    if len(errs) > 0 {
        return errors.Join(errs...)
    }
    
    return nil
}
```

## Работа с паникой

### Recover

`recover` позволяет перехватить панику и восстановить нормальную работу программы:

```go
func safeFunction() {
    defer func() {
        if r := recover(); r != nil {
            fmt.Printf("Перехвачена паника: %v\n", r)
            // Восстановление после паники
        }
    }()
    
    // Код, который может вызвать панику
    panic("что-то пошло не так")
}

func divideWithRecover(a, b float64) (result float64, err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("паника в функции деления: %v", r)
        }
    }()
    
    if b == 0 {
        panic("деление на ноль")
    }
    
    return a / b, nil
}
```

### Когда использовать panic

`panic` следует использовать только в крайних случаях:

```go
// Хорошие случаи для panic:
func setupConfig() {
    config, err := loadConfig()
    if err != nil {
        panic("не удалось загрузить конфигурацию: " + err.Error())
    }
    
    if config.DatabaseURL == "" {
        panic("DATABASE_URL не установлена")
    }
}

// Плохой случай для panic:
func divide(a, b float64) float64 {
    if b == 0 {
        panic("деление на ноль") // НЕ ДЕЛАЙТЕ ТАК!
    }
    return a / b
}
```

## Практические примеры

### Валидация входных данных

```go
type User struct {
    Name  string
    Email string
    Age   int
}

type ValidationError struct {
    Field   string
    Value   interface{}
    Message string
}

func (e ValidationError) Error() string {
    return fmt.Sprintf("поле '%s': %s (значение: %v)", e.Field, e.Message, e.Value)
}

func (e ValidationError) Unwrap() error {
    return errors.New("validation failed")
}

func (u User) Validate() error {
    var errs []error
    
    if strings.TrimSpace(u.Name) == "" {
        errs = append(errs, ValidationError{
            Field:   "Name",
            Value:   u.Name,
            Message: "не может быть пустым",
        })
    } else if len(u.Name) < 2 {
        errs = append(errs, ValidationError{
            Field:   "Name",
            Value:   u.Name,
            Message: "должно содержать минимум 2 символа",
        })
    }
    
    if !isValidEmail(u.Email) {
        errs = append(errs, ValidationError{
            Field:   "Email",
            Value:   u.Email,
            Message: "неверный формат email",
        })
    }
    
    if u.Age < 0 {
        errs = append(errs, ValidationError{
            Field:   "Age",
            Value:   u.Age,
            Message: "не может быть отрицательным",
        })
    } else if u.Age > 150 {
        errs = append(errs, ValidationError{
            Field:   "Age",
            Value:   u.Age,
            Message: "не может превышать 150 лет",
        })
    }
    
    if len(errs) > 0 {
        return errors.Join(errs...)
    }
    
    return nil
}

func isValidEmail(email string) bool {
    if email == "" {
        return false
    }
    // Простая проверка email
    return strings.Contains(email, "@") && strings.Contains(email, ".")
}

func main() {
    users := []User{
        {Name: "Alice", Email: "alice@example.com", Age: 25},
        {Name: "", Email: "invalid-email", Age: -5},
        {Name: "B", Email: "bob@example.com", Age: 200},
    }
    
    for i, user := range users {
        fmt.Printf("Проверка пользователя %d:\n", i+1)
        if err := user.Validate(); err != nil {
            if validationErrs, ok := err.(interface{ Unwrap() []error }); ok {
                fmt.Println("Ошибки валидации:")
                for _, e := range validationErrs.Unwrap() {
                    fmt.Printf("  - %v\n", e)
                }
            } else {
                fmt.Printf("  Ошибка: %v\n", err)
            }
        } else {
            fmt.Println("  Пользователь валиден")
        }
        fmt.Println()
    }
}
```

### HTTP сервер с обработкой ошибок

```go
type APIError struct {
    Code    int    `json:"code"`
    Message string `json:"message"`
    Details string `json:"details,omitempty"`
}

func (e APIError) Error() string {
    return e.Message
}

func writeError(w http.ResponseWriter, statusCode int, message string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(statusCode)
    
    errorResponse := APIError{
        Code:    statusCode,
        Message: message,
    }
    
    json.NewEncoder(w).Encode(errorResponse)
}

func validateUserInput(r *http.Request) (User, error) {
    var user User
    
    // Парсинг JSON
    if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
        return User{}, APIError{
            Code:    400,
            Message: "неверный формат JSON",
            Details: err.Error(),
        }
    }
    
    // Валидация
    if err := user.Validate(); err != nil {
        return User{}, APIError{
            Code:    400,
            Message: "ошибка валидации данных",
            Details: err.Error(),
        }
    }
    
    return user, nil
}

func createUserHandler(w http.ResponseWriter, r *http.Request) {
    user, err := validateUserInput(r)
    if err != nil {
        if apiErr, ok := err.(APIError); ok {
            writeError(w, apiErr.Code, apiErr.Message)
        } else {
            writeError(w, 500, "внутренняя ошибка сервера")
        }
        return
    }
    
    // Создание пользователя...
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(201)
    json.NewEncoder(w).Encode(map[string]string{
        "message": "пользователь создан",
        "id":      "123",
    })
}

func main() {
    http.HandleFunc("/users", createUserHandler)
    
    fmt.Println("Сервер запущен на порту 8080")
    if err := http.ListenAndServe(":8080", nil); err != nil {
        log.Fatalf("Ошибка запуска сервера: %v", err)
    }
}
```

### Работа с базой данных

```go
type DatabaseError struct {
    Query string
    Err   error
}

func (e DatabaseError) Error() string {
    return fmt.Sprintf("ошибка выполнения запроса '%s': %v", e.Query, e.Err)
}

func (e DatabaseError) Unwrap() error {
    return e.Err
}

type UserRepository struct {
    db *sql.DB
}

func (r *UserRepository) GetUser(id int) (User, error) {
    var user User
    
    query := "SELECT id, name, email, age FROM users WHERE id = ?"
    row := r.db.QueryRow(query, id)
    
    err := row.Scan(&user.ID, &user.Name, &user.Email, &user.Age)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return User{}, fmt.Errorf("пользователь с ID %d не найден: %w", id, err)
        }
        return User{}, DatabaseError{
            Query: query,
            Err:   fmt.Errorf("ошибка сканирования результата: %w", err),
        }
    }
    
    return user, nil
}

func (r *UserRepository) CreateUser(user User) error {
    query := "INSERT INTO users (name, email, age) VALUES (?, ?, ?)"
    
    result, err := r.db.Exec(query, user.Name, user.Email, user.Age)
    if err != nil {
        if strings.Contains(err.Error(), "UNIQUE constraint failed") {
            return fmt.Errorf("пользователь с email %s уже существует: %w", 
                user.Email, err)
        }
        return DatabaseError{
            Query: query,
            Err:   fmt.Errorf("ошибка выполнения INSERT: %w", err),
        }
    }
    
    rowsAffected, err := result.RowsAffected()
    if err != nil {
        return fmt.Errorf("ошибка получения количества затронутых строк: %w", err)
    }
    
    if rowsAffected == 0 {
        return fmt.Errorf("пользователь не был создан")
    }
    
    return nil
}
```

### Логирование ошибок

```go
type ErrorLogger struct {
    logger *log.Logger
}

func NewErrorLogger(writer io.Writer) *ErrorLogger {
    return &ErrorLogger{
        logger: log.New(writer, "ERROR: ", log.LstdFlags|log.Lshortfile),
    }
}

func (el *ErrorLogger) LogError(err error, context string) {
    if err == nil {
        return
    }
    
    el.logger.Printf("контекст: %s, ошибка: %v", context, err)
    
    // Если ошибка обернутая, логируем цепочку ошибок
    var currentErr error = err
    for {
        unwrapped := errors.Unwrap(currentErr)
        if unwrapped == nil {
            break
        }
        el.logger.Printf("  -> %v", unwrapped)
        currentErr = unwrapped
    }
}

func (el *ErrorLogger) LogAndReturn(err error, context string) error {
    el.LogError(err, context)
    return err
}

// Использование
func processData(data []byte) error {
    var result int
    
    _, err := fmt.Sscanf(string(data), "%d", &result)
    if err != nil {
        logger := NewErrorLogger(os.Stderr)
        return logger.LogAndReturn(err, "processData parsing")
    }
    
    if result < 0 {
        logger := NewErrorLogger(os.Stderr)
        return logger.LogAndReturn(
            fmt.Errorf("результат не может быть отрицательным: %d", result), 
            "processData validation",
        )
    }
    
    return nil
}
```

## Лучшие практики

### 1. Ошибки должны быть информативными

```go
// Плохо
return errors.New("error")

// Хорошо
return fmt.Errorf("не удалось подключиться к базе данных: %w", err)
```

### 2. Не скрывайте ошибки

```go
// Плохо
func processFile(filename string) error {
    data, _ := os.ReadFile(filename) // ошибка игнорируется
    return parseData(data)
}

// Хорошо
func processFile(filename string) error {
    data, err := os.ReadFile(filename)
    if err != nil {
        return fmt.Errorf("ошибка чтения файла %s: %w", filename, err)
    }
    return parseData(data)
}
```

### 3. Используйте конкретные типы ошибок для важных случаев

```go
type NotFoundError struct {
    Resource string
    ID       interface{}
}

func (e NotFoundError) Error() string {
    return fmt.Sprintf("%s с ID %v не найден", e.Resource, e.ID)
}

type PermissionError struct {
    Resource string
    Action   string
    User     string
}

func (e PermissionError) Error() string {
    return fmt.Sprintf("пользователь %s не имеет прав на %s для ресурса %s", 
        e.User, e.Action, e.Resource)
}
```

### 4. Обрабатывайте ошибки на соответствующем уровне

```go
func parseConfig(data []byte) (Config, error) {
    var config Config
    if err := json.Unmarshal(data, &config); err != nil {
        return Config{}, fmt.Errorf("ошибка парсинга конфигурации: %w", err)
    }
    return config, nil
}

func loadConfig(filename string) (Config, error) {
    data, err := os.ReadFile(filename)
    if err != nil {
        return Config{}, fmt.Errorf("ошибка чтения файла конфигурации: %w", err)
    }
    
    config, err := parseConfig(data)
    if err != nil {
        return Config{}, fmt.Errorf("ошибка загрузки конфигурации из %s: %w", filename, err)
    }
    
    return config, nil
}

func main() {
    config, err := loadConfig("config.json")
    if err != nil {
        // На верхнем уровне принимаем решение о том, как обработать ошибку
        if errors.Is(err, os.ErrNotExist) {
            fmt.Println("Файл конфигурации не найден, используем настройки по умолчанию")
            config = getDefaultConfig()
        } else {
            log.Fatalf("Критическая ошибка загрузки конфигурации: %v", err)
        }
    }
    
    // Используем конфигурацию...
}
```

## Упражнения

1. Создайте тип `MathError` с различными видами математических ошибок (деление на ноль, корень из отрицательного числа)
2. Реализуйте систему валидации для структуры `Product` с проверкой названия, цены и наличия
3. Напишите функцию для парсинга CSV файлов с подробной обработкой различных ошибок
4. Создайте HTTP middleware для логирования ошибок с контекстом запроса
5. Реализуйте retry механизм с экспоненциальным backoff для операций, которые могут временно не удаваться

В следующем уроке мы изучим работу с файлами и вводом-выводом.