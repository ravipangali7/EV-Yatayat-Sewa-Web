import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { PublicHeader } from '@/components/website/PublicHeader';
import { PublicFooter } from '@/components/website/PublicFooter';
import { websitePublicApi } from '@/modules/website/services/websiteApi';
import type { SiteSetting, CMSPage } from '@/modules/website/types';

export default function WebsiteLayout() {
  const [siteSetting, setSiteSetting] = useState<SiteSetting | null>(null);
  const [headerPages, setHeaderPages] = useState<CMSPage[]>([]);
  const [aboutSlug, setAboutSlug] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [settingRes, headerRes, aboutRes] = await Promise.all([
          websitePublicApi.siteSetting(),
          websitePublicApi.cmsHeader(),
          websitePublicApi.cmsAbout(),
        ]);
        setSiteSetting(
          settingRes && Object.keys(settingRes).length > 0 ? (settingRes as SiteSetting) : null,
        );
        setHeaderPages(Array.isArray(headerRes) ? headerRes : []);
        setAboutSlug(
          aboutRes && typeof aboutRes === 'object' && 'slug' in aboutRes
            ? (aboutRes as CMSPage).slug
            : null,
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return (
    <div className="website-theme min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader siteSetting={siteSetting} headerPages={headerPages} aboutSlug={aboutSlug} />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter siteSetting={siteSetting} aboutSlug={aboutSlug} />
    </div>
  );
}
