---
sidebar_position: 9
title: Unsafe и указатели
---

# Пакет unsafe

`unsafe` — это пакет, позволяющий обходить систему типов Go. Используется для низкоуровневого программирования.

## ⚠️ Важные предупреждения

> **Внимание**: Код с `unsafe` может сломаться при обновлении Go. Используйте только когда нет альтернатив.

## Преобразование типов

```go
package main

import (
    "fmt"
    "unsafe"
)

func main() {
    var x float64 = 3.14159
    
    // Преобразуем float64 в int64
    // Внимание: это НЕ математическое преобразование!
    y := *(*int64)(unsafe.Pointer(&x))
    
    fmt.Printf("x: %f\n", x)
    fmt.Printf("y (bits): %d\n", y)
    
    // Доступ к байтам структуры
    type Person struct {
        Name string
        Age  int
    }
    
    p := Person{Name: "Alice", Age: 30}
    
    // Получаем указатель на первый field
    namePtr := (*string)(unsafe.Pointer(&p))
    fmt.Println("Name via unsafe:", *namePtr)
}
```

## Получение размера типа

```go
package main

import (
    "fmt"
    "unsafe"
)

func main() {
    fmt.Printf("int size: %d bytes\n", unsafe.Sizeof(int(0)))
    fmt.Printf("int64 size: %d bytes\n", unsafe.Sizeof(int64(0)))
    fmt.Printf("float64 size: %d bytes\n", unsafe.Sizeof(float64(0)))
    fmt.Printf("bool size: %d bytes\n", unsafe.Sizeof(bool(false)))
    fmt.Printf("string size: %d bytes\n", unsafe.Sizeof(""))
    fmt.Printf("interface{} size: %d bytes\n", unsafe.Sizeof(interface{}(nil)))
    
    // Размеры структур
    type Empty struct{}
    fmt.Printf("empty struct size: %d bytes\n", unsafe.Sizeof(Empty{}))
    
    type WithPadding struct {
        A byte
        _ [7]byte // padding
        B int64
    }
    fmt.Printf("WithPadding size: %d bytes\n", unsafe.Sizeof(WithPadding{}))
}
```

## Offsetof — смещение поля в структуре

```go
package main

import (
    "fmt"
    "unsafe"
)

type User struct {
    ID    int64
    Name  string
    Age   int32
    Email string
}

func main() {
    u := User{}
    
    fmt.Printf("Offset of ID: %d\n", unsafe.Offsetof(u.ID))
    fmt.Printf("Offset of Name: %d\n", unsafe.Offsetof(u.Name))
    fmt.Printf("Offset of Age: %d\n", unsafe.Offsetof(u.Age))
    fmt.Printf("Offset of Email: %d\n", unsafe.Offsetof(u.Email))
    
    // Sizeof структуры
    fmt.Printf("User size: %d bytes\n", unsafe.Sizeof(u))
    
    // Padding анализ
    // ID (8 bytes) + Name (16 bytes) + Age (4 bytes) + padding (4) + Email (16) = 48
    // Фактически может быть больше из-за выравнивания всей структуры
}
```

## Арифметика указателей

```go
package main

import (
    "fmt"
    "unsafe"
)

func main() {
    arr := [5]int{10, 20, 30, 40, 50}
    
    // Получаем указатель на первый элемент
    ptr := &arr[0]
    
    // Получаем "сырой" указатель для арифметики
    rawPtr := unsafe.Pointer(ptr)
    
    // Переходим ко второму элементу (ptr + 1)
    // Sizeof(int) = 8 на 64-битной системе
    step := unsafe.Sizeof(arr[0])
    secondPtr := (*int)(unsafe.Pointer(uintptr(rawPtr) + step))
    
    fmt.Printf("First: %d\n", *ptr)
    fmt.Printf("Second: %d\n", *secondPtr)
    
    // Больше элементов
    for i := 0; i < len(arr); i++ {
        elemPtr := (*int)(unsafe.Pointer(uintptr(rawPtr) + uintptr(i)*step))
        fmt.Printf("arr[%d] = %d\n", i, *elemPtr)
    }
}
```

## Преобразование []byte в string без копирования

```go
package main

import (
    "fmt"
    "unsafe"
)

func main() {
    data := []byte{'h', 'e', 'l', 'l', 'o'}
    
    // ❌ Обычный способ — копирование
    s1 := string(data)
    fmt.Println(s1)
    
    // ✅ Без копирования (опасно!)
    // Внимание: изменение среза изменит строку!
    s2 := *(*string)(unsafe.Pointer(&data))
    fmt.Println(s2)
    
    // Для string -> []byte
    str := "hello"
    slice := *(*[]byte)(unsafe.Pointer(&str))
    fmt.Printf("slice: %v\n", slice)
}
```

## Slice Header

```go
package main

import (
    "fmt"
    "unsafe"
)

type SliceHeader struct {
    Data unsafe.Pointer
    Len  int
    Cap  int
}

func main() {
    s := []int{1, 2, 3, 4, 5}
    
    // Получаем доступ к внутренней структуре
    hdr := (*SliceHeader)(unsafe.Pointer(&s))
    
    fmt.Printf("Data: %p\n", hdr.Data)
    fmt.Printf("Len: %d\n", hdr.Len)
    fmt.Printf("Cap: %d\n", hdr.Cap)
    
    // Создаём срез вручную
    arr := [5]int{10, 20, 30, 40, 50}
    manualSlice := *(*[]int)(unsafe.Pointer(&SliceHeader{
        Data: unsafe.Pointer(&arr),
        Len:  5,
        Cap:  5,
    }))
    
    fmt.Println(manualSlice) // [10 20 30 40 50]
}
```

## Практическое применение

### Копирование памяти (аналог memcpy)

```go
package main

import (
    "fmt"
    "unsafe"
)

func memcpy(dst, src unsafe.Pointer, n uintptr) {
    dstBytes := (*[1 << 30]byte)(dst) // large array
    srcBytes := (*[1 << 30]byte)(src)
    
    for i := uintptr(0); i < n; i++ {
        dstBytes[i] = srcBytes[i]
    }
}

func main() {
    src := []byte{'h', 'e', 'l', 'l', 'o'}
    dst := make([]byte, len(src))
    
    memcpy(unsafe.Pointer(&dst[0]), unsafe.Pointer(&src[0]), uintptr(len(src)))
    
    fmt.Printf("src: %s\n", src)
    fmt.Printf("dst: %s\n", dst)
}
```

### Оптимизация сериализации

```go
package main

import (
    "encoding/binary"
    "fmt"
    "unsafe"
)

type Header struct {
    Magic    uint32
    Version  uint16
    Flags    uint16
    Payload  uint64
}

// Бинарный сериализатор с unsafe
func (h *Header) Bytes() []byte {
    buf := make([]byte, unsafe.Sizeof(*h))
    
    // Записываем напрямую в байты
    binary.LittleEndian.PutUint32(buf[0:4], h.Magic)
    binary.LittleEndian.PutUint16(buf[4:6], h.Version)
    binary.LittleEndian.PutUint16(buf[6:8], h.Flags)
    binary.LittleEndian.PutUint64(buf[8:16], h.Payload)
    
    return buf
}

func (h *Header) FromBytes(buf []byte) {
    h.Magic = binary.LittleEndian.Uint32(buf[0:4])
    h.Version = binary.LittleEndian.Uint16(buf[4:6])
    h.Flags = binary.LittleEndian.Uint16(buf[6:8])
    h.Payload = binary.LittleEndian.Uint64(buf[8:16])
}

func main() {
    hdr := Header{
        Magic:   0xDEADBEEF,
        Version: 1,
        Flags:   0,
        Payload: 123456789,
    }
    
    bytes := hdr.Bytes()
    fmt.Printf("Serialized: %x\n", bytes)
    
    var parsed Header
    parsed.FromBytes(bytes)
    fmt.Printf("Parsed: %+v\n", parsed)
}
```

## Аналог C-структур

```go
package main

import (
    "fmt"
    "unsafe"
)

// Аналог: struct Point { int x; int y; }
type Point struct {
    X int32
    Y int32
}

// Аналог: struct Rect { Point p1; Point p2; }
type Rect struct {
    P1 Point
    P2 Point
}

func main() {
    // Создаём массив байтов, имитирующий C-структуру в памяти
    // Rect = Point(8 bytes) + Point(8 bytes) = 16 bytes
    data := make([]byte, 16)
    
    // Заполняем как C-структура
    // P1.X (offset 0)
    *(*int32)(unsafe.Pointer(&data[0])) = 10
    // P1.Y (offset 4)
    *(*int32)(unsafe.Pointer(&data[4])) = 20
    // P2.X (offset 8)
    *(*int32)(unsafe.Pointer(&data[8])) = 100
    // P2.Y (offset 12)
    *(*int32)(unsafe.Pointer(&data[12])) = 200
    
    // Интерпретируем как Rect
    rect := (*Rect)(unsafe.Pointer(&data[0]))
    
    fmt.Printf("P1: (%d, %d)\n", rect.P1.X, rect.P1.Y)
    fmt.Printf("P2: (%d, %d)\n", rect.P2.X, rect.P2.Y)
}
```

## Итоги

| Функция/Тип | Назначение |
|-------------|------------|
| `unsafe.Pointer` | "Любой" указатель |
| `unsafe.Sizeof()` | Размер типа |
| `unsafe.Offsetof()` | Смещение поля |
| `unsafe.Alignof()` | Выравнивание |
| `uintptr` | Целочисленный тип для арифметики |

> **Правило**: Используйте `unsafe` только когда:
> 1. Это критично для производительности
> 2. Нет стандартной альтернативы
> 3. Вы понимаете последствия
