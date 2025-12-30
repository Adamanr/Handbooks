// src/clientModules/giscusReload.ts
import { useEffect } from "react";
import { useLocation } from "@docusaurus/router";

export default function GiscusReload() {
  const location = useLocation();

  useEffect(() => {
    const iframe = document.querySelector(
      "iframe.giscus-frame",
    ) as HTMLIFrameElement;
    if (!iframe) return;

    // Отправляем сообщение для reload
    iframe.contentWindow?.postMessage(
      { giscus: { setConfig: { term: location.pathname } } },
      "https://giscus.app",
    );
  }, [location.pathname]); // Срабатывает при смене пути

  return null;
}
