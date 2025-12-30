import React from "react";
import Giscus from "@giscus/react";
import { useColorMode } from "@docusaurus/theme-common";
import { useBlogPost } from "@docusaurus/plugin-content-blog/client";

export default function GiscusComponent() {
  const { colorMode } = useColorMode();

  return (
    <div>
      <br />
      <br />
      <Giscus
        id="comments"
        repo="Adamanr/Handbooks" // Замени на свой
        repoId="R_kgDOQvJpvA" // Из giscus.app
        category="General" // Имя категории
        categoryId="DIC_kwDOQvJpvM4C0Y3_" // Из giscus.app
        mapping="title" // Или то, что выбрал
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top" // Или bottom
        theme={colorMode === "dark" ? "dark" : "light"} // Или 'preferred_color_scheme'
        lang="ru" // Или en
        loading="lazy"
      />
      <br />
      <br />
    </div>
  );
}
