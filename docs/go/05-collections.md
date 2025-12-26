---
sidebar_position: 5
---

# Массивы, слайсы и карты

## Массивы

Массив — это последовательность элементов одного типа с фиксированной длиной.

### Объявление массивов

```go
// Объявление с указанием размера
var numbers [5]int          // массив из 5 целых чисел
var names [3]string         // массив из 3 строк
var grades [4]float64       // массив из 4 чисел с плавающей точкой

// Инициализация при объявлении
var numbers [5]int = [5]int{1, 2, 3, 4, 5}
var names [3]string = [3]string{"Alice", "Bob", "Charlie"}

// Короткое объявление
numbers := [5]int{1, 2, 3, 4, 5}
names := [3]string{"Alice", "Bob", "Charlie"}

// Инициализация с частичным заполнением
var numbers [5]int = [5]int{1, 2} // остальные элементы будут 0
var names [4]string = [4]string{"Alice"} // остальные строки будут пустыми

// Инициализация с указанием индексов
grades := [5]int{0: 85, 2: 92, 4: 78} // [85, 0, 92, 0, 78]
```

### Работа с массивами

```go
func main() {
    numbers := [5]int{10, 20, 30, 40, 50}
    
    // Доступ к элементам
    fmt.Println("Первый элемент:", numbers[0])
    fmt.Println("Последний элемент:", numbers[4])
    
    // Изменение элементов
    numbers[2] = 35
    fmt.Println("После изменения:", numbers)
    
    // Длина массива
    fmt.Println("Длина массива:", len(numbers))
    
    // Итерация по массиву
    fmt.Println("Все элементы:")
    for i := 0; i < len(numbers); i++ {
        fmt.Printf("numbers[%d] = %d\n", i, numbers[i])
    }
    
    // Итерация с range
    fmt.Println("Все элементы (через range):")
    for index, value := range numbers {
        fmt.Printf("numbers[%d] = %d\n", index, value)
    }
}
```

### Многомерные массивы

```go
func main() {
    // Двумерный массив 3x3
    var matrix [3][3]int = [3][3]int{
        {1, 2, 3},
        {4, 5, 6},
        {7, 8, 9},
    }
    
    // Инициализация частично
    var sparse [4][4]int
    sparse[0][1] = 5
    sparse[2][3] = 10
    
    // Итерация по двумерному массиву
    for i := 0; i < len(matrix); i++ {
        for j := 0; j < len(matrix[i]); j++ {
            fmt.Printf("%d ", matrix[i][j])
        }
        fmt.Println()
    }
}
```

## Слайсы

Слайс — это динамическая структура данных, которая представляет собой "окно" в массив. Слайсы более гибкие и часто используемые, чем массивы.

### Объявление слайсов

```go
// Объявление без инициализации
var numbers []int                    // nil слайс
var names []string                   // nil слайс

// Создание с помощью make
numbers := make([]int, 5)            // слайс длиной 5, заполненный нулями
names := make([]string, 3, 10)       // слайс длиной 3, емкостью 10

// Инициализация литералами
numbers := []int{1, 2, 3, 4, 5}
names := []string{"Alice", "Bob", "Charlie"}

// Создание подслайса (slice of slice)
fullSlice := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
subSlice := fullSlice[2:7]           // элементы с индекса 2 по 6 (не включая 7)

// Различные способы создания подслайса
subSlice1 := fullSlice[2:7]          // [3, 4, 5, 6, 7]
subSlice2 := fullSlice[:5]           // первые 5 элементов [1, 2, 3, 4, 5]
subSlice3 := fullSlice[5:]           // с 5-го индекса до конца [6, 7, 8, 9, 10]
subSlice4 := fullSlice[:]            // копия всего слайса [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

### Основные операции со слайсами

```go
func main() {
    // Создание слайса
    numbers := []int{1, 2, 3, 4, 5}
    
    // Длина и емкость
    fmt.Printf("Длина: %d, Емкость: %d\n", len(numbers), cap(numbers))
    
    // Добавление элементов
    numbers = append(numbers, 6)
    fmt.Println("После append:", numbers)
    
    // Добавление нескольких элементов
    numbers = append(numbers, 7, 8, 9)
    fmt.Println("После добавления нескольких:", numbers)
    
    // Добавление слайса к слайсу
    moreNumbers := []int{10, 11, 12}
    numbers = append(numbers, moreNumbers...)
    fmt.Println("После добавления слайса:", numbers)
    
    // Копирование слайсов
    copySlice := make([]int, len(numbers))
    copied := copy(copySlice, numbers)
    fmt.Printf("Скопировано %d элементов: %v\n", copied, copySlice)
}
```

### Модификация слайсов

```go
func modifySlice(slice []int) {
    // Изменение элементов слайса влияет на исходный слайс
    slice[0] = 999
    // Добавление элементов НЕ влияет на исходный слайс
    slice = append(slice, 1000)
}

func modifySlicePointer(slice *[]int) {
    // Изменение через указатель
    if *slice != nil {
        *slice = append(*slice, 2000)
    }
}

func main() {
    numbers := []int{1, 2, 3, 4, 5}
    fmt.Println("Исходный слайс:", numbers)
    
    modifySlice(numbers)
    fmt.Println("После modifySlice:", numbers) // [999, 2, 3, 4, 5]
    
    modifySlicePointer(&numbers)
    fmt.Println("После modifySlicePointer:", numbers) // [999, 2, 3, 4, 5, 2000]
}
```

### Практические примеры со слайсами

#### 1. Удаление элемента из слайса

```go
func removeElement(slice []int, index int) []int {
    if index < 0 || index >= len(slice) {
        return slice // ничего не удаляем
    }
    
    // Копируем часть до индекса и часть после
    return append(slice[:index], slice[index+1:]...)
}

func removeAllEven(slice []int) []int {
    var result []int
    for _, num := range slice {
        if num%2 != 0 {
            result = append(result, num)
        }
    }
    return result
}

func main() {
    numbers := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
    
    // Удаление элемента по индексу
    fmt.Println("Исходный слайс:", numbers)
    numbers = removeElement(numbers, 4) // удаляем число 5
    fmt.Println("После удаления индекса 4:", numbers)
    
    // Удаление всех четных чисел
    numbers = []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
    oddNumbers := removeAllEven(numbers)
    fmt.Println("Только нечетные числа:", oddNumbers)
}
```

#### 2. Вставка элемента в слайс

```go
func insertElement(slice []int, index, value int) []int {
    if index < 0 || index > len(slice) {
        return slice // неверный индекс
    }
    
    // Увеличиваем слайс на один элемент
    slice = append(slice, 0)
    // Сдвигаем элементы вправо
    copy(slice[index+1:], slice[index:])
    // Вставляем значение
    slice[index] = value
    return slice
}

func main() {
    numbers := []int{1, 2, 3, 4, 5}
    fmt.Println("Исходный слайс:", numbers)
    
    // Вставляем 99 на позицию 2
    numbers = insertElement(numbers, 2, 99)
    fmt.Println("После вставки 99 на позицию 2:", numbers)
}
```

#### 3. Сортировка слайсов

```go
import "sort"

func main() {
    // Сортировка целых чисел
    numbers := []int{64, 34, 25, 12, 22, 11, 90}
    sort.Ints(numbers)
    fmt.Println("Отсортированные числа:", numbers)
    
    // Сортировка в обратном порядке
    sort.Sort(sort.Reverse(sort.IntSlice(numbers)))
    fmt.Println("В обратном порядке:", numbers)
    
    // Сортировка строк
    names := []string{"Charlie", "Alice", "Bob"}
    sort.Strings(names)
    fmt.Println("Отсортированные имена:", names)
    
    // Пользовательская сортировка
    type Person struct {
        Name string
        Age  int
    }
    
    people := []Person{
        {"Alice", 30},
        {"Bob", 25},
        {"Charlie", 35},
    }
    
    sort.Slice(people, func(i, j int) bool {
        return people[i].Age < people[j].Age // сортировка по возрасту
    })
    fmt.Println("Отсортировано по возрасту:", people)
}
```

## Карты (Maps)

Карта — это неупорядоченная коллекция пар ключ-значение.

### Объявление карт

```go
// Объявление без инициализации
var scores map[string]int           // nil карта

// Создание с помощью make
scores := make(map[string]int)      // пустая карта
scores := make(map[string]int, 10)  // карта с предварительно выделенной емкостью

// Инициализация литералом
ages := map[string]int{
    "Alice": 25,
    "Bob":   30,
    "Charlie": 35,
}

// Короткое объявление
colors := map[string]string{
    "red":    "#FF0000",
    "green":  "#00FF00",
    "blue":   "#0000FF",
}
```

### Основные операции с картами

```go
func main() {
    // Создание карты
    ages := map[string]int{
        "Alice":   25,
        "Bob":     30,
        "Charlie": 35,
    }
    
    // Добавление элемента
    ages["David"] = 28
    fmt.Println("После добавления David:", ages)
    
    // Получение значения
    age, exists := ages["Alice"]
    if exists {
        fmt.Printf("Возраст Alice: %d\n", age)
    }
    
    // Короткая проверка (если ключа нет, вернется zero value)
    fmt.Printf("Возраст Bob: %d\n", ages["Bob"]) // 30
    fmt.Printf("Возраст Eve: %d\n", ages["Eve"]) // 0 (ключа нет)
    
    // Удаление элемента
    delete(ages, "Charlie")
    fmt.Println("После удаления Charlie:", ages)
    
    // Проверка существования ключа
    if age, ok := ages["Alice"]; ok {
        fmt.Printf("Alice найдена, возраст: %d\n", age)
    } else {
        fmt.Println("Alice не найдена")
    }
}
```

### Итерация по картам

```go
func main() {
    ages := map[string]int{
        "Alice":   25,
        "Bob":     30,
        "Charlie": 35,
        "David":   28,
    }
    
    // Итерация по всем элементам
    fmt.Println("Все жители:")
    for name, age := range ages {
        fmt.Printf("%s: %d лет\n", name, age)
    }
    
    // Только ключи
    fmt.Println("Только имена:")
    for name := range ages {
        fmt.Println(name)
    }
    
    // Только значения
    fmt.Println("Только возраста:")
    for _, age := range ages {
        fmt.Printf("%d лет\n", age)
    }
}
```

### Практические примеры с картами

#### 1. Подсчет частоты слов

```go
import (
    "bufio"
    "fmt"
    "os"
    "strings"
)

func countWords(text string) map[string]int {
    words := strings.Fields(text)
    counts := make(map[string]int)
    
    for _, word := range words {
        // Удаляем знаки препинания
        cleanWord := strings.TrimFunc(word, func(r rune) bool {
            return !unicode.IsLetter(r) && !unicode.IsNumber(r)
        })
        
        // Приводим к нижнему регистру
        cleanWord = strings.ToLower(cleanWord)
        
        if cleanWord != "" {
            counts[cleanWord]++
        }
    }
    
    return counts
}

func main() {
    text := "Go is a great programming language. Go is simple and powerful."
    wordCounts := countWords(text)
    
    fmt.Println("Частота слов:")
    for word, count := range wordCounts {
        fmt.Printf("'%s': %d раз(а)\n", word, count)
    }
}
```

#### 2. Группировка данных

```go
type Student struct {
    Name string
    Grade int
}

func groupByGrade(students []Student) map[int][]Student {
    groups := make(map[int][]Student)
    
    for _, student := range students {
        groups[student.Grade] = append(groups[student.Grade], student)
    }
    
    return groups
}

func main() {
    students := []Student{
        {"Alice", 10},
        {"Bob", 9},
        {"Charlie", 10},
        {"David", 8},
        {"Eve", 9},
    }
    
    groups := groupByGrade(students)
    
    for grade, group := range groups {
        fmt.Printf("Класс %d:\n", grade)
        for _, student := range group {
            fmt.Printf("  - %s\n", student.Name)
        }
    }
}
```

#### 3. Кэш с TTL (время жизни)

```go
import (
    "fmt"
    "time"
)

type Cache struct {
    data map[string]CacheItem
}

type CacheItem struct {
    Value     interface{}
    ExpiresAt time.Time
}

func NewCache() *Cache {
    return &Cache{
        data: make(map[string]CacheItem),
    }
}

func (c *Cache) Set(key string, value interface{}, ttl time.Duration) {
    c.data[key] = CacheItem{
        Value:     value,
        ExpiresAt: time.Now().Add(ttl),
    }
}

func (c *Cache) Get(key string) (interface{}, bool) {
    item, exists := c.data[key]
    if !exists {
        return nil, false
    }
    
    if time.Now().After(item.ExpiresAt) {
        delete(c.data, key)
        return nil, false
    }
    
    return item.Value, true
}

func (c *Cache) Cleanup() {
    now := time.Now()
    for key, item := range c.data {
        if now.After(item.ExpiresAt) {
            delete(c.data, key)
        }
    }
}

func main() {
    cache := NewCache()
    
    // Сохраняем данные с TTL 2 секунды
    cache.Set("user:123", "Alice", 2*time.Second)
    cache.Set("session:abc", "active", 5*time.Second)
    
    // Проверяем сразу
    if value, found := cache.Get("user:123"); found {
        fmt.Printf("Найдено: %v\n", value)
    }
    
    // Ждем 3 секунды и проверяем снова
    time.Sleep(3 * time.Second)
    if _, found := cache.Get("user:123"); !found {
        fmt.Println("user:123 истек")
    }
    
    if value, found := cache.Get("session:abc"); found {
        fmt.Printf("session:abc еще активен: %v\n", value)
    }
}
```

#### 4. Инвертирование карты

```go
func invertMap(original map[string]int) map[int]string {
    inverted := make(map[int]string)
    
    for key, value := range original {
        inverted[value] = key
    }
    
    return inverted
}

func main() {
    original := map[string]int{
        "one":   1,
        "two":   2,
        "three": 3,
    }
    
    inverted := invertMap(original)
    fmt.Println("Исходная карта:", original)
    fmt.Println("Инвертированная карта:", inverted)
}
```

## Сравнение производительности

```go
import "testing"

func BenchmarkArray(b *testing.B) {
    var arr [1000]int
    for i := 0; i < b.N; i++ {
        for j := 0; j < 1000; j++ {
            arr[j] = j
        }
    }
}

func BenchmarkSlice(b *testing.B) {
    slice := make([]int, 1000)
    for i := 0; i < b.N; i++ {
        for j := 0; j < 1000; j++ {
            slice[j] = j
        }
    }
}

func BenchmarkMap(b *testing.B) {
    m := make(map[int]int)
    for i := 0; i < b.N; i++ {
        for j := 0; j < 1000; j++ {
            m[j] = j
        }
    }
}
```

## Упражнения

1. Создайте функцию для поиска уникальных элементов в массиве
2. Реализуйте алгоритм сортировки выбором для слайса
3. Напишите функцию для объединения двух карт
4. Создайте структуру данных "множество" на основе карты
5. Реализуйте кеш LRU (Least Recently Used) с ограниченным размером

В следующем уроке мы изучим структуры и интерфейсы.