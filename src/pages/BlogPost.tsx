import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { websitePublicApi } from '@/modules/website/services/websiteApi';
import { PublicHeader } from '@/components/website/PublicHeader';
import { PublicFooter } from '@/components/website/PublicFooter';
import { RichTextDisplay } from '@/components/common/RichTextDisplay';
import type { Blog, CMSPage, SiteSetting } from '@/modules/website/types';

const MEDIA_BASE = 'https://system.evyatayatsewa.com';

function imgUrl(path: string | null): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${MEDIA_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Blog | null>(null);
  const [siteSetting, setSiteSetting] = useState<SiteSetting | null>(null);
  const [headerPages, setHeaderPages] = useState<CMSPage[]>([]);
  const [aboutSlug, setAboutSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const [postRes, settingRes, headerRes, aboutRes] = await Promise.all([
          websitePublicApi.blogBySlug(slug),
          websitePublicApi.siteSetting(),
          websitePublicApi.cmsHeader(),
          websitePublicApi.cmsAbout(),
        ]);
        setPost(postRes);
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

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Post not found.</p>
        <Link to="/blog" className="ml-2 text-primary">Back to Blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader siteSetting={siteSetting} headerPages={headerPages} aboutSlug={aboutSlug} />

      <article className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary mb-6 inline-block">← Back to Blog</Link>
        <h1 className="text-3xl font-bold text-foreground mb-6">{post.name}</h1>
        {post.image && (
          <img src={imgUrl(post.image)} alt={post.name} className="w-full max-h-96 object-cover rounded-lg mb-6" />
        )}
        <RichTextDisplay html={post.content} />
      </article>

      <PublicFooter siteSetting={siteSetting} />
    </div>
  );
}
