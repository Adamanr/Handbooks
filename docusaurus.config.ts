import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Хендбук",
  tagline:
    "Этот справочник предназначен для поддержки изучения актуальных технологических решений на 2026 год. Сейчас основное внимание уделяется двум направлениям: языку программирования Go и СУБД PostgreSQL, однако в будущем количество направлений будет расширено.",
  favicon: "img/books.svg",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: "https://adamanr.github.io/",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/Handbooks/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "adamanr", // Usually your GitHub org/user name.
  projectName: "adamanr.github.io", // Usually your repo name.
  trailingSlash: false,
  onBrokenLinks: "throw",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "ru",
    locales: ["ru"],
    localeConfigs: {
      ru: {
        label: "Русский",
        direction: "ltr",
        htmlLang: "ru-RU",
      },
    },
  },

  presets: [
    [
      "classic",
      {
        docs: {
          id: "go",
          path: "docs-go",
          routeBasePath: "go",
          sidebarPath: "./goSidebar.ts",
        },

        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          // Useful options to enforce blogging best practices
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],
  plugins: [
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "postgresql",
        path: "docs-postgresql",
        routeBasePath: "postgresql",
        sidebarPath: "./postgresSidebar.ts",
      },
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/books.svg",
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Хендбук",
      logo: {
        alt: "Handbooks logo",
        src: "img/books.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "goSidebar",
          position: "left",
          label: "Go",
          docsPluginId: "go",
        },
        {
          type: "docSidebar",
          sidebarId: "postgresSidebar",
          position: "left",
          label: "PostgreSQL",
          docsPluginId: "postgresql",
        },
        { to: "/blog", label: "Блог", position: "right" },
        {
          href: "https://github.com/Adamanr/Handbooks/issues",
          label: "Нашли ошибку?",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Курсы",
          items: [
            {
              label: "Go",
              to: "/go/category/go-основы",
            },
            {
              label: "PostgreSQL",
              to: "/postgresql/category/postgresql-основы",
            },
          ],
        },
        {
          title: "Ссылки проекта",
          items: [
            {
              label: "GitHub Проекта",
              href: "https://github.com/Adamanr/Handbooks",
            },
            {
              label: "GitHub Автора",
              href: "https://github.com/Adamanr",
            },
          ],
        },
        {
          title: "Дополнительные ссылки",
          items: [
            {
              label: "Блог ",
              to: "/blog",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Handbooks, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
