---
sidebar_position: 3
---

# Функции в Go

## Что такое функция?

Функция — это именованный блок кода, который выполняет определенную задачу. Функции позволяют избегать дублирования кода и делают программы более структурированными.

## Объявление функций

### Базовый синтаксис

```go
func functionName(parameter1 type1, parameter2 type2) returnType {
    // тело функции
    return result
}
```

### Примеры функций

```go
// Функция без параметров и возвращаемого значения
func greet() {
    fmt.Println("Hello, World!")
}

// Функция с одним параметром
func greetPerson(name string) {
    fmt.Printf("Hello, %s!\n", name)
}

// Функция с несколькими параметрами
func add(a int, b int) int {
    return a + b
}

// Функция с несколькими возвращаемыми значениями
func divide(a, b float64) (float64, error) {
    if b == 0 {
        return 0, fmt.Errorf("деление на ноль")
    }
    return a / b, nil
}
```

## Параметры функций

### Передача по значению

По умолчанию параметры передаются по значению (копируются):

```go
func increment(x int) {
    x++
    fmt.Println("Внутри функции:", x) // 6
}

func main() {
    x := 5
    increment(x)
    fmt.Println("После функции:", x) // 5 (не изменился)
}
```

### Передача по ссылке

Для изменения исходных данных используйте указатели:

```go
func incrementByRef(x *int) {
    (*x)++
    fmt.Println("Внутри функции:", *x) // 6
}

func main() {
    x := 5
    incrementByRef(&x)
    fmt.Println("После функции:", x) // 6 (изменился)
}
```

### Вариативные функции

Функции могут принимать переменное количество параметров:

```go
func sum(numbers ...int) int {
    total := 0
    for _, num := range numbers {
        total += num
    }
    return total
}

func main() {
    result := sum(1, 2, 3, 4, 5)
    fmt.Println(result) // 15
    
    // Также можно передать слайс
    nums := []int{1, 2, 3}
    result = sum(nums...)
    fmt.Println(result) // 6
}
```

## Возвращаемые значения

### Одно значение

```go
func square(x int) int {
    return x * x
}
```

### Несколько значений

```go
func swap(a, b int) (int, int) {
    return b, a
}

// Именованные возвращаемые значения
func calculate(a, b int) (sum, product int) {
    sum = a + b
    product = a * b
    return // автоматически возвращает sum и product
}
```

### Именованные возвращаемые значения

```go
func rectangleInfo(width, height int) (area, perimeter int) {
    area = width * height
    perimeter = 2 * (width + height)
    return // возвращает area и perimeter
}
```

## Анонимные функции

Функции можно создавать и использовать без имени:

```go
func main() {
    // Анонимная функция и немедленный вызов
    func() {
        fmt.Println("Анонимная функция")
    }()
    
    // Анонимная функция как значение переменной
    add := func(a, b int) int {
        return a + b
    }
    
    result := add(5, 3)
    fmt.Println(result) // 8
    
    // Анонимная функция как параметр
    numbers := []int{1, 2, 3, 4, 5}
    squared := transform(numbers, func(x int) int {
        return x * x
    })
    fmt.Println(squared) // [1 4 9 16 25]
}

func transform(slice []int, fn func(int) int) []int {
    result := make([]int, len(slice))
    for i, v := range slice {
        result[i] = fn(v)
    }
    return result
}
```

## Замыкания (Closures)

Функции могут "запоминать" переменные из внешней области видимости:

```go
func counter() func() int {
    count := 0
    return func() int {
        count++
        return count
    }
}

func main() {
    increment := counter()
    fmt.Println(increment()) // 1
    fmt.Println(increment()) // 2
    fmt.Println(increment()) // 3
    
    // Создаем новый счетчик
    increment2 := counter()
    fmt.Println(increment2()) // 1 (независимый счетчик)
}
```

## Методы

Функции, связанные с определенными типами, называются методами:

```go
// Определяем структуру
type Person struct {
    Name string
    Age  int
}

// Метод для структуры
func (p Person) Greet() string {
    return fmt.Sprintf("Привет, меня зовут %s, мне %d лет", p.Name, p.Age)
}

// Метод с указателем (может изменять структуру)
func (p *Person) HaveBirthday() {
    p.Age++
}

// Метод с value receiver (копирует структуру)
func (p Person) IsAdult() bool {
    return p.Age >= 18
}

func main() {
    person := Person{Name: "Alice", Age: 25}
    fmt.Println(person.Greet()) // Привет, меня зовут Alice, мне 25 лет
    fmt.Println(person.IsAdult()) // true
    
    person.HaveBirthday()
    fmt.Printf("После дня рождения: %s\n", person.Greet())
    // Привет, меня зовут Alice, мне 26 лет
}
```

## Практические примеры

### Пример 1: Калькулятор

```go
func calculate(operation string, a, b float64) (float64, error) {
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
    operations := []string{"+", "-", "*", "/"}
    for _, op := range operations {
        result, err := calculate(op, 10, 5)
        if err != nil {
            fmt.Printf("Ошибка при выполнении %s: %v\n", op, err)
        } else {
            fmt.Printf("10 %s 5 = %.2f\n", op, result)
        }
    }
}
```

### Пример 2: Обработка слайсов

```go
func filter(numbers []int, predicate func(int) bool) []int {
    var result []int
    for _, num := range numbers {
        if predicate(num) {
            result = append(result, num)
        }
    }
    return result
}

func mapNumbers(numbers []int, transformer func(int) int) []int {
    result := make([]int, len(numbers))
    for i, num := range numbers {
        result[i] = transformer(num)
    }
    return result
}

func main() {
    numbers := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
    
    // Фильтрация четных чисел
    evenNumbers := filter(numbers, func(x int) bool {
        return x%2 == 0
    })
    fmt.Println("Четные числа:", evenNumbers)
    
    // Фильтрация чисел больше 5
    bigNumbers := filter(numbers, func(x int) bool {
        return x > 5
    })
    fmt.Println("Числа больше 5:", bigNumbers)
    
    // Возведение в квадрат
    squared := mapNumbers(numbers, func(x int) int {
        return x * x
    })
    fmt.Println("Квадраты:", squared)
}
```

## Упражнения

1. Создайте функцию `isPalindrome`, которая проверяет, является ли строка палиндромом
2. Напишите функцию `fibonacci`, которая возвращает n-ое число Фибоначчи
3. Создайте функцию-генератор простых чисел с использованием замыканий
4. Реализуйте методы для структуры `Rectangle` (площадь, периметр, масштабирование)

В следующем уроке мы изучим условные конструкции и циклы.
