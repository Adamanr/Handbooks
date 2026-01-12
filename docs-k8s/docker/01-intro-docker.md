---
sidebar_position: 1
title: "Введение"
description: "В этой главе вы узнаете, что такое Docker и как его использовать. Вы познакомитесь с основными понятиями и терминами, используемыми в Docker, и научитесь работать с контейнерами."
---
# Основы контейнеризации

## Эволюция виртуализации - от bare metal к контейнерам

### История развития технологий изоляции

**Эра физических серверов (1990-е - начало 2000-х)**

В начале эры серверных технологий каждое приложение разворачивалось на отдельном физическом сервере. Это создавало множество проблем:
- Низкая утилизация ресурсов (средняя загрузка CPU 5-15%)
- Высокие капитальные затраты на оборудование
- Длительное время развертывания новых сервисов (недели/месяцы)
- Сложность масштабирования
- Проблемы с консистентностью окружений (dev/staging/prod)

**Виртуализация - первая революция (середина 2000-х)**

Появление гипервизоров (VMware ESXi, KVM, Xen) изменило индустрию:
- Множество виртуальных машин на одном физическом сервере
- Изоляция на уровне оборудования
- Снапшоты и миграция VM между хостами
- Улучшенная утилизация ресурсов (до 70-80%)

Но виртуализация принесла свои проблемы:
- Каждая VM содержит полную копию ОС (гигабайты памяти и дискового пространства)
- Медленный старт VM (минуты)
- Overhead гипервизора
- Сложность в масштабировании микросервисов

**Контейнеризация - вторая революция (2013-настоящее время)**

Linux-контейнеры существовали давно (chroot с 1979 года, LXC с 2008), но Docker в 2013 году сделал их доступными для массового использования:
- Легковесная изоляция на уровне процессов
- Общее ядро ОС между контейнерами
- Старт за миллисекунды
- Образы размером в мегабайты вместо гигабайт
- "Build once, run anywhere" философия
- Идеальное решение для микросервисной архитектуры

### Сравнение технологий

```
┌─────────────────────────────────────────┐
│         Physical Server                 │
│  ┌────────────────────────────────────┐ │
│  │       Application + OS             │ │
│  └────────────────────────────────────┘ │
│              Hardware                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      Virtual Machines (VMs)             │
│  ┌─────┐  ┌─────┐  ┌─────┐              │
│  │App  │  │App  │  │App  │              │
│  │OS   │  │OS   │  │OS   │              │
│  └─────┘  └─────┘  └─────┘              │
│         Hypervisor                      │
│         Host OS                         │
│         Hardware                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          Containers                     │
│  ┌─────┐  ┌─────┐  ┌─────┐              │
│  │App  │  │App  │  │App  │              │
│  │Libs │  │Libs │  │Libs │              │
│  └─────┘  └─────┘  └─────┘              │
│      Container Runtime (Docker)         │
│         Host OS                         │
│         Hardware                        │
└─────────────────────────────────────────┘
```

**Ключевые отличия:**

| Характеристика | VM | Контейнер |
|---------------|-----|-----------|
| Размер образа | ГБ | МБ |
| Время старта | Минуты | Секунды/миллисекунды |
| Изоляция | Полная (гипервизор) | Процессная (ядро) |
| Производительность | Overhead 5-10% | Почти native |
| Плотность размещения | Десятки на хост | Сотни/тысячи на хост |
| Переносимость | Средняя | Высокая |

### Что такое контейнер?

Контейнер - это изолированный процесс (или группа процессов) со своим собственным:
- Файловой системой
- Сетевым стеком
- Процессным деревом
- Пространством IPC (межпроцессного взаимодействия)
- Ограничениями ресурсов (CPU, память, I/O)

**Важно понимать:** контейнер - это НЕ виртуальная машина, это просто процесс с дополнительной изоляцией.

### Преимущества контейнеров

**Консистентность окружений**
```
Разработчик: "У меня на машине работает!"
Контейнер: "Отлично, значит будет работать везде!"
```

**Быстрое развертывание**
- Сборка образа: секунды/минуты
- Запуск контейнера: миллисекунды
- Масштабирование: мгновенное

**Эффективное использование ресурсов**
- На одном сервере могут работать сотни контейнеров
- Shared libraries и copy-on-write файловые системы
- Minimal overhead

**Микросервисная архитектура**
- Каждый сервис - отдельный контейнер
- Независимое развертывание и масштабирование
- Изоляция сбоев

**DevOps и CI/CD**
- Единый формат доставки от разработки до production
- Версионирование инфраструктуры как кода
- Быстрые итерации

## Архитектура Docker

### Компоненты экосистемы Docker

Docker построен на клиент-серверной архитектуре:

![Docker Architecture](/img/docker.jpg)

### Docker Client (CLI)

Интерфейс командной строки для взаимодействия с Docker:
- Отправляет команды Docker daemon через REST API
- Может подключаться к удаленным daemon
- Основной инструмент для пользователей

Примеры команд:
```bash
docker run    # Запустить контейнер
docker build  # Собрать образ
docker pull   # Скачать образ
docker ps     # Список контейнеров
```

### Docker Daemon (dockerd)

Сердце Docker, работающее как фоновый процесс:
- Слушает Docker API запросы
- Управляет Docker объектами (образы, контейнеры, сети, тома)
- Взаимодействует с containerd для управления контейнерами
- Управляет Docker сетями и хранилищами

**Архитектура Docker Engine:**
```
dockerd
  └─▶ containerd (управление жизненным циклом контейнеров)
       └─▶ containerd-shim (для каждого контейнера)
            └─▶ runc (низкоуровневый runtime, создает контейнеры)
```

### Docker Images (Образы)

Образ - это read-only шаблон с инструкциями для создания контейнера:
- Состоит из слоев (layers)
- Каждый слой - результат выполнения инструкции в Dockerfile
- Слои переиспользуются между образами
- Неизменяемый (immutable)

**Структура образа:**
```
┌─────────────────────────┐
│   Application Layer     │  ← Ваш код
├─────────────────────────┤
│   Dependencies Layer    │  ← npm install, pip install
├─────────────────────────┤
│   Runtime Layer         │  ← Node.js, Python
├─────────────────────────┤
│   OS Layer              │  ← Ubuntu, Alpine
└─────────────────────────┘
     (каждый слой = layer)
```

### Docker Containers (Контейнеры)

Контейнер - это запущенный экземпляр образа:
- Writable layer поверх read-only образа
- Изолированный процесс с собственным окружением
- Может быть запущен, остановлен, перемещен, удален
- Ephemeral (временный) по умолчанию - данные теряются при удалении

**Жизненный цикл контейнера:**
```
Created → Running → Paused → Stopped → Removed
    ↑         ↓                   ↓
    └─────────────────────────────┘
           (можно перезапустить)
```

### Docker Registry

Хранилище Docker образов:
- **Docker Hub** - публичный registry (по умолчанию)
- Приватные registry (Harbor, GitLab Container Registry, AWS ECR)
- Хранение версий образов через теги

**Формат имени образа:**
```
[registry]/[namespace]/[repository]:[tag]

docker.io/library/nginx:latest
│         │       │      │
│         │       │      └─ версия
│         │       └──────── имя образа
│         └──────────────── организация/пользователь
└────────────────────────── registry (по умолчанию docker.io)
```

### Docker Volumes

Механизм персистентного хранения данных:
- Данные живут независимо от жизненного цикла контейнера
- Управляются Docker daemon
- Могут быть shared между контейнерами
- Производительность native (в отличие от bind mounts на Windows/Mac)

### Docker Networks

Виртуальные сети для связи контейнеров:
- Изоляция контейнеров в разных сетях
- DNS-based service discovery
- Различные драйверы для разных сценариев (bridge, host, overlay)

## Namespace и cgroups - основа изоляции

### Linux Namespaces

Namespaces - механизм ядра Linux для изоляции ресурсов. Каждый namespace создает отдельное представление системных ресурсов.

**Типы namespaces в Docker:**

**1. PID Namespace (Process ID)**
- Каждый контейнер имеет свое дерево процессов
- Процесс с PID 1 внутри контейнера - это ваше приложение
- Процессы в контейнере не видят процессы хостовой системы

```bash
# На хосте
$ ps aux | grep nginx
user   1234  nginx

# Внутри контейнера
$ ps aux
PID   COMMAND
1     nginx   ← тот же процесс, но PID = 1
```

**2. NET Namespace (Network)**
- Собственный сетевой стек для каждого контейнера
- Виртуальные сетевые интерфейсы
- Собственные IP-адреса, таблицы маршрутизации, firewall правила

**3. MNT Namespace (Mount)**
- Изолированная файловая система
- Контейнер видит только свои mount points
- Реализация через Union File System

**4. UTS Namespace (Unix Timesharing System)**
- Собственное hostname и domain name
- Каждый контейнер может иметь уникальный hostname

**5. IPC Namespace (Inter-Process Communication)**
- Изоляция очередей сообщений, семафоров, shared memory
- Процессы в разных контейнерах не могут общаться через IPC

**6. USER Namespace**
- Маппинг пользователей между контейнером и хостом
- Root в контейнере может быть непривилегированным пользователем на хосте
- Повышает безопасность

### Control Groups (cgroups)

Cgroups - механизм для ограничения и учета использования ресурсов группой процессов.

**Основные подсистемы cgroups:**

**1. CPU**
```bash
# Ограничение CPU для контейнера
docker run --cpus="1.5" nginx  # Максимум 1.5 CPU cores
docker run --cpu-shares=512 nginx  # Относительный приоритет
```

**2. Memory**
```bash
# Ограничение памяти
docker run --memory="512m" nginx  # Максимум 512 MB
docker run --memory="1g" --memory-swap="2g" nginx  # + swap
```

**3. Block I/O**
```bash
# Ограничение дисковых операций
docker run --device-read-bps /dev/sda:1mb nginx
docker run --device-write-iops /dev/sda:100 nginx
```

**4. Network**
- Ограничение сетевой пропускной способности
- QoS для контейнеров

**Как это работает:**
```
┌─────────────────────────────────────┐
│         Linux Kernel                │
│                                     │
│  ┌──────────────────────────────┐   │
│  │   cgroups hierarchy          │   │
│  │                              │   │
│  │  /sys/fs/cgroup/             │   │
│  │    ├─ cpu/                   │   │
│  │    │   └─ docker/            │   │
│  │    │       └─ container_id/  │   │
│  │    │           └─ cpu.cfs... │   │
│  │    └─ memory/                │   │
│  │        └─ docker/            │   │
│  │            └─ container_id/  │   │
│  │                └─ memory...  │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Как это все работает вместе

Когда вы запускаете контейнер:

```bash
docker run -d --name myapp --memory="512m" --cpus="0.5" nginx
```

Docker выполняет следующее:

1. **Создает namespaces:**
   - PID namespace - изолирует процессы
   - NET namespace - создает виртуальный сетевой интерфейс
   - MNT namespace - монтирует слои образа
   - UTS namespace - устанавливает hostname
   - IPC namespace - изолирует IPC ресурсы

2. **Настраивает cgroups:**
   - Создает cgroup для контейнера
   - Устанавливает memory limit = 512MB
   - Устанавливает CPU quota = 0.5 cores
   - Добавляет процесс контейнера в cgroup

3. **Запускает процесс:**
   - Fork процесс в новых namespaces
   - Применяет cgroup ограничения
   - Выполняет entrypoint команду (nginx)

### Безопасность изоляции

**Что изолируется:**
- Процессы
- Сеть
- Файловая система
- IPC
- Hostname
- Ресурсы (через cgroups)

**Что НЕ изолируется (shared с хостом):**
- Ядро Linux (одно на всех!)
- Некоторые /proc и /sys файлы
- Время системы
- Kernel modules

**Важные последствия:**
```
┌──────────────────────────────────────┐
│  Все контейнеры используют одно ядро │
│                                      │
│  ┌─────┐  ┌─────┐  ┌─────┐           │
│  │ C1  │  │ C2  │  │ C3  │           │
│  └──┬──┘  └──┬──┘  └──┬──┘           │
│     └────────┴────────┘              │
│            │                         │
│     ┌──────▼────┐                    │
│     │   Kernel  │                    │
│     └───────────┘                    │
└──────────────────────────────────────┘
```

Это означает:
- Эксплойт ядра может затронуть все контейнеры
- Нужна дополнительная защита (SELinux, AppArmor, Seccomp)
- Для максимальной изоляции используйте VM или gVisor/Kata Containers

## Отличия контейнеров от виртуальных машин

### Архитектурные отличия

**Виртуальные машины:**
- Эмуляция полного оборудования
- Каждая VM запускает собственное ядро ОС
- Гипервизор (Type 1 или Type 2) управляет ресурсами
- Полная изоляция на уровне железа

**Контейнеры:**
- Разделяют ядро хост-системы
- Изоляция на уровне процессов (namespaces)
- Container runtime управляет жизненным циклом
- Легковесная изоляция

### Производительность

**Overhead:**
```
┌────────────────────────────────┐
│ Performance Overhead           │
├────────────────────────────────┤
│ Bare Metal:       0%           │
│ Containers:       0-3%         │
│ VMs:              5-10%        │
└────────────────────────────────┘
```

**Startup время:**
```
┌────────────────────────────────┐
│ Startup Time                   │
├────────────────────────────────┤
│ Container:     < 1 sec         │
│ VM:            1-2 min         │
└────────────────────────────────┘
```

**Плотность размещения:**
- На одном сервере: 10-20 VMs vs 100-1000 контейнеров

### Use Cases

**Когда использовать VM:**
- Нужна полная изоляция (compliance, security)
- Разные ОС на одном хосте (Windows + Linux)
- Legacy приложения
- Требуется специфическое ядро или kernel modules

**Когда использовать контейнеры:**
- Микросервисная архитектура
- CI/CD пайплайны
- Быстрое масштабирование
- Разработка и тестирование
- Cloud-native приложения

### Гибридные подходы

**Контейнеры внутри VM:**
```
┌───────────────────────────────────┐
│  Cloud Provider (AWS, GCP, Azure) │
│                                   │
│  ┌─────────────────────────────┐  │
│  │   Virtual Machine           │  │
│  │                             │  │
│  │  ┌─────┐ ┌─────┐ ┌─────┐    │  │
│  │  │ C1  │ │ C2  │ │ C3  │    │  │
│  │  └─────┘ └─────┘ └─────┘    │  │
│  │     Container Runtime       │  │
│  └─────────────────────────────┘  │
└───────────────────────────────────┘
```

**Преимущества:**
- Лучшая изоляция для multi-tenant окружений
- Compliance требования
- Защита от kernel exploits
- Гибкость в выборе ОС

## Установка Docker и первый запуск

### Цель
Установить Docker на вашу систему и запустить первый контейнер.

### Установка Docker

**Linux (Ubuntu/Debian):**
```bash
# Обновить пакеты
sudo apt-get update

# Установить зависимости
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Добавить GPG ключ Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Добавить репозиторий
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установить Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Добавить пользователя в группу docker (чтобы не использовать sudo)
sudo usermod -aG docker $USER

# Перелогиниться или выполнить
newgrp docker
```

**macOS:**
```bash
# Скачать Docker Desktop с docker.com
# Или через Homebrew:
brew install --cask docker
```

**Windows:**
```
# Скачать Docker Desktop с docker.com
# Убедиться что WSL2 включен
```

### Проверка установки

```bash
# Проверить версию Docker
docker --version
# Вывод: Docker version 25.0.0, build...

# Проверить информацию о системе
docker info

# Проверить что daemon запущен
docker ps
# Должна быть пустая таблица (пока нет запущенных контейнеров)
```

### Первый контейнер - Hello World

```bash
# Запустить тестовый контейнер
docker run hello-world
```

**Что происходит:**
1. Docker ищет образ `hello-world` локально
2. Не находит, скачивает с Docker Hub
3. Создает контейнер из образа
4. Запускает контейнер
5. Контейнер выводит сообщение и завершается

**Вывод:**
```
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
c1ec31eb5944: Pull complete
Digest: sha256:...
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.
...
```

### Запуск интерактивного контейнера

```bash
# Запустить Ubuntu контейнер в интерактивном режиме
docker run -it ubuntu bash
```

**Флаги:**
- `-i` (interactive) - держит STDIN открытым
- `-t` (tty) - выделяет pseudo-TTY

**Внутри контейнера выполните:**
```bash
# Проверить версию ОС
cat /etc/os-release

# Посмотреть процессы
ps aux
# Заметьте: bash имеет PID 1!

# Установить что-то
apt-get update
apt-get install -y curl

# Проверить hostname
hostname

# Выйти из контейнера
exit
```

### Запуск веб-сервера

```bash
# Запустить Nginx в фоновом режиме с проброшенным портом
docker run -d -p 8080:80 --name my-nginx nginx

# Проверить запущенные контейнеры
docker ps

# Открыть в браузере
# http://localhost:8080
# Или через curl
curl http://localhost:8080
```

**Флаги:**
- `-d` (detached) - запуск в фоне
- `-p 8080:80` - маппинг порта (host:container)
- `--name my-nginx` - имя контейнера

### Анализ запущенного контейнера

```bash
# Список всех контейнеров (включая остановленные)
docker ps -a

# Логи контейнера
docker logs my-nginx

# Логи в режиме follow (как tail -f)
docker logs -f my-nginx

# Статистика ресурсов
docker stats my-nginx

# Детальная информация о контейнере
docker inspect my-nginx

# Найти IP адрес контейнера
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' my-nginx
```

## Работа с Docker CLI

### Цель
Освоить основные команды Docker для управления жизненным циклом контейнеров.

### Жизненный цикл контейнера

```bash
# Создать контейнер (но не запускать)
docker create --name my-app nginx
docker ps -a
# STATUS: Created

# Запустить созданный контейнер
docker start my-app
docker ps
# STATUS: Up

# Остановить контейнер
docker stop my-app
docker ps -a
# STATUS: Exited

# Перезапустить
docker restart my-app

# Приостановить (pause)
docker pause my-app
docker ps
# STATUS: Paused

# Возобновить
docker unpause my-app

# Удалить контейнер (сначала нужно остановить)
docker stop my-app
docker rm my-app

# Или удалить force
docker rm -f my-app
```

### Работа с образами

```bash
# Поиск образов в Docker Hub
docker search python

# Скачать образ
docker pull python:3.11-slim

# Список локальных образов
docker images

# Детальная информация об образе
docker inspect python:3.11-slim

# История слоев образа
docker history python:3.11-slim

# Удалить образ
docker rmi python:3.11-slim

# Удалить все неиспользуемые образы
docker image prune

# Удалить все образы
docker rmi $(docker images -q)
```

### Флаги docker run

```bash
# Автоматическое удаление после остановки
docker run --rm hello-world

# Установка переменных окружения
docker run -e "ENV=production" -e "DEBUG=false" nginx

# Ограничение ресурсов
docker run --memory="512m" --cpus="0.5" nginx

# Маппинг volume
docker run -v /host/path:/container/path nginx

# Маппинг всех портов
docker run -P nginx  # случайные порты на хосте

# Restart policy
docker run --restart=always nginx
docker run --restart=on-failure:5 nginx  # до 5 попыток

# Запуск с другим entrypoint
docker run --entrypoint /bin/sh nginx
```

### Практический пример - база данных

```bash
# Запустить PostgreSQL
docker run -d \
  --name postgres-db \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=myapp \
  -p 5432:5432 \
  postgres:15

# Проверить логи
docker logs postgres-db

# Подключиться к базе
docker exec -it postgres-db psql -U postgres -d myapp

# В psql выполнить
\l  -- список баз
CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100));
INSERT INTO users (name) VALUES ('Alice'), ('Bob');
SELECT * FROM users;
\q  -- выход

# Остановить и удалить
docker stop postgres-db
docker rm postgres-db
```

**Проблема:** Данные потеряны после удаления! Решение в следующих модулях (volumes).

## Исследование контейнера

### Цель
Научиться исследовать и отлаживать запущенные контейнеры.

### docker exec

```bash
# Запустить nginx
docker run -d --name web nginx

# Выполнить команду внутри контейнера
docker exec web ls -la /usr/share/nginx/html

# Интерактивная оболочка
docker exec -it web bash

# Внутри контейнера
cat /etc/nginx/nginx.conf
ps aux
top
exit
```

### docker logs

```bash
# Просмотр логов
docker logs web

# Последние 10 строк
docker logs --tail 10 web

# С временными метками
docker logs --timestamps web

# Follow режим + последние 5 строк
docker logs -f --tail 5 web

# В другом терминале сделайте запросы
curl http://localhost:80
```

### docker inspect

```bash
# Полная информация в JSON
docker inspect web

# Извлечь конкретные поля (Go template)
docker inspect -f '{{.State.Status}}' web
docker inspect -f '{{.Config.Image}}' web
docker inspect -f '{{.NetworkSettings.IPAddress}}' web
docker inspect -f '{{.HostConfig.Memory}}' web

# Все переменные окружения
docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' web
```

### docker stats

```bash
# Статистика в реальном времени
docker stats web

# Без streaming (один снимок)
docker stats --no-stream web

# Все контейнеры
docker stats

# Форматированный вывод
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### docker top

```bash
# Процессы внутри контейнера
docker top web

# С дополнительными столбцами
docker top web aux
```

### docker diff

```bash
# Зайти в контейнер и создать файл
docker exec web touch /tmp/myfile.txt
docker exec web sh -c "echo 'Hello' > /usr/share/nginx/html/test.html"

# Посмотреть изменения в файловой системе
docker diff web
# A - добавлен
# C - изменен
# D - удален
```

### docker cp

```bash
# Скопировать файл из контейнера
docker cp web:/etc/nginx/nginx.conf ./nginx.conf

# Скопировать файл в контейнер
echo "<h1>Custom Page</h1>" > custom.html
docker cp custom.html web:/usr/share/nginx/html/

# Проверить
curl http://localhost/custom.html
```

### docker events

```bash
# В одном терминале запустить мониторинг событий
docker events

# В другом терминале
docker run -d --name test nginx
docker stop test
docker rm test

# Наблюдайте за событиями в первом терминале
```

### Комплексное задание

**Задача:** Запустить контейнер с Python приложением и исследовать его.

```bash
# Запустить Python HTTP сервер
docker run -d --name python-server -p 8000:8000 python:3.11 \
  python -m http.server 8000

# 1. Проверить, что работает
curl http://localhost:8000

# 2. Посмотреть логи
docker logs python-server

# 3. Проверить использование ресурсов
docker stats --no-stream python-server

# 4. Найти IP адрес
docker inspect -f '{{.NetworkSettings.IPAddress}}' python-server

# 5. Посмотреть процессы
docker top python-server

# 6. Зайти внутрь
docker exec -it python-server bash

# Внутри контейнера:
python --version
ls -la
cat /etc/os-release
netstat -tulpn  # если есть
exit

# 7. Создать файл внутри
docker exec python-server sh -c "echo 'Hello Docker!' > /hello.txt"

# 8. Скопировать файл
docker cp python-server:/hello.txt ./

# 9. Посмотреть изменения
docker diff python-server

# 10. Остановить и удалить
docker stop python-server
docker rm python-server
```

## Отладка проблем

### Контейнер не запускается

```bash
# Попробуйте запустить
docker run --name broken nginx:fake-tag

# Ошибка! Образ не найден
# Решение: проверить доступные теги
docker search nginx
docker pull nginx:latest

# Попробуйте с неправильной командой
docker run --name broken2 nginx invalid-command

# Контейнер сразу останавливается
docker ps -a
docker logs broken2
# Решение: использовать правильный entrypoint
```

### Порты не работают

```bash
# Запустить без проброса портов
docker run -d --name no-ports nginx

# Попробовать подключиться
curl http://localhost:80
# Не работает!

# Решение 1: Найти IP контейнера
docker inspect -f '{{.NetworkSettings.IPAddress}}' no-ports
curl http://<IP>:80
# Работает!

# Решение 2: Пересоздать с портами
docker rm -f no-ports
docker run -d --name with-ports -p 8080:80 nginx
curl http://localhost:8080
# Работает!
```

### Memory issues

```bash
# Запустить с маленьким лимитом памяти
docker run -d --name limited-memory --memory="50m" nginx

# Посмотреть stats
docker stats --no-stream limited-memory

# Если превышен лимит - контейнер будет killed
docker logs limited-memory
```

## Контрольные вопросы

1. Чем контейнер отличается от виртуальной машины?
2. Что такое Docker image и Docker container?
3. Какие Linux технологии используются для изоляции контейнеров?
4. Что происходит когда вы выполняете `docker run`?
5. Почему данные в контейнере исчезают после удаления?
6. Как посмотреть логи запущенного контейнера?
7. В чем разница между `docker stop` и `docker kill`?
8. Что делает флаг `--rm` в команде `docker run`?
9. Как выполнить команду внутри работающего контейнера?
10. Что такое Docker Registry и Docker Hub?
