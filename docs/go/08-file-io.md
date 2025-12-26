---
sidebar_position: 8
---

# Работа с файлами и вводом-выводом

## Основы ввода-вывода в Go

Go предоставляет мощные инструменты для работы с вводом-выводом через пакеты:
- `io` - базовые интерфейсы для I/O операций
- `os` - работа с файловой системой
- `bufio` - буферизованный ввод-вывод
- `fmt` - форматированный ввод-вывод
- `ioutil` - устаревший пакет, функциональность перенесена в `os` и `io`

## Работа с файлами

### Открытие и чтение файлов

#### Чтение всего файла

```go
package main

import (
    "fmt"
    "os"
)

func readEntireFile(filename string) error {
    data, err := os.ReadFile(filename)
    if err != nil {
        return fmt.Errorf("ошибка чтения файла %s: %w", filename, err)
    }
    
    fmt.Printf("Содержимое файла %s (%d байт):\n", filename, len(data))
    fmt.Println(string(data))
    return nil
}

func main() {
    if err := readEntireFile("example.txt"); err != nil {
        fmt.Printf("Ошибка: %v\n", err)
    }
}
```

#### Построчное чтение

```go
package main

import (
    "bufio"
    "fmt"
    "os"
)

func readLines(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return fmt.Errorf("ошибка открытия файла %s: %w", filename, err)
    }
    defer file.Close()
    
    scanner := bufio.NewScanner(file)
    lineNumber := 1
    
    for scanner.Scan() {
        line := scanner.Text()
        fmt.Printf("Строка %d: %s\n", lineNumber, line)
        lineNumber++
    }
    
    if err := scanner.Err(); err != nil {
        return fmt.Errorf("ошибка при чтении файла: %w", err)
    }
    
    return nil
}

func main() {
    if err := readLines("example.txt"); err != nil {
        fmt.Printf("Ошибка: %v\n", err)
    }
}
```

#### Чтение с буферизацией

```go
package main

import (
    "bufio"
    "fmt"
    "os"
)

func readWithBuffer(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return fmt.Errorf("ошибка открытия файла: %w", err)
    }
    defer file.Close()
    
    // Создаем буферизованный ридер
    reader := bufio.NewReader(file)
    
    // Читаем файл частями
    buffer := make([]byte, 1024)
    
    for {
        n, err := reader.Read(buffer)
        if n > 0 {
            fmt.Printf("Прочитано %d байт: %s\n", n, string(buffer[:n]))
        }
        
        if err != nil {
            if err == io.EOF {
                break // нормальное окончание файла
            }
            return fmt.Errorf("ошибка чтения: %w", err)
        }
    }
    
    return nil
}
```

### Запись в файлы

#### Запись всего содержимого

```go
package main

import (
    "fmt"
    "os"
)

func writeFile(filename, content string) error {
    // Создаем файл (перезаписываем, если существует)
    file, err := os.Create(filename)
    if err != nil {
        return fmt.Errorf("ошибка создания файла: %w", err)
    }
    defer file.Close()
    
    // Записываем данные
    bytesWritten, err := file.WriteString(content)
    if err != nil {
        return fmt.Errorf("ошибка записи: %w", err)
    }
    
    fmt.Printf("Записано %d байт в файл %s\n", bytesWritten, filename)
    return nil
}

func appendToFile(filename, content string) error {
    // Открываем файл в режиме добавления
    file, err := os.OpenFile(filename, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
    if err != nil {
        return fmt.Errorf("ошибка открытия файла: %w", err)
    }
    defer file.Close()
    
    bytesWritten, err := file.WriteString(content)
    if err != nil {
        return fmt.Errorf("ошибка записи: %w", err)
    }
    
    fmt.Printf("Добавлено %d байт в файл %s\n", bytesWritten, filename)
    return nil
}

func main() {
    content := "Привет, мир!\nЭто новая строка.\n"
    
    if err := writeFile("output.txt", content); err != nil {
        fmt.Printf("Ошибка записи: %v\n", err)
    }
    
    if err := appendToFile("output.txt", "Дополнительная строка.\n"); err != nil {
        fmt.Printf("Ошибка добавления: %v\n", err)
    }
}
```

#### Буферизованная запись

```go
package main

import (
    "bufio"
    "fmt"
    "os"
)

func writeWithBuffer(filename string, lines []string) error {
    file, err := os.Create(filename)
    if err != nil {
        return fmt.Errorf("ошибка создания файла: %w", err)
    }
    defer file.Close()
    
    // Создаем буферизованный писатель
    writer := bufio.NewWriter(file)
    
    for _, line := range lines {
        _, err := writer.WriteString(line + "\n")
        if err != nil {
            return fmt.Errorf("ошибка записи строки: %w", err)
        }
    }
    
    // Обязательно сбрасываем буфер
    if err := writer.Flush(); err != nil {
        return fmt.Errorf("ошибка сброса буфера: %w", err)
    }
    
    fmt.Printf("Записано %d строк в файл %s\n", len(lines), filename)
    return nil
}

func main() {
    lines := []string{
        "Первая строка",
        "Вторая строка", 
        "Третья строка",
        "Четвертая строка",
    }
    
    if err := writeWithBuffer("buffered_output.txt", lines); err != nil {
        fmt.Printf("Ошибка: %v\n", err)
    }
}
```

### Работа с директориями

```go
package main

import (
    "fmt"
    "os"
    "path/filepath"
)

func listDirectory(dirname string) error {
    entries, err := os.ReadDir(dirname)
    if err != nil {
        return fmt.Errorf("ошибка чтения директории: %w", err)
    }
    
    fmt.Printf("Содержимое директории %s:\n", dirname)
    for _, entry := range entries {
        info, err := entry.Info()
        if err != nil {
            fmt.Printf("  %s: ошибка получения информации: %v\n", entry.Name(), err)
            continue
        }
        
        fileType := "файл"
        if entry.IsDir() {
            fileType = "директория"
        }
        
        fmt.Printf("  %s (%s, %d байт)\n", entry.Name(), fileType, info.Size())
    }
    
    return nil
}

func createDirectoryStructure() error {
    dirs := []string{
        "project/src",
        "project/pkg",
        "project/bin",
        "project/docs/api",
        "project/docs/guides",
    }
    
    for _, dir := range dirs {
        if err := os.MkdirAll(dir, 0755); err != nil {
            return fmt.Errorf("ошибка создания директории %s: %w", dir, err)
        }
        fmt.Printf("Создана директория: %s\n", dir)
    }
    
    return nil
}

func walkDirectory(rootDir string) error {
    return filepath.Walk(rootDir, func(path string, info os.FileInfo, err error) error {
        if err != nil {
            return fmt.Errorf("ошибка при обработке %s: %w", path, err)
        }
        
        relPath, _ := filepath.Rel(rootDir, path)
        if relPath == "." {
            return nil // пропускаем корневую директорию
        }
        
        indent := ""
        for i := 0; i < len(filepath.SplitList(relPath))-1; i++ {
            indent += "  "
        }
        
        if info.IsDir() {
            fmt.Printf("%s📁 %s/\n", indent, filepath.Base(path))
        } else {
            fmt.Printf("%s📄 %s (%d байт)\n", indent, filepath.Base(path), info.Size())
        }
        
        return nil
    })
}

func main() {
    // Создаем тестовую структуру
    fmt.Println("=== Создание структуры директорий ===")
    if err := createDirectoryStructure(); err != nil {
        fmt.Printf("Ошибка: %v\n", err)
        return
    }
    
    // Создаем тестовые файлы
    testFiles := map[string]string{
        "project/README.md":    "# Проект\n",
        "project/src/main.go":  "package main\n\nfunc main() {}\n",
        "project/pkg/utils.go": "package utils\n\nfunc Add(a, b int) int { return a + b }\n",
        "project/docs/api.md":  "# API Documentation\n",
    }
    
    for filename, content := range testFiles {
        if err := os.WriteFile(filename, []byte(content), 0644); err != nil {
            fmt.Printf("Ошибка создания файла %s: %v\n", filename, err)
        } else {
            fmt.Printf("Создан файл: %s\n", filename)
        }
    }
    
    fmt.Println("\n=== Обход директории ===")
    if err := walkDirectory("project"); err != nil {
        fmt.Printf("Ошибка обхода: %v\n", err)
    }
}
```

## Форматированный ввод-вывод

### Вывод с форматированием

```go
package main

import (
    "fmt"
    "os"
)

func formattedOutput() {
    name := "Alice"
    age := 30
    salary := 75000.50
    
    // Базовое форматирование
    fmt.Printf("Имя: %s, Возраст: %d\n", name, age)
    
    // Различные форматы
    fmt.Printf("Зарплата: %.2f\n", salary)
    fmt.Printf("Зарплата в экспоненциальной форме: %e\n", salary)
    fmt.Printf("Зарплата в шестнадцатеричной: %x\n", int(salary))
    
    // Вывод в файл
    file, err := os.Create("output_formatted.txt")
    if err != nil {
        fmt.Printf("Ошибка создания файла: %v\n", err)
        return
    }
    defer file.Close()
    
    fmt.Fprintf(file, "Имя: %s\nВозраст: %d\nЗарплата: %.2f\n", name, age, salary)
    fmt.Println("Данные записаны в файл")
}

func main() {
    formattedOutput()
}
```

### Ввод с форматированием

```go
package main

import (
    "bufio"
    "fmt"
    "os"
    "strconv"
)

func readUserInput() error {
    scanner := bufio.NewScanner(os.Stdin)
    
    fmt.Print("Введите ваше имя: ")
    scanner.Scan()
    name := scanner.Text()
    
    fmt.Print("Введите ваш возраст: ")
    scanner.Scan()
    ageStr := scanner.Text()
    
    age, err := strconv.Atoi(ageStr)
    if err != nil {
        return fmt.Errorf("неверный формат возраста: %s", ageStr)
    }
    
    fmt.Printf("Привет, %s! Вам %d лет.\n", name, age)
    return nil
}

func parseCommandLineArgs() {
    if len(os.Args) < 2 {
        fmt.Println("Использование: program <команда> [аргументы]")
        return
    }
    
    command := os.Args[1]
    args := os.Args[2:]
    
    fmt.Printf("Команда: %s\n", command)
    fmt.Printf("Аргументы: %v\n", args)
    
    switch command {
    case "hello":
        if len(args) > 0 {
            fmt.Printf("Привет, %s!\n", args[0])
        } else {
            fmt.Println("Привет, мир!")
        }
    case "add":
        if len(args) >= 2 {
            a, _ := strconv.Atoi(args[0])
            b, _ := strconv.Atoi(args[1])
            fmt.Printf("%d + %d = %d\n", a, b, a+b)
        } else {
            fmt.Println("Требуется 2 аргумента для сложения")
        }
    default:
        fmt.Printf("Неизвестная команда: %s\n", command)
    }
}

func main() {
    fmt.Println("=== Чтение пользовательского ввода ===")
    if err := readUserInput(); err != nil {
        fmt.Printf("Ошибка: %v\n", err)
    }
    
    fmt.Println("\n=== Парсинг аргументов командной строки ===")
    parseCommandLineArgs()
}
```

## Работа с CSV файлами

```go
package main

import (
    "encoding/csv"
    "fmt"
    "os"
    "strconv"
)

type Person struct {
    Name string
    Age  int
    City string
}

func writeCSV(filename string, people []Person) error {
    file, err := os.Create(filename)
    if err != nil {
        return fmt.Errorf("ошибка создания файла: %w", err)
    }
    defer file.Close()
    
    writer := csv.NewWriter(file)
    
    // Записываем заголовок
    header := []string{"Name", "Age", "City"}
    if err := writer.Write(header); err != nil {
        return fmt.Errorf("ошибка записи заголовка: %w", err)
    }
    
    // Записываем данные
    for _, person := range people {
        record := []string{
            person.Name,
            strconv.Itoa(person.Age),
            person.City,
        }
        
        if err := writer.Write(record); err != nil {
            return fmt.Errorf("ошибка записи записи: %w", err)
        }
    }
    
    writer.Flush()
    
    if err := writer.Error(); err != nil {
        return fmt.Errorf("ошибка записи CSV: %w", err)
    }
    
    fmt.Printf("Записано %d записей в файл %s\n", len(people), filename)
    return nil
}

func readCSV(filename string) ([]Person, error) {
    file, err := os.Open(filename)
    if err != nil {
        return nil, fmt.Errorf("ошибка открытия файла: %w", err)
    }
    defer file.Close()
    
    reader := csv.NewReader(file)
    
    // Читаем все записи
    records, err := reader.ReadAll()
    if err != nil {
        return nil, fmt.Errorf("ошибка чтения CSV: %w", err)
    }
    
    if len(records) == 0 {
        return nil, fmt.Errorf("файл CSV пуст")
    }
    
    // Пропускаем заголовок (первая строка)
    var people []Person
    for i, record := range records[1:] {
        if len(record) != 3 {
            fmt.Printf("Пропуск строки %d: неверное количество полей\n", i+2)
            continue
        }
        
        age, err := strconv.Atoi(record[1])
        if err != nil {
            fmt.Printf("Пропуск строки %d: неверный возраст '%s'\n", i+2, record[1])
            continue
        }
        
        person := Person{
            Name: record[0],
            Age:  age,
            City: record[2],
        }
        
        people = append(people, person)
    }
    
    fmt.Printf("Прочитано %d записей из файла %s\n", len(people), filename)
    return people, nil
}

func main() {
    // Создаем тестовые данные
    people := []Person{
        {Name: "Alice", Age: 30, City: "Москва"},
        {Name: "Bob", Age: 25, City: "Санкт-Петербург"},
        {Name: "Charlie", Age: 35, City: "Новосибирск"},
        {Name: "Diana", Age: 28, City: "Екатеринбург"},
    }
    
    // Записываем в CSV
    if err := writeCSV("people.csv", people); err != nil {
        fmt.Printf("Ошибка записи: %v\n", err)
        return
    }
    
    // Читаем из CSV
    readPeople, err := readCSV("people.csv")
    if err != nil {
        fmt.Printf("Ошибка чтения: %v\n", err)
        return
    }
    
    // Выводим прочитанные данные
    fmt.Println("Прочитанные данные:")
    for i, person := range readPeople {
        fmt.Printf("%d. %s, %d лет, %s\n", i+1, person.Name, person.Age, person.City)
    }
}
```

## JSON ввод-вывод

```go
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

type User struct {
    ID       int    `json:"id"`
    Name     string `json:"name"`
    Email    string `json:"email"`
    Age      int    `json:"age"`
    IsActive bool   `json:"is_active"`
}

func writeJSON(filename string, users []User) error {
    file, err := os.Create(filename)
    if err != nil {
        return fmt.Errorf("ошибка создания файла: %w", err)
    }
    defer file.Close()
    
    encoder := json.NewEncoder(file)
    encoder.SetIndent("", "  ") // Форматированный вывод
    
    if err := encoder.Encode(users); err != nil {
        return fmt.Errorf("ошибка записи JSON: %w", err)
    }
    
    fmt.Printf("Записано %d пользователей в файл %s\n", len(users), filename)
    return nil
}

func readJSON(filename string) ([]User, error) {
    file, err := os.Open(filename)
    if err != nil {
        return nil, fmt.Errorf("ошибка открытия файла: %w", err)
    }
    defer file.Close()
    
    decoder := json.NewDecoder(file)
    
    var users []User
    if err := decoder.Decode(&users); err != nil {
        return nil, fmt.Errorf("ошибка чтения JSON: %w", err)
    }
    
    fmt.Printf("Прочитано %d пользователей из файла %s\n", len(users), filename)
    return users, nil
}

func main() {
    users := []User{
        {ID: 1, Name: "Alice Johnson", Email: "alice@example.com", Age: 30, IsActive: true},
        {ID: 2, Name: "Bob Smith", Email: "bob@example.com", Age: 25, IsActive: true},
        {ID: 3, Name: "Charlie Brown", Email: "charlie@example.com", Age: 35, IsActive: false},
    }
    
    // Записываем в JSON
    if err := writeJSON("users.json", users); err != nil {
        fmt.Printf("Ошибка записи: %v\n", err)
        return
    }
    
    // Читаем из JSON
    readUsers, err := readJSON("users.json")
    if err != nil {
        fmt.Printf("Ошибка чтения: %v\n", err)
        return
    }
    
    // Выводим прочитанные данные
    fmt.Println("Прочитанные данные:")
    for _, user := range readUsers {
        status := "неактивен"
        if user.IsActive {
            status = "активен"
        }
        fmt.Printf("- ID: %d, Имя: %s, Email: %s, Возраст: %d, Статус: %s\n",
            user.ID, user.Name, user.Email, user.Age, status)
    }
}
```

## Копирование файлов

```go
package main

import (
    "fmt"
    "io"
    "os"
)

func copyFile(src, dst string) error {
    // Открываем исходный файл
    sourceFile, err := os.Open(src)
    if err != nil {
        return fmt.Errorf("ошибка открытия исходного файла: %w", err)
    }
    defer sourceFile.Close()
    
    // Создаем целевой файл
    destFile, err := os.Create(dst)
    if err != nil {
        return fmt.Errorf("ошибка создания целевого файла: %w", err)
    }
    defer destFile.Close()
    
    // Копируем данные
    bytesWritten, err := io.Copy(destFile, sourceFile)
    if err != nil {
        return fmt.Errorf("ошибка копирования: %w", err)
    }
    
    // Синхронизируем данные с диском
    if err := destFile.Sync(); err != nil {
        return fmt.Errorf("ошибка синхронизации: %w", err)
    }
    
    fmt.Printf("Скопировано %d байт из %s в %s\n", bytesWritten, src, dst)
    return nil
}

func copyFileWithProgress(src, dst string) error {
    sourceFile, err := os.Open(src)
    if err != nil {
        return fmt.Errorf("ошибка открытия исходного файла: %w", err)
    }
    defer sourceFile.Close()
    
    destFile, err := os.Create(dst)
    if err != nil {
        return fmt.Errorf("ошибка создания целевого файла: %w", err)
    }
    defer destFile.Close()
    
    // Получаем информацию об исходном файле
    sourceInfo, err := sourceFile.Stat()
    if err != nil {
        return fmt.Errorf("ошибка получения информации о файле: %w", err)
    }
    
    buffer := make([]byte, 64*1024) // 64KB буфер
    totalBytes := int64(0)
    
    for {
        bytesRead, err := sourceFile.Read(buffer)
        if bytesRead > 0 {
            bytesWritten, writeErr := destFile.Write(buffer[:bytesRead])
            if writeErr != nil {
                return fmt.Errorf("ошибка записи: %w", writeErr)
            }
            
            totalBytes += int64(bytesWritten)
            progress := float64(totalBytes) / float64(sourceInfo.Size()) * 100
            fmt.Printf("\rКопирование: %.1f%% (%d/%d байт)", 
                progress, totalBytes, sourceInfo.Size())
        }
        
        if err != nil {
            if err == io.EOF {
                break
            }
            return fmt.Errorf("ошибка чтения: %w", err)
        }
    }
    
    fmt.Println() // Новая строка после прогресс-бара
    
    if err := destFile.Sync(); err != nil {
        return fmt.Errorf("ошибка синхронизации: %w", err)
    }
    
    fmt.Printf("Копирование завершено: %d байт\n", totalBytes)
    return nil
}

func main() {
    // Создаем тестовый файл
    testContent := "Это тестовый файл для демонстрации копирования.\n"
    testContent += "Он содержит несколько строк текста.\n"
    testContent += "Копирование выполняется с показом прогресса.\n"
    
    if err := os.WriteFile("source.txt", []byte(testContent), 0644); err != nil {
        fmt.Printf("Ошибка создания тестового файла: %v\n", err)
        return
    }
    
    // Копируем с прогрессом
    if err := copyFileWithProgress("source.txt", "destination.txt"); err != nil {
        fmt.Printf("Ошибка копирования: %v\n", err)
    }
    
    // Проверяем результат
    if data, err := os.ReadFile("destination.txt"); err != nil {
        fmt.Printf("Ошибка чтения скопированного файла: %v\n", err)
    } else {
        fmt.Printf("Скопированный файл содержит %d байт\n", len(data))
    }
}
```

## Утилиты для работы с файлами

```go
package main

import (
    "crypto/md5"
    "fmt"
    "io"
    "os"
    "path/filepath"
    "time"
)

type FileInfo struct {
    Name         string
    Size         int64
    ModifiedTime time.Time
    MD5Hash      string
}

func getFileInfo(filename string) (FileInfo, error) {
    file, err := os.Open(filename)
    if err != nil {
        return FileInfo{}, fmt.Errorf("ошибка открытия файла: %w", err)
    }
    defer file.Close()
    
    // Получаем базовую информацию о файле
    stat, err := file.Stat()
    if err != nil {
        return FileInfo{}, fmt.Errorf("ошибка получения информации о файле: %w", err)
    }
    
    // Вычисляем MD5 хеш
    hash := md5.New()
    if _, err := io.Copy(hash, file); err != nil {
        return FileInfo{}, fmt.Errorf("ошибка вычисления хеша: %w", err)
    }
    
    md5Hash := fmt.Sprintf("%x", hash.Sum(nil))
    
    return FileInfo{
        Name:         filepath.Base(filename),
        Size:         stat.Size(),
        ModifiedTime: stat.ModTime(),
        MD5Hash:      md5Hash,
    }, nil
}

func findDuplicates(directory string) (map[string][]string, error) {
    hashToFiles := make(map[string][]string)
    
    err := filepath.Walk(directory, func(path string, info os.FileInfo, err error) error {
        if err != nil {
            return err
        }
        
        if info.IsDir() {
            return nil // пропускаем директории
        }
        
        // Получаем информацию о файле
        fileInfo, err := getFileInfo(path)
        if err != nil {
            fmt.Printf("Ошибка обработки файла %s: %v\n", path, err)
            return nil
        }
        
        // Добавляем файл в группу с таким же хешем
        hashToFiles[fileInfo.MD5Hash] = append(hashToFiles[fileInfo.MD5Hash], path)
        
        return nil
    })
    
    if err != nil {
        return nil, fmt.Errorf("ошибка обхода директории: %w", err)
    }
    
    // Фильтруем только дубликаты
    duplicates := make(map[string][]string)
    for hash, files := range hashToFiles {
        if len(files) > 1 {
            duplicates[hash] = files
        }
    }
    
    return duplicates, nil
}

func backupDirectory(source, backupDir string) error {
    // Создаем директорию для бэкапов
    timestamp := time.Now().Format("2006-01-02_15-04-05")
    backupPath := filepath.Join(backupDir, fmt.Sprintf("backup_%s", timestamp))
    
    if err := os.MkdirAll(backupPath, 0755); err != nil {
        return fmt.Errorf("ошибка создания директории бэкапа: %w", err)
    }
    
    return filepath.Walk(source, func(path string, info os.FileInfo, err error) error {
        if err != nil {
            return err
        }
        
        // Вычисляем относительный путь
        relPath, err := filepath.Rel(source, path)
        if err != nil {
            return fmt.Errorf("ошибка вычисления относительного пути: %w", err)
        }
        
        // Создаем целевой путь
        targetPath := filepath.Join(backupPath, relPath)
        
        if info.IsDir() {
            // Создаем директорию
            if err := os.MkdirAll(targetPath, info.Mode()); err != nil {
                return fmt.Errorf("ошибка создания директории %s: %w", targetPath, err)
            }
        } else {
            // Копируем файл
            sourceFile, err := os.Open(path)
            if err != nil {
                return fmt.Errorf("ошибка открытия файла %s: %w", path, err)
            }
            defer sourceFile.Close()
            
            targetFile, err := os.Create(targetPath)
            if err != nil {
                return fmt.Errorf("ошибка создания файла %s: %w", targetPath, err)
            }
            defer targetFile.Close()
            
            if _, err := io.Copy(targetFile, sourceFile); err != nil {
                return fmt.Errorf("ошибка копирования файла %s: %w", path, err)
            }
            
            fmt.Printf("Скопирован: %s\n", relPath)
        }
        
        return nil
    })
}

func main() {
    // Создаем тестовые файлы для демонстрации
    testFiles := map[string]string{
        "test1.txt": "Содержимое первого файла",
        "test2.txt": "Содержимое второго файла",
        "test3.txt": "Содержимое первого файла", // дубликат test1.txt
    }
    
    for filename, content := range testFiles {
        if err := os.WriteFile(filename, []byte(content), 0644); err != nil {
            fmt.Printf("Ошибка создания файла %s: %v\n", filename, err)
            return
        }
    }
    
    // Получаем информацию о файле
    fmt.Println("=== Информация о файлах ===")
    for filename := range testFiles {
        info, err := getFileInfo(filename)
        if err != nil {
            fmt.Printf("Ошибка получения информации о %s: %v\n", filename, err)
            continue
        }
        
        fmt.Printf("Файл: %s\n", info.Name)
        fmt.Printf("  Размер: %d байт\n", info.Size)
        fmt.Printf("  Изменен: %s\n", info.ModifiedTime.Format("2006-01-02 15:04:05"))
        fmt.Printf("  MD5: %s\n", info.MD5Hash)
        fmt.Println()
    }
    
    // Ищем дубликаты
    fmt.Println("=== Поиск дубликатов ===")
    duplicates, err := findDuplicates(".")
    if err != nil {
        fmt.Printf("Ошибка поиска дубликатов: %v\n", err)
        return
    }
    
    if len(duplicates) == 0 {
        fmt.Println("Дубликаты не найдены")
    } else {
        for hash, files := range duplicates {
            fmt.Printf("Дубликаты (MD5: %s):\n", hash)
            for _, file := range files {
                fmt.Printf("  - %s\n", file)
            }
        }
    }
    
    // Создаем бэкап
    fmt.Println("\n=== Создание бэкапа ===")
    if err := backupDirectory(".", "backups"); err != nil {
        fmt.Printf("Ошибка создания бэкапа: %v\n", err)
    } else {
        fmt.Println("Бэкап создан успешно")
    }
}
```

## Упражнения

1. Создайте программу для поиска файлов по шаблону с рекурсивным обходом директорий
2. Реализуйте простой текстовый редактор с возможностью открытия, редактирования и сохранения файлов
3. Напишите утилиту для подсчета строк, слов и символов в текстовых файлах
4. Создайте программу для архивирования и разархивирования файлов
5. Реализуйте систему логирования, которая пишет логи в файлы с ротацией по размеру

В следующем уроке мы изучим работу с конкурентностью и горутинами.
