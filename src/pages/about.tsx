import React from "react";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import clsx from "clsx";

export default function AboutPage() {
  return (
    <Layout
      title="Обо мне — Артём Молчанов"
      description="Backend-разработчик на Go с опытом в микросервисах, высоконагруженных системах и DevOps. Пет-проекты, блог и хендбуки по Go и PostgreSQL."
    >
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center gap-12 mb-16">
          <div className="flex-shrink-0">
            <img
              src="https://thumbs.dreamstime.com/b/happy-man-portrait-web-designer-brainstorming-board-mobile-app-software-development-male-person-developer-smile-ui-416045730.jpg"
              alt="Артём Молчанов"
              className="w-64 h-64 rounded-full object-cover shadow-2xl border-4 border-blue-500"
              width={400}
              height={400}
            />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-bold mb-4">Молчанов Артём Павлович</h1>
            <p className="text-2xl text-primary mb-6">
              Golang Backend Developer
            </p>
            <div className="space-y-2 text-lg">
              <p>
                <strong>Телефон:</strong> +7 (908) 936-47-17
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a href="mailto:adamanrcyq@yandex.ru">adamanrcyq@yandex.ru</a>{" "}
                (предпочитаемый)
              </p>
              <p>
                <strong>Telegram:</strong>{" "}
                <Link href="https://t.me/Adamanq">@Adamanq</Link>
              </p>
              <p>
                <strong>GitHub:</strong>{" "}
                <Link href="https://github.com/Adamanr">
                  github.com/Adamanr
                </Link>
              </p>
              <p>
                <strong>Проживание:</strong> Челябинск, Россия • Готов к
                переезду и редким командировкам
              </p>
            </div>
          </div>
        </div>

        {/* About Me */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Обо мне</h2>
          <p className="text-lg leading-relaxed">
            Backend-разработчик с более чем 3 годами опыта в Go. Специализируюсь
            на микросервисной архитектуре, высоконагруженных системах,
            интеграциях и DevOps. Работал в телекоме (МТС), блокчейн-проектах и
            IoT. Активно изучаю новые технологии: Python (FastAPI/Django),
            Elixir/Phoenix, Kubernetes, Kafka. Веду технический блог и создаю
            хендбуки по Go и PostgreSQL для сообщества.
          </p>
          <p className="text-lg leading-relaxed mt-4">
            Готов быстро осваивать новые стеки и создавать надёжные,
            масштабируемые решения.
          </p>
        </section>

        {/* Tech Stack */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Технологический стек
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-8 items-center justify-center">
            <img
              src="https://www.clipartmax.com/png/middle/353-3536792_go-golang-logo-png.png"
              alt="Go"
              className="w-24 h-24 object-contain"
            />
            <img
              src="https://1000logos.net/wp-content/uploads/2020/08/PostgreSQL-Logo.jpg"
              alt="PostgreSQL"
              className="w-24 h-24 object-contain"
            />
            <img
              src="https://www.docker.com/app/uploads/2023/08/logo-guide-logos-1.svg"
              alt="Docker"
              className="w-24 h-24 object-contain"
            />
            <img
              src="https://img.favpng.com/8/2/15/logo-kubernetes-transparency-font-computer-software-png-favpng-N5cKXM5NXZne17a1r4j8fvfh7.jpg"
              alt="Kubernetes"
              className="w-24 h-24 object-contain"
            />
            <img
              src="https://e7.pngegg.com/pngimages/66/424/png-clipart-redis-distributed-cache-database-caching-wrapper-angle-logo.png"
              alt="Redis"
              className="w-24 h-24 object-contain"
            />
            <div className="text-center">
              <p className="font-semibold">gRPC</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">Kafka</p>
            </div>
          </div>
        </section>

        {/* Experience Timeline */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Опыт работы</h2>
          <div className="space-y-12">
            {/* Пет-проекты */}
            <div className="border-l-4 border-blue-500 pl-8">
              <h3 className="text-2xl font-semibold">Пет-проекты и обучение</h3>
              <p className="text-gray-600">
                Май 2024 — настоящее время (1 год 8 месяцев)
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2">
                <li>
                  Изучение Python (FastAPI, Django), Elixir/Phoenix,
                  инфраструктуры (K8s, Kafka)
                </li>
                <li>
                  Создание Telegram-ботов, AI-интеграций, социальной платформы
                  (аналог dev.to)
                </li>
                <li>Ведение технического блога и хендбуков по Go/PostgreSQL</li>
                <li>Поддержка активного GitHub с примерами кода</li>
              </ul>
            </div>

            {/* МТС */}
            <div className="border-l-4 border-blue-500 pl-8">
              <h3 className="text-2xl font-semibold">
                МТС — Golang-разработчик
              </h3>
              <p className="text-gray-600">
                Сентябрь 2023 — Май 2024 (9 месяцев)
              </p>
              <p className="mt-2">
                Внутренняя микросервисная система документооборота
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2">
                <li>
                  Оптимизация многопоточного кода → сокращение задержек на 25%
                </li>
                <li>Внедрение gRPC, Redis, оптимизация PostgreSQL</li>
                <li>Docker + Kubernetes, мониторинг Prometheus/Grafana</li>
                <li>Покрытие тестами 70%</li>
              </ul>
            </div>

            {/* Другие компании — кратко */}
            <div className="border-l-4 border-blue-500 pl-8">
              <h3 className="text-2xl font-semibold">
                АО Национальные квалификации — Golang-разработчик
              </h3>
              <p className="text-gray-600">
                Декабрь 2022 — Май 2023 (6 месяцев)
              </p>
              <p>Блокчейн-система учёта выездных учений МЧС</p>
            </div>

            <div className="border-l-4 border-blue-500 pl-8">
              <h3 className="text-2xl font-semibold">
                ООО НПО Панцирь — Golang-разработчик
              </h3>
              <p className="text-gray-600">
                Сентябрь 2021 — Сентябрь 2022 (1 год)
              </p>
              <p>
                Embedded-системы управления IP-камерами и охранными устройствами
              </p>
            </div>
          </div>
        </section>

        {/* Education & Languages */}
        <section className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-6">Образование</h2>
            <p className="text-lg">
              Челябинский энергетический колледж им. С.М. Кирова
            </p>
            <p className="text-gray-600">
              Информационные системы и программирование, 2023
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-6">Языки</h2>
            <ul className="space-y-2 text-lg">
              <li>Русский — Родной</li>
              <li>Английский — B1 (Intermediate)</li>
              <li>Японский — A1 (Начальный)</li>
            </ul>
          </div>
        </section>

        <div className="text-center mt-16">
          <Link
            to="/blog"
            className="inline-block px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Перейти в блог и хендбуки →
          </Link>
        </div>
      </main>
    </Layout>
  );
}
