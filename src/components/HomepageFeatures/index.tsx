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
    link: "go/category/go-основы",
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
];

function Feature({ title, Svg, description, link, shortTitle }: FeatureItem) {
  return (
    <div className={clsx("col col--6")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to={link}>
            Начать изучение {shortTitle}!
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
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
