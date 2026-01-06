---
sidebar_position: 4
title: Makefiles
---

# Makefiles для Go проектов

## Базовый Makefile

```makefile
# Имя бинарника
BINARY_NAME=myapp

# Версия из git тега
VERSION=$(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
COMMIT=$(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
DATE=$(shell date -u +%Y-%m-%d-%H:%M:%S)

# Параметры сборки
LDFLAGS=-X main.version=$(VERSION) -X main.commit=$(COMMIT) -X main.date=$(DATE) -s -w
CGO_ENABLED=0
GOOS=linux
GOARCH=amd64

# Пути
SRC=./cmd/main.go
OUT=./bin/$(BINARY_NAME)

# Go модули
GOPATH?=$(shell go env GOPATH)

.PHONY: all build test lint clean run deps generate docker help

# Сборка бинарника
build: $(SRC)
\tCGO_ENABLED=$(CGO_ENABLED) GOOS=$(GOOS) GOARCH=$(GOARCH) \
\t\tgo build -ldflags "$(LDFLAGS)" -o $(OUT) $(SRC)

# Сборка для разных платформ
build-linux: $(SRC)
\tCGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
\t\tgo build -ldflags "$(LDFLAGS)" -o $(OUT)-linux-amd64 $(SRC)

build-darwin: $(SRC)
\tCGO_ENABLED=0 GOOS=darwin GOARCH=amd64 \
\t\tgo build -ldflags "$(LDFLAGS)" -o $(OUT)-darwin-amd64 $(SRC)

build-windows: $(SRC)
\tCGO_ENABLED=0 GOOS=windows GOARCH=amd64 \
\t\tgo build -ldflags "$(LDFLAGS)" -o $(OUT)-windows-amd64.exe $(SRC)

# Кросс-платформенная сборка
build-all: build-linux build-darwin build-windows
\t@echo "Built for all platforms"

# Тестирование
test:
\tgo test -v -race -cover -coverprofile=coverage.out ./...

# Покрытие кода
coverage: test
\tgo tool cover -func=coverage.out
\t@echo "Coverage report: coverage.out"

# HTML отчёт о покрытии
coverage-html: test
\tgo tool cover -html=coverage.out -o coverage.html
\t@echo "Open coverage.html for detailed report"

# Линтинг
lint:
\tgolangci-lint run ./...

# Форматирование
fmt:
\tgo fmt ./...
\tgoimports -w .

# Очистка
clean:
\trm -f $(OUT) $(OUT)-* coverage.out coverage.html
\trm -rf bin/
\trm -rf dist/

# Запуск приложения
run: build
\t./$(OUT)

# Установка зависимостей
deps:
\tgo mod download
\tgo mod tidy

# Генерация кода
generate:
\tgo generate ./...

# Генерация mocks
mocks:
\tmockery --name=Repository --output=internal/mocks

# Обновление зависимостей
update:
\tgo get -u ./...
\tgo mod tidy

# Удаление неиспользуемых зависимостей
prune:
\tgo mod tidy
\tgo mod verify

# Установка бинарника в GOPATH
install: build
\tcp $(OUT) $(GOPATH)/bin/$(BINARY_NAME)

# Создание архива для релиза
release: build-all
\tcd bin && \
\t\tmkdir -p release && \
\t\tmv $(BINARY_NAME)-* release/ && \
\t\tcd release && \
\t\ttar -czvf $(BINARY_NAME)-$(VERSION)-release.tar.gz $(BINARY_NAME)-*

# Проверка уязвимостей
security:
\t@which govulncheck > /dev/null || go install golang.org/x/vuln/cmd/govulncheck@latest
\tgovulncheck ./...

# Статический анализ
static:
\t@which staticcheck > /dev/null || go install honnef.co/go/tools/cmd/staticcheck@latest
\tstaticcheck ./...

# Справка
help:
\t@echo "Available targets:"
\t@echo "  build          - build binary"
\t@echo "  build-all      - build for all platforms"
\t@echo "  test           - run tests"
\t@echo "  lint           - run linter"
\t@echo "  fmt            - format code"
\t@echo "  clean          - clean artifacts"
\t@echo "  run            - build and run"
\t@echo "  deps           - download dependencies"
\t@echo "  generate       - generate code"
\t@echo "  update         - update dependencies"
\t@echo "  install        - install to GOPATH"
\t@echo "  release        - create release archive"
\t@echo "  security       - check vulnerabilities"
\t@echo "  static         - static analysis"
\t@echo "  help           - show this help"
```

## Расширенный Makefile с переменными

```makefile
# Конфигурация
BINARY_NAME=myapp
VERSION?=dev
COMMIT?=$(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
DATE?=$(shell date -u +%Y-%m-%dT%H:%M:%SZ)
BUILD_USER?=$(shell whoami)

# Теги сборки
TAGS?=

# Директории
SRC_DIR=./cmd
OUT_DIR=./bin
DIST_DIR=./dist

# Go параметры
LDFLAGS=-s -w \
\t-X main.version=$(VERSION) \
\t-X main.commit=$(COMMIT) \
\t-X main.date=$(DATE) \
\t-X main.buildUser=$(BUILD_USER)

# Цвета для вывода
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[0;33m
NC=\033[0m

# Функции
info:
\t@echo -e "$(GREEN)[INFO]$(NC) $(1)"

warn:
\t@echo -e "$(YELLOW)[WARN]$(NC) $(1)"

error:
\t@echo -e "$(RED)[ERROR]$(NC) $(1)"

# Проверка предварительных условий
check-go:
\t@which go > /dev/null || (error "Go not installed" && exit 1)
\t@go version

check-tools:
\t@which golangci-lint > /dev/null && echo "golangci-lint installed" || warn "golangci-lint not installed"

# Основные цели
.PHONY: all deps test build lint run clean help

all: deps test build lint

deps:
\t@info "Downloading dependencies..."
\tgo mod download
\tgo mod tidy

test:
\t@info "Running tests..."
\tgo test -race -cover ./...

build: check-go
\t@info "Building $(BINARY_NAME) version $(VERSION)..."
\tCGO_ENABLED=0 go build -ldflags "$(LDFLAGS)" -tags "$(TAGS)" -o $(OUT_DIR)/$(BINARY_NAME) $(SRC_DIR)/main.go
\t@info "Binary built at $(OUT_DIR)/$(BINARY_NAME)"

run: build
\t@info "Running application..."
\t$(OUT_DIR)/$(BINARY_NAME)

lint: check-tools
\t@info "Running linter..."
\tgolangci-lint run ./...

clean:
\t@info "Cleaning..."
\trm -rf $(OUT_DIR) $(DIST_DIR)
\t@info "Clean complete"

# Псевдонимы
%): check-go
\t@info "Running target: $@"
\tgo run $(SRC_DIR)/main.go
```

## Makefile для библиотеки

```makefile
MODULE_NAME=github.com/user/mylib
VERSION=$(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")

.PHONY: all test lint clean docs install push

all: test lint build

test:
\tgo test -v -race ./...

lint:
\tgolangci-lint run ./...

clean:
\trm -rf dist/

# Генерация документации
docs:
\t@which godoc > /dev/null || go install golang.org/x/tools/cmd/godoc@latest
\tgodoc -http=:6060 &

# Публикация в GOPROXY
push:
\t@info "Tagging version $(VERSION)..."
\tgit tag v$(VERSION)
\t@info "Pushing to remote..."
\tgit push origin v$(VERSION)
\t@info "Module ready for release"
```

## .gitignore для Go проекта

```
# Бинарники
/bin/
/dist/
*.exe
*.exe~
*.dll
*.so
*.dylib

# Результаты сборки
*.test
*.out
coverage.out
coverage.html

# Go workspace
go.work

# Vendor
vendor/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Temporary
*.tmp
temp/

# Test artifacts
*.coverprofile
*.prof

# Container
.docker/
```

## Итоги

| Команда | Описание |
|---------|----------|
| `make build` | Сборка бинарника |
| `make test` | Запуск тестов |
| `make lint` | Запуск линтера |
| `make run` | Сборка и запуск |
| `make deps` | Загрузка зависимостей |
| `make clean` | Очистка артефактов |
| `make release` | Создание архива |
| `make help` | Справка |
