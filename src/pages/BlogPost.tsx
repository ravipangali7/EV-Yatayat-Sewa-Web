import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import { websitePublicApi } from "@/modules/website/services/websiteApi";
import type { Blog } from "@/modules/website/types";

const MEDIA_BASE = "https://system.evyatayatsewa.com";
function imgUrl(path: string | null): string {
  if (!path) return "";
  return path.startsWith("http") ? path : `${MEDIA_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function BlogPost() {
  const { slug } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      return;
    }
    setBlog(null);
    setNotFound(false);
    websitePublicApi
      .blogBySlug(slug)
      .then((res) => {
        if (res && typeof res === "object" && "id" in res) {
          setBlog(res as Blog);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return (
      <div className="section-padding-lg container text-center">
        <h1 className="text-2xl font-display font-bold">Blog not found</h1>
        <Link to="/blogs" className="mt-4 inline-flex items-center rounded-full px-6 py-2.5 text-primary font-medium hover:bg-primary/10 transition-colors">← Back to Blogs</Link>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="section-padding-lg container text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const dateStr = blog.created_at ? new Date(blog.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

  return (
    <div>
      <section className="relative min-h-[280px] flex items-end py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(210_55%_18%)] to-[hsl(210_55%_12%)]" />
        <div className="relative z-10 container max-w-3xl px-4 text-primary-foreground w-full">
          <Link to="/blogs" className="inline-flex items-center gap-2 text-sm opacity-90 hover:opacity-100 mb-4 transition-opacity">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          <h1 className="text-3xl md:text-4xl font-display font-bold">{blog.name}</h1>
          <div className="flex items-center gap-4 mt-4 text-sm opacity-80">
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {dateStr}</span>
            <span className="flex items-center gap-1"><Tag className="h-4 w-4" /> Blog</span>
          </div>
        </div>
      </section>
      <section className="section-padding-lg">
        <div className="container max-w-3xl">
          {blog.image && (
            <img src={imgUrl(blog.image)} alt={blog.name} className="w-full rounded-2xl mb-8 object-cover max-h-80 shadow-card border border-border/30" />
          )}
          <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: blog.content || "" }} />
        </div>
      </section>
    </div>
  );
}
