---
slug: linux-debian-network
title: Настройка системы маршрутизации на сервере Linux Debian
description: Настройка маршрутизации на сервере Linux Debian
authors: [adaman]
tags: [linux]
---

![Debian](/img/debian.jpg)

# Настройка системы маршрутизации на сервере Linux Debian

Debian является одним из самых стабильных и надежных дистрибутивов Linux, широко используемым для серверных решений. Настройка маршрутизации в Debian имеет свои особенности по сравнению с другими дистрибутивами, особенно в части конфигурации сетевых интерфейсов и сохранения настроек. В этом уроке мы подробно рассмотрим все аспекты настройки маршрутизации на Debian, от базовых концепций до сложных enterprise-сценариев. {/* truncate */}

## Архитектура сетевой подсистемы Debian

### Особенности сетевой конфигурации в Debian

Debian использует собственную систему управления сетью, которая отличается от Ubuntu и других дистрибутивов:

- **Файл /etc/network/interfaces** — основной конфигурационный файл для сетевых интерфейсов
- **ifupdown** — традиционная система управления сетью в Debian
- **systemd-networkd** — современная альтернатива (доступна, но не используется по умолчанию)
- **NetworkManager** — опциональный компонент для desktop-версий

В серверных установках Debian обычно используется классический подход с `/etc/network/interfaces`.

### Версии Debian и их особенности

- **Debian 10 (Buster)** — стабильная версия с классическим подходом
- **Debian 11 (Bullseye)** — текущая стабильная версия
- **Debian 12 (Bookworm)** — новая стабильная версия с улучшенной поддержкой современных технологий
- **Debian Testing/Sid** — нестабильные ветки для разработки

## Теоретические основы маршрутизации

### Принципы работы IP-маршрутизации

Маршрутизация в Linux основывается на таблице маршрутизации ядра, которая определяет путь пакетов через сеть. Когда пакет покидает систему, ядро выполняет следующие шаги:

1. **Определение назначения** — извлекается IP-адрес получателя из заголовка пакета
2. **Поиск в таблице маршрутизации** — ядро ищет наиболее конкретное совпадение (longest prefix match)
3. **Выбор интерфейса** — определяется сетевой интерфейс для отправки пакета
4. **Определение следующего узла** — если пакет не для локальной сети, определяется gateway
5. **Отправка пакета** — пакет передается на нижний уровень стека протоколов

### Структура таблицы маршрутизации

Каждая запись в таблице маршрутизации содержит:

- **Префикс сети назначения** — например, 192.168.1.0/24
- **Шлюз (Gateway)** — IP-адрес следующего маршрутизатора
- **Интерфейс (Interface)** — физический или виртуальный интерфейс
- **Метрика (Metric)** — приоритет маршрута (чем меньше, тем выше приоритет)
- **Флаги** — дополнительная информация о маршруте
- **Scope** — область видимости маршрута

### Типы маршрутов в Linux

**Connected routes (подключенные)** — автоматически создаются для сетей, к которым напрямую подключен хост:
```
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.10
```

**Static routes (статические)** — настраиваются администратором вручную и не изменяются автоматически:
```
10.0.0.0/8 via 192.168.1.1 dev eth0
```

**Dynamic routes (динамические)** — создаются протоколами маршрутизации (OSPF, BGP, RIP):
```
172.16.0.0/12 via 192.168.1.254 dev eth0 proto zebra metric 20
```

**Default route (маршрут по умолчанию)** — используется когда нет более конкретного совпадения:
```
default via 192.168.1.1 dev eth0
```

**Blackhole routes (черные дыры)** — пакеты отбрасываются без отправки ICMP сообщения:
```
192.0.2.0/24 via blackhole
```

**Unreachable routes (недостижимые)** — пакеты отбрасываются с отправкой ICMP Destination Unreachable:
```
198.51.100.0/24 via unreachable
```

## Подготовка системы Debian

### Проверка версии и установленных пакетов

```bash
# Проверка версии Debian
cat /etc/debian_version
lsb_release -a

# Проверка ядра Linux
uname -r

# Проверка установленных сетевых утилит
dpkg -l | grep -E 'iproute2|net-tools|iputils'

# Установка необходимых пакетов
sudo apt update
sudo apt install -y iproute2 iputils-ping traceroute mtr-tiny tcpdump net-tools dnsutils
```

### Проверка сетевых интерфейсов

```bash
# Современный способ (iproute2)
ip link show
ip address show

# Краткая информация
ip -brief link
ip -brief address

# Подробная информация о конкретном интерфейсе
ip -s link show eth0

# Устаревший способ (все еще работает)
ifconfig -a

# Проверка состояния интерфейсов
cat /sys/class/net/eth0/operstate
cat /sys/class/net/eth0/carrier
```

Пример вывода:

```
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP mode DEFAULT group default qlen 1000
    link/ether 52:54:00:12:34:56 brd ff:ff:ff:ff:ff:ff
3: eth1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP mode DEFAULT group default qlen 1000
    link/ether 52:54:00:12:34:57 brd ff:ff:ff:ff:ff:ff
```

### Проверка текущей конфигурации маршрутизации

```bash
# Просмотр таблицы маршрутизации (современный способ)
ip route show

# Более подробный вывод
ip route show table all

# Просмотр для IPv6
ip -6 route show

# Устаревшие команды (но все еще полезные)
route -n
netstat -rn

# Проверка маршрута до конкретного хоста
ip route get 8.8.8.8
ip route get 2001:4860:4860::8888
```

Пример таблицы маршрутизации:

```
default via 192.168.1.1 dev eth0 proto dhcp metric 100
10.0.0.0/24 dev eth1 proto kernel scope link src 10.0.0.1 metric 100
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.10 metric 100
```

Расшифровка полей:
- **proto kernel** — маршрут создан ядром автоматически
- **proto dhcp** — маршрут получен от DHCP сервера
- **proto static** — статический маршрут
- **scope link** — маршрут для локальной сети
- **scope global** — глобальный маршрут
- **metric** — метрика (приоритет) маршрута

## Настройка сетевых интерфейсов в Debian

### Конфигурационный файл /etc/network/interfaces

Это основной файл конфигурации сети в Debian. Его структура:

```bash
sudo nano /etc/network/interfaces
```

Базовая конфигурация:

```
# Loopback интерфейс
auto lo
iface lo inet loopback

# Первый Ethernet интерфейс (DHCP)
auto eth0
iface eth0 inet dhcp

# Второй Ethernet интерфейс (статический IP)
auto eth1
iface eth1 inet static
    address 10.0.0.1
    netmask 255.255.255.0
    network 10.0.0.0
    broadcast 10.0.0.255
```

### Расширенная конфигурация интерфейсов

```
# Интерфейс с несколькими параметрами
auto eth0
iface eth0 inet static
    address 192.168.1.10/24
    gateway 192.168.1.1
    dns-nameservers 8.8.8.8 8.8.4.4
    dns-search example.com
    # MTU настройка
    mtu 1500
    # Метрика интерфейса
    metric 100

# Интерфейс с дополнительными IP-адресами
auto eth1
iface eth1 inet static
    address 10.0.0.1/24

auto eth1:0
iface eth1:0 inet static
    address 10.0.0.2/24

auto eth1:1
iface eth1:1 inet static
    address 10.0.0.3/24
```

### Современный способ с использованием CIDR

```
# Использование CIDR нотации (рекомендуется)
auto eth0
iface eth0 inet static
    address 192.168.1.10/24
    gateway 192.168.1.1

auto eth1
iface eth1 inet static
    address 10.0.0.1/24
```

### Применение изменений

```bash
# Остановка интерфейса
sudo ifdown eth0

# Запуск интерфейса
sudo ifup eth0

# Перезапуск интерфейса
sudo ifdown eth0 && sudo ifup eth0

# Перезапуск всей сети
sudo systemctl restart networking

# Альтернативный способ
sudo /etc/init.d/networking restart

# Проверка статуса сетевой службы
sudo systemctl status networking
```

## Включение IP-форвардинга в Debian

### Временное включение форвардинга

IP-форвардинг позволяет системе пересылать пакеты между интерфейсами, превращая её в маршрутизатор.

```bash
# Проверка текущего состояния IPv4 форвардинга
cat /proc/sys/net/ipv4/ip_forward
sysctl net.ipv4.ip_forward

# Включение IPv4 форвардинга (до перезагрузки)
sudo sysctl -w net.ipv4.ip_forward=1

# Или альтернативный способ
echo 1 | sudo tee /proc/sys/net/ipv4/ip_forward

# Для IPv6
sudo sysctl -w net.ipv6.conf.all.forwarding=1
```

### Постоянное включение форвардинга

Для сохранения настроек после перезагрузки редактируем `/etc/sysctl.conf`:

```bash
sudo nano /etc/sysctl.conf
```

Добавьте или раскомментируйте следующие строки:

```
# IPv4 форвардинг
net.ipv4.ip_forward=1

# IPv6 форвардинг
net.ipv6.conf.all.forwarding=1

# Дополнительные настройки для маршрутизатора
net.ipv4.conf.all.forwarding=1
net.ipv4.conf.default.forwarding=1
```

Применение изменений:

```bash
# Применить настройки из sysctl.conf
sudo sysctl -p

# Или из конкретного файла
sudo sysctl -p /etc/sysctl.conf

# Проверка применения
sysctl net.ipv4.ip_forward
```

### Гранулярный контроль форвардинга

```bash
# Включение форвардинга для конкретного интерфейса
sudo sysctl -w net.ipv4.conf.eth0.forwarding=1
sudo sysctl -w net.ipv4.conf.eth1.forwarding=1

# Проверка для всех интерфейсов
for i in /proc/sys/net/ipv4/conf/*/forwarding; do
    echo "$i: $(cat $i)"
done

# В sysctl.conf для постоянной настройки
net.ipv4.conf.eth0.forwarding=1
net.ipv4.conf.eth1.forwarding=1
```

### Дополнительные параметры ядра для маршрутизации

```bash
sudo nano /etc/sysctl.d/99-routing.conf
```

Добавьте оптимизированные параметры:

```
# Основной форвардинг
net.ipv4.ip_forward = 1
net.ipv6.conf.all.forwarding = 1

# Защита от IP spoofing
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Отключение ICMP redirects (безопасность)
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.secure_redirects = 0
net.ipv4.conf.default.secure_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Игнорирование ICMP broadcast requests
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Защита от bad ICMP error messages
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Логирование подозрительных пакетов
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1

# TCP оптимизация для маршрутизатора
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
```

Применение:

```bash
sudo sysctl --system
```

## Статическая маршрутизация в Debian

### Добавление статических маршрутов командой ip route

```bash
# Базовое добавление маршрута к сети через шлюз
sudo ip route add 172.16.0.0/16 via 192.168.1.254 dev eth0

# Маршрут через интерфейс без указания шлюза
sudo ip route add 10.10.0.0/16 dev eth1

# Маршрут к конкретному хосту
sudo ip route add 203.0.113.50 via 192.168.1.1

# Маршрут по умолчанию
sudo ip route add default via 192.168.1.1 dev eth0

# Маршрут с указанием метрики
sudo ip route add 192.168.100.0/24 via 10.0.0.254 metric 100

# Маршрут с source address
sudo ip route add 192.168.50.0/24 via 10.0.0.1 src 10.0.0.5

# Маршрут с MTU
sudo ip route add 192.168.200.0/24 via 10.0.0.1 mtu 1400

# Blackhole маршрут (отбрасывать пакеты)
sudo ip route add blackhole 192.0.2.0/24

# Unreachable маршрут (ICMP unreachable)
sudo ip route add unreachable 198.51.100.0/24

# Prohibit маршрут (ICMP administratively prohibited)
sudo ip route add prohibit 203.0.113.0/24
```

### Управление маршрутами

```bash
# Просмотр всех маршрутов
ip route show

# Просмотр маршрутов в конкретной таблице
ip route show table main
ip route show table local

# Удаление маршрута
sudo ip route del 172.16.0.0/16

# Удаление маршрута с конкретным шлюзом
sudo ip route del 10.10.0.0/16 via 192.168.1.254

# Изменение существующего маршрута
sudo ip route change 192.168.100.0/24 via 10.0.0.100

# Замена маршрута (удаляет старый, если существует)
sudo ip route replace 192.168.100.0/24 via 10.0.0.200

# Добавление нескольких путей (ECMP - Equal Cost Multi-Path)
sudo ip route add 10.20.0.0/16 \
    nexthop via 192.168.1.1 dev eth0 weight 1 \
    nexthop via 192.168.1.2 dev eth0 weight 1

# Просмотр маршрута для конкретного назначения
ip route get 8.8.8.8
ip route get 172.16.5.10
```

### Постоянные маршруты в /etc/network/interfaces

Это классический и надежный способ для Debian:

```bash
sudo nano /etc/network/interfaces
```

Пример конфигурации с маршрутами:

```
# Интерфейс WAN (внешний)
auto eth0
iface eth0 inet static
    address 203.0.113.10/24
    gateway 203.0.113.1
    dns-nameservers 8.8.8.8 8.8.4.4

# Интерфейс LAN (внутренний)
auto eth1
iface eth1 inet static
    address 192.168.1.1/24
    # Статические маршруты для этого интерфейса
    up ip route add 10.0.0.0/8 via 192.168.1.254 dev eth1
    up ip route add 172.16.0.0/12 via 192.168.1.253 dev eth1
    down ip route del 10.0.0.0/8
    down ip route del 172.16.0.0/12

# Интерфейс DMZ
auto eth2
iface eth2 inet static
    address 10.0.0.1/24
    # Множественные маршруты
    up ip route add 192.168.100.0/24 via 10.0.0.254
    up ip route add 192.168.101.0/24 via 10.0.0.254
    up ip route add 192.168.102.0/24 via 10.0.0.254
    down ip route del 192.168.100.0/24
    down ip route del 192.168.101.0/24
    down ip route del 192.168.102.0/24
```

### Использование директив up/down и post-up/pre-down

```
auto eth1
iface eth1 inet static
    address 10.0.0.1/24
    
    # Команды выполняются при поднятии интерфейса
    up ip route add 172.16.0.0/16 via 10.0.0.254
    up ip route add 192.168.0.0/16 via 10.0.0.253
    
    # Команды после поднятия интерфейса
    post-up echo 1 > /proc/sys/net/ipv4/conf/eth1/proxy_arp
    post-up iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
    
    # Команды перед опусканием интерфейса
    pre-down iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
    
    # Команды при опускании интерфейса
    down ip route del 172.16.0.0/16
    down ip route del 192.168.0.0/16
```

### Создание отдельного файла для маршрутов

Для лучшей организации можно создать отдельные скрипты:

```bash
sudo nano /etc/network/if-up.d/static-routes
```

Содержимое скрипта:

```bash
#!/bin/bash

# Проверяем, что поднимается нужный интерфейс
if [ "$IFACE" = "eth1" ]; then
    # Добавляем статические маршруты
    ip route add 10.0.0.0/8 via 192.168.1.254 dev eth1
    ip route add 172.16.0.0/12 via 192.168.1.253 dev eth1
    ip route add 192.168.100.0/24 via 192.168.1.252 dev eth1
    
    # Логирование
    logger "Static routes for eth1 added"
fi

if [ "$IFACE" = "eth0" ]; then
    # Маршруты для внешнего интерфейса
    ip route add 8.8.8.0/24 via 203.0.113.1 dev eth0
    logger "Static routes for eth0 added"
fi
```

Скрипт для удаления маршрутов:

```bash
sudo nano /etc/network/if-down.d/static-routes
```

```bash
#!/bin/bash

if [ "$IFACE" = "eth1" ]; then
    ip route del 10.0.0.0/8 2>/dev/null
    ip route del 172.16.0.0/12 2>/dev/null
    ip route del 192.168.100.0/24 2>/dev/null
    logger "Static routes for eth1 removed"
fi

if [ "$IFACE" = "eth0" ]; then
    ip route del 8.8.8.0/24 2>/dev/null
    logger "Static routes for eth0 removed"
fi
```

Сделать скрипты исполняемыми:

```bash
sudo chmod +x /etc/network/if-up.d/static-routes
sudo chmod +x /etc/network/if-down.d/static-routes
```

### Использование systemd для управления маршрутами

Создайте systemd service для маршрутов:

```bash
sudo nano /etc/systemd/system/static-routes.service
```

```ini
[Unit]
Description=Configure static routes
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/setup-routes.sh
RemainAfterExit=yes
ExecStop=/usr/local/bin/remove-routes.sh

[Install]
WantedBy=multi-user.target
```

Создайте скрипты:

```bash
sudo nano /usr/local/bin/setup-routes.sh
```

```bash
#!/bin/bash

# Добавление маршрутов
ip route add 10.0.0.0/8 via 192.168.1.254 dev eth1
ip route add 172.16.0.0/12 via 192.168.1.253 dev eth1

logger "Static routes configured"
```

```bash
sudo nano /usr/local/bin/remove-routes.sh
```

```bash
#!/bin/bash

# Удаление маршрутов
ip route del 10.0.0.0/8 2>/dev/null
ip route del 172.16.0.0/12 2>/dev/null

logger "Static routes removed"
```

```bash
sudo chmod +x /usr/local/bin/setup-routes.sh
sudo chmod +x /usr/local/bin/remove-routes.sh

sudo systemctl enable static-routes.service
sudo systemctl start static-routes.service
sudo systemctl status static-routes.service
```

## Продвинутая маршрутизация

### Множественные таблицы маршрутизации

Linux поддерживает до 255 независимых таблиц маршрутизации, что позволяет реализовать сложную логику маршрутизации.

#### Определение таблиц в rt_tables

```bash
sudo nano /etc/iproute2/rt_tables
```

Добавьте пользовательские таблицы:

```
#
# reserved values
#
255     local
254     main
253     default
0       unspec
#
# local
#
#1      inr.ruhep

# Пользовательские таблицы
10      isp1
11      isp2
20      vpn
30      internal
100     dmz
```

#### Работа с таблицами маршрутизации

```bash
# Добавление маршрутов в таблицу isp1
sudo ip route add default via 203.0.113.1 dev eth0 table isp1
sudo ip route add 203.0.113.0/24 dev eth0 scope link table isp1

# Добавление маршрутов в таблицу isp2
sudo ip route add default via 198.51.100.1 dev eth1 table isp2
sudo ip route add 198.51.100.0/24 dev eth1 scope link table isp2

# Просмотр конкретной таблицы
ip route show table isp1
ip route show table isp2

# Просмотр всех таблиц
ip route show table all

# Удаление маршрута из таблицы
sudo ip route del default table isp1

# Очистка таблицы
sudo ip route flush table isp1
```

### Policy-Based Routing (PBR)

Policy-Based Routing позволяет маршрутизировать трафик на основе различных критериев, а не только адреса назначения.

#### Создание правил маршрутизации

```bash
# Трафик от подсети 192.168.1.0/24 через таблицу isp1
sudo ip rule add from 192.168.1.0/24 table isp1

# Трафик от подсети 192.168.2.0/24 через таблицу isp2
sudo ip rule add from 192.168.2.0/24 table isp2

# Трафик к конкретной сети через таблицу vpn
sudo ip rule add to 10.10.0.0/16 table vpn

# Маршрутизация на основе входящего интерфейса
sudo ip rule add iif eth2 table dmz

# Маршрутизация на основе исходящего интерфейса
sudo ip rule add oif eth0 table isp1

# Правило с приоритетом
sudo ip rule add from 172.16.0.0/12 table internal priority 100

# Маршрутизация на основе метки (fwmark) от iptables
sudo ip rule add fwmark 1 table isp1
sudo ip rule add fwmark 2 table isp2

# Просмотр всех правил
ip rule show
ip rule list

# Удаление правила
sudo ip rule del from 192.168.1.0/24 table isp1
sudo ip rule del priority 100
```

#### Приоритеты правил

Правила обрабатываются в порядке приоритета (от меньшего к большему):

```bash
# Вывод с приоритетами
ip rule show

# Пример:
# 0:      from all lookup local
# 100:    from 172.16.0.0/12 lookup internal
# 32765:  from 192.168.1.0/24 lookup isp1
# 32766:  from all lookup main
# 32767:  from all lookup default
```

### Практический пример: Dual-WAN конфигурация

Настройка системы с двумя интернет-провайдерами для балансировки нагрузки и резервирования:

#### Шаг 1: Настройка интерфейсов

```bash
sudo nano /etc/network/interfaces
```

```
# Loopback
auto lo
iface lo inet loopback

# WAN1 (ISP1)
auto eth0
iface eth0 inet static
    address 203.0.113.10/24
    # gateway не указываем здесь

# WAN2 (ISP2)
auto eth1
iface eth1 inet static
    address 198.51.100.10/24
    # gateway не указываем здесь

# LAN
auto eth2
iface eth2 inet static
    address 192.168.1.1/24
```

#### Шаг 2: Настройка таблиц маршрутизации

```bash
# В /etc/iproute2/rt_tables уже добавлены таблицы isp1 и isp2

# Создаем скрипт настройки
sudo nano /usr/local/bin/setup-dual-wan.sh
```
 
```bash
#!/bin/bash
# /usr/local/bin/setup-dual-wan.sh

# --- ISP1 (основной, более высокий приоритет) ---
ISP1_GW=203.0.113.1
ISP1_IF=eth0
ISP1_IP=203.0.113.10
ISP1_NET=203.0.113.0/24

# --- ISP2 (резервный) ---
ISP2_GW=198.51.100.1
ISP2_IF=eth1
ISP2_IP=198.51.100.10
ISP2_NET=198.51.100.0/24

LAN_IF=eth2
LAN_NET=192.168.1.0/24

# 1. Чистим старые настройки (на всякий случай)
ip rule flush
ip route flush table isp1 2>/dev/null
ip route flush table isp2 2>/dev/null

# 2. Создаём/обновляем таблицы маршрутизации
ip route add default via $ISP1_GW dev $ISP1_IF table isp1
ip route add $ISP1_NET dev $ISP1_IF scope link table isp1
ip route add $LAN_NET dev $LAN_IF scope link table isp1

ip route add default via $ISP2_GW dev $ISP2_IF table isp2
ip route add $ISP2_NET dev $ISP2_IF scope link table isp2
ip route add $LAN_NET dev $LAN_IF scope link table isp2

# 3. Основные правила выбора таблицы (по source IP)
# Трафик от LAN идёт преимущественно через ISP1
ip rule add from $LAN_NET lookup isp1 priority 10000

# Резервный путь через ISP2 (более низкий приоритет)
ip rule add from $LAN_NET lookup isp2 priority 20000

# 4. Локальные сети и сам сервер всегда используют main таблицу
ip rule add lookup main suppress_prefixlength 0

# 5. Правило для трафика, инициированного самим роутером
# (чтобы ответы шли через тот же провайдер, через который ушёл запрос)
ip rule add iif lo table main priority 5000

# 6. Очень важно! Маршрут по умолчанию в основной таблице
# (нужен для работы самого роутера и системных служб)
ip route replace default via $ISP1_GW dev $ISP1_IF metric 50
ip route add default via $ISP2_GW dev $ISP2_IF metric 200

echo "Dual-WAN routing configured:"
ip rule show
echo "--------------------------------"
ip route show table isp1
echo "--------------------------------"
ip route show table isp2
```

### Вариант 2 — Маркировка пакетов + fwmark (более гибкий подход)

```bash
# Дополнение к предыдущему скрипту

# 1. Создаём цепочку маркировки
iptables -t mangle -F
iptables -t mangle -X

iptables -t mangle -N MARK_ISP1
iptables -t mangle -N MARK_ISP2

# 2. Примеры правил маркировки (можно комбинировать)
# Вариант А: по исходящему порту
iptables -t mangle -A OUTPUT -p tcp --dport 80   -j MARK --set-mark 1
iptables -t mangle -A OUTPUT -p tcp --dport 443  -j MARK --set-mark 1

# Вариант Б: по подсети источника (гости/офис)
iptables -t mangle -A PREROUTING -s 192.168.1.128/25 -j MARK --set-mark 2

# Вариант В: по протоколу/приложению
iptables -t mangle -A PREROUTING -p udp --dport 1194 -j MARK --set-mark 2   # OpenVPN

# 3. Правила ip rule по меткам
ip rule add fwmark 1 table isp1 priority 500
ip rule add fwmark 2 table isp2 priority 600
```

### NAT для Dual-WAN

Обычно используют один из следующих вариантов:

```bash
# Вариант 1 — простой (всё маскарадится с того интерфейса, через который уходит)
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
iptables -t nat -A POSTROUTING -o eth1 -j MASQUERADE

# Вариант 2 — явная привязка к метке/таблице (более предсказуемо)
iptables -t nat -A POSTROUTING -o eth0 -m mark --mark 0x1 -j MASQUERADE
iptables -t nat -A POSTROUTING -o eth1 -m mark --mark 0x2 -j MASQUERADE
```

### Сохранение настроек в Debian (рекомендуемые способы 2024–2026)

Способ                        | Удобство | Надёжность | Гибкость | Примечание
------------------------------|----------|------------|----------|-----------------------
`/etc/network/interfaces` + up/down | ★★★★     | ★★★★★      | ★★★      | Классика Debian
Отдельные скрипты в `/etc/network/if-up.d/` | ★★★★     | ★★★★☆      | ★★★★     | Очень удобно
systemd unit + скрипты        | ★★★★     | ★★★★★      | ★★★★☆    | Современный подход
nftables/iptables-persistent  | ★★★      | ★★★★★      | ★★★★★    | Для NAT и fwmark
`/etc/network/interfaces` + `post-up` | ★★★★     | ★★★★       | ★★★★     | Самый популярный компромисс

### Самые частые ошибки при настройке маршрутизации в Debian

1. Забыли включить `net.ipv4.ip_forward=1`
2. В основной таблице нет маршрута по умолчанию → сам роутер теряет интернет
3. Не прописали локальную сеть в пользовательских таблицах
4. rp_filter = 1 при асимметричной маршрутизации → обратный трафик отбрасывается
5. Правила ip rule в неправильном порядке (приоритеты)
6. Конфликт между DHCP и вручную прописанным default gateway
7. Не сделали `ifdown && ifup` после изменения interfaces
8. Забыли сохранить правила iptables/nftables

### Очень краткий чек-лист после настройки

```bash
# Что обязательно проверить:

sysctl net.ipv4.ip_forward
ip rule show
ip route show table all
ip route get 8.8.8.8 from 192.168.1.10
tcpdump -i any -nn icmp and host 8.8.8.8
iptables -t nat -vnL
iptables -t mangle -vnL
```
