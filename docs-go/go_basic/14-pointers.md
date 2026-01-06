---
sidebar_position: 14
title: Указатели
---

# Указатели в Go

Указатели — это переменные, которые хранят адрес другой переменной в памяти.

## Базовые概念

```go
package main

import "fmt"

func main() {
    // Объявляем переменную
    age := 25
    
    // Создаём указатель на age
    var agePtr *int = &age
    
    fmt.Println("Значение age:", age)           // 25
    fmt.Println("Адрес age:", &age)             // 0x1400010
    fmt.Println("Значение через указатель:", *agePtr) // 25
    
    // Изменяем значение через указатель
    *agePtr = 30
    fmt.Println("Новое значение age:", age)     // 30
}
```

## Оператор `&` и `*`

| Оператор | Описание |
|----------|----------|
| `&` | Получает адрес переменной |
| `*` | Разыменовывает указатель (получает значение) |

```go
package main

import "fmt"

func main() {
    x := 10
    y := &x  // y содержит адрес x
    
    fmt.Println(x)  // 10
    fmt.Println(y)  // 0x140001234 (адрес)
    fmt.Println(*y) // 10 (значение по адресу)
    
    *y = 20  // Изменяем значение по адресу
    fmt.Println(x)  // 20 (x тоже изменилось!)
}
```

## Передача указателей в функции

```go
package main

import "fmt"

// Без указателя — создаётся копия
func incrementWithoutPointer(val int) {
    val++
}

// С указателем — работаем с оригиналом
func incrementWithPointer(val *int) {
    (*val)++
}

func main() {
    num := 5
    
    incrementWithoutPointer(num)
    fmt.Println("Без указателя:", num)  // 5
    
    incrementWithPointer(&num)
    fmt.Println("С указателем:", num)   // 6
}
```

## Указатели и структуры

```go
package main

import "fmt"

type Person struct {
    Name string
    Age  int
}

// Функция без указателя — не изменит оригинал
func changeNameBad(p Person, newName string) {
    p.Name = newName
}

// Функция с указателем — изменит оригинал
func changeNameGood(p *Person, newName string) {
    p.Name = newName
}

func main() {
    person := Person{Name: "Alice", Age: 30}
    
    changeNameBad(person, "Bob")
    fmt.Println(person.Name) // Alice (не изменилось)
    
    changeNameGood(&person, "Bob")
    fmt.Println(person.Name) // Bob (изменилось!)
}
```

## Создание объектов с `new`

```go
package main

import "fmt"

func main() {
    // Создаём "пустую" структуру через new
    ptr := new(Person) // эквивалентно &Person{}
    
    fmt.Println(ptr)       // &{}
    fmt.Println(ptr.Name)  // ""
    fmt.Println(ptr.Age)   // 0
}
```

## Правило висячего указателя

> ⚠️ **Важно**: Указатель не должен ссылаться на память, которая больше не существует.

```go
package main

func badExample() *int {
    x := 10
    return &x  // ❌ Опасно! x будет уничтожена при выходе из функции
}

func goodExample() *int {
    x := 10
    y := x
    return &y  // ❌ Тоже опасно!
}

// Правильный подход — возвращать значение, а не указатель
func correctExample() int {
    x := 10
    return x
}
```

## Указатели и слайсы/массивы

```go
package main

import "fmt"

func main() {
    arr := [3]int{1, 2, 3}
    
    // Слайс уже содержит указатель на массив
    slice := arr[:]
    
    // Изменяем через слайс
    slice[0] = 100
    fmt.Println(arr[0])   // 100 (массив изменился!)
    
    // Но если пересоздать слайс — связь теряется
    slice = append(slice, 4)
    slice[0] = 999
    fmt.Println(arr[0])   // 100 (массив не изменился!)
}
```

## Практическое применение

### 1. Оптимизация памяти (большие структуры)

```go
package main

type HugeStruct struct {
    Data [1000000]byte
}

// Передаём указатель — не копируем миллион байт
func process(ptr *HugeStruct) {
    ptr.Data[0] = 42
}
```

### 2. Изменение данных в функции

```go
package main

type Config struct {
    Host string
    Port int
}

func loadConfig(path string, cfg *Config) {
    // Загружаем конфиг и заполняем переданную структуру
    cfg.Host = "localhost"
    cfg.Port = 8080
}

func main() {
    var cfg Config
    loadConfig("config.yaml", &cfg)
    fmt.Println(cfg.Host, cfg.Port)
}
```

## Итоги

| Когда использовать указатели | Когда не использовать |
|------------------------------|----------------------|
| Нужно изменить данные в функции | Данные small (< 2 слова) |
| Large structs (> 64 bytes) | Не нужно модифицировать |
| Передача nil как "нет значения" | Простые типы (int, string) |
| Связывание связанных данных | Immutability предпочтительна |

```go
// ✅ Хорошо:
// - func (p *Person) UpdateName()
// - func LoadFile(path string) (*File, error)

// ❌ Плохо:
// - func Add(a, b *int) int  (избыточно для простых типов)
```
