---
sidebar_position: 6
---

# Планировщик (Scheduler) 

## Введение

Представьте, что вы управляете рестораном с несколькими поварами (процессорные ядра), у вас есть куча заказов (goroutines), и нужен кто-то, кто будет распределять эти заказы между поварами так, чтобы все работали эффективно и никто не простаивал. Этот "кто-то" — и есть планировщик (scheduler).

В Go планировщик — это часть runtime, которая управляет выполнением тысяч и миллионов goroutine на реальных потоках операционной системы. Это одна из ключевых причин, почему Go такой быстрый и эффективный для параллельных задач.

## Почему планировщик Go особенный?

### Традиционный подход (1:1 threading)

В большинстве языков (Java, C++, Python) каждый поток — это поток операционной системы (OS thread):

```
User Thread 1:1 OS Thread
┌─────────┐     ┌─────────┐
│ Thread 1│────→│OS Thread│
└─────────┘     └─────────┘
┌─────────┐     ┌─────────┐
│ Thread 2│────→│OS Thread│
└─────────┘     └─────────┘
```

**Проблемы:**
- OS потоки тяжелые (несколько МБ памяти на поток)
- Переключение контекста медленное (микросекунды)
- Создание потока дорого
- Нельзя создать миллионы потоков

### Подход Go (M:N threading)

Go использует модель M:N — много goroutines на небольшом количестве OS потоков:

```
Goroutines (M)        OS Threads (N)
┌──────┐┌──────┐
│ G1   ││ G2   │     ┌──────────┐
└──────┘└──────┘────→│OS Thread1│
┌──────┐┌──────┐     └──────────┘
│ G3   ││ G4   │     ┌──────────┐
└──────┘└──────┘────→│OS Thread2│
┌──────┐┌──────┐     └──────────┘
│ G5   ││ G6   │
└──────┘└──────┘
```

**Преимущества:**
- Goroutine легкие (начинают с 2 КБ стека)
- Можно создать миллионы goroutines
- Быстрое переключение (наносекунды)
- Эффективное использование CPU

## Модель GMP

Планировщик Go основан на модели **GMP**:

### G (Goroutine)

**G** — это сама goroutine, задача, которую нужно выполнить.

```go
go func() {
    // Это код G (goroutine)
    fmt.Println("Hello from goroutine!")
}()
```

Каждая goroutine содержит:
- Стек (начинается с 2 КБ, растет по мере необходимости до 1 ГБ)
- Указатель инструкций (program counter)
- Информацию о состоянии

### M (Machine/OS Thread)

**M** — это рабочий поток операционной системы, который выполняет goroutines.

- По умолчанию Go создает столько M, сколько у вас CPU ядер
- M получает G из очереди и выполняет их
- Когда M блокируется (I/O, syscall), Go может создать новый M

### P (Processor)

**P** — это логический процессор, контекст планирования.

- Количество P = `GOMAXPROCS` (по умолчанию = количество CPU ядер)
- P содержит локальную очередь goroutines
- M должен быть привязан к P, чтобы выполнять G

### Как это работает вместе

```
┌─────────────────────────────────────────┐
│            Global Run Queue             │  ← Глобальная очередь G
│         [G] [G] [G] [G] [G]             │
└─────────────────────────────────────────┘
              ↓ (если локальная пуста)
              
┌──────────┐  ┌──────────┐  ┌──────────┐
│    P1    │  │    P2    │  │    P3    │  ← Processors
│ [G][G][G]│  │ [G][G][G]│  │ [G][G][G]│  ← Локальные очереди
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     ↓             ↓             ↓
┌────────┐    ┌────────┐    ┌────────┐
│   M1   │    │   M2   │    │   M3   │   ← OS Threads
└────────┘    └────────┘    └────────┘
```

**Процесс выполнения:**

1. Создается новая goroutine (G)
2. G помещается в локальную очередь P
3. M привязывается к P и берет G из локальной очереди
4. M выполняет код G
5. Когда G завершается или блокируется, M берет следующую G

## Алгоритмы планирования

### Work Stealing (Кража работы)

Когда локальная очередь P пуста, он может "украсть" работу у другого P:

```
P1: [G1][G2][G3][G4][G5]  ← Много работы
P2: []                     ← Пусто

P2 крадет половину у P1:

P1: [G1][G2][G3]
P2: [G4][G5]
```

Это обеспечивает равномерную нагрузку на все процессоры.

### Hand-off (Передача)

Когда M блокируется (например, на системном вызове), P передается другому M:

```
До:
P1 ─ M1 (выполняет G1)
     ↓
   syscall (блокировка)

После:
P1 ─ M2 (продолжает работу с другими G)
     
M1 (заблокирован, ждет завершения syscall с G1)
```

Это гарантирует, что блокировка одной goroutine не остановит выполнение других.

### Preemption (Вытеснение)

Go использует **кооперативное вытеснение** с элементами **принудительного вытеснения** (с Go 1.14):

**Кооперативное вытеснение:**
- Goroutine передает управление в "безопасных точках" (function calls, channel operations)
- Проблема: бесконечный цикл без вызовов функций блокирует P

```go
// До Go 1.14 это блокировало бы P навсегда
for {
    // Бесконечный цикл без вызовов функций
}
```

**Асинхронное вытеснение (Go 1.14+):**
- Планировщик может прервать goroutine принудительно
- Использует сигналы для остановки выполнения
- Решает проблему бесконечных циклов

```go
// С Go 1.14+ это не блокирует систему
// Через ~10ms планировщик прервет goroutine
for {
    // Даже без вызовов функций
}
```

## GOMAXPROCS

`GOMAXPROCS` определяет количество P (логических процессоров):

```go
import "runtime"

func main() {
    // Узнать текущее значение
    fmt.Println(runtime.GOMAXPROCS(0))
    
    // Установить в 4
    runtime.GOMAXPROCS(4)
    
    // Обычно значение по умолчанию (количество CPU) оптимально
}
```

Или через переменную окружения:

```bash
GOMAXPROCS=4 ./myapp
```

**Когда менять GOMAXPROCS:**
- ✅ **Увеличить:** если у вас CPU-intensive задачи и много ядер
- ❌ **Уменьшить:** редко нужно, но может помочь в контейнерах с ограничениями
- ⚠️ **Обычно:** оставьте значение по умолчанию

## Практические примеры

### Параллельное выполнение задач

```go
func processItems(items []int) []int {
    results := make([]int, len(items))
    var wg sync.WaitGroup
    
    // Создаем по goroutine на каждый элемент
    for i, item := range items {
        wg.Add(1)
        go func(index, value int) {
            defer wg.Done()
            // Планировщик автоматически распределит
            // эти goroutines по доступным P
            results[index] = heavyComputation(value)
        }(i, item)
    }
    
    wg.Wait()
    return results
}
```

### CPU-bound vs I/O-bound

**CPU-bound задачи:**

```go
func cpuIntensive() {
    // Тяжелые вычисления
    for i := 0; i < 1000000; i++ {
        _ = math.Sqrt(float64(i))
    }
}

func main() {
    // Для CPU-bound задач оптимально создавать
    // goroutines примерно равные количеству ядер
    numCPU := runtime.NumCPU()
    
    for i := 0; i < numCPU; i++ {
        go cpuIntensive()
    }
}
```

**I/O-bound задачи:**

```go
func ioIntensive(url string) {
    // I/O операция (сеть, диск)
    resp, err := http.Get(url)
    if err != nil {
        return
    }
    defer resp.Body.Close()
    // Обработка...
}

func main() {
    // Для I/O-bound задач можно создать много goroutines
    // Планировщик эффективно переключится на другие
    // goroutines во время ожидания I/O
    urls := getURLs() // Допустим, 10000 URL
    
    for _, url := range urls {
        go ioIntensive(url)
    }
}
```

## Состояния Goroutine

Goroutine может находиться в одном из нескольких состояний:

```
┌─────────┐
│ Runnable│ ← Готова к выполнению (в очереди)
└────┬────┘
     │
     ↓
┌─────────┐
│ Running │ ← Выполняется на M
└────┬────┘
     │
     ├→ ┌─────────┐
     │  │ Waiting │ ← Ждет (channel, lock, syscall)
     │  └────┬────┘
     │       │
     │       ↓
     │  (событие произошло)
     │       │
     ←───────┘
     │
     ↓
┌─────────┐
│  Dead   │ ← Завершена
└─────────┘
```

### Переходы между состояниями

```go
func example() {
    // Создана → Runnable
    go func() {
        // Runnable → Running (когда M начинает выполнять)
        
        time.Sleep(1 * time.Second)
        // Running → Waiting (блокируется на sleep)
        // ... через 1 секунду ...
        // Waiting → Runnable
        
        ch := make(chan int)
        <-ch
        // Running → Waiting (ждет данных из канала)
        // (когда данные поступят)
        // Waiting → Runnable → Running
        
        // Running → Dead (функция завершилась)
    }()
}
```

## Мониторинг планировщика

### runtime/trace

Визуализация работы планировщика:

```go
import (
    "os"
    "runtime/trace"
)

func main() {
    f, _ := os.Create("trace.out")
    defer f.Close()
    
    trace.Start(f)
    defer trace.Stop()
    
    // Ваш код
    for i := 0; i < 10; i++ {
        go func(n int) {
            sum := 0
            for j := 0; j < 1000000; j++ {
                sum += j
            }
        }(i)
    }
    
    time.Sleep(1 * time.Second)
}
```

Просмотр:

```bash
go tool trace trace.out
```

### GODEBUG=schedtrace

Периодический вывод статистики:

```bash
GODEBUG=schedtrace=1000 ./myapp
```

Вывод:

```
SCHED 0ms: gomaxprocs=8 idleprocs=6 threads=4 spinningthreads=0 idlethreads=0 runqueue=0 [0 0 0 0 0 0 0 0]
```

Расшифровка:
- `gomaxprocs=8` — количество P
- `idleprocs=6` — простаивающих P
- `threads=4` — количество M (OS threads)
- `runqueue=0` — глобальная очередь
- `[0 0 0 0 0 0 0 0]` — локальные очереди каждого P

### runtime.NumGoroutine()

Количество активных goroutines:

```go
import "runtime"

func main() {
    for i := 0; i < 100; i++ {
        go func() {
            time.Sleep(10 * time.Second)
        }()
    }
    
    fmt.Println("Active goroutines:", runtime.NumGoroutine())
    // Вывод: Active goroutines: 101 (100 + main)
}
```

## Типичные проблемы и решения

### Проблема 1: Goroutine Leak (утечка goroutines)

**Симптом:** количество goroutines постоянно растет

```go
// ПЛОХО: goroutine застрянет навсегда
func leak() {
    ch := make(chan int)
    go func() {
        val := <-ch // Никто никогда не отправит в канал
        fmt.Println(val)
    }()
    // Функция завершилась, но goroutine осталась
}
```

**Решение:** всегда обеспечивайте выход из goroutine

```go
// ХОРОШО: используем context для отмены
func noLeak(ctx context.Context) {
    ch := make(chan int)
    go func() {
        select {
        case val := <-ch:
            fmt.Println(val)
        case <-ctx.Done():
            // Выходим при отмене context
            return
        }
    }()
}
```

### Проблема 2: Слишком много goroutines

**Симптом:** программа медленная, высокое потребление памяти

```go
// ПЛОХО: создаем миллион goroutines сразу
for i := 0; i < 1000000; i++ {
    go processItem(i)
}
```

**Решение:** используйте worker pool

```go
// ХОРОШО: ограниченный пул воркеров
func processWithPool(items []Item) {
    numWorkers := runtime.NumCPU()
    jobs := make(chan Item, len(items))
    
    // Запускаем workers
    var wg sync.WaitGroup
    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go worker(jobs, &wg)
    }
    
    // Отправляем задачи
    for _, item := range items {
        jobs <- item
    }
    close(jobs)
    
    wg.Wait()
}
```

### Проблема 3: CPU-bound задача блокирует другие goroutines

**Симптом:** одна тяжелая задача замедляет всю программу

```go
// ПЛОХО: бесконечный цикл без yield
go func() {
    for {
        // Тяжелая работа без передачи управления
        heavyComputation()
    }
}()
```

**Решение:** периодически давайте планировщику возможность переключиться

```go
// ХОРОШО: явно отдаем управление
go func() {
    for {
        heavyComputation()
        runtime.Gosched() // Отдаем управление планировщику
    }
}()
```

## Оптимизация производительности

### 1. Подбор размера worker pool

```go
// Для CPU-bound задач
numWorkers := runtime.NumCPU()

// Для I/O-bound задач (можно больше)
numWorkers := runtime.NumCPU() * 2

// Для задач с высокой задержкой (сеть)
numWorkers := 100 // или больше
```

### 2. Batch processing

Обрабатывайте элементы пакетами вместо создания goroutine на каждый:

```go
func processBatches(items []Item, batchSize int) {
    numWorkers := runtime.NumCPU()
    batches := make(chan []Item, numWorkers)
    
    // Workers обрабатывают пакеты
    var wg sync.WaitGroup
    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for batch := range batches {
                for _, item := range batch {
                    process(item)
                }
            }
        }()
    }
    
    // Разбиваем на пакеты
    for i := 0; i < len(items); i += batchSize {
        end := i + batchSize
        if end > len(items) {
            end = len(items)
        }
        batches <- items[i:end]
    }
    close(batches)
    
    wg.Wait()
}
```

### 3. Избегайте блокировок в горячих путях

```go
// ПЛОХО: mutex в горячем цикле
var mu sync.Mutex
var counter int

for i := 0; i < 1000000; i++ {
    go func() {
        mu.Lock()
        counter++
        mu.Unlock()
    }()
}

// ХОРОШО: используйте atomic операции
var counter int64

for i := 0; i < 1000000; i++ {
    go func() {
        atomic.AddInt64(&counter, 1)
    }()
}
```

## Заключение

Планировщик Go — это сложная, но элегантная система, которая делает конкурентность в Go такой простой и эффективной:

- **Модель GMP** — Goroutines, Machines, Processors
- **Work Stealing** — автоматическая балансировка нагрузки
- **Preemption** — предотвращение блокировки системы
- **GOMAXPROCS** — контроль параллелизма

**Ключевые принципы:**

1. Создавайте goroutines свободно — они дешевые
2. Но контролируйте их количество для CPU-bound задач
3. Используйте worker pools для ограничения конкурентности
4. Мониторьте и профилируйте вашу программу
5. Доверяйте планировщику — он очень умный

В 99% случаев планировщик работает оптимально без вашего вмешательства. Понимание его работы нужно для отладки проблем производительности и написания высокоэффективного кода.