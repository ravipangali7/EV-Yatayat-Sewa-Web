import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { API_ORIGIN } from "@/lib/api";
import { websitePublicApi } from "@/modules/website/services/websiteApi";
import type { SiteSetting } from "@/modules/website/types";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

function faviconHref(favicon: string | null | undefined, logo: string | null | undefined) {
  const path = favicon || logo;
  if (!path) return null;
  return path.startsWith("http") ? path : `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function WebsiteLayout() {
  useEffect(() => {
    let cancelled = false;
    websitePublicApi
      .siteSetting()
      .then((raw) => {
        if (cancelled || !raw || Object.keys(raw).length === 0) return;
        const s = raw as SiteSetting;
        const href = faviconHref(s.favicon, s.logo);
        if (!href) return;
        let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.type = "image/png";
        link.href = href;
        let apple = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']");
        if (!apple) {
          apple = document.createElement("link");
          apple.rel = "apple-touch-icon";
          document.head.appendChild(apple);
        }
        apple.href = href;
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
