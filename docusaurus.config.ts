import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import { themes } from "prism-react-renderer";

const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula; // или themes.vsDark, themes.palenight и т.д.
// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Хендбук",
  tagline:
    "Этот справочник предназначен для поддержки изучения актуальных технологических решений на 2026 год. Сейчас основное внимание уделяется трём направлениям: языку программирования Go, СУБД PostgreSQL и языку Elixir.",
  favicon: "img/books.svg",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  url: "https://adamanr.github.io/",
  baseUrl: "/Handbooks/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "adamanr", // Usually your GitHub org/user name.
  projectName: "adamanr.github.io", // Usually your repo name.
  trailingSlash: false,
  onBrokenLinks: "ignore",

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
          blogSidebarCount: "ALL",
          blogSidebarTitle: "Все посты",
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: [
            require.resolve("./src/css/custom.css"),
            require.resolve("./src/css/layout.css"),
            require.resolve("./src/css/overrides.css"),
            require.resolve("./src/css/code-blocks.css"),
          ],
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
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "elixir",
        path: "docs-elixir",
        routeBasePath: "elixir",
        sidebarPath: "./elixirSidebar.ts",
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "k8s",
        path: "docs-k8s",
        routeBasePath: "k8s",
        sidebarPath: "./kubernetesSidebar.ts",
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "rust",
        path: "docs-rust",
        routeBasePath: "rust",
        sidebarPath: "./rustSidebar.ts",
      },
    ],
    [
      "@gracefullight/docusaurus-plugin-yandex-metrica",
      { counterId: 106058654 },
    ],
    [
      "@cmfcmf/docusaurus-search-local",
      {
        language: ["ru", "en"],
      },
    ],
  ],
  themeConfig: {
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
          type: "dropdown",
          label: "🖥️ Языки",
          position: "left",
          items: [
            {
              type: "docSidebar",
              sidebarId: "goSidebar",
              label: "🦫 Go",
              docsPluginId: "go",
            },
          ],
        },
        {
          type: "dropdown",
          label: "📦 Технологии",
          position: "left",
          items: [
            {
              type: "docSidebar",
              sidebarId: "postgresSidebar",
              label: "🐘 PostgreSQL",
              docsPluginId: "postgresql",
            },
          ],
        },
        { to: "/blog", label: "📝 База знаний", position: "right" },
        {
          href: "https://github.com/Adamanr/Handbooks/issues",
          label: "🐛 Нашли ошибку?",
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
              to: "/go/category/basics",
            },
            {
              label: "PostgreSQL",
              to: "/postgresql/category/postgresql-основы",
            },
            {
              label: "Elixir",
              to: "/elixir/category/elixir-основы",
            },
            {
              label: "Контейнеризация",
              to: "/k8s/into",
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
            {
              label: "Telegram канал",
              href: "https://t.me/digital_tent",
            },
            {
              label: "Telegram автора",
              href: "https://t.me/adamanq",
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
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
      additionalLanguages: ["bash", "shell-session"], // если используешь shell-session
    },
    clientModules: [require.resolve("./src/clientModules/giscusReload.ts")],
  } satisfies Preset.ThemeConfig,
};

export default config;
