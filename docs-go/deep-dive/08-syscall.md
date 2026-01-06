---
sidebar_position: 8
---

# Системное программирование

## Введение

> Эта тема носит преимущественно теоретический характер, и в реальности вам практически не придется иметь с ней дело (разумеется, за исключением случаев, когда вы собираетесь заниматься системным программированием либо тематиками, связанными с Embedded-разработкой).

Представьте, что ваша программа — это человек в офисе, а операционная система — это администратор здания. Когда вам нужно что-то, чего вы не можете сделать сами (открыть дверь, получить почту, заказать кофе), вы обращаетесь к администратору через специальный канал связи.

**System calls (syscalls)** — это именно такой канал связи между вашей программой и ядром операционной системы. Через syscalls программа может:
- Работать с файлами
- Управлять процессами
- Общаться по сети
- Выделять память
- И многое другое

Go предоставляет три уровня работы с системой:
1. **Высокоуровневый** — пакеты `os`, `io`, `net` (кроссплатформенные)
2. **Среднеуровневый** — пакет `syscall` (platform-specific)
3. **Низкоуровневый** — пакет `golang.org/x/sys` (расширенные syscalls)

## Основы системных вызовов

### Что такое syscall?

Когда ваша программа вызывает системный вызов:

```
User Space (ваша программа)
    ↓
    syscall instruction
    ↓
Kernel Space (операционная система)
    ↓
    выполнение операции
    ↓
    возврат результата
    ↓
User Space (ваша программа)
```

**Важно:** Переход между user space и kernel space дорогой (микросекунды). Поэтому программы стараются минимизировать syscalls.

### Основные категории syscalls

**1. Файловая система**
- `open`, `read`, `write`, `close`
- `stat`, `chmod`, `chown`
- `mkdir`, `rmdir`, `unlink`

**2. Процессы и потоки**
- `fork`, `exec`, `wait`
- `getpid`, `kill`
- `clone` (для создания потоков)

**3. Сеть**
- `socket`, `bind`, `listen`, `accept`
- `connect`, `send`, `recv`

**4. Память**
- `mmap`, `munmap`
- `brk`, `sbrk`

**5. Сигналы**
- `signal`, `sigaction`
- `kill`, `sigprocmask`

**6. Информация о системе**
- `uname`, `getuid`, `getgid`
- `gettimeofday`, `clock_gettime`

## Работа с файлами

### Высокоуровневый API (os пакет)

```go
package main

import (
    "fmt"
    "os"
)

func main() {
    // Создать файл
    file, err := os.Create("test.txt")
    if err != nil {
        panic(err)
    }
    defer file.Close()
    
    // Записать данные
    n, err := file.WriteString("Hello, World!\n")
    if err != nil {
        panic(err)
    }
    fmt.Printf("Wrote %d bytes\n", n)
    
    // Получить информацию о файле
    info, err := file.Stat()
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("File: %s\n", info.Name())
    fmt.Printf("Size: %d bytes\n", info.Size())
    fmt.Printf("Mode: %v\n", info.Mode())
    fmt.Printf("ModTime: %v\n", info.ModTime())
}
```

### Низкоуровневый API (syscall пакет)

```go
package main

import (
    "fmt"
    "syscall"
    "unsafe"
)

func main() {
    // Открыть файл напрямую через syscall
    fd, err := syscall.Open("test.txt", syscall.O_RDWR|syscall.O_CREAT, 0644)
    if err != nil {
        panic(err)
    }
    defer syscall.Close(fd)
    
    // Записать данные
    data := []byte("Hello from syscall!\n")
    n, err := syscall.Write(fd, data)
    if err != nil {
        panic(err)
    }
    fmt.Printf("Wrote %d bytes\n", n)
    
    // Получить информацию о файле
    var stat syscall.Stat_t
    err = syscall.Fstat(fd, &stat)
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Size: %d bytes\n", stat.Size)
    fmt.Printf("Mode: %o\n", stat.Mode)
    fmt.Printf("UID: %d\n", stat.Uid)
    fmt.Printf("GID: %d\n", stat.Gid)
}
```

### File Descriptors

File descriptor (fd) — это целое число, идентификатор открытого файла:

```
fd 0 = stdin  (стандартный ввод)
fd 1 = stdout (стандартный вывод)
fd 2 = stderr (стандартный вывод ошибок)
fd 3+ = другие открытые файлы
```

Пример работы с stdin/stdout:

```go
package main

import (
    "syscall"
)

func main() {
    // Читаем из stdin (fd = 0)
    buf := make([]byte, 1024)
    n, err := syscall.Read(0, buf)
    if err != nil {
        panic(err)
    }
    
    // Пишем в stdout (fd = 1)
    syscall.Write(1, buf[:n])
}
```

### Флаги открытия файлов

```go
const (
    O_RDONLY = syscall.O_RDONLY // Только чтение
    O_WRONLY = syscall.O_WRONLY // Только запись
    O_RDWR   = syscall.O_RDWR   // Чтение и запись
    O_CREAT  = syscall.O_CREAT  // Создать, если не существует
    O_EXCL   = syscall.O_EXCL   // С O_CREAT: ошибка, если существует
    O_TRUNC  = syscall.O_TRUNC  // Обрезать до 0 при открытии
    O_APPEND = syscall.O_APPEND // Дописывать в конец
    O_SYNC   = syscall.O_SYNC   // Синхронная запись
    O_NONBLOCK = syscall.O_NONBLOCK // Неблокирующий режим
)

// Комбинирование флагов
fd, err := syscall.Open("file.txt", 
    syscall.O_RDWR|syscall.O_CREAT|syscall.O_APPEND, 
    0644)
```

### Права доступа (permissions)

```go
const (
    S_IRUSR = 0400 // Владелец: чтение
    S_IWUSR = 0200 // Владелец: запись
    S_IXUSR = 0100 // Владелец: выполнение
    
    S_IRGRP = 0040 // Группа: чтение
    S_IWGRP = 0020 // Группа: запись
    S_IXGRP = 0010 // Группа: выполнение
    
    S_IROTH = 0004 // Другие: чтение
    S_IWOTH = 0002 // Другие: запись
    S_IXOTH = 0001 // Другие: выполнение
)

// 0644 = rw-r--r-- (владелец: rw, остальные: r)
// 0755 = rwxr-xr-x (владелец: rwx, остальные: rx)
fd, err := syscall.Open("file.txt", syscall.O_CREAT, 0644)
```

## Продвинутая работа с файлами

### Memory-mapped files (mmap)

Memory mapping позволяет работать с файлом как с массивом в памяти:

```go
package main

import (
    "fmt"
    "os"
    "syscall"
)

func main() {
    // Открываем файл
    file, err := os.OpenFile("data.bin", os.O_RDWR|os.O_CREATE, 0644)
    if err != nil {
        panic(err)
    }
    defer file.Close()
    
    // Установим размер файла (например, 1MB)
    size := 1024 * 1024
    if err := file.Truncate(int64(size)); err != nil {
        panic(err)
    }
    
    // Создаем memory mapping
    data, err := syscall.Mmap(
        int(file.Fd()),
        0,                    // offset
        size,                 // length
        syscall.PROT_READ|syscall.PROT_WRITE, // protection
        syscall.MAP_SHARED,   // flags
    )
    if err != nil {
        panic(err)
    }
    defer syscall.Munmap(data)
    
    // Работаем с файлом как с массивом
    data[0] = 'H'
    data[1] = 'e'
    data[2] = 'l'
    data[3] = 'l'
    data[4] = 'o'
    
    // Данные автоматически записываются в файл
    fmt.Println("Written to mmap:", string(data[:5]))
}
```

**Преимущества mmap:**
- Быстрый доступ (нет syscall overhead)
- Автоматическое кеширование ОС
- Разделяемая память между процессами

**Недостатки:**
- Ограничен размером виртуальной памяти
- Сложнее обработка ошибок

### File locking (flock)

Блокировки файлов для синхронизации между процессами:

```go
package main

import (
    "fmt"
    "os"
    "syscall"
    "time"
)

func main() {
    file, err := os.OpenFile("shared.txt", os.O_RDWR|os.O_CREATE, 0644)
    if err != nil {
        panic(err)
    }
    defer file.Close()
    
    // Эксклюзивная блокировка
    fmt.Println("Acquiring lock...")
    err = syscall.Flock(int(file.Fd()), syscall.LOCK_EX)
    if err != nil {
        panic(err)
    }
    fmt.Println("Lock acquired!")
    
    // Критическая секция
    file.WriteString("Process is working...\n")
    time.Sleep(5 * time.Second)
    
    // Снять блокировку
    syscall.Flock(int(file.Fd()), syscall.LOCK_UN)
    fmt.Println("Lock released")
}
```

Типы блокировок:
- `LOCK_SH` — разделяемая (shared) блокировка
- `LOCK_EX` — эксклюзивная (exclusive) блокировка
- `LOCK_UN` — снять блокировку
- `LOCK_NB` — неблокирующий режим (вернуть ошибку, если заблокировано)

### Директории и символические ссылки

```go
package main

import (
    "fmt"
    "syscall"
)

func main() {
    // Создать директорию
    err := syscall.Mkdir("testdir", 0755)
    if err != nil {
        panic(err)
    }
    
    // Создать символическую ссылку
    err = syscall.Symlink("target.txt", "link.txt")
    if err != nil {
        panic(err)
    }
    
    // Прочитать символическую ссылку
    buf := make([]byte, 1024)
    n, err := syscall.Readlink("link.txt", buf)
    if err != nil {
        panic(err)
    }
    fmt.Printf("Link points to: %s\n", string(buf[:n]))
    
    // Удалить файл
    err = syscall.Unlink("link.txt")
    if err != nil {
        panic(err)
    }
    
    // Удалить директорию
    err = syscall.Rmdir("testdir")
    if err != nil {
        panic(err)
    }
}
```

## Процессы

### Получение информации о процессе

```go
package main

import (
    "fmt"
    "os"
    "syscall"
)

func main() {
    // ID текущего процесса
    pid := os.Getpid()
    fmt.Printf("PID: %d\n", pid)
    
    // ID родительского процесса
    ppid := os.Getppid()
    fmt.Printf("Parent PID: %d\n", ppid)
    
    // User ID и Group ID
    uid := syscall.Getuid()
    gid := syscall.Getgid()
    fmt.Printf("UID: %d, GID: %d\n", uid, gid)
    
    // Effective UID/GID (для setuid программ)
    euid := syscall.Geteuid()
    egid := syscall.Getegid()
    fmt.Printf("EUID: %d, EGID: %d\n", euid, egid)
    
    // Рабочая директория
    wd, _ := os.Getwd()
    fmt.Printf("Working directory: %s\n", wd)
    
    // Переменные окружения
    fmt.Printf("PATH: %s\n", os.Getenv("PATH"))
}
```

### Запуск внешних программ

**Высокоуровневый API:**

```go
package main

import (
    "fmt"
    "os/exec"
)

func main() {
    // Простой запуск
    cmd := exec.Command("ls", "-la")
    output, err := cmd.Output()
    if err != nil {
        panic(err)
    }
    fmt.Println(string(output))
    
    // С перенаправлением ввода/вывода
    cmd = exec.Command("grep", "package")
    cmd.Stdin = strings.NewReader("package main\nfunc main() {}\n")
    output, err = cmd.Output()
    if err != nil {
        panic(err)
    }
    fmt.Println(string(output))
}
```

**Низкоуровневый API через fork/exec:**

```go
package main

import (
    "fmt"
    "os"
    "syscall"
)

func main() {
    // Путь к программе
    binary := "/bin/ls"
    args := []string{"ls", "-la"}
    env := os.Environ()
    
    // ForkExec комбинирует fork и exec
    pid, err := syscall.ForkExec(
        binary,
        args,
        &syscall.ProcAttr{
            Env:   env,
            Files: []uintptr{os.Stdin.Fd(), os.Stdout.Fd(), os.Stderr.Fd()},
        },
    )
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Started process with PID: %d\n", pid)
    
    // Ждем завершения
    var status syscall.WaitStatus
    _, err = syscall.Wait4(pid, &status, 0, nil)
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Process exited with status: %d\n", status.ExitStatus())
}
```

### Отправка сигналов процессам

```go
package main

import (
    "fmt"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func main() {
    // Обработчик сигналов
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM, syscall.SIGUSR1)
    
    go func() {
        for sig := range sigChan {
            switch sig {
            case syscall.SIGINT:
                fmt.Println("\nReceived SIGINT (Ctrl+C)")
            case syscall.SIGTERM:
                fmt.Println("\nReceived SIGTERM")
                os.Exit(0)
            case syscall.SIGUSR1:
                fmt.Println("\nReceived SIGUSR1 (custom signal)")
            }
        }
    }()
    
    fmt.Printf("Process PID: %d\n", os.Getpid())
    fmt.Println("Waiting for signals... (try: kill -USR1", os.Getpid(), ")")
    
    // Бесконечный цикл
    for {
        time.Sleep(1 * time.Second)
    }
}
```

Отправка сигнала из другого процесса:

```go
// Отправить SIGUSR1 процессу с PID 12345
err := syscall.Kill(12345, syscall.SIGUSR1)
if err != nil {
    panic(err)
}
```

## Сеть на низком уровне

### Создание TCP сервера через raw sockets

```go
package main

import (
    "fmt"
    "net"
    "syscall"
)

func main() {
    // Создаем socket
    fd, err := syscall.Socket(
        syscall.AF_INET,      // IPv4
        syscall.SOCK_STREAM,  // TCP
        0,                    // Protocol (0 = default)
    )
    if err != nil {
        panic(err)
    }
    defer syscall.Close(fd)
    
    // Разрешаем переиспользование адреса
    err = syscall.SetsockoptInt(fd, syscall.SOL_SOCKET, syscall.SO_REUSEADDR, 1)
    if err != nil {
        panic(err)
    }
    
    // Привязываем к адресу
    addr := syscall.SockaddrInet4{
        Port: 8080,
        Addr: [4]byte{0, 0, 0, 0}, // 0.0.0.0 - все интерфейсы
    }
    err = syscall.Bind(fd, &addr)
    if err != nil {
        panic(err)
    }
    
    // Начинаем слушать
    err = syscall.Listen(fd, 10) // backlog = 10
    if err != nil {
        panic(err)
    }
    
    fmt.Println("Server listening on :8080")
    
    for {
        // Принимаем соединение
        clientFd, clientAddr, err := syscall.Accept(fd)
        if err != nil {
            fmt.Println("Accept error:", err)
            continue
        }
        
        go handleClient(clientFd, clientAddr)
    }
}

func handleClient(fd int, addr syscall.Sockaddr) {
    defer syscall.Close(fd)
    
    // Читаем данные
    buf := make([]byte, 1024)
    n, err := syscall.Read(fd, buf)
    if err != nil {
        return
    }
    
    fmt.Printf("Received: %s", string(buf[:n]))
    
    // Отправляем ответ
    response := []byte("HTTP/1.1 200 OK\r\nContent-Length: 13\r\n\r\nHello, World!")
    syscall.Write(fd, response)
}
```

### Non-blocking I/O

```go
package main

import (
    "fmt"
    "syscall"
    "time"
)

func main() {
    // Создаем socket
    fd, err := syscall.Socket(syscall.AF_INET, syscall.SOCK_STREAM, 0)
    if err != nil {
        panic(err)
    }
    defer syscall.Close(fd)
    
    // Устанавливаем non-blocking режим
    err = syscall.SetNonblock(fd, true)
    if err != nil {
        panic(err)
    }
    
    // Подключаемся
    addr := syscall.SockaddrInet4{
        Port: 80,
        Addr: [4]byte{93, 184, 216, 34}, // example.com
    }
    
    err = syscall.Connect(fd, &addr)
    if err != nil && err != syscall.EINPROGRESS {
        panic(err)
    }
    
    // В non-blocking режиме connect возвращает EINPROGRESS
    fmt.Println("Connecting...")
    time.Sleep(100 * time.Millisecond)
    
    // Проверяем, подключились ли мы
    _, err = syscall.GetsockoptInt(fd, syscall.SOL_SOCKET, syscall.SO_ERROR)
    if err != nil {
        panic(err)
    }
    
    fmt.Println("Connected!")
    
    // Отправляем HTTP запрос
    request := []byte("GET / HTTP/1.0\r\nHost: example.com\r\n\r\n")
    _, err = syscall.Write(fd, request)
    if err != nil {
        panic(err)
    }
    
    // Читаем ответ (может вернуть EAGAIN, если данных еще нет)
    buf := make([]byte, 4096)
    for {
        n, err := syscall.Read(fd, buf)
        if err == syscall.EAGAIN {
            // Данных пока нет, попробуем позже
            time.Sleep(10 * time.Millisecond)
            continue
        }
        if err != nil {
            break
        }
        if n == 0 {
            break
        }
        fmt.Print(string(buf[:n]))
    }
}
```

## Epoll — эффективный I/O multiplexing (Linux)

Epoll позволяет эффективно работать с множеством file descriptors:

```go
package main

import (
    "fmt"
    "syscall"
)

func main() {
    // Создаем epoll instance
    epfd, err := syscall.EpollCreate1(0)
    if err != nil {
        panic(err)
    }
    defer syscall.Close(epfd)
    
    // Создаем listening socket
    serverFd, err := syscall.Socket(syscall.AF_INET, syscall.SOCK_STREAM, 0)
    if err != nil {
        panic(err)
    }
    defer syscall.Close(serverFd)
    
    // Настраиваем socket
    syscall.SetsockoptInt(serverFd, syscall.SOL_SOCKET, syscall.SO_REUSEADDR, 1)
    syscall.SetNonblock(serverFd, true)
    
    // Bind и Listen
    addr := syscall.SockaddrInet4{Port: 8080}
    syscall.Bind(serverFd, &addr)
    syscall.Listen(serverFd, 128)
    
    // Добавляем server socket в epoll
    event := syscall.EpollEvent{
        Events: syscall.EPOLLIN, // Интересуют события чтения
        Fd:     int32(serverFd),
    }
    err = syscall.EpollCtl(epfd, syscall.EPOLL_CTL_ADD, serverFd, &event)
    if err != nil {
        panic(err)
    }
    
    fmt.Println("Server listening on :8080")
    
    events := make([]syscall.EpollEvent, 10)
    
    for {
        // Ждем события
        n, err := syscall.EpollWait(epfd, events, -1)
        if err != nil {
            continue
        }
        
        for i := 0; i < n; i++ {
            if int(events[i].Fd) == serverFd {
                // Новое соединение
                clientFd, _, err := syscall.Accept(serverFd)
                if err != nil {
                    continue
                }
                
                syscall.SetNonblock(clientFd, true)
                
                // Добавляем client в epoll
                event := syscall.EpollEvent{
                    Events: syscall.EPOLLIN,
                    Fd:     int32(clientFd),
                }
                syscall.EpollCtl(epfd, syscall.EPOLL_CTL_ADD, clientFd, &event)
                
                fmt.Println("New connection:", clientFd)
            } else {
                // Данные от клиента
                clientFd := int(events[i].Fd)
                buf := make([]byte, 1024)
                n, err := syscall.Read(clientFd, buf)
                
                if err != nil || n == 0 {
                    // Соединение закрыто
                    syscall.EpollCtl(epfd, syscall.EPOLL_CTL_DEL, clientFd, nil)
                    syscall.Close(clientFd)
                    fmt.Println("Connection closed:", clientFd)
                } else {
                    fmt.Printf("Received from %d: %s", clientFd, string(buf[:n]))
                    // Эхо обратно
                    syscall.Write(clientFd, buf[:n])
                }
            }
        }
    }
}
```

## Работа с виртуальной памятью

### Выделение памяти через mmap

```go
package main

import (
    "fmt"
    "syscall"
    "unsafe"
)

func main() {
    // Выделяем 1MB анонимной памяти
    size := 1024 * 1024
    
    mem, err := syscall.Mmap(
        -1,                   // fd = -1 для анонимной памяти
        0,                    // offset
        size,                 // length
        syscall.PROT_READ|syscall.PROT_WRITE,
        syscall.MAP_PRIVATE|syscall.MAP_ANONYMOUS,
    )
    if err != nil {
        panic(err)
    }
    defer syscall.Munmap(mem)
    
    // Используем память
    mem[0] = 'H'
    mem[1] = 'e'
    mem[2] = 'l'
    mem[3] = 'l'
    mem[4] = 'o'
    
    fmt.Println("Memory:", string(mem[:5]))
    
    // Защищаем часть памяти (делаем read-only)
    err = syscall.Mprotect(mem[:4096], syscall.PROT_READ)
    if err != nil {
        panic(err)
    }
    
    // Попытка записи вызовет SIGSEGV
    // mem[0] = 'X' // Segmentation fault!
}
```

### Информация о памяти процесса

```go
package main

import (
    "fmt"
    "os"
    "runtime"
    "syscall"
)

func main() {
    var rusage syscall.Rusage
    err := syscall.Getrusage(syscall.RUSAGE_SELF, &rusage)
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Max RSS: %d KB\n", rusage.Maxrss)
    fmt.Printf("User CPU time: %v\n", rusage.Utime)
    fmt.Printf("System CPU time: %v\n", rusage.Stime)
    fmt.Printf("Page faults: %d\n", rusage.Majflt)
    
    // Через runtime
    var m runtime.MemStats
    runtime.ReadMemStats(&m)
    
    fmt.Printf("\nGo Runtime:\n")
    fmt.Printf("Alloc: %d MB\n", m.Alloc/1024/1024)
    fmt.Printf("TotalAlloc: %d MB\n", m.TotalAlloc/1024/1024)
    fmt.Printf("Sys: %d MB\n", m.Sys/1024/1024)
    fmt.Printf("NumGC: %d\n", m.NumGC)
}
```

## Информация о системе

### Получение информации об ОС

```go
package main

import (
    "fmt"
    "syscall"
)

func main() {
    var utsname syscall.Utsname
    err := syscall.Uname(&utsname)
    if err != nil {
        panic(err)
    }
    
    // Преобразуем [65]byte в string
    toString := func(b [65]byte) string {
        n := 0
        for n < len(b) && b[n] != 0 {
            n++
        }
        return string(b[:n])
    }
    
    fmt.Println("System information:")
    fmt.Printf("OS: %s\n", toString(utsname.Sysname))
    fmt.Printf("Hostname: %s\n", toString(utsname.Nodename))
    fmt.Printf("Release: %s\n", toString(utsname.Release))
    fmt.Printf("Version: %s\n", toString(utsname.Version))
    fmt.Printf("Architecture: %s\n", toString(utsname.Machine))
}
```

### Получение информации о системном времени

```go
package main

import (
    "fmt"
    "syscall"
    "time"
)

func main() {
    // Высокое разрешение времени
    var ts syscall.Timespec
    err := syscall.ClockGettime(syscall.CLOCK_MONOTONIC, &ts)
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Monotonic time: %d.%09d seconds\n", ts.Sec, ts.Nsec)
    
    // Для измерения времени выполнения
    err = syscall.ClockGettime(syscall.CLOCK_MONOTONIC, &ts)
    startNs := ts.Sec*1e9 + ts.Nsec
    
    // Выполняем работу
    time.Sleep(100 * time.Millisecond)
    
    err = syscall.ClockGettime(syscall.CLOCK_MONOTONIC, &ts)
    endNs := ts.Sec*1e9 + ts.Nsec
    
    fmt.Printf("Elapsed: %d ns\n", endNs-startNs)
}
```

## Практический пример: простой HTTP сервер на syscalls

```go
package main

import (
    "fmt"
    "syscall"
    "time"
)

func main() {
    // Создаем epoll
    epfd, _ := syscall.EpollCreate1(0)
    defer syscall.Close(epfd)
    
    // Создаем listening socket
    serverFd, _ := syscall.Socket(syscall.AF_INET, syscall.SOCK_STREAM, 0)
    defer syscall.Close(serverFd)
    
    syscall.SetsockoptInt(serverFd, syscall.SOL_SOCKET, syscall.SO_REUSEADDR, 1)
    syscall.SetNonblock(serverFd, true)
    
    addr := syscall.SockaddrInet4{Port: 8080}
    syscall.Bind(serverFd, &addr)
    syscall.Listen(serverFd, 128)
    
    // Регистрируем в epoll
    event := syscall.EpollEvent{
        Events: syscall.EPOLLIN | syscall.EPOLLET, // Edge-triggered
        Fd:     int32(serverFd),
    }
    syscall.EpollCtl(epfd, syscall.EPOLL_CTL_ADD, serverFd, &event)
    
    fmt.Println("HTTP Server on :8080")
    fmt.Println("Try: curl http://localhost:8080")
    
    events := make([]syscall.EpollEvent, 32)
    clients := make(map[int32]*ClientState)
    
    for {
        n, _ := syscall.EpollWait(epfd, events, -1)
        
        for i := 0; i < n; i++ {
            fd := events[i].Fd
            
            if int(fd) == serverFd {
                // Новое соединение
                for {
                    clientFd, _, err := syscall.Accept(serverFd)
                    if err != nil {
                        break
                    }
                    
                    syscall.SetNonblock(clientFd, true)
                    
                    event := syscall.EpollEvent{
                        Events: syscall.EPOLLIN | syscall.EPOLLET,
                        Fd:     int32(clientFd),
                    }
                    syscall.EpollCtl(epfd, syscall.EPOLL_CTL_ADD, clientFd, &event)
                    
                    clients[int32(clientFd)] = &ClientState{
                        fd:      clientFd,
                        buffer:  make([]byte, 4096),
                    }
                }
            } else {
                // Данные от клиента
                client := clients[fd]
                if client == nil {
                    continue
                }
                
                n, err := syscall.Read(client.fd, client.buffer)
                if err != nil || n == 0 {
                    // Закрываем соединение
                    syscall.Close(client.fd)
                    delete(clients, fd)
                    continue
                }
                
                // Простой HTTP ответ
                response := fmt.Sprintf(
                    "HTTP/1.1 200 OK\r\n"+
                    "Content-Type: text/plain\r\n"+
                    "Content-Length: 26\r\n"+
                    "Date: %s\r\n"+
                    "\r\n"+
                    "Hello from raw syscalls!\n",
                    time.Now().Format(time.RFC1123))
                
                syscall.Write(client.fd, []byte(response))
                syscall.Close(client.fd)
                delete(clients, fd)
            }
        }
    }
}

type ClientState struct {
    fd     int
    buffer []byte
}
```

## Безопасность и ограничения ресурсов

### Изменение пользователя (требует root)

```go
package main

import (
    "fmt"
    "os"
    "syscall"
)

func main() {
    if os.Geteuid() != 0 {
        fmt.Println("This program must be run as root")
        os.Exit(1)
    }
    
    // Получаем UID для пользователя "nobody"
    // В реальности используйте user.Lookup("nobody")
    nobodyUID := 65534
    nobodyGID := 65534
    
    // Сбрасываем привилегии
    err := syscall.Setgid(nobodyGID)
    if err != nil {
        panic(err)
    }
    
    err = syscall.Setuid(nobodyUID)
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Now running as UID: %d, GID: %d\n", 
        syscall.Getuid(), syscall.Getgid())
    
    // Теперь программа работает с ограниченными правами
}
```

### Установка лимитов ресурсов (rlimit)

```go
package main

import (
    "fmt"
    "syscall"
)

func main() {
    // Получаем текущий лимит открытых файлов
    var rlimit syscall.Rlimit
    err := syscall.Getrlimit(syscall.RLIMIT_NOFILE, &rlimit)
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Current limits:\n")
    fmt.Printf("  Soft: %d\n", rlimit.Cur)
    fmt.Printf("  Hard: %d\n", rlimit.Max)
    
    // Увеличиваем soft limit
    rlimit.Cur = rlimit.Max
    err = syscall.Setrlimit(syscall.RLIMIT_NOFILE, &rlimit)
    if err != nil {
        panic(err)
    }
    
    fmt.Println("Increased soft limit to maximum")
    
    // Другие лимиты:
    // RLIMIT_CPU      - CPU время
    // RLIMIT_DATA     - размер данных
    // RLIMIT_STACK    - размер стека
    // RLIMIT_CORE     - размер core dump
    // RLIMIT_AS       - адресное пространство
    // RLIMIT_MEMLOCK  - locked память
    // RLIMIT_NPROC    - количество процессов
}
```

## Chroot — изоляция файловой системы

```go
package main

import (
    "fmt"
    "os"
    "syscall"
)

func main() {
    if os.Geteuid() != 0 {
        fmt.Println("chroot requires root privileges")
        os.Exit(1)
    }
    
    // Создаем изолированную директорию
    jailDir := "/tmp/jail"
    os.MkdirAll(jailDir+"/bin", 0755)
    os.MkdirAll(jailDir+"/lib", 0755)
    
    // Копируем необходимые файлы в jail
    // (в реальности нужно скопировать бинарники и библиотеки)
    
    // Меняем корневую директорию
    err := syscall.Chroot(jailDir)
    if err != nil {
        panic(err)
    }
    
    // Меняем рабочую директорию
    err = syscall.Chdir("/")
    if err != nil {
        panic(err)
    }
    
    fmt.Println("Now in chroot jail!")
    fmt.Println("Can only access files in", jailDir)
    
    // Процесс изолирован и не может получить доступ к файлам вне jail
}
```

## Продвинутые возможности (Linux-specific)

### Namespaces — основа контейнеров

```go
package main

import (
    "fmt"
    "os"
    "os/exec"
    "syscall"
)

func main() {
    cmd := exec.Command("/bin/bash")
    cmd.Stdin = os.Stdin
    cmd.Stdout = os.Stdout
    cmd.Stderr = os.Stderr
    
    // Создаем новые namespaces
    cmd.SysProcAttr = &syscall.SysProcAttr{
        Cloneflags: syscall.CLONE_NEWUTS |  // Hostname namespace
                    syscall.CLONE_NEWPID |  // PID namespace
                    syscall.CLONE_NEWNS,    // Mount namespace
    }
    
    err := cmd.Run()
    if err != nil {
        panic(err)
    }
}
```

Доступные namespaces:
- `CLONE_NEWUTS` — hostname и domain name
- `CLONE_NEWPID` — process IDs
- `CLONE_NEWNS` — mount points
- `CLONE_NEWNET` — network stack
- `CLONE_NEWIPC` — IPC
- `CLONE_NEWUSER` — user IDs
- `CLONE_NEWCGROUP` — cgroup root directory

### Cgroups — ограничение ресурсов

```go
package main

import (
    "fmt"
    "os"
    "path/filepath"
    "strconv"
)

func main() {
    cgroupPath := "/sys/fs/cgroup/memory/myapp"
    
    // Создаем cgroup
    err := os.MkdirAll(cgroupPath, 0755)
    if err != nil {
        panic(err)
    }
    
    // Устанавливаем лимит памяти (100MB)
    limitFile := filepath.Join(cgroupPath, "memory.limit_in_bytes")
    err = os.WriteFile(limitFile, []byte("104857600"), 0644)
    if err != nil {
        panic(err)
    }
    
    // Добавляем текущий процесс в cgroup
    procsFile := filepath.Join(cgroupPath, "cgroup.procs")
    pid := strconv.Itoa(os.Getpid())
    err = os.WriteFile(procsFile, []byte(pid), 0644)
    if err != nil {
        panic(err)
    }
    
    fmt.Println("Process limited to 100MB of memory")
    
    // Теперь процесс не сможет использовать больше 100MB
}
```

## Отладка syscalls

### Использование strace

```bash
# Отследить все syscalls программы
strace ./myprogram

# Отследить только файловые операции
strace -e trace=file ./myprogram

# Отследить сетевые операции
strace -e trace=network ./myprogram

# Показать время каждого syscall
strace -T ./myprogram

# Статистика по syscalls
strace -c ./myprogram
```

Пример вывода:

```
% time     seconds  usecs/call     calls    errors syscall
------ ----------- ----------- --------- --------- ----------------
 99.76    0.450000        4500       100           read
  0.24    0.001080          54        20           write
  0.00    0.000000           0        10           open
  0.00    0.000000           0        10           close
------ ----------- ----------- --------- --------- ----------------
100.00    0.451080                   140           total
```

## Best Practices

### ✅ Делайте

1. **Используйте высокоуровневые API когда возможно**
   ```go
   // Предпочтительно
   os.ReadFile("file.txt")
   
   // Вместо
   fd, _ := syscall.Open("file.txt", syscall.O_RDONLY, 0)
   // ...
   ```

2. **Проверяйте ошибки**
   ```go
   fd, err := syscall.Open("file.txt", syscall.O_RDONLY, 0)
   if err != nil {
       return fmt.Errorf("failed to open: %w", err)
   }
   defer syscall.Close(fd)
   ```

3. **Закрывайте файловые дескрипторы**
   ```go
   fd, _ := syscall.Open("file.txt", syscall.O_RDONLY, 0)
   defer syscall.Close(fd) // Всегда используйте defer
   ```

4. **Используйте правильные флаги**
   ```go
   // Атомарное создание файла
   fd, err := syscall.Open("file.txt", 
       syscall.O_CREAT|syscall.O_EXCL|syscall.O_WRONLY, 
       0644)
   ```

### ❌ Не делайте

1. **Не игнорируйте ошибки**
   ```go
   // ❌ Плохо
   syscall.Write(fd, data)
   
   // ✅ Хорошо
   n, err := syscall.Write(fd, data)
   if err != nil || n != len(data) {
       // Обработать ошибку
   }
   ```

2. **Не забывайте про race conditions**
   ```go
   // ❌ Плохо - TOCTOU (Time-of-check to time-of-use)
   if _, err := os.Stat("file.txt"); err == nil {
       os.Remove("file.txt") // Файл может измениться между проверками
   }
   
   // ✅ Хорошо
   err := os.Remove("file.txt")
   if err != nil && !os.IsNotExist(err) {
       // Обработать ошибку
   }
   ```

3. **Не используйте syscalls без необходимости**
   ```go
   // ❌ Плохо - усложнение без причины
   fd, _ := syscall.Open("file.txt", syscall.O_RDONLY, 0)
   buf := make([]byte, 1024)
   syscall.Read(fd, buf)
   syscall.Close(fd)
   
   // ✅ Хорошо - простой и понятный код
   data, err := os.ReadFile("file.txt")
   ```

## Заключение

Системное программирование в Go дает полный контроль над взаимодействием с операционной системой:

**Уровни абстракции:**
- **Высокий** (os, io, net) — для большинства задач
- **Средний** (syscall) — для специфичных платформе операций
- **Низкий** (golang.org/x/sys) — для продвинутых возможностей

**Основные области:**
- Файлы и директории
- Процессы и сигналы
- Сеть и сокеты
- Память и ресурсы
- Безопасность и изоляция

**Инструменты отладки:**
- `strace` — трассировка syscalls
- `ltrace` — трассировка библиотечных вызовов
- `perf` — профилирование системных операций

**Помните:**
- Syscalls медленнее обычных вызовов функций
- Всегда проверяйте ошибки
- Используйте высокоуровневые API когда возможно
- Тестируйте на разных платформах

Системное программирование — мощный инструмент, но используйте его разумно!
