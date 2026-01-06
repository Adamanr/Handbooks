---
sidebar_position: 16
title: HTTP-клиент
---

# HTTP-клиент в Go

Стандартная библиотека `net/http` предоставляет мощный HTTP-клиент.

## Базовый GET-запрос

```go
package main

import (
    "fmt"
    "net/http"
    "io"
)

func main() {
    resp, err := http.Get("https://jsonplaceholder.typicode.com/posts/1")
    if err != nil {
        fmt.Println("Ошибка:", err)
        return
    }
    defer resp.Body.Close()
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        fmt.Println("Ошибка чтения:", err)
        return
    }
    
    fmt.Println("Status:", resp.Status)
    fmt.Println("Body:", string(body))
}
```

## Кастомный клиент

```go
package main

import (
    "fmt"
    "net/http"
    "time"
)

func main() {
    client := &http.Client{
        Timeout: 10 * time.Second, // Тайм-аут на весь запрос
    }
    
    resp, err := client.Get("https://example.com")
    if err != nil {
        fmt.Println("Ошибка:", err)
        return
    }
    defer resp.Body.Close()
    
    fmt.Println("Status:", resp.Status)
}
```

## POST-запрос с JSON

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

type Post struct {
    Title  string `json:"title"`
    Body   string `json:"body"`
    UserID int    `json:"userId"`
}

func main() {
    post := Post{
        Title:  "My Post",
        Body:   "Content here",
        UserID: 1,
    }
    
    // Сериализуем в JSON
    jsonData, err := json.Marshal(post)
    if err != nil {
        fmt.Println("Ошибка маршалинга:", err)
        return
    }
    
    // Создаём запрос
    resp, err := http.Post(
        "https://jsonplaceholder.typicode.com/posts",
        "application/json",
        bytes.NewBuffer(jsonData),
    )
    if err != nil {
        fmt.Println("Ошибка запроса:", err)
        return
    }
    defer resp.Body.Close()
    
    fmt.Println("Status:", resp.Status)
}
```

## Кастомные заголовки

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    client := &http.Client{}
    
    // Создаём запрос с заголовками
    req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
    if err != nil {
        fmt.Println("Ошибка:", err)
        return
    }
    
    // Добавляем заголовки
    req.Header.Set("Accept", "application/vnd.github.v3+json")
    req.Header.Set("Authorization", "token YOUR_TOKEN")
    req.Header.Set("User-Agent", "MyGoApp/1.0")
    
    // Выполняем
    resp, err := client.Do(req)
    if err != nil {
        fmt.Println("Ошибка:", err)
        return
    }
    defer resp.Body.Close()
    
    fmt.Println("Status:", resp.Status)
    fmt.Println("Content-Type:", resp.Header.Get("Content-Type"))
}
```

## Обработка ошибок и повторные попытки

```go
package main

import (
    "fmt"
    "log"
    "net/http"
    "time"
)

func main() {
    url := "https://example.com"
    
    // Повторяем до 3 раз с экспоненциальной задержкой
    for attempt := 1; attempt <= 3; attempt++ {
        resp, err := http.Get(url)
        
        if err != nil {
            log.Printf("Попытка %d: ошибка %v", attempt, err)
            
            if attempt < 3 {
                delay := time.Duration(attempt*attempt) * time.Second
                log.Printf("Ждём %v перед повторной попыткой", delay)
                time.Sleep(delay)
                continue
            }
            
            log.Fatal("Все попытки исчерпаны")
            return
        }
        
        resp.Body.Close()
        
        if resp.StatusCode >= 500 {
            log.Printf("Попытка %d: сервер вернул %d", attempt, resp.StatusCode)
            
            if attempt < 3 {
                delay := time.Duration(attempt*attempt) * time.Second
                log.Printf("Ждём %v перед повторной попыткой", delay)
                time.Sleep(delay)
                continue
            }
        }
        
        // Успех
        log.Printf("Успешно на попытке %d", attempt)
        break
    }
}
```

## Типизированный клиент

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

type APIResponse[T any] struct {
    Data   T
    Status int
    Error  string
}

type Post struct {
    ID     int    `json:"id"`
    Title  string `json:"title"`
    Body   string `json:"body"`
    UserID int    `json:"userId"`
}

type APIClient struct {
    baseURL string
    client  *http.Client
}

func NewAPIClient(baseURL string) *APIClient {
    return &APIClient{
        baseURL: baseURL,
        client: &http.Client{
            Timeout: 10 * time.Second,
        },
    }
}

func (c *APIClient) GetPost(id int) (*Post, error) {
    url := fmt.Sprintf("%s/posts/%d", c.baseURL, id)
    
    resp, err := c.client.Get(url)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("status: %d", resp.StatusCode)
    }
    
    var post Post
    if err := json.NewDecoder(resp.Body).Decode(&post); err != nil {
        return nil, err
    }
    
    return &post, nil
}

func (c *APIClient) CreatePost(post Post) (*Post, error) {
    url := fmt.Sprintf("%s/posts", c.baseURL)
    
    data, err := json.Marshal(post)
    if err != nil {
        return nil, err
    }
    
    resp, err := c.client.Post(
        url,
        "application/json",
        bytes.NewBuffer(data),
    )
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var created Post
    if err := json.NewDecoder(resp.Body).Decode(&created); err != nil {
        return nil, err
    }
    
    return &created, nil
}

func main() {
    client := NewAPIClient("https://jsonplaceholder.typicode.com")
    
    post, err := client.GetPost(1)
    if err != nil {
        fmt.Println("Ошибка:", err)
        return
    }
    
    fmt.Printf("Получен пост: %+v\n", post)
}
```

## Работа с Cookies

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    client := &http.Client{}
    
    // Сначала логинимся
    req, _ := http.NewRequest("POST", "https://example.com/login", nil)
    resp, err := client.Do(req)
    if err != nil {
        fmt.Println("Ошибка:", err)
        return
    }
    
    // Cookies автоматически сохраняются в Jar
    fmt.Println("Cookies установлены:", resp.Cookies())
    
    // Следующий запрос использует те же cookies
    req2, _ := http.NewRequest("GET", "https://example.com/profile", nil)
    resp2, _ := client.Do(req2)
    
    fmt.Println("Status:", resp2.Status)
}
```

## Настройка Transport

```go
package main

import (
    "crypto/tls"
    "fmt"
    "net/http"
    "time"
)

func main() {
    transport := &http.Transport{
        // Настройки соединения
        MaxIdleConns:        100,
        MaxIdleConnsPerHost: 10,
        IdleConnTimeout:     90 * time.Second,
        
        // TLS настройки
        TLSClientConfig: &tls.Config{
            InsecureSkipVerify: false, // ⚠️ Только для разработки!
        },
        
        // Прокси
        Proxy: http.ProxyFromEnvironment,
    }
    
    client := &http.Client{
        Transport: transport,
        Timeout:   30 * time.Second,
    }
    
    resp, err := client.Get("https://example.com")
    if err != nil {
        fmt.Println("Ошибка:", err)
        return
    }
    defer resp.Body.Close()
    
    fmt.Println("Status:", resp.Status)
}
```

## Конкурентные запросы

```go
package main

import (
    "fmt"
    "net/http"
    "sync"
)

type Post struct {
    ID int
}

func fetchPost(id int, ch chan<- Post) {
    resp, err := http.Get(fmt.Sprintf("https://jsonplaceholder.typicode.com/posts/%d", id))
    if err != nil {
        ch <- Post{ID: -1}
        return
    }
    defer resp.Body.Close()
    
    // Просто возвращаем ID для примера
    ch <- Post{ID: id}
}

func main() {
    posts := make(chan Post, 10)
    var wg sync.WaitGroup
    
    // Запрашиваем 10 постов параллельно
    for i := 1; i <= 10; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            fetchPost(id, posts)
        }(i)
    }
    
    // Закрываем канал после завершения всех горутин
    go func() {
        wg.Wait()
        close(posts)
    }()
    
    // Читаем результаты
    for post := range posts {
        fmt.Printf("Post ID: %d\n", post.ID)
    }
}
```

## Итоги

| Компонент | Назначение |
|-----------|------------|
| `http.Get()` | Простой GET-запрос |
| `http.Client` | Кастомный клиент с тайм-аутом |
| `http.NewRequest()` | Кастомный запрос с заголовками |
| `http.Transport` | Настройки соединения |
| `http.CookieJar` | Управление cookies |
| `http.RoundTripper` | Интерфейс для перехвата запросов |
