---
sidebar_position: 12
title: Оптимизация Go
---

# Оптимизация производительности Go

## Принципы оптимизации

1. **Сначала измеряйте** — не оптимизируйте без данных
2. **Алгоритм важнее деталей** — O(n) лучше O(n²)
3. **Знайте узкие места** — CPU, память, I/O

## Бенчмарки

```go
package main

import (
    "testing"
)

// Бенчмарк для функции
func BenchmarkSomething(b *testing.B) {
    for i := 0; i < b.N; i++ {
        something()
    }
}

// Бенчмарк с параметрами
func BenchmarkWithSize(b *testing.B) {
    sizes := []int{100, 1000, 10000}
    for _, size := range sizes {
        b.Run(fmt.Sprintf("size=%d", size), func(b *testing.B) {
            b.ReportAllocs()
            for i := 0; i < b.N; i++ {
                process(size)
            }
        })
    }
}

func something() {
    // Функция для тестирования
}

func process(n int) int {
    sum := 0
    for i := 0; i < n; i++ {
        sum += i
    }
    return sum
}
```

## CPU-оптимизации

### 1. Избегайте лишних аллокаций

```go
package main

import (
    "strings"
    "testing"
)

// ❌ Много аллокаций
func badConcat(parts []string) string {
    result := ""
    for _, p := range parts {
        result += p + ","
    }
    return result
}

// ✅ strings.Builder
func goodConcat(parts []string) string {
    var builder strings.Builder
    for i, p := range parts {
        builder.WriteString(p)
        if i < len(parts)-1 {
            builder.WriteString(",")
        }
    }
    return builder.String()
}

// ✅ Preallocate
func betterConcat(parts []string) string {
    if len(parts) == 0 {
        return ""
    }
    
    // Оцениваем размер
    total := len(parts) - 1 // запятые
    for _, p := range parts {
        total += len(p)
    }
    
    builder := strings.Builder{}
    builder.Grow(total)
    
    for i, p := range parts {
        builder.WriteString(p)
        if i < len(parts)-1 {
            builder.WriteString(",")
        }
    }
    return builder.String()
}
```

### 2. Используйте пулы объектов

```go
package main

import (
    "sync"
)

// sync.Pool для повторного использования объектов
var (
    bufferPool = sync.Pool{
        New: func() interface{} {
            return make([]byte, 0, 1024)
        },
    }
)

func processData() []byte {
    buf := bufferPool.Get().([]byte)
    defer bufferPool.Put(buf)
    
    // Используем буфер
    buf = append(buf, "data"... )
    
    // Важно: очищаем перед возвратом в пул!
    return buf[:0]
}
```

### 3. Избегайте reflect в hot path

```go
package main

import (
    "reflect"
    "unsafe"
)

// ❌ reflect медленный
func badCopy(dst, src interface{}) {
    d := reflect.ValueOf(dst).Elem()
    s := reflect.ValueOf(src).Elem()
    
    for i := 0; i < d.NumField(); i++ {
        d.Field(i).Set(s.Field(i))
    }
}

// ✅ unsafe для известных типов
type User struct {
    Name string
    Age  int
}

func goodCopy(dst, src *User) {
    *dst = *src // Простое копирование
}

// ✅ interface{} для известных типов
func copyUser(dst, src interface{}) {
    d, _ := dst.(*User)
    s, _ := src.(*User)
    if d != nil && s != nil {
        *d = *s
    }
}
```

### 4. Массивы вместо слайсов где возможно

```go
package main

// ✅ [N]T предпочтительнее []T для малых фиксированных размеров
type Point struct{ X, Y int }

func withArray() {
    arr := [4]Point{
        {0, 0}, {1, 1}, {2, 2}, {3, 3},
    }
    _ = arr
}

func withSlice() {
    slice := []Point{
        {0, 0}, {1, 1}, {2, 2}, {3, 3},
    }
    _ = slice
}
```

## Memory-оптимизации

### 1. Выравнивание структур

```go
package main

// ❌ Неоптимизированная структура (32 bytes)
type BadUser struct {
    Name   string // 16 bytes
    Age    int    // 8 bytes
    Active bool   // 1 byte + padding
}

// ✅ Оптимизированная структура (24 bytes)
type GoodUser struct {
    Age    int    // 8 bytes
    Active bool   // 1 byte + 7 padding
    Name   string // 16 bytes
}

// ❌ Плохой порядок полей
type BadConfig struct {
    Timeout int
    Debug   bool
    Host    string
    Port    int
}

// ✅ Хороший порядок (меньше padding)
type GoodConfig struct {
    Host    string // 16
    Timeout int    // 8
    Port    int    // 8
    Debug   bool   // 1 + 7 padding = 16
}
```

### 2. Используйте smaller types

```go
package main

// ❌ Избыточный размер
type BadStats struct {
    Count   int64  // 8 bytes
    Average float64 // 8 bytes
}

// ✅ Достаточный размер
type GoodStats struct {
    Count   int32  // 4 bytes
    Average float32 // 4 bytes
}

// Примечание: float32 имеет меньшую точность!
```

### 3. Избегайте string-to-byte конверсий

```go
package main

import "unsafe"

// ❌ Копирование при каждом вызове
func processBad(s string) {
    b := []byte(s) // Аллокация!
    _ = b
}

// ✅ Преобразование без копирования (опасно!)
func processGood(s string) {
    b := *(*[]byte)(unsafe.Pointer(&s))
    _ = b
}

// ✅ Cache конвертацию
type Processor struct {
    cached []byte
}

func (p *Processor) ensureCached(s string) {
    if p.cached == nil {
        p.cached = []byte(s)
    }
    // Примечание: это не thread-safe!
}

func (p *Processor) Process(s string) {
    p.ensureCached(s)
    _ = p.cached
}
```

## GC-оптимизации

### 1. Уменьшите allocations

```go
package main

// ❌ Много аллокаций
func badFilter(numbers []int) []int {
    result := []int{}
    for _, n := range numbers {
        if n > 0 {
            result = append(result, n) // Возможная аллокация
        }
    }
    return result
}

// ✅ С preallocation
func goodFilter(numbers []int) []int {
    // Считаем сколько нужно
    count := 0
    for _, n := range numbers {
        if n > 0 {
            count++
        }
    }
    
    result := make([]int, 0, count)
    for _, n := range numbers {
        if n > 0 {
            result = append(result, n)
        }
    }
    return result
}

// ✅ Filter in-place
func inplaceFilter(numbers []int) []int {
    i := 0
    for _, n := range numbers {
        if n > 0 {
            numbers[i] = n
            i++
        }
    }
    return numbers[:i]
}
```

### 2. Используйте primitive types где возможно

```go
package main

// ❌ GC压力大
type Expensive struct {
    Strings []string
    Maps    map[string]int
}

// ✅ Легче для GC
type Cheap struct {
    // Если возможно, используйте срезы примитивов
    IDs    []int32
    Scores []float64
}
```

## Профилирование

### CPU Profile

```go
package main

import (
    "os"
    "runtime/pprof"
)

func main() {
    // Создаём файл для профиля
    f, _ := os.Create("cpu.prof")
    defer f.Close()
    
    // Начинаем профилирование
    pprof.StartCPUProfile(f)
    defer pprof.StopCPUProfile()
    
    // Ваш код
    doWork()
}

func doWork() {
    // ...
}
```

### Memory Profile

```go
package main

import (
    "os"
    "runtime/mem"
    "runtime/pprof"
)

func main() {
    f, _ := os.Create("mem.prof")
    defer f.Close()
    
    // Записываем профиль памяти
    pprof.WriteHeapProfile(f)
    defer f.Close()
    
    // Или через runtime
    var stats mem.MemStats
    runtime.ReadMemStats(&stats)
    _ = stats
}
```

## Инструменты

```bash
# Запуск бенчмарков
go test -bench=. -benchmem

# CPU профиль
go test -cpuprofile=cpu.prof -bench=.
go tool pprof cpu.prof

# Memory профиль
go test -memprofile=mem.prof -bench=.
go tool pprof mem.prof

# Трейс (Go 1.22+)
go test -trace=trace.out -bench=.
go tool trace trace.out

# Всеocation count
go test -bench=. -benchmem -memstats=all
```

## Типичные паттерны

### Hot path оптимизация

```go
package main

// ❌ Плохо
func Process(data []byte) error {
    header := data[0:10]
    payload := data[10:]
    
    // Каждый вызов создаёт новые срезы
    if !validateHeader(header) {
        return ErrInvalidHeader
    }
    return processPayload(payload)
}

// ✅ Хорошо
type Parser struct {
    buf []byte
}

func (p *Parser) Init(buf []byte) {
    p.buf = buf
}

func (p *Parser) Header() []byte {
    return p.buf[:10]
}

func (p *Parser) Payload() []byte {
    return p.buf[10:]
}

func (p *Parser) Process() error {
    header := p.Header() // Не аллоцирует
    payload := p.Payload()
    
    if !validateHeader(header) {
        return ErrInvalidHeader
    }
    return processPayload(payload)
}
```

## Итоги

| Техника | Когда применять |
|---------|----------------|
| strings.Builder | Конкатенация в цикле |
| sync.Pool | Часто создаваемые объекты |
| Preallocate | Известный размер коллекции |
| Order struct fields | Уменьшение padding |
| Primitive types | Снижение GC pressure |
| In-place modification | Экономия памяти |
| Profile first | Оптимизируйте горячие пути |
