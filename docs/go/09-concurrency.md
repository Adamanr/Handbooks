---
sidebar_position: 9
---

# Конкурентность в Go: Горутины и Каналы

## Введение в конкурентность

Конкурентность - это способность обрабатывать несколько задач одновременно, переключаясь между ними. Go был разработан специально для эффективной работы с конкурентными задачами.

### Основные концепции

- **Горутина** - легковесный поток выполнения
- **Канал** - безопасный способ общения между горутинами
- **WaitGroup** - синхронизация выполнения группы горутин
- **Mutex** - взаимное исключение для защиты общих данных

## Горутины

Горутина - это функция, выполняющаяся независимо и одновременно с другими горутинами.

### Базовое использование

```go
package main

import (
    "fmt"
    "time"
)

func worker(name string, duration time.Duration) {
    fmt.Printf("Горутина %s началась\n", name)
    
    // Имитация работы
    time.Sleep(duration)
    
    fmt.Printf("Горутина %s завершилась (работала %v)\n", name, duration)
}

func main() {
    fmt.Println("=== Основы горутин ===")
    
    // Запуск горутины (добавляет & перед вызовом функции)
    go worker("A", 2*time.Second)
    go worker("B", 1*time.Second)
    go worker("C", 3*time.Second)
    
    // Главная горутина ждет завершения других
    fmt.Println("Главная функция продолжает работу...")
    time.Sleep(4 * time.Second) // Ждем завершения всех горутин
    fmt.Println("Главная функция завершена")
}
```

### Анонимные горутины

```go
package main

import (
    "fmt"
    "time"
)

func main() {
    fmt.Println("=== Анонимные горутины ===")
    
    // Анонимная горутина
    go func() {
        for i := 1; i <= 5; i++ {
            fmt.Printf("Анонимная горутина: %d\n", i)
            time.Sleep(500 * time.Millisecond)
        }
    }()
    
    // Горутина с параметрами
    message := "Привет из горутины!"
    go func(msg string) {
        for i := 0; i < 3; i++ {
            fmt.Printf("Сообщение: %s (итерация %d)\n", msg, i+1)
            time.Sleep(1 * time.Second)
        }
    }(message)
    
    time.Sleep(6 * time.Second)
    fmt.Println("Главная функция завершена")
}
```

### Практические примеры горутин

#### 1. Параллельная обработка данных

```go
package main

import (
    "fmt"
    "math/rand"
    "sync"
    "time"
)

type DataProcessor struct {
    data []int
    mu   sync.Mutex
}

func (dp *DataProcessor) ProcessItem(index int, wg *sync.WaitGroup) {
    defer wg.Done()
    
    // Имитация обработки
    processingTime := time.Duration(rand.Intn(1000)) * time.Millisecond
    time.Sleep(processingTime)
    
    dp.mu.Lock()
    result := dp.data[index] * 2
    dp.data[index] = result
    dp.mu.Unlock()
    
    fmt.Printf("Обработан элемент %d: %d -> %d (время: %v)\n", 
        index, result/2, result, processingTime)
}

func main() {
    fmt.Println("=== Параллельная обработка данных ===")
    
    // Инициализация данных
    data := make([]int, 10)
    for i := range data {
        data[i] = i + 1
    }
    
    fmt.Printf("Исходные данные: %v\n", data)
    
    processor := &DataProcessor{data: data}
    var wg sync.WaitGroup
    
    // Запускаем обработку каждого элемента в отдельной горутине
    for i := range data {
        wg.Add(1)
        go processor.ProcessItem(i, &wg)
    }
    
    // Ждем завершения всех горутин
    wg.Wait()
    
    fmt.Printf("Обработанные данные: %v\n", data)
}
```

#### 2. Веб-скрапинг с горутинами

```go
package main

import (
    "fmt"
    "net/http"
    "sync"
    "time"
)

type PageResult struct {
    URL   string
    Title string
    Size  int
    Error error
}

func fetchPage(url string) PageResult {
    client := http.Client{Timeout: 10 * time.Second}
    
    resp, err := client.Get(url)
    if err != nil {
        return PageResult{URL: url, Error: err}
    }
    defer resp.Body.Close()
    
    // Имитация извлечения заголовка (в реальности здесь был бы парсинг HTML)
    title := fmt.Sprintf("Страница %s", url)
    size := resp.ContentLength
    
    return PageResult{
        URL:   url,
        Title: title,
        Size:  int(size),
    }
}

func scrapeSites(urls []string) []PageResult {
    results := make([]PageResult, len(urls))
    var wg sync.WaitGroup
    var mu sync.Mutex
    completed := 0
    
    for i, url := range urls {
        wg.Add(1)
        go func(index int, siteURL string) {
            defer wg.Done()
            
            fmt.Printf("Начинаем загрузку: %s\n", siteURL)
            result := fetchPage(siteURL)
            
            mu.Lock()
            results[index] = result
            completed++
            fmt.Printf("Завершено %d/%d: %s\n", completed, len(urls), siteURL)
            mu.Unlock()
        }(i, url)
    }
    
    wg.Wait()
    return results
}

func main() {
    fmt.Println("=== Веб-скрапинг с горутинами ===")
    
    // Тестовые URL (в реальности здесь были бы реальные сайты)
    urls := []string{
        "https://example.com",
        "https://httpbin.org/delay/1",
        "https://httpbin.org/delay/2",
        "https://httpbin.org/status/200",
        "https://httpbin.org/json",
    }
    
    startTime := time.Now()
    results := scrapeSites(urls)
    elapsed := time.Since(startTime)
    
    fmt.Printf("\nРезультаты (время выполнения: %v):\n", elapsed)
    for _, result := range results {
        if result.Error != nil {
            fmt.Printf("❌ %s: Ошибка - %v\n", result.URL, result.Error)
        } else {
            fmt.Printf("✅ %s: %s (%d байт)\n", result.URL, result.Title, result.Size)
        }
    }
}
```

#### 3. Генерация отчетов

```go
package main

import (
    "encoding/json"
    "fmt"
    "sync"
    "time"
)

type ReportData struct {
    Section   string
    Data      map[string]interface{}
    Timestamp time.Time
}

type ReportGenerator struct {
    sections []string
    data     map[string]ReportData
    mu       sync.RWMutex
}

func NewReportGenerator(sections []string) *ReportGenerator {
    return &ReportGenerator{
        sections: sections,
        data:     make(map[string]ReportData),
    }
}

func (rg *ReportGenerator) GenerateSection(section string) {
    // Имитация генерации данных для секции
    time.Sleep(time.Duration(len(section)) * 200 * time.Millisecond)
    
    data := map[string]interface{}{
        "count":   len(section) * 10,
        "average": float64(len(section)) * 1.5,
        "status":  "completed",
    }
    
    rg.mu.Lock()
    rg.data[section] = ReportData{
        Section:   section,
        Data:      data,
        Timestamp: time.Now(),
    }
    rg.mu.Unlock()
    
    fmt.Printf("Секция '%s' сгенерирована\n", section)
}

func (rg *ReportGenerator) GenerateReport() {
    var wg sync.WaitGroup
    
    fmt.Println("Начинаем генерацию отчета...")
    startTime := time.Now()
    
    for _, section := range rg.sections {
        wg.Add(1)
        go func(s string) {
            defer wg.Done()
            rg.GenerateSection(s)
        }(section)
    }
    
    wg.Wait()
    
    elapsed := time.Since(startTime)
    fmt.Printf("Отчет сгенерирован за %v\n", elapsed)
}

func (rg *ReportGenerator) GetReport() map[string]ReportData {
    rg.mu.RLock()
    defer rg.mu.RUnlock()
    
    result := make(map[string]ReportData)
    for key, value := range rg.data {
        result[key] = value
    }
    return result
}

func main() {
    fmt.Println("=== Генерация отчетов с горутинами ===")
    
    sections := []string{
        "Sales",
        "Users", 
        "Analytics",
        "Performance",
        "Security",
        "Marketing",
    }
    
    generator := NewReportGenerator(sections)
    generator.GenerateReport()
    
    report := generator.GetReport()
    
    // Выводим отчет в формате JSON
    jsonData, _ := json.MarshalIndent(report, "", "  ")
    fmt.Printf("\nСгенерированный отчет:\n%s\n", string(jsonData))
}
```

## Каналы

Каналы обеспечивают безопасное общение между горутинами и синхронизацию.

### Базовое использование каналов

```go
package main

import (
    "fmt"
    "time"
)

func sender(ch chan int) {
    for i := 1; i <= 5; i++ {
        fmt.Printf("Отправляем: %d\n", i)
        ch <- i // Отправляем значение в канал
        time.Sleep(1 * time.Second)
    }
    close(ch) // Закрываем канал
}

func receiver(ch chan int) {
    for {
        value, ok := <-ch // Получаем значение из канала
        if !ok { // Канал закрыт
            fmt.Println("Канал закрыт, завершаем прием")
            break
        }
        fmt.Printf("Получено: %d\n", value)
    }
}

func main() {
    fmt.Println("=== Базовое использование каналов ===")
    
    // Создаем канал
    ch := make(chan int)
    
    // Запускаем горутины
    go sender(ch)
    go receiver(ch)
    
    // Ждем завершения
    time.Sleep(12 * time.Second)
    fmt.Println("Главная функция завершена")
}
```

### Типы каналов

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func main() {
    fmt.Println("=== Типы каналов ===")
    
    // Небуферизованный канал (синхронный)
    unbuffered := make(chan int)
    
    // Буферизованный канал (асинхронный)
    buffered := make(chan int, 3)
    
    // Только для чтения
    readOnly := make(<-chan int)
    
    // Только для записи  
    writeOnly := make(chan<- int)
    
    fmt.Printf("Небуферизованный канал: %T\n", unbuffered)
    fmt.Printf("Буферизованный канал: %T\n", buffered)
    fmt.Printf("Канал только для чтения: %T\n", readOnly)
    fmt.Printf("Канал только для записи: %T\n", writeOnly)
    
    // Демонстрация буферизованного канала
    go func() {
        for i := 1; i <= 5; i++ {
            fmt.Printf("Попытка отправить %d в буферизованный канал\n", i)
            buffered <- i
            fmt.Printf("Успешно отправлено %d в буферизованный канал\n", i)
        }
        close(buffered)
    }()
    
    // Получаем данные из буферизованного канала
    for value := range buffered {
        fmt.Printf("Получено из буферизованного канала: %d\n", value)
        time.Sleep(500 * time.Millisecond)
    }
}
```

### Паттерны работы с каналами

#### 1. Pipeline (Конвейер)

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

// Генератор чисел
func generateNumbers(n int) <-chan int {
    out := make(chan int)
    
    go func() {
        for i := 1; i <= n; i++ {
            out <- i
        }
        close(out)
    }()
    
    return out
}

// Возведение в квадрат
func squareNumbers(in <-chan int) <-chan int {
    out := make(chan int)
    
    go func() {
        for num := range in {
            out <- num * num
        }
        close(out)
    }()
    
    return out
}

// Фильтрация четных чисел
func filterEvenNumbers(in <-chan int) <-chan int {
    out := make(chan int)
    
    go func() {
        for num := range in {
            if num%2 == 0 {
                out <- num
            }
        }
        close(out)
    }()
    
    return out
}

func main() {
    fmt.Println("=== Pipeline (Конвейер) ===")
    
    // Создаем конвейер: генерация -> квадраты -> фильтрация
    pipeline := filterEvenNumbers(squareNumbers(generateNumbers(10)))
    
    fmt.Println("Результаты конвейера:")
    for result := range pipeline {
        fmt.Printf("%d ", result)
    }
    fmt.Println()
}
```

#### 2. Fan-out, Fan-in

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    
    for job := range jobs {
        fmt.Printf("Работник %d начал задачу %d\n", id, job)
        
        // Имитация обработки
        time.Sleep(time.Duration(job%3+1) * time.Second)
        
        result := job * job
        results <- result
        
        fmt.Printf("Работник %d завершил задачу %d с результатом %d\n", id, job, result)
    }
}

func fanOut(jobs <-chan int, numWorkers int) []<-chan int {
    workers := make([]<-chan int, numWorkers)
    var wg sync.WaitGroup
    
    for i := 0; i < numWorkers; i++ {
        workerJobs := make(chan int)
        workerResults := make(chan int)
        
        wg.Add(1)
        go func(workerID int) {
            defer wg.Done()
            worker(workerID, workerJobs, workerResults, &wg)
        }(i + 1)
        
        // Запускаем горутину для проксирования задач к воркеру
        go func() {
            for job := range jobs {
                workerJobs <- job
            }
            close(workerJobs)
        }()
        
        workers[i] = workerResults
    }
    
    return workers
}

func fanIn(workers []<-chan int) <-chan int {
    var wg sync.WaitGroup
    results := make(chan int)
    
    // Запускаем горутину для каждого воркера
    for _, worker := range workers {
        wg.Add(1)
        go func(workerResults <-chan int) {
            defer wg.Done()
            for result := range workerResults {
                results <- result
            }
        }(worker)
    }
    
    // Закрываем результаты после завершения всех воркеров
    go func() {
        wg.Wait()
        close(results)
    }()
    
    return results
}

func main() {
    fmt.Println("=== Fan-out, Fan-in ===")
    
    // Создаем канал задач
    jobs := make(chan int, 10)
    
    // Запускаем генератор задач
    go func() {
        for i := 1; i <= 10; i++ {
            jobs <- i
        }
        close(jobs)
    }()
    
    // Fan-out: распределяем задачи между воркерами
    workers := fanOut(jobs, 3)
    
    // Fan-in: собираем результаты
    results := fanIn(workers)
    
    // Выводим результаты
    fmt.Println("Результаты:")
    for result := range results {
        fmt.Printf("%d ", result)
    }
    fmt.Println()
}
```

#### 3. Timeout и Context

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func longRunningTask(ctx context.Context, duration time.Duration) (string, error) {
    select {
    case <-time.After(duration):
        return fmt.Sprintf("Задача выполнена за %v", duration), nil
    case <-ctx.Done():
        return "", fmt.Errorf("задача отменена: %v", ctx.Err())
    }
}

func main() {
    fmt.Println("=== Timeout и Context ===")
    
    // Создаем контекст с таймаутом
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()
    
    // Запускаем задачу с таймаутом 5 секунд
    result, err := longRunningTask(ctx, 5*time.Second)
    if err != nil {
        fmt.Printf("Ошибка: %v\n", err)
    } else {
        fmt.Printf("Успех: %s\n", result)
    }
    
    // Повторяем с меньшим таймаутом
    ctx2, cancel2 := context.WithTimeout(context.Background(), 3*time.Second)
    defer cancel2()
    
    result2, err2 := longRunningTask(ctx2, 5*time.Second)
    if err2 != nil {
        fmt.Printf("Ошибка: %v\n", err2)
    } else {
        fmt.Printf("Успех: %s\n", result2)
    }
}
```

### Синхронизация с WaitGroup

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func workerWithWaitGroup(id int, wg *sync.WaitGroup) {
    defer wg.Done()
    
    fmt.Printf("Работник %d начал\n", id)
    
    // Имитация работы
    time.Sleep(time.Duration(id) * time.Second)
    
    fmt.Printf("Работник %d завершил\n", id)
}

func main() {
    fmt.Println("=== WaitGroup ===")
    
    var wg sync.WaitGroup
    
    // Запускаем 5 работников
    for i := 1; i <= 5; i++ {
        wg.Add(1)
        go workerWithWaitGroup(i, &wg)
    }
    
    fmt.Println("Главная функция ждет завершения работников...")
    
    // Ждем завершения всех горутин
    wg.Wait()
    
    fmt.Println("Все работники завершились")
}
```

## Практические примеры конкурентности

### 1. Система мониторинга серверов

```go
package main

import (
    "fmt"
    "math/rand"
    "sync"
    "time"
)

type Server struct {
    ID       string
    URL      string
    Status   string
    Response time.Duration
}

type Monitor struct {
    servers []Server
    results map[string]Server
    mu      sync.RWMutex
}

func NewMonitor(servers []Server) *Monitor {
    return &Monitor{
        servers: servers,
        results: make(map[string]Server),
    }
}

func (m *Monitor) checkServer(server Server, interval time.Duration, wg *sync.WaitGroup) {
    defer wg.Done()
    
    ticker := time.NewTicker(interval)
    defer ticker.Stop()
    
    for {
        select {
        case <-ticker.C:
            // Имитация проверки сервера
            responseTime := time.Duration(rand.Intn(5000)) * time.Millisecond
            status := "healthy"
            
            if responseTime > 3*time.Second {
                status = "slow"
            }
            if responseTime > 5*time.Second {
                status = "unhealthy"
            }
            
            m.mu.Lock()
            m.results[server.ID] = Server{
                ID:       server.ID,
                URL:      server.URL,
                Status:   status,
                Response: responseTime,
            }
            m.mu.Unlock()
            
            fmt.Printf("[%s] Проверен сервер %s: %s (%.2fs)\n", 
                time.Now().Format("15:04:05"), 
                server.ID, 
                status, 
                responseTime.Seconds())
        }
    }
}

func (m *Monitor) StartMonitoring(interval time.Duration) {
    var wg sync.WaitGroup
    
    fmt.Println("Запуск мониторинга серверов...")
    
    for _, server := range m.servers {
        wg.Add(1)
        go m.checkServer(server, interval, &wg)
    }
    
    // Мониторинг будет работать в фоне
    wg.Wait()
}

func (m *Monitor) GetResults() map[string]Server {
    m.mu.RLock()
    defer m.mu.RUnlock()
    
    results := make(map[string]Server)
    for key, value := range m.results {
        results[key] = value
    }
    return results
}

func (m *Monitor) PrintStatus() {
    results := m.GetResults()
    
    fmt.Println("\n=== Текущий статус серверов ===")
    fmt.Printf("%-10s %-25s %-12s %-10s\n", "ID", "URL", "Status", "Response")
    fmt.Println(strings.Repeat("-", 60))
    
    for _, server := range m.servers {
        result, exists := results[server.ID]
        if !exists {
            fmt.Printf("%-10s %-25s %-12s %-10s\n", 
                server.ID, server.URL, "unknown", "-")
            continue
        }
        
        fmt.Printf("%-10s %-25s %-12s %-10s\n", 
            result.ID, result.URL, result.Status, result.Response.String())
    }
}

func main() {
    fmt.Println("=== Система мониторинга серверов ===")
    
    servers := []Server{
        {ID: "web-1", URL: "https://example.com"},
        {ID: "api-1", URL: "https://api.example.com"},
        {ID: "db-1", URL: "https://db.example.com"},
        {ID: "cdn-1", URL: "https://cdn.example.com"},
    }
    
    monitor := NewMonitor(servers)
    
    // Запускаем мониторинг в отдельной горутине
    go func() {
        monitor.StartMonitoring(2 * time.Second)
    }()
    
    // Периодически выводим статус
    for i := 1; i <= 3; i++ {
        time.Sleep(5 * time.Second)
        monitor.PrintStatus()
    }
    
    fmt.Println("Мониторинг завершен")
}
```

### 2. Параллельный парсер файлов

```go
package main

import (
    "bufio"
    "fmt"
    "os"
    "path/filepath"
    "regexp"
    "strings"
    "sync"
)

type FileStats struct {
    Path      string
    Lines     int
    Words     int
    Characters int
    GoFunctions int
    Comments  int
}

type FileParser struct {
    results map[string]FileStats
    mu      sync.Mutex
    wg      sync.WaitGroup
}

func NewFileParser() *FileParser {
    return &FileParser{
        results: make(map[string]FileStats),
    }
}

func (fp *FileParser) parseFile(path string) {
    defer fp.wg.Done()
    
    file, err := os.Open(path)
    if err != nil {
        fmt.Printf("Ошибка открытия файла %s: %v\n", path, err)
        return
    }
    defer file.Close()
    
    scanner := bufio.NewScanner(file)
    lines := 0
    words := 0
    characters := 0
    goFunctions := 0
    comments := 0
    
    // Регулярные выражения для поиска Go функций и комментариев
    funcRegex := regexp.MustCompile(`^\s*func\s+\w+\(`)
    commentRegex := regexp.MustCompile(`^\s*//`)
    
    for scanner.Scan() {
        line := scanner.Text()
        lines++
        characters += len(line)
        
        // Подсчет слов
        words += len(strings.Fields(line))
        
        // Поиск функций Go
        if funcRegex.MatchString(line) {
            goFunctions++
        }
        
        // Поиск комментариев
        if commentRegex.MatchString(line) {
            comments++
        }
    }
    
    if err := scanner.Err(); err != nil {
        fmt.Printf("Ошибка чтения файла %s: %v\n", path, err)
        return
    }
    
    stats := FileStats{
        Path:       path,
        Lines:      lines,
        Words:      words,
        Characters: characters,
        GoFunctions: goFunctions,
        Comments:   comments,
    }
    
    fp.mu.Lock()
    fp.results[path] = stats
    fp.mu.Unlock()
    
    fmt.Printf("Обработан файл: %s (%d строк, %d функций)\n", 
        filepath.Base(path), lines, goFunctions)
}

func (fp *FileParser) ParseDirectory(dirPath string) error {
    return filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
        if err != nil {
            return err
        }
        
        // Пропускаем директории
        if info.IsDir() {
            return nil
        }
        
        // Обрабатываем только Go файлы
        if filepath.Ext(path) == ".go" {
            fp.wg.Add(1)
            go fp.parseFile(path)
        }
        
        return nil
    })
}

func (fp *FileParser) Wait() {
    fp.wg.Wait()
}

func (fp *FileParser) PrintSummary() {
    fmt.Println("\n=== Сводка по файлам ===")
    fmt.Printf("%-30s %-8s %-8s %-12s %-10s %-10s\n", 
        "Файл", "Строки", "Слова", "Символы", "Функции", "Комментарии")
    fmt.Println(strings.Repeat("-", 80))
    
    totalLines := 0
    totalWords := 0
    totalChars := 0
    totalFuncs := 0
    totalComments := 0
    
    for _, stats := range fp.results {
        fmt.Printf("%-30s %-8d %-8d %-12d %-10d %-10d\n",
            filepath.Base(stats.Path),
            stats.Lines,
            stats.Words,
            stats.Characters,
            stats.GoFunctions,
            stats.Comments)
        
        totalLines += stats.Lines
        totalWords += stats.Words
        totalChars += stats.Characters
        totalFuncs += stats.GoFunctions
        totalComments += stats.Comments
    }
    
    fmt.Println(strings.Repeat("-", 80))
    fmt.Printf("%-30s %-8d %-8d %-12d %-10d %-10d\n",
        "ИТОГО",
        totalLines,
        totalWords,
        totalChars,
        totalFuncs,
        totalComments)
}

func main() {
    fmt.Println("=== Параллельный парсер Go файлов ===")
    
    parser := NewFileParser()
    
    // Парсим текущую директорию
    if err := parser.ParseDirectory("."); err != nil {
        fmt.Printf("Ошибка парсинга директории: %v\n", err)
        return
    }
    
    // Ждем завершения всех горутин
    parser.Wait()
    
    // Выводим сводку
    parser.PrintSummary()
}
```

## Лучшие практики конкурентности

### 1. Избегайте гонки данных

```go
package main

import (
    "fmt"
    "sync"
)

// ПЛОХО: Гонка данных
func badExample() {
    counter := 0
    var wg sync.WaitGroup
    
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter++ // ГОНКА ДАННЫХ!
        }()
    }
    
    wg.Wait()
    fmt.Printf("Плохой пример: counter = %d (ожидалось 1000)\n", counter)
}

// ХОРОШО: Использование мьютекса
func goodExampleWithMutex() {
    counter := 0
    var mu sync.Mutex
    var wg sync.WaitGroup
    
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            mu.Lock()
            counter++ // Безопасно
            mu.Unlock()
        }()
    }
    
    wg.Wait()
    fmt.Printf("Хороший пример (мьютекс): counter = %d\n", counter)
}

// ЛУЧШЕ: Использование канала
func bestExampleWithChannel() {
    counter := 0
    results := make(chan int, 1000)
    var wg sync.WaitGroup
    
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            results <- 1 // Отправляем в канал
        }()
    }
    
    wg.Wait()
    close(results)
    
    for range results {
        counter++
    }
    
    fmt.Printf("Лучший пример (канал): counter = %d\n", counter)
}

func main() {
    badExample()
    goodExampleWithMutex()
    bestExampleWithChannel()
}
```

### 2. Правильное закрытие каналов

```go
package main

import (
    "fmt"
    "sync"
)

// Правильное закрытие канала отправителем
func correctChannelClose() {
    jobs := make(chan int, 10)
    var wg sync.WaitGroup
    
    // Воркеры
    for i := 1; i <= 3; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            for job := range jobs {
                fmt.Printf("Воркер %d обрабатывает задачу %d\n", id, job)
            }
            fmt.Printf("Воркер %d завершен\n", id)
        }(i)
    }
    
    // Отправляем задачи
    for i := 1; i <= 5; i++ {
        jobs <- i
    }
    
    close(jobs) // Закрываем канал после отправки всех задач
    wg.Wait()
    
    fmt.Println("Все воркеры завершены")
}

// Неправильное закрытие канала получателем
func incorrectChannelClose() {
    jobs := make(chan int, 10)
    
    // Отправитель
    go func() {
        for i := 1; i <= 5; i++ {
            jobs <- i
        }
    }()
    
    // Получатель (НЕПРАВИЛЬНО!)
    go func() {
        for job := range jobs {
            fmt.Printf("Получена задача %d\n", job)
        }
        close(jobs) // Паника: попытка закрыть чужой канал!
    }()
    
    // Это вызовет панику!
    // time.Sleep(1 * time.Second)
}
```

### 3. Использование контекста для отмены

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func longRunningTaskWithContext(ctx context.Context, id int) {
    for {
        select {
        case <-ctx.Done():
            fmt.Printf("Задача %d отменена: %v\n", id, ctx.Err())
            return
        case <-time.After(1 * time.Second):
            fmt.Printf("Задача %d выполнена\n", id)
        }
    }
}

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    
    // Запускаем задачи
    for i := 1; i <= 3; i++ {
        go longRunningTaskWithContext(ctx, i)
    }
    
    // Даем задачам поработать
    time.Sleep(3 * time.Second)
    
    // Отменяем все задачи
    fmt.Println("Отменяем все задачи...")
    cancel()
    
    // Ждем завершения
    time.Sleep(1 * time.Second)
    fmt.Println("Все задачи отменены")
}
```

## Упражнения

1. Создайте систему обработки изображений с горутинами, которая изменяет размер множества изображений параллельно
2. Реализуйте пул воркеров (worker pool) для обработки задач из очереди
3. Напишите веб-скрапер, который параллельно загружает страницы с ограничением количества одновременных запросов
4. Создайте систему логирования, которая асинхронно записывает логи в файл с буферизацией
5. Реализуйте distributed lock с использованием каналов для синхронизации доступа к ресурсам

В следующем уроке мы изучим работу с пакетами и модулями Go.