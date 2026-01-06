---
sidebar_position: 2
title: Docker и деплой
---

# Docker и деплой Go-приложений

## Multi-stage сборка

```dockerfile
# Stage 1: Сборка
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Копируем зависимости
COPY go.mod go.sum ./
RUN go mod download

# Копируем код и собираем
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .

# Stage 2: Production образ
FROM alpine:latest

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /home/appuser

# Копируем бинарник
COPY --from=builder /app/app .

# Копируем конфигурацию (если есть)
# COPY config.yaml .

EXPOSE 8080

CMD ["./app"]
```

## Альтернатива: scratch (минимальный образ)

```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -o app .

FROM scratch

COPY --from=builder /app/app /app
COPY --from=builder /etc/passwd /etc/passwd
# COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

EXPOSE 8080

USER 1000:1000

CMD ["/app"]
```

## docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/app
      - REDIS_URL=redis://cache:6379
    depends_on:
      - db
      - cache
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  cache:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

## Настройка Go-приложения для Docker

```go
package main

import (
    "database/sql"
    "fmt"
    "log"
    "net/http"
    "os"
    "time"
    
    _ "github.com/lib/pq"
)

type Config struct {
    Port            int
    DatabaseURL     string
    RedisURL        string
    Environment     string
    ReadTimeout     time.Duration
    WriteTimeout    time.Duration
}

func loadConfig() *Config {
    return &Config{
        Port:        getEnvInt("PORT", 8080),
        DatabaseURL: os.Getenv("DATABASE_URL"),
        RedisURL:    os.Getenv("REDIS_URL"),
        Environment: getEnv("ENVIRONMENT", "development"),
        ReadTimeout: 10 * time.Second,
        WriteTimeout: 10 * time.Second,
    }
}

func getEnv(key, defaultValue string) string {
    if value, ok := os.LookupEnv(key); ok {
        return value
    }
    return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
    if value, ok := os.LookupEnv(key); ok {
        if parsed, err := fmt.Sscanf(value, "%d"); parsed == 1 && err == nil {
            return parsed
        }
    }
    return defaultValue
}

func main() {
    cfg := loadConfig()
    
    // Подключение к БД
    db, err := sql.Open("postgres", cfg.DatabaseURL)
    if err != nil {
        log.Fatalf("Failed to connect to database: %v", err)
    }
    defer db.Close()
    
    // Health check
    http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
        if err := db.Ping(); err != nil {
            http.Error(w, "DB unhealthy", http.StatusServiceUnavailable)
            return
        }
        w.WriteHeader(http.StatusOK)
        w.Write([]byte("OK"))
    })
    
    // Graceful shutdown
    // ... (см. предыдущий урок)
    
    log.Printf("Starting server on :%d", cfg.Port)
    log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", cfg.Port), nil))
}
```

## K8s Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: go-app
  labels:
    app: go-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: go-app
  template:
    metadata:
      labels:
        app: go-app
    spec:
      containers:
      - name: go-app
        image: your-registry/go-app:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: PORT
          value: "8080"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: go-app
spec:
  selector:
    app: go-app
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
```

## CI/CD пример (GitHub Actions)

```yaml
name: Go CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Go
      uses: actions/setup-go@v5
      with:
        go-version: '1.21'
    
    - name: Cache Go modules
      uses: actions/cache@v3
      with:
        path: |
          ~/.cache/go-build
          ~/go/pkg/mod
        key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
        restore-keys: |
          ${{ runner.os }}-go-
    
    - name: Build
      run: go build -v ./...
    
    - name: Test
      run: go test -v -race ./...
    
    - name: Lint
      uses: golangci/golangci-lint-action@v3
      with:
        version: latest
    
    - name: Build Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: ${{ github.event_name == 'push' }}
        tags: ${{ secrets.DOCKER_REGISTRY }}/go-app:${{ github.sha }}
    
    - name: Deploy to K8s
      if: github.ref == 'refs/heads/main'
      run: |
        kubectl set image deployment/go-app go-app=${{ secrets.DOCKER_REGISTRY }}/go-app:${{ github.sha }} -n default
```

## Environment variables в production

```go
package main

import (
    "fmt"
    "os"
    "strconv"
    "time"
)

type Config struct {
    // Обязательные переменные
    DatabaseURL string `required:"true"`
    
    // Опциональные с defaults
    Port        int    `default:"8080"`
    Environment string `default:"development"`
    LogLevel    string `default:"info"`
    
    // Тайм-ауты
    RequestTimeout time.Duration `default:"30s"`
    ShutdownTimeout time.Duration `default:"10s"`
}

func LoadConfig() (*Config, error) {
    cfg := &Config{
        Port:           getEnvInt("PORT", cfg.Port),
        Environment:    getEnv("ENVIRONMENT", cfg.Environment),
        LogLevel:       getEnv("LOG_LEVEL", cfg.LogLevel),
        RequestTimeout: getEnvDuration("REQUEST_TIMEOUT", cfg.RequestTimeout),
        DatabaseURL:    os.Getenv("DATABASE_URL"),
    }
    
    // Валидация
    if cfg.DatabaseURL == "" {
        return nil, fmt.Errorf("DATABASE_URL is required")
    }
    
    return cfg, nil
}

func getEnv(key, defaultValue string) string {
    if v := os.Getenv(key); v != "" {
        return v
    }
    return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
    if v := os.Getenv(key); v != "" {
        if n, err := strconv.Atoi(v); err == nil {
            return n
        }
    }
    return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
    if v := os.Getenv(key); v != "" {
        if d, err := time.ParseDuration(v); err == nil {
            return d
        }
    }
    return defaultValue
}
```

## Итоги

| Технология | Назначение |
|------------|------------|
| Multi-stage build | Уменьшение размера образа |
| scratch | Минимальный образ |
| docker-compose | Локальная разработка |
| K8s | Оркестрация в production |
| GitHub Actions | CI/CD пайплайн |
