---
sidebar_position: 9
---

# Go + gRPC

## Введение: Почему gRPC?

Представьте, что вы строите распределённую систему из микросервисов. Традиционный REST API с JSON работает, но вы замечаете проблемы: сериализация JSON медленная, нет строгих контрактов между сервисами, документация устаревает, а двунаправленная потоковая передача данных превращается в костыль.

gRPC решает эти проблемы элегантно. Это современный RPC-фреймворк от Google, который использует Protocol Buffers для сериализации и HTTP/2 для транспорта. Результат: высокая производительность, строгая типизация и встроенная поддержка стриминга.

## Protocol Buffers — язык контрактов

Protocol Buffers (protobuf) — это язык описания данных, который компилируется в код на различных языках программирования.

### Что такое файл .proto и из чего он строится

Файл с расширением **.proto** — это файл описания схемы данных в **Protocol Buffers** (Protobuf), разработанном Google. Это язык описания интерфейса (IDL), который определяет структуру данных (сообщения), перечисления, сервисы и т.д. Из такого файла компилятор `protoc` генерирует код на разных языках (C++, Java, Python, Go и др.) для сериализации/десериализации данных.

Файл .proto — это **текстовый файл** с синтаксисом, похожим на C/C++. Он состоит из нескольких основных элементов. Сейчас самая распространённая версия — **proto3** (упрощённая по сравнению с proto2).

#### Основная структура файла .proto

Файл строится из следующих ключевых частей (в порядке, в котором они обычно появляются):

1. **Объявление версии (syntax)**  
   Первая непустая строка (не комментарий) — обязательно указывает версию.  
   ```proto
   syntax = "proto3";  // или "proto2" для старой версии
   ```

2. **Пакет (package)**  
   Определяет пространство имён, чтобы избежать конфликтов имён.  
   ```proto
   package foo.bar;
   ```

3. **Импорты (import)**  
   Подключает определения из других .proto-файлов.  
   ```proto
   import "google/protobuf/timestamp.proto";
   import public "other.proto";  // public — для реэкспорта
   ```

4. **Опции (option)**  
   Метаданные для генерации кода (например, для Java или C++).  
   ```proto
   option java_package = "com.example.myproto";
   option java_outer_classname = "MyProto";
   ```

5. **Определения сообщений (message)**  
   Основная часть: описывают структуру данных, как класс или struct.  
   Внутри — поля, вложенные сообщения, перечисления и т.д.  
   Каждое поле: тип, имя, уникальный номер (tag).  
   ```proto
   message Person {
     string name = 1;
     int32 id = 2;
     string email = 3;
     repeated string phones = 4;  // массив
   }
   ```

6. **Перечисления (enum)**  
   Набор именованных констант.  
   ```proto
   enum PhoneType {
     PHONE_TYPE_UNSPECIFIED = 0;  // всегда 0 для неизвестного
     MOBILE = 1;
     HOME = 2;
     WORK = 3;
   }
   ```

7. **Карты (map)**  
   Словарь (ключ-значение).  
   ```proto
   map<string, int32> scores = 5;
   ```

8. **Oneof**  
   Группа полей, из которых только одно может быть установлено.  
   ```proto
   oneof contact {
     string email = 6;
     string phone = 7;
   }
   ```

9. **Сервисы (service)**  
   Для gRPC: описывают RPC-методы (не всегда используется).  
   ```proto
   service MyService {
     rpc GetPerson(PersonRequest) returns (Person);
     rpc StreamData(stream DataRequest) returns (stream DataResponse);
   }
   ```

10. **Зарезервированные поля (reserved)**  
    Чтобы в будущем не использовать определённые номера или имена.  
    ```proto
    reserved 10, 15 to 20;
    reserved "old_field";
    ```

### Пример .proto файла для сервиса управления задачами 

```proto
// task.proto
syntax = "proto3";

package taskpb;

option go_package = "github.com/yourname/taskservice/pb";

// Сообщение Task
message Task {
  string id = 1;
  string title = 2;
  string description = 3;
  bool completed = 4;
  int64 created_at = 5;
}

// Запрос на создание задачи
message CreateTaskRequest {
  string title = 1;
  string description = 2;
}

message CreateTaskResponse {
  Task task = 1;
}

// Запрос на получение задачи
message GetTaskRequest {
  string id = 1;
}

message GetTaskResponse {
  Task task = 1;
}

// Запрос на список задач
message ListTasksRequest {
  int32 page_size = 1;
  string page_token = 2;
}

message ListTasksResponse {
  repeated Task tasks = 1;
  string next_page_token = 2;
}

// Определение сервиса
service TaskService {
  rpc CreateTask(CreateTaskRequest) returns (CreateTaskResponse);
  rpc GetTask(GetTaskRequest) returns (GetTaskResponse);
  rpc ListTasks(ListTasksRequest) returns (ListTasksResponse);
  
  // Стриминг: сервер отправляет обновления в реальном времени
  rpc WatchTasks(ListTasksRequest) returns (stream Task);
}
```

**Ключевые моменты:**
- Каждое поле имеет уникальный номер (это номера для бинарного формата)
- `repeated` означает массив
- `stream` означает потоковую передачу данных

После написания .proto-файла запускаете `protoc` — он генерирует классы для работы с данными. Protobuf эффективен, компактен и поддерживает эволюцию схемы (добавление полей без ломания старого кода).

## Установка компилятора Protocol Buffers

Компилятор protocol buffer, `protoc`, используется для компиляции файлов `.proto`, в которых содержатся определения сервисов и сообщений. Выберите один из методов ниже для установки `protoc`.

### Установка предкомпилированных бинарных файлов (любая ОС) {#binary-install}

Чтобы установить последнюю версию компилятора protocol из предкомпилированных бинарных файлов, следуйте этим инструкциям:

1. С сайта https://github.com/protocolbuffers/protobuf/releases вручную скачайте zip-файл, соответствующий вашей операционной системе и архитектуре компьютера (`protoc-<version>-<os>-<arch>.zip`), или загрузите файл с помощью команд, подобных следующим:
   ```sh
   PB_REL="https://github.com/protocolbuffers/protobuf/releases"
   curl -LO $PB_REL/download/v33.2/protoc-33.2-linux-x86_64.zip
   ```

2. Распакуйте файл в `$HOME/.local` или в каталог на ваш выбор. Например:
   ```sh
   unzip protoc-33.2-linux-x86_64.zip -d $HOME/.local
   ```

3. Обновите переменную окружения PATH, чтобы включить путь к исполняемому файлу `protoc`. Например:
   ```sh
   export PATH="$PATH:$HOME/.local/bin"
   ```

### Установка с помощью менеджера пакетов {#package-manager}

> **Предупреждение**  
> После установки с помощью менеджера пакетов выполните `protoc --version`, чтобы проверить версию `protoc` и убедиться, что она достаточно новая. Версии `protoc`, устанавливаемые некоторыми менеджерами пакетов, могут быть довольно устаревшими. Смотрите страницу [Поддержка версий](https://protobuf.dev/support/version-support), чтобы сравнить результат проверки версии с номером минорной версии поддерживаемой версии языка(ов), которые вы используете.

Вы можете установить компилятор protocol, `protoc`, с помощью менеджера пакетов в Linux, macOS или Windows, используя следующие команды.

- Linux, с использованием `apt` или `apt-get`, например:
  ```sh
  apt install -y protobuf-compiler
  protoc --version  # Убедитесь, что версия компилятора 3+
  ```

- macOS, с использованием [Homebrew](https://brew.sh):
  ```sh
  brew install protobuf
  protoc --version  # Убедитесь, что версия компилятора 3+
  ```

- Windows, с использованием [Winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/):
  ```sh
  > winget install protobuf
  > protoc --version  # Убедитесь, что версия компилятора 3+
  ```
  
### Другие варианты установки 

Если вы хотите собрать компилятор protocol из исходного кода или получить доступ к старым версиям предкомпилированных бинарных файлов, смотрите страницу [Скачивание Protocol Buffers](https://protobuf.dev/downloads).

```bash
# Go плагины для protoc
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

### Компиляция proto-файла

Скомпилируйте proto-файл:

```bash
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    task.proto
```

Это создаст два файла: `task.pb.go` (структуры данных) и `task_grpc.pb.go` (интерфейсы сервиса).

## Реализация gRPC сервера

Теперь напишем сервер, который реализует наш `TaskService`:

```go
package main

import (
    "context"
    "fmt"
    "log"
    "net"
    "sync"
    "time"

    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
    
    pb "github.com/yourname/taskservice/pb"
)

// TaskServer реализует интерфейс TaskServiceServer
type TaskServer struct {
    pb.UnimplementedTaskServiceServer
    
    mu    sync.RWMutex
    tasks map[string]*pb.Task
}

func NewTaskServer() *TaskServer {
    return &TaskServer{
        tasks: make(map[string]*pb.Task),
    }
}

// CreateTask создаёт новую задачу
func (s *TaskServer) CreateTask(ctx context.Context, req *pb.CreateTaskRequest) (*pb.CreateTaskResponse, error) {
    // Валидация
    if req.Title == "" {
        return nil, status.Error(codes.InvalidArgument, "title is required")
    }
    
    // Создаём задачу
    task := &pb.Task{
        Id:          generateID(),
        Title:       req.Title,
        Description: req.Description,
        Completed:   false,
        CreatedAt:   time.Now().Unix(),
    }
    
    s.mu.Lock()
    s.tasks[task.Id] = task
    s.mu.Unlock()
    
    log.Printf("Created task: %s", task.Id)
    
    return &pb.CreateTaskResponse{Task: task}, nil
}

// GetTask получает задачу по ID
func (s *TaskServer) GetTask(ctx context.Context, req *pb.GetTaskRequest) (*pb.GetTaskResponse, error) {
    s.mu.RLock()
    task, exists := s.tasks[req.Id]
    s.mu.RUnlock()
    
    if !exists {
        return nil, status.Errorf(codes.NotFound, "task %s not found", req.Id)
    }
    
    return &pb.GetTaskResponse{Task: task}, nil
}

// ListTasks возвращает список всех задач
func (s *TaskServer) ListTasks(ctx context.Context, req *pb.ListTasksRequest) (*pb.ListTasksResponse, error) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    
    tasks := make([]*pb.Task, 0, len(s.tasks))
    for _, task := range s.tasks {
        tasks = append(tasks, task)
    }
    
    return &pb.ListTasksResponse{Tasks: tasks}, nil
}

// WatchTasks отправляет обновления в реальном времени (server streaming)
func (s *TaskServer) WatchTasks(req *pb.ListTasksRequest, stream pb.TaskService_WatchTasksServer) error {
    // Отправляем существующие задачи
    s.mu.RLock()
    for _, task := range s.tasks {
        if err := stream.Send(task); err != nil {
            s.mu.RUnlock()
            return err
        }
    }
    s.mu.RUnlock()
    
    // Здесь в реальном приложении вы бы подписались на обновления
    // Для примера просто держим соединение открытым
    <-stream.Context().Done()
    return stream.Context().Err()
}

func generateID() string {
    return fmt.Sprintf("task_%d", time.Now().UnixNano())
}

func main() {
    // Создаём TCP listener
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatalf("Failed to listen: %v", err)
    }
    
    // Создаём gRPC сервер
    grpcServer := grpc.NewServer()
    
    // Регистрируем наш сервис
    taskServer := NewTaskServer()
    pb.RegisterTaskServiceServer(grpcServer, taskServer)
    
    log.Println("gRPC server listening on :50051")
    
    // Запускаем сервер
    if err := grpcServer.Serve(lis); err != nil {
        log.Fatalf("Failed to serve: %v", err)
    }
}
```

**Важные детали:**
- `UnimplementedTaskServiceServer` встраивается для обратной совместимости
- Используем `sync.RWMutex` для безопасного доступа к данным
- gRPC ошибки используют специальные коды (`codes.InvalidArgument`, `codes.NotFound`)
- Контекст передаётся автоматически и поддерживает отмену операций

## Создание gRPC клиента

```go
package main

import (
    "context"
    "io"
    "log"
    "time"

    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"
    
    pb "github.com/yourname/taskservice/pb"
)

func main() {
    // Подключаемся к серверу
    conn, err := grpc.Dial("localhost:50051", 
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )
    if err != nil {
        log.Fatalf("Failed to connect: %v", err)
    }
    defer conn.Close()
    
    // Создаём клиент
    client := pb.NewTaskServiceClient(conn)
    
    // Контекст с таймаутом
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    // Создаём задачу
    createResp, err := client.CreateTask(ctx, &pb.CreateTaskRequest{
        Title:       "Изучить gRPC",
        Description: "Пройти глубокий урок по Go + gRPC",
    })
    if err != nil {
        log.Fatalf("CreateTask failed: %v", err)
    }
    log.Printf("Created task: %v", createResp.Task)
    
    // Получаем задачу
    getResp, err := client.GetTask(ctx, &pb.GetTaskRequest{
        Id: createResp.Task.Id,
    })
    if err != nil {
        log.Fatalf("GetTask failed: %v", err)
    }
    log.Printf("Retrieved task: %v", getResp.Task)
    
    // Создаём ещё несколько задач
    for i := 0; i < 3; i++ {
        client.CreateTask(ctx, &pb.CreateTaskRequest{
            Title: fmt.Sprintf("Task %d", i+1),
        })
    }
    
    // Получаем список задач
    listResp, err := client.ListTasks(ctx, &pb.ListTasksRequest{})
    if err != nil {
        log.Fatalf("ListTasks failed: %v", err)
    }
    log.Printf("Total tasks: %d", len(listResp.Tasks))
    
    // Демонстрация стриминга
    demonstrateStreaming(client)
}

func demonstrateStreaming(client pb.TaskServiceClient) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    stream, err := client.WatchTasks(ctx, &pb.ListTasksRequest{})
    if err != nil {
        log.Fatalf("WatchTasks failed: %v", err)
    }
    
    log.Println("Watching tasks...")
    for {
        task, err := stream.Recv()
        if err == io.EOF {
            break
        }
        if err != nil {
            log.Fatalf("Stream error: %v", err)
        }
        log.Printf("Received task: %s - %s", task.Id, task.Title)
    }
}
```

## Продвинутые концепции

### Interceptors (Middleware)

Interceptors позволяют добавить сквозную логику (логирование, аутентификацию, метрики):

```go
// Unary interceptor (для обычных RPC)
func loggingInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    start := time.Now()
    
    log.Printf("Method: %s, Request: %v", info.FullMethod, req)
    
    // Вызываем обработчик
    resp, err := handler(ctx, req)
    
    log.Printf("Method: %s, Duration: %v, Error: %v", 
        info.FullMethod, time.Since(start), err)
    
    return resp, err
}

// Добавляем к серверу
grpcServer := grpc.NewServer(
    grpc.UnaryInterceptor(loggingInterceptor),
)
```

### Bidirectional Streaming

Двунаправленный стриминг позволяет клиенту и серверу обмениваться сообщениями одновременно:

```protobuf
service ChatService {
  rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}
```

```go
func (s *ChatServer) Chat(stream pb.ChatService_ChatServer) error {
    for {
        msg, err := stream.Recv()
        if err == io.EOF {
            return nil
        }
        if err != nil {
            return err
        }
        
        // Обрабатываем сообщение и отправляем ответ
        response := &pb.ChatMessage{
            User:    "bot",
            Message: fmt.Sprintf("Echo: %s", msg.Message),
        }
        
        if err := stream.Send(response); err != nil {
            return err
        }
    }
}
```

### Metadata (заголовки)

Metadata используется для передачи дополнительной информации:

```go
// Сервер: чтение metadata
func (s *Server) SomeMethod(ctx context.Context, req *pb.Request) (*pb.Response, error) {
    md, ok := metadata.FromIncomingContext(ctx)
    if ok {
        token := md.Get("authorization")
        log.Printf("Auth token: %v", token)
    }
    // ...
}

// Клиент: отправка metadata
md := metadata.Pairs(
    "authorization", "Bearer token123",
    "user-id", "user456",
)
ctx := metadata.NewOutgoingContext(context.Background(), md)
resp, err := client.SomeMethod(ctx, req)
```

### Обработка ошибок с деталями

gRPC поддерживает богатые ошибки с дополнительными деталями:

```go
import "google.golang.org/genproto/googleapis/rpc/errdetails"

func (s *Server) CreateTask(ctx context.Context, req *pb.CreateTaskRequest) (*pb.CreateTaskResponse, error) {
    if req.Title == "" {
        st := status.New(codes.InvalidArgument, "validation failed")
        
        // Добавляем детали ошибки
        br := &errdetails.BadRequest{}
        br.FieldViolations = append(br.FieldViolations, &errdetails.BadRequest_FieldViolation{
            Field:       "title",
            Description: "title cannot be empty",
        })
        
        st, _ = st.WithDetails(br)
        return nil, st.Err()
    }
    // ...
}
```

## Best Practices

**Структура проекта:**
```
taskservice/
├── proto/
│   └── task.proto
├── pb/                    # сгенерированный код
│   ├── task.pb.go
│   └── task_grpc.pb.go
├── server/
│   └── main.go
├── client/
│   └── main.go
└── go.mod
```

**Рекомендации:**
- Всегда используйте контексты с таймаутами
- Обрабатывайте отмену операций через `ctx.Done()`
- Используйте connection pooling для клиентов в production
- Добавьте health checks: `grpc.health.v1.Health`
- Включите reflection для debugging: `reflection.Register(grpcServer)`
- Используйте TLS в production с `credentials.NewServerTLSFromFile()`
- Логируйте через interceptors, а не в каждом методе
- Версионируйте proto-файлы (например, `taskpb.v1`, `taskpb.v2`)

## Заключение

gRPC + Go — это мощная комбинация для построения высокопроизводительных распределённых систем. Protocol Buffers обеспечивают строгие контракты, HTTP/2 даёт эффективный транспорт, а встроенная поддержка стриминга открывает возможности для real-time приложений.

Начните с простых unary RPC, затем экспериментируйте со стримингом и interceptors. Главное — помните, что gRPC отлично подходит для взаимодействия между сервисами, но для браузерных клиентов REST API или gRPC-Web могут быть более подходящими решениями.
