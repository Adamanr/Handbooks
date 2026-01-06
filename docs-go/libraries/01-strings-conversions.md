---
sidebar_position: 1
title: Strings
---

# Strings и преобразования типов

## Базовые операции со строками

```go
package main

import (
    "fmt"
    "strings"
)

func main() {
    s := "Hello, World!"
    
    // Длина строки
    fmt.Println(len(s)) // 13
    
    // Доступ по индексу (byte)
    fmt.Println(s[0])       // 72 (byte 'H')
    fmt.Println(string(s[0])) // "H"
    
    // Срез строки
    fmt.Println(s[0:5])   // "Hello"
    fmt.Println(s[7:])    // "World!"
    fmt.Println(s[:5])    // "Hello"
}
```

## Пакет `strings`

```go
package main

import (
    "fmt"
    "strings"
)

func main() {
    s := "Hello, World!"
    
    // Поиск
    fmt.Println(strings.Contains(s, "World"))  // true
    fmt.Println(strings.Index(s, "World"))     // 7
    fmt.Println(strings.LastIndex(s, "l"))     // 10
    
    // Сравнение
    fmt.Println(strings.EqualFold("Hello", "HELLO")) // true (без учёта регистра)
    fmt.Println(strings.Compare("abc", "abd"))       // -1
    
    // Изменение регистра
    fmt.Println(strings.ToUpper(s))   // "HELLO, WORLD!"
    fmt.Println(strings.ToLower(s))   // "hello, world!"
    fmt.Println(strings.ToTitle(s))   // "HELLO, WORLD!"
    
    // Обрезка пробелов
    fmt.Println(strings.TrimSpace("  Hello  "))  // "Hello"
    fmt.Println(strings.Trim("!!!Hello!!!", "!")) // "Hello"
    fmt.Println(strings.TrimLeft("  Hello", " ")) // "Hello"
    fmt.Println(strings.TrimRight("Hello  ", " ")) // "Hello"
    
    // Разделение и объединение
    parts := strings.Split(s, ", ")
    fmt.Println(parts) // ["Hello", " World!"]
    
    joined := strings.Join(parts, "-")
    fmt.Println(joined) // "Hello- World!"
    
    // Повторение
    fmt.Println(strings.Repeat("ab", 3)) // "ababab"
    
    // Замена
    fmt.Println(strings.Replace(s, "World", "Go", 1)) // "Hello, Go!"
    fmt.Println(strings.ReplaceAll(s, "l", "L"))     // "HeLLo, WorLD!"
    
    // Проверка префикса/суффикса
    fmt.Println(strings.HasPrefix(s, "Hello")) // true
    fmt.Println(strings.HasSuffix(s, "!"))     // true
    
    // Повторяющиеся символы
    fmt.Println(strings.Count("hello", "l")) // 2
    fmt.Println(strings.Count("123123", "1")) // 2
    
    // Отображение символов
    fmt.Println(strings.Map(func(r rune) rune {
        if r == 'a' {
            return 'o'
        }
        return r
    }, "banana")) // "bonono"
}
```

## strings.Builder и strings.Reader

```go
package main

import (
    "fmt"
    "strings"
)

func main() {
    // Builder — эффективное построение строк
    var builder strings.Builder
    
    for i := 1; i <= 5; i++ {
        fmt.Fprintf(&builder, "Item %d\n", i)
    }
    
    result := builder.String()
    fmt.Println(result)
    
    // Reader — чтение из строки как из io.Reader
    reader := strings.NewReader("Hello, World!")
    
    buf := make([]byte, 5)
    n, _ := reader.Read(buf)
    fmt.Printf("Read %d bytes: %s\n", n, string(buf)) // "Hello"
    
    // Сброс для повторного чтения
    reader.Reset("New content")
    reader.Read(buf)
    fmt.Println(string(buf)) // "New c"
}
```

## Пакет `strconv`

### Преобразование в строку

```go
package main

import (
    "fmt"
    "strconv"
)

func main() {
    // Int в строку
    n := 42
    s := strconv.Itoa(n)
    fmt.Println(s) // "42"
    
    s = strconv.FormatInt(int64(n), 10)
    fmt.Println(s) // "42"
    
    // Float в строку
    f := 3.14159
    s = strconv.FormatFloat(f, 'f', 2, 64)
    fmt.Println(s) // "3.14"
    
    s = strconv.FormatFloat(f, 'e', -1, 64)
    fmt.Println(s) // "3.14159e+00"
    
    // Bool в строку
    b := true
    s = strconv.FormatBool(b)
    fmt.Println(s) // "true"
    
    // Int в разных системах счисления
    fmt.Println(strconv.FormatInt(255, 16)) // "ff" (hex)
    fmt.Println(strconv.FormatInt(255, 2))  // "11111111" (binary)
}
```

### Преобразование из строки

```go
package main

import (
    "fmt"
    "strconv"
)

func main() {
    // Строка в int
    s := "42"
    n, err := strconv.Atoi(s)
    fmt.Println(n, err) // 42 <nil>
    
    n, err = strconv.ParseInt(s, 10, 64)
    fmt.Println(n, err) // 42 <nil>
    
    // Строка в bool
    s = "true"
    b, err := strconv.ParseBool(s)
    fmt.Println(b, err) // true <nil>
    
    // Строка в float
    s = "3.14159"
    f, err := strconv.ParseFloat(s, 64)
    fmt.Println(f, err) // 3.14159 <nil>
    
    // Строка в uint
    s = "255"
    u, err := strconv.ParseUint(s, 10, 8)
    fmt.Println(u, err) // 255 <nil>
}
```

### Безопасное преобразование с обработкой ошибок

```go
package main

import (
    "fmt"
    "strconv"
)

func main() {
    // Вариант 1: проверка ошибки
    s := "abc"
    n, err := strconv.Atoi(s)
    if err != nil {
        fmt.Printf("Ошибка преобразования: %v\n", err)
    }
    
    // Вариант 2: функция с default значением
    n = toInt("42", 0)     // 42
    n = toInt("abc", 0)    // 0
    n = toInt("abc", 100)  // 100
    
    // Вариант 3: Try-функции (Go 1.17+)
    n, err = strconv.Atoi("123")
    if err == nil {
        fmt.Println("Успех:", n)
    }
}

func toInt(s string, defaultVal int) int {
    n, err := strconv.Atoi(s)
    if err != nil {
        return defaultVal
    }
    return n
}
```

## Unicode и руны

```go
package main

import (
    "fmt"
    "unicode/utf8"
)

func main() {
    s := "Привет, 世界! 🌍"
    
    // Длина в рунах (символах)
    fmt.Println(utf8.RuneCountInString(s)) // 14
    
    // Итерация по рунам
    for i, r := range s {
        fmt.Printf("%d: %q\n", i, r)
    }
    
    // Преобразование в срез рун
    runes := []rune(s)
    fmt.Println(len(runes)) // 14
    
    // Срез по рунам
    fmt.Println(string(runes[:5])) // "Привет"
    
    // Декодирование рун из байтов
    buf := []byte("Привет")
    for len(buf) > 0 {
        r, size := utf8.DecodeRune(buf)
        fmt.Printf("%c (%d bytes)\n", r, size)
        buf = buf[size:]
    }
}
```

## Эффективное конкатенирование

```go
package main

import (
    "fmt"
    "strings"
    "time"
)

func main() {
    // ❌ Неэффективно — создаёт много промежуточных строк
    start := time.Now()
    s := ""
    for i := 0; i < 10000; i++ {
        s += "a"
    }
    fmt.Println("+= took:", time.Since(start))
    
    // ✅ Эффективно — использует strings.Builder
    start = time.Now()
    var builder strings.Builder
    for i := 0; i < 10000; i++ {
        builder.WriteString("a")
    }
    s = builder.String()
    fmt.Println("Builder took:", time.Since(start))
    
    // ✅ Эффективно для известного количества
    parts := make([]string, 10000)
    for i := 0; i < 10000; i++ {
        parts[i] = "a"
    }
    start = time.Now()
    s = strings.Join(parts, "")
    fmt.Println("Join took:", time.Since(start))
}
```

## Форматирование строк

```go
package main

import (
    "fmt"
)

func main() {
    name := "Alice"
    age := 30
    height := 175.5
    
    // fmt.Sprintf — форматирование в строку
    s := fmt.Sprintf("Name: %s, Age: %d, Height: %.1f", name, age, height)
    fmt.Println(s)
    
    // fmt.Fprintf — форматирование в writer
    // fmt.Fprintf(writer, "format", args...)
    
    // Спецификаторы
    fmt.Printf("%%s (string): %s\n", name)
    fmt.Printf("%%d (int): %d\n", age)
    fmt.Printf("%%f (float): %f\n", height)
    fmt.Printf("%%.2f (float precision): %.2f\n", height)
    fmt.Printf("%%v (any): %v\n", struct{ X int }{42})
    fmt.Printf("%%#v (Go syntax): %#v\n", struct{ X int }{42})
    fmt.Printf("%%T (type): %T\n", age)
    
    // Позиционные аргументы
    fmt.Printf("%[1]s is %[2]d years old\n", name, age) // Alice is 30 years old
    
    // Ширина и выравнивание
    fmt.Printf("|%-10s|%10s|\n", "left", "right") // |left     |     right|
    fmt.Printf("|%10s|%-10s|\n", "right", "left") // |     right|left     |
    
    // Заполнение
    fmt.Printf("%05d\n", 42)      // 00042
    fmt.Printf("%-5.2f\n", 3.14)  // 3.14 (с пробелами)
}
```

## Практические примеры

### Парсинг CSV-строки

```go
package main

import (
    "fmt"
    "strings"
)

func parseCSV(line string) []string {
    // Простой парсер (для сложных случаев используйте encoding/csv)
    return strings.Split(line, ",")
}

func main() {
    line := "name,age,city"
    parts := parseCSV(line)
    fmt.Println(parts) // [name age city]
}
```

### Валидация и очистка ввода

```go
package main

import (
    "fmt"
    "regexp"
    "strings"
    "unicode"
)

func main() {
    // Очистка пробелов
    input := "  Hello   World  "
    cleaned := strings.Join(strings.Fields(input), " ")
    fmt.Println(cleaned) // "Hello World"
    
    // Валидация email (упрощённо)
    email := "test@example.com"
    isValid := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`).MatchString(email)
    fmt.Println("Email valid:", isValid)
    
    // sanitizeInput удаляет опасные символы
    input = "Hello <script>alert('xss')</script>"
    re := regexp.MustCompile(`<[^>]*>`)
    safe := re.ReplaceAllString(input, "")
    fmt.Println(safe) // "Hello "
}

func isAlphanumeric(s string) bool {
    for _, r := range s {
        if !unicode.IsLetter(r) && !unicode.IsDigit(r) {
            return false
        }
    }
    return len(s) > 0
}
```

## Итоги

| Пакет | Назначение |
|-------|------------|
| `strings` | Поиск, изменение, разделение строк |
| `strconv` | Преобразование типов ↔ строка |
| `unicode/utf8` | Работа с Unicode и рунами |
| `fmt` | Форматирование строк |
| `regexp` | Регулярные выражения |
