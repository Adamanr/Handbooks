import React from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import { Image } from "lucide-react";

import styles from "./index.module.css";

function HeroSection() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <header className={clsx("hero hero--primary", styles.hero)}>
      <div className={clsx("container", styles.heroContainer)}>
        <div className={styles.heroContent}>
          <Heading as="h1" className={styles.heroTitle}>
            {siteConfig.title}
          </Heading>

          <p className={styles.heroSubtitle}>{siteConfig.tagline}</p>

          <div className={styles.heroButtons}>
            <Link
              className={clsx(
                "button button--secondary button--lg",
                styles.primaryButton,
              )}
              to="/go"
            >
              Начать обучение →
            </Link>
            <Link
              className={clsx(
                "button button--outline button--lg",
                styles.secondaryButton,
              )}
              to="/blog"
            >
              Открыть базу знаний
            </Link>
          </div>
        </div>

        {/* Декоративный элемент справа (можно заменить на иллюстрацию/3d-объект) */}
        <div className={styles.heroDecoration}>
          <img
            src="https://i.pinimg.com/1200x/e3/3a/1f/e33a1fd04b1532c31101626d8144e522.jpg"
            alt="Иллюстрация разработчика"
            className={styles.heroImage}
          />
          <div className={styles.gradientOrb} />
        </div>
      </div>
    </header>
  );
}

function FeatureSection() {
  return (
    <section className={styles.featuresSection}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Наши ключевые курсы
        </Heading>

        <div className={styles.featureGrid}>
          {/* Go */}
          <div className={clsx(styles.featureCard, styles.cardGo)}>
            <div className={styles.cardIcon}>🐹</div>
            <h3>Go — от новичка до senior</h3>
            <p>
              Глубокое погружение: concurrency, GC, runtime, performance,
              микросервисы, современные паттерны.
            </p>
            <Link to="/go/" className={styles.cardLink}>
              Начать курс →
            </Link>
          </div>

          {/* PostgreSQL */}
          <div className={clsx(styles.featureCard, styles.cardPg)}>
            <div className={styles.cardIcon}>🐘</div>
            <h3>PostgreSQL — профи-уровень</h3>
            <p>
              Оптимизация запросов, индексы, partitioning, транзакции, JSONB,
              расширения, мониторинг и надёжность.
            </p>
            <Link to="/postgresql/advanced" className={styles.cardLink}>
              Начать курс →
            </Link>
          </div>

          {/* Можно добавить placeholder для будущих курсов */}
          <div className={clsx(styles.featureCard, styles.cardComing)}>
            <div className={styles.cardIcon}>🚀</div>
            <h3>Скоро новый курс</h3>
            <p>Что-то очень интересное уже в разработке…</p>
            <div className={styles.comingSoon}>Скоро!</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      title={siteConfig.title}
      description="Практичные и глубокие курсы по современным технологиям: Go, PostgreSQL и не только"
    >
      <HeroSection />
      <main>
        <FeatureSection />

        {/* Можно добавить ещё секции: */}
        {/* <WhyUsSection /> */}
        {/* <Testimonials /> */}
        {/* <CTA /> */}
      </main>
    </Layout>
  );
}
