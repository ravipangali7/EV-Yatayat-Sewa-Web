import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { websitePublicApi } from '@/modules/website/services/websiteApi';
import { PublicHeader } from '@/components/website/PublicHeader';
import { PublicFooter } from '@/components/website/PublicFooter';
import type { Blog, CMSPage, SiteSetting } from '@/modules/website/types';

const MEDIA_BASE = 'https://system.evyatayatsewa.com';

function imgUrl(path: string | null): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${MEDIA_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function BlogList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [siteSetting, setSiteSetting] = useState<SiteSetting | null>(null);
  const [headerPages, setHeaderPages] = useState<CMSPage[]>([]);
  const [aboutSlug, setAboutSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [blogsRes, settingRes, headerRes, aboutRes] = await Promise.all([
          websitePublicApi.blogs(),
          websitePublicApi.siteSetting(),
          websitePublicApi.cmsHeader(),
          websitePublicApi.cmsAbout(),
        ]);
        setBlogs(Array.isArray(blogsRes) ? blogsRes : []);
        setSiteSetting(settingRes && Object.keys(settingRes).length > 0 ? (settingRes as SiteSetting) : null);
        setHeaderPages(Array.isArray(headerRes) ? headerRes : []);
        setAboutSlug(aboutRes && typeof aboutRes === 'object' && 'slug' in aboutRes ? (aboutRes as CMSPage).slug : null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader siteSetting={siteSetting} headerPages={headerPages} aboutSlug={aboutSlug} />

      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-primary mb-10">Blog</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((b) => (
            <Link
              key={b.id}
              to={`/blog/${b.slug}`}
              className="bg-card rounded-xl overflow-hidden border border-primary/20 shadow-md hover:border-primary/40 hover:shadow-lg transition-all block"
            >
              {b.image && (
                <img src={imgUrl(b.image)} alt={b.name} className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <h2 className="font-semibold text-foreground">{b.name}</h2>
              </div>
            </Link>
          ))}
        </div>
        {blogs.length === 0 && (
          <p className="text-muted-foreground text-center py-12">No posts yet.</p>
        )}
      </main>

      <PublicFooter siteSetting={siteSetting} aboutSlug={aboutSlug} />
    </div>
  );
}
