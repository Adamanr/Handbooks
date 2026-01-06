---
sidebar_position: 3
title: CI/CD
---

# CI/CD для Go проектов

## Базовая структура проекта

```
my-go-app/
├── .github/workflows/
│   └── ci.yml
├── cmd/
│   └── main.go
├── internal/
│   └── ...
├── pkg/
│   └── ...
├── config/
│   └── config.go
├── Dockerfile
├── docker-compose.yml
├── Makefile
├── go.mod
└── go.sum
```

## Makefile

```makefile
.PHONY: all build test lint clean run docker-build docker-run help

# Параметры
BINARY_NAME=myapp
VERSION=$(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
LDFLAGS=-X main.version=$(VERSION) -s -w

# Сборка
build:
	go build -ldflags "$(LDFLAGS)" -o $(BINARY_NAME) ./cmd/main.go

# Тестирование
test:
	go test -v -race -cover -coverprofile=coverage.out ./...

# Покрытие
test-coverage: test
	go tool cover -func=coverage.out

# Линтинг
lint:
	golangci-lint run ./...

# Очистка
clean:
	rm -f $(BINARY_NAME) coverage.out

# Запуск
run: build
	./$(BINARY_NAME)

# Docker
docker-build:
	docker build -t $(BINARY_NAME):$(VERSION) .

docker-run:
	docker run -p 8080:8080 $(BINARY_NAME):$(VERSION)

# Генерация
generate:
	go generate ./...

# Форматирование
fmt:
	go fmt ./...

# Обновление зависимостей
deps:
	go mod tidy
	go mod download

# Проверка лицензий (треrd-party)
license:
	@which $@ > /dev/null || go install github.com/google/addlicense@latest
	addlicense -y .

# Help
help:
	@echo "Доступные команды:"
	@echo "  build        - собрать бинарник"
	@echo "  test         - запустить тесты"
	@echo "  lint         - запустить линтер"
	@echo "  clean        - очистить артефакты"
	@echo "  run          - собрать и запустить"
	@echo "  docker-build - собрать Docker образ"
	@echo "  docker-run   - запустить в Docker"
```

## GitHub Actions CI

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  GO_VERSION: '1.21'
  DOCKER_BUILDKIT: 1

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Go
      uses: actions/setup-go@v5
      with:
        go-version: ${{ env.GO_VERSION }}
    
    - name: Cache Go modules
      uses: actions/cache@v3
      with:
        path: |
          ~/.cache/go-build
          ~/go/pkg/mod
        key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
        restore-keys: |
          ${{ runner.os }}-go-
    
    - name: Install golangci-lint
      run: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
    
    - name: Run linter
      run: golangci-lint run ./...

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Go
      uses: actions/setup-go@v5
      with:
        go-version: ${{ env.GO_VERSION }}
    
    - name: Cache Go modules
      uses: actions/cache@v3
      with:
        path: |
          ~/.cache/go-build
          ~/go/pkg/mod
        key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
        restore-keys: |
          ${{ runner.os }}-go-
    
    - name: Run tests
      run: go test -race -cover -coverprofile=coverage.out ./...
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage.out

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Go
      uses: actions/setup-go@v5
      with:
        go-version: ${{ env.GO_VERSION }}
    
    - name: Build binary
      run: |
        VERSION=$(git describe --tags --always --dirty 2>/dev/null || echo "dev")
        go build -ldflags "-X main.version=${VERSION}" -o myapp ./cmd/main.go
    
    - name: Upload binary
      uses: actions/upload-artifact@v3
      with:
        name: binary
        path: myapp

  docker:
    name: Docker
    runs-on: ubuntu-latest
    needs: [lint, test]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Login to registry
      uses: docker/login-action@v3
      with:
        registry: ${{ secrets.DOCKER_REGISTRY }}
        username: ${{ secrets.DOCKER_USER }}
        password: ${{ secrets.DOCKER_PASS }}
    
    - name: Build and push
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ secrets.DOCKER_REGISTRY }}/myapp:${{ github.sha }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: [build, docker]
    if: github.ref == 'refs/heads/main'
    steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@v1
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        script: |
          docker pull ${{ secrets.DOCKER_REGISTRY }}/myapp:${{ github.sha }}
          docker-compose down
          docker-compose up -d
```

## GitLab CI

```yaml
stages:
  - lint
  - test
  - build
  - security
  - deploy

variables:
  GO_VERSION: "1.21"
  DOCKER_DRIVER: overlay2

lint:
  stage: lint
  image: golang:${GO_VERSION}-alpine
  script:
    - apk add --no-cache git
    - go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
    - golangci-lint run ./...
  only:
    - merge_requests
    - main

test:
  stage: test
  image: golang:${GO_VERSION}-alpine
  script:
    - go test -race -cover -coverprofile=coverage.out ./...
  coverage: '/total:\s+\(\d+\.\d+%\)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.out
  only:
    - merge_requests
    - main

build:
  stage: build
  image: golang:${GO_VERSION}-alpine
  script:
    - VERSION=$(git describe --tags --always --dirty 2>/dev/null || echo "dev")
    - go build -ldflags "-X main.version=${VERSION}" -o myapp ./cmd/main
  artifacts:
    paths:
      - myapp
  only:
    - main

security:
  stage: security
  image: 
    name: aquasec/trivy:latest
    entrypoint: [""]
  script:
    - trivy fs --exit-code 2 --severity HIGH,CRITICAL .
  allow_failure: true
  only:
    - main

deploy:
  stage: deploy
  image: alpine:latest
  script:
    - apk add --no-cache openssh-client
    - echo "$SSH_PRIVATE_KEY" > deploy_key
    - chmod 600 deploy_key
    - ssh -o StrictHostKeyChecking=no -i deploy_key $SERVER_USER@$SERVER_HOST "
        docker pull $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA &&
        docker-compose down &&
        docker-compose up -d
      "
  environment:
    name: production
    url: https://example.com
  only:
    - main
```

## SemVer и версионирование

```go
package main

import (
    "fmt"
    "os"
    "strings"
)

var (
    version = "dev"
    commit  = "unknown"
    date    = "unknown"
)

func main() {
    fmt.Printf("Version: %s\n", version)
    fmt.Printf("Commit: %s\n", commit)
    fmt.Printf("Date: %s\n", date)
    
    // SemVer проверка
    if version != "dev" && !isValidSemVer(version) {
        fmt.Println("Invalid version format")
        os.Exit(1)
    }
}

func isValidSemVer(v string) bool {
    parts := strings.Split(v, ".")
    if len(parts) != 3 {
        return false
    }
    for _, p := range parts {
        for _, c := range p {
            if c < '0' || c > '9' {
                return false
            }
        }
    }
    return true
}
```

## Changelog генерация

```markdown
# Changelog

## [1.0.0] - $(date +%Y-%m-%d)

### Added
- Initial release
- REST API endpoints
- Docker support

### Changed
- Improved performance
- Fixed memory leak

### Deprecated
- Old endpoint /v1/users (use /v2/users)

### Removed
- Legacy authentication

### Fixed
- Bug in user creation
```

## Итоги

| Компонент | Инструмент |
|-----------|------------|
| Линтинг | golangci-lint |
| Тестирование | go test |
| CI/CD | GitHub Actions, GitLab CI |
| Docker | Dockerfile, docker-compose |
| Версионирование | SemVer, git tags |
| Сборка | Makefile |
