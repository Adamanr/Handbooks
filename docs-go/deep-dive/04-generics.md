---
sidebar_position: 4
---

# Дженерики (Generics)

## Введение

Представьте, что вы работаете в кафе и вам нужно написать инструкцию "как нагреть еду в микроволновке". Вы можете написать отдельную инструкцию для пиццы, отдельную для супа, отдельную для пасты... Или можете написать одну универсальную: "положить еду в микроволновку, нагреть 2 минуты". 

Дженерики в программировании — это как раз такие универсальные инструкции. Вместо того чтобы писать один и тот же код для разных типов данных, мы пишем его один раз, а компилятор адаптирует его под нужный тип.

До Go 1.18 (2022 год) в языке не было дженериков, и программистам приходилось либо дублировать код, либо использовать `interface{}` с потерей типобезопасности.

## Проблема, которую решают дженерики

### До дженериков

Допустим, нам нужна функция для нахождения минимального значения. Без дженериков нам придется писать отдельную функцию для каждого типа:

```go
func MinInt(a, b int) int {
    if a < b {
        return a
    }
    return b
}

func MinFloat64(a, b float64) float64 {
    if a < b {
        return a
    }
    return b
}

func MinString(a, b string) string {
    if a < b {
        return a
    }
    return b
}
```

Код дублируется, и если мы захотим добавить новый тип, придется писать еще одну функцию.

Можно было использовать `interface{}`:

```go
func Min(a, b interface{}) interface{} {
    // Но здесь нужно делать type assertion,
    // мы теряем типобезопасность,
    // и это работает медленнее
}
```

### С дженериками

```go
func Min[T constraints.Ordered](a, b T) T {
    if a < b {
        return a
    }
    return b
}

// Использование
result1 := Min(10, 20)           // int
result2 := Min(3.14, 2.71)       // float64
result3 := Min("apple", "banana") // string
```

Один код работает для всех типов, сохраняя типобезопасность и производительность!

## Синтаксис дженериков

### Параметры типа

Параметры типа указываются в квадратных скобках после имени функции или типа:

```go
func FunctionName[T TypeConstraint](param T) T {
    // T - это параметр типа
    // TypeConstraint - это ограничение на тип
}
```

### Ограничения типов (Type Constraints)

Ограничения указывают, какие типы можно использовать. Это интерфейсы, которые описывают требования к типу.

**any** — любой тип (псевдоним для `interface{}`)

```go
func Print[T any](value T) {
    fmt.Println(value)
}
```

**comparable** — типы, которые можно сравнивать с помощью `==` и `!=`

```go
func Contains[T comparable](slice []T, value T) bool {
    for _, item := range slice {
        if item == value {
            return true
        }
    }
    return false
}
```

**constraints.Ordered** — типы, которые можно сравнивать с помощью `<`, `>`, `<=`, `>=`

```go
import "golang.org/x/exp/constraints"

func Max[T constraints.Ordered](a, b T) T {
    if a > b {
        return a
    }
    return b
}
```

### Создание собственных ограничений

Вы можете создавать свои ограничения через интерфейсы:

```go
// Ограничение: тип должен иметь метод String()
type Stringer interface {
    String() string
}

func PrintAll[T Stringer](items []T) {
    for _, item := range items {
        fmt.Println(item.String())
    }
}
```

Можно указать конкретный набор типов:

```go
type Number interface {
    int | int64 | float64 | float32
}

func Sum[T Number](numbers []T) T {
    var sum T
    for _, n := range numbers {
        sum += n
    }
    return sum
}
```

С дополнительным символом `~` можно разрешить и производные типы:

```go
type Number interface {
    ~int | ~int64 | ~float64 | ~float32
}

type MyInt int

// Теперь это работает:
func main() {
    nums := []MyInt{1, 2, 3}
    result := Sum(nums) // MyInt тоже подходит под ~int
}
```

## Дженерик функции

### Простая функция

```go
func Reverse[T any](slice []T) []T {
    result := make([]T, len(slice))
    for i, v := range slice {
        result[len(slice)-1-i] = v
    }
    return result
}

// Использование
ints := []int{1, 2, 3, 4}
reversed := Reverse(ints) // [4, 3, 2, 1]

strings := []string{"a", "b", "c"}
reversed := Reverse(strings) // ["c", "b", "a"]
```

### Несколько параметров типа

```go
func Map[T any, U any](slice []T, fn func(T) U) []U {
    result := make([]U, len(slice))
    for i, v := range slice {
        result[i] = fn(v)
    }
    return result
}

// Использование
numbers := []int{1, 2, 3, 4}
strings := Map(numbers, func(n int) string {
    return fmt.Sprintf("Number: %d", n)
})
// ["Number: 1", "Number: 2", "Number: 3", "Number: 4"]
```

### Функция с несколькими ограничениями

```go
func FindIndex[T comparable](slice []T, value T) int {
    for i, v := range slice {
        if v == value {
            return i
        }
    }
    return -1
}

// Использование
index := FindIndex([]int{10, 20, 30}, 20) // 1
index := FindIndex([]string{"a", "b", "c"}, "b") // 1
```

## Дженерик типы

### Дженерик структуры

```go
type Stack[T any] struct {
    items []T
}

func (s *Stack[T]) Push(item T) {
    s.items = append(s.items, item)
}

func (s *Stack[T]) Pop() (T, bool) {
    if len(s.items) == 0 {
        var zero T
        return zero, false
    }
    index := len(s.items) - 1
    item := s.items[index]
    s.items = s.items[:index]
    return item, true
}

func (s *Stack[T]) IsEmpty() bool {
    return len(s.items) == 0
}

// Использование
intStack := Stack[int]{}
intStack.Push(1)
intStack.Push(2)
value, ok := intStack.Pop() // value = 2, ok = true

stringStack := Stack[string]{}
stringStack.Push("hello")
stringStack.Push("world")
value, ok := stringStack.Pop() // value = "world", ok = true
```

### Дженерик пара (Tuple)

```go
type Pair[T, U any] struct {
    First  T
    Second U
}

func NewPair[T, U any](first T, second U) Pair[T, U] {
    return Pair[T, U]{First: first, Second: second}
}

func (p Pair[T, U]) Swap() Pair[U, T] {
    return Pair[U, T]{First: p.Second, Second: p.First}
}

// Использование
pair := NewPair(42, "answer")
fmt.Println(pair.First)  // 42
fmt.Println(pair.Second) // "answer"

swapped := pair.Swap()
fmt.Println(swapped.First)  // "answer"
fmt.Println(swapped.Second) // 42
```

### Дженерик карта с безопасным доступом

```go
type SafeMap[K comparable, V any] struct {
    mu   sync.RWMutex
    data map[K]V
}

func NewSafeMap[K comparable, V any]() *SafeMap[K, V] {
    return &SafeMap[K, V]{
        data: make(map[K]V),
    }
}

func (m *SafeMap[K, V]) Set(key K, value V) {
    m.mu.Lock()
    defer m.mu.Unlock()
    m.data[key] = value
}

func (m *SafeMap[K, V]) Get(key K) (V, bool) {
    m.mu.RLock()
    defer m.mu.RUnlock()
    value, ok := m.data[key]
    return value, ok
}

func (m *SafeMap[K, V]) Delete(key K) {
    m.mu.Lock()
    defer m.mu.Unlock()
    delete(m.data, key)
}

// Использование
cache := NewSafeMap[string, int]()
cache.Set("count", 42)
value, ok := cache.Get("count") // value = 42, ok = true
```

## Практические примеры

### Дженерик слайс утилиты

```go
// Filter - фильтрует слайс по условию
func Filter[T any](slice []T, predicate func(T) bool) []T {
    result := make([]T, 0)
    for _, item := range slice {
        if predicate(item) {
            result = append(result, item)
        }
    }
    return result
}

// Reduce - сворачивает слайс в одно значение
func Reduce[T, U any](slice []T, initial U, fn func(U, T) U) U {
    result := initial
    for _, item := range slice {
        result = fn(result, item)
    }
    return result
}

// Использование
numbers := []int{1, 2, 3, 4, 5, 6}

// Только четные числа
evens := Filter(numbers, func(n int) bool {
    return n%2 == 0
}) // [2, 4, 6]

// Сумма всех чисел
sum := Reduce(numbers, 0, func(acc, n int) int {
    return acc + n
}) // 21
```

### Дженерик Optional (аналог Rust/Java)

```go
type Optional[T any] struct {
    value *T
}

func Some[T any](value T) Optional[T] {
    return Optional[T]{value: &value}
}

func None[T any]() Optional[T] {
    return Optional[T]{value: nil}
}

func (o Optional[T]) IsPresent() bool {
    return o.value != nil
}

func (o Optional[T]) Get() (T, bool) {
    if o.value == nil {
        var zero T
        return zero, false
    }
    return *o.value, true
}

func (o Optional[T]) OrElse(defaultValue T) T {
    if o.value == nil {
        return defaultValue
    }
    return *o.value
}

// Использование
func FindUser(id int) Optional[string] {
    if id == 1 {
        return Some("Alice")
    }
    return None[string]()
}

user := FindUser(1)
if user.IsPresent() {
    name, _ := user.Get()
    fmt.Println(name) // "Alice"
}

unknown := FindUser(999)
name := unknown.OrElse("Guest") // "Guest"
```

### Дженерик Result (обработка ошибок как в Rust)

```go
type Result[T any] struct {
    value T
    err   error
}

func Ok[T any](value T) Result[T] {
    return Result[T]{value: value}
}

func Err[T any](err error) Result[T] {
    return Result[T]{err: err}
}

func (r Result[T]) IsOk() bool {
    return r.err == nil
}

func (r Result[T]) Unwrap() (T, error) {
    return r.value, r.err
}

func (r Result[T]) UnwrapOr(defaultValue T) T {
    if r.err != nil {
        return defaultValue
    }
    return r.value
}

// Использование
func Divide(a, b float64) Result[float64] {
    if b == 0 {
        return Err[float64](errors.New("division by zero"))
    }
    return Ok(a / b)
}

result := Divide(10, 2)
if result.IsOk() {
    value, _ := result.Unwrap()
    fmt.Println(value) // 5.0
}

result = Divide(10, 0)
value := result.UnwrapOr(0.0) // 0.0
```

## Ограничения и нюансы

### Нельзя использовать операторы без ограничений

```go
// Это НЕ скомпилируется
func Add[T any](a, b T) T {
    return a + b // ошибка: оператор + не определен для any
}

// Правильно: нужно ограничение
type Number interface {
    int | int64 | float64 | float32
}

func Add[T Number](a, b T) T {
    return a + b // работает!
}
```

### Нельзя создавать новые экземпляры типа T

```go
// Это НЕ работает
func Create[T any]() T {
    return new(T) // ошибка компиляции
}

// Обходной путь: передать функцию-конструктор
func Create[T any](constructor func() T) T {
    return constructor()
}
```

### Методы не могут иметь параметры типа

```go
type Container struct{}

// Это НЕ работает
func (c Container) Add[T any](item T) {
    // Методы не могут иметь собственные параметры типа
}

// Правильно: параметр типа на уровне структуры
type Container[T any] struct {
    items []T
}

func (c *Container[T]) Add(item T) {
    c.items = append(c.items, item)
}
```

## Производительность

Дженерики в Go работают через **мономорфизацию** — компилятор генерирует отдельный код для каждого используемого типа. Это означает:

✅ Производительность такая же, как у обычного кода
✅ Нет overhead во время выполнения
❌ Размер бинарника может немного увеличиться

Сравнение с interface{}:

```go
// С interface{} - медленнее из-за type assertion и boxing
func SumInterface(numbers []interface{}) int {
    sum := 0
    for _, n := range numbers {
        sum += n.(int) // type assertion на каждой итерации
    }
    return sum
}

// С дженериками - быстрее, compile-time проверки
func SumGeneric[T constraints.Integer](numbers []T) T {
    var sum T
    for _, n := range numbers {
        sum += n
    }
    return sum
}
```

## Когда использовать дженерики?

### ✅ Хорошие случаи

- **Структуры данных**: Stack, Queue, LinkedList, Tree
- **Утилиты для слайсов и мапов**: Filter, Map, Reduce
- **Математические функции**: Min, Max, Sum
- **Контейнеры**: Optional, Result, Either
- **Код, который работает с разными типами одинаково**

### ❌ Плохие случаи

- Когда обычный код проще и понятнее
- Когда типы имеют разное поведение (лучше использовать интерфейсы)
- Для бизнес-логики, специфичной для конкретного типа
- Когда дженерики усложняют код без реальной пользы

### Правило большого пальца

Используйте дженерики, когда пишете один и тот же код для разных типов. Если код специфичен для типа — используйте обычные функции или интерфейсы.

## Заключение

Дженерики в Go — это мощный инструмент для написания переиспользуемого, типобезопасного кода. Основные моменты:

- Дженерики появились в Go 1.18 (2022)
- Синтаксис: `[T Constraint]` для параметров типа
- Ограничения (constraints) определяют, какие типы можно использовать
- Производительность такая же, как у обычного кода
- Используйте разумно: не везде нужны дженерики

Дженерики не заменяют интерфейсы — это разные инструменты для разных задач. Интерфейсы для полиморфизма во время выполнения, дженерики для переиспользования кода во время компиляции.