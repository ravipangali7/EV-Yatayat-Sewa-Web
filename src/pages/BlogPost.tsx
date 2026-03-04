import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { websitePublicApi } from '@/modules/website/services/websiteApi';
import { RichTextDisplay } from '@/components/common/RichTextDisplay';
import type { Blog } from '@/modules/website/types';

const MEDIA_BASE = 'https://system.evyatayatsewa.com';

function imgUrl(path: string | null): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${MEDIA_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const postRes = await websitePublicApi.blogBySlug(slug);
        setPost(postRes);
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

  if (!post) {
    return (
      <div className="section-padding container text-center">
        <h1 className="text-2xl font-display font-bold">Blog post not found</h1>
        <Link to="/blog" className="text-primary mt-4 inline-block hover:underline">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <section className="bg-secondary text-secondary-foreground py-20">
        <div className="container max-w-3xl">
          <Link
            to="/blog"
            className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100 mb-4 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold">{post.name}</h1>
          <div className="flex items-center gap-2 mt-4 text-sm opacity-70">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding">
        <div className="container max-w-3xl">
          {post.image && (
            <img
              src={imgUrl(post.image)}
              alt={post.name}
              className="w-full max-h-96 object-cover rounded-xl shadow-md mb-8"
            />
          )}
          <RichTextDisplay html={post.content} />
        </div>
      </section>
    </div>
  );
}
