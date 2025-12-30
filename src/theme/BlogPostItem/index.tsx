import React from "react";
import OriginalBlogPostItem from "@theme-original/BlogPostItem"; // Для Docusaurus 3.x может быть @docusaurus/plugin-content-blog/client
import GiscusComponent from "@site/src/components/GiscusComponents/GiscusComponent";
import { useBlogPost } from "@docusaurus/plugin-content-blog/client";
import { useColorMode } from "@docusaurus/theme-common";

export default function BlogPostItem(props) {
  const { metadata, isBlogPostPage } = useBlogPost();
  if (!isBlogPostPage) {
    return <OriginalBlogPostItem {...props} />;
  }

  return (
    <>
      <OriginalBlogPostItem {...props} />
      <GiscusComponent />
    </>
  );
}
