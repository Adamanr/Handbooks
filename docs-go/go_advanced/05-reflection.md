---
sidebar_position: 5
---

# Рефлексия (Reflection)

## Введение

Представьте, что вы детектив, который должен изучить закрытую коробку. Вы не знаете, что внутри, но у вас есть инструменты, которые позволяют:
- Узнать размер коробки
- Понять, из чего она сделана
- Заглянуть внутрь и увидеть содержимое
- Даже изменить что-то внутри

Рефлексия в программировании — это способность программы исследовать и модифицировать саму себя во время выполнения. В Go рефлексия позволяет работать с типами и значениями, которые неизвестны на момент компиляции.

## Зачем нужна рефлексия?

### Типичные задачи

**1. Сериализация/десериализация**
```go
// JSON библиотека использует рефлексию
json.Marshal(anyStruct) // Не знает тип заранее
```

**2. ORM и работа с БД**
```go
// ORM сканирует структуры в строки БД
db.Find(&users) // Работает с любой структурой
```

**3. Валидация**
```go
// Проверка структур по тегам
type User struct {
    Email string `validate:"email"`
    Age   int    `validate:"min=18"`
}
```

**4. Универсальные функции**
```go
// Функция, которая работает с любым типом
func PrintFields(v interface{}) {
    // Рефлексия позволяет узнать поля
}
```

## Основы: пакет reflect

В Go рефлексия реализована в пакете `reflect`. Два ключевых типа:

### reflect.Type — информация о типе

```go
import "reflect"

func main() {
    var x int = 42
    t := reflect.TypeOf(x)
    
    fmt.Println(t.Name())    // "int"
    fmt.Println(t.Kind())    // reflect.Int
    fmt.Println(t.Size())    // 8 (на 64-bit системе)
}
```

### reflect.Value — значение и возможность его изменить

```go
func main() {
    var x int = 42
    v := reflect.ValueOf(x)
    
    fmt.Println(v.Type())    // "int"
    fmt.Println(v.Kind())    // reflect.Int
    fmt.Println(v.Int())     // 42
}
```

### Связь между Type и Value

```go
var x int = 42

t := reflect.TypeOf(x)   // Получаем тип
v := reflect.ValueOf(x)  // Получаем значение

// Из Value можно получить Type
t2 := v.Type()           // Тот же тип

// Но из Type нельзя получить Value!
```

## Kind vs Type

**Type** — это конкретный тип в вашей программе
**Kind** — это категория типа

```go
type MyInt int

func main() {
    var x MyInt = 42
    
    t := reflect.TypeOf(x)
    
    fmt.Println(t.Name())  // "MyInt" (тип)
    fmt.Println(t.Kind())  // "int" (категория)
}
```

Возможные Kind:
- `Bool`, `Int`, `Int8`, `Int16`, `Int32`, `Int64`
- `Uint`, `Uint8`, `Uint16`, `Uint32`, `Uint64`
- `Float32`, `Float64`
- `String`
- `Array`, `Slice`, `Map`, `Chan`
- `Struct`, `Ptr`, `Interface`, `Func`

## Работа со структурами

### Чтение полей структуры

```go
type Person struct {
    Name string
    Age  int
    City string
}

func printStructFields(v interface{}) {
    val := reflect.ValueOf(v)
    typ := reflect.TypeOf(v)
    
    // Проверяем, что это структура
    if typ.Kind() != reflect.Struct {
        fmt.Println("Not a struct")
        return
    }
    
    // Перебираем все поля
    for i := 0; i < val.NumField(); i++ {
        field := val.Field(i)      // Значение поля
        fieldType := typ.Field(i)  // Информация о поле
        
        fmt.Printf("%s (%s) = %v\n",
            fieldType.Name,
            field.Type(),
            field.Interface())
    }
}

func main() {
    p := Person{Name: "Alice", Age: 30, City: "London"}
    printStructFields(p)
    
    // Вывод:
    // Name (string) = Alice
    // Age (int) = 30
    // City (string) = London
}
```

### Работа с тегами

```go
type User struct {
    ID       int    `json:"id" db:"user_id"`
    Username string `json:"username" db:"user_name"`
    Email    string `json:"email" validate:"email"`
}

func printTags(v interface{}) {
    typ := reflect.TypeOf(v)
    
    for i := 0; i < typ.NumField(); i++ {
        field := typ.Field(i)
        
        jsonTag := field.Tag.Get("json")
        dbTag := field.Tag.Get("db")
        
        fmt.Printf("%s: json=%s, db=%s\n",
            field.Name, jsonTag, dbTag)
    }
}

func main() {
    u := User{}
    printTags(u)
    
    // Вывод:
    // ID: json=id, db=user_id
    // Username: json=username, db=user_name
    // Email: json=email, db=
}
```

### Доступ к приватным полям

```go
type Person struct {
    Name   string
    age    int  // приватное поле
}

func readPrivateField(v interface{}) {
    val := reflect.ValueOf(v)
    
    // Можем прочитать приватное поле
    ageField := val.FieldByName("age")
    if ageField.IsValid() {
        fmt.Println("Age:", ageField.Int())
    }
    
    // Но не можем изменить без хаков
    // ageField.SetInt(25) // паника!
}
```

## Изменение значений

### Правило: нужен указатель

Чтобы изменить значение через рефлексию, нужно:
1. Передать указатель
2. Получить Elem() для доступа к значению
3. Проверить CanSet()

```go
func changeValue(v interface{}) {
    val := reflect.ValueOf(v)
    
    // Проверяем, что это указатель
    if val.Kind() != reflect.Ptr {
        fmt.Println("Need a pointer!")
        return
    }
    
    // Получаем значение, на которое указывает указатель
    elem := val.Elem()
    
    // Проверяем, можем ли изменить
    if !elem.CanSet() {
        fmt.Println("Cannot set!")
        return
    }
    
    // Изменяем значение
    if elem.Kind() == reflect.Int {
        elem.SetInt(100)
    }
}

func main() {
    x := 42
    changeValue(&x)  // Передаем указатель!
    fmt.Println(x)   // 100
}
```

### Изменение полей структуры

```go
type Config struct {
    Host string
    Port int
}

func setField(v interface{}, fieldName string, value interface{}) error {
    val := reflect.ValueOf(v)
    
    // Нужен указатель на структуру
    if val.Kind() != reflect.Ptr || val.Elem().Kind() != reflect.Struct {
        return fmt.Errorf("need pointer to struct")
    }
    
    structVal := val.Elem()
    fieldVal := structVal.FieldByName(fieldName)
    
    if !fieldVal.IsValid() {
        return fmt.Errorf("field %s not found", fieldName)
    }
    
    if !fieldVal.CanSet() {
        return fmt.Errorf("cannot set field %s", fieldName)
    }
    
    // Устанавливаем значение
    newVal := reflect.ValueOf(value)
    if fieldVal.Type() != newVal.Type() {
        return fmt.Errorf("type mismatch")
    }
    
    fieldVal.Set(newVal)
    return nil
}

func main() {
    cfg := &Config{Host: "localhost", Port: 8080}
    
    setField(cfg, "Host", "example.com")
    setField(cfg, "Port", 9090)
    
    fmt.Printf("%+v\n", cfg)
    // {Host:example.com Port:9090}
}
```

## Работа с функциями

### Вызов функции через рефлексию

```go
func Add(a, b int) int {
    return a + b
}

func callFunction(fn interface{}, args ...interface{}) []interface{} {
    fnVal := reflect.ValueOf(fn)
    
    // Проверяем, что это функция
    if fnVal.Kind() != reflect.Func {
        panic("not a function")
    }
    
    // Преобразуем аргументы в reflect.Value
    argVals := make([]reflect.Value, len(args))
    for i, arg := range args {
        argVals[i] = reflect.ValueOf(arg)
    }
    
    // Вызываем функцию
    results := fnVal.Call(argVals)
    
    // Преобразуем результаты обратно
    resultInterfaces := make([]interface{}, len(results))
    for i, result := range results {
        resultInterfaces[i] = result.Interface()
    }
    
    return resultInterfaces
}

func main() {
    results := callFunction(Add, 10, 20)
    fmt.Println(results[0]) // 30
}
```

### Создание функции динамически

```go
func makeAdder(n int) interface{} {
    // Тип функции: func(int) int
    fnType := reflect.FuncOf(
        []reflect.Type{reflect.TypeOf(0)}, // входные параметры
        []reflect.Type{reflect.TypeOf(0)}, // возвращаемые значения
        false,                              // не variadic
    )
    
    // Создаем функцию
    fn := reflect.MakeFunc(fnType, func(args []reflect.Value) []reflect.Value {
        // args[0] - первый аргумент
        input := int(args[0].Int())
        result := input + n
        return []reflect.Value{reflect.ValueOf(result)}
    })
    
    return fn.Interface()
}

func main() {
    add5 := makeAdder(5).(func(int) int)
    fmt.Println(add5(10)) // 15
    
    add100 := makeAdder(100).(func(int) int)
    fmt.Println(add100(10)) // 110
}
```

## Работа с коллекциями

### Слайсы

```go
func printSlice(v interface{}) {
    val := reflect.ValueOf(v)
    
    if val.Kind() != reflect.Slice {
        fmt.Println("Not a slice")
        return
    }
    
    fmt.Printf("Length: %d, Capacity: %d\n", val.Len(), val.Cap())
    
    for i := 0; i < val.Len(); i++ {
        elem := val.Index(i)
        fmt.Printf("[%d] = %v\n", i, elem.Interface())
    }
}

func main() {
    nums := []int{1, 2, 3, 4, 5}
    printSlice(nums)
}
```

### Создание слайса динамически

```go
func makeSlice(elemType reflect.Type, len, cap int) interface{} {
    sliceType := reflect.SliceOf(elemType)
    slice := reflect.MakeSlice(sliceType, len, cap)
    return slice.Interface()
}

func main() {
    // Создаем []int с длиной 5
    slice := makeSlice(reflect.TypeOf(0), 5, 10).([]int)
    fmt.Printf("%v (len=%d, cap=%d)\n", slice, len(slice), cap(slice))
    // [0 0 0 0 0] (len=5, cap=10)
}
```

### Мапы

```go
func printMap(v interface{}) {
    val := reflect.ValueOf(v)
    
    if val.Kind() != reflect.Map {
        fmt.Println("Not a map")
        return
    }
    
    keys := val.MapKeys()
    for _, key := range keys {
        value := val.MapIndex(key)
        fmt.Printf("%v => %v\n", key.Interface(), value.Interface())
    }
}

func main() {
    m := map[string]int{"a": 1, "b": 2, "c": 3}
    printMap(m)
}
```

### Создание мапы динамически

```go
func makeMap(keyType, valueType reflect.Type) interface{} {
    mapType := reflect.MapOf(keyType, valueType)
    mapVal := reflect.MakeMap(mapType)
    return mapVal.Interface()
}

func main() {
    // Создаем map[string]int
    m := makeMap(
        reflect.TypeOf(""),
        reflect.TypeOf(0),
    ).(map[string]int)
    
    m["hello"] = 42
    fmt.Println(m) // map[hello:42]
}
```

## Практические примеры

### Простой JSON маршаллер

```go
func simpleJSONMarshal(v interface{}) (string, error) {
    val := reflect.ValueOf(v)
    typ := val.Type()
    
    if typ.Kind() != reflect.Struct {
        return "", fmt.Errorf("only structs supported")
    }
    
    var parts []string
    for i := 0; i < val.NumField(); i++ {
        field := val.Field(i)
        fieldType := typ.Field(i)
        
        // Пропускаем приватные поля
        if !field.CanInterface() {
            continue
        }
        
        // Получаем имя из тега или используем имя поля
        name := fieldType.Tag.Get("json")
        if name == "" {
            name = fieldType.Name
        }
        
        var value string
        switch field.Kind() {
        case reflect.String:
            value = fmt.Sprintf(`"%s"`, field.String())
        case reflect.Int, reflect.Int64:
            value = fmt.Sprintf("%d", field.Int())
        case reflect.Bool:
            value = fmt.Sprintf("%t", field.Bool())
        default:
            value = fmt.Sprintf(`"%v"`, field.Interface())
        }
        
        parts = append(parts, fmt.Sprintf(`"%s":%s`, name, value))
    }
    
    return "{" + strings.Join(parts, ",") + "}", nil
}

type Person struct {
    Name string `json:"name"`
    Age  int    `json:"age"`
    City string `json:"city"`
}

func main() {
    p := Person{Name: "Alice", Age: 30, City: "London"}
    json, _ := simpleJSONMarshal(p)
    fmt.Println(json)
    // {"name":"Alice","age":30,"city":"London"}
}
```

### Валидатор структур

```go
func validate(v interface{}) []string {
    var errors []string
    
    val := reflect.ValueOf(v)
    typ := val.Type()
    
    if typ.Kind() != reflect.Struct {
        return []string{"not a struct"}
    }
    
    for i := 0; i < val.NumField(); i++ {
        field := val.Field(i)
        fieldType := typ.Field(i)
        
        // Проверяем тег required
        if fieldType.Tag.Get("required") == "true" {
            if isZero(field) {
                errors = append(errors,
                    fmt.Sprintf("%s is required", fieldType.Name))
            }
        }
        
        // Проверяем тег min для int
        if minStr := fieldType.Tag.Get("min"); minStr != "" {
            if field.Kind() == reflect.Int {
                min, _ := strconv.Atoi(minStr)
                if int(field.Int()) < min {
                    errors = append(errors,
                        fmt.Sprintf("%s must be >= %d", fieldType.Name, min))
                }
            }
        }
    }
    
    return errors
}

func isZero(v reflect.Value) bool {
    switch v.Kind() {
    case reflect.String:
        return v.String() == ""
    case reflect.Int, reflect.Int64:
        return v.Int() == 0
    case reflect.Bool:
        return !v.Bool()
    default:
        return false
    }
}

type User struct {
    Name  string `required:"true"`
    Email string `required:"true"`
    Age   int    `min:"18"`
}

func main() {
    u := User{Name: "", Email: "test@example.com", Age: 15}
    
    errors := validate(u)
    for _, err := range errors {
        fmt.Println(err)
    }
    // Name is required
    // Age must be >= 18
}
```

### Копирование структур

```go
func deepCopy(v interface{}) interface{} {
    val := reflect.ValueOf(v)
    return deepCopyValue(val).Interface()
}

func deepCopyValue(val reflect.Value) reflect.Value {
    switch val.Kind() {
    case reflect.Ptr:
        if val.IsNil() {
            return val
        }
        newVal := reflect.New(val.Elem().Type())
        newVal.Elem().Set(deepCopyValue(val.Elem()))
        return newVal
        
    case reflect.Struct:
        newVal := reflect.New(val.Type()).Elem()
        for i := 0; i < val.NumField(); i++ {
            field := val.Field(i)
            if field.CanSet() {
                newVal.Field(i).Set(deepCopyValue(field))
            }
        }
        return newVal
        
    case reflect.Slice:
        newSlice := reflect.MakeSlice(val.Type(), val.Len(), val.Cap())
        for i := 0; i < val.Len(); i++ {
            newSlice.Index(i).Set(deepCopyValue(val.Index(i)))
        }
        return newSlice
        
    case reflect.Map:
        newMap := reflect.MakeMap(val.Type())
        for _, key := range val.MapKeys() {
            newMap.SetMapIndex(key, deepCopyValue(val.MapIndex(key)))
        }
        return newMap
        
    default:
        return val
    }
}

type Person struct {
    Name    string
    Age     int
    Friends []string
}

func main() {
    p1 := Person{
        Name:    "Alice",
        Age:     30,
        Friends: []string{"Bob", "Charlie"},
    }
    
    p2 := deepCopy(p1).(Person)
    
    // Изменяем копию
    p2.Friends[0] = "Dave"
    
    fmt.Println(p1.Friends) // [Bob Charlie]
    fmt.Println(p2.Friends) // [Dave Charlie]
}
```

## Производительность

Рефлексия медленная! Насколько?

```go
import "testing"

type Data struct {
    Value int
}

// Прямой доступ
func BenchmarkDirect(b *testing.B) {
    d := Data{Value: 42}
    for i := 0; i < b.N; i++ {
        _ = d.Value
    }
}

// Через рефлексию
func BenchmarkReflection(b *testing.B) {
    d := Data{Value: 42}
    val := reflect.ValueOf(d)
    for i := 0; i < b.N; i++ {
        _ = val.FieldByName("Value").Int()
    }
}

// Результаты (примерно):
// BenchmarkDirect      1000000000    0.25 ns/op
// BenchmarkReflection    10000000    150 ns/op
```

Рефлексия **в сотни раз медленнее** прямого доступа!

### Когда использовать рефлексию

✅ **Используйте:**
- Библиотеки общего назначения (JSON, ORM, валидация)
- Код, который выполняется редко (инициализация)
- Когда нет альтернативы

❌ **Не используйте:**
- В горячих циклах
- Когда есть альтернатива через интерфейсы
- Просто "потому что круто"

## Три закона рефлексии

Rob Pike (один из создателей Go) сформулировал три закона рефлексии:

### Закон 1: Рефлексия идет от interface{} к объекту рефлексии

```go
var x float64 = 3.4
v := reflect.ValueOf(x)  // interface{} → reflect.Value
```

### Закон 2: Рефлексия идет от объекта рефлексии к interface{}

```go
v := reflect.ValueOf(3.4)
x := v.Interface().(float64)  // reflect.Value → interface{}
```

### Закон 3: Чтобы изменить объект рефлексии, значение должно быть settable

```go
var x float64 = 3.4
v := reflect.ValueOf(&x)  // Указатель!
v.Elem().SetFloat(7.1)    // Elem() + CanSet() = можно изменить
```

## Типичные ошибки

### Ошибка 1: Забыли передать указатель

```go
// НЕПРАВИЛЬНО
func modify(v interface{}) {
    val := reflect.ValueOf(v)
    val.SetInt(100) // паника: reflect.Value.SetInt using unaddressable value
}

x := 42
modify(x) // Передали значение

// ПРАВИЛЬНО
func modify(v interface{}) {
    val := reflect.ValueOf(v).Elem()
    val.SetInt(100)
}

x := 42
modify(&x) // Передали указатель
```

### Ошибка 2: Не проверили тип

```go
// НЕПРАВИЛЬНО
func double(v interface{}) {
    val := reflect.ValueOf(v)
    val.SetInt(val.Int() * 2) // Что если это не int?
}

// ПРАВИЛЬНО
func double(v interface{}) {
    val := reflect.ValueOf(v).Elem()
    
    if val.Kind() != reflect.Int {
        panic("not an int")
    }
    
    val.SetInt(val.Int() * 2)
}
```

### Ошибка 3: Забыли про IsValid() и IsNil()

```go
func safePrint(v interface{}) {
    val := reflect.ValueOf(v)
    
    // Проверяем, что значение валидно
    if !val.IsValid() {
        fmt.Println("invalid value")
        return
    }
    
    // Для указателей проверяем nil
    if val.Kind() == reflect.Ptr && val.IsNil() {
        fmt.Println("nil pointer")
        return
    }
    
    fmt.Println(val.Interface())
}
```

## Заключение

Рефлексия — мощный, но опасный инструмент:

**Плюсы:**
- Универсальный код для разных типов
- Основа для библиотек (JSON, ORM, DI)
- Метапрограммирование

**Минусы:**
- Медленная (в сотни раз)
- Теряется типобезопасность
- Сложнее отлаживать
- Код становится менее читаемым

**Золотое правило:** используйте рефлексию только когда она действительно нужна. В большинстве случаев интерфейсы и дженерики (с Go 1.18) — лучшее решение.

**Помните:**
- Всегда проверяйте Kind() и Type()
- Используйте CanSet() перед изменением
- Проверяйте IsValid() и IsNil()
- Кешируйте результаты reflect.TypeOf() если используете часто
- Пишите тесты — с рефлексией легко ошибиться!