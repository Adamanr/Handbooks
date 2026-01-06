---
sidebar_position: 10
title: Atomic и Sync.Map
---

# Атомарные операции и Sync.Map

## Пакет sync/atomic

Атомарные операции гарантируют, что операция выполнится целиком без прерывания другими горутинами.

## Базовые атомарные операции

```go
package main

import (
    "fmt"
    "sync/atomic"
)

func main() {
    var counter int64
    
    // Атомарное инкрементирование
    atomic.AddInt64(&counter, 1)
    atomic.AddInt64(&counter, 2)
    fmt.Println("Counter:", counter)
    
    // Атомарное чтение
    value := atomic.LoadInt64(&counter)
    fmt.Println("Loaded:", value)
    
    // Атомарная запись
    atomic.StoreInt64(&counter, 100)
    fmt.Println("After store:", counter)
    
    // Атомарный обмен (CAS - Compare-And-Swap)
    old := atomic.SwapInt64(&counter, 200)
    fmt.Printf("Swapped: old=%d, new=%d\n", old, counter)
    
    // Сравнение и обмен (CAS)
    // Обменяет только если текущее значение == 200
    swapped := atomic.CompareAndSwapInt64(&counter, 200, 300)
    fmt.Printf("CAS result: %v, value: %d\n", swapped, counter)
    
    // Если значение другое — обмена не будет
    swapped = atomic.CompareAndSwapInt64(&counter, 200, 400)
    fmt.Printf("CAS failed: %v, value: %d\n", swapped, counter)
}
```

## Практический пример: счётчик

```go
package main

import (
    "fmt"
    "sync"
    "sync/atomic"
)

type Counter struct {
    value int64
}

func (c *Counter) Inc() {
    atomic.AddInt64(&c.value, 1)
}

func (c *Counter) Load() int64 {
    return atomic.LoadInt64(&c.value)
}

// CAS для условного инкремента
func (c *Counter) CompareAndSwap(old, new int64) bool {
    return atomic.CompareAndSwapInt64(&c.value, old, new)
}

func main() {
    var wg sync.WaitGroup
    counter := &Counter{}
    
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter.Inc()
        }()
    }
    
    wg.Wait()
    fmt.Println("Final count:", counter.Load()) // Всегда 1000
}
```

## Атомарные boolean и pointer

```go
package main

import (
    "fmt"
    "sync/atomic"
    "unsafe"
)

func main() {
    // Атомарный boolean
    var flag int32 = 0
    
    // 0 = false, 1 = true
    atomic.StoreInt32(&flag, 1)
    if atomic.LoadInt32(&flag) == 1 {
        fmt.Println("Flag is true")
    }
    
    // Атомарный указатель
    var ptr *int
    
    // Атомарная запись указателя
    val := 42
    atomic.StorePointer((*unsafe.Pointer)(unsafe.Pointer(&ptr)), unsafe.Pointer(&val))
    
    // Атомарное чтение указателя
    readPtr := atomic.LoadPointer((*unsafe.Pointer)(unsafe.Pointer(&ptr)))
    fmt.Println("Value:", *(*int)(readPtr))
}
```

## Sync.Map

Встроенная map не thread-safe. `sync.Map` — thread-safe альтернатива.

## Базовые операции Sync.Map

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    var m sync.Map
    
    // Запись
    m.Store("key1", "value1")
    m.Store("key2", "value2")
    m.Store(123, "number")
    
    // Чтение
    value, ok := m.Load("key1")
    fmt.Printf("key1: %v, exists: %v\n", value, ok)
    
    // Чтение с default значением
    value = m.LoadOrStore("key3", "default")
    fmt.Printf("key3: %v ( LoadOrStore)\n", value)
    
    // Удаление
    m.Delete("key2")
    
    // Обход всех значений
    m.Range(func(k, v interface{}) bool {
        fmt.Printf("%v = %v\n", k, v)
        return true // false для остановки
    })
}
```

## Практический пример: кэш

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

type Cache struct {
    m sync.Map
}

func (c *Cache) Get(key string) (interface{}, bool) {
    return c.m.Load(key)
}

func (c *Cache) Set(key string, value interface{}) {
    c.m.Store(key, value)
}

func (c *Cache) Delete(key string) {
    c.m.Delete(key)
}

func (c *Cache) LoadAndDelete(key string) (interface{}, bool) {
    return c.m.LoadAndDelete(key)
}

func (c *Cache) Range(fn func(key, value interface{}) bool) {
    c.m.Range(fn)
}

func main() {
    cache := &Cache{}
    
    // Заполняем кэш
    for i := 0; i < 100; i++ {
        cache.Set(fmt.Sprintf("key-%d", i), i*i)
    }
    
    // Параллельное чтение
    var wg sync.WaitGroup
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            for j := 0; j < 10; j++ {
                key := fmt.Sprintf("key-%d", j)
                if val, ok := cache.Get(key); ok {
                    fmt.Printf("Goroutine %d: %s = %v\n", id, key, val)
                }
            }
        }(i)
    }
    
    wg.Wait()
}
```

## Когда использовать что

### Атомарные операции vs Mutex

```go
package main

import (
    "sync"
    "sync/atomic"
)

type CounterWithMutex struct {
    mu    sync.Mutex
    value int64
}

type CounterWithAtomic struct {
    value int64
}

// ✅ Atomic — быстрее для простых операций
func (c *CounterWithAtomic) Inc() {
    atomic.AddInt64(&c.value, 1)
}

// ✅ Mutex — лучше для комплексных операций
func (c *CounterWithMutex) Inc() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.value++
}

// ❌ Не используйте atomic для этого:
func (c *CounterWithAtomic) ComplexOp() {
    // Читаем
    v := atomic.LoadInt64(&c.value)
    // Вычисляем
    v = v * 2
    // Записываем — НЕ атомарно! Может быть гонка.
    atomic.StoreInt64(&c.value, v)
}

// ✅ Mutex для комплексных операций
func (c *CounterWithMutex) ComplexOp() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.value = c.value * 2
}

// ✅ CAS для условных операций
func (c *CounterWithAtomic) AddIfPositive(delta int64) bool {
    for {
        current := atomic.LoadInt64(&c.value)
        if current < 0 {
            return false
        }
        newVal := current + delta
        if atomic.CompareAndSwapInt64(&c.value, current, newVal) {
            return true
        }
    }
}
```

### sync.Map vs map + Mutex

```go
package main

import (
    "sync"
)

type SafeMapWithMutex struct {
    mu sync.RWMutex
    m  map[string]int
}

type SafeMap struct {
    m sync.Map
}

// sync.Map лучше когда:
// - ключи пишутся один раз и читаются много
// - горутины не пересекаются по ключам
// - нужен LoadAndDelete или Range

// map + Mutex/RWMutex лучше когда:
// - много обновлений одних и тех же ключей
// - нужно сохранять порядок
// - нужны более сложные операции

func main() {
    // Пример: map + RWMutex
    m := SafeMapWithMutex{
        m: make(map[string]int),
    }
    
    var wg sync.WaitGroup
    
    // Писатели
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            m.mu.Lock()
            m.m[fmt.Sprintf("key-%d", id)] = id
            m.mu.Unlock()
        }(i)
    }
    
    // Читатели
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            m.mu.RLock()
            _ = m.m["key-1"]
            m.mu.RUnlock()
        }()
    }
    
    wg.Wait()
}
```

## Производительность

```go
package main

import (
    "fmt"
    "sync"
    "sync/atomic"
    "time"
)

func benchmarkAtomic() time.Duration {
    var counter int64
    start := time.Now()
    
    var wg sync.WaitGroup
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for j := 0; j < 10000; j++ {
                atomic.AddInt64(&counter, 1)
            }
        }()
    }
    
    wg.Wait()
    fmt.Println("Atomic counter:", counter)
    return time.Since(start)
}

func benchmarkMutex() time.Duration {
    var mu sync.Mutex
    counter := 0
    start := time.Now()
    
    var wg sync.WaitGroup
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for j := 0; j < 10000; j++ {
                mu.Lock()
                counter++
                mu.Unlock()
            }
        }()
    }
    
    wg.Wait()
    fmt.Println("Mutex counter:", counter)
    return time.Since(start)
}

func main() {
    atomicTime := benchmarkAtomic()
    mutexTime := benchmarkMutex()
    
    fmt.Printf("Atomic: %v\n", atomicTime)
    fmt.Printf("Mutex: %v\n", mutexTime)
}
```

## Итоги

| Инструмент | Когда использовать |
|------------|-------------------|
| `atomic.Add*` | Простые счётчики, инкременты |
| `atomic.CompareAndSwap*` | Условные обновления |
| `sync.Map` | Read-heavy сценарии, кэши |
| `sync.Mutex` | Комплексные операции |
| `sync.RWMutex` | Много читателей, мало писателей |
