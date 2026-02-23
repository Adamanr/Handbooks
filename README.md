<div align="center">

<img src="static/img/books.svg" alt="Handbooks" width="80" />

# 📘 Handbooks

### Открытый справочник по языкам программирования и технологиям

*85 страниц · 5 направлений · Всё бесплатно и с открытым исходным кодом*

[![Live Demo](https://img.shields.io/badge/🌐_Открыть_сайт-adamanr.github.io/Handbooks-0969da?style=for-the-badge)](https://adamanr.github.io/Handbooks/)

[![Docusaurus](https://img.shields.io/badge/Docusaurus-3.9-3DDC84?logo=docusaurus&logoColor=white)](https://docusaurus.io/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-latest-f9f1e1?logo=bun&logoColor=black)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/adamanr/Handbooks?style=flat&logo=github)](https://github.com/adamanr/Handbooks/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/adamanr/Handbooks?style=flat&logo=github)](https://github.com/adamanr/Handbooks/issues)

[**Перейти на сайт**](https://adamanr.github.io/Handbooks/) · [**Сообщить об ошибке**](https://github.com/adamanr/Handbooks/issues) · [**Telegram**](https://t.me/devs_inc)

</div>

<br/>

## 🎯 О проекте

**Handbooks** — образовательный ресурс для студентов и разработчиков, построенный на [Docusaurus](https://docusaurus.io/). Проект создан как дополнительный справочник для изучения актуальных технологий: структурированные материалы, реальные примеры кода, практические задания — всё в открытом доступе.

> *«Справочник, который мы хотели бы иметь, когда начинали учиться»*

**Ключевые особенности:**
- 📖 Пошаговые руководства от основ до продвинутых тем
- 💻 Примеры кода, готовые к запуску
- 🧩 Практические задания для закрепления
- 🔍 Встроенный полнотекстовый поиск
- 🌙 Тёмная и светлая темы
- 💬 Комментарии через Giscus (GitHub Discussions)

---

## 📚 Хендбуки

<table>
<tr><td>

### [![Go](https://skillicons.dev/icons?i=go&theme=light)](https://adamanr.github.io/Handbooks/go) Go — 49 страниц

Полное руководство от основ до продвинутых тем.

| Раздел | Описание |
|--------|----------|
| [**Основы**](https://adamanr.github.io/Handbooks/go/basics/introduction) | Синтаксис, управляющие конструкции, функции |
| [**Глубокое погружение**](https://adamanr.github.io/Handbooks/go/deep-dive/memory) | Управление памятью, GC, планировщик горутин |
| [**Инструменты**](https://adamanr.github.io/Handbooks/go/category/instruments) | gRPC, Docker-деплой |
| [**Библиотеки**](https://adamanr.github.io/Handbooks/go/category/libraries) | Популярные Go-библиотеки |
| [**Практика**](https://adamanr.github.io/Handbooks/go/category/practical-tasks) | Задания для закрепления |

</td></tr>
<tr><td>

### [![Postgres](https://skillicons.dev/icons?i=postgres&theme=light)](https://adamanr.github.io/Handbooks/postgresql) PostgreSQL — 33 страниц

Подробное руководство по реляционной СУБД.

| Раздел | Описание |
|--------|----------|
| [**Теория и практика**](https://adamanr.github.io/Handbooks/postgresql/advanced/intro-postgresql) | От основ SQL до EXPLAIN, конкурентности и оптимизации |
| [**Практические задания**](https://adamanr.github.io/Handbooks/postgresql/practice/reminder) | Упражнения на закрепление |

</td></tr>
<tr><td>

### [![Elixir](https://skillicons.dev/icons?i=elixir&theme=light)](https://adamanr.github.io/Handbooks/elixir) Elixir — 🚧 *в процессе*

</td></tr>
<tr><td>

### [![Docker](https://skillicons.dev/icons?i=docker&theme=light)](https://adamanr.github.io/Handbooks/k8s) Контейнеризация — 🚧 *в процессе*

- [**Docker**](https://adamanr.github.io/Handbooks/k8s/docker/intro-docker) — введение в контейнеризацию

</td></tr>
<tr><td>

### [![Rust](https://skillicons.dev/icons?i=rust&theme=light)](https://adamanr.github.io/Handbooks/rust) Rust — 🚧 *в процессе*

Системный язык с гарантией безопасности памяти.

</td></tr>
</table>

---

## ⚡ Быстрый старт

```bash
# Клонировать репозиторий
git clone https://github.com/adamanr/Handbooks.git
cd Handbooks

# Установить зависимости (рекомендуется Bun)
bun install

# Запустить локальный сервер
bun start
```

Сайт откроется на [`http://localhost:3000/Handbooks/`](http://localhost:3000/Handbooks/)

<details>
<summary><strong>Альтернатива: npm</strong></summary>

```bash
npm install
npm start
```
</details>

<details>
<summary><strong>Сборка для продакшена</strong></summary>

```bash
bun run build
bun run serve   # проверить сборку локально
```
</details>

> **Требования:** Node.js ≥ 20, [Bun](https://bun.sh/) (рекомендуется) или npm

---

## 🏗️ Структура проекта

```
Handbooks/
├── docs-go/               # 🦫 Go — basics, deep-dive, instruments, libraries, tasks
├── docs-postgresql/       # 🐘 PostgreSQL — advanced, practice
├── docs-elixir/           # 💧 Elixir — basic, postgresql
├── docs-k8s/              # 📦 Docker & Kubernetes (в разработке)
├── docs-rust/             # 🦀 Rust (в разработке)
├── blog/                  # 📝 База знаний / статьи
├── src/                   # ⚛️  Компоненты, стили, темы
│   ├── components/        #     React-компоненты
│   ├── css/               #     Стили
│   ├── pages/             #     Страницы
│   └── theme/             #     Кастомизация темы
├── static/                # 🖼️  Статические ресурсы
├── .github/workflows/     # 🚀 CI/CD — автодеплой на GitHub Pages
└── docusaurus.config.ts   # ⚙️  Конфигурация сайта
```

---

## 🛠️ Стек технологий

<div align="center">

[![Tech Stack](https://skillicons.dev/icons?i=typescript,react,docusaurus,bun,github)](https://skillicons.dev)

</div>

| Технология | Назначение |
|------------|------------|
| **Docusaurus 3.9** | Фреймворк для документации |
| **React 19** | UI-компоненты |
| **TypeScript 5.9** | Типизация |
| **Bun** | Пакетный менеджер и рантайм |
| **GitHub Pages** | Хостинг |
| **GitHub Actions** | CI/CD — автоматический деплой |
| **Giscus** | Комментарии через GitHub Discussions |
| **Яндекс.Метрика** | Аналитика |

---

## 🤝 Как помочь проекту

Мы рады любым контрибьюшенам! Вот как можно помочь:

1. 🍴 **Форкните** репозиторий
2. 🌿 Создайте ветку (`git checkout -b feature/awesome-improvement`)
3. ✏️ Внесите изменения
4. 📬 Откройте **Pull Request**

**Что можно улучшить:**
- 🐛 Исправить опечатки и ошибки
- 📝 Улучшить или дополнить существующие статьи
- ➕ Добавить новые примеры кода и практические задания
- 📘 Предложить новый хендбук по технологии
- 🎨 Улучшить дизайн и UX

---

## 📬 Контакты

<div align="center">

| | Ссылка |
|---|---|
| 📢 Telegram канал | [@devs_inc](https://t.me/devs_inc) |
| 👤 Автор | [@adamanq](https://t.me/adamanq) |
| 🐛 Issues | [github.com/adamanr/Handbooks/issues](https://github.com/adamanr/Handbooks/issues) |
| 🌐 Сайт | [adamanr.github.io/Handbooks](https://adamanr.github.io/Handbooks/) |

</div>

---

<div align="center">

**MIT License** · Свободное использование с указанием авторства

Сделано с ❤️ для студентов и разработчиков

⭐ Если проект был полезен — поставьте звезду!

</div>
