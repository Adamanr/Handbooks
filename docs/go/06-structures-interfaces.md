---
sidebar_position: 6
---

# Структуры и интерфейсы

## Структуры (Structures)

Структура — это составной тип данных, который группирует связанные переменные (поля) под одним именем.

### Объявление структур

```go
// Базовое объявление структуры
type Person struct {
    Name string
    Age  int
    City string
}

// Структура с разными типами данных
type Employee struct {
    ID       int
    Name     string
    Position string
    Salary   float64
    IsActive bool
}

// Вложенные структуры
type Address struct {
    Street  string
    City    string
    Country string
}

type PersonWithAddress struct {
    Name    string
    Age     int
    Address Address
}
```

### Создание экземпляров структур

```go
func main() {
    // Создание с явным указанием всех полей
    person1 := Person{
        Name: "Alice",
        Age:  30,
        City: "Moscow",
    }
    
    // Создание с частичным заполнением (остальные поля - zero values)
    person2 := Person{
        Name: "Bob",
        Age:  25,
        // City будет пустой строкой ""
    }
    
    // Короткое создание (в порядке объявления полей)
    person3 := Person{"Charlie", 35, "St. Petersburg"}
    
    // Создание с помощью new (возвращает указатель)
    person4 := new(Person)
    person4.Name = "Diana"
    person4.Age = 28
    
    // Zero value структура
    var person5 Person
    
    fmt.Println(person1)
    fmt.Printf("Имя: %s, Возраст: %d\n", person2.Name, person2.Age)
    fmt.Println("Person4:", *person4)
}
```

### Работа с полями структур

```go
func main() {
    person := Person{Name: "Alice", Age: 30, City: "Moscow"}
    
    // Доступ к полям
    fmt.Println("Имя:", person.Name)
    fmt.Println("Возраст:", person.Age)
    fmt.Println("Город:", person.City)
    
    // Изменение полей
    person.Age = 31
    person.City = "St. Petersburg"
    
    // Инициализация указателя на структуру
    personPtr := &person
    fmt.Println("Через указатель - Имя:", personPtr.Name)
    fmt.Println("Через указатель - Имя:", (*personPtr).Name) // эквивалентно
    
    // Go автоматически разыменовывает указатели при доступе к полям
    personPtr.Age = 32 // эквивалентно (*personPtr).Age = 32
}
```

### Методы структур

```go
// Определение структуры
type Rectangle struct {
    Width  float64
    Height float64
}

// Метод с value receiver (копирует структуру)
func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

// Метод с pointer receiver (работает с оригиналом)
func (r *Rectangle) Scale(factor float64) {
    r.Width *= factor
    r.Height *= factor
}

// Метод, который может изменять структуру
func (r *Rectangle) Resize(newWidth, newHeight float64) {
    r.Width = newWidth
    r.Height = newHeight
}

// Метод с несколькими возвращаемыми значениями
func (r Rectangle) Perimeter() float64 {
    return 2 * (r.Width + r.Height)
}

func (r Rectangle) IsSquare() bool {
    return r.Width == r.Height
}

func main() {
    rect := Rectangle{Width: 10, Height: 5}
    
    fmt.Printf("Прямоугольник: %.2f x %.2f\n", rect.Width, rect.Height)
    fmt.Printf("Площадь: %.2f\n", rect.Area())
    fmt.Printf("Периметр: %.2f\n", rect.Perimeter())
    fmt.Printf("Это квадрат: %t\n", rect.IsSquare())
    
    // Изменение через метод
    rect.Scale(2)
    fmt.Printf("После масштабирования x2: %.2f x %.2f\n", rect.Width, rect.Height)
    
    rect.Resize(15, 15)
    fmt.Printf("После изменения 15x15: %.2f x %.2f\n", rect.Width, rect.Height)
    fmt.Printf("Это квадрат: %t\n", rect.IsSquare())
}
```

### Анонимные структуры

```go
func main() {
    // Анонимная структура
    person := struct {
        Name string
        Age  int
    }{
        Name: "Alice",
        Age:  30,
    }
    
    fmt.Println("Анонимная структура:", person)
    
    // Анонимная структура как параметр функции
    processPerson(struct {
        Name string
        Age  int
        City string
    }{
        Name: "Bob",
        Age:  25,
        City: "Moscow",
    })
}

func processPerson(p struct {
    Name string
    Age  int
    City string
}) {
    fmt.Printf("Обработка персоны: %s, %d лет, %s\n", p.Name, p.Age, p.City)
}
```

### Сравнение структур

```go
type Point struct {
    X, Y int
}

func main() {
    p1 := Point{X: 1, Y: 2}
    p2 := Point{X: 1, Y: 2}
    p3 := Point{X: 2, Y: 1}
    
    fmt.Println("p1 == p2:", p1 == p2) // true
    fmt.Println("p1 == p3:", p1 == p3) // false
    
    // Сравнение указателей на структуры
    ptr1 := &p1
    ptr2 := &p1
    ptr3 := &p3
    
    fmt.Println("ptr1 == ptr2:", ptr1 == ptr2) // true (указывают на одну структуру)
    fmt.Println("ptr1 == ptr3:", ptr1 == ptr3) // false (разные структуры)
}
```

## Интерфейсы

Интерфейс — это набор сигнатур методов. Тип реализует интерфейс, если он реализует все методы интерфейса.

### Базовые интерфейсы

```go
// Определение интерфейса
type Shape interface {
    Area() float64
    Perimeter() float64
}

// Структура, реализующая интерфейс
type Circle struct {
    Radius float64
}

func (c Circle) Area() float64 {
    return math.Pi * c.Radius * c.Radius
}

func (c Circle) Perimeter() float64 {
    return 2 * math.Pi * c.Radius
}

// Другая структура, реализующая тот же интерфейс
type Rectangle struct {
    Width, Height float64
}

func (r Rectangle) Area() float64 {
    return r.Width * r.Height
}

func (r Rectangle) Perimeter() float64 {
    return 2 * (r.Width + r.Height)
}

func main() {
    // Использование интерфейса
    var shape1 Shape = Circle{Radius: 5}
    var shape2 Shape = Rectangle{Width: 4, Height: 3}
    
    fmt.Printf("Круг - Площадь: %.2f, Периметр: %.2f\n", 
        shape1.Area(), shape1.Perimeter())
    
    fmt.Printf("Прямоугольник - Площадь: %.2f, Периметр: %.2f\n", 
        shape2.Area(), shape2.Perimeter())
    
    // Массив интерфейсов
    shapes := []Shape{
        Circle{Radius: 3},
        Rectangle{Width: 4, Height: 5},
        Circle{Radius: 2.5},
    }
    
    fmt.Println("Все фигуры:")
    for i, shape := range shapes {
        fmt.Printf("%d: Площадь = %.2f\n", i+1, shape.Area())
    }
}
```

### Пустой интерфейс

Пустой интерфейс `interface{}` может хранить значение любого типа.

```go
func main() {
    // Пустой интерфейс может хранить любой тип
    var any1 interface{} = 42
    var any2 interface{} = "Hello"
    var any3 interface{} = []int{1, 2, 3}
    var any4 interface{} = Person{Name: "Alice", Age: 30}
    
    fmt.Println("any1:", any1)
    fmt.Println("any2:", any2)
    fmt.Println("any3:", any3)
    fmt.Println("any4:", any4)
    
    // Функция, принимающая пустой интерфейс
    printValue(any1)
    printValue(any2)
    printValue(any3)
}

func printValue(v interface{}) {
    fmt.Printf("Тип: %T, Значение: %v\n", v, v)
}
```

### Проверка типа с пустым интерфейсом

```go
func main() {
    values := []interface{}{
        42,
        "Hello",
        3.14,
        true,
        []int{1, 2, 3},
        Person{Name: "Alice", Age: 30},
    }
    
    for _, v := range values {
        printTypeInfo(v)
    }
}

func printTypeInfo(v interface{}) {
    switch value := v.(type) {
    case int:
        fmt.Printf("Целое число: %d\n", value)
    case string:
        fmt.Printf("Строка: %s\n", value)
    case float64:
        fmt.Printf("Число с плавающей точкой: %.2f\n", value)
    case bool:
        fmt.Printf("Логическое значение: %t\n", value)
    case []int:
        fmt.Printf("Массив целых чисел: %v\n", value)
    case Person:
        fmt.Printf("Персона: %s, %d лет\n", value.Name, value.Age)
    default:
        fmt.Printf("Неизвестный тип: %T\n", value)
    }
}
```

### Интерфейс с несколькими методами

```go
// Интерфейс для фигур с дополнительными возможностями
type AdvancedShape interface {
    Area() float64
    Perimeter() float64
    
    // Дополнительные методы
    BoundingBox() (width, height float64)
    Scale(factor float64)
}

// Треугольник
type Triangle struct {
    A, B, C [2]float64 // координаты вершин
}

func (t Triangle) Area() float64 {
    // Формула Герона
    a := distance(t.A, t.B)
    b := distance(t.B, t.C)
    c := distance(t.C, t.A)
    s := (a + b + c) / 2
    return math.Sqrt(s * (s - a) * (s - b) * (s - c))
}

func (t Triangle) Perimeter() float64 {
    a := distance(t.A, t.B)
    b := distance(t.B, t.C)
    c := distance(t.C, t.A)
    return a + b + c
}

func (t Triangle) BoundingBox() (width, height float64) {
    minX, maxX := t.A[0], t.A[0]
    minY, maxY := t.A[1], t.A[1]
    
    for _, point := range [] [2]float64{t.B, t.C} {
        if point[0] < minX {
            minX = point[0]
        }
        if point[0] > maxX {
            maxX = point[0]
        }
        if point[1] < minY {
            minY = point[1]
        }
        if point[1] > maxY {
            maxY = point[1]
        }
    }
    
    return maxX - minX, maxY - minY
}

func (t *Triangle) Scale(factor float64) {
    // Масштабирование относительно начала координат
    for i := range t.A {
        t.A[i][0] *= factor
        t.A[i][1] *= factor
    }
    for i := range t.B {
        t.B[i][0] *= factor
        t.B[i][1] *= factor
    }
    for i := range t.C {
        t.C[i][0] *= factor
        t.C[i][1] *= factor
    }
}

// Вспомогательная функция для вычисления расстояния
func distance(p1, p2 [2]float64) float64 {
    dx := p2[0] - p1[0]
    dy := p2[1] - p1[1]
    return math.Sqrt(dx*dx + dy*dy)
}

func main() {
    triangle := Triangle{
        A: [2]float64{0, 0},
        B: [2]float64{4, 0},
        C: [2]float64{2, 3},
    }
    
    var shape AdvancedShape = triangle
    
    fmt.Printf("Треугольник - Площадь: %.2f, Периметр: %.2f\n", 
        shape.Area(), shape.Perimeter())
    
    width, height := shape.BoundingBox()
    fmt.Printf("Ограничивающий прямоугольник: %.2f x %.2f\n", width, height)
    
    shape.Scale(2)
    fmt.Printf("После масштабирования x2 - Площадь: %.2f\n", shape.Area())
}
```

### Встраивание интерфейсов

```go
// Базовый интерфейс
type Writer interface {
    Write([]byte) (int, error)
}

// Дополнительный интерфейс
type Flusher interface {
    Flush() error
}

// Комбинированный интерфейс
type WriterFlusher interface {
    Writer
    Flusher
}

// Реализация комбинированного интерфейса
type MyWriter struct {
    buffer []byte
}

func (w *MyWriter) Write(data []byte) (int, error) {
    w.buffer = append(w.buffer, data...)
    return len(data), nil
}

func (w *MyWriter) Flush() error {
    fmt.Printf("Содержимое буфера: %s\n", string(w.buffer))
    w.buffer = []byte{} // очищаем буфер
    return nil
}

func main() {
    var wf WriterFlusher = &MyWriter{}
    
    wf.Write([]byte("Hello, "))
    wf.Write([]byte("World!"))
    wf.Flush()
    
    // Можно использовать как Writer
    var writer Writer = wf
    writer.Write([]byte("Test"))
    
    // Можно использовать как Flusher
    var flusher Flusher = wf
    flusher.Flush()
}
```

### Полиморфизм с интерфейсами

```go
// Интерфейс для фигур, которые можно нарисовать
type Drawable interface {
    Draw()
}

// Различные типы, реализующие интерфейс
type Circle struct {
    X, Y, Radius float64
    Color        string
}

func (c Circle) Draw() {
    fmt.Printf("Рисуем круг в (%.1f, %.1f) радиусом %.1f, цвет: %s\n", 
        c.X, c.Y, c.Radius, c.Color)
}

type Rectangle struct {
    X, Y, Width, Height float64
    Color               string
}

func (r Rectangle) Draw() {
    fmt.Printf("Рисуем прямоугольник в (%.1f, %.1f) размером %.1fx%.1f, цвет: %s\n", 
        r.X, r.Y, r.Width, r.Height, r.Color)
}

type Text struct {
    X, Y        float64
    Content     string
    FontSize    int
    Color       string
}

func (t Text) Draw() {
    fmt.Printf("Рисуем текст '%s' в (%.1f, %.1f), размер %d, цвет: %s\n", 
        t.Content, t.X, t.Y, t.FontSize, t.Color)
}

// Функция, работающая с любыми Drawable
func DrawAll(shapes []Drawable) {
    fmt.Println("=== Рисуем все фигуры ===")
    for i, shape := range shapes {
        fmt.Printf("%d. ", i+1)
        shape.Draw()
    }
    fmt.Println("=== Завершено ===")
}

func main() {
    shapes := []Drawable{
        Circle{X: 10, Y: 10, Radius: 5, Color: "red"},
        Rectangle{X: 20, Y: 20, Width: 10, Height: 6, Color: "blue"},
        Text{X: 5, Y: 5, Content: "Hello, World!", FontSize: 16, Color: "black"},
        Circle{X: 50, Y: 50, Radius: 8, Color: "green"},
    }
    
    DrawAll(shapes)
    
    // Фильтрация по типу
    var circles []Drawable
    var rectangles []Drawable
    
    for _, shape := range shapes {
        switch shape.(type) {
        case Circle:
            circles = append(circles, shape)
        case Rectangle:
            rectangles = append(rectangles, shape)
        }
    }
    
    fmt.Println("\nТолько круги:")
    DrawAll(circles)
    
    fmt.Println("\nТолько прямоугольники:")
    DrawAll(rectangles)
}
```

### Обработка ошибок с интерфейсами

```go
// Интерфейс для ошибок
type Error interface {
    Error() string
    Code() int
}

// Конкретная реализация ошибки
type ValidationError struct {
    Message string
    Code    int
    Field   string
}

func (e ValidationError) Error() string {
    return fmt.Sprintf("Ошибка валидации в поле '%s': %s", e.Field, e.Message)
}

func (e ValidationError) Code() int {
    return e.Code
}

// Другая реализация ошибки
type DatabaseError struct {
    Message string
    Code    int
    Query   string
}

func (e DatabaseError) Error() string {
    return fmt.Sprintf("Ошибка базы данных при выполнении запроса '%s': %s", e.Query, e.Message)
}

func (e DatabaseError) Code() int {
    return e.Code
}

// Функция, возвращающая различные типы ошибок
func validateAge(age int) error {
    if age < 0 {
        return ValidationError{
            Message: "возраст не может быть отрицательным",
            Code:    1001,
            Field:   "age",
        }
    }
    if age > 150 {
        return ValidationError{
            Message: "возраст не может превышать 150 лет",
            Code:    1002,
            Field:   "age",
        }
    }
    return nil
}

func executeQuery(query string) error {
    if query == "" {
        return ValidationError{
            Message: "запрос не может быть пустым",
            Code:    2001,
            Field:   "query",
        }
    }
    // Симуляция ошибки базы данных
    if query == "DROP TABLE users;" {
        return DatabaseError{
            Message: "операция запрещена",
            Code:    5001,
            Query:   query,
        }
    }
    return nil
}

// Обработка ошибок
func processError(err error) {
    if err == nil {
        fmt.Println("Ошибок нет")
        return
    }
    
    // Проверка типа ошибки
    switch e := err.(type) {
    case ValidationError:
        fmt.Printf("Ошибка валидации [код %d]: %s\n", e.Code(), e.Error())
        fmt.Printf("Проблемное поле: %s\n", e.Field)
    case DatabaseError:
        fmt.Printf("Ошибка базы данных [код %d]: %s\n", e.Code(), e.Error())
        fmt.Printf("Проблемный запрос: %s\n", e.Query)
    default:
        fmt.Printf("Неизвестная ошибка: %v\n", err)
    }
}

func main() {
    // Тестирование различных сценариев
    testCases := []struct {
        age   int
        query string
    }{
        {-5, "SELECT * FROM users"},
        {25, ""},
        {25, "SELECT * FROM users"},
        {200, "SELECT * FROM users"},
        {30, "DROP TABLE users;"},
    }
    
    for i, tc := range testCases {
        fmt.Printf("\n=== Тест %d ===\n", i+1)
        
        // Проверка возраста
        if err := validateAge(tc.age); err != nil {
            fmt.Printf("Ошибка валидации возраста: ")
            processError(err)
        } else {
            fmt.Println("Возраст корректен")
        }
        
        // Выполнение запроса
        if err := executeQuery(tc.query); err != nil {
            fmt.Printf("Ошибка выполнения запроса: ")
            processError(err)
        } else {
            fmt.Println("Запрос выполнен успешно")
        }
    }
}
```

## Композиция vs наследование

Go не поддерживает наследование, но поддерживает композицию через встраивание структур.

### Встраивание структур

```go
// Базовая структура
type Person struct {
    Name string
    Age  int
}

// Структура, которая "наследует" от Person
type Employee struct {
    Person    // встраивание - аналог наследования
    Position  string
    Salary    float64
    EmployeeID int
}

// Методы базовой структуры доступны в производной
func (p Person) Greet() string {
    return fmt.Sprintf("Привет, меня зовут %s, мне %d лет", p.Name, p.Age)
}

// Метод производной структуры
func (e Employee) Work() string {
    return fmt.Sprintf("%s работает как %s", e.Name, e.Position)
}

// Переопределение метода
func (e Employee) Greet() string {
    return fmt.Sprintf("Привет, меня зовут %s, мне %d лет, я работаю %s", 
        e.Name, e.Age, e.Position)
}

func main() {
    // Создание Employee
    emp := Employee{
        Person: Person{
            Name: "Alice",
            Age:  30,
        },
        Position:  "Разработчик",
        Salary:    75000.0,
        EmployeeID: 12345,
    }
    
    fmt.Println(emp.Greet())     // Вызывает переопределенный метод
    fmt.Println(emp.Person.Greet()) // Вызывает метод базовой структуры
    fmt.Println(emp.Work())
    
    // Доступ к встроенным полям
    fmt.Printf("Имя: %s\n", emp.Name)       // обращение к встроенному полю
    fmt.Printf("Имя через Person: %s\n", emp.Person.Name)
}
```

### Интерфейсы и композиция

```go
// Интерфейс для животных
type Animal interface {
    MakeSound() string
    Move() string
}

// Базовая структура животного
type BaseAnimal struct {
    Name string
    Species string
}

func (a BaseAnimal) Move() string {
    return fmt.Sprintf("%s движется", a.Name)
}

// Конкретные животные
type Dog struct {
    BaseAnimal // композиция
}

func (d Dog) MakeSound() string {
    return fmt.Sprintf("%s говорит: Гав!", d.Name)
}

type Cat struct {
    BaseAnimal // композиция
}

func (c Cat) MakeSound() string {
    return fmt.Sprintf("%s говорит: Мяу!", c.Name)
}

type Bird struct {
    BaseAnimal // композиция
}

func (b Bird) MakeSound() string {
    return fmt.Sprintf("%s поет: Чирик-чик!", b.Name)
}

func (b Bird) Move() string {
    return fmt.Sprintf("%s летает", b.Name) // переопределение
}

// Функция, работающая с любыми животными
func MakeAnimalsTalk(animals []Animal) {
    for _, animal := range animals {
        fmt.Printf("%s (%s): %s. %s.\n", 
            animal.GetName(), animal.GetSpecies(), 
            animal.MakeSound(), animal.Move())
    }
}

// Расширение интерфейса Animal
type FlyingAnimal interface {
    Animal
    Fly() string
}

// Добавление метода в базовую структуру через интерфейс
func (a BaseAnimal) GetName() string {
    return a.Name
}

func (a BaseAnimal) GetSpecies() string {
    return a.Species
}

// Птица реализует расширенный интерфейс
func (b Bird) Fly() string {
    return fmt.Sprintf("%s взлетает в небо", b.Name)
}

func main() {
    animals := []Animal{
        Dog{BaseAnimal{Name: "Рекс", Species: "Собака"}},
        Cat{BaseAnimal{Name: "Мурка", Species: "Кошка"}},
        Bird{BaseAnimal{Name: "Чижик", Species: "Птица"}},
    }
    
    MakeAnimalsTalk(animals)
    
    // Работа с расширенным интерфейсом
    var flyingAnimals []FlyingAnimal
    for _, animal := range animals {
        if bird, ok := animal.(Bird); ok {
            flyingAnimals = append(flyingAnimals, bird)
        }
    }
    
    fmt.Println("\nЛетающие животные:")
    for _, animal := range flyingAnimals {
        fmt.Printf("%s: %s. %s.\n", 
            animal.MakeSound(), animal.Move(), animal.Fly())
    }
}
```

## Практические примеры

### Система управления студентами

```go
// Базовый интерфейс для пользователей системы
type User interface {
    GetID() int
    GetName() string
    GetRole() string
}

// Базовые данные пользователя
type BaseUser struct {
    ID   int
    Name string
    Role string
}

func (u BaseUser) GetID() int {
    return u.ID
}

func (u BaseUser) GetName() string {
    return u.Name
}

func (u BaseUser) GetRole() string {
    return u.Role
}

// Студент
type Student struct {
    BaseUser
    Grade      int
    Subjects   []string
    GPA        float64
}

func (s Student) Study() string {
    return fmt.Sprintf("Студент %s изучает %v", s.Name, s.Subjects)
}

// Преподаватель
type Teacher struct {
    BaseUser
    Subjects   []string
    Salary     float64
    Students   []int // ID студентов
}

func (t Teacher) Teach() string {
    return fmt.Sprintf("Преподаватель %s ведет %v", t.Name, t.Subjects)
}

// Система управления
type UniversitySystem struct {
    users map[int]User
    students []Student
    teachers []Teacher
}

func NewUniversitySystem() *UniversitySystem {
    return &UniversitySystem{
        users: make(map[int]User),
    }
}

func (s *UniversitySystem) AddStudent(student Student) {
    s.users[student.ID] = student
    s.students = append(s.students, student)
}

func (s *UniversitySystem) AddTeacher(teacher Teacher) {
    s.users[teacher.ID] = teacher
    s.teachers = append(s.teachers, teacher)
}

func (s *UniversitySystem) GetUser(id int) (User, bool) {
    user, exists := s.users[id]
    return user, exists
}

func (s *UniversitySystem) ListAllUsers() {
    fmt.Println("=== Все пользователи системы ===")
    for _, user := range s.users {
        fmt.Printf("ID: %d, Имя: %s, Роль: %s\n", 
            user.GetID(), user.GetName(), user.GetRole())
        
        // Специфичная обработка по типу
        switch u := user.(type) {
        case Student:
            fmt.Printf("  Студент: класс %d, GPA: %.2f, Предметы: %v\n", 
                u.Grade, u.GPA, u.Subjects)
        case Teacher:
            fmt.Printf("  Преподаватель: зарплата %.2f, Предметы: %v\n", 
                u.Salary, u.Subjects)
        }
    }
}

func (s *UniversitySystem) FindStudentsBySubject(subject string) []Student {
    var result []Student
    for _, student := range s.students {
        for _, subj := range student.Subjects {
            if subj == subject {
                result = append(result, student)
                break
            }
        }
    }
    return result
}

func main() {
    system := NewUniversitySystem()
    
    // Добавляем студентов
    system.AddStudent(Student{
        BaseUser: BaseUser{ID: 1, Name: "Алиса", Role: "student"},
        Grade:    10,
        Subjects: []string{"Математика", "Физика", "Программирование"},
        GPA:      4.5,
    })
    
    system.AddStudent(Student{
        BaseUser: BaseUser{ID: 2, Name: "Боб", Role: "student"},
        Grade:    11,
        Subjects: []string{"Математика", "Химия", "Биология"},
        GPA:      4.2,
    })
    
    // Добавляем преподавателей
    system.AddTeacher(Teacher{
        BaseUser: BaseUser{ID: 101, Name: "Проф. Иванов", Role: "teacher"},
        Subjects: []string{"Математика", "Алгебра"},
        Salary:   80000,
        Students: []int{1, 2},
    })
    
    system.AddTeacher(Teacher{
        BaseUser: BaseUser{ID: 102, Name: "Проф. Петрова", Role: "teacher"},
        Subjects: []string{"Программирование", "Информатика"},
        Salary:   90000,
        Students: []int{1},
    })
    
    // Выводим всех пользователей
    system.ListAllUsers()
    
    // Находим студентов по предмету
    fmt.Println("\n=== Студенты, изучающие Математику ===")
    mathStudents := system.FindStudentsBySubject("Математика")
    for _, student := range mathStudents {
        fmt.Printf("- %s (класс %d, GPA: %.2f)\n", 
            student.Name, student.Grade, student.GPA)
    }
    
    // Поиск конкретного пользователя
    if user, found := system.GetUser(101); found {
        fmt.Printf("\nНайден пользователь: %s (%s)\n", user.GetName(), user.GetRole())
    }
}
```

## Упражнения

1. Создайте структуру `Book` с полями `Title`, `Author`, `Pages`, `ISBN` и реализуйте методы для вывода информации и проверки валидности ISBN
2. Определите интерфейс `Logger` с методами `Log(message string)` и `SetLevel(level string)`. Создайте несколько реализаций: `FileLogger`, `ConsoleLogger`, `DatabaseLogger`
3. Реализуйте систему геометрических фигур с интерфейсом `Shape3D` для объемных фигур (сфера, куб, цилиндр)
4. Создайте структуру `Matrix` и реализуйте операции сложения, умножения и транспонирования
5. Разработайте систему плагинов с интерфейсом `Plugin` и динамической загрузкой плагинов

В следующем уроке мы изучим обработку ошибок и работу с файлами.