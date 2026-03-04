import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { websitePublicApi } from '@/modules/website/services/websiteApi';
import { PublicHeader } from '@/components/website/PublicHeader';
import { PublicFooter } from '@/components/website/PublicFooter';
import { RichTextDisplay } from '@/components/common/RichTextDisplay';
import type { CMSPage, SiteSetting } from '@/modules/website/types';

const MEDIA_BASE = 'https://system.evyatayatsewa.com';

function imgUrl(path: string | null): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${MEDIA_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function PageBySlug() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<CMSPage | null>(null);
  const [siteSetting, setSiteSetting] = useState<SiteSetting | null>(null);
  const [headerPages, setHeaderPages] = useState<CMSPage[]>([]);
  const [aboutSlug, setAboutSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const [pageRes, settingRes, headerRes, aboutRes] = await Promise.all([
          websitePublicApi.cmsBySlug(slug),
          websitePublicApi.siteSetting(),
          websitePublicApi.cmsHeader(),
          websitePublicApi.cmsAbout(),
        ]);
        setPage(pageRes);
        setSiteSetting(settingRes && Object.keys(settingRes).length > 0 ? (settingRes as SiteSetting) : null);
        setHeaderPages(Array.isArray(headerRes) ? headerRes : []);
        setAboutSlug(aboutRes && typeof aboutRes === 'object' && 'slug' in aboutRes ? (aboutRes as CMSPage).slug : null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Page not found.</p>
      </div>
    );
  }

  const childSections = page.child_sections ?? [];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader siteSetting={siteSetting} headerPages={headerPages} aboutSlug={aboutSlug} />

      <main className="container mx-auto px-4 py-12 max-w-4xl bg-primary/[0.02] min-h-[60vh]">
        <h1 className="text-3xl font-bold text-primary mb-6">{page.title}</h1>
        {page.image && (
          <img src={imgUrl(page.image)} alt={page.title} className="w-full max-h-80 object-cover rounded-xl shadow-md border border-primary/10 mb-6" />
        )}
        <RichTextDisplay html={page.content} />

        {childSections.length > 0 && (
          <div className="mt-12 space-y-12">
            {childSections.map((child) => (
              <div key={child.id} className="border-t border-primary/20 pt-8">
                <h2 className="text-2xl font-bold text-primary mb-4">{child.title}</h2>
                {child.image && (
                  <img src={imgUrl(child.image)} alt={child.title} className="w-full max-h-64 object-cover rounded-xl shadow-md border border-primary/10 mb-4" />
                )}
                <RichTextDisplay html={child.content} />
              </div>
            ))}
          </div>
        )}
      </main>

      <PublicFooter siteSetting={siteSetting} aboutSlug={aboutSlug} />
    </div>
  );
}
