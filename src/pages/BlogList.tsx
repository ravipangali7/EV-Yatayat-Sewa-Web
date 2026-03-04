import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bus } from 'lucide-react';
import { websitePublicApi } from '@/modules/website/services/websiteApi';
import type { Blog } from '@/modules/website/types';

const MEDIA_BASE = 'https://system.evyatayatsewa.com';

function imgUrl(path: string | null): string {
  if (!path) return '';
  return path.startsWith('http') ? path : `${MEDIA_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function BlogList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const blogsRes = await websitePublicApi.blogs();
        setBlogs(Array.isArray(blogsRes) ? blogsRes : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <section className="bg-secondary text-secondary-foreground py-20 text-center">
        <h1 className="text-4xl font-display font-bold">Blog</h1>
        <p className="mt-2 opacity-80">Latest news and updates</p>
      </section>

      {/* Blog grid */}
      <section className="section-padding">
        <div className="container">
          {blogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">No posts yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((b) => (
                <Link
                  key={b.id}
                  to={`/blog/${b.slug}`}
                  className="bg-card rounded-xl overflow-hidden border hover:shadow-lg transition group"
                >
                  {b.image ? (
                    <img
                      src={imgUrl(b.image)}
                      alt={b.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-48 gradient-primary flex items-center justify-center">
                      <Bus className="h-16 w-16 text-primary-foreground opacity-30" />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition line-clamp-2">
                      {b.name}
                    </h3>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-muted-foreground">
                        {new Date(b.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-primary text-sm font-medium flex items-center gap-1">
                        Read <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
