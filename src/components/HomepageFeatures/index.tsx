import type { ReactNode } from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";
import Link from "@docusaurus/Link";

type FeatureItem = {
  title: string;
  shortTitle: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: ReactNode;
  link: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Курс по Go",
    shortTitle: "Go",
    Svg: require("@site/static/img/gofer.svg").default,
    description: (
      <>
        Курс по языку Go охватывает как базовые элементы синтаксиса, так и
        углубленные темы вроде сборщика мусора, планировщика потоков выполнения
        и другие сложные концепции. Этот курс будет полезен всем желающим
        освоить востребованный язык программирования Go.
      </>
    ),
    link: "go/",
  },
  {
    title: "Курс по PostgreSQL",
    shortTitle: "PostgreSQL",
    Svg: require("@site/static/img/postgresql.svg").default,
    description: (
      <>
        Курс посвящен изучению основ работы с PostgreSQL, правильному
        составлению запросов, методам их оптимизации и профессиональному подходу
        к работе с базами данных. Мы рассмотрим такие важные темы, как
        оптимизация производительности, управление транзакциями и многое другое!
      </>
    ),
    link: "postgresql/category/postgresql-основы",
  },
  {
    title: "Курс по Elixir",
    shortTitle: "Elixir",
    Svg: require("@site/static/img/elixir.svg").default,
    description: (
      <>
        Курс посвящен изучению основ языка программирования Elixir, правильному
        написанию функционального кода, принципам параллелизма и
        профессиональному подходу к созданию масштабируемых приложений. Мы
        рассмотрим такие важные темы, как работа с параллелизмом и
        конкурентностью, управление процессами OTP, отказоустойчивость и многое
        другое!
      </>
    ),
    link: "elixir/category/elixir-основы",
  },
  {
    title: "Курс по контейнеризации",
    shortTitle: "k8s",
    Svg: require("@site/static/img/kubernetes.svg").default,
    description: (
      <>
        Курс посвящен изучению современных технологий контейнеризации,
        правильному созданию и управлению контейнерами, оркестрации приложений и
        профессиональному подходу к построению надёжных, масштабируемых и
        переносимых систем. Мы рассмотрим такие важные темы, как работа с Docker
        и Podman, создание образов, управление контейнерами, основы Kubernetes
        (k8s), развертывание приложений в кластере, управление конфигурациями и
        секретами, мониторинг, масштабирование и многое другое!
      </>
    ),
    link: "k8s/into",
  },
];

function Feature({ title, Svg, description, link, shortTitle }: FeatureItem) {
  return (
    <div className={clsx("col", styles.featureCard)}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading className={styles.mY2} as="h3">
          {title}
        </Heading>
        <p>{description}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to={link}>
            Изучить {shortTitle}!
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div
          className={clsx(
            styles.grid,
            styles.gridCols2,
            styles.gapX8,
            styles.gapY8,
          )}
        >
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
