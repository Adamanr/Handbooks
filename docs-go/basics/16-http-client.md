---
sidebar_position: 16
title: HTTP-клиент
---

# Введение

Пакет `net/http` не только умеет принимать запросы (сервер), но и отлично работает как **клиент** — отправляет запросы на другие сайты и API. Это нужно почти в каждом реальном проекте: получать данные с внешних сервисов, проверять погоду, работать с платежами, авторизоваться в OAuth и т.д.

## Самый простой GET-запрос

```go
package main

import (
    "fmt"
    "io"
    "net/http"
)

func main() {
    // Делаем GET-запрос
    resp, err := http.Get("https://jsonplaceholder.typicode.com/posts/1")
    if err != nil {
        fmt.Println("Ошибка запроса:", err)
        return
    }
    // Важно! Всегда закрываем тело
    defer resp.Body.Close()

    // Читаем ответ
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        fmt.Println("Ошибка чтения ответа:", err)
        return
    }

    fmt.Println("Статус:", resp.Status)           // 200 OK
    fmt.Println("Тип контента:", resp.Header.Get("Content-Type"))
    fmt.Println("Ответ:", string(body))
}
```

**Что тут важно помнить:**
- `defer resp.Body.Close()` — **обязательно**, иначе будут утечки соединений.
- Проверяй ошибки после каждого шага.
- `resp.StatusCode` — код ответа (200, 404, 500 и т.д.).

## Кастомный клиент с таймаутом

По умолчанию `http.Get` использует клиент без таймаута — запрос может висеть вечно. Лучше создать свой клиент:

```go
client := &http.Client{
    Timeout: 10 * time.Second, // весь запрос (соединение + чтение) не дольше 10 сек
}

resp, err := client.Get("https://example.com")
```

**Почему это лучше?**
- Защита от "зависших" серверов.
- Предсказуемое поведение.

## POST-запрос с JSON

```go
type Post struct {
    Title  string `json:"title"`
    Body   string `json:"body"`
    UserID int    `json:"userId"`
}

post := Post{
    Title:  "Мой первый пост",
    Body:   "Привет из Go!",
    UserID: 1,
}

jsonData, _ := json.Marshal(post)

resp, err := http.Post(
    "https://jsonplaceholder.typicode.com/posts",
    "application/json",
    bytes.NewBuffer(jsonData),
)
```

Или универсально через `NewRequest`:

```go
req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
req.Header.Set("Content-Type", "application/json")
// + любые заголовки

resp, err := client.Do(req)
```

## Заголовки, авторизация и User-Agent

```go
req, _ := http.NewRequest("GET", "https://api.github.com/user", nil)

// Обязательные и полезные заголовки
req.Header.Set("Accept", "application/vnd.github.v3+json")
req.Header.Set("Authorization", "token ghp_твой_токен")
req.Header.Set("User-Agent", "MyGoApp/1.0") // GitHub требует User-Agent!

resp, _ := client.Do(req)
```

**Совет:** Многие API (GitHub, Telegram) требуют `User-Agent` — иначе 403 Forbidden.

## Повторные попытки (retry) при ошибках

Сети ненадёжны — запросы иногда падают. Делай retry:

```go
func doRequestWithRetry(url string, maxRetries int) (*http.Response, error) {
    for i := 0; i <= maxRetries; i++ {
        resp, err := http.Get(url)
        if err == nil && resp.StatusCode < 500 {
            return resp, nil // успех
        }

        if resp != nil {
            resp.Body.Close()
        }

        if i < maxRetries {
            wait := time.Duration(1<<i) * time.Second // 1s, 2s, 4s...
            fmt.Printf("Попытка %d не удалась, ждём %v...\n", i+1, wait)
            time.Sleep(wait)
        }
    }
    return nil, fmt.Errorf("все попытки исчерпаны")
}
```

## Типизированный клиент — как в реальных проектах

Создай структуру-клиент — код будет чистым и переиспользуемым:

```go
type APIClient struct {
    BaseURL string
    Client  *http.Client
    Token   string
}

func NewAPIClient(baseURL, token string) *APIClient {
    return &APIClient{
        BaseURL: baseURL,
        Client: &http.Client{Timeout: 15 * time.Second},
        Token:   token,
    }
}

func (c *APIClient) GetPost(id int) (*Post, error) {
    url := fmt.Sprintf("%s/posts/%d", c.BaseURL, id)
    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("Authorization", "Bearer "+c.Token)

    resp, err := c.Client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("ошибка: %d", resp.StatusCode)
    }

    var post Post
    json.NewDecoder(resp.Body).Decode(&post)
    return &post, nil
}

// Использование
client := NewAPIClient("https://jsonplaceholder.typicode.com", "")
post, err := client.GetPost(1)
```

## Параллельные запросы

Когда нужно много данных — запускай запросы параллельно:

```go
func fetchPostsParallel(ids []int) {
    var wg sync.WaitGroup
    results := make(chan Post, len(ids))

    for _, id := range ids {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            post, _ := fetchPost(id) // твоя функция GET
            if post != nil {
                results <- *post
            }
        }(id)
    }

    wg.Wait()
    close(results)

    for post := range results {
        fmt.Printf("Пост %d: %s\n", post.ID, post.Title)
    }
}
```

## Полезные настройки Transport

Для продакшена настрой `Transport`:

```go
transport := &http.Transport{
    MaxIdleConns:        100,              // общее количество idle-соединений
    MaxIdleConnsPerHost: 10,               // на один хост
    IdleConnTimeout:     90 * time.Second,
    TLSHandshakeTimeout: 10 * time.Second,
}

client := &http.Client{
    Transport: transport,
    Timeout:   30 * time.Second,
}
```

Это ускоряет повторные запросы к одному хосту (keep-alive).

## Лучшие практики (чек-лист)

1. **Всегда** `defer resp.Body.Close()`.
2. **Всегда** проверяй ошибки и статус-код.
3. Создавай **свой клиент** с таймаутом.
4. Добавляй **User-Agent** и нужные заголовки.
5. Делай **retry** для временных ошибок.
6. Используй **структуру-клиент** для API.
7. Для параллельных запросов — горутины + WaitGroup/errgroup.
