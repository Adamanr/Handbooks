---
sidebar_position: 4
---

# Условные конструкции и циклы

## Условные конструкции

### Оператор if

```go
// Базовый синтаксис
if condition {
    // код выполняется, если condition истинно
}

// С else
if condition {
    // код если condition истинно
} else {
    // код если condition ложно
}

// С else if
if condition1 {
    // код если condition1 истинно
} else if condition2 {
    // код если condition2 истинно
} else {
    // код если все условия ложны
}
```

### Примеры использования if

```go
func checkAge(age int) {
    if age < 0 {
        fmt.Println("Возраст не может быть отрицательным")
    } else if age < 18 {
        fmt.Println("Несовершеннолетний")
    } else if age >= 18 && age < 65 {
        fmt.Println("Взрослый")
    } else {
        fmt.Println("Пенсионер")
    }
}

func main() {
    checkAge(16) // Несовершеннолетний
    checkAge(25) // Взрослый
    checkAge(70) // Пенсионер
}
```

### Короткое объявление в if

Go позволяет объявлять переменные прямо в условии:

```go
func checkNumber(num int) {
    if v := num * 2; v > 10 {
        fmt.Printf("Удвоенное число %d больше 10: %d", num, v)
    } else {
        fmt.Printf("Удвоенное число %d не больше 10: %d", num, v)
    }
}

// Проверка ошибки
func divide(a, b float64) (float64, error) {
    if result, err := a / b; err != nil {
        return 0, fmt.Errorf("ошибка деления: %v", err)
    } else {
        return result, nil
    }
}
```

### Оператор switch

```go
switch variable {
case value1:
    // код для value1
case value2:
    // код для value2
case value3, value4: // несколько значений
    // код для value3 или value4
default:
    // код если ни один case не подошел
}
```

### Примеры switch

```go
func getDayName(day int) string {
    switch day {
    case 1:
        return "Понедельник"
    case 2:
        return "Вторник"
    case 3:
        return "Среда"
    case 4:
        return "Четверг"
    case 5:
        return "Пятница"
    case 6:
        return "Суббота"
    case 7:
        return "Воскресенье"
    default:
        return "Неверный день недели"
    }
}

// switch без переменной
func gradeToText(grade int) {
    switch {
    case grade >= 90:
        fmt.Println("Отлично")
    case grade >= 75:
        fmt.Println("Хорошо")
    case grade >= 60:
        fmt.Println("Удовлетворительно")
    default:
        fmt.Println("Неудовлетворительно")
    }
}

// fallthrough - принудительный переход к следующему case
func checkValue(x int) {
    switch {
    case x > 0:
        fmt.Println("Положительное")
        fallthrough
    case x >= 0:
        fmt.Println("Неотрицательное")
    }
}
```

## Циклы

### Оператор for

В Go есть только один оператор цикла — `for`, но он очень гибкий.

### Классический цикл for

```go
// Базовая форма
for i := 0; i < 10; i++ {
    fmt.Println(i)
}

// Без инициализации и инкремента
i := 0
for i < 10 {
    fmt.Println(i)
    i++
}

// Бесконечный цикл
for {
    fmt.Println("Бесконечный цикл")
    break // выйти из цикла
}
```

### Цикл for range

Используется для итерации по коллекциям:

```go
// Массивы и слайсы
numbers := []int{1, 2, 3, 4, 5}
for index, value := range numbers {
    fmt.Printf("Индекс: %d, Значение: %d", index, value)
}

// Только значения
for _, value := range numbers {
    fmt.Println(value)
}

// Только индексы
for index := range numbers {
    fmt.Println(index)
}

// Строки
text := "Привет"
for index, char := range text {
    fmt.Printf("Индекс: %d, Символ: %c", index, char)
}

// Карты
person := map[string]int{
    "Alice": 25,
    "Bob": 30,
    "Charlie": 35,
}
for name, age := range person {
    fmt.Printf("%s: %d лет", name, age)
}
```

### Примеры использования циклов

#### 1. Поиск максимального числа

```go
func findMax(numbers []int) int {
    if len(numbers) == 0 {
        return 0
    }
    
    max := numbers[0]
    for _, num := range numbers {
        if num > max {
            max = num
        }
    }
    return max
}

func main() {
    numbers := []int{3, 7, 2, 9, 1, 8}
    fmt.Printf("Максимальное число: %d", findMax(numbers))
}
```

#### 2. Фильтрация данных

```go
func filterEvenNumbers(numbers []int) []int {
    var evenNumbers []int
    for _, num := range numbers {
        if num%2 == 0 {
            evenNumbers = append(evenNumbers, num)
        }
    }
    return evenNumbers
}

func filterByLength(strings []string, minLength int) []string {
    var filtered []string
    for _, str := range strings {
        if len(str) >= minLength {
            filtered = append(filtered, str)
        }
    }
    return filtered
}

func main() {
    numbers := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
    words := []string{"go", "python", "java", "rust", "c", "javascript"}
    
    even := filterEvenNumbers(numbers)
    fmt.Println("Четные числа:", even)
    
    longWords := filterByLength(words, 4)
    fmt.Println("Слова длиннее 3 символов:", longWords)
}
```

#### 3. Работа с матрицами

```go
func printMatrix(matrix [][]int) {
    for i := range matrix {
        for j := range matrix[i] {
            fmt.Printf("%d ", matrix[i][j])
        }
        fmt.Println()
    }
}

func transposeMatrix(matrix [][]int) [][]int {
    rows := len(matrix)
    cols := len(matrix[0])
    
    result := make([][]int, cols)
    for i := range result {
        result[i] = make([]int, rows)
    }
    
    for i := 0; i < rows; i++ {
        for j := 0; j < cols; j++ {
            result[j][i] = matrix[i][j]
        }
    }
    return result
}

func main() {
    matrix := [][]int{
        {1, 2, 3},
        {4, 5, 6},
    }
    
    fmt.Println("Исходная матрица:")
    printMatrix(matrix)
    
    transposed := transposeMatrix(matrix)
    fmt.Println("Транспонированная матрица:")
    printMatrix(transposed)
}
```

#### 4. Генерация простых чисел

```go
func isPrime(n int) bool {
    if n < 2 {
        return false
    }
    for i := 2; i*i <= n; i++ {
        if n%i == 0 {
            return false
        }
    }
    return true
}

func generatePrimes(limit int) []int {
    var primes []int
    for i := 2; i <= limit; i++ {
        if isPrime(i) {
            primes = append(primes, i)
        }
    }
    return primes
}

func main() {
    primes := generatePrimes(50)
    fmt.Printf("Простые числа до 50: %v", primes)
}
```

#### 5. Статистика по массиву

```go
type Stats struct {
    Sum     int
    Average float64
    Min     int
    Max     int
}

func calculateStats(numbers []int) Stats {
    if len(numbers) == 0 {
        return Stats{}
    }
    
    sum := 0
    min := numbers[0]
    max := numbers[0]
    
    for _, num := range numbers {
        sum += num
        if num < min {
            min = num
        }
        if num > max {
            max = num
        }
    }
    
    average := float64(sum) / float64(len(numbers))
    
    return Stats{
        Sum:     sum,
        Average: average,
        Min:     min,
        Max:     max,
    }
}

func main() {
    numbers := []int{5, 12, 8, 3, 15, 9, 1, 20}
    stats := calculateStats(numbers)
    
    fmt.Printf("Статистика: %+v", stats)
}
```

## Операторы управления циклами

### break и continue

```go
// break - выход из цикла
func findFirstEven(numbers []int) int {
    for _, num := range numbers {
        if num%2 == 0 {
            return num
        }
    }
    return -1
}

// continue - переход к следующей итерации
func countEvenOdd(numbers []int) (evenCount, oddCount int) {
    for _, num := range numbers {
        if num%2 != 0 {
            continue // пропускаем нечетные числа
        }
        if num > 0 {
            evenCount++
        }
    }
    return
}

// break с меткой
func findInMatrix(matrix [][]int, target int) (bool, int, int) {
    for i := range matrix {
        for j := range matrix[i] {
            if matrix[i][j] == target {
                return true, i, j
            }
        }
    }
    return false, -1, -1
}
```

## Практические задачи

### 1. Игра "Угадай число"

```go
func guessNumberGame() {
    target := 42
    attempts := 0
    
    fmt.Println("Угадайте число от 1 до 100")
    
    for attempts < 7 {
        var guess int
        fmt.Print("Введите ваше предположение: ")
        fmt.Scanln(&guess)
        attempts++
        
        if guess == target {
            fmt.Printf("Поздравляю! Вы угадали число %d за %d попыток!", target, attempts)
            return
        } else if guess < target {
            fmt.Println("Загаданное число больше")
        } else {
            fmt.Println("Загаданное число меньше")
        }
    }
    
    fmt.Printf("Игра окончена. Загаданное число было: %d", target)
}
```

### 2. Симуляция банковского счета

```go
type Transaction struct {
    Type  string  // "deposit" или "withdraw"
    Amount float64
}

type BankAccount struct {
    Balance   float64
    History   []Transaction
}

func (acc *BankAccount) Deposit(amount float64) {
    if amount <= 0 {
        fmt.Println("Сумма депозита должна быть положительной")
        return
    }
    
    acc.Balance += amount
    acc.History = append(acc.History, Transaction{
        Type:   "deposit",
        Amount: amount,
    })
    fmt.Printf("Депозит: +%.2f, Баланс: %.2f", amount, acc.Balance)
}

func (acc *BankAccount) Withdraw(amount float64) {
    if amount <= 0 {
        fmt.Println("Сумма снятия должна быть положительной")
        return
    }
    
    if amount > acc.Balance {
        fmt.Println("Недостаточно средств на счете")
        return
    }
    
    acc.Balance -= amount
    acc.History = append(acc.History, Transaction{
        Type:   "withdraw",
        Amount: amount,
    })
    fmt.Printf("Снятие: -%.2f, Баланс: %.2f", amount, acc.Balance)
}

func (acc BankAccount) PrintHistory() {
    fmt.Println("История операций:")
    for i, t := range acc.History {
        sign := "+"
        if t.Type == "withdraw" {
            sign = "-"
        }
        fmt.Printf("%d. %s: %s%.2f", i+1, t.Type, sign, t.Amount)
    }
}

func main() {
    account := BankAccount{Balance: 1000}
    
    account.Deposit(500)
    account.Withdraw(200)
    account.Deposit(100)
    account.Withdraw(800) // недостаточно средств
    
    account.PrintHistory()
    fmt.Printf("Итоговый баланс: %.2f", account.Balance)
}
```

## Упражнения

1. Напишите программу, которая выводит таблицу умножения
2. Создайте функцию для проверки, является ли число совершенным
3. Реализуйте игру "Камень, ножницы, бумага" с компьютером
4. Напишите функцию для сортировки массива методом пузырька
5. Создайте программу для подсчета частоты символов в строке

В следующем уроке мы изучим массивы, слайсы и карты.