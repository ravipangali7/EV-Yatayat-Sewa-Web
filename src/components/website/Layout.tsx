import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { API_ORIGIN } from "@/lib/api";
import { websitePublicApi } from "@/modules/website/services/websiteApi";
import type { SiteSetting } from "@/modules/website/types";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

const DEFAULT_FAVICON = "/logo.png";

function resolveApiFavicon(favicon: string) {
  return favicon.startsWith("http")
    ? favicon
    : `${API_ORIGIN}${favicon.startsWith("/") ? "" : "/"}${favicon}`;
}

function applyFavicon(href: string) {
  const links = document.querySelectorAll<HTMLLinkElement>("link[rel='icon']");
  if (links.length === 0) {
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = href;
    document.head.appendChild(link);
  } else {
    links.forEach((link) => {
      link.type = "image/png";
      link.href = href;
    });
  }
  let apple = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
  if (!apple) {
    apple = document.createElement("link");
    apple.rel = "apple-touch-icon";
    document.head.appendChild(apple);
  }
  apple.href = href;
}

export default function WebsiteLayout() {
  useEffect(() => {
    applyFavicon(DEFAULT_FAVICON);

    let cancelled = false;
    websitePublicApi
      .siteSetting()
      .then((raw) => {
        if (cancelled) return;
        if (!raw || Object.keys(raw).length === 0) return;
        const s = raw as SiteSetting;
        const apiFavicon = (s.favicon && s.favicon.trim()) || null;
        if (!apiFavicon) return;
        applyFavicon(resolveApiFavicon(apiFavicon));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full max-w-full min-w-0 overflow-x-hidden">
      <PublicHeader />
      <main className="flex-1 w-full max-w-full min-w-0">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
