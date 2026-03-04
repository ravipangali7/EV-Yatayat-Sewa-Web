import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { websitePublicApi } from '@/modules/website/services/websiteApi';
import { RichTextDisplay } from '@/components/common/RichTextDisplay';
import type { CMSPage } from '@/modules/website/types';

const MEDIA_BASE = 'https://system.evyatayatsewa.com';

function imgUrl(path: string | null): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${MEDIA_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function PageBySlug() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<CMSPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const pageRes = await websitePublicApi.cmsBySlug(slug);
        setPage(pageRes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="section-padding container text-center">
        <h1 className="text-2xl font-display font-bold">Page not found.</h1>
      </div>
    );
  }

  const childSections = page.child_sections ?? [];

  return (
    <div>
      {/* Page header banner */}
      <section className="relative h-64 flex items-center justify-center overflow-hidden">
        {page.image ? (
          <img
            src={imgUrl(page.image)}
            alt={page.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-secondary" />
        )}
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative z-10 text-center text-primary-foreground px-4">
          <h1 className="text-4xl font-display font-bold">{page.title}</h1>
        </div>
      </section>

      {/* Page content */}
      <section className="section-padding">
        <div className="container max-w-4xl">
          <RichTextDisplay html={page.content} />

          {childSections.length > 0 && (
            <div className="mt-12 space-y-12">
              {childSections.map((child) => (
                <div key={child.id} className="border-t border-border pt-10">
                  <h2 className="text-2xl font-display font-bold text-primary mb-4">
                    {child.title}
                  </h2>
                  {child.image && (
                    <img
                      src={imgUrl(child.image)}
                      alt={child.title}
                      className="w-full max-h-64 object-cover rounded-xl shadow-md mb-6"
                    />
                  )}
                  <RichTextDisplay html={child.content} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
