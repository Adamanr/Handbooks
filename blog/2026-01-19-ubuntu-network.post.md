---
slug: linux-ubuntu-network
title: Настройка системы маршрутизации на сервере Linux Ubuntu
description: Представьте вселенную, где ежесекундно происходят миллиарды сообщений, звонков и финансовых операций. Каждое послание достигает адресата, звонки продолжаются бесперебойно, а средства поступают моментально. Что обеспечивает такую безупречную работу?
authors: [adaman]
tags: [linux]
---

![Ubuntu](/img/ubuntu.jpg)

# Настройка системы маршрутизации на сервере Linux Ubuntu

Маршрутизация — это процесс определения пути передачи сетевых пакетов от источника к получателю через одну или несколько сетей. В Linux-системах маршрутизация играет критическую роль в обеспечении сетевой связности, позволяя серверу выступать в роли маршрутизатора, шлюза или просто корректно обрабатывать сетевой трафик в сложных топологиях.

В этом уроке мы подробно рассмотрим все аспекты настройки маршрутизации на Ubuntu Server, начиная с базовых концепций и заканчивая продвинутыми сценариями использования. {/* truncate */}

## Теоретическая часть

### Основы IP-маршрутизации

Маршрутизация основывается на таблице маршрутизации (routing table), которая содержит информацию о том, куда должны направляться пакеты с различными IP-адресами назначения. Каждая запись в таблице маршрутизации содержит следующие основные параметры:

- **Destination** — сеть назначения (в формате IP/маска)
- **Gateway** — IP-адрес шлюза (следующего маршрутизатора)
- **Genmask** — маска подсети назначения
- **Flags** — флаги маршрута (U - активен, G - через шлюз, H - хост)
- **Metric** — метрика (приоритет) маршрута
- **Iface** — сетевой интерфейс для отправки пакетов

### Типы маршрутов

**Статические маршруты** — конфигурируются администратором вручную и остаются неизменными до тех пор, пока не будут изменены или удалены.

**Динамические маршруты** — создаются автоматически протоколами динамической маршрутизации (RIP, OSPF, BGP) и адаптируются к изменениям топологии сети.

**Маршрут по умолчанию** (default gateway) — используется для отправки пакетов в сети, для которых нет конкретного маршрута в таблице.

**Прямые маршруты** (directly connected) — создаются автоматически для сетей, к которым непосредственно подключен сервер.

## Подготовка системы

### Проверка сетевой конфигурации

Прежде чем приступить к настройке маршрутизации, необходимо проверить текущую конфигурацию сети. Для этого используются следующие команды:

```bash
# Просмотр сетевых интерфейсов
ip link show

# Просмотр IP-адресов на интерфейсах
ip addr show

# Альтернативный способ (устаревший, но все еще используемый)
ifconfig
```

Пример вывода команды `ip addr show`:

```
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN
    inet 127.0.0.1/8 scope host lo
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP
    inet 192.168.1.10/24 brd 192.168.1.255 scope global eth0
3: eth1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP
    inet 10.0.0.1/24 brd 10.0.0.255 scope global eth1
```

### Просмотр текущей таблицы маршрутизации

Существует несколько способов просмотра таблицы маршрутизации:

```bash
# Современный способ с использованием iproute2
ip route show

# Альтернативные команды
route -n
netstat -rn
```

Пример таблицы маршрутизации:

```
default via 192.168.1.1 dev eth0 proto static
10.0.0.0/24 dev eth1 proto kernel scope link src 10.0.0.1
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.10
```

Расшифровка:
- Первая строка указывает маршрут по умолчанию через шлюз 192.168.1.1
- Вторая и третья строки — прямые маршруты к подключенным сетям

## Включение IP-форвардинга

IP-форвардинг (пересылка IP-пакетов) — это возможность Linux-системы передавать пакеты между различными сетевыми интерфейсами. По умолчанию эта функция отключена из соображений безопасности.

### Временное включение

Для временного включения форвардинга (до перезагрузки системы):

```bash
# Включение IPv4 форвардинга
sudo sysctl -w net.ipv4.ip_forward=1

# Проверка текущего состояния
sysctl net.ipv4.ip_forward

# Или альтернативный способ
cat /proc/sys/net/ipv4/ip_forward
```

Значение 1 означает включено, 0 — выключено.

### Постоянное включение

Для сохранения настроек после перезагрузки необходимо отредактировать файл `/etc/sysctl.conf`:

```bash
sudo nano /etc/sysctl.conf
```

Добавьте или раскомментируйте строку:

```
net.ipv4.ip_forward=1
```

Для IPv6 (если используется):

```
net.ipv6.conf.all.forwarding=1
```

Применить изменения без перезагрузки:

```bash
sudo sysctl -p
```

### Проверка форвардинга для конкретных интерфейсов

Иногда требуется более гранулярный контроль:

```bash
# Просмотр настроек для конкретного интерфейса
cat /proc/sys/net/ipv4/conf/eth0/forwarding

# Включение форвардинга для всех интерфейсов
sudo sysctl -w net.ipv4.conf.all.forwarding=1

# Включение для конкретного интерфейса
sudo sysctl -w net.ipv4.conf.eth1.forwarding=1
```

## Настройка статической маршрутизации

### Добавление статических маршрутов

#### Использование команды ip route

Современный и рекомендуемый способ — использование утилиты `ip` из пакета iproute2:

```bash
# Добавление маршрута к конкретной сети через шлюз
sudo ip route add 172.16.0.0/24 via 192.168.1.254 dev eth0

# Добавление маршрута к сети через интерфейс (без указания шлюза)
sudo ip route add 10.10.0.0/16 dev eth1

# Добавление маршрута к конкретному хосту
sudo ip route add 203.0.113.5 via 192.168.1.1

# Добавление маршрута по умолчанию
sudo ip route add default via 192.168.1.1 dev eth0
```

#### Параметры команды ip route

Команда `ip route` поддерживает множество дополнительных параметров:

```bash
# Добавление маршрута с метрикой
sudo ip route add 192.168.100.0/24 via 10.0.0.254 metric 100

# Добавление маршрута с указанием source address
sudo ip route add 192.168.50.0/24 via 10.0.0.1 src 10.0.0.5

# Добавление маршрута с MTU
sudo ip route add 192.168.200.0/24 via 10.0.0.1 mtu 1400

# Добавление маршрута через конкретную таблицу
sudo ip route add 172.20.0.0/16 via 192.168.1.254 table 100
```

### Удаление маршрутов

```bash
# Удаление конкретного маршрута
sudo ip route del 172.16.0.0/24

# Удаление маршрута по умолчанию
sudo ip route del default

# Удаление маршрута через конкретный шлюз
sudo ip route del 10.10.0.0/16 via 192.168.1.254
```

### Изменение существующих маршрутов

```bash
# Изменение маршрута
sudo ip route change 192.168.100.0/24 via 10.0.0.100

# Замена маршрута (удаляет старый, если существует)
sudo ip route replace 192.168.100.0/24 via 10.0.0.200
```

### Постоянные статические маршруты в Ubuntu

Маршруты, добавленные командой `ip route`, не сохраняются после перезагрузки. Существует несколько способов сделать их постоянными:

#### Метод 1: Использование Netplan (Ubuntu 18.04+)

Netplan — это современная утилита конфигурации сети в Ubuntu. Файлы конфигурации находятся в `/etc/netplan/`.

Создайте или отредактируйте файл (например, `/etc/netplan/01-netcfg.yaml`):

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      addresses:
        - 192.168.1.10/24
      routes:
        - to: 172.16.0.0/24
          via: 192.168.1.254
          metric: 100
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
    eth1:
      addresses:
        - 10.0.0.1/24
      routes:
        - to: 192.168.100.0/24
          via: 10.0.0.254
```

Применить конфигурацию:

```bash
sudo netplan apply

# Или с более подробным выводом
sudo netplan --debug apply

# Проверка конфигурации перед применением
sudo netplan try
```

#### Метод 2: Использование /etc/network/interfaces (старые версии)

Для систем без Netplan можно использовать традиционный файл `/etc/network/interfaces`:

```bash
sudo nano /etc/network/interfaces
```

Добавьте маршруты:

```
auto eth0
iface eth0 inet static
    address 192.168.1.10
    netmask 255.255.255.0
    gateway 192.168.1.1
    up ip route add 172.16.0.0/24 via 192.168.1.254
    down ip route del 172.16.0.0/24

auto eth1
iface eth1 inet static
    address 10.0.0.1
    netmask 255.255.255.0
    up ip route add 192.168.100.0/24 via 10.0.0.254
```

#### Метод 3: Создание скрипта в /etc/network/if-up.d/

Создайте исполняемый скрипт:

```bash
sudo nano /etc/network/if-up.d/static-routes
```

Добавьте содержимое:

```bash
#!/bin/bash

# Добавление статических маршрутов
ip route add 172.16.0.0/24 via 192.168.1.254 dev eth0
ip route add 192.168.100.0/24 via 10.0.0.254 dev eth1
ip route add 10.20.0.0/16 via 192.168.1.253 dev eth0
```

Сделайте скрипт исполняемым:

```bash
sudo chmod +x /etc/network/if-up.d/static-routes
```

## Продвинутая маршрутизация

### Множественные таблицы маршрутизации

Linux поддерживает до 255 таблиц маршрутизации, что позволяет реализовывать сложные сценарии маршрутизации на основе различных критериев.

#### Создание и использование дополнительных таблиц

Сначала определите таблицу в файле `/etc/iproute2/rt_tables`:

```bash
sudo nano /etc/iproute2/rt_tables
```

Добавьте свои таблицы:

```
# Зарезервированные таблицы
255 local
254 main
253 default
0 unspec

# Пользовательские таблицы
100 provider1
101 provider2
200 internal
```

Добавление маршрутов в конкретную таблицу:

```bash
# Добавление маршрутов в таблицу provider1
sudo ip route add default via 203.0.113.1 dev eth0 table provider1
sudo ip route add 203.0.113.0/24 dev eth0 scope link table provider1

# Добавление маршрутов в таблицу provider2
sudo ip route add default via 198.51.100.1 dev eth1 table provider2
sudo ip route add 198.51.100.0/24 dev eth1 scope link table provider2

# Просмотр конкретной таблицы
ip route show table provider1
```

### Policy-based routing (маршрутизация на основе правил)

Policy-based routing позволяет выбирать маршруты на основе различных критериев: исходящего IP-адреса, входящего интерфейса, типа службы и т.д.

#### Создание правил маршрутизации

```bash
# Направить трафик от конкретной сети через таблицу provider1
sudo ip rule add from 192.168.10.0/24 table provider1

# Направить трафик к конкретной сети через таблицу provider2
sudo ip rule add to 172.16.0.0/12 table provider2

# Маршрутизация на основе входящего интерфейса
sudo ip rule add iif eth0 table provider1

# Маршрутизация на основе метки (fwmark) от iptables
sudo ip rule add fwmark 1 table provider1

# Маршрутизация с приоритетом
sudo ip rule add from 10.0.0.0/8 table internal priority 100

# Просмотр всех правил
ip rule show
```

Пример вывода `ip rule show`:

```
0:      from all lookup local
100:    from 10.0.0.0/8 lookup internal
32765:  from 192.168.10.0/24 lookup provider1
32766:  from all lookup main
32767:  from all lookup default
```

#### Практический пример: балансировка нагрузки между двумя провайдерами

Настроим систему для использования двух интернет-каналов:

```bash
# Настройка таблиц маршрутизации
# Файл /etc/iproute2/rt_tables уже содержит provider1 и provider2

# Настройка таблицы provider1
sudo ip route add 203.0.113.0/24 dev eth0 src 203.0.113.10 table provider1
sudo ip route add default via 203.0.113.1 table provider1

# Настройка таблицы provider2
sudo ip route add 198.51.100.0/24 dev eth1 src 198.51.100.10 table provider2
sudo ip route add default via 198.51.100.1 table provider2

# Правила для выбора таблиц на основе исходящего адреса
sudo ip rule add from 203.0.113.10 table provider1
sudo ip rule add from 198.51.100.10 table provider2

# Балансировка нагрузки в основной таблице
sudo ip route add default scope global \
    nexthop via 203.0.113.1 dev eth0 weight 1 \
    nexthop via 198.51.100.1 dev eth1 weight 1
```

### Маркировка пакетов с помощью iptables для маршрутизации

Использование firewall-меток (fwmark) позволяет маршрутизировать трафик на основе сложных правил фильтрации:

```bash
# Маркировка HTTP-трафика меткой 1
sudo iptables -t mangle -A PREROUTING -p tcp --dport 80 -j MARK --set-mark 1

# Маркировка HTTPS-трафика меткой 2
sudo iptables -t mangle -A PREROUTING -p tcp --dport 443 -j MARK --set-mark 2

# Правила маршрутизации на основе меток
sudo ip rule add fwmark 1 table provider1
sudo ip rule add fwmark 2 table provider2

# Маркировка трафика от конкретного пользователя
sudo iptables -t mangle -A OUTPUT -m owner --uid-owner 1000 -j MARK --set-mark 3
sudo ip rule add fwmark 3 table internal
```

### Source-based routing (маршрутизация на основе источника)

```bash
# Трафик от подсети 192.168.1.0/24 идет через provider1
sudo ip rule add from 192.168.1.0/24 table provider1

# Трафик от подсети 192.168.2.0/24 идет через provider2
sudo ip rule add from 192.168.2.0/24 table provider2

# Трафик от конкретного хоста
sudo ip rule add from 192.168.1.50 table provider1 priority 100
```

## Динамическая маршрутизация

### Протоколы динамической маршрутизации

Для автоматического обмена маршрутной информацией между маршрутизаторами используются протоколы динамической маршрутизации. В Linux наиболее популярным решением является FRRouting (FRR).

### Установка FRRouting

```bash
# Добавление репозитория FRR
curl -s https://deb.frrouting.org/frr/keys.asc | sudo apt-key add -
echo deb https://deb.frrouting.org/frr $(lsb_release -s -c) frr-stable | sudo tee /etc/apt/sources.list.d/frr.list

# Обновление списка пакетов и установка
sudo apt update
sudo apt install frr frr-pythontools -y
```

### Базовая настройка FRR

Конфигурационные файлы FRR находятся в `/etc/frr/`.

```bash
# Включение необходимых демонов
sudo nano /etc/frr/daemons
```

Измените на:

```
bgpd=yes
ospfd=yes
ripd=yes
zebra=yes
```

Основной файл конфигурации:

```bash
sudo nano /etc/frr/frr.conf
```

#### Пример конфигурации OSPF

```
! Базовая конфигурация
hostname ubuntu-router
log syslog informational

! Настройка интерфейсов
interface eth0
 ip address 192.168.1.1/24

interface eth1
 ip address 10.0.0.1/24

! Настройка OSPF
router ospf
 ospf router-id 1.1.1.1
 network 192.168.1.0/24 area 0
 network 10.0.0.0/24 area 0
 passive-interface eth0

line vty
```

#### Пример конфигурации RIP

```
router rip
 version 2
 network 192.168.1.0/24
 network 10.0.0.0/24
 redistribute connected
```

#### Пример базовой конфигурации BGP

```
router bgp 65001
 bgp router-id 1.1.1.1
 neighbor 203.0.113.1 remote-as 65002
 !
 address-family ipv4 unicast
  network 192.168.1.0/24
  neighbor 203.0.113.1 activate
 exit-address-family
```

Перезапуск службы:

```bash
sudo systemctl restart frr
sudo systemctl enable frr
```

### Управление FRR через vtysh

FRR использует интерфейс командной строки, похожий на Cisco IOS:

```bash
# Вход в интерфейс FRR
sudo vtysh

# Просмотр конфигурации
show running-config

# Просмотр таблицы маршрутизации
show ip route

# Просмотр OSPF соседей
show ip ospf neighbor

# Просмотр BGP соседей
show ip bgp summary

# Переход в режим конфигурации
configure terminal

# Сохранение конфигурации
write memory

# Выход
exit
```

## NAT и маскарадинг

Network Address Translation (NAT) часто используется совместно с маршрутизацией для преобразования адресов.

### Source NAT (SNAT) / Masquerading

Маскарадинг используется для предоставления доступа в Интернет компьютерам внутренней сети:

```bash
# Маскарадинг для всего трафика через eth0
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE

# SNAT с указанием конкретного IP (более производительный)
sudo iptables -t nat -A POSTROUTING -o eth0 -j SNAT --to-source 203.0.113.10

# SNAT для конкретной подсети
sudo iptables -t nat -A POSTROUTING -s 192.168.1.0/24 -o eth0 -j MASQUERADE
```

### Destination NAT (DNAT) / Port Forwarding

Проброс портов для перенаправления входящих соединений:

```bash
# Проброс порта 80 на внутренний сервер
sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 \
    -j DNAT --to-destination 192.168.1.100:80

# Проброс диапазона портов
sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 8000:8100 \
    -j DNAT --to-destination 192.168.1.100:8000-8100

# Проброс с изменением порта
sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 2222 \
    -j DNAT --to-destination 192.168.1.100:22
```

### Сохранение правил iptables

Правила iptables не сохраняются автоматически:

```bash
# Установка пакета для сохранения правил
sudo apt install iptables-persistent -y

# Сохранение текущих правил
sudo netfilter-persistent save

# Или вручную
sudo iptables-save > /etc/iptables/rules.v4
sudo ip6tables-save > /etc/iptables/rules.v6

# Восстановление правил
sudo iptables-restore < /etc/iptables/rules.v4
```

## Диагностика и устранение неполадок

### Основные команды диагностики

```bash
# Трассировка маршрута
traceroute 8.8.8.8
tracepath 8.8.8.8

# MTR (комбинация ping и traceroute)
mtr 8.8.8.8

# Проверка связности
ping -c 4 8.8.8.8

# Проверка с указанием интерфейса
ping -I eth1 192.168.1.1

# Проверка с указанием source IP
ping -I 10.0.0.1 192.168.100.1
```

### Анализ таблицы маршрутизации

```bash
# Подробный вывод таблицы маршрутизации
ip route show table all

# Просмотр кеша маршрутов
ip route show cache

# Проверка маршрута для конкретного назначения
ip route get 8.8.8.8

# Просмотр статистики маршрутов
ip -s route
```

### Мониторинг в реальном времени

```bash
# Мониторинг изменений в таблице маршрутизации
ip monitor route

# Мониторинг изменений правил
ip monitor rule

# Просмотр сетевых соединений
ss -tunap

# Просмотр статистики интерфейсов
ip -s link

# Постоянный мониторинг с помощью watch
watch -n 1 'ip route show'
```

### Захват и анализ трафика

```bash
# Установка tcpdump
sudo apt install tcpdump -y

# Захват трафика на интерфейсе
sudo tcpdump -i eth0

# Захват с фильтрацией по хосту
sudo tcpdump -i eth0 host 192.168.1.100

# Захват ICMP пакетов
sudo tcpdump -i eth0 icmp

# Сохранение в файл для последующего анализа
sudo tcpdump -i eth0 -w capture.pcap

# Просмотр захваченного файла
tcpdump -r capture.pcap
```

### Проверка форвардинга пакетов

```bash
# Проверка счетчиков пакетов
sudo iptables -t filter -L FORWARD -v -n

# Добавление правила для логирования форвардинга
sudo iptables -I FORWARD -j LOG --log-prefix "FORWARD: " --log-level 4

# Просмотр логов
sudo tail -f /var/log/syslog | grep FORWARD
```

### Типичные проблемы и решения

**Проблема**: Пакеты не проходят между интерфейсами

Решение:
```bash
# Проверьте включен ли IP forwarding
sysctl net.ipv4.ip_forward

# Проверьте правила firewall
sudo iptables -L FORWARD -v -n

# Разрешите форвардинг
sudo iptables -P FORWARD ACCEPT
```

**Проблема**: Маршрут существует, но не работает

Решение:
```bash
# Проверьте конкретный маршрут
ip route get DESTINATION_IP

# Проверьте ARP таблицу
ip neigh show

# Очистите ARP кеш
sudo ip neigh flush all

# Проверьте правила policy routing
ip rule show
```

**Проблема**: Асимметричная маршрутизация

Решение:
```bash
# Отключение rp_filter (reverse path filtering)
sudo sysctl -w net.ipv4.conf.all.rp_filter=0
sudo sysctl -w net.ipv4.conf.eth0.rp_filter=0

# Для постоянного применения добавьте в /etc/sysctl.conf:
net.ipv4.conf.all.rp_filter=0
net.ipv4.conf.default.rp_filter=0
```

## Оптимизация и безопасность

### Параметры sysctl для оптимизации маршрутизации

```bash
sudo nano /etc/sysctl.conf
```

Добавьте следующие параметры:

```
# Основные параметры маршрутизации
net.ipv4.ip_forward=1
net.ipv4.conf.all.forwarding=1

# Защита от IP spoofing
net.ipv4.conf.all.rp_filter=1
net.ipv4.conf.default.rp_filter=1

# Игнорирование ICMP redirects
net.ipv4.conf.all.accept_redirects=0
net.ipv4.conf.all.send_redirects=0

# Защита от SYN flood
net.ipv4.tcp_syncookies=1
net.ipv4.tcp_max_syn_backlog=2048
net.ipv4.tcp_synack_retries=2

# Оптимизация производительности
net.ipv4.tcp_fin_timeout=15
net.ipv4.tcp_keepalive_time=300
net.ipv4.tcp_tw_reuse=1

# Увеличение размера таблицы маршрутизации
net.ipv4.route.max_size=2147483647

# Кеширование маршрутов
net.ipv4.route.gc_timeout=100

# IPv6 параметры (если используется)
net.ipv6.conf.all.forwarding=1
net.ipv6.conf.all.accept_redirects=0
```

Применение:

```bash
sudo sysctl -p
```

### Базовые правила безопасности firewall

```bash
# Политики по умолчанию
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

# Разрешение loopback
sudo iptables -A INPUT -i lo -j ACCEPT

# Разр
